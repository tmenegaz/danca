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
  condicaoDeRegistroEmTexto,
  ROTULOS_DO_CONTEXTO,
  COMPOR_DO_CONTEXTO,
} = require('./derivar-po.js');

// OS BLOCOS DA AULA — a ordem canónica da Regra 3 (solo → barra → centro), a
// musicalidade e a expressão. Os quatro primeiros são a estrutura espacial; a EXPRESSÃO
// entra como bloco próprio porque é ela que fecha os últimos minutos de uma aula de dança
// (a parte artística do aluno), e sem lugar próprio ficaria fora do volume e da captura.
// É o mesmo rol que o conteúdo declara no plano — uma lista canónica, duas pontas.
const BLOCOS_DA_AULA = ['Solo', 'Barra', 'Centro', 'Musicalidade', 'Expressão'];

// OS QUATRO NÍVEIS da rubrica — decididos (FRENTES, confirmação bloqueante nº 1) e
// alinhados no conteúdo e na derivação. A partir de 14/10/2026 a régua é DA TURMA (a
// escola declara e muda em comitê; o plano adota e registra a que adotou); esta lista é o
// PADRÃO declarado — o que nasce com uma turma nova e o que vale quando o envelope do
// plano não traz régua nenhuma.
const NIVEIS_DA_RUBRICA = ['Satisfatório', 'Razoável', 'Em desenvolvimento', 'Não se aplica'];

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
function tabelaDeIdentificacao(contexto, envelope) {
  // A FICHA DO CICLO é COMPOSTA DO CONTEXTO (14/10/2026). Antes ela saía inteira em
  // `[Preencher: …]` — «o .conf da variante declara» — enquanto o `## Contexto`, doze linhas
  // acima, trazia os mesmos fatos já declarados pelo professor: a duração, a duração de cada
  // aula, o número de encontros, o volume e o calendário. O `plano-XX.json` do pacote publicava
  // a lacuna e escondia o valor. Agora o professor declara UMA vez (no contexto, alimentado
  // pela turma) e a ficha lê de lá; o `[Preencher]` fica só para o que o contexto não tem —
  // e continua com o motivo escrito, para quem lê saber de quem é a decisão.
  const cru = (id) => {
    const compor = COMPOR_DO_CONTEXTO[id];
    return compor ? compor(respostaDo(envelope, id)) : respostaDo(envelope, id);
  };
  const celula = (v) => String(v === null || v === undefined ? '' : v).replace(/\|/g, '/');
  const total = cru('contexto-total-aulas');
  // O número de encontros vem da turma como NÚMERO (`totalAulas`). Sob o rótulo «Duração», um
  // `7` solto não diz de quê — e o próprio schema descreve este campo com a unidade no valor
  // (`"12 aulas (extensível a 16…)"`). A unidade entra só quando o valor é número puro: uma
  // origem escrita à mão («12 aulas») passa como veio.
  const duracaoAulas = typeof total === 'number' || /^\d+$/.test(String(total || '').trim())
    ? String(total).trim() + ' aulas'
    : total;
  const duracao = cru('contexto-duracao');
  const volume = cru('contexto-volume');
  const calendario = respostaDo(envelope, 'contexto-calendario');
  const inicio = calendario && calendario.inicio ? String(calendario.inicio) : null;
  const fim = calendario && calendario.fim ? String(calendario.fim) : null;
  const professor = (contexto && contexto.professor) || '[a decidir]';
  return [
    '| Item | Valor |',
    '|:--|:--|',
    '| **Duração** | ' + celula(duracaoAulas || LACUNA_DURACAO) + ' |',
    '| **Duração de cada aula** | ' + celula(duracao || LACUNA_DURACAO_MINUTOS) + ' |',
    '| **Data de início** | ' + celula(inicio || LACUNA_INICIO) + ' |',
    // o encerramento É o fim do calendário declarado; sem ele, o documento manda ver o bloco
    // do calendário — que o gerador injeta do `.conf` (Regra 10, camada 2)
    '| **Encerramento previsto** | '
      + (fim ? celula(fim) : 'ver o [Calendário do ciclo](#calendario-do-ciclo)') + ' |',
    '| **Volume ativo por aula** | ' + celula(volume || LACUNA_VOLUME) + ' |',
    '| **Professor** | ' + celula(professor) + ' |',
  ];
}

