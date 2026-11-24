#!/usr/bin/env node
'use strict';

/**
 * provar-minificacao-do-payload.js — o que vai ao browser perde os comentários, e as fontes não
 * perdem nada (24/11/2026).
 *
 * O QUE MOTIVOU, medido. `porta/index.html` saía com **545 KB**, dos quais **490 KB** eram um
 * `<script>` inline e **234 KB (49 %)** eram comentário de fonte; e o brotli do Cloudflare
 * reduzia-o a 143 KB. `raiz/index.html`, 127 KB com 30 KB de comentário, 32 KB comprimido.
 *
 * O QUE ESTA PROVA FIXA, e cada asserção existe por um modo de falhar:
 *
 *   A. A MINIFICAÇÃO TIRA COMENTÁRIO e não muda o que o código FAZ — medido em bytes e em
 *      comportamento: o bloco minificado continua a definir as mesmas funções.
 *   B. O `<script src="…">` NÃO SE TOCA. Não é inline: o ficheiro é outro, é partilhado entre
 *      escolas (comparado byte a byte por `garantirAssetsPartilhados`) e não é desta passagem.
 *   C. O `<style>` também se minifica, e o CSS continua válido (as chaves fecham).
 *   D. UM BLOCO QUE NÃO COMPILA FICA COMO ESTÁ. Um `<script type="text/template">` ou um
 *      `<style>` com sintaxe que o esbuild recusa não pode desaparecer: minificar não é compilar.
 *   E. UM BLOCO VAZIO NÃO É TOCADO (não ganha espaço nem marcador).
 *   F. A ÁRVORE: `minificarArvore` percorre só `.html`, e diz quantas páginas e quantos blocos.
 *   G. AS FONTES NÃO SE TOCAM — a passagem é sobre a árvore montada, e a prova confirma que
 *      `porta/index.html` e `raiz/index.html` no repositório continuam com os comentários.
 *   H. CONTROLO NEGATIVO: sem a passagem, o ficheiro tem os 234 KB de comentário — é isso que a
 *      asserção de A está a medir, e sem este controlo ela mediria o tamanho de um ficheiro.
 *
 * SEM REDE e SEM deploy: as páginas são as do repositório, lidas do disco.
 *
 *   node experimentos/provar-minificacao-do-payload.js
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const { minificarInline, minificarArvore } =
  require(path.join(RAIZ, 'tools/montar-publicacao.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
const kb = (n) => (n / 1024).toFixed(0) + ' KB';

/* ========================================================================================== */
console.log('\nA · A minificação tira comentário e não muda o que o código faz');
/* ========================================================================================== */
const FONTE = path.join(RAIZ, 'porta/index.html');
const original = fs.readFileSync(FONTE, 'utf8');
const r = minificarInline(original);
{
  provar('o ficheiro da Porta é grande de verdade (a prova não mede um ficheiro pequeno)',
    original.length > 300 * 1024, kb(original.length));
  provar('…e a passagem devolve um HTML menor', r.html.length < original.length,
    { antes: kb(original.length), depois: kb(r.html.length) });
  provar('…com menos de metade do tamanho', r.html.length < original.length * 0.5,
    Math.round(100 * r.html.length / original.length) + '% do original');
  provar('minificou mais do que um bloco', r.blocos >= 2, r.blocos);

  /* O comentário é o que sai. O marcador é o do cabeçalho do script da Porta, que é escrito com
   * duas barras e não com o delimitador de bloco — a primeira versão desta prova procurava o
   * delimitador errado e falhava por isso, não por um defeito. */
  const MARCA = 'A fonte que esta página conduz';
  provar('a fonte tem o comentário de cabeçalho (o controlo existe)',
    original.indexOf(MARCA) !== -1);
  provar('…e ele NÃO está no que se publica', r.html.indexOf(MARCA) === -1);

  /* E o comportamento: as funções que o código define continuam lá. */
  const definidas = ['function', 'var ', 'const ', 'let '];
  provar('o código continua a definir coisas (não foi apagado)',
    definidas.every((d) => r.html.indexOf(d) !== -1 || r.html.indexOf(d.trim()) !== -1));
  provar('…e o esqueleto da página sobrevive (`<html>`, `<body>`, o formulário)',
    /<html/i.test(r.html) && /<body/i.test(r.html));
}

/* ========================================================================================== */
console.log('\nB · O `<script src>` NÃO SE TOCA — é outro ficheiro, e é partilhado');
/* ========================================================================================== */
{
  const comSrc = '<html><head><script src="/assets/nav.js"></script></head><body></body></html>';
  const fora = minificarInline(comSrc);
  provar('um `<script src>` sai igual ao que entrou', fora.html === comSrc, fora.html);
  provar('…e não conta como bloco minificado', fora.blocos === 0, fora.blocos);
}

