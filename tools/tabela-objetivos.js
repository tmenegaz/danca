#!/usr/bin/env node
'use strict';

/**
 * tabela-objetivos.js — o APANHADO «Objetivos por bloco e por aula» do plano do ciclo.
 *
 * O QUE ELE SUBSTITUI (26/10/2026). O plano trazia a tabela INTEIRA da sequência — bloco,
 * objetivo, conteúdo do nível, tempos e compasso — e ela duplicava, linha a linha, o que já
 * está na `aula-01.md` (`## 3. A sequência conectada` → `### Sequência declarada`): as duas
 * nascem da MESMA resposta da elicitação (`aula-1-sequencia`, ver `derivar-ciclo.js`). Medido
 * na `batata`: «Solo» aparecia 4×, «Barra» 4×, «Centro» 4× — o mesmo bloco repetido uma vez
 * por exercício, e o mesmo objetivo repetido quando havia mais de um exercício para ele. A
 * pesquisadora: «eu não preciso desse detalhamento aqui. Eu preciso apenas de um apanhado
 * geral… faz com que eu duplique».
 *
 * O QUE ELE FAZ. O cruzamento que o plano pode responder sem repetir nada:
 *
 *     bloco  ×  objetivo específico  →  a AULA em que aquele objetivo é o marco
 *
 * As duas tabelas já estão no plano, e a numeração delas é a MESMA que `linhasDaEstrutura`
 * usa: o objetivo `N` é a N-ésima linha de `marcosPorAula`, e o número da aula é o campo `n`
 * dessa linha. É por isso que a tabela cresce sozinha quando o professor acrescenta marcos —
 * ela não é escrita à mão em sítio nenhum, e não pode divergir do que o plano declara.
 *
 * O LINK. Quando a aula tem documento no pacote (`aula-NN`), a célula é um link para
 * `aula-NN.html#sequencia-declarada` — é lá que o detalhe (exercício, tempos, compasso) se lê.
 * Quando a aula ainda não tem documento, a célula diz o número e **não inventa link**: um
 * link para uma página que não existe é o defeito que a âncora morta já custou caro aqui.
 *
 * A CÉLULA VAZIA É DECLARADA. Um objetivo que não é marco de aula nenhuma sai como `—`, e não
 * como uma aula adivinhada: `marcosPorAula` é a única autoridade sobre «a que aula pertence».
 *
 *   uso: node tools/tabela-objetivos.js <plano-XX.json> [aula-01 aula-02 …]
 *
 * A lista de aulas é a dos documentos que o pacote VAI ter (`$DOCS` do gerador) — e não a dos
 * `.html` que já estão no disco, que depende da ordem em que o laço de geração os escreve.
 */

/** O âncora da sequência detalhada dentro da aula (medido em `aula-01.html`). */
const ANCORA_DA_SEQUENCIA = 'sequencia-declarada';

/** O número com dois dígitos — a forma do nome do arquivo (`aula-01`). */
const dois = (n) => (Number(n) < 10 ? '0' : '') + String(Number(n));

