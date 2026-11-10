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
  lerCuradorias, lerTurmas, lerLinhasDeBase, linhaDeBaseDaTurma, kv, escola, urlDaPorta,
  orcamento,
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
   * O CONTEXTO DO ELO NOVO. O plano e o PO carregam o professor, a turma e o ciclo — e a troca
   * de direção muda o professor. O que se atualiza é o que a curadoria declara AGORA; o resto
   * (o ciclo, a escola, o que o professor escreveu) vem do anterior e não se toca.
   */
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
    const respostas = Object.assign({}, (anterior && anterior.respostas) || {});
    const ritmo = await ritmoDaSala(turma);
    if (ritmo) Object.assign(respostas, ritmo);
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
    const respostas = Object.assign({}, (anterior && anterior.respostas) || {}, {
      'plano-de-ensino': {
        valor: planoNovo.id, origem: 'perguntado', respondente: 'professor', nota: null,
      },
    });
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
  async function porTurma({ turma, curadoria, elenco, quando, motivo }) {
    const plano = await planoVigenteDaTurma(turma);
    const po = plano ? await poVigenteDaCadeia(plano.id) : null;

    const antes = nucleoCadeia.indice({
      elenco, curadoria, turma,
      plano, po,
      quando,
      pacoteEmDia: Boolean(po && quandoDo(po) >= String(quando || '')),
    });
    const etapas = antes.etapas.map((e) => Object.assign({}, e));
    const resultado = { turma, etapas, ok: false, erro: null };

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

    // 4. PACOTE
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
      const curs = (await lerCuradorias(escola)) || [];
      const lista = (Array.isArray(curs) ? curs : []).filter((c) => c && !c.substituidaPor);
      const pedidosElenco = new Set(elencos.map(String));
      const pedidosTurma = new Set(turmas.map(String));
      const alvos = lista.filter((c) => {
        if (c.linhaDeBase && pedidosElenco.has(String(c.linhaDeBase))) return true;
        return turmasDe(c).some((t) => pedidosTurma.has(t));
      });

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
          curadoria: c.id, turma, elenco: c.linhaDeBase || null,
          ok: r.ok, erro: r.erro || null,
          etapas: r.etapas.map((e) => ({ chave: e.chave, estado: e.estado, falta: e.falta || null, detalhe: e.detalhe || null })),
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

  return { executar, lerLog, anotar, enderecos };
}

module.exports = { criarCadeia, RAIZ, LIMITE_DO_LOG };
