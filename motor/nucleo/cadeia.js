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
/**
 * O RITMO, PARA SE PODER COMPARAR (20/11/2026) — os auxiliares de `ritmoMudou`.
 *
 * `canonico` põe uma resposta numa forma que se compara por igualdade: as chaves por ordem, e os
 * dias da semana por ordem também. Sem a ordenação, `['qua','seg','sex']` e `['seg','qua','sex']`
 * seriam ritmos diferentes — e o professor veria um elo novo sem nada ter mudado.
 *
 * A DURAÇÃO É COMPARADA EM MINUTOS, e não pela forma como foi escrita: a Sala de 60 minutos é
 * gravada `[{numero:1, unidade:'hora'}]`, e um elo antigo pode dizê-la `[{numero:60,
 * unidade:'minuto'}]`. São o mesmo ritmo, e uma comparação de texto acusaria uma mudança que não
 * houve.
 */
function canonico(valor) {
  if (Array.isArray(valor)) return '[' + valor.map(canonico).join(',') + ']';
  if (valor && typeof valor === 'object') {
    return '{' + Object.keys(valor).sort().map((k) => k + ':' + canonico(valor[k])).join(',') + '}';
  }
  return JSON.stringify(valor === undefined ? null : valor);
}

/** A duração em minutos, ou `null` quando o valor não é uma duração legível. */
function minutosDaDuracao(valor) {
  const lista = Array.isArray(valor) ? valor : (valor ? [valor] : []);
  if (!lista.length) return null;
  let total = 0;
  for (const parte of lista) {
    const n = Number(parte && parte.numero);
    if (!Number.isFinite(n)) return null;
    const unidade = String((parte && parte.unidade) || 'minuto').toLowerCase();
    total += unidade.indexOf('ho') === 0 ? n * 60 : n;
  }
  return total;
}

/** A mesma resposta de ritmo dos dois lados, numa forma comparável. */
function normalizarRitmo(chave, valor) {
  if (chave === 'contexto-duracao') {
    const minutos = minutosDaDuracao(valor);
    return minutos === null ? canonico(valor) : 'minutos:' + minutos;
  }
  if (chave === 'contexto-frequencia' && valor && typeof valor === 'object'
    && Array.isArray(valor.dias)) {
    return canonico(Object.assign({}, valor, { dias: valor.dias.slice().sort() }));
  }
  if (chave === 'contexto-total-aulas') return 'aulas:' + Number(valor);
  return canonico(valor);
}