// Os marcos parciais: lista "NN: marco" → tabela `| Aula | Objetivo específico |`.
//
// O número é do SISTEMA: a lista numerada da porta grava só o texto, e a linha sai
// numerada aqui — 01, 02, 03… O prefixo «NN:» é o caminho LEGADO (a prosa antiga) e só
// conta como número quando é mesmo um número: um marco que tenha dois-pontos no meio
// («Solo: eixo vertical») não perde o começo para a coluna da aula.
function tabelaDeMarcos(valor) {
  const itens = emLista(valor);
  const linhas = ['| Aula | Objetivo específico (marco parcial) |', '|:--|:--|'];
  itens.forEach((linha, i) => {
    const idx = linha.indexOf(':');
    const prefixo = idx > 0 ? linha.slice(0, idx).trim() : '';
    const numerado = /^\d{1,3}$/.test(prefixo);
    const n = numerado ? prefixo.padStart(2, '0') : String(i + 1).padStart(2, '0');
    const marco = numerado ? linha.slice(idx + 1).trim() : linha.trim();
    linhas.push('| **' + n + '** | ' + (marco || '[a decidir]') + ' |');
  });
  return linhas.length > 2
    ? linhas
    : ['| Aula | Objetivo específico (marco parcial) |', '|:--|:--|', '| **01** | [a decidir] |'];
}

// Os MARCOS PARCIAIS como lista de textos — o que a matriz por marco (blocos,
// parâmetro) e o objetivo da Aula 1 leem. Aceita a forma NOVA (lista numerada: array
// de textos) e a LEGADA (prosa «NN: marco»).
// O PARÂMETRO DE MEDIÇÃO da aula (a matriz objetivo × o que se observa): uma linha por marco,
// com o objetivo citado e o que se vai observar para dizer «alcançado». A forma LEGADA (a prosa
// escrita à mão, como nos planos antigos) passa como veio.
//
// Existe porque a matriz `porMarco` do formulário chega como OBJETO (`{marco, marcados}`): sem
// esta composição, o `prosa()` do derivador da aula fazia `String([{…}])` e o documento publicado
// dizia `[object Object]` — o dado estava certo e o documento, mudo.
function parametroEmLinhas(valor, marcos) {
  const objetos = Array.isArray(valor)
    ? valor.filter((l) => l && typeof l === 'object' && !Array.isArray(l))
    : [];
  if (!objetos.length) return emLista(valor).filter(Boolean);
  const linhas = [];
  for (const linha of objetos) {
    const n = Number(linha.marco);
    const texto = Number.isFinite(n) ? (marcos[n - 1] || '') : '';
    const itens = (Array.isArray(linha.marcados) ? linha.marcados : [])
      .map((v) => String(v).trim()).filter(Boolean);
    if (!Number.isFinite(n) && !itens.length) continue;
    linhas.push('**' + (Number.isFinite(n) ? n : '') + '**' + (texto ? ' ' + texto : '')
      + (itens.length ? ' — observa: ' + itens.join(' · ') : ''));
  }
  return linhas;
}

function marcosEmTexto(valor) {
  const itens = emLista(valor);
  return itens.map((linha, i) => {
    const idx = linha.indexOf(':');
    const prefixo = idx > 0 ? linha.slice(0, idx).trim() : '';
    if (/^\d{1,3}$/.test(prefixo)) return linha.slice(idx + 1).trim();
    return linha.trim();
  }).filter(Boolean);
}

