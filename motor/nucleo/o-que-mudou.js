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
const ORDEM = ['regua', 'estilo', 'habilidade'];

/* AS FRASES SÃO AS DELA, no plural do sistema: «a régua foi modificada», «a habilidade do professor
 * foi modificada». O rótulo é a frase inteira, porque é ela que vai no `title` do botão — e um
 * rótulo curto («régua») obrigaria a tela a compor a frase, que é a segunda cópia que se evita. */
const ROTULOS = {
  regua: 'A régua foi modificada',
  estilo: 'O conteúdo do Estilo foi modificado',
  habilidade: 'A habilidade do professor foi modificada',
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

/** A chave de comparação de um texto: sem espaços a mais e sem caixa. «Francesa» e «francesa» são
 *  a mesma tradição escrita por duas mãos; o documento e o perfil não têm de concordar na tecla. */
function chaveDeTexto(valor) {
  return String(valor === null || valor === undefined ? '' : valor).trim().toLowerCase();
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
  const tradicaoDeHoje = lista(deHoje.metodologia);
  const tradicaoNoPapel = lista(noPapel.metodologia);
  if (tradicaoDeHoje.length && tradicaoNoPapel.length) {
    const agora = tradicaoDeHoje.map(chaveDeTexto);
    const papel = tradicaoNoPapel.map(chaveDeTexto);
    if (agora.length !== papel.length || agora.some((t) => papel.indexOf(t) === -1)) {
      difere.habilidade = true;
    }
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

module.exports = {
  ORDEM,
  ROTULOS,
  oQueMudou,
  fraseDoQueMudou,
};
