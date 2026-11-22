#!/usr/bin/env node
'use strict';

/**
 * provar-conferir-expurgo.js — a conferência do expurgo classifica o que sobra, e não mente.
 *
 * O QUE MOTIVOU (22/11/2026). Ela, antes de expurgar o `breu` e recomeçar os testes: «Eu preciso
 * saber se o expurgo está correto, já está validado, já atende sumir com todas as escolas, com
 * tudo […] Preciso saber se o que a gente tinha de escolas antigas que estavam atrapalhando os
 * testes de mesa não vão nascer de novo. Então o expurgo está feito?»
 *
 * A resposta não podia ser «sim» sem uma medição. `escola/conferir-expurgo.js` é essa medição — e
 * esta prova mede o que ELE afirma: que uma escola expurgada tem zero arquivos, que o que sobra
 * tem razão declarada, e que a criação com o mesmo nome é travada enquanto houver artefacto.
 *
 * POR QUE ÁRVORES SINTÉTICAS, e não o repositório. Uma prova que dissesse «o `breu` está vivo»
 * mediria o dia em que foi escrita: no dia em que ela expurgasse o `breu`, a asserção caía sem
 * nada se ter partido. Aqui montam-se duas árvores num diretório temporário — uma viva, uma
 * expurgada — e mede-se a CLASSIFICAÇÃO, que é a lógica que interessa e que não muda com o acervo.
 *
 *   node experimentos/provar-conferir-expurgo.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const CONFERIR = path.join(RAIZ, 'escola', 'conferir-expurgo.js');

let provas = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 300)));
}

/** Escreve um ficheiro, criando as pastas — a árvore sintética é só caminhos. */
const pôr = (raiz, rel, texto) => {
  const destino = path.join(raiz, rel);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, texto === undefined ? '' : texto, 'utf8');
};

/**
 * UMA ÁRVORE SINTÉTICA. `estado` diz o que a escola é:
 *   · 'viva'      — tem config, pacote, acervo, elencos, e o elo diz que foi recriada depois do
 *                   último expurgo;
 *   · 'expurgada' — tem só o que o expurgo preserva: o elo (com o último acto a ser o expurgo), a
 *                   fixture do nome, e o índice derivado;
 *   · 'residuo'   — como a expurgada, mais UM ficheiro que ninguém sabe explicar.
 */
function árvore(estado, slug) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'conferir-' + slug + '-'));
  const elo = (expurgo, recriacao) => JSON.stringify({
    escola: slug, worker: slug, professor: { slug: 'p' }, ciclo: '01',
    expurgo: expurgo.map((em, i) => ({ em, motivo: 'expurgada pela página «Sistema Lastro»', apagado: ['x' + i] })),
    recriacao: recriacao.map((em) => ({ em, motivo: 'recriada por tools/criar-escola.sh' })),
  }, null, 2) + '\n';

  if (estado === 'viva') {
    pôr(raiz, 'wrangler.' + slug + '.jsonc', '{}');
    pôr(raiz, 'escola/' + slug + '/envelopes/anamnese-20260101-0000.json', '{}');
    pôr(raiz, 'escola/' + slug + '/linhas-de-base/tami--20260101-0000.json', '{}');
    pôr(raiz, 'professores/p/ciclos/ciclo-01-' + slug + '.conf', 'DOCS="plano"\n');
    pôr(raiz, 'professores/p/ciclos/ciclo-01-' + slug + '/index.html', '<html></html>');
    pôr(raiz, 'professores/p/ciclos/ciclo-01-' + slug + '-aula-01.md', '# Aula 01\n');
    pôr(raiz, 'professores/p/ciclos/ciclo-01-' + slug + '-rosa/index.html', '<html></html>');
    pôr(raiz, 'escola/' + slug + '/indice.json',
      elo(['2026-01-01T00:00:00.000Z'], ['2026-01-02T00:00:00.000Z']));
    return raiz;
  }
  pôr(raiz, 'escola/' + slug + '/indice.json',
    elo(['2026-01-01T00:00:00.000Z', '2026-01-03T00:00:00.000Z'], ['2026-01-02T00:00:00.000Z']));
  pôr(raiz, 'teste/' + slug + '.json', '{"teste":1}\n');
  pôr(raiz, 'indices/escolas/' + slug + '.json', '{}\n');
  /* O `teste/` é a palavra do NOME, e o checker a reconhece para QUALQUER slug — o fixture só fica
   * «explicado» se for o do próprio nome. Pôr os dois cobre o caso e mede a regra. */
  pôr(raiz, 'teste/outra.json', '{"teste":2}\n');
  /* O RESÍDUO TEM DE SER ALGO QUE O EXPURGO **NÃO** APAGARIA. Um ficheiro chamado
   * `ciclo-01-<slug>-orfao.md` não serve para o teste: pela regra do expurgo ele É um artefacto da
   * escola, e seria apagado — contá-lo como resíduo seria a conferência a mentir. O caso que
   * interessa é o que cita o nome da escola sem ser um ficheiro dela. */
  if (estado === 'residuo') pôr(raiz, 'biblioteca/referencias-' + slug + '.md', '# sobrou\n');
  return raiz;
}

const conferir = (raiz, slug) => execFileSync(process.execPath,
  [CONFERIR, slug, '--raiz=' + raiz], { encoding: 'utf8' });

console.log('\nA CONFERÊNCIA DO EXPURGO — o que sobra, e porquê\n');

