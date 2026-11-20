#!/usr/bin/env node
'use strict';

/*
 * provar-o-exercicio-novo.js — a que objetivo serve o exercício que entrou na Turma (20/11/2026).
 *
 * PORQUE ESTA PROVA EXISTE, e não é cobertura. A declaração do objetivo é a única coisa que faz um
 * exercício novo chegar à aula, e ela erra de três maneiras distintas — cada uma com um sintoma
 * próprio, e nenhum deles visível na tela:
 *
 *   1. APLICA-SE DUAS VEZES. Se a derivação reaplicasse a declaração em cada elo, o professor que
 *      desmarcasse um exercício no plano vê-lo-ia voltar em cada derivação — e não saberia porquê.
 *      A regra é do núcleo: um exercício que a aula já usa não volta a ser declarado.
 *   2. APLICA-SE O QUE A TURMA NÃO ACORDOU. Um exercício declarado por engano (ou que já saiu do
 *      repertório) não pode entrar no parâmetro: declarar é dizer «esta Turma ensina isto», e o que
 *      ela ensina está no `repertorio`.
 *   3. ENTRA NO PARÂMETRO E NÃO NO REPERTÓRIO DO PLANO. `parametroEmLinhas` filtra o parâmetro
 *      contra o repertório do PRÓPRIO plano — se o termo não entrar lá também, ele é escrito e
 *      apagado na leitura: o documento sai como se a declaração nunca tivesse existido.
 *
 * E mede-se o que o IMPACTO tem de dizer antes de perguntar: a linha do parâmetro que ganha o termo,
 * os objetivos todos (sem pré-seleção), e as linhas do item 10 que já citam o exercício — que para
 * um exercício novo são zero, e dizê-lo é o que evita a leitura de que o sistema fará a linha.
 */

const obj = require('../motor/nucleo/objetivos-do-repertorio.js');
const planoDoCiclo = require('../motor/nucleo/derivar-plano-ciclo.js');

let n = 0;
let falhas = 0;
function igual(rotulo, obtido, esperado) {
  n += 1;
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('FALHA ' + rotulo + '  (obtido ' + JSON.stringify(obtido) + ', esperado '
    + JSON.stringify(esperado) + ')');
}
function certo(rotulo, condicao, detalhe) {
  n += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('FALHA ' + rotulo + (detalhe === undefined ? '' : '  (' + JSON.stringify(detalhe) + ')'));
}

/** O valor de uma resposta, na forma que o formulário grava. */
const resp = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });

/** Um plano com dois objetivos, a matriz do parâmetro, a estrutura e a sequência. */
function umPlano() {
  return {
    id: 'plano-20261120-1000',
    respostas: {
      'marcos-por-aula': resp(['1: reconhecer o vocabulário', '2: sustentar o equilíbrio']),
      'aula-1-parametro': resp([
        { marco: 1, marcados: ['Battement tendu', 'Plié'] },
        { marco: 2, marcados: ['Plié'] },
      ]),
      'estrutura-de-cada-aula': resp([
        { marco: 1, marcados: ['Barra'] },
        { marco: 2, marcados: ['Centro', 'Solo'] },
      ]),
      'aula-1-sequencia': resp([
        { Bloco: 'Barra', Objetivo: '1', 'Conteúdo do nível': 'Plié' },
      ]),
      repertorio: resp(['Battement tendu', 'Plié']),
    },
  };
}

/** O que a Turma acordou, depois de o exercício novo entrar. */
const TURMA_COM_O_NOVO = ['Battement tendu', 'Plié', 'Battement jeté'];

