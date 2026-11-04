'use strict';

/*
 * provar-colunas-da-aula.js — as colunas da aula têm a largura do que levam dentro, e a notação
 * Benesh não está no bloco de musicalidade.
 *
 * O QUE SE MEDIU ANTES (04/11/2026). A pesquisadora: «todas as colunas estão com o mesmo tamanho,
 * espremendo os textos descritivos enquanto sobra espaço em colunas que exibem apenas números
 * curtos». E era literal — as doze tabelas de exercício saíam a **28/28/21/21**: o «1» do compasso
 * e o «1–2» da contagem com a mesma largura que o parágrafo da descrição.
 *
 * E a causa não era CSS: o `table { width: 100% }` da folha é o certo, e o browser distribui por
 * conteúdo **quando não há largura declarada**. O que havia era um `<colgroup>` com as quatro
 * colunas iguais — escrito pelo pandoc, que calcula a largura relativa de cada coluna pela
 * PROPORÇÃO DOS TRAÇOS da linha de separação da tabela Markdown. Com todos os traços iguais
 * (`|:--:|:--:|:--|:--|`), saíam iguais.
 *
 * A SEGUNDA ARMADILHA, e é a que se perde num teste apressado: o pandoc só usa essas proporções
 * quando a linha de separação passa dos **72 caracteres** (o `--columns` por omissão, que o
 * `gerar-ciclo.sh` não muda). Uma linha de separação proporcional mas curta é desfeita — o pandoc
 * volta a distribuir por igual, e o defeito reaparece sem que nada no ficheiro pareça errado.
 * Esta prova mede as duas coisas: a PROPORÇÃO e o COMPRIMENTO.
 *
 *   node experimentos/provar-colunas-da-aula.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const { derivarAula01, derivarNotacao } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  ✓ ' + rotulo);
  } else {
    falhas += 1;
    console.log('  ✗ ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
  }
}

/** Os envelopes REAIS da escola viva — a mesma matéria do ciclo publicado. */
function envelope(nome) {
  return JSON.parse(fs.readFileSync(path.join(RAIZ, 'escola/breu/envelopes', nome), 'utf8'));
}

const PLANO = envelope('plano-20261104-1732.json');
const PO = envelope('po-20261104-1811.json');
const CONTEXTO = { escola: 'breu', professor: 'coqui-de-redinha', ciclo: '01',
  turma: 'Balé Nível 1 — Teste 3', aulas: ['01'] };
const CALIBRACAO = { totalAulas: 35, duracaoMin: 45, volumePorAula: 90 };

/** As linhas de uma tabela Markdown cujo cabeçalho começa pelas células dadas. */
function tabela(markdown, primeiraCelula) {
  const linhas = String(markdown).split('\n');
  const i = linhas.findIndex((l) => l.trim().startsWith('|') && l.split('|')[1].trim() === primeiraCelula);
  if (i === -1) return null;
  const corpo = [];
  for (let j = i; j < linhas.length && linhas[j].trim().startsWith('|'); j += 1) corpo.push(linhas[j]);
  return corpo;
}

/** As células de uma linha de tabela, sem os pipes das pontas. */
const celulas = (linha) => linha.split('|').slice(1, -1).map((c) => c.trim());

/**
 * A LARGURA QUE O PANDOC VAI CALCULAR, sem chamar o pandoc — a regra dele é a proporção dos
 * traços (contando os `:` de alinhamento, que ele conta como conteúdo da coluna).
 */
function proporcao(linhaSeparador) {
  const larguras = celulas(linhaSeparador).map((c) => c.length);
  const total = larguras.reduce((s, x) => s + x, 0);
  return larguras.map((x) => Math.round((x / total) * 100));
}

