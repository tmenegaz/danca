/**
 * perfil-do-professor.js — A HABILITAÇÃO É DA PESSOA, NÃO DA ESCOLA (03/11/2026).
 *
 * A DECISÃO DELA, com as palavras dela: «a modalidade nasce da competência/habilidade do
 * professor. A escola só incorpora e oferta uma modalidade se possuir professores habilitados
 * para lecioná-la.» E, na mesma frase, o lugar: «as habilidades do professor vivem no registro
 * da entidade do Professor (`professores/<slug>/perfil.json`), de forma independente do tenant
 * da escola.»
 *
 * POR QUE ISTO É UM MÓDULO DO NÚCLEO E NÃO DO SERVIDOR. A regra tem duas perguntas — «que
 * modalidades esta pessoa declara?» e «esta turma ainda tem quem a ensine?» — e as duas são
 * lógica pura, sem IO. O servidor lê e grava o ficheiro; o expurgo decide o que preserva; a
 * prova mede. Se cada um respondesse a sua, seriam três respostas para a mesma pergunta, e a
 * primeira correcção deixaria duas a divergir. É a regra que esta casa já pagou com a conta dos
 * tempos (quatro sítios a somar) e com o vocabulário por escola.
 *
 * O QUE ESTE MÓDULO **NÃO** FAZ: não lê ficheiros, não chama a rede, não sabe o que é uma
 * escola. Recebe o que existe e devolve o que se conclui.
 */

const MODALIDADES = require('../../biblioteca/modalidades/modalidades.json');

/** A lista de modalidades que o sistema oferece — a mesma que o catálogo publica. */
const LISTA_DE_MODALIDADES = (MODALIDADES && MODALIDADES.modalidades) || [];

/**
 * A MODALIDADE PRINCIPAL — DERIVADA DO CATÁLOGO, E NÃO ESCRITA À MÃO (04/11/2026).
 *
 * Era `const MODALIDADE_PADRAO = 'bale-classico'`, e havia uma SEGUNDA cópia igual em
 * `notacao.js`. Duas cópias da mesma decisão divergem no dia em que a primeira mudar — e a
 * primeira muda no dia em que houver uma segunda modalidade com conteúdo, que é precisamente o
 * que o catálogo foi feito para receber.
 *
 * A REGRA, e ela é do catálogo: **a principal é a primeira modalidade que declara ter conteúdo**.
 * Não é «a primeira da lista» (uma modalidade sem repertório não pode ser a principal de
 * ninguém), e não é um id fixo. Hoje o resultado é o mesmo — `bale-classico` —, e é por isso que
 * a mudança não tem custo; o que muda é de onde ele vem.
 *
 * O catálogo vazio não é um caso de produção (o `require` falharia antes), mas a derivação
 * devolve `''` em vez de lançar: quem chama já sabe dizer «não declarada».
 */
function modalidadePrincipal(lista) {
  const modalidades = Array.isArray(lista) ? lista : LISTA_DE_MODALIDADES;
  const comConteudo = modalidades.find((m) => m && m.temConteudo && m.id);
  if (comConteudo) return String(comConteudo.id);
  const primeira = modalidades.find((m) => m && m.id);
  return primeira ? String(primeira.id) : '';
}

/** A modalidade quando o chamador não a declara — ver `modalidadePrincipal`. */
const MODALIDADE_PADRAO = modalidadePrincipal();

/** Os ids válidos. Um id que não está aqui é um erro de dado, não uma modalidade nova. */
function idsDeModalidade() {
  return new Set(LISTA_DE_MODALIDADES.map((m) => m.id));
}

/** O nome de exibição de uma modalidade; sem ele, o próprio id — legível e não vazio. */
function nomeDaModalidade(id) {
  const achada = LISTA_DE_MODALIDADES.find((m) => m && m.id === id)
    || LISTA_DE_MODALIDADES.find((m) => m && m.nome === id);
  return achada ? achada.nome : String(id || '');
}

