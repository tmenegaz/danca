'use strict';

/**
 * desligamento.js — QUEM SAI: o professor que deixa a escola, e a aluna que deixa o elenco
 * (08/11/2026).
 *
 * Duas faces da mesma pergunta — «esta pessoa já fez parte disto, e já não faz?» —, com dois
 * mecanismos diferentes, e a diferença é a decisão:
 *
 *   · **O professor tem um ATO.** Sair da escola é uma decisão da direção, com data e motivo, e
 *     por isso o registo é MARCADO (`desligarProfessor`): `desligado_em`, `desligado_motivo`,
 *     `desligado_por`. A marca é o que permite dizer «saiu em tal dia, por isto» — e é ela que
 *     tira o professor das listas de escolha.
 *   · **A aluna tem um RASTO.** Sair do elenco não é um ato que se declara à parte: é o efeito de
 *     uma versão nova do elenco (ou de uma Turma regravada) que já não a inclui. Por isso o
 *     estado dela é DERIVADO (`estadoDaAluna`): nada se marca, e o estado cai sozinho no dia em
 *     que ela volta a um elenco. Marcá-la obrigaria a desmarcá-la à mão no regresso, e um sinal
 *     que se esquece de limpar é um sinal que mente — a mesma razão pela qual a revalidação e o
 *     «a rever» são derivados e não campos.
 *
 * O que as duas dizem é a MESMA coisa, e é o que a etiqueta precisa de dizer: **não é nova, não
 * está vinculada, e já fez parte**. É a diferença entre «nunca esteve aqui» e «esteve, e o que
 * ficou dela é proveniência».
 *
 * ---
 *
 * O PROFESSOR QUE SAI DA ESCOLA.
 *
 * O BECO SEM SAÍDA QUE ESTE MÓDULO FECHA, medido no código e não suposto. Até hoje havia **um
 * caminho** para um professor sair — o `DELETE /api/bastidores/professor` —, e ele recusava em
 * cascata: se o professor estava numa curadoria, não saía; para sair, a curadoria tinha de ser
 * apagada; e uma curadoria que já gerou plano de ensino **não se apaga** («apagá-la romperia a
 * proveniência»). Conclusão: **um professor que deu uma aula nunca podia deixar a escola**, por
 * nenhuma rota. Não era uma decisão — era um efeito colateral de três guardas certas, cada uma a
 * olhar só o próprio degrau.
 *
 * A DECISÃO DELA (08/11/2026), que é a regra deste módulo: a Turma **não pára**. A escola continua a
 * operar, a sala continua no calendário, e a **direção** decide o que fazer com uma turma que ficou
 * sem quem a ensine — remanejar a modalidade temporariamente, dar aula recreativa ou ensaio, ou
 * atribuir outro professor apto. O sistema **não decide** por ela, e o registo do professor que saiu
 * **não se apaga**: ele é proveniência, e o nome dele continua nos documentos que assinou.
 *
 * O QUE O DESLIGAMENTO FAZ, e são três coisas, nesta ordem de leitura:
 *
 *   1. **Marca o professor** — `desligado_em`, `desligado_motivo` e `desligado_por` no registo do
 *      KV. O registo fica; deixa de ser atribuível e deixa de aparecer nas listas de escolha.
 *   2. **Encerra as curadorias dele** — a direcção pedagógica acaba no dia, e o registo diz quando e
 *      porquê (`encerrada_em`). Não se apaga nada: a versão anterior continua a ser a memória de
 *      quem ensinou aquela turma até àquele dia.
 *   3. **Marca as turmas que ficaram sem ele** — `descontinuada`, com o motivo escrito. A marca é a
 *      mesma que a perda de habilitação já usa (`marcarTurmasSemHabilitacao`): a turma **não se
 *      apaga**, e a direcção vê-la na lista a dizer o que falta.
 *
 * O QUE ELE **NÃO** FAZ, e é deliberado:
 *
 *   · **Não apaga a pasta `professores/<slug>/`** nem o `perfil.json`. A habilitação é da PESSOA e
 *     vive fora do tenant da escola (`perfil-do-professor.js`, decisão de 03/11/2026): o professor
 *     pode ir para outra escola, e leva consigo o que sabe ensinar.
 *   · **Não toca nos envelopes, planos, POs, ciclos nem âncoras.** O passado pertence à proveniência.
 *   · **Não escolhe o sucessor.** Atribuir uma turma a outro professor é um acto da direcção, com a
 *     habilitação dele como filtro — e é esse o fluxo que se desenha a seguir, não este.
 *
 * O DONO NÃO SE DESLIGA. É a decisão dela: «o dono/proprietário é a âncora jurídica e operacional da
 * escola; ele nunca abandona nem se exclui do sistema». A recusa é do servidor (a rota sabe quem é o
 * dono), e este módulo só a **diz** quando lhe pedem — `motivoDaRecusaDoDono`.
 */

