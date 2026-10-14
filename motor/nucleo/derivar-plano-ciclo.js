'use strict';

/**
 * derivar-plano-ciclo.js — o envelope elicitado do PLANO vira a FONTE
 * (`ciclo-XX-<escola>-plano.md`).
 *
 * É o irmão do `derivar-po.js` (que emite a fonte do PO), no mesmo sentido: a
 * geração não lê o envelope, lê a FONTE — o Markdown que
 * `tools/validar-plano-ciclo.js` extrai para o `plano-XX.json` do pacote. Este
 * módulo pega as respostas do envelope do plano e emite o Markdown da fonte.
 *
 * O que o professor decide é elicitado (objetivo, marcos, rubrica,
 * proveniência); o que vem do `.conf` da variante (duração, datas, volume)
 * sai como lacuna declarada — nunca inventado. As tabelas (marcos, volume,
 * rubrica) nascem de listas (uma linha por item), como o prompt congelado manda
 * («as listas saem como listas — uma linha por item»), e viram tabela na
 * compilação.
 *
 * Fronteira: puro (sem `fs`/`path`/`http`/`process`).
 */

const {
  respostaDo,
  emLista,
  comporPeriodicidade,
  comporMedida,
  comporData,
} = require('./derivar-po.js');

// O título do documento, no mesmo formato da fonte atual.
function tituloDoPlano(contexto) {
  const escola = (contexto && contexto.escola) || 'Escola';
  const ciclo = (contexto && contexto.ciclo) || 'NN';
  return 'Plano do Ciclo ' + ciclo + ' — ' + escola;
}

// As lacunas que vêm do `.conf` da variante — o formulário não as pergunta, e o
// derivador não adivinha (o gerador é quem tem o .conf e o calendário).
const LACUNA_DURACAO = '[Preencher: N encontros — o .conf da variante declara]';
const LACUNA_DURACAO_MINUTOS = '[Preencher: duração em minutos — o .conf declara (Pré-requisito 4)]';
const LACUNA_INICIO = '[Preencher: dd/mm/aaaa — o .conf declara]';
const LACUNA_VOLUME = '[Preencher: faixa de tempos — o sistema declara a partir da duração do ciclo]';

// A tabela de identificação do ciclo (o bloco `| Item | Valor |` que o validador
// manda para `ciclo`). Professor vem do contexto; o resto é lacuna do .conf.
function tabelaDeIdentificacao(contexto) {
  const professor = (contexto && contexto.professor) || '[a decidir]';
  return [
    '| Item | Valor |',
    '|:--|:--|',
    '| **Duração** | ' + LACUNA_DURACAO + ' |',
    '| **Duração de cada aula** | ' + LACUNA_DURACAO_MINUTOS + ' |',
    '| **Data de início** | ' + LACUNA_INICIO + ' |',
    '| **Encerramento previsto** | ver o [Calendário do ciclo](#calendario-do-ciclo) |',
    '| **Volume ativo por aula** | ' + LACUNA_VOLUME + ' |',
    '| **Professor** | ' + professor + ' |',
  ];
}

// Os marcos parciais: lista "NN: marco" → tabela `| Aula | Objetivo específico |`.
function tabelaDeMarcos(valor) {
  const itens = emLista(valor);
  const linhas = ['| Aula | Objetivo específico (marco parcial) |', '|:--|:--|'];
  itens.forEach((linha, i) => {
    const idx = linha.indexOf(':');
    const n = idx > 0 ? linha.slice(0, idx).trim() : String(i + 1).padStart(2, '0');
    const marco = idx > 0 ? linha.slice(idx + 1).trim() : linha.trim();
    linhas.push('| **' + n + '** | ' + (marco || '[a decidir]') + ' |');
  });
  return linhas.length > 2
    ? linhas
    : ['| Aula | Objetivo específico (marco parcial) |', '|:--|:--|', '| **01** | [a decidir] |'];
}

