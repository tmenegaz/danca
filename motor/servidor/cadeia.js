'use strict';

/**
 * cadeia.js (servidor) — A EXECUÇÃO DA CADEIA AUTOMÁTICA (09/11/2026).
 *
 * O QUE ESTE MÓDULO FAZ. Dado um gatilho — uma aluna mudou de elenco, uma aluna saiu, a direção
 * de uma turma mudou —, ele percorre a cadeia de dependência e deixa cada elo em dia:
 *
 *   1. **Vínculos e etiquetas** — a Turma passa a declarar as alunas que o elenco declara;
 *   2. **Plano de ensino** — deriva-se um ELO NOVO, com `ajuste_de` a apontar o anterior (a
 *      proveniência acrescenta, nunca reescreve — P-03/P-04);
 *   3. **Plano de observação** — deriva-se o elo novo que observa o plano vigente;
 *   4. **Pacote** — as fontes são escritas e a geração é disparada (a mesma função do «Guardar»).
 *
 * O QUE ELE NÃO FAZ. Não inventa o plano que a escola nunca fez, nem o PO que ninguém
 * elicitou: uma peça que falta é `bloqueada`, e a travessia pára ali com a frase e o link do
 * sítio onde se resolve. É a decisão de 09/11/2026: a cadeia inteira só corre em registos com o
 * fluxo completo; nos incompletos, avança-se até onde é possível e diz-se o que falta.
 *
 * A ORDEM É DE DEPENDÊNCIA, e a paragem é na PRIMEIRA etapa que não fecha — nunca se salta para
 * a frente. Um PO derivado sobre um plano que já não vale seria consolidar a observação sobre um
 * corpo que mudou, que é exatamente o defeito que a cadeia existe para não repetir.
 *
 * IDEMPOTÊNCIA. Antes de derivar, cada etapa pergunta se já está em dia (`cadeia.indice`): um
 * plano derivado DEPOIS do gatilho conta como feito e não se deriva outra vez. Repetir o gesto
 * não empilha elos falsos.
 *
 * AUTOMÁTICO E TRANSPARENTE. O professor vê o resultado global (êxito, ou o que falta) na
 * resposta do gesto que fez, e o log (`GET /api/bastidores/cadeia`) guarda as execuções para
 * quem quiser rastrear. Nada disto pede um clique a mais: quem age recebe o estado em que a
 * travessia ficou.
 */

const nucleoCadeia = require('../nucleo/cadeia.js');
// O RITMO que a Sala declara, na forma das respostas do plano (09/11/2026).
const { respostasDoRitmo, acharTurma } = require('./compor-conf.js');

/** O prefixo do KV da escola — a mesma raiz dos outros cadastros dos Bastidores. */
const RAIZ = 'bastidores';
const LIMITE_DO_LOG = 60;