const enquadramento = require('./enquadramento.js');
/* A DERIVAÇÃO DO ID A PARTIR DO APELIDO VEM DO NÚCLEO DA LINHA DE BASE (19/11/2026) — é a MESMA
 * regra com que `porta.js` resolve o titular de um envelope antigo (`recorte.idDe`). Uma segunda
 * cópia aqui daria duas respostas a «de quem é este apelido», e a que ficasse para trás seria a da
 * etiqueta. */
const { idDe } = require('./linha-de-base.js');

/** O professor do registo (KV) que responde a um nome OU a um slug — `null` quando não há. */
function acharProfessor(professores, alvo) {
  const procurado = String(alvo == null ? '' : alvo).trim();
  if (!procurado) return null;
  const lista = Array.isArray(professores) ? professores : [];
  return lista.find((p) => p && (String(p.nome || '').trim() === procurado
    || String(p.slug || '').trim() === procurado)) || null;
}

/** `true` quando o registo está desligado da escola. A ausência do campo é «activo». */
function estaDesligado(professor) {
  return Boolean(professor && String(professor.desligado_em || '').trim());
}

/** Os nomes/slug pelos quais uma curadoria pode identificar este professor. */
function identificadoresDe(professor) {
  const nomes = new Set();
  for (const v of [professor && professor.nome, professor && professor.slug]) {
    const s = String(v == null ? '' : v).trim();
    if (s) nomes.add(s);
  }
  return nomes;
}

/**
 * DESLIGA UM PROFESSOR — e devolve o registo novo, as curadorias encerradas e as turmas marcadas.
 *
 * Entrada: `{ professor, professores, curadorias, turmas, quando, motivo, por }`, onde `professor` é
 * o registo do KV (ou o slug, que se resolve contra `professores`). Devolve:
 *
 *   `{ ok: false, erros: [...] }` — e nada foi tocado;
 *   `{ ok: true, professor, curadorias, turmas, encerradas, descontinuadas, turmasSemProfessor }`.
 *
 * `curadorias` e `turmas` voltam **inteiras**, com as versões novas trocadas no lugar — é o que quem
 * chama grava, e é a mesma forma das rotas de curadoria e de turma (substituição no lugar, sem criar
 * ficheiros novos: o KV guarda o estado, o repositório guarda os actos).
 */