// Uma tabela "aberta" escrita como lista de linhas separadas por `|`
// (bloco | proporção | justificativa; critério | n1 | n2 | n3 | n4).
//
// Dois caminhos, e o primeiro é o novo: a GRELHA da porta grava um ARRAY DE OBJETOS —
// um por linha, com a chave de cada coluna —, e aí as colunas vêm do próprio dado, na
// ordem gravada. Sem barras, uma linha não se pode partir: era o que acontecia à
// rubrica escrita em prosa, que saía com uma célula sob um cabeçalho de cinco.
// O segundo é o caminho LEGADO (a linha única com `|`), que segue valendo.
function tabelaDeLista(valor, cabecalho, alinhamento) {
  const objetos = Array.isArray(valor)
    ? valor.filter((l) => l && typeof l === 'object' && !Array.isArray(l))
    : [];
  if (objetos.length) {
    let colunas = [];
    for (const objeto of objetos) {
      const chaves = Object.keys(objeto);
      if (chaves.length) { colunas = chaves; break; }
    }
    if (!colunas.length) return [cabecalho, alinhamento];
    const linhas = [
      '| ' + colunas.join(' | ') + ' |',
      '|' + colunas.map(() => ':--').join('|') + '|',
    ];
    for (const objeto of objetos) {
      linhas.push('| ' + colunas.map((c) => {
        const v = objeto[c] == null ? '' : String(objeto[c]).trim();
        return v ? '**' + v + '**' : '[a decidir]';
      }).join(' | ') + ' |');
    }
    return linhas;
  }
  const itens = emLista(valor);
  const linhas = [cabecalho, alinhamento];
  for (const linha of itens) {
    const cols = linha.split('|').map((c) => c.trim());
    linhas.push('| ' + cols.map((c) => (c ? '**' + c + '**' : '[a decidir]')).join(' | ') + ' |');
  }
  return linhas.length > 2 ? linhas : [cabecalho, alinhamento];
}

// O contexto do plano (Bloco 1 do prompt): o campo empírico, o contexto da
// observação e a metodologia/notação — declaradas, nunca deduzidas.
function tabelaDeContexto(envelope) {
  const linhas = ['| Item | Valor |', '|:--|:--|'];
  const par = (rotulo, valor) => {
    linhas.push('| **' + rotulo + '** | ' + (valor || '[a decidir]') + ' |');
  };
  par('Escola', respostaDo(envelope, 'contexto-escola'));
  par('Professor', respostaDo(envelope, 'contexto-professor'));
  // A turma passou a aceitar MAIS de uma (multipla): o valor é uma lista, e o
  // plano a escreve como «A · B», nunca como array colado por vírgula.
  par('Turmas', emLista(respostaDo(envelope, 'contexto-turma')).join(' · ') || null);
  par('Frequência', comporPeriodicidade(respostaDo(envelope, 'contexto-frequencia')));
  par('Duração por aula', comporMedida(respostaDo(envelope, 'contexto-duracao')));
  par('Calendário', comporData(respostaDo(envelope, 'contexto-calendario')));
  par('Número total de aulas', respostaDo(envelope, 'contexto-total-aulas'));
  par('Volume de trabalho', comporMedida(respostaDo(envelope, 'contexto-volume')));
  par('Condição de registro', respostaDo(envelope, 'contexto-registro'));
  par('Metodologia de referência', respostaDo(envelope, 'contexto-metodologia'));
  par('Quem escolhe a metodologia', respostaDo(envelope, 'contexto-metodologia-origem'));
  par('Notação dominada', respostaDo(envelope, 'contexto-notacao'));
  return linhas;
}

/**
 * A derivação: o envelope elicitado do plano vira o Markdown da fonte.
 * Devolve `{ markdown, meta }` — `meta` é o cabeçalho YAML.
 */
