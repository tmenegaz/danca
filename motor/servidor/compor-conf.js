'use strict';

/**
 * compor-conf.js — o manifesto da VARIANTE deixa de ser escrito à mão e passa a ser DERIVADO
 * do cadastro da turma e do plano elicitado (fase 2 da decisão «o ciclo é da turma», 16/10/2026).
 *
 * **Por que isto existe.** A fase 1 pôs a turma no nome da fonte (`ciclo-01-fita-teste-po.md`),
 * mas o gerador continuou a ler o `.conf` — e o `.conf` da turma nunca existiu. Medido no run
 * `39192752959`: o PO foi gravado e o CI falhou com «DATA_INICIO não está declarado», porque o
 * manifesto que ele leu era o da ESCOLA, escrito à mão em 15/10, com a lacuna intacta.
 *
 * **Por que no Worker, e não no gerador.** O gerador corre num runner do GitHub Actions, que não
 * vê o KV. Tudo o que vem do cadastro (a hora de cada dia, a turma) tem de estar em ARQUIVO antes
 * do workflow. Só o Worker vê os dois lados: o KV e o repositório.
 *
 * **Uma fonte por dado.** Medido antes de escrever isto, no plano de 18/10 e no `.conf` de 15/10:
 * o mesmo fato aparecia com dois valores (55 / 75 minutos; 3 / 4 dias por semana). A regra que
 * sai daqui é a do `PLANO-CICLO-DA-TURMA.md` §3.1 — a TURMA manda no RITMO (dias, horas, duração,
 * período), o PLANO manda no CONTEÚDO (o objetivo geral), e a IDENTIDADE (escola, habilitação,
 * responsável, faixa de volume) vem do `.conf` da escola, que é o único que continua escrito à mão.
 *
 * Este módulo é PURO: não faz I/O e não conhece KV. Quem lê a turma e o `.conf` é a ponte.
 *
 * O que ele NÃO faz: inventar. Quando falta um dado, devolve a falta com nome e origem; quando
 * dois valores do mesmo fato divergem, devolve o conflito — quem decide é quem opera.
 */

// O `require` de `escrever-ciclo.js` é TARDIO e está num único ponto: ele já requer
// `escrever-plano.js`, que requer este módulo — no topo, o ciclo de módulos fecharia com um dos
// lados vazio. As funções comuns aos dois (o mapa dos dias, a data brasileira, os minutos de uma
// duração) vivem LÁ; duplicá-las aqui seria a segunda lista da mesma coisa.
const ciclo = () => require('./escrever-ciclo.js');

/* A VARIANTE VEM DA MESMA FUNÇÃO QUE TODOS OS ESCRITORES USAM (10/11/2026). `escrever-po` não
 * requer este módulo, pelo que o `require` de topo não fecha ciclo nenhum — e é ele que impede
 * esta conta de ser escrita uma segunda vez. Ver o comentário em `comporConf`. */
const { varianteDoContexto } = require('./escrever-po.js');
/* A FAIXA DE VOLUME PASSOU A SER CALCULÁVEL (20/11/2026) — `motor/nucleo/volume.js` é o
 * único sítio que a resolve. Antes dela havia cinco cópias da mesma escada `<=60 />60`, e
 * as cinco ficaram para trás à primeira duração nova. */
const volume = require('../nucleo/volume.js');

/** Uma hora `HH:MM` válida? A hora é obrigatória: sem ela o prazo não tem de onde contar. */
function horaValida(h) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(h || '').trim());
}

/** Os dias da turma que o calendário conhece, na ordem do cadastro. */
function diasConhecidos(turma) {
  const mapa = ciclo().DIA_ISO;
  const dias = (turma && Array.isArray(turma.dias)) ? turma.dias : [];
  return dias.filter((d) => mapa[String(d).toLowerCase().trim()] !== undefined);
}

/**
 * O que falta na turma para ela poder gerar um ciclo. Lista vazia = não falta nada.
 * Cada frase nomeia o campo e a razão; nenhuma inventa um valor.
 */
