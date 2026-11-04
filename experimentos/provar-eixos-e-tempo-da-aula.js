#!/usr/bin/env node
'use strict';

/*
 * provar-eixos-e-tempo-da-aula.js — as três frentes do guia e a fatia de tempo de cada bloco
 * (04/11/2026).
 *
 * DUAS COISAS QUE A PESQUISADORA VIU, e que esta prova fixa:
 *
 *   1. **A fatia do bloco Expressão saía `[Preencher]`.** O valor estava no plano, e a aula não o
 *      lia — por duas razões medidas: a proporção era lida pela POSIÇÃO da coluna
 *      (`Object.values(linha)[1]`), e uma célula vazia encolhe a linha, fazendo a coluna seguinte
 *      ocupar o lugar da proporção (a aula imprimiu a JUSTIFICATIVA como fatia); e a unidade
 *      `minutos`, que o conteúdo declara como opção e é o padrão, não se sabia ler — uma tabela
 *      em minutos saía com `[Preencher]` em TODOS os tempos, com a fatia certa ao lado.
 *
 *   2. **O guia de observação só falava de técnica.** Todas as dimensões saíam com o prefixo
 *      «Técnica —», inclusive Musicalidade e Expressão, cujo conteúdo é poiésis. O guia passa a
 *      ler as três frentes — Corpo, Técnica, Poiesis — e a mostrar o resumo curto antes, com a
 *      tabela item a item depois (o detalhe que a folha de captura pede).
 *
 * O QUE ESTA PROVA MEDE, e por que cada asserção importa:
 *
 *   A. A COLUNA É PROCURADA PELO NOME — a linha com uma célula vazia no meio e a linha com as
 *      colunas trocadas dão a MESMA fatia. Era o defeito silencioso: nada falhava, e o documento
 *      dizia outra coisa.
 *   B. A UNIDADE — percentual e minutos dão os mesmos tempos para a mesma aula (30% de 90 = 27;
 *      13,5 de 45 min = 27). Em minutos, a fatia mostra a unidade, para o número não se ler como
 *      erro de conta.
 *   C. A LACUNA É DO BLOCO — sem proporção declarada, a célula diz QUAL bloco e ONDE se corrige;
 *      e uma proporção escrita em prosa («um terço») não se converte: ler prosa não é derivar.
 *   D. OS EIXOS — Barra/Centro são Técnica; Musicalidade/Expressão são Poiesis; e o prefixo do
 *      rótulo NÃO decide o eixo (o rótulo «Técnica — Expressão» continua a ir para Poiesis, que é
 *      o defeito medido).
 *   E. O CORPO — vem de três sítios que já existem: o plano (`aspecto-fisico`), o PO
 *      (`linha-de-base`) e as restrições. Nada é inventado, e o que não existe é dito.
 *   F. NADA SE PERDE — cada item do PO continua na tabela, uma linha cada; e uma dimensão com
 *      bloco fora do mapa não desaparece (cai em Técnica, como o prefixo do conteúdo já fazia).
 *
 * Sem rede, sem `git`, sem gerar pacote: a derivação é a de produção, chamada em processo.
 *
 *   node experimentos/provar-eixos-e-tempo-da-aula.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const {
  derivarAula01, dimensoesEItens, eixosDaObservacao, blocoDaDimensao, eixoDoBloco,
} = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

// ---------------------------------------------------------------- a fixture

/** Uma resposta no formato do envelope. */
const r = (valor) => ({ valor: valor, origem: 'perguntado', respondente: 'professor', nota: null });

