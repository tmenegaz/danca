/**
 * cotas.js — OS SETE LIMITES DA ESCOLA EM CONSULTORIA (25/11/2026).
 *
 * O QUE ELA PEDIU, e é o regime inteiro: «enquanto eu estou fazendo a consultoria, eu estou
 * apresentando a forma de planejamento e alimentando a ferramenta Lastro […] depois que eu terminar
 * o processo […] eu vou deixar para a escola esse ambiente configurado com o nome dela, disponível
 * para ela usar por um mês. Só que vai ter um limite. […] esse limite não se renova, tá?»
 *
 * OS SETE NÚMEROS, na letra dela: 2 professores (o titular e mais um), 5 alunas, 2 ciclos, 2
 * modalidades, 3 aulas, 2 salas, 3 turmas. Eles vivem no catálogo
 * (`biblioteca/comercial/planos.json → consultoria.limites`), porque um número comercial não se
 * escreve em código.
 *
 * O QUE ESTE MÓDULO É: **puro**. Recebe o contrato e as contagens, devolve «cabe» ou «não cabe» com
 * a frase. Não lê o KV, não conta professores, não sabe o que é um ecrã. Quem conta é quem tem a
 * lista à mão — e é isso que faz a regra ser medível sem bancada.
 *
 * A DISTINÇÃO QUE ATRAVESSA TUDO, e é o §ADITIVO §2: **regime**. Numa assinatura paga, professores e
 * alunas são REFERÊNCIA INTERNA e não bloqueiam (a franquia que se cobra é de aulas, com excedente).
 * Na consultoria, os sete são **tetos duros**. Um `limites` preenchido numa assinatura paga seria
 * uma decisão nova, e contradiria o aditivo — por isso o regime manda, e não o plano.
 *
 * A OUTRA DISTINÇÃO, e é o que faz «não se renova» ser verdade:
 *
 *   · **gente, salas, turmas e modalidades são um teto CONCORRENTE** — apagar um professor e criar
 *     outro é permitido, porque o que está limitado é o que existe ao mesmo tempo. Quem sai liberta
 *     o lugar;
 *   · **as aulas são um teto DE VIDA** — cada aula processada entra no livro uma vez e NUNCA sai.
 *     Sem isto, apagar um ciclo devolveria vagas de aula, e o limite renovar-se-ia por uma porta
 *     lateral (o §7 do PLANO-DA-ESCOLA-EM-CONSULTORIA).
 *
 * O LIVRO DE AULAS É UMA LISTA DE IDENTIDADES, E NÃO UM CONTADOR. Guarda
 * `professor/variante/numero` — «esta aula existiu» — e o número de aulas gastas é o comprimento da
 * lista. Um número guardado pode divergir da fonte em silêncio; uma lista de identidades pode ser
 * conferida contra a fonte, e uma identidade que já não existe é uma aula que foi APAGADA, não uma
 * aula que não aconteceu.
 */

const CATALOGO = require('../../biblioteca/comercial/planos.json');

/** A entrada do catálogo, ou `null`. Lida uma vez; nunca copiada para outro sítio. */
const CONSULTORIA = (CATALOGO && CATALOGO.consultoria) || null;

/** As sete dimensões, na ordem em que ela as disse. A ordem é a da leitura, não a alfabética. */
const DIMENSOES = ['professores', 'alunas', 'ciclos', 'modalidades', 'aulas', 'salas', 'turmas'];

/** O rótulo de cada dimensão no plural — o que a frase da recusa escreve. */
const ROTULOS = {
  professores: 'professores',
  alunas: 'alunas',
  ciclos: 'ciclos',
  modalidades: 'modalidades',
  aulas: 'aulas processadas',
  salas: 'salas',
  turmas: 'turmas',
};

/** As dimensões de VIDA — as que não se recuperam apagando. Hoje, só as aulas (§7). */
const DE_VIDA = new Set(['aulas']);

/** O regime de um contrato: `consultoria` ou `assinatura`. Sem plano, é `assinatura` — uma escola
 *  anterior à camada comercial não prometeu teto nenhum, e travá-la seria inventar um limite que
 *  ninguém contratou. */
function regimeDoContrato(contrato) {
  const c = contrato || {};
  const plano = String(c.plano || c.assinatura || '').trim().toLowerCase();
  if (plano === 'consultoria' || plano === 'demonstracao') return 'consultoria';
  return 'assinatura';
}

/** Os limites em vigor para um contrato, ou `null` quando não há teto (assinatura paga). */
function limitesDoRegime(contrato) {
  if (regimeDoContrato(contrato) !== 'consultoria') return null;
  const l = (CONSULTORIA && CONSULTORIA.limites) || {};
  const saida = {};
  for (const d of DIMENSOES) {
    const n = Number(l[d]);
    saida[d] = Number.isFinite(n) && n >= 0 ? n : 0;
  }
  return saida;
}

