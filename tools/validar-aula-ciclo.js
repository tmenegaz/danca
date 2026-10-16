#!/usr/bin/env node
'use strict';

/*
 * validar-aula-ciclo.js — valida o PLANO DE UMA AULA de um ciclo (ARQUITETURA-AULA.md §1.2).
 *
 *   uso: node tools/validar-aula-ciclo.js <schema.json> <ciclo-XX-<variante>-aula-NN.md> [--json]
 *
 * Irmão do validar-plano-ciclo.js: a EXTRAÇÃO é do MESMO contrato compartilhado
 * (tools/lib-extracao-md.js) — `## Seção → campo`, `### Subcampo → subcampo`, `- item →
 * array`, tabela → array de objetos (ou OBJETO, quando o bloco é item/valor). O que é DESTE
 * documento é a DECLARAÇÃO (o mapa das seções e os blocos item/valor) e a validação contra o
 * schema da aula. O `MAPA_COLUNAS` está vazio de propósito: as colunas das tabelas da aula
 * divergem por dialeto (a §5 abre com `Dimensão` no `fokini` e com `Critério` no `tiago`), e
 * a chave derivada do cabeçalho — que já sai em camelCase — é a que o documento oferece.
 *
 * ⚠️ O MODO DE FALHA POR OMISSÃO DESTE CONTRATO. As chaves de MAPA_SECOES são casadas
 * LITERALMENTE com o título em minúsculas (tools/lib-extracao-md.js:244-249), e um título
 * fora do mapa não produz campo nenhum: um typo, uma maiúscula a mais ou um caractere
 * diferente descartam a seção inteira — zero campos para ela. Desde 16/10/2026 esse descarte
 * **sai em aviso** (`avisosDeSecaoNaoMapeada`, quando a seção TEM conteúdo): até então o
 * aviso existia e NUNCA disparava — `if (!secao) continue;` vinha antes do
 * `secaoTeveConteudo = true`, a lista saía sempre vazia, e o modo de falha era um falso "ok"
 * de verdade. É por isso que o mapa enumera as VARIANTES medidas em vez de adivinhar por
 * padrão: quando uma aula nova não cair aqui, o certo é acrescentar a variante — e o aviso
 * agora o diz, em vez de calar.
 *
 * AS LACUNAS SÃO DECLARADAS. O que a aula não tem em forma de dado o extrator não adivinha:
 * declara `[Preencher: …]` no campo, quando o tipo o permite, e em `_lacunas` quando o campo
 * é um array (não há onde pendurar a chave). É a mesma regra dos outros entregáveis: o que não
 * existe na fonte sai declarado, nunca inventado.
 *
 * O `required` É SÓ `identificacao`, E O MOTIVO É MEDIDO. Os três dialetos de aula vivos no
 * repositório não têm as mesmas seções (AGENTS.md:29 — o protótipo existe para provar que o
 * modelo se sustenta nessa variação): o `fokini` tem 9 seções, o `tiago` (aula-01) tem a §7
 * Notação em Benesh, e o `tiago` (ritmos-aula-01) tem 6. `identificacao` é o único campo
 * presente e com o tipo esperado nos sete ficheiros de aula; tudo o mais sai `undefined`
 * exatamente onde o dialeto não tem a seção, e como `undefined` só existe fora do `required`,
 * isso não é erro (tools/lib-validacao-md.js:36-38). Um `required` maior reprovaria metade do
 * corpus — e a variação é o fenómeno, não o defeito.
 *
 * Sai com 0 se os campos obrigatórios existem e têm o tipo correto; com 1 imprimindo os
 * erros. AVISOS NUNCA CAUSAM 1 — medido: o plano do `tiago` sai com 2 avisos e exit 0.
 */

const fs = require('fs');
const path = require('path');
const { extrair, lerYamlCabecalho, avisosDeSecaoSoCitacao, avisosDeSecaoNaoMapeada } = require('./lib-extracao-md.js');
const { validar } = require('./lib-validacao-md.js');

