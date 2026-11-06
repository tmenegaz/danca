#!/usr/bin/env node
'use strict';

/**
 * provar-sujeitos-semeados.js — o elenco do Plano de Observação NÃO SE ESCOLHE: vem da turma.
 *
 * A DECISÃO DELA (05/11/2026), e o argumento é de processo: «o professor dá aula para a turma. Ele
 * tem que observar todas as alunas da turma. Ele não pode dizer: hoje eu vou observar só 5% das
 * alunas da turma.» O nó `sujeitos` era a última coisa que o PO perguntava sobre QUEM — e
 * perguntava por uma lista de anamneses com campo aberto para escrever um apelido que a escola não
 * tem. Passa a ser **derivado**: turma → linha de base → alunas.
 *
 * O QUE ESTA PROVA MEDE, e por que cada asserção é necessária:
 *
 *   A. O CONTEÚDO. O nó declara `semeado: 'turma'`, perdeu `multipla`, `aberto` e `criarEm` (não há
 *      o que marcar nem o que escrever), e continua `obrigatorio` — sem elenco não há corpo a
 *      observar, e o fecho tem de o dizer.
 *   B. O MAPA. `descritores` é uma lista FECHADA: se `semeado` não estivesse nela, a chave morria
 *      em silêncio e a tela continuaria a desenhar o campo. A prova lê o mapa que o `/api/mapa`
 *      serve, e não o ficheiro de onde ele sai.
 *   C. O ROTEIRO. O nó deixa de ser DEGRAU (`numerosDoMapa`), e continua a contar nos
 *      obrigatórios — senão o fecho diria «os 16» sobre 17 que faltam, e a tela contradizia-se.
 *   D. A DERIVAÇÃO NÃO MUDA. O valor continua a viajar no envelope, e é isso que mantém vivos o
 *      `## Sujeitos` do PO e a folha de captura. Se o nó saísse do envelope, a derivação ficaria
 *      cega — e é a asserção que impede que uma correcção de tela quebre o documento.
 *   E. A TELA. Semeia da `alunas-da-turma` (a MESMA leitura da curadoria), não reescreve o que já
 *      está gravado, e a repetição do ponto de partida aponta para a linha de base — não para um
 *      «campo anterior» que deixou de existir.
 *
 *   node experimentos/provar-sujeitos-semeados.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const derivarPo = require(path.join(RAIZ, 'motor/nucleo/derivar-po.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const ler = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta', p), 'utf8'));
const CONTEUDO = ler('po/conteudo/po.json');
const TELA = fs.readFileSync(path.join(RAIZ, 'porta/index.html'), 'utf8');

/** O nó `sujeitos` do conteúdo, procurado em profundidade. */
function acharNo(o, id) {
  if (!o || typeof o !== 'object') return null;
  if (o.id === id) return o;
  for (const v of Object.values(o)) {
    const r = acharNo(v, id);
    if (r) return r;
  }
  return null;
}

