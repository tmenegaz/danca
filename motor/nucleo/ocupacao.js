'use strict';

/**
 * ocupacao.js — a regra da ocupação: dois corpos não ocupam o mesmo lugar à mesma hora.
 *
 * PORQUE EXISTE, e o que ela substitui.
 *
 * A regra em vigor desde 09/11/2026 (`estado-da-turma.js`, `salasOcupadas`) compara **só o nome da
 * Sala**: «Uma sala recebe UMA Turma por vez». A premissa era «uma sala = um horário». A
 * proprietária reviu-a a 25/11/2026, e a premissa nova é outra: **a Sala é o RITMO** (dias, hora de
 * cada dia, duração, período), e duas Turmas nela em horas diferentes são legítimas.
 *
 * O que se mediu antes de mudar: com a regra antiga, uma escola com balé 1 às 14h e balé 2 às 16h na
 * mesma sala recebia **409**, e a mensagem dizia «duas aulas no mesmo horário» sobre duas aulas que
 * não são. A frase era verdadeira sobre a regra e falsa sobre o mundo.
 *
 * A REGRA, EM UMA LINHA:
 *
 *   Duas Turmas colidem quando partilham um RECURSO e se sobrepõem no TEMPO.
 *
 * O tempo é um conjunto de intervalos, um por dia da semana em que a Turma existe:
 *
 *   intervalos(turma) = { (dia, inicio, fim) } para cada dia de `turma.dias`
 *     inicio = turma.horarios[dia]        ('HH:MM')
 *     fim    = inicio + turma.duracaoMin
 *
 * E a sobreposição é **meio-aberta** — `[inicio, fim)`. É a diferença entre 14:00–15:00 e
 * 15:00–16:00, que **não** colidem: uma acaba quando a outra começa. Um intervalo fechado diria que
 * colidem, e a escola não conseguiria encadear duas aulas seguidas — que é o caso normal.
 *
 * OS TRÊS RECURSOS, e cada um responde a uma pergunta diferente:
 *
 *   · a SALA     — o lugar físico. Duas Turmas nela ao mesmo tempo são dois corpos no mesmo lugar;
 *   · o PROFESSOR — uma pessoa. Não está em duas salas ao mesmo tempo;
 *   · o ELENCO   — cada aluna. Não está em dois lugares ao mesmo tempo.
 *
 * A decisão dela sobre o elenco (25/11/2026): **uma aluna pode estar em duas Turmas da mesma
 * modalidade**, desde que não colidam. É o que esta regra passa a permitir, e o que a antiga
 * (`alunasComprometidas`, que só olhava a modalidade) proibia.
 *
 * O QUE NÃO SE PREVÊ, por decisão dela: dois elencos unificados na mesma sala, no mesmo horário, num
 * dia excepcional. «O ideal é que isso não aconteça e o sistema não vai prever isso.» A regra recusa,
 * e a mensagem diz porquê e qual é o caminho.
 *
 * SEM I/O. Este módulo não lê ficheiros, não fala com o KV e não conhece o relógio: recebe as Salas e
 * as curadorias, devolve os conflitos. É o que permite a prova exercê-lo sem bancada.
 */

