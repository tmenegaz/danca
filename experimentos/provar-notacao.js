'use strict';

/*
 * provar-notacao.js — o registro de notação compõe-se, e recusa quando não pode.
 *
 * O DEFEITO (20/10/2026). A `-notacao.md` saía com `[Preencher: notação do exercício]` em TODAS as
 * linhas, e o glossário saía com três convenções (`[`, `]`, `:`) e um pedido para preencher os
 * verbetes à mão. O que faltava não era um gerador de texto — era o ALFABETO: sem ele não há
 * sinal, e sem sinal a linha não se escreve.
 *
 * O QUE ESTA PROVA FIXA, e a segunda parte é a que importa:
 *
 *   A. O ALFABETO é DADO. Carrega, casa com a notação declarada, e não casa com outra. Todos os
 *      sinais que os verbetes usam existem no alfabeto, e todos os blocos têm a forma que o
 *      validador do glossário exige.
 *   B. A COMPOSIÇÃO é determinística e a GRADE FECHA. A mesma música dá os mesmos segmentos; a
 *      música que não fecha em compassos inteiros NÃO é arredondada — é declarada.
 *   C. A RECUSA. Um exercício sem verbete, uma música não coberta, um sinal que o alfabeto não
 *      conhece, um verbete internamente inconsistente — os quatro caem em lacuna DECLARADA, com o
 *      motivo escrito. É o controlo negativo: o que separa um motor de um gerador plausível é o
 *      que ele se recusa a escrever.
 *   D. O PAR (P-15/P-16), medido pelo VALIDADOR DO PROJETO. `tools/check-glossario.js` — escrito à
 *      mão muito antes disto, e que já reprovou documentos deste repositório — corre sobre o par
 *      gerado e tem de sair limpo. Nenhum símbolo do corpo sem verbete, nenhum verbete fora do
 *      índice, nenhuma âncora repetida.
 *   E. A DEGRADAÇÃO. Uma notação sem alfabeto publicado não ganha sinais inventados: sai o
 *      documento de antes, com a lacuna declarada.
 *
 * A NOTAÇÃO NÃO SE ESCREVE NESTA PROVA, LÊ-SE DA ÁRVORE (25/11/2026). O cabeçalho de tudo isto
 * dizia «Benesh», e a árvore migrou para «Código de dança» a 18/11/2026: a prova passou a reprovar
 * em silêncio, porque **não era versionada** e o `correr-provas` só corre o que está no
 * `git ls-files`. Uma prova que não corre não protege ninguém — é a mesma família de erro que o
 * `provar-ambiente` que imprimia «TUDO CERTO — 0 escola(s)».
 *
 * O que mudou aqui, e não é cosmético:
 *
 *   1. **A notação vem de `notacao.NOTACAO_DO_CICLO`**, que é a constante que a derivação usa.
 *      Se ela mudar outra vez, esta prova acompanha sem edição — e se a constante deixar de ter
 *      alfabeto, a prova diz isso na primeira asserção em vez de estourar num `null`.
 *   2. **Os exercícios e as músicas vêm do alfabeto, escolhidos por PROPRIEDADE** (`entradaReal`).
 *      Antes eram literais (`Plié` em `8|4/4`, `Port de bras` em `16|3/4`) — que é o mesmo defeito
 *      que o `devant` desta casa já pagou: um fixture a afirmar uma forma que o dado deixou de ter
 *      reprova no dia em que o dado melhora, que é o dia em que a prova importa.
 *   3. **Onde o alfabeto de hoje não tem a forma** (duas pistas simultâneas, lados declarados, uma
 *      linha parcial), a forma mede-se numa CÓPIA de uma entrada real com a forma acrescentada — e
 *      di-lo. Não é conteúdo inventado: os sinais e as descrições continuam a ser os dela; o que se
 *      acrescenta é a FORMA cujo comportamento se quer medir. Plantar um verbete editorial para
 *      uma asserção voltar a verde é o que este ficheiro já recusou uma vez, e continua a recusar.
 *
 *   node experimentos/provar-notacao.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const notacao = require(path.join(RAIZ, 'motor', 'nucleo', 'notacao.js'));
const derivar = require(path.join(RAIZ, 'motor', 'nucleo', 'derivar-ciclo.js'));

/** A notação que a ÁRVORE usa — a mesma constante que a derivação lê. Nunca um literal. */
const NOTACAO = notacao.NOTACAO_DO_CICLO;
/** A data com que se compõe: fixa, para a prova não depender do dia em que corre. */
const DATA = '2026-11-25';
const alfabetoDaArvore = () => notacao.paraNotacao(NOTACAO);

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

// ---------------------------------------------------------------- as fontes de prova

const CONTEXTO = { escola: 'prova', escolaNome: 'Prova', professor: 'prova', ciclo: '01' };
const r = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });
const linha = (bloco, exercicio, tempos, compasso, objetivo) => ({
  'Bloco': bloco,
  'Objetivo específico': objetivo || '1 — reconhecer o apoio e alinhar o eixo vertical',
  'Conteúdo do nível': exercicio,
  'Tempos': tempos,
  'Compasso': compasso,
});

/**
 * O PLANO DE PROVA. Cobre os quatro desfechos de propósito, e as músicas são as da vida real do
 * ciclo — incluindo a que NÃO fecha (16 tempos em 3/4), que é o caso que o documento tem de
 * declarar em vez de arredondar.
 */
function planoDeProva(notacaoDeclarada) {
  /* AS MÚSICAS SÃO AS QUE O ALFABETO DECLARA (25/11/2026). Aqui estavam `8|4/4` e `16|3/4`, que
   * eram as do alfabeto de Outubro; hoje a entrada de `Plié` é `4|2/4` e não há `Port de bras`. Um
   * fixture com a música errada não mede «o documento declara a lacuna» — mede «o fixture está
   * velho», e escreve a mesma frase nos dois casos. A música do exercício composto vem do dado
   * (`aMusicaDe`), e a que não fecha vem de uma entrada cujo `cobre` é menor do que a música. */
  const composto = entradaReal((e) => e.composta.estado === 'composto');
  const linhaComposta = composto
    ? linha('Solo', composto.exercicio, composto.tempos, composto.compasso)
    : linha('Solo', 'Plié', '4', '2/4');
  return {
    id: 'plano-de-prova',
    fonte: 'plano',
    contexto: CONTEXTO,
    respostas: {
      'contexto-notacao': r(notacaoDeclarada === undefined ? NOTACAO : notacaoDeclarada),
      'objetivo-geral': r('consolidar o eixo e a transferência de peso'),
      'aula-1-sequencia': r([
        linhaComposta,
        linha('Solo', 'Battement tendu', '[a decidir]', '[a decidir]', '3 — sustentar a transferência'),
        // Uma música que NENHUMA entrada cobre: é a linha que o documento declara em lacuna.
        linha('Barra', 'Plié', '16', '3/4', '2 — transferir o peso entre os pés'),
        linha('Centro', 'Pirouette', '8', '4/4', '3 — sustentar a transferência'),
      ]),
    },
  };
}

/**
 * ESCOLHE UMA ENTRADA REAL DO ALFABETO POR PROPRIEDADE (25/11/2026).
 *
 * Devolve `{ exercicio, musica, escola, tempos, compasso, verbete, composta }` para a primeira
 * entrada que satisfaça o predicado — e **compõe-na com a escola a que ela pertence**, que é a
 * parte que faltava: as entradas com sufixo `@escola` só compõem para essa escola, e uma prova que
 * compusesse sem escola declará-las-ia em lacuna por um motivo que não é do motor.
 *
 * Devolve `null` quando a árvore não tem a forma — e quem a chama declara «não medido», em vez de
 * inventar o dado que falta.
 */
function entradaReal(predicado) {
  const alfabeto = alfabetoDaArvore();
  if (!alfabeto || !alfabeto.verbetes) return null;
  for (const exercicio of Object.keys(alfabeto.verbetes)) {
    if (exercicio.startsWith('_')) continue;
    for (const musica of Object.keys(alfabeto.verbetes[exercicio] || {})) {
      const escola = musica.indexOf('@') !== -1 ? musica.split('@')[1] : undefined;
      const [tempos, compasso] = musica.split('@')[0].split('|');
      const composta = notacao.compor(linha('Solo', exercicio, tempos, compasso), alfabeto, DATA, escola);
      const achado = { exercicio, musica, escola, tempos, compasso,
        verbete: alfabeto.verbetes[exercicio][musica], composta };
      if (predicado(achado)) return achado;
    }
  }
  return null;
}

