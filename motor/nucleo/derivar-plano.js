#!/usr/bin/env node
'use strict';

/**
 * derivar-plano.js — o derivador mínimo do PE.
 *
 * Lê o conteúdo (o PO) e emite o PLANO de ramificação, conforme
 * `../ramificacao/ramificacao-schema.json`. Ele não elicita, não observa e não
 * avalia: ele executa os quatro passos declarados e REGISTRA o que encontra.
 *
 *   passo 1  ler o gatilho declarado e buscar o seu valor na resposta elicitada
 *   passo 2  entre os ramos do destino, procurar o `valor` IGUAL ao elicitado
 *   passo 3  achando, saltar para o destino e registrar o salto
 *   passo 4  não achando, PARAR e declarar a parada
 *
 * O passo 2 é deliberadamente pobre: igualdade de string, sem normalização.
 * Não há `trim`, não há prefixo, não há "o valor se aproxima".
 *
 * Fronteira: se a ramificação exigisse saber o que é DANÇA, o PE teria falhado.
 * Ele recebe um valor e salta. Nunca infere.
 *
 * Uso:
 *   node derivar-plano.js [--conteudo <caminho>] [--saida <caminho>] [--json]
 */

// NÚCLEO AGNÓSTICO — sem `fs`, sem `path`, sem `http`, sem `process`. O derivador
// recebe o CONTEÚDO (objeto) e devolve o PLANO (objeto). Quem lê o conteúdo do
// disco é o adaptador (motor/derivar-plano.js, o lado Node).

/** O endereço do conteúdo como o PLANO o escreve: relativo ao arquivo do plano. */
const ENDERECO_NO_PLANO = '../../conteudo/anamnese.json';
const NORMA_NO_PLANO = 'ARQUITETURA-ANAMNESE.md';
const VERSAO_DO_CONTRATO = '1.0.0';

const COMENTARIO =
  'Plano de ramificação DERIVADO — não escrito à mão. A fonte é ' +
  '`../../conteudo/anamnese.json`, transposto de `ARQUITETURA-ANAMNESE.md` §3, e o ' +
  'derivador é `../motor/derivar-plano.js`. Regerar é rodar o derivador, não editar ' +
  'este arquivo. As duas divergências e as três lacunas que a derivação registra são ' +
  'da NORMA, não deste arquivo: nada aqui as resolve.';

// ---------------------------------------------------------------------------
// A resolução de endereços
// ---------------------------------------------------------------------------

/**
 * Resolve um endereço `caminho.da.chave` sobre o conteúdo.
 *
 * A resolução é por `id` de campo, NUNCA por número de bloco: os blocos `3` da
 * entrevista (dez blocos) e da ficha (nove blocos) colidem, e o número não
 * distingue nada. O `id` distingue.
 */
function enderecar(conteudo, endereco) {
  const partes = endereco.split('.');
  let atual = conteudo;
  let trilha = [];

  for (const parte of partes) {
    trilha.push(parte);
    if (atual === null || typeof atual !== 'object') {
      throw new Error('endereço não resolvido em `' + parte + '`: ' + trilha.join('.'));
    }
    if (atual.campos && Array.isArray(atual.campos)) {
      const campo = atual.campos.find((c) => c.id === parte);
      if (!campo) throw new Error('campo sem `id` `' + parte + '` em ' + trilha.join('.'));
      atual = campo;
      continue;
    }
    if (!(parte in atual)) {
      throw new Error('chave ausente `' + parte + '` em ' + trilha.join('.'));
    }
    atual = atual[parte];
  }
  return atual;
}