(async () => {
  console.log('\nA. O CONTEÚDO: um nó semeado, e não uma pergunta');
  {
    const no = acharNo(CONTEUDO, 'sujeitos');
    provar('o nó declara `semeado: "turma"`', no && no.semeado === 'turma', no && no.semeado);
    provar('deixou de ser escolha múltipla', no && no.multipla === undefined, no && no.multipla);
    provar('deixou de ter campo ABERTO — não se escreve um apelido que a escola não tem',
      no && no.aberto === undefined, no && no.aberto);
    provar('deixou de ter `criarEm` — não se cria uma anamnese a partir daqui',
      no && no.criarEm === undefined, no && no.criarEm);
    provar('CONTINUA OBRIGATÓRIO: sem elenco não há corpo a observar',
      no && no.obrigatorio === true, no && no.obrigatorio);
    provar('e continua a declarar `opcoesDe` — é dela que sai a ligação à anamnese de cada aluna',
      no && no.opcoesDe === 'api/anamneses', no && no.opcoesDe);
    provar('o texto diz que NÃO se preenche',
      no && /não se preenche/i.test(no.explicacao.preencher || ''), no && no.explicacao.preencher);
  }

  console.log('\nB. O MAPA: a chave atravessa a lista fechada do motor');
  {
    /* O MESMO QUE A ROTA SERVE: `/api/mapa?fonte=po` chama `porta.mapa(conteudoPO)`. O mapa
     * recebe UM conteúdo — e é por isso que a prova passa o do PO, e não os três. */
    const mapa = porta.mapa(CONTEUDO);
    const no = (mapa.nos || []).find((n) => n.id === 'sujeitos');
    provar('o mapa servido traz o nó', Boolean(no));
    provar('…e traz a marca `semeado`, que é o que a tela lê',
      no && no.semeado === 'turma', no && no.semeado);
    provar('CONTROLE NEGATIVO: sem a chave em `descritores`, ela morria aqui',
      no && Object.prototype.hasOwnProperty.call(no, 'semeado'), no && Object.keys(no || {}).length);
  }

  console.log('\nC. O ROTEIRO: deixa de ser degrau, e continua a contar nos obrigatórios');
  {
    provar('a numeração salta o nó semeado',
      /if \(no\.noCabecalho \|\| no\.semeado\) continue;/.test(TELA));
    provar('…e ele conta nos obrigatórios ANTES do salto — senão a tela contradizia-se',
      /if \(no\.obrigatorio && !no\.noCabecalho\) obrigatorios \+= 1;\s*\n\s*if \(no\.noCabecalho \|\| no\.semeado\) continue;/
        .test(TELA));
    provar('a pergunta não se desenha: o índice salta para o degrau seguinte',
      /if \(no\.semeado\) \{[\s\S]{0,300}irPara\(proximo\)/.test(TELA));
  }

  console.log('\nD. A DERIVAÇÃO NÃO MUDA: o valor continua a viajar no envelope');
  {
    /* O `## Sujeitos` do PO sai de `resp(envelope,'sujeitos')`. Se o nó deixasse de ir para o
     * envelope, esta secção sairia vazia — e a folha de captura também. */
    const envelope = {
      id: 'po-20261105',
      contexto: { escola: 'calango', professor: 'tiago-menegaz', ciclo: '01' },
      respostas: {
        sujeitos: { valor: ['Aluna A', 'Aluna B'] },
        'plano-de-ensino': { valor: ['plano-20261105'] },
      },
    };
    const plano = {
      id: 'plano-20261105',
      respostas: { 'contexto-turma': { valor: 'Balé Nível 1 — Teste 1' } },
    };
    /* A ASSINATURA É POSICIONAL: `derivarPO(envelope, plano, opcoes)`. Chamá-la com um objeto
     * dava um documento sem sujeitos — e a prova mediria a minha chamada, não a derivação. */
    const doc = derivarPo.derivarPO(envelope, plano, {});
    const texto = typeof doc === 'string' ? doc : (doc && (doc.markdown || doc.texto)) || '';
    provar('o documento do PO nomeia as duas alunas',
      /Aluna A/.test(texto) && /Aluna B/.test(texto), texto.slice(0, 400));
    provar('…e a secção «Sujeitos» existe (a derivação não ficou cega)',
      /Sujeitos/.test(texto));
  }

  console.log('\nE. A TELA: semeia da turma, não reescreve o gravado, e diz a causa certa');
  {
    provar('existe uma sementeira do elenco (`semearDaTurma`)',
      /async function semearDaTurma\(\)/.test(TELA));
    provar('…que lê a MESMA rota da curadoria (`alunas-da-turma`)',
      /semearDaTurma[\s\S]{0,2200}api\/bastidores\/alunas-da-turma/.test(TELA));
    provar('…e não reescreve uma resposta que já veio do envelope',
      /if \(RESPOSTAS\.has\(no\.id\) && !SUGERIDAS\.has\(no\.id\)\) return;/.test(TELA));
    provar('a sementeira corre depois do plano (é da turma do plano que ela sai)',
      /await semearDaTurma\(\);/.test(TELA));
    /* A FRASE DA REPETIÇÃO. «Escolha as alunas no campo anterior» mandaria o professor a um campo
     * que deixou de existir — o defeito de sempre nesta casa: a tela a pedir um gesto impossível. */
    provar('a repetição do ponto de partida nomeia a linha de base, e não um «campo anterior»',
      /A lista vem da turma do plano de ensino: é a linha de base enviada/.test(TELA));
    provar('…e o painel do corpo diz a mesma causa quando não há elenco',
      /A turma deste plano ainda não tem linha de base enviada/.test(TELA));
    /* O CONTROLE É SOBRE O QUE SE RENDERIZA, e não sobre o ficheiro: as duas frases antigas
     * sobrevivem em COMENTÁRIOS que registam a correcção, e um `regex` no ficheiro inteiro
     * acusaria a memória do defeito como se fosse o defeito. O que não pode existir é a
     * instrução a mandar escolher. */
    /* O CONTROLE É SOBRE O RAMO, e não sobre o ficheiro: as frases antigas sobrevivem em
     * COMENTÁRIOS (a memória da correcção) e no ramo da repetição por ITENS, onde continuam
     * verdadeiras. O que se mede é que a instrução de escolher ficou PRESA ao ramo antigo — se
     * ela voltasse ao ramo do elenco semeado, este par deixava de casar. */
    provar('CONTROLE NEGATIVO: a instrução de escolher ficou presa ao ramo que já não é o do elenco',
      /daTurma\s*\n?\s*\?\s*'A lista vem da turma/.test(TELA)
        && /: refereSujeitos\s*\n?\s*\?\s*'Escolha as alunas/.test(TELA));
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o elenco do PO deixa de se escolher e passa a vir da turma, e a derivação que o lê não mudou.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('\nERRO na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