// Os BLOCOS usados, na ordem canónica — a união do que a matriz por marco marcou. É
// o que lista as linhas da distribuição do volume.
function blocosDaEstrutura(valor, ordem) {
  const vistos = [];
  for (const linha of Array.isArray(valor) ? valor : []) {
    for (const b of (linha && linha.marcados) || []) {
      const t = String(b).trim();
      if (t && vistos.indexOf(t) === -1) vistos.push(t);
    }
  }
  const canonica = Array.isArray(ordem) ? ordem : [];
  return vistos.sort((a, b) => {
    const ia = canonica.indexOf(a) === -1 ? canonica.length : canonica.indexOf(a);
    const ib = canonica.indexOf(b) === -1 ? canonica.length : canonica.indexOf(b);
    return ia === ib ? 0 : ia - ib;
  });
}

// A ESTRUTURA DE CADA AULA: uma linha por BLOCO, na ordem canónica (Regra 3), cada
// uma nomeando os objetivos específicos que ela trabalha — a RELAÇÃO objetivo ×
// bloco, que a lista em prosa não guardava. A forma legada (lista de blocos
// escritos à mão) continua a sair como veio.
function linhasDaEstrutura(valor, marcos, ordem) {
  if (!Array.isArray(valor) || !valor.some((l) => l && typeof l === 'object')) {
    const itens = emLista(valor);
    return itens.length ? itens.map((v) => '- ' + v) : ['- [a decidir]'];
  }
  const blocos = blocosDaEstrutura(valor, ordem);
  if (!blocos.length) return ['- [a decidir — marque em que bloco cada objetivo é trabalhado]'];
  const linhas = [];
  for (const b of blocos) {
    const quais = [];
    for (const linha of valor) {
      if (!linha || !Array.isArray(linha.marcados) || linha.marcados.indexOf(b) === -1) continue;
      const n = Number(linha.marco);
      const texto = marcos[n - 1] || '';
      quais.push(texto ? '**' + n + '** ' + texto : '**' + n + '**');
    }
    linhas.push('- **' + b + '** — objetivos específicos: ' + (quais.join('; ') || '[a decidir]'));
  }
  return linhas;
}

// O objetivo específico da Aula 1 = o MARCO PARCIAL 1 (Regra 2). O campo próprio saiu do
// plano (era o mesmo dado em dois lugares, e os dois podiam divergir): a fonte passa a ser
// o marco. Um envelope antigo que ainda traga `aula-1-objetivo` (o campo, ou o valor que a
// versão anterior semeava a partir do marco) só é lido quando não há marco nenhum — assim o
// que já foi declarado não se perde, e o marco, quando existe, manda. Proveniência
// acrescenta, não edita.
function objetivoDaAula1(envelope) {
  const marcos = marcosEmTexto(respostaDo(envelope, 'marcos-por-aula'));
  if (marcos[0]) return marcos[0];
  const declarado = String(respostaDo(envelope, 'aula-1-objetivo') || '').trim();
  return declarado || null;
}

/* A ORIGEM DECLARADA em texto — a lista marcada vira a frase do documento. Mais de uma
 * origem sai separada por «;», na ordem em que o conteúdo as declara: o plano que mistura
 * RAD e Vaganova declara as duas. Texto (plano antigo, ou a linha do fim) passa como veio. */
function provenienciaEmTexto(valor) {
  if (valor === null || valor === undefined) return null;
  // Uma lista (marcada no plano) ou um texto (plano antigo, ou a linha do fim): os dois
  // saem como a frase da origem, e mais de uma origem sai separada por «;».
  const itens = emLista(valor).map((v) => String(v).trim()).filter(Boolean);
  return itens.length ? itens.join('; ') : null;
}

