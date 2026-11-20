/**
 * O QUE MUDOU DESDE O ÚLTIMO CICLO — a validação que o botão «Atualizar o ciclo» faz antes de
 * existir (20/11/2026).
 *
 * O PEDIDO, na letra dela: «Esse botão de atualizar ciclo precisa de uma validação, a gente não vai
 * gastar recurso à toa. […] Você olha lá no plano de ensino ou no plano de observação ou no
 * documento que o ciclo gerou e vê se está diferente. Se aquele campo ali, aquela chave valor,
 * estiverem diferentes, aí sim vai para o item atualizar ciclo, senão não faz sentido ir porque é
 * igual. […] Só vai habilitar e colocar esse ponto de exclamação se realmente passou na validação e
 * é uma mudança legítima.»
 *
 * PORQUE É UM MÓDULO DE NÚCLEO. A pergunta «isto mudou?» é comparação de valores, e a comparação
 * tem regras que não são óbvias: a régua é uma ESCALA e a ordem é o que ela mede; o repertório é um
 * CONJUNTO e a ordem não significa nada; e o vazio nunca acusa. Essas três regras são a regra
 * inteira, e escrevê-las duas vezes — uma no servidor e outra na tela — daria duas respostas no dia
 * em que só uma fosse corrigida.
 *
 * O VAZIO NÃO ACUSA, e é a convenção de sempre nesta casa: um documento de antes de um campo
 * existir não declara esse campo, e «não declarado» não é «diferente». Acusar por omissão acenderia
 * o «!» em todo o acervo antigo, para sempre, e um aviso que está sempre aceso não se lê.
 *
 * OS TRÊS ITENS SÃO OS QUE SE PODEM PROVAR. O quarto que ela nomeou — o dicionário — não entra
 * aqui, e a razão é de dado: o corpo de um verbete não viaja no plano de ensino, portanto não há
 * contra o que comparar. Ele já tem o seu caminho (a geração dos documentos corre a cada verbete ou
 * termo que uma Turma use — ver `gerarOsCiclosDoTermo`), e é isso que o `ROTULOS` abaixo não
 * inventa.
 *
 * Fronteira: puro (sem `fs`/`path`/`http`/`process`). Recebe dois retratos e devolve o que difere.
 */

/* A ORDEM DOS ITENS É A DA LEITURA do cartão: primeiro o que a direção decidiu (a régua), depois o
 * que a Turma ensina (o conteúdo), e por fim o que o professor declara saber (a habilidade). Não é
 * alfabética de propósito — é a ordem em que as pessoas deste sistema falam do ciclo. */
const ORDEM = ['regua', 'estilo', 'habilidade', 'dicionario'];

/* AS FRASES SÃO AS DELA, no plural do sistema: «a régua foi modificada», «a habilidade do professor
 * foi modificada». O rótulo é a frase inteira, porque é ela que vai no `title` do botão — e um
 * rótulo curto («régua») obrigaria a tela a compor a frase, que é a segunda cópia que se evita. */
const ROTULOS = {
  regua: 'A régua foi modificada',
  estilo: 'O conteúdo do Estilo foi modificado',
  habilidade: 'A habilidade do professor foi modificada',
  dicionario: 'O dicionário foi modificado',
};

/* O NOME CURTO DE CADA ITEM, PARA A LISTA DO `title` (20/11/2026).
 *
 * «Ao invés de colocar toda a string em uma linha só, você vai colocar ela como uma lista para eu
 * poder enxergar isso como uma lista. Aí você vai dizer assim: foi modificado, dois pontos, embaixo
 * você diz habilidade do professor, por exemplo. Ou senão o verbete tal.»
 *
 * Duas formas do MESMO facto, e por isso as duas aqui: a frase (para o selo e para quem lê uma
 * linha) e o item (para a lista de quem abre o `title`). Escrevê-las em sítios diferentes daria um
 * botão cujo número e cuja lista falavam de coisas diferentes no dia em que uma fosse corrigida. */
const ITENS = {
  regua: 'a régua',
  estilo: 'o conteúdo do Estilo',
  habilidade: 'a habilidade do professor',
  dicionario: 'o dicionário',
};

/** Uma lista de valores, sem vazios nem repetidos, na ordem em que veio. */
function lista(valor) {
  const cru = Array.isArray(valor) ? valor : (valor === null || valor === undefined ? [] : [valor]);
  const saida = [];
  for (const item of cru) {
    const t = String(item === null || item === undefined ? '' : item).trim();
    if (t && saida.indexOf(t) === -1) saida.push(t);
  }
  return saida;
}

