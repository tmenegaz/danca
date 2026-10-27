#!/usr/bin/env node
'use strict';

/**
 * provar-bancadas-e-expurgo.js — O EXPURGO É UM ESTADO, E O SISTEMA TEM DE O LER (27/10/2026).
 *
 * O QUE ACONTECEU. A publicação das escolas passou a falhar em TODOS os deploys (run
 * `40492356457`, passo «Construir as bancadas de layout»). A causa aparente: não havia pacote de
 * ciclo gerado para as bancadas medirem. A causa real: o expurgo da `batata` — registado,
 * datado, com 76 ficheiros apagados — levou o único pacote que existia, e NADA no construtor
 * perguntou ao sistema o que se tinha passado. A primeira correção foi um `if` com uma frase
 * fixa («sem pacote de ciclo gerado»). A pesquisadora recusou-a, e a recusa estava certa:
 *
 *   «O registro do expurgo diz que aquilo não existe mais porque foi expurgado. E isso valida e
 *    evita o erro, e não colocar um hardcode ali que diz que não tem.»
 *
 * O QUE ESTA PROVA TRAVA:
 *
 *   1. O REGISTRO RESPONDE — `estadoDasEscolas()` lê `escola/<slug>/indice.json` e diz, para cada
 *      escola, se está viva ou expurgada e desde quando. Com os dados REAIS do repositório (a
 *      `batata` expurgada, a `breu` viva), e não com um fixture de fabrico.
 *   2. A ESCOLA DE UM PACOTE resolve-se pelo sufixo, com o `escolaDoSufixo` do índice — a mesma
 *      função que o acervo usa, e a mais longa ganha.
 *   3. PACOTE DE ESCOLA EXPURGADA É DESCONSIDERADO, e o motivo DIZ a data. O controle é
 *      diferencial e está na própria asserção: o mesmo caminho, com o mesmo código, é elegível
 *      quando o registro diz «viva» e não é quando diz «expurgada». Se a exclusão viesse de
 *      outra coisa que não o registro, o par não se separava.
 *   4. O CONSTRUTOR DAS BANCADAS NUNCA DERRUBA O DEPLOY — sai a zero, com ou sem pacote. Uma
 *      página de bancada não é razão para deixar uma escola sem publicar.
 *   5. `umPacote()` CONTINUA A FALHAR ALTO, e a mensagem passou a dizer o estado. A distinção
 *      importa: uma prova mede o real e tem de falhar sem ele; o deploy não.
 *
 *   uso: node experimentos/provar-bancadas-e-expurgo.js
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const L = require(path.join(RAIZ, 'experimentos/lib-pacote.js'));

let falhas = 0;
const provar = (nome, ok, detalhe) => {
  console.log('  ' + (ok ? 'ok    ' : 'FALHOU') + ' ' + nome
    + (ok ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

console.log('\n1. O registro do expurgo responde — e com os dados reais do repositório');
/* SEM FIXTURE. Se esta seção usasse um índice inventado, ela provaria que eu sei escrever um
   `Map`. O que se mede é que o repositório, como está, se explica. A `batata` foi expurgada em
   27/10/2026 e a `breu` foi recriada depois do seu último expurgo — as duas coisas estão no
   `escola/<slug>/indice.json` versionado (um por escola), e é de lá que a resposta sai.
   NOTA DE BANCADA, e ela custou duas tentativas: a primeira redação escrevia o caminho com um
   asterisco no meio (a forma que casa com qualquer slug), e as duas letras que FECHAM um
   comentário apareceram dentro dele. O comentário terminou a meio da linha, o resto virou
   código, e o erro do Node apontou quatro linhas abaixo do sítio. Ao corrigir, escrevi a
   explicação a citar as tais duas letras — e fechei o comentário outra vez, no mesmo parágrafo
   que o estava a explicar. É a mesma família do template literal que não fechava (26/10). */
const registro = L.estadoDasEscolas();
provar('o registro tem escolas', registro.size > 0, registro.size);
const batata = registro.get('batata');
provar('a `batata` consta, e está EXPURGADA', !!batata && batata.viva === false, batata);
provar('…e a data do expurgo é a de 27/10/2026',
  !!batata && batata.ultimo_expurgo === '2026-10-27', batata && batata.ultimo_expurgo);
provar('…e ele conta os expurgos, em vez de dizer só «existe»',
  !!batata && batata.expurgos >= 5, batata && batata.expurgos);
const breu = registro.get('breu');
provar('a `breu` consta, e está VIVA (expurgada e recriada depois)',
  !!breu && breu.viva === true, breu);
provar('…apesar de já ter sido expurgada antes — a recriação é posterior',
  !!breu && breu.expurgos >= 2, breu && breu.expurgos);

console.log('\n2. A escola de um pacote resolve-se pelo sufixo');
/* O CAMINHO NÃO DIZ A ESCOLA: a pasta é `ciclo-01-<variante>`, e a variante pode ser composta
   (`batata-bale-nivel-2-teste-2`). Quem sabe é o `escolaDoSufixo` do índice. */
provar('`ciclo-01-batata-bale-nivel-2-teste-2` é da `batata`',
  L.escolaDoPacote('professores/cafe-no-bule/ciclos/ciclo-01-batata-bale-nivel-2-teste-2')
  === 'batata');
provar('`ciclo-01-breu` é da `breu`',
  L.escolaDoPacote('professores/luz-azul/ciclos/ciclo-01-breu') === 'breu');