/* A RÉGUA DA RUBRICA — os níveis com que o resultado é medido no fim do ciclo. Ela é da
 * TURMA: a direção declara na Produção, o plano adota, e a régua adotada entra no envelope
 * (é ela que o documento declara — a prova de contra que régua aquela turma foi medida).
 * Os três formatos que chegam aqui: a lista de níveis (o que a porta grava hoje), as linhas
 * de critério (o formato antigo, cujas colunas depois do critério SÃO os níveis) e nada
 * (plano antigo) — e aí vale o padrão declarado. Nunca se inventa um nível. */
function niveisDaRubrica(valor) {
  const textos = (Array.isArray(valor) ? valor : [])
    .filter((n) => typeof n === 'string' || typeof n === 'number')
    .map((n) => String(n).trim())
    .filter(Boolean)
    .filter((n, i, todos) => todos.indexOf(n) === i);
  if (textos.length) return textos;
  if (Array.isArray(valor)) {
    for (const linha of valor) {
      if (!linha || typeof linha !== 'object' || Array.isArray(linha)) continue;
      const niveis = Object.keys(linha).filter((k) => k !== 'Critério' && k !== 'criterio');
      if (niveis.length) return niveis;
    }
  }
  return NIVEIS_DA_RUBRICA.slice();
}

/* A TABELA DA RUBRICA: o cabeçalho é a RÉGUA (os níveis), e cada linha é um critério. O
 * critério de cada aula é declarado no lançamento da aula dada — por isso a lacuna
 * declarada, e não um critério inventado. */
function linhasDaRubrica(valor, niveis) {
  const regua = niveis && niveis.length ? niveis : NIVEIS_DA_RUBRICA.slice();
  const linhas = [
    '| Critério | ' + regua.join(' | ') + ' |',
    '|' + ['Critério'].concat(regua).map(() => ':--').join('|') + '|',
  ];
  const criterios = (Array.isArray(valor) ? valor : [])
    .filter((l) => l && typeof l === 'object' && !Array.isArray(l))
    .map((l) => String(l['Critério'] == null ? '' : l['Critério']).trim())
    .filter(Boolean);
  // A LINHA TEM DE TER AS CÉLULAS DO CABEÇALHO (16/10/2026). Antes, a linha saía com UMA
  // célula sob um cabeçalho de cinco colunas: no documento impresso, a rubrica aparecia
  // como uma tarja de texto solto atravessando a tabela — o professor não reconhecia ali a
  // régua que tinha adotado. As vazias não são lacuna: o critério de cada aula é declarado
  // no LANÇAMENTO da aula dada, e é isso que a nota fecha.
  const vazias = regua.map(() => '').join(' | ');
  if (!criterios.length) {
    linhas.push('| [Preencher: o critério de cada aula — declarado no lançamento da aula dada] | ' + vazias + ' |');
    return linhas;
  }
  for (const criterio of criterios) linhas.push('| **' + criterio + '** | ' + vazias + ' |');
  return linhas;
}

/* A SEQUÊNCIA DE EXERCÍCIOS — a linha da aula, por bloco: cada exercício com o objetivo
 * específico que ele trabalha, o conteúdo do nível, os tempos e o compasso. A forma nova
 * é a grelha (um objeto por linha); a LEGADA é a prosa de antes («Solo — Pressão dos
 * metatarsos (8 tempos, 4/4)»), que continua a sair como veio. A ordem das partes é a da
 * peça: o que, onde, para quê, e os tempos. */