function faltasDaTurma(turma) {
  if (!turma) return ['a turma (não encontrada no cadastro desta escola)'];
  const falta = [];

  const dias = diasConhecidos(turma);
  if (!dias.length) {
    falta.push('os dias da semana da turma (é deles que sai a frequência)');
  } else {
    const horarios = (turma.horarios && typeof turma.horarios === 'object') ? turma.horarios : {};
    const semHora = dias.filter((d) => !horaValida(horarios[d]));
    if (semHora.length) {
      falta.push('a hora de início de ' + semHora.join(', ') +
        ' — sem ela o prazo de lançamento não tem de onde contar (ARQUITETURA-AULA.md §3.1)');
    }
  }

  if (!(Number(turma.duracaoMin) > 0)) falta.push('a duração de cada aula');
  if (!ciclo().dataBrasil(turma.periodoInicio)) falta.push('o início do período');
  if (!ciclo().dataBrasil(turma.periodoFim)) falta.push('o fim do período');
  return falta;
}

/**
 * Quantas aulas caem no período, nos dias da turma — contadas no calendário, não estimadas.
 * É o mesmo número que o `calendario.py --total` recebe; a contagem aqui é a dele.
 */
function aulasNoPeriodo(turma) {
  const ini = /^(\d{4})-(\d{2})-(\d{2})/.exec(String((turma && turma.periodoInicio) || '').trim());
  const fim = /^(\d{4})-(\d{2})-(\d{2})/.exec(String((turma && turma.periodoFim) || '').trim());
  if (!ini || !fim) return null;
  const mapa = ciclo().DIA_ISO;
  const numeros = new Set(diasConhecidos(turma).map((d) => mapa[String(d).toLowerCase().trim()]));
  if (!numeros.size) return null;
  // Em UTC, como o `calendario.py`: o fuso não entra na contagem de dias.
  const d = new Date(Date.UTC(+ini[1], +ini[2] - 1, +ini[3]));
  const f = new Date(Date.UTC(+fim[1], +fim[2] - 1, +fim[3]));
  if (Number.isNaN(d.getTime()) || Number.isNaN(f.getTime()) || f < d) return null;
  let n = 0;
  while (d <= f) {
    const domingo = d.getUTCDay();
    if (numeros.has(domingo === 0 ? 7 : domingo)) n += 1;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return n;
}

/** `DIAS="2@09:00,3@09:00"` — um par por dia, na ordem do cadastro. */
function diasComHora(turma) {
  const mapa = ciclo().DIA_ISO;
  const horarios = (turma && turma.horarios && typeof turma.horarios === 'object') ? turma.horarios : {};
  return diasConhecidos(turma)
    .filter((d) => horaValida(horarios[d]))
    .map((d) => mapa[String(d).toLowerCase().trim()] + '@' + String(horarios[d]).trim())
    .join(',');
}

/** As variáveis declaradas num `.conf` (`CHAVE="valor"`), como objeto. */
function variaveisDoConf(texto) {
  const vars = {};
  const re = /^([A-Z][A-Z0-9_]*)=(?:"([^"]*)"|([^\s#]*))/gm;
  let m;
  while ((m = re.exec(String(texto || ''))) !== null) vars[m[1]] = m[2] !== undefined ? m[2] : m[3];
  return vars;
}