function desligarProfessor({
  professor, professores, curadorias, turmas, quando, motivo, por,
} = {}) {
  const erros = [];
  const registo = (professor && typeof professor === 'object' && (professor.nome || professor.slug))
    ? professor
    : acharProfessor(professores, professor);
  if (!registo) erros.push('professor não encontrado');
  const em = String(quando == null ? '' : quando).trim();
  const razao = String(motivo == null ? '' : motivo).trim();
  if (!em) erros.push('informe o instante do desligamento');
  /* O MOTIVO É OBRIGATÓRIO, e não é formalidade: é a única coisa que a direcção de amanhã vai ter
   * para saber porque é que aquela turma ficou sem professor. Um desligamento sem motivo é um
   * buraco na memória da escola, e é o que este sistema existe para não deixar acontecer. */
  if (!razao) erros.push('informe o motivo do desligamento — é o que fica registado para a direção');

  if (registo && estaDesligado(registo)) {
    return {
      ok: false,
      erros: ['o professor «' + registo.nome + '» já foi desligado desta escola em '
        + String(registo.desligado_em).slice(0, 10)],
    };
  }
  if (erros.length) return { ok: false, erros };

  const nomes = identificadoresDe(registo);
  const daCasa = (c) => c && nomes.has(String(c.professor || '').trim());

  /* 1. AS CURADORIAS — encerradas uma a uma, e só as VIGENTES. Uma curadoria já substituída é
   * passado: encerrá-la outra vez escreveria uma segunda despedida sobre a mesma direcção. */
  const encerradas = [];
  const listaCuradorias = (Array.isArray(curadorias) ? curadorias : []).map((c) => {
    if (!daCasa(c) || c.substituidaPor || c.encerrada_em) return c;
    encerradas.push(String(c.id || ''));
    return Object.assign({}, c, {
      encerrada_em: em,
      encerrada_motivo: razao,
      ...(por ? { encerrada_por: String(por) } : {}),
    });
  });

  /* 2. AS TURMAS — marcadas as que ficaram sem direcção pedagógica. A pergunta é feita ao
   * `enquadramento`, e não a `c.professor`: uma turma pode ter mais de uma curadoria (duas
   * modalidades), e só fica sem quem a ensine quando **nenhuma** activa a enquadra. */
  const nomesDasTurmas = new Set();
  for (const id of encerradas) {
    const daCuradoria = listaCuradorias.find((c) => c && String(c.id || '') === id);
    for (const nome of enquadramento.turmasDaCuradoria(daCuradoria)) nomesDasTurmas.add(nome);
  }
  const descontinuadas = [];
  const turmasSemProfessor = [];
  const listaTurmas = (Array.isArray(turmas) ? turmas : []).map((t) => {
    if (!t || typeof t !== 'object' || t.substituidaPor) return t;
    const nome = String(t.nome || '').trim();
    if (!nome || !nomesDasTurmas.has(nome)) return t;
    const activa = enquadramento.curadoriaDaTurma(listaCuradorias, nome);
    if (activa && !activa.encerrada_em) return t;      // outra direcção ainda a enquadra
    const motivoDaMarca = 'a Turma ficou sem professor: ' + registo.nome
      + ' desligou-se da escola em ' + em.slice(0, 10)
      + '. A direção decide o que fazer — remanejar, dar aula recreativa ou atribuir outro '
      + 'professor habilitado nessa modalidade.';
    descontinuadas.push(nome);
    turmasSemProfessor.push({
      nome,
      modalidade: String((activa && activa.modalidade) || '').trim(),
    });
    return Object.assign({}, t, { descontinuada: { em: em.slice(0, 10), motivo: motivoDaMarca } });
  });

  const registoNovo = Object.assign({}, registo, {
    desligado_em: em,
    desligado_motivo: razao,
    ...(por ? { desligado_por: String(por) } : {}),
  });

  return {
    ok: true,
    erros: [],
    professor: registoNovo,
    curadorias: listaCuradorias,
    turmas: listaTurmas,
    encerradas,
    descontinuadas,
    turmasSemProfessor,
  };
}

/**
 * O DONO NÃO SE DESLIGA — a frase, e não só a recusa.
 *
 * A regra está em `desligarProfessor` só como dado: quem sabe quem é o dono é o servidor (o nome
 * resolve-se do segredo e do KV, `nomeDoDono`/`slugDoDono`). Aqui fica a redacção, para as três
 * superfícies que a dizem — a rota, o botão e a prova — dizerem a mesma.
 */
function motivoDaRecusaDoDono(nome) {
  return 'o professor «' + String(nome || '').trim() + '» é o responsável principal da escola e '
    + 'não se desliga: ele é a âncora da escola. O vínculo dele com a escola permanece, e ele pode '
    + 'deixar de dar uma turma específica pondo outro professor no lugar.';
}