/** Um plano com a forma do real — e com a linha do Expressão SEM «Proporção alvo», que é o caso. */
function planoCom(volume, extra) {
  const respostas = {
    'objetivo-geral': r('consolidar o alinhamento e a transferência de peso'),
    'contexto-turma': r('Balé Nível 1 — Teste 3'),
    'contexto-duracao': r([{ numero: 45, unidade: 'minuto' }]),
    'marcos-por-aula': r(['reconhecer o apoio e alinhar o eixo vertical', 'transferir o peso entre os pés']),
    'estrutura-de-cada-aula': r([
      { marco: 1, marcados: ['Barra', 'Centro', 'Musicalidade', 'Expressão'] },
    ]),
    'aula-1-parametro': r([{ marco: 1, marcados: ['Battement tendu', 'Plié'] }]),
    'distribuicao-de-volume': r(volume),
    'aula-1-sequencia': r([
      { Bloco: 'Barra', 'Objetivo específico': '1 — reconhecer o apoio e alinhar o eixo vertical',
        'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '4/4' },
    ]),
    'condicoes-preliminares': r('Sala com barra, espelho e aparelho de som.'),
    'criterio-de-extensao': r('Estender o ciclo em duas aulas.'),
    referencias: r('RAD (2015).'),
    'musicas-videos': r('Faixa em 4/4.'),
    repertorio: r('Battement tendu; Plié'),
    proveniencia: r(['Plano derivado da metodologia RAD']),
    'contexto-metodologia': r('RAD'),
    'contexto-notacao': r('Benesh'),
    'aspecto-fisico': r([
      { Aspecto: 'Flexibilidade dos isquiotibiais', 'Como está a turma': '1 de 1 em «Baixa» — ponto de atenção' },
      { Aspecto: 'Equilíbrio unipodal', 'Como está a turma': '1 de 1 em «Mantém > 5 s»' },
    ]),
  };
  Object.assign(respostas, extra || {});
  return { id: 'plano-prova', respostas };
}

function poCom(extra) {
  const respostas = {
    'dimensoes-de-observacao': r(['Técnica — Barra', 'Técnica — Centro', 'Técnica — Musicalidade', 'Técnica — Expressão']),
    'itens-por-dimensao': r([
      { sujeito: 'Técnica — Barra', itens: 'saída do calcanhar no tendu; quadril sem subir no en dehors' },
      { sujeito: 'Técnica — Centro', itens: 'transferência de peso sem perder a verticalidade; braço junto do movimento' },
      { sujeito: 'Técnica — Musicalidade', itens: 'resposta ao pulso na marcação; frase até o fim da música' },
      { sujeito: 'Técnica — Expressão', itens: 'olhar acompanha o braço; presença sem rigidez de rosto' },
    ]),
    'linha-de-base': r([
      { sujeito: 'Aluna A', traz: 'prática anterior: mais de 5 anos', precisaDesenvolver: 'saída do calcanhar no tendu' },
    ]),
    question: r('O que se observa, aula a aula?'),
  };
  Object.assign(respostas, extra || {});
  return { id: 'po-prova', respostas };
}

const CALIBRACAO = { duracaoMinutos: 45, volumeMin: 80, volumeMax: 100 };
const CONTEXTO = { ciclo: '01', escola: 'prova', escolaNome: 'Prova' };

/** As linhas da §3, já em células. */
function tabelaDoTempo(md) {
  const linhas = String(md).split('\n');
  const inicio = linhas.findIndex((l) => /^## 3\. Distribuição do tempo/.test(l));
  const fim = linhas.findIndex((l, i) => i > inicio && /^## /.test(l));
  return linhas.slice(inicio, fim === -1 ? undefined : fim)
    .filter((l) => /^\|/.test(l) && !/^\|:?--/.test(l))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
}

/** Onde começa cada parte do guia: as linhas do resumo e as do detalhe. */
function guia(md) {
  const linhas = String(md).split('\n');
  const inicio = linhas.findIndex((l) => /^## 5\. Guia de observação/.test(l));
  const fim = linhas.findIndex((l, i) => i > inicio && /^## /.test(l));
  const corpo = linhas.slice(inicio, fim === -1 ? undefined : fim);
  const resumo = corpo.filter((l) => /^- \*\*/.test(l));
  const tabela = corpo.filter((l) => /^\|/.test(l) && !/^\|:?--/.test(l))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  return { corpo, resumo: resumo.map((l) => l.replace(/^- /, '')), tabela };
}

// ---------------------------------------------------------------- A e B: o tempo

console.log('\nA. A COLUNA É PROCURADA PELO NOME, E NÃO PELA POSIÇÃO');

const volumeCompleto = {
  unidade: 'percentual',
  linhas: [
    { Bloco: 'Barra', 'Proporção alvo': '30%', Justificativa: 'Apoio.' },
    { Bloco: 'Centro', 'Proporção alvo': '30%', Justificativa: 'Deslocamento.' },
    { Bloco: 'Musicalidade', 'Proporção alvo': '10%', Justificativa: 'Pulso.' },
    { Bloco: 'Expressão', 'Proporção alvo': '30%', Justificativa: 'Braços.' },
  ],
};
{
  const md = derivarAula01({ plano: planoCom(volumeCompleto), po: poCom(), contexto: CONTEXTO, calibracao: CALIBRACAO });
  const t = tabelaDoTempo(md);
  const linha = (bloco) => t.find((c) => c[0] === bloco) || [];
  provar('a aula inteira soma o volume-alvo (27+27+9+27 = 90)',
    linha('Barra')[1] === '27' && linha('Centro')[1] === '27'
    && linha('Musicalidade')[1] === '9' && linha('Expressão')[1] === '27',
    t);
  provar('e a fatia é a declarada, bloco a bloco',
    t.filter((c) => c[0] !== '**Total**' && c[0] !== 'Bloco')
      .every((c) => c[2] === '30%' || c[2] === '10%'), t);
}

console.log('\n   …e uma célula vazia no meio não desloca as colunas');

/* O CASO REAL: a linha do Expressão foi gravada sem «Proporção alvo» (a gravação não escreve célula
 * vazia), e a posição 1 passou a ser a Justificativa. Era isto que punha «Braços» na coluna da
 * fatia. A prova injeta a proporção DEPOIS da justificativa — a ordem que enganava o leitor antigo
 * — e exige que a aula leia a coluna certa. */
{
  const volumeTrocado = {
    unidade: 'percentual',
    linhas: [
      { Bloco: 'Barra', 'Proporção alvo': '30%', Justificativa: 'Apoio.' },
      { Bloco: 'Expressão', Justificativa: 'Braços', 'Proporção alvo': '30%' },
    ],
  };
  const plano = planoCom(volumeTrocado);
  plano.respostas['estrutura-de-cada-aula'] = r([{ marco: 1, marcados: ['Barra', 'Expressão'] }]);
  const md = derivarAula01({ plano, po: poCom(), contexto: CONTEXTO, calibracao: CALIBRACAO });
  const t = tabelaDoTempo(md);
  const expressao = t.find((c) => c[0] === 'Expressão') || [];
  provar('a coluna trocada lê-se pelo NOME: Expressão sai com 30% e 27 tempos',
    expressao[1] === '27' && expressao[2] === '30%', expressao);
  provar('e a Justificativa não vaza para a fatia', expressao[2] !== 'Braços', expressao);
}

console.log('\nB. A UNIDADE: PERCENTUAL E MINUTOS DÃO A MESMA AULA');
{
  const mdPercentual = derivarAula01({ plano: planoCom(volumeCompleto), po: poCom(), contexto: CONTEXTO, calibracao: CALIBRACAO });
  const volumeMinutos = {
    unidade: 'minutos',
    linhas: [
      { Bloco: 'Barra', 'Proporção alvo': '13,5', Justificativa: 'Apoio.' },
      { Bloco: 'Centro', 'Proporção alvo': '13,5 min', Justificativa: 'Deslocamento.' },
      { Bloco: 'Musicalidade', 'Proporção alvo': '4,5', Justificativa: 'Pulso.' },
      { Bloco: 'Expressão', 'Proporção alvo': '13,5', Justificativa: 'Braços.' },
    ],
  };
  const mdMinutos = derivarAula01({ plano: planoCom(volumeMinutos), po: poCom(), contexto: CONTEXTO, calibracao: CALIBRACAO });
  const a = tabelaDoTempo(mdPercentual);
  const b = tabelaDoTempo(mdMinutos);
  const tempos = (t) => Object.fromEntries(t
    .filter((c) => c[0] !== '**Total**' && c[0] !== 'Bloco').map((c) => [c[0], c[1]]));
  provar('os tempos da tabela em minutos são os mesmos da tabela em percentagem',
    JSON.stringify(tempos(a)) === JSON.stringify(tempos(b)), { percentual: tempos(a), minutos: tempos(b) });
  const expressao = b.find((c) => c[0] === 'Expressão') || [];
  provar('e a fatia em minutos diz a unidade («13,5 min»), para não se ler como erro de conta',
    expressao[2] === '13,5 min', expressao);
  provar('a vírgula decimal é lida («13,5» = 13,5 minutos)', tempos(b).Barra === '27', tempos(b));
}

// ---------------------------------------------------------------- C: a lacuna

console.log('\nC. A LACUNA É DO BLOCO, E A PROSA NÃO SE CONVERTE');
{
  const volumeIncompleto = {
    unidade: 'percentual',
    linhas: [
      { Bloco: 'Barra', 'Proporção alvo': '30%', Justificativa: 'Apoio.' },
      { Bloco: 'Expressão', Justificativa: 'Braços' },
    ],
  };
  const plano = planoCom(volumeIncompleto);
  plano.respostas['estrutura-de-cada-aula'] = r([{ marco: 1, marcados: ['Barra', 'Expressão'] }]);
  const md = derivarAula01({ plano, po: poCom(), contexto: CONTEXTO, calibracao: CALIBRACAO });
  const expressao = tabelaDoTempo(md).find((c) => c[0] === 'Expressão') || [];
  provar('sem a proporção, a fatia diz QUAL bloco e ONDE se corrige',
    /^\[Preencher: proporção do bloco Expressão no plano\]$/.test(expressao[2] || ''), expressao);
  provar('…e os tempos ficam lacuna, sem número adivinhado', expressao[1] === '[Preencher]', expressao);

  const volumeProsa = {
    unidade: 'percentual',
    linhas: [
      { Bloco: 'Barra', 'Proporção alvo': 'um terço', Justificativa: 'Apoio.' },
      { Bloco: 'Expressão', 'Proporção alvo': 'o resto', Justificativa: 'Braços.' },
    ],
  };
  const plano2 = planoCom(volumeProsa);
  plano2.respostas['estrutura-de-cada-aula'] = r([{ marco: 1, marcados: ['Barra', 'Expressão'] }]);
  const md2 = derivarAula01({ plano: plano2, po: poCom(), contexto: CONTEXTO, calibracao: CALIBRACAO });
  const t2 = tabelaDoTempo(md2);
  provar('uma proporção escrita em prosa não vira número — ler prosa não é derivar',
    t2.filter((c) => c[0] !== '**Total**' && c[0] !== 'Bloco').every((c) => c[1] === '[Preencher]'), t2);
}

// ---------------------------------------------------------------- D: os eixos

console.log('\nD. OS EIXOS: O BLOCO DECIDE, E NÃO O PREFIXO DO RÓTULO');
{
  const dims = dimensoesEItens(poCom());
  provar('«Técnica — Barra» lê-se como Barra', blocoDaDimensao('Técnica — Barra') === 'Barra');
  provar('Barra e Centro são Técnica',
    eixoDoBloco('Barra') === 'Técnica' && eixoDoBloco('Centro') === 'Técnica');
  provar('Musicalidade e Expressão são Poiesis',
    eixoDoBloco('Musicalidade') === 'Poiesis' && eixoDoBloco('Expressão') === 'Poiesis');
  provar('o prefixo «Técnica —» do rótulo NÃO decide o eixo (o defeito medido)',
    eixoDoBloco(blocoDaDimensao('Técnica — Expressão')) === 'Poiesis');
  const eixos = eixosDaObservacao(dims, planoCom(volumeCompleto), poCom());
  provar('as três frentes existem, e nesta ordem: Corpo, Técnica, Poiesis',
    eixos.map((e) => e.id).join(',') === 'corpo,tecnica,poiesis', eixos.map((e) => e.id));
  const poiesis = eixos.find((e) => e.id === 'poiesis');
  const tecnica = eixos.find((e) => e.id === 'tecnica');
  provar('a Técnica fica com 2 dimensões e 4 itens', tecnica.dimensoes.length === 2 && tecnica.itens === 4, tecnica);
  provar('a Poiesis fica com 2 dimensões e 4 itens', poiesis.dimensoes.length === 2 && poiesis.itens === 4, poiesis);
}

// ---------------------------------------------------------------- E: o corpo

console.log('\nE. O CORPO VEM DO QUE JÁ EXISTE, E DIZ O QUE NÃO EXISTE');
{
  const eixos = eixosDaObservacao(dimensoesEItens(poCom()), planoCom(volumeCompleto), poCom());
  const corpo = eixos.find((e) => e.id === 'corpo');
  provar('conta os aspectos físicos declarados no plano',
    /2 aspectos físicos declarados/.test(corpo.resumo), corpo.resumo);
  provar('conta o ponto de partida das alunas', /ponto de partida de 1 aluna/.test(corpo.resumo), corpo.resumo);
  provar('e diz quando não há restrições declaradas', /sem restrições declaradas/.test(corpo.resumo), corpo.resumo);

  const poComRestricao = poCom({ restricoes: r('Sem saltos até a avaliação.') });
  const comRestricao = eixosDaObservacao(dimensoesEItens(poComRestricao), planoCom(volumeCompleto), poComRestricao)
    .find((e) => e.id === 'corpo');
  provar('com restrição declarada, o resumo diz isso', /restrições declaradas/.test(comRestricao.resumo)
    && !/sem restrições/.test(comRestricao.resumo), comRestricao.resumo);

  const planoVazio = planoCom(volumeCompleto);
  delete planoVazio.respostas['aspecto-fisico'];
  const semCorpo = eixosDaObservacao([], planoVazio, { respostas: {} })
    .find((e) => e.id === 'corpo');
  provar('sem nada declarado, o corpo não inventa: diz o que há (nada)',
    /sem restrições declaradas/.test(semCorpo.resumo) && !/aspecto/.test(semCorpo.resumo), semCorpo.resumo);
}

// ---------------------------------------------------------------- F: nada se perde

console.log('\nF. NADA SE PERDE: TODO ITEM CONTINUA, E O BLOCO DESCONHECIDO NÃO DESAPARECE');
{
  const po = poCom();
  const md = derivarAula01({ plano: planoCom(volumeCompleto), po, contexto: CONTEXTO, calibracao: CALIBRACAO });
  const g = guia(md);
  const itensDoPo = dimensoesEItens(po).reduce((s, d) => s + d.itens.length, 0);
  const linhasDoDetalhe = g.tabela.filter((c) => c[0] !== 'Eixo');
  provar('a tabela do detalhe tem uma linha por item do PO (' + itensDoPo + ')',
    linhasDoDetalhe.length === itensDoPo, linhasDoDetalhe.length);
  provar('e cada item do PO aparece no documento',
    dimensoesEItens(po).every((d) => d.itens.every((i) => g.corpo.join('\n').indexOf(i) !== -1)));
  provar('o resumo vem antes da tabela (é a versão sintetizada, e não a única)',
    g.corpo.findIndex((l) => /^- \*\*Corpo\*\*/.test(l)) < g.corpo.findIndex((l) => /^\| Eixo \|/.test(l)));
  provar('o resumo tem as três frentes, uma linha cada',
    ['Corpo', 'Técnica', 'Poiesis'].every((n) => g.resumo.some((l) => l.indexOf('**' + n + '**') !== -1)), g.resumo);

  const poComBlocoNovo = poCom({
    'dimensoes-de-observacao': r(['Técnica — Barra', 'Técnica — Repertório']),
    'itens-por-dimensao': r([
      { sujeito: 'Técnica — Barra', itens: 'saída do calcanhar no tendu' },
      { sujeito: 'Técnica — Repertório', itens: 'memória da sequência' },
    ]),
  });
  const md2 = derivarAula01({ plano: planoCom(volumeCompleto), po: poComBlocoNovo, contexto: CONTEXTO, calibracao: CALIBRACAO });
  const g2 = guia(md2);
  provar('um bloco fora do mapa cai em Técnica (como o prefixo já fazia) e CONTINUA no documento',
    g2.corpo.join('\n').indexOf('memória da sequência') !== -1, g2.tabela);
}

console.log('\n' + (falhas
  ? 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'
  : 'TUDO CERTO — ' + provas + ' asserções: a fatia de cada bloco vem do plano pela coluna certa '
    + '(em percentagem ou em minutos), a lacuna diz qual bloco, e o guia lê as três frentes — '
    + 'Corpo, Técnica e Poiesis — sem perder um item.'));
process.exit(falhas ? 1 : 0);
