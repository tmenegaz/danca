#!/usr/bin/env node
'use strict';

/*
 * provar-rotas-que-existem.js — uma rota declarada dentro de um comentário não existe (17/11/2026).
 *
 * O DEFEITO QUE ISTO APANHOU, e é o mais caro que esta frente produziu: ao reescrever o bloco de
 * comentário de uma rota, o fecho do comentário foi-se. Passou a engolir 52 linhas de código
 * — e com elas a rota `/api/bastidores/validar-senha`.
 *
 * O que se viu: `node --check` disse OK (o ficheiro é JavaScript válido: um comentário longo é
 * válido), as 120 asserções de `provar-paginacao` passaram, as 131 de `provar-financeiro-da-escola`
 * passaram — porque quase todas constroem a PÁGINA e não chamam a ROTA. E em produção os professores
 * deixaram de conseguir entrar: `POST /api/bastidores/validar-senha` respondia 404.
 *
 * A LIÇÃO, e é a mesma que a casa já escreveu noutro sítio: o que não é chamado não é medido. Uma
 * prova de páginas não prova o servidor.
 *
 * O QUE ESTA PROVA FAZ, e porque não é uma busca de texto: percorre o ficheiro com um leitor de
 * estados — código, comentário de linha, comentário de bloco, string — e guarda os intervalos de
 * cada comentário. Depois procura as DECLARAÇÕES DE ROTA (`path === '/api/...'`) e pergunta, uma a
 * uma, se caem dentro de um comentário. Procurar a string no ficheiro diria «está lá» exactamente no
 * caso em que ela não está.
 *
 * E O CONTROLO: injeta um comentário por fechar num ficheiro temporário e confirma que a prova
 * reprova. Uma prova que não sabe falhar não é uma prova.
 *
 *   uso: node experimentos/provar-rotas-que-existem.js
 */

const fs = require('fs');
const path = require('path');

let n = 0;
let falhas = 0;
function conferir(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/**
 * Os intervalos de TODOS os comentários de um texto JavaScript.
 *
 * O leitor é de ESTADOS, e não uma expressão regular, porque uma expressão regular não sabe
 * distinguir o `//` de dentro de uma string (`'https://…'` aparece neste repositório) nem o `/*`
 * de dentro de um comentário de linha. Foi essa a classe de erro que apagou a rota.
 *
 * O que ele NÃO trata: expressões regulares literais (`/…/ `). Um `/` de regex pode conter `/*`, e
 * nesse caso o leitor erraria. Aceita-se o risco e declara-se: neste ficheiro as regexes são curtas
 * e nenhuma contém `/*`. A asserção final sobre o próprio leitor (o controlo) é a rede.
 */
function comentarios(texto) {
  const intervalos = [];
  let i = 0;
  while (i < texto.length) {
    const c = texto[i];
    const d = texto[i + 1];
    if (c === '/' && d === '/') {
      const inicio = i;
      while (i < texto.length && texto[i] !== '\n') i += 1;
      intervalos.push([inicio, i]);
      continue;
    }
    if (c === '/' && d === '*') {
      const inicio = i;
      i += 2;
      while (i < texto.length && !(texto[i] === '*' && texto[i + 1] === '/')) i += 1;
      i = Math.min(i + 2, texto.length);
      intervalos.push([inicio, i]);
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const aspa = c;
      i += 1;
      while (i < texto.length && texto[i] !== aspa) {
        if (texto[i] === '\\') i += 1;
        i += 1;
      }
      i += 1;
      continue;
    }
    i += 1;
  }
  return intervalos;
}

/** A linha (1-based) de um índice. */
const linhaDe = (texto, indice) => texto.slice(0, indice).split('\n').length;

/**
 * As rotas declaradas que caíram dentro de um comentário.
 *
 * O padrão é o da DECLARAÇÃO, e não o da menção: `path === '/api/…'` é como este servidor decide o
 * que atende. Uma rota citada num comentário explicativo (`«/api/bastidores/validar-senha»`) é
 * conversa, e não seria este o sítio de a proibir.
 */
function rotasEngolidas(texto) {
  const intervalos = comentarios(texto);
  const dentro = (i) => intervalos.some(([a, b]) => i >= a && i < b);
  return [...texto.matchAll(ROTA_GLOBAL)]
    .filter((m) => dentro(m.index))
    .map((m) => m[1] + ' (linha ' + linhaDe(texto, m.index) + ')');
}

/** As rotas que o ficheiro declara — para a prova poder dizer quantas mediu. */
function rotasDeclaradas(texto) {
  return [...texto.matchAll(ROTA_GLOBAL)].map((m) => m[1]);
}

/* OS DOIS MODOS DE DECLARAR UMA ROTA NESTE REPOSITÓRIO, e os dois contam. Os Bastidores e a
 * Produção escrevem `path === '/api/…'`; a raiz escreve `url.pathname === '/api/…'`. Uma prova que
 * só conhecesse o primeiro diria «a raiz não tem rotas» — e uma lista vazia passa sempre, que é o
 * defeito que esta prova existe para travar. */
const ROTA_GLOBAL = /(?:url\.)?path(?:name)?\s*===\s*'(\/api\/[^']+)'/g;