// Títulos em português do documento → propriedades do schema. As CHAVES do mapa são o título
// em minúsculas, com o número e o `·` (U+00B7): é assim que o contrato normaliza o `## Seção`
// para procurar, e o número NÃO é descartado. As linhas repetidas por título diferente — o
// mesmo campo por duas chaves — são a TOLERÂNCIA AOS TRÊS DIALETOS: o mesmo bloco aparece com
// numeração diferente conforme a aula, e as duas formas têm de chegar ao mesmo campo.
const MAPA_SECOES = {
  "1. validação dos objetivos, métricas e duração": "validacaoDaAula",
  "2. condições preliminares de preparação (força e flexibilidade)": "condicoesPreliminares",
  "2. pré-requisitos declarados pelo professor": "condicoesPreliminares",
  "3. a sequência conectada (fio condutor)": "sequenciaDaAula",
  "3. a sequência da aula (fio condutor)": "sequenciaDaAula",
  "4. bloco de musicalidade (8 tempos · 9%)": "blocoDeMusicalidade",
  "4. bloco de musicalidade (8 tempos · 10%)": "blocoDeMusicalidade",
  "4. distribuição do volume físico": "distribuicaoDoVolume",
  "5. guia de observação do professor": "guiaDeObservacao",
  "5. musicalidade e repertório": "musicalidade",
  "6. distribuição do volume físico": "distribuicaoDoVolume",
  "6. notas de proveniência": "proveniencia",
  "7. proveniência consolidada": "proveniencia",
  "7. distribuição do volume pelos blocos (comparação com o ciclo)": "distribuicaoPelosBlocos",
  "7. notação em benesh": "notacaoEmBenesh",
  "8. registro de auditoria da aula": "auditoria",
  "8. proveniência consolidada": "proveniencia",
  "9. próximo passo": "proximoPasso",
  "9. registro de auditoria da aula": "auditoria",
  "10. próximo passo": "proximoPasso",
};

// Sem mapa de colunas: as chaves que o contrato deriva do cabeçalho das tabelas já são as que
// o schema declara, e fixá-las exigiria eleger um dialeto como canon (ver o comentário do
// cabeçalho). A tabela do §4 do dialeto C (`| Bloco | Tempo estimado | Volume (tempos) |`)
// produz chaves diferentes da §6 do dialeto A (`| Bloco | Tempos | Fatia |`) para o MESMO
// campo `distribuicaoDoVolume` — e é assim que tem de ser.
const MAPA_COLUNAS = {};

// Os blocos cuja tabela é ITEM/VALOR. Na aula, a tabela da §1 é item/valor — e a PROSA da
// mesma seção fica em `validacaoDaAula`. Um bloco, dois destinos: é por isso que o par existe.
const PARES = { validacaoDaAula: 'identificacao' };

const DECLARACAO = { secoes: MAPA_SECOES, colunas: MAPA_COLUNAS, pares: PARES };

// AS LACUNAS DECLARADAS — o que o documento não tem em forma de dado. O motivo vai escrito:
// quem lê o `[Preencher]` sabe de quem é a decisão.
const LACUNAS = {
  'identificacao.dataEHorarioDestaAula': 'a data desta aula não está na fonte — os dialetos B/C remetem a '
    + '`plano.html#calendario-do-ciclo`, e quem a sabe é o .conf da variante (Regra 10, '
    + 'camada 2: frequência, dias, duração, datas reais)',
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
  const [caminhoSchema, caminhoAula] = args.filter((a) => !a.startsWith('--'));
  if (!caminhoSchema || !caminhoAula) {
    console.error('uso: node tools/validar-aula-ciclo.js <schema.json> <ciclo-XX-<variante>-aula-NN.md> [--json]');
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
    linhas = fs.readFileSync(caminhoAula, 'utf8').split('\n');
  } catch (e) {
    console.error(`erro: não consegui ler ${caminhoAula} (${e.message})`);
    return 1;
  }

  const meta = lerYamlCabecalho(linhas);
  const { campos, avisos: avisosDaExtracao, secoesSoCitacao, secoesNaoMapeadas } = extrair(linhas, schema, DECLARACAO);
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
    console.error(`aula ${path.basename(caminhoAula)} × schema ${path.basename(caminhoSchema)}`);
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

  escrever(`ok: ${path.basename(caminhoAula)} satisfaz ${path.basename(caminhoSchema)}`
    + ` (${schema.required.length} campos obrigatórios)`);
  escrever(`    campos extraídos: ${Object.keys(campos).length} · estado declarado: `
    + `${meta.state || '(sem state no cabeçalho)'}`);
  if (provisorios.length) {
    escrever(`    provisórios '[Preencher]': ${provisorios.length} —`
      + ' decisão da pesquisadora');
  }
  if (avisos.length) {
    escrever(`    avisos: ${avisos.length}`);
    avisos.forEach((a) => escrever(`      · ${a}`));
  }
  return 0;
}

process.exit(main());
