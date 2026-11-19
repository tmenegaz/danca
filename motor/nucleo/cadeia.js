'use strict';

/**
 * cadeia.js — O ÍNDICE DAS ETAPAS DA CADEIA AUTOMÁTICA (09/11/2026).
 *
 * PORQUE ISTO EXISTE. Até aqui, uma troca de aluna, uma saída ou uma troca de direção de turma
 * deixavam o professor a percorrer a cadeia à mão — «reveja a turma, depois o plano de ensino,
 * depois o plano de observação» —, e a frase do `proximo` era a via crucis: cada etapa num
 * formulário, cada passo na ordem. A pesquisadora pediu que o sistema faça a travessia.
 *
 * O QUE ESTE MÓDULO É, E O QUE ELE NÃO É. Ele é o ÍNDICE: a lista ordenada das etapas, a regra
 * que diz o ESTADO de cada uma e o resumo que a tela mostra. Ele não executa nada — não lê o
 * armazenamento, não deriva documento, não dispara geração. A execução é
 * `motor/servidor/cadeia.js`, que recebe as ações por parâmetro. A fronteira é a do núcleo:
 * isto decide o quê e em que ordem; quem escreve é quem tem infraestrutura.
 *
 * A ORDEM É DE DEPENDÊNCIA, e não de arrumação de ecrã: a Turma declara quem está na sala; o
 * plano de ensino fixa o que se ensina a esses corpos; o plano de observação mede o que o plano
 * fixou; e o pacote é o documento que lê os dois. Trocar a ordem produziria um PO a observar um
 * plano que já não vale — o defeito que a cadeia existe para não repetir.
 *
 * ETAPAS COM ESTADO PRÓPRIO, E NÃO UM CAMPO «cadeia: ok». Um sinal que se esquece de limpar é
 * um sinal que mente (a mesma regra de `revalidacaoPendente`): o estado é derivado do que existe
 * — a Turma, o plano, o PO, o carimbo da geração —, e cai sozinho quando a etapa é feita.
 *
 * A REGRA DO FLUXO COMPLETO (decisão de 09/11/2026). A cadeia automática inteira só corre em
 * registos que já têm o fluxo completo — elenco, Turma, plano e PO. Num registo incompleto,
 * avança-se até onde é possível (os vínculos) e diz-se o que falta, com o sítio onde se faz.
 * Inventar o plano ou o PO que a escola nunca fez seria decidir pedagogia por conta própria.
 */

/**
 * AS ETAPAS, NA ORDEM DA DEPENDÊNCIA. `onde` é uma CHAVE de destino, e não um endereço: quem
 * monta o link é o servidor, que conhece o professor, o ciclo e a escola do contexto — escrever
 * o caminho aqui daria um link para outra escola no dia em que o contexto mudasse.
 */
const ETAPAS = [
  { chave: 'vinculos', rotulo: 'Vínculos e etiquetas', onde: 'producao-turmas' },
  { chave: 'plano-de-ensino', rotulo: 'Plano de ensino', onde: 'porta-plano' },
  { chave: 'plano-de-observacao', rotulo: 'Plano de observação', onde: 'porta-po' },
  { chave: 'pacote', rotulo: 'Documentos gerados (HTML e PDF)', onde: 'geracao' },
];

/** Uma cópia das etapas — quem consome não as altera por acidente. */
function etapas() {
  return ETAPAS.map((e) => ({ chave: e.chave, rotulo: e.rotulo, onde: e.onde }));
}

/** Os nomes, sem acentos nem maiúsculas, para comparar listas de apelidos. */
function nomeLimpo(v) {
  return String(v == null ? '' : v).trim();
}

/**
 * DUAS LISTAS DE ALUNAS SÃO A MESMA? Compara-se o conjunto, e não a ordem: o elenco é uma
 * lista de corpos, não uma fila — a mesma turma com as mesmas seis alunas está em dia mesmo que
 * a ordem mude. O apelido é o identificador estável (P-12), e é ele que a comparação usa.
 */
function mesmasAlunas(a, b) {
  const la = (Array.isArray(a) ? a : []).map(nomeLimpo).filter(Boolean);
  const lb = (Array.isArray(b) ? b : []).map(nomeLimpo).filter(Boolean);
  if (la.length !== lb.length) return false;
  const sa = new Set(la);
  return lb.every((x) => sa.has(x));
}

