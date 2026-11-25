#!/usr/bin/env node
'use strict';

/**
 * provar-o-mapa-das-provas.js — o `correr-provas` vê as provas que citam o módulo (25/11/2026).
 *
 * O QUE ACONTECEU. Muitas provas escrevem o `require` assim:
 *
 *     require(path.join(RAIZ, 'motor', 'nucleo', 'derivar-ciclo.js'))
 *
 * e nesse texto a cadeia `motor/nucleo/derivar-ciclo.js` **não existe** — existe
 * `motor', 'nucleo', 'derivar-ciclo.js'`. O `correr-provas` procurava a referência literal, não a
 * encontrava, e a prova ficava **invisível exactamente para o módulo que ela mede**. Medido a
 * 25/11/2026: `provar-notacao` não era corrida quando se mexia no `derivar-ciclo.js`, e estava
 * vermelha desde 18/11 sem ninguém saber — porque também não estava versionada.
 *
 * PORQUE É QUE ESTA PROVA EXISTE, e não basta corrigir a função. O mapa «que ficheiro acorda que
 * prova» é a única coisa que torna o `pre-commit` possível numa árvore de 292 provas: se ele
 * falhar em silêncio, o `pre-commit` passa a ser um carimbo. Um mapa que não se mede é uma
 * afirmação sobre si mesmo — e é a mesma família de erro do `provar-ambiente` que imprimia
 * «TUDO CERTO — 0 escola(s)» sem medir escola nenhuma.
 *
 * O QUE SE MEDE, e o segundo par é o que a torna útil:
 *
 *   §A o caso que falhou: `provar-notacao` é seleccionada quando `motor/nucleo/derivar-ciclo.js`
 *      muda — e ela cita-o em `path.join`, que é a forma que o mapa não lia;
 *   §B CONTROLOS NEGATIVOS: um caminho que ninguém cita não selecciona ninguém (o mapa não é
 *      «seleccionar tudo»), e um módulo citado por UMA prova não selecciona as outras (o mapa não
 *      é «seleccionar nada»);
 *   §C a forma antiga continua a valer: a comparação pelo FIM do caminho (`motor/servidor/raiz.js`
 *      casa com `../motor/servidor/raiz.js`), e o próprio caminho da prova conta;
 *   §D o recorte é DETERMINÍSTICO e não depende da ordem dos argumentos.
 *
 * COMO SE MEDE. Pelo `--listar` do próprio corredor, que imprime o recorte e não corre nada — e é
 * por isso que ele existe. Uma prova que reimplementasse o mapa mediria a reimplementação.
 *
 *   node experimentos/provar-o-mapa-das-provas.js
 */

const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const CORREDOR = path.join(RAIZ, 'tools', 'correr-provas.js');

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/** O recorte do corredor para um caminho: a lista de provas, sem a linha de resumo. */
function recorte(caminho) {
  const saida = execFileSync(process.execPath, [CORREDOR, '--mudou=' + caminho, '--listar'],
    { cwd: RAIZ, encoding: 'utf8' });
  return saida.split('\n')
    .filter((l) => l && !/^correr-provas:/.test(l))
    .map((l) => path.basename(l.trim(), '.js'));
}

/* ── §A o caso que falhou ───────────────────────────────────────────────────────────────────── */

console.log('\n§A a prova que cita em `path.join` é vista');

const comDerivador = recorte('motor/nucleo/derivar-ciclo.js');
provar('o recorte do `derivar-ciclo.js` não está vazio', comDerivador.length > 3, comDerivador.length);
provar('`provar-notacao` entra — ela cita-o em `path.join(RAIZ, …)`',
  comDerivador.indexOf('provar-notacao') !== -1, comDerivador.slice(0, 8));
provar('e `provar-a-descricao-do-exercicio`, que também o cita', comDerivador.indexOf('provar-a-descricao-do-exercicio') !== -1);
provar('e `provar-derivador-da-aula`, que o cita pelo caminho literal',
  comDerivador.indexOf('provar-derivador-da-aula') !== -1);
provar('sem repetições — o recorte é um conjunto',
  new Set(comDerivador).size === comDerivador.length, comDerivador.length);

/* ── §B os controlos negativos ─────────────────────────────────────────────────────────────── */

console.log('\n§B o mapa não selecciona tudo, nem nada');

