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
let total = 0;
const provar = (nome, ok, detalhe) => {
  total += 1;
  console.log('  ' + (ok ? 'ok    ' : 'FALHOU') + ' ' + nome
    + (ok ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

console.log('\n1. O registro do expurgo responde — e com os dados reais do repositório');
/* NENHUMA ESCOLA É NOMEADA AQUI, E É DE PROPÓSITO (27/10/2026).
 *
 * A primeira versão desta seção afirmava «a `batata` está expurgada» e «a `breu` está viva». Com
 * os dados de hoje as duas eram verdade — e as duas eram armadilhas: a pesquisadora expurga e
 * recria as escolas de teste VÁRIAS VEZES por sessão («enquanto eu tô testando, eu ainda vou
 * criar mais breu, mais batata, mais calango, e vou expurgar várias vezes»). No dia em que ela
 * expurgasse a `breu`, esta prova reprovaria — e o alarme seria falso, sobre uma prova que existe
 * exactamente para acabar com alarmes falsos.
 *
 * O que se mede é a FORMA do registro e a REGRA sobre ele, com os sujeitos tirados do próprio
 * registro. O caso que motivou tudo (a `batata`, expurgada em 27/10 com 5 expurgos) fica escrito
 * aqui, como história; o que a prova afirma é sobre o que o repositório disser hoje. */
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
provar('…e cada entrada tem a forma declarada (slug, viva, expurgos, ultimo_expurgo)',
  [...registro.values()].every((e) => typeof e.slug === 'string' && typeof e.viva === 'boolean'
    && typeof e.expurgos === 'number' && 'ultimo_expurgo' in e),
  [...registro.values()].slice(0, 2));

const purgadas = [...registro.values()].filter((e) => !e.viva && e.expurgos > 0);
const recriadas = [...registro.values()].filter((e) => e.viva && e.expurgos > 0);

provar('há pelo menos uma escola registada como EXPURGADA', purgadas.length > 0,
  purgadas.map((e) => e.slug));
provar('…e cada uma traz a DATA do expurgo, e não só o estado',
  purgadas.every((e) => /^\d{4}-\d{2}-\d{2}$/.test(String(e.ultimo_expurgo || ''))),
  purgadas.map((e) => e.slug + '=' + e.ultimo_expurgo));
provar('…e o NÚMERO de expurgos, porque há escolas expurgadas e recriadas várias vezes',
  purgadas.every((e) => e.expurgos >= 1), purgadas.map((e) => e.slug + '=' + e.expurgos));

/* A OUTRA METADE DA REGRA, no repositório real: uma escola com expurgo no passado e recriação
   depois está VIVA. Este é o caso `foiRecriada` a acontecer fora da prova que o define — se ele
   não existir no repositório hoje, diz-se, em vez de se inventar um sujeito. */
if (recriadas.length) {
  provar('uma escola EXPURGADA e RECRIADA depois conta como viva',
    recriadas.every((e) => e.viva === true), recriadas.map((e) => e.slug + '/' + e.expurgos));
} else {
  provar('hoje não há escola expurgada-e-recriada no repositório (não se inventa o caso)',
    true, null);
}

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
/* O SUJEITO VEM DO REGISTRO, não de uma escola escrita à mão: a primeira expurgada que houver.
   O caminho tem a FORMA de um pacote real (`ciclo-NN-<variante>`, com a variante a começar pelo
   slug) — é o que basta, porque o que se mede é a decisão sobre o caminho, não os ficheiros. */
const escolaPurgada = purgadas[0];
const caminhoDaBatata = escolaPurgada
  ? 'professores/exemplo/ciclos/ciclo-01-' + escolaPurgada.slug + '-bale-nivel-2-teste-2'
  : 'professores/exemplo/ciclos/ciclo-01-escola-expurgada';
/* O CONTROLE É DIFERENCIAL, e é ele que prova que a exclusão vem DO REGISTRO: o mesmo caminho,
   passado ao mesmo código, é elegível com um registro que a diz viva. Se a exclusão viesse de
   outra coisa (o caminho, o nome, um `if`), os dois lados dariam o mesmo. */
const comoExpurgada = L.pacoteElegivel(caminhoDaBatata, registro);
const registroVivo = new Map([[(escolaPurgada && escolaPurgada.slug) || 'escola-expurgada',
  { slug: (escolaPurgada && escolaPurgada.slug) || 'escola-expurgada', viva: true,
    expurgos: 1, ultimo_expurgo: '2026-01-01' }]]);
const comoViva = L.pacoteElegivel(caminhoDaBatata, registroVivo);
provar('com o registro a dizer «expurgada», o pacote NÃO é elegível',
  comoExpurgada.elegivel === false, comoExpurgada);
provar('…e o motivo nomeia a escola E a data',
  !!escolaPurgada && comoExpurgada.escola === escolaPurgada.slug
  && comoExpurgada.motivo.indexOf(String(escolaPurgada.ultimo_expurgo)) !== -1, comoExpurgada);
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

console.log('\n' + (falhas ? 'FALHOU — ' + falhas + ' de ' + total + ' asserções'
  : 'TUDO CERTO — ' + total + ' asserção(ões), 0 falha(s)') + '.');
process.exit(falhas ? 1 : 0);
