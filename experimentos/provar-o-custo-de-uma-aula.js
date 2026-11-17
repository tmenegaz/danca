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

console.log('\n2. A regra das extensões: a aula da extensão custa mais do que a aula de qualquer plano');

/* A escada declarada (§L8, §3 C23) e os tamanhos de extensão do ADITIVO COMERCIAL §5. */
const PLANOS = [
  { nome: 'Básico', preco: 69.9, aulas: 100 },
  { nome: 'Intermediário', preco: 99.9, aulas: 300 },
  { nome: 'Avançado', preco: 139.9, aulas: 800 },
];
const PACOTES = [20, 50, 100];
const porAula = (plano) => plano.preco / plano.aulas;

/**
 * A REGRA DELA, e é uma só: «o custo unitário da aula da extensão é maior do que o custo unitário da
 * aula no próximo plano». Isso implica duas coisas ao mesmo tempo — que a extensão seja mais cara por
 * aula do que TODOS os planos, e que exista um ponto onde migrar é melhor. Abaixo do preço da aula do
 * plano mais caro por aula, ninguém migra nunca; é o defeito que a proposta de R$ 0,20 tinha.
 *
 * Devolve os planos cuja aula é mais barata do que a extensão — isto é, as violações da regra.
 */
function violacoesDaRegra(precoPorAula) {
  return PLANOS.filter((pl) => !(precoPorAula > porAula(pl))).map((pl) => pl.nome);
}

/* A REGRA, nas palavras dela: «o custo unitário da aula da extensão é maior do que o custo unitário
 * da aula do PRÓXIMO plano». É sobre o plano de cima, e não sobre todos — e a diferença importa,
 * porque a versão forte («mais cara do que qualquer plano») é impossível: no Básico a aula custa
 * R$ 0,699, e uma extensão acima disso deixaria de ser expansão para ser penalidade. */
conferir('a R$ 0,50/aula a extensão é mais cara do que a aula do plano de CIMA, nos dois degraus',
  PLANOS.slice(0, -1).every((_, i) => 0.50 > porAula(PLANOS[i + 1])),
  PLANOS.slice(1).map((pl) => Number(porAula(pl).toFixed(4))));
conferir('…e fica ABAIXO da aula do Básico (R$ 0,699) — comprá-la melhora o preço médio de quem a compra',
  0.50 < porAula(PLANOS[0]), { extensao: 0.5, basico: Number(porAula(PLANOS[0]).toFixed(4)) });

/* O CONTROLO, e é o que prova que a regra morde: a R$ 0,20 — a proposta que eu tinha feito — a
 * extensão fica mais barata do que a aula do Intermediário, e ninguém teria motivo para migrar. */
conferir('CONTROLO: a R$ 0,20/aula — a minha proposta anterior — a regra REPROVA',
  !(0.20 > porAula(PLANOS[1])), { extensao: 0.2, intermediario: Number(porAula(PLANOS[1]).toFixed(4)) });
conferir('CONTROLO: a R$ 0,30/aula, três cêntimos abaixo da fronteira, também reprova',
  !(0.30 > porAula(PLANOS[1])), { extensao: 0.3, intermediario: Number(porAula(PLANOS[1]).toFixed(4)) });

/* E O ACHADO QUE A PROVA FEZ, e que a prosa não tinha: as JANELAS SÃO DISJUNTAS. Se se exigir as
 * duas pontas ao mesmo tempo — mais caro do que o plano de cima E mais barato do que o próprio —, não
 * há preço único que sirva os três degraus, e sobre o Avançado a janela é vazia (não há plano acima).
 * É por isso que a regra que se escreve é a de cima — «acima do plano de cima» —, que um preço único
 * cumpre em toda a escada, e não a versão «entre as duas». */
const janela = (i) => ({
  acima: i + 1 < PLANOS.length ? porAula(PLANOS[i + 1]) : null, // mais caro do que o plano de cima
  abaixo: porAula(PLANOS[i]),                                   // mais barato do que o próprio
});
const JANELAS = PLANOS.map((_, i) => janela(i));
const pisos = JANELAS.map((j) => j.acima).filter((v) => v !== null);
const tectos = JANELAS.map((j) => j.abaixo);
/* Um preço único serviria os três degraus se coubesse em todas as janelas: max(pisos) < min(tectos).
 * Não cabe — 0,333 não é menor do que 0,175 —, e é essa a razão pela qual a regra que se escreve é a
 * de cima («acima do plano de cima»), que um preço único cumpre em toda a escada. */
const intereseccaoVazia = Math.max(...pisos) >= Math.min(...tectos);
conferir('as janelas dos três degraus são DISJUNTAS — não há preço único «entre as duas pontas»',
  intereseccaoVazia, { pisos, tectos });

/**
 * O ponto de viragem: acima dele, migrar custa menos do que ficar no plano com extensões. É onde os
 * dois critérios se cruzam — por aula o plano já ganhava sempre; no desembolso, passa a ganhar aqui.
 */
const viragem = (i, precoPorAula) => Math.ceil(PLANOS[i].aulas + (PLANOS[i + 1].preco - PLANOS[i].preco) / precoPorAula);

conferir('a R$ 0,50 a migração do Básico acontece às 160 aulas', viragem(0, 0.50) === 160, viragem(0, 0.50));
conferir('…e a do Intermediário às 380', viragem(1, 0.50) === 380, viragem(1, 0.50));

/* E a prova de que o ponto de viragem é real, nas duas direcções: abaixo dele o desembolso com
 * extensões é MENOR (o argumento dela), acima é MAIOR (o plano de cima ganha). */
const desembolso = (i, aulas, precoPorAula) => {
  const falta = Math.max(0, aulas - PLANOS[i].aulas);
  const nPacotes = Math.ceil(falta / PACOTES[0]);
  return PLANOS[i].preco + nPacotes * PACOTES[0] * precoPorAula;
};
const f = viragem(0, 0.50);
conferir('abaixo das 160 aulas o Básico com extensões desembolsa MENOS do que o Intermediário',
  desembolso(0, f - 20, 0.50) < PLANOS[1].preco,
  { com: desembolso(0, f - 20, 0.50), plano: PLANOS[1].preco });
conferir('acima das 160 aulas desembolsa MAIS — e é por isso que ela migra',
  desembolso(0, f + 40, 0.50) > PLANOS[1].preco,
  { com: desembolso(0, f + 40, 0.50), plano: PLANOS[1].preco });

/* Os pacotes do aditivo a R$ 0,50 dão números redondos — que é o que a conciliação manual pede. */
const precosDosPacotes = PACOTES.map((n) => n * 0.50);
conferir('os três pacotes do aditivo (20/50/100) dão R$ 10 / R$ 25 / R$ 50 — redondos',
  precosDosPacotes.every((v) => Number.isInteger(v)) && precosDosPacotes.join(',') === '10,25,50',
  precosDosPacotes);

/* O TOPO, declarado e não escondido: sobre o Avançado não há plano acima, e a extensão custa 2,86× a
 * aula do próprio plano — a aula mais cara do catálogo. É a consequência de não haver degrau para
 * onde subir, e é o que o aditivo já resolve dizendo que acima do topo a escola fala com ela. */
conferir('sobre o Avançado a extensão custa 2,86× a aula do próprio plano — declarado',
  Math.round((0.50 / porAula(PLANOS[2])) * 100) / 100 === 2.86,
  Number((0.50 / porAula(PLANOS[2])).toFixed(2)));

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
