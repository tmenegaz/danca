#!/usr/bin/env node
'use strict';

/**
 * provar-a-descricao-do-exercicio.js — a definição do dicionário é do EXERCÍCIO, o «Lê-se» é da
 * CÉLULA (25/11/2026).
 *
 * O DEFEITO, lido por ela em `piano/aula-01`:
 *
 *   «No battement jeté […] a descrição é o que se lê […] eu tenho a descrição fora, e depois a
 *   tabela. Aqui que é o diferente, no plié: eu tenho a descrição que seria do lado de fora, dentro
 *   da tabela. […] Flexão contínua e fluida dos joelhos. Isso aqui é a descrição do dicionário, do
 *   verbete. E depois lá no final, ainda nessa mesma linha da coluna descrição da tabela, tem
 *   `Lê-se: perna, varredura para fora, primeira posição`. Isso está errado.»
 *
 * A CAUSA não era o dado nem o `partirDescricao`: o verbete do Plié cobre os 4 tempos com **uma**
 * célula de `repeticoes: 2`, e compõe **um** segmento — enquanto o jeté, o `tendu` e o Relevé
 * compõem **dois**. A condição de subida era `segmentos.length > 1`, posta pelo motivo certo («se
 * não se repete, não há repetição a tirar») e a produzir o resultado errado: **o desenho do bloco
 * passava a depender de quantas linhas o verbete por acaso tem.**
 *
 * O QUE ESTA PROVA FIXA — e é a segunda metade que a torna útil:
 *
 *   §A o Plié, o caso dela, ao minuto: a definição em cima, a célula a começar por «Lê-se:»;
 *   §B a consistência: o desenho NÃO depende do número de linhas — 1, 2 ou 4 segmentos dão a mesma
 *      forma de bloco;
 *   §C o documento publicado não tem uma única célula com a definição dentro (« — Lê-se:» é proibido);
 *   §D CONTROLO NEGATIVO 1: duas células com texto fixo DIFERENTE não sobem — e ficam onde estão,
 *      porque ali a descrição é daquela célula;
 *   §E CONTROLO NEGATIVO 2: um exercício sem «Lê-se» nenhum não sobe — a célula ficaria com um
 *      travessão e a única informação útil teria saído de lá.
 *
 * Sem o §D e o §E esta prova passaria com a regra trocada: bastava subir sempre.
 *
 *   node experimentos/provar-a-descricao-do-exercicio.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const derivar = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));
const notacao = require(path.join(RAIZ, 'motor/nucleo/notacao.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const CONTEXTO = { escola: 'breu', escolaNome: 'Breu', professor: 'demi-plie', ciclo: '01' };
const r = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });
const linha = (bloco, exercicio, tempos, compasso) => ({
  'Bloco': bloco,
  'Objetivo específico': '1 — transferir o peso entre os pés sem perder o alinhamento',
  'Conteúdo do nível': exercicio,
  'Tempos': tempos,
  'Compasso': compasso,
});

/** Um plano mínimo com a sequência pedida. A notação é a do ciclo (o núcleo devolve a constante). */
function planoCom(linhas) {
  return {
    id: 'plano-da-prova',
    fonte: 'plano',
    contexto: CONTEXTO,
    respostas: { 'aula-1-sequencia': r(linhas) },
  };
}

/**
 * PARTE O DOCUMENTO EM BLOCOS DE EXERCÍCIO, e é esta a unidade que se lê: um bloco é o `###` com a
 * legenda, o `> **Descrição.**` (quando existe) e a tabela. A prova julga a FORMA do bloco, e não
 * uma linha solta — que é o que a leitura dela também faz.
 */
