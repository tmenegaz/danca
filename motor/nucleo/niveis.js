/**
 * niveis.js — O NÍVEL TEM A FORMA DA TRADIÇÃO, E VIVE NA CURADORIA (03/11/2026).
 *
 * A DECISÃO DELA, com as palavras dela: «os níveis são definidos no momento em que a turma
 * nasce, associando-se ao conhecimento do professor e à tradição metodológica adotada. Para
 * tradições estruturadas por números (como a escola inglesa RAD), a turma contará com um seletor
 * de número para indicar o nível. Para outras tradições (como Vaganova ou geral), a estrutura
 * segue por graus/fases.»
 *
 * O NOME DESTE FICHEIRO MUDOU NO MESMO DIA, e a segunda decisão dela é a razão: o nível deixou de
 * ser da TURMA e passou a ser da CURADORIA — a turma é o ritmo e o calendário; o enquadramento
 * pedagógico (professor, modalidade, tradição e nível) é da curadoria, para a escola poder mover
 * uma turma de nível sem destruir a estrutura dela. Um ficheiro chamado `niveis-da-turma` mentiria
 * a partir daí, e o nome de um módulo é a primeira coisa que se lê.
 *
 * O QUE MUDA NA REGRA: nada. A forma do nível continua a vir da tradição (`tradicoes.json` →
 * `estruturaDeNiveis`), o rótulo continua a ser composto («Grade 3», «Intermediário 2»), e o texto
 * antigo de um registo antigo continua a ler-se. O que muda é ONDE o par `grau`+`nivel` é gravado:
 * na curadoria, e não no cadastro da turma.
 *
 * O QUE ESTE MÓDULO **NÃO** INVENTA. O «N» de «Nível 1 a N» é de cada escola: uma escola de
 * bairro tem três níveis, um conservatório tem doze. Escrever um limite aqui seria escolher por
 * quem ensina — e o dia em que a escola tivesse um nível a mais, a tela recusava-o. Por isso:
 *
 *   · a tradição NUMERADA (a RAD) recebe as opções que o **catálogo** já declara em
 *     `progressao.json` (Grade 1…8, Vocational…). Não é uma lista nova: é a que existe;
 *   · a tradição por GRAUS recebe do dado apenas os **nomes dos graus** (Básico, Intermediário,
 *     Avançado — declarados pela pesquisadora), e o nível é um número que se escreve.
 *
 * E o rótulo que sai daqui — «Grade 3», «Básico 2» — é o que o plano de ensino e o PO imprimem
 * em `nivelReferencia`. Ele é **composto**, e não escrito à mão: é a mesma regra do «lê-se» da
 * notação — o que se pode derivar do dado não se pede duas vezes.
 *
 * A COMPATIBILIDADE FICA DITA: um registo antigo que só tem `nivelReferencia` (o texto livre de
 * antes, gravado na turma) continua a ler-se, e o texto dele **não** é reescrito nem apagado por
 * este módulo. Quem lê o nível efetivo de uma turma deve ler o da curadoria e, quando não há,
 * o da turma — é o que faz `nivelEfetivo`, em `motor/nucleo/enquadramento.js`.
 */

/** A estrutura de uma tradição: a declarada em `tradicoes.json` ou o `padrao` (o «geral»). */
function estruturaDaTradicao(tradicoes, tradicao) {
  const bloco = (tradicoes && tradicoes.estruturaDeNiveis) || {};
  const nome = String(tradicao || '').trim();
  const escolhida = (nome && bloco[nome]) || bloco.padrao || null;
  if (!escolhida) return { tipo: 'grau-e-nivel', graus: [], rotulo: 'Nível' };
  return {
    tipo: escolhida.tipo === 'numerada' ? 'numerada' : 'grau-e-nivel',
    graus: Array.isArray(escolhida.graus) ? escolhida.graus.slice() : [],
    rotulo: String(escolhida.rotulo || 'Nível'),
  };
}

/** Se a tradição numera os níveis em fila (a RAD), e não em graus. */
function ehNumerada(estrutura) {
  return Boolean(estrutura) && estrutura.tipo === 'numerada';
}

/**
 * O RÓTULO DO NÍVEL — o que o plano imprime.
 *
 * A ordem das tentativas é a ordem da verdade: o que está declarado (grau + nível, ou nível
 * sozinho na tradição numerada) compõe-se; e só quando não há nada declarado é que se cai no
 * texto antigo. O contrário — o texto antigo a vencer — deixaria a turma a dizer «Grade 3» depois
 * de alguém a ter mudado para «Básico 2».
 */
function rotuloDoNivel(estrutura, { grau, nivel, nivelReferencia } = {}) {
  const g = String(grau || '').trim();
  const n = String(nivel || '').trim();
  const e = estrutura || { tipo: 'grau-e-nivel', graus: [], rotulo: 'Nível' };
  if (n) {
    if (ehNumerada(e)) return (e.rotulo + ' ' + n).trim();
    if (g) return (g + ' ' + n).trim();
    return (e.rotulo + ' ' + n).trim();
  }
  if (g) return g;
  return String(nivelReferencia || '').trim();
}

/**
 * NORMALIZA O QUE A TELA MANDA, e devolve também o `nivelReferencia` composto.
 *
 * Recebe `programaReferencia` no corpo porque é a TRADIÇÃO que decide a forma — e no corpo de
 * uma CURADORIA o campo chama-se `tradicao`. O chamador resolve isso; este módulo não sabe o
 * nome do campo em cada formulário, e não deve saber.
 *
 * UM GRAU QUE A TRADIÇÃO NÃO DECLARA É DESCARTADO, e não recusado: a tela já só oferece os
 * graus daquela tradição, e um valor que não os conhece veio de um registo antigo ou de uma
 * tradição que mudou. Descartá-lo deixa a turma legível (o nível fica); recusá-lo impediria de
 * gravar uma turma por causa de um campo acessório.
 */
function normalizarNivel(tradicoes, corpo) {
  const c = corpo && typeof corpo === 'object' ? corpo : {};
  const estrutura = estruturaDaTradicao(tradicoes, c.programaReferencia);
  const bruto = c.grau == null ? '' : String(c.grau).trim();
  const grau = !ehNumerada(estrutura) && estrutura.graus.indexOf(bruto) !== -1 ? bruto : '';
  const numero = String(c.nivel == null ? '' : c.nivel).trim();
  // Só dígitos: um nível é um número de ordem. «3º» ou «terceiro» não são — e aceitá-los faria
  // da ordenação das turmas uma comparação de texto.
  const nivel = /^[0-9]+$/.test(numero) && Number(numero) > 0 ? String(Number(numero)) : '';
  return {
    estrutura,
    grau,
    nivel,
    nivelReferencia: rotuloDoNivel(estrutura, { grau, nivel, nivelReferencia: c.nivelReferencia }),
  };
}

module.exports = {
  estruturaDaTradicao,
  ehNumerada,
  rotuloDoNivel,
  normalizarNivel,
};