/**
 * O MESMO ESCOLHEDOR, MAS PARA UMA ESCOLA DADA (25/11/2026).
 *
 * `entradaReal` compõe cada entrada com a escola A QUE ELA PERTENCE — é isso que faz uma entrada
 * com sufixo `@breu` compor. Mas o documento é derivado para UMA escola (a do contexto), e a
 * célula que ele mostra tem de ser a que aquela escola usa. Esta variante compõe com a escola
 * pedida, e é a que a secção D usa.
 */
function entradaRealParaEscola(predicado, escola) {
  const alfabeto = alfabetoDaArvore();
  if (!alfabeto || !alfabeto.verbetes) return null;
  for (const exercicio of Object.keys(alfabeto.verbetes)) {
    if (exercicio.startsWith('_')) continue;
    for (const musica of Object.keys(alfabeto.verbetes[exercicio] || {})) {
      const [tempos, compasso] = musica.split('@')[0].split('|');
      const composta = notacao.compor(linha('Solo', exercicio, tempos, compasso), alfabeto, DATA, escola);
      const achado = { exercicio, musica, escola, tempos, compasso,
        verbete: alfabeto.verbetes[exercicio][musica], composta };
      if (predicado(achado)) return achado;
    }
  }
  return null;
}

/** Compõe uma linha contra uma cópia do alfabeto da árvore (para as mutações). */
function comporContra(copia, exercicio, tempos, compasso, escola) {
  return notacao.compor(linha('Solo', exercicio, tempos, compasso), copia, DATA, escola);
}

/** Uma cópia profunda do alfabeto — as mutações nunca tocam no dado carregado. */
const copiaProfunda = (obj) => JSON.parse(JSON.stringify(obj));