/**
 * A TRAVA DE UMA DIMENSÃO.
 *
 * `usados` é o que já existe AGORA naquela dimensão (para as de vida, o que já existiu). `null`
 * significa «não consegui contar», e é uma resposta diferente de zero: uma leitura falhada tem de
 * RECUSAR, e não deixar passar como se a escola estivesse vazia — o §13 do plano é explícito («não
 * se inventa um zero quando a leitura falha»).
 *
 * Devolve sempre a mesma forma, para o chamador não ter dois caminhos:
 *   `{ cabe, regime, dimensao, limite, usados, restantes, erro? }`
 */
function travaDaCota({ contrato, dimensao, usados } = {}) {
  const d = String(dimensao || '').trim();
  const regime = regimeDoContrato(contrato);
  if (DIMENSOES.indexOf(d) === -1) {
    return { cabe: true, regime, dimensao: d, limite: null, usados: null, restantes: null,
      motivo: 'dimensão desconhecida — nada a travar' };
  }
  const limites = limitesDoRegime(contrato);
  /* SEM TETO, NADA A TRAVAR. É o caso das assinaturas pagas: a franquia que se cobra é de aulas, e
   * elas pagam-se como excedente — bloquear gente seria contradizer o §ADITIVO §2. */
  if (!limites) {
    return { cabe: true, regime, dimensao: d, limite: null, usados: null, restantes: null,
      motivo: 'sem teto neste regime' };
  }
  const limite = limites[d];
  /* NÃO CONTEI, NÃO DEIXO PASSAR. A frase diz o que aconteceu, e não finge um número: quem lê tem
   * de poder distinguir «a escola está cheia» de «o sistema não conseguiu contar». */
  if (usados === null || usados === undefined || usados === '') {
    return {
      cabe: false, regime, dimensao: d, limite, usados: null, restantes: null,
      erro: 'Não foi possível contar as ' + (ROTULOS[d] || d) + ' desta escola, e sem a contagem o '
        + 'limite do plano consultoria não se pode aplicar. Nada foi alterado — tente daqui a pouco.',
    };
  }
  const tem = Math.max(0, Math.round(Number(usados) || 0));
  const cabe = tem < limite;
  const base = { regime, dimensao: d, limite, usados: tem, restantes: Math.max(0, limite - tem) };
  if (cabe) return Object.assign({ cabe: true }, base);
  return Object.assign({ cabe: false, erro: fraseDaRecusa({ dimensao: d, limite, usados: tem }) }, base);
}

/** O que ainda cabe numa dimensão, ou `null` quando não há teto. É o que o painel mostra ao lado. */
function consumoDaCota({ contrato, dimensao, usados } = {}) {
  const t = travaDaCota({ contrato, dimensao, usados });
  if (t.limite === null) return null;
  return {
    dimensao: t.dimensao,
    limite: t.limite,
    usados: t.usados,
    restantes: t.restantes,
    cheio: t.usados !== null && t.usados >= t.limite,
    deVida: DE_VIDA.has(t.dimensao),
    texto: t.usados === null ? '—' : (t.usados + '/' + t.limite),
  };
}

/**
 * A FRASE DA RECUSA. Não é «erro». Ela diz **o limite**, diz **o que já foi usado** e **oferece a
 * saída** — as três coisas que o §6.1 do plano exige, e a diferença entre uma parede e uma porta.
 *
 * A saída é sempre a mesma e é a verdade do produto: o que está criado continua legível, e para
 * continuar a criar contrata-se um plano. A consultoria não é uma dívida e não se cobra excedente
 * nela — por isso a frase não fala de pagar o que passou, e sim de contratar para continuar.
 */
function fraseDaRecusa({ dimensao, limite, usados } = {}) {
  const d = String(dimensao || '');
  const l = Math.max(0, Math.round(Number(limite) || 0));
  const u = Math.max(0, Math.round(Number(usados) || 0));
  const rotulo = ROTULOS[d] || d;
  const plural = l === 1 ? 'aula' : rotulo;
  const especifico = d === 'professores' ? ' (o titular e mais um)' : '';
  const usado = d === 'aulas'
    ? 'e já foram as ' + l + ' — cada aula processada conta uma vez, e não se renova'
    : 'e já ' + (u === l ? (l === 2 ? 'estão as duas' : 'estão todos') : 'são ' + u);
  return 'O plano consultoria inclui ' + l + ' ' + plural + especifico + ', ' + usado + '. '
    + 'O que está criado continua legível; para continuar, contrate um plano.';
}

