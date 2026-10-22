#!/usr/bin/env node
'use strict';

/**
 * provar-coerencia-do-po-no-pacote.js — o `check-pacote` apanha um pacote que mistura dois POs
 * (22/10/2026).
 *
 * O QUE SE MEDIU. Em 22/10/2026 a escola `batata` gerou o pacote com o `-po.md` do
 * `po-20261022-1108` (o segundo) e as fontes derivadas do `po-20261022-1039` (o primeiro), e o
 * `node tools/check-pacote.js` deu **0 erros**. Nenhuma checagem comparava a proveniência: o
 * `po-01.json` sai do próprio `-po.md` (portanto concorda com ele por construção), e as fontes
 * derivadas — que descrevem o PO — não declaravam de onde vinham.
 *
 * O QUE MUDOU. O `-po.md` passou a declarar `envelope:` no cabeçalho (`derivar-po.js`), e o
 * `-dados.json` passou a declarar `po` (`derivar-ciclo.js`). O `check-pacote` compara os dois.
 *
 * O QUE ESTA PROVA TRAVA.
 *
 *   1. carimbos IGUAIS → a checagem passa, e diz o carimbo;
 *   2. carimbos DIFERENTES → ERRO, e a mensagem nomeia os dois;
 *   3. `-po.md` sem `envelope:` **e** `-dados.json` sem `po` → AVISO, não erro: a declaração é
 *      nova, e um ciclo gerado antes dela não é inválido por lhe faltar uma marca que ainda não
 *      existia (reprovar aqui ensinaria a ignorar o validador);
 *   4. MEIA declaração (a fonte diz, o dados não — ou o contrário) → ERRO;
 *   5. `-dados.json` sem `po`, com a fonte a declarar → ERRO (não se pode conferir).
 *
 * O pacote é SINTÉTICO e mínimo: as outras checagens (PDF, HTML, links) falham de propósito — o
 * que se mede aqui é só a linha da proveniência do PO, filtrada da saída.
 *
 *   uso: node experimentos/provar-coerencia-do-po-no-pacote.js
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const RAIZ = path.join(__dirname, '..');
const CHECK = path.join(RAIZ, 'tools/check-pacote.js');

let falhas = 0;
let n = 0;
const conferir = (nome, ok, detalhe) => {
  n += 1;
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok ? '' : '  -> ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

const CICLO = '01';
const VARIANTE = 'batata-bale-nivel-1-teste-2';

/** Monta `<tmp>/ciclos/ciclo-01-.../` com a fonte do PO e o JSON de dados, e corre o check. */
function correr({ envelope, poDoDados }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'danca-check-po-'));
  const dirCiclos = path.join(tmp, 'ciclos');
  const pacote = path.join(dirCiclos, `ciclo-${CICLO}-${VARIANTE}`);
  fs.mkdirSync(pacote, { recursive: true });

  const fontePO = path.join(dirCiclos, `ciclo-${CICLO}-${VARIANTE}-po.md`);
  const cabecalho = ['---', 'projeto: Formação em Balé Clássico', 'frente: PO', `ciclo: "${CICLO}"`];
  if (envelope !== null) cabecalho.push('envelope: ' + envelope);
  cabecalho.push('title: "Plano de Observação"', 'state: Input_PO_Aguardando', '---', '',
    '## Horizonte', '', 'Ao fim do ano, o Nível 2 sustenta o en dehors.', '');
  fs.writeFileSync(fontePO, cabecalho.join('\n'));

  const dados = { ciclo: CICLO, escola: 'batata', apelidos: {}, aulas: {} };
  if (poDoDados !== null) dados.po = poDoDados;
  fs.writeFileSync(path.join(dirCiclos, `ciclo-${CICLO}-${VARIANTE}-dados.json`),
    JSON.stringify(dados, null, 2) + '\n');

  let saida = '';
  try {
    saida = execFileSync('node', [CHECK, pacote], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    saida = String((e.stdout || '') + (e.stderr || ''));
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return saida.split('\n').filter((l) => /PO|Planos de Observação|envelope/.test(l)).join('\n')
    || saida.split('\n').filter((l) => /PO/.test(l)).join('\n');
}

// ── 1. os dois carimbos iguais: a checagem passa ───────────────────────────
{
  const saida = correr({ envelope: 'po-20261022-1108', poDoDados: 'po-20261022-1108' });
  conferir('carimbos iguais → a checagem passa, e diz qual é o carimbo',
    /a fonte e o JSON de dados vêm do mesmo envelope \(po-20261022-1108\)/.test(saida), saida);
}

// ── 2. carimbos diferentes: ERRO que nomeia os dois ────────────────────────
{
  const saida = correr({ envelope: 'po-20261022-1108', poDoDados: 'po-20261022-1039' });
  conferir('carimbos diferentes → ERRO', /ERRO\s+o pacote mistura dois Planos de Observação/.test(saida), saida);
  conferir('…e a mensagem nomeia os dois carimbos',
    /po-20261022-1108/.test(saida) && /po-20261022-1039/.test(saida), saida);
}

// ── 3. NENHUMA das duas declara: é anterioridade, não erro ─────────────────
{
  const saida = correr({ envelope: null, poDoDados: null });
  conferir('sem carimbo nos dois → AVISO, não erro (o ciclo é anterior à declaração)',
    /aviso\s+ciclo-01-.*-po\.md: sem `envelope:`/.test(saida) && !/ERRO/.test(saida), saida);
}

// ── 4. MEIA declaração: a fonte diz e o dados não ─────────────────────────
{
  const saida = correr({ envelope: 'po-20261022-1108', poDoDados: null });
  conferir('meia declaração (fonte sim, dados não) → ERRO',
    /ERRO\s+ciclo-01-.*-dados\.json: não declara o PO de que nasceu/.test(saida), saida);
}

// ── 5. e o contrário: o dados diz e a fonte não ───────────────────────────
{
  const saida = correr({ envelope: null, poDoDados: 'po-20261022-1108' });
  conferir('meia declaração (dados sim, fonte não) → ERRO',
    /ERRO\s+ciclo-01-.*-po\.md: a fonte não declara de que envelope nasceu/.test(saida), saida);
}

if (falhas) {
  console.log('\n' + falhas + ' falha(s) em ' + n + ' asserção(ões).');
  process.exit(1);
}
console.log('\nTUDO CERTO — ' + n + ' asserções, 0 falha(s).');
