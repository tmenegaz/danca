#!/usr/bin/env node
'use strict';

/**
 * provar-elenco-derivado.js — quem é a turma, nos três sítios que a declaram.
 *
 * O PEDIDO DELA (06/11/2026), e é um defeito medido no pacote publicado:
 *
 *   «Acionando agora aqui o documento lançamento de aula, aqui diz que tem presentes aluno A, B e
 *    C. Não é verdade. Se a gente olhar a nossa aula, a gente sabe que não tem no elenco não tem o
 *    aluno C.»
 *
 * A TURMA TEM DUAS ALUNAS, E TRÊS DOCUMENTOS DIZIAM TRÊS. A linha de base da turma fixa o elenco
 * no acto do passo 2 — duas. O PO declarava três, herdados de um envelope anterior à regra, e cada
 * derivador lia o PO por sua conta:
 *
 *   · `derivarPO` — CORRIGIDO em 06/11/2026, quando a §6 da Aula 01 passou a usar o elenco da
 *     linha de base (`polvo-elenco-do-acto`);
 *   · `derivarDados` — de onde o FORMULÁRIO tira os «Presentes»: continuava a ler o PO;
 *   · `derivarCaptura` — de onde a FOLHA tira as linhas das tabelas e o formulário as colunas:
 *     continuava a ler o PO.
 *
 * O que se prova aqui:
 *
 *   A. o `-dados.json`: `apelidos` é o elenco da linha de base, e nenhuma aluna a mais;
 *   B. a folha de captura: as linhas das tabelas e a linha dos «Presentes» são o mesmo elenco;
 *   C. a reserva: sem linha de base, os dois continuam a derivar do PO (um ciclo antigo não parte);
 *   D. o elenco de UMA aluna não é confundido com «sem elenco» — o `[0]` de uma lista de um é a
 *      aluna, e não a ausência dela;
 *   E. o pacote gerado: o `captura-01.json` extraído da folha, e a cópia de dados do pacote.
 *
 *   node experimentos/provar-elenco-derivado.js
 */

const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const { derivarDados, derivarCaptura } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* O PO DECLARA TRÊS DE PROPÓSITO — é a diferença que mede o filtro. A turma tem duas. */
const PO = {
  id: 'po-da-prova',
  contexto: { escola: 'prova', professor: 'prova', ciclo: '01' },
  respostas: {
    sujeitos: { valor: ['Aluna A', 'Aluna B', 'Aluna C'] },
    'dimensoes-de-observacao': { valor: ['Barra', 'Musicalidade'] },
    question: { valor: 'o que se observa' },
    'objetivo-geral': { valor: 'consolidar o alinhamento' },
  },
};
const PLANO = {
  id: 'plano-da-prova',
  contexto: { escola: 'prova', professor: 'prova', ciclo: '01', turma: 'Turma de Prova' },
  respostas: {
    'contexto-turma': { valor: 'Turma de Prova' },
    'marcos-por-aula': { valor: ['reconhecer o apoio'] },
    'estrutura-de-cada-aula': { valor: [{ marco: 1, marcados: ['Barra'] }] },
    'objetivo-geral': { valor: 'consolidar o alinhamento' },
  },
};
const CONTEXTO = { professor: 'prova', ciclo: '01', escola: 'prova', escolaNome: 'Prova' };
const ELENCO = { nome: 'turma-de-prova', em: '2026-11-06T10:00:00Z', turma: 'Turma de Prova',
  alunas: ['Aluna A', 'Aluna B'], recorte: [], mostra: [] };

const apelidosDe = (linhaDeBase) => JSON.parse(
  derivarDados({ po: PO, contexto: CONTEXTO, linhaDeBase })).apelidos;

/* A LINHA DOS «PRESENTES» da folha — a mesma que o formulário imprime como checkbox. */
const presentesDaFolha = (md) => {
  const m = /\*\*Presentes:\*\*([^\n]*)/.exec(md);
  if (!m) return null;
  return [...m[1].matchAll(/☐\s*([^☐·\n]+)/g)].map((x) => x[1].trim()).filter(Boolean);
};
/* AS LINHAS DE UMA TABELA da folha — o mesmo que o `captura-XX.json` extrai como `linhas`. */
const linhasDasTabelas = (md) => {
  const nomes = new Set();
  for (const m of md.matchAll(/^\|\s*\*{0,2}(Aluna [^|*]+?)\*{0,2}\s*\|/gm)) nomes.add(m[1].trim());
  return [...nomes].sort();
};