/* ------------------------------------------------------------------------------------------ */
console.log('A. Uma escola VIVA: os artefactos são contados, e a criação é travada');
/* ------------------------------------------------------------------------------------------ */
let raizViva = null;
{
  raizViva = árvore('viva', 'escola-viva');
  const saida = conferir(raizViva, 'escola-viva');
  provar('a escola viva tem artefactos — a conferência conta-os, e não zero',
    /arquivos desta escola na árvore: 7\b/.test(saida),
    (saida.match(/arquivos desta escola na árvore: \d+/) || [''])[0]);
  provar('o elo diz que ela está VIVA (recriada depois do último expurgo)',
    /o elo diz: VIVA/.test(saida), (saida.match(/o elo diz: .*/) || [''])[0]);
  provar('a criação com o mesmo nome é RECUSADA, e o motivo é nomeado',
    /RECUSA criar/.test(saida) && /wrangler\.escola-viva\.jsonc/.test(saida),
    (saida.match(/· (wrangler|professores)[^\n]*/g) || []).slice(0, 3));
  provar('…e a turma que colidiria é nomeada pelo NOME DELA, e não pelo sufixo do ficheiro',
    /pacote\(s\) de TURMA com este nome — rosa\b/.test(saida),
    (saida.match(/pacote\(s\) de TURMA[^\n]*/) || [''])[0]);
}

/* ------------------------------------------------------------------------------------------ */
console.log('\nB. Uma escola EXPURGADA: zero artefactos, e o que sobra tem razão declarada');
/* ------------------------------------------------------------------------------------------ */
let raizExpurgada = null;
{
  raizExpurgada = árvore('expurgada', 'escola-morta');
  const saida = conferir(raizExpurgada, 'escola-morta');
  provar('não há um único artefacto dela na árvore',
    /arquivos desta escola na árvore: 0\b/.test(saida),
    (saida.match(/arquivos desta escola na árvore: \d+/) || [''])[0]);
  provar('o elo diz que o último acto é o expurgo',
    /o elo diz: EXPURGADA/.test(saida), (saida.match(/o elo diz: .*/) || [''])[0]);
  provar('cada um dos que ficam tem o seu PORQUE escrito',
    /o elo do expurgo — 1 arquivo\(s\)/.test(saida)
    && /porque fica: a proveniência acrescenta/.test(saida)
    && /a fixture de teste — 1 arquivo\(s\)/.test(saida)
    && /porque fica: os dados sintéticos entram pela PALAVRA/.test(saida),
    saida.split('\n').filter((l) => /porque fica|— 1 arquivo/.test(l)));
  provar('o fixture de OUTRO nome não é reclamado como resto desta escola — a regra é o nome',
    !/· teste\/outra\.json/.test(saida), saida.match(/· teste\/[^\n]*/g));
  provar('e «nenhum resíduo sem razão declarada» é a conclusão',
    /nenhum resíduo sem razão declarada\./.test(saida), saida.match(/RESÍDUO[^\n]*/g));
  provar('a criação com o mesmo nome está LIVRE — nada a recusar',
    /livre: não há config, variante nem pacote/.test(saida), saida.match(/RECUSA[^\n]*/g));
}

/* ------------------------------------------------------------------------------------------ */
console.log('\nC. Um ficheiro que ninguém explica é RESÍDUO — e é acusado');
/* ------------------------------------------------------------------------------------------ */
{
  const raizSuja = árvore('residuo', 'escola-suja');
  const saida = conferir(raizSuja, 'escola-suja');
  provar('o ficheiro sem razão declarada aparece na lista dos resíduos',
    /RESÍDUO — 1 caminho/.test(saida)
    && /✗ biblioteca\/referencias-escola-suja\.md/.test(saida),
    saida.match(/RESÍDUO[^\n]*|✗ [^\n]*/g));
  provar('…e a conclusão deixa de ser «nenhum»',
    !/nenhum resíduo sem razão declarada\./.test(saida),
    saida.match(/nenhum resíduo[^\n]*/g));
}

/* ------------------------------------------------------------------------------------------ */
console.log('\nD. A fronteira: o que a conferência NÃO alcança é dito, e nomeado');
/* ------------------------------------------------------------------------------------------ */
{
  const saida = conferir(raizExpurgada, 'escola-morta');
  provar('ela diz que o Cloudflare (Worker, rota, KV) não é alcançado daqui',
    /vivem no Cloudflare/.test(saida));
  provar('…e que o KV é o que uma escola nova com o mesmo nome HERDA',
    /HERDA/.test(saida));
  provar('…e que a autoridade de lá confere por LEITURA, não pela listagem',
    /confere por\s+LEITURA|por\n?\s*LEITURA/.test(saida) || /por LEITURA/.test(saida.replace(/\s+/g, ' ')));
}

/* A limpeza: as árvores são temporárias, e são nossas. */
for (const r of [raizViva, raizExpurgada, path.join(os.tmpdir(), 'x')]) {
  if (r && fs.existsSync(r) && r.indexOf(os.tmpdir()) === 0) fs.rmSync(r, { recursive: true, force: true });
}

console.log('');
if (falhas) {
  console.log('FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).');
  process.exit(1);
}
console.log('TUDO CERTO — ' + provas + ' asserções: a conferência conta os artefactos de uma escola,'
  + ' diz por que fica o que fica, acusa o que ninguém explica e diz onde acaba o seu alcance.');
