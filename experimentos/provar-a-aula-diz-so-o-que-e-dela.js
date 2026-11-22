#!/usr/bin/env node
'use strict';

/**
 * provar-a-aula-diz-so-o-que-e-dela.js — cada aula imprime o SEU marco, e mede pela régua da turma.
 *
 * O QUE ELA VIU (22/11/2026), na Aula 01 da `breu`:
 *
 *   1. «na linha que fala parâmetro de medição, tá aparecendo aqui todos os objetivos específicos,
 *      os marcos estão todos e aqui tem que ter apenas o marco que diz respeito a essa aula, que
 *      neste caso é o marco um […] os outros marcos que estão aqui, o dois e o três, não deveriam
 *      estar aqui […] cada aula tem o seu objetivo específico, ou seja, cada aula com o seu
 *      próprio marco.»
 *
 *   2. «no item cinco, guia de observação do professor […] tá usando uma matriz de medição que não
 *      existe mais. Aconteceu, parcial, não aconteceu, não vi. Isso aqui é texto escrito duro, não
 *      é criado dinamicamente. […] quando o professor cria a matriz lá em bastidores, ele tem a
 *      própria rubrica, e a matriz de rubrica dele é outra.»
 *
 * AS DUAS TÊM A MESMA FORMA: o documento da aula a dizer o que não é dela. O §1 herdava a matriz
 * do CICLO (uma linha por objetivo), e o §5 trazia a régua do CÓDIGO em vez da régua da TURMA.
 *
 * O que se mede, e por que cada asserção existe:
 *
 *   A. §1 da Aula 01: UM marco — o 1 — e nenhum dos outros. Contra o envelope REAL, que tem a
 *      matriz inteira na chave da aula (é assim que o formulário a grava).
 *   B. §1 da Aula 02: o marco 2, e o §1 das duas aulas NÃO são o mesmo texto — a asserção que
 *      pega a «herança do parâmetro da primeira» que a lacuna explicitamente não faz.
 *   C. O escopo é DADO: com `aula-de-cada-objetivo` a dizer que o objetivo 2 vai às aulas 02 e 03,
 *      a Aula 03 mostra o marco 2 — a regra não é «marco N na aula N», é o que o plano declarou.
 *   D. Sem escopo (a chamada de três argumentos, que a bancada do exercício novo usa), a matriz
 *      inteira continua a sair: filtrar por ausência seria inventar um escopo.
 *   E. §5 nomeia os níveis DECLARADOS pela turma — e quando o plano declara outros, são esses.
 *   F. As cinco marcas mortas não aparecem em documento nenhum — nem na aula, nem na folha de
 *      captura. É a asserção que impede o texto fixo de voltar por uma cópia.
 *   G. O QUE ESTÁ EM DISCO É O QUE O CÓDIGO PRODUZ (mesma entrada, mesma saída) e o §1 do ficheiro
 *      publicado tem um marco só — a propriedade, e não a aparência.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` extrai o `motor/` desse commit. Lá o §1 da Aula 01 imprime
 * os três marcos e o §5 diz as cinco marcas mortas — o defeito, medido.
 *
 *   node experimentos/provar-a-aula-diz-so-o-que-e-dela.js
 *   node experimentos/provar-a-aula-diz-so-o-que-e-dela.js --contra=070415c2
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const ENVELOPES = path.join(RAIZ, 'escola/breu/envelopes');
const PLANO = path.join(ENVELOPES, 'plano-20261122-0849.json');
const PO = path.join(ENVELOPES, 'po-20261122-0849.json');

const MARCA_MORTA = '✓ aconteceu';

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 300)));
}

const json = (caminho) => JSON.parse(fs.readFileSync(caminho, 'utf8'));

/** A §1 de um documento derivado: o texto entre «## 1.» e «## 2.». */
function secao1(md) {
  const i = md.indexOf('## 1.');
  const j = md.indexOf('## 2.');
  return i === -1 || j === -1 ? '' : md.slice(i, j);
}
/** A §5 de um documento derivado: entre «## 5.» e «## 6.». */
function secao5(md) {
  const i = md.indexOf('## 5.');
  const j = md.indexOf('## 6.');
  return i === -1 ? '' : (j === -1 ? md.slice(i) : md.slice(i, j));
}
/** Os marcos que o §1 diz: os negritos `**1**`, `**2**`… da linha do parâmetro. */
function marcosNoParametro(md) {
  // A linha é uma CÉLULA de tabela: `| **Parâmetro de medição** | **1** …` — procura-se dentro.
  const linha = (secao1(md).split('\n').find((l) => l.indexOf('**Parâmetro de medição**') !== -1) || '');
  return [...linha.matchAll(/\*\*(\d+)\*\*/g)].map((m) => m[1]).filter((n) => n !== '');
}

