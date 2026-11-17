#!/usr/bin/env node
'use strict';

/*
 * provar-o-custo-de-uma-aula.js — um lançamento custa UM minuto, e isso depende do filtro de
 * caminhos dos workflows (17/11/2026).
 *
 * A CONTA QUE ISTO PROTEGE, e ela é a unidade comercial do produto. O §L9f do
 * PLANEJAMENTO-LASTRO.md mediu que **lançar uma aula custa 1 minuto facturado**: o GitHub arredonda
 * cada job ao minuto para cima, o lançamento escreve ficheiros em `professores/<prof>/ciclos/`, e
 * esses ficheiros casam o `derivados.yml` e NÃO casam o `publicar.yml`. Um job, um minuto. Foi essa
 * a diferença entre «a cota sustenta cinco escolas» e «a cota não sustenta nenhuma».
 *
 * PORQUE É QUE ISTO PRECISA DE UMA PROVA, e não de uma nota. O número não vive em nenhum ficheiro:
 * vive na **intersecção de duas listas de caminhos** em dois YAML que ninguém relê. No dia em que
 * alguém acrescentar `professores/**` ao `publicar.yml` — e foi exactamente isso que existiu até
 * 17/11/2026, com dez deploys enfileirados por um «Guardar» — o custo de uma aula dobra em silêncio,
 * a franquia de 100 aulas passa a valer 50, e nada no ecrã muda. É a mesma família do comentário que
 * engoliu a rota do login: o defeito não está onde se olha.
 *
 * O QUE ELA FAZ. Lê as duas listas `on.push.paths` dos workflows, implementa o casamento de
 * caminhos do GitHub (`**`, `*`, `?`) e pergunta, caminho a caminho, **que workflows é que um
 * lançamento dispara**. Depois conta os jobs de cada um — o minuto facturado é a soma.
 *
 * E O CONTROLO, nas duas frentes: (i) com a lista antiga (`professores/**` no `publicar.yml`) o
 * mesmo lançamento tem de custar 2 minutos — se não tivesse, a asserção não estaria a medir nada;
 * (ii) com uma extensão abaixo do piso (R$ 0,10/aula) a escada tem de desabar, e a R$ 0,20 não.
 *
 *   uso: node experimentos/provar-o-custo-de-uma-aula.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

let n = 0;
let falhas = 0;
function conferir(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* ─────────────────────────── 1. As listas de caminhos, lidas do YAML ─────────────────────────── */

/**
 * As entradas de `on.push.paths`. Lê à mão e não com um parser de YAML: a lista é plana, os
 * comentários são a maior parte do ficheiro, e uma dependência nova para isto seria uma dependência
 * nova para sempre. O leitor é estreito de propósito — se o formato mudar, ele devolve `null` e a
 * prova diz que não conseguiu ler, em vez de dizer que está tudo bem.
 */
function caminhosDoPush(texto) {
  const linhas = texto.split('\n');
  const inicio = linhas.findIndex((l) => /^on:\s*$/.test(l));
  if (inicio === -1) return null;
  const push = linhas.findIndex((l, i) => i > inicio && /^\s{2}push:\s*$/.test(l));
  if (push === -1) return null;
  const paths = linhas.findIndex((l, i) => i > push && /^\s{4}paths:\s*$/.test(l));
  if (paths === -1) return null;
  const lista = [];
  for (let i = paths + 1; i < linhas.length; i += 1) {
    const l = linhas[i];
    if (/^\s*#/.test(l) || /^\s*$/.test(l)) continue;
    const item = /^\s{6}-\s*'([^']+)'\s*$/.exec(l) || /^\s{6}-\s*"([^"]+)"\s*$/.exec(l);
    if (item) { lista.push(item[1]); continue; }
    if (/^\s{0,5}\S/.test(l)) break; // acabou o bloco do `paths`
  }
  return lista.length ? lista : null;
}

/**
 * O casamento de caminhos do GitHub: `**` atravessa `/`, `*` e `?` não. E o `!` nega — a ordem
 * importa, e um caminho negado depois de aceite sai.
 */