function main() {
  const aula = derivarAula01({ plano: PLANO, po: PO, contexto: CONTEXTO, calibracao: CALIBRACAO });
  const notacao = derivarNotacao({ plano: PLANO, contexto: CONTEXTO });

  // ------------------------------------------------- 1. a notação saiu do §4
  console.log('\n1. O bloco de musicalidade não carrega a notação Benesh');
  const bloco4 = tabela(aula, 'Compasso');
  checar('a §4 do bloco de musicalidade está lá', Boolean(bloco4), bloco4 && bloco4[0]);
  const corpoDo4 = (bloco4 || []).slice(2);
  checar('a tabela continua a ter as quatro colunas da música',
    Boolean(bloco4) && celulas(bloco4[0]).join('|') === 'Compasso|Exercício|Tempos|Contagem',
    bloco4 && bloco4[0]);
  checar('NENHUMA célula traz a notação (`[Perna: …`)',
    corpoDo4.every((l) => l.indexOf('[Perna') === -1 && l.indexOf('`') === -1), corpoDo4);
  checar('a contagem é só a contagem («1–2»)',
    corpoDo4.length > 0 && corpoDo4.every((l) => /^\|\s*[^|]+\|\s*[^|]+\|\s*\d+\s*\|\s*\d+[–-]\d+\s*\|$/.test(l.trim())),
    corpoDo4);
  checar('e a tabela continua a dizer o compasso e o exercício',
    corpoDo4.length > 0 && corpoDo4.every((l) => celulas(l)[0] === '2/4' && celulas(l)[1].length > 0), corpoDo4);

  // ------------------------------------------- 2. a notação vive no seu documento
  console.log('\n2. A notação continua no documento dela — é lá que se vai buscá-la');
  const notacaoTem = notacao.split('\n').filter((l) => l.indexOf('[Perna') !== -1);
  checar('o documento de notação continua a trazer os blocos', notacaoTem.length > 0, notacaoTem.length);
  checar('e a §4 da aula NÃO é o sítio deles', aula.indexOf('[Perna') === -1);

  // ---------------------------------------------------- 3. as larguras das colunas
  console.log('\n3. As tabelas de exercício: números estreitos, descrição larga');
  const tabelas = tabela(notacao, 'Compasso');
  checar('há tabela de exercícios no documento de notação', Boolean(tabelas), tabelas && tabelas[0]);
  const separador = (tabelas || [])[1] || '';
  checar('a linha de separação passa dos 72 caracteres (sem isso o pandoc desiste das larguras)',
    separador.length > 72, separador.length);
  const p = proporcao(separador);
  checar('são quatro colunas', p.length === 4, p);
  checar('o compasso fica estreito (≤ 15%)', p[0] <= 15, p[0]);
  checar('e a contagem também (≤ 15%)', p[1] <= 15, p[1]);
  checar('a descrição fica com mais de metade da tabela (> 45%)', p[3] > 45, p[3]);
  checar('e a notação tem espaço para os 24 caracteres do bloco (≥ 20%)', p[2] >= 20, p[2]);
  checar('a soma fecha em 100%', p.reduce((s, x) => s + x, 0) === 100, p.reduce((s, x) => s + x, 0));
  checar('antes eram 28/28/21/21 — as numéricas desceram a menos de metade',
    p[0] < 14 && p[1] < 14, p);

  // ------------------------ 4. e o pandoc, quando existe, concorda com a conta
  console.log('\n4. O pandoc concorda — as larguras que ele escreve no HTML');
  let temPandoc = true;
  try { execFileSync('pandoc', ['--version'], { stdio: 'pipe' }); } catch (erro) { temPandoc = false; }
  if (!temPandoc) {
    console.log('  (sem pandoc nesta máquina: a secção mede a regra, e não o resultado)');
  } else {
    const trecho = tabelas.slice(0, 5).join('\n');
    const html = execFileSync('pandoc', ['-t', 'html'], { input: trecho + '\n', encoding: 'utf8' });
    const larguras = [...html.matchAll(/width: (\d+)%/g)].map((m) => Number(m[1]));
    checar('o pandoc escreve um `colgroup` com quatro larguras', larguras.length === 4, larguras);
    /* O ARREDONDAMENTO É DO PANDOC, e não é erro: ele normaliza para somar 100 e cada coluna
     * pode cair um ponto ao lado da conta. O que se compara é a LARGURA RELATIVA, com tolerância
     * de um ponto — comparar a string faria a prova falhar por causa de um arredondamento. */
    checar('e elas são as da proporção dos traços (a menos de um ponto de arredondamento)',
      larguras.length === p.length && larguras.every((v, i) => Math.abs(v - p[i]) <= 1),
      { pandoc: larguras, conta: p });
    checar('a descrição é a coluna mais larga de todas', larguras[3] === Math.max.apply(null, larguras), larguras);
  }

  // ------------------------- 5. a aula em prosa herda as larguras (é o mesmo separador)
  console.log('\n5. A aula em prosa (as mesmas tabelas, sem a coluna da notação)');
  const prosa = require(path.join(RAIZ, 'tools/gerar-aula-prosa.js'));
  if (typeof prosa.transformarExercicios !== 'function') {
    console.log('  (o módulo não expõe `transformarExercicios`: a secção não mede)');
  } else {
    const exercicios = prosa.transformarExercicios(notacao);
    const tresColunas = tabela(exercicios, 'Compasso');
    checar('as tabelas ficam com três colunas (compasso, contagem, descrição)', Boolean(tresColunas), tresColunas);
    const p3 = proporcao((tresColunas || [])[1] || '');
    checar('a descrição fica com mais de metade (> 55%)', p3[2] > 55, p3);
    /* NESTA TABELA as numéricas ficam a 16% e não a 12%: sai a coluna da notação, e o que sobra
     * renormaliza sobre três. Continua a ser menos de metade do que era (36/36/27), e a descrição
     * fica com 68%. O limite é 20% — acima disso a coluna de um número voltou a ser larga. */
    checar('e o compasso e a contagem continuam estreitos (≤ 20% cada)', p3[0] <= 20 && p3[1] <= 20, p3);
    checar('a notação NÃO entra na aula em prosa', exercicios.indexOf('[Perna') === -1);
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + n + ' asserções: o bloco de musicalidade da aula deixou de carregar '
    + 'a notação Benesh (ela vive no documento dela), e as colunas das tabelas de exercício têm a '
    + 'largura do que levam dentro — números estreitos, descrição com mais de metade.');
}

main();
