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
const sequenciaDoPlano = require('./sequencia.js');

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

// Os marcos parciais: lista "NN: marco" → tabela `| Aula | Objetivo específico |`.
//
// O número é do SISTEMA: a lista numerada da porta grava só o texto, e a linha sai
// numerada aqui — 01, 02, 03… O prefixo «NN:» é o caminho LEGADO (a prosa antiga) e só
// conta como número quando é mesmo um número: um marco que tenha dois-pontos no meio
// («Solo: eixo vertical») não perde o começo para a coluna da aula.
function tabelaDeMarcos(valor, objetivos) {
  const itens = emLista(valor);
  const lista = Array.isArray(objetivos) ? objetivos : [];
  // O CAMINHO LEGADO: na prosa numerada («01: marco») a aula está escrita no texto, e a
  // posição é a aula. Se algum item traz número explícito, é ele que manda.
  const numerada = itens.some((linha) => {
    const idx = linha.indexOf(':');
    return idx > 0 && /^\d{1,3}$/.test(linha.slice(0, idx).trim());
  });
  const cabecalho = ['| Aula | Objetivos | Marco |', '|:--|:--|:--|'];
  const vazia = ['| Aula | Objetivos | Marco |', '|:--|:--|:--|', '| **01** | 01 | [a decidir] |'];
  if (!numerada && lista.length) {
    // A RELAÇÃO declarada no bloco «Em que aula cada objetivo»: uma aula pode perseguir mais
    // de um objetivo, e um objetivo pode atravessar mais de uma aula. O marco da aula é o
    // texto dos objetivos que ela persegue — o objetivo, não a atividade.
    const porAula = new Map();
    for (const o of lista) {
      const aulas = Array.isArray(o.aulas) && o.aulas.length ? o.aulas : [o.n];
      for (const bruto of aulas) {
        const n = Number(bruto);
        if (!Number.isFinite(n) || n < 1) continue;
        if (!porAula.has(n)) porAula.set(n, []);
        if (porAula.get(n).indexOf(o) === -1) porAula.get(n).push(o);
      }
    }
    const linhas = cabecalho.slice();
    for (const n of [...porAula.keys()].sort((a, b) => a - b)) {
      const quais = porAula.get(n);
      const texto = quais.map((o) => o.objetivo).filter(Boolean).join(' · ') || '[a decidir]';
      linhas.push('| **' + String(n).padStart(2, '0') + '** | '
        + quais.map((o) => o.n).join(', ') + ' | ' + texto + ' |');
    }
    return linhas.length > 2 ? linhas : vazia;
  }
  const declarados = lista.map((o) => o.n);
  const linhas = cabecalho.slice();
  itens.forEach((linha, i) => {
    const idx = linha.indexOf(':');
    const prefixo = idx > 0 ? linha.slice(0, idx).trim() : '';
    const numerado = /^\d{1,3}$/.test(prefixo);
    const n = numerado ? prefixo.padStart(2, '0') : String(i + 1).padStart(2, '0');
    const marco = numerado ? linha.slice(idx + 1).trim() : linha.trim();
    const objetivo = declarados[i] || n;
    linhas.push('| **' + n + '** | ' + objetivo + ' | ' + (marco || '[a decidir]') + ' |');
  });
  return linhas.length > 2 ? linhas : vazia;
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

/* OS OBJETIVOS ESPECÍFICOS DO CICLO (26/10/2026) — a LISTA, e não o cruzamento.
 *
 * O QUE MUDOU, e por quê. Até aqui o objetivo existia apenas como a linha do marco de uma
 * aula: `estrutura-de-cada-aula` guardava `{marco: N, marcados: [blocos]}`, com N sendo a
 * POSIÇÃO do marco. Isso lia-se como «a aula 1 tem só os blocos Solo e Barra» — quando o que
 * o professor marcou foi «este OBJETIVO trabalha-se em Solo e Barra» — e, na mesma página, a
 * distribuição do volume dizia que toda aula tem os quatro blocos. Duas afirmações
 * incompatíveis sobre a mesma aula. A pesquisadora: «a aula vai ter a estrutura que o
 * professor quiser… o objetivo é onde ele quer relacionar com a estrutura, com o bloco da
 * aula, e não que a estrutura da aula é somente aquele bloco».
 *
 * Agora o número é do OBJETIVO (1..N), e o bloco é uma propriedade dele. A estrutura da aula
 * é outra coisa e vive no quadro do volume.
 *
 * O QUE MUDOU OUTRA VEZ (etapa 2, no mesmo dia). A lista nasce 1:1 e o professor CONFIRMA
 * (objetivo N → aula N), mas a relação objetivo↔aula passou a ser declarada: o campo
 * `aula-de-cada-objetivo` guarda `{objetivo, aulas}`. É por ele que dois objetivos na mesma
 * aula e um objetivo em duas aulas deixam de ser forma aceita e passam a ser dado entrado.
 * Sem essa resposta — envelopes antigos —, o padrão 1:1 continua a valer.
 */
function objetivosDoEnvelope(envelope) {
  const textos = marcosEmTexto(respostaDo(envelope, 'marcos-por-aula'));
  const aulasPorObjetivo = new Map();
  const mapaDasAulas = respostaDo(envelope, 'aula-de-cada-objetivo');
  if (Array.isArray(mapaDasAulas)) {
    for (const linha of mapaDasAulas) {
      if (!linha || typeof linha !== 'object' || Array.isArray(linha)) continue;
      const n = Number(linha.objetivo);
      if (!Number.isFinite(n) || n < 1) continue;
      const aulas = (Array.isArray(linha.aulas) ? linha.aulas : [])
        .map((a) => String(a).trim()).filter(Boolean);
      if (aulas.length) aulasPorObjetivo.set(n, aulas);
    }
  }
  const blocosPorObjetivo = new Map();
  const cru = respostaDo(envelope, 'estrutura-de-cada-aula');
  if (Array.isArray(cru) && cru.some((l) => l && typeof l === 'object')) {
    for (const linha of cru) {
      if (!linha || !Array.isArray(linha.marcados)) continue;
      const n = Number(linha.marco);
      if (!n) continue;
      blocosPorObjetivo.set(n, linha.marcados.map(String).map((b) => b.trim()).filter(Boolean));
    }
  }
  return textos.map((texto, i) => {
    const padrao = String(i + 1).padStart(2, '0');
    return {
      n: padrao,
      objetivo: texto,
      blocos: blocosPorObjetivo.get(i + 1) || [],
      aulas: aulasPorObjetivo.get(i + 1) || [padrao],
    };
  });
}

/** A TABELA dos objetivos: o número, o que se pretende e onde é trabalhado. */
function tabelaDeObjetivosEspecificos(objetivos) {
  const linhas = [
    '| N | Objetivo específico | Blocos onde é trabalhado |',
    '|:--|:--|:--|',
  ];
  for (const o of objetivos || []) {
    linhas.push('| **' + o.n + '** | ' + (o.objetivo || '[a decidir]') + ' | '
      + (o.blocos && o.blocos.length ? o.blocos.join(' · ') : '[a decidir]') + ' |');
  }
  if (linhas.length === 2) {
    return ['| N | Objetivo específico | Blocos onde é trabalhado |', '|:--|:--|:--|',
      '| **01** | [a decidir] | [a decidir] |'];
  }
  return linhas;
}

// Os BLOCOS da ESTRUTURA DA AULA — a união do que a distribuição do volume declara.
//
// ANTES lia `estrutura-de-cada-aula` (a relação objetivo × bloco), e era de lá que saíam os
// blocos da aula: a mesma confusão que a secção do plano fazia. A aula tem os blocos que a
// estrutura declara; o objetivo diz onde é trabalhado, e não quais blocos a aula tem.
function blocosDoVolume(valor) {
  const linhas = Array.isArray(valor) ? valor
    : valor && Array.isArray(valor.linhas) ? valor.linhas : [];
  return linhas
    .map((l) => String((l && (l.Bloco || l.bloco)) || '').trim())
    .filter(Boolean);
}

// Os BLOCOS usados, na ordem canónica — a união do que a matriz por marco marcou. Continua a
// ser a leitura do documento ANTIGO (e a do envelope, para a aula): um plano escrito antes de
// 26/10/2026 declara a estrutura pela relação objetivo × bloco, e ela não deixa de ser lida.
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

/* A MÚSICA QUE A SEQUÊNCIA JÁ DECLARA — exercício por exercício, sem repetir.
 *
 * A fonte é a coluna derivada da sequência («Conteúdo do nível») e as duas colunas da música
 * («Tempos» e «Compasso»), que vêm do VERBETE do exercício. Um exercício sem verbete sai dito
 * por palavras: a ausência é do dado, e um documento que a esconde mente por omissão.
 */
function musicasDaSequencia(valor) {
  const objetos = Array.isArray(valor)
    ? valor.filter((l) => l && typeof l === 'object' && !Array.isArray(l))
    : [];
  const vistos = [];
  const linhas = [];
  for (const l of objetos) {
    const nome = String(l['Conteúdo do nível'] || l['Conteúdo'] || '').trim();
    if (!nome || vistos.indexOf(nome) !== -1) continue;
    vistos.push(nome);
    const tempos = String(l['Tempos'] || l['Tempo'] || '').trim();
    const compasso = String(l['Compasso'] || '').trim();
    const medida = tempos && compasso
      ? tempos + ' tempos em ' + compasso
      : (tempos || compasso);
    linhas.push(nome + ' — ' + (medida || 'tempos e compasso por declarar no verbete'));
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
//
// DOIS GRUPOS, E NÃO UMA TABELA DE DOZE LINHAS (28/10/2026). A pesquisadora: «uma parte
// que diz respeito ao espaço, à escola… e outra parte que diz respeito à pedagogia».
// A ordem é a do formulário dentro de cada grupo — o que muda é o agrupamento, e é ele
// que deixa o professor ver de imediato «onde» e «para quem/como» o ciclo acontece.
// O contrato de extração passou a somar as duas tabelas item/valor do MESMO bloco
// (`tools/lib-extracao-md.js`): o `## Contexto` continua a ser um campo só.
const GRUPOS_DO_CONTEXTO = [
  // A ESCOLA NÃO SE REPETE AQUI (28/10/2026). Ela já está no título da página e no `escola:`
  // do cabeçalho do documento — a linha «Escola / espaço: batata» era o dado escrito uma
  // terceira vez. Quem precisa do nome continua a tê-lo: o PO o declara no seu próprio
  // `campo-escola` (e o derivador do PO lê esta tabela como reserva).
  ['Escola e espaço',
    ['contexto-frequencia', 'contexto-duracao', 'contexto-calendario',
      'contexto-total-aulas']],
  ['Professor, turma e método',
    ['contexto-professor', 'contexto-turma', 'contexto-volume', 'contexto-registro',
      'contexto-metodologia', 'contexto-notacao']],
];

function tabelaDeContexto(envelope) {
  const linhas = [];
  // O RÓTULO e a COMPOSIÇÃO de cada par vêm da fonte única de `derivar-po.js`
  // (`ROTULOS_DO_CONTEXTO` + `COMPOR_DO_CONTEXTO`): o plano e o PO leem O MESMO plano
  // referenciado e escrevem os mesmos nomes, e três deles já tinham derivado aqui
  // («Turmas» onde o campo é «Turma observada»). A ordem é a do formulário.
  const par = (id) => {
    const compor = COMPOR_DO_CONTEXTO[id];
    const valor = compor ? compor(respostaDo(envelope, id)) : respostaDo(envelope, id);
    linhas.push('| **' + (ROTULOS_DO_CONTEXTO[id] || id) + '** | '
      + (valor || '[a decidir]') + ' |');
  };
  for (const [titulo, ids] of GRUPOS_DO_CONTEXTO) {
    // A linha em negrito entre as duas tabelas é o que as nomeia. Ela é prosa, não uma
    // secção: `### ` criaria um SUBCAMPO no contrato de extração e o `contexto` deixaria
    // de ser o objeto plano que o validador e o lançamento leem.
    if (linhas.length) linhas.push('');
    linhas.push('**' + titulo + '**');
    linhas.push('');
    // A RÉGUA É LONGA DE PROPÓSITO (28/10/2026). O pandoc só calcula larguras relativas
    // quando a linha de separação passa da coluna dele (72); com `|:--|:--|` a tabela
    // curta saía auto-dimensionada e a longa a 50/50 — as duas tabelas da MESMA secção
    // com a coluna «Valor» em lugares diferentes. Com esta régua as duas saem 30/70.
    linhas.push('| Item | Valor |');
    linhas.push('|:------------------------|:--------------------------------------------------------|');
    for (const id of ids) par(id);
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

  /* OBJETIVO GERAL — a PROSA, e mais nada (26/10/2026).
   *
   * Aqui havia, debaixo da prosa, a «ficha de identificação» do ciclo: duração, duração de cada
   * aula, data de início, encerramento previsto, volume ativo e professor. Os cinco primeiros
   * fatos já estão no `## Contexto`, seis linhas acima, e as datas estão no `## Calendário do
   * Ciclo`, que o gerador calcula do manifesto. Era o mesmo dado em três sítios da MESMA
   * página — a doença que o `PLANO-CICLO-DA-TURMA.md` §2.1 mediu entre arquivos («quatro
   * fontes, quatro respostas») e que aqui acontecia dentro de um documento só.
   *
   * O que se perde: a chave `ciclo` do `plano-XX.json`. Nada a lia — a única leitura era a da
   * duração no `tools/lib-vistas.js`, e ela já tem a reserva no `contexto.duracaoPorAula`, que
   * é onde o dado nasce. O `required` do schema correspondente sai com esta alteração. */
  secao('Objetivo geral', [
    respostaDo(envelope, 'objetivo-geral') === null
      ? '[Preencher: objetivo geral do ciclo — o PO elicitado o estabelece]'
      : String(respostaDo(envelope, 'objetivo-geral')),
  ]);

  // As alunas (Bloco 3 do prompt) não vivem mais no plano: o plano de ensino é
  // agnóstico à turma — o grupo fica em `contexto-turma`, e os apelidos e a
  // linha de base individuais vivem na anamnese e entram pelo PO (`sujeitos`).

  /* OS OBJETIVOS ESPECÍFICOS — a LISTA do ciclo, antes dos marcos (26/10/2026).
   *
   * Ela é a primeira das duas tabelas que substituem a «Estrutura de cada aula». O número é do
   * OBJETIVO, e o bloco é onde ELE é trabalhado — não uma declaração sobre a estrutura da aula.
   * Ver `objetivosDoEnvelope` para o que ainda não é possível (o formulário emite 1:1). */
  const objetivos = objetivosDoEnvelope(envelope);
  secao('Objetivos específicos', tabelaDeObjetivosEspecificos(objetivos));

  // Marcos parciais: a aula, o(s) objetivo(s) que ela persegue e o marco em texto.
  secao('Marcos parciais por aula',
    tabelaDeMarcos(respostaDo(envelope, 'marcos-por-aula'), objetivos));

  // O calendário entra pelo gerador (o marcador fica no lugar).
  saida.push('<!-- CALENDARIO -->');
  saida.push('');

  /* BLOCOS DA AULA E DISTRIBUIÇÃO DO VOLUME — a ESTRUTURA (26/10/2026).
   *
   * Aqui ficava a «Estrutura de cada aula», que era a relação objetivo × bloco e lia-se como se
   * a aula tivesse só aqueles blocos. A estrutura é esta tabela: os blocos que a aula tem e a
   * fatia de cada um. A relação objetivo × bloco passou a ser propriedade do objetivo (secção
   * «Objetivos específicos»), e o cruzamento dos dois sai em «Objetivos por bloco e por aula».
   *
   * O PADRÃO É DO CICLO; A AULA PODE TER OUTRA ESTRUTURA (decisão de 26/10/2026). O plano
   * declara o padrão — é o acervo de onde a aula parte —, e cada `aula-NN.md` declara a sua
   * quando difere. Escrever aqui as 26 estruturas seriam 104 linhas num documento que se lê.
   *
   * A UNIDADE (minutos × percentual) viaja DENTRO da resposta (`{unidade, linhas}`, desde que o
   * professor pode trocar a régua da coluna) e a tabela só carrega as linhas: sem a nota abaixo,
   * o documento publicava «15» e «35» sem dizer 15 de quê. A nota sai como CITAÇÃO (`>`) de
   * propósito — o contrato não a lê como conteúdo (blockquote é comentário), e é o que mantém as
   * chaves da tabela como estão. */
  const volume = respostaDo(envelope, 'distribuicao-de-volume');
  const unidadeDoVolume = volume && !Array.isArray(volume) ? volume.unidade : null;
  const notarUnidade = unidadeDoVolume
    ? ['', '> **Unidade: ' + unidadeDoVolume + '.** '
      + (String(unidadeDoVolume).toLowerCase().indexOf('percent') === 0
        ? 'A proporção alvo é a fatia da aula — a soma fecha em 100%.'
        : 'A proporção alvo é o tempo de aula na unidade declarada — a soma fecha com a duração da aula.')]
    : [];
  /* OS BLOCOS SEM PROPORÇÃO DECLARADA, DITOS NO PLANO (04/11/2026). A linha do Expressão da `breu`
   * foi gravada sem «Proporção alvo», e a lacuna só aparecia — genérica — na Aula 01. O plano é o
   * sítio onde se corrige, e é aqui que ela é nomeada: uma célula vazia numa tabela de seis colunas
   * passa despercebida, e a aula não sabe inventar o número. As colunas vêm do próprio dado (a
   * grelha grava a chave de cada uma), e não de uma posição. */
  const semProporcao = [];
  for (const linha of linhasDaTabela(volume)) {
    if (!linha || typeof linha !== 'object' || Array.isArray(linha)) continue;
    const chaves = Object.keys(linha).filter((k) => !String(k).startsWith('_'));
    const doBloco = chaves.find((k) => /^bloco/i.test(String(k).trim()));
    const daProporcao = chaves.find((k) => /propor|fatia|percent|porcent/i.test(String(k)));
    const bloco = String(doBloco === undefined ? (Object.values(linha)[0] || '') : linha[doBloco]).trim();
    if (!bloco || daProporcao === undefined) { if (bloco) semProporcao.push(bloco); continue; }
    if (!String(linha[daProporcao] == null ? '' : linha[daProporcao]).trim()) semProporcao.push(bloco);
  }
  const notarLacuna = semProporcao.length
    ? ['', '> **Sem proporção alvo: ' + semProporcao.join(', ') + '.** '
      + 'A Aula 01 sai com a fatia e os tempos desse bloco em lacuna — e não com um número '
      + 'adivinhado. Preencha a coluna «Proporção alvo» acima, no bloco indicado.']
    : [];
  secao(
    'Blocos da aula e distribuição do volume',
    tabelaDeLista(
      linhasDaTabela(volume),
      '| Bloco | Proporção alvo | Justificativa |',
      '|:--|:--|:--|',
    ).concat(notarUnidade).concat(notarLacuna).concat([
      '',
      '> **A estrutura da aula — e o padrão do ciclo.** Estes são os blocos que a AULA tem e a',
      '> fatia de cada um. O plano declara o padrão de onde cada aula parte; a aula que tiver',
      '> outra estrutura declara a sua no próprio documento (`aula-NN.md`), e não aqui. O que a',
      '> aula persegue, e em que bloco, está em «Objetivos específicos» e «Marcos parciais por',
      '> aula» — o objetivo não diz que a aula tem só o bloco em que ele é trabalhado.',
    ]));

  /* «OBJETIVOS POR BLOCO E POR AULA» — o APANHADO, e não a sequência (26/10/2026).
   *
   * Aqui saía a tabela INTEIRA da sequência (bloco · objetivo · conteúdo do nível · tempos ·
   * compasso), e ela duplicava linha a linha o que já está na `aula-01.md`: as duas nascem da
   * MESMA resposta (`aula-1-sequencia`, lida em `derivar-ciclo.js`). Medido na `batata`:
   * «Solo» 4×, «Barra» 4×, «Centro» 4× — o bloco repetido uma vez por exercício.
   *
   * O que a página passa a mostrar é o cruzamento que o plano pode responder sem repetir
   * nada — bloco × objetivo → a aula em que aquele objetivo é o marco — e o detalhe fica onde
   * se decide: na aula. A tabela é DERIVADA no gerador (`tools/tabela-objetivos.js`), como o
   * calendário, e por isso cresce quando o professor acrescenta marcos: escrita na fonte, ela
   * seria um retrato do dia da elicitação. Aqui fica só o marcador. */
  secao('Objetivos por bloco e por aula', ['<!-- OBJETIVOS -->']);

  // Condições preliminares (lista).
  lista('Condições preliminares', respostaDo(envelope, 'condicoes-preliminares'));

    /* A RÉGUA da rubrica, em LISTA — os níveis, verbatim. É a ÚNICA régua da página (26/10/2026).
   *
   * Aqui saíam DUAS: esta lista e, quatro linhas abaixo, a tabela «Rubrica de avaliação final»,
   * cujo cabeçalho eram os mesmos níveis e cuja única linha era a lacuna «[Preencher: o critério
   * de cada aula…]». A pesquisadora: «a régua da rubrica tem que ser uma só para tudo… não tem
   * que ter uma segunda régua de rubrica». A tabela nunca teve conteúdo — o critério de cada
   * aula declara-se no LANÇAMENTO —, e o seu único efeito era fazer a página parecer dizer duas
   * coisas sobre a mesma rubrica.
   *
   * O que a lista guarda, e por que em LISTA: é o que o lançamento lê para marcar cada critério.
   * No cabeçalho de uma tabela o extrator normaliza o rótulo em chave («Não se aplica» →
   * `naoSeAplica`); numa lista, o rótulo atravessa como a escola o escreveu. É o campo
   * `reguaDaRubrica` do `plano-XX.json`, e é o único consumidor.
   */
  const niveis = niveisDaRubrica(respostaDo(envelope, 'rubrica'));
  secao('Régua da rubrica', niveis
    .map((n) => '- ' + n)
    .concat([
      '',
      '> **A régua da turma — e só ela.** Os níveis, como a escola os escreve, na ordem da escala',
      '> — o primeiro é o mais baixo. É com ela que o LANÇAMENTO da aula mede cada critério: o',
      '> professor diz o critério da aula e o nível alcançado. Quem declara a régua são os',
      '> bastidores (Turmas) e quem a adota é o professor, no plano do ciclo. **O critério de cada',
      '> aula não se escreve aqui**: ele nasce no lançamento da aula dada, e é por isso que esta',
      '> página não tem uma tabela de critérios.',
    ]));

  /* O HORIZONTE DO CICLO (26/10/2026) — o rótulo deixou de prometer «critério».
   *
   * O campo chama-se `criterio-de-extensao` no envelope, e o título antigo — «Critério de
   * extensão» — prometia uma régua de decisão. O que ele declara é outra coisa: **até onde os
   * marcos estão decididos**, e o que decide estender. A pesquisadora: «é o rótulo que promete
   * critério e o conteúdo é horizonte. Isso não é muito claro».
   *
   * A nota diz também o que o campo NÃO é: o «+4 aulas» que o calendário calcula é outro, e as
   * duas coisas apareciam lado a lado sem se explicarem. O mecanismo não muda — o texto que o
   * professor escreve é o mesmo, e a chave do envelope também. */
  prosa('Horizonte do ciclo', respostaDo(envelope, 'criterio-de-extensao'));
  saida.push('> **O horizonte, e não um critério de nota.** Este campo declara **até onde os marcos');
  saida.push('> estão decididos** e o que faz o ciclo estender — é o limite do planeamento, não uma');
  saida.push('> régua de avaliação (essa é a «Régua da rubrica», acima). O **+4 aulas** que aparece no');
  saida.push('> Calendário é conta do gerador a partir das datas e da frequência; se o horizonte');
  saida.push('> declarado aqui for outro, é este que vale.');
  saida.push('');

  /* MÚSICA e REPERTÓRIO (Bloco 10 do formulário, «Música e repertório»): dois nós que não
   * tinham SEÇÃO nenhuma — e por isso não chegavam a documento algum, nem ao `.md`.
   *
   * A MÚSICA NÃO SE ESCREVE, ELA SOBE (01/11/2026). O nó pedia «um por linha: título e, se
   * quiser, a faixa ou o compasso», e o compasso de cada exercício já estava no VERBETE e os
   * exercícios da aula já estavam na SEQUÊNCIA, uma tela acima. O professor redigitava o que já
   * tinha decidido, e as duas versões podiam discordar sem que nada falhasse. O documento passa
   * a imprimir a música da sequência (exercício por exercício) e, depois dela, o que o professor
   * escreveu no campo — que hoje é o VÍDEO de referência. Um plano antigo, escrito à mão, passa
   * como veio: o que está no envelope não se reescreve.
   *
   * O REPERTÓRIO também é lido, não escrito: o nó dele é `somenteLeitura` e a tela o semeia com
   * os exercícios da sequência. A chave do envelope continua a ser `repertorio`, e é por isso
   * que esta linha não mudou — o que mudou foi quem a preenche. */
  /* O TÍTULO DA SECÇÃO DIZ O QUE ELA É (02/11/2026). Era «Músicas e vídeos», e o bloco do
   * formulário chamava-se «Música e repertório» — dois nomes para a mesma coisa, e o segundo
   * prometia o repertório, que é a secção seguinte. A pesquisadora: «aqui continua sendo música e
   * vídeo de referência; o repertório é o próximo item». As duas coisas passam a ter nomes
   * próprios, iguais nos dois lados. */
  /* O ASPECTO FÍSICO — FORÇA E FLEXIBILIDADE (02/11/2026). É o primeiro dos três eixos do que se
   * observa em dança (o corpo, a técnica, a poiese), e a Regra 4 pede-o declarado. Fica ANTES da
   * música e do repertório, e imediatamente antes: é o que se lê a seguir às condições do espaço,
   * porque é da MESMA família — o que a aula precisa para acontecer.
   *
   * A tabela sai do que o formulário consolidou a partir das anamneses das alunas da turma — o
   * que elas mostram JUNTAS, nunca uma linha por aluna. Sem a leitura, a secção declara a lacuna
   * com o caminho de volta, e não inventa um ponto de atenção que ninguém viu. */
  {
    const linhas = linhasDaTabela(respostaDo(envelope, 'aspecto-fisico'))
      .filter((l) => l && typeof l === 'object' && !Array.isArray(l));
    const corpo = linhas.length
      ? tabelaDeLista(linhas, '| Aspecto | Como está a turma |', '|:--|:--|')
      : ['[Preencher: carregue a sugestão a partir das anamneses da turma, no bloco «Aspecto '
        + 'físico — força e flexibilidade» do plano de ensino.]'];
    corpo.push('');
    corpo.push('O que a turma mostra no corpo, lido das anamneses das alunas — não uma linha por '
      + 'aluna, e sim o que elas têm em comum. É um **ponto de atenção** do ciclo: o que se vai '
      + 'olhar, e não uma avaliação de ninguém.');
    secao('Aspecto físico — força e flexibilidade', corpo);
  }

  /* A MÚSICA É A DOS EXERCÍCIOS QUE AINDA EXISTEM (03/11/2026). A sequência guarda uma linha por
   * par objetivo × bloco × exercício, e a linha de um objetivo que a pessoa apagou não é memória:
   * quem a escreveu foi o sistema, numa sessão em que o objetivo existia. Publicá-la punha no
   * documento um exercício cujo objetivo o mesmo documento não lista — a contradição dentro da
   * própria página. A regra é a do `motor/nucleo/sequencia.js`, e é a MESMA que a tela usa; se as
   * duas divergirem, o `provar-sequencia-que-acompanha` reprova. */
  const objetivosVivos = marcosEmTexto(respostaDo(envelope, 'marcos-por-aula'));
  /* E O EXERCÍCIO É O QUE A CURADORIA ACORDOU (03/11/2026). A segunda porta do mesmo defeito: a
   * linha cujo «Conteúdo do nível» está fora do repertório do envelope não é exercício desta aula
   * — ela entrou por uma medida marcada na matriz do parâmetro, e medir não é curar. Publicá-la
   * punha na música uma peça que o próprio «Repertório», duas linhas abaixo, não lista. */
  lista('Música e vídeo de referência',
    musicasDaSequencia(sequenciaDoPlano.linhasDoRepertorio(
      sequenciaDoPlano.linhasVivas(respostaDo(envelope, 'aula-1-sequencia'), objetivosVivos),
      respostaDo(envelope, 'repertorio')))
      .concat(emLista(respostaDo(envelope, 'musicas-videos')).filter(Boolean)));
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
  marcosEmTexto,
  parametroEmLinhas,
  blocosDaEstrutura,
  linhasDaEstrutura,
  linhasDaTabela,
  objetivoDaAula1,
};
