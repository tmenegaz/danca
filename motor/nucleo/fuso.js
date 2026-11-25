'use strict';

/**
 * fuso.js — QUE HORAS SÃO, QUANDO O SISTEMA DIZ AS HORAS (16/11/2026).
 *
 * O DEFEITO, e é o dela ao pé da letra:
 *
 *   «O relógio que você está usando como referência está errado. […] eu estou em Passo Fundo, no
 *   Rio Grande do Sul, e agora, no dia 16 de novembro de 2026, são 9:59. Então, está aparecendo
 *   para mim aqui que a escola, ela foi habilitada ao meio-dia e 25. Não tem sentido isso.»
 *
 * NÃO ERA O RELÓGIO — ERA O RÓTULO. O instante gravado estava certo
 * (`habilitadaEm: 2026-11-16T12:25:53Z`); o que a tela fazia era **cortar os dígitos do ISO** e
 * escrever «16/11/2026 às 12:25», como se o `Z` do fim não existisse. As 12:25 UTC são as 09:25
 * em Passo Fundo, e quem lê «12:25» às 09:25 conclui, com razão, que o sistema está avariado.
 *
 * É A MESMA FAMÍLIA DA «senha não reconhecida»: o dado está certo e o texto ao lado dele mente.
 * Um número de horas sem o fuso é uma hora sem sujeito — e um prazo (a carência) lido nessa hora
 * é um prazo errado por três horas, que é a diferença entre «já pode apagar» e «ainda não».
 *
 * A REGRA, e ela vale para o sistema inteiro: **guarda-se em UTC, mostra-se no fuso de quem usa.**
 * O KV, os elos, os `desabilitadaEm` continuam em ISO/UTC — instantes comparáveis, sem ambiguidade
 * e sem horário de verão a intrometer-se na aritmética. A conversão acontece na última linha, ao
 * escrever para uma pessoa, e só aí.
 *
 * O FUSO É DECLARADO, e não adivinhado do ambiente. O runtime do Worker corre em UTC e não sabe
 * onde fica a escola; o navegador sabe, mas cada um sabe o seu — e a mesma tabela não pode dizer
 * horas diferentes conforme quem a abre. Há UM fuso da instalação, e ele está aqui, numa linha.
 *
 * NÃO É UMA `var` DO WORKER, e é de propósito: uma configuração que ninguém muda é uma segunda
 * opinião à espera de divergir. As funções aceitam um fuso por parâmetro, para o dia em que
 * houver mais do que uma instalação; hoje há uma, e ela é esta.
 */

/** O fuso da instalação. A `var` `FUSO_HORARIO` sobrepõe-no; isto é a resposta por omissão. */
const FUSO_PADRAO = 'America/Sao_Paulo';

/**
 * O RÓTULO QUE VAI NA TELA. É «horário de Brasília» e não «horário de Passo Fundo» porque a zona
 * IANA é `America/Sao_Paulo`, e ela cobre o Sul e o Sudeste inteiros: dizer o nome de uma cidade
 * seria dar à zona um dono que ela não tem. Quem quiser o identificador técnico lê-o no `title`.
 */
const ROTULO_DO_FUSO = 'horário de Brasília';

/**
 * O DESLOCAMENTO DE RESERVA, em minutos, para quando o runtime não tiver ICU com fusos.
 *
 * O Brasil não tem horário de verão desde 2019 (Decreto 9.772/2019), e `America/Sao_Paulo` é
 * −03:00 todo o ano desde então. Isto é a RESERVA, e não o caminho normal: `Intl` é quem sabe a
 * resposta certa, inclusive para datas antigas em que havia horário de verão. A reserva existe
 * porque uma tabela de datas não pode deixar de se desenhar por o runtime não trazer ICU — e
 * porque um `try/catch` à volta de um formatador é mais honesto do que confiar que ele existe.
 */
const DESLOCAMENTO_DE_RESERVA_MINUTOS = -180;

/** `Date` a partir de um instante ISO (ou de um `Date`). `null` quando não há data legível. */
function instante(iso) {
  if (iso instanceof Date) return Number.isFinite(iso.getTime()) ? iso : null;
  const d = new Date(String(iso == null ? '' : iso));
  return Number.isFinite(d.getTime()) ? d : null;
}

