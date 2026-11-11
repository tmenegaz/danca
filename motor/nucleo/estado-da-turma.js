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

/**
 * UMA SALA RECEBE UMA TURMA (09/11/2026).
 *
 * PORQUE ISTO EXISTE. A Sala é o RITMO — dias, horas, duração, período. Duas Turmas na mesma
 * Sala seriam duas aulas a acontecer no mesmo horário, no mesmo lugar: o cadastro diria que é
 * possível, e a escola não tem duas salas físicas com o mesmo nome. Até aqui nada impedia —
 * medido: duas curadorias activas com a mesma Sala respondiam `201`.
 *
 * A REGRA É DE OCUPAÇÃO, e não de exclusividade de professor ou modalidade: o que não se partilha
 * é a SALA (o tempo e o lugar). É a mesma forma da regra das alunas (`alunasComprometidas`):
 * comparar o que já existe com o que se está a gravar, e dizer onde está o conflito.
 *
 * `excetoId` é a curadoria que se está a editar (ou a versão de onde se deriva): ela não conta
 * como ocupante da própria Sala, senão editar a tradição de uma Turma seria recusado por ela
 * mesma.
 *
 * Devolve um `Map` nome → { professor, modalidade, id } — a primeira ocupante, que é a que a
 * mensagem nomeia. `null` quando a lista não se conseguiu ler: quem chama trata como «tudo
 * ocupado»? NÃO — ao contrário do estado da Sala, aqui a leitura falhada não pode inventar
 * ocupação (recusaria um acto legítimo por um erro de leitura). Devolve `null`, e quem chama
 * decide: a rota deixa passar e diz que não conferiu.
 */
function salasOcupadas(curadorias, { excetoId } = {}) {
  if (!Array.isArray(curadorias)) return null;
  const ocupadas = new Map();
  for (const c of curadorias) {
    if (!c || typeof c !== 'object' || c.substituidaPor) continue;
    /* A DIREÇÃO ENCERRADA NÃO OCUPA A SALA (09/11/2026, medido). O desligamento de um professor
     * não apaga a direção que ele deu: **encerra-a com data** (`encerrada_em`). Uma sala cuja
     * Turma saiu com o professor está VAGA — e sem esta linha a escola não podia nomear outra
     * direção para ela: a nova Turma era recusada por uma que já não existe. Foi o que a prova do
     * desligamento apanhou, e é a mesma distinção que o `enquadramento` já faz
     * (`!substituidaPor && !encerrada_em`). */
    if (c.encerrada_em) continue;
    if (excetoId && String(c.id) === String(excetoId)) continue;
    for (const nome of turmasDe(c)) {
      if (!ocupadas.has(nome)) {
        ocupadas.set(nome, {
          id: c.id || null,
          professor: String(c.professor || '') || null,
          modalidade: String(c.modalidade || '') || null,
        });
      }
    }
  }
  return ocupadas;
}

/** As Salas de uma lista que NENHUMA Turma activa declara — a lista do que está livre. */
function salasLivres(salas, curadorias, { excetoId } = {}) {
  const ocupadas = salasOcupadas(curadorias, { excetoId });
  const nomes = (Array.isArray(salas) ? salas : [])
    .filter((t) => t && !t.substituidaPor && String(t.nome || '').trim())
    .map((t) => String(t.nome).trim());
  if (ocupadas === null) return nomes;
  return nomes.filter((n) => !ocupadas.has(n));
}

/**
 * A FRASE DA RECUSA — uma só, para as duas rotas (criar e derivar) e para a tela.
 *
 * Diz QUEM ocupa a Sala, e diz quais estão livres: sem a segunda metade, o professor ficaria a
 * saber que não pode e sem saber para onde pode. Sem Salas livres, diz isso mesmo — e que o
 * caminho é criar uma (aba Salas) ou liberar uma.
 */