// ---------------------------------------------------------------------- A. o alfabeto
function oAlfabeto() {
  console.log('\nA. O ALFABETO é dado, e é o da notação declarada');
  const alfabeto = alfabetoDaArvore();
  checar('a árvore declara uma notação (`NOTACAO_DO_CICLO`) e ela tem alfabeto publicado',
    Boolean(NOTACAO) && Boolean(alfabeto), { notacao: NOTACAO, alfabeto: alfabeto && alfabeto.id });
  checar('e o alfabeto declara id, versão e nome', Boolean(alfabeto && alfabeto.id && alfabeto.versao && alfabeto.nome));
  checar('uma notação sem alfabeto publicado devolve `null` — e não um alfabeto emprestado',
    notacao.paraNotacao('Laban') === null);
  checar('e a ausência de notação também', notacao.paraNotacao('') === null);

  // A COERÊNCIA INTERNA DO DADO. Um verbete que usa um sinal que o alfabeto não declara passaria
  // despercebido até alguém ler o documento — e o documento não se pode ler de volta.
  // Os verbetes vêm com a chave `_comentario` desde 28/10/2026 — o dado explica-se onde se lê.
  const exercicios = Object.keys(alfabeto.verbetes).filter((k) => !k.startsWith('_'));
  const desconhecidos = [];
  for (const [exercicio, musicas] of Object.entries(alfabeto.verbetes)) {
    if (exercicio.startsWith('_')) continue;
    for (const [musica, verbete] of Object.entries(musicas)) {
      // A FORMA NOVA: os blocos vivem nas células, por direção (28/10/2026).
      const segmentos = verbete.celulas
        ? Object.values(verbete.celulas).flat()
        : (verbete.segmentos || []);
      for (const s of segmentos) {
        if (!s.bloco) continue;
        const lido = notacao.lerBloco(s.bloco, alfabeto);
        if (!lido.ok) desconhecidos.push(exercicio + ' ' + musica + ': ' + lido.desconhecidos.join(', '));
      }
    }
  }
  checar('todo sinal usado nos verbetes existe no alfabeto', desconhecidos.length === 0, desconhecidos);
  // «EXATAMENTE QUATRO» DEIXOU DE SER VERDADE NO DIA EM QUE O ALFABETO PASSOU A SER ESCRITO POR
  // QUEM DÁ AULA (31/10/2026). A pesquisadora gravou «Rond de jambe en l'air» pelo formulário da
  // Produção, e o alfabeto passou a ter cinco verbetes — a asserção reprovava um crescimento que é
  // o objectivo do CRUD. O que importa é que os quatro do ciclo continuem declarados; os que
  // vierem depois são acrescento, não substituição.
  /* «OS QUATRO DO CICLO» DEIXOU DE SER UMA LISTA ESCRITA AQUI (25/11/2026).
   *
   * A asserção era `['Plié','Battement tendu','Rond de jambe','Port de bras']` — os quatro do
   * alfabeto de 31/10/2026. Hoje o alfabeto declara `Plié`, `Battement tendu`, `Battement jeté`,
   * `Battement fondu` e `Relevé`, e nenhum `Rond de jambe`: a lista estava a medir a MEMÓRIA de
   * quem a escreveu, e não o dado. O que importa — e é o que o comentário de 31/10/2026 dizia por
   * outras palavras — é que os verbetes que existem não sejam SUBSTITUÍDOS por nada que não
   * componha: um alfabeto cujas entradas não compõem é um arquivo, não um código.
   *
   * Passa a medir-se a propriedade: **cada verbete declarado compõe na música que declara, para a
   * escola a que pertence.** É mais forte do que a lista (vale para os verbetes que ainda não
   * existem) e não envelhece. */
  const naoCompoem = [];
  for (const exercicio of exercicios) {
    for (const musica of Object.keys(alfabeto.verbetes[exercicio] || {})) {
      const escola = musica.indexOf('@') !== -1 ? musica.split('@')[1] : undefined;
      const [tempos, compasso] = musica.split('@')[0].split('|');
      const r = notacao.compor(linha('Solo', exercicio, tempos, compasso), alfabeto, DATA, escola);
      if (r.estado !== 'composto') naoCompoem.push(exercicio + ' ' + musica + ' → ' + r.estado + '/' + r.motivo);
    }
  }
  if (semVerbetesNoAlfabeto()) naoMedido('cada verbete compõe na música que declara',
    'o alfabeto está sem verbetes — ela apagou-os em 02/11/2026 (versão 30)');
  else checar('cada verbete declarado compõe na música que declara, para a escola a que pertence',
    naoCompoem.length === 0, naoCompoem);

  /*
   * O ALFABETO NÃO É DE NENHUMA ESCOLA (20/10/2026).
   *
   * Este arquivo vive em `biblioteca/`, que é compartilhada por todos os professores e todas as
   * escolas. Um nome de escola aqui é um erro de categoria: o que selecciona o alfabeto é a NOTAÇÃO
   * declarada, não o nome de quem a declara. A regra vale para os dois lados — um nome VIVO faria
   * os outros ciclos parecerem cópias de um deles; um nome EXPURGADO faz o projeto carregar uma
   * escola que já não existe, e que ninguém quer ver citada.
   *
   * A varredura é contra a lista REAL de escolas (`indices/escolas/`), e não contra uma lista
   * escrita à mão aqui: uma escola nova entra no índice, e a prova passa a vigiá-la sem alteração.
   */
  const dirEscolas = path.join(RAIZ, 'indices', 'escolas');
  const slugs = fs.existsSync(dirEscolas)
    ? fs.readdirSync(dirEscolas).filter((f) => /\.json$/.test(f))
      .map((f) => JSON.parse(fs.readFileSync(path.join(dirEscolas, f), 'utf8')).escola)
      .map((e) => ({ slug: String((e && (e.slug || e.nome)) || '').toLowerCase(), expurgada: Boolean(e && e.expurgada) }))
      .filter((e) => e.slug.length > 2)
    : [];
  /* «PELO MENOS CINCO» ERA UM NÚMERO DE OUTUBRO (25/11/2026). O índice tem hoje quatro escolas
   * — e o número caiu porque escolas foram expurgadas, que é o sistema a funcionar. O que a
   * asserção quer garantir não é o tamanho da lista: é que a varredura leia a REAL. Mede-se isso
   * sem número mágico: há pelo menos um nome, e a lista veio dos ficheiros que lá estão. */
  const arquivosDeEscola = fs.existsSync(dirEscolas)
    ? fs.readdirSync(dirEscolas).filter((f) => /\.json$/.test(f)) : [];
  checar('a lista de escolas do índice foi lida dos ficheiros que lá estão (nenhuma lista inventada)',
    slugs.length >= 1 && slugs.length === arquivosDeEscola.length,
    { lidas: slugs.length, arquivos: arquivosDeEscola.length });

  /*
   * COMO SE PROCURA UM NOME DE ESCOLA SEM DAR FALSO POSITIVO. A primeira versão disto era uma
   * busca cega de substring, e reprovou o alfabeto por causa de «ponta» — que é o nome de uma
   * escola expurgada E a palavra que descreve o pé esticado («a ponta no chão»). Uma varredura
   * lexical não distingue o nome da palavra, e uma prova que grita falso ensina a ser ignorada.
   *
   * A regra que resta é a que a linguagem já dá: **um nome de escola, em texto compartilhado,
   * aparece COMO nome** — capitalizado («Diaghilev/Fokini») ou entre crases («`batata`»). A palavra
   * comum, em prosa, aparece em minúscula e sem marca. É essa a distinção que se mede, e ela tem um
   * limite que se declara: um nome de escola em minúscula e sem crases passaria. O limite é aceitável
   * porque escrever «o ciclo batata» em minúscula e sem marca num arquivo compartilhado já é, por
   * si, um erro de redação que a revisão vê.
   *
   * E O NOME NA PROSA NÃO É O SLUG. O índice guarda `diaghilev2` (o sufixo desambigua dois
   * registros); a prosa escrevia «Diaghilev». Uma varredura só pelo slug exacto teria deixado passar
   * exactamente o caso que a pesquisadora apontou. Por isso cada escola é procurada pelo slug E pelo
   * slug sem os dígitos finais — e é essa a razão de a contraprova abaixo existir: sem ela, a regra
   * parecia certa e não era.
   */
  const formaDoSlug = (slug) => [slug, slug.replace(/\d+$/, '')].filter((f) => f.length > 2);
  const comoNome = (texto, slug) => formaDoSlug(slug).some((forma) => {
    const escapado = forma.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const capitalizado = new RegExp('(^|[^\\p{L}])' + escapado.charAt(0).toUpperCase()
      + escapado.slice(1) + '(?![\\p{L}])', 'u');
    const emCodigo = new RegExp('`[^`]*' + escapado + '[^`]*`', 'i');
    return capitalizado.test(texto) || emCodigo.test(texto);
  });

  const citadas = [];
  for (const valor of Object.values(alfabeto)) {
    const texto = typeof valor === 'string' ? valor : JSON.stringify(valor);
    for (const e of slugs) if (comoNome(texto, e.slug)) citadas.push(e.slug);
  }
  const citadasNoComentario = (alfabeto._comentario || []).filter((linha) => slugs.some((e) => comoNome(linha, e.slug)));
  checar('o alfabeto não nomeia escola nenhuma — nem viva, nem expurgada',
    citadas.length === 0 && citadasNoComentario.length === 0,
    { campos: [...new Set(citadas)], comentario: citadasNoComentario });
  checar('e nenhuma escola expurgada é citada no alfabeto',
    [...new Set(citadas)].filter((slug) => slugs.find((e) => e.slug === slug).expurgada).length === 0,
    [...new Set(citadas)].filter((slug) => slugs.find((e) => e.slug === slug).expurgada));

  // As pastas das MODALIDADES, e não só o alfabeto que a prova carregou: um segundo alfabeto que
  // nascesse com o nome de uma escola dentro seria apanhado aqui. Desde 28/10/2026 o alfabeto
  // vive em `biblioteca/modalidades/<modalidade>/`, ao lado do vocabulário e das tradições — e é
  // a pasta inteira que tem de estar limpa, não o arquivo.
  const dirModalidades = path.join(RAIZ, 'biblioteca', 'modalidades');
  const citadasNaPasta = [];
  for (const modalidade of fs.readdirSync(dirModalidades)) {
    const pasta = path.join(dirModalidades, modalidade);
    if (!fs.statSync(pasta).isDirectory()) continue;
    for (const arquivo of fs.readdirSync(pasta).filter((f) => /\.json$/.test(f))) {
      const texto = fs.readFileSync(path.join(pasta, arquivo), 'utf8');
      for (const e of slugs) {
        if (comoNome(texto, e.slug)) citadasNaPasta.push(modalidade + '/' + arquivo + ': ' + e.slug);
      }
    }
  }
  checar('nenhum arquivo de `biblioteca/modalidades/` nomeia uma escola',
    citadasNaPasta.length === 0, citadasNaPasta);

  // A CONTRAPROVA DA REGRA: ela tem de apanhar os dois nomes que ESTAVAM lá antes da correção, e
  // não pode acusar a palavra comum que a primeira versão acusou. Sem isto, a regra fica por
  // confiança — e foi uma regra por confiança que deixou os nomes entrar.
  /* O NOME QUE SE PROCURA VEM DO ÍNDICE, E NÃO DA MEMÓRIA DE QUEM ESCREVEU A PROVA (25/11/2026).
   * Aqui estava `Diaghilev/Fokini` — uma escola expurgada, que saiu do índice, e com ela a
   * contraposta: uma frase a citar um nome que já não existe mede a frase, não a regra. Usa-se o
   * slug REAL da lista, capitalizado como a prosa o escreveria — sem passar pela função que a
   * prova mede. */
  const slugReal = slugs.length ? slugs[0].slug : null;
  const capitalizado = slugReal ? slugReal.charAt(0).toUpperCase() + slugReal.slice(1) : null;
  checar('a regra apanha o nome capitalizado («' + (capitalizado || '<escola>') + '» na prosa)',
    Boolean(slugReal)
    && slugs.some((e) => comoNome('os sinais foram recuperados do ciclo ' + capitalizado + ', à mão', e.slug)),
    capitalizado);
  /* E O SUFIXO DE DESAMBIGUAÇÃO: o índice guarda o slug com dígitos quando dois registros colidem,
   * e a prosa escreve o nome sem eles. Só se mede quando tal escola existe — e diz-se quando não. */
  const comSufixo = slugs.map((e) => e.slug).find((x) => /\d+$/.test(x));
  if (comSufixo) {
    const semDigitos = comSufixo.replace(/\d+$/, '');
    checar('…e o sufixo de desambiguação não impede o reconhecimento («'
      + semDigitos.charAt(0).toUpperCase() + semDigitos.slice(1) + '» para `' + comSufixo + '`)',
      slugs.some((e) => comoNome('a cadeia veio do ciclo ' + semDigitos.charAt(0).toUpperCase()
        + semDigitos.slice(1) + ' em 2025', e.slug)), comSufixo);
  } else {
    naoMedido('o sufixo de desambiguação do slug', 'nenhuma escola do índice tem sufixo numérico hoje');
  }
  /* O CONTROLO não nomeia escola (21/10/2026). A frase de prova usava «batata» escrita à mão, e
   * passou a depender de a batata existir: expurgada a escola, `slugs` deixa de a ter e a
   * asserção reprova por um motivo que não tem nada a ver com o que ela mede — que é o scanner
   * apanhar um nome ENTRE CRASES. Usa-se a primeira escola REAL da lista, seja ela qual for. */
  const algumSlug = slugs.length ? slugs[0].slug : null;
  checar('e apanha um nome entre crases («o ciclo `' + (algumSlug || '<escola>') + '`»)',
    Boolean(algumSlug)
    && slugs.some((e) => comoNome('os exercícios do ciclo `' + algumSlug + '` exigiam-nos', e.slug)));
  const palavraComum = 'a extensão à frente, a ponta no chão';
  checar('e NÃO acusa a palavra comum em prosa («a ponta no chão»)',
    slugs.filter((e) => comoNome(palavraComum, e.slug)).length === 0,
    slugs.filter((e) => comoNome(palavraComum, e.slug)).map((e) => e.slug));

  /*
   * E A PROVA POSITIVA DA MESMA AFIRMAÇÃO: duas escolas diferentes, com o mesmo plano, produzem o
   * MESMO documento. Se o alfabeto dependesse de quem o usa, os dois textos diferiam.
   */
  {
    const um = derivar.derivarNotacao({
      plano: planoDeProva(), contexto: { escola: 'escola-um', escolaNome: 'Escola Um', professor: 'p1', ciclo: '01' },
    });
    const outro = derivar.derivarNotacao({
      plano: planoDeProva(), contexto: { escola: 'escola-dois', escolaNome: 'Escola Dois', professor: 'p2', ciclo: '01' },
    });
    checar('duas escolas INVENTADAS produzem o MESMO registro — nenhuma configuração por escola',
      um === outro);
    const g1 = derivar.derivarGlossario({
      plano: planoDeProva(), contexto: { escola: 'escola-um', escolaNome: 'Escola Um', professor: 'p1', ciclo: '01' },
    });
    const g2 = derivar.derivarGlossario({
      plano: planoDeProva(), contexto: { escola: 'escola-dois', escolaNome: 'Escola Dois', professor: 'p2', ciclo: '01' },
    });
    checar('e o mesmo glossário', g1 === g2);
  }

  // Nenhum campo do alfabeto é ligado a escola, professor ou turma: se houvesse um, o dado deixaria
  // de ser compartilhado sem ninguém notar.
  const camposDeEscola = ['escola', 'professor', 'turma', 'variante', 'ciclo'];
  checar('o alfabeto não tem campo de escola, professor, turma ou ciclo',
    camposDeEscola.filter((c) => Object.prototype.hasOwnProperty.call(alfabeto, c)).length === 0,
    camposDeEscola.filter((c) => Object.prototype.hasOwnProperty.call(alfabeto, c)));
  checar('o que o selecciona é a NOTAÇÃO declarada (`aplicaseA`)',
    Array.isArray(alfabeto.aplicaseA) && alfabeto.aplicaseA.length > 0, alfabeto.aplicaseA);

  // A FORMA DO BLOCO é a que o validador do projeto lê: `[Categoria: conteúdo]`.
  checar('a forma do bloco é `[Categoria: conteúdo]`', notacao.lerBloco('[Pé: 1ª → +]', alfabeto).ok);
  checar('um bloco sem colchetes não é bloco', notacao.lerBloco('Pé: 1ª → +', alfabeto).forma === false);
  /* A CATEGORIA INVENTADA NÃO SE ESCREVE À MÃO (02/11/2026). Aqui estava `Cabeça` — e ela passou
   * a ser uma categoria do alfabeto, por pedido da pesquisadora. A asserção guardava o mecanismo
   * certo («o alfabeto é que manda») e ficou a medir o dado errado: reprovava no dia em que o
   * vocabulário crescesse, que é o dia em que ela importa. Passa a inventar um nome que o próprio
   * alfabeto confirma ausente. */
  const categoriaInventada = ['Cauda', 'Ombro', 'Cotovelo', 'Joelho']
    .find((c) => alfabeto.categorias.indexOf(c) === -1) || 'Categoria-que-nao-existe';
  checar('uma categoria que o alfabeto não declara é recusada',
    notacao.lerBloco('[' + categoriaInventada + ': 1ª → +]', alfabeto).ok === false,
    categoriaInventada);
  /* A EXPANSÃO DO VOCABULÁRIO (02/11/2026) — quatro pedidos dela, e cada um é uma regra que
   * alguém pode desfazer sem dar por isso. O que se mede não é o texto do dado, é a CONSEQUÊNCIA
   * dele: uma categoria nova é uma pista nova, e dois sinais opostos têm de ser opostos. */
  const grupoDe = (titulo) => (alfabeto.grupos || []).find((g) => g.titulo === titulo) || { itens: {} };
  const movimento = grupoDe('Movimento').itens;

  checar('a cabeça é uma categoria do alfabeto', alfabeto.categorias.indexOf('Cabeça') !== -1,
    alfabeto.categorias);
  // e é uma PISTA como as outras: o que a categoria nova faz é abrir um relógio próprio.
  const comCabeca = notacao.compor({
    'Bloco': 'Solo', 'Objetivo específico': '1 — x', 'Conteúdo do nível': 'Giro da cabeça',
    'Tempos': '4', 'Compasso': '4/4',
  }, alfabeto);
  checar('e o bloco `[Cabeça: …]` é lido como qualquer outro',
    notacao.lerBloco('[Cabeça: 1ª → +]', alfabeto).ok === true,
    notacao.lerBloco('[Cabeça: 1ª → +]', alfabeto));

  checar('a rotação para dentro é o par da rotação para fora',
    Boolean(movimento['↻']) && Boolean(movimento['↺'])
      && /para dentro/.test(movimento['↻'].nome) && /para fora/.test(movimento['↺'].nome),
    [movimento['↺'] && movimento['↺'].nome, movimento['↻'] && movimento['↻'].nome]);
  checar('e «abre» é o par de «fecha» — os dois são movimento, e são opostos',
    Boolean(movimento['○']) && Boolean(movimento['●'])
      && /^abre/.test(movimento['○'].nome) && /^fecha/.test(movimento['●'].nome),
    [movimento['●'] && movimento['●'].nome, movimento['○'] && movimento['○'].nome]);

  // OS TRÊS EIXOS DOS LADOS. O horizontal já cá estava (D/E); os outros dois são o pedido.
  const lados = grupoDe('Lados').itens;
  checar('os lados cobrem os três eixos: horizontal, sagital e vertical',
    ['D', 'E', 'F', 'T', 'C', 'B'].every((k) => Boolean(lados[k])),
    Object.keys(lados));
  checar('…e cada um diz de que eixo é',
    /direito|esquerdo/.test(lados.D.nome + lados.E.nome)
      && /frente|trás/.test(lados.F.nome + lados.T.nome)
      && /cima|baixo/.test(lados.C.nome + lados.B.nome),
    [lados.D.nome, lados.F.nome, lados.C.nome]);

  // AS DIREÇÕES DO EIXO ROTACIONAL. A chave da célula é o `termo`, e ele tem de ser um só por
  // direção — dois termos iguais dariam dois baldes para a mesma coisa.
  const direcoes = Object.values(alfabeto.gramatica.direcoesDoMembro);
  const termosDeDirecao = direcoes.map((d) => d.termo);
  checar('as direções incluem «para dentro» e «para fora»',
    termosDeDirecao.indexOf('para-dentro') !== -1 && termosDeDirecao.indexOf('para-fora') !== -1,
    termosDeDirecao);
  checar('e nenhum termo de direção se repete — cada balde tem um nome',
    new Set(termosDeDirecao).size === termosDeDirecao.length, termosDeDirecao);

  // A ORIENTAÇÃO: o perfil entra, e o rótulo do épaulement deixa de dizer que o ombro roda.
  const orientacoes = Object.values(alfabeto.gramatica.orientacoesDoCorpo);
  const termoOrientacao = orientacoes.map((o) => o.termo);
  checar('a orientação «de lado · perfil» existe', termoOrientacao.indexOf('profil') !== -1,
    termoOrientacao);
  checar('e o épaulement não é mais «ombros rodados» — não é o ombro que roda',
    orientacoes.every((o) => o.nome !== 'ombros rodados')
      && /ombro/.test((orientacoes.find((o) => o.termo === 'epaulement') || {}).nome || ''),
    orientacoes.map((o) => o.nome));

  checar('a contagem `1–4` cobre quatro tempos', notacao.temposDaContagem('1–4') === 4);
  checar('e a contagem `3` cobre um', notacao.temposDaContagem('3') === 1);
}