/**
 * UMA LISTA QUE PODE VIR ESCRITA COM «/» (20/11/2026).
 *
 * A tradição de um professor com mais de uma escola da mesma modalidade é escrita no plano como
 * `«Francesa / Vaganova»` — é assim que `derivarPlano` a junta —, e o perfil a declara como
 * `['Francesa', 'Vaganova']`. Passada por `lista()`, a primeira forma dá UM item («francesa /
 * vaganova») e a segunda dá dois, e a comparação acusaria «a habilidade do professor foi
 * modificada» para sempre — o mesmo defeito de silêncio que esta sessão veio fechar, uma camada
 * abaixo. O separador é o mesmo que o escritor usa; uma segunda convenção divergiria da primeira.
 *
 * O que NÃO se parte: uma lista já declarada como lista. Só o texto com `/` é dividido, porque é
 * só ele que tem essa ambiguidade.
 */
function listaQueAceitaBarras(valor) {
  const cru = Array.isArray(valor) ? valor : (valor === null || valor === undefined ? [] : [valor]);
  const saida = [];
  for (const item of cru) {
    const texto = String(item === null || item === undefined ? '' : item);
    const partes = texto.indexOf('/') === -1 ? [texto] : texto.split('/');
    for (const parte of partes) {
      const t = parte.trim();
      if (t && saida.indexOf(t) === -1) saida.push(t);
    }
  }
  return saida;
}

/** A chave de comparação de um texto: sem espaços a mais e sem caixa. «Francesa» e «francesa» são
 *  a mesma tradição escrita por duas mãos; o documento e o perfil não têm de concordar na tecla. */
function chaveDeTexto(valor) {
  return String(valor === null || valor === undefined ? '' : valor).trim().toLowerCase();
}

/** Um retrato do dicionário — `{notacaoSha, vocabularioSha, versao?}` — ou `null` quando o lado
 *  não o declara. Um `null` cala a comparação: «não sei» não é «mudou», e é a mesma doutrina do
 *  `leu` da janela do exercício. */
function noPapelOuHoje(valor) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null;
  if (!valor.notacaoSha && !valor.vocabularioSha) return null;
  return valor;
}

/**
 * O QUE DIFERE ENTRE O QUE ESTÁ DECLARADO HOJE E O QUE O DOCUMENTO CARREGA.
 *
 * `hoje` e `documento` têm as mesmas três chaves, cada uma opcional:
 *   · `rubrica`    — a régua, como lista ORDENADA de níveis (a escala é a ordem);
 *   · `repertorio` — o conteúdo da Turma, como CONJUNTO (a ordem não mede nada);
 *   · `metodologia`— a tradição que o professor declara, como texto (ou lista de textos).
 *
 * Devolve `{ mudou: [{chave, rotulo}], igual: bool }`. `igual` é o que a tela lê para DESABILITAR
 * o botão: sem diferença provada, não há ciclo a atualizar — e é isso que impede o gasto à toa.
 */