/** A frase dos vínculos: quantas de cada lado, e quem entrou/saiu quando se sabe. */
function fraseDosVinculos(curadoriaAlunas, elencoAlunas, turma, elenco) {
  const daTurma = (Array.isArray(curadoriaAlunas) ? curadoriaAlunas : []).map(nomeLimpo).filter(Boolean);
  const doElenco = (Array.isArray(elencoAlunas) ? elencoAlunas : []).map(nomeLimpo).filter(Boolean);
  const setTurma = new Set(daTurma);
  const setElenco = new Set(doElenco);
  const saiu = daTurma.filter((a) => !setElenco.has(a));
  const entrou = doElenco.filter((a) => !setTurma.has(a));
  const partes = [];
  if (saiu.length) partes.push('saiu ' + saiu.join(', '));
  if (entrou.length) partes.push('entrou ' + entrou.join(', '));
  const alt = partes.length ? ' (' + partes.join('; ') + ')' : '';
  return 'A Turma «' + (turma || 'sem nome') + '» declara ' + daTurma.length
    + (daTurma.length === 1 ? ' aluna' : ' alunas') + ', e o elenco «' + (elenco || 'sem nome')
    + '» tem ' + doElenco.length + alt + '.';
}

/**
 * O ÍNDICE DE UM REGISTO. Recebe o que existe e devolve as quatro etapas classificadas.
 *
 * `estado` de cada etapa:
 *   · `feita`    — a etapa está em dia (a Turma concorda com o elenco; o documento é posterior
 *                  à mudança; a geração saiu depois dele);
 *   · `pendente` — há o que fazer, e a cadeia automática sabe fazê-lo;
 *   · `bloqueada`— falta uma peça que a cadeia NÃO inventa (o plano, o PO), ou não há Turma que
 *                  receba a mudança. Não é erro: é o registo que ainda não chegou ali.
 *
 * `completa` é a porta do fluxo inteiro: só com elenco, Turma, plano e PO é que a travessia
 * automática dos quatro passos faz sentido. Sem eles, o que se pode fazer faz-se, e o resto é
 * dito.
 */