function derivarPlano(envelope) {
  const contexto = (envelope && envelope.contexto) || {};
  const saida = [];

  const referencias = emLista(respostaDo(envelope, 'referencias')).join('; ');

  saida.push('---');
  saida.push('projeto: Formação em Balé Clássico');
  saida.push('frente: Plano');
  saida.push('ciclo: "' + (contexto.ciclo || 'NN') + '"');
  saida.push('escola: ' + (contexto.escola || 'Escola'));
  saida.push('professor: ' + (contexto.professor || 'Professor'));
  saida.push('title: "' + tituloDoPlano(contexto) + '"');
  saida.push('subtitle: "Objetivo geral, marcos parciais, rubrica e calibração de volume"');
  if (referencias) saida.push('referencias: "' + referencias + '"');
  saida.push('---');
  saida.push('');

  const secao = (titulo, corpo) => {
    saida.push('## ' + titulo);
    saida.push('');
    for (const linha of corpo) saida.push(linha);
    saida.push('');
  };
  const prosa = (titulo, valor) => {
    secao(titulo, [valor === null || valor === '' ? '[a decidir]' : String(valor)]);
  };
  const lista = (titulo, valor) => {
    const itens = emLista(valor);
    secao(titulo, itens.length ? itens.map((v) => '- ' + v) : ['- [a decidir]']);
  };

  // Contexto (Bloco 1 do prompt): onde, para quem, sob que condições — e a
  // metodologia/notação declaradas (P-16).
  secao('Contexto', tabelaDeContexto(envelope));

  // Objetivo geral (prosa) + a tabela de identificação do ciclo (item/valor).
  secao('Objetivo geral', [
    respostaDo(envelope, 'objetivo-geral') === null
      ? '[Preencher: objetivo geral do ciclo — o PO elicitado o estabelece]'
      : String(respostaDo(envelope, 'objetivo-geral')),
    '',
    ...tabelaDeIdentificacao(contexto),
  ]);

  // As alunas (Bloco 3 do prompt) não vivem mais no plano: o plano de ensino é
  // agnóstico à turma — o grupo fica em `contexto-turma`, e os apelidos e a
  // linha de base individuais vivem na anamnese e entram pelo PO (`sujeitos`).

  // Marcos parciais: tabela, uma linha por aula.
  secao('Marcos parciais por aula', tabelaDeMarcos(respostaDo(envelope, 'marcos-por-aula')));

  // O calendário entra pelo gerador (o marcador fica no lugar).
  saida.push('<!-- CALENDARIO -->');
  saida.push('');

  // Estrutura de cada aula (lista) — Regra 3.
  lista('Estrutura de cada aula', respostaDo(envelope, 'estrutura-de-cada-aula'));

  // Distribuição do volume pelos blocos (tabela) — Regra 9, etapa 2.
  secao(
    'Distribuição do volume pelos blocos',
    tabelaDeLista(
      respostaDo(envelope, 'distribuicao-de-volume'),
      '| Bloco | Proporção alvo (60 min) | Justificativa |',
      '|:--|:--|:--|',
    ),
  );

  // Condições preliminares (lista).
  lista('Condições preliminares', respostaDo(envelope, 'condicoes-preliminares'));

  // Rubrica: tabela de 5 colunas (critério + 4 níveis).
  secao(
    'Rubrica de avaliação final',
    tabelaDeLista(
      respostaDo(envelope, 'rubrica'),
      '| Critério | Insatisfatório | Em desenvolvimento | Satisfatório | Excelente |',
      '|:--|:--|:--|:--|:--|',
    ),
  );

  // Critério de extensão (prosa) — se vazio, sai como lacuna (não é required).
  prosa('Critério de extensão', respostaDo(envelope, 'criterio-de-extensao'));

  // Registro de proveniência (prosa) — required.
  prosa('Registro de proveniência', respostaDo(envelope, 'proveniencia'));

  return {
    markdown: saida.join('\n') + '\n',
    meta: {
      frente: 'Plano',
      ciclo: contexto.ciclo || 'NN',
      escola: contexto.escola || 'Escola',
      professor: contexto.professor || 'Professor',
      title: tituloDoPlano(contexto),
    },
  };
}

module.exports = {
  derivarPlano,
  tituloDoPlano,
  tabelaDeMarcos,
  tabelaDeLista,
  tabelaDeIdentificacao,
};