/** `**Solo** — objetivos específicos: **1** texto; **3** texto` → `{bloco, objetivos:[{n, texto}]}`. */
function lerLinhaDaEstrutura(linha) {
  const texto = String(linha == null ? '' : linha).replace(/^-\s*/, '').trim();
  const m = /^\*\*(.+?)\*\*\s*—\s*objetivos específicos:\s*(.*)$/.exec(texto);
  if (!m) return null;
  const bloco = m[1].trim();
  const resto = m[2].trim();
  if (!resto || /^\[a decidir/.test(resto)) return { bloco: bloco, objetivos: [] };
  const objetivos = [];
  for (const pedaco of resto.split(';')) {
    const o = /^\*\*(\d+)\*\*\s*(.*)$/.exec(pedaco.trim());
    if (!o) continue;
    objetivos.push({ n: Number(o[1]), texto: o[2].trim() });
  }
  return { bloco: bloco, objetivos: objetivos };
}

/** A estrutura em OBJETOS (`{marco, marcados:[bloco…]}`) — a forma que a porta grava hoje. */
function lerEstruturaEmObjetos(valor, marcos) {
  const ordem = [];
  const porObjetivo = new Map();
  for (const linha of valor) {
    if (!linha || typeof linha !== 'object' || Array.isArray(linha)) continue;
    const n = Number(linha.marco);
    const blocos = Array.isArray(linha.marcados) ? linha.marcados.map(String) : [];
    for (const bloco of blocos) if (ordem.indexOf(bloco) === -1) ordem.push(bloco);
    porObjetivo.set(n, blocos);
  }
  return ordem.map((bloco) => ({
    bloco: bloco,
    objetivos: [...porObjetivo.entries()]
      .filter(([, blocos]) => blocos.indexOf(bloco) !== -1)
      .map(([n]) => ({ n: n, texto: marcos.get(n) || '' }))
      .sort((a, b) => a.n - b.n),
  }));
}

/** O número da AULA de cada objetivo — `marcosPorAula[N-1].n`, a mesma conta do derivador. */
function aulasPorObjetivo(plano) {
  const mapa = new Map();
  const linhas = Array.isArray(plano && plano.marcosPorAula) ? plano.marcosPorAula : [];
  linhas.forEach((m, i) => {
    const aula = Number(String(m && m.n != null ? m.n : '').replace(/\D/g, ''));
    if (aula) mapa.set(i + 1, aula);
  });
  return mapa;
}

/** O TEXTO do marco por número de objetivo — a legenda que a estrutura cita. */
function textosPorObjetivo(plano) {
  const mapa = new Map();
  const linhas = Array.isArray(plano && plano.marcosPorAula) ? plano.marcosPorAula : [];
  linhas.forEach((m, i) => mapa.set(i + 1, String((m && m.marco) || '').trim()));
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
  const aulaDoObjetivo = aulasPorObjetivo(plano);
  const textoDoObjetivo = textosPorObjetivo(plano);

  const cru = plano && plano.estruturaDeCadaAula;
  const blocos = Array.isArray(cru) && cru.some((l) => l && typeof l === 'object')
    ? lerEstruturaEmObjetos(cru.filter((l) => l && typeof l === 'object'), textoDoObjetivo)
    : (Array.isArray(cru) ? cru : []).map(lerLinhaDaEstrutura).filter(Boolean);

  const linhas = ['| Bloco | Objetivo específico | Aula |', '|:--|:--|:--|'];
  const vistos = new Set();
  for (const b of blocos) {
    for (const o of b.objetivos) {
      const chave = b.bloco + '\u0000' + o.n;
      if (vistos.has(chave)) continue;   // o mesmo par bloco × objetivo, uma vez só
      vistos.add(chave);
      const aula = aulaDoObjetivo.get(o.n);
      const celula = !aula ? '—'
        : comDocumento.has(dois(aula))
          ? '[Aula ' + dois(aula) + '](aula-' + dois(aula) + '.html#' + ANCORA_DA_SEQUENCIA + ')'
          : 'Aula ' + dois(aula) + ' *(a criar)*';
      const legenda = o.texto || textoDoObjetivo.get(o.n) || '';
      linhas.push('| **' + b.bloco + '** | **' + o.n + '**' + (legenda ? ' — ' + legenda : '')
        + ' | ' + celula + ' |');
    }
  }
  if (linhas.length === 2) return ['- [a decidir — marque em que bloco cada objetivo é trabalhado]'];
  return linhas;
}

/* A LINHA DE NOTA — o que a tabela É, e de onde vem a coluna «Aula». Sai abaixo, como CITAÇÃO
 * (`>`), que é como o resto do documento escreve comentário de leitura: o contrato não a lê
 * como conteúdo, e ela não vira campo nenhum. */
const NOTA = [
  '',
  '> **O apanhado, e não a sequência.** Cada linha é o cruzamento entre o bloco e o objetivo '
    + 'específico que ele trabalha, e diz em que aula aquele objetivo é o marco. O **detalhe** '
    + '— exercício, conteúdo do nível, tempos e compasso — vive na **aula**: é ela que escolhe, '
    + 'entre o acervo do ciclo, o que acontece no dia. A tabela cresce à medida que os marcos '
    + 'das aulas entram no plano.',
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
  tabela, nota: NOTA, lerLinhaDaEstrutura, aulasPorObjetivo, ANCORA_DA_SEQUENCIA,
};