(async () => {
// ---------------------------------------------------------------------------------------------
console.log('A. O `-dados.json` — de onde o formulário tira os «Presentes»');
{
  const apelidos = apelidosDe(ELENCO);
  provar('o elenco é o da LINHA DE BASE, e não o do PO',
    JSON.stringify(Object.values(apelidos)) === JSON.stringify(['Aluna A', 'Aluna B']), apelidos);
  provar('…e a aluna que só o PO declara NÃO entra',
    !('aluna_c' in apelidos), Object.keys(apelidos));
  provar('o slug de cada apelido é o do nome (P-12: apelido estável, nunca o nome completo)',
    apelidos.aluna_a === 'Aluna A' && apelidos.aluna_b === 'Aluna B', apelidos);

  /* A RESERVA: sem linha de base legível (escola expurgada, ciclo antigo), o PO manda — é o
   * comportamento de antes, e é o que impede um ciclo antigo de sair sem elenco nenhum. */
  const semBase = apelidosDe(null);
  provar('sem linha de base, cai no PO (a reserva) em vez de ficar sem elenco',
    Object.keys(semBase).length === 3 && semBase.aluna_c === 'Aluna C', semBase);
  /* Uma linha de base VAZIA não é resposta: `alunas: []` não quer dizer «turma sem ninguém». */
  const vazia = apelidosDe(Object.assign({}, ELENCO, { alunas: [] }));
  provar('linha de base com elenco vazio também cai no PO (vazio não é resposta)',
    Object.keys(vazia).length === 3, vazia);
  /* UMA ALUNA SÓ não é «sem elenco». */
  const uma = apelidosDe(Object.assign({}, ELENCO, { alunas: ['Aluna B'] }));
  provar('uma aluna só continua a ser um elenco (e não uma lista vazia)',
    JSON.stringify(Object.values(uma)) === JSON.stringify(['Aluna B']), uma);
}

// ---------------------------------------------------------------------------------------------
console.log('\nB. A FOLHA DE CAPTURA — de onde saem as linhas das tabelas');
{
  const md = derivarCaptura({ po: PO, plano: PLANO, contexto: CONTEXTO, linhaDeBase: ELENCO });
  provar('a linha dos «Presentes» é o elenco da linha de base',
    JSON.stringify(presentesDaFolha(md)) === JSON.stringify(['Aluna A', 'Aluna B']),
    presentesDaFolha(md));
  provar('…e as linhas das tabelas são o MESMO elenco (a folha não diz duas coisas)',
    JSON.stringify(linhasDasTabelas(md)) === JSON.stringify(['Aluna A', 'Aluna B']),
    linhasDasTabelas(md));
  provar('a aluna que só o PO declara não aparece em NENHUMA das duas',
    !/Aluna C/.test(md), (md.match(/Aluna C/g) || []).length + ' ocorrência(s)');

  const semBase = derivarCaptura({ po: PO, plano: PLANO, contexto: CONTEXTO });
  provar('sem linha de base, a folha volta ao PO (a reserva), e continua a derivar',
    /Aluna C/.test(semBase) && linhasDasTabelas(semBase).length === 3, linhasDasTabelas(semBase));
}

// ---------------------------------------------------------------------------------------------
console.log('\nE. O PACOTE GERADO — a fonte e a cópia dizem o mesmo');
{
  /* Lido do DISCO, e não de uma fixture: é o pacote que o professor abre. Se este ciclo for
   * expurgado, a secção diz-se NÃO FEITA — o que ela guarda é a regra, e a regra já está provada
   * acima com fixtures. */
  const pasta = path.join(RAIZ, 'professores', 'rabo-gramde', 'ciclos');
  const dados = path.join(pasta, 'ciclo-01-calango-bale-nivel-1-teste-1-dados.json');
  const pacote = path.join(pasta, 'ciclo-01-calango-bale-nivel-1-teste-1');
  const captura = path.join(pacote, 'captura-01.json');

  if (!fs.existsSync(dados) || !fs.existsSync(captura)) {
    console.log('  —     o ciclo-01 da calango não está no disco (expurgado?) — secção NÃO FEITA');
  } else {
    const fonte = JSON.parse(fs.readFileSync(dados, 'utf8'));
    const nomes = Object.values(fonte.apelidos);
    provar('o JSON de dados do ciclo publicado tem DUAS alunas',
      nomes.length === 2 && !nomes.includes('Aluna C'), nomes);
    const cfg = JSON.parse(fs.readFileSync(captura, 'utf8'));
    const linhasDoCfg = new Set();
    for (const b of (cfg.blocos || [])) for (const l of (b.linhas || [])) linhasDoCfg.add(l);
    provar('…e o `captura-01.json` extraído da folha lista as MESMAS (nada de «Aluna C»)',
      linhasDoCfg.size > 0 && !linhasDoCfg.has('Aluna C')
      && [...linhasDoCfg].every((l) => nomes.includes(l)), [...linhasDoCfg]);
  }
}

// ---------------------------------------------------------------------------------------------
console.log('');
if (falhas) {
  console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
  process.exit(1);
}
console.log('TUDO CERTO — ' + total + ' asserções: o elenco vem da linha de base no JSON de dados '
  + 'e na folha de captura (o PO é a reserva), uma aluna só continua a ser um elenco, e o pacote '
  + 'publicado não lista a aluna de fora.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
