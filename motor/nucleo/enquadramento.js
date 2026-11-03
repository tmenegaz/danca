/**
 * enquadramento.js — A TURMA É O RITMO, A CURADORIA É O ENSINO (03/11/2026).
 *
 * A DECISÃO DELA, e a razão é de operação, não de arrumação: «a turma deixa de ser carregada com
 * definições rígidas de nível pedagógico»; o cadastro dela fica «estritamente no que lhe é
 * inerente (dias, horários e rotina)», e a inteligência de ensino «flui inteiramente para a camada
 * de curadoria». O que se ganha, dito por ela: **mobilidade** — mover uma turma de nível não
 * obriga a destruir e recriar a estrutura operacional, e «a história operacional da turma
 * (calendário, frequência, lançamentos) descola-se das mudanças de enquadramento de nível».
 *
 * O QUE FICA ONDE:
 *
 *   | Turma (ritmo)            | Curadoria (ensino)                     |
 *   |:-------------------------|:---------------------------------------|
 *   | dias, horários, duração  | professor habilitado                   |
 *   | frequência, período      | modalidade e tradição de referência    |
 *   | rubrica, conteúdos       | nível (`grau` + `nivel`)               |
 *   | alunas (vínculo físico)  | alunas (o recorte daquela entrega)     |
 *
 * PORQUE ISTO PRECISA DE UM MÓDULO, E NÃO DE UMA CONVENÇÃO. Há **duas** leituras que ficaram
 * ambíguas no dia em que os campos mudaram de casa, e as duas têm resposta errada se cada sítio
 * improvisar:
 *
 *   1. **Qual é o enquadramento de uma turma?** — a curadoria que a referencia. Uma turma pode
 *      não ter nenhuma (acabou de nascer), e aí não há enquadramento: não se inventa um.
 *   2. **Qual é o nível efetivo?** — o da curadoria; e, quando ela não o declara, o texto antigo
 *      que ficou gravado na turma antes de a decisão existir. **O antigo não se apaga** (P-03/
 *      P-04): um registo de Outubro não é reescrito por uma decisão de Novembro.
 *
 * A terceira leitura — «esta turma ainda tem quem a ensine?» — já existia (`perfil-do-professor`),
 * e passou a depender desta: a modalidade e o professor deixaram de estar na turma, e estão na
 * curadoria. Sem este módulo, a marca de `descontinuada` passaria a ler campos que já não existem
 * — e uma guarda que lê `undefined` **não falha**: deixa de marcar, em silêncio.
 *
 * Tudo aqui é puro: não lê ficheiros, não chama a rede, e não sabe o que é um KV.
 */

const { modalidadesDoPerfil, estadoDaHabilitacao } = require('./perfil-do-professor.js');
const { rotuloDoNivel } = require('./niveis.js');

/** As turmas de uma curadoria, à prova do formato novo (`turma`) e do antigo (`turmas`). */
function turmasDaCuradoria(c) {
  if (!c || typeof c !== 'object') return [];
  if (c.turma) return [String(c.turma).trim()].filter(Boolean);
  if (Array.isArray(c.turmas)) return c.turmas.map((x) => String(x || '').trim()).filter(Boolean);
  return [];
}

/**
 * A CURADORIA QUE ENQUADRA UMA TURMA — pelo NOME, que é o que a curadoria guarda.
 *
 * O NOME, e não o id: a turma pode ter sido derivada (id novo, mesmo nome), e a curadoria aponta
 * para o nome de propósito — é assim que o plano dela continua a encontrar a turma depois de a
 * escola lhe ter ajustado o ritmo.
 *
 * Vigentes primeiro: uma curadoria substituída é passado, e o enquadramento de hoje é o da que
 * vale. Se só houver substituída, ela é devolvida — é a única resposta que existe, e dizer «não
 * há» quando há uma seria perder a informação.
 */