/*
 * =====================================================================================
 * A ALUNA DESLIGADA — «já fez parte de algum elenco, e já não faz» (08/11/2026)
 * =====================================================================================
 *
 * O DEFEITO QUE ESTA DERIVAÇÃO FECHA, com as palavras dela (08/11/2026): «ela deixou de fazer
 * aula, ela não quer mais, saiu da escola. […] Mas aqui na anamnese ela aparece como vinculada
 * […] e embaixo está dizendo que é aluna nova, sem turma e sem linha de base. Eu preciso de uma
 * etiqueta que diga exatamente o status dela atual. Ela já não é mais uma aluna vinculada e nem
 * tampouco ela é uma aluna nova/livre, porque nós temos a regra da proveniência. […] Ela é
 * desligada, porque indica que ela não é nova, que ela não está vinculada, mas dá a entender que
 * ela já fez parte de algum elenco, mas agora ela está desligada.»
 *
 * PORQUE OS DOIS SELOS EXISTENTES MENTIAM, e os dois pela mesma causa: os dois estados eram
 * perguntados só ao PRESENTE («está numa curadoria com plano?», «está num elenco enviado?»), e o
 * presente de quem saiu é vazio. Vazio lê-se como «nova» — e «nova» quer dizer «nunca esteve
 * aqui», que é falso e apaga a história de quem já foi observada. O terceiro estado que faltava
 * não é mais um grau dos dois: é a NEGAÇÃO dos dois com memória.
 *
 * A DEFINIÇÃO, e as três condições são todas necessárias:
 *
 *   1. **não está em nenhum elenco vigente** — nenhuma linha de base (a que a lista lê) a declara;
 *   2. **não está em nenhuma Turma vigente** — nenhuma curadoria activa a declara em `alunas`;
 *   3. **há rasto de que já esteve** — e são três, pela ordem em que existem:
 *        · um **Plano de Observação** já a declarou em `sujeitos` (o rasto mais forte: alguém a
 *          observou);
 *        · uma **Turma substituída** a declarava (a Turma foi regravada sem ela — o caminho real
 *          de quem saiu, porque a turma é o que guarda o elenco do dia);
 *        · uma versão **diz que ela se transferiu** (`transferida`/`recebida`, de
 *          `transferencia.js`) e o destino também já não a tem.
 *
 * O QUE ESTA FUNÇÃO NÃO FAZ, e é preciso dizê-lo: ela **não lê o repositório**. O rasto que ela
 * conhece é o que a página já tem na mão (as linhas vigentes e a lista de curadorias, com as
 * substituídas). Uma versão de elenco anterior que nunca chegou a ser escolhida por uma Turma
 * não deixa rasto em nenhum dos três — e nesse caso a aluna continua a ler-se «nova». É a mesma
 * fronteira de todo o resto deste sistema: a derivação vale o que valem os dados que a tela lê,
 * e inventar o que não se leu seria pior do que o silêncio. Assim que a linha for concluída
 * outra vez, a versão nova é que passa a ser a vigente, e o rasto aparece.
 */

/** Os apelidos que uma linha de base declara, normalizados. */
function alunasDaLinha(linha) {
  const lista = linha && Array.isArray(linha.alunas) ? linha.alunas : [];
  return lista.map((a) => String(a == null ? '' : a).trim()).filter(Boolean);
}

/** O id de quem um apelido designa quando a fonte não diz mais do que isso: o primeiro titular. */
function idDoApelido(apelido) {
  return idDe(apelido);
}

/**
 * QUEM É, DE FACTO, A «Aluna B» DESTE ELENCO — o apelido sozinho não chega (19/11/2026).
 *
 * O DEFEITO, na letra dela: «eu criei a aluna B e eu fiz a anamnese da aluna B. E na listagem das
 * alunas cadastradas, tá dizendo que a aluna B, ela tá desligada. Essa aluna B, ela não é aquela
 * aluna B antiga […] é um outro CPF, então é uma outra aluna B. É o homônimo, apenas isso.»
 *
 * PORQUE É QUE ACONTECIA. `estadoDaAluna` perguntava às fontes só pelo APELIDO. O apelido é rótulo
 * e não identidade desde 18/11 (ver `idLegadoDaAluna`, no `bastidores.js`): duas pessoas podem
 * tê-lo, em momentos diferentes. O elenco antigo dizia «Aluna B» e a Turma antiga dizia «Aluna B»
 * — e a aluna nova, que nunca esteve em nenhuma das duas, herdava a memória da primeira e lia-se
 * «desligada» no dia em que se cadastrou.
 *
 * O QUE RESOLVE, E É EVIDÊNCIA E NÃO SUPOSIÇÃO. O elenco guarda `lida` — o carimbo da anamnese que
 * ele LEU para cada apelido (`{«Aluna B»: «anamnese-20261117-1407»}`) —, e a anamnese nova declara
 * de quem é (`alunaId`). É esse o fio: elenco → anamnese lida → pessoa. Sem o fio, o apelido
 * designa o PRIMEIRO titular, que era a única pessoa que ele podia designar quando o registo foi
 * escrito. É a mesma regra dos envelopes antigos, e pela mesma razão.
 */