function sequenciaEmLinhas(valor) {
  const objetos = Array.isArray(valor)
    ? valor.filter((l) => l && typeof l === 'object' && !Array.isArray(l))
    : [];
  if (!objetos.length) return emLista(valor).filter(Boolean);
  const campo = (l, ...nomes) => {
    for (const n of nomes) {
      if (l[n] != null && String(l[n]).trim()) return String(l[n]).trim();
    }
    return '';
  };
  const linhas = [];
  for (const l of objetos) {
    const bloco = campo(l, 'Bloco');
    const objetivo = campo(l, 'Objetivo específico', 'Objetivo', 'Marco');
    const conteudo = campo(l, 'Conteúdo do nível', 'Conteúdo', 'Conteúdos');
    const tempos = campo(l, 'Tempos', 'Tempo');
    const compasso = campo(l, 'Compasso');
    // O objetivo já vem rotulado com o número («1 — Isolar o eixo»): aqui ele é citado como
    // o objetivo que o exercício trabalha, e os tempos com o compasso fecham a linha.
    const medida = [tempos, compasso].filter(Boolean).join(', ');
    const resto = [];
    if (conteudo) resto.push(conteudo);
    if (objetivo) resto.push('objetivo ' + objetivo);
    if (medida) resto.push(medida);
    const partes = [];
    if (bloco) partes.push('**' + bloco + '**');
    if (resto.length) partes.push(resto.join(' · '));
    const linha = partes.join(' — ');
    if (linha.trim()) linhas.push(linha.trim());
  }
  return linhas;
}

/* AS COLUNAS DA SEQUÊNCIA DE EXERCÍCIOS — fixas, na ordem que o formulário declara
 * (`porta/plano/conteudo/plano.json`). O `tabelaDeLista` tira as colunas das CHAVES do
 * primeiro objeto, e aqui isso não serve: uma linha cujo exercício ainda não tem tempos sai
 * sem essa chave, e a coluna inteira desaparecia do documento. A sequência sai sempre com as
 * cinco, mesmo que alguma venha vazia. */
const COLUNAS_DA_SEQUENCIA = [
  'Bloco',
  'Objetivo específico',
  'Conteúdo do nível',
  'Tempos',
  'Compasso',
];

/* A SEQUÊNCIA DE EXERCÍCIOS POR BLOCO — a linha da aula posta em tabela: o que se faz, para
 * qual objetivo, com que conteúdo do nível, em quantos tempos e em que compasso. A forma nova
 * é a grelha (um objeto por linha); a LEGADA é a prosa de antes, que continua a sair como
 * lista. A célula vazia sai como `[a decidir]` — a mesma lacuna declarada do resto do
 * documento: o exercício que não tem tempos ditos não os tem inventados. */
function tabelaDaSequencia(valor) {
  const objetos = Array.isArray(valor)
    ? valor.filter((l) => l && typeof l === 'object' && !Array.isArray(l))
    : [];
  if (!objetos.length) {
    const itens = emLista(valor);
    return itens.length ? itens.map((v) => '- ' + v) : ['- [a decidir]'];
  }
  const celula = (v) => {
    const t = v == null ? '' : String(v).trim();
    // A barra é o separador da tabela: dentro da célula ela parte a linha em duas.
    return t ? '**' + t.replace(/\|/g, '/') + '**' : '[a decidir]';
  };
  const linhas = [
    '| ' + COLUNAS_DA_SEQUENCIA.join(' | ') + ' |',
    '|' + COLUNAS_DA_SEQUENCIA.map(() => ':--').join('|') + '|',
  ];
  for (const objeto of objetos) {
    linhas.push('| ' + COLUNAS_DA_SEQUENCIA.map((c) => celula(objeto[c])).join(' | ') + ' |');
  }
  return linhas;
}

/* AS LINHAS DE UMA TABELA — a forma nova é o OBJETO `{unidade, linhas}` (a grelha com a
 * unidade da proporção, que é da TABELA e não de cada linha), a antiga é o ARRAY de linhas.
 * Quem lê a tabela (a derivação do plano, a da aula) passa por aqui e não precisa saber. */
function linhasDaTabela(valor) {
  if (Array.isArray(valor)) return valor;
  if (valor && typeof valor === 'object' && Array.isArray(valor.linhas)) return valor.linhas;
  return [];
}