function casa(padrao, caminho) {
  let negado = false;
  let p = padrao;
  if (p.startsWith('!')) { negado = true; p = p.slice(1); }
  let re = '';
  for (let i = 0; i < p.length; i += 1) {
    const c = p[i];
    if (c === '*' && p[i + 1] === '*') { re += '.*'; i += 1; }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  const bate = new RegExp('^' + re + '$').test(caminho);
  return negado ? !bate : bate;
}

function dispara(lista, caminho) {
  if (!lista) return false;
  let aceite = false;
  for (const padrao of lista) {
    if (padrao.startsWith('!')) { if (casa(padrao, caminho)) aceite = false; }
    else if (casa(padrao, caminho)) aceite = true;
  }
  return aceite;
}

/* Os jobs de cada fluxo, medidos a 17/11/2026 nos `GET /actions/runs/{id}/jobs` (um representante
 * de cada nome): todos têm 1, e o antigo `Publicar as escolas` tinha 2 porque descobria as escolas
 * e publicava-as em dois jobs. Hoje é um laço dentro de um job. */
const JOBS = { 'derivados.yml': 1, 'publicar.yml': 1, 'gerar-ciclo.yml': 1, 'criar-escola.yml': 1 };

const ler = (f) => fs.readFileSync(path.join(RAIZ, '.github', 'workflows', f), 'utf8');

/** Quantos minutos facturados um push que toca estes caminhos custa, dados os dois filtros. */
const custo = (filtros, caminhos) => Object.entries(filtros).reduce((soma, [fluxo, lista]) => {
  const toca = caminhos.some((c) => dispara(lista, c));
  return soma + (toca ? JOBS[fluxo] : 0);
}, 0);

/* ─────────────────────── 2. O que o lançamento escreve, e o que isso dispara ─────────────────── */

console.log('1. O filtro de caminhos, como ele está hoje');

const filtros = {
  'derivados.yml': caminhosDoPush(ler('derivados.yml')),
  'publicar.yml': caminhosDoPush(ler('publicar.yml')),
};
conferir('as duas listas `on.push.paths` foram lidas',
  Boolean(filtros['derivados.yml']) && Boolean(filtros['publicar.yml']),
  { derivados: filtros['derivados.yml'] && filtros['derivados.yml'].length,
    publicar: filtros['publicar.yml'] && filtros['publicar.yml'].length });

/* Os caminhos REAIS do lançamento, lidos de `escrever-ciclo.js` (`caminhoDaFonte` e
 * `caminhoDoSchemaDeCaptura`) e de `escrever-po.js` — não inventados aqui. */
const PROF = 'professores/tiago/ciclos';
const LANCAMENTO = [
  PROF + '/ciclo-01-breu-dados.json',
  PROF + '/ciclo-01-breu-po.md',
  PROF + '/ciclo-01-breu-plano.md',
  PROF + '/ciclo-01-breu-aula-01.md',
  PROF + '/ciclo-01-breu-captura-schema.json',
  PROF + '/ciclo-01-breu.fipp',
];

conferir('um lançamento dispara o `derivados.yml`', dispara(filtros['derivados.yml'], LANCAMENTO[0]));
conferir('…e NÃO dispara o `publicar.yml` — é isso que faz a aula custar 1 minuto',
  !LANCAMENTO.some((c) => dispara(filtros['publicar.yml'], c)),
  LANCAMENTO.filter((c) => dispara(filtros['publicar.yml'], c)));
conferir('…logo o custo medido de um lançamento é 1 minuto',
  custo(filtros, LANCAMENTO) === 1, custo(filtros, LANCAMENTO));

/* O CONTROLE. Com a lista que existia até 17/11/2026 — `professores/**` no `publicar.yml` — o mesmo
 * lançamento custa 2 minutos. Sem isto, a asserção de cima não estaria a medir o filtro: estaria a
 * medir uma tautologia. */
const ANTIGO = ['professores/**', 'motor/**', 'workers/**', 'raiz/**', 'wrangler.*.jsonc'];
conferir('CONTROLO: com a lista antiga (`professores/**`) o mesmo lançamento custava 2 minutos',
  custo({ ...filtros, 'publicar.yml': ANTIGO }, LANCAMENTO) === 2,
  custo({ ...filtros, 'publicar.yml': ANTIGO }, LANCAMENTO));

/* O que continua a custar 2: o `.conf` da variante, que o plano escreve (`caminhoDoConf`). A aula
 * não o toca; a mudança de plano toca. */
const CONF = [PROF + '/ciclo-01-breu.conf'];
conferir('editar o `.conf` da variante dispara os dois — 2 minutos, e é o medido', 
  custo(filtros, CONF) === 2, custo(filtros, CONF));

/* E o pacote gerado, que é o que a publicação serve: três ficheiros numa pasta `ciclo-XX-<escola>`
 * dentro de `ciclos/`. */
const PACOTE = [
  PROF + '/ciclo-01-breu/index.html',
  PROF + '/ciclo-01-breu/assets/nav.js',
];
conferir('o pacote gerado dispara o `publicar.yml`', PACOTE.every((c) => dispara(filtros['publicar.yml'], c)));
conferir('…e continua a custar 2 minutos, porque o `derivados.yml` também o vê',
  custo(filtros, PACOTE) === 2, custo(filtros, PACOTE));

/* ────────────────────── 3. O piso da escada: nenhuma extensão a pode desabar ────────────────── */

console.log('\n2. O piso das extensões, e o degrau que ele protege');

/* A escada declarada (§L8, §3 C23) e a proposta de extensão do §L9f, medidas em aulas por mês. */
const PLANOS = [
  { nome: 'Básico', preco: 69.9, aulas: 100 },
  { nome: 'Intermediário', preco: 99.9, aulas: 300 },
  { nome: 'Avançado', preco: 139.9, aulas: 800 },
];

/**
 * O teste da escada: para cada degrau, chegar à franquia do degrau de cima comprando extensões tem
 * de custar MAIS do que subir. Se custar menos, ninguém sobe — e o degrau de cima deixa de se vender.
 * Devolve as violações, com a conta.
 */
function violacoes(precoPorAula) {
  const out = [];
  for (let i = 0; i < PLANOS.length - 1; i += 1) {
    const baixo = PLANOS[i];
    const cima = PLANOS[i + 1];
    const falta = cima.aulas - baixo.aulas;
    const comExtensoes = baixo.preco + falta * precoPorAula;
    if (comExtensoes <= cima.preco) out.push({ degrau: cima.nome, comExtensoes, subir: cima.preco });
  }
  return out;
}

conferir('a R$ 0,20/aula a escada aguenta — nenhum degrau se alcança mais barato por extensões',
  violacoes(0.20).length === 0, violacoes(0.20));
conferir('…e a R$ 0,10/aula ela desaba: o Básico compra o Intermediário por R$ 89,90',
  violacoes(0.10).length > 0 && /Intermediário/.test(violacoes(0.10)[0].degrau), violacoes(0.10));

/* O piso é o que manda: R$ 0,15 é onde o Básico empata, e um cêntimo abaixo já perde. */
conferir('o piso é R$ 0,15/aula — no piso empata, abaixo perde',
  violacoes(0.1501).length === 0 && violacoes(0.1499).length > 0,
  { acima: violacoes(0.1501).length, abaixo: violacoes(0.1499).length });

/* E o que a extensão NÃO pode fazer: competir com o topo. A R$ 0,20 ela fica acima dos R$ 0,175 do
 * Avançado — quem quer 800 aulas compra o plano, não oito extensões. */
const porAulaDoTopo = PLANOS[2].preco / PLANOS[2].aulas;
conferir('a extensão proposta (R$ 0,20) fica acima do preço por aula do Avançado (R$ 0,175)',
  0.20 > porAulaDoTopo, { extensao: 0.20, topo: Number(porAulaDoTopo.toFixed(4)) });

/* ─────────────────────────── 4. O modelo dos minutos, contra a fatura ────────────────────────── */

console.log('\n3. O modelo `jobs × ⌈s/60⌉`, e a fatura que ele reproduz');

/* As dez melhores correspondências entre a medição diária (8–17/11, em minutos) e as dez linhas
 * da fatura de novembro, ordenadas por volume — a API de uso não devolve a data de cada linha, e
 * por isso a conferência é por posto. Números lidos a 17/11/2026 (§L9f ponto 1). */
const PARES = [[348, 321], [214, 205], [186, 177], [153, 151], [114, 118],
  [110, 101], [70, 73], [50, 54], [36, 37], [31, 31]];
const somaMedida = PARES.reduce((s, p) => s + p[0], 0);
const somaFatura = PARES.reduce((s, p) => s + p[1], 0);
const erroTotal = (somaMedida - somaFatura) / somaFatura;

conferir('o modelo sobrestima o total, e por menos de 5%',
  erroTotal > 0 && erroTotal < 0.05, { erro: Number((erroTotal * 100).toFixed(1)) + '%' });
conferir('…e nenhum posto erra mais de 10%',
  PARES.every(([m, f]) => Math.abs(m - f) / f < 0.10),
  PARES.map(([m, f]) => Number((100 * (m - f) / f).toFixed(1))).filter((e) => Math.abs(e) >= 10));

/* O arredondamento é a regra: 14 s de relógio custam 1 minuto, e 61 s custam 2. */
const faturado = (segundos) => Math.max(1, Math.ceil(segundos / 60));
conferir('14 s custam 1 minuto e 61 s custam 2 — o arredondamento é para cima, e nunca zero',
  faturado(14) === 1 && faturado(61) === 2 && faturado(0) === 1,
  [faturado(14), faturado(61), faturado(0)]);

console.log('');
if (falhas) { console.log('FALHOU — ' + (n - falhas) + '/' + n); process.exit(1); }
console.log('TUDO CERTO — ' + n + ' asserção(ões).');