function motivoDaSalaOcupada(sala, ocupante, livres) {
  const s = String(sala || 'a sala');
  const quem = ocupante && ocupante.professor
    ? 'a Turma de ' + ocupante.professor + (ocupante.modalidade ? ' em ' + ocupante.modalidade : '')
    : 'outra Turma';
  const lista = Array.isArray(livres) ? livres : [];
  const fim = lista.length
    ? ' As salas livres são: ' + lista.join(', ') + '.'
    : ' Não há nenhuma outra sala livre nesta escola — crie uma (aba Salas) ou libere uma '
      + '(mude a Turma que a ocupa para outra sala).';
  return 'a sala «' + s + '» já está ocupada por ' + quem + '. Uma sala recebe UMA Turma por '
    + 'vez: duas Turmas na mesma sala são duas aulas no mesmo horário, no mesmo lugar.' + fim;
}

module.exports = {
  turmasDe,
  turmasCuradas,
  estadoDaTurma,
  podeEditarNoLugar,
  motivoDaRecusa,
  salasOcupadas,
  salasLivres,
  motivoDaSalaOcupada,
  nomeDaTurma,
  rotuloDaTurma,
  mesmaTurmaPorElenco,
  motivoDoElencoRepetido,
};

/* ==========================================================================================
 * COMO SE CHAMA UMA TURMA — E PORQUE NÃO É O NOME DO PROFESSOR (11/11/2026)
 * ==========================================================================================
 *
 * O DEFEITO, na letra da dona do produto: «a turma na listagem e a construção do index da turma e
 * também da turma em si […] está sendo montada com o nome do professor. Eu acho que a turma ela
 * deveria ter um nome. […] no mundo real é mais comum a gente dizer que a turma ela é do elenco do
 * que a gente dizer que a turma ela é do professor. Porque o professor ele pode mudar e a turma ela
 * é mais presente, ela se preserva por mais tempo. […] é o elenco que é a turma, que é o conjunto
 * de meninas que dá a razão de ser para o termo turma e não o professor.»
 *
 * E o caso que mostra o defeito: «se falar assim, é a turma de ballet do professor Pedro, tá, mas
 * qual delas? É a iniciante, a intermediária, a avançado?» — o nome do professor não distingue
 * nada justamente quando há mais do que uma.
 *
 * A ORDEM, para o nome dizer o que fica:
 *
 *   1. o ELENCO — é o corpo que dá razão ao termo, e é ele que sobrevive à troca de direção;
 *   2. a SALA — quando a Turma ainda não escolheu elenco, o nome que existe é o da sala;
 *   3. a MODALIDADE — e é o caso de uma Turma ainda por completar.
 *
 * O PROFESSOR NÃO É O NOME — ele é o FACTOR de quem ensina hoje, e a listagem diz o nome dele ao
 * lado, junto com a modalidade, o nível e a sala. Ele muda (é para isso que existe a derivação); o
 * nome da Turma não pode mudar com ele.
 */
function nomeDaTurma(c, { elencos } = {}) {
  if (!c || typeof c !== 'object') return '';
  const lista = Array.isArray(elencos) ? elencos : [];
  const escolhido = c.linhaDeBase
    ? lista.find((e) => e && String(e.id) === String(c.linhaDeBase))
    : null;
  const doElenco = escolhido ? String(escolhido.nome || '').trim() : String(c.linhaDeBaseNome || '').trim();
  if (doElenco) return doElenco;
  return turmasDe(c)[0] || String(c.modalidade || '').trim();
}

/**
 * O NOME COMPOSTO — o que a dona do produto pediu: «um nome composto […] que tenha elenco, que
 * seja feito por elenco, modalidade e professor. […] inclusive eu acrescentaria o nível».
 *
 * Serve para onde cabe UMA linha e o nome curto não chega: o histórico do ajuste, a frase de uma
 * recusa, o título de um documento. Na LISTAGEM não se usa — lá o nome é curto em cima e o
 * composto se lê em baixo, que é como as outras listas funcionam.
 *
 * O que entra e porquê: o ELENCO (a identidade), a MODALIDADE (qual aula), o NÍVEL (qual degrau —
 * é ele que distingue dois elencos na mesma modalidade) e o PROFESSOR (quem ensina hoje). O que
 * falta não vira palavra: some, para a frase não dizer «sem isto» três vezes.
 */
