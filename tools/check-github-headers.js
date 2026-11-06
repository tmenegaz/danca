#!/usr/bin/env node
'use strict';

/*
 * check-github-headers.js — o `User-Agent` que o GitHub exige, e que faltou três vezes.
 *
 *   uso: node tools/check-github-headers.js
 *
 * O DEFEITO QUE ISTO GUARDA. O GitHub recusa com **403** toda a requisição à API sem cabeçalho
 * `User-Agent` («Request forbidden by administrative rules»), e o `fetch` do runtime dos Workers
 * não o põe sozinho. Numa prova local o defeito não aparece — o `undici` do Node preenche o
 * cabeçalho —, e por isso ele só se vê em produção, disfarçado de problema de token.
 *
 * Aconteceu em 22/10/2026 (`repo-escola.js`), em 05/11/2026 outra vez no mesmo ficheiro, e uma
 * terceira em 05/11/2026 no módulo novo da linha de base — este último lido ao contrário durante
 * uma tarde inteira («a árvore do repositório é que é recusada») quando a causa era o cabeçalho
 * ausente. A correção foi a lista única em `motor/servidor/github-api.js`; isto é o que impede a
 * próxima cópia de nascer errada.
 *
 * O QUE CONFERE, e é estático (não faz pedidos, não gasta cota):
 *
 *   1) TODO arquivo de `motor/servidor/` que fala com a API do GitHub declara `User-Agent` **ou**
 *      importa a lista de `github-api.js`. A Cloudflare fica de fora de propósito (`expurgar-
 *      escola.js` manda `Authorization` e não precisa de `User-Agent`) — o que se procura é o
 *      endereço do GitHub, não a palavra «Authorization»;
 *   2) a lista única continua a ser a única: um `Authorization: 'Bearer '` montado à mão num
 *      arquivo que não declara `User-Agent` na mesma função é reprovado;
 *   3) a lista de `github-api.js` de facto traz o campo (o guarda não pode passar por vacaria).
 *
 * Sai com código 1 se encontrar uma requisição que possa sair sem `User-Agent`.
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');

/** O corpo de cada função do arquivo, para saber se o `User-Agent` está NA MESMA função. */
function funcoesDe(texto) {
  const linhas = texto.split('\n');
  const blocos = [];
  let atual = null;
  let profundidade = 0;
  for (const linha of linhas) {
    if (!atual) {
      if (/^\s*(async\s+)?function\s+\w+|^\s*const\s+\w+\s*=\s*(async\s*)?\(|^\s*const\s+\w+\s*=\s*(async\s*)?function/.test(linha)) {
        atual = [linha];
        profundidade = (linha.match(/\{/g) || []).length - (linha.match(/\}/g) || []).length;
        if (profundidade <= 0 && /\{/.test(linha)) { blocos.push(atual.join('\n')); atual = null; }
        continue;
      }
      continue;
    }
    atual.push(linha);
    profundidade += (linha.match(/\{/g) || []).length - (linha.match(/\}/g) || []).length;
    if (profundidade <= 0) { blocos.push(atual.join('\n')); atual = null; }
  }
  if (atual) blocos.push(atual.join('\n'));
  return blocos;
}

/**
 * A AUDITORIA. Recebe a pasta e devolve `{erros, ok, declaracoes, arquivos}` — e é uma função
 * porque a contraprova precisa dela: uma prova que monta um ficheiro com o defeito antigo e exige
 * que a auditoria o apanhe. Um guarda que nunca foi visto a reprovar não guarda nada.
 */
function auditar(pasta) {
const erros = [];
const ok = [];
const arquivos = fs.readdirSync(pasta).filter((n) => n.endsWith('.js')).sort();
let declaracoes = 0;

for (const nome of arquivos) {
  const texto = fs.readFileSync(path.join(pasta, nome), 'utf8');
  /* «Falar com o GitHub» é o ENDEREÇO ou uma rota que só o GitHub tem — não a palavra
   * `Authorization`, que a Cloudflare também usa. `expurgar-escola.js` é da Cloudflare. */
  const falaComGitHub = /api\.github\.com|github-api\.js|\/git\/trees|\/git\/blobs|\/git\/commits|\/contents\//.test(texto);
  if (!falaComGitHub) continue;

  const importaLista = /require\(['"]\.\/github-api\.js['"]\)/.test(texto);
  const declaraAgente = /['"]User-Agent['"]\s*:/.test(texto);

  if (!importaLista && !declaraAgente) {
    erros.push(nome + ': fala com a API do GitHub e não declara `User-Agent` nem usa ./github-api.js');
    continue;
  }
  if (declaraAgente) declaracoes += 1;

  /* O `Authorization` montado à mão: exige o `User-Agent` na MESMA função. É a forma exacta do
   * defeito de 22/10 e de 05/11 — a lista construída no lugar, com dois dos três campos. */
  for (const bloco of funcoesDe(texto)) {
    if (!/['"]Authorization['"]\s*:/.test(bloco)) continue;
    if (/['"]User-Agent['"]\s*:/.test(bloco)) continue;
    if (/cabecalhosDe|cabecalhosDaApi|cabecalhosDeEscrita/.test(bloco)) continue;
    const primeira = bloco.split('\n').find((l) => l.trim()) || '';
    erros.push(nome + ': cabeçalhos sem `User-Agent` — ' + primeira.trim().slice(0, 70));
  }
}

// ------------------------------------------------------------------ a lista única

const comum = require(path.join(pasta, 'github-api.js'));
const cabecalhos = comum.cabecalhosDe('token-de-prova');
if (!cabecalhos['User-Agent']) erros.push('github-api.js: `cabecalhosDe` não traz `User-Agent`');
else ok.push('github-api.js: `User-Agent` presente (' + cabecalhos['User-Agent'] + ')');
if (cabecalhos.Authorization !== ('Bearer ' + ['token', 'de', 'prova'].join('-'))) {
  erros.push('github-api.js: `cabecalhosDe` não põe o `Authorization`');
} else ok.push('github-api.js: `Authorization` presente quando há token');
if (comum.cabecalhosDe('').Authorization) {
  erros.push('github-api.js: `cabecalhosDe` sem token não pode inventar `Authorization`');
} else ok.push('github-api.js: sem token não há `Authorization` inventado');

// Os dois stores da casa partilham a MESMA função — não duas parecidas.
for (const nome of ['linhas-de-base-repo.js', 'acervo-envelopes.js']) {
  const caminho = path.join(pasta, nome);
  /* A CONTRA PROVA passa uma pasta fabricada: um ficheiro que não existe não é uma falta — é
   * uma pasta de prova. A regra só se aplica a quem está lá. */
  if (!fs.existsSync(caminho)) continue;
  const texto = fs.readFileSync(caminho, 'utf8');
  if (/require\(['"]\.\/github-api\.js['"]\)/.test(texto)) ok.push(nome + ': cabeçalhos da lista única');
  else erros.push(nome + ': não usa a lista única de ./github-api.js');
}

return { erros, ok, declaracoes, arquivos };
}

module.exports = { auditar };

if (require.main === module) {
  const r = auditar(path.join(raiz, 'motor/servidor'));
  console.log('check-github-headers: ' + r.arquivos.length + ' arquivos em motor/servidor, '
    + r.declaracoes + ' declaração(ões) de `User-Agent` fora da lista comum');
  for (const linha of r.ok) console.log('  ok   ' + linha);
  for (const linha of r.erros) console.log('  ERRO ' + linha);
  if (r.erros.length) {
    console.log('\nFALHOU — ' + r.erros.length + ' requisição(ões) podem sair sem `User-Agent`.');
    process.exit(1);
  }
  console.log('\nTUDO CERTO — ' + r.ok.length + ' verificações: nenhuma chamada ao GitHub pode sair sem `User-Agent`.');
}