function indice(estado) {
  const e = estado || {};
  const quando = String(e.quando || '');
  const novo = (quandoDe) => Boolean(quandoDe) && String(quandoDe) >= quando;
  const passos = [];

  /* A DATA NÃO BASTA: A DIREÇÃO TAMBÉM MANDA (10/11/2026).
   *
   * O DEFEITO MEDIDO. A pesquisadora derivou a Turma da sala Rosa trocando o professor (Pé Torto
   * → Redinha Rosa) a 10/11, e o plano vigente era de 10/11 às 13:04. A pergunta era só «o
   * documento é anterior à mudança?», e `2026-11-10T13:04 >= 2026-11-10` responde sim: a cadeia
   * deu o plano por `feita`, não derivou elo nenhum, e o plano — e o PO, e o documento impresso —
   * continuaram a declarar o professor ANTIGO. A geração correu com o nome errado no cabeçalho.
   *
   * O documento é anterior à mudança por outra razão que não a hora: ele declara OUTRA direção.
   * A data é um indício; a identidade é a prova. Quem manda é a comparação com o que a curadoria
   * declara AGORA — o professor e a sala —, e ela vale mesmo para um elo do mesmo dia.
   *
   * A SALA ENTRA PORQUE O NOME DELA É A IDENTIDADE DO PLANO (`contexto-turma`), e é ele que
   * nomeia a variante. Uma Turma que muda de sala tem de reescrever essa linha. */
  const direcao = (doc) => {
    const ctx = (doc && doc.contexto) || {};
    return {
      professor: String(ctx.professor || '').trim(),
      turma: String(ctx.turma || '').trim(),
      /* A MODALIDADE QUE O DOCUMENTO DECLARA (T3, 19/11/2026). O campo é admitido no contexto
       * desde sempre (`CAMPOS_DE_CONTEXTO`, em `motor/nucleo/elicitar.js`) — o que faltava era
       * alguém a escrevê-lo e alguém a lê-lo. Um elo de antes desta data não o declara, e o vazio
       * não conta: quem não declara não está errado. */
      modalidade: String(ctx.modalidade || '').trim(),
    };
  };
  /* A DIREÇÃO DE HOJE É A DA SALA (19/11/2026) — e a cópia da curadoria é o recurso.
   *
   * O par (modalidade, professor) vive na Sala desde 18/11/2026; a curadoria guarda uma cópia do
   * dia em que foi escrita. Comparar a direção do documento com a cópia é comparar com o passado:
   * medido a 19/11/2026, mudar o professor pela rota da Sala deixava `professorMudou` a responder
   * «é o mesmo» — a guarda que existe para apanhar a troca de professor não a apanhava, e o único
   * motivo que sobrava era a data (`experimentos/provar-os-fluxos-da-derivacao`).
   *
   * O `de` de hoje é a SALA; a cópia responde quando a Sala ainda não declara o par (uma sala de
   * antes de 18/11, ou uma bancada que só monta a curadoria). */
  const salaDeHoje = e.sala && typeof e.sala === 'object' ? e.sala : null;
  const direcaoDeHoje = {
    professor: String((salaDeHoje && salaDeHoje.professor)
      || (e.curadoria && e.curadoria.professor) || '').trim(),
    turma: String(e.turma || ((e.curadoria && (e.curadoria.turmas || [])[0]) || '')).trim(),
    modalidade: String((salaDeHoje && salaDeHoje.modalidade)
      || (e.curadoria && e.curadoria.modalidade) || '').trim(),
  };
  /** O documento declara outra direção? Vazio não conta: um elo antigo que não declara professor
   *  não é um elo errado — é um elo de antes de haver esse campo. */
  const direcaoMudou = (doc) => {
    const d = direcao(doc);
    if (d.professor && direcaoDeHoje.professor && d.professor !== direcaoDeHoje.professor) return true;
    if (d.turma && direcaoDeHoje.turma && d.turma !== direcaoDeHoje.turma) return true;
    return false;
  };

  /* AS DUAS MUDANÇAS NÃO SÃO A MESMA COISA (12/11/2026).
   *
   * O DEFEITO. `direcaoMudou` juntava «a sala mudou de nome» e «o professor mudou» numa pergunta
   * só, e a resposta para as duas era «a cadeia deriva um elo novo, com a mesma matéria e a
   * direção corrigida». Para a sala está certo: o plano é do MESMO professor, e o nome da sala é
   * a identidade do documento — relê-se a linha e o passado fica no elo anterior.
   *
   * Para o professor, não. Um plano é o que um professor decidiu sobre uma turma; reescrever-lhe
   * o autor não é corrigir uma leitura de cadastro — é afirmar que alguém escreveu o que não
   * escreveu. Foi o que aconteceu, e está medido nos envelopes do `calango`:
   * `plano-20261110-2145` diz `redinha-rosa` e é `ajuste_de` um plano do `pe-torto`, com o texto
   * do Pé Torto lá dentro. A pesquisadora leu-o na listagem: «ele trocou o nome do plano de
   * ensino atual para quem fez sendo a Redinha Rosa e isso não é verdade».
   *
   * A REGRA QUE PASSA A VALER: **a autoria não se deriva.** Quem passa a dirigir a turma não
   * herda o documento do anterior — escreve o dele. O documento do anterior continua a existir,
   * a dizer o seu autor, e a listagem passa a dizer dele o que é verdade: que está `sem turma`. */
  const professorMudou = (doc) => {
    const d = direcao(doc);
    return Boolean(d.professor && direcaoDeHoje.professor && d.professor !== direcaoDeHoje.professor);
  };
  const salaMudou = (doc) => {
    const d = direcao(doc);
    return Boolean(d.turma && direcaoDeHoje.turma && d.turma !== direcaoDeHoje.turma);
  };
  /* A MODALIDADE CONTRATADA TAMBÉM MANDA, E ELA **BLOQUEIA** (T3, 19/11/2026).
   *
   * «A minha turma é iniciante; se eu botar algo complexo aqui já não está legal.» A modalidade não
   * é uma etiqueta: é o **corpo de referência** com que se mede — as anamneses são por modalidade,
   * os níveis são outros, e a régua vem com o par (`conferirOParDaSala`). Um plano escrito sob
   * «Balé clássico» e um PO que mede contra a régua do clássico **não** continuam válidos quando a
   * Sala passa a declarar «Dança moderna».
   *
   * PORQUE BLOQUEIA E NÃO DERIVA, ao contrário da sala. Mudar a sala é reler o cadastro: o mesmo
   * professor, o mesmo documento, outra linha no `## Contexto`. Mudar a modalidade troca o
   * INSTRUMENTO — e a cadeia não reinterpreta pedagogia. Ela pára e diz, como faz com a autoria: é
   * o professor que escreve o plano da modalidade que vale hoje.
   *
   * E COMO A BLOCK SE LEVANTA: quando o plano (ou o PO) declarar a modalidade nova no seu contexto.
   * É a mesma mecânica da autoria — o documento novo diz a verdade nova, e o antigo fica como
   * passado. O que a cadeia **não** faz é escrever a modalidade nova num elo derivado: isso
   * levantaria a trava sem ninguém ter escrito nada.
   *
   * O VAZIO NÃO CONTA, pela convenção de sempre: um elo anterior a esta data não declara a
   * modalidade, e não declarar não é estar errado. */
  const modalidadeMudou = (doc) => Boolean(direcao(doc).modalidade && direcaoDeHoje.modalidade
    && direcao(doc).modalidade !== direcaoDeHoje.modalidade);
  /** A frase da modalidade — a mesma para o plano e o PO, porque o facto é o mesmo. */
  const fraseDaModalidade = (doc) => 'O documento «' + String((doc && doc.id) || '—') + '» foi '
    + 'escrito sob a modalidade «' + direcao(doc).modalidade + '», e a Sala declara hoje «'
    + direcaoDeHoje.modalidade + '». Não é a mesma escala — a régua vem com o par, os níveis são '
    + 'outros, e as anamneses são por modalidade. A cadeia não converte um documento de uma '
    + 'modalidade noutra: ' + (direcaoDeHoje.professor
      ? '«' + direcaoDeHoje.professor + '» escreve o dele' : 'quem dirige escreve o seu')
    + ', sob a modalidade que vale hoje.';
  /** O autor do documento que já não dirige esta turma — o nome que a frase precisa de dizer. */
  const autorDoOutro = () => {
    const de = e.planoDeOutro || e.poDeOutro || null;
    return String((de && (de.professorNome || de.professor || de.autor)) || '').trim();
  };

  // 1. OS VÍNCULOS — a Turma tem de declarar o corpo que o elenco declara.
  if (!e.elenco) {
    passos.push({
      chave: 'vinculos', estado: 'bloqueada',
      falta: 'O elenco que esta Turma declara já não existe (ou nunca existiu) — não há corpo '
        + 'para sincronizar. Escolha um elenco na Turma.',
    });
  } else if (!e.curadoria) {
    passos.push({
      chave: 'vinculos', estado: 'bloqueada',
      falta: 'Nenhuma Turma escolheu o elenco «' + (e.elenco.nome || e.elenco.id) + '» — o corpo '
        + 'mudou, mas não há sala que o receba. Escolha o elenco na Turma.',
    });
  } else if (mesmasAlunas(e.elenco.alunas, e.curadoria.alunas)) {
    passos.push({ chave: 'vinculos', estado: 'feita' });
  } else {
    passos.push({
      chave: 'vinculos', estado: 'pendente',
      falta: fraseDosVinculos(e.curadoria.alunas, e.elenco.alunas,
        e.turma || (e.curadoria.turmas || [])[0], e.elenco.nome || e.elenco.id),
    });
  }

  // 2. O PLANO DE ENSINO — derivado depois da mudança.
  if (!e.plano && e.planoDeOutro) {
    /* O PLANO DESTA TURMA É DE OUTRO PROFESSOR (12/11/2026). Não se deriva: quem dirige a turma
     * hoje escreve o seu. A frase diz o facto, e não manda procurar. */
    const autor = autorDoOutro();
    passos.push({
      chave: 'plano-de-ensino', estado: 'bloqueada', id: e.planoDeOutro.id || null,
      falta: 'O plano de ensino desta Turma é de ' + (autor ? '«' + autor + '»' : 'outro professor')
        + ', que já não a dirige. A autoria não se reescreve: o documento continua a ser dele, e '
        + 'passa a «sem turma». Quem dirige a Turma hoje escreve o plano dela na porta — é o «!» '
        + 'no professor, no cabeçalho.',
    });
  } else if (!e.plano) {
    passos.push({
      chave: 'plano-de-ensino', estado: 'bloqueada',
      falta: 'A Turma «' + (e.turma || 'sem nome') + '» ainda não tem plano de ensino. O '
        + 'primeiro nasce na porta, e a cadeia não o inventa: o plano fixa decisões pedagógicas '
        + 'que são do professor.',
    });
  } else if (professorMudou(e.plano)) {
    /* A GUARDA DE BAIXO DA ESCADA. Se o servidor entregar na mesma o plano de outro professor
     * (uma chamada directa, um dia em que a selecção mude), a cadeia não o reatribui: pára aqui. */
    passos.push({
      chave: 'plano-de-ensino', estado: 'bloqueada', id: e.plano.id || null,
      falta: 'O plano de ensino «' + (e.plano.id || '—') + '» é de «'
        + (direcao(e.plano).professor || '—') + '», e a Turma é dirigida hoje por «'
        + (direcaoDeHoje.professor || '—') + '». A autoria não se reescreve — este professor '
        + 'escreve o plano dele.',
    });
  } else if (modalidadeMudou(e.plano)) {
    /* ANTES DA SALA, E NÃO DEPOIS (T3). A ordem da escada é a gravidade: a autoria (o documento é
     * de outra pessoa), o instrumento (a modalidade), e só então a leitura do cadastro (a sala).
     * Um plano cuja modalidade mudou não se conserta derivando — tem de ser escrito. */
    passos.push({
      chave: 'plano-de-ensino', estado: 'bloqueada', id: e.plano.id || null,
      falta: fraseDaModalidade(e.plano),
    });
  } else if (salaMudou(e.plano)) {
    passos.push({
      chave: 'plano-de-ensino', estado: 'pendente', id: e.plano.id || null,
      falta: 'O plano de ensino «' + (e.plano.id || '—') + '» declara outra sala — '
        + 'a sala «' + direcao(e.plano).turma + '» passou a «' + direcaoDeHoje.turma
        + '». A cadeia deriva um elo novo, com o mesmo conteúdo e a direção corrigida.',
    });
  } else if (novo(e.plano.gerado_em || e.plano.id)) {
    passos.push({ chave: 'plano-de-ensino', estado: 'feita', id: e.plano.id || null });
  } else {
    passos.push({
      chave: 'plano-de-ensino', estado: 'pendente', id: e.plano.id || null,
      falta: 'O plano de ensino «' + (e.plano.id || '—') + ' é anterior à mudança — a cadeia '
        + 'deriva um elo novo, com o mesmo conteúdo e o vínculo corrigido.',
    });
  }

  // 3. O PLANO DE OBSERVAÇÃO — derivado depois do plano de ensino.
  if (!e.plano) {
    passos.push({
      chave: 'plano-de-observacao', estado: 'bloqueada',
      falta: 'Sem plano de ensino não há o que observar — o PO nasce do plano.',
    });
  } else if (!e.po) {
    passos.push({
      chave: 'plano-de-observacao', estado: 'bloqueada',
      falta: 'A Turma ainda não tem plano de observação. Ele nasce do plano de ensino, na porta, '
        + 'e a cadeia não o inventa: a linha de base dos sujeitos é uma decisão do professor.',
    });
  } else if (professorMudou(e.po)) {
    /* A MESMA REGRA DO PLANO, e pela mesma razão (12/11/2026): «no plano de observação a gente tá
     * com o mesmo problema […] Vai ser a mesma regra.» Um PO do professor antigo não observa a
     * turma do professor novo — e não se reatribui: quem passou a dirigir faz o seu. */
    passos.push({
      chave: 'plano-de-observacao', estado: 'bloqueada', id: e.po.id || null,
      falta: 'O plano de observação «' + (e.po.id || '—') + '» é de «'
        + (direcao(e.po).professor || '—') + '», que já não dirige esta Turma. A autoria não se '
        + 'reescreve: ele continua a ser dele, e passa a «sem turma». O professor que dirige hoje '
        + 'faz o PO dele, sobre o plano dele.',
    });
  } else if (modalidadeMudou(e.po)) {
    /* A MESMA REGRA DO PLANO, e pela mesma razão: o PO mede contra os níveis da régua que veio com
     * o par (T3, 19/11/2026). */
    passos.push({
      chave: 'plano-de-observacao', estado: 'bloqueada', id: e.po.id || null,
      falta: fraseDaModalidade(e.po),
    });
  } else if (salaMudou(e.po)) {
    passos.push({
      chave: 'plano-de-observacao', estado: 'pendente', id: e.po.id || null,
      falta: 'O plano de observação «' + (e.po.id || '—') + '» declara outra sala — a cadeia '
        + 'deriva um elo novo, que observa o plano de ensino vigente na sala de hoje.',
    });
  } else if (novo(e.po.gerado_em || e.po.id)) {
    passos.push({ chave: 'plano-de-observacao', estado: 'feita', id: e.po.id || null });
  } else {
    passos.push({
      chave: 'plano-de-observacao', estado: 'pendente', id: e.po.id || null,
      falta: 'O plano de observação «' + (e.po.id || '—') + '» é anterior à mudança — a cadeia '
        + 'deriva um elo novo, que observa o plano de ensino vigente.',
    });
  }

  // 4. O PACOTE — a geração que lê os dois documentos.
  if (e.pacoteEmDia) {
    passos.push({ chave: 'pacote', estado: 'feita' });
  } else if (!e.po) {
    passos.push({
      chave: 'pacote', estado: 'bloqueada',
      falta: (e.planoDeOutro || e.poDeOutro)
        ? 'Os documentos gerados são a leitura do plano de ensino e do plano de observação — e os '
          + 'desta Turma são de outro professor. A geração espera os documentos de quem a dirige '
          + 'hoje: não se gera um pacote com a autoria trocada.'
        : 'O pacote lê o plano de ensino e o plano de observação; sem o PO não há o que gerar.',
    });
  } else {
    /* O «ABRIR» DO PACOTE ENTRA NO DOCUMENTO (10/11/2026).
     *
     * A etapa não levava `id` nem `plano`, e sem eles o endereço saía sem `ajustar=`: a porta
     * abria sem documento para carregar, a trava dela não encontrava o que validar e devolvia o
     * professor à LISTAGEM. É literalmente o que a pesquisadora descreveu: «me levou até o
     * ajuste, e quando eu cliquei no botão para fechar e gerar, ele voltou para a listagem».
     *
     * O pacote FECHA-SE no PO: é lá que está o «Guardar» que grava as fontes e dispara a
     * geração. O endereço desta etapa é, por isso, o do PO — com o plano que ele observa. */
    passos.push({
      chave: 'pacote', estado: 'pendente',
      falta: 'Os documentos gerados (HTML e PDF) ainda são os de antes da mudança — a geração '
        + 'corre depois de os dois planos estarem em dia.',
    });
  }

  const completa = Boolean(e.elenco && e.curadoria && e.plano && e.po);
  return { completa, etapas: passos };
}