/**
 * «NÃO MEDIDO» É UMA RESPOSTA; O SILÊNCIO NÃO É.
 *
 * A pesquisadora passou a poder apagar verbetes (02/11/2026) e em 02/11/2026 apagou os onze: o
 * alfabeto ficou com o `_comentario` e mais nada. A partir desse dia, as secções que compõem
 * exercícios NOMEADOS (`Plié`, `Port de bras`…) não têm o que compor — e onze asserções passaram a
 * reprovar por falta de conteúdo editorial, não por defeito do motor.
 *
 * O QUE NÃO SE FAZ: plantar quatro verbetes inventados por mim para as asserções voltarem a
 * verde. Isso seria medir o MEU conteúdo a fingir que é o dela, e a primeira correcção editorial
 * voltava a pôr a prova vermelha — o defeito que esta casa já pagou uma vez com o `devant`.
 * O que se faz é DIZER que a secção não foi medida, e porquê.
 */
function semVerbetesNoAlfabeto() {
  const alfabeto = alfabetoDaArvore() || {};
  const nomes = Object.keys(alfabeto.verbetes || {}).filter((k) => !k.startsWith('_'));
  return nomes.length === 0;
}

function naoMedido(secao, porque) {
  console.log('  · ' + secao + ' NÃO MEDIDA — ' + porque);
}