function curadoriaDaTurma(curadorias, nomeDaTurma) {
  const nome = String(nomeDaTurma || '').trim();
  if (!nome) return null;
  const lista = (Array.isArray(curadorias) ? curadorias : [])
    .filter((c) => c && typeof c === 'object' && turmasDaCuradoria(c).indexOf(nome) !== -1);
  if (!lista.length) return null;
  return lista.find((c) => !c.substituidaPor) || lista[0];
}

/**
 * O NÍVEL EFETIVO — o da curadoria, e o da turma como memória do que já foi declarado.
 *
 * A ORDEM IMPORTA E É A DA VERDADE. O que a curadoria declara hoje vence; o que a turma guardou
 * de antes é o que havia. O contrário — o antigo a vencer — faria a escola mudar o nível na
 * curadoria e continuar a ver o velho.
 *
 * Devolve `{ grau, nivel, rotulo, de }`, onde `de` diz **de onde veio** — `'curadoria'`,
 * `'turma'` ou `'nenhum'`. Quem mostra o rótulo diz a origem quando ela não é a esperada: um
 * nível que veio da turma é um nível que ninguém reviu desde a mudança de casa.
 */
function nivelEfetivo(turma, curadoria) {
  const t = turma && typeof turma === 'object' ? turma : {};
  const c = curadoria && typeof curadoria === 'object' ? curadoria : null;

  if (c && (String(c.nivel || '').trim() || String(c.grau || '').trim())) {
    const grau = String(c.grau || '').trim();
    const nivel = String(c.nivel || '').trim();
    return {
      grau,
      nivel,
      rotulo: String(c.nivelReferencia || '').trim() || rotuloDoNivel(null, { grau, nivel }),
      de: 'curadoria',
    };
  }
  // O TEXTO ANTIGO DA TURMA — leitura, nunca escrita. `programaReferencia` e `nivelReferencia`
  // são os campos que a turma tinha antes de 03/11/2026; ver `normalizarTurma`.
  const rotulo = String(t.nivelReferencia || '').trim();
  if (rotulo) {
    return {
      grau: String(t.grau || '').trim(),
      nivel: String(t.nivel || '').trim(),
      rotulo,
      de: 'turma',
    };
  }
  if (c && String(c.nivelReferencia || '').trim()) {
    return { grau: '', nivel: '', rotulo: String(c.nivelReferencia).trim(), de: 'curadoria' };
  }
  return { grau: '', nivel: '', rotulo: '', de: 'nenhum' };
}

/**
 * A MODALIDADE E O PROFESSOR DE UMA TURMA — do enquadramento, e da memória como recurso.
 *
 * É esta função que a marca de `descontinuada` passou a usar. Antes da mudança de casa ela lia
 * `turma.modalidade` e `turma.professor`; esses campos deixaram de existir no cadastro novo, e
 * uma leitura directa passaria a devolver `undefined` — sem erro, e sem marcar nada.
 */
function enquadramentoDaTurma(turma, curadorias) {
  const t = turma && typeof turma === 'object' ? turma : {};
  const c = curadoriaDaTurma(curadorias, t.nome);
  if (c) {
    return {
      professor: String(c.professor || '').trim(),
      modalidade: String(c.modalidade || '').trim(),
      tradicao: String(c.tradicao || '').trim(),
      curadoria: c,
      de: 'curadoria',
    };
  }
  // A MEMÓRIA: uma turma cadastrada entre 03/11 e esta decisão tem os campos no registo dela.
  // Devolvê-los é mais honesto do que dizer «esta turma não tem modalidade» — mas o `de` diz
  // que veio de lá, para quem mostra o dado poder dizê-lo.
  return {
    professor: String(t.professor || '').trim(),
    modalidade: String(t.modalidade || '').trim(),
    tradicao: String(t.programaReferencia || '').trim(),
    curadoria: null,
    de: 'turma',
  };
}