/** As horas do dia, em minutos. `'14:30'` → 870. `null` quando não é uma hora válida. */
function minutosDe(hhmm) {
  const m = /^([01][0-9]|2[0-3]):([0-5][0-9])$/.exec(String(hhmm == null ? '' : hhmm).trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** `870` → `'14:30'`. O caminho de volta, para as mensagens dizerem a hora que a escola lê. */
function horaDe(minutos) {
  const n = Math.max(0, Math.round(Number(minutos) || 0));
  const h = Math.floor(n / 60) % 24;
  const m = n % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

/**
 * OS DIAS QUE NÃO TÊM HORA. A decisão dela a 25/11/2026 foi **recusar a gravação** até a hora ser
 * preenchida — e não saltar a verificação.
 *
 * A razão de ser dura: sem a hora não há intervalo, e sem intervalo não há regra. Saltar em silêncio
 * deixaria a colisão por conferir sobre exactamente as turmas antigas, que são as que já estão
 * gravadas. Recusar obriga o dado a ficar completo, e a mensagem nomeia os dias.
 *
 * Devolve `[]` quando todos os dias declarados têm hora.
 */
function diasSemHora(turma) {
  const t = turma || {};
  const dias = Array.isArray(t.dias) ? t.dias : [];
  const horarios = (t.horarios && typeof t.horarios === 'object') ? t.horarios : {};
  return dias.filter((d) => minutosDe(horarios[d]) === null);
}

/** A duração em minutos, ou `null` quando não é um número positivo. */
function duracaoDe(turma) {
  const n = Number(turma && turma.duracaoMin);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/**
 * AS FAIXAS DE UMA SALA — `[{id, dias, horarios, duracaoMin, periodoInicio, periodoFim, modalidade,
 * professor}]`.
 *
 * A SALA É O ESPAÇO; A FAIXA É O QUE ACONTECE NELE (25/11/2026, decisão dela por extenso).
 *
 * «Ali pode acontecer N aulas durante o dia e de N modalidades, de N professores, com N elencos.»
 * Com um ritmo só por Sala isso era falso: a sala do piano teria **uma** modalidade e **um**
 * professor o dia inteiro. Por isso o par (modalidade, professor) e o período descem para a faixa, e
 * a Sala fica o nome do espaço físico — «a sala do piano», «a rosa», «a do janelão».
 *
 * DUAS FORMAS CONVIVEM, E ISSO É DELIBERADO. Uma Sala que ainda declara `dias`/`horarios`/
 * `duracaoMin`/`periodoInicio` na raiz — todas as que existem hoje — vale como **uma faixa só**, e
 * não precisa de ser reescrita para continuar a funcionar. `sala.faixas` é aditivo: quando existe e
 * tem conteúdo, manda; quando não existe, a raiz é a faixa 1. Nenhum registo antigo se toca (P-03).
 */
function faixasDaSala(sala) {
  const s = sala || {};
  const cruas = Array.isArray(s.faixas) ? s.faixas.filter((f) => f && typeof f === 'object') : [];
  if (cruas.length) {
    return cruas.map((f, i) => ({
      id: String(f.id || '').trim() || ('f' + (i + 1)),
      dias: Array.isArray(f.dias)
        ? f.dias.map(String).map((d) => d.trim()).filter(Boolean)
        : String(f.dias || '').split(',').map((d) => d.trim()).filter(Boolean),
      horarios: (f.horarios && typeof f.horarios === 'object' && !Array.isArray(f.horarios)) ? f.horarios : {},
      duracaoMin: duracaoDe(f),
      periodoInicio: String(f.periodoInicio || '').trim(),
      periodoFim: String(f.periodoFim || '').trim(),
      /* O PAR DA FAIXA HERDA O DA SALA QUANDO NÃO O DECLARA. É o que faz uma sala antiga, com um
       * professor e uma modalidade na raiz, continuar a dizer quem dá a aula depois de ganhar a
       * segunda faixa — sem obrigar a preencher de novo a primeira. */
      modalidade: String(f.modalidade || s.modalidade || '').trim(),
      professor: String(f.professor || s.professor || '').trim(),
    }));
  }
  return [{
    id: null,   // a raiz não tem id: é a faixa única, e é assim que a turma antiga a encontra
    dias: Array.isArray(s.dias) ? s.dias.map(String) : [],
    horarios: (s.horarios && typeof s.horarios === 'object') ? s.horarios : {},
    duracaoMin: duracaoDe(s),
    periodoInicio: String(s.periodoInicio || '').trim(),
    periodoFim: String(s.periodoFim || '').trim(),
    modalidade: String(s.modalidade || '').trim(),
    professor: String(s.professor || '').trim(),
  }];
}

/**
 * QUAL FAIXA A TURMA OCUPA — e o motivo quando não há resposta.
 *
 * `motivo` é `null` quando se sabe:
 *
 *   · `'ambigua'`      — a Sala tem mais de uma faixa e a Turma não diz qual. Recusa-se: escolher a
 *                        primeira por conta própria poria a Turma a ocupar o horário errado em
 *                        silêncio, que é o defeito que esta regra existe para acabar;
 *   · `'desconhecida'` — a Turma aponta para uma faixa que já não existe (o id mudou);
 *   · `'sem-faixa'`    — a Sala não declara faixa nenhuma.
 *
 * Com UMA só faixa, a escolha é implícita e não se pergunta nada: é o caso de todas as salas de hoje,
 * e pedir o id de uma faixa única seria fricção sem ganho.
 */
function faixaEscolhida(faixas, id) {
  const lista = Array.isArray(faixas) ? faixas : [];
  if (!lista.length) return { faixa: null, motivo: 'sem-faixa' };
  const pedido = String(id == null ? '' : id).trim();
  if (pedido) {
    const achada = lista.find((f) => String(f.id == null ? '' : f.id) === pedido);
    return achada ? { faixa: achada, motivo: null } : { faixa: null, motivo: 'desconhecida' };
  }
  if (lista.length === 1) return { faixa: lista[0], motivo: null };
  return { faixa: null, motivo: 'ambigua' };
}

/** Os intervalos de UMA faixa. `null` quando a faixa não os declara — ver `intervalosDaSala`. */
function intervalosDaFaixa(faixa) {
  const f = faixa || {};
  const duracao = duracaoDe(f);
  if (duracao === null) return null;
  const dias = Array.isArray(f.dias) ? f.dias : [];
  if (!dias.length) return null;
  const saida = [];
  for (const dia of dias) {
    const inicio = minutosDe(f.horarios && f.horarios[dia]);
    if (inicio === null) return null;   // um dia sem hora torna a faixa inteira inconferível
    saida.push({ dia: String(dia), inicio, fim: inicio + duracao, inicioTexto: horaDe(inicio), fimTexto: horaDe(inicio + duracao) });
  }
  return saida;
}

/**
 * OS INTERVALOS DE UMA SALA — os da FAIXA que a Turma ocupa.
 *
 * Sem `faixaId`, devolve os da faixa única; uma Sala com várias faixas e sem escolha devolve `null`,
 * porque «todas as faixas» seria a resposta errada: uma Turma das 9h não ocupa a sala às 11h.
 *
 * `null` e não `[]`: uma Sala sem hora e uma Sala sem dias são coisas diferentes, e quem chama tem de
 * as poder distinguir. `[]` seria «não ocupa nada», que é uma afirmação.
 */
function intervalosDaSala(sala, faixaId) {
  const escolha = faixaEscolhida(faixasDaSala(sala), faixaId);
  return escolha.faixa ? intervalosDaFaixa(escolha.faixa) : null;
}

/**
 * OS DOIS PERÍODOS TOCAM-SE? Uma Sala pode ter uma Turma até Junho e outra a partir de Agosto: são a
 * mesma sala, os mesmos dias e as mesmas horas, e **não é colisão** — é a sucessão normal.
 *
 * Só se responde `false` (não tocam) quando os DOIS períodos estão declarados. Um período em falta é
 * «não se sabe», e nessa dúvida a resposta é `true` — comparar como se se sobrepusessem, e dizê-lo.
 * Datas em texto `AAAA-MM-DD` comparam-se bem como texto; qualquer outro formato cai no «não se
 * sabe», que é o lado conservador.
 */
function periodosTocamSe(a, b) {
  /* A FORMA É `{inicio, fim}` — a do `periodo` que `ocupacaoDaCuradoria` produz —, e não a da turma
   * com `periodoInicio`/`periodoFim`. A primeira versão lia os campos da turma e recebia o período,
   * e o resultado era `true` em TODOS os casos: um campo que não existe `→ null → «não se sabe» →
   * trata como tocando`. Passava despercebido porque o lado conservador dá «colide», e só a asserção
   * da sucessão de salas — a que espera `false` — o apanhou. */
  const data = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '').trim()) ? String(v).trim() : null);
  const aIni = data(a && a.inicio);
  const aFim = data(a && a.fim);
  const bIni = data(b && b.inicio);
  const bFim = data(b && b.fim);
  if (!aIni || !aFim || !bIni || !bFim) return true;   // não se sabe → trata como tocando
  /* Intervalos fechados aqui: o último dia de um e o primeiro do outro são dias DIFERENTES de
   * ocupação, e um período que acaba a 30/06 e outro que começa a 30/06 tocam-se nesse dia. */
  return aIni <= bFim && bIni <= aFim;
}

/** Dois intervalos do MESMO dia sobrepõem-se? Meio-aberto: `fim` não pertence. */
function sobrepoemNoDia(x, y) {
  return x.inicio < y.fim && y.inicio < x.fim;
}

/**
 * OS CONFLITOS ENTRE UMA TURMA E OUTRA — o coração da regra.
 *
 * Recebe duas «ocupações» já resolvidas:
 *
 *   { id, rotulo, salas: ['Estúdio 1'], professor: 'demi-plie', alunas: ['Aluna A'],
 *     intervalos: [{dia, inicio, fim, inicioTexto, fimTexto}], periodo: {inicio, fim} }
 *
 * e devolve a lista de choques, um por (recurso, dia). Um conflito diz **qual** recurso, **que dia** e
 * **que horas** — porque a mensagem que a escola recebe tem de lhe dizer o que mudar.
 */
function conflitosEntre(a, b) {
  const A = a || {};
  const B = b || {};
  const saida = [];

  /* Os recursos partilhados. Um por um, com o nome que a mensagem usa. */
  const recursos = [];
  const salasA = Array.isArray(A.salas) ? A.salas.map(String) : [];
  const salasB = Array.isArray(B.salas) ? B.salas.map(String) : [];
  for (const s of salasA) if (salasB.indexOf(s) !== -1) recursos.push({ tipo: 'sala', nome: s });
  /* O PROFESSOR COMO CONJUNTO, E NÃO COMO UM CAMPO. Há dois sítios que declaram quem dá a aula: a
   * CURADORIA (`professor`, quem dirige) e a SALA (`professor`, o enquadramento operacional de
   * 18/11/2026 — «essas salas agora estão vinculadas a um professor e a modalidade»). Os dois
   * comprometem a mesma pessoa no mesmo horário, e comparar só um deles deixaria o outro por
   * conferir. Um objecto simples continua a valer: `professor` alimenta `professores`. */
  const professoresDe = (o) => {
    const lista = Array.isArray(o && o.professores) ? o.professores.map(String) : [];
    const um = String((o && o.professor) || '').trim();
    const todos = lista.map((x) => x.trim()).filter(Boolean);
    if (um && todos.indexOf(um) === -1) todos.push(um);
    return todos;
  };
  const profA = professoresDe(A);
  const profB = professoresDe(B);
  for (const p of profA) if (profB.indexOf(p) !== -1) recursos.push({ tipo: 'professor', nome: p });
  const alA = Array.isArray(A.alunas) ? A.alunas.map(String) : [];
  const alB = Array.isArray(B.alunas) ? B.alunas.map(String) : [];
  for (const x of alA) if (alB.indexOf(x) !== -1) recursos.push({ tipo: 'elenco', nome: x });

  if (!recursos.length) return saida;
  if (!periodosTocamSe(A.periodo, B.periodo)) return saida;

  const intA = Array.isArray(A.intervalos) ? A.intervalos : [];
  const intB = Array.isArray(B.intervalos) ? B.intervalos : [];
  for (const x of intA) {
    for (const y of intB) {
      if (String(x.dia) !== String(y.dia)) continue;
      if (!sobrepoemNoDia(x, y)) continue;
      for (const r of recursos) {
        saida.push({
          recurso: r.tipo,
          nome: r.nome,
          dia: String(x.dia),
          de: x.inicioTexto, ate: x.fimTexto,
          outroDe: y.inicioTexto, outroAte: y.fimTexto,
          comId: B.id || null,
          comRotulo: B.rotulo || null,
        });
      }
    }
  }
  return saida;
}

/**
 * A OCUPAÇÃO DE UMA CURADORIA, resolvida a partir das Salas que ela declara.
 *
 * Uma curadoria declara `turmas[]` — que, no vocabulário de hoje, são os NOMES das Salas —, o
 * `professor`, e as `alunas[]` (o elenco). Os intervalos são a UNIÃO dos intervalos das suas Salas:
 * uma curadoria com duas salas ocupa as duas.
 *
 * `rotulo` é o que a mensagem mostra. Sem ele, a recusa diz «outra Turma» — que é verdade e não ajuda.
 */
function ocupacaoDaCuradoria(curadoria, { salasPorNome, rotulo } = {}) {
  const c = curadoria || {};
  const nomes = Array.isArray(c.turmas) && c.turmas.length
    ? c.turmas.map((x) => String(x).trim()).filter(Boolean)
    : (String(c.turma || '').trim() ? [String(c.turma).trim()] : []);
  const mapa = salasPorNome || {};
  const intervalos = [];
  const declaradas = [];
  const professores = [];
  const faixasEmFalta = [];
  const faixas = [];
  let periodo = null;
  /* QUEM DÁ A AULA: a curadoria e a FAIXA, os dois. Ver `conflitosEntre` para a razão. */
  const juntarProfessor = (v) => {
    const s = String(v || '').trim();
    if (s && professores.indexOf(s) === -1) professores.push(s);
  };
  juntarProfessor(c.professor);
  for (const nome of nomes) {
    const sala = mapa[nome] || null;
    if (!sala) continue;
    const escolha = faixaEscolhida(faixasDaSala(sala), c.faixa);
    /* A FAIXA TEM DE ESTAR ESCOLHIDA, e sem ela não se inventa ocupação nenhuma. `faixasEmFalta` é
     * devolvido para a ROTA recusar; aqui não se lança nem se decide — este módulo não conhece a
     * mensagem. O que NÃO se faz é cair para «todas as faixas»: uma Turma das 9h não ocupa a sala às
     * 11h, e tomá-la por ocupante recusaria turmas legítimas. */
    if (!escolha.faixa) {
      faixasEmFalta.push({ sala: nome, motivo: escolha.motivo, faixas: faixasDaSala(sala).map((f) => ({ id: f.id, rotulo: rotuloDaFaixa(f) })) });
      continue;
    }
    const faixa = escolha.faixa;
    declaradas.push(sala);
    faixas.push(faixa);
    juntarProfessor(faixa.professor);
    const do_ = intervalosDaFaixa(faixa);
    if (do_) intervalos.push(...do_);
    /* O PERÍODO É O DA FAIXA — cada faixa tem o seu, e é isso que permite o termo seguinte na mesma
     * sala sem duplicar a sala. A curadoria com mais de uma sala fica com o mais largo. */
    const ini = String(faixa.periodoInicio || '').trim();
    const fim = String(faixa.periodoFim || '').trim();
    if (ini || fim) {
      periodo = periodo || { inicio: null, fim: null };
      if (ini && (!periodo.inicio || ini < periodo.inicio)) periodo.inicio = ini;
      if (fim && (!periodo.fim || fim > periodo.fim)) periodo.fim = fim;
    }
  }
  return {
    id: c.id || null,
    rotulo: rotulo || null,
    salas: nomes,
    professor: String(c.professor || '').trim() || null,
    professores,
    alunas: Array.isArray(c.alunas) ? c.alunas.map(String) : [],
    intervalos,
    periodo,
    declaradas,
    faixas,
    faixa: c.faixa == null ? null : String(c.faixa),
    faixasEmFalta,
  };
}

/** O rótulo de uma faixa, para a tela e para a mensagem: «seg, qua · 09:00–10:00». */
function rotuloDaFaixa(faixa) {
  const f = faixa || {};
  const dias = Array.isArray(f.dias) ? f.dias : [];
  const horas = dias.map((d) => String((f.horarios || {})[d] || '')).filter(Boolean).sort();
  const duracao = duracaoDe(f);
  const partes = [];
  if (dias.length) partes.push(dias.join(', '));
  if (horas.length && duracao !== null) {
    const inicio = minutosDe(horas[0]);
    partes.push(horaDe(inicio) + '–' + horaDe(inicio + duracao));
  } else if (horas.length) {
    partes.push(horas[0]);
  }
  return partes.join(' · ') || 'faixa sem ritmo';
}

/**
 * A CONFERÊNCIA COMPLETA — o que as rotas chamam antes de gravar.
 *
 * Recebe a curadoria que se está a gravar, as outras (ativas), e o mapa das Salas. Devolve os
 * conflitos com TODAS as outras, cada um já com o rótulo de quem ocupa.
 *
 * Três exclusões, e cada uma tem razão de ser:
 *
 *   · `substituidaPor` — a curadoria substituída não está em vigor;
 *   · `encerrada_em`   — a direção encerrada não ocupa. É a mesma regra do `salasOcupadas`, e foi
 *                        medida: sem ela, uma sala cuja Turma saiu com o professor ficava ocupada
 *                        para sempre por uma Turma que já não existe;
 *   · `excetoId`       — a própria curadoria não colide consigo mesma.
 *
 * `null` quando não há dados para conferir (sem mapa de Salas): quem chama decide — e não se inventa
 * colisão por falta de leitura.
 */
function conflitosDaCuradoria({ curadoria, outras, salasPorNome, excetoId, rotuloDe } = {}) {
  if (!salasPorNome || typeof salasPorNome !== 'object') return null;
  if (!Array.isArray(outras)) return null;
  const minha = ocupacaoDaCuradoria(curadoria, {
    salasPorNome,
    rotulo: typeof rotuloDe === 'function' ? rotuloDe(curadoria) : null,
  });
  /* A PRÓPRIA CURADORIA NUNCA COLIDE CONSIGO — e a exclusão é IMPLÍCITA, pelo id, porque depender de
   * o chamador passar `excetoId` é depender de ele se lembrar. A primeira versão só excluía com o
   * parâmetro, e a prova apanhou-o: a curadoria, comparada com a lista que a inclui, colidia consigo
   * mesma e nenhuma edição passaria. `excetoId` continua a existir para o caso da DERIVAÇÃO, em que
   * o que se compara é a versão nova contra a anterior — dois ids diferentes. */
  const meuId = excetoId || (curadoria && curadoria.id) || null;
  const saida = [];
  for (const o of outras) {
    if (!o || typeof o !== 'object') continue;
    if (o.substituidaPor) continue;
    if (o.encerrada_em) continue;
    if (meuId && String(o.id) === String(meuId)) continue;
    const dela = ocupacaoDaCuradoria(o, {
      salasPorNome,
      rotulo: typeof rotuloDe === 'function' ? rotuloDe(o) : null,
    });
    for (const c of conflitosEntre(minha, dela)) saida.push(c);
  }
  return saida;
}

/**
 * A FRASE DA RECUSA — uma só, para a rota e para a tela.
 *
 * Diz O RECURSO, O DIA e AS DUAS HORAS: sem isso, a escola sabe que não pode e não sabe o que mudar.
 * Nomeia o ocupante pelo rótulo, e não pelo id — quem lê é a direção, não o servidor.
 *
 * E diz o que se pode fazer por cada tipo de recurso, porque o caminho é diferente:
 *
 *   · sala      → mudar a hora, mudar o dia, ou usar outra sala;
 *   · professor → mudar a hora ou o dia (não há «outro professor» para o mesmo lugar);
 *   · elenco    → a aluna pode estar nas duas, mas não nesse dia e hora.
 */
function motivoDoConflito(conflito, { rotulo } = {}) {
  const c = conflito || {};
  const quem = c.comRotulo || 'outra Turma';
  const nome = String(c.nome || '');
  const quando = 'às ' + (c.de || '?') + '–' + (c.ate || '?') + ', ' + (c.dia || 'sem dia');
  const dele = 'às ' + (c.outroDe || '?') + '–' + (c.outroAte || '?');
  /* O RÓTULO ENTRE PARÊNTESES, E NÃO ENTRE ASPAS. Ele é composto — «coqui · Balé clássico» —, e
   * entre aspas lia-se «A Turma «coqui»», que confunde o professor com a turma. Entre parênteses o
   * composto lê-se como o que é: a descrição de quem está a ser gravado. */
  const eu = rotulo ? 'A Turma (' + rotulo + ')' : 'A Turma que se está a gravar';

  /* SEM SUGESTÃO DE RESOLUÇÃO (decisão dela, 25/11/2026): «a gente não vai dar sugestão de como
   * resolver nada, não. Isso é completamente discricionário de quem está usando o sistema.» A frase
   * diz o FACT — quem ocupa, que dia, que horas, que recurso — e pára. O que fazer com isso é de
   * quem está a gravar. */
  if (c.recurso === 'sala') {
    return eu + ' fica na sala «' + nome + '» ' + quando + ', e «' + quem + '» já lá está ' + dele +
      '. Uma sala recebe uma Turma de cada vez, no mesmo horário.';
  }
  if (c.recurso === 'professor') {
    return eu + ' fica com o professor «' + nome + '» ' + quando + ', e «' + quem + '» já lhe ' +
      'ocupa esse horário ' + dele + '. Um professor não está em duas Turmas ao mesmo tempo.';
  }
  return eu + ' inclui «' + nome + '» e fica ' + quando + ', e «' + quem + '» já a tem nesse ' +
    'horário ' + dele + '. Uma pessoa não está em dois lugares ao mesmo tempo.';
}

/**
 * A FRASE DA FAIXA EM FALTA — a segunda recusa que a faixa introduz.
 *
 * Uma Sala com mais de uma faixa e uma Turma que não diz qual delas ocupa são um dado incompleto, e
 * escolher a primeira por conta própria poria a Turma a ocupar o horário errado em silêncio. A frase
 * nomeia as faixas, para a escola escolher — e não decide por ela.
 */
function motivoDaFaixaEmFalta(falta) {
  const f = falta || {};
  const sala = String(f.sala || '—');
  const opcoes = (Array.isArray(f.faixas) ? f.faixas : []).map((x) => '«' + (x.rotulo || x.id) + '»');
  if (f.motivo === 'desconhecida') {
    return 'A faixa horária escolhida para a sala «' + sala + '» já não existe. As faixas dela hoje ' +
      'são ' + (opcoes.length ? opcoes.join(', ') : 'nenhuma') + '.';
  }
  if (f.motivo === 'sem-faixa') {
    return 'A sala «' + sala + '» não declara nenhuma faixa horária — sem dias, hora e duração não ' +
      'se pode conferir se ela colide com outra Turma.';
  }
  return 'A sala «' + sala + '» tem ' + (opcoes.length || 'várias') + ' faixas horárias (' +
    opcoes.join(', ') + ') e é preciso dizer qual delas esta Turma ocupa: um espaço com várias aulas ' +
    'por dia não é o mesmo horário para todas.';
}

module.exports = {
  minutosDe,
  horaDe,
  diasSemHora,
  duracaoDe,
  faixasDaSala,
  faixaEscolhida,
  intervalosDaFaixa,
  rotuloDaFaixa,
  intervalosDaSala,
  periodosTocamSe,
  sobrepoemNoDia,
  conflitosEntre,
  ocupacaoDaCuradoria,
  conflitosDaCuradoria,
  motivoDoConflito,
  motivoDaFaixaEmFalta,
};