/* O NOME DO CONTROLO NÃO PODE APARECER INTEIRO NESTE FICHEIRO (25/11/2026). À primeira escrita
 * era um literal — e o próprio `provar-o-mapa-das-provas` passou a citá-lo, logo a seleccionar-se
 * a si mesmo: o controlo negativo media o contrário do que dizia. Compõe-se o nome com uma parte
 * que só existe em tempo de execução, e assim nenhum texto deste ficheiro contém o caminho. */
const SEM_DONO = 'motor/nucleo/sem-dono-' + String(1000 + 1026) + '.js';
const inexistente = recorte(SEM_DONO);
provar('um caminho que ninguém cita não selecciona prova nenhuma', inexistente.length === 0,
  { caminho: SEM_DONO, achou: inexistente });

const umSo = recorte('motor/nucleo/cotas.js');
provar('um módulo citado por uma prova selecciona-a (e não as 292)',
  umSo.indexOf('provar-a-escola-em-consultoria') !== -1 && umSo.length < 6,
  { achou: umSo.indexOf('provar-a-escola-em-consultoria') !== -1, quantas: umSo.length });

/* ── §C a forma antiga continua a valer ───────────────────────────────────────────────────── */

console.log('\n§C as formas antigas de citar continuam a casar');

const comRaiz = recorte('motor/servidor/raiz.js');
provar('`motor/servidor/raiz.js` continua a seleccionar quem o cita por caminho relativo',
  comRaiz.length > 5, comRaiz.length);
provar('e a comparação pelo FIM do caminho não trouxe o mundo inteiro',
  comRaiz.length < 60, comRaiz.length);

// O PRÓPRIO CAMINHO DA PROVA CONTA: mudar uma prova corre-a.
const propria = recorte('experimentos/provar-o-mapa-das-provas.js');
provar('mudar a própria prova selecciona-a', propria.indexOf('provar-o-mapa-das-provas') !== -1, propria);

/* ── §D o recorte é determinístico ─────────────────────────────────────────────────────────── */

console.log('\n§D o recorte não depende da ordem dos argumentos, nem da corrida');

const dois = execFileSync(process.execPath,
  [CORREDOR, '--mudou=motor/nucleo/notacao.js', '--mudou=motor/nucleo/derivar-ciclo.js', '--listar'],
  { cwd: RAIZ, encoding: 'utf8' }).split('\n').filter((l) => l && !/^correr-provas:/.test(l))
  .map((l) => path.basename(l.trim(), '.js'));
const doisInvertido = execFileSync(process.execPath,
  [CORREDOR, '--mudou=motor/nucleo/derivar-ciclo.js', '--mudou=motor/nucleo/notacao.js', '--listar'],
  { cwd: RAIZ, encoding: 'utf8' }).split('\n').filter((l) => l && !/^correr-provas:/.test(l))
  .map((l) => path.basename(l.trim(), '.js'));
provar('dois caminhos dão o mesmo recorte em qualquer ordem',
  JSON.stringify(dois) === JSON.stringify(doisInvertido), { um: dois.length, outro: doisInvertido.length });
/* A UNIÃO CONTÉM OS DOIS RECORTES — e é isso que se mede, não «é maior do que cada um»: se todas
 * as provas do `notacao.js` já estiverem no recorte do `derivador`, a união é IGUAL ao maior, e
 * uma asserção de «maior» reprovaria um mapa que está certo. */
const soNotacao = recorte('motor/nucleo/notacao.js');
provar('a união contém os dois recortes, sem perder nenhum',
  soNotacao.every((p) => dois.indexOf(p) !== -1) && comDerivador.every((p) => dois.indexOf(p) !== -1),
  { uniao: dois.length, notacao: soNotacao.length, derivador: comDerivador.length });
provar('e é pelo menos tão grande como o maior deles',
  dois.length >= Math.max(soNotacao.length, comDerivador.length), dois.length);
provar('`provar-notacao` aparece pelos dois motivos: cita a notação E o derivador',
  dois.indexOf('provar-notacao') !== -1
  && recorte('motor/nucleo/notacao.js').indexOf('provar-notacao') !== -1);

/* ── o resumo ───────────────────────────────────────────────────────────────────────────────── */

console.log('\n' + provas + ' asserções, ' + (provas - falhas) + ' ok, ' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