/**
 * AS TURMAS QUE FICARAM SEM QUEM AS ENSINE — agora lidas pelo ENQUADRAMENTO.
 *
 * A regra dela não mudou: a turma **não se apaga**, fica marcada. O que mudou é de onde vem a
 * pergunta: a modalidade e o professor estão na curadoria, e é lá que se lê.
 *
 * Três condições, e todas importam — as mesmas de antes, com a fonte nova:
 *   · a turma tem enquadramento com modalidade (sem ela não há o que comparar);
 *   · o professor do enquadramento é o dono do perfil que está a ser gravado;
 *   · e o perfil JÁ EXISTE e não tem essa modalidade.
 *
 * Devolve a lista de `{ id, nome, modalidade, motivo }`.
 */
function turmasSemHabilitacao(turmas, curadorias, perfil, { professor } = {}) {
  const lista = Array.isArray(turmas) ? turmas : [];
  const alvo = String(professor || (perfil && perfil.slug) || '').trim();
  const saida = [];
  for (const t of lista) {
    if (!t || typeof t !== 'object' || t.substituidaPor) continue;
    const enq = enquadramentoDaTurma(t, curadorias);
    if (!enq.modalidade) continue;
    if (alvo && enq.professor && enq.professor !== alvo) continue;
    if (estadoDaHabilitacao(perfil, enq.modalidade) !== 'perdeu') continue;
    saida.push({
      id: String(t.id || ''),
      nome: String(t.nome || ''),
      modalidade: enq.modalidade,
      motivo: 'o professor já não declara «' + enq.modalidade + '» nas habilitações dele',
    });
  }
  // O NOME BONITO DO MOTIVO, composto aqui e não em quem chama: a lista é a mesma em três
  // sítios (a rota, a marca e a prova), e três redacções dariam três frases para o mesmo facto.
  const { nomeDaModalidade } = require('./perfil-do-professor.js');
  return saida.map((x) => Object.assign({}, x, {
    motivo: 'o professor já não declara «' + nomeDaModalidade(x.modalidade) + '» nas habilitações dele',
  }));
}

/**
 * O RESUMO DO ENQUADRAMENTO, para a listagem de turmas — «quem ensina o quê, em que nível».
 *
 * Uma turma sem curadoria diz «sem curadoria atribuída», e não um vazio: a ausência é um estado
 * operacional (a turma existe, o ensino ainda não foi atribuído), e um espaço em branco lê-se
 * como esquecimento.
 */
function resumoDoEnquadramento(turma, curadorias) {
  const enq = enquadramentoDaTurma(turma, curadorias);
  const nivel = nivelEfetivo(turma, enq.curadoria);
  const partes = [];
  if (enq.modalidade) partes.push(enq.modalidade);
  if (enq.tradicao) partes.push(enq.tradicao);
  if (nivel.rotulo) partes.push(nivel.rotulo);
  /* A TURMA SEM CURADORIA DIZ QUE NÃO TEM — E DIZ O NÍVEL QUE GUARDOU, SE GUARDOU.
   *
   * Mostrar só «Vaganova 4» esconderia que não há ensino atribuído; mostrar só «sem curadoria
   * atribuída» esconderia o nível. As duas coisas são verdade, e a frase diz as duas — com a
   * origem do nível, porque um nível que veio da memória é um nível que ninguém reviu desde a
   * mudança de casa (03/11/2026).
   *
   * A ORDEM É A DA LEITURA: primeiro o estado (há ou não curadoria), depois o que ele traz. */
  let texto;
  if (!enq.curadoria) {
    const memoria = nivel.rotulo ? ' · ' + nivel.rotulo + ' (da turma)' : '';
    texto = 'sem curadoria atribuída' + memoria;
  } else if (partes.length) {
    texto = partes.join(' · ');
  } else {
    texto = 'curadoria sem modalidade declarada';
  }
  return {
    professor: enq.professor,
    modalidade: enq.modalidade,
    tradicao: enq.tradicao,
    nivel,
    texto,
    temCuradoria: Boolean(enq.curadoria),
  };
}

module.exports = {
  turmasDaCuradoria,
  curadoriaDaTurma,
  nivelEfetivo,
  enquadramentoDaTurma,
  turmasSemHabilitacao,
  resumoDoEnquadramento,
  modalidadesDoPerfil,
};
