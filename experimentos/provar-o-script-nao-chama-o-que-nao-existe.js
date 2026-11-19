#!/usr/bin/env node
'use strict';

/**
 * provar-o-script-nao-chama-o-que-nao-existe.js — NENHUMA CHAMADA A UM NOME QUE NINGUÉM DECLAROU
 * (19/11/2026).
 *
 * O DEFEITO QUE A CRIOU, e ele é da pior espécie:
 *
 *   «Tentei gravar o plié de uma derivação e deu esse erro no formulário: Erro: limparOVerbete is
 *    not defined — e apareceu a mensagem na tela informando que foi gravado.»
 *
 * As duas frases dela são verdadeiras ao mesmo tempo, e é isso que torna o caso exemplar. A
 * gravação ACONTECEU — o `avisar("ok", …)` é a linha anterior —, e o erro veio DEPOIS, de uma
 * chamada a uma função que nunca foi escrita: eu tinha posto a chamada no caminho de gravar e
 * perdido o corpo numa cirurgia ao ficheiro. O `catch` da mesma promessa apanhou a excepção e
 * escreveu-a no `.res` do formulário — «Erro: … is not defined» por cima de um trabalho feito.
 *
 * PORQUE NENHUMA PROVA O APANHOU. As bancadas mediam a marcação e as rotas; e as que correm o
 * script (jsdom) exercitavam os caminhos do Dicionário, não o do Estilo. Um nome que não existe só
 * falha no instante em que é chamado — e é por isso que ele atravessou tudo.
 *
 * O QUE ESTA PROVA FAZ. Lê o JavaScript que a página EMITE (não o fonte: o fonte está partido em
 * concatenações, e o que o navegador recebe é o resultado), separa código de texto e de comentário,
 * e responde a uma pergunta só: **há aqui alguma chamada a um nome que ninguém declarou?**
 *
 * O QUE ELA NÃO É. Não é um analisador semântico. O que ela separa é o CÓDIGO do resto, com a
 * heurística de regex da linguagem — e essa heurística tem de conhecer o `return`, senão o
 * `return /^\d+\|/` abre uma "divisão" e a barra seguinte abre uma "regex" que come meio ficheiro.
 * Foi assim que a primeira versão desta prova deu 28 resultados falsos, e é a razão de o
 * separador estar escrito abaixo com o cuidado que está.
 *
 * Contra o `HEAD` de ontem, ela reprova exactamente os três: `limparOVerbete` e `recadoDoDicionario`
 * (duas vezes). Hoje: zero.
 *
 *   node experimentos/provar-o-script-nao-chama-o-que-nao-existe.js
 *   node experimentos/provar-o-script-nao-chama-o-que-nao-existe.js --controle-negativo
 */

const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/**
 * Separa o CÓDIGO do texto e dos comentários. Sem isto, uma palavra dentro de uma string
 * («Turma»), ou uma frase de um comentário, entrava como chamada.
 *
 * A HEURÍSTICA DE REGEX É O PONTO DELICADO. Um `/` abre uma expressão regular quando o token
 * anterior não pode terminar uma expressão — depois de `(`, `,`, `=`, `return`… — e é divisão
 * quando pode. As duas metades têm de estar certas: esquecer o `return` faz o `/^\d+\|/` ser lido
 * como divisão, e a barra seguinte abre uma "regex" que engole centenas de caracteres de código.
 * O `\` dentro da regex e dentro da string saltam dois caracteres, pelo mesmo motivo.
 */
function soCodigo(texto) {
  const saida = [];
  let i = 0;
  let estado = 'codigo';
  let anterior = '';
  let palavra = '';
  const PALAVRAS = new Set(['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void',
    'instanceof', 'do', 'else', 'yield', 'await']);
  const abreRegex = (ch) => ch === '' || '(,=:[!&|?{};+-*%<>~^'.indexOf(ch) !== -1;
  while (i < texto.length) {
    const c = texto[i];
    const d = texto[i + 1];
    if (estado === 'codigo') {
      if (c === '/' && d === '*') { estado = 'bloco'; i += 2; continue; }
      if (c === '/' && d === '/') { estado = 'linha'; i += 2; continue; }
      if (c === '/' && (abreRegex(anterior) || PALAVRAS.has(palavra))) {
        estado = 'regex'; saida.push(' '); i += 1; continue;
      }
      if (c === '"' || c === "'" || c === '`') { estado = c; saida.push(' '); i += 1; continue; }
      if (/[\w$]/.test(c)) palavra = /[\w$]/.test(anterior) ? palavra + c : c;
      else if (!/\s/.test(c)) palavra = '';
      if (!/\s/.test(c)) anterior = c;
      saida.push(c); i += 1; continue;
    }
    if (estado === 'bloco') {
      if (c === '*' && d === '/') { estado = 'codigo'; i += 2; continue; }
      i += 1; continue;
    }
    if (estado === 'linha') {
      if (c === '\n') { estado = 'codigo'; saida.push('\n'); }
      i += 1; continue;
    }
    if (estado === 'regex') {
      if (c === '\\') { i += 2; continue; }
      if (c === '/') { estado = 'codigo'; anterior = '/'; palavra = ''; }
      i += 1; continue;
    }
    // dentro de texto
    if (c === '\\') { i += 2; continue; }
    if (c === estado) { estado = 'codigo'; anterior = '"'; palavra = ''; saida.push(' '); }
    i += 1;
  }
  return saida.join('');
}