function idDaAlunaNoElenco(linha, apelido, anamneses) {
  const nome = String(apelido == null ? '' : apelido).trim();
  if (!nome) return '';
  const carimbo = String((linha && linha.lida && linha.lida[nome]) || '').trim();
  const declarado = carimbo && anamneses && typeof anamneses.get === 'function'
    ? String(anamneses.get(carimbo) || '').trim() : '';
  return declarado || idDoApelido(nome);
}

/** O mesmo fio, para a Turma: ela declara o ELENCO, e é o elenco que diz quem é quem. */
function idDaAlunaNaCuradoria(curadoria, apelido, linhasPorId, anamneses) {
  const elenco = curadoria && curadoria.linhaDeBase
    ? linhasPorId.get(String(curadoria.linhaDeBase)) : null;
  return elenco ? idDaAlunaNoElenco(elenco, apelido, anamneses) : idDoApelido(apelido);
}

/** As SALAS (o ritmo) que uma curadoria declara — `turmas` é a forma nova, `turma` a antiga. */
function salasDaCuradoria(c) {
  const nomes = Array.isArray(c && c.turmas) && c.turmas.length
    ? c.turmas
    : [c && c.turma];
  return nomes.map((t) => String(t == null ? '' : t).trim()).filter(Boolean);
}

/** A data que se pode mostrar de uma curadoria: a da vigência, a da substituição, ou nenhuma. */
function quandoDaCuradoria(c) {
  return String((c && (c.vigenteDe || c.substituidaEm || c.atualizada_em)) || '').trim();
}

/**
 * O ESTADO DA ALUNA — `{ desligada: true, sala, em, por }`, ou `{ desligada: false }`.
 *
 * Entrada: `{ aluna, linhas, curadorias, observada }`
 *
 *   · `linhas`      — as linhas de base que a lista lê (o resultado de `linhasDeBase`, isto é, os
 *                     actos com o rascunho por cima quando há um em curso);
 *   · `curadorias`  — TODAS as curadorias da escola, **inclusive as substituídas**: é delas que
 *                     vem a memória de quem já esteve numa Turma;
 *   · `observada`   — `true` quando algum Plano de Observação declara a aluna (a lista da anamnese
 *                     já o sabe pelo `vinculada` do estado; a Produção o passa do índice).
 *
 * `sala` e `em` são o que a tela usa para dizer ONDE ela esteve e QUANDO — as duas coisas que
 * distinguem «desligada» de «nunca esteve aqui» sem abrir o ficheiro do elenco.
 */