/** Uma linha `CHAVE="valor"` — as aspas do valor viram apóstrofos, que o shell não interpreta. */
function linha(chave, valor) {
  const v = String(valor === null || valor === undefined ? '' : valor).replace(/"/g, "'");
  return chave + '="' + v + '"';
}

/**
 * Compõe o texto do `.conf` da variante.
 *
 * @param {object} o
 * @param {object} o.turma       o registo vigente do cadastro (`id`, `nome`, `dias`, `horarios`,
 *                               `duracaoMin`, `periodoInicio`, `periodoFim`)
 * @param {object} [o.plano]     o envelope elicitado (para o objetivo geral e a conferência)
 * @param {object} o.identidade  as variáveis do `.conf` da ESCOLA — o que não se deriva
 * @param {string} o.escola      o slug da escola (`fita`)
 * @param {string} o.ciclo       `01`
 * @param {string} [o.docs]      o `DOCS` que já existe no manifesto; sem ele, `"plano"`
 * @returns {{texto: string, derivados: object, conflitos: string[], pendencias: string[]}}
 * @throws {Error} quando a turma não tem o que a geração exige (a mensagem nomeia o que falta)
 */
function comporConf({ turma, plano, identidade, escola, ciclo: numeroDoCiclo, docs }) {
  const falta = faltasDaTurma(turma);
  if (falta.length) {
    const erro = new Error('a turma não tem o que a geração exige: ' + falta.join('; '));
    erro.falta = falta;
    throw erro;
  }
  const id = String(turma.id || '').trim();
  if (!id) throw new Error('a turma não tem id — sem id não há variante');

  const ident = identidade || {};
  const nd = Number(turma.duracaoMin);
  const total = aulasNoPeriodo(turma);
  const inicio = ciclo().dataBrasil(turma.periodoInicio);
  const frequencia = diasConhecidos(turma).length + 'x/semana';
  /* A VARIANTE É A DO NOME, E NÃO A DO ID (10/11/2026).
   *
   * O DEFEITO QUE ISTO FECHA, e ele estava armado. A variante é a identidade da fonte, e é ela
   * que nomeia TUDO — o `.conf`, o `-plano.md`, o `-po.md`, a pasta do pacote e a âncora
   * `.fipp`. Aqui ela era `escola + '-' + turma.id`. Enquanto a Sala é a original, o id é o
   * slug do nome e as duas contas coincidem. Mas `turma-derivar` dá ao elo novo um id com a
   * data (`rosa-2026-11-10`) e mantém o NOME («Rosa»): a partir do primeiro ajuste de horário,
   * este `.conf` passava a declarar `VARIANTE="calango-rosa-2026-11-10"` enquanto
   * `escrever-plano`, `escrever-po`, `escrever-ciclo` e `hash-ciclo.sh` continuavam a escrever e
   * a procurar `ciclo-01-calango-rosa-*`. Um ciclo, dois nomes — e o gerador (`ID="ciclo-$CICLO
   * -$VARIANTE"`) a procurar fontes que ninguém escreveu.
   *
   * A REGRA FICA NUM SÍTIO SÓ. `varianteDoContexto` (em `escrever-po.js`) já compõe
   * `<escola>-<slug da turma>` a partir do NOME, e é ela que todos os escritores usam. Este
   * módulo passa a chamá-la, em vez de repetir a conta — duas cópias da mesma regra divergiriam
   * no dia em que uma delas mudasse.
   */
  const nomeDaTurma = String(turma.nome || id);
  const variante = varianteDoContexto({ escola, turma: nomeDaTurma });

  // O CONTEÚDO vem do plano — é o único campo que ele manda aqui. Ausente, fica a lacuna
  // declarada: nunca um texto inventado.
  const { respostaDo } = require('../nucleo/derivar-po.js');
  const objetivo = respostaDo(plano, 'objetivo-geral');

  // ── a conferência que impede a repetição do defeito medido (quatro valores para um fato) ──
  // Não corrige: AVISA. A turma é a fonte do ritmo, e o `.conf` sai dela.
  const conflitos = [];
  const declarado = respostaDo(plano, 'contexto-total-aulas');
  if (declarado !== null && declarado !== undefined && String(declarado).trim() !== '') {
    if (Number(declarado) !== total) {
      conflitos.push('o plano declara ' + String(declarado).trim() + ' aulas e a turma produz ' +
        total + ' no período ' + ciclo().dataBrasil(turma.periodoInicio) + ' → ' +
        ciclo().dataBrasil(turma.periodoFim));
    }
  }
  /* A DURAÇÃO DO PLANO É COMPOSTA, E JÁ SE COMPARA COMO TAL (20/11/2026).
   *
   * Aqui fazia-se `.split(',')` porque `minutosDaDuracao` devolvia uma lista de durações
   * autónomas — e um plano de 70 min (1 h + 10 min) chegava como `"10,60"`. O campo do plano é
   * UMA duração em duas parcelas (o conteúdo declara `"pares": 2, "fixas": ["hora","minuto"]`), e
   * a função soma-as. O valor é agora um número só, e o que sobra é a comparação com a Sala. */
  const duracoesDoPlano = Number(ciclo().minutosDaDuracao(respostaDo(plano, 'contexto-duracao')));
  if (Number.isFinite(duracoesDoPlano) && duracoesDoPlano > 0 && duracoesDoPlano !== nd) {
    conflitos.push('o plano declara ' + duracoesDoPlano + ' min por aula e a turma declara ' + nd);
  }
  const calendario = respostaDo(plano, 'contexto-calendario');
  const inicioDoPlano = calendario && calendario.inicio ? ciclo().dataBrasil(calendario.inicio) : null;
  if (inicioDoPlano && inicioDoPlano !== inicio) {
    conflitos.push('o plano declara início em ' + inicioDoPlano + ' e a turma em ' + inicio);
  }

  // ── quem é o professor DESTE ciclo ──────────────────────────────────────────
  //
  // É o professor do PLANO — quem dá a turma —, e não o responsável pela escola. Os dois podem
  // ser pessoas diferentes: uma turma da escola `calango` pode estar na curadoria de outro
  // professor, e o `PROFESSOR` do manifesto vai para o rodapé do PDF, para o `author:` do README
  // e para o «**Professor:**» da página. Dizer ali o nome de quem criou a escola é dizer o nome
  // errado no documento de quem dá a aula. A identidade da escola é o RECURSO: vale quando o
  // plano não nomeia ninguém (plano antigo, envelope sem a resposta).
  //
  // Medido em 22/10/2026: o manifesto de `murisoca-baiana` saiu com `PROFESSOR=""` porque o
  // `.conf` da escola não estava na pasta dela (ver `confDaEscolaPara`, em escrever-plano.js).
  const professorDoPlano = respostaDo(plano, 'contexto-professor');
  const nomeDoProfessor = typeof professorDoPlano === 'string' && professorDoPlano.trim()
    ? professorDoPlano.trim()
    : '';

  // ── a faixa de volume que o gerador vai procurar para ESTA duração (Regra 9) ──
  /*
   * A FAIXA PASSOU A SER CALCULÁVEL (20/11/2026) — ver `motor/nucleo/volume.js`.
   *
   * O QUE ACONTECIA. A faixa tinha de ser declarada por duração exacta, e uma escola nova nasce
   * a declarar só 60 e 120. Cada duração nova — 70, 90, 110 — exigia uma intervenção à mão, e
   * sem ela o `gerar-ciclo` morria com «sem faixa de volume para N min». Três gerações perdidas
   * numa noite pela mesma causa.
   *
   * A ORDEM DAS RESPOSTAS, e é ela que torna a mudança segura:
   *   1. o par DECLARADO para esta duração ganha — nada do que já está escrito muda de sentido;
   *   2. senão, a proporção da escola (`VOLUME_POR_MINUTO_MIN`/`_MAX`);
   *   3. senão, a proporção padrão (4/3 a 5/3), que é a linha recta que as cinco linhas medidas
   *      do repositório já seguem.
   *
   * O QUE SE ESCREVE NO `.conf` DA VARIANTE. O par RESOLVIDO, com as chaves canónicas desta
   * duração. É o que faz o manifesto bastar-se: o `gerar-ciclo.sh` continua a encontrar
   * `VOLUME_MIN_<dur>` sem lhe tocar, e quem abrir o ficheiro lê o número que foi usado, em vez
   * de ter de o recalcular de uma regra que vive noutro sítio.
   */
  const pendencias = [];
  const faixaDoVolume = volume.faixaDoVolume(nd, ident);
  if (!faixaDoVolume.origem) {
    pendencias.push('a turma não declara duração legível — sem ela não há faixa de volume '
      + 'para a Regra 9');
  }
  const chaveMin = nd <= 60 ? 'VOLUME_MIN' : 'VOLUME_MIN_' + nd;
  const chaveMax = nd <= 60 ? 'VOLUME_MAX' : 'VOLUME_MAX_' + nd;
  const linhasDeVolume = faixaDoVolume.origem
    ? [linha(chaveMin, faixaDoVolume.min), linha(chaveMax, faixaDoVolume.max)]
    : [];
  /* E A PROPORÇÃO VAI JUNTO, quando foi dela que o número saiu. Sem esta linha, o manifesto de
   * uma variante de 94 min teria um par que ninguém sabe de onde veio — e a escola perderia a
   * única testemunha de que o número é uma proporção e não uma decisão. */
  const linhasDaProporcao = [];
  if (faixaDoVolume.origem === 'proporcao-padrao') {
    linhasDaProporcao.push(linha('VOLUME_POR_MINUTO_MIN', '1.333'));
    linhasDaProporcao.push(linha('VOLUME_POR_MINUTO_MAX', '1.667'));
  } else if (faixaDoVolume.origem === 'proporcao-da-escola') {
    linhasDaProporcao.push(linha('VOLUME_POR_MINUTO_MIN', String(ident.VOLUME_POR_MINUTO_MIN)));
    linhasDaProporcao.push(linha('VOLUME_POR_MINUTO_MAX', String(ident.VOLUME_POR_MINUTO_MAX)));
  }

  // O `DOCS` já escrito é PRESERVADO: re-eliciar o plano depois de o ciclo ter aulas não pode
  // apagar as fontes que o gerador já escreveu. O plano entra no começo quando ainda não está.
  const atuais = String(docs === undefined ? '' : docs).trim().split(/\s+/).filter(Boolean);
  const lista = atuais.length ? atuais.slice() : ['plano'];
  if (lista.indexOf('plano') === -1) lista.unshift('plano');

  const texto = [
    '# ============================================================================',
    '# ' + ['ciclo', numeroDoCiclo, variante].join('-') + '.conf — DERIVADO. Não edite à mão.',
    '#',
    '# A próxima elicitação do plano reescreve este arquivo. As fontes são TRÊS, e cada uma',
    '# manda no que é seu:',
    '#   · o cadastro da turma — dias, hora de cada dia, duração, período (o RITMO)',
    '#   · o plano elicitado   — o objetivo geral (o CONTEÚDO)',
    '#   · o .conf da escola   — escola, habilitação, responsável, faixa de volume (a NORMA)',
    '# Ver PLANO-CICLO-DA-TURMA.md §3.1.',
    '# ============================================================================',
    '',
    // O `CICLO` é declarado AQUI desde 22/10/2026, e não só herdado da base. O manifesto
    // base (`ciclo-NN.conf`) nasce em `tools/criar-escola.sh`, sob o professor que cria a
    // escola; uma turma pode estar na curadoria de outro professor, e a pasta dele nunca teve
    // base. Sem esta linha, a variante não era um manifesto inteiro: `hash-ciclo.sh` a
    // reprovava no schema («faltam 1 campo(s) obrigatório(s): - CICLO») e `gerar-ciclo.sh`
    // morria antes, exigindo um arquivo que não existe. Com ela, a variante basta-se — que é
    // o que `tools/gerar-ciclo.sh` e `tools/hash-ciclo.sh` passaram a aceitar.
    linha('CICLO', numeroDoCiclo),
    linha('VARIANTE', variante),
    linha('ESCOLA', ident.ESCOLA || escola),
    linha('RESPONSAVEL', ident.RESPONSAVEL || ''),
    linha('PROFESSOR', nomeDoProfessor || ident.PROFESSOR || ident.RESPONSAVEL || ''),
    linha('ESCOLA_HABILITADA', ident.ESCOLA_HABILITADA || 'sim'),
    '',
    '# --- ritmo: do cadastro da turma (Pré-requisito 5) --------------------------',
    linha('FREQUENCIA', frequencia),
    linha('DIAS', diasComHora(turma)),
    linha('DURACAO_POR_DIA', nd + ' min por encontro'),
    linha('DURACOES', nd),
    linha('DATA_INICIO', inicio),
    linha('TOTAL_AULAS', total),
    '',
    '# --- norma: do .conf da escola (Regra 9) ------------------------------------',
    // A faixa é da escola, mas a variante da TURMA é lida pelo gerador ao lado do manifesto
    // BASE (`ciclo-01.conf`), e não do `.conf` da escola — por isso o par resolvido é copiado
    // para cá. Sem esta cópia, a faixa declarada na escola não chegaria ao gerador, e a turma
    // de 75 min seria recusada por uma chave que existe do outro lado do repositório.
    ...linhasDeVolume,
    ...linhasDaProporcao,
    ...(linhasDeVolume.length ? [''] : []),
    '# --- conteúdo: do plano elicitado -------------------------------------------',
    linha('NOME', 'Ciclo ' + numeroDoCiclo + ' — ' + (ident.ESCOLA || escola) + ' · ' + nomeDaTurma),
    linha('OBJETIVO_GERAL', objetivo ||
      '[Preencher: objetivo geral do ciclo — o plano elicitado o estabelece]'),
    '',
    '# --- documentos, na ordem do pacote -----------------------------------------',
    linha('DOCS', lista.join(' ')),
    '',
  ].join('\n');

  return {
    texto,
    derivados: {
      CICLO: numeroDoCiclo,
      VARIANTE: variante,
      FREQUENCIA: frequencia,
      DIAS: diasComHora(turma),
      DURACOES: String(nd),
      DURACAO_POR_DIA: nd + ' min por encontro',
      DATA_INICIO: inicio,
      TOTAL_AULAS: String(total),
      DOCS: lista.join(' '),
    },
    conflitos,
    pendencias,
  };
}

/**
 * A turma que o contexto nomeia. O contexto traz o NOME de exibição (`Teste`), porque é ele que
 * a ficha do plano mostra (`opcoesDeTurmas`); o cadastro indexa pelo `id` (`teste`). Resolve-se
 * pelos dois, e só entre as VIGENTES — a turma derivada (`teste-2026-10-16`) é a que vale hoje.
 */
function acharTurma(lista, referencia) {
  const alvo = String(referencia || '').trim();
  if (!alvo) return null;
  const vigentes = (Array.isArray(lista) ? lista : []).filter((t) => t && !t.substituidaPor);
  const igual = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  return vigentes.find((t) => igual(t.id, alvo)) ||
    vigentes.find((t) => igual(t.nome, alvo)) ||
    null;
}

/**
 * O RITMO DA SALA, NAS RESPOSTAS DO PLANO (09/11/2026).
 *
 * PORQUE ISTO EXISTE. Os quatro campos do `## Contexto` que a Sala manda — frequência, duração,
 * calendário e total de aulas — são declarados `daTurma` no conteúdo (`plano.json`): não são
 * autoria do professor, são LEITURA do cadastro. Mas o que o plano grava é uma FOTOGRAFIA: os
 * valores entram no envelope quando ele nasce e não se atualizam sozinhos. Quando a Sala muda, o
 * plano continua a declarar o ritmo antigo, e o `## Contexto` do documento impresso mente.
 *
 * O que esta função devolve são exatamente esses quatro valores, na forma das respostas — a mesma
 * forma que o formulário grava (o `valorDaTurma` do `porta/index.html`, do outro lado). É ela que
 * a cadeia automática usa para re-ler o ritmo no elo novo, em vez de copiar a fotografia velha.
 *
 * O QUE ELA NÃO DEVOLVE. Campo sem valor na Sala (sem dias, sem duração, sem período): a chave
 * não nasce, e a fotografia anterior fica como está — o silêncio não apaga o que o professor já
 * tinha. `totalAulas` é CALCULADO do período × dias, como no `.conf` e no formulário.
 */
function respostasDoRitmo(turma) {
  const t = turma || {};
  const saida = {};

  const dias = Array.isArray(t.dias) ? t.dias.filter(Boolean) : [];
  const vezes = dias.length || Number(t.frequencia) || 0;
  if (vezes) saida['contexto-frequencia'] = { vezes: vezes, por: 'semanal', dias: dias };

  const minutos = Number(t.duracaoMin);
  if (minutos > 0) {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    const partes = [];
    if (horas) partes.push({ numero: horas, unidade: 'hora' });
    if (resto || !horas) partes.push({ numero: resto, unidade: 'minuto' });
    saida['contexto-duracao'] = partes;
  }

  if (t.periodoInicio || t.periodoFim) {
    saida['contexto-calendario'] = { inicio: t.periodoInicio || null, fim: t.periodoFim || null };
  }

  const total = aulasNoPeriodo(t);
  if (total !== null) saida['contexto-total-aulas'] = total;

  return saida;
}

module.exports = {
  comporConf,
  respostasDoRitmo,
  faltasDaTurma,
  aulasNoPeriodo,
  diasComHora,
  diasConhecidos,
  acharTurma,
  variaveisDoConf,
  horaValida,
};