let formatador = null;
let formatadorFuso = null;
/** O `Intl` é caro de construir e é o mesmo para todos os pedidos — um por isolate, não por linha. */
function formatadorDe(fuso) {
  if (formatador && formatadorFuso === fuso) return formatador;
  try {
    formatador = new Intl.DateTimeFormat('pt-BR', {
      timeZone: fuso,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    formatadorFuso = fuso;
    return formatador;
  } catch (erro) {
    return null;
  }
}

/**
 * AS PARTES LOCAIS DE UM INSTANTE — `{ dia, mes, ano, hora, minuto }`, todas em texto de dois
 * dígitos (menos o ano, de quatro). `null` quando não há data.
 *
 * É a primitiva; tudo o resto neste módulo compõe-se a partir dela. Duas composições separadas
 * (uma para a tabela, outra para o relatório) divergiriam no dia em que uma delas esquecesse um
 * zero à esquerda — e «9:5» não é uma hora que alguém escreva.
 */
function partesLocais(iso, fuso) {
  const d = instante(iso);
  if (!d) return null;
  const zona = fuso || FUSO_PADRAO;
  const f = formatadorDe(zona);
  if (f) {
    const pedacos = {};
    for (const p of f.formatToParts(d)) {
      if (p.type !== 'literal') pedacos[p.type] = p.value;
    }
    if (pedacos.day && pedacos.month && pedacos.year && pedacos.hour && pedacos.minute) {
      const dois = (v) => (String(v).length === 1 ? '0' + v : String(v));
      return {
        dia: dois(pedacos.day), mes: dois(pedacos.month), ano: String(pedacos.year),
        hora: dois(pedacos.hour === '24' ? '00' : pedacos.hour), minuto: dois(pedacos.minute),
      };
    }
  }
  /* A RESERVA. O deslocamento é fixo e é o de hoje; para uma data de antes de 2019 seria uma
   * hora a menos no verão. Está escrito, e é a razão de isto não ser o caminho normal. */
  const emMinutos = d.getTime() + DESLOCAMENTO_DE_RESERVA_MINUTOS * 60000;
  const l = new Date(emMinutos);
  const dois = (n) => (n < 10 ? '0' : '') + n;
  return {
    dia: dois(l.getUTCDate()), mes: dois(l.getUTCMonth() + 1), ano: String(l.getUTCFullYear()),
    hora: dois(l.getUTCHours()), minuto: dois(l.getUTCMinutes()),
  };
}

/** «16/11/2026» — a data local. `'—'` quando não há. */
function diaLocal(iso, fuso) {
  const p = partesLocais(iso, fuso);
  return p ? p.dia + '/' + p.mes + '/' + p.ano : '—';
}

/** «16/11/2026 às 09:25» — o instante local, com a hora. `'—'` quando não há. */
function quandoLocal(iso, fuso) {
  const p = partesLocais(iso, fuso);
  return p ? p.dia + '/' + p.mes + '/' + p.ano + ' às ' + p.hora + ':' + p.minuto : '—';
}

/** «09:25» — só a hora local. */
function horaLocal(iso, fuso) {
  const p = partesLocais(iso, fuso);
  return p ? p.hora + ':' + p.minuto : '—';
}

/**
 * O DESLOCAMENTO REAL DAQUELE INSTANTE, em minutos — «−180», «−120» no antigo horário de verão.
 *
 * Não se usa para desenhar: usa-se para a legenda poder dizer «UTC−3» e para uma prova poder
 * afirmar que o deslocamento aplicado é o que o fuso exige, e não um número escrito à mão.
 */
function deslocamentoEmMinutos(iso, fuso) {
  const d = instante(iso);
  if (!d) return null;
  const zona = fuso || FUSO_PADRAO;
  try {
    const f = new Intl.DateTimeFormat('en-US', {
      timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
    const p = {};
    for (const pedaco of f.formatToParts(d)) if (pedaco.type !== 'literal') p[pedaco.type] = pedaco.value;
    const comoSeFosseUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day),
      Number(p.hour === '24' ? '00' : p.hour), Number(p.minute), Number(p.second || 0));
    return Math.round((comoSeFosseUtc - d.getTime()) / 60000);
  } catch (erro) {
    return DESLOCAMENTO_DE_RESERVA_MINUTOS;
  }
}

/** «UTC−3» — a etiqueta curta do fuso, para a legenda de uma tabela. */
function etiquetaDoFuso(iso, fuso) {
  const minutos = deslocamentoEmMinutos(iso || new Date(), fuso);
  if (minutos === null) return '';
  const absoluto = Math.abs(minutos);
  const horas = Math.floor(absoluto / 60);
  const resto = absoluto % 60;
  const sinal = minutos < 0 ? '\u2212' : '+';
  return 'UTC' + sinal + horas + (resto ? ':' + (resto < 10 ? '0' : '') + resto : '');
}

/**
 * O DIA SEGUINTE de um dia `AAAA-MM-DD`. Devolve `''` quando o que recebe não é um dia — quem chama
 * trata a ausência («não sei»), e não um dia inventado.
 *
 * Mora aqui, ao lado dos outros utilitários de data, porque DOIS módulos precisam dela e da mesma
 * maneira: as mensalidades (o atraso de um mês começa no dia seguinte ao vencimento) e as cobranças
 * (a reserva do `atrasoEm`, quando ele não vem dado). Duas cópias de `+ 1 dia` divergiriam no dia em
 * que alguém tratasse do horário de verão numa delas.
 *
 * A aritmética é em UTC de propósito: `new Date('2026-11-25')` já é meia-noite UTC, e somar um dia
 * em milissegundos não atravessa fuso nenhum. Com `setDate` sobre a hora local, o mesmo dia daria
 * outro em dois terços do mundo.
 */
function diaSeguinte(dia) {
  const texto = String(dia || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return '';
  const t = Date.parse(texto + 'T00:00:00Z');
  if (Number.isNaN(t)) return '';
  return new Date(t + 86400000).toISOString().slice(0, 10);
}

module.exports = {
  diaSeguinte,
  FUSO_PADRAO,
  ROTULO_DO_FUSO,
  DESLOCAMENTO_DE_RESERVA_MINUTOS,
  partesLocais,
  diaLocal,
  quandoLocal,
  horaLocal,
  deslocamentoEmMinutos,
  etiquetaDoFuso,
};