function criarCadeia({
  armazenamento, porta, conteudo, conteudoPlano, conteudoPO, esquema, carimbar,
  escreverPlano, escreverPO, escreverCiclo, disparar, geracao, concluirPO,
  lerCuradorias, lerTurmas, lerLinhasDeBase, linhaDeBaseDaTurma, lerProfessores,
  kv, escola, urlDaPorta, orcamento,
}) {
  const chaveDoLog = RAIZ + '/' + escola + '/cadeia';

  /** O LOG — append-only, curto, no KV da escola. Nunca derruba a execução. */
  async function lerLog() {
    if (!kv) return [];
    try {
      const bruto = await kv.get(chaveDoLog);
      const lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (erro) { return []; }
  }

  async function anotar(entrada) {
    if (!kv) return { ok: false, erro: 'sem KV: o log da cadeia não foi gravado' };
    try {
      const lista = await lerLog();
      lista.push(entrada);
      // O TETO É DO LOG, NÃO DO DADO: as execuções antigas saem, e os documentos que elas
      // produziram ficam (a proveniência mora no acervo, não aqui).
      while (lista.length > LIMITE_DO_LOG) lista.shift();
      await kv.put(chaveDoLog, JSON.stringify(lista));
      return { ok: true, quantas: lista.length };
    } catch (erro) {
      return { ok: false, erro: erro && erro.message ? erro.message : String(erro) };
    }
  }

  /** As turmas de uma curadoria — a lista de UM, com o campo antigo como recurso. */
  function turmasDe(c) {
    return Array.isArray(c && c.turmas) && c.turmas.length
      ? c.turmas.map((t) => String(t || '').trim()).filter(Boolean)
      : [String((c && c.turma) || '').trim()].filter(Boolean);
  }

  /** O plano VIGENTE de uma turma — o que nenhum sucessor substituiu. `null` se não houver. */
  async function planoVigenteDaTurma(turma) {
    const alvo = String(turma || '').trim();
    if (!alvo) return null;
    try {
      const todos = await porta.planos(armazenamento);
      const daTurma = (Array.isArray(todos) ? todos : []).filter((p) =>
        p && String(p.turma || '').trim() === alvo);
      // `anterior` é a marca que `porta.planos` põe em quem já tem sucessor: o vigente é o que
      // não a tem (e, havendo mais de um, o mais recente — a lista já vem ordenada).
      const vigentes = daTurma.filter((p) => !p.anterior);
      if (!vigentes.length) return null;
      const envelope = await porta.lerEnvelope(armazenamento, String(vigentes[0].carimbo));
      return envelope || null;
    } catch (erro) { return null; }
  }

  /** O PO VIGENTE que observa a cadeia deste plano. `null` se nunca houve observação. */
  async function poVigenteDaCadeia(planoId) {
    try {
      const id = await porta.poDoPlano(armazenamento, String(planoId));
      if (!id) return null;
      return await porta.lerEnvelope(armazenamento, String(id));
    } catch (erro) { return null; }
  }

  /** O `gerado_em` de um envelope — o que decide se ele é posterior ao gatilho. */
  function quandoDo(envelope) {
    if (!envelope) return '';
    return String(envelope.gerado_em || (envelope.id || '')).trim();
  }

  /**
   * O PACOTE ESTÁ EM DIA? — A PERGUNTA DEIXOU DE SER UMA DEDUÇÃO (10/11/2026).
   *
   * DEFEITO MEDIDO. A etapa 4 perguntava «o PO é posterior ao gatilho?» e concluía daí que os
   * documentos estavam gerados. Não é a mesma coisa: o PO pode estar em dia e a geração nunca
   * ter corrido — é exactamente o estado que fica quando o teto de subpedidos corta a cadeia
   * entre a etapa 3 e a etapa 4. Repetir o gesto nesse estado dizia «a cadeia fechou» sem nada
   * ter sido gerado, que é a pior resposta possível: a mentira tranquilizadora.
   *
   * O REGISTO DA GERAÇÃO é o facto, e já existe (`geracao.lerRegistro`, gravado pelo
   * `concluir-po.js`): diz QUANDO se pediu a geração e QUAIS documentos ela derivou. A regra
   * passa a ser «há um pedido de geração posterior ao PO, e ele derivou documentos». Sem registo
   * — escola antiga, KV sem a chave, runtime de prova sem `geracao` — volta-se à dedução de
   * antes: nunca se perde o que se sabia, e nada fica a afirmar mais do que se mediu.
   */
  async function pacoteEmDia(po, turma, quando) {
    const deduzido = Boolean(po && quandoDo(po) >= String(quando || ''));
    if (!po || !geracao || typeof geracao.lerRegistro !== 'function') return deduzido;
    let registro = null;
    try {
      registro = await geracao.lerRegistro(Object.assign({}, po.contexto || {}, { escola, turma }));
    } catch (erro) { registro = null; }
    if (!registro) return deduzido;
    const derivou = Array.isArray(registro.documentos) && registro.documentos.length > 0;
    const pedidoDepois = String(registro.em || '') >= quandoDo(po);
    return Boolean(pedidoDepois && derivou);
  }

  /**
   * O CONTEXTO DO ELO NOVO. O plano e o PO carregam o professor, a turma e o ciclo — e a troca
   * de direção muda o professor. O que se atualiza é o que a curadoria declara AGORA; o resto
   * (o ciclo, a escola, o que o professor escreveu) vem do anterior e não se toca.
   */
  /**
   * O NOME DO PROFESSOR QUE PASSA A DIRIGIR (10/11/2026).
   *
   * O documento imprime NOME, não slug — e a resposta é a que manda (`derivar-po.js`: «a RESPOSTA
   * manda, e o contexto é a reserva»). Para reescrever a identidade de um elo derivado é preciso,
   * portanto, o nome de exibição. O cadastro da escola é quem o tem; o dono da escola vive no
   * secret `PROFESSOR_NOME` e não nesta lista, e nesse caso a resposta fica com o slug — que é
   * feio, mas é verdadeiro, e é o que o elo anterior já tinha.
   */
  async function nomeDoProfessor(slug) {
    const alvo = String(slug || '').trim();
    if (!alvo) return '';
    try {
      const lista = typeof lerProfessores === 'function' ? await lerProfessores(escola) : [];
      const achado = (Array.isArray(lista) ? lista : []).find((p) => p && (
        String(p.slug || '').trim() === alvo || String(p.nome || '').trim() === alvo));
      return achado ? String(achado.nome || '').trim() : '';
    } catch (erro) { return ''; }
  }

  /**
   * A IDENTIDADE DO ELO DERIVADO — NAS RESPOSTAS, E NÃO SÓ NO CONTEXTO (10/11/2026).
   *
   * O DEFEITO QUE ISTO FECHA. `contextoDoElo` atualizava `contexto.professor` e `contexto.turma`,
   * e ficava por aí. Mas os documentos não se imprimem do contexto: o `## Contexto` do plano lê a
   * RESPOSTA `contexto-professor`, e o cabeçalho do PO lê a RESPOSTA `professor` (o contexto é só
   * a reserva). Resultado: derivar a Turma para outro professor produzia um elo novo com o
   * contexto certo e o DOCUMENTO com o nome antigo — a pesquisadora leu-o no cabeçalho do PO:
   * «ainda aparecia o Pé Torto […] se eu mandar gerar, ele vai gerar com aqueles valores».
   *
   * Porque é que a resposta pode ser reescrita aqui, e não é reescrever o passado: as três
   * respostas são `deContexto` — nascem do cadastro e o formulário diz «vem sugerido da barra,
   * corrija se for outro». Num elo derivado por mudança de direção, o valor herdado não é uma
   * decisão do professor: é a leitura de um cadastro que mudou. Corrigi-la é sincronizar a
   * leitura com a fonte, e é a mesma razão pela qual o ritmo da Sala é relido.
   *
   * O elo ANTERIOR não é tocado: ele continua a dizer o professor que tinha, e é isso que faz a
   * pergunta «quem dirigia em Março» ter resposta.
   */
  function identidadeNasRespostas(respostas, campos, valores) {
    for (const campo of campos) {
      const valor = valores[campo];
      if (!valor) continue;
      const atual = respostas[campo];
      // `null`/ausente = a pergunta não existe neste mapa; não se inventa resposta para ela.
      if (atual === undefined) continue;
      respostas[campo] = Object.assign({}, atual, { valor });
    }
    return respostas;
  }

  function contextoDoElo(anterior, curadoria, turma) {
    const base = Object.assign({}, (anterior && anterior.contexto) || {});
    if (escola) base.escola = escola;
    if (turma) base.turma = turma;
    if (curadoria && curadoria.professor) base.professor = String(curadoria.professor);
    /* A MODALIDADE NÃO ENTRA NO CONTEXTO, e não é esquecimento: o envelope só admite
     * `escola`, `professor`, `ciclo`, `aluna` e `turma` (`CAMPOS_DE_CONTEXTO`). Quem declara a
     * modalidade é a CURADORIA, e é dela que o plano e o PO a leem — repeti-la no contexto seria
     * uma segunda declaração do mesmo facto, e a primeira a divergir. */
    return base;
  }

  /**
   * A ETAPA 1 — OS VÍNCULOS. A Turma passa a declarar o corpo do elenco; não se toca em mais
   * nada do registo (o professor, a modalidade, a tradição, a vigência ficam como estão).
   */
  async function sincronizarVinculos({ curadoria, elenco }) {
    if (!curadoria || !elenco) return { ok: false, motivo: 'sem curadoria ou sem elenco' };
    const alas = (Array.isArray(elenco.alunas) ? elenco.alunas : []).map(String);
    if (nucleoCadeia.mesmasAlunas(curadoria.alunas, alas)) {
      return { ok: true, jaEstava: true };
    }
    const lista = await lerCuradorias(escola);
    const idx = (Array.isArray(lista) ? lista : []).findIndex((c) => c && c.id === curadoria.id);
    if (idx === -1) return { ok: false, erro: 'a Turma «' + curadoria.id + '» já não existe' };
    const atualizada = Object.assign({}, lista[idx], { alunas: alas });
    lista[idx] = atualizada;
    try {
      await kv.put(RAIZ + '/' + escola + '/curadorias', JSON.stringify(lista));
      return { ok: true, de: curadoria.alunas || [], para: alas };
    } catch (erro) {
      return { ok: false, erro: erro && erro.message ? erro.message : String(erro) };
    }
  }

  /**
   * O RITMO DA SALA VIGENTE — os quatro campos `daTurma` relidos do cadastro (09/11/2026).
   *
   * O DEFEITO QUE ISTO FECHA. O plano grava o ritmo como FOTOGRAFIA: frequência, duração,
   * calendário e total de aulas entram no envelope quando ele nasce. Quando a Sala muda, o elo
   * novo — que copia as respostas — nasceria com o ritmo VELHO, e o `## Contexto` do documento
   * impresso continuaria a mentir. Copiar a fotografia e chamar-lhe «derivar» seria reescrever
   * sem reler.
   *
   * PORQUE RELER NÃO É REESCREVER. No conteúdo do plano, estes quatro campos são declarados
   * `daTurma`: não são autoria do professor, são leitura do cadastro (é o próprio formulário que
   * o diz — «vem do cadastro da turma, declarado pela direção na Produção»). Relê-los é
   * sincronizar a leitura com a fonte, e não tocar numa decisão pedagógica.
   *
   * A SALA VIGENTE É A DO NOME. O nome não muda quando se deriva (é a decisão que faz a ligação
   * sobreviver); quem se procura é o elo que hoje vale.
   */
  async function ritmoDaSala(turma) {
    const nome = String(turma || '').trim();
    if (!nome || typeof lerTurmas !== 'function') return null;
    try {
      const lista = await lerTurmas(escola);
      const sala = acharTurma(lista, nome);
      if (!sala) return null;
      const respostas = respostasDoRitmo(sala);
      return Object.keys(respostas).length ? respostas : null;
    } catch (erro) {
      return null;
    }
  }

  /**
   * A ETAPA 2 — O PLANO DE ENSINO. Deriva-se um elo novo a partir do VIGENTE, com o mesmo
   * conteúdo respondido e o contexto corrigido. `ajuste_de` é o que faz o elo apontar para o
   * anterior: o passado não se reescreve.
   *
   * O RITMO É RELIDO DA SALA (09/11/2026) — ver `ritmoDaSala`. As respostas do anterior mandam
   * em tudo menos nos quatro campos que são do cadastro: esses são substituídos pelo valor de
   * hoje, e é isso que faz o documento novo dizer o horário novo.
   */
  async function derivarPlano({ anterior, curadoria, turma, motivo }) {
    const respostas = JSON.parse(JSON.stringify((anterior && anterior.respostas) || {}));
    const ritmo = await ritmoDaSala(turma);
    if (ritmo) Object.assign(respostas, ritmo);
    /* A IDENTIDADE VAI COM O ELO (10/11/2026) — nas RESPOSTAS, que é o que o documento imprime.
     * Sem isto, derivar a Turma para outro professor deixava o `## Contexto` a dizer o antigo. */
    const professorNovo = String((curadoria && curadoria.professor) || '').trim();
    identidadeNasRespostas(respostas, ['contexto-professor', 'contexto-turma'], {
      'contexto-professor': (await nomeDoProfessor(professorNovo)) || professorNovo,
      'contexto-turma': String(turma || '').trim(),
    });
    const contexto = contextoDoElo(anterior, curadoria, turma);
    const r = await porta.elicitar(armazenamento, {
      respostas, contexto, fonte: 'plano', ajuste_de: anterior.id,
      motivo: motivo || 'a cadeia automática: o corpo da turma mudou',
    }, { conteudo, conteudoPO, conteudoPlano, esquema, agora: carimbar });
    if (!r || r.recusa) {
      return { ok: false, erro: (r && r.recusa && r.recusa.motivo) || 'o elo do plano não foi gravado' };
    }
    if (!r.gravado) {
      return { ok: false, erro: r.erroDaGravacao || 'o elo do plano não foi gravado' };
    }
    const envelope = r.documento;
    // A FONTE DO CICLO — sem ela o pacote não tem o plano novo para ler.
    let fonte = null;
    if (escreverPlano) {
      try {
        fonte = await escreverPlano(envelope, 'feat(plano): o elo da cadeia automática',
          { linhaDeBase: await linhaDeBaseDaTurma(turma) });
      } catch (erro) {
        return { ok: false, erro: 'o plano foi gravado, mas a fonte não: ' + (erro && erro.message) };
      }
    }
    return { ok: true, id: envelope && envelope.id, de: anterior.id, fonte };
  }

  /**
   * A ETAPA 3 — O PLANO DE OBSERVAÇÃO. O elo novo observa o plano VIGENTE; o `elicitar` já
   * retargeta a referência para o topo da cadeia, e o `ajuste_de` mantém o elo anterior de pé.
   */
  async function derivarPO({ anterior, planoNovo, curadoria, turma, motivo }) {
    const respostas = JSON.parse(JSON.stringify((anterior && anterior.respostas) || {}));
    const professorNovo = String((curadoria && curadoria.professor) || '').trim();
    /* O CABEÇALHO DO PO VEM DESTA RESPOSTA (10/11/2026). O `derivar-po.js` diz, na letra: «a
     * RESPOSTA manda, e o contexto é a reserva». Atualizar só o contexto dava um elo novo a
     * declarar `contexto.professor: redinha-rosa` e um documento a imprimir
     * `responsavel: pe-torto` — exactamente o que a pesquisadora leu no cabeçalho. */
    identidadeNasRespostas(respostas, ['professor'], {
      professor: (await nomeDoProfessor(professorNovo)) || professorNovo,
    });
    respostas['plano-de-ensino'] = {
      valor: planoNovo.id, origem: 'perguntado', respondente: 'professor', nota: null,
    };
    // O CONTEXTO ACOMPANHA A DIREÇÃO NOVA (09/11/2026): na troca de professor ou modalidade, o
    // PO derivado tem de dizer quem passou a dirigir — senão o documento novo nasce a apontar
    // para o professor antigo, que é o defeito que a derivação da curadoria existe para corrigir.
    const contexto = contextoDoElo(anterior, curadoria, turma);
    const r = await porta.elicitar(armazenamento, {
      respostas, contexto, fonte: 'po', ajuste_de: anterior.id,
      motivo: motivo || 'a cadeia automática: o plano de ensino foi derivado',
    }, { conteudo, conteudoPO, conteudoPlano, esquema, agora: carimbar });
    if (!r || r.recusa) {
      return { ok: false, erro: (r && r.recusa && r.recusa.motivo) || 'o elo do PO não foi gravado' };
    }
    if (!r.gravado) {
      return { ok: false, erro: r.erroDaGravacao || 'o elo do PO não foi gravado' };
    }
    return { ok: true, id: r.documento && r.documento.id, de: anterior.id, documento: r.documento };
  }

  /** A ETAPA 4 — AS FONTES E A GERAÇÃO, pela MESMA função do «Guardar» do PO. */
  async function concluirPacote({ envelope, contexto }) {
    if (!concluirPO) return { ok: false, erro: 'sem a rotina de conclusão do PO neste Worker' };
    const saida = await concluirPO(envelope, contexto);
    const ok = Boolean(saida && saida.ciclo && saida.ciclo.ok)
      && Boolean(saida && saida.disparo && saida.disparo.ok);
    return {
      ok,
      fonte: saida && saida.fonte ? saida.fonte.ok !== false : null,
      ciclo: saida && saida.ciclo ? saida.ciclo.ok !== false : null,
      disparo: saida && saida.disparo ? saida.disparo : null,
      erro: (saida && saida.ciclo && saida.ciclo.erro)
        || (saida && saida.disparo && (saida.disparo.erro || saida.disparo.motivo)) || null,
    };
  }

  /**
   * UMA TURMA, A CADEIA INTEIRA. Devolve `{turma, etapas, ok, erro}`. A paragem é sempre na
   * primeira etapa que não fecha; as seguintes ficam `pendente`/`bloqueada`, como no índice.
   */
  /**
   * O PLANO DA TURMA QUE MUDOU DE SALA (10/11/2026).
   *
   * O DEFEITO. `planoVigenteDaTurma` procura por NOME de sala — e é o nome que identifica o plano
   * (`contexto-turma`) e a variante. Quando a Turma muda de sala, não há plano NENHUM no destino,
   * e a cadeia parava a dizer «A Turma «Piano» ainda não tem plano de ensino. O primeiro nasce na
   * porta». Verdadeiro e inútil: o plano existe — na sala de onde a Turma veio.
   *
   * A REGRA QUE PASSA A VALER: o plano segue a CADEIA DA TURMA. Se a Turma é um elo derivado
   * (`substitui`), procura-se o plano da sala do elo anterior, e é ELE o `anterior` do novo elo.
   * O plano novo nasce com a sala nova na identidade; o antigo fica onde está, a dizer a sala em
   * que valeu. É a mesma mecânica de sempre — acrescentar um elo, não reescrever —, aplicada ao
   * eixo que faltava.
   *
   * SEM CADEIA, nada muda: uma Turma criada na sala nova não tem plano, e continua a ser verdade
   * que o primeiro nasce na porta.
   */
  async function planoDaTurmaOuDaOrigem(turma, curadoria) {
    const direto = await planoVigenteDaTurma(turma);
    if (direto) return { plano: direto, herdado: false, de: turma };
    const idAnterior = String((curadoria && curadoria.substitui) || '').trim();
    if (!idAnterior) return { plano: null, herdado: false, de: null };
    const lista = (await lerCuradorias(escola)) || [];
    const anterior = (Array.isArray(lista) ? lista : []).find((c) => c && c.id === idAnterior);
    const salaAnterior = anterior ? (turmasDe(anterior)[0] || '') : '';
    if (!salaAnterior || salaAnterior === turma) return { plano: null, herdado: false, de: null };
    const plano = await planoVigenteDaTurma(salaAnterior);
    return plano ? { plano, herdado: true, de: salaAnterior } : { plano: null, herdado: false, de: null };
  }

  async function porTurma({ turma, curadoria, elenco, quando, motivo }) {
    const achado = await planoDaTurmaOuDaOrigem(turma, curadoria);
    const plano = achado.plano;
    const po = plano ? await poVigenteDaCadeia(plano.id) : null;

    const antes = nucleoCadeia.indice({
      elenco, curadoria, turma,
      plano, po,
      quando,
      pacoteEmDia: await pacoteEmDia(po, turma, quando),
    });
    const etapas = antes.etapas.map((e) => Object.assign({}, e));
    /* O CICLO DA TURMA, lido do documento — é ele que faz a porta abrir o endereço da etapa
     * (ver `enderecoDaEtapa`). Vem do PO, do plano, ou da curadoria, por esta ordem: o documento
     * é a autoridade, e a curadoria só responde quando não há nenhum dos dois. */
    const ciclo = String((po && po.contexto && po.contexto.ciclo)
      || (plano && plano.contexto && plano.contexto.ciclo)
      || (curadoria && curadoria.ciclo) || '').trim();
    const resultado = { turma, ciclo: ciclo || null, etapas, ok: false, erro: null };

    // A PORTA DO FLUXO COMPLETO. Sem plano ou sem PO, a cadeia não percorre as etapas
    // seguintes — mas os vínculos, que só dependem do elenco, fazem-se na mesma. É a
    // «validação de completude» pedida: avançar até onde é possível, e dizer o que falta.
    const completo = antes.completa;

    const marcar = (chave, estado, extra) => {
      const i = etapas.findIndex((e) => e.chave === chave);
      if (i !== -1) etapas[i] = Object.assign({}, etapas[i], { estado }, extra || {});
    };

    // 1. VÍNCULOS — sempre que há elenco e Turma.
    const passoVinculos = etapas.find((e) => e.chave === 'vinculos');
    if (passoVinculos && passoVinculos.estado === 'pendente') {
      const r = await sincronizarVinculos({ curadoria, elenco });
      if (r.ok) marcar('vinculos', 'feita', { detalhe: r.jaEstava ? 'já estava em dia' : 'a Turma passou a declarar o elenco' });
      else { marcar('vinculos', 'bloqueada', { falta: 'não consegui atualizar a Turma: ' + (r.erro || r.motivo) }); resultado.erro = r.erro || r.motivo; }
    }

    if (!completo) {
      resultado.ok = etapas.every((e) => e.estado === 'feita');
      const falta = etapas.find((e) => e.estado !== 'feita');
      if (!resultado.ok && falta && !resultado.erro) {
        resultado.erro = 'a cadeia pára em «' + falta.chave + '»: ' + (falta.falta || 'falta uma peça');
      }
      return resultado;
    }

    // 2. PLANO DE ENSINO
    let planoNovo = plano;
    const passoPlano = etapas.find((e) => e.chave === 'plano-de-ensino');
    if (passoPlano && passoPlano.estado === 'pendente') {
      const r = await derivarPlano({ anterior: plano, curadoria, turma, motivo });
      if (r.ok) {
        marcar('plano-de-ensino', 'feita', { id: r.id, detalhe: 'elo novo: ' + r.de + ' → ' + r.id });
        planoNovo = await porta.lerEnvelope(armazenamento, String(r.id)) || plano;
      } else {
        marcar('plano-de-ensino', 'pendente', { falta: r.erro });
        resultado.erro = r.erro;
        return resultado;
      }
    }

    // 3. PLANO DE OBSERVAÇÃO
    let poNovo = await poVigenteDaCadeia(planoNovo.id);
    const passoPo = etapas.find((e) => e.chave === 'plano-de-observacao');
    if (passoPo && passoPo.estado === 'pendente') {
      const r = await derivarPO({ anterior: po, planoNovo, curadoria, turma, motivo });
      if (r.ok) {
        marcar('plano-de-observacao', 'feita', { id: r.id, detalhe: 'elo novo: ' + r.de + ' → ' + r.id });
        poNovo = r.documento;
      } else {
        marcar('plano-de-observacao', 'pendente', { falta: r.erro });
        resultado.erro = r.erro;
        return resultado;
      }
    }

    /* 4. PACOTE
     *
     * UM PO DERIVADO AGORA TORNA O PACOTE PENDENTE — MESMO QUE O REGISTO DA GERAÇÃO FOSSE NOVO
     * (10/11/2026). O índice decide a etapa 4 ANTES de o elo novo existir, e por isso julga-a
     * contra o PO ANTIGO: um registo de geração posterior a esse PO dava-a por `feita`, e a
     * geração ficava por fazer sobre um documento que acabou de mudar. É o mesmo defeito de
     * sempre — julgar o produto pelo insumo —, agora a meio da travessia. O elo novo é o facto:
     * mudou o PO, mudam os documentos. */
    const poMudou = Boolean(poNovo && (!po || String(poNovo.id) !== String(po.id)));
    if (poMudou) marcar('pacote', 'pendente');
    const passoPacote = etapas.find((e) => e.chave === 'pacote');
    if (passoPacote && passoPacote.estado === 'pendente' && poNovo) {
      const contexto = Object.assign({}, (poNovo && poNovo.contexto) || {}, {
        escola, turma,
        professor: (curadoria && curadoria.professor) || (poNovo && poNovo.contexto && poNovo.contexto.professor),
      });
      const r = await concluirPacote({ envelope: poNovo, contexto });
      if (r.ok) marcar('pacote', 'feita', { detalhe: 'geração disparada' });
      else {
        marcar('pacote', 'pendente', { falta: r.erro || 'a geração não partiu' });
        resultado.erro = r.erro || 'a geração não partiu';
      }
      resultado.pacote = r;
    }

    resultado.ok = etapas.every((e) => e.estado === 'feita');
    return resultado;
  }

  /**
   * AS TURMAS QUE UMA MUDANÇA TOCOU. `elencos` são os corpos que mudaram; `turmas`, os nomes que
   * a direção mudou. A mesma leitura serve a travessia inteira e o fecho do pacote — duas cópias
   * da regra divergiriam no dia em que a curadoria ganhasse um terceiro campo.
   */
  async function alvosDe({ elencos = [], turmas = [] } = {}) {
    const curs = (await lerCuradorias(escola)) || [];
    const lista = (Array.isArray(curs) ? curs : []).filter((c) => c && !c.substituidaPor);
    const pedidosElenco = new Set(elencos.map(String));
    const pedidosTurma = new Set(turmas.map(String));
    return lista.filter((c) => {
      if (c.linhaDeBase && pedidosElenco.has(String(c.linhaDeBase))) return true;
      return turmasDe(c).some((t) => pedidosTurma.has(t));
    });
  }

  /**
   * SÓ O ÚLTIMO PASSO — «GERAR OS DOCUMENTOS», NUMA INVOCAÇÃO PRÓPRIA (10/11/2026).
   *
   * O DEFEITO QUE ISTO FECHA, medido a 10/11/2026. A pesquisadora migrou um elenco dentro da
   * Turma e recebeu: «esta invocação do Worker já gastou 33 dos 50 subpedidos permitidos, e o
   * passo seguinte precisa de 18. Nada do ciclo foi escrito — repita o «Guardar»». Os vínculos e
   * o elo do plano JÁ estavam gravados; o que não coube foi a geração. O caminho que sobrava era
   * o da via crucis: abrir o plano de observação, ajustar, gerar — à mão.
   *
   * A CAUSA NÃO É UM ERRO, É UMA CONTA. O teto de subpedidos do Cloudflare é POR INVOCAÇÃO, e o
   * gesto que chamou a cadeia já tinha gasto a maior parte dele a gravar os vínculos e os dois
   * elos. 33 + 18 = 51, contra um teto de 50: falta um. Nenhum código mais eficiente resolve uma
   * conta que é de orçamento — o que resolve é a geração correr num pedido SÓ DELA, com os 50
   * inteiros.
   *
   * É ISSO QUE ESTA FUNÇÃO É, e é por isso que ela não pergunta ao índice se o pacote está em
   * dia: quem a chama é o gesto explícito «gerar os documentos». Ela não deriva plano nem PO —
   * as etapas 1 a 3 já fecharam, e derivá-las outra vez empilharia elos falsos.
   */
  async function fecharPacotes({ turmas = [], elencos = [], motivo } = {}) {
    const agora = carimbar ? carimbar() : new Date().toISOString();
    const entrada = {
      em: new Date().toISOString(),
      gatilho: 'fechar-o-pacote',
      rotulo: 'Fechar o pacote',
      elencos: elencos.map(String),
      turmas: turmas.map(String),
      motivo: motivo || null,
      ok: false,
      alvos: [],
      erro: null,
    };
    try {
      const alvos = await alvosDe({ elencos, turmas });
      if (!alvos.length) {
        entrada.erro = elencos.length
          ? 'nenhuma Turma escolheu o elenco ' + elencos.join(', ')
          : 'nenhuma Turma corresponde a ' + turmas.join(', ');
        const log = await anotar(entrada);
        return Object.assign({ ok: false, alvos: [], erro: entrada.erro }, { log });
      }
      for (const c of alvos) {
        const turma = turmasDe(c)[0] || '';
        // O MESMO CAMINHO DO `porTurma` (10/11/2026): o plano da sala de origem serve quando a
        // Turma mudou de sala — sem isto, «fechar o pacote» diria que não há documentos a gerar.
        const achado = await planoDaTurmaOuDaOrigem(turma, c);
        const plano = achado.plano;
        const po = plano ? await poVigenteDaCadeia(plano.id) : null;
        if (!po) {
          const falta = !plano
            ? 'a Turma «' + turma + '» ainda não tem plano de ensino — os documentos nascem dele.'
            : 'a Turma «' + turma + '» ainda não tem plano de observação — os documentos nascem dele.';
          entrada.alvos.push({
            curadoria: c.id, turma, ciclo: (po && po.contexto && po.contexto.ciclo)
              || (plano && plano.contexto && plano.contexto.ciclo) || null,
            ok: false, erro: falta,
            etapas: [
              { chave: 'vinculos', estado: 'feita' },
              /* O MOTIVO VAI NA ETAPA QUE TRAVA, E NÃO SÓ NA ÚLTIMA (10/11/2026). Quem lê a
               * lista por turma lê a PRIMEIRA etapa por concluir: se a frase só estivesse no
               * pacote, o professor lia «Plano de ensino por concluir: veja o sítio» — e o
               * sítio é o mesmo que ele acabou de deixar. */
              {
                chave: 'plano-de-ensino', estado: plano ? 'feita' : 'bloqueada',
                id: plano && plano.id, falta: plano ? null : falta,
              },
              {
                chave: 'plano-de-observacao', estado: po ? 'feita' : 'bloqueada',
                id: po && po.id, falta: (plano && !po) ? falta : null,
              },
              { chave: 'pacote', estado: 'bloqueada', falta },
            ],
          });
          continue;
        }
        const contexto = Object.assign({}, po.contexto || {}, {
          escola, turma,
          professor: (c && c.professor) || (po.contexto && po.contexto.professor),
        });
        const r = await concluirPacote({ envelope: po, contexto });
        entrada.alvos.push({
          curadoria: c.id, turma, elenco: c.linhaDeBase || null,
          ciclo: (po.contexto && po.contexto.ciclo) || (plano.contexto && plano.contexto.ciclo) || null,
          ok: Boolean(r.ok), erro: r.ok ? null : (r.erro || 'a geração não partiu'),
          etapas: [
            { chave: 'vinculos', estado: 'feita' },
            { chave: 'plano-de-ensino', estado: 'feita', id: plano.id },
            { chave: 'plano-de-observacao', estado: 'feita', id: po.id },
            {
              chave: 'pacote', estado: r.ok ? 'feita' : 'pendente',
              falta: r.ok ? null : (r.erro || 'a geração não partiu'),
            },
          ],
        });
      }
      entrada.ok = entrada.alvos.length > 0 && entrada.alvos.every((a) => a.ok);
      entrada.completa = true;
      entrada.erro = entrada.ok ? null : (entrada.alvos.find((a) => !a.ok && a.erro) || {}).erro || null;
      const log = await anotar(entrada);
      return Object.assign({}, entrada, { log });
    } catch (erro) {
      entrada.erro = erro && erro.message ? erro.message : String(erro);
      const log = await anotar(entrada);
      return Object.assign({ ok: false, alvos: [], erro: entrada.erro }, { log });
    }
  }

  /**
   * A EXECUÇÃO. `elencos` (a troca e a saída) e `turmas` (a troca de direção) dizem onde a
   * mudança tocou; a cadeia resolve as Turmas e corre uma a uma.
   */
  async function executar({ gatilho, elencos = [], turmas = [], quando, motivo } = {}) {
    const agora = quando || (carimbar ? carimbar() : new Date().toISOString());
    /* O ORÇAMENTO DO PEDIDO — A TRAVESSIA NÃO COMEÇA O QUE NÃO CABE (09/11/2026).
     *
     * A cadeia grava envelopes, fontes do ciclo e dispara a geração: muitos subpedidos. Se o
     * pedido que a chamou já gastou quase tudo, começar aqui produz um estado a meio — e pior,
     * a invocação abortada deixa o cliente sem resposta sobre um acto que já está gravado. O
     * limite é conservador: abaixo dele, diz-se que não correu, e o professor repete o gesto
     * (ou segue a travessia à mão, que é o caminho que sempre existiu).
     *
     * A fração é do TETO do pedido, não um número mágico: numa conta paga (teto maior) o
     * mínimo acompanha. */
    const minimo = orcamento ? Math.max(12, Math.ceil(orcamento.limite * 0.4)) : 0;
    if (orcamento && orcamento.restantes < minimo) {
      const motivoOrcamento = 'esta invocação já gastou ' + orcamento.usados + ' de '
        + orcamento.limite + ' subpedidos, e a travessia precisa de pelo menos ' + minimo
        + '. O gesto está gravado; repita-o para a cadeia correr, ou percorra as etapas na mão.';
      const entradaCurta = {
        em: new Date().toISOString(), gatilho, rotulo: nucleoCadeia.rotuloDoGatilho(gatilho),
        elencos: elencos.map(String), turmas: turmas.map(String), motivo: motivo || null,
        ok: false, completa: false, alvos: [], erro: motivoOrcamento, orcamento: true,
      };
      const log = await anotar(entradaCurta);
      return Object.assign({}, entradaCurta, { log });
    }
    const entrada = {
      em: new Date().toISOString(),
      gatilho,
      rotulo: nucleoCadeia.rotuloDoGatilho(gatilho),
      elencos: elencos.map(String),
      turmas: turmas.map(String),
      motivo: motivo || null,
      ok: false,
      alvos: [],
      erro: null,
    };

    try {
      const alvos = await alvosDe({ elencos, turmas });

      if (!alvos.length) {
        entrada.erro = elencos.length
          ? 'nenhuma Turma escolheu o elenco ' + elencos.join(', ') + ' — não há vínculo a atualizar'
          : 'nenhuma Turma corresponde a ' + turmas.join(', ');
        const log = await anotar(entrada);
        return Object.assign({ ok: false, completa: false, alvos: [], erro: entrada.erro }, { log });
      }

      const linhas = await lerLinhasDeBase(escola);
      const porId = new Map((Array.isArray(linhas) ? linhas : []).map((l) => [String(l.id), l]));

      for (const c of alvos) {
        const turma = turmasDe(c)[0] || '';
        const elenco = c.linhaDeBase ? (porId.get(String(c.linhaDeBase)) || null) : null;
        const r = await porTurma({ turma, curadoria: c, elenco, quando: agora, motivo });
        entrada.alvos.push({
          curadoria: c.id, turma, ciclo: r.ciclo || null, elenco: c.linhaDeBase || null,
          ok: r.ok, erro: r.erro || null,
          etapas: r.etapas.map((e) => ({
            chave: e.chave, estado: e.estado, falta: e.falta || null, detalhe: e.detalhe || null,
            /* O CARIMBO DO DOCUMENTO QUE A ETAPA NOMEIA (10/11/2026) — é ele que faz o link
             * «abrir» entrar DENTRO do documento, e não na página da porta. Sem isto, a etapa 3
             * mandava para `/plano-observacao/` sem alvo, e a porta devolvia o professor à
             * listagem: o «titubeio» que a pesquisadora descreveu. */
            id: e.id || null,
          })),
        });
      }

      entrada.ok = entrada.alvos.length > 0 && entrada.alvos.every((a) => a.ok);
      entrada.erro = entrada.ok ? null : (entrada.alvos.find((a) => !a.ok && a.erro) || {}).erro || null;
      // A COMPLETUDE DO REGISTO — a mesma pergunta que a primeira etapa fez, agregada.
      entrada.completa = entrada.alvos.every((a) =>
        !a.etapas.some((e) => e.chave === 'plano-de-ensino' && e.estado === 'bloqueada'));
      const log = await anotar(entrada);
      return Object.assign({}, entrada, { log });
    } catch (erro) {
      entrada.erro = erro && erro.message ? erro.message : String(erro);
      const log = await anotar(entrada);
      return Object.assign({ ok: false, alvos: [], erro: entrada.erro }, { log });
    }
  }

  /** Os endereços que a resposta leva — um por etapa, com o contexto da escola. */
  function enderecos(contexto) {
    const comContexto = (caminho) => (urlDaPorta ? urlDaPorta(caminho, contexto) : caminho);
    return {
      'producao-turmas': '#turmas',
      'producao-elencos': '#corpo',
      'porta-plano': comContexto('/plano-ensino/'),
      'porta-po': comContexto('/plano-observacao/'),
      // A GERAÇÃO NÃO TEM PÁGINA PRÓPRIA: o cartão do estado vive na porta, e é lá que o
      // professor vê o que foi gerado e quando.
      'geracao': comContexto('/plano-observacao/'),
    };
  }

  /**
   * O ENDEREÇO DE UMA ETAPA — COM O DOCUMENTO DENTRO, E NÃO A PÁGINA À FRENTE (10/11/2026).
   *
   * O QUE ESTAVA MAL. `enderecos` devolvia `/plano-observacao/` e mais nada: sem `ajustar=`, a
   * porta não tem alvo nenhum, e a trava dela (`podePreencher`) não encontrava o que abrir —
   * devolvia o professor à listagem. Foi o que a pesquisadora descreveu como «titubeada»: «levou
   * directo para o lugar aonde eu precisava clicar, mas depois voltou para a listagem».
   *
   * O QUE A PORTA JÁ SABIA FAZER. `?ajustar=<carimbo>` abre o documento e põe a página em modo
   * de derivação (`provar-painel-do-ato.js` mede-o nas três fontes); `?plano=<carimbo>` escolhe
   * o plano que o PO observa. Faltava levar os carimbos até ao link.
   *
   * O QUE NÃO SE FAZ. Não se põe `ajustar=` onde o gesto certo é outro: quando o que falta é a
   * GERAÇÃO, o PO já está em dia, e `?ajustar=` sobre um documento em dia deriva um elo gémeo do
   * último — um duplicado que ninguém pediu. Aí o endereço leva só `?plano=`, e é o cartão da
   * geração que está à vista.
   */
  function enderecoDaEtapa(contexto, chave, etapa) {
    const e = etapa || {};
    /* O CICLO VEM DO DOCUMENTO, E NÃO SÓ DO PEDIDO (10/11/2026).
     *
     * A porta exige professor, ciclo e escola para abrir (`contextoFaltando`), e a página dos
     * Bastidores NÃO traz `?ciclo=`: quem chega da Produção chega sem ele. Os endereços que ela
     * montava iam, por isso, sem ciclo — a porta abria, não o encontrava, e devolvia o professor
     * à listagem. É essa a «titubeada»: a página chegava e voltava. O ciclo está no plano e no
     * PO que a etapa nomeia, e é daí que ele passa a vir. */
    const ctx = { professor: (contexto || {}).professor, escola: (contexto || {}).escola };
    const partes = String((contexto && contexto.query) || '').split('&')
      .filter((parte) => parte && !/^ciclo=/.test(parte));
    if (e.ciclo) partes.push('ciclo=' + encodeURIComponent(String(e.ciclo)));
    ctx.query = partes.join('&');
    const daPorta = (caminho, extras) => (urlDaPorta ? urlDaPorta(caminho, ctx, extras) : caminho);
    const id = e.id ? String(e.id) : '';
    if (chave === 'vinculos') return enderecos(contexto)['producao-turmas'];
    if (chave === 'plano-de-ensino') {
      return daPorta('/plano-ensino/', ['fonte=plano'].concat(id ? ['ajustar=' + encodeURIComponent(id)] : []));
    }
    // A partir daqui, o plano vigente é o que o PO observa — e é a etapa anterior que o nomeia.
    const plano = e.plano ? String(e.plano) : '';
    const doPlano = plano ? ['plano=' + encodeURIComponent(plano)] : [];
    /* O PACOTE NÃO SE FECHA NA PORTA (10/11/2026) — e a razão é a que a prova do fecho já tinha
     * escrito: abrir o PO com `ajustar=` para «só gerar» deriva um elo GÉMEO de um documento que
     * já está em dia. O que falta nesta etapa não é um documento: é uma GERAÇÃO, e a geração tem
     * rota própria (`/api/bastidores/cadeia-pacote`) e vive nos Bastidores.
     *
     * Por isso o endereço é a secção das Turmas, com `data-fechar` na ligação: o clique corre o
     * fecho ali mesmo, com o véu de pé, e pinta o resultado na caixa do gesto. Era o que faltava
     * — o link levava à porta, a porta não tinha documento para carregar, e devolvia à listagem. */
    if (chave === 'pacote') return enderecos(contexto)['producao-turmas'];
    return daPorta('/plano-observacao/', ['fonte=po']
      .concat(id ? ['ajustar=' + encodeURIComponent(id)] : [])
      .concat(doPlano));
  }

  return { executar, fecharPacotes, lerLog, anotar, enderecos, enderecoDaEtapa };
}

module.exports = { criarCadeia, RAIZ, LIMITE_DO_LOG };