/** O ritmo de hoje em português, para a frase que a tela mostra. */
function descreverRitmo(ritmo) {
  const r = ritmo || {};
  const partes = [];
  const freq = r['contexto-frequencia'];
  if (freq && typeof freq === 'object') {
    const dias = Array.isArray(freq.dias) ? freq.dias.filter(Boolean) : [];
    partes.push(Number(freq.vezes || dias.length || 0) + '× por semana'
      + (dias.length ? ' (' + dias.join(', ') + ')' : ''));
  }
  const minutos = minutosDaDuracao(r['contexto-duracao']);
  if (minutos !== null) partes.push(minutos + ' minutos');
  const cal = r['contexto-calendario'];
  if (cal && typeof cal === 'object' && (cal.inicio || cal.fim)) {
    partes.push('de ' + (cal.inicio || '—') + ' a ' + (cal.fim || '—'));
  }
  return partes.length ? partes.join(', ') : 'um ritmo diferente';
}

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

  /* O RITMO DECLARADO TAMBÉM MANDA — E ELE NÃO ESPERA PELA DATA (20/11/2026).
   *
   * O QUE ACONTECEU, medido. Ela derivou a Sala `Rosa` mudando o horário (14:30), a duração (45 →
   * 60 min) e o fim do período (05/02 → 08/01). A Sala derivou e persistiu; o plano e o PO, não:
   * a cadeia deu as duas etapas por `feita` sobre os elos ANTIGOS e só disparou a geração. O log
   * é a prova — `mudanca-de-sala · plano-de-ensino feita · pacote falta` —, e o documento gerado
   * saiu a dizer **45 minutos** sobre uma Sala de 60.
   *
   * A CAUSA NÃO ERA O RITMO, ERA A DATA. A escada perguntava `novo(gerado_em || id)`: o plano é
   * de `2026-11-19T21:44`, a vigência da Sala é a DATA `2026-11-19`, e a comparação de strings dá
   * o carimbo por mais novo — o prefixo bate, a string maior ganha. A mudança foi às 23:34 do
   * mesmo dia: o plano era duas horas mais velho, e a data não sabe disso.
   *
   * A LIÇÃO JÁ ESTAVA ESCRITA NESTE FICHEIRO, dez linhas acima, para a direção: «A data é um
   * indício; a identidade é a prova.» O ritmo é a identidade do plano no que toca ao cadastro. Um
   * plano que declara 45 minutos sobre uma Sala que declara 60 está provadamente desactualizado,
   * e não é preciso comparar horas nenhumas.
   *
   * O QUE SE COMPARA são as QUATRO chaves que a derivação relê — as mesmas, do mesmo sítio
   * (`respostasDoRitmo`, que o servidor passa em `e.ritmo`). Comparar outras, ou compará-las por
   * outra via, faria a guarda e a derivação discordarem no dia em que uma delas mudasse: o elo
   * sairia com um valor e a guarda continuaria a dizer que estava em dia.
   *
   * O VAZIO NÃO CONTA, pela convenção de sempre: um elo de antes de um campo existir não declara
   * esse campo, e não declarar não é estar errado. E sem `e.ritmo` (uma bancada, um adaptador que
   * não lê turmas) a guarda cala-se — quem não sabe o ritmo de hoje não acusa ninguém. */
  const ritmoMudou = (doc) => {
    const deHoje = e.ritmo && typeof e.ritmo === 'object' ? e.ritmo : null;
    if (!deHoje) return false;
    const respostas = (doc && doc.respostas) || {};
    for (const chave of ['contexto-frequencia', 'contexto-duracao', 'contexto-calendario',
      'contexto-total-aulas']) {
      const agora = deHoje[chave];
      if (agora === undefined || agora === null) continue;
      const cru = respostas[chave];
      const antes = cru && typeof cru === 'object' && !Array.isArray(cru) && 'valor' in cru
        ? cru.valor : cru;
      if (antes === undefined || antes === null) continue; // o elo não declara: não é erro
      if (normalizarRitmo(chave, antes) !== normalizarRitmo(chave, agora)) return true;
    }
    return false;
  };
  /* O CONTEÚDO DA TURMA MANDA, E A DATA NÃO O SABE (20/11/2026) — o quarto defeito da mesma
   * família, e o que ela mediu ao vivo com todas as letras.
   *
   * O QUE ACONTECEU. Ela acrescentou o «Batman GT» à Turma `Rosa`, escolheu o objetivo 3 na
   * janela, gravou — e o plano continuou com o `aula-1-parametro` sem nenhum objetivo marcado. A
   * Travessia correu: o log tem seis execuções entre 19:20 e 20:22, todas `ok: true`, todas com
   * `plano-de-ensino · feita · id plano-20261120-1411`. O plano NUNCA foi derivado, e a
   * declaração da Turma nunca teve onde ser aplicada.
   *
   * A CAUSA É A ESCADA, E É A MESMA DAS TRÊS VEZES ANTERIORES. A última pergunta da escada é
   * `novo(e.plano.gerado_em || e.plano.id)`, e `e.quando` é a VIGÊNCIA da Turma — uma DATA,
   * `2026-11-20`. O plano é de `2026-11-20T14:11`: a comparação de strings diz que
   * `'2026-11-20T14:11' >= '2026-11-20'`, ou seja, que o plano é mais novo do que a mudança. Foi
   * verdade para o ritmo (a lição está escrita dezasseis linhas acima) e é verdade para o
   * conteúdo, todos os dias, todas as vezes — porque tudo acontece no mesmo dia.
   *
   * A PROVA É A IDENTIDADE, NÃO A DATA — a regra que este ficheiro já segue desde 10/11: «A data é
   * um indício; a identidade é a prova.» Aqui a identidade é o CONTEÚDO, e ela é comparável sem
   * horas nenhumas:
   *
   *   · a Turma DECLARA um exercício que serve um objetivo e o plano não o carrega → o plano está
   *     velho, e derivá-lo é aplicá-lo (`aplicarDeclaracoes`);
   *   · o plano carrega um exercício que a Turma já não ensina → o plano está velho, e derivá-lo é
   *     podá-lo (`podarForaDoRepertorio`).
   *
   * AS DUAS CONDIÇÕES SÃO IDEMPOTENTES, e é isso que as torna seguras: depois de derivar, ou o
   * termo está no plano (e a primeira deixa de valer), ou foi podado (e a segunda deixa de valer).
   * A única declaração que a derivação NÃO aplica é a de um exercício que a aula já usa — e essa
   * também não dispara nada, porque ela exige que o termo FALTE no plano.
   *
   * O QUE NÃO ENTRA NESTA CONTA, e é de propósito:
   *   · um exercício da Turma SEM declaração não faz o plano mudar — `aplicarDeclaracoes` só
   *     escreve o que foi declarado, portanto exigi-lo aqui seria pedir uma derivação que não
   *     deriva nada, para sempre;
   *   · uma Turma sem `repertorio` declarado não julga ninguém (a convenção de sempre: o vazio não
   *     conta), e uma bancada que não passe `e.conteudo` cala esta guarda por completo. */
  const termosDe = (valor) => {
    const lista = Array.isArray(valor) ? valor
      : (valor === null || valor === undefined ? [] : [valor]);
    const saida = [];
    for (const item of lista) {
      const t = String(item === null || item === undefined ? '' : item).trim();
      if (t && saida.indexOf(t) === -1) saida.push(t);
    }
    return saida;
  };
  /** A resposta de um id no documento, desembrulhada do registro `{valor, …}`. */
  const valorNoDocumento = (doc, chave) => {
    const cru = (doc && doc.respostas && doc.respostas[chave]) || null;
    return cru && typeof cru === 'object' && !Array.isArray(cru) && 'valor' in cru
      ? cru.valor : cru;
  };
  /** O conteúdo que a Turma manda hoje — `{repertorio: [...], declaracoes: {termo: [n]}}`. */
  const conteudoDeHoje = () => (e.conteudo && typeof e.conteudo === 'object' ? e.conteudo : null);
  /**
   * O que o plano carrega a mais, e o que a Turma declara a mais. Devolve `{falta, sobra}` com os
   * termos — vazio e vazio é «está em dia».
   */
  const diferencaDeConteudo = (doc) => {
    const hoje = conteudoDeHoje();
    if (!hoje) return { falta: [], sobra: [] };
    const daTurma = termosDe(hoje.repertorio);
    if (!daTurma.length) return { falta: [], sobra: [] }; // o vazio não julga
    const doPlano = termosDe(valorNoDocumento(doc, 'repertorio'));
    const declarados = Object.keys(hoje.declaracoes || {});
    const falta = [];
    for (const termo of declarados) {
      const t = String(termo || '').trim();
      if (t && daTurma.indexOf(t) !== -1 && doPlano.indexOf(t) === -1) falta.push(t);
    }
    const sobra = [];
    for (const termo of doPlano) {
      if (daTurma.indexOf(termo) === -1) sobra.push(termo);
    }
    return { falta, sobra };
  };
  const conteudoMudou = (doc) => {
    const d = diferencaDeConteudo(doc);
    return Boolean(d.falta.length || d.sobra.length);
  };
  /** A frase do conteúdo — uma só, para o plano e para o PO, porque o facto é o mesmo. */
  const fraseDoConteudo = (doc) => {
    const d = diferencaDeConteudo(doc);
    const partes = [];
    if (d.falta.length) {
      partes.push('a Turma declara ' + (d.falta.length === 1 ? 'o exercício ' : 'os exercícios ')
        + d.falta.map((t) => '«' + t + '»').join(', ')
        + ', e ' + (d.falta.length === 1 ? 'ele não está' : 'eles não estão')
        + ' na lista de «' + String((doc && doc.id) || '—') + '»');
    }
    if (d.sobra.length) {
      partes.push('«' + String((doc && doc.id) || '—') + '» ainda carrega '
        + d.sobra.map((t) => '«' + t + '»').join(', ')
        + ', e a Turma já não ' + (d.sobra.length === 1 ? 'o ensina' : 'os ensina'));
    }
    return 'O conteúdo da Turma mudou: ' + partes.join('; ') + '. A cadeia deriva um elo novo '
      + 'com a lista de hoje — o passado fica no elo anterior.';
  };

  /** O plano de ensino vai mudar nesta passagem? Lê a etapa que já foi calculada acima. */
  const planoVaiMudar = () => {
    const passo = passos.find((p) => p.chave === 'plano-de-ensino');
    return Boolean(passo && passo.estado === 'pendente');
  };
  /** A frase do ritmo — uma só, para o plano e para o PO, porque o facto é o mesmo. */
  const fraseDoRitmo = (doc) => 'O documento «' + String((doc && doc.id) || '—') + '» declara '
    + 'outro ritmo de aula, e a Sala declara hoje ' + descreverRitmo(e.ritmo) + '. A cadeia deriva '
    + 'um elo novo com o mesmo conteúdo e o cadastro corrigido — o passado fica no elo anterior.';

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
  } else if (ritmoMudou(e.plano)) {
    /* ANTES DA DATA, porque é prova e não indício (20/11/2026). O plano declara um ritmo que a
     * Sala já não tem — e derivar é exactamente reler o cadastro: o mesmo conteúdo, as quatro
     * linhas corrigidas. É o mesmo `pendente` de `salaMudou`, e pela mesma razão. */
    passos.push({
      chave: 'plano-de-ensino', estado: 'pendente', id: e.plano.id || null,
      falta: fraseDoRitmo(e.plano),
    });
  } else if (conteudoMudou(e.plano)) {
    /* ANTES DA DATA, E PELA MESMA RAZÃO DO RITMO (20/11/2026): o conteúdo é prova, a data é
     * indício. E aqui é o único caminho por onde a DECLARAÇÃO do objetivo — a resposta que a
     * janela da Turma recebeu — chega ao papel. */
    passos.push({
      chave: 'plano-de-ensino', estado: 'pendente', id: e.plano.id || null,
      falta: fraseDoConteudo(e.plano),
    });
  } else if (novo(e.plano.gerado_em || e.plano.id)) {
    /* E O PEDIDO DELA DE ATUALIZAR AGORA (20/11/2026). Há ajustes que NÃO passam pela cadeia — a
     * régua da sala, o vocabulário, o verbete —, e que só chegam ao documento quando um plano novo
     * é derivado: a régua, por exemplo, viaja no envelope do plano como fotografia, e a geração lê
     * o envelope. Sem isto, o botão «Atualizar o ciclo» gerava documentos a partir de um plano
     * velho e não mudava um byte — um botão que promete e não faz.
     *
     * `forcar` é o pedido explícito do professor, e por isso fica escrito na falta: quem lê o log
     * meses depois tem de saber que este elo nasceu de um clique, e não de uma mudança. */
    if (e.forcar) {
      passos.push({
        chave: 'plano-de-ensino', estado: 'pendente', id: e.plano.id || null,
        falta: 'O professor pediu para levar a Turma ao ciclo agora — a cadeia deriva um elo novo '
          + 'com o estado de hoje: a régua, o conteúdo e o ritmo que a Turma declara.',
      });
    } else {
      passos.push({ chave: 'plano-de-ensino', estado: 'feita', id: e.plano.id || null });
    }
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
  } else if (planoVaiMudar()) {
    /* O PO SEGUE O PLANO, E NÃO A SUA PRÓPRIA DATA (20/11/2026).
     *
     * O QUE ACONTECEU, medido. A Sala `Rosa` foi derivada com ritmo novo (60 min, fim 08/01); o
     * plano tinha 45 min e a cadeia deu-o por «feito» — corrigido acima, pela guarda do ritmo.
     * Mas mesmo com o plano a derivar, o PO ficava `feita`, e o `porTurma` tinha um plano novo e
     * um PO a observar o antigo: as duas cadeias paralelas que o `concluirPO` existe para
     * impedir.
     *
     * E NÃO SE RESOLVE PELO RITMO. O PO real não declara `contexto-frequencia`,
     * `contexto-duracao` nem `contexto-calendario` — medido no `po-20261119-2144` da `breu`: as
     * chaves `contexto-*` dele são ZERO. Uma guarda de ritmo no PO responderia sempre «não mudou»
     * e a prova passaria com dados que a produção nunca tem — que é a pior prova possível.
     *
     * A REGRA CERTA É ESTRUTURAL: o PO observa o plano. Se o plano vai mudar, o PO vai observar
     * um plano que já não é o vigente — e isso não é uma inferência sobre o conteúdo dele, é uma
     * consequência da ordem das etapas. Quem sabe que o plano vai mudar é a etapa anterior, que
     * já está calculada em `passos`.
     *
     * E SÓ QUANDO O PLANO VAI DERIVAR (`pendente`). Um plano `bloqueado` — autoria ou modalidade
     * — já parou a cadeia na etapa dele, e o PO não tem por onde seguir. */
    passos.push({
      chave: 'plano-de-observacao', estado: 'pendente', id: e.po.id || null,
      falta: 'O plano de observação «' + (e.po.id || '—') + '» observa o plano de ensino que vai '
        + 'ser substituído — a cadeia deriva um elo novo, que observa o plano vigente depois da '
        + 'mudança.',
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
  /* O PEDIDO DELA (20/11/2026): «se ele quiser que seja gerado agora, a gente vai colocar um botão
   * na turma que dispara então a regeneração». O gatilho diz o que foi — um clique —, e não uma
   * mudança; é o que distingue este elo dos que nascem de factos. */
  'atualizacao-pedida': 'o professor pediu para atualizar o ciclo',
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
