#!/usr/bin/env node
'use strict';

/*
 * auditar-proveniencia.js — A PROVENIÊNCIA EXISTE, E ESTÁ BEM REGISTADA? (07/11/2026)
 *
 *   uso: node tools/auditar-proveniencia.js <escola> [--json] [--sem-fundo]
 *
 * POR QUE ELE EXISTE. O expurgo é irreversível e leva consigo as âncoras: se alguma coisa
 * estiver por ancorar no minuto em que ele corre, o que se perde não é «um arquivo» — é a prova
 * de que aquilo existiu. Este auditor responde à pergunta ANTES, e o expurgo passou a chamá-lo
 * (`escola/expurgar.js` e a metade do repositório em `motor/servidor/repo-escola.js`): falhando
 * aqui, não se apaga nada.
 *
 * ELE É TAMBÉM A FERRAMENTA DE AUDITORIA DO DIA-A-DIA. A mesma pergunta — «nada pendente na
 * criação de índices, nada meio-anchorado?» — é a que se faz quando se desconfia que o derivado
 * ficou para trás. As três fases dizem coisas diferentes e reprovam por motivos diferentes:
 *
 *   1. ESTRUTURA — `motor/nucleo/proveniencia.js`: elo, criação declarada, âncora por variante,
 *      cobertura completa e nada citado que não exista. Puro: a mesma função que o Worker usa.
 *   2. ÂNCORA — `tools/hash-ciclo.sh --check`, por variante: recalcula o hash sobre as FONTES
 *      VIVAS. É o que a estrutura não pode fazer (a fórmula tem um dono só).
 *   3. DERIVAÇÃO — `tools/gerar-indices.js --check` e `tools/gerar-relacoes.js --check`: o
 *      índice e o mapa de relações que estão no disco são os que as fontes produzem.
 *
 * A fase 2 e a 3 podem ser saltadas com `--sem-fundo`: são subprocessos, e há chamadores (o
 * Worker) que não os têm. Quem salta sabe o que fica por conferir, e o relatório diz isso.
 *
 * ARQUIVOS QUE NÃO EXISTEM NÃO SÃO ERRO AQUI. Uma escola já expurgada (só o elo) passa: não há
 * fontes, logo não há nada a ancorar — e é o elo que guarda a memória. Reprovar nesse caso
 * tornaria o expurgo impossível de repetir depois de um meio-expurgo, que é o estado em que
 * mais se precisa dele.
 *
 * Sai com 0 quando passa; com 1 quando há bloqueio (a lista sai em `stderr`, e em `stdout` com
 * `--json`); com 2 quando o uso está errado.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { lerAncora } = require('../motor/servidor/indice-acervo.js');
const prov = require('../motor/nucleo/proveniencia.js');

const RAIZ = path.resolve(__dirname, '..');

// O que não é acervo — a MESMA lista do `gerar-indices.js`. Duas listas divergiriam, e a
// diferença seria «a âncora cobre um arquivo que a árvore não tem» no dia em que alguém
// acrescentasse um diretório de trabalho a uma delas.
const IGNORADOS = new Set(['.git', 'node_modules', '.wrangler', '.vscode', 'out', 'experimentos']);

function caminhosDoDisco() {
  const acc = [];
  (function rec(dirRel) {
    let entradas;
    try { entradas = fs.readdirSync(path.join(RAIZ, dirRel || '.'), { withFileTypes: true }); } catch { return; }
    for (const e of entradas.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
      if (IGNORADOS.has(e.name)) continue;
      const rel = dirRel ? dirRel + '/' + e.name : e.name;
      if (e.isDirectory()) rec(rel);
      else acc.push(rel);
    }
  })('');
  return acc.sort();
}

function lerTexto(rel) {
  try { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); } catch { return null; }
}

/** As âncoras da árvore, já lidas pelo MESMO parser do índice. */
function ancorasDoDisco(caminhos) {
  const ancoras = {};
  for (const c of caminhos) {
    if (!/\.fipp$/.test(c)) continue;
    const texto = lerTexto(c);
    if (texto === null) continue;
    ancoras[c] = lerAncora(texto);
  }
  return ancoras;
}

/** Corre um comando e devolve `{ok, saida}` — sem `throw`: a falha é o resultado. */
function correr(cmd, args) {
  try {
    const saida = execFileSync(cmd, args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, saida: String(saida || '').trim() };
  } catch (err) {
    const junto = [err && err.stdout, err && err.stderr].filter(Boolean).join('\n').trim();
    return { ok: false, saida: junto || ((err && err.message) || String(err)) };
  }
}

