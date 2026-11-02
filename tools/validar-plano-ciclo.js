#!/usr/bin/env node
'use strict';

/*
 * validar-plano-ciclo.js — valida o PLANO de um ciclo (Regra 10, camada 1).
 *
 *   uso: node tools/validar-plano-ciclo.js <schema.json> <ciclo-XX-plano.md> [--json]
 *
 * Irmão do validar-po-ciclo.js: a EXTRAÇÃO é do MESMO contrato compartilhado
 * (tools/lib-extracao-md.js) — `## Seção → campo`, `### Subcampo → subcampo`, `- item →
 * array`, tabela → array de objetos (ou OBJETO, quando o bloco é item/valor). O que é DESTE
 * documento é a DECLARAÇÃO (o mapa das seções, o das colunas e os blocos item/valor) e a
 * validação contra o schema do plano.
 *
 * AS LACUNAS SÃO DECLARADAS. O plano não tem tudo o que a referência do experimento tem, e o
 * que falta ou é PROSA ou é do .conf: o extrator não adivinha — declara `[Preencher: …]`, no
 * campo quando o tipo o permite, e em `_lacunas` quando o campo é um array (não há onde
 * pendurar a chave). É a mesma regra dos outros entregáveis: o que não existe na fonte sai
 * declarado, nunca inventado.
 *
 * Sai com 0 se os campos obrigatórios existem e têm o tipo correto; com 1 imprimindo os
 * erros.
 */

const fs = require('fs');
const path = require('path');
const { extrair, lerYamlCabecalho, avisosDeSecaoSoCitacao, avisosDeSecaoNaoMapeada } = require('./lib-extracao-md.js');
const { validar } = require('./lib-validacao-md.js');

// Títulos em português do documento → propriedades do schema. As CHAVES do mapa são o título
// em minúsculas: é assim que o contrato normaliza o `## Seção` para procurar.
const MAPA_SECOES = {
  // O CONTEXTO (Bloco 1) — doze fatos que o professor declara e que NÃO chegavam ao derivado:
  // o título estava fora do mapa, e uma seção fora do mapa é descartada em silêncio. O
  // `plano-XX.json` do pacote saía sem escola, turma, frequência, duração, calendário, número
  // de aulas, volume, registro, metodologia nem notação — e o `ciclo` logo abaixo (a ficha do
  // ciclo) saía inteiro em `[Preencher]`, com os valores escritos doze linhas acima. Quem lê o
  // plano pela máquina (as vistas e o guia) não os via. É a tabela item/valor do bloco, e é
  // `PARES` que a manda para o objeto `contexto`.
  'contexto': 'contexto',
  'objetivo geral': 'objetivoGeral',
  /* OS OBJETIVOS ESPECÍFICOS (26/10/2026) — a LISTA do ciclo, e a dona da relação com os
     blocos. Ela ocupa o lugar da «Estrutura de cada aula», que confundia a relação
     objetivo × bloco com a estrutura da própria aula. */
  'objetivos específicos': 'objetivosEspecificos',
  'marcos parciais por aula': 'marcosPorAula',
  // «ESTRUTURA DE CADA AULA» — o título de antes, e o ALIAS fica: há documento no repositório
  // (e envelope antigo) que ainda o escreve, e ele extraía. O que a derivação já não emite é a
  // secção — o campo continua a existir no schema, como leitura do passado.
  'estrutura de cada aula': 'estruturaDeCadaAula',
  // O TÍTULO DO DOCUMENTO, e o ALIAS do título antigo. O mapa pedia só «… pelos blocos (regra 9,
  // etapa 2)» — um sufixo com o número da regra que a derivação NÃO escreve: a distribuição do
  // volume ficou fora do `plano-XX.json` de todo plano gerado pelo sistema, e o guia imprimia
  // «Lacunas — distribuição do volume» sobre uma tabela preenchida. O alias fica porque há
  // documento no repositório que escreve o título longo (`experimentos/simulacao-marau`), e ele
  // extraía antes desta correção: preservar o que já funcionava é parte do contrato.
  //
  // «BLOCOS DA AULA E DISTRIBUIÇÃO DO VOLUME» (26/10/2026): o título passa a dizer que este
  // quadro É a estrutura da aula — os blocos que ela tem e a fatia de cada um. Os dois títulos
  // anteriores continuam a extrair, pelo mesmo motivo de sempre.
  'blocos da aula e distribuição do volume': 'distribuicaoDeVolume',
  'distribuição do volume pelos blocos': 'distribuicaoDeVolume',
  'distribuição do volume pelos blocos (regra 9, etapa 2)': 'distribuicaoDeVolume',
  // A SEQUÊNCIA DE EXERCÍCIOS (16/10/2026): a seção nasceu na derivação e ficou FORA do mapa —
  // a mesma armadilha da distribuição, uma data depois. O conteúdo chegava ao `.md` e não ao
  // `plano-XX.json` do pacote: quem lê o plano pela máquina (as vistas e o guia) não tinha a
  // linha da aula — os exercícios, os objetivos que cada um trabalha e os tempos.
  //
  // ELA SAIU DO PLANO EM 26/10/2026 — o alias fica, e não é preguiça: há documento no
  // repositório que ainda escreve a seção (`experimentos/`, planos antigos), e ele extraía
  // antes desta mudança. O que mudou é que a derivação já não a emite: o detalhe vive na
  // `aula-NN.md`, e o plano publica o apanhado (`## Objetivos por bloco e por aula`).
  'sequência de exercícios por bloco': 'sequenciaDeExercicios',
  // A RÉGUA virou seção própria (14/10/2026): é uma LISTA de níveis — o que o lançamento da
  // aula lê para marcar. O cabeçalho da tabela da rubrica perde o rótulo no extrator (vira
  // chave), e é por isso que a régua viaja em lista.
  'régua da rubrica': 'reguaDaRubrica',
  // «Rubrica de avaliação final» — a tabela de critérios × níveis. A derivação JÁ NÃO A EMITE
  // (26/10/2026): a régua é uma só, e o critério de cada aula nasce no lançamento. O mapa fica
  // para os planos antigos, que a têm escrita, continuarem a extrair.
  'rubrica de avaliação final': 'rubrica',
  // As duas condições e o critério de extensão: seções que o documento sempre teve e o mapa
  // não conhecia — e o mesmo silêncio.
  'condições preliminares': 'condicoesPreliminares',
  // «HORIZONTE DO CICLO» (26/10/2026): o título antigo prometia «critério» e o conteúdo é
  // horizonte — até onde os marcos estão decididos. O alias fica para os planos que ainda o
  // escrevem assim (e para o documento de simulação, que o escreve desde antes).
  'horizonte do ciclo': 'criterioDeExtensao',
  'critério de extensão': 'criterioDeExtensao',
  // A MÚSICA e o REPERTÓRIO: dois nós respondíveis que não tinham SEÇÃO (falha da derivação,
  // não do mapa) e que por isso não chegavam a documento nenhum.
  // «Música e vídeo de referência» (02/11/2026): o título antigo prometia o repertório, que é a
  // secção seguinte. Os dois nomes ficam no mapa — há plano no repositório escrito com o antigo.
  // O ASPECTO FÍSICO — FORÇA E FLEXIBILIDADE (02/11/2026): o primeiro dos três eixos do que se
  // observa em dança, e o que a Regra 4 pede. Sem esta linha a secção não era extraída, e o
  // mapa documenta que um título fora dele descarta a secção INTEIRA, em silêncio.
  'aspecto físico — força e flexibilidade': 'aspectoFisico',
  'música e vídeo de referência': 'musicasVideos',
  'músicas e vídeos': 'musicasVideos',
  'repertório': 'repertorio',
  'registro de proveniência': 'proveniencia',
  'calendário do ciclo': 'calendario',
};