(function principal() {
  // ── 1. AS DECLARAÇÕES LIDAS ────────────────────────────────────────────────
  console.log('\n1. O que a Turma guarda é um mapa; o que se aplica é uma lista sem lixo');

  igual('o mapa vira lista, com os objetivos ordenados',
    obj.declaracoesLidas({ 'Battement jeté': [2, 1] }),
    [{ termo: 'Battement jeté', objetivos: [1, 2] }]);
  igual('o que não é número inteiro positivo cai fora',
    obj.declaracoesLidas({ 'Battement jeté': [1, '2', 0, -1, 2.5, 'x', null] }),
    [{ termo: 'Battement jeté', objetivos: [1, 2] }]);
  igual('um termo sem objetivo nenhum não é uma declaração',
    obj.declaracoesLidas({ 'Battement jeté': [], Plié: [0] }), []);
  igual('o termo vazio não se declara',
    obj.declaracoesLidas({ '   ': [1], 'Plié ': [3] }), [{ termo: 'Plié', objetivos: [3] }]);
  igual('a lista volta ao mapa, sem perder nada',
    obj.declaracoesEmMapa([{ termo: 'Battement jeté', objetivos: [2, 1, 2] }]),
    { 'Battement jeté': [1, 2] });

  // ── 2. O ESTADO DA DECLARAÇÃO — os três casos que decidem tudo ─────────────
  console.log('\n2. Sem plano não se declara; na aula não se reaplica; fora do repertório não se inventa');

  igual('sem plano, não há a que ligar o exercício',
    obj.estadoDaDeclaracao({ plano: null, termo: 'Battement jeté', repertorio: TURMA_COM_O_NOVO }),
    { estado: 'sem-plano' });
  igual('um exercício que a aula já usa não se declara outra vez',
    obj.estadoDaDeclaracao({ plano: umPlano(), termo: 'Plié', repertorio: TURMA_COM_O_NOVO }),
    { estado: 'ja-na-aula' });
  igual('um exercício que a Turma não acordou não se declara',
    obj.estadoDaDeclaracao({ plano: umPlano(), termo: 'Grand jeté', repertorio: TURMA_COM_O_NOVO }),
    { estado: 'fora-do-repertorio' });
  igual('um exercício novo, acordado e fora da aula, é o caso em que se pergunta',
    obj.estadoDaDeclaracao({ plano: umPlano(), termo: 'Battement jeté', repertorio: TURMA_COM_O_NOVO }),
    { estado: 'nova' });
  /* UM EXERCÍCIO QUE SÓ ESTÁ NA SEQUÊNCIA TAMBÉM CONTA COMO ESTANDO NA AULA. Um plano antigo pode
   * não ter o campo `repertorio` preenchido e ter a sequência — e a pergunta é «esta aula já fala
   * deste exercício?», não «que campo está cheio?». */
  const soNaSequencia = umPlano();
  delete soNaSequencia.respostas.repertorio;
  igual('e o que está na sequência conta como estando na aula',
    obj.estadoDaDeclaracao({ plano: soNaSequencia, termo: 'Plié', repertorio: TURMA_COM_O_NOVO }),
    { estado: 'ja-na-aula' });

  // ── 3. APLICAR, E NÃO REAPLICAR ───────────────────────────────────────────
  console.log('\n3. A declaração entra no parâmetro E no repertório do plano — uma vez');

  const copia = () => JSON.parse(JSON.stringify(umPlano().respostas));
  const primeira = obj.aplicarDeclaracoes({
    respostas: copia(), declaracoes: { 'Battement jeté': [1, 2] }, repertorio: TURMA_COM_O_NOVO,
  });
  igual('a declaração é aplicada',
    primeira.aplicadas, [{ termo: 'Battement jeté', objetivos: [1, 2] }]);
  igual('…e o termo entra em `marcados` de cada objetivo declarado',
    primeira.respostas['aula-1-parametro'].valor.map((l) => l.marcados),
    [['Battement tendu', 'Plié', 'Battement jeté'], ['Plié', 'Battement jeté']]);
  /* O SEGUNDO SÍTIO É O QUE FAZ O DOCUMENTO MUDAR: `parametroEmLinhas` filtra o parâmetro contra o
   * repertório do plano, e sem esta linha o termo seria escrito e apagado na leitura. */
  igual('…e o termo entra na lista acordada do plano, senão é escrito e apagado na leitura',
    primeira.respostas.repertorio.valor, ['Battement tendu', 'Plié', 'Battement jeté']);
  certo('…e o documento passa a dizer que o objetivo observa o exercício',
    planoDoCiclo.parametroEmLinhas(
      primeira.respostas['aula-1-parametro'].valor,
      planoDoCiclo.marcosEmTexto(primeira.respostas['marcos-por-aula'].valor),
      primeira.respostas.repertorio.valor,
    ).some((l) => /observa: .*Battement jeté/.test(l)), null);

  const segunda = obj.aplicarDeclaracoes({
    respostas: JSON.parse(JSON.stringify(primeira.respostas)),
    declaracoes: { 'Battement jeté': [1, 2] }, repertorio: TURMA_COM_O_NOVO,
  });
  igual('a mesma declaração, uma segunda vez, NÃO se aplica', segunda.aplicadas, []);
  igual('…e o motivo é dito: a aula já a tem',
    segunda.ignoradas, [{ termo: 'Battement jeté', motivo: 'ja-na-aula' }]);
  igual('…e a matriz fica exactamente como estava',
    segunda.respostas['aula-1-parametro'], primeira.respostas['aula-1-parametro']);

  /* E O PROFESSOR QUE DESMARCA FICA COM A ÚLTIMA PALAVRA. Depois de o exercício estar no plano, o
   * plano é a autoridade — a Turma não lhe repõe a marca. */
  const desmarcado = JSON.parse(JSON.stringify(primeira.respostas));
  desmarcado['aula-1-parametro'] = resp([{ marco: 1, marcados: ['Battement tendu', 'Plié'] }]);
  const terceira = obj.aplicarDeclaracoes({
    respostas: desmarcado, declaracoes: { 'Battement jeté': [1] }, repertorio: TURMA_COM_O_NOVO,
  });
  igual('…e o que o professor desmarcou no plano NÃO volta na derivação seguinte',
    terceira.aplicadas, []);

  // ── 4. O QUE NÃO SE APLICA, E PORQUÊ ──────────────────────────────────────
  console.log('\n4. O que a Turma não acordou, ou o que o plano não sabe medir, fica de fora');

  const fora = obj.aplicarDeclaracoes({
    respostas: copia(), declaracoes: { 'Grand jeté': [1] }, repertorio: TURMA_COM_O_NOVO,
  });
  igual('um exercício fora do repertório da Turma não se aplica', fora.aplicadas, []);
  igual('…e o motivo é dito', fora.ignoradas, [{ termo: 'Grand jeté', motivo: 'fora-do-repertorio' }]);
  igual('…e a matriz fica intacta',
    fora.respostas['aula-1-parametro'].valor.map((l) => l.marcados),
    [['Battement tendu', 'Plié'], ['Plié']]);

  const objetivoInexistente = obj.aplicarDeclaracoes({
    respostas: copia(), declaracoes: { 'Battement jeté': [9] }, repertorio: TURMA_COM_O_NOVO,
  });
  igual('um objetivo que o plano não tem não se inventa',
    objetivoInexistente.ignoradas, [{ termo: 'Battement jeté', motivo: 'objectivo-inexistente' }]);

  const semMarcos = umPlano();
  delete semMarcos.respostas['marcos-por-aula'];
  igual('um plano sem objetivos específicos não ancora nada',
    obj.aplicarDeclaracoes({
      respostas: semMarcos.respostas, declaracoes: { 'Battement jeté': [1] },
      repertorio: TURMA_COM_O_NOVO,
    }).ignoradas, [{ termo: 'Battement jeté', motivo: 'sem-objectivos' }]);

  /* A MATRIZ DE UM PLANO ANTIGO PODE NÃO TER A LINHA DAQUELE OBJETIVO — e ela nasce. Sem isso, um
   * objetivo que ainda não observa nada nunca poderia receber o exercício novo. */
  const semLinha = copia();
  semLinha['aula-1-parametro'] = resp([{ marco: 1, marcados: ['Plié'] }]);
  const nascida = obj.aplicarDeclaracoes({
    respostas: semLinha, declaracoes: { 'Battement jeté': [2] }, repertorio: TURMA_COM_O_NOVO,
  });
  igual('…e a linha do objetivo que ainda não existia na matriz é criada',
    nascida.respostas['aula-1-parametro'].valor,
    [{ marco: 1, marcados: ['Plié'] }, { marco: 2, marcados: ['Battement jeté'] }]);

  // ── 5. O IMPACTO — o que o modal mostra antes de perguntar ────────────────
  console.log('\n5. O impacto diz a linha que ganha o termo, os objetivos todos, e o que já existe');

  const impacto = obj.impactoDaInclusao({
    plano: umPlano(), termo: 'Battement jeté', objetivos: [2], repertorio: TURMA_COM_O_NOVO,
  });
  igual('o estado é «nova» — é o caso em que se pergunta', impacto.estado, 'nova');
  igual('…e o termo vai no impacto', impacto.termo, 'Battement jeté');
  igual('…e a linha do objetivo declarado mostra o antes e o depois',
    impacto.objetivos.map((o) => ({ n: o.n, antes: o.antes, depois: o.depois })),
    [{ n: 2, antes: ['Plié'], depois: ['Plié', 'Battement jeté'] }]);
  igual('…e diz em que blocos aquele objetivo é trabalhado',
    impacto.objetivos[0].blocos, ['Centro', 'Solo']);
  igual('…e nenhuma linha do item 10 cita ainda o exercício novo', impacto.linhasDoItem10, 0);
  igual('…e a janela recebe TODOS os objetivos, para poder oferecê-los',
    impacto.marcos.map((m) => m.n), [1, 2]);
  certo('…e o texto de cada objetivo vem do plano, não é inventado',
    impacto.marcos[0].texto === 'reconhecer o vocabulário', impacto.marcos[0]);
  /* SEM OBJETIVOS ESCOLHIDOS o impacto ainda serve: é o pedido que enche a janela. Nenhuma linha é
   * mostrada como «depois», e a lista dos objetivos vem toda. */
  const semEscolha = obj.impactoDaInclusao({
    plano: umPlano(), termo: 'Battement jeté', objetivos: [], repertorio: TURMA_COM_O_NOVO,
  });
  igual('…e o pedido sem objetivos devolve a lista para escolher, e nenhuma linha',
    { objetivos: semEscolha.objetivos, marcos: semEscolha.marcos.map((m) => m.n), blocos: semEscolha.blocos },
    { objetivos: [], marcos: [1, 2], blocos: [] });

  const jaLa = obj.impactoDaInclusao({
    plano: umPlano(), termo: 'Plié', objetivos: [1], repertorio: TURMA_COM_O_NOVO,
  });
  igual('…e um exercício que a aula já usa não pede decisão nenhuma', jaLa.estado, 'ja-na-aula');
  igual('…e o impacto diz quantas linhas do item 10 já o citam', jaLa.linhasDoItem10, 1);

  console.log('\n' + (falhas === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + n + ' asserções: a'
    + ' declaração do objetivo entra no parâmetro E no repertório do plano, uma vez só; não se'
    + ' aplica o que a Turma não acordou nem o que o plano não sabe medir; e o impacto diz, antes'
    + ' de perguntar, a linha que ganha o termo, os objetivos todos sem pré-seleção, e as linhas'
    + ' do item 10 que já citam o exercício.');
  process.exit(falhas === 0 ? 0 : 1);
})();
