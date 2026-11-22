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
  turmaDoDocumento,
  comporPeriodicidade,
  comporMedida,
  comporData,
  condicaoDeRegistroEmTexto,
  ROTULOS_DO_CONTEXTO,
  COMPOR_DO_CONTEXTO,
} = require('./derivar-po.js');
const sequenciaDoPlano = require('./sequencia.js');
/* A MÚSICA DE CADA EXERCÍCIO (22/11/2026) — o diálogo que cria a aula seguinte precisava dela, e
 * ela já existia no núcleo. Sem isto, a aula criada nascia com `Tempos` e `Compasso` vazios e o §4
 * do documento saía a dizer «nenhum exercício desta aula tem tempos e compasso declarados na
 * sequência» — o defeito que ela viu na Aula 02 da `rosa`. */
const { musicasDosExercicios } = require('./notacao.js');

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
/* …E O TERMO QUE A CURADORIA NÃO ACORDOU TAMBÉM NÃO SE PUBLICA (04/11/2026).
 *
 * A MESMA JANELA, deixada aberta. A sequência foi blindada em 03/11/2026 (`linhasDoRepertorio`),
 * e a matriz do «Parâmetro de medição» não — de modo que o «Port de bras», que saiu do exercício,
 * continuou a aparecer no §1 da MESMA aula, como «observa: Battement tendu · Plié · Port de
 * bras». A pesquisadora voltou a vê-lo, agora no §1, e o pedido é o mesmo: «em nenhum lugar da
 * aula pode existir algo que não esteja definido na curadoria».
 *
 * A régua é a de `motor/nucleo/sequencia.js` — uma só, para as duas formas de dado. `repertorio`
 * é a lista ACORDADA do envelope; sem ela, não se julga nada (apagar o que não se pode conferir
 * seria a limpeza a destruir o dado).
 */