// O mapa das COLUNAS: chave derivada (cabeçalho da tabela, ou rótulo do par) → chave do alvo.
const MAPA_COLUNAS = {
  // a tabela de identificação do ciclo (no bloco `Objetivo geral`, que a declaração manda
  // para `ciclo` — ver PARES)
  duracao: 'duracaoAulas',
  duracaoDeCadaAula: 'duracaoMinutos',
  dataDeInicio: 'inicio',
  encerramentoPrevisto: 'encerramento',
  // os marcos parciais
  aula: 'n',
  objetivoEspecificoMarcoParcial: 'marco',
  // A LISTA DOS OBJETIVOS (26/10/2026) — a tabela `| N | Objetivo específico | Bloco(s) |`. A
  // coluna «Objetivo específico» aqui é o TEXTO do objetivo; na tabela dos marcos, o cabeçalho
  // com o sufixo `(marco parcial)` é o do marco. Duas chaves, dois destinos.
  objetivoEspecifico: 'objetivo',
  blocosOndeETrabalhado: 'blocos',
  // A coluna «Objetivos» da tabela dos marcos — os NÚMEROS que aquela aula persegue.
  objetivos: 'objetivos',
};

// Os blocos cuja tabela é ITEM/VALOR. No plano, a identificação do ciclo está sob "Objetivo
// geral" — o mesmo bloco tem a prosa (objetivoGeral) e a tabela (ciclo). O `## Contexto` é a
// outra tabela item/valor do documento, e vai para o objeto próprio (`contexto`).
const PARES = { objetivoGeral: 'ciclo', contexto: 'contexto' };

const DECLARACAO = { secoes: MAPA_SECOES, colunas: MAPA_COLUNAS, pares: PARES };