// ---------------------------------------------------------------- B. a composição
function aComposicao() {
  console.log('\nB. A COMPOSIÇÃO — determinística, e a grade fecha');
  if (semVerbetesNoAlfabeto()) {
    // B e C compõem exercícios NOMEADOS: sem verbetes no alfabeto não há o que compor, e medir
    // seria inventar o conteúdo. Ver `naoMedido`.
    // C tem o seu próprio aviso — ver `aRecusa`. Um aviso por seccão, e não dois para a mesma.
    naoMedido('B. a composição', 'o alfabeto está sem verbetes (02/11/2026, versão 30)');
    return;
  }
  const alfabeto = alfabetoDaArvore();

  /* AS ENTRADAS SÃO ESCOLHIDAS POR PROPRIEDADE, E NÃO POR NOME (25/11/2026).
   *
   * Aqui estava `compor(linha('Solo','Plié','8','4/4'))`, e o `Plié` de hoje é `4|2/4`: a prova
   * media a memória de Outubro. O que se quer medir é a GRADE — que o compasso é calculado por
   * pista, que a cobertura fecha, que a repetição entra na conta —, e isso vale para qualquer
   * exercício que o alfabeto declare. Escolhe-se o que serve, e diz-se qual é. */
  const umSegmento = entradaReal((e) => e.composta.estado === 'composto' && e.composta.segmentos.length === 1);
  const quatroSegmentos = entradaReal((e) => e.composta.estado === 'composto' && e.composta.segmentos.length === 4);
  const varios = entradaReal((e) => e.composta.estado === 'composto' && e.composta.segmentos.length > 1);

  if (!umSegmento) naoMedido('a célula única compõe-se inteira', 'o alfabeto não tem entrada de um segmento');
  else {
    const c = umSegmento.composta;
    checar('uma célula só compõe-se inteira: «' + umSegmento.exercicio + '» em ' + umSegmento.musica,
      c.estado === 'composto' && c.restoTempos === 0, c.estado);
    checar('…e a repetição da célula entra na cobertura (sem ela a conta não fecharia)',
      c.cobertura === umSegmento.verbete.cobre && c.segmentos[0].repeticoes >= 1,
      { cobertura: c.cobertura, cobre: umSegmento.verbete.cobre, repeticoes: c.segmentos[0].repeticoes });
  }

  /* O COMPASSO É CALCULADO, NÃO DECLARADO. A entrada de quatro segmentos deixa-o ver: os
   * compassos saem 1, 2, 3, 4 sem ninguém os escrever, porque cada célula cobre um compasso da
   * música declarada. Era a asserção «1,1,2,2,3,3» do `Port de bras` de 12 tempos — o mecanismo é
   * o mesmo, medido no dado que existe. */
  if (!quatroSegmentos) naoMedido('o compasso é calculado por pista', 'o alfabeto não tem entrada de quatro segmentos');
  else {
    const c = quatroSegmentos.composta;
    const compassos = c.segmentos.map((s) => s.compasso);
    checar('quatro células de um compasso dão os compassos 1, 2, 3, 4 — calculados, nunca escritos'
      + ' («' + quatroSegmentos.exercicio + '» em ' + quatroSegmentos.musica + ')',
      JSON.stringify(compassos) === JSON.stringify([1, 2, 3, 4]), compassos);
    checar('e o numericador da música é o que converte tempos em compassos',
      c.musica && c.musica.numerador === Number(quatroSegmentos.compasso.split('/')[0]),
      c.musica && c.musica.numerador);
    checar('a cobertura é a música inteira', c.cobertura === Number(quatroSegmentos.tempos) && c.restoTempos === 0,
      { cobertura: c.cobertura, tempos: quatroSegmentos.tempos, resto: c.restoTempos });
    checar('e as direções vêm das chaves das células, sem lista paralela',
      JSON.stringify(c.direcoes) === JSON.stringify(Object.keys(quatroSegmentos.verbete.celulas).filter((d) => d !== '')),
      c.direcoes);
  }

  const determinismo = varios || umSegmento;
  if (!determinismo) naoMedido('a composição é determinística', 'o alfabeto não tem entrada a compor');
  else {
    const uma = notacao.compor(linha('Solo', determinismo.exercicio, determinismo.tempos, determinismo.compasso),
      alfabeto, DATA, determinismo.escola);
    const outra = notacao.compor(linha('Solo', determinismo.exercicio, determinismo.tempos, determinismo.compasso),
      alfabeto, DATA, determinismo.escola);
    checar('a mesma linha compõe-se do mesmo modo (a âncora tem de poder ser reproduzida)',
      JSON.stringify(uma) === JSON.stringify(outra));
  }

  /* A LINHA PARCIAL — o motor declara o que sobra, em vez de arredondar.
   *
   * «16 tempos em 3/4 = 5⅓ compassos» era o `Port de bras` do alfabeto de Outubro, e hoje nenhuma
   * entrada deixa tempos por cobrir (as nove fecham). A forma mede-se numa CÓPIA de uma entrada
   * real com uma célula retirada e o `cobre` em `null` — o `cobre` sai porque, com ele lá, o motor
   * diria (com razão) `verbete-inconsistente` em vez de `parcial`. O texto, os sinais e a música
   * continuam a ser os dela; o que se acrescenta é a LACUNA, que é o que se quer medir. */
  if (!quatroSegmentos) naoMedido('a linha parcial declara o que sobra', 'o alfabeto não tem entrada de quatro células');
  else {
    const copia = copiaProfunda(alfabeto);
    const alvo = copia.verbetes[quatroSegmentos.exercicio][quatroSegmentos.musica];
    const chaves = Object.keys(alvo.celulas).filter((d) => (alvo.celulas[d] || []).length);
    const ultima = chaves[chaves.length - 1];
    alvo.celulas[ultima] = alvo.celulas[ultima].slice(0, alvo.celulas[ultima].length - 1);
    if (!alvo.celulas[ultima].length) delete alvo.celulas[ultima];
    alvo.cobre = null;
    const parcial = comporContra(copia, quatroSegmentos.exercicio, quatroSegmentos.tempos,
      quatroSegmentos.compasso, quatroSegmentos.escola);
    checar('uma música que o verbete cobre em parte fica PARCIAL, e não composta nem em lacuna',
      parcial.estado === 'parcial', { estado: parcial.estado, motivo: parcial.motivo });
    checar('e o que sobra fica DECLARADO, com o número certo',
      parcial.restoTempos === Number(quatroSegmentos.tempos) - parcial.cobertura,
      { resto: parcial.restoTempos, cobertura: parcial.cobertura });
    checar('a lacuna sabe em que compasso começa',
      parcial.compassoDoResto === Math.floor(parcial.compassosCobertos) + 1,
      { compassoDoResto: parcial.compassoDoResto, cobertos: parcial.compassosCobertos });
    checar('e o detalhe diz quantos tempos restam, em palavras',
      new RegExp('restam ' + parcial.restoTempos + ' tempos').test(parcial.detalhe || ''), parcial.detalhe);
  }

  /* AS DUAS PISTAS SIMULTÂNEAS — cada categoria tem o seu relógio.
   *
   * O `Plié` de 02/11/2026 tinha células de `Perna` e de `Braço`, e era isso que a asserção media:
   * as pernas fazem dois compassos enquanto os braços fazem um, ao mesmo tempo. Hoje nenhuma
   * entrada tem duas categorias (é o dado, não o motor). Acrescenta-se uma segunda pista a uma
   * CÓPIA, com o sinal e a descrição da célula que lá está: o que se mede é que o compasso corre
   * POR PISTA, e não em fila única. */
  if (!varios) naoMedido('as pistas têm relógios independentes', 'o alfabeto não tem entrada com mais de uma célula');
  else {
    const copia = copiaProfunda(alfabeto);
    const alvo = copia.verbetes[varios.exercicio][varios.musica];
    const chave = Object.keys(alvo.celulas).find((d) => (alvo.celulas[d] || []).length) || '';
    const original = alvo.celulas[chave][0];
    alvo.celulas[chave] = alvo.celulas[chave].concat([Object.assign({}, original, {
      categoria: 'Braço', sinais: ['1ª'], descricao: original.descricao,
      ...(original.repeticoes ? { repeticoes: original.repeticoes } : {}),
    })]);
    const comDuas = comporContra(copia, varios.exercicio, varios.tempos, varios.compasso, varios.escola);
    const porPista = {};
    for (const seg of comDuas.segmentos) (porPista[seg.pista] = porPista[seg.pista] || []).push(seg.compasso);
    checar('duas pistas compõem uma grade com duas, e não com uma fila',
      Object.keys(porPista).length === 2, porPista);
    checar('e cada pista começa no compasso 1 — o relógio é dela, não da linha',
      Object.values(porPista).every((lista) => lista[0] === 1), porPista);
    checar('a pista vai no segmento: é ela que diz que os dois «compasso 1» são simultâneos',
      comDuas.segmentos.every((seg) => Boolean(seg.pista)), comDuas.segmentos.map((s) => s.pista));
  }

  /* OS LADOS (D/E) — o eixo horizontal declarado no verbete, e lido por célula.
   *
   * Nenhuma entrada de hoje declara `lado` (o `Port de bras` saiu do alfabeto). Mede-se na cópia,
   * pelo mesmo motivo e com a mesma declaração do caso das pistas. */
  if (!varios) naoMedido('os lados declarados chegam à grade', 'o alfabeto não tem entrada a compor');
  else {
    const copia = copiaProfunda(alfabeto);
    const alvo = copia.verbetes[varios.exercicio][varios.musica];
    alvo.lado = ['D', 'E'];
    const chave = Object.keys(alvo.celulas).find((d) => (alvo.celulas[d] || []).length) || '';
    alvo.celulas[chave] = alvo.celulas[chave].map((c, k) => Object.assign({}, c, { lado: k === 0 ? 'D' : 'E' }));
    const comLados = comporContra(copia, varios.exercicio, varios.tempos, varios.compasso, varios.escola);
    checar('o verbete que distingue lados declara quais', JSON.stringify(comLados.lados) === JSON.stringify(['D', 'E']),
      comLados.lados);
    checar('e cada célula diz o lado em que acontece',
      comLados.segmentos.filter((seg) => seg.lado).length > 0, comLados.segmentos.map((seg) => seg.lado));
  }
}