function oQueMudou({ hoje, documento } = {}) {
  const deHoje = hoje && typeof hoje === 'object' ? hoje : {};
  const noPapel = documento && typeof documento === 'object' ? documento : {};
  const difere = {};

  /* A RÉGUA — ORDEM MANDA. Uma escala é uma ordem: «Satisfatório · Razoável · Em desenvolvimento»
   * não é o mesmo que «Em desenvolvimento · Razoável · Satisfatório», e comparar como conjunto
   * esconderia exactamente a mudança que interessa (alguém trocou a ordem dos níveis). */
  const reguaDeHoje = lista(deHoje.rubrica);
  const reguaNoPapel = lista(noPapel.rubrica);
  if (reguaDeHoje.length && reguaNoPapel.length) {
    const a = reguaDeHoje.map(chaveDeTexto).join('\u0000');
    const b = reguaNoPapel.map(chaveDeTexto).join('\u0000');
    if (a !== b) difere.regua = true;
  }

  /* O CONTEÚDO — CONJUNTO, e nos dois sentidos. Um exercício que a Turma passou a declarar e o
   * plano não carrega PESA; um que o plano ainda imprime e a Turma já não ensina também. É a mesma
   * régua que a cadeia usa para derivar (`diferencaDeConteudo`), e é de propósito que seja a mesma:
   * um botão que acende por um critério e uma derivação que age por outro dariam um clique que não
   * muda nada. */
  const conteudoDeHoje = lista(deHoje.repertorio);
  const conteudoNoPapel = lista(noPapel.repertorio);
  if (conteudoDeHoje.length && conteudoNoPapel.length) {
    const agora = conteudoDeHoje.map(chaveDeTexto);
    const papel = conteudoNoPapel.map(chaveDeTexto);
    const falta = agora.filter((t) => papel.indexOf(t) === -1);
    const sobra = papel.filter((t) => agora.indexOf(t) === -1);
    if (falta.length || sobra.length) difere.estilo = true;
  }

  /* A HABILIDADE — a tradição que o professor declara hoje contra a que o plano declara.
   *
   * A COMPARAÇÃO É DE CONJUNTO pelo mesmo motivo do conteúdo: um professor pode ensinar mais do que
   * uma tradição na mesma modalidade (`RAD / Vaganova`), e a ordem em que as escreveu não é um
   * facto pedagógico. */
  const tradicaoDeHoje = listaQueAceitaBarras(deHoje.metodologia);
  const tradicaoNoPapel = listaQueAceitaBarras(noPapel.metodologia);
  if (tradicaoDeHoje.length && tradicaoNoPapel.length) {
    const agora = tradicaoDeHoje.map(chaveDeTexto);
    const papel = tradicaoNoPapel.map(chaveDeTexto);
    if (agora.length !== papel.length || agora.some((t) => papel.indexOf(t) === -1)) {
      difere.habilidade = true;
    }
  }

  /* O DICIONÁRIO — o que o documento cita, e não o que o plano copia (20/11/2026).
   *
   * «Eu modifiquei o verbete plié, e não aparece no botão atualizar ciclo, isso não pode.» O
   * dicionário é o quarto item, e a razão de não ter estado aqui na primeira versão era de dado: o
   * corpo de um verbete não viaja no plano de ensino — o plano carrega o NOME do exercício. Sem
   * fotografia não havia contra o que comparar.
   *
   * A FOTOGRAFIA EXISTE, e é a âncora: o `.fipp` regista `notacao_sha` desde 28/10/2026, e diz com
   * que alfabeto o documento foi escrito. Do outro lado está a impressão de agora
   * (`impressaoDoDicionario`, em `verbete.js`), medida sobre o alfabeto E o vocabulário — porque um
   * nome novo ou uma tradição nova vivem no segundo, e comparar só o primeiro deixaria passar
   * metade dos casos.
   *
   * O QUE CONTA COMO MUDANÇA É O SHA, e não a versão. Uma gravação que não alterou um byte sobe a
   * versão e não muda o documento; acender o botão por causa dela seria gastar um ciclo para
   * reescrever o mesmo. A versão vai no retorno porque a tela a pode mostrar — não porque decida.
   */
  const dicionarioDeHoje = noPapelOuHoje(deHoje.dicionario);
  const dicionarioNoPapel = noPapelOuHoje(noPapel.dicionario);
  if (dicionarioDeHoje && dicionarioNoPapel) {
    const a = [dicionarioDeHoje.notacaoSha, dicionarioDeHoje.vocabularioSha].map((v) => String(v || ''));
    const b = [dicionarioNoPapel.notacaoSha, dicionarioNoPapel.vocabularioSha].map((v) => String(v || ''));
    /* Um lado sem o vocabulário (`null`) não é «diferente» do outro com ele: o vazio nunca acusa,
     * aqui como em todo o resto deste módulo. Só conta o par que os DOIS lados declaram. */
    const comparaveis = a.map((v, i) => (v && b[i] ? [v, b[i]] : null)).filter(Boolean);
    if (comparaveis.some(([x, y]) => x !== y)) difere.dicionario = true;
  }

  const mudou = ORDEM.filter((chave) => difere[chave])
    .map((chave) => ({ chave, rotulo: ROTULOS[chave] }));
  return { mudou, igual: mudou.length === 0 };
}

/** A frase do `title` do botão — uma linha, e só com o que mudou. Vazia quando nada mudou: quem
 *  chama decide o que dizer de um botão desabilitado, e não é esta função que sabe. */
function fraseDoQueMudou(mudou) {
  const lista = Array.isArray(mudou) ? mudou.filter((m) => m && m.rotulo) : [];
  return lista.map((m) => m.rotulo).join(' · ');
}

/**
 * O `title` DO BOTÃO EM LISTA (20/11/2026) — «Foi modificado:» e, embaixo, um item por linha.
 *
 * O pedido, na letra dela: «ao invés de colocar toda a string em uma linha só, você vai colocar ela
 * como uma lista para eu poder enxergar isso como uma lista». Uma linha com «A régua foi
 * modificada · A habilidade do professor foi modificada · O dicionário foi modificado» é uma frase
 * que ninguém lê até ao fim; três linhas com um ponto cada é uma lista.
 *
 * O separador de linha é `\n`, que o `title` do HTML renderiza como quebra desde sempre. O
 * marcador é o ponto médio que esta casa já usa nas listas de prosa — e não um `•`, que é de outra
 * tipografia e apareceria a negrito no meio de um `title`.
 *
 * Devolve `''` quando não há nada — quem chama decide o que dizer, como em `fraseDoQueMudou`.
 */
function listaDoQueMudou(mudou) {
  const itens = Array.isArray(mudou) ? mudou.filter((m) => m && m.chave) : [];
  if (!itens.length) return '';
  const linhas = itens.map((m) => '· ' + (ITENS[m.chave] || m.rotulo || m.chave));
  return 'Foi modificado:\n' + linhas.join('\n');
}

module.exports = {
  ORDEM,
  ROTULOS,
  ITENS,
  oQueMudou,
  fraseDoQueMudou,
  listaDoQueMudou,
};