/**
 * O ID DE UMA MODALIDADE, ACEITANDO O ID OU O NOME (07/11/2026).
 *
 * PORQUE ISTO EXISTE. O perfil do professor guarda **ids** (`bale-classico`) e a Turma guarda o
 * **nome** que o formulário oferece (`Balé clássico`) — o `<option>` da modalidade leva o nome no
 * `value`, e é ele que vai no corpo. Comparar as duas coisas dava sempre «não declara», e a marca
 * de «sem quem a ensine» acendia em turmas que o professor ensina todos os dias. Nenhum teste
 * apanhava: a função do núcleo era chamada com ids nas provas e com nomes em produção.
 *
 * A CONVERSÃO É TOLERANTE E NÃO INVENTA: um valor que não casa com nenhuma modalidade volta como
 * veio — quem compara decide o que fazer com um id desconhecido, e inventar um seria pior.
 * A comparação por nome ignora acentos e caixa, porque o mesmo rótulo já foi escrito das duas
 * maneiras em registos que existem.
 */
function idDaModalidade(valor) {
  const cru = String(valor == null ? '' : valor).trim();
  if (!cru) return '';
  const porId = LISTA_DE_MODALIDADES.find((m) => m && m.id === cru);
  if (porId) return porId.id;
  const semAcento = (s) => String(s == null ? '' : s).trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const alvo = semAcento(cru);
  const porNome = LISTA_DE_MODALIDADES.find((m) => m && semAcento(m.nome) === alvo);
  return porNome ? porNome.id : cru;
}

/** Se a modalidade tem repertório na biblioteca — a tela diz isso, e é dado do catálogo. */
function modalidadeTemConteudo(id) {
  const achada = LISTA_DE_MODALIDADES.find((m) => m && m.id === id);
  return Boolean(achada && achada.temConteudo);
}

/**
 * O PERFIL VAZIO — o de um professor que nasce com a escola.
 *
 * Ele NÃO nasce sem modalidade: quem cria uma escola é, por definição, quem a vai ensinar, e
 * nasce habilitado na modalidade principal. É a decisão dela: «cria-se obrigatoriamente um
 * professor (que pode ser o administrador/proprietário), o qual já nasce com o pré-requisito de
 * saber ensinar pelo menos a modalidade principal».
 */
function perfilVazio({ slug, nome, modalidades, hoje } = {}) {
  const lista = Array.isArray(modalidades) && modalidades.length
    ? modalidades.slice()
    : [MODALIDADE_PADRAO];
  return {
    slug: String(slug || '').trim(),
    nome: String(nome || '').trim(),
    modalidades: lista,
    criado: String(hoje || ''),
    atualizado: String(hoje || ''),
  };
}

/**
 * NORMALIZA E VALIDA o que a tela manda.
 *
 * O QUE SE RECUSA, e não se corrige em silêncio: um id que não existe na lista. Aceitá-lo
 * criaria uma modalidade-fantasma no perfil — a tela mostraria «kuduro» e o catálogo não teria
 * onde procurar o repertório. A mensagem diz qual, porque um «dados inválidos» genérico obriga
 * a adivinhar.
 *
 * O QUE SE ACEITA VAZIO: a lista sem nenhuma modalidade. Não é um erro de forma — é uma
 * declaração, e é ela que **descontinua** as turmas daquele professor (ver `turmasDescontinuadas`).
 * Recusá-la obrigaria a mentir para desligar uma habilitação.
 */
function normalizarPerfil(corpo, { hoje } = {}) {
  const bruto = corpo && typeof corpo === 'object' ? corpo : {};
  const erros = [];
  const validos = idsDeModalidade();

  const lista = Array.isArray(bruto.modalidades)
    ? bruto.modalidades
    : String(bruto.modalidades || '').split(',');
  const vistas = [];
  const desconhecidas = [];
  for (const m of lista) {
    const id = String(m == null ? '' : m).trim();
    if (!id) continue;
    if (!validos.has(id)) { if (desconhecidas.indexOf(id) === -1) desconhecidas.push(id); continue; }
    if (vistas.indexOf(id) === -1) vistas.push(id);
  }
  if (desconhecidas.length) {
    erros.push('modalidade desconhecida: ' + desconhecidas.join(', ')
      + ' — as que existem são: ' + [...validos].join(', '));
  }

  return {
    ok: erros.length === 0,
    erros,
    perfil: {
      slug: String(bruto.slug || '').trim(),
      nome: String(bruto.nome || '').trim(),
      modalidades: vistas,
      criado: String(bruto.criado || hoje || ''),
      atualizado: String(hoje || bruto.atualizado || ''),
    },
  };
}