/**
 * O LIVRO DE AULAS DA CONSULTORIA — as identidades, e nunca um número.
 *
 * Mora no registo comercial (`aulasDaConsultoria`), ao lado do resto dos factos comerciais. É
 * separado da contagem da franquia (`bastidores/<escola>/aulas-processadas`, derivada do
 * `-dados.json`): a franquia conta o MÊS e pode subir e descer com o dado; o livro conta a VIDA da
 * consultoria e só cresce.
 */
function lerLivroDeAulas(bruto) {
  const vazio = { aulas: {} };
  if (bruto === null || bruto === undefined || bruto === '') return vazio;
  let d = bruto;
  if (typeof d === 'string') {
    try { d = JSON.parse(d); } catch (erro) { return vazio; }
  }
  if (!d || typeof d !== 'object') return vazio;
  const origem = d.aulas && typeof d.aulas === 'object' ? d.aulas : d;
  const aulas = {};
  for (const chave of Object.keys(origem)) {
    if (!/^[^/]+\/[^/]+\/\d{2,4}$/.test(chave)) continue;
    const quando = String(origem[chave] == null ? '' : origem[chave]).trim();
    aulas[chave] = /^\d{4}-\d{2}-\d{2}/.test(quando) ? quando : '';
  }
  return { aulas };
}

/** A chave de uma aula no livro: `<professor>/<variante>/<numero>`. Os três juntos identificam a
 *  aula dentro da escola — a mesma aula registada duas vezes é a MESMA chave, e é isso que faz o
 *  livro ser idempotente sem depender de quem escreve. */
function chaveDaAulaNoLivro({ professor, variante, numero } = {}) {
  const p = String(professor == null ? '' : professor).trim();
  const v = String(variante == null ? '' : variante).trim();
  const n = String(numero == null ? '' : numero).trim();
  if (!p || !v || !n) return null;
  return p + '/' + v + '/' + n.padStart(2, '0');
}

/** Regista uma aula no livro. Devolve um livro NOVO — uma falha a meio não deixa o de quem chamou
 *  meio aplicado. Idempotente: a mesma chave duas vezes continua a ser uma. */
function registarNoLivro(livro, aula, quando) {
  const base = lerLivroDeAulas(livro);
  const chave = chaveDaAulaNoLivro(aula);
  if (!chave) return base;
  const aulas = Object.assign({}, base.aulas);
  if (!Object.prototype.hasOwnProperty.call(aulas, chave)) {
    aulas[chave] = String(quando || new Date().toISOString()).slice(0, 10);
  }
  return { aulas };
}

/** Quantas aulas distintas a consultoria já gastou. É o `usados` da dimensão `aulas`. */
function aulasNoLivro(livro) {
  return Object.keys(lerLivroDeAulas(livro).aulas).length;
}

/**
 * O RESUMO DOS SETE, para o ecrã — o que o painel dela e a faixa da escola mostram.
 *
 * `contagens` é um objecto com o que o chamador conseguiu contar, por dimensão. Uma dimensão que o
 * chamador não forneceu sai com `usados: null` e `texto: '—'`: **não se inventa um zero**, e o ecrã
 * distingue «não conta» de «zero» — a mesma disciplina do `aulasUsadas: null` da franquia.
 */
function resumoDasCotas({ contrato, contagens } = {}) {
  const limites = limitesDoRegime(contrato);
  if (!limites) return null;
  const c = contagens && typeof contagens === 'object' ? contagens : {};
  const dimensoes = {};
  for (const d of DIMENSOES) {
    dimensoes[d] = consumoDaCota({
      contrato,
      dimensao: d,
      usados: Object.prototype.hasOwnProperty.call(c, d) ? c[d] : null,
    });
  }
  const cheias = DIMENSOES.filter((d) => dimensoes[d] && dimensoes[d].cheio);
  return {
    regime: 'consultoria',
    planoNome: (CONSULTORIA && CONSULTORIA.nome) || 'Plano consultoria',
    dimensoes,
    cheias,
    /* A FRASE DE TOPO é a que a escola lê primeiro. Sem nenhuma cheia, ela cala-se — o aviso serve
     * para a escola decidir ANTES de bater na parede, e um aviso permanente é ruído. */
    frase: cheias.length
      ? 'A demonstração chegou ao limite em: '
        + cheias.map((d) => (ROTULOS[d] || d) + ' (' + dimensoes[d].texto + ')').join(', ') + '.'
      : null,
  };
}

module.exports = {
  CONSULTORIA,
  DIMENSOES,
  ROTULOS,
  DE_VIDA,
  regimeDoContrato,
  limitesDoRegime,
  travaDaCota,
  consumoDaCota,
  fraseDaRecusa,
  lerLivroDeAulas,
  chaveDaAulaNoLivro,
  registarNoLivro,
  aulasNoLivro,
  resumoDasCotas,
};
