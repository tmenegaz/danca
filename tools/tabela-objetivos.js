#!/usr/bin/env node
'use strict';

/**
 * tabela-objetivos.js — o APANHADO «Objetivos por bloco e por aula» do plano do ciclo.
 *
 * O QUE ELE SUBSTITUI (26/10/2026). O plano trazia a tabela INTEIRA da sequência — bloco,
 * objetivo, conteúdo do nível, tempos e compasso — e ela duplicava, linha a linha, o que já
 * está na `aula-01.md`: as duas nascem da MESMA resposta da elicitação (`aula-1-sequencia`).
 * Medido na `batata`: «Solo» 4×, «Barra» 4×, «Centro» 4× — o bloco repetido uma vez por
 * exercício. A pesquisadora: «eu não preciso desse detalhamento aqui. Eu preciso apenas de um
 * apanhado geral… faz com que eu duplique».
 *
 * O MODELO (26/10/2026). O objetivo específico é uma entidade do CICLO — não a linha do marco
 * de uma aula —, e é ele que declara em que blocos é trabalhado. Duas tabelas do plano dizem
 * isso, e esta é o cruzamento delas:
 *
 *     `objetivosEspecificos`  N · objetivo · blocos      ← o objetivo e onde ele é trabalhado
 *     `marcosPorAula`         aula · objetivo(s) · marco ← que aula persegue que objetivo
 *
 *     bloco × objetivo → a(s) aula(s) que o perseguem
 *
 * É por isso que a tabela cresce sozinha: não é escrita em sítio nenhum, e não pode divergir
 * do que o plano declara. E é por isso que ela aceita o que a versão anterior não aceitava —
 * um objetivo em mais de uma aula, e mais de um objetivo na mesma aula: a célula «Aula»
 * concatena, e a coluna `objetivos` dos marcos aceita vários números.
 *
 * O QUE ELA **NÃO** DIZ. Que a aula tem só os blocos em que o objetivo é trabalhado. A
 * estrutura da aula é o quadro «Blocos da aula e distribuição do volume» — esta tabela diz
 * ONDE cada objetivo é trabalhado, e nada sobre quais blocos a aula tem. Era exactamente essa
 * confusão que a secção «Estrutura de cada aula» fazia.
 *
 * O LINK só existe quando a página existe: `aula-NN.html#exercicios-da-aula-NN` quando o
 * documento está no pacote, «Aula NN *(a criar)*» quando não está. Link para página
 * inexistente é âncora morta.
 *
 *   uso: node tools/tabela-objetivos.js <plano-XX.json> [aula-01 aula-02 …]
 *
 * A lista de aulas é a dos documentos que o pacote VAI ter (`$DOCS` do gerador) — e não a dos
 * `.html` que já estão no disco, que depende da ordem em que o laço de geração os escreve.
 */

/**
 * O âncora do DETALHE dentro da aula (medido em `aula-01.html`).
 *
 * Era `#sequencia-declarada`, a lista de exercícios por bloco e objetivo. Essa lista saiu em
 * 28/10/2026 — repetia, mais pobre, o que «Exercícios da Aula NN» diz com compasso, contagem,
 * notação e descrição. O link que «Aula NN» abre passa a apontar para a secção dos exercícios,
 * que é hoje o detalhe da aula. O âncora leva o número porque a secção nasce numerada
 * (`exercicios-da-aula-01`).
 */
const ancoraDaSequencia = (aula) => 'exercicios-da-aula-' + dois(aula);

/** O número com dois dígitos — a forma do nome do arquivo (`aula-01`). */
const dois = (n) => (Number(n) < 10 ? '0' : '') + String(Number(n));

/** Os números que uma célula declara: «01» → [1]; «01, 03» → [1, 3]. */
const numeros = (celula) => String(celula == null ? '' : celula)
  .split(/[^0-9]+/).filter(Boolean).map(Number);

/** A lista de blocos de um objetivo: «Solo · Barra» → ['Solo', 'Barra']. */
const blocos = (celula) => String(celula == null ? '' : celula)
  .split(/[·;,]/).map((b) => b.trim()).filter(Boolean);