/** As modalidades de um perfil, à prova de um registo antigo ou partido. */
function modalidadesDoPerfil(perfil) {
  const lista = (perfil && perfil.modalidades) || [];
  return (Array.isArray(lista) ? lista : [])
    .map((m) => String(m == null ? '' : m).trim())
    .filter(Boolean);
}

/**
 * A PERGUNTA QUE A DECISÃO DELA OBRIGA A FAZER: este professor ainda tem esta modalidade?
 *
 * Sem perfil, a resposta é «não sei» — e «não sei» NÃO descontinua nada. É a mesma distinção do
 * `cobre` nos verbetes antigos: a ausência de um dado não é a negação dele. Um professor sem
 * `perfil.json` (todos, hoje) continua a ter as suas turmas a funcionar; o que falta é o dado,
 * e a tela diz isso em vez de inventar uma descontinuidade.
 */
function estadoDaHabilitacao(perfil, modalidade) {
  if (!perfil || !Array.isArray(perfil.modalidades)) return 'sem-perfil';
  const id = idDaModalidade(modalidade);
  if (!id) return 'sem-modalidade';
  return modalidadesDoPerfil(perfil).indexOf(id) !== -1 ? 'habilitado' : 'perdeu';
}

/**
 * AS TURMAS QUE FICARAM SEM QUEM AS ENSINE — **SUBSTITUÍDA a 03/11/2026**, e fica por história.
 *
 * A modalidade e o professor deixaram de estar no cadastro da turma: passaram para a **curadoria**
 * (ver `motor/nucleo/enquadramento.js`). Esta função lia `t.modalidade` e `t.professor`, e depois
 * da mudança de casa responderia sempre «nenhuma» — sem erro, que é o pior modo de falha.
 *
 * Quem responde agora é `enquadramento.turmasSemHabilitacao`, que lê a curadoria e cai na memória
 * da turma quando ela existe. A função fica aqui porque é chamada pela prova da entrega anterior
 * (§A de `provar-habilitacao-do-professor`), e essa prova mede a regra — que não mudou. Apagar
 * uma função que uma prova mede para «limpar» deixaria a prova a falar de código inexistente.
 *
 * A REGRA DELA, que continua a ser a regra: «a turma não é apagada, respeitando estritamente a
 * regra da proveniência e a imutabilidade do histórico. O sistema deve apenas marcar a turma como
 * descontinuada.»
 *
 * Três condições, e todas importam:
 *   · a turma declara uma `modalidade` (sem ela não há o que comparar — e uma turma antiga, que
 *     não declarava, NÃO é descontinuada: é dado que falta);
 *   · a turma declara um `professor` que é o dono do perfil (uma turma de outra pessoa não é
 *     descontinuada pela habilitação desta);
 *   · e o perfil JÁ EXISTE e não tem essa modalidade.
 *
 * Devolve a lista com o motivo de cada uma — a tela mostra-o, porque «descontinuada» sem dizer
 * porquê manda procurar um defeito onde há uma decisão.
 */
function turmasDescontinuadas(turmas, perfil, { professor } = {}) {
  const lista = Array.isArray(turmas) ? turmas : [];
  const deQuem = String(professor || (perfil && perfil.slug) || '').trim();
  const saida = [];
  for (const t of lista) {
    if (!t || typeof t !== 'object') continue;
    const modalidade = String(t.modalidade || '').trim();
    if (!modalidade) continue;
    const dono = String(t.professor || '').trim();
    if (deQuem && dono && dono !== deQuem) continue;
    if (estadoDaHabilitacao(perfil, modalidade) !== 'perdeu') continue;
    saida.push({
      id: String(t.id || ''),
      nome: String(t.nome || ''),
      modalidade,
      motivo: 'o professor já não declara «' + nomeDaModalidade(modalidade) + '» nas habilitações dele',
    });
  }
  return saida;
}

module.exports = {
  LISTA_DE_MODALIDADES,
  MODALIDADE_PADRAO,
  modalidadePrincipal,
  idsDeModalidade,
  nomeDaModalidade,
  // A TOLERÂNCIA ID ↔ NOME (07/11/2026): o perfil guarda ids e a Turma guarda o nome do
  // catálogo. Quem compara modalidades passa por aqui, para as duas formas valerem.
  idDaModalidade,
  modalidadeTemConteudo,
  perfilVazio,
  normalizarPerfil,
  modalidadesDoPerfil,
  estadoDaHabilitacao,
  turmasDescontinuadas,
};