// AS LACUNAS DECLARADAS — o que o documento não tem em forma de dado. O motivo vai escrito:
// quem lê o `[Preencher]` sabe de quem é a decisão (e de que a conversão não foi feita, não
// que o dado não exista no documento).
const LACUNAS = {
  calendario: 'o calendário não está no .md — o gerador injeta o bloco calculado do .conf da '
    + 'variante (Regra 10, camada 2)',
  // `rubrica.aplicadaEm` SAIU (26/10/2026). A lacuna apontava para a tabela de critérios que a
  // derivação já não emite: num plano novo `rubrica` não existe, e a lacuna caía em `_lacunas`
  // sem destino — ruído num campo que ninguém lê. O que a tabela diria, o professor declara no
  // lançamento; o schema mantém `rubrica` para o documento antigo, e o mapa mantém o título.
};

/**
 * Aplica as lacunas declaradas. Onde o caminho pode hospedar a chave (o pai é um objeto), ela
 * entra no campo; onde não pode (o pai é um array, ou não existe), a lacuna vai para
 * `_lacunas` — declarada, fora da forma que não a comporta.
 */
function aplicarLacunas(campos) {
  const semLugar = [];
  Object.entries(LACUNAS).forEach(([caminho, motivo]) => {
    const partes = caminho.split('.');
    const folha = partes.pop();
    let alvo = campos;
    for (const p of partes) {
      if (!alvo[p] || typeof alvo[p] !== 'object' || Array.isArray(alvo[p])) { alvo = null; break; }
      alvo = alvo[p];
    }
    if (!alvo) semLugar.push({ campo: caminho, declara: `[Preencher: ${motivo}]` });
    else if (alvo[folha] === undefined) alvo[folha] = `[Preencher: ${motivo}]`;
  });
  return semLugar;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const [caminhoSchema, caminhoPlano] = args.filter((a) => !a.startsWith('--'));
  if (!caminhoSchema || !caminhoPlano) {
    console.error('uso: node tools/validar-plano-ciclo.js <schema.json> <ciclo-XX-plano.md> [--json]');
    return 2;
  }

  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(caminhoSchema, 'utf8'));
  } catch (e) {
    console.error(`erro: não consegui ler o schema ${caminhoSchema} (${e.message})`);
    return 1;
  }
  if (!Array.isArray(schema.required)) {
    console.error(`erro: o schema ${path.basename(caminhoSchema)} não declara 'required'`);
    return 1;
  }

  let linhas;
  try {
    linhas = fs.readFileSync(caminhoPlano, 'utf8').split('\n');
  } catch (e) {
    console.error(`erro: não consegui ler ${caminhoPlano} (${e.message})`);
    return 1;
  }

  const meta = lerYamlCabecalho(linhas);
  const { campos, avisos: avisosDaExtracao, secoesSoCitacao, secoesNaoMapeadas } =
    extrair(linhas, schema, DECLARACAO);
  const lacunasSemLugar = aplicarLacunas(campos);
  if (lacunasSemLugar.length) campos._lacunas = lacunasSemLugar;

  // A VALIDAÇÃO É DA LIB (lib-validacao-md.js): obrigatórios, tipos, avisos da regra de
  // tabela e provisórios. As lacunas declaradas saem em `lacunas`, para o tool decidir.
  const { erros, avisos: avisosDaValidacao, provisorios } = validar(campos, schema, {});
  const avisos = [...avisosDaExtracao, ...avisosDaValidacao,
    ...avisosDeSecaoSoCitacao(secoesSoCitacao, linhas),
    ...avisosDeSecaoNaoMapeada(secoesNaoMapeadas, linhas)];

  if (json) {
    process.stdout.write(`${JSON.stringify(campos, null, 2)}\n`);
  }
  const escrever = json ? (...a) => console.error(...a) : (...a) => console.log(...a);

  if (erros.length) {
    console.error(`plano ${path.basename(caminhoPlano)} × schema ${path.basename(caminhoSchema)}`);
    console.error(`${erros.length} problema(s):`);
    for (const p of erros) console.error(`  - ${p}`);
    // OS AVISOS SAEM TAMBÉM NO ERRO — é aqui que eles mais servem: uma seção cujo único
    // conteúdo é citação não gera o campo, e o erro diz só `campo ausente`. Sem esta linha,
    // a causa (`> nota`) ficava escondida atrás do sintoma.
    if (avisos.length) {
      console.error(`    aviso(s): ${avisos.length}`);
      for (const a of avisos) console.error(`      · ${a}`);
    }
    return 1;
  }

  escrever(`ok: ${path.basename(caminhoPlano)} satisfaz ${path.basename(caminhoSchema)}`
    + ` (${schema.required.length} campos obrigatórios)`);
  escrever(`    campos extraídos: ${Object.keys(campos).length} · estado declarado: `
    + `${meta.state || '(sem state no cabeçalho)'}`);
  if (provisorios.length) {
    escrever(`    provisórios '[Preencher]': ${provisorios.length} —`
      + ' decisão da pesquisadora, ou do gerador (o calendário)');
  }
  if (avisos.length) {
    escrever(`    avisos: ${avisos.length}`);
    avisos.forEach((a) => escrever(`      · ${a}`));
  }
  return 0;
}

process.exit(main());