function estadoDaAluna({
  aluna, alunaId, linhas, curadorias, observada, anamneses,
} = {}) {
  const apelido = String(aluna == null ? '' : aluna).trim();
  if (!apelido) return { desligada: false };

  /* DE QUEM SE ESTÁ A FALAR — e é aqui que o homónimo se separa (19/11/2026).
   *
   * `alunaId` é a pessoa do registo (o cartão sabe-o). Sem ele — a bancada antiga, o registo
   * anterior ao id — responde-se pelo apelido, que era o comportamento de antes e é a regra certa
   * para o acervo sem id: nesse tempo só havia um titular.
   *
   * AS FONTES SÃO LIDAS PELA MESMA PERGUNTA. Um elenco que declara «Aluna B» refere-se a quem o
   * seu `lida` diz (a anamnese que ele leu); sem esse fio, ao primeiro titular. Uma Turma
   * declara o elenco (`linhaDeBase`), e é o elenco que responde. Assim, a aluna nova que hoje se
   * cadastrou não herda a memória da homónima que saiu — ver `idDaAlunaNoElenco`. */
  const alvo = String(alunaId || '').trim() || idDoApelido(apelido);
  const daLista = Array.isArray(linhas) ? linhas : [];
  const linhasPorId = new Map();
  for (const l of daLista) if (l && l.id) linhasPorId.set(String(l.id), l);

  const emElencoVigente = daLista.some((l) => l && !l.apagada_em
    && alunasDaLinha(l).indexOf(apelido) !== -1
    && idDaAlunaNoElenco(l, apelido, anamneses) === alvo);

  const todasAsCuradorias = Array.isArray(curadorias) ? curadorias : [];
  const daAluna = todasAsCuradorias.filter((c) => c && alunasDaLinha(c).indexOf(apelido) !== -1
    && idDaAlunaNaCuradoria(c, apelido, linhasPorId, anamneses) === alvo);
  const vigentesDela = daAluna.filter((c) => !c.substituidaPor);
  const emTurmaVigente = vigentesDela.length > 0;
  /* ONDE ELA ESTÁ HOJE, e só a DELA (19/11/2026). O nome da turma viaja na resposta porque é ele
   * que a etiqueta da anamnese usa para dizer «vinculada à turma …» — e dizê-lo pelo apelido
   * punha a aluna nova a ler a turma da homónima que saiu. */
  const turmaDeHoje = vigentesDela.length ? (salasDaCuradoria(vigentesDela[0])[0] || '') : '';

  if (emElencoVigente || emTurmaVigente) {
    return { desligada: false, turma: turmaDeHoje, emElenco: emElencoVigente };
  }

  /* OS TRÊS RASTOS. A ordem é a da força: quem a observou, quem a teve numa Turma, e o ato de
   * transferência. O primeiro que existir responde — e os três podem existir juntos, que é o caso
   * comum de quem saiu depois de um ciclo. */
  const substituidas = daAluna.filter((c) => c.substituidaPor)
    .sort((a, b) => quandoDaCuradoria(b).localeCompare(quandoDaCuradoria(a)));
  const anterior = substituidas[0] || null;

  const daTransferencia = daLista
    .map((l) => {
      if (!l) return null;
      if (l.transferida && String(l.transferida.aluna || '').trim() === apelido
        && idDaAlunaNoElenco(l, apelido, anamneses) === alvo) return l.transferida;
      if (l.recebida && String(l.recebida.aluna || '').trim() === apelido
        && idDaAlunaNoElenco(l, apelido, anamneses) === alvo) return l.recebida;
      return null;
    })
    .find(Boolean) || null;

  /* O PO É O ÚNICO RASTO QUE NÃO SE RESOLVE PELO `lida`: o resumo de um Plano de Observação
   * declara os `sujeitos` por APELIDO, e não diz de que elenco os tirou. Fica, por isso, com a
   * regra do primeiro titular — o apelido dele designa quem o tinha quando foi escrito. É uma
   * limitação declarada, e é a que o dado permite: inventar aqui seria pior. */
  const observadaDela = Boolean(observada)
    && (alvo === idDoApelido(apelido) || !alunaId);

  const jaEsteve = observadaDela || Boolean(anterior) || Boolean(daTransferencia);
  if (!jaEsteve) return { desligada: false, turma: '', emElenco: false };

  const sala = anterior ? (salasDaCuradoria(anterior)[0] || '') : '';
  const em = (anterior ? quandoDaCuradoria(anterior) : '')
    || (daTransferencia ? String(daTransferencia.em || '').trim() : '');
  return {
    desligada: true,
    sala,
    em,
    turma: '',
    emElenco: false,
    por: observadaDela ? 'plano-de-observacao' : (anterior ? 'turma' : 'transferencia'),
  };
}