// ------------------------------------------------------------------- C. a recusa
function aRecusa() {
  console.log('\nC. A RECUSA — o que o motor não escreve, e por quê');
  if (semVerbetesNoAlfabeto()) {
    // As recusas de C medem-se MUTANDO um verbete que existe. Sem verbete não há o que mutar — e
    // um verbete plantado aqui seria conteúdo meu a fazer de conta que é o dela.
    naoMedido('C. a recusa', 'o alfabeto está sem verbetes (02/11/2026, versão 30)');
    return;
  }
  const alfabeto = alfabetoDaArvore();
  // A entrada base das mutações: uma que COMPÕE, para que a recusa seja a única diferença.
  const base = entradaReal((e) => e.composta.estado === 'composto');
  if (!base) {
    naoMedido('C. a recusa', 'o alfabeto não tem nenhuma entrada a compor');
    return;
  }
  const linhaBase = (tempos, compasso) => linha('Solo', base.exercicio, tempos || base.tempos, compasso || base.compasso);

  /* SEM MÚSICA É UM CASO QUE DEPENDE DO DADO (22/11/2026): quando o verbete declara UMA só música,
   * a linha que não a declara compõe com ela — «a música não se escreve, ela sobe». A lacuna fica
   * para o exercício cujo verbete declara VÁRIAS, e cuja linha não escolhe nenhuma. O `Battement
   * tendu` é esse caso hoje: as suas músicas são todas por escola, e sem escola não há uma só. */
  const semMusica = notacao.compor(linha('Solo', 'Battement tendu', '[a decidir]', '[a decidir]'), alfabeto);
  checar('e o exercício cujo verbete declara uma só música NÃO fica em lacuna — a música sobe do verbete',
    ['composto', 'parcial'].indexOf(notacao.compor(linha('Solo', base.exercicio, '[a decidir]', '[a decidir]'),
      alfabeto, DATA, base.escola).estado) !== -1,
    notacao.compor(linha('Solo', base.exercicio, '[a decidir]', '[a decidir]'), alfabeto, DATA, base.escola).estado);
  checar('sem tempos e compasso, a linha fica em lacuna', semMusica.estado === 'lacuna');
  checar('e o motivo é a música', semMusica.motivo === 'sem-musica', semMusica.motivo);
  checar('a lacuna não traz segmentos', semMusica.segmentos.length === 0);
  checar('e explica o que falta', /(não estão declarados|declara \d+ músicas)/.test(semMusica.detalhe || ''), semMusica.detalhe);

  const semVerbete = notacao.compor(linha('Centro', 'Pirouette', '8', '4/4'), alfabeto);
  checar('um exercício sem verbete fica em lacuna', semVerbete.estado === 'lacuna');
  checar('e o motivo é a falta de verbete', semVerbete.motivo === 'sem-verbete', semVerbete.motivo);
  checar('e a frase cita a regra que o exige', /P-16/.test(semVerbete.detalhe || ''), semVerbete.detalhe);

  /* UMA MÚSICA QUE A ENTRADA NÃO COBRE. Antes era `Plié` em `4/4` contra um verbete de `8|4/4`;
   * hoje procura-se uma música que NENHUMA entrada daquele exercício declare — e o valor não é
   * escolhido à mão: é a música declarada com o numerador trocado, que a entrada não tem. */
  const musicaCruzada = (() => {
    const [t, c] = base.musica.split('@')[0].split('|');
    const [n, d] = c.split('/').map(Number);
    return { tempos: t, compasso: (n === 4 ? 3 : 4) + '/' + d };
  })();
  const musicaErrada = notacao.compor(linha('Solo', base.exercicio, musicaCruzada.tempos, musicaCruzada.compasso),
    alfabeto, DATA, base.escola);
  checar('uma música que o verbete não cobre fica em lacuna', musicaErrada.estado === 'lacuna', musicaErrada.estado);
  checar('e o motivo é a música não coberta', musicaErrada.motivo === 'musica-nao-coberta', musicaErrada.motivo);
  checar('e a frase diz para o que o verbete está declarado',
    /está declarado para/.test(musicaErrada.detalhe || ''), musicaErrada.detalhe);

  // UM SINAL FORA DO ALFABETO — o alfabeto é clonado e estragado de propósito.
  // A DIREÇÃO NÃO SE ESCREVE À MÃO (02/11/2026): usa-se a primeira que tem célula.
  const estragado = copiaProfunda(alfabeto);
  const alvoEstragado = estragado.verbetes[base.exercicio][base.musica];
  const baldes = alvoEstragado.celulas;
  const comCelula = Object.keys(baldes).find((d) => (baldes[d] || []).length);
  checar('a entrada de prova tem uma direção com célula para estragar', comCelula !== undefined, Object.keys(baldes));
  baldes[comCelula][0].sinais = ['1ª', '§'];
  const comSinalRuim = comporContra(estragado, base.exercicio, base.tempos, base.compasso, base.escola);
  checar('um verbete que usa um sinal desconhecido não é publicado',
    comSinalRuim.estado === 'lacuna' && comSinalRuim.motivo === 'sinal-desconhecido', comSinalRuim.motivo);
  checar('e o motivo nomeia o bloco e o sinal', /§/.test(comSinalRuim.detalhe || ''), comSinalRuim.detalhe);

  /* A DIREÇÃO VAZIA DEIXOU DE SER UM ERRO (02/11/2026) — uma chave que existe e não diz o que nela
   * acontece diz o mesmo que não existir: é ruído do editor, e o verbete compõe-se com ele lá. O
   * que continua recusado é a chave que NÃO É UMA LISTA — isso é um ficheiro mal formado. */
  const comBaldeVazio = copiaProfunda(alfabeto);
  comBaldeVazio.verbetes[base.exercicio][base.musica].celulas.derriere = [];
  const comDirecaoVazia = comporContra(comBaldeVazio, base.exercicio, base.tempos, base.compasso, base.escola);
  checar('um balde vazio não impede a composição — é ruído do editor, não uma declaração',
    comDirecaoVazia.estado === 'composto' && comDirecaoVazia.cobertura === base.composta.cobertura,
    { estado: comDirecaoVazia.estado, cobertura: comDirecaoVazia.cobertura });
  checar('…e `semBaldesVazios` tira-o, sem tocar no que tem células',
    !('derriere' in notacao.semBaldesVazios(comBaldeVazio.verbetes[base.exercicio][base.musica]).celulas)
      && comCelula in notacao.semBaldesVazios(comBaldeVazio.verbetes[base.exercicio][base.musica]).celulas,
    Object.keys(notacao.semBaldesVazios(comBaldeVazio.verbetes[base.exercicio][base.musica]).celulas));

  const malFormado = copiaProfunda(alfabeto);
  malFormado.verbetes[base.exercicio][base.musica].celulas.derriere = 'não é uma lista';
  const comChaveTorcida = comporContra(malFormado, base.exercicio, base.tempos, base.compasso, base.escola);
  checar('…mas uma direção que não é uma lista continua a não ser publicada',
    comChaveTorcida.motivo === 'verbete-incompleto', comChaveTorcida.motivo);
  checar('e o motivo nomeia a direção torta', /derriere/.test(comChaveTorcida.detalhe || ''),
    comChaveTorcida.detalhe);

  // A POSIÇÃO E AS DIREÇÕES SAEM DO VERBETE — é o que permite à página em prosa dizê-las.
  const comDirecoes = entradaReal((e) => e.composta.estado === 'composto' && e.composta.direcoes.length >= 3);
  if (!comDirecoes) naoMedido('a composição nomeia as direções, na ordem', 'nenhuma entrada declara três direções');
  else {
    checar('e nomeia as direções declaradas, na ordem',
      JSON.stringify(comDirecoes.composta.direcoes) === JSON.stringify(Object.keys(comDirecoes.verbete.celulas).filter((d) => d !== '')),
      comDirecoes.composta.direcoes);
  }

  /* UM VERBETE CUJA COBERTURA DECLARADA NÃO SOMA O QUE OS SEGMENTOS COBREM. A mutação usa o
   * `cobre` real e fá-lo mentir por um tempo — é a diferença mínima entre um verbete certo e um
   * inconsistente. */
  const mentiroso = copiaProfunda(alfabeto);
  const alvoMentiroso = mentiroso.verbetes[base.exercicio][base.musica];
  alvoMentiroso.cobre = Number(alvoMentiroso.cobre) - 1;
  const comCoberturaErrada = comporContra(mentiroso, base.exercicio, base.tempos, base.compasso, base.escola);
  checar('um verbete que declara cobrir o que não soma não é publicado',
    comCoberturaErrada.motivo === 'verbete-inconsistente', comCoberturaErrada.motivo);

  // SEM ALFABETO NÃO HÁ LACUNA DE EXERCÍCIO: há ausência de código, e ela diz-se assim.
  const semAlfabeto = notacao.compor(linha('Solo', base.exercicio, base.tempos, base.compasso), null);
  checar('sem alfabeto, a lacuna é do código e não do exercício', semAlfabeto.motivo === 'sem-alfabeto',
    semAlfabeto.motivo);
}