(async () => {
  const contra = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
  let base = RAIZ;
  if (contra) {
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'marco-'));
    // `professores/` vai junto: a calibração vem do `.conf` da variante, e sem ele a prova não
    // chega a medir nada. O `escola/` traz os envelopes, que são a fixture.
    execSync('git archive ' + contra
      + ' motor modelo porta biblioteca tools escola professores/demi-plie/ciclos/ciclo-01-breu-rosa.conf'
      + ' | tar -x -C ' + destino, { cwd: RAIZ, stdio: 'pipe' });
    base = destino;
  }
  const nucleo = require(path.join(base, 'motor/nucleo/derivar-ciclo.js'));
  const planoDoCiclo = require(path.join(base, 'motor/nucleo/derivar-plano-ciclo.js'));
  const { calibracaoDoConf } = require(path.join(base, 'motor/servidor/escrever-ciclo.js'));

  const plano = json(PLANO);
  const po = json(PO);
  const cal = calibracaoDoConf(fs.readFileSync(
    path.join(base, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa.conf'), 'utf8'));
  const contexto = { professor: 'demi-plie', ciclo: '01', escola: 'breu', escolaNome: 'Breu' };
  const derivar = (nn, p) => nucleo.derivarAula({ nn, plano: p || plano, po, contexto, calibracao: cal });

  /* ───────────────────────────────────── A e B. Cada aula imprime o seu marco, e só o seu */
  console.log('\nA. O §1 da Aula 01 tem o marco 1 — e não os três da matriz');
  const aula1 = derivar('01');
  const marcos1 = marcosNoParametro(aula1);
  provar('a matriz gravada na chave da aula TEM os três marcos (a fixture é o caso real)',
    (plano.respostas['aula-1-parametro'].valor || []).length === 3,
    plano.respostas['aula-1-parametro'].valor.length);
  provar('…e o §1 da Aula 01 imprime UM só, o marco 1', marcos1.join(',') === '1', marcos1);
  provar('…e o §1 não cita os marcos 2 e 3',
    !/\*\*2\*\*/.test(secao1(aula1)) && !/\*\*3\*\*/.test(secao1(aula1)), secao1(aula1).slice(0, 200));

  console.log('\nB. A Aula 02 imprimi o marco 2 — e o §1 das duas não é o mesmo texto');
  const aula2 = derivar('02');
  const marcos2 = marcosNoParametro(aula2);
  provar('o §1 da Aula 02 tem o marco 2, e só ele', marcos2.join(',') === '2', marcos2);
  provar('a Aula 02 não herda o parâmetro da Aula 01', secao1(aula2) !== secao1(aula1), null);

  /* ───────────────────────────────────────────── C. O escopo é declarado, não presumido */
  console.log('\nC. O escopo vem do `aula-de-cada-objetivo`');
  const comMapa = JSON.parse(JSON.stringify(plano));
  comMapa.respostas['aula-de-cada-objetivo'].valor = [
    { objetivo: 1, aulas: ['01'] },
    { objetivo: 2, aulas: ['02', '03'] },
    { objetivo: 3, aulas: ['04'] },
  ];
  // as matrizes das aulas 3 e 4 têm de existir para a leitura ter o que ler
  for (const nn of ['3', '4']) {
    comMapa.respostas['aula-' + nn + '-parametro'] = {
      valor: [
        { marco: 1, marcados: ['Plié'] },
        { marco: 2, marcados: ['Relevé'] },
        { marco: 3, marcados: ['Battement tendu'] },
      ],
      origem: 'perguntado', respondente: 'professor', nota: null,
    };
  }
  provar('a Aula 03, com o mapa a dizer «objetivo 2 → aulas 02 e 03», mostra o marco 2',
    marcosNoParametro(derivar('03', comMapa)).join(',') === '2', marcosNoParametro(derivar('03', comMapa)));
  provar('…e a Aula 04, com o mapa a dizer «objetivo 3 → aula 04», mostra o marco 3',
    marcosNoParametro(derivar('04', comMapa)).join(',') === '3', marcosNoParametro(derivar('04', comMapa)));

  /* E QUANDO A CHAVE NÃO EXISTE, a lacuna nomeia o marco — não recebe de empréstimo a matriz de
   * outra aula. É a metade que impede o filtro de virar herança. */
  console.log('\nC2. Sem parâmetro para esta aula, a lacuna nomeia o marco — e nada se herda');
  const semParametro = derivar('05', comMapa);
  const linha5 = (secao1(semParametro).split('\n').find((l) => l.indexOf('**Parâmetro de medição**') !== -1) || '');
  provar('a Aula 05 declara a lacuna, e a lacuna diz «o marco 5 desta aula»',
    /\[Preencher: parâmetro de medição da Aula 05/.test(linha5) && /marco 5/.test(linha5), linha5);
  provar('…e não imprime nenhum marco da matriz do ciclo', marcosNoParametro(semParametro).length === 0,
    marcosNoParametro(semParametro));

  /* ───────────────────────────────────────────── D. Sem escopo não se filtra (a bancada) */
  console.log('\nD. Sem escopo, a matriz inteira continua a sair');
  const marcos = planoDoCiclo.marcosEmTexto(
    require(path.join(base, 'motor/nucleo/derivar-po.js')).respostaDo(plano, 'marcos-por-aula'));
  const repertorio = require(path.join(base, 'motor/nucleo/derivar-po.js'))
    .respostaDo(plano, 'repertorio');
  const semEscopo = planoDoCiclo.parametroEmLinhas(
    plano.respostas['aula-1-parametro'].valor, marcos, repertorio);
  provar('a chamada de três argumentos devolve as três linhas do ciclo',
    semEscopo.length === 3, semEscopo.length);
  const comEscopo = planoDoCiclo.parametroEmLinhas(
    plano.respostas['aula-1-parametro'].valor, marcos, repertorio, [1]);
  provar('…e com o escopo devolve uma', comEscopo.length === 1, comEscopo);

  /* ───────────────────────────────────────────── E e F. A régua da turma, e não a do código */
  console.log('\nE. O §5 mede pela régua da turma');
  const niveis = plano.respostas.rubrica.valor;
  provar('o §5 nomeia os níveis DECLARADOS («' + niveis[0] + ' · …»)',
    niveis.every((n) => secao5(aula1).indexOf(n) !== -1), niveis);
  const comOutraRegua = JSON.parse(JSON.stringify(plano));
  comOutraRegua.respostas.rubrica.valor = ['Ainda não', 'Em processo', 'Alcançou'];
  const outra = derivar('01', comOutraRegua);
  provar('…e com outra régua no plano, é a outra que o §5 imprime',
    ['Ainda não', 'Em processo', 'Alcançou'].every((n) => secao5(outra).indexOf(n) !== -1)
      && secao5(outra).indexOf(niveis[0]) === -1, secao5(outra).slice(0, 200));

  console.log('\nF. A matriz morta não está em documento nenhum');
  for (const [nome, md] of [['aula 01', aula1], ['aula 02', aula2],
    ['captura 01', nucleo.derivarCaptura({ nn: '01', po, plano, contexto, calibracao: cal })],
    ['captura 02', nucleo.derivarCaptura({ nn: '02', po, plano, contexto, calibracao: cal })]]) {
    provar('a ' + nome + ' não diz «' + MARCA_MORTA + ' · ~ parcial · …»',
      md.indexOf(MARCA_MORTA) === -1, null);
    provar('…nem as outras três marcas soltas',
      !/~ parcial/.test(md) && !/X não aconteceu/.test(md) && !/\? não vi/.test(md), null);
  }

  /* ───────────────────────────────────────────── G. O que está em disco é o que o código produz */
  console.log('\nG. O ficheiro em disco é o que o código produz — e o §1 do publicado tem um marco');
  const emDisco = fs.readFileSync(path.join(RAIZ,
    'professores/demi-plie/ciclos/ciclo-01-breu-rosa-aula-01.md'), 'utf8');
  provar('o §1 do `.md` publicado imprime UM marco, o 1',
    marcosNoParametro(emDisco).join(',') === '1', marcosNoParametro(emDisco));
  provar('o §5 do `.md` publicado nomeia a régua da turma',
    niveis.every((n) => secao5(emDisco).indexOf(n) !== -1), null);
  provar('o §5 do `.md` publicado não tem a matriz morta', emDisco.indexOf(MARCA_MORTA) === -1, null);
  const html = fs.readFileSync(path.join(RAIZ,
    'professores/demi-plie/ciclos/ciclo-01-breu-rosa/aula-01.html'), 'utf8');
  const textoHtml = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  provar('o HTML do pacote diz o mesmo (um marco, a régua da turma)',
    /\*\*1\*\*/.test(textoHtml) === false && textoHtml.indexOf('nível da régua desta turma') !== -1
      && textoHtml.indexOf(MARCA_MORTA) === -1, null);

  if (base !== RAIZ) fs.rmSync(base, { recursive: true, force: true });

  console.log('');
  if (falhas) {
    console.log((contra ? 'CONTROLE: ' : '') + 'FALHARAM ' + falhas + ' de ' + total + ' asserções.');
    process.exit(1);
  }
  console.log((contra ? 'CONTROLE CONFORME — ' : 'TUDO CERTO — ') + total + ' asserções: cada aula '
    + 'imprime o marco que o plano lhe dá (e só esse, com o escopo declarado, sem inventar quando '
    + 'falta), e a §5 mede pela régua da turma em vez da matriz que o produto abandonou.');
})();
