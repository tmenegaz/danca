#!/usr/bin/env node
'use strict';

/**
 * provar-cabecalho-do-documento.js — todo documento derivado tem UM título, no cabeçalho.
 *
 * Por que existe (22/10/2026). A página de harmonização foi publicada assim:
 *
 *     <header class="doc">
 *       <h1></h1>                                  ← título vazio
 *       <p class="ficha">…</p>
 *     </header>
 *     <main>
 *       <p>title: “Harmonização de linguagem” subtitle: “O varrimento…”</p>   ← YAML cru
 *       <h1>Harmonização de linguagem — Ciclo 01 — Batata</h1>                ← o de verdade
 *
 * A pesquisadora viu o sintoma, não a causa: «o título está mais abaixo se comparado com a
 * página anamnese». A causa era a fonte: o `-harmonizacao.md` escrevia `title:` e
 * `subtitle:` SEM os `---` que abrem o front-matter. Sem eles o pandoc não lê metadado
 * nenhum, e daí saem as três coisas de uma vez — `<h1>` vazio, YAML vazando para o corpo, e
 * o título de verdade empurrado para dentro do texto, abaixo da ficha. Depois, corrigido o
 * bloco, sobrava um segundo `<h1>` no corpo: era o único dos seis derivados a escrever `# `.
 *
 * A LIÇÃO É A FORMA DO DEFEITO, e é a mesma que a cópia única persegue: o mesmo gesto em seis
 * lugares, e um deles diferente. Por isso esta prova NÃO testa o caso da harmonização — testa
 * a regra, sobre todos os derivados e sobre as fontes publicadas do ciclo:
 *
 *   A. todo derivado que produz Markdown:
 *      1. ABRE o front-matter com `---` na primeira linha;
 *      2. FECHA-o com `---`;
 *      3. declara um `title:` com texto (é o `$title$` do template e o rótulo do menu);
 *      4. não escreve `# ` no corpo — o `<h1>` da página vem do `title:`, e um segundo
 *         título de topo é o que põe o de verdade mais abaixo do que nos outros documentos.
 *   B. as fontes publicadas do ciclo no repositório seguem a mesma regra (a correção feita à
 *      mão não se perde numa regeneração futura);
 *   C. o pacote publicado não tem nenhuma página com dois `<h1>` nem com `<h1>` vazio — a
 *      medição do sintoma, no artefacto que o professor abre.
 *
 * CONTROLE NEGATIVO: com o front-matter antigo (as duas linhas sem `---`), a secção A falha
 * nas quatro asserções do documento; com o `# ` de volta, falha a do título único. As duas
 * são reproduzidas no fim, contra uma cópia em memória — se elas passassem também, a prova
 * estaria a medir-se a si mesma.
 *
 *   node experimentos/provar-cabecalho-do-documento.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const derivar = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));

let falhas = 0;
const provar = (nome, cond, extra) => {
  if (!cond) falhas += 1;
  console.log((cond ? 'ok     ' : 'FALHA  ') + nome
    + (extra !== undefined ? ' → ' + JSON.stringify(extra) : ''));
};

// ------------------------------------------------------------------ a regra

/**
 * A regra de um documento, sobre o TEXTO — a mesma para derivados e publicados, para não
 * haver duas versões dela. Devolve os problemas; vazio é «está bem».
 */
