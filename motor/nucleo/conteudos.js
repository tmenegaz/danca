/**
 * conteudos.js — DE QUEM É O CONTEÚDO QUE UMA TURMA APRENDE (03/11/2026).
 *
 * O CONTEÚDO MUDOU DE CASA, e a mudança foi dela, por escrito: «O conteúdo prático/técnico a ser
 * ensinado (ex.: plié, battement tendu) não deve pertencer ao cadastro estático da turma, pois isso
 * é um ato pedagógico. Remover a definição de conteúdo diretamente do formulário de criação/edição
 * da Turma. Mover a atribuição e associação de conteúdo inteiramente para o formulário de
 * Curadoria.»
 *
 * Até aqui o conteúdo vivia em dois sítios e nenhum deles era o certo:
 *
 *   1. o mapa `turma-conteudos` (`{ turmaId: [termoId, …] }`), escrito pelo passo 3 da TURMA — e a
 *      turma é o ritmo, não o ensino;
 *   2. o campo `repertorio` da CURADORIA, que existia desde 16/10 e **foi retirado da tela a
 *      19/10** com uma razão que continua verdadeira: «ninguém o lia — o plano, o PO e a captura
 *      derivam da turma». Duas listas da mesma coisa, e a que sobra só pode divergir.
 *
 * A RESPOSTA NÃO É APAGAR A PRIMEIRA. O que está gravado não se reescreve (P-03/P-04), e uma
 * escola que associou doze termos ao longo de Outubro não os perde por uma decisão de Novembro.
 * A resposta é **compor**: o que a turma aprende é a UNIÃO do que ficou no mapa antigo com o que
 * as curadorias dela declaram. E o mapa antigo deixa de ser escrito — não é migrado, é lido até
 * ao fim e depois fica como memória.
 *
 * A COMPOSIÇÃO É POR TURMA, e não por curadoria, porque a pergunta que o sistema faz é sempre
 * sobre a turma: «o que esta turma aprende?». A curadoria é a boca por onde entra; a turma é o
 * sujeito. Uma turma com duas curadorias ao longo do tempo (dois professores, duas tradições)
 * aprende o que qualquer uma delas declarou.
 *
 * AS CHAVES SÃO IDS, e a conversão é aqui. O mapa antigo guarda ids (`idDe(termo)`); o `repertorio`
 * da curadoria guarda o que veio do formulário, que pode ser nome ou id. Normalizar os dois para
 * id é o que permite uni-los sem contar o mesmo termo duas vezes.
 */

/** O id de um termo a partir do que estiver gravado — nome ou id, não interessa. É a mesma
 *  regra do `slugificar` do servidor (e a do `idDe`: `idDe = slugificar`), repetida aqui pela
 *  razão de sempre — o núcleo não conhece o servidor.
 *
 *  E É O QUE TORNA A UNIÃO HONESTA: o mapa antigo guarda ids, o `repertorio` guarda o que veio do
 *  formulário, e sem normalizar os dois «Plié» e «plie» seriam dois termos na mesma turma. */