function parametroEmLinhas(valor, marcos, repertorio, marcosDaAulaEscolhida) {
  const objetos = Array.isArray(valor)
    ? valor.filter((l) => l && typeof l === 'object' && !Array.isArray(l))
    : [];
  if (!objetos.length) {
    return sequenciaDoPlano.termosDoRepertorio(emLista(valor).filter(Boolean), repertorio);
  }
  /* CADA AULA MOSTRA O SEU MARCO, E SÓ O SEU (22/11/2026).
   *
   * A matriz do «Parâmetro de medição» é do CICLO — uma linha por objetivo, e o formulário grava-a
   * inteira na chave da aula. O documento da Aula 01 lia-a inteira, e imprimia os três marcos do
   * ciclo no §1 de uma aula que tem um: palavras dela, «aqui diz respeito apenas à aula um, não
   * diz respeito às outras aulas. Então cada aula tem o seu objetivo específico, ou seja, cada
   * aula com o seu próprio marco».
   *
   * O ESCOPO É DADO, NÃO PRESUMIDO. `marcosDaAulaEscolhida` são os objetivos que o plano declara
   * para esta aula (`aula-de-cada-objetivo`, com a reserva 1:1 da Regra 2). Sem ele — a chamada
   * antiga, de três argumentos — nada se filtra, e é o que a bancada do exercício novo mede: ela
   * quer ver a matriz do ciclo. Filtrar por ausência seria inventar um escopo.
   *
   * E SE NADA SOBRAR, o resultado é vazio, não a matriz toda: uma aula cujo marco não está na
   * matriz fica com a lacuna DECLARADA (quem chama nomeia a chave), em vez de receber de empréstimo
   * o parâmetro de outra aula. */
  const escopo = Array.isArray(marcosDaAulaEscolhida) && marcosDaAulaEscolhida.length
    ? new Set(marcosDaAulaEscolhida.map((n) => Number(n)).filter(Number.isFinite))
    : null;
  const linhas = [];
  for (const linha of objetos) {
    const n = Number(linha.marco);
    if (escopo && !escopo.has(n)) continue;
    const texto = Number.isFinite(n) ? (marcos[n - 1] || '') : '';
    const itens = sequenciaDoPlano.termosDoRepertorio(
      (Array.isArray(linha.marcados) ? linha.marcados : [])
        .map((v) => String(v).trim()).filter(Boolean), repertorio);
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
  return objetivoDaAula(envelope, '01');
}

/**
 * O OBJETIVO ESPECÍFICO DE UMA AULA QUALQUER (21/11/2026) — o marco da POSIÇÃO dela.
 *
 * É a generalização do `objetivoDaAula1`, e a regra é a mesma: **o marco N é o objetivo da Aula
 * N** (Regra 2). A diferença é só qual dos marcos se lê — e, quando o plano declarou menos
 * marcos do que aulas, a resposta é `null`: um ciclo de quinze aulas com três marcos não tem
 * objetivo para a décima, e dizer que tem seria inventar. Quem preenche é a elicitação da aula
 * (o botão pergunta), e a lacuna fica declarada no documento até lá.
 *
 * O campo antigo (`aula-N-objetivo`) continua a ser a reserva, pela mesma razão de antes: um
 * envelope que o traga não perde o que declarou.
 */
function objetivoDaAula(envelope, nn) {
  const numero = Number(String(nn == null ? '' : nn).replace(/^(?:aula-?)?0*/, '') || 0);
  const marcos = marcosEmTexto(respostaDo(envelope, 'marcos-por-aula'));
  if (numero >= 1 && marcos[numero - 1]) return marcos[numero - 1];
  const chave = 'aula-' + (numero || 1) + '-objetivo';
  const declarado = String(respostaDo(envelope, chave) || '').trim();
  return declarado || null;
}

/**
 * OS MARCOS DE UMA AULA (22/11/2026) — quais objetivos específicos esta aula trabalha.
 *
 * A RELAÇÃO É DECLARADA, e a reserva é a Regra 2. O plano guarda `aula-de-cada-objetivo`
 * (`{objetivo, aulas}`), porque um objetivo pode atravessar duas aulas e duas aulas podem
 * partilhar um objetivo. Sem esse mapa — envelopes anteriores —, vale o padrão 1:1: **o marco N é
 * o objetivo da Aula N**.
 *
 * É o que o §1 da aula usa para não imprimir o parâmetro das outras aulas. Devolve uma lista de
 * números porque é isso que o escopo do parâmetro precisa; a lista vazia quando não há nem mapa
 * nem posição — e aí quem chama declara a lacuna.
 */
function marcosDaAula(envelope, nn) {
  const numero = Number(String(nn == null ? '' : nn).replace(/^(?:aula-?)?0*/, '') || 0);
  if (!(numero >= 1)) return [];
  const daAula = objetivosDoEnvelope(envelope)
    .filter((o) => (o.aulas || []).some((a) => Number(String(a).replace(/\D/g, '')) === numero))
    .map((o) => Number(o.n))
    .filter(Number.isFinite);
  return daAula.length ? daAula : [numero];
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
 * O DIÁLOGO QUE CRIA A AULA SEGUINTE (21/11/2026).
 *
 * O PEDIDO. Ela abriu o plano do ciclo e viu o calendário com quatro colunas — aula, data, dia,
 * duração — e disse: «a gente vai acrescentar aqui uma quinta coluna, que é a coluna do criar
 * aula». O calendário dizia QUANDO cada aula acontece; o que ele não dizia era o que fazer com
 * isso.
 *
 * O QUE O DIÁLOGO FAZ, e o que ele NÃO faz. Ele recolhe o que o plano ainda não declara para
 * aquela aula — o objetivo (o marco), os exercícios que trabalham esse objetivo e os blocos onde
 * ele é trabalhado —, e manda gravar pelo caminho que já existe: `POST /api/elicitar`, com o
 * plano anterior como `ajuste_de`. A partir daí é a cadeia de sempre: elo novo do plano, o PO que
 * o observa acompanha, as fontes do ciclo são derivadas (e é o derivador novo que escreve
 * `-aula-NN.md` com o número DELA) e a geração é disparada.
 *
 * QUEM SABE O NÚMERO É A LINHA DO CALENDÁRIO, e não o diálogo: o botão traz `data-criar-aula="02"`
 * e o resto — a data, o dia, a duração — fica onde está, na tabela. Copiar a data para um atributo
 * seria uma segunda cópia da mesma verdade.
 *
 * A SEQUÊNCIA É O CRUZAMENTO, e não uma tabela a preencher. O modelo do plano já é este: o
 * objetivo é trabalhado em BLOCOS (`estrutura-de-cada-aula`) e medido por EXERCÍCIOS
 * (`aula-N-parametro`), e a sequência é o par. Marcar o exercício e o bloco em duas listas dá a
 * mesma tabela que o professor preencheria linha a linha — com menos dedos e sem contradição
 * possível entre as três coisas.
 *
 * O QUE ELE NÃO PEDE: a duração, o volume, o bloco da aula, a régua. São do CICLO — a mesma turma,
 * o mesmo plano —, e já estão no plano que este diálogo está a acrescentar.
 */
function dialogoDaAula(envelope, contexto) {
  const marcos = marcosEmTexto(respostaDo(envelope, 'marcos-por-aula'));
  const repertorio = emLista(respostaDo(envelope, 'repertorio'))
    .map((t) => String(t == null ? '' : t).trim()).filter(Boolean);
  const blocos = blocosDoVolume(respostaDo(envelope, 'distribuicao-de-volume'));
  const blocosDaAula = blocos.length ? blocos : BLOCOS_DA_AULA.slice();
  const id = String((envelope && envelope.id) || '').trim();

  /* SEM REPERTÓRIO NÃO HÁ O QUE MARCAR, e o diálogo diz isso em vez de mostrar uma lista vazia:
   * «o repertório da turma está no plano, e é dele que saem os exercícios». Um botão que abre uma
   * caixa sem opções ensina que o sistema está quebrado. */
  /* A MÚSICA DECLARADA DE CADA EXERCÍCIO DO REPERTÓRIO — `{ 'Battement tendu': ['8|2/4'], … }`.
   *
   * SÓ OS DO REPERTÓRIO: o alfabeto tem todos os verbetes da modalidade, e mandar os 102 para uma
   * página que mostra cinco seria payload a fingir de catálogo. O que o diálogo precisa é da música
   * dos exercícios que ele próprio oferece.
   *
   * A CHAVE É `tempos|compasso`, a mesma da grelha do plano e a mesma que o verbete declara — uma
   * forma só, para as duas telas não lerem o mesmo dado de duas maneiras. */
  /* E A ESCOLA VAI JUNTO (22/11/2026): sem ela, o diálogo oferecia as músicas que OUTRA escola
   * declarou para o mesmo exercício — o Battement jeté da `batata` (4 em 4/4) ao lado do da `breu`
   * (8 em 2/4) —, e onde a escola tem uma resposta o campo pedia uma escolha. */
  const catalogoDeMusicas = musicasDosExercicios(contexto.escola);
  const musicas = {};
  for (const nome of repertorio) {
    const lista = catalogoDeMusicas.get(nome);
    if (lista && lista.length) musicas[nome] = lista.slice();
  }
  const dados = {
    id,
    ciclo: String(contexto.ciclo || ''),
    professor: String(contexto.professor || ''),
    escola: String(contexto.escola || ''),
    turma: String(contexto.turma || turmaDoDocumento(envelope) || ''),
    marcos,
    repertorio,
    blocos: blocosDaAula,
    temRepertorio: repertorio.length > 0,
    musicas,
  };

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const linhas = [];
  linhas.push('```{=html}');
  /* AS PEÇAS SÃO AS DA CASA — `.modal`, `.modal-fundo`, `.modal-caixa`, `.modal-cab`, `.modal-x`,
   * `.modal-acoes` (21/11/2026).
   *
   * A PRIMEIRA VERSÃO ABRIU UM `<dialog class="caixa">` com cinco regras de CSS próprias, e ela
   * viu logo: «só abre o modal centralizado e alinhado ao que a gente já usa nos outros modais. A
   * gente já tem isso na identidade visual, você precisa usar.» Está na §«Uma janela por cima» do
   * `IDENTIDADE-VISUAL.md`, e a peça existe na folha desde sempre — um `<dialog>` com `::backdrop`
   * próprio é uma SEGUNDA identidade de janela no mesmo produto.
   *
   * Nada de `<style>` nesta página: quem pinta é a folha, e o corpo do modal usa as peças de
   * formulário que ela já desenha (`.campo-rotulo`, `.caixa`/`.modal-caixa` com os seus campos,
   * `.escolhas` para as listas de marcar). */
  linhas.push('<div class="modal" id="criar-aula" role="dialog" aria-modal="true" aria-labelledby="criar-aula-titulo" hidden>');
  linhas.push('<div class="modal-fundo" data-criar-fechar></div>');
  linhas.push('<div class="modal-caixa">');
  linhas.push('<div class="modal-cab">');
  linhas.push('<h2 id="criar-aula-titulo">Criar a aula</h2>');
  linhas.push('<button type="button" class="modal-x" data-criar-fechar aria-label="Fechar">×</button>');
  linhas.push('</div>');
  /* NENHUMA CLASSE INVENTADA. `.fraco` existe só no `<style>` da página de lançamento, e não na
   * folha dos pacotes — usá-la aqui seria a classe que o `IDENTIDADE-VISUAL.md` proíbe, e o
   * `check-identidade` não a apanha porque não lê o que o gerador injecta no documento. Um
   * parágrafo simples é a peça certa. */
  linhas.push('<p id="criar-aula-quando"></p>');
  linhas.push('<label class="campo-rotulo" for="criar-aula-marco">Objetivo específico (o marco desta aula)</label>');
  linhas.push('<textarea id="criar-aula-marco" name="marco" rows="2" required></textarea>');
  linhas.push('<fieldset class="escolhas" id="criar-aula-exercicios"><legend>Exercícios que trabalham este objetivo</legend></fieldset>');
  linhas.push('<fieldset class="escolhas" id="criar-aula-blocos"><legend>Blocos onde ele é trabalhado</legend></fieldset>');
  /* A MÚSICA DA AULA, NO MOMENTO EM QUE A AULA NASCE (22/11/2026).
   *
   * Palavras dela: «falta a gente colocar também tempo, a parte toda da musicalidade ali naquele
   * modal quando ele abre». O diálogo criava a aula com `"Tempos": ""` e `"Compasso": ""` — de
   * propósito, à espera de um preenchimento que ninguém fazia —, e o §4 do documento saía a dizer
   * «nenhum exercício desta aula tem tempos e compasso declarados na sequência». Medido na Aula 02
   * do ciclo da `rosa`, publicada.
   *
   * O QUE ELE PERGUNTA, E O QUE NÃO PERGUNTA. A música é do EXERCÍCIO, não do bloco (é a regra do
   * §4: o mesmo exercício em Barra, Centro e Expressão tem a mesma música), e o verbete já a
   * declara — então uma linha por exercício escolhido, e não uma por par (bloco, exercício):
   *   · o verbete declara UMA música → os dois valores vêm preenchidos e são leitura;
   *   · declara VÁRIAS → os dois viram escolha, e só as declaradas se oferecem (8 em 3/4 não
   *     existe, e não se pode escrever);
   *   · não declara NENHUMA → os dois ficam em branco para escrever à mão, e a nota diz que o
   *     documento vai declarar «sem música» se ficarem assim.
   * É a regra que a grelha do plano já pratica desde 31/10/2026 (`porta/index.html`), e a leitura é
   * a MESMA função do núcleo (`musicasDosExercicios`) — duas telas, uma regra.
   *
   * AS PEÇAS SÃO AS DA CASA: a `<table>` do documento (a folha desenha `th`/`td` em todo o
   * sistema), o `select` e o `input` dos formulários, e o `.campo-rotulo` que rotula o grupo. Nada
   * de classe nova. */
  linhas.push('<div id="criar-aula-musica" hidden>');
  linhas.push('<p class="campo-rotulo" id="criar-aula-musica-rotulo">Tempos e compasso de cada exercício</p>');
  linhas.push('<table id="criar-aula-musica-tabela"><thead><tr><th>Exercício</th><th>Tempos</th><th>Compasso</th></tr></thead><tbody id="criar-aula-musica-corpo"></tbody></table>');
  linhas.push('<p id="criar-aula-musica-nota"></p>');
  linhas.push('</div>');
  linhas.push('<p id="criar-aula-aviso" role="status"></p>');
  /* A FILEIRA É A DO MODAL, E O «CANCELAR» FICA À DIREITA (21/11/2026) — palavras dela: «O botão
   * cancelar ele fica do lado direito.» A ordem é a mesma dos formulários dos Bastidores: a acção
   * que conclui vem primeiro, e o recuo ao lado dela. */
  linhas.push('<div class="modal-acoes">');
  /* «CRIAR», E SÓ (21/11/2026) — palavras dela: «Confuso esses dois nomes para um usuário comum
   * que não é de tecnologia. Então coloca apenas criar aula, o botão se chama criar, só isso.»
   * «Criar e gerar» dizia duas coisas ao professor e nenhuma delas era uma escolha dele: gerar é
   * o que o sistema faz a seguir. O botão diz o gesto, e o véu diz o processo.
   *
   * E O «CANCELAR» MUDA DE NOME QUANDO JÁ NÃO HÁ O QUE CANCELAR. Depois de mandar criar, o que o
   * botão faz é FECHAR a janela — «não dá para ser cancelar porque parece que vai cancelar o
   * processo». Ele nasce «Cancelar» e vira «Fechar» no instante em que o pedido parte. */
  linhas.push('<button type="button" class="acao" id="criar-aula-guardar">Criar</button>');
  linhas.push('<button type="button" class="acao secundario" id="criar-aula-cancelar">Cancelar</button>');
  linhas.push('</div>');
  linhas.push('</div>');
  linhas.push('</div>');
  linhas.push('<script type="application/json" id="dados-criar-aula">'
    + JSON.stringify(dados).replace(/</g, '\\u003c') + '</script>');
  linhas.push('<script>');
  linhas.push(...PEDIR_JS());
  linhas.push(...DIALOGO_DA_AULA_JS());
  linhas.push('</script>');
  linhas.push('```');
  linhas.push('');
  return linhas;
}

/**
 * O GUIONISTA. Escrito em linhas soltas de propósito: ele é TEXTO dentro de uma string, e não há
 * verificador que o leia — mantê-lo curto e partido torna o erro visível na revisão. A única
 * regra de estilo que ele segue é a do resto do projeto: ES5 compatível, sem dependências.
 */
function DIALOGO_DA_AULA_JS() {
  return [
    '(function () {',
    '  var fonte = document.getElementById("dados-criar-aula");',
    '  if (!fonte) return;',
    '  var dados = JSON.parse(fonte.textContent);',
    '  var caixa = document.getElementById("criar-aula");',
    '  if (!caixa) return;',
    '  var campoMarco = document.getElementById("criar-aula-marco");',
    '  var exercicios = document.getElementById("criar-aula-exercicios");',
    '  var blocos = document.getElementById("criar-aula-blocos");',
    '  var caixaMusica = document.getElementById("criar-aula-musica");',
    '  var corpoMusica = document.getElementById("criar-aula-musica-corpo");',
    '  var notaMusica = document.getElementById("criar-aula-musica-nota");',
    '  var aviso = document.getElementById("criar-aula-aviso");',
    '  var quando = document.getElementById("criar-aula-quando");',
    '  var titulo = document.getElementById("criar-aula-titulo");',
    '  var btnGuardar = document.getElementById("criar-aula-guardar");',
    '  var btnCancelar = document.getElementById("criar-aula-cancelar");',
    '  var alvo = "";',
    /* O VÉU É O DA CASA (`.veu-de-operacao`, montado pelo `nav.js` em todas as páginas). Ele
     * cobre, diz e tranca — é a peça que o produto já usa para toda a escrita que trava a página,
     * e ela sentiu a falta dele: «E aí eu senti falta do véu. Aí no véu você pode colocar criar
     * aula, gerar aula, enfim, o texto do processo que está acontecendo.» */
    '  function comVeu(frase, rotulo) {',
    '    var op = window.LastroDaOperacao;',
    '    if (op && op.ocupar) op.ocupar(frase, rotulo);',
    '  }',
    '  function noVeu(frase) {',
    '    var op = window.LastroDaOperacao;',
    '    if (op && op.dizer) op.dizer(frase);',
    '  }',
    '  function liberarVeu() {',
    '    var op = window.LastroDaOperacao;',
    '    if (op && op.liberar) op.liberar();',
    '  }',
    '  function dizer(t) { if (aviso) aviso.textContent = t || ""; }',
    '  function listar(conjunto, valores, legenda) {',
    '    while (conjunto.firstChild) conjunto.removeChild(conjunto.firstChild);',
    '    var lg = document.createElement("legend");',
    '    lg.textContent = legenda;',
    '    conjunto.appendChild(lg);',
    /* A PÍLULA É A PEÇA DA CASA (`.escolha` + `input` escondido + `span`), a mesma dos dias da
     * semana e das modalidades — e não uma caixinha com uma etiqueta ao lado, que seria uma
     * segunda forma de escolher no mesmo produto. */
    '    for (var i = 0; i < valores.length; i++) {',
    '      var id = conjunto.id + "-" + i;',
    '      var lab = document.createElement("label");',
    '      lab.className = "escolha";',
    '      lab.setAttribute("for", id);',
    '      var cx = document.createElement("input");',
    '      cx.type = "checkbox"; cx.id = id; cx.value = valores[i];',
    '      var vista = document.createElement("span");',
    '      vista.textContent = valores[i];',
    '      lab.appendChild(cx);',
    '      lab.appendChild(vista);',
    '      conjunto.appendChild(lab);',
    '    }',
    '  }',
    /* ─────────────────────────────────────────────────────────────────────────────
     * A MÚSICA DE CADA EXERCÍCIO ESCOLHIDO — ver a nota grande do `dialogoDaAula`.
     *
     * `dados.musicas` é `{ exercício: ['8|2/4', …] }`, a mesma chave da grelha do plano e do
     * verbete. O número de músicas declaradas decide o que o campo DIZ — uma, a origem é ela;
     * várias, a origem são todas —, e o que ele ESCREVE é sempre decisão da professora.
     * ───────────────────────────────────────────────────────────────────────────── */
    '  function paresDe(nome) {',
    '    var l = (dados.musicas || {})[nome] || [], fora = [];',
    '    for (var i = 0; i < l.length; i++) {',
    '      var p = String(l[i]).split("|");',
    '      if (p.length === 2 && p[0] && p[1]) fora.push({ tempos: p[0], compasso: p[1] });',
    '    }',
    '    return fora;',
    '  }',
    /* TEMPOS E COMPASSO SÃO CAMPOS DE FORMULÁRIO — CARREGADOS COM O VALOR REAL E EDITÁVEIS
     * (22/11/2026).
     *
     * Palavras dela: «a tabela tempos e compassos de cada exercício vai abrir como um formulário.
     * Tempos e compassos são editáveis, vão abrir como campos de formulário carregados com os
     * valores reais, mas também editáveis, para que o professor possa editar. E aí ele vai decidir
     * se realmente ele quer trabalhar nesse tempo e com esses compassos.»
     *
     * O QUE ESTAVA AQUI, e porquê estava errado. Quando o verbete declarava UMA música, a célula
     * era um `span` de LEITURA com um `input` escondido — «vem do verbete» queria dizer «não é
     * para escrever por cima». A regra está certa para o ESTILO (o verbete declara a música do
     * exercício) e errada para AQUI: o que a aula trabalha é uma decisão da AULA, e quem a toma é
     * a professora, no momento em que cria a aula. Um campo travado obrigava-a a ir ao Estilo
     * mudar a música do exercício — e isso mudaria a música de todas as aulas do ciclo.
     *
     * O CAMPO ABRE PREENCHIDO («carregados com os valores reais», que foi o que ela pediu) e o
     * `title` nomeia a origem: «declarado no verbete: 8 em 2/4». Quando o verbete declara mais de
     * uma, abre com a primeira e o `title` lista todas — a escolha é informada em vez de às cegas,
     * e nenhuma opção lhe é escondida.
     *
     * O QUE NÃO MUDA: o que fica gravado é a linha da sequência DESTA aula (`aula-N-sequencia`), e
     * o verbete não se toca. Se ela escrever um tempo que o verbete não cobre, o §4 da aula di-lo
     * («conferir»), porque não há grade para o que não foi composto — o documento não inventa. */
    '  function celula(nome, indice, qual, pares) {',
    '    var td = document.createElement("td");',
    '    var campo = document.createElement("input");',
    '    campo.type = "text";',
    '    campo.placeholder = qual === "tempos" ? "8" : "2/4";',
    '    campo.setAttribute("data-musica", indice);',
    '    campo.setAttribute("data-qual", qual);',
    /* O VALOR REAL, quando há um: o do verbete. Com vários, o primeiro — e a lista inteira no
     * `title`, já que o campo é de escrever e não de escolher. */
    '    campo.value = pares.length ? String(pares[0][qual] || "") : "";',
    '    if (pares.length === 1) {',
    '      campo.title = "declarado no verbete: " + pares[0].tempos + " em " + pares[0].compasso;',
    '    } else if (pares.length > 1) {',
    '      var lista = [];',
    '      for (var i = 0; i < pares.length; i++) lista.push(pares[i].tempos + " em " + pares[i].compasso);',
    '      campo.title = "o verbete declara " + lista.join(" · ");',
    '    } else {',
    '      campo.title = "o verbete não declara música para este exercício";',
    '    }',
    '    td.appendChild(campo);',
    '    return td;',
    '  }',
    '  function pintarMusica() {',
    '    var ex = escolhidos(exercicios);',
    '    while (corpoMusica.firstChild) corpoMusica.removeChild(corpoMusica.firstChild);',
    '    if (!ex.length) { caixaMusica.hidden = true; return; }',
    '    caixaMusica.hidden = false;',
    '    var semMusica = [];',
    '    for (var j = 0; j < ex.length; j++) {',
    '      var pares = paresDe(ex[j]);',
    '      if (!pares.length) semMusica.push(ex[j]);',
    '      var tr = document.createElement("tr");',
    '      var nome = document.createElement("td");',
    '      nome.textContent = ex[j];',
    '      tr.appendChild(nome);',
    '      tr.appendChild(celula(ex[j], j, "tempos", pares));',
    '      tr.appendChild(celula(ex[j], j, "compasso", pares));',
    '      corpoMusica.appendChild(tr);',
    '    }',
    /* A NOTA DIZ O QUE O CAMPO É — e o que passa a ser, agora que se escreve (22/11/2026). O que
     * está carregado é a música que o VERBETE declara; o que fica gravado é o que ela decidir para
     * ESTA aula. Sem esta frase, um campo que abre preenchido e aceita outro valor não diz qual
     * dos dois vale — e a pessoa tem de adivinhar. */
    '    var base = "O que está carregado é a música que o verbete declara. O que ficar gravado é o'
    + ' que você decidir para esta aula — e só para esta: o verbete não muda.";',
    '    if (semMusica.length) {',
    '      base += " Sem música declarada no verbete: " + semMusica.join(", ")',
    + ' — escreva os tempos e o compasso, ou deixe em branco, e o documento dirá que esta',
    + ' aula não tem música a consolidar.";',
    '    }',
    '    notaMusica.textContent = base;',
    '  }',
    /* O QUE FICA GRAVADO NA LINHA DA SEQUÊNCIA, lido uma vez e por exercício — a música é dele, e
     * não do par (bloco, exercício): o mesmo exercício em três blocos leva a mesma música. */
    '  function musicaLida(indice) {',
    '    var trs = corpoMusica.querySelectorAll("tr");',
    '    var tr = trs[indice], t = "", c = "";',
    '    if (tr) {',
    '      var a = tr.querySelector("[data-qual=\\"tempos\\"]");',
    '      var b = tr.querySelector("[data-qual=\\"compasso\\"]");',
    '      t = a ? String(a.value || "").trim() : "";',
    '      c = b ? String(b.value || "").trim() : "";',
    '    }',
    '    return { tempos: t, compasso: c };',
    '  }',
    '  exercicios.addEventListener("change", pintarMusica);',
    '  function fechar() {',
    '    caixa.hidden = true;',
    '    document.removeEventListener("keydown", aoTeclar);',
    '  }',
    /* O ESTADO DEPOIS DE MANDAR. Uma função só o decide, para os dois botões não poderem contar
     * histórias diferentes: `mandado` desabilita o «Criar» (não se cria a mesma aula duas vezes) e
     * troca o rótulo do outro. Ao voltar atrás — uma falha antes de gravar —, os dois voltam. */
    '  function mandado(sim) {',
    '    btnGuardar.disabled = sim || !dados.temRepertorio;',
    '    btnCancelar.textContent = sim ? "Fechar" : "Cancelar";',
    '  }',
    '  function aoTeclar(e) { if (e.key === "Escape") fechar(); }',
    '  function abrir(nn, linha) {',
    '    alvo = nn;',
    '    titulo.textContent = "Criar a aula " + nn;',
    '    var d = linha ? linha.querySelectorAll("td") : [];',
    '    var quandoTexto = [];',
    '    for (var k = 0; k < d.length && k < 4; k++) quandoTexto.push(String(d[k].textContent || "").trim());',
    '    quando.textContent = "Data, dia e duração vêm do calendário: " +',
    '      (quandoTexto.length ? quandoTexto.join(" · ") : "veja a linha da aula na tabela") +',
    '      ". O que falta decidir é o que esta aula persegue — e com o quê.";',
    '    var marco = dados.marcos[Number(nn) - 1] || "";',
    /* As duas escritas, e a razão: `.value` é o que a pessoa vê, `.textContent` é o que a página
     * declara. Só a primeira deixa o `<textarea>` vazio no HTML servido — e um campo que se lê
     * vazio no código-fonte faz duvidar de que ele foi preenchido. */
    '    campoMarco.textContent = marco;',
    '    campoMarco.value = marco;',
    '    listar(exercicios, dados.repertorio, "Exercícios que trabalham este objetivo");',
    '    listar(blocos, dados.blocos, "Blocos onde ele é trabalhado");',
    /* A CAIXA DA MÚSICA NASCE FECHADA, porque nasce sem exercício escolhido: ela abre-se no
     * primeiro que se marcar, e é o `change` do conjunto que a repinta. */
    '    pintarMusica();',
    '    dizer(dados.temRepertorio ? "" : "O repertório da turma está vazio: declare-o no plano antes de criar a aula.");',
    '    mandado(false);',
    '    caixa.hidden = false;',
    '    document.addEventListener("keydown", aoTeclar);',
    '  }',
    '  function escolhidos(conjunto) {',
    '    var saida = [], itens = conjunto.querySelectorAll("input[type=checkbox]");',
    '    for (var i = 0; i < itens.length; i++) if (itens[i].checked) saida.push(itens[i].value);',
    '    return saida;',
    '  }',
    '  document.addEventListener("click", function (e) {',
    '    var b = e.target.closest ? e.target.closest("[data-criar-aula]") : null;',
    '    if (b) { e.preventDefault(); abrir(b.getAttribute("data-criar-aula"), b.closest("tr")); return; }',
    '    if (e.target.closest && e.target.closest("[data-criar-fechar]")) fechar();',
    '  });',
    '  document.getElementById("criar-aula-cancelar").addEventListener("click", fechar);',
    /* O ENDEREÇO ABRE O DIÁLOGO (21/11/2026) — `?criar-aula=02`. Serve a quem quer mandar a',
     * ligação a alguém («cria a aula 2»), e serve à prova, que precisa de abrir a caixa sem um',
     * rato: um botão que nunca foi clicado por ninguém é a única coisa que esta página não pode',
     * afirmar que funciona. */
    '  try {',
    '    var pedida = new URLSearchParams(window.location.search).get("criar-aula");',
    '    if (pedida) {',
    '      var nn = String(Number(pedida));',
    '      if (nn.length === 1) nn = "0" + nn;',
    '      var botao = document.querySelector("[data-criar-aula=\\"" + nn + "\\"]");',
    '      abrir(nn, botao ? botao.closest("tr") : null);',
    '    }',
    '  } catch (e) { /* endereço sem `URLSearchParams`: fica o clique */ }',
    '  btnGuardar.addEventListener("click", function () {',
    '    var marco = String(campoMarco.value || "").trim();',
    '    var ex = escolhidos(exercicios), bl = escolhidos(blocos);',
    '    if (!marco) { dizer("O objetivo específico desta aula é o que a torna observável — escreva-o."); return; }',
    '    if (!ex.length) { dizer("Marque ao menos um exercício: é ele que dá o que observar."); return; }',
    '    if (!bl.length) { dizer("Marque ao menos um bloco: é onde o objetivo acontece."); return; }',
    '    if (!dados.id) { dizer("Este plano ainda não tem carimbo: grave-o primeiro, e a aula nasce dele."); return; }',
    /* TEMPOS E COMPASSO ANDAM JUNTOS. Um sem o outro é meia música, e o documento não tem como
     * consolidar metade: a chave da notação é `tempos|compasso`. Recusa-se aqui, com o nome do
     * exercício, em vez de gravar uma linha que o §4 vai ter de contornar. */
    '    var semPar = [];',
    '    for (var q = 0; q < ex.length; q++) {',
    '      var m = musicaLida(q);',
    '      if ((m.tempos && !m.compasso) || (!m.tempos && m.compasso)) semPar.push(ex[q]);',
    '    }',
    '    if (semPar.length) { dizer("Tempos e compasso andam juntos — falta um dos dois em: " + semPar.join(", ") + "."); return; }',
    '    mandado(true); dizer("");',
    '    comVeu("A criar a aula " + alvo + ": o objetivo, os exercícios e a sequência vão para o plano, e o ciclo é gerado a seguir. Não feche esta aba.", "Criar a aula");',
    '    pedir(PORTA + "api/envelope/" + encodeURIComponent(dados.id))',
    '      .then(function (env) { return gravar(env, marco, ex, bl); })',
    '      .catch(function (erro) {',
    '        liberarVeu(); mandado(false);',
    '        dizer("não deu: " + (erro && erro.message || erro));',
    '      });',
    '  });',
    '  function gravar(env, marco, ex, bl) {',
    '    var r = Object.assign({}, (env && env.respostas) || {});',
    '    var n = Number(alvo);',
    '    var marcos = (r["marcos-por-aula"] && r["marcos-por-aula"].valor) || [];',
    '    if (Array.isArray(marcos)) { while (marcos.length < n) marcos.push(""); marcos[n - 1] = marco; }',
    '    var mapa = (r["aula-de-cada-objetivo"] && r["aula-de-cada-objetivo"].valor) || [];',
    '    if (Array.isArray(mapa) && !mapa.some(function (m) { return Number(m.objetivo) === n; })) {',
    '      mapa.push({ objetivo: n, aulas: [alvo] });',
    '      r["aula-de-cada-objetivo"] = { valor: mapa, origem: "perguntado", respondente: "professor", nota: null };',
    '    }',
    '    r["aula-" + n + "-parametro"] = { valor: [{ marco: n, marcados: ex }], origem: "perguntado", respondente: "professor", nota: null };',
    '    var alvoObj = n + " — " + marco;',
    '    var seq = [];',
    '    for (var i = 0; i < bl.length; i++) {',
    '      for (var j = 0; j < ex.length; j++) {',
    '        var mus = musicaLida(j);',
    '        seq.push({ "Bloco": bl[i], "Objetivo específico": alvoObj, "Conteúdo do nível": ex[j], "Tempos": mus.tempos, "Compasso": mus.compasso });',
    '      }',
    '    }',
    '    r["aula-" + n + "-sequencia"] = { valor: seq, origem: "perguntado", respondente: "professor", nota: null };',
    '    return pedir(PORTA + "api/elicitar", {',
    '      method: "POST",',
    '      headers: { "Content-Type": "application/json" },',
    '      body: JSON.stringify({ respostas: r, contexto: env.contexto, fonte: "plano",',
    '        ajuste_de: dados.id, base: env,',
    '        motivo: "a aula " + alvo + " foi criada a partir do calendário do plano" }),',
    '    }).then(function (x) {',
    '      var n = Number(alvo);',
    /* A PERGUNTA QUE FALTAVA, E É A QUE FEZ O DEFEITO DE 21/11/2026 (ver a nota grande abaixo):
     * a resposta desta aula foi GUARDADA ou foi DESCARTADA? O servidor já dizia quais os ids que
     * não entraram (`idsDesconhecidos`), e a página não os lia — dizia «gravado, está a ser
     * gerada» sobre uma aula que nunca existiu. */
    '      var fora = (x && x.idsDesconhecidos) || [];',
    '      var chaves = ["aula-" + n + "-sequencia", "aula-" + n + "-parametro"];',
    '      var perdidas = [];',
    '      for (var q = 0; q < chaves.length; q++) if (fora.indexOf(chaves[q]) !== -1) perdidas.push(chaves[q]);',
    '      if (perdidas.length) {',
    '        liberarVeu(); mandado(false);',
    '        dizer("O plano foi gravado, mas a aula " + alvo + " NÃO foi criada: o plano recusou a resposta dela (" + perdidas.join(", ") + "). Nada foi gerado — e clicar outra vez daria o mesmo. O defeito é do sistema, não seu.");',
    '        return;',
    '      }',
    '      noVeu("Aula " + alvo + " criada. O ciclo está a ser gerado — ela aparece em Aulas quando a geração fechar, e esta página fica em dia sozinha.");',
    '      fechar();',
    '      setTimeout(liberarVeu, 5000);',
    '      if (x && x.disparo && x.disparo.ok === false) {',
    '        noVeu("Aula " + alvo + " criada e gravada, mas o gerador não partiu: " + (x.disparo.erro || "motivo não informado") + ". O documento não vai sair sozinho.");',
    '        setTimeout(liberarVeu, 9000);',
    '      }',
    '    })',
    '    .catch(function (erro) {',
    '      liberarVeu(); mandado(false);',
    '      dizer("não deu: " + (erro && erro.message || erro));',
    '    });',
    '  }',
    '})();',
  ];
}

/**
 * O CAMINHO DA PORTA, E O `404` QUE ELA VIU (21/11/2026).
 *
 * O QUE ACONTECEU, na letra dela: «quando eu clico em guardar e gerar, ele dá um unexpected end of
 * JSON input», com `GET https://breu.padd.com.br/api/envelope/plano-20261120-2052 404`.
 *
 * A CAUSA É DE ENDEREÇO, e é minha. A página do plano é um documento do PACOTE, e o pacote é
 * servido pela produção (`motor/servidor/producao.js`), que encaminha para o motor uma LISTA
 * EXPLÍCITA de caminhos `/api/…` — `receber`, `dados`, `lancamentos/consolidar` e os bastidores.
 * `/api/envelope/:id` e `/api/elicitar` não estão nessa lista, porque são rotas da PORTA, e a porta
 * vive sob os seus prefixos (`/plano-ensino/`, `/plano-observacao/`, `/anamnese/`), que a produção
 * encaminha inteiros para o motor (`caminhoDaPorta`). O caminho certo é, por isso,
 * `/plano-ensino/api/…` — o mesmo que os links de proveniência do próprio documento já usam.
 *
 * E O ERRO MENTIU DUAS VEZES. «unexpected end of JSON input» é o que o `r.json()` diz quando a
 * resposta é o HTML do 404; e «não deu» escondeu o que o browser já tinha dito. Por isso o `pedir`
 * abaixo confere o ESTADO antes de tentar ler o corpo, e quando o corpo não é JSON diz o número e
 * o caminho — que é o que permite a quem lê distinguir «rota não existe» de «a gravação recusou».
 */
const PORTA = '/plano-ensino/';

/**
 * O `pedir` — uma leitura que não mente sobre o que recebeu. Devolve o JSON, ou lança um erro que
 * diz o estado e o caminho. Ele existe porque a alternativa custou uma sessão de depuração.
 */
function PEDIR_JS() {
  return [
    '  var PORTA = "' + PORTA + '";',
    '  function pedir(caminho, init) {',
    '    return fetch(caminho, init).then(function (r) {',
    '      return r.text().then(function (texto) {',
    '        var corpo = null;',
    '        try { corpo = texto ? JSON.parse(texto) : null; } catch (e) { corpo = null; }',
    '        if (!r.ok) {',
    '          throw new Error((corpo && (corpo.erro || corpo.message)) ||',
    '            ("o servidor respondeu " + r.status + " em " + caminho));',
    '        }',
    '        if (corpo === null) {',
    '          throw new Error("a resposta de " + caminho + " não é JSON — o servidor respondeu " + r.status);',
    '        }',
    '        return corpo;',
    '      });',
    '    }, function (erro) {',
    '      throw new Error("não consegui falar com " + caminho + ": " + (erro && erro.message || erro));',
    '    });',
    '  }',
  ];
}

/**
 * A derivação: o envelope elicitado do plano vira o Markdown da fonte.
 * Devolve `{ markdown, meta }` — `meta` é o cabeçalho YAML.
 */
function derivarPlano(envelope, opcoes) {
  const contexto = (envelope && envelope.contexto) || {};
  /* A `opcoes.linhaDeBase` DEIXOU DE SER LIDA AQUI (07/11/2026). Ela entrava por um motivo só: a
   * secção «## Aspecto físico», que publicava os NOMES do recorte do elenco. A secção saiu — o
   * corpo do ciclo vive na Audição/Elenco, na Aula 01 e no Plano de Observação —, e um parâmetro
   * que ninguém lê é a próxima coisa a divergir: alguém o passa a achar que muda o documento.
   * A assinatura fica como está (`opcoes` continua a existir para o que vier), mas o plano já não
   * depende do acto para sair inteiro. Quem ainda o passa — `escrever-plano.js` — não estraga
   * nada, e o `linhaDeBase` continua a chegar a quem o usa: o `derivarCiclo` e o `derivarPO`.
   */
  const saida = [];

  const referencias = emLista(respostaDo(envelope, 'referencias')).join('; ');

  saida.push('---');
  saida.push('projeto: Formação em Balé Clássico');
  saida.push('frente: Plano');
  saida.push('ciclo: "' + (contexto.ciclo || 'NN') + '"');
  saida.push('escola: ' + (contexto.escola || 'Escola'));
  saida.push('professor: ' + (contexto.professor || 'Professor'));
  saida.push('title: "' + tituloDoPlano(contexto) + '"');
  /* A TURMA NO ALTO DO PLANO (06/11/2026).
   *
   * O pedido dela: «vamos acrescentar aqui no topo quando a gente abre o plano de ensino, aí
   * qualquer plano de ensino, vai ter isso. Vamos dizer qual é a turma do qual se aplica esse
   * plano de ensino. […] para o professor não se perder, para ele saber do que se trata se ele
   * ficar muito tempo aqui».
   *
   * O TÍTULO JÁ NÃO BASTAVA. Ele diz o ciclo e a ESCOLA («Plano do Ciclo 01 — calango»), e a
   * turma aparecia duas vezes lá em baixo — na tabela do `## Contexto`, entre sete outras
   * linhas, e dentro do objetivo. Quem abre o documento para trabalhar nele tem de o saber
   * antes de o ler, e é isso que um subtítulo faz: fica debaixo do título, no cabeçalho da
   * página e no bloco de título do PDF.
   *
   * É o `subtitle` do pandoc — a peça que a folha de captura e a harmonização já usam —, e não
   * uma linha de prosa no corpo: prosa é conteúdo, e o validador a leria como texto de um campo.
   * Sem turma declarada não se escreve a linha: «Turma: —» seria prometer um dado inexistente. */
  const turma = turmaDoDocumento(envelope);
  if (turma) saida.push('subtitle: "Turma: ' + turma + '"');
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
  /* O «## ASPECTO FÍSICO» SAIU DO PLANO (07/11/2026).
   *
   * O QUE ELE ERA. A secção macro do eixo do corpo: listava os aspectos que a turma observa e
   * publicava o ponteiro para a «Aula 01 — Corpo». Nasceu a 02/11/2026, encolheu a 04/11 (o
   * detalhe migrou para a Aula 1) e a 06/11 passou a ler o recorte do elenco em vez do campo do
   * formulário — porque o campo pedia ao professor que copiasse à mão o que o sistema já sabia.
   *
   * PORQUE SAI AGORA. A pesquisadora, a 07/11/2026: «essas informações já são definidas nativamente
   * na Audição/Elenco e são tratadas diretamente no Plano de Observação». É verdade, e a secção
   * era o último resto do Bloco 10 no documento: o corpo de cada ciclo já é o RECORTE do elenco
   * (passo 4 da Audição), o que a turma mostra em cada aspecto é a LEITURA do passo 3, e o que se
   * marca aluna a aluna é o Plano de Observação. Uma quarta cópia macro, num documento que já
   * aponta para a Aula 01, era a mesma verdade a caminho de divergir.
   *
   * O QUE NÃO SE PERDE. A Aula 01 continua a imprimir o eixo do Corpo inteiro — o recorte, a
   * leitura e os pontos de atenção (`eixosDaObservacao`, em `derivar-ciclo.js`, que lê
   * `linhaDeBase.recorte` e `linhaDeBase.mostra`) —, e o documento do plano continua a apontar
   * para lá pelo `## Objetivos por bloco e por aula`. O dado nunca dependeu desta secção.
   *
   * E O QUE JÁ ESTAVA ESCRITO NÃO SE REESCREVE: um plano antigo cujo envelope tenha
   * `aspecto-fisico` guardado continua a ter a resposta no envelope (a proveniência acrescenta,
   * não apaga); o que deixa de existir é a secção que a imprimia. O `aspectoFisico` fica no
   * schema, como leitura do passado — o mesmo tratamento de `estruturaDeCadaAula`.
   */

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
  /* A MÚSICA E O VÍDEO DE REFERÊNCIA SÃO O QUE O PROFESSOR ESCREVEU — E NADA MAIS (22/11/2026).
   *
   * Palavras dela: «o que nasce aqui, música e vídeo de referência, é o que o professor coloca de
   * música e de vídeo de referência, são links externos e não o repertório. O repertório já está
   * escrito aqui no de baixo.»
   *
   * AQUI ESTAVA A MÚSICA DA SEQUÊNCIA, exercício por exercício (desde 01/11/2026). A ideia era
   * boa — «a música não se escreve, ela sobe» —, mas o lugar não: esta secção é o campo em que a
   * professora cola um link de vídeo de referência, e a lista dos «8 tempos em 2/4» de cada
   * exercício não é referência nenhuma. A música de cada exercício tem o seu sítio próprio, e é
   * a §4 da AULA («Bloco de musicalidade») — onde ela é consolidada por compasso, com a contagem.
   * Imprimi-la aqui também punha a mesma música em dois documentos com duas formas diferentes.
   *
   * O QUE NÃO SE PERDE: o repertório continua a ser a secção de baixo, e a música de cada
   * exercício continua a subir do verbete — na aula, que é onde se lê. A linha abaixo, em citação,
   * diz para onde olhar, para o documento não parecer ter perdido o dado. */
  lista('Música e vídeo de referência',
    emLista(respostaDo(envelope, 'musicas-videos')).filter(Boolean));
  saida.push('> **A música de cada exercício não está aqui** — ela lê-se na aula, no «Bloco de');
  saida.push('> musicalidade» (§4), onde é consolidada por compasso e com a contagem do verbete.');
  saida.push('> Esta secção guarda só o que a professora escreveu: a faixa ou o vídeo de referência.');
  saida.push('');

  lista('Repertório', respostaDo(envelope, 'repertorio'));

  // Registro de proveniência — required. A origem é MARCADA (as metodologias e o que foi
  // adaptado; mais de uma quando o plano mistura tradições), e é a lista que vira a frase
  // que o documento declara. Uma origem escrita à mão (plano antigo ou a linha do fim) passa
  // como veio: proveniência não reescreve.
  prosa('Registro de proveniência', provenienciaEmTexto(respostaDo(envelope, 'proveniencia')));

  /* O DIÁLOGO QUE CRIA A AULA SEGUINTE (21/11/2026) — ver `dialogoDaAula`. Ele fica no FIM da
   * página e não é visto: quem o abre é o botão da quinta coluna do calendário, que o gerador
   * injeta no marcador `<!-- CALENDARIO -->`. Sem o diálogo, o botão seria uma promessa. */
  saida.push(...dialogoDaAula(envelope, contexto));

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
  marcosDaAula,
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
  objetivoDaAula,
};
