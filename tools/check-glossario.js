#!/usr/bin/env node
'use strict';

/*
 * check-glossario.js — valida a consistência entre o registro em Benesh do ciclo
 * e o glossário que o explica (Regra 16, aplicada à documentação de apoio).
 *
 *   uso: node tools/check-glossario.js [registro.md] [glossario.md]
 *        (padrão: professores/tiago/ciclos/ciclo-01-maria-notacao.md e
 *         professores/tiago/ciclos/ciclo-01-maria-glossario-benesh.md)
 *
 * O padrão aponta para o ciclo do teste ativo (Maria, professor tiago). Os dois
 * chamadores (check-pacote.js e hooks/pre-commit) sempre passam os caminhos
 * explícitos, então o padrão só governa o uso manual sem argumentos.
 *
 * Por que existe: o registro da Aula 01 usou no corpo símbolos e categorias que
 * não estavam no glossário (e o glossário declarava símbolos que o corpo não
 * usava). O defeito mais grave era o `+` — legenda dizendo "frente" sobre uma
 * linha cuja descrição dizia "tendu ao lado". Nenhum validador olhava para isso.
 *
 * O que confere, sem dependências externas:
 *   1) ERRO   — símbolo usado no corpo mas ausente no glossário (bloqueia);
 *   2) AVISO  — símbolo no glossário mas não usado no corpo (não bloqueia: o
 *               escopo do ciclo tem sinais que existem na legenda sem aparecer
 *               em todas as aulas — ex.: `×` atrás, `↺` giro);
 *   3) ERRO   — símbolo no índice do glossário sem verbete (link quebrado);
 *   4) AVISO  — verbete sem âncora (não pode ser linkado) ou sem linha no índice;
 *   5) ERRO   — âncora de verbete repetida.
 *
 * Como lê os arquivos:
 *   - corpo: code spans de uma linha que começam com `[` e terminam com `]`
 *     (a coluna "Notação" das tabelas do registro);
 *   - glossário: os verbetes são títulos `### <símbolo> — <nome> {#ancora}`, e o
 *     índice de símbolos é a tabela sob "## Índice de símbolos".
 *
 * Sai com código 1 se houver erro. É chamado por tools/check-pacote.js (a cada
 * geração) e por tools/hooks/pre-commit (quando o registro ou o glossário entram
 * no stage).
 */

const fs = require('fs');
const path = require('path');

const rel = (p) => path.relative(process.cwd(), p) || p;

/**
 * O PAR PADRÃO, PROCURADO NO DISCO (28/10/2026). Antes aqui estava escrito, à mão, o caminho do
 * ciclo da Maria — e esse ciclo foi expurgado do repositório. O resultado era um validador que
 * falhava SEMPRE, e um validador que falha sempre não valida nada: quem o vê vermelho todos os dias
 * deixa de o ler, e é exactamente no dia em que ele tem razão que ninguém olha.
 *
 * A procura é pelo par que existe: qualquer `*-notacao.md` com o `*-glossario-*.md` ao lado, no
 * mesmo ciclo. Os dois chamadores (`check-pacote.js` e o `pre-commit`) passam sempre os caminhos
 * explícitos — isto governa só o uso manual sem argumentos, e o que ele faz é dizer a verdade.
 */
function parPadrao() {
  const raiz = path.resolve(__dirname, '..');
  const ciclos = [];
  for (const professor of fs.readdirSync(path.join(raiz, 'professores'))) {
    const pasta = path.join(raiz, 'professores', professor, 'ciclos');
    if (!fs.existsSync(pasta)) continue;
    for (const arquivo of fs.readdirSync(pasta)) {
      if (/-notacao\.md$/.test(arquivo)) ciclos.push(path.join(pasta, arquivo));
    }
  }
  const pares = ciclos
    .map((registro) => {
      const prefixo = registro.replace(/-notacao\.md$/, '');
      const candidatos = fs.readdirSync(path.dirname(registro))
        .filter((f) => f.startsWith(path.basename(prefixo) + '-glossario-') && /\.md$/.test(f))
        .sort();
      return candidatos.length ? [registro, path.join(path.dirname(registro), candidatos[0])] : null;
    })
    .filter(Boolean);
  if (!pares.length) return null;
  // O mais recente é o que está a ser trabalhado; empate resolve-se pelo nome, para ser estável.
  pares.sort((a, b) => fs.statSync(b[0]).mtimeMs - fs.statSync(a[0]).mtimeMs || a[0].localeCompare(b[0]));
  return pares[0];
}

const padrao = (process.argv[2] && process.argv[3]) ? null : parPadrao();
if (!process.argv[2] && !padrao) {
  console.error('erro: nenhum par registro × glossário encontrado em professores/*/ciclos/.');
  console.error('  uso: node tools/check-glossario.js <registro.md> <glossario.md>');
  process.exit(1);
}

const registroPath = path.resolve(process.argv[2] || padrao[0]);
const glossarioPath = path.resolve(process.argv[3] || padrao[1]);

for (const p of [registroPath, glossarioPath]) {
  if (!fs.existsSync(p)) {
    console.error(`erro: arquivo não encontrado: ${rel(p)}`);
    process.exit(1);
  }
}

const registro = fs.readFileSync(registroPath, 'utf8');
const glossario = fs.readFileSync(glossarioPath, 'utf8');