function blocos(md) {
  const saida = [];
  let atual = null;
  for (const l of String(md || '').split('\n')) {
    if (/^### \d+\. /.test(l)) {
      atual = { titulo: l.replace(/^### /, ''), descricao: null, linhas: [] };
      saida.push(atual);
      continue;
    }
    if (!atual) continue;
    if (/^> \*\*Descrição\.\*\*/.test(l)) { atual.descricao = l.replace(/^> \*\*Descrição\.\*\* /, ''); continue; }
    if (/^\| \d/.test(l)) atual.linhas.push(l);
    else if (atual.linhas.length && !/^\|/.test(l)) atual.linhas.fechado = true;
  }
  return saida;
}

/* ── §A o caso dela, ao minuto ──────────────────────────────────────────────────────────────── */

console.log('\n§A o Plié — a definição em cima, e a célula com o «Lê-se»');

const doPlié = derivar.derivarNotacao({ plano: planoCom([linha('Barra', 'Plié', '4', '2/4')]), contexto: CONTEXTO });
const blocoPlié = blocos(doPlié)[0];
provar('o bloco do Plié existe', Boolean(blocoPlié), doPlié && doPlié.slice(0, 80));
provar('tem UM segmento — é o que distinguia este caso dos outros',
  blocoPlié && blocoPlié.linhas.length === 1, blocoPlié && blocoPlié.linhas.length);
provar('a definição do verbete está ACIMA da tabela',
  Boolean(blocoPlié && blocoPlié.descricao && /^Flexão contínua e fluida dos joelhos/.test(blocoPlié.descricao)),
  blocoPlié && blocoPlié.descricao && blocoPlié.descricao.slice(0, 60));
provar('e a célula começa por «Lê-se:»',
  Boolean(blocoPlié && /\| Lê-se: /.test(blocoPlié.linhas[0])), blocoPlié && blocoPlié.linhas[0]);
provar('a célula já não repete a definição',
  Boolean(blocoPlié && blocoPlié.linhas[0].indexOf('Flexão contínua') === -1), blocoPlié && blocoPlié.linhas[0]);
provar('e não há travessão a colar as duas coisas',
  Boolean(blocoPlié && blocoPlié.linhas[0].indexOf('— Lê-se:') === -1), blocoPlié && blocoPlié.linhas[0]);

/* ── §B o desenho não depende do número de linhas ──────────────────────────────────────────── */

console.log('\n§B o desenho do bloco é o mesmo com 1, 2 ou 4 segmentos');

const comVarios = derivar.derivarNotacao({
  plano: planoCom([
    linha('Solo', 'Plié', '4', '2/4'),
    linha('Barra', 'Battement tendu', '8', '2/4'),
    linha('Centro', 'Relevé', '8', '2/4'),
    linha('Expressão', 'Battement jeté', '8', '2/4'),
  ]),
  contexto: CONTEXTO,
});
const todos = blocos(comVarios);
provar('os quatro exercícios compõem', todos.length === 4, todos.map((b) => b.titulo));
// O título traz a âncora (`{#solo-plie-ob1}`) e a chave da prova é só o nome do exercício.
const nomeDoBloco = (b) => b.titulo.split(' — ').pop().replace(/\s*\{#.*$/, '').trim();
const formas = new Map(todos.map((b) => [nomeDoBloco(b), { sobe: Boolean(b.descricao), n: b.linhas.length }]));
console.log('        ' + JSON.stringify([...formas]));
provar('TODOS subiram a definição — 1 segmento não é um caso à parte',
  todos.every((b) => Boolean(b.descricao)), [...formas]);
provar('e todos têm célula a começar por «Lê-se:»',
  todos.every((b) => b.linhas.length > 0 && b.linhas.every((l) => /\| Lê-se: /.test(l))),
  todos.map((b) => b.linhas[0]).slice(0, 2));
provar('o Plié (1 linha) e o Battement tendu (2 linhas) têm a MESMA forma de bloco',
  formas.get('Plié').sobe === formas.get('Battement tendu').sobe
  && formas.get('Plié').n === 1 && formas.get('Battement tendu').n === 2, [...formas]);

/* ── §C o documento publicado ───────────────────────────────────────────────────────────────── */

console.log('\n§C o documento gerado não tem a definição dentro de uma célula');

const NOTACAO = 'professores/demi-plie/ciclos/ciclo-01-breu-piano-notacao.md';
const publicado = fs.readFileSync(path.join(RAIZ, NOTACAO), 'utf8');
provar('o documento existe e é o do ciclo do breu', publicado.length > 2000, publicado.length);
provar('nenhuma célula cola a definição ao «Lê-se»', publicado.indexOf('— Lê-se:') === -1,
  (publicado.match(/^.*— Lê-se:.*$/gm) || []).slice(0, 2));
const blocosPublicados = blocos(publicado);
provar('o documento tem 16 blocos de exercício', blocosPublicados.length === 16, blocosPublicados.length);
provar('e TODOS subiram a definição', blocosPublicados.every((b) => Boolean(b.descricao)),
  blocosPublicados.filter((b) => !b.descricao).map((b) => b.titulo));
provar('todos os blocos com segmentos têm «Lê-se» em todas as células',
  blocosPublicados.filter((b) => b.linhas.length).every((b) => b.linhas.every((l) => /\| Lê-se: /.test(l))),
  blocosPublicados.filter((b) => b.linhas.some((l) => !/\| Lê-se: /.test(l))).map((b) => b.titulo));
provar('e os quatro blocos do Plié têm os seus «Lê-se» — o do breu, não o do catálogo partilhado',
  blocosPublicados.filter((b) => nomeDoBloco(b) === 'Plié').every((b) => /cede, sobe, varredura para fora\./.test(b.linhas[0])),
  blocosPublicados.filter((b) => nomeDoBloco(b) === 'Plié').map((b) => b.linhas[0]));

/* ── §D e §E os controlos negativos ─────────────────────────────────────────────────────────── */

console.log('\n§D e §E — a regra não é «subir sempre»');

/* Os dois controlos precisam de verbetes que o catálogo real não tem, e a única porta é o alfabeto
 * que o módulo carrega. Injeta-se, mede-se, repõe-se — no mesmo processo, sem tocar em ficheiro. */
const alfabeto = notacao.paraNotacao('Código de dança');
provar('o alfabeto do ciclo está carregado', Boolean(alfabeto && alfabeto.verbetes), alfabeto && alfabeto.id);
const NOME_D = 'Prova da descrição D';
const NOME_E = 'Prova da descrição E';
// Guarda-se pelo NOME COMPLETO: uma chave curta aqui apagaria `verbetes['D']`, que não existe, e a
// prova deixaria lixo no catálogo a dizer que o limpou.
const guardados = { [NOME_D]: alfabeto.verbetes[NOME_D], [NOME_E]: alfabeto.verbetes[NOME_E] };
const celula = (contagem, sinais, descricao, repeticoes) => ({ contagem, categoria: 'Perna', sinais, descricao,
  ...(repeticoes ? { repeticoes } : {}) });
try {
  // D: duas células, texto fixo DIFERENTE — a descrição é de cada célula e não sobe.
  alfabeto.verbetes[NOME_D] = {
    '4|2/4': { cobre: 4, posicao: null, metodo: 'compartilhada', celulas: { '': [
      celula('1–2', ['ED', '1ª'], 'Extensão à frente, a ponta no chão.\nLê-se: Perna, varredura para fora, abre.'),
      celula('3–4', ['ED', '1ª'], 'Retorno à primeira posição, o calcanhar conduz.\nLê-se: Perna, fecha, primeira posição.'),
    ] } },
  };
  const mdD = derivar.derivarNotacao({ plano: planoCom([linha('Barra', 'Prova da descrição D', '4', '2/4')]), contexto: CONTEXTO });
  const blocoD = blocos(mdD)[0];
  provar('com dois textos fixos diferentes o bloco compõe', Boolean(blocoD && blocoD.linhas.length === 2),
    blocoD && blocoD.linhas.length);
  provar('NÃO sobe — não há uma parte fixa, há duas',
    Boolean(blocoD && !blocoD.descricao), blocoD && blocoD.descricao);
  provar('cada célula fica com o seu texto, que é onde ele é daquela célula',
    Boolean(blocoD && /Extensão à frente/.test(blocoD.linhas[0]) && /Retorno à primeira posição/.test(blocoD.linhas[1])),
    blocoD && blocoD.linhas);

  // E: uma célula só, sem «Lê-se» nenhum — subir deixaria a célula com um travessão.
  // Uma célula só, e `repeticoes: 2` para ela cobrir os 4 tempos — é a forma do Plié. O que falta
  // aqui é o «Lê-se», e é isso que a prova mede.
  alfabeto.verbetes[NOME_E] = {
    '4|2/4': { cobre: 4, posicao: null, metodo: 'compartilhada', celulas: { '': [
      celula('1–2', ['ED', '1ª'], 'Só a definição, sem leitura por célula.', 2),
    ] } },
  };
  const mdE = derivar.derivarNotacao({ plano: planoCom([linha('Barra', 'Prova da descrição E', '4', '2/4')]), contexto: CONTEXTO });
  const blocoE = blocos(mdE)[0];
  provar('sem «Lê-se» o bloco compõe', Boolean(blocoE && blocoE.linhas.length === 1), blocoE && blocoE.linhas);
  provar('NÃO sobe — a célula ficaria com um travessão e a descrição sairia de lá',
    Boolean(blocoE && !blocoE.descricao), blocoE && blocoE.descricao);
  provar('e a definição continua na célula, onde estava',
    Boolean(blocoE && /Só a definição, sem leitura por célula\./.test(blocoE.linhas[0])), blocoE && blocoE.linhas[0]);
  provar('sem travessão inventado', Boolean(blocoE && blocoE.linhas[0].indexOf('—') === -1), blocoE && blocoE.linhas[0]);
} finally {
  for (const [k, v] of Object.entries(guardados)) {
    if (v === undefined) delete alfabeto.verbetes[k];
    else alfabeto.verbetes[k] = v;
  }
}
provar('o alfabeto ficou como estava — a prova não deixa lixo no catálogo',
  alfabeto.verbetes[NOME_D] === undefined && alfabeto.verbetes[NOME_E] === undefined,
  Object.keys(alfabeto.verbetes).length);

/* ── o resumo ───────────────────────────────────────────────────────────────────────────────── */

console.log('\n' + provas + ' asserções, ' + (provas - falhas) + ' ok, ' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