/** A `forma` de um campo é a lista de valores separada por ` · `. */
function valoresDaForma(forma) {
  return String(forma)
    .split('·')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

// ---------------------------------------------------------------------------
// Os quatro passos
// ---------------------------------------------------------------------------

function ramosDoDestino(modulo) {
  return Array.isArray(modulo.ramos) ? modulo.ramos : [];
}

/**
 * Passo 2 — a comparação. Igualdade de string, sem normalização.
 * Devolve o ramo que casa, ou `null`.
 */
function procurarRamo(valor, ramos) {
  for (const ramo of ramos) {
    if (ramo.nivelDeclarado === valor) return ramo;
  }
  return null;
}

/**
 * Passo 4 — a parada. Não achando ramo, a elicitação PARA em vez de adivinhar.
 * A parada é um FATO REGISTRADO, não um conserto.
 */
function paradaValorSemRamo(gatilho, valor, ramos, idDivergencia) {
  return {
    id: 'ramo-3-inalcancavel',
    tipo: 'valor-sem-ramo',
    divergencia: idDivergencia,
    gatilho: gatilho.endereco,
    valorRecebido: valor,
    ramosConsiderados: ramos.map((r) => r.nivelDeclarado),
    motivo:
      'O valor `' +
      valor +
      '` — declarado na `forma` do próprio campo do gatilho — não casa, por igualdade de ' +
      'string, com nenhum dos ' +
      ramos.length +
      ' ramos do Módulo A, que esperam `Avançado (mais de 5 anos)`. Uma aluna que ' +
      'declare esse valor não é roteada: a elicitação PARA, e a parada fica registrada ' +
      'como fato (ARQUITETURA-PE.md §4.4).',
  };
}

function paradaCondicaoNaoAvaliavel(modulo, gatilho, idDivergencia) {
  return {
    id: 'modulo-b-sem-gatilho',
    tipo: 'condicao-nao-avaliavel',
    divergencia: idDivergencia,
    gatilho: gatilho.endereco,
    valorRecebido: null,
    ramosConsiderados: [],
    motivo:
      '`' +
      modulo.id +
      '` é destino declarado (o campo do gatilho o endereça em `ramifica`), mas NÃO declara ' +
      '`ramificaPor`: não é selecionado por valor. A sua condição de entrada é prosa — `' +
      modulo.condicaoDeEntrada +
      '` — e compara com a string `nunca fez balé`, que não é valor de campo nenhum: o ' +
      'valor medido do campo é `Nunca fez`. Enquanto a condição não for avaliável, a ' +
      'entrada neste destino não é decidível por esta mecânica.',
  };
}

// ---------------------------------------------------------------------------
// A derivação
// ---------------------------------------------------------------------------

function derivar(conteudo) {
  const cabecalho = conteudo.cabecalho;
  const modulos = conteudo.modulosCondicionais || [];

  // --- o gatilho (passo 1) -------------------------------------------------
  const porValor = modulos.filter((m) => typeof m.ramificaPor === 'string');
  const pelaCondicao = modulos.filter((m) => typeof m.ramificaPor !== 'string');

  if (porValor.length !== 1) {
    throw new Error(
      'esta mecânica mede UM gatilho por valor; o conteúdo declara ' + porValor.length
    );
  }

  const moduloA = porValor[0];
  const campoDoGatilho = enderecar(conteudo, moduloA.ramificaPor);
  const valoresDeclarados = valoresDaForma(campoDoGatilho.forma);

  const gatilho = {
    endereco: moduloA.ramificaPor,
    campo: campoDoGatilho.campo,
    espaco: 'anamnese',
    valoresDeclarados: valoresDeclarados,
    destinos: campoDoGatilho.ramifica,
    normalizacao: 'nenhuma',
    notaDeOrigem: 'cabecalho.campos[1].ramifica',
  };

  // --- os destinos (passos 2 e 3) ------------------------------------------
  const ramos = ramosDoDestino(moduloA);

  const destinos = [
    {
      id: moduloA.id,
      titulo: moduloA.titulo,
      selecao: 'por-valor',
      condicaoDeEntrada: moduloA.condicaoDeEntrada,
      funcao: moduloA.funcao,
      gatilho: moduloA.ramificaPor,
      ramos: ramos.map((r) => ({
        ramo: r.ramo,
        valor: r.nivelDeclarado,
        nomeNaNorma: null,
        verifica: r.verifica,
        triagem: r.triagem,
        perguntasPrevistas: 3,
      })),
    },
  ];

  for (const modulo of pelaCondicao) {
    destinos.push({
      id: modulo.id,
      titulo: modulo.titulo,
      selecao: 'pela-condicao',
      condicaoDeEntrada: modulo.condicaoDeEntrada,
      funcao: modulo.funcao,
      gatilho: null,
      ramos: null,
    });
  }

  // --- as paradas (passo 4) ------------------------------------------------
  const idDivergenciaA = 'ramo-3-inalcancavel';
  const idDivergenciaB = 'condicao-em-prosa';

  const paradas = [];
  for (const valor of valoresDeclarados) {
    if (procurarRamo(valor, ramos) === null) {
      paradas.push(paradaValorSemRamo(gatilho, valor, ramos, idDivergenciaA));
    }
  }
  for (const modulo of pelaCondicao) {
    paradas.push(paradaCondicaoNaoAvaliavel(modulo, gatilho, idDivergenciaB));
  }

  // --- o plano --------------------------------------------------------------
  return {
    $comentario: COMENTARIO,
    plano: VERSAO_DO_CONTRATO,
    conteudo: {
      endereco: ENDERECO_NO_PLANO,
      norma: NORMA_NO_PLANO,
    },
    espacosDeNomes: {
      espacos: [
        {
          id: 'entrevista',
          nome: 'Entrevista (dez blocos)',
          fonte: 'prompts/elicitar-ciclo.md',
          blocos: 10,
        },
        {
          id: 'anamnese',
          nome: 'Ficha / anamnese (nove blocos)',
          fonte: 'ARQUITETURA-ANAMNESE.md §3.2',
          blocos: 9,
        },
      ],
      colisoes: [
        {
          numero: 3,
          em: [
            { espaco: 'entrevista', titulo: 'Alunas' },
            { espaco: 'anamnese', titulo: 'Flexibilidade e Amplitude Articular' },
          ],
        },
      ],
    },
    gatilhos: [gatilho],
    destinos: destinos,
    paradas: paradas,
    divergencias: [
      {
        id: idDivergenciaA,
        resumo:
          'O valor `Avançado` tem duas redações: o campo o declara com a cauda "ou migração" ' +
          'e a tabela dos ramos não. O ramo 3 do Módulo A fica inalcançável por quem declare ' +
          'o valor do campo.',
        redacoes: [
          {
            fonte:
              'ARQUITETURA-ANAMNESE.md:221 (§3.6) e conteudo/anamnese.json — ' +
              'cabecalho.campos[1].forma',
            redacao: 'Avançado (mais de 5 anos ou migração)',
          },
          {
            fonte:
              'ARQUITETURA-ANAMNESE.md §3.3 (tabela dos ramos) e conteudo/anamnese.json — ' +
              'modulosCondicionais[0].ramos[2].nivelDeclarado',
            redacao: 'Avançado (mais de 5 anos)',
          },
        ],
        efeito: 'valor-sem-ramo',
        resolvida: false,
      },
      {
        id: idDivergenciaB,
        resumo:
          'A condição de entrada dos dois módulos condicionais é PROSA, não regra avaliável. ' +
          'Ela compara com uma string que nunca é valor do campo do gatilho.',
        redacoes: [
          {
            fonte: 'ARQUITETURA-ANAMNESE.md §3.3 (abertura de "Os dois módulos condicionais")',
            redacao: 'a aluna declarou experiência prévia no Bloco 1',
          },
          {
            fonte:
              'ARQUITETURA-ANAMNESE.md §3.3 e §5.2 e conteudo/anamnese.json — ' +
              'modulosCondicionais[*].condicaoDeEntrada',
            redacao: 'experiência prévia ≠ "nunca fez balé"',
          },
          {
            fonte: 'ARQUITETURA-ANAMNESE.md:184 (§3.6)',
            redacao: 'Iniciante total (nunca fez balé)',
          },
        ],
        efeito: 'condicao-nao-avaliavel',
        resolvida: false,
      },
    ],
    naoRamifica: [
      {
        id: 'perfis-de-entrada',
        endereco: 'observacaoInicial.perfisDeEntrada',
        itens: (conteudo.observacaoInicial.perfisDeEntrada || []).map((p) => ({
          id: p.id,
          rotulo: p.perfil,
        })),
        temGatilho: false,
        temDestino: false,
        nota:
          'Os quatro perfis de entrada não ramificam: nenhum campo do conteúdo diz qual ' +
          'deles governa, e o eixo deles NÃO coincide com o da condição única dos módulos ' +
          'condicionais — dois dos quatro perfis a satisfazem, e quais deles selecionam o quê ' +
          'a norma não declara (ARQUITETURA-ANAMNESE.md §3.1 × §3.3). Fechar a questão é ' +
          'decisão da pesquisadora.',
      },
    ],
    lacunas: [
      {
        id: 'triagem-dos-ramos',
        resumo:
          'A redação das três perguntas de triagem de cada ramo do Módulo A não existe neste ' +
          'repositório — a norma fixa a estrutura (quantas são, a que nível pertencem, o que ' +
          'cada uma decide) e declara que a redação é da entrevista. O conteúdo transcreve a ' +
          'lacuna como `[Preencher: …]`, e é esse o valor legítimo.',
        fonte: 'ARQUITETURA-ANAMNESE.md §3.3 e §9 pergunta 6',
        preenchida: false,
        preenchidaEm: null,
      },
      {
        id: 'nomes-dos-ramos',
        resumo:
          'Os três ramos têm dois nomes: o `verifica` que o conteúdo transcreve, e o nome ' +
          'canônico que a norma dá na §5.2 (Triagem de pré-requisitos, Triagem de ' +
          'consistência, Triagem de refinamento). O conteúdo não transcreve o segundo, e a ' +
          'derivação não o inventa: `ramo.nomeNaNorma` sai nulo.',
        fonte: 'ARQUITETURA-ANAMNESE.md §5.2',
        preenchida: false,
        preenchidaEm: null,
      },
      {
        id: 'destreino',
        resumo:
          'O destreino é declaração, nunca conclusão: ele é a explicação declarada de uma ' +
          'divergência que a mecânica registra, não um ramo desta mecânica. O campo que o ' +
          'hospeda — o `condicoesDeContorno` da P-11 ou a própria linha de base — segue em ' +
          'aberto, porque mapeá-lo é alargar uma pétrea.',
        fonte: 'ARQUITETURA-ANAMNESE.md §5.4 e §3.3 (Módulo B)',
        preenchida: false,
        preenchidaEm: null,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// A exportação do NÚCLEO: só lógica pura. RAIZ/lerConteudo e a CLI ficam no
// adaptador — motor/derivar-plano.js.
// ---------------------------------------------------------------------------

module.exports = {
  ENDERECO_NO_PLANO,
  NORMA_NO_PLANO,
  VERSAO_DO_CONTRATO,
  enderecar,
  valoresDaForma,
  procurarRamo,
  derivar,
};