// --------------------------------------------------- 1) tokens usados no corpo
// Um bloco de notação é um code span fechado: `[Pé: 1ª → 2ª -]`.
// Os tokens são separados por espaço, e `[`, `]` e `:` são tokens por si mesmos
// (por isso não entram nos trechos delimitados por espaço).
const tokenizar = (bloco) => bloco.match(/\[|\]|:|[^\s[\]:]+/g) || [];

const blocos = [];
registro.split('\n').forEach((linha, i) => {
  // Só linhas de tabela: as notas didáticas citam exemplos entre crases (inclusive
  // formas antigas, como o `+` corrigido) e não são uso no registro.
  if (!/^\s*\|/.test(linha)) return;
  for (const m of linha.matchAll(/`([^`\n]+)`/g)) {
    const texto = m[1].trim();
    if (!texto.startsWith('[') || !texto.endsWith(']')) continue;
    blocos.push({ texto, linha: i + 1, tokens: tokenizar(texto) });
  }
});

const noCorpo = new Map(); // token → primeira linha em que aparece
blocos.forEach((b) => b.tokens.forEach((t) => {
  if (!noCorpo.has(t)) noCorpo.set(t, b.linha);
}));

// --------------------------------------------------- 2) símbolos do glossário
// Verbetes: `### <símbolo> — <nome> {#ancora}`
const semFormatacao = (s) => s.replace(/`/g, '').replace(/\\/g, '').trim();
const verbetes = new Map(); // símbolo → { nome, ancora, linha }
const ancoras = new Map(); // âncora → linha (ou string, se repetida)
glossario.split('\n').forEach((linha, i) => {
  const m = linha.match(/^###\s+(.+?)\s+—\s+(.+?)(?:\s*\{#([^}]+)\})?\s*$/);
  if (!m) return;
  const simbolo = semFormatacao(m[1]);
  const nome = m[2].trim();
  const ancora = m[3] || null;
  if (!verbetes.has(simbolo)) verbetes.set(simbolo, { nome, ancora, linha: i + 1 });
  if (ancora) {
    if (ancoras.has(ancora)) ancoras.set(ancora, `repetida (linhas ${ancoras.get(ancora)} e ${i + 1})`);
    else ancoras.set(ancora, i + 1);
  }
});

// Índice de símbolos: primeira coluna da tabela sob "## Índice de símbolos"
const indice = new Map(); // símbolo → linha
let dentroDoIndice = false;
glossario.split('\n').forEach((linha, i) => {
  if (/^##\s+Índice de símbolos\s*$/.test(linha)) { dentroDoIndice = true; return; }
  if (dentroDoIndice && /^##\s+/.test(linha)) { dentroDoIndice = false; return; }
  if (!dentroDoIndice || !/^\|/.test(linha)) return;
  const celulas = linha.replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/);
  const primeira = (celulas[0] || '').trim();
  if (!primeira || /^[\s:-]+$/.test(primeira)) return; // linha separadora da tabela
  if (/^símbolo$/i.test(semFormatacao(primeira))) return; // cabeçalho da tabela
  const codigo = primeira.match(/`([^`]+)`/);
  const simbolo = semFormatacao(codigo ? codigo[1] : primeira).replace(/\s*\(.*$/, '');
  if (simbolo) indice.set(simbolo, i + 1);
});

// ------------------------------------------------------------- 3) comparação
const erros = [];
const avisos = [];

noCorpo.forEach((linha, token) => {
  if (!verbetes.has(token)) {
    erros.push(`símbolo '${token}' usado no corpo mas ausente no glossário (linha ${linha} de ${rel(registroPath)})`);
  }
});

verbetes.forEach(({ nome, ancora, linha }, simbolo) => {
  if (!noCorpo.has(simbolo)) avisos.push(`símbolo '${simbolo}' no glossário mas não usado no corpo`);
  if (!ancora) avisos.push(`verbeta '${simbolo}' (${nome}) sem âncora — não pode ser linkado (linha ${linha})`);
  if (!indice.has(simbolo)) avisos.push(`verbeta '${simbolo}' sem linha no índice de símbolos`);
});

indice.forEach((linha, simbolo) => {
  if (!verbetes.has(simbolo)) {
    erros.push(`índice aponta '${simbolo}' mas não há verbete com esse símbolo (linha ${linha} do índice)`);
  }
});

ancoras.forEach((linha, ancora) => {
  if (typeof linha === 'string') erros.push(`âncora '#${ancora}' ${linha}`);
});

// --------------------------------------------------------------- 4) relatório
console.log(`Registro:  ${rel(registroPath)}`);
console.log(`Glossário: ${rel(glossarioPath)}`);
console.log(`  blocos de notação: ${blocos.length}`);
avisos.forEach((l) => console.log(`  aviso ${l}`));
erros.forEach((l) => console.log(`  ERRO  ${l}`));

if (erros.length === 0) {
  console.log(`ok: glossário consistente — ${noCorpo.size} símbolos no corpo, `
    + `${verbetes.size} verbetes no glossário (${avisos.length} aviso(s)).`);
  process.exit(0);
}
console.log(`\nFALHOU: ${erros.length} erro(s). Todo símbolo do corpo precisa de verbete no glossário.`);
process.exit(1);