/** A leitura do documento ANTERIOR: a relação objetivo × bloco escrita como linhas de prosa. */
function objetivosDaEstruturaLegada(plano) {
  const crus = Array.isArray(plano && plano.estruturaDeCadaAula) ? plano.estruturaDeCadaAula : [];
  const porObjetivo = new Map();
  for (const linha of crus) {
    const texto = String(linha == null ? '' : linha).replace(/^-\s*/, '').trim();
    const m = /^\*\*(.+?)\*\*\s*—\s*objetivos específicos:\s*(.*)$/.exec(texto);
    if (!m) continue;
    const bloco = m[1].trim();
    const resto = m[2].trim();
    if (!resto || /^\[a decidir/.test(resto)) continue;
    for (const pedaco of resto.split(';')) {
      const o = /^\*\*(\d+)\*\*\s*(.*)$/.exec(pedaco.trim());
      if (!o) continue;
      const n = dois(o[1]);
      if (!porObjetivo.has(n)) porObjetivo.set(n, { n: n, objetivo: '', blocos: [] });
      const alvo = porObjetivo.get(n);
      if (alvo.blocos.indexOf(bloco) === -1) alvo.blocos.push(bloco);
      if (!alvo.objetivo) alvo.objetivo = o[2].trim();
    }
  }
  return [...porObjetivo.values()].sort((a, b) => Number(a.n) - Number(b.n));
}

/**
 * A LISTA DOS OBJETIVOS, das duas formas que o documento já teve.
 *
 * 1. `objetivosEspecificos` — a tabela nova (`| N | Objetivo específico | Bloco(s) |`), que é a
 *    forma correcta e a única que suporta mais de um objetivo por aula;
 * 2. `estruturaDeCadaAula` — as linhas `**Solo** — objetivos específicos: **1** texto; …` do
 *    documento anterior. Continuam a ser lidas porque há plano no repositório escrito assim,
 *    e um plano antigo não deixa de se ler só porque o formato mudou.
 */
function objetivosDoPlano(plano) {
  const lista = Array.isArray(plano && plano.objetivosEspecificos) ? plano.objetivosEspecificos : [];
  const objetos = lista.filter((o) => o && typeof o === 'object' && !Array.isArray(o));
  if (objetos.length) {
    return objetos.map((o) => ({
      n: dois(String(o.n == null ? '' : o.n).replace(/\D/g, '')),
      objetivo: String(o.objetivo == null ? '' : o.objetivo).trim(),
      blocos: blocos(o.blocos),
    })).filter((o) => o.n && o.n !== 'NaN');
  }
  return objetivosDaEstruturaLegada(plano);
}

/**
 * AS AULAS DE CADA OBJETIVO. A coluna `objetivos` dos marcos é a autoridade; quando ela não
 * existe (documento anterior), a reserva é a posição — que é a conta que o derivador fazia.
 */
function aulasPorObjetivo(plano) {
  const mapa = new Map();
  const linhas = Array.isArray(plano && plano.marcosPorAula) ? plano.marcosPorAula : [];
  linhas.forEach((m, i) => {
    if (!m || typeof m !== 'object') return;
    const aula = String(m.n == null ? '' : m.n).replace(/\D/g, '');
    if (!aula) return;
    const citados = String(m.objetivos == null ? '' : m.objetivos).trim();
    const alvos = citados ? numeros(citados) : [i + 1];
    for (const n of alvos) {
      if (!mapa.has(n)) mapa.set(n, []);
      const lista = mapa.get(n);
      if (lista.indexOf(Number(aula)) === -1) lista.push(Number(aula));
    }
  });
  return mapa;
}

/**
 * A TABELA. Devolve as linhas Markdown — SEM o título da secção, que é escrito pela fonte do
 * plano; o gerador troca o marcador `<!-- OBJETIVOS -->` por isto.
 *
 * `aulasComDocumento` é a lista de documentos que o pacote terá (`aula-01`, `aula-02`, …).
 */
function tabela(plano, aulasComDocumento) {
  const comDocumento = new Set((aulasComDocumento || [])
    .filter((a) => /^aula-\d+$/.test(String(a)))
    .map((a) => dois(String(a).replace(/\D/g, ''))));
  const objetivos = objetivosDoPlano(plano);
  const aulasDoObjetivo = aulasPorObjetivo(plano);

  const celulaDaAula = (aula) => (comDocumento.has(dois(aula))
    ? '[Aula ' + dois(aula) + '](aula-' + dois(aula) + '.html#' + ancoraDaSequencia(aula) + ')'
    : 'Aula ' + dois(aula) + ' *(a criar)*');

  const linhas = ['| Bloco | Objetivo específico | Aula |', '|:--|:--|:--|'];
  const vistos = new Set();
  for (const o of objetivos) {
    for (const bloco of o.blocos) {
      const chave = bloco + '\u0000' + o.n;
      if (vistos.has(chave)) continue;   // o mesmo par bloco × objetivo, uma vez só
      vistos.add(chave);
      const aulas = aulasDoObjetivo.get(Number(o.n)) || [];
      const celula = aulas.length ? aulas.map(celulaDaAula).join(' · ') : '—';
      linhas.push('| **' + bloco + '** | **' + o.n + '**' + (o.objetivo ? ' — ' + o.objetivo : '')
        + ' | ' + celula + ' |');
    }
  }
  if (linhas.length === 2) return ['- [a decidir — marque em que bloco cada objetivo é trabalhado]'];
  return linhas;
}

/* A LINHA DE NOTA — o que a tabela É, e o que ela NÃO diz. Sai abaixo, como CITAÇÃO (`>`), que
 * é como o resto do documento escreve comentário de leitura: o contrato não a lê como conteúdo,
 * e ela não vira campo nenhum. */
const NOTA = [
  '',
  '> **O apanhado, e não a sequência.** Cada linha é o cruzamento entre o bloco e o objetivo '
    + 'específico que ele trabalha, e diz em que aula aquele objetivo é o marco. O **detalhe** '
    + '— exercício, conteúdo do nível, tempos e compasso — vive na **aula**: é ela que escolhe, '
    + 'entre o acervo do ciclo, o que acontece no dia. O bloco aqui é ONDE O OBJETIVO É '
    + 'TRABALHADO — não são os blocos que a aula tem, que estão no quadro «Blocos da aula e '
    + 'distribuição do volume».',
];

function principal() {
  const [caminhoPlano, ...aulas] = process.argv.slice(2);
  if (!caminhoPlano) {
    console.error('uso: node tools/tabela-objetivos.js <plano-XX.json> [aula-01 aula-02 …]');
    return 2;
  }
  let plano;
  try {
    plano = JSON.parse(require('fs').readFileSync(caminhoPlano, 'utf8'));
  } catch (e) {
    console.error('erro: não consegui ler ' + caminhoPlano + ' (' + e.message + ')');
    return 1;
  }
  process.stdout.write(tabela(plano, aulas).concat(NOTA).join('\n') + '\n');
  return 0;
}

if (require.main === module) process.exit(principal());

module.exports = {
  tabela, nota: NOTA, objetivosDoPlano, aulasPorObjetivo, ancoraDaSequencia,
};