/** As funções e variáveis que pertencem à linguagem e ao navegador — não são órfãs. */
const NATIVAS = new Set(['if','for','while','switch','catch','return','typeof','function','new','delete',
  'do','else','try','with','yield','await','async','void','in','of','instanceof','fetch','setTimeout',
  'clearTimeout','setInterval','clearInterval','requestAnimationFrame','queueMicrotask','structuredClone',
  'Number','String','Boolean','Array','Object','JSON','Math','Date','Promise','Map','Set','WeakMap','WeakSet',
  'RegExp','Error','TypeError','RangeError','parseInt','parseFloat','isNaN','isFinite','encodeURIComponent',
  'decodeURIComponent','alert','confirm','prompt','console','Event','CustomEvent','FormData','URL',
  'URLSearchParams','Blob','File','FileReader','Symbol','Proxy','Reflect','MutationObserver','Intl',
  'escape','unescape','localStorage','sessionStorage','navigator','history','location','getComputedStyle']);

/** Tudo o que o script declara: funções, variáveis, constantes, parâmetros e setas. */
function declaradas(codigo) {
  const nomes = new Set();
  for (const m of codigo.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) nomes.add(m[1]);
  for (const m of codigo.matchAll(/(?:var|let|const)\s+([A-Za-z_$][\w$]*)/g)) nomes.add(m[1]);
  for (const m of codigo.matchAll(/function\s*[A-Za-z_$\w]*\s*\(([^)]*)\)/g)) {
    for (const p of m[1].split(',')) {
      const n = p.trim().replace(/=.*$/, '').replace(/^\.\.\./, '').trim();
      if (/^[A-Za-z_$][\w$]*$/.test(n)) nomes.add(n);
    }
  }
  for (const m of codigo.matchAll(/\(([^()]*)\)\s*=>/g)) {
    for (const p of m[1].split(',')) {
      const n = p.trim().replace(/=.*$/, '').trim();
      if (/^[A-Za-z_$][\w$]*$/.test(n)) nomes.add(n);
    }
  }
  for (const m of codigo.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) nomes.add(m[1]);
  return nomes;
}