/**
 * O RESUMO PARA QUEM MOSTRA. `ok` só é verdadeiro quando TODAS as etapas estão feitas; o
 * `proxima` é a primeira que falta, na ordem da dependência — é ela que a tela põe à frente, e
 * é o link que o professor clica primeiro.
 */
function resumo(passos) {
  const lista = Array.isArray(passos) ? passos : [];
  const faltam = lista.filter((p) => p && p.estado !== 'feita');
  return {
    ok: lista.length > 0 && faltam.length === 0,
    feitas: lista.filter((p) => p && p.estado === 'feita').map((p) => p.chave),
    faltam,
    proxima: faltam.length ? faltam[0] : null,
  };
}

/**
 * A ETAPA SEGUINTE À ÚLTIMA FEITA — a que a cadeia tenta agora. Devolve `null` quando não há
 * nada a fazer, e o passo `bloqueada` quando é ele que trava a travessia: a cadeia pára ali e
 * reporta, e NUNCA salta por cima de uma peça que não existe.
 */
function proximaEtapa(passos) {
  const lista = Array.isArray(passos) ? passos : [];
  const falta = lista.find((p) => p && p.estado !== 'feita');
  return falta || null;
}

/** O rótulo de um gatilho, para o log e para a tela. */
const ROTULOS_DO_GATILHO = {
  'troca-de-aluna': 'troca de aluna entre elencos',
  'saida-de-aluna': 'saída de aluna do elenco',
  'troca-de-direcao': 'troca de professor ou modalidade da turma',
  'mudanca-de-sala': 'mudança de sala (o ritmo da Turma)',
};

function rotuloDoGatilho(gatilho) {
  return ROTULOS_DO_GATILHO[gatilho] || String(gatilho || 'mudança');
}

module.exports = {
  ETAPAS,
  ROTULOS_DO_GATILHO,
  etapas,
  mesmasAlunas,
  fraseDosVinculos,
  indice,
  resumo,
  proximaEtapa,
  rotuloDoGatilho,
};