/*
 * =====================================================================================
 * O PROFESSOR QUE JÁ NÃO DÁ TURMA — «já dirigiu uma, hoje não dirige nenhuma»
 * =====================================================================================
 *
 * O quarto selo do professor, irmão do `desligada` da aluna, e o pedido dela a 08/11/2026 foi o
 * mesmo pensamento: «O mesmo pensamento dessa etiqueta deve ser adoptado para o professor na
 * proveniência». O que faltava não era o desligamento (esse é o ato de sair da ESCOLA, e já
 * existe): era o professor que **deixou uma turma para outro** e continua na escola.
 *
 * O DEFEITO, medido no código antes de o corrigir: `professorCurado` perguntava a TODAS as
 * curadorias, inclusive as substituídas. Quando outro professor assumia a turma, a curadoria
 * anterior descia para o histórico com `substituidaPor` — e o que saiu ficava «curado» para
 * sempre, sem turma nenhuma na coluna e com o «Excluir» desabilitado por um trabalho que já não
 * era dele. O selo respondia ao passado e lia-se como presente: exactamente o defeito da aluna,
 * do outro lado.
 *
 * PORQUE `sem turma` E NÃO `desligado`. A palavra já é deste repositório e significa sair da
 * escola. Um professor que passou uma turma a outro não se desligou de nada — ele continua
 * disponível. Dizer a mesma palavra nos dois casos mandaria a direção procurar um desligamento
 * que não houve.
 *
 * O RASTO é o mesmo tipo de prova da aluna: uma curadoria **substituída** que o nomeia. Um Plano
 * de Ensino que já cita o nome dele conta como vínculo de hoje (`vinculado`, e vem antes) — este
 * estado é o caso em que a direção pedagógica foi trocada **antes** de haver plano.
 */

/** O professor é esta pessoa? Aceita o nome de exibição e o slug — as duas formas gravadas. */
function ehEsteProfessor(c, nome, slug) {
  if (!c) return false;
  const de = String(c.professor == null ? '' : c.professor).trim();
  if (!de) return false;
  return de === nome || de === slug || de === (nome && slugificar(nome));
}

/** O slug de um nome de exibição — a mesma regra do cadastro, sem depender do servidor. */
function slugificar(nome) {
  return String(nome == null ? '' : nome)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** As SALAS de uma curadoria, na forma nova (`turmas`) ou na antiga (`turma`). */
function salasDaCuradoria(c) {
  const nomes = Array.isArray(c && c.turmas) && c.turmas.length ? c.turmas : [c && c.turma];
  return nomes.map((t) => String(t == null ? '' : t).trim()).filter(Boolean);
}

/**
 * O ESTADO DO PROFESSOR — `{ semTurma: true, turma, em }`, ou `{ semTurma: false }`.
 *
 * Entrada: `{ professor, curadorias, noPlano }`. `curadorias` são TODAS (com as substituídas, que
 * são a memória de quem dirigiu a turma); `noPlano` é o `professorVinculadoA`, calculado por quem
 * lê os envelopes — o núcleo não lê o acervo.
 */
function estadoDoProfessor({ professor, curadorias, noPlano } = {}) {
  if (noPlano) return { semTurma: false };
  const nome = String((professor && professor.nome) || professor || '').trim();
  const slug = String((professor && professor.slug) || '').trim() || slugificar(nome);
  const lista = (Array.isArray(curadorias) ? curadorias : []);
  const minhas = lista.filter((c) => ehEsteProfessor(c, nome, slug));
  if (!minhas.length) return { semTurma: false };
  if (minhas.some((c) => !c.substituidaPor)) return { semTurma: false };
  const anterior = minhas
    .sort((a, b) => String(b.substituidaEm || '').localeCompare(String(a.substituidaEm || '')))[0] || null;
  return {
    semTurma: true,
    turma: (anterior ? salasDaCuradoria(anterior)[0] : '') || '',
    em: String((anterior && anterior.substituidaEm) || '').trim(),
  };
}

module.exports = {
  acharProfessor,
  estaDesligado,
  desligarProfessor,
  motivoDaRecusaDoDono,
  estadoDaAluna,
  estadoDoProfessor,
  /* A IDENTIDADE DE UM APELIDO NUMA FONTE (19/11/2026) — exportada porque a listagem da anamnese
   * precisa de fazer a MESMA pergunta por fora: «esta linha de base leu o retrato desta pessoa?».
   * Uma segunda cópia da regra divergiria, e a que ficasse para trás seria a da etiqueta. */
  idDoApelido,
  idDaAlunaNoElenco,
  idDaAlunaNaCuradoria,
};