// ------------------------------------------------------------------ D. o documento
function oDocumento() {
  console.log('\nD. O PAR registro × glossário, medido pelo validador do PROJETO');
  const plano = planoDeProva();
  const alfabeto = alfabetoDaArvore();
  const md = derivar.derivarNotacao({ plano, contexto: CONTEXTO });
  const gl = derivar.derivarGlossario({ plano, contexto: CONTEXTO });

  checar('a notação é derivada', Boolean(md && md.length));
  checar('o glossário é derivado', Boolean(gl && gl.length));

  checar('o documento declara QUAL código o compôs (P-15)', /## O código declarado/.test(md));
  // A versão é a do DADO, não uma constante da prova: escrever `1` aqui faria a prova reprovar no
  // dia em que o alfabeto mudasse — que é o dia em que ela importa.
  checar('e diz a versão do alfabeto',
    new RegExp('\\| Versão \\| ' + alfabeto.versao + ' \\|').test(md),
    (md.match(/\| Versão \|[^\n]*/) || [])[0]);

  /* A CÉLULA QUE O DOCUMENTO TEM DE MOSTRAR VEM DO DADO, E DA ENTRADA QUE COMPÔE PARA ESTA ESCOLA.
   *
   * Aqui estava `alfabeto.verbetes['Plié']['8|4/4']`, e o `Plié` de hoje é `4|2/4`: o literal dava
   * `undefined` e a prova caía num `TypeError`. Pior do que cair: se a música existisse por acaso,
   * a asserção compararia os sinais de OUTRA música. Procura-se a entrada que a derivação vai usar
   * — a que compõe para a escola do contexto — e lê-se dela. */
  const compostaNoDocumento = entradaRealParaEscola((e) => e.composta.estado === 'composto', CONTEXTO.escola);
  let celulaDeProva = null;
  if (compostaNoDocumento) {
    const reg = compostaNoDocumento.verbete;
    const todas = Object.keys(reg.celulas || {}).reduce((t, d) => t.concat(reg.celulas[d] || []), []);
    celulaDeProva = todas.find((c) => c.categoria === 'Perna') || todas[0] || null;
  }
  if (celulaDeProva) {
    checar('a linha composta traz os blocos da célula do verbete',
      md.indexOf('`[' + celulaDeProva.categoria + ': ' + celulaDeProva.sinais.join(' ') + ']`') !== -1,
      { exercicio: compostaNoDocumento.exercicio, sinais: celulaDeProva.sinais });
  } else {
    naoMedido('a linha composta traz os blocos', 'nenhuma entrada do alfabeto compõe para esta escola');
  }
  checar('a linha sem música traz a lacuna, e não uma célula vazia',
    /\[Preencher: notação do exercício\] \| (os tempos e o compasso|o verbete de)/.test(md),
    (md.match(/\| \[Preencher: notação do exercício\][^\n]*/) || []).slice(0, 2));
  checar('o exercício sem verbete também', /\[Preencher: notação do exercício\] \| o alfabeto não tem verbete/.test(md));

  // O MARCADOR DE CONFERIR NÃO PODE SER UM «SINAL». O validador lê todo o code span que começa
  // por `[` e acaba em `]` como um bloco de notação — um `[conferir]` entre crases seria um
  // símbolo usado no corpo e sem verbete, e reprovaria o par.
  /* A LINHA PARCIAL NO DOCUMENTO — e ela precisa de uma entrada que fique em parte. Nenhuma das
   * nove de hoje fica: todas fecham. A entrada injeta-se em CÓPIA? Não: a derivação lê o alfabeto
   * carregado, e é esse que tem de ter a forma. Injeta-se no alfabeto em processo, mede-se, e
   * repõe-se no `finally` — o mesmo mecanismo do `provar-a-descricao-do-exercicio`, e a limpeza é
   * ela própria uma asserção.
   *
   * O QUE SE ACRESCENTA CONTINUA A NÃO SER CONTEÚDO MEU: as células, os sinais e a música são os
   * de uma entrada real; o que se tira é uma célula, e o que se põe a `null` é o `cobre`. O que se
   * mede é a FORMATAÇÃO da linha parcial — `**conferir**`, e os tempos ditos em palavras. */
  /* A entrada pode ter sufixo de escola: a cópia entra no alfabeto com um nome SEM sufixo, e é por
   * isso que ela fica visível para a escola do contexto. O que se leva dela são as células, que
   * são as mesmas — o sufixo decide quem as vê, não o que elas dizem. */
  const quatro = entradaReal((e) => e.composta.estado === 'composto' && e.composta.segmentos.length >= 2);
  let parcialMedida = false;
  if (quatro) {
    const NOME = 'Entrada de prova — parcial';
    const guardado = alfabeto.verbetes[NOME];
    try {
      const copia = copiaProfunda(quatro.verbete);
      const chaves = Object.keys(copia.celulas).filter((d) => (copia.celulas[d] || []).length);
      const ultima = chaves[chaves.length - 1];
      copia.celulas[ultima] = copia.celulas[ultima].slice(0, copia.celulas[ultima].length - 1);
      if (!copia.celulas[ultima].length) delete copia.celulas[ultima];
      copia.cobre = null;
      alfabeto.verbetes[NOME] = { [quatro.tempos + '|' + quatro.compasso]: copia };
      const planoParcial = {
        id: 'plano-parcial', fonte: 'plano', contexto: CONTEXTO,
        respostas: {
          'contexto-notacao': r(NOTACAO),
          'aula-1-sequencia': r([linha('Solo', NOME, quatro.tempos, quatro.compasso)]),
        },
      };
      const mdParcial = derivar.derivarNotacao({ plano: planoParcial, contexto: CONTEXTO });
      const restam = (mdParcial.match(/restam (\d+) tempos/) || [])[1];
      checar('o marcador de conferir não está entre crases (não é um sinal)',
        /\*\*conferir\*\*/.test(mdParcial) && !/`\[conferir\]`/.test(mdParcial),
        (mdParcial.match(/[^\n]*conferir[^\n]*/) || [])[0]);
      checar('e a linha parcial diz quantos tempos ficaram por explicar',
        Boolean(restam) && Number(restam) > 0, restam);
      parcialMedida = true;
    } finally {
      if (guardado === undefined) delete alfabeto.verbetes[NOME];
      else alfabeto.verbetes[NOME] = guardado;
    }
  }
  if (!parcialMedida) naoMedido('o marcador de conferir e a linha parcial',
    'nenhuma entrada sem sufixo de escola tem células a retirar para compor em parte');
  checar('o alfabeto ficou como estava — a prova não deixa verbete de prova no catálogo',
    alfabeto.verbetes['Entrada de prova — parcial'] === undefined,
    Object.keys(alfabeto.verbetes).length);

  checar('o documento fecha com o resumo das lacunas', /## O que ficou em lacuna/.test(md));
  checar('o glossário tem índice de símbolos', /## Índice de símbolos/.test(gl));
  checar('o glossário declara a origem de cada verbete', /- \*\*Origem:\*\* (sistema|convenção do ciclo)\./.test(gl));
  checar('e lista os sinais declarados que o registro não usa — o alfabeto não se esconde',
    /Declarados e não usados/.test(gl), (gl.match(/Declarados e não usados[^\n]*/) || [])[0]);

  // O VALIDADOR DO PROJETO, o controlo mais forte desta prova: foi escrito à mão, antes disto, e
  // já reprovou documentos deste repositório. Se ele passa, o par está consistente por medida
  // independente — não por auto-avaliação do gerador.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notacao-'));
  try {
    const registro = path.join(dir, 'ciclo-01-prova-notacao.md');
    // O NOME DO FICHEIRO JÁ NÃO DIZ «benesh»: era o nome da notação de Outubro, e um ficheiro de
    // prova com o nome de uma notação que a árvore não usa é a mesma deriva que esta prova corrige.
    const glossario = path.join(dir, 'ciclo-01-prova-glossario.md');
    fs.writeFileSync(registro, md, 'utf8');
    fs.writeFileSync(glossario, gl, 'utf8');
    let saida = '';
    let codigo = 0;
    try {
      saida = execFileSync(process.execPath,
        [path.join(RAIZ, 'tools', 'check-glossario.js'), registro, glossario],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      codigo = e.status == null ? 1 : e.status;
      saida = String(e.stdout || '') + String(e.stderr || '');
    }
    if (celulaDeProva) {
      checar('`check-glossario` aceita o par gerado (0 erro, 0 aviso)', codigo === 0, saida.trim().split('\n').slice(-3));
      checar('e conta os símbolos do corpo e os verbetes do glossário em pé de igualdade',
        /(\d+) símbolos no corpo, \1 verbetes no glossário/.test(saida),
        (saida.match(/ok: glossário consistente[^\n]*/) || [])[0]);
    } else {
      /* COM ZERO SÍMBOLOS O PAR NÃO FICA INCONSISTENTE — fica VAZIO, e o validador di-lo com
       * avisos. Medir «0 = 0» aqui seria dar por bom um documento sem registro nenhum. */
      naoMedido('`check-glossario` aceita o par gerado',
        'sem célula composta o par sai vazio, e o validador declara-o — não é um par consistente, '
        + 'é um documento sem registro');
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- E. a degradação
function aDegradacao() {
  console.log('\nE. A DEGRADAÇÃO — e a resposta antiga não manda no documento novo');

  /* A NOTAÇÃO DEIXOU DE SER ESCOLHA (18/11/2026), e esta secção media o contrário.
   *
   * Ela nasceu quando o plano declarava a notação e um plano que dissesse «Laban» fazia o
   * documento degradar — sem alfabeto, com as lacunas declaradas em vez de sinais inventados.
   * Depois de 18/11 a notação é uma CONSTANTE («Código de dança», que é a nossa), e o
   * `notacaoEscolhida` passou a devolvê-la ignorando o envelope: «uma resposta antiga (Benesh,
   * Laban) não pode continuar a mandar no documento novo».
   *
   * As asserções de então reprovavam com razão — mediam um comportamento que foi REVOGADO, não
   * um defeito. O que fica a medir é a regra nova, e ela é mais forte do que a antiga: **quatro
   * respostas diferentes no envelope produzem o MESMO documento, byte a byte.** Se alguém
   * voltasse a fazer o envelope mandar na notação, isto caía. */
  const semAlfabeto = ['Laban', 'Benesh'];
  checar('uma notação sem alfabeto publicado devolve `null` — e não um alfabeto emprestado',
    semAlfabeto.every((nome) => notacao.paraNotacao(nome) === null),
    semAlfabeto.map((nome) => [nome, notacao.paraNotacao(nome) && notacao.paraNotacao(nome).id]));

  const documentos = [undefined, 'Laban', 'Benesh', 'Nenhuma'].map((declarada) => ({
    declarada,
    md: derivar.derivarNotacao({ plano: planoDeProva(declarada), contexto: CONTEXTO }),
  }));
  checar('os quatro envelopes (sem resposta, Laban, Benesh, Nenhuma) derivam documento',
    documentos.every((d) => d.md && d.md.length > 1000), documentos.map((d) => [d.declarada, d.md && d.md.length]));
  checar('e derivam o MESMO documento — a resposta antiga não manda no documento novo',
    new Set(documentos.map((d) => d.md)).size === 1,
    documentos.map((d) => [d.declarada, d.md.slice(0, 60)]).map(([k, v]) => k + ': ' + v));
  checar('e o documento diz a notação que é NOSSA, seja qual for a resposta que lá esteja',
    documentos.every((d) => d.md.indexOf(NOTACAO) !== -1), NOTACAO);

  /* A DEGRADAÇÃO QUE AINDA EXISTE é a do COMPOSITOR: sem alfabeto não há sinal, e o que sai é a
   * lacuna declarada — nenhum bloco inventado. É o mesmo mecanismo de antes, medido onde ele
   * vive hoje. */
  const semCodigo = notacao.compor(linha('Solo', 'Plié', '4', '2/4'), null);
  checar('sem alfabeto o exercício não ganha sinais inventados', semCodigo.segmentos.length === 0);
  checar('e a lacuna é a do CÓDIGO, e não a do exercício', semCodigo.motivo === 'sem-alfabeto', semCodigo.motivo);
  checar('e a frase diz que não há alfabeto publicado', /não tem alfabeto publicado/.test(semCodigo.detalhe || ''),
    semCodigo.detalhe);
}

console.log('provar-notacao — o registro compõe-se, e recusa quando não pode');
oAlfabeto();
aComposicao();
aRecusa();
oDocumento();
aDegradacao();

console.log('\n' + (falhas === 0
  ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
  : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
process.exit(falhas === 0 ? 0 : 1);