/** Os nomes chamados que ninguém declarou, com quantas vezes cada um. */
function orfasDoScript(script) {
  const codigo = soCodigo(script);
  const nomes = declaradas(codigo);
  const achadas = new Map();
  for (const m of codigo.matchAll(/(^|[^\w$.'"`])([A-Za-z_$][\w$]*)\s*\(/g)) {
    const nome = m[2];
    if (nomes.has(nome) || NATIVAS.has(nome)) continue;
    achadas.set(nome, (achadas.get(nome) || 0) + 1);
  }
  return [...achadas.entries()].sort();
}

/** O maior `<script>` inline de uma página — é onde vive o cliente. */
function scriptDaPagina(html) {
  return [...String(html).matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .sort((a, b) => b.length - a.length)[0] || '';
}

function aProducao() {
  const b = require(path.join(RAIZ, 'motor', 'servidor', 'bastidores.js'));
  return b.paginaProducao('breu', { escola: 'breu' },
    [{ nome: 'Bri Volet', slug: 'bri', modalidades: ['Ballet Clássico'] }],
    ['abreu'], 'Brise Volet', 'brise-volet', [], [], {}, [], [], [],
    { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
    { modo: 'clara', paleta: 'bordo' }, null, [], new Set(),
    { ok: true, contrato: { plano: 'avancado', capacidade: {} } });
}

function osOutros() {
  /* SÓ AS PÁGINAS QUE O MÓDULO EXPORTA, e a lista é curta de propósito: `paginaEstudio` não é
   * exportada, e forçá-la por uma reexportação só para a prova a poder chamar seria abrir uma
   * porta de produção para servir uma bancada. O `paginaFinanceiro` é, e entra — ele desenha uma
   * página com script próprio, e é a segunda superfície onde um nome órfão se esconderia. */
  const b = require(path.join(RAIZ, 'motor', 'servidor', 'bastidores.js'));
  const aparencia = { modo: 'clara', paleta: 'bordo' };
  const contexto = { escola: 'breu', nome: 'Breu' };
  const paginas = {};
  if (typeof b.paginaFinanceiro === 'function') {
    paginas['financeiro'] = b.paginaFinanceiro('breu', contexto, aparencia,
      { escolas: [], extrato: [], mensalidades: [] });
  }
  return paginas;
}

/* ============================================================================================= */
console.log('\nA. As páginas dos Bastidores: nenhuma chama o que não declarou');

const paginas = { 'produção': aProducao(), ...osOutros() };
for (const [nome, html] of Object.entries(paginas)) {
  const script = scriptDaPagina(html);
  const orfas = orfasDoScript(script);
  provar('«' + nome + '»: ' + (script.length ? 'script lido' : 'SEM SCRIPT') + ' — zero chamadas órfãs',
    script.length > 0 && orfas.length === 0, orfas);
}

/* ============================================================================================= */
console.log('\nB. O defeito que isto vigia, e a forma dele');

{
  /* UM CASO CONHECIDO, escrito à mão: a prova tem de saber REPROVAR. Sem esta secção, um
   * separador que devolvesse o texto todo passaria sempre — e o que ela mede é a ausência de
   * chamadas a nomes que não existem, não a presença de código. */
  const exemplo = 'function a(){ return 1; } function b(){ a(); naoExiste(); }';
  const orfas = orfasDoScript(exemplo);
  provar('um nome chamado e não declarado é apanhado', orfas.length === 1 && orfas[0][0] === 'naoExiste', orfas);
  provar('…e um nome declarado não é',
    orfasDoScript('var c = function(){}; c();').length === 0, orfasDoScript('var c = function(){}; c();'));
  /* A REGEX COM `|` E A PALAVRA `return` — o caso que fez a primeira versão desta prova acusar 28
   * nomes que existem. `return /^\d+\|/.test(k)` tem de ser lido como regex, e não como divisão. */
  provar('a regex depois de `return` é código, e não divisão',
    orfasDoScript('function f(k){ return /^\\d+\\|/.test(k); } function g(){ f(); }').length === 0,
    orfasDoScript('function f(k){ return /^\\d+\\|/.test(k); } function g(){ f(); }'));
  provar('…e uma aspa dentro de uma regex não abre uma string',
    orfasDoScript("function f(s){ return s.replace(/'/g, ''); } function g(){ f('x'); }").length === 0, null);
}

/* ============================================================================================= */
if (process.argv.includes('--controle-negativo')) {
  console.log('\nC. CONTROLE NEGATIVO — a chamada sem definição, reposta à mão');
  /* A FORMA DO DEFEITO DE ONTEM, injetada no script REAL: uma chamada a um nome que ninguém
   * declara, no meio de uma função que corre. A prova tem de a nomear — é o que mostra que ela
   * olha para o sítio certo, e não só que devolve zero.
   *
   * O nome é sintético de propósito: `limparOVerbete` hoje EXISTE (é a correcção), e reinseri-lo
   * não provaria nada. Quando a mesma prova correu contra o `HEAD` de 19/11/2026 — antes desta
   * correcção —, os nomes que ela devolveu foram exactamente os três que a gravação do Plié
   * apanhou: `limparOVerbete` (uma vez) e `recadoDoDicionario` (duas). */
  const script = scriptDaPagina(paginas['produção']);
  const comAChamada = script.replace('carregarVerbetes();',
    'carregarVerbetes(); funcaoQueNinguemEscreveu();');
  const orfas = orfasDoScript(comAChamada);
  provar('reposta a chamada sem a definição, a prova REPROVA e nomeia-a',
    orfas.some(([n]) => n === 'funcaoQueNinguemEscreveu'), orfas);
  provar('…e não inventa mais nada além dela', orfas.length === 1, orfas);
}

console.log('\n' + (falhas
  ? 'FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).'
  : 'TUDO CERTO — ' + total + ' asserções: o JavaScript que as páginas dos Bastidores emitem '
    + 'não chama nenhum nome que não declare. O separador de código sabe que a regex depois de '
    + '`return` é código, e uma aspa dentro de uma regex não abre uma string.'));
process.exit(falhas ? 1 : 0);