function rotuloDaTurma(c, { elencos, professor, modalidade, nivel } = {}) {
  const partes = [
    nomeDaTurma(c, { elencos }),
    modalidade || (c && c.modalidade) || '',
    nivel || (c && (c.nivelReferencia || c.nivel || c.grau)) || '',
    professor || (c && c.professor) || '',
  ].map((x) => String(x == null ? '' : x).trim());
  const vistos = [];
  for (const p of partes) if (p && vistos.indexOf(p) === -1) vistos.push(p);
  return vistos.join(' · ');
}

/**
 * O MESMO ELENCO, NA MESMA MODALIDADE E NO MESMO NÍVEL — a recusa que ela pediu, na letra:
 * «não dá para ter o mesmo elenco ocupando duas vezes o mesmo nível».
 *
 * PORQUE É PRECISO UMA GUARDA, se o sistema já recusa duas Turmas na mesma sala e a mesma aluna em
 * duas salas da mesma modalidade. Porque os dois casos que restam passam por essas redes: um elenco
 * SEM alunas (recém-criado) não colide com ninguém, e um elenco em DUAS SALAS da mesma modalidade
 * só é apanhado pela regra da aluna — que é do dado, não da Turma. Sem esta guarda, a mesma
 * direção pode aparecer duas vezes na lista com o mesmo conjunto de meninas: duas Turmas iguais, e
 * o professor sem saber qual é a de hoje.
 *
 * `excetoId` é a Turma que se está a gravar (ela não colide consigo mesma). `null` na lista
 * (leitura falhada) devolve `null`: não se inventa colisão por erro de leitura.
 */
function mesmaTurmaPorElenco(curadorias, { elenco, modalidade, nivel, excetoId } = {}) {
  if (!Array.isArray(curadorias)) return null;
  const idElenco = String(elenco || '').trim();
  if (!idElenco) return null;                     // sem elenco não há o que comparar
  const mod = String(modalidade || '').trim();
  const grau = String(nivel || '').trim();
  for (const c of curadorias) {
    if (!c || typeof c !== 'object' || c.substituidaPor || c.encerrada_em) continue;
    if (excetoId && String(c.id) === String(excetoId)) continue;
    if (String(c.linhaDeBase || '').trim() !== idElenco) continue;
    if (mod && String(c.modalidade || '').trim() !== mod) continue;
    const oGrau = String(c.nivelReferencia || c.nivel || c.grau || '').trim();
    if (grau && oGrau && oGrau !== grau) continue;
    return c;
  }
  return null;
}

/** A frase da recusa do elenco repetido — e ela diz QUAL é a outra Turma, e onde. */
function motivoDoElencoRepetido(ocupante, { nomeDoElenco, elenco, modalidade, nivel } = {}) {
  const o = ocupante || {};
  const sala = (turmasDe(o) || [])[0] || '';
  const onde = [o.modalidade, o.nivelReferencia || o.nivel, sala]
    .map((x) => String(x || '').trim()).filter(Boolean).join(' · ');
  const nome = String(nomeDoElenco || o.linhaDeBaseNome || elenco || '').trim();
  return 'o elenco «' + nome + '» já é a Turma' + (onde ? ' de ' + onde : '')
    + (o.professor ? ' (professor ' + o.professor + ')' : '')
    + '. O mesmo elenco não pode ocupar duas vezes a mesma modalidade e o mesmo nível: seriam '
    + 'duas Turmas iguais, e o plano deixaria de saber de qual ler. Ajuste a que já existe'
    + (sala ? ' — a sala dela é «' + sala + '»' : '') + ' — ou escolha outro elenco.';
}
