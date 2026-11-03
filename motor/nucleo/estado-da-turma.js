/**
 * estado-da-turma.js — LIVRE, CURADA OU VINCULADA (03/11/2026).
 *
 * O DEFEITO QUE ESTE MÓDULO CORRIGE, medido a partir do relato dela: «ao editar a turma "Balé
 * Nível 1" mesmo após a curadoria já estar criada e vinculada, o sistema permite edições livres
 * (indicando no perfil do professor que ele está vinculado, mas mantendo a turma classificada como
 * ‘livre’).»
 *
 * A ASSIMETRIA É O DEFEITO, e não a mensagem. O PROFESSOR já tinha três estados
 * (`professorCurado` + `professorVinculadoA`): livre → curado (está numa curadoria, e o nome dele
 * já vai nos documentos dela) → vinculado (já tem plano). A TURMA tinha **dois**: sem plano está
 * livre. Ou seja, uma turma que já compõe uma curadoria activa continuava a poder ser **renomeada**
 * — e a curadoria guarda o NOME da turma.
 *
 * A CONSEQUÊNCIA, dita por inteiro: renomear a turma não dá erro nenhum. A curadoria passa a
 * apontar para um nome que já não existe, o enquadramento dela desaparece da listagem
 * (`curadoriaDaTurma` devolve `null`), e o plano daquele professor deixa de encontrar a turma.
 * **Uma ligação que se parte em silêncio é o pior modo de falha deste sistema** — é a mesma
 * família do `undefined` numa comparação e da marca de `descontinuada` que deixava de acender.
 *
 * A REGRA, agora igual nos dois lados:
 *
 *   | estado     | o que é                                          | o que se pode fazer      |
 *   |:-----------|:-------------------------------------------------|:-------------------------|
 *   | `livre`    | nem em curadoria, nem em plano                    | editar no lugar          |
 *   | `curada`   | está numa curadoria ACTIVA, ainda sem plano       | DERIVAR (elo novo)       |
 *   | `vinculada`| já tem plano de ensino                            | DERIVAR (elo novo)       |
 *
 * **Derivar preserva a ligação**: o elo novo tem o MESMO NOME (`turma-derivar` faz
 * `nova.nome = anterior.nome`), e é por isso que derivar é a resposta certa — o que muda é o
 * ritmo, e o nome que a curadoria referencia fica. Renomear é que não se pode, e para corrigir um
 * nome a escola remove a curadoria (o que é permitido enquanto não há plano) e volta a criá-la.
 *
 * `null` (não deu para ler) conta como preso, pela mesma razão do professor: na dúvida, não se
 * mexe. É o lado seguro, e é o que já fazia `turmaVinculadaA`.
 */

/** As turmas de uma curadoria, nos dois formatos (`turma` — um nome — e `turmas` — uma lista). */
function turmasDe(c) {
  if (!c || typeof c !== 'object') return [];
  if (Array.isArray(c.turmas) && c.turmas.length) {
    return c.turmas.map((x) => String(x == null ? '' : x).trim()).filter(Boolean);
  }
  const uma = String(c.turma || '').trim();
  return uma ? [uma] : [];
}

/**
 * OS NOMES DAS TURMAS QUE ESTÃO NUMA CURADORIA ACTIVA.
 *
 * Activa = não substituída. Uma curadoria derivada desce para o histórico com `substituidaPor`, e
 * é a versão nova que manda — a antiga não prende nada por si. Mas o elo antigo não se apaga: ele
 * continua a ser a memória de que aquela turma esteve curada naquela data.
 *
 * `null` quando a lista de curadorias não se conseguiu ler. Quem chama trata `null` como «tudo
 * preso», pela mesma regra do `turmaVinculadaA`.
 */
function turmasCuradas(curadorias) {
  if (!Array.isArray(curadorias)) return null;
  const nomes = new Set();
  for (const c of curadorias) {
    if (!c || typeof c !== 'object' || c.substituidaPor) continue;
    for (const nome of turmasDe(c)) nomes.add(nome);
  }
  return nomes;
}

/**
 * O ESTADO DE UMA TURMA — `livre`, `curada` ou `vinculada`.
 *
 * `turmasComPlano` é o conjunto dos nomes que já entraram num plano de ensino; `null` (não deu
 * para ler) conta como vinculada. A ordem das perguntas é a do que é irreversível: o plano primeiro
 * (não se desfaz), a curadoria depois (desfaz-se removendo-a).
 */
function estadoDaTurma(turma, { turmasComPlano, curadorias } = {}) {
  const nome = String((turma && turma.nome) || turma || '').trim();
  if (!nome) return 'livre';
  if (turmasComPlano === null || turmasComPlano === undefined) return 'vinculada';
  if (turmasComPlano.has ? turmasComPlano.has(nome) : false) return 'vinculada';
  const curadas = turmasCuradas(curadorias);
  if (curadas === null) return 'vinculada';
  return curadas.has(nome) ? 'curada' : 'livre';
}

/** Se o estado impede editar no lugar. `curada` e `vinculada` derivam; `livre` edita. */
function podeEditarNoLugar(estado) {
  return estado === 'livre';
}

/**
 * A FRASE DA RECUSA, uma só para as duas rotas e para a tela.
 *
 * O motivo muda com o estado, e a diferença importa: `vinculada` é definitivo («o plano já cita»);
 * `curada` é reversível («a curadoria cita — e enquanto não houver plano, a curadoria pode ser
 * removida»). Dizer a mesma frase nos dois casos mandaria a escola procurar um plano que não existe.
 */
function motivoDaRecusa(estado, nome) {
  const t = String(nome || 'a turma');
  if (estado === 'vinculada') {
    return 'a turma «' + t + '» já tem um plano de ensino — ela não se edita no lugar: derive uma '
      + 'versão nova, que passa a valer a partir de uma data e deixa a anterior como referência do '
      + 'passado.';
  }
  if (estado === 'curada') {
    return 'a turma «' + t + '» já está numa curadoria activa — ela não se edita no lugar, porque a '
      + 'curadoria guarda o NOME dela e a ligação partir-se-ia em silêncio. Derive uma versão nova '
      + '(o nome fica, o ritmo passa a valer a partir de uma data). Para corrigir o nome, remova '
      + 'primeiro a curadoria — enquanto não houver plano de ensino, isso é permitido.';
  }
  return '';
}

module.exports = {
  turmasDe,
  turmasCuradas,
  estadoDaTurma,
  podeEditarNoLugar,
  motivoDaRecusa,
};