function idDeTermo(x) {
  return String(x == null ? '' : x)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** O id da turma (slug do nome) — a mesma regra que o cadastro usa. Local, para o núcleo não
 *  depender do servidor: `idDe` de `bastidores.js` faz o mesmo, e uma dependência invertida
 *  (núcleo → servidor) partiria a regra de que o núcleo não conhece o servidor. */
function idDaTurma(nome) {
  return String(nome == null ? '' : nome)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * O QUE UMA CURADORIA DECLARA ENSINAR — o `repertorio` dela, em ids, sem repetir.
 *
 * Uma curadoria SUBSTITUÍDA continua a valer como memória: a versão nova herdou o repertório da
 * anterior, e se ela o reduziu foi uma decisão declarada. Por isso quem chama passa só as
 * vigentes — este módulo não decide o que está vigente.
 */
function conteudosDaCuradoria(c) {
  if (!c || typeof c !== 'object') return [];
  const vistos = new Set();
  const saida = [];
  for (const x of (Array.isArray(c.repertorio) ? c.repertorio : [])) {
    const id = idDeTermo(x);
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    saida.push(id);
  }
  return saida;
}

/** As curadorias que apontam para uma turma, por NOME ou por id (`turmas` ou `turma`). */
function curadoriasQueEnsinam(curadorias, turma) {
  const nome = String((turma && turma.nome) || turma || '').trim();
  const id = String((turma && turma.id) || '').trim() || idDaTurma(nome);
  if (!nome && !id) return [];
  return (Array.isArray(curadorias) ? curadorias : []).filter((c) => {
    if (!c || typeof c !== 'object') return false;
    const nomes = Array.isArray(c.turmas) && c.turmas.length
      ? c.turmas.map((x) => String(x || '').trim())
      : [String(c.turma || '').trim()];
    return nomes.some((n) => n && (n === nome || idDaTurma(n) === id));
  });
}

/**
 * OS CONTEÚDOS DE UMA TURMA — a união, com a proveniência de cada um.
 *
 * Devolve `{ ids, doLegado, daCuradoria }`. `doLegado` é o que veio do mapa antigo (`turma-
 * conteudos`); `daCuradoria`, o que as curadorias dela declaram. `ids` é a união, na ordem em que
 * apareceram — a ordem é a da declaração, e não a alfabética: o professor associa na ordem em que
 * ensina.
 *
 * `legado` é o mapa inteiro (não a lista daquela turma) porque é assim que ele está gravado; a
 * chave é o id da turma. Um mapa em que a turma apareça pela chave antiga (o id do nome de antes
 * de um ajuste) não a encontra — e é por isso que o `derivar` da turma **mantém o nome**: o id
 * acompanha o nome, e o nome não muda sem se remover a curadoria.
 */
function conteudosDaTurma(turma, { legado, curadorias } = {}) {
  const t = turma && typeof turma === 'object' ? turma : { nome: String(turma || '') };
  const id = String(t.id || '').trim() || idDaTurma(t.nome);
  const doLegado = [];
  const mapa = legado && typeof legado === 'object' ? legado : {};
  for (const x of (Array.isArray(mapa[id]) ? mapa[id] : [])) {
    const v = idDeTermo(x);
    if (v) doLegado.push(v);
  }
  // SÓ AS CURADORIAS VIGENTES ENTRAM NA UNIÃO. Uma curadoria substituída continua a ser memória
  // — mas a versão nova herdou-lhe o repertório, e se o reduziu foi uma decisão declarada. Somar
  // as duas faria o termo que o professor tirou voltar pela porta do elo antigo, e ninguém daria
  // por isso: a lista apareceria maior do que ele a deixou.
  const daCuradoria = [];
  for (const c of curadoriasQueEnsinam(curadorias, t)) {
    if (c.substituidaPor) continue;
    for (const x of conteudosDaCuradoria(c)) daCuradoria.push(x);
  }
  const vistos = new Set();
  const ids = [];
  for (const x of doLegado.concat(daCuradoria)) {
    if (vistos.has(x)) continue;
    vistos.add(x);
    ids.push(x);
  }
  return { ids, doLegado, daCuradoria };
}

/**
 * O MAPA INTEIRO, na forma do antigo `turma-conteudos` — `{ turmaId: [termoId, …] }`.
 *
 * É o que permite que quem já lia o mapa antigo (o cartão da turma, a guarda de proveniência do
 * termo) continue a ler **uma** coisa só, e passe a ver a verdade inteira sem saber que houve
 * duas camadas. O mapa antigo não é copiado para dentro: é somado na leitura.
 */
function mapaDeConteudos({ legado, curadorias, turmas } = {}) {
  const mapa = {};
  const antigo = legado && typeof legado === 'object' ? legado : {};
  for (const [id, ids] of Object.entries(antigo)) {
    if (!Array.isArray(ids)) continue;
    const limpos = ids.map(idDeTermo).filter(Boolean);
    if (limpos.length) mapa[id] = limpos.slice();
  }
  for (const t of (Array.isArray(turmas) ? turmas : [])) {
    if (!t) continue;
    const id = String(t.id || '').trim() || idDaTurma(t.nome);
    if (!id) continue;
    const { ids } = conteudosDaTurma(t, { legado: null, curadorias });
    if (!ids.length) continue;
    const atuais = mapa[id] || [];
    const vistos = new Set(atuais);
    mapa[id] = atuais.concat(ids.filter((x) => !vistos.has(x)));
  }
  return mapa;
}

module.exports = {
  idDeTermo,
  idDaTurma,
  conteudosDaCuradoria,
  curadoriasQueEnsinam,
  conteudosDaTurma,
  mapaDeConteudos,
};