provar('o slug MAIS LONGO ganha (uma escola cujo nome é prefixo de outra não a rouba)',
  L.escolaDoPacote('ciclo-01-alvo-teste-1', ['alvo', 'alvo-teste-1']) === 'alvo-teste-1',
  L.escolaDoPacote('ciclo-01-alvo-teste-1', ['alvo', 'alvo-teste-1']));

console.log('\n3. Pacote de escola expurgada é DESCONSIDERADO — e o motivo diz a data');
const caminhoDaBatata = 'professores/cafe-no-bule/ciclos/ciclo-01-batata-bale-nivel-2-teste-2';
/* O CONTROLE É DIFERENCIAL, e é ele que prova que a exclusão vem DO REGISTRO: o mesmo caminho,
   passado ao mesmo código, é elegível com um registro que a diz viva. Se a exclusão viesse de
   outra coisa (o caminho, o nome, um `if`), os dois lados dariam o mesmo. */
const comoExpurgada = L.pacoteElegivel(caminhoDaBatata, registro);
const registroVivo = new Map([['batata', { slug: 'batata', viva: true, expurgos: 5, ultimo_expurgo: '2026-10-27' }]]);
const comoViva = L.pacoteElegivel(caminhoDaBatata, registroVivo);
provar('com o registro a dizer «expurgada», o pacote NÃO é elegível',
  comoExpurgada.elegivel === false, comoExpurgada);
provar('…e o motivo nomeia a escola E a data',
  comoExpurgada.escola === 'batata' && /2026-10-27/.test(comoExpurgada.motivo), comoExpurgada);
provar('com o MESMO caminho e o registro a dizer «viva», é elegível',
  comoViva.elegivel === true, comoViva);
provar('escola fora do registro não é excluída (o lado permissivo)',
  L.pacoteElegivel('professores/x/ciclos/ciclo-01-escola-que-nao-existe').elegivel === true);
const pacotesUsaveis = L.pacotes();
provar('nenhum pacote usável é de escola expurgada',
  pacotesUsaveis.every((p) => {
    const e = L.escolaDoPacote(p);
    return !e || !registro.get(e) || registro.get(e).viva;
  }), pacotesUsaveis);

console.log('\n4. O construtor das bancadas nunca derruba o deploy');
/* MEDIDO A SÉRIO: corre-se o construtor e olha-se para o código de saída. O passo do
   `deploy-escolas.yml` corre com `set -euo pipefail`; um `1` aqui é uma escola sem publicar. */
const executar = () => {
  const r = spawnSync(process.execPath, [path.join(RAIZ, 'experimentos/propostas/construir.js')],
    { cwd: RAIZ, encoding: 'utf8' });
  /* O `spawnSync`, e não o `execFileSync`: a explicação vai para o `stderr` (é um aviso, não um
     resultado), e o `execFileSync` só devolve o `stdout` quando o comando corre bem — a primeira
     versão desta prova mediu a string vazia e reprovou a mensagem que estava a ser escrita. */
  return { codigo: r.status === null ? -1 : r.status,
    texto: String((r.stdout || '') + (r.stderr || '')) };
};
const corrida = executar();
provar('o construtor sai a zero', corrida.codigo === 0, corrida.codigo);
/* A MENSAGEM É O ESTADO, NÃO UMA FRASE FIXA. Sem pacote, ela tem de dizer quantas escolas estão
   vivas e quais foram expurgadas — senão voltámos ao `if` que a pesquisadora recusou. */
if (!pacotesUsaveis.length) {
  provar('sem pacote, a mensagem diz quais escolas estão vivas',
    /escolas vivas:/.test(corrida.texto), corrida.texto.slice(0, 300));
  provar('sem pacote, a mensagem nomeia o expurgo, com data',
    /por expurgo:/.test(corrida.texto) && /\d{4}-\d{2}-\d{2}/.test(corrida.texto),
    corrida.texto.slice(0, 400));
  provar('sem pacote, as páginas de ontem são apagadas (o local concorda com o CI)',
    !fs.existsSync(path.join(RAIZ, 'experimentos/propostas/proposta-titulo.html')));
}

console.log('\n5. `umPacote()` continua a falhar alto — para as provas, que medem o real');
/* A DISTINÇÃO QUE SE MANTÉM. Um deploy degrada; uma prova não. Se esta asserção passasse a
   significar «devolve null em silêncio», uma prova mediria o vazio e diria «TUDO CERTO». */
if (!pacotesUsaveis.length) {
  let lancou = null;
  try { L.umPacote(); } catch (e) { lancou = e; }
  provar('sem pacote usável, `umPacote()` lança', !!lancou);
  provar('…e a mensagem diz o estado, não só que falta',
    !!lancou && /escolas vivas:/.test(lancou.message), lancou && lancou.message);
  provar('…e nomeia o remédio', !!lancou && /gerar-ciclo\.sh/.test(lancou.message));
} else {
  provar('há pacote usável: `umPacote()` devolve-o', !!L.umPacote());
}

const total = 18 + (pacotesUsaveis.length ? 0 : 3);
console.log('\n' + (falhas ? 'FALHOU — ' + falhas + ' de ' + total + ' asserções'
  : 'TUDO CERTO — ' + total + ' asserção(ões), 0 falha(s)') + '.');
process.exit(falhas ? 1 : 0);