/**
 * A FASE 2 — a âncora contra as fontes vivas, variante a variante.
 *
 * O `hash-ciclo.sh` precisa do professor como DIRETÓRIO e da variante como sufixo. Os dois saem
 * das fontes que a fase 1 já classificou: nada aqui adivinha caminhos.
 */
function conferirAncoras({ fontes }, problemas) {
  const vistas = new Map();
  for (const f of fontes) {
    // A VARIANTE É O `.conf` — o resto são os documentos dela. Sem este filtro, um
    // `ciclo-01-x-po.md` viraria uma «variante `x-po`» e o `hash-ciclo.sh` procurava um
    // manifesto `ciclo-01-x-po.conf`, que não existe por desenho.
    if (f.ext !== 'conf') continue;
    const chave = f.professor + '/' + f.numero + '/' + f.resto;
    if (vistas.has(chave)) continue;
    vistas.set(chave, f);
  }
  for (const f of vistas.values()) {
    const r = correr('tools/hash-ciclo.sh', [f.professor, f.numero, f.resto, '--check']);
    if (r.ok) continue;
    problemas.push({
      codigo: 'ancora-nao-confere',
      mensagem: 'a âncora de `' + f.caminho.replace(/\.conf$/, '') + '` não confere com as fontes: '
        + (r.saida.split('\n').filter(Boolean).slice(0, 4).join(' · ') || 'sem saída'),
    });
  }
  return vistas.size;
}

/** A FASE 3 — o derivado que está no disco é o que as fontes produzem? */
function conferirDerivacao(problemas) {
  for (const ferramenta of ['tools/gerar-indices.js', 'tools/gerar-relacoes.js']) {
    const r = correr(process.execPath, [ferramenta, '--check']);
    if (r.ok) continue;
    problemas.push({
      codigo: 'derivacao-pendente',
      mensagem: ferramenta + ': ' + (r.saida.split('\n').filter(Boolean).slice(0, 6).join(' · ') || 'reprovou'),
    });
  }
}

async function auditarEscola(slug, { semFundo } = {}) {
  const caminhos = caminhosDoDisco();
  const ancoras = ancorasDoDisco(caminhos);
  let indice = null;
  try { indice = JSON.parse(lerTexto('escola/' + slug + '/indice.json') || 'null'); } catch { indice = null; }

  const relatorio = await prov.auditar({ slug, caminhos, indice, ancoras });
  relatorio.fases = { estrutura: 'feita', ancora: semFundo ? 'saltada' : 'feita', derivacao: semFundo ? 'saltada' : 'feita' };

  if (!semFundo) {
    const problemas = [];
    const variantes = conferirAncoras(prov.artefatosDaEscola(slug, caminhos), problemas);
    conferirDerivacao(problemas);
    relatorio.problemas = relatorio.problemas.concat(problemas);
    relatorio.ok = relatorio.problemas.length === 0;
    relatorio.resumo.variantesConferidas = variantes;
  }
  return relatorio;
}

function imprimir(r) {
  const linha = (s) => process.stdout.write(s + '\n');
  linha('proveniência da escola «' + r.escola + '»');
  linha('  âncoras: ' + r.resumo.ancoras + ' · fontes: ' + r.resumo.fontes
    + ' · variantes: ' + r.resumo.variantes);
  for (const a of r.ancoras) {
    linha('  · ' + a.caminho + '  [' + a.tipo + (a.aula ? ' ' + a.aula : '') + '] '
      + String(a.hash || '—').slice(0, 16) + '…');
  }
  if (r.impressao) linha('  impressão: ' + r.impressao);
  if (r.fases) linha('  fases: estrutura ' + r.fases.estrutura + ' · âncora ' + r.fases.ancora
    + ' · derivação ' + r.fases.derivacao);
  if (r.ok) {
    linha('  OK — a proveniência existe, está registada e confere.');
    return;
  }
  linha('  REPROVADO — ' + r.problemas.length + ' bloqueio(s):');
  for (const p of r.problemas) linha('    [' + p.codigo + '] ' + p.mensagem);
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('--'));
  const json = args.includes('--json');
  const semFundo = args.includes('--sem-fundo');
  if (!slug) {
    process.stderr.write('uso: node tools/auditar-proveniencia.js <escola> [--json] [--sem-fundo]\n');
    process.exit(2);
  }
  const relatorio = await auditarEscola(slug, { semFundo });
  if (json) {
    process.stdout.write(JSON.stringify(relatorio, null, 2) + '\n');
  } else {
    imprimir(relatorio);
  }
  process.exit(relatorio.ok ? 0 : 1);
}

module.exports = { auditarEscola, caminhosDoDisco, ancorasDoDisco };

if (require.main === module) main();