const RAIZ = path.join(__dirname, '..');
/* OS FICHEIROS QUE DECLARAM ROTAS. `painel-html.js` NÃO está nesta lista, e a ausência é
 * deliberada: ele desenha páginas e não atende pedidos — zero rotas é o certo para ele, e uma
 * asserção que exigisse uma rota em cada ficheiro da lista obrigaria a inventar-lhe uma. */
const FICHEIROS = ['motor/servidor/bastidores.js', 'motor/servidor/raiz.js',
  'motor/servidor/producao.js'];

console.log('\n1. Nenhuma rota declarada vive dentro de um comentário');
{
  let total = 0;
  for (const relativo of FICHEIROS) {
    const texto = fs.readFileSync(path.join(RAIZ, relativo), 'utf8');
    const engolidas = rotasEngolidas(texto);
    const declaradas = rotasDeclaradas(texto);
    total += declaradas.length;
    conferir(relativo + ' — ' + declaradas.length + ' rota(s), nenhuma dentro de comentário',
      declaradas.length > 0 && engolidas.length === 0, engolidas);
  }
  conferir('…e o conjunto medido não é vazio (' + total + ' rotas ao todo)', total > 60, total);
}

console.log('\n2. A rota que faltou, medida como rota e não como texto');
{
  /* A ROTA DO LOGIN DO PROFESSOR. Ela existia na véspera e não existia no dia — e a prova que a
   * substitui tem de a nomear, para que o dia em que alguém a apagar saiba que apagou isto. */
  const texto = fs.readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8');
  conferir('o login do professor é uma rota a sério, e não uma frase num comentário',
    rotasDeclaradas(texto).indexOf('/api/bastidores/validar-senha') !== -1
      && rotasEngolidas(texto).every((r) => !/validar-senha/.test(r)), null);
}

console.log('\n3. O CONTROLO — a prova sabe falhar');
{
  /* Um ficheiro temporário com o MESMO defeito: um comentário de bloco que nunca fecha, a engolir
   * uma declaração de rota. Se a prova passar aqui, não vale nada. */
  const temporario = path.join(require('os').tmpdir(), 'provar-rotas-controle.js');
  fs.writeFileSync(temporario, [
    "const x = 1;",
    "/* um comentário que se esqueceu de fechar",
    "   e que continua por aqui abaixo",
    "if (path === '/api/rota-engolida') { return 1; }",
    "*/",
    "if (path === '/api/rota-viva') { return 2; }",
    "",
  ].join('\n'));
  const texto = fs.readFileSync(temporario, 'utf8');
  const engolidas = rotasEngolidas(texto);
  conferir('…a rota engolida é apanhada, e a viva não',
    engolidas.length === 1 && /\/api\/rota-engolida/.test(engolidas[0]),
    engolidas);

  /* E O CASO OPOSTO, que é o que faz a asserção valer: a MESMA rota, fora do comentário, passa. */
  fs.writeFileSync(temporario, "if (path === '/api/rota-engolida') { return 1; }\n");
  const fora = rotasEngolidas(fs.readFileSync(temporario, 'utf8'));
  conferir('…e a mesma rota, fora do comentário, não é acusada', fora.length === 0, fora);

  /* O `//` DE DENTRO DE UMA STRING não pode abrir um comentário — o endereço `https://` está por
   * todo neste repositório, e um leitor ingénuo cortaria a linha e perderia o que vem depois. */
  fs.writeFileSync(temporario, [
    "const url = 'https://exemplo.test/api';",
    "if (path === '/api/rota-depois-da-url') { return 1; }",
    "",
  ].join('\n'));
  const depoisDaUrl = rotasEngolidas(fs.readFileSync(temporario, 'utf8'));
  conferir('…e um `//` dentro de uma string não engole a rota da linha seguinte',
    depoisDaUrl.length === 0, depoisDaUrl);
  fs.unlinkSync(temporario);
}

console.log('');
if (falhas) { console.log('FALHOU — ' + (n - falhas) + '/' + n); process.exit(1); }
console.log('TUDO CERTO — ' + n + ' asserção(ões).');
