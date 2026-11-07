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
 * OS CONTEÚDOS DE UMA TURMA — o que ela aprende, com a proveniência de cada um.
 *
 * Devolve `{ ids, doLegado, daCuradoria, declarada }`. `doLegado` é o que veio do mapa antigo
 * (`turma-conteudos`); `daCuradoria`, o que as curadorias dela declaram. `ids` está na ordem em
 * que apareceu — a ordem é a da declaração, e não a alfabética: o professor associa na ordem em
 * que ensina.
 *
 * A DECLARAÇÃO VIVA VENCE A MEMÓRIA (07/11/2026). Até hoje `ids` era a UNIÃO das duas camadas, e
 * a razão era boa: nenhuma escola perdia, por uma decisão de Novembro, o que tinha associado em
 * Outubro. Mas a união tem um custo que ela viu na tela: a `batata` declarou `Plié` e
 * `Battement jeté` na Audição, e o plano de ensino ofereceu QUATRO parâmetros — os dois dela e
 * mais `Battement tendu` e `Battement fondu`, que eram o mapa antigo de uma rodada de testes
 * anterior, nunca declarados por ninguém. «O professor olha no estilo que tem exercício A e B,
 * vai para o plano de ensino e encontra A, B, C e D. Não pode ser assim.»
 *
 * A REGRA QUE FICA: a partir do momento em que existe uma curadoria VIGENTE para a turma, é ela
 * que diz o que a turma aprende — mesmo que declare pouco, e mesmo que declare nada. O mapa
 * antigo é memória, e a memória não fala por cima de quem declarou. Ele continua a ser a fonte
 * das turmas que nunca tiveram curadoria (é o que mantém vivas as escolas de Outubro sem
 * migração nenhuma), e continua a ser devolvido em `doLegado` para quem precisa de saber o que
 * lá estava.
 *
 * E NÃO É UM APAGAMENTO. Nada se reescreve: o mapa antigo fica no KV exactamente como está. O
 * que muda é quem manda na leitura — e a regra é a mesma que já governava as curadorias
 * substituídas: «a versão nova herdou o repertório, e se ela o reduziu foi uma decisão
 * declarada». Uma redução declarada é uma decisão; uma soma silenciosa não é de ninguém.
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
  // SÓ AS CURADORIAS VIGENTES ENTRAM. Uma curadoria substituída continua a ser memória — mas a
  // versão nova herdou-lhe o repertório, e se o reduziu foi uma decisão declarada. Somar as duas
  // faria o termo que o professor tirou voltar pela porta do elo antigo, e ninguém daria por
  // isso: a lista apareceria maior do que ele a deixou.
  const daCuradoria = [];
  let declarada = false;
  for (const c of curadoriasQueEnsinam(curadorias, t)) {
    if (c.substituidaPor) continue;
    // A EXISTÊNCIA DA CURADORIA JÁ É UMA DECLARAÇÃO — mesmo vazia. É o que separa «esta turma
    // ainda não tem conteúdo» (a tela diz isso, e o professor preenche) de «esta turma tem o que
    // ficou de Outubro» (a memória). Sem esta linha, esvaziar o repertório faria os termos
    // antigos voltarem sozinhos pela porta do mapa — que é o mesmo defeito, ao contrário.
    declarada = true;
    for (const x of conteudosDaCuradoria(c)) daCuradoria.push(x);
  }
  const vistos = new Set();
  const ids = [];
  for (const x of (declarada ? daCuradoria : doLegado.concat(daCuradoria))) {
    if (vistos.has(x)) continue;
    vistos.add(x);
    ids.push(x);
  }
  return { ids, doLegado, daCuradoria, declarada };
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
  const lista = Array.isArray(turmas) ? turmas : [];
  /* A TURMA QUE DECLAROU NÃO HERDA A MEMÓRIA (07/11/2026). São duas passagens — primeiro
   * descobrir quem declarou, depois compor —, e a ordem é obrigatória: o `mapa` copia o antigo
   * ANTES de somar as curadorias, e um `continue` na primeira passagem é o que impede o
   * `concat` da segunda de juntar o resíduo ao que foi declarado. Fazer a poda depois seria
   * escrever a mesma regra duas vezes, e as duas divergiriam ao primeiro caso de borda. */
  const declararam = new Set();
  for (const t of lista) {
    if (!t) continue;
    const id = String(t.id || '').trim() || idDaTurma(t.nome);
    if (!id) continue;
    if (conteudosDaTurma(t, { legado: null, curadorias }).declarada) declararam.add(id);
  }
  for (const [id, ids] of Object.entries(antigo)) {
    if (!Array.isArray(ids)) continue;
    if (declararam.has(id)) continue;
    const limpos = ids.map(idDeTermo).filter(Boolean);
    if (limpos.length) mapa[id] = limpos.slice();
  }
  for (const t of lista) {
    if (!t) continue;
    const id = String(t.id || '').trim() || idDaTurma(t.nome);
    if (!id) continue;
    const { ids } = conteudosDaTurma(t, { legado: null, curadorias });
    if (!ids.length) {
      // A DECLARAÇÃO VAZIA TAMBÉM MANDA: a turma que declarou nada não fica com o resíduo, e a
      // chave sai do mapa — para o leitor ver «sem conteúdo» e não a memória de Outubro.
      if (declararam.has(id)) delete mapa[id];
      continue;
    }
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