// Uma tabela "aberta" escrita como lista de linhas separadas por `|`// (bloco | proporção | justificativa; critério | n1 | n2 | n3 | n4).
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
  // O RÓTULO e a COMPOSIÇÃO de cada par vêm da fonte única de `derivar-po.js`
  // (`ROTULOS_DO_CONTEXTO` + `COMPOR_DO_CONTEXTO`): o plano e o PO leem O MESMO plano
  // referenciado e escrevem os mesmos nomes, e três deles já tinham derivado aqui
  // («Turmas» onde o campo é «Turmas observadas»). A ordem é a do formulário.
  const par = (id) => {
    const compor = COMPOR_DO_CONTEXTO[id];
    const valor = compor ? compor(respostaDo(envelope, id)) : respostaDo(envelope, id);
    linhas.push('| **' + (ROTULOS_DO_CONTEXTO[id] || id) + '** | '
      + (valor || '[a decidir]') + ' |');
  };
  for (const id of ['contexto-escola', 'contexto-professor', 'contexto-turma', 'contexto-frequencia',
    'contexto-duracao', 'contexto-calendario', 'contexto-total-aulas', 'contexto-volume',
    'contexto-registro', 'contexto-metodologia', 'contexto-metodologia-origem', 'contexto-notacao']) {
    par(id);
  }
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
    ...tabelaDeIdentificacao(contexto, envelope),
  ]);

  // As alunas (Bloco 3 do prompt) não vivem mais no plano: o plano de ensino é
  // agnóstico à turma — o grupo fica em `contexto-turma`, e os apelidos e a
  // linha de base individuais vivem na anamnese e entram pelo PO (`sujeitos`).

  // Marcos parciais: tabela, uma linha por aula.
  secao('Marcos parciais por aula', tabelaDeMarcos(respostaDo(envelope, 'marcos-por-aula')));

  // O calendário entra pelo gerador (o marcador fica no lugar).
  saida.push('<!-- CALENDARIO -->');
  saida.push('');

  // Estrutura de cada aula — a RELAÇÃO objetivo × bloco (Regra 3). A forma legada
  // (lista de blocos em prosa) continua a sair como lista.
  secao(
    'Estrutura de cada aula',
    linhasDaEstrutura(
      respostaDo(envelope, 'estrutura-de-cada-aula'),
      marcosEmTexto(respostaDo(envelope, 'marcos-por-aula')),
      BLOCOS_DA_AULA,
    ),
  );

  // Distribuição do volume pelos blocos (tabela) — Regra 9, etapa 2.
  //
  // A UNIDADE (minutos × percentual) viaja DENTRO da resposta (`{unidade, linhas}`, desde que o
  // professor pode trocar a régua da coluna) e a tabela só carrega as linhas: sem a nota abaixo,
  // o documento publicava «15» e «35» sem dizer 15 de quê. A nota sai como CITAÇÃO (`>`) de
  // propósito — o contrato não a lê como conteúdo (blockquote é comentário), e é o que mantém as
  // chaves da tabela como estão.
  const volume = respostaDo(envelope, 'distribuicao-de-volume');
  const unidadeDoVolume = volume && !Array.isArray(volume) ? volume.unidade : null;
  const notarUnidade = unidadeDoVolume
    ? ['', '> **Unidade: ' + unidadeDoVolume + '.** '
      + (String(unidadeDoVolume).toLowerCase().indexOf('percent') === 0
        ? 'A proporção alvo é a fatia da aula — a soma fecha em 100%.'
        : 'A proporção alvo é o tempo de aula na unidade declarada — a soma fecha com a duração da aula.')]
    : [];
  secao(
    'Distribuição do volume pelos blocos',
    tabelaDeLista(
      linhasDaTabela(volume),
      '| Bloco | Proporção alvo | Justificativa |',
      '|:--|:--|:--|',
    ).concat(notarUnidade),
  );

  // A SEQUÊNCIA DE EXERCÍCIOS POR BLOCO (16/10/2026) — a linha da aula, bloco a bloco: o que
  // se faz, para qual objetivo, com que conteúdo do nível, em quantos tempos e em que
  // compasso. Ela existia no formulário e NÃO chegava ao documento: quem imprimia o plano
  // para levar à sala levava o objetivo e a fatia de cada bloco, mas não a sequência —
  // justamente a parte que o professor tem na mão quando está à frente da turma.
  secao('Sequência de exercícios por bloco', tabelaDaSequencia(respostaDo(envelope, 'aula-1-sequencia')));

  // Condições preliminares (lista).
  lista('Condições preliminares', respostaDo(envelope, 'condicoes-preliminares'));

  // A RÉGUA da rubrica, em LISTA — os níveis, verbatim. Ela sai numa seção própria porque é
  // o que o LANÇAMENTO da aula lê para marcar: a tabela da rubrica guarda o critério de cada
  // linha, e o cabeçalho dela (os níveis) o extrator normaliza em chave (e «Não se aplica»
  // voltaria como «naoSeAplica»). Numa lista, o rótulo atravessa como a escola o escreveu.
  const niveis = niveisDaRubrica(respostaDo(envelope, 'rubrica'));
  secao('Régua da rubrica', niveis
    .map((n) => '- ' + n)
    .concat([
      '',
      '> **A régua da turma.** Os níveis, como a escola os escreve, na ordem da escala — o primeiro',
      '> é o mais baixo. É com ela que o LANÇAMENTO da aula mede cada critério: o professor diz o',
      '> critério da aula e o nível alcançado. Quem declara a régua são os bastidores (Turmas) e quem',
      '> a adota é o professor, no plano do ciclo.',
    ]));

  // Rubrica: a RÉGUA com que o resultado é medido no fim — a da TURMA, adotada e
  // registrada pelo professor (o envelope a carrega). O CRITÉRIO de cada aula é declarado
  // no lançamento da aula dada (o professor diz o critério e o nível alcançado). Sem régua
  // no envelope (plano antigo), vale o padrão declarado — nunca se inventa um nível.
  {
    secao('Rubrica de avaliação final', linhasDaRubrica(respostaDo(envelope, 'rubrica'), niveis));
  }

  // Critério de extensão (prosa) — se vazio, sai como lacuna (não é required).
  prosa('Critério de extensão', respostaDo(envelope, 'criterio-de-extensao'));

  // MÚSICA e REPERTÓRIO (Bloco 10 do formulário, «Música e repertório»): dois nós respondíveis
  // que não tinham SEÇÃO nenhuma — e por isso não chegavam a documento algum, nem ao `.md`. A
  // música é parte do dado (o mesmo exercício em 3/4 e em 4/4 não é o mesmo dado) e o repertório
  // declara a origem do movimento; ambos são listas («um por linha»), como o conteúdo os pede.
  lista('Músicas e vídeos', respostaDo(envelope, 'musicas-videos'));
  lista('Repertório', respostaDo(envelope, 'repertorio'));

  // Registro de proveniência — required. A origem é MARCADA (as metodologias e o que foi
  // adaptado; mais de uma quando o plano mistura tradições), e é a lista que vira a frase
  // que o documento declara. Uma origem escrita à mão (plano antigo ou a linha do fim) passa
  // como veio: proveniência não reescreve.
  prosa('Registro de proveniência', provenienciaEmTexto(respostaDo(envelope, 'proveniencia')));

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
  ROTULOS_DO_CONTEXTO,
  COMPOR_DO_CONTEXTO,
  NIVEIS_DA_RUBRICA,
  BLOCOS_DA_AULA,
  provenienciaEmTexto,
  niveisDaRubrica,
  linhasDaRubrica,
  sequenciaEmLinhas,
  tabelaDeMarcos,
  tabelaDeLista,
  tabelaDeIdentificacao,
  marcosEmTexto,
  parametroEmLinhas,
  blocosDaEstrutura,
  linhasDaEstrutura,
  linhasDaTabela,
  objetivoDaAula1,
};