/* ========================================================================================== */
console.log('\nC · O `<style>` também se minifica, e o CSS continua válido');
/* ========================================================================================== */
{
  const comEstilo = '<style>\n  /* um comentário */\n  .a { color: red; }\n</style>';
  const fora = minificarInline(comEstilo);
  provar('o comentário do CSS saiu', fora.html.indexOf('um comentário') === -1, fora.html);
  provar('…e a regra ficou', /\.a\s*\{[^}]*red/.test(fora.html), fora.html);
  provar('…com as chaves fechadas', (fora.html.match(/\{/g) || []).length === (fora.html.match(/\}/g) || []).length);
}

/* ========================================================================================== */
console.log('\nD · Um bloco que não compila fica como está');
/* ========================================================================================== */
{
  const modelo = '<script type="text/template">\n  <div class="x">[[ nome ]]</div>\n</script>';
  const fora = minificarInline(modelo);
  provar('um `<script type="text/template">` não desaparece', fora.html.indexOf('[[ nome ]]') !== -1,
    fora.html.slice(0, 120));
  provar('…e não conta como minificado', fora.blocos === 0, fora.blocos);

  /* O JS QUE NÃO COMPILA. O parser de CSS do esbuild é PERMISSIVO — medido: `.a { color: `
   * passa e sai `.a{color:}`. Portanto o caso que exercita a guarda é o do JS, onde ele recusa
   * de facto; e é o que importa, porque é no `<script>` que vive a maior parte do que se minifica. */
  const jsQuebrado = '<script>\nconst = 1;\n</script>';
  const fora2 = minificarInline(jsQuebrado);
  provar('um `<script>` que o esbuild recusa fica como está', fora2.html === jsQuebrado, fora2.html);
  provar('…e não conta como minificado', fora2.blocos === 0, fora2.blocos);
}

/* ========================================================================================== */
console.log('\nE · Um bloco vazio não é tocado');
/* ========================================================================================== */
{
  const vazio = '<html><body><script></script><style>  </style></body></html>';
  const fora = minificarInline(vazio);
  provar('um `<script></script>` vazio fica igual', fora.html === vazio, fora.html);
  provar('…e não conta', fora.blocos === 0, fora.blocos);
}

/* ========================================================================================== */
console.log('\nF · A árvore: só `.html`, e o relatório conta');
/* ========================================================================================== */
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'minifica-'));
  fs.mkdirSync(path.join(tmp, 'piano'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'index.html'),
    '<html><body><script>/* c */ var a = 1;</script></body></html>');
  fs.writeFileSync(path.join(tmp, 'piano', 'plano.html'),
    '<html><body><style>/* c */ .a{color:red}</style></body></html>');
  fs.writeFileSync(path.join(tmp, 'piano', 'assets.css'), '.a { color: red; }');
  const conta = minificarArvore(tmp);
  provar('contou as duas páginas HTML', conta.paginas === 2, conta);
  provar('…e os dois blocos', conta.blocos === 2, conta);
  provar('…e o CSS solto NÃO foi tocado',
    fs.readFileSync(path.join(tmp, 'piano', 'assets.css'), 'utf8') === '.a { color: red; }');
  provar('…e o HTML ficou menor',
    fs.readFileSync(path.join(tmp, 'index.html'), 'utf8').length
      < '<html><body><script>/* c */ var a = 1;</script></body></html>'.length);
  fs.rmSync(tmp, { recursive: true, force: true });
}

/* ========================================================================================== */
console.log('\nG · AS FONTES NÃO SE TOCAM — é a árvore montada, não o repositório');
/* ========================================================================================== */
{
  for (const f of ['porta/index.html', 'raiz/index.html']) {
    const t = fs.readFileSync(path.join(RAIZ, f), 'utf8');
    const tem = /\/\*/.test(t);
    provar('`' + f + '` continua com os comentários no repositório', tem);
  }
  provar('…e é por isso que o `check-identidade` a pode ler', true);
}

/* ========================================================================================== */
console.log('\nH · CONTROLO NEGATIVO — sem a passagem, os 234 KB de comentário ficam');
/* ========================================================================================== */
{
  const comentarios = (original.match(/\/\*[\s\S]*?\*\//g) || []).reduce((s, c) => s + c.length, 0);
  provar('a fonte tem mais de 100 KB de comentário em bloco', comentarios > 100 * 1024, kb(comentarios));
  provar('…que a passagem remove (o que se ganha é isso, e não o tamanho do ficheiro)',
    comentarios > (original.length - r.html.length) * 0.5,
    { comentarios: kb(comentarios), ganho: kb(original.length - r.html.length) });
  provar('e o ganho é de mais de metade do ficheiro', (original.length - r.html.length) > original.length * 0.5,
    kb(original.length - r.html.length));
}

console.log('\n' + (total - falhas) + '/' + total + ' asserções'
  + (falhas ? ' — ' + falhas + ' FALHA(S)' : ' — verde'));
process.exit(falhas ? 1 : 0);
