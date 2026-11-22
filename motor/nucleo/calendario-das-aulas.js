'use strict';

/**
 * calendario-das-aulas.js — a data de cada aula, e o dia da semana dela.
 *
 * PORQUE EXISTE (22/11/2026). O §1 da aula declarava a data como lacuna: «a data desta aula não
 * está na fonte». Estava — no `.conf` da variante (o início do período, os dias da semana e o
 * total de aulas), que é exactamente o sítio que a Regra 10, camada 2, nomeia. O que faltava era
 * a conta, e a conta já existia: `tools/calendario.py` gerava-a em Python para o pacote. Aqui ela
 * fica em JavaScript, para o derivador a poder fazer sem chamar o gerador, e as duas têm de dar o
 * mesmo (é o que a prova mede, contra o `ciclos.json` publicado).
 *
 * A REGRA É A DO `calendario.py`, copiada e não reinventada: a primeira aula é a primeira
 * ocorrência de um dia da turma a partir do início (se o início não cai em dia de aula, a primeira
 * aula é o dia seguinte que cai), e cada ocorrência conta uma aula — um dia repetido na lista
 * (`2,6,6`) gera duas aulas na mesma data.
 *
 * O QUE ELE **NÃO** FAZ: adivinhar. Sem início, sem dias ou sem total, devolve a lacuna com nome
 * e não uma data «quase certa». E não lê ficheiros nem o relógio: é puro.
 */

const DIAS_DA_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira',
  'sexta-feira', 'sábado'];

/** `2026-12-14` ou `14/12/2026` → `{ano, mes, dia}`, em números. `null` se não for data. */
function partesDaData(valor) {
  const t = String(valor == null ? '' : valor).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return { ano: +m[1], mes: +m[2], dia: +m[3] };
  m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(t);
  if (m) return { ano: +m[3], mes: +m[2], dia: +m[1] };
  return null;
}

/** `14/12/2026` — a data como o produto a escreve. */
function dataBrasileira(valor) {
  const p = partesDaData(valor);
  if (!p) return String(valor == null ? '' : valor).trim();
  const dois = (n) => String(n).padStart(2, '0');
  return dois(p.dia) + '/' + dois(p.mes) + '/' + p.ano;
}

/** `segunda-feira` — o dia da semana de uma data. Vazio quando não é data. */
function diaDaSemana(valor) {
  const p = partesDaData(valor);
  if (!p) return '';
  // UTC, como o `calendario.py`: o fuso não entra na contagem de dias.
  const d = new Date(Date.UTC(p.ano, p.mes - 1, p.dia));
  return Number.isNaN(d.getTime()) ? '' : DIAS_DA_SEMANA[d.getUTCDay()];
}

/** `segunda-feira, 14/12/2026` — a data e o dia, na mesma linha. */
function dataEPeriodoDoDia(valor) {
  const dia = diaDaSemana(valor);
  const data = dataBrasileira(valor);
  return dia && data ? dia + ', ' + data : (data || dia);
}

/**
 * Os números ISO (1=segunda … 7=domingo) da lista de dias, na ordem declarada.
 * Aceita `['1','3','5']`, `[1,3,5]` e a forma com hora do `.conf` (`'1@10:30,3@10:30'`).
 */
function diasDaLista(dias) {
  const entradas = Array.isArray(dias)
    ? dias.map((d) => String(d).trim())
    : String(dias == null ? '' : dias).split(',');
  const numeros = [];
  for (const entrada of entradas) {
    const numero = parseInt(String(entrada).split('@')[0].trim(), 10);
    if (numero >= 1 && numero <= 7) numeros.push(numero);
  }
  return numeros;
}

/**
 * As datas de todas as aulas do ciclo — `['2026-12-14', …]`.
 *
 * `{ inicio, dias, total }`: o início em ISO ou `dd/mm/aaaa`, os dias como atrás, e quantas aulas
 * o ciclo tem. Devolve `null` quando não há o suficiente para a conta — e quem chama declara a
 * lacuna em vez de inventar uma data.
 */
function datasDasAulas({ inicio, dias, total } = {}) {
  const p = partesDaData(inicio);
  const numeros = diasDaLista(dias);
  const quantas = Number(total);
  if (!p || !numeros.length || !(quantas > 0)) return null;

  const datas = [];
  const d = new Date(Date.UTC(p.ano, p.mes - 1, p.dia));
  if (Number.isNaN(d.getTime())) return null;
  const isoDoDia = (x) => x.toISOString().slice(0, 10);

  // A primeira aula é a primeira ocorrência de um dia da turma — e o `calendario.py` diz o mesmo:
  // se o início não cai em dia de aula, a primeira aula é o próximo dia da lista.
  while (numeros.indexOf(d.getUTCDay() === 0 ? 7 : d.getUTCDay()) === -1) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  while (datas.length < quantas) {
    const dow = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
    const vezes = numeros.filter((n) => n === dow).length;
    for (let i = 0; i < vezes && datas.length < quantas; i += 1) datas.push(isoDoDia(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return datas;
}

/** A data de UMA aula (`nn` = `'01'`, `'1'`, `1`), ou `null`. */
function dataDaAula(numeroDaAula, opcoes) {
  const n = parseInt(String(numeroDaAula == null ? '' : numeroDaAula).replace(/\D/g, ''), 10);
  if (!(n >= 1)) return null;
  const datas = datasDasAulas(opcoes);
  return datas ? (datas[n - 1] || null) : null;
}

module.exports = {
  DIAS_DA_SEMANA,
  partesDaData,
  dataBrasileira,
  diaDaSemana,
  dataEPeriodoDoDia,
  diasDaLista,
  datasDasAulas,
  dataDaAula,
};