function problemasDoDocumento(md) {
  const problemas = [];
  const linhas = String(md).split('\n');
  if (linhas[0] !== '---') {
    problemas.push(`a 1.ª linha é ${JSON.stringify(linhas[0])} e não o \`---\` que abre o front-matter`);
    return problemas;                      // sem bloco não há mais nada a conferir
  }
  const fecha = linhas.indexOf('---', 1);
  if (fecha < 2) { problemas.push('o front-matter não fecha com `---`'); return problemas; }
  const bloco = linhas.slice(1, fecha).join('\n');
  const titulo = /^title:[ \t]*(.*)$/m.exec(bloco);
  if (!titulo) problemas.push('o front-matter não declara `title:`');
  else if (titulo[1].replace(/["']/g, '').trim().length < 4) {
    problemas.push(`o \`title:\` está vazio (${JSON.stringify(titulo[1])})`);
  }
  const h1NoCorpo = linhas.slice(fecha + 1).filter((l) => /^# /.test(l));
  if (h1NoCorpo.length) {
    problemas.push(`o corpo escreve um título de topo (${JSON.stringify(h1NoCorpo[0].slice(0, 40))}) `
      + '— o `<h1>` da página vem do `title:`');
  }
  return problemas;
}

// --------------------------------------------------- A. os derivados

const CONTEXTO = { ciclo: '01', escola: 'e', escolaNome: 'Escola E' };
const PLANO = { contexto: {}, respostas: { 'contexto-notacao': 'Benesh' } };
const PO = {};

/**
 * Os seis derivados, chamados com o mínimo que cada um precisa. Os dois da notação exigem
 * que o plano a declare (`contexto-notacao`); sem ela devolvem `null` por desenho — e um
 * derivado que não existe não tem cabeçalho a conferir, o que se declara em vez de ignorar.
 */
const DERIVADOS = [
  ['aula-01', () => derivar.derivarAula01({ plano: PLANO, po: PO, contexto: CONTEXTO,
    calibracao: { duracaoMinutos: 50 } })],
  ['referencias', () => derivar.derivarReferencias({ plano: PLANO, contexto: CONTEXTO })],
  ['captura-aula-01', () => derivar.derivarCaptura({ po: PO, contexto: CONTEXTO })],
  ['harmonizacao', () => derivar.derivarHarmonizacao({ plano: PLANO, po: PO, contexto: CONTEXTO })],
  ['notacao', () => derivar.derivarNotacao({ plano: PLANO, contexto: CONTEXTO })],
  ['glossario-benesh', () => derivar.derivarGlossario({ plano: PLANO, contexto: CONTEXTO })],
];

const textos = new Map();
for (const [nome, produzir] of DERIVADOS) {
  const md = produzir();
  if (md === null || md === undefined) {
    provar(`${nome}: o derivado devolve null com este envelope — NÃO CONFERIDO`, false,
      { nome, motivo: 'o envelope mínimo não o produz' });
    continue;
  }
  textos.set(nome, String(md));
  const problemas = problemasDoDocumento(md);
  provar(`${nome}: front-matter fechado, \`title:\` com texto, e um só título`, problemas.length === 0,
    problemas.length ? problemas : undefined);
}
provar(`os ${DERIVADOS.length} derivados foram conferidos, nenhum ficou de fora`,
  textos.size === DERIVADOS.length, { conferidos: textos.size });

// ------------------------------------------- B. as fontes publicadas do ciclo
//
// A fonte escrita à mão (ou corrigida à mão) não passa por este módulo: `escrever-ciclo.js`
// só grava o que ainda não existe, porque proveniência acrescenta e não edita. Se a correção
// do `-harmonizacao.md` viver só no ficheiro, a regra não a protege — esta secção protege.
/* O CICLO É DESCOBERTO, não nomeado (21/10/2026) — ver `lib-pacote.js`. Antes daqui lia-se
 * `professores/sapo-bailarino/ciclos`, com o nome de uma escola escrita à mão: expurgada a
 * escola, esta secção deixava de conferir fonte nenhuma e a prova passava a medir só os
 * derivados em memória — o defeito do front-matter, que é o que ela existe para travar, ficaria
 * sem guarda no dia em que a fonte real desaparecesse. */
const { umPacote, fontesDoPacote } = require('./lib-pacote.js');
const PACOTE_REL = umPacote();
const DIR = path.join(RAIZ, path.dirname(PACOTE_REL));
const doCiclo = fontesDoPacote(PACOTE_REL);

provar('as fontes do ciclo com página foram encontradas', doCiclo.length >= 6,
  { encontradas: doCiclo.length });
for (const f of doCiclo) {
  const md = fs.readFileSync(path.join(DIR, f), 'utf8');
  const problemas = problemasDoDocumento(md);
  provar(`publicada: ${f}`, problemas.length === 0, problemas.length ? problemas : undefined);
}

// ---------------------------------------------- C. o pacote publicado
//
// O sintoma visível. Lido do artefacto, e não da fonte: é o que o professor abre.
const PACOTE = path.join(RAIZ, PACOTE_REL);
if (!fs.existsSync(PACOTE)) {
  provar('o pacote publicado existe para ser conferido', false, { caminho: PACOTE });
} else {
  const paginas = fs.readdirSync(PACOTE).filter((f) => f.endsWith('.html'));
  const semMarcacao = (html) => html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const h1sDe = (html) => [...semMarcacao(html).matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
  const duasPaginas = [];
  const vazias = [];
  for (const f of paginas) {
    const h1s = h1sDe(fs.readFileSync(path.join(PACOTE, f), 'utf8'));
    if (h1s.filter((t) => t).length > 1) duasPaginas.push(f + ': ' + h1s.join(' | '));
    if (!h1s.length || !h1s[0]) vazias.push(f);
  }
  provar(`nenhuma das ${paginas.length} páginas tem dois títulos de topo`,
    duasPaginas.length === 0, duasPaginas.length ? duasPaginas : undefined);
  provar('…e nenhuma página saiu com o título vazio', vazias.length === 0,
    vazias.length ? vazias : undefined);
}

// -------------------------------------------------- o controle negativo
//
// A regra tem de REPROVAR o documento que estava no ar. Se aprovasse, ela não mediria nada.
const ANTIGO = [
  'title: "Harmonização de linguagem"',
  'subtitle: "O varrimento de juízo de valor (P-21) — a proposta, não o filtro"',
  '',
  '# Harmonização de linguagem — Ciclo 01 — Batata',
  '',
  '> Esta tabela é **visível ao professor**.',
].join('\n');
const semBloco = problemasDoDocumento(ANTIGO);
provar('CONTROLE NEGATIVO: a fonte antiga (sem `---`) é REPROVADA',
  semBloco.some((p) => /front-matter/.test(p)), semBloco);

const comBloco = '---\ntitle: "Harmonização de linguagem"\n---\n\n# Harmonização — Ciclo 01\n';
const comH1 = problemasDoDocumento(comBloco);
provar('CONTROLE NEGATIVO: o bloco certo com um `# ` no corpo também é REPROVADO',
  comH1.some((p) => /título de topo/.test(p)), comH1);

const correto = '---\ntitle: "Harmonização de linguagem"\n---\n\n> Texto do documento.\n';
provar('e a forma corrigida PASSA — a regra não é um «não» a tudo',
  problemasDoDocumento(correto).length === 0, problemasDoDocumento(correto));

console.log(`\n${falhas === 0 ? 'TUDO CERTO' : falhas + ' falha(s)'} — provar-cabecalho-do-documento`);
process.exit(falhas === 0 ? 0 : 1);
