'use strict';

/**
 * derivar-ciclo.js — os derivadores que faltam para o «Guardar» gerar o ciclo inteiro.
 *
 * A ponte já deriva o PLANO (`derivar-plano-ciclo.js`) e o PO (`derivar-po.js`). O que este
 * módulo acrescenta são as OUTRAS SEIS fontes que o gerador exige para fechar o ciclo a partir
 * do envelope elicitado:
 *
 *   - `-aula-01.md`       (do plano: objetivo, parâmetro, sequência, marcos, estrutura,
 *                          condições — com a duração/volume calibrados pelo `.conf`);
 *   - `-referencias.md`   (do plano: o campo `referencias`);
 *   - `-notacao.md`       (do plano: só quando a notação foi declarada — P-15/P-16);
 *   - `-glossario-*.md`   (do plano: o par do registro, junto da notação — P-16);
 *   - `-captura-aula-01.md` (do PO: dimensões observadas + itens por dimensão + linha de base);
 *   - `-harmonizacao.md`  (do plano + PO: o varrimento de juízo de valor — P-21).
 *
 * É puro (sem `fs`/`path`/`http`/`process`): recebe envelopes e devolve Markdown. Reusa os
 * ajudantes de `derivar-po.js` (`respostaDo`, `emLista`) — a forma de ler o envelope é a mesma.
 *
 * Nada aqui inventa dado pedagógico: o que o formulário não perguntou (ou respondeu com o
 * exemplo de gabarito vazado) sai como lacuna declarada `[Preencher: …]`.
 */

const { respostaDo, emLista, itensDaDimensao, itensComObjetivos } = require('./derivar-po.js');
// O MOTOR DO REGISTRO DE NOTAÇÃO — o alfabeto é dado, e é ele que compõe a grade (20/10/2026).
const moduloNotacao = require('./notacao.js');
const sequenciaDoPlano = require('./sequencia.js');
const { marcosEmTexto, parametroEmLinhas, blocosDaEstrutura, objetivoDaAula1, BLOCOS_DA_AULA, sequenciaEmLinhas, linhasDaTabela } = require('./derivar-plano-ciclo.js');

// ---------------------------------------------------------------------------
// Ajudantes
// ---------------------------------------------------------------------------

/**
 * O nome de EXIBIÇÃO da escola (para front-matter e títulos), não o slug. O `contexto.escola`
 * é o SLUG (diaghilev2) — que dá o caminho do arquivo; o nome humano (Diaghilev II) vem do
 * `.conf` (`ESCOLA`) e chega em `contexto.escolaNome`. Sem ele, cai no slug.
 */
function nomeDaEscola(contexto) {
  return String((contexto && contexto.escolaNome) || (contexto && contexto.escola) || 'Escola').trim();
}

/** Um slug estável para chaves de captura/colunas: acentos fora, espaços → `_`. */
function slugDe(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

/**
 * O RÓTULO CURTO de um item de dimensão: "Título: Descrição" → "Título". É o que a folha de
 * captura usa como cabeçalho de coluna — a DESCRIÇÃO não é título de coluna (ela já vive no PO
 * e na guia de observação). Um item sem `:` é o rótulo inteiro.
 */
function rotuloDoItem(item) {
  const s = String(item || '').trim();
  const i = s.indexOf(':');
  return (i === -1 ? s : s.slice(0, i)).trim();
}

/**
 * A DATA DO DOCUMENTO — a que decide qual VERSÃO de um verbete se compõe (02/11/2026).
 *
 * O QUE ELA RESOLVE. Um verbete que compõe um plano não se reescreve por baixo dele: a edição é um
 * ajuste, e o estado anterior fica no histórico com a data em que deixou de valer. Para o passado
 * não mudar, a composição tem de perguntar «qual era o estado NESTE dia?» — e a resposta é a data
 * do envelope, que é a data em que o documento foi escrito.
 *
 * `gerado_em` é a do envelope e não a do relógio: regerar um documento antigo tem de reproduzir o
 * documento antigo, não o de hoje. Quando não há data — envelope antigo, ou escrito à mão —, a
 * composição cai no estado corrente, que é o comportamento de sempre.
 */
function dataDoEnvelope(envelope) {
  const cru = String((envelope && envelope.gerado_em) || '').trim();
  const achado = cru.match(/^(\d{4}-\d{2}-\d{2})/);
  return achado ? achado[1] : '';
}

/**
 * A ESCOLA DO ENVELOPE (03/11/2026) — o dono que a composição consulta.
 *
 * O alfabeto passou a guardar o verbete de cada escola com o dono na chave (`8|4/4@breu`), e quem
 * compõe o documento de uma aula tem de saber de quem é: a versão da escola vence a do catálogo,
 * como no vocabulário. O `contexto` do envelope é a fonte — `contexto.escola` —, e o `contexto`
 * do ciclo é o mesmo campo, com outro caminho. Sem nenhum dos dois, devolve vazio: catálogo.
 */
function escolaDoEnvelope(envelope, contexto) {
  const doContexto = String((contexto && contexto.escola) || '').trim();
  if (doContexto) return doContexto;
  return String(((envelope && envelope.contexto) || {}).escola || '').trim();
}

/** A resposta de um id no envelope (alias curto do `respostaDo` do irmão). */
function resp(envelope, id) {
  return respostaDo(envelope, id);
}

/**
 * Prosa honesta: o valor, ou uma lacuna declarada. Um valor que é o EXEMPLO do gabarito
 * (o template vazado no campo) também vira lacuna — não se publica o exemplo como dado.
 *
 * O PADRÃO DO EXEMPLO PASSOU A EXIGIR AS ASPAS (06/11/2026) — e a razão é um dado perdido em
 * silêncio. Ele era `^Ex\.:` — ou, pior, `^Exemplo` —, e isso apanhava TEXTO DO PROFESSOR: um
 * critério escrito «Exemplo prático do apoio na barra» era descartado dos itens da dimensão, e o
 * sintoma era o pior possível — o PO mostrava o item no documento e a FOLHA DE CAPTURA não o
 * pedia, sem erro nenhum. O gabarito que vaza é sempre o do conteúdo, e o conteúdo escreve os
 * exemplos entre « ». Exigir a aspa separa o exemplo vazado do critério escrito: «Ex.: «…»» é
 * gabarito; «Exemplo prático do apoio» é dado.
 */
const GABARITO_VAZADO = /^(Bloco\s*\|.*proporção alvo|ex\.:\s*[«\"“])/i;
function prosa(valor, motivo) {
  const v = valor === null || valor === undefined ? '' : String(valor).trim();
  if (!v || GABARITO_VAZADO.test(v)) return '[Preencher: ' + (motivo || 'ainda não declarado') + ']';
  return v;
}

/** Uma lista honesta: itens, ou uma lacuna única. */
function lista(valor, motivo) {
  const itens = emLista(valor).filter((v) => !GABARITO_VAZADO.test(v));
  return itens.length ? itens : ['[Preencher: ' + (motivo || 'ainda não declarado') + ']'];
}

/** O nome CURTO de um bloco: o rótulo antes do separador («Solo — eixo…» → «Solo»). É a
 *  chave que casa o bloco da aula com a linha da «Distribuição do volume» do plano. */
function nomeDoBloco(bloco) {
  return String(bloco || '').split(/\s+[—–-]\s+/)[0].trim();
}

/** O primeiro número de um texto, com vírgula ou ponto decimal («14 min» → 14; «30,5%» → 30,5). */
function numeroDoTexto(valor) {
  const m = /(-?\d+(?:[.,]\d+)?)/.exec(String(valor == null ? '' : valor));
  return m ? Number(m[1].replace(',', '.')) : null;
}

/** O nome de uma coluna sem acentos e em minúsculas — para casar «Proporção alvo» e
 *  «Proporcao Alvo» sem uma segunda lista de nomes. */
function chaveNormalizada(chave) {
  return String(chave == null ? '' : chave)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase();
}

// AS COLUNAS DA GRELHA DO VOLUME, PROCURADAS POR NOME E NÃO POR POSIÇÃO (04/11/2026).
//
// A leitura era `Object.values(linha)[1]`, e o modo de falha apareceu no ciclo da `breu`: a
// linha do bloco Expressão foi gravada sem «Proporção alvo» (a célula ficou vazia, e a gravação
// não escreve célula vazia), então a posição 1 passou a ser a JUSTIFICATIVA — e a aula imprimiu
// `| Expressão | [Preencher] | Braços |`. O professor leu «a fatia de Expressão está vazia»
// quando o que estava vazio era OUTRA coluna. Duas colunas em posições trocadas produzem o mesmo
// sintoma sem que nada falhe: por isso a coluna é procurada pelo NOME que o conteúdo declara.
const COLUNA_DO_BLOCO = /^(bloco|blocos|momento|parte)$/;
const COLUNA_DA_PROPORCAO = /(propor|fatia|percent|porcent|tempo|minuto|duracao)/;

/** O valor da coluna cujo nome casa o padrão; `undefined` quando a linha não a tem. */
function valorDaColuna(linha, padrao) {
  if (!linha || typeof linha !== 'object') return undefined;
  for (const chave of Object.keys(linha)) {
    if (String(chave).startsWith('_')) continue;
    if (padrao.test(chaveNormalizada(chave))) return linha[chave];
  }
  return undefined;
}

/**
 * A PROPORÇÃO DE UMA CÉLULA, NA UNIDADE DA TABELA. Devolve `{valor, unidade}` ou `null`.
 *
 * A unidade é da TABELA (o conteúdo declara `minutos` ou `percentual`), não de cada linha — e é
 * ela que dá sentido a um número sem sinal. Sem unidade declarada (a forma antiga, um array de
 * linhas), só o `%` explícito é uma percentagem: ler «30» como 30% seria inventar a unidade.
 *
 * O `minutos` ERA O BURACO (04/11/2026). O conteúdo declara `percentual` como padrão, mas deixa
 * `minutos` como opção — e a derivação só sabia ler `%`. Uma tabela em minutos saía com
 * `[Preencher]` em TODOS os tempos, com a fatia certa ao lado: o professor via a lacuna e o dado
 * estava lá. Agora os minutos convertem-se nos tempos pela duração da aula.
 */
function proporcaoDaCelula(celula, unidade) {
  const texto = String(celula == null ? '' : celula).trim();
  if (!texto) return null;
  const numero = numeroDoTexto(texto);
  if (numero === null) return null;
  const temPercento = /%/.test(texto);
  const temMinuto = /\bmin(?:uto)?s?\b/i.test(texto);
  if (temPercento) return { valor: numero, unidade: 'percentual' };
  if (temMinuto) return { valor: numero, unidade: 'minutos' };
  if (unidade === 'minutos') return { valor: numero, unidade: 'minutos' };
  if (unidade === 'percentual') return { valor: numero, unidade: 'percentual' };
  return null;                       // forma antiga e sem sinal: não se adivinha a unidade
}


/** Um número em português, sem zeros à direita: 13.5 → «13,5»; 45 → «45». */
function numeroEmPortugues(n) {
  return String(Math.round(n * 100) / 100).replace('.', ',');
}

/* ============================================================================
 * OS TRÊS EIXOS DO QUE SE OBSERVA EM DANÇA — Corpo, Técnica e Poiesis (04/11/2026).
 *
 * O QUE ESTAVA ERRADO, e é de leitura, não de dado. O guia de observação (§5 da Aula 01) imprimia
 * TODAS as dimensões com o prefixo «Técnica —», porque o rótulo é montado por concatenação no
 * conteúdo do PO (`doPlano.eixo` + separador + o bloco). O prefixo é verdadeiro para Barra e
 * Centro — são lugares da sala e é técnica que se trabalha neles — e é falso para Musicalidade e
 * Expressão, cujo conteúdo («resposta ao pulso na marcação», «olhar acompanha o braço») é
 * **poiésis** medida com o rótulo da técnica por cima. Medido no `REGISTRO.md` a 02/11/2026 e
 * confirmado por ela («nós temos a perspectiva da poiésis e a perspectiva do corpo»).
 *
 * O TEXTO DO GUIA PASSA A TER AS TRÊS FRENTES, e NADA é renomeado no dado: os rótulos gravados
 * nos POs continuam a ser os que estão lá (P-03 — a proveniência não se reescreve, e os
 * `itens-por-dimensao` já gravados referenciam esses rótulos pelo nome). O que muda é a LEITURA:
 * o guia mostra o eixo que corresponde ao bloco e a dimensão pelo nome do bloco.
 *
 * A TAXONOMIA DEIXOU DE SER CANDIDATA (04/11/2026). A 02/11/2026 o mapa era declarado provisório
 * («transformar os três em eixos de primeira classe é da pesquisadora»). Ela decidiu: são três
 * eixos de primeira classe, e musicalidade e expressão **nunca** se agrupam sob o técnico. O mapa
 * saiu daqui para `motor/nucleo/eixos.js` — uma declaração só, lida por este gerador, pelo
 * montador da publicação e pelo Plano de Observação.
 * ========================================================================== */
/* A DECLARAÇÃO MUDOU DE SÍTIO (04/11/2026). O mapa dos eixos era um candidato aqui dentro —
 * e havia uma SEGUNDA cópia dele em `tools/montar-publicacao.js`, com o mesmo mapa escrito outra
 * vez. Uma taxonomia em duas cópias divergiria ao primeiro bloco novo, e o sintoma seria a mesma
 * dimensão no eixo técnico na aula e na poiesis no cartão. Agora é `motor/nucleo/eixos.js`, lido
 * pelos dois — e pelos três, com o Plano de Observação. */
const eixosDaDanca = require('./eixos.js');
const { blocoDaDimensao, eixoDoBloco, rotuloDoEixo } = eixosDaDanca;

/**
 * AS TRÊS FRENTES DA OBSERVAÇÃO, tiradas do que os documentos JÁ têm.
 *
 *   · **Técnica** e **Poiesis** — as dimensões do PO e os itens de cada uma (a mesma fonte da
 *     folha de captura, para o guia e a captura não divergirem);
 *   · **Corpo** — não é uma dimensão do PO: é o que a turma mostra de força e flexibilidade (o
 *     plano, `aspecto-fisico`), o ponto de partida de cada aluna (o PO, `linha-de-base`) e as
 *     restrições declaradas (`restricoes`). O `REGISTRO.md` de 02/11/2026 mediu exactamente
 *     isto: o corpo existe em três sítios e **falta a ligação ao exercício** — que é o que este
 *     agregador NÃO inventa; ele lê o que há e diz o que há.
 *
 * O que volta é a lista dos eixos com `{id, rotulo, dimensoes, itens, resumo}` — `resumo` é a
 * frase CURTA que a listagem mostra; o detalhe fica na tabela item a item, logo abaixo.
 */
function eixosDaObservacao(dims, plano, po, linhaDeBase) {
  const dimensoes = Array.isArray(dims) ? dims : [];
  /* AS CHAVES SÃO OS IDs DOS EIXOS (`tecnica`, `poiesis`, `corpo`) — desde 04/11/2026, quando o
   * mapa passou a devolver o id e não o rótulo. O rótulo é de apresentação: um dia pode ser
   * «Técnica» noutra língua, e o id não muda. */
  const porEixo = { tecnica: [], poiesis: [], corpo: [] };
  for (const d of dimensoes) {
    const bloco = blocoDaDimensao(d.dimensao);
    const eixo = eixoDoBloco(bloco);
    porEixo[eixo].push({
      dimensao: d.dimensao,
      bloco: bloco,
      itens: Array.isArray(d.itens) ? d.itens : [],
    });
  }

  const conta = (lista) => lista.reduce((s, d) => s + d.itens.length, 0);
  const nomes = (lista) => lista.map((d) => d.bloco).filter(Boolean);

  // O CORPO — três fontes, nenhuma inventada.
  const aspectos = linhasDaTabela(resp(plano, 'aspecto-fisico'))
    .filter((l) => l && typeof l === 'object' && !Array.isArray(l));
  const restricoes = String(resp(po, 'restricoes') || '').trim();
  /* O RECORTE DA LINHA DE BASE — a quarta fonte, e a que faltava (06/11/2026).
   *
   * A pesquisadora, a olhar a Aula 01 gerada: «os aspectos escolhidos foram a primeira posição de
   * braço, a estabilidade vestibular e deslocamento, a resistência de MMSS e a sustentação ativa de
   * MMII… esses são os elementos que estão escolhidos e não aparecem lá na aula um».
   *
   * Estavam escolhidos, e o guia não os via — porque só lia `aspecto-fisico`, o campo do PLANO, que
   * ela não tinha preenchido (o formulário pede que se carregue a sugestão à mão). O dado não
   * faltava: ele estava no passo 3 e no passo 4 da linha de base da turma, que é a montante do
   * plano na cadeia — linha de base → turma → plano → PO → aula. O que faltava era a LIGAÇÃO, e
   * ela é do motor: o documento é derivado, e um derivado que pede ao professor para copiar à mão
   * o que o sistema já sabe não está derivado.
   *
   * A ORDEM É A DA LEITURA, e os pontos de atenção vêm primeiro — é a mesma ordem que a sugestão
   * da tela do plano produz, para os dois documentos não arrumarem o mesmo dado de duas maneiras. */
  const recorte = ((linhaDeBase && Array.isArray(linhaDeBase.recorte)) ? linhaDeBase.recorte : [])
    .filter((c) => c && String(c.nome || '').trim());
  const mostra = new Map((((linhaDeBase && linhaDeBase.mostra) || [])
    .filter((m) => m && m.id)).map((m) => [String(m.id), m]));

  /* O «PONTO DE PARTIDA» DEIXOU DE SER UM CAMPO DO PO (06/11/2026): ele é o recorte do passo 4 da
   * linha de base. O que o resumo do corpo diz é o que existe — os aspectos que o plano declara, o
   * ELENCO que a linha de base fixou e as restrições. Nas três fontes, nenhuma inventada. */
  const elenco = emLista(resp(po, 'sujeitos'));
  const partesDoCorpo = [];
  if (aspectos.length) {
    partesDoCorpo.push(aspectos.length + (aspectos.length === 1 ? ' aspecto físico declarado' : ' aspectos físicos declarados') + ' no plano');
  } else if (recorte.length) {
    partesDoCorpo.push(recorte.length + (recorte.length === 1
      ? ' aspecto do corpo escolhido na linha de base'
      : ' aspectos do corpo escolhidos na linha de base'));
  }
  if (elenco.length) {
    partesDoCorpo.push('elenco de ' + elenco.length + (elenco.length === 1 ? ' aluna' : ' alunas')
      + ' (linha de base da turma)');
  }
  partesDoCorpo.push(restricoes ? 'restrições declaradas' : 'sem restrições declaradas');

  const resumoDoCorpo = partesDoCorpo.join(' · ');

  /* AS LINHAS DO CORPO — o que a tabela do eixo mostra, e de onde cada linha vem.
   *
   * A pesquisadora, 04/11/2026: «os aspectos físicos (como os 15 aspectos declarados no plano)
   * preenchem o eixo do corpo». Até aqui o eixo existia com um resumo e NENHUMA linha: a tabela
   * do guia só tinha Técnica e Poiesis, e o corpo — que é um dos três eixos — aparecia como uma
   * frase de contagem. Uma tabela que salta um eixo dos três ensina que ele não se observa.
   *
   * A LINHA É `[critério, o que se observa]`, e nada é inventado: o aspecto é o rótulo que o
   * PLANO declara (`aspecto-fisico`) e o «como está a turma» é o valor que ele mesmo gravou.
   *
   * O QUE É DO SUJEITO NÃO ENTRA AQUI (04/11/2026, à noite). A pesquisadora: «a listagem
   * individualizada por aluna é inviável para larga escala — com dezenas de alunas o documento
   * quebra». Ela está certa, e a conta é simples: o `linha-de-base` do PO é uma linha por sujeito,
   * cada sujeito dava DUAS linhas («o que traz» e «a desenvolver») mais a restrição da turma, e
   * trinta alunas davam sessenta e uma linhas para ler antes da primeira marca. O corpo do guia
   * passa a ser o que é do CICLO — os aspectos físicos que o plano consolidou —, e o que é do
   * SUJEITO vive no Plano de Observação, que é onde se declara e onde a Captura o pede, aluna a
   * aluna. O documento da aula APONTA para lá (§6, Proveniência); não copia.
   *
   * AS COLUNAS SÃO LIDAS POR POSIÇÃO, e é o único sítio deste ficheiro onde isso se faz de
   * propósito: a tabela do `aspecto-fisico` é escrita pelo professor no formulário, e as duas
   * primeiras células são sempre «o aspecto» e «como está». */
  const linhasDoCorpo = [];
  for (const l of aspectos) {
    const celulas = Object.keys(l).map((k) => String(l[k] == null ? '' : l[k]).trim()).filter(Boolean);
    if (!celulas.length) continue;
    linhasDoCorpo.push([celulas[0], celulas.slice(1).join(' · ') || 'sem avaliação declarada']);
  }
  /* SEM ASPECTO CONSOLIDADO, O EIXO DIZ A LACUNA E O CAMINHO DE VOLTA. Antes era a linha das
   * restrições que garantia uma linha ao corpo — e com ela fora, um plano por consolidar deixava
   * o eixo a dizer «nenhuma dimensão do PO cai neste eixo», que é falso: o corpo é o eixo, o que
   * falta é a leitura das anamneses. */
  if (!linhasDoCorpo.length && recorte.length) {
    /* O RECORTE, LINHA A LINHA — com o que a turma mostra em cada aspecto, que o passo 3 leu. E
     * não a frase de formulário que aqui estava («carregue a sugestão a partir das anamneses da
     * turma»): ela mandava o professor fazer à mão o que o motor passou a fazer, e num guia que se
     * imprime é uma instrução para dentro de outra tela. */
    const doRecorte = recorte.map((aspecto) => {
      const lido = mostra.get(String(aspecto.id || ''));
      const texto = lido && lido.texto
        ? lido.texto + (lido.atencao ? ' — ponto de atenção' : '')
        : 'sem registo na anamnese';
      return { nome: String(aspecto.nome).trim(), texto, atencao: Boolean(lido && lido.atencao) };
    });
    // OS PONTOS DE ATENÇÃO PRIMEIRO — a ordem da sugestão da tela, e a que o plano também dá à
    // lista. O `sort` é estável: dentro de cada metade, a ordem é a da linha de base.
    doRecorte.sort((a, b) => (b.atencao ? 1 : 0) - (a.atencao ? 1 : 0));
    for (const r of doRecorte) linhasDoCorpo.push([r.nome, r.texto]);
  }
  if (!linhasDoCorpo.length) {
    /* SEM RECORTE NÃO SE INVENTA NADA, e a lacuna DIZ-SE com o caminho de volta — mas em língua de
     * professor: onde é que se escolhe, não o que é que se carrega. */
    linhasDoCorpo.push([
      'Aspecto físico — o que a turma mostra',
      '[A decidir: esta turma ainda não tem aspectos do corpo escolhidos. A escolha faz-se na linha '
        + 'de base do Corpo, e o que se observa em cada aspecto aparece aqui.]',
    ]);
  }

  const eixo = (id, rotulo, lista, resumo, linhas) => ({
    id,
    rotulo,
    dimensoes: lista,
    itens: conta(lista),
    resumo,
    linhas: Array.isArray(linhas) ? linhas : [],
  });

  /* O RESUMO DE UM EIXO DE DIMENSÕES. Sem dimensão nenhuma no PO, a frase diz o que falta; com
   * dimensões e nenhuma neste eixo, diz que nenhuma caiu aqui — as duas são verdade, e a primeira
   * é a que evita ler «não caiu aqui» como «o eixo não existe». */
  const resumoDoEixo = (lista) => {
    if (nomes(lista).length) {
      return nomes(lista).join(', ') + ' (' + lista.length
        + (lista.length === 1 ? ' dimensão' : ' dimensões') + ' · '
        + conta(lista) + (conta(lista) === 1 ? ' item)' : ' itens)');
    }
    return dimensoes.length ? 'nenhuma dimensão do PO cai neste eixo'
      : 'o PO ainda não declarou dimensões';
  };

  /* O CORPO É EIXO PRÓPRIO, e não uma técnica — desde 04/11/2026, quando a taxonomia deixou de
   * ser candidata. Antes, `eixoDoBloco` devolvia «Técnica» para tudo o que não fosse
   * musicalidade/expressão, e o corpo do plano caía no eixo errado. Nenhuma dimensão do PO cai
   * no corpo (o PO não declara dimensões de corpo): o que ele leva são as LINHAS, lidas do plano
   * — e é isso que `porEixo.corpo` guarda, vazio, para a soma fechar nos três eixos.
   *
   * A RESTRIÇÃO FÍSICA VAI NO EIXO, e não fica só no resumo (04/11/2026, à noite). Ela saiu da
   * tabela com as linhas por aluna — e a tabela fica com os aspectos e só eles, que é o que a
   * bancada exige («as linhas da aula são EXACTAMENTE os rótulos do envelope»). Mas ela não pode
   * desaparecer do documento: o PO a declara como «lesão, dor, limitação médica ou restrição que
   * afeta o movimento de alguma aluna» e escreve que «a ausência também é informação». Um
   * documento que o professor imprime e leva para a sala não pode omitir isto — e é uma linha só,
   * escrita por ele, não uma enumeração da máquina: o que saiu foi a tabela por aluna, não a
   * palavra dele. */
  const eixos = [
    eixo('corpo', 'Corpo', porEixo.corpo, resumoDoCorpo, linhasDoCorpo),
    eixo('tecnica', 'Técnica', porEixo.tecnica, resumoDoEixo(porEixo.tecnica)),
    eixo('poiesis', 'Poiesis', porEixo.poiesis, resumoDoEixo(porEixo.poiesis)),
  ];
  eixos[0].restricoes = restricoes;
  return eixos;
}

/**
 * A DESCRIÇÃO DE UMA CÉLULA, PARTIDA EM DUAS (02/11/2026).
 *
 * O que a pesquisadora viu na Aula 01: a coluna «Descrição» repetia, célula a célula, o MESMO
 * parágrafo do verbete («Exercício de coordenação bi-lateral onde…»), e por baixo dele vinha a
 * leitura da notação («Lê-se: Pé, quinta posição, conduz a, à frente.»). Duas coisas erradas, e a
 * segunda era invisível no código e visível na página: uma célula de tabela Markdown NÃO atravessa
 * linhas, e a quebra depois do parágrafo partia a linha em duas — a segunda metade («Lê-se: …»)
 * saía como uma linha sem colunas, e o leitor via a notação no lugar da descrição.
 *
 * `descricao` = o texto FIXO do exercício (o que se diz dele uma vez) + a leitura da célula.
 * Quem imprime decide: o fixo vai para o cabeçalho do exercício, uma vez; a célula fica com a
 * leitura. Ver `derivarNotacao`.
 */
function partirDescricao(texto) {
  const t = String(texto == null ? '' : texto);
  const m = /(?:^|\n)\s*Lê-se:\s*([\s\S]*)$/.exec(t);
  if (!m) return { fixa: t.replace(/\s*\n\s*/g, ' ').trim(), lida: '' };
  return { fixa: t.slice(0, m.index).replace(/\s*\n\s*/g, ' ').trim(), lida: m[1].replace(/\s*\n\s*/g, ' ').trim() };
}

/**
 * As linhas da «Distribuição do tempo da aula» (§3 da Aula 01). O BLOCO vem da estrutura
 * declarada no plano; a FATIA e os TEMPOS vêm das proporções da «Distribuição do volume»,
 * casadas pelo nome curto do bloco.
 *
 * Nada se inventa: a Fatia é a proporção declarada, verbatim, e os Tempos são a aritmética
 * dela com o volume-alvo (proporção × total ÷ 100) — o produto exacto, para as partes
 * fecharem no total. Sem bloco correspondente, ou sem percentagem declarada, a célula sai
 * como lacuna, e não como um número adivinhado.
 */
function distribuicaoDoTempo(estrutura, volume, volumeTotal, duracaoMin) {
  /* A FORMA NOVA (`{unidade, linhas}`) TRAZ A UNIDADE; a antiga é um array de linhas. A unidade
   * é o que dá sentido a um número sem sinal, e é ela que decide a aritmética dos tempos. */
  const registado = (volume && !Array.isArray(volume) && typeof volume === 'object') ? volume : null;
  const unidade = registado && registado.unidade ? String(registado.unidade).trim().toLowerCase() : null;
  const linhasDoVolume = Array.isArray(volume) ? volume
    : (registado && Array.isArray(registado.linhas)) ? registado.linhas : [];

  /* AS COLUNAS SÃO PROCURADAS PELO NOME (04/11/2026) — ver `COLUNA_DO_BLOCO`. A posição deixou de
   * servir no dia em que uma célula vazia encolheu a linha: a coluna seguinte passou a ocupar o
   * lugar da proporção, e a aula imprimiu a justificativa como fatia. */
  const porBloco = new Map();
  for (const linha of linhasDoVolume) {
    if (!linha || typeof linha !== 'object' || Array.isArray(linha)) continue;
    const celulaDoNome = valorDaColuna(linha, COLUNA_DO_BLOCO);
    const nome = String(celulaDoNome === undefined
      ? (Object.values(linha)[0] == null ? '' : Object.values(linha)[0])
      : celulaDoNome).trim();
    if (!nome) continue;
    const celula = valorDaColuna(linha, COLUNA_DA_PROPORCAO);
    porBloco.set(chaveNormalizada(nome), celula);
  }

  const linhas = [];
  for (const bloco of estrutura) {
    const nome = nomeDoBloco(bloco);
    const celula = porBloco.get(chaveNormalizada(nome));
    const proporcao = proporcaoDaCelula(celula, unidade);

    /* OS TEMPOS, segundo a unidade: uma percentagem é do volume-alvo; uns minutos são da duração
     * da aula. Sem uma das duas âncoras, o número existe mas os tempos não se podem calcular — e
     * é a lacuna que o diz, com o motivo, em vez de um número inventado. */
    let tempos = null;
    if (proporcao && proporcao.unidade === 'percentual' && volumeTotal) {
      tempos = numeroEmPortugues((proporcao.valor / 100) * volumeTotal);
    } else if (proporcao && proporcao.unidade === 'minutos' && duracaoMin && volumeTotal) {
      tempos = numeroEmPortugues((proporcao.valor / duracaoMin) * volumeTotal);
    }

    /* A FATIA DIZ A UNIDADE QUE FOI DECLARADA. Em percentual é o que o plano escreveu; em minutos
     * é o mesmo número com «min» — sem isso, «14» na coluna da fatia ao lado de «27» na dos tempos
     * lê-se como erro de conta. */
    const fatia = proporcao
      ? (proporcao.unidade === 'percentual'
        ? numeroEmPortugues(proporcao.valor) + '%'
        : numeroEmPortugues(proporcao.valor) + ' min')
      : null;

    /* A LACUNA É ESPECÍFICA, E É DO BLOCO (04/11/2026). O `[Preencher]` genérico escondia de quem
     * era a decisão: a linha do Expressão sai vazia porque a PROPORÇÃO não foi declarada no plano,
     * e é lá que se corrige — não na aula. */
    const falta = '[Preencher: proporção do bloco ' + nome + ' no plano]';
    linhas.push('| ' + String(bloco).replace(/—.*$/, '').trim() + ' | ' +
      (tempos || '[Preencher]') + ' | ' + (fatia || falta) + ' |');
  }
  return linhas;
}



/**
 * A notação escolhida (P-15): o front-matter do plano declara `contexto-notacao` como
 * `Benesh`/`Laban`/`Nenhuma`/… Só há registro/glossário quando uma notação foi ESCOLHIDA —
 * `Nenhuma` (ou ausente) não gera o par.
 */
function notacaoEscolhida(plano) {
  const v = String(resp(plano, 'contexto-notacao') || '').trim().toLowerCase();
  if (!v || v === 'nenhuma' || v === 'nenhum' || v === 'nao' || v === 'não') return null;
  return v.charAt(0).toUpperCase() + v.slice(1); // Benesh / Laban / …
}

// ---------------------------------------------------------------------------
// 1. Aula 01
// ---------------------------------------------------------------------------

/**
 * A fonte da Aula 01, derivada do plano e calibrada pelo `.conf`. A calibração
 * (`{ duracaoMinutos, volumeMin, volumeMax }`) vem do manifesto da variante: o envelope do
 * plano declara a duração como objeto (`contexto-duracao`) e o volume como séries
 * (`contexto-volume`), mas o contrato da aula pede «duração em minutos» e «volume em tempos»
 * (Regra 9) — e quem tem essas duas faixas é o `.conf`.
 */
function derivarAula01({ plano, po, contexto, calibracao, linhaDeBase }) {
  const cal = calibracao || {};
  const duracaoMin = Number(cal.duracaoMinutos) || 60;
  const volMin = Number(cal.volumeMin) || 0;
  const volMax = Number(cal.volumeMax) || 0;
  // O volume-alvo declarado é o ponto médio da faixa; a §8 audita contra a faixa.
  const volumeTotal = volMin && volMax ? Math.round((volMin + volMax) / 2) : 0;

  const objetivo = prosa(objetivoDaAula1(plano), 'objetivo específico da Aula 01');
  // O PARÂMETRO DE MEDIÇÃO vem da matriz objetivo × o que se observa (a forma que o formulário
  // grava: `{marco, marcados}`), e a prosa antiga segue valendo. Sem a composição, a matriz
  // chegava ao documento como `[object Object]`.
  /* A régua é a do repertório ACORDADO do envelope — a mesma da sequência (04/11/2026). Sem
   * ela, a matriz do parâmetro publicava «observa: … · Port de bras» numa aula cuja curadoria
   * tem dois verbetes (ver `motor/nucleo/sequencia.js`). */
  const parametroLinhas = parametroEmLinhas(resp(plano, 'aula-1-parametro'),
    marcosEmTexto(resp(plano, 'marcos-por-aula')), resp(plano, 'repertorio'));
  /*
   * UMA LINHA, NÃO VÁRIAS (20/10/2026). O parâmetro vira uma CÉLULA de tabela, e uma célula de
   * tabela Markdown não atravessa linhas: escrita com `\n`, a linha partia-se em três, o parser
   * fechava a tabela na primeira quebra e abria outra com o resto — e as linhas seguintes
   * (`Duração`, `Volume ativo`) deixavam de ser dado e passavam a ser cabeçalho da tabela
   * seguinte, que o contrato descarta. Medido na aula 01 da `batata`: `identificacao` saía sem
   * `duracao` nem `volumeAtivo`, com o aviso «as 1 linha(s) de uma SEGUNDA tabela ficaram de
   * fora». O separador é o mesmo que o resto do documento usa entre itens.
   */
  const parametro = parametroLinhas.length
    ? parametroLinhas.join(' · ')
    : '[Preencher: parâmetro de medição da Aula 01]';
  /* OS BLOCOS DA AULA VÊM DA ESTRUTURA, NÃO DOS OBJETIVOS (26/10/2026).
   *
   * Aqui lia-se `estrutura-de-cada-aula` — a relação objetivo × bloco —, e os blocos da aula
   * eram a união dos blocos dos objetivos dela. Isso é a contradição que a pesquisadora viu na
   * página do plano: um objetivo marcado «Solo e Barra» fazia a AULA ser «Solo e Barra», quando
   * o que ele diz é onde aquele objetivo é trabalhado. A aula tem os blocos que a estrutura
   * declara — e a estrutura é o quadro da distribuição do volume.
   *
   * A ORDEM É A CANÓNICA (Regra 3 — Solo → Barra → Centro, e Musicalidade ao fim), e não a
   * ordem em que o volume os lista: o documento é o mesmo em todos os ciclos.
   *
   * A RESERVA fica para o envelope antigo, que não tem o volume: aí continua a valer a leitura
   * anterior, que era a única que existia. */
  const estrutura = (() => {
    const volume = resp(plano, 'distribuicao-de-volume');
    const linhasDoVolume = Array.isArray(volume) ? volume
      : (volume && Array.isArray(volume.linhas)) ? volume.linhas : [];
    const doVolume = blocosDaEstrutura(
      linhasDoVolume.map((l) => ({ marcados: [String((l && (l.Bloco || l.bloco)) || '').trim()] })),
      BLOCOS_DA_AULA,
    );
    if (doVolume.length) return doVolume;
    const cru = resp(plano, 'estrutura-de-cada-aula');
    if (Array.isArray(cru) && cru.some((l) => l && typeof l === 'object')) {
      return blocosDaEstrutura(cru, BLOCOS_DA_AULA);
    }
    return emLista(cru).filter((v) => !GABARITO_VAZADO.test(v));
  })();
  const condicoes = emLista(resp(plano, 'condicoes-preliminares')).filter((v) => !GABARITO_VAZADO.test(v));
  const referencias = String(resp(plano, 'referencias') || '').trim();

  const saida = [];
  const ciclo = String((contexto && contexto.ciclo) || 'NN');

  saida.push('---');
  saida.push('projeto: Formação em Balé Clássico');
  saida.push('frente: Aula');
  saida.push('ciclo: "' + ciclo + '"');
  saida.push('aula: "01"');
  // O título é o próprio objetivo específico — sem truncar com reticências: o
  // `check-pacote.js` compara o <h1> da página com o texto do PDF, e o «…» não
  // atravessa o pandoc→LaTeX como um único caractere (quebrava a conferência).
  //
  // ELE DIZ QUE ESTE DOCUMENTO É UM PLANO (04/11/2026). O pesquisador: «a nomenclatura genérica
  // — «Aula 01» — gera estranheza e sensação de sobreposição na navegação; os documentos gerados
  // dentro do plano devem ser explicitamente identificados por nó e aula: «Plano para a Aula 1»,
  // «Plano para a Aula 2»…». O par passa a ler-se pelo que cada um É: o mestre é «Plano do
  // Ciclo 01», e cada entrega é «Plano para a Aula 01». O nome do ARQUIVO (`aula-01.md`,
  // `aula-01.html`) não muda: ele é endereço — entra na âncora, no DOCS do `.conf`, nos links
  // entre páginas e no PDF. Renomear o endereço por causa do rótulo partiria a cadeia sem
  // ganhar nada: o que se lia mal era o rótulo, e é ele que muda.
  //
  // O NÚMERO FICA COM DOIS DÍGITOS, e é a convenção do pacote inteiro (`aula-01`, «Ciclo 01»);
  // o exemplo do pesquisador («Aula 1») é a forma falada, não a do arquivo.
  const tituloDaAula = objetivo && !objetivo.startsWith('[Preencher') ? objetivo : '';
  saida.push('title: "Plano para a Aula 01' + (tituloDaAula ? ' — ' + tituloDaAula : '') + '"');
  saida.push('objetivo-especifico: "' + (objetivoDaAula1(plano) || '[Preencher]') + '"');
  saida.push('duracao: "' + duracaoMin + ' minutos"');
  if (volumeTotal) saida.push('volume-total: "' + volumeTotal + ' tempos"');
  if (referencias) saida.push('referencias: "' + referencias + '"');
  saida.push('---');
  saida.push('');

  const secao = (titulo, corpo) => {
    saida.push('## ' + titulo);
    saida.push('');
    for (const linha of corpo) saida.push(linha);
    saida.push('');
  };

  /* A CONDIÇÃO DESTA AULA VEM DO PO, E NÃO DA PRIMEIRA AULA DO PROTÓTIPO (01/11/2026).
   *
   * A HISTÓRIA, medida no repositório: «Sem deslocamento, sem giro, sem mudança de direção» era
   * o **subtítulo da Aula 01 da Diaghilev** (`4462d6a`, 23/09/2026) — e as aulas 02, 03 e 04
   * tinham subtítulos DIFERENTES («Deslocamento frontal e lateral, com o eixo entre os apoios»,
   * «O apoio deixa o chão: retorno controlado ao eixo»…). Ou seja: era **uma frase de uma aula**,
   * escrita à mão numa fonte. Quando o subtítulo saiu do cabeçalho (28/10/2026), ela foi
   * promovida a texto FIXO no código — e passou a sair igual em todas as aulas de todas as
   * escolas. É o oposto do que o projeto pede: um dado que vem de um lugar, e um só.
   *
   * DE ONDE VEM DE VERDADE: do PO. A arquitetura do `po_ref/po.md` (§5.7 e §5.8) tem
   * `what_is_left_out` — «o que fica de fora, e por quê» — como campo **obrigatório**, e o
   * formulário do PO tem os dois campos que o realizam: «Critérios de exclusão» (`exclusao`) e
   * «O que fica de fora» (`o-que-fica-de-fora`). A frase que a Diaghilev escreveu à mão é, na
   * natureza dela, uma declaração de escopo: o que esta aula NÃO tem.
   *
   * A ORDEM DA LEITURA: `o-que-fica-de-fora` primeiro — é o campo que diz, em prosa, o que o
   * recorte exclui —, e `exclusao` depois. Sem nenhum dos dois, a linha **não se inventa**: sai a
   * lacuna declarada, com o caminho de volta. Uma aula sem condição declarada é uma aula cujo
   * escopo ninguém escreveu, e calar isso seria o mesmo defeito outra vez. */
  {
    const deFora = emLista(resp(po, 'o-que-fica-de-fora')).filter((v) => !GABARITO_VAZADO.test(v)).join(' ');
    const exclusao = emLista(resp(po, 'exclusao')).filter((v) => !GABARITO_VAZADO.test(v)).join(' ');
    const condicao = deFora || exclusao;
    saida.push(condicao
      ? '**O que esta aula deixa de fora.** ' + condicao
      : '**O que esta aula deixa de fora.** [Preencher: declara-se no Plano de Observação, em '
        + '«O que fica de fora» — o recorte é do PO, e a aula não o inventa.]', '');
  }

  // §1 — Validação dos objetivos, métricas e duração (item/valor → `identificacao`).
  {
    const corpo = ['| Item | Definição |', '|:--|:--|'];
    corpo.push('| **Objetivo específico** | ' + objetivo + ' |');
    corpo.push('| **Parâmetro de medição** | ' + parametro + ' |');
    corpo.push('| **Duração** | ' + duracaoMin + ' minutos (Pré-requisito 4) |');
    corpo.push('| **Volume ativo** | ' +
      (volumeTotal
        ? volumeTotal + ' tempos (faixa ' + volMin + '–' + volMax + ' da duração de ' + duracaoMin + ' min — Regra 9, etapa 1)'
        : '[Preencher: volume em tempos — Regra 9, etapa 1]') + ' |');
    secao('1. Validação dos objetivos, métricas e duração', corpo);
  }

  /* §2 — Condições preliminares: O TÍTULO DIZIA OUTRA COISA QUE O CONTEÚDO (01/11/2026).
   *
   * A pesquisadora leu a Aula 01 do ciclo da `batata` e parou aqui: «Condições preliminares de
   * preparação, força e flexibilidade — vê que esse valor não tem nada a ver com força e
   * flexibilidade». Não tem, e a causa é de origem: O NOME DA REGRA e O NOME DO CAMPO são coisas
   * diferentes.
   *
   *   · A **Regra 4** fala de «pré-requisitos de força e flexibilidade declarados e contados à
   *     parte do volume da aula».
   *   · O **campo** do formulário do plano é «Condições do espaço» — «o que a sala e o material
   *     precisam ter para o ciclo acontecer».
   *
   * O título desta secção nasceu da Regra 4 e o corpo sempre veio do campo. Ou seja: durante
   * todo este tempo o documento afirmou que aquela frase era sobre o corpo das alunas, quando é
   * sobre a sala. E a metade que a Regra 4 pede — a força e a flexibilidade — **não é perguntada
   * em formulário nenhum**, e por isso nunca apareceu.
   *
   * A CORREÇÃO É DO TÍTULO, e só dele: ele passa a dizer o que o corpo É («o espaço e o
   * material»), que é o que o campo pergunta e o que a pessoa escreve. A lacuna da Regra 4
   * fica **declarada como contradição** no `REGISTRO.md` e no `PLANO-AULA-E-OBSERVACAO.md`, e
   * não se resolve aqui: inventar uma segunda lista de «força e flexibilidade» sem pergunta
   * seria escrever no documento o que ninguém decidiu — o defeito que esta entrada corrige.
   *
   * O TÍTULO ANTIGO CONTINUA NO MAPA DO VALIDADOR. Há documento no repositório que o escreve
   * (as aulas escritas à mão em `experimentos/`), e ele extraía antes desta mudança. */
  secao('2. Condições preliminares de preparação (o espaço e o material)',
    condicoes.length ? condicoes.map((v) => '- ' + v) : ['- [Preencher: condições preliminares de preparação]']);

  // §3 — A distribuição do tempo pelos blocos.
  {
    const corpo = [];
    if (estrutura.length) {
      /* O SUBTÍTULO SAIU (02/11/2026). Ele dizia «Distribuição do tempo da aula» por baixo de um
       * título que passou a dizer o mesmo — dois nomes para a mesma tabela, na mesma secção. */
      corpo.push('| Bloco | Tempos | Fatia |');
      corpo.push('|:--|--:|--:|');
      /* A UNIDADE VAI JUNTO (04/11/2026). Aqui passava-se `linhasDaTabela(...)`, que devolve
       * só as LINHAS — e a unidade é da TABELA, não da linha. Sem ela, uma tabela em minutos não
       * se distinguia de uma em percentagem, e os tempos não se podiam calcular. A função aceita
       * as duas formas (o array antigo e o `{unidade, linhas}` de hoje). */
      for (const linha of distribuicaoDoTempo(estrutura, resp(plano, 'distribuicao-de-volume'), volumeTotal, duracaoMin)) {
        corpo.push(linha);
      }
      corpo.push('| **Total** | **' + (volumeTotal || '[Preencher]') + '** | **100%** |');
      corpo.push('');
    }
    /* A «SEQUÊNCIA DECLARADA» SAIU (28/10/2026). Ela era a lista dos exercícios com bloco e
     * objetivo — e é exactamente o que «Exercícios da Aula 01» já diz, mais abaixo e com o
     * compasso, a contagem, a notação e a descrição. A pesquisadora: «eu não preciso dessa
     * sequência declarada aqui, eu já tenho tudo organizado mais abaixo». Duas listas do mesmo
     * dado, uma delas mais pobre, no mesmo documento — e o documento tem 15 ecrãs.
     *
     * A SECÇÃO FICA, com a tabela do tempo: ela é a distribuição da aula pelos blocos (Regra 9),
     * e isso não se repete em nenhum outro lugar. */
    /* O TÍTULO DIZIA «A SEQUÊNCIA CONECTADA (FIO CONDUTOR)» E O CORPO É A TABELA DO TEMPO
     * (02/11/2026). A pesquisadora, ao ler a Aula 01, não reconheceu o que estava debaixo do
     * título: a sequência — os exercícios na ordem, com compasso e descrição — está em
     * «Exercícios da Aula 01», e o que esta secção mostra é a **distribuição do tempo pelos
     * blocos** (Regra 9, etapa 2). Um título que promete outra coisa obriga a pessoa a
     * procurar; o nome passa a ser o do conteúdo. */
    secao('3. Distribuição do tempo pelos blocos', corpo);
  }

  /* §4 — A MUSICALIDADE É UMA VISTA CONSOLIDADA, E NÃO UM BLOCO COM EXERCÍCIOS PRÓPRIOS
   * (02/11/2026, a segunda correção do mesmo dia).
   *
   * A PRIMEIRA REDAÇÃO desta secção dizia, ao pé da letra:
   *
   *     | **Exercícios neste bloco** | nenhum — a sequência da aula não tem linha no bloco
   *     |                              Musicalidade |
   *
   * E É FALSO. A pesquisadora: «não existe uma linha musicalidade. Você precisa relacionar a sua
   * afirmação de que o exercício neste bloco, nessa aula, não tem nenhum está errada, é falsa. Se
   * eu descer um pouquinho mais e olhar para o exercício 1, eu tenho compasso e contagem no
   * battement fondu, eu tenho no battement tendu, no plié eu também tenho.»
   *
   * Ela tem razão, e o erro foi de MODELO, não de redação. Eu tratava «Musicalidade» como um
   * bloco da aula — ao lado de Barra, Centro e Expressão — e concluía «nenhum exercício cai lá».
   * Mas a musicalidade não é um sítio onde se põem exercícios: é uma **forma de olhar todos
   * eles**. Cada linha da sequência declara os tempos e o compasso, e cada exercício tem no
   * verbete a grade das suas contagens. As duas coisas juntas são a música da aula, e é isso que
   * esta secção consolida.
   *
   * A VISTA DO EXERCÍCIO E A VISTA DA MUSICALIDADE, ditas por ela: «eu tenho a visão do
   * exercício, aonde eu já tô mostrando ali embaixo qual é o exercício (…) e eu tenho uma visão
   * da musicalidade, que eu tô mostrando uma forma consolidada de que a musicalidade vai ser
   * adotada com 4 por 4, 3 por 4, 2 por 2, as que estiverem selecionadas (…) e eu vou ter um
   * compasso, dois compassos, de 1 até 3, de 1 até 4. Eu vou consolidar isso.»
   *
   * O QUE ISSO QUER DIZER, em tabela: **um compasso por grupo**, e dentro dele **uma linha por
   * exercício** — porque o mesmo exercício aparece em Barra, Centro e Expressão com a mesma
   * música, e repeti-lo três vezes é a redundância que ela mandou cortar. A vista da aula mostra
   * os nove; a da musicalidade mostra os três que existem, cada um com a sua contagem.
   *
   * O QUE SAIU, e porquê:
   *   · a «fatia do plano» (30% do volume — 27 tempos, Regra 9, etapa 2) — «eu não sei o que isso
   *     quer dizer, não é claro, eu não sei de onde você tirou isso». Ela vem da tabela de
   *     distribuição do volume, que é a §3 inteira: repetir o número aqui sem a tabela não
   *     informa — confunde;
   *   · o «trabalho de pulso, acento e frase» — uma lacuna que eu escrevi e que remetia para uma
   *     Regra 15 que fala de outra coisa (ver `REGRAS.md`: «bloco próprio em cada aula + arquivo
   *     paralelo do ciclo»). Nada no formulário pergunta «pulso, acento e frase», e ela: «isso eu
   *     não sei o que você quer dizer (…) talvez a gente precise ajustar isso pra existir esses
   *     campos, ou talvez a gente não precise disso». Fica declarado como contradição no
   *     `REGISTRO.md`, não inventado aqui.
   *
   * SEM GRADE NÃO HÁ O QUE CONSOLIDAR, e diz-se qual das duas metades falta — a música, que vem
   * da sequência, ou a contagem, que vem do verbete. Nunca se pede a ninguém que escreva. */
  {
    const corpo = [];
    const sequencia = sequenciaComoObjetos(plano);
    const notacao = notacaoEscolhida(plano);
    const alfabeto = notacao ? moduloNotacao.paraNotacao(notacao) : null;
    const composicoes = sequencia && alfabeto
      ? moduloNotacao.comporTodas(sequencia, alfabeto, dataDoEnvelope(plano), escolaDoEnvelope(plano, contexto))
      : null;

    if (!composicoes) {
      corpo.push(sequencia === null
        ? 'A sequência deste envelope está em prosa, e a música vem dela: sem uma linha por '
          + 'exercício não há compasso a consolidar.'
        : 'Este ciclo não declara notação, e é o verbete de cada exercício que guarda a divisão '
          + 'das contagens.');
    } else {
      /* AGRUPA POR COMPASSO (a forma da vista que ela descreveu: «4 por 4, 3 por 4, 2 por 2, as
       * que estiverem selecionadas»), e dentro do compasso **um exercício uma vez** — a chave é o
       * exercício + os tempos, e não o bloco: o mesmo Battement fondu em Barra, Centro e Expressão
       * é a mesma música, e a vista da musicalidade é sobre a música. */
      const porCompasso = new Map();
      const semMusica = [];
      for (const c of composicoes) {
        if (!c.musica) {
          if (!semMusica.some((n) => n === rotuloDoExercicio(c))) semMusica.push(rotuloDoExercicio(c));
          continue;
        }
        const chave = c.musica.compasso;
        if (!porCompasso.has(chave)) porCompasso.set(chave, new Map());
        const doExercicio = porCompasso.get(chave);
        const id = c.exercicio + '|' + c.musica.tempos;
        if (!doExercicio.has(id)) {
          /* A CÉLULA É A CONTAGEM *E* O QUE CAI NELA. Cortar só pela contagem — «1–2 · 3–4 · 1–2»
           * sem a notação — deitava fora exactamente o que a tabela anterior mostrava e que ela
           * nomeou: «o que cai em cada contagem». O `1–2` do fim é outra coisa do pé que o `1–2`
           * do princípio, e a repetição sobre o segundo compasso é a frase, não redundância. */
          /* A NOTAÇÃO SAI DESTA TABELA (04/11/2026). A pesquisadora: «o bloco de musicalidade
           * exibe a notação Benesh junto à contagem — remover; a notação só deve ser carregada e
           * exibida quando o utilizador acionar explicitamente a opção de abrir a notação».
           *
           * E ela tinha razão por duas: esta vista é a MÚSICA da aula (compasso, exercício,
           * tempos e contagem), e a notação não é música — é o código em que a música se escreve,
           * e tem documento próprio (`-notacao.md`, «Exercícios da Aula 01», onde cada exercício
           * tem a sua tabela com a coluna «Notação»). Repeti-la aqui punha um `[Perna: ED 1ª ○ - ●
           * 1ª]` de 24 caracteres numa coluna de «1–2», a espremer as outras três — e obrigava
           * quem lê a música a atravessar o código.
           *
           * A dedução continua a ser pela CONTAGEM, e agora só por ela: dois segmentos com a
           * mesma contagem e blocos diferentes passam a ser a mesma célula, que é o que a tabela
           * passou a mostrar. */
          const vistas = new Set();
          const contagens = [];
          for (const sg of c.segmentos || []) {
            const celula = sg.contagem;
            if (!celula || vistas.has(celula)) continue;
            vistas.add(celula);
            contagens.push(celula);
          }
          doExercicio.set(id, {
            exercicio: c.exercicio,
            tempos: c.musica.tempos,
            contagens,
            conferir: c.estado === 'parcial',
          });
        }
      }

      const compassos = [...porCompasso.keys()].sort((a, b) => b.localeCompare(a));
      if (!compassos.length) {
        corpo.push('Nenhum exercício desta aula tem tempos e compasso declarados na sequência — '
          + 'sem eles não há música a consolidar.');
      } else {
        corpo.push('**Os compassos desta aula.** ' + compassos.join(' · ') + '.', '');
        corpo.push('| Compasso | Exercício | Tempos | Contagem |');
        corpo.push('|:--|:--|--:|:--|');
        for (const compasso of compassos) {
          for (const linha of porCompasso.get(compasso).values()) {
            corpo.push('| ' + compasso + ' | ' + linha.exercicio + ' | ' + linha.tempos + ' | '
              + (linha.contagens.length ? linha.contagens.join(' · ') : '—')
              + (linha.conferir ? ' **conferir**' : '') + ' |');
          }
        }
        corpo.push('');
        corpo.push('Uma linha por exercício, e uma vez só: o mesmo exercício em Barra, Centro e '
          + 'Expressão tem a **mesma** música — ela é do exercício, não do bloco. Os tempos e o '
          + 'compasso vêm da sequência do plano; a contagem, do verbete de cada exercício.');
        if ([...porCompasso.values()].some((m) => [...m.values()].some((l) => l.conferir))) {
          corpo.push('', 'Onde diz **conferir**, a grade de contagens do verbete não fecha nos '
            + 'tempos que a sequência declara para aquela música. O que se corrige é o verbete, e '
            + 'a decisão é da professora: o documento não escolhe por ela.');
        }
      }
      if (semMusica.length) {
        corpo.push('', 'Sem música declarada na sequência: ' + semMusica.join(' · ') + '.');
      }
    }

    secao('4. Bloco de musicalidade', corpo);
  }

  /* §5 — O GUIA DE OBSERVAÇÃO DIZ O QUE SE OBSERVA, E NÃO QUE ALGUÉM O PREENCHA (01/11/2026).
   *
   * A pesquisadora: «o formulário precisa ser a expressão da janela. É o que eu olho pela janela.
   * (…) Eu não posso só olhar por uma banda da janela. Eu tenho que olhar por todas as bandas.»
   * Este é o mesmo erro, no documento: a secção que diz o que observar saía com `[Preencher]` em
   * TODAS as dimensões — um guia de observação que não diz o que observar. Medido no `.md` da
   * Aula 01: era a ÚNICA parte do documento que o código não reproduzia (16 das 18 linhas
   * divergentes), porque alguém a tinha escrito à mão. Um documento cujo conteúdo não se
   * reproduz é pior do que um documento com lacuna: a lacuna declara-se, e o texto à mão some
   * na próxima geração sem ninguém dar por isso.
   *
   * UMA LINHA POR CRITÉRIO, e não por dimensão. A dimensão é a BANDA da janela; o critério é o
   * que se marca. Agrupá-los numa célula («a; b») fazia o professor marcar dois critérios num
   * só lugar — era o que a folha de captura fazia até hoje, e é o que a regra do `;` veio
   * desfazer. O documento mostra o que a folha vai pedir, um a um.
   *
   * A FONTE É A MESMA DA FOLHA (`dimensoesEItens`): o guia e a captura não podem divergir,
   * porque são duas leituras do mesmo par dimensão × item.
   *
   * AS TRÊS FRENTES SÃO A LEITURA (04/11/2026). O guia mostrava todas as dimensões com o prefixo
   * «Técnica —», inclusive Musicalidade e Expressão, cujo conteúdo é poiésis. O resumo por eixo
   * (Corpo · Técnica · Poiesis) vem antes, CURTO — é o que a pessoa lê de relance —, e a tabela
   * item a item fica logo abaixo, que é o detalhe que a folha de captura pede. A síntese é uma
   * LISTA e não uma tabela de propósito: o contrato extrai UMA tabela por secção (a primeira),
   * e a segunda — a dos critérios, que é o dado — desaparecia em silêncio. */
  {
    const dims = dimensoesEItens(po, plano);
    /* A LINHA DE BASE VAI AO EIXO DO CORPO (06/11/2026). O guia é o documento que o professor
     * leva para a sala, e o corpo é um dos três eixos: deixá-lo a depender de um campo que se
     * preenche à mão no plano era deixar o eixo a dizer «[Preencher]» sobre dados que o passo 3 e
     * o passo 4 da linha de base já tinham resolvido. Opcional, como no `derivarPlano` — sem ela,
     * o eixo declara a lacuna em vez de inventar. */
    const eixos = eixosDaObservacao(dims, plano, po, linhaDeBase);
    const corpo = [
      '> Os itens vêm do **Itens de cada dimensão** no Plano de Observação, e o corpo vem do que a',
      '> turma mostra nos aspectos que a linha de base escolheu. O ponto de partida de cada aluna',
      '> fica no Plano de Observação, que é onde se declara — e é ele que a Captura pede, aluna a',
      '> aluna: ✓ aconteceu · ~ parcial · X não aconteceu · ? não vi · vazio = não observei.',
      '',
    ];
    /* AS TRÊS FRENTES SÃO TRÊS TABELAS (04/11/2026).
     *
     * A pesquisadora: «o guia não pode chamar tudo de "técnica" — tem de ser dividido pelos três
     * eixos», com «tabelas/seções distintas para cada eixo». Antes havia UMA tabela com uma coluna
     * «Eixo» repetindo o mesmo rótulo linha a linha — o que se lê como uma tabela de técnica com
     * etiquetas, e não como três coisas.
     *
     * O `### <Eixo>` NÃO É DECORAÇÃO: é o que o contrato de extração chama de BLOCO, e é o que
     * permite três tabelas na mesma secção. O contrato lê UMA tabela por bloco — uma segunda
     * tabela no mesmo bloco fica de fora, com aviso (`lib-extracao-md.js`, «dê à tabela o seu
     * bloco»). O bloco é o título `### Corpo`, um token só, que é a forma que o PO já usa para os
     * subcampos. E o título fica legível no documento: é o nome do eixo, e não um código.
     *
     * O CORPO TEM LINHAS PRÓPRIAS (ver `eixosDaObservacao`): os aspectos físicos que o plano
     * consolidou. Sem elas o eixo existia como resumo e a tabela saltava-o — e uma tabela que
     * salta um eixo dos três ensina que ele não se observa. A restrição física vem DEPOIS da
     * tabela, numa linha só: ela não é um aspecto, e a tabela fica com os aspectos e só eles. */
    for (const e of eixos) {
      corpo.push('### ' + e.rotulo, '');
      const tabelaDe = (cabecalho, linhas) => {
        corpo.push(cabecalho);
        corpo.push('|:--|:--|');
        for (const [criterio, observa] of linhas) corpo.push('| ' + criterio + ' | ' + observa + ' |');
        corpo.push('');
      };
      if (e.linhas.length) {
        tabelaDe('| Critério | O que se observa |', e.linhas);
        /* A NOTA É CITAÇÃO, e não parágrafo — por uma razão de CONTRATO, medida: o extrator lê
         * UMA tabela por bloco, e o texto que vem DEPOIS dela, num subcampo de lista, substitui o
         * array pelo parágrafo (o `guiaDeObservacao.Corpo` do `plano-aula-01.json` virava a frase
         * das restrições, e o cartão perdia os quinze). A linha `>` é o que o contrato chama de
         * comentário do documento: fica visível para quem lê e não entra no dado. */
        if (e.restricoes !== undefined) {
          corpo.push(e.restricoes
            ? '> **Restrições físicas**, declaradas no Plano de Observação: ' + e.restricoes
            : '> **Sem restrições físicas declaradas** no Plano de Observação.', '');
        }
        continue;
      }
      if (!dims.length) {
        corpo.push('| Bloco | O que se observa |');
        corpo.push('|:--|:--|');
        corpo.push('| [Preencher] | [Preencher] |');
        corpo.push('');
        continue;
      }
      if (!e.dimensoes.length) {
        corpo.push('Nenhuma dimensão do Plano de Observação cai neste eixo.', '');
        continue;
      }
      corpo.push('| Bloco | O que se observa |');
      corpo.push('|:--|:--|');
      for (const d of e.dimensoes) {
        if (!d.itens.length) {
          corpo.push('| ' + d.bloco + ' | [Preencher: os itens desta dimensão no PO] |');
          continue;
        }
        for (const item of d.itens) corpo.push('| ' + d.bloco + ' | ' + item + ' |');
      }
      corpo.push('');
    }
    /* A DIMENSÃO QUE NÃO CASOU NENHUM EIXO NÃO DESAPARECE. Hoje `eixosDaObservacao` cobre todos
     * os blocos (Técnica por omissão), mas a conta abaixo é a que garante que uma dimensão nova
     * — ou um rótulo noutra forma — não seja engolida em silêncio: o que sobrar é dito. */
    const mostradas = eixos.reduce((soma, e) => soma + e.dimensoes.length, 0);
    if (dims.length && mostradas < dims.length) {
      corpo.push('Sem eixo classificado: ' + (dims.length - mostradas) +
        ' dimensão(ões) do PO — classifique o bloco no mapa dos eixos.', '');
    }
    secao('5. Guia de observação do professor', corpo);
  }

  /* A «DISTRIBUIÇÃO DO VOLUME FÍSICO» SAIU — ELA DUPLICAVA A §3 (01/11/2026).
   *
   * A pesquisadora: «se ele duplica (…) Tem que vir sempre do mesmo lugar e a informação é uma
   * só.» Medido no documento da Batata: a §3 imprime `| Solo | 27 | 30% | … | **Total** | **90**
   * | **100%** |`, e a §6 imprimia `| **Total** | **90** | **100%** |` — a MESMA conta, uma
   * tabela depois, sem as linhas que a explicam. Nenhum consumidor lê o campo
   * (`distribuicaoDoVolume` só era produzido e validado: nenhum template, nenhum renderizador).
   *
   * E a fonte já é a certa: o volume vem do PLANO (`distribuicao-de-volume`), e é isso que a §3
   * mostra. Uma segunda tabela do mesmo número não é uma segunda leitura — é a mesma, mais pobre.
   *
   * A RENUMERAÇÃO foi decidida com ela em mente: um documento que salta do 5 para o 7 lê-se como
   * defeito. As secções seguintes passam a 6, 7 e 8, e o mapa do `validar-aula-ciclo.js` ganhou as
   * três variantes — sem isso o validador descartaria as três secções EM SILÊNCIO (é o modo de
   * falha que o próprio mapa documenta). */

  /* §6 — A PROVENIÊNCIA É UM LUGAR AONDE SE VAI, NÃO UM CÓDIGO QUE SE MOSTRA (02/11/2026).
   *
   * A primeira redação desta secção (01/11/2026) corrigiu duas coisas — «Ciclo **simulado**»
   * saiu, e os elos passaram a ser nomeados — e deixou três que a pesquisadora leu de imediato:
   *
   *  1. **O `id` do envelope não é o documento.** «A proveniência aponta para PO, que é o
   *     documento, né? (…) Não é isso que tem que mostrar.» `po-20261101-1959` é uma etiqueta de
   *     armazenamento: não leva a lado nenhum. O que serve à professora é o LINK.
   *  2. **«Esta aula deriva dos dois por `derivar-ciclo.js`» não é informação dela.** «Isso não
   *     interessa para o professor, ele nem sabe o que é um ponto JS.» E a frase estava a
   *     explicar o gerador a quem abriu a aula.
   *  3. **Uma tabela de duas colunas para duas linhas** lê-se como formulário. É uma lista.
   *
   * O QUE FICA NO LUGAR: duas linhas, cada uma um LINK para o sítio onde o documento vive, e ao
   * lado o OBJETIVO daquele documento — porque «Plano de Observação» sozinho não diz o que se vai
   * lá buscar. O objetivo do PO é a pergunta que ele se propõe responder (`question`); o do plano
   * de ensino é o objetivo geral do ciclo (`objetivo-geral`). Os dois são dado, não código.
   *
   * OS LINKS SÃO ABSOLUTOS, e não relativos — e a assimetria NÃO é descuido. A porta do plano de
   * observação viaja DENTRO do pacote do ciclo (`plano-observacao/`), mas a do plano de ensino é
   * uma ROTA do Worker, servida só na raiz do site. Medido no ar (02/11/2026):
   * `/plano-ensino/?…` responde 200, e `<variante>/plano-ensino/?…` responde 404. Duas formas
   * diferentes para dois links irmãos seriam uma armadilha para quem editar isto depois; uma só,
   * absoluta, alcança as duas — é a mesma forma que o `check-identidade.js` já usa para a rota.
   * O custo é o de sempre num link absoluto: não se abre a partir do disco, e no PDF não navega. */
  {
    const corpo6 = [];
    const q = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    const encurtar = (texto, max) => (texto.length > max ? texto.slice(0, max - 1).replace(/[\s,;:.]+$/, '') + '…' : texto);
    const docente = q((contexto && contexto.professor) || '');
    const escola = q((contexto && contexto.escola) || '');
    const ciclo = q((contexto && contexto.ciclo) || '');
    const barra = [docente ? 'professor=' + encodeURIComponent(docente) : '',
      escola ? 'escola=' + encodeURIComponent(escola) : '',
      ciclo ? 'ciclo=' + encodeURIComponent(ciclo) : ''].filter(Boolean).join('&');

    /*
     * O LINK DA PROVENIÊNCIA VAI PARA A LEITURA, NÃO PARA O FORMULÁRIO (04/11/2026).
     *
     * O defeito, nas palavras da pesquisadora: «ao clicar nos links do Plano de Observação ou do
     * Plano de ensino, o sistema está a direcionar para o modo de edição». Era literal — o
     * endereço era `/plano-observacao/?professor=…&fonte=po`, que é a PORTA, o formulário de
     * elicitação. Quem clicava em «Proveniência consolidada» para reler o que decidiu caía dentro
     * do formulário que ia reescrever esse mesmo documento.
     *
     * A LEITURA É A MESMA FOLHA DA ESTANTE. A Área do Professor abre um registo pelo TÍTULO, e é
     * `api/po-preenchido.<id>?formato=html` (o mesmo `fichaDeLeitura` de `listas-do-acervo.js`,
     * com a mesma rota e o mesmo `formato=html` — sem ele a rota devolve MARKDOWN, que o
     * navegador mostra como texto corrido). O `id` vem do envelope, e é o que identifica o
     * documento: o PO desta aula, não «o PO mais recente».
     *
     * SEM ID CAI-SE NA PORTA, e não num link quebrado: um envelope que ainda não foi gravado não
     * tem folha, e inventar-lhe um endereço prometeria um documento que não existe. O `barra`
     * (professor, escola, ciclo) continua a ser o contexto que a porta precisa.
     */
    const enderecoDeLeitura = (qual) => {
      const id = q(qual === 'po' ? (po && po.id) : (plano && plano.id));
      if (!id) {
        return qual === 'po'
          ? '/plano-observacao/?' + barra + '&fonte=po'
          : '/plano-ensino/?' + barra + '&fonte=plano';
      }
      return qual === 'po'
        ? '/plano-observacao/api/po-preenchido.' + encodeURIComponent(id) + '?formato=html'
        : '/plano-ensino/api/plano-preenchido.' + encodeURIComponent(id) + '?formato=html';
    };

    const objetivoDoPo = q(resp(po, 'question') || resp(po, 'pergunta'));
    const objetivoDoPlano = q(resp(plano, 'objetivo-geral'));

    corpo6.push('- **[Plano de Observação](' + enderecoDeLeitura('po') + ')** — '
      + (objetivoDoPo
        ? encurtar(objetivoDoPo, 160)
        : '[Preencher: o PO não declara a pergunta que se propõe responder]'));
    corpo6.push('- **[Plano de ensino](' + enderecoDeLeitura('plano') + ')** — '
      + (objetivoDoPlano
        ? encurtar(objetivoDoPlano, 160)
        : '[Preencher: o plano não declara o objetivo geral do ciclo]'));
    secao('6. Proveniência consolidada', corpo6);
  }

  // §7 — Registro de auditoria.
  {
    const corpo = ['| Verificação | Resultado |', '|:--|:--|'];
    corpo.push('| Objetivo específico declarado | ' + (objetivo.startsWith('[Preencher') ? 'não' : 'ok') + ' |');
    corpo.push('| Duração declarada (Pré-requisito 4) | ok — ' + duracaoMin + ' minutos |');
    corpo.push('| Volume dentro da faixa (Regra 9) | ' +
      (volumeTotal ? 'ok — ' + volumeTotal + ' tempos em ' + volMin + '–' + volMax : '[Preencher]') + ' |');
    secao('7. Registro de auditoria da aula', corpo);
  }

  /* §8 — UMA LINHA, E OS TRÊS ESTADOS QUE ELA PODE TER (02/11/2026).
   *
   * A primeira redação explicava o que «próximo passo» queria dizer em três linhas de tabela
   * (`O que se entende por…`, `Estado`, `Lido de`). A pesquisadora: «não precisa disso tudo (…)
   * se não tiver um próximo passo, coloca aqui: o plano declarou apenas um marco (…) e aguarda-se
   * o desenvolvimento do próximo marco para elaboração da aula 2». Ou seja: a secção não explica
   * o conceito — DIZ O ESTADO. Fica uma linha, «Marco da Aula 02», e o resto sai.
   *
   * OS TRÊS ESTADOS, ditos por ela:
   *   · o plano tem um marco só       → «—» e a razão: aguarda-se o marco seguinte;
   *   · há marco e não há Aula 02     → o marco, e «a Aula 02 ainda não foi elaborada»;
   *   · há marco e há Aula 02         → o título E o marco viram link para a Aula 02.
   *
   * O TERCEIRO ESTADO PRECISA DE UM DADO QUE ESTE DERIVADOR NÃO TINHA: que aulas existem no
   * ciclo. Ele chega em `contexto.aulas` (as que o `DOCS` declara), posto por quem escreve as
   * fontes. Sem o dado, o pior que sai é um link a menos — nunca um link para uma aula que não
   * existe, que é o defeito que se estava a evitar. */
  {
    const marcos = marcosEmTexto(resp(plano, 'marcos-por-aula')).filter((v) => !GABARITO_VAZADO.test(v));
    const seguinte = marcos.length > 1 ? marcos[1] : '';
    const aulas = Array.isArray(contexto && contexto.aulas)
      ? (contexto.aulas || []).map((a) => String(a).replace(/^aula-?/, '').replace(/^0+(?=\d)/, ''))
      : null;
    const haAula02 = aulas ? aulas.indexOf('2') !== -1 || aulas.indexOf('02') !== -1 : false;
    const linkAula02 = 'aula-02.html';

    const valor = !seguinte
      ? '— o plano declarou ' + (marcos.length ? 'apenas um marco' : 'nenhum marco')
        + '; aguarda-se o desenvolvimento do próximo marco para a elaboração da Aula 02'
      : haAula02
        ? '[' + seguinte + '](' + linkAula02 + ')'
        : seguinte + ' — a Aula 02 ainda não foi elaborada';
    const titulo = haAula02 && seguinte ? '**[Marco da Aula 02](' + linkAula02 + ')**' : '**Marco da Aula 02**';
    secao('8. Próximo passo', ['| Item | Proposta |', '|:--|:--|', '| ' + titulo + ' | ' + valor + ' |']);
  }

  /* UMA LINHA EM BRANCO, E NÃO DUAS. Cada `secao()` fecha com uma, e vários corpos terminam
   * com outra — o que deixava um vão de duas linhas entre secções, visível no `.md` e no HTML.
   * A normalização é no FIM, e não em cada chamada: assim um corpo novo não tem de saber a
   * convenção, e o documento sai igual seja qual for o caminho. */
  return saida.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

// ---------------------------------------------------------------------------
// 2. Dados do ciclo (o esqueleto `-dados.json` que o cifrador consome)
// ---------------------------------------------------------------------------

/**
 * A FONTE `-dados.json` do ciclo «do zero»: `aulas` vazio (nenhuma aula lançada
 * ainda) e os `apelidos` do PO (P-12) — é exatamente o que o `tools/cifrar-dados.js`
 * lê para publicar a cópia cifrada no pacote, e o que o `check-pacote.js` exige.
 * Sem ela, um ciclo recém-gerado sairia do pacote sem o JSON de dados.
 */
function derivarDados({ po, contexto }) {
  const sujeitos = emLista(resp(po, 'sujeitos')).filter((v) => !GABARITO_VAZADO.test(v));
  const apelidos = {};
  for (const s of sujeitos) {
    const slug = slugDe(s);
    if (slug && !(slug in apelidos)) apelidos[slug] = s;
  }
  const dados = {
    ciclo: String((contexto && contexto.ciclo) || 'NN'),
    escola: String((contexto && contexto.escola) || 'Escola'),
    professor: String((contexto && contexto.professor) || 'Professor'),
    criado_em: new Date().toISOString().slice(0, 10),
    // DE QUE PO ESTE ESTADO NASCEU (22/10/2026). O `-dados.json` é derivado do PO, e o
    // `-po.md` é a fonte — os dois têm de declarar o MESMO carimbo, ou o pacote mistura dois
    // POs (um na fonte, outro nos derivados). É essa comparação que o `check-pacote.js` faz.
    po: (po && (po.id || po.carimbo)) || null,
    apelidos,
    aulas: {},
    _nota: 'JSON de dados do ciclo «do zero»: `aulas` vazio DE PROPÓSITO — é o estado de um '
      + 'ciclo que ainda não teve aula lançada pelo formulário. Gerado pelo «Guardar» do PO.',
  };
  return JSON.stringify(dados, null, 2) + '\n';
}

// ---------------------------------------------------------------------------
// 3. Referências
// ---------------------------------------------------------------------------

function derivarReferencias({ plano, contexto }) {
  const refs = emLista(resp(plano, 'referencias')).filter((v) => !GABARITO_VAZADO.test(v));
  const saida = [];
  const ciclo = String((contexto && contexto.ciclo) || 'NN');

  saida.push('---');
  saida.push('projeto: Formação em Balé Clássico');
  saida.push('frente: Referências');
  saida.push('ciclo: "' + ciclo + '"');
  saida.push('title: "Referências Bibliográficas"');
  saida.push('---');
  saida.push('');
  saida.push('> **O que é este arquivo.** A bibliografia que aparece **dentro** do pacote do ciclo — uma');
  saida.push('> seleção curada de `biblioteca/referencias.md`. Ciclo **simulado**.');
  saida.push('');
  saida.push('## Referências declaradas no plano');
  saida.push('');
  if (refs.length) {
    for (const r of refs) saida.push('- ' + r);
  } else {
    saida.push('- [Preencher: referências bibliográficas do ciclo]');
  }
  saida.push('');
  saida.push('> **Nota de escopo.** A lista acima é a que o professor declarou no plano. As entradas');
  saida.push('> completas (autor, obra, edição) devem ser confirmadas contra `biblioteca/referencias.md`.');
  return saida.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// 3 e 4. Notação + Glossário (P-15/P-16 — só quando a notação foi escolhida)
// ---------------------------------------------------------------------------

/**
 * A SEQUÊNCIA COMO OBJETOS — as linhas do plano com as colunas separadas, que é a forma que o
 * compositor precisa. A forma LEGADA (prosa) não tem como alimentar uma grade de compassos, e
 * devolve `null`: o documento sai então pela via antiga, com a lacuna declarada em cada linha.
 */
function sequenciaComoObjetos(plano) {
  const valor = resp(plano, 'aula-1-sequencia');
  if (!Array.isArray(valor) || !valor.some((l) => l && typeof l === 'object' && !Array.isArray(l))) {
    return null;
  }
  /* A LINHA DE UM OBJETIVO QUE NÃO EXISTE NÃO VIRA EXERCÍCIO (03/11/2026). Ela não é memória —
   * a coluna do objetivo é só de leitura, e quem a escreveu foi o sistema quando o objetivo
   * existia. Compô-la punha na `aula-01.md` um exercício cujo objetivo a mesma página não lista.
   * A regra é a do `motor/nucleo/sequencia.js`, a mesma da tela e do plano. */
  const objetivos = marcosEmTexto(resp(plano, 'marcos-por-aula'));
  /* E O EXERCÍCIO TEM DE SER O QUE A CURADORIA ACORDOU (03/11/2026) — a segunda porta do mesmo
   * defeito: a linha cujo conteúdo está fora do repertório entrou por uma medida marcada na
   * matriz do parâmetro, e medir não é curar. A regra é a de `motor/nucleo/sequencia.js`. */
  return sequenciaDoPlano.linhasDoRepertorio(
    sequenciaDoPlano.linhasVivas(valor, objetivos), resp(plano, 'repertorio'))
    .filter((l) => l && typeof l === 'object' && !Array.isArray(l));
}

/** O rótulo de uma linha no registro: «Solo — Plié». É por ele que o glossário aponta para cá. */
function rotuloDoExercicio(c) {
  return [c.bloco, c.exercicio].filter(Boolean).join(' — ') || 'exercício';
}

/** O objetivo da linha, sem o rótulo numérico que já vem escrito («1 — reconhecer…»). */
function objetivoDaSequencia(linha) {
  const v = String((linha && (linha['Objetivo específico'] || linha['Objetivo'] || linha['Marco'])) || '').trim();
  return v;
}

function derivarNotacao({ plano, contexto }) {
  const notacao = notacaoEscolhida(plano);
  if (!notacao) return null;

  const ciclo = String((contexto && contexto.ciclo) || 'NN');
  const alfabetoDoCiclo = moduloNotacao.paraNotacao(notacao);
  const linhas = sequenciaComoObjetos(plano);

  const saida = [];
  saida.push('---');
  saida.push('projeto: Formação em Balé Clássico');
  saida.push('frente: Documento de apoio');
  saida.push('ciclo: "' + ciclo + '"');
  saida.push('title: "Notação em ' + notacao + '"');
  saida.push('glossario-href: "glossario-' + slugDe(notacao) + '.html"');
  saida.push('---');
  saida.push('');
  saida.push('## Aviso de proveniência (leia antes de usar)');
  saida.push('');
  saida.push('Este documento **não é uma transcrição do sistema ' + notacao + '**. É um **código do');
  saida.push('ciclo**: um conjunto pequeno de sinais, **baseado em conceitos do sistema**, com o qual os');
  saida.push('exercícios deste ciclo podem ser lidos de volta sem depender da memória de quem deu a aula.');
  saida.push('');
  saida.push('> **Nota.** Um ciclo que registra exercícios em notação declara o código usado. Este');
  saida.push('> código é do ciclo — os sinais valem para os exercícios registrados aqui, e um sinal novo');
  saida.push('> exige uma linha nova no <a href="glossario-' + slugDe(notacao)
    + '.html" target="_blank" rel="noopener noreferrer">Glossário do código ' + notacao + '</a>.');
  saida.push('');

  // O CÓDIGO DECLARADO — em números, e não em promessa. Quem lê o registro sabe qual alfabeto o
  // compôs e qual versão dele: sem isto, o documento não diz de que código é, e a âncora de
  // proveniência guarda um texto sem saber o que o produziu.
  if (alfabetoDoCiclo) {
    const d = moduloNotacao.declaracao(alfabetoDoCiclo);
    saida.push('## O código declarado');
    saida.push('');
    saida.push('| Item | Valor |');
    saida.push('|:--|:--|');
    saida.push('| Código | `' + d.id + '` — ' + d.nome + ' |');
    saida.push('| Versão | ' + d.versao + ' |');
    saida.push('| Categorias | ' + d.categorias + ' |');
    saida.push('| Sinais | ' + d.sinais + ' |');
    saida.push('| Verbetes (exercícios) | ' + d.verbetes + ' |');
    saida.push('');
  } else {
    saida.push('> **[Preencher]** A notação declarada (' + notacao + ') não tem alfabeto publicado no');
    saida.push('> projeto. O registro sai com a lacuna declarada em cada linha, e não com sinais');
    saida.push('> inventados: um código que ninguém declarou não se pode ler de volta.');
    saida.push('');
  }

  saida.push('## Como ler o registro');
  saida.push('');
  saida.push('| Coluna | O que diz |');
  saida.push('|:--|:--|');
  saida.push('| **Compasso** | o compasso da frase, contado de 1 |');
  saida.push('| **Contagem** | as contagens do exercício dentro daquele compasso |');
  saida.push('| **Notação** | o bloco de notação, sempre entre colchetes |');
  saida.push('| **Descrição** | o que o corpo faz, na palavra de quem deu a aula |');
  saida.push('');
  saida.push('Todo bloco tem a forma [Categoria: conteúdo]. A categoria diz de que se está a falar; o');
  saida.push('conteúdo diz o **estado de partida**, o **movimento** e o **estado de chegada**. O bloco');
  saida.push('inteiro lê-se da esquerda para a direita, no tempo da música.');
  saida.push('');
  saida.push('## Exercícios da Aula 01');
  saida.push('');

  const composicoes = linhas
    ? moduloNotacao.comporTodas(linhas, alfabetoDoCiclo, dataDoEnvelope(plano), escolaDoEnvelope(plano, contexto))
    : null;

  if (!composicoes) {
    // A VIA ANTIGA, para o plano em prosa: uma linha por exercício, e a lacuna em todas.
    const sequencia = sequenciaEmLinhas(resp(plano, 'aula-1-sequencia')).filter((v) => !GABARITO_VAZADO.test(v));
    saida.push('| Exercício | Registro |');
    saida.push('|:--|:--|');
    if (sequencia.length) {
      for (const s of sequencia) saida.push('| ' + s + ' | [Preencher: notação do exercício] |');
    } else {
      saida.push('| [Preencher: exercício] | [Preencher: notação do exercício] |');
    }
    saida.push('');
  } else {
    composicoes.forEach((c, i) => {
      const musica = c.musica ? c.musica.tempos + ' tempos, ' + c.musica.compasso : null;
      saida.push('### ' + (i + 1) + '. ' + rotuloDoExercicio(c));
      saida.push('');
      const objetivo = objetivoDaSequencia(linhas[i]);
      // A POSIÇÃO EM PALAVRAS (28/10/2026). O cabeçalho do exercício passa a dizer em que posição
      // ele acontece — é a informação que a notação dava e a prosa não, e a primeira coisa que se
      // pergunta ao ler «extensão à frente, a ponta no chão». Vem do verbete, não é escrita aqui.
      const posicao = moduloNotacao.posicaoEmPalavras(alfabetoDoCiclo, c.posicao);
      // AS ORIENTAÇÕES DO CORPO, quando não são `en face`. É o outro eixo (28/10/2026): a
      // direção diz para onde a perna vai, a orientação diz como o corpo está voltado — e um
      // exercício de centro sem «en croisé» na legenda fica com metade da informação.
      const orientacoes = (c.orientacoes || []).filter(Boolean);
      const legenda = [musica ? musica : 'música ainda não declarada',
        posicao ? posicao.emPalavras : '',
        orientacoes.length ? orientacoes.join(' · ') : '',
        objetivo ? 'objetivo ' + objetivo : '']
        .filter(Boolean).join(' · ');
      saida.push('*' + legenda + '*');
      saida.push('');

      /* O QUE É DO EXERCÍCIO SAI DA CÉLULA (02/11/2026). A descrição do verbete tem duas
       * metades: a que se diz do exercício UMA vez (e que se repetia em cada célula) e a leitura
       * daquela célula. Medido na Aula 01 da batata: o parágrafo do `Battement fondu` saía
       * três vezes seguidas, palavra por palavra, e a parte que mudava — o «Lê-se» — ficava
       * escondida na segunda metade de uma célula partida.
       *
       * A REGRA É MEDIDA, NÃO DECLARADA: o texto fixo sobe para o cabeçalho do exercício
       * quando é IGUAL em todas as células com conteúdo. Se cada célula diz uma coisa
       * diferente (o `Battement tendu`: «extensão à frente…» / «retorno à 1ª posição»), não há
       * nada a subir — e a descrição fica onde está, que é onde ela é daquela célula.
       *
       * A LINHA ENTRA ANTES DO CABEÇALHO DA TABELA: uma linha entre o cabeçalho e o separador
       * parte a tabela em duas (é o mesmo modo de falha que a célula com quebra de linha tinha,
       * um nível acima). */
      const partes = c.estado === 'lacuna' ? [] : c.segmentos.map((sg) => partirDescricao(sg.descricao));
      const fixas = [...new Set(partes.map((x) => x.fixa))].filter(Boolean);
      const subir = fixas.length === 1 && c.segmentos.length > 1;
      if (subir) {
        saida.push('> **Descrição.** ' + fixas[0]);
        saida.push('');
      }

      saida.push('| Compasso | Contagem | Notação | Descrição |');
      /* AS LARGURAS SÃO AS DA LINHA DE SEPARAÇÃO (04/11/2026), e não uma preferência de estilo.
       * O pandoc calcula a largura relativa de cada coluna a partir da PROPORÇÃO DOS TRAÇOS desta
       * linha, e só quando ela passa dos 72 caracteres (o `--columns` por omissão, e o
       * `gerar-ciclo.sh` não o muda). Com todos os traços iguais — que era o caso — as quatro
       * colunas saíam a 28/28/21/21: o «1» do compasso e o «1–2» da contagem ficavam com a mesma
       * largura que o parágrafo da descrição, e era a descrição que encolhia. A pesquisadora:
       * «todas as colunas estão com o mesmo tamanho, espremendo os textos descritivos».
       *
       * A proporção daqui dá, medido no HTML gerado: **12 / 12 / 23 / 52**. As duas numéricas
       * descem a mais de metade do que tinham (28 → 12), e o espaço vai para a descrição
       * (21 → 52) e para a notação (21 → 23) — que precisa dele, porque `[Perna: ED 1ª ○ - ● 1ª]`
       * são 24 caracteres numa coluna.
       *
       * NÃO ponha traços mais curtos do que estes: abaixo de 72 caracteres de linha o pandoc
       * desiste das larguras e volta a distribuir por igual, que é o defeito. A prova
       * (`experimentos/provar-colunas-da-aula.js`) mede a linha e as percentagens. */
      saida.push('|:----------:|:----------:|:----------------------|:---------------------------------------------------|');

      if (c.estado === 'lacuna') {
        // A LACUNA NÃO ESCONDE O MOTIVO. Uma célula vazia diria «não sei»; a frase diz o que falta.
        saida.push('| — | — | [Preencher: notação do exercício] | ' + c.detalhe + ' |');
      } else {
        c.segmentos.forEach((sg, k) => {
          const p = partes[k];
          const descricao = subir
            ? (p.lida ? 'Lê-se: ' + p.lida : '—')
            : (p.fixa + (p.lida ? ' — Lê-se: ' + p.lida : '') || '—');
          saida.push('| ' + sg.compasso + ' | ' + sg.contagem + ' | `' + sg.bloco + '` | ' + descricao + ' |');
        });
        if (c.estado === 'parcial') {
          // O QUE O VERBETE NÃO EXPLICA FICA ESCRITO, e com `conferir` — sem colchetes de código,
          // que os tornariam um «sinal» do registro aos olhos de quem o lê de volta.
          saida.push('| ' + (c.compassoDoResto || '—') + ' | — | **conferir** | ' + c.detalhe + ' |');
        }
      }
      saida.push('');
    });

    const r = moduloNotacao.resumo(composicoes);
    if (r.contagem.lacuna || r.contagem.parcial) {
      saida.push('## O que ficou em lacuna');
      saida.push('');
      saida.push('| Estado | Linhas | Por quê |');
      saida.push('|:--|:--:|:--|');
      if (r.contagem.composto) {
        saida.push('| composto | ' + r.contagem.composto + ' | a música está declarada e o alfabeto tem verbete para ela |');
      }
      if (r.contagem.parcial) {
        saida.push('| parcial | ' + r.contagem.parcial + ' | o verbete cobre parte da música, e o resto fica declarado |');
      }
      const motivos = {
        'sem-musica': 'os tempos e o compasso ainda não estão declarados no plano',
        'sem-verbete': 'o exercício não tem verbete no alfabeto do ciclo',
        'musica-nao-coberta': 'o verbete existe, mas não para esta música',
        'sinal-desconhecido': 'o verbete usa um sinal que o alfabeto não declara',
        'verbete-inconsistente': 'o verbete declara uma cobertura que os seus segmentos não somam',
        'sem-alfabeto': 'a notação declarada não tem alfabeto publicado',
        'sem-exercicio': 'a linha não declara o exercício',
      };
      for (const [motivo, quantas] of Object.entries(r.porMotivo)) {
        saida.push('| ' + motivo + ' | ' + quantas + ' | ' + (motivos[motivo] || motivo) + ' |');
      }
      saida.push('');
      saida.push('Nenhuma destas linhas foi preenchida por aproximação: um sinal inventado tem');
      saida.push('aparência de fato, e não se distingue do certo por leitura. A lacuna, sim.');
      saida.push('');
    }
  }

  saida.push('> **Sobre os símbolos:** os sinais deste código são digitáveis e legíveis numa folha');
  saida.push('> impressa. Nenhum deles substitui a escrita completa do sistema — eles **apontam** para a');
  saida.push('> frase, e a frase é que é a aula.');
  return saida.join('\n') + '\n';
}

/** A âncora de um verbete, estável e única — é para aqui que o índice de símbolos aponta. */
function ancoraDe(simbolo, nome, usadas) {
  let base = slugDe(nome) || slugDe(simbolo) || 'simbolo';
  let ancora = base;
  let n = 2;
  while (usadas.has(ancora)) { ancora = base + '-' + n; n += 1; }
  usadas.add(ancora);
  return ancora;
}

/** «1, 2 e 5» — a forma portuguesa de enumerar, e não «1,2,5». */
function enumerar(numeros) {
  const lista = numeros.slice().sort((a, b) => a - b);
  if (!lista.length) return '';
  if (lista.length === 1) return String(lista[0]);
  return lista.slice(0, -1).join(', ') + ' e ' + lista[lista.length - 1];
}

function derivarGlossario({ plano, contexto }) {
  const notacao = notacaoEscolhida(plano);
  if (!notacao) return null;

  const ciclo = String((contexto && contexto.ciclo) || 'NN');
  const alfabeto = moduloNotacao.paraNotacao(notacao);
  const linhas = sequenciaComoObjetos(plano);
  const composicoes = linhas && alfabeto
    ? moduloNotacao.comporTodas(linhas, alfabeto, dataDoEnvelope(plano), escolaDoEnvelope(plano, contexto))
    : null;
  const usados = composicoes ? moduloNotacao.sinaisUsados(composicoes, alfabeto) : new Map();

  // AS TRÊS CONVENÇÕES APARECEM SEMPRE: `[`, `]` e `:` delimitam todos os blocos, por definição.
  if (alfabeto) {
    for (const chave of ['abre', 'fecha', 'separa']) {
      const c = alfabeto.convencoes[chave];
      if (c && !usados.has(c.sinal)) usados.set(c.sinal, []);
    }
  }

  const saida = [];
  saida.push('---');
  saida.push('projeto: Formação em Balé Clássico');
  saida.push('frente: Documento de apoio');
  saida.push('ciclo: "' + ciclo + '"');
  // SEM SUBTÍTULO (28/10/2026). «Todo símbolo, termo e categoria que aparece no registro da
  // Aula 01» é o que o próprio corpo já diz, três linhas abaixo: o parágrafo do alfabeto declara
  // as categorias, os sinais e os verbetes, e a Nota declara o par glossário ↔ registro. O
  // subtítulo repetia-o em corpo menor, debaixo do título.
  saida.push('title: "Glossário do código ' + notacao + ' do ciclo"');
  saida.push('---');
  saida.push('');
  saida.push('> **Aviso de proveniência (Regra 8).** Este glossário explica um **código do ciclo**, não o');
  saida.push('> sistema ' + notacao + '. Cada verbete declara a sua **origem**: *sistema* — quando o sinal');
  saida.push('> corresponde a um conceito do sistema de notação, e pode ser conferido na fonte;');
  saida.push('> *convenção do ciclo* — quando foi escolhido para este código, e só vale aqui.');
  saida.push('');
  saida.push('> **Nota.** O glossário e o registro são um par: um símbolo só existe no registro');
  saida.push('> se tiver verbete aqui, e todo verbete aqui aponta para onde aparece.');
  saida.push('');

  // O CAMINHO DE VOLTA PARA QUEM PRECISA DE UM SINAL NOVO — dito no documento, não só no código.
  const declaracaoDoCodigo = alfabeto ? moduloNotacao.declaracao(alfabeto) : null;
  if (declaracaoDoCodigo) {
    saida.push('O alfabeto deste código é `' + declaracaoDoCodigo.id + '` versão ' + declaracaoDoCodigo.versao
      + ' — ' + declaracaoDoCodigo.categorias + ' categorias, ' + declaracaoDoCodigo.sinais + ' sinais e '
      + declaracaoDoCodigo.verbetes + ' verbetes de exercício. Um exercício novo entra no registro');
    saida.push('depois de o seu verbete existir; um sinal novo, depois de ganhar linha neste glossário.');
    saida.push('');
  }

  if (!alfabeto) {
    // SEM ALFABETO NÃO HÁ O QUE GLOSSARIAR. Sai o mesmo documento de antes — três convenções e a
    // lacuna —, e não um glossário que finge explicar sinais que ninguém declarou.
    saida.push('## Convenções de escrita do ciclo');
    saida.push('');
    for (const [s, nome, significado] of [['[', 'abre bloco', 'início de um bloco de notação.'],
      [']', 'fecha bloco', 'fim de um bloco de notação.'],
      [':', 'dois-pontos', 'separa a categoria do conteúdo no bloco.']]) {
      saida.push('### `' + s + '` — ' + nome + ' {#' + ancoraDe(s, nome, new Set()) + '}');
      saida.push('');
      saida.push('- **Significado:** ' + significado);
      saida.push('- **Origem:** convenção do ciclo.');
      saida.push('');
    }
    saida.push('> **[Preencher: verbetes dos sinais do ciclo]** — cada exercício registrado na');
    saida.push('> [Notação em ' + notacao + '](notacao.html) que introduza um sinal novo ganha aqui o seu verbete.');
    return saida.join('\n') + '\n';
  }

  const conhecidos = moduloNotacao.sinaisDo(alfabeto);
  const ancoras = new Set();

  /** «Onde aparece»: os números das linhas do registro que usam este sinal. */
  const ondeAparece = (sinal) => {
    if (sinal === alfabeto.convencoes.abre.sinal || sinal === alfabeto.convencoes.fecha.sinal) {
      return 'em todos os blocos de notação';
    }
    if (sinal === alfabeto.convencoes.separa.sinal) return 'em todos os blocos de notação';
    const numeros = usados.get(sinal) || [];
    return numeros.length ? 'exercício ' + enumerar(numeros) : '—';
  };

  // 1. O ÍNDICE — a primeira coluna é o símbolo, e é dela que o validador lê o par.
  saida.push('## Índice de símbolos');
  saida.push('');
  saida.push('| Símbolo | Nome | Onde aparece no registro |');
  saida.push('|:---:|:---|:---|');
  for (const chave of ['abre', 'fecha', 'separa']) {
    const c = alfabeto.convencoes[chave];
    saida.push('| `' + c.sinal + '` | ' + c.nome + ' | ' + ondeAparece(c.sinal) + ' |');
  }
  for (const grupo of alfabeto.grupos) {
    for (const [sinal, item] of Object.entries(grupo.itens)) {
      if (!usados.has(sinal)) continue;
      saida.push('| `' + sinal + '` | ' + item.nome + ' | ' + ondeAparece(sinal) + ' |');
    }
  }
  saida.push('');

  // 2. AS CONVENÇÕES.
  saida.push('## Convenções de escrita do ciclo');
  saida.push('');
  for (const chave of ['abre', 'fecha', 'separa']) {
    const c = alfabeto.convencoes[chave];
    saida.push('### `' + c.sinal + '` — ' + c.nome + ' {#' + ancoraDe(c.sinal, c.nome, ancoras) + '}');
    saida.push('');
    saida.push('- **Significado:** ' + c.significado);
    saida.push('- **Origem:** convenção do ciclo.');
    saida.push('- **Onde aparece:** ' + ondeAparece(c.sinal) + '.');
    saida.push('');
  }

  // 3. OS GRUPOS, na ordem declarada no alfabeto — e só os sinais que o registro usa.
  for (const grupo of alfabeto.grupos) {
    const presentes = Object.entries(grupo.itens).filter(([sinal]) => usados.has(sinal));
    if (!presentes.length) continue;
    saida.push('## ' + grupo.titulo);
    saida.push('');
    for (const [sinal, item] of presentes) {
      saida.push('### `' + sinal + '` — ' + item.nome + ' {#' + ancoraDe(sinal, item.nome, ancoras) + '}');
      saida.push('');
      saida.push('- **Significado:** ' + item.significado);
      saida.push('- **Origem:** ' + item.origem + '.');
      saida.push('- **Onde aparece:** ' + ondeAparece(sinal) + '.');
      saida.push('');
    }
  }

  // 4. OS VERBETES — o mapa de «exercício → composto ou lacuna», que é o que fecha o par.
  if (composicoes) {
    saida.push('## Verbetes por exercício');
    saida.push('');
    saida.push('| N | Exercício | Blocos | Estado |');
    saida.push('|:--:|:--|:--:|:--|');
    composicoes.forEach((c, i) => {
      const quantos = (c.segmentos || []).filter((s) => s.bloco).length;
      saida.push('| ' + (i + 1) + ' | ' + rotuloDoExercicio(c) + ' | ' + quantos + ' | '
        + (c.estado === 'lacuna' ? 'lacuna declarada' : c.estado) + ' |');
    });
    saida.push('');
  }

  // 5. OS SINAIS DECLARADOS E AINDA NÃO USADOS. Não é ruído: é o que o professor precisa saber
  //    para decidir se o alfabeto está a mais ou se o plano é que ainda não chegou lá.
  const naoUsados = [];
  for (const grupo of alfabeto.grupos) {
    for (const [sinal, item] of Object.entries(grupo.itens)) {
      if (!usados.has(sinal)) naoUsados.push('`' + sinal + '` (' + item.nome + ')');
    }
  }
  if (naoUsados.length) {
    saida.push('> **Declarados e não usados.** O alfabeto tem sinais que este registro não usa: '
      + naoUsados.join(', ') + '. Eles só entram no glossário quando um exercício os usar — um');
    saida.push('> glossário maior do que o registro é um glossário a mais.');
    saida.push('');
  }
  return saida.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// 5. Captura da Aula 01 (+ a declaração `porVariante` para o schema)
// ---------------------------------------------------------------------------

/**
 * As dimensões e os itens por dimensão, lidos do envelope do PO na forma canónica da tela:
 * `dimensoes-de-observacao` é uma LISTA (multipla), e `itens-por-dimensao` é uma lista de
 * `{ sujeito: <dimensão>, itens: "item\nitem" }` (repetirPor). O par é normalizado para
 * `[ { dimensao, itens: [...] } ]`, tolerando as duas formas.
 */
function dimensoesEItens(po, plano) {
  const dimensoes = emLista(resp(po, 'dimensoes-de-observacao')).filter((v) => !GABARITO_VAZADO.test(v));
  const cru = resp(po, 'itens-por-dimensao');
  const porDimensao = new Map();

  // Forma canónica (repetirPor): uma lista de `{sujeito: <dimensão>, itens: <texto>}`.
  for (const r of Array.isArray(cru) ? cru : []) {
    if (!r || typeof r !== 'object') continue;
    const dim = String(r.sujeito || r.dimensao || '').trim();
    // O `;` SEPARA ITENS (01/11/2026). Era `emLista`, que corta só por linha — e a resposta da
    // `batata` escreve os dois itens de cada dimensão numa linha só («a; b»). A folha saía com
    // 4 colunas para 8 itens, e cada coluna pedia UM nível para DOIS critérios. A unidade de
    // tudo o que se marca é esta linha.
    const itens = itensDaDimensao(r.itens).filter((v) => !GABARITO_VAZADO.test(v));
    if (dim) porDimensao.set(dim, itens);
  }

  // Forma antiga / texto corrido: uma linha "Dimensão — item" (ou com `:`/`|`) por
  // dimensão. O envelope guardado antes da restauração do `repetirPor` fica assim.
  if (porDimensao.size === 0 && typeof cru === 'string') {
    for (const linha of String(cru).split(/\n+/)) {
      const m = /^(.+?)\s*[—–:|]\s*(.+)$/.exec(linha.trim());
      if (!m) continue;
      const dim = m[1].trim();
      const itens = m[2].split(/[,;·]/).map((s) => s.trim()).filter(Boolean);
      if (dim && !porDimensao.has(dim)) porDimensao.set(dim, itens.length ? itens : [m[2].trim()]);
    }
  }

  /* NADA SE PERDE EM SILÊNCIO (01/11/2026).
   *
   * Era `dimensoes.map(...)` — só as dimensões DECLARADAS em `dimensoes-de-observacao`, e as
   * outras eram descartadas com os itens dentro. Medido:
   *   · sem `dimensoes-de-observacao` → `[]`, e os 4 blocos da folha desapareciam;
   *   · com UMA dimensão declarada → só essa, e as outras três desapareciam.
   * E nada falhava: a §5 da aula saía `[Preencher]`, a folha saía sem os blocos de critério, e o
   * validador aprovava — porque uma folha com menos colunas continua a ser uma folha válida. É o
   * silêncio mais caro que este ficheiro podia ter: o professor perde o que escreveu e o sistema
   * diz que está tudo bem.
   *
   * A ORDEM: primeiro as dimensões DECLARADAS (é a ordem que o professor escolheu, e a que dá a
   * numeração dos blocos), depois as que só têm itens — na ordem em que os itens aparecem. Uma
   * dimensão sem itens fica com a lista vazia, e a folha declara a lacuna em vez de a esconder.
   *
   * O `dimensoes-de-observacao` é DERIVADO do plano quando o professor o abre; se ele não o
   * abriu, ou se o plano não marca blocos, o campo vem vazio — e é exactamente aí que os itens
   * ficavam sem casa. A união é o que faz o par dimensão × item sobreviver à falta do primeiro. */
  const vistas = new Set(dimensoes);
  const todas = dimensoes.slice();
  for (const d of porDimensao.keys()) {
    if (!vistas.has(d)) { vistas.add(d); todas.push(d); }
  }
  /* OS OBJETIVOS DO PLANO SÃO CRITÉRIOS (06/11/2026) — o híbrido da §5.15. Entram à frente do
   * que o professor escreveu, e não se duplicam. Sem plano (uma bancada, uma chamada antiga), a
   * lista é a que o PO tem: a função não inventa e não parte. */
  return itensComObjetivos(todas.map((d) => ({ dimensao: d, itens: porDimensao.get(d) || [] })), plano);
}

/**
 * O TIPO da coluna de um CRITÉRIO na folha de captura. Um só lugar, para o tipo não voltar a ser
 * presumido em dois: o critério mede-se pela RÉGUA DA TURMA (`rubrica` — os níveis que a escola
 * declara nos bastidores e o professor adota no plano). O valor da folha é o RÓTULO do nível; a
 * régua chega ao formulário pelo `plano-XX.json` do pacote (`reguaDaRubrica`), com a queda nos
 * quatro níveis padrão quando o plano não a declara.
 */
const TIPO_DO_CRITERIO = 'rubrica';

/**
 * A declaração `porVariante` da captura: um bloco por dimensão (as colunas são os itens) e,
 * por fim, o bloco fixo da linha de base revisitada (P-10). Os TÍTULOS e os RÓTULOS de coluna
 * são os MESMOS que o Markdown da folha emite — é o que o `validar-captura-ciclo.js` confere.
 *
 * O TIPO de cada coluna é declarado, e não presumido: o ITEM DE UMA DIMENSÃO é um CRITÉRIO — a
 * folha rotula essas linhas «Critério» — e o critério se mede pela RÉGUA DA TURMA (14/10/2026:
 * `rubrica`), não pelas cinco marcas. A LINHA DE BASE é a exceção, e por isso tem o `tipo`
 * escrito à mão: «observado na aula» responde «aconteceu?», e não «em que nível ficou?».
 */
function declaracaoDeCaptura({ po, plano, escola }) {
  const dims = dimensoesEItens(po, plano);
  const blocos = {};
  dims.forEach((d, i) => {
    const titulo = 'Bloco ' + (i + 1) + ' — ' + d.dimensao;
    const colunas = {};
    for (const item of d.itens) {
      const rotulo = rotuloDoItem(item);
      colunas[rotulo] = { chave: slugDe(rotulo), tipo: TIPO_DO_CRITERIO };
    }
    blocos[titulo] = { chave: slugDe(d.dimensao), rotulo: d.dimensao, grao: 'aluna', colunas };
  });
  /* O TÍTULO É O DA FOLHA, E NÃO O DA NOTA (01/11/2026). Era «Linha de base revisitada (P-10)»,
   * e a folha imprime «## Linha de base revisitada» (sem a nota). O validador casa a coluna pelo
   * TÍTULO da tabela: a primeira declaração de qualquer variante NOVA saía com este título e caía
   * em «coluna da folha não declarada no schema» — o pacote não fechava. Nunca se viu porque as
   * variantes existentes já tinham a entrada, e o `mesclarDeclaracao` conservava o título antigo.
   * A referência à P-10 vive no comentário e no documento, não num cabeçalho que outro ficheiro
   * tem de casar. */
  blocos['Linha de base revisitada'] = {
    chave: 'linha_de_base',
    rotulo: 'Linha de base',
    grao: 'aluna',
    colunas: { 'Observado na aula': { chave: 'observado_na_aula', tipo: 'marca' } },
  };
  return { escola: escola || 'Escola', blocos };
}

/**
 * A DECLARAÇÃO ATUALIZADA PELA DO PO, SEM RENOMEAR O QUE JÁ EXISTIA (20/10/2026).
 *
 * O PROBLEMA. A declaração `porVariante` era gravada UMA VEZ (`if (porVariante[slug]) → já
 * declarada`). Como ela mora no SCHEMA de captura — que o expurgo de uma escola PRESERVA de
 * propósito, por ser o modelo de que nasce escola nova —, a entrada de uma variante sobrevivia à
 * escola e à ronda de teste, e voltava a contradizer o PO seguinte. Foi o que parou a geração da
 * `batata` às 23:2x de 20/10/2026: a folha tinha os critérios elicitados e o schema ainda tinha
 * os rótulos da ronda anterior («Teste tec solo»), e o validador recusou uma coluna por bloco.
 *
 * O QUE NÃO SE PODE PERDER. A `chave` de uma coluna é o que o lançamento usa para guardar a
 * marca. Renomeá-la reescreveria o passado — é a mesma regra do resto do sistema: o registo
 * acrescenta, não se reescreve. Por isso a actualização é um MERGE **por rótulo**: o que já
 * estava declarado conserva `chave` e `tipo`; o que é novo ganha a chave derivada do rótulo.
 *
 * O QUE SAI. Bloco ou coluna que o PO já não produz sai da declaração — senão o ficheiro cresce
 * com fantasmas e um rótulo reutilizado mais tarde herdaria a chave de outro contexto. As chaves
 * que deixaram de existir ficam no HISTÓRICO do git e nos pacotes já publicados (`captura-*.json`),
 * que não se reescrevem.
 */
function mesclarDeclaracao(anterior, derivada) {
  if (!anterior || !anterior.blocos) return derivada;
  /* A IDENTIDADE DE UM BLOCO É A CHAVE, NÃO O TÍTULO (01/11/2026).
   *
   * Era `anterior.blocos[titulo]`, e o título é um RÓTULO — o que ele tem de estável é a chave,
   * que é debaixo dela que a marca se guarda. Medido ao tornar o guia do PO derivado: o bloco da
   * linha de base chama-se «Linha de base revisitada (P-10)» na derivação e «Linha de base
   * revisitada» na declaração anterior. Casando por título, o bloco entrava como NOVO, com o
   * título da derivação — e a folha de captura, que imprime o título curto, deixava de o
   * encontrar: «coluna da folha não declarada no schema», o pacote não fechava. Um bloco não
   * muda de identidade porque lhe mudou o rótulo.
   *
   * O título ANTIGO vence quando há chave dos dois lados: conservar o rótulo é o que impede a
   * folha publicada de mudar de cabeçalho sem ninguém o ter pedido. */
  const porChave = new Map();
  for (const [titulo, bloco] of Object.entries(anterior.blocos || {})) {
    if (bloco && bloco.chave) porChave.set(bloco.chave, { titulo, bloco });
  }
  const blocos = {};
  for (const [titulo, bloco] of Object.entries(derivada.blocos || {})) {
    const achado = bloco.chave ? porChave.get(bloco.chave) : null;
    const velho = achado ? achado.bloco : anterior.blocos[titulo];
    const tituloFinal = achado ? achado.titulo : titulo;
    if (!velho) { blocos[tituloFinal] = bloco; continue; }
    const colunas = {};
    for (const [rotulo, coluna] of Object.entries(bloco.colunas || {})) {
      const jaEra = velho.colunas && velho.colunas[rotulo];
      colunas[rotulo] = jaEra ? { chave: jaEra.chave, tipo: jaEra.tipo } : coluna;
    }
    blocos[tituloFinal] = {
      // A chave e o rótulo do BLOCO também se conservam: é debaixo dela que a marca é guardada.
      chave: velho.chave || bloco.chave,
      rotulo: velho.rotulo || bloco.rotulo,
      grao: velho.grao || bloco.grao,
      colunas: colunas,
    };
  }
  return { escola: derivada.escola || anterior.escola, blocos: blocos };
}

/**
 * A declaração precisa de ser REGRAVADA? Um PO regravado sem mudança não deve gerar commit —
 * o «Guardar» do PO é um clique que pode repetir-se, e cada gravação custa um commit no
 * repositório. A comparação é canónica (chaves ordenadas), para a ordem não contar como mudança.
 */
function precisaGravar(anterior, nova) {
  const canonico = (o) => {
    const ordenar = (v) => {
      if (Array.isArray(v)) return v.map(ordenar);
      if (!v || typeof v !== 'object') return v;
      const saida = {};
      for (const k of Object.keys(v).sort()) saida[k] = ordenar(v[k]);
      return saida;
    };
    return JSON.stringify(ordenar(o === undefined ? null : o));
  };
  return canonico(anterior) !== canonico(nova);
}

/** A folha de captura da Aula 01 — para impressão — derivada do PO. */
function derivarCaptura({ po, plano, contexto }) {
  const sujeitos = emLista(resp(po, 'sujeitos')).filter((v) => !GABARITO_VAZADO.test(v));
  /* AS FLUTUANTES E O PONTO DE PARTIDA SAÍRAM DO PO (06/11/2026) — e a folha não fica mais pobre:
   * o elenco é o da linha de base da turma (todo ele, porque o professor dá aula à turma inteira),
   * e o ponto de partida de cada aluna é o recorte que ela já declarou no passo 4. O que a folha
   * imprime é a LISTA de quem se observa; o registo do corpo fica onde está. */
  const dims = dimensoesEItens(po, plano);
  const ciclo = String((contexto && contexto.ciclo) || 'NN');
  const escola = nomeDaEscola(contexto);

  const saida = [];
  saida.push('---');
  saida.push('projeto: Formação em Balé Clássico');
  saida.push('frente: Captura');
  saida.push('ciclo: "' + ciclo + '"');
  saida.push('aula: "01"');
  saida.push('escola: "' + escola + '"');
  saida.push('title: "Captura em aula — Aula 01 — para impressão"');
  saida.push('subtitle: "Folha de marcação para uso durante a aula"');
  saida.push('---');
  saida.push('');
  saida.push('> **Durante a aula, marque; depois, escreva** — as marcas são âncoras de memória, não');
  saida.push('> classificação. Os CRITÉRIOS medem-se pela **régua da turma** (anote o nível —');
  saida.push('> ex.: satisfatório · razoável · em desenvolvimento · não se aplica); o que só se OBSERVA');
  saida.push('> (a linha de base) marca-se com: ✓ aconteceu · ~ parcial · X não aconteceu · ? não vi · vazio = não observei.');
  saida.push('');

  const presentes = sujeitos.length ? sujeitos.join(' ☐ ') : '☐ [Preencher: alunas]';
  saida.push('**Data:** `___/___/____` · **Presentes:** ☐ ' + presentes +
    ' · **Início:** `__:__` · **Fim:** `__:__` · **Duração efetiva:** `___ min`');
  saida.push('');

  saida.push('## Condições de contorno');
  saida.push('');
  saida.push('**Plano seguido?** ☐ sim ☐ parcial ☐ não · **Ânimo** 1 2 3 4 5 · **Interesse** 1 2 3 4 5 · **Harmonia da turma** 1 2 3 4 5');
  saida.push('');
  saida.push('**O que mudou em relação ao plano:** `______________________________________________________`');
  saida.push('');

  // A tabela de um bloco de dimensão. DUAS orientações, decididas pela proporção:
  //   · critérios ≤ alunas → critérios nas COLUNAS (uma linha por aluna), como o Diaghilev;
  //   · critérios > alunas → TRANSPÕE: critérios nas LINHAS (quebram na página), alunas nas colunas.
  // O cabeçalho usa o RÓTULO CURTO (o título do critério, sem a descrição) — a descrição inteira
  // como cabeçalho de coluna estoura a margem do PDF.
  const tabelaDeDimensao = (itens) => {
    const celulas = (itens.length ? itens : ['[Preencher: item]']).map(rotuloDoItem);
    const linhasDeAluna = sujeitos.length ? sujeitos : ['[Preencher: aluna]'];
    const linhas = [];
    if (celulas.length > linhasDeAluna.length) {
      linhas.push('| Critério | ' + linhasDeAluna.join(' | ') + ' |');
      linhas.push('|:--|' + linhasDeAluna.map(() => ':--:|').join('') + '');
      for (const c of celulas) linhas.push('| ' + c + ' | ' + linhasDeAluna.map(() => ' ').join(' | ') + ' |');
    } else {
      linhas.push('| Aluna(o) | ' + celulas.join(' | ') + ' |');
      linhas.push('|:--|' + celulas.map(() => ':--:|').join('') + '');
      for (const s of linhasDeAluna) linhas.push('| ' + s + ' | ' + celulas.map(() => ' ').join(' | ') + ' |');
    }
    return linhas;
  };

  dims.forEach((d, i) => {
    saida.push('## Bloco ' + (i + 1) + ' — ' + d.dimensao);
    saida.push('');
    for (const linha of tabelaDeDimensao(d.itens)) saida.push(linha);
    saida.push('');
    /* A DESCRIÇÃO DO CRITÉRIO NÃO CABE NO CABEÇALHO — e NÃO SE PERDE (06/11/2026).
     *
     * O cabeçalho da coluna é o rótulo curto («Alinhamento do pé: o arco não cede» → «Alinhamento
     * do pé»), porque a frase inteira estoura a margem do PDF. Mas cortá-la em silêncio deixava a
     * folha impressa sem a metade que o professor escreveu depois dos dois pontos — e quem mede a
     * folha não tem como saber que existia mais. A legenda imprime-a por extenso, na ordem das
     * colunas, e só quando há alguma: numa folha de rótulos secos não aparece nada.
     *
     * Ela é PROSA, não tabela — o `validar-captura-ciclo.js` lê as linhas `|` e os `###`, e uma
     * frase entre eles não entra em nenhum dos dois. */
    const comDescricao = (d.itens || []).filter((item) => String(item).indexOf(':') !== -1);
    if (comDescricao.length) {
      saida.push('*O que cada critério pede:* ' + comDescricao.map((item) => {
        const texto = String(item);
        const i2 = texto.indexOf(':');
        return '**' + rotuloDoItem(texto) + '** — ' + texto.slice(i2 + 1).trim();
      }).join(' · '));
      saida.push('');
    }
  });

  /* A «LINHA DE BASE REVISITADA» NÃO SE REESCREVE (06/11/2026). Ela imprimia, por aluna, o que o
   * PO declarava que precisava desenvolver — o campo que deixou de existir. O registo do corpo
   * vive na linha de base do Corpo, e o PO não o duplica: aqui fica a COLUNA da aula (o que se
   * observou), com o nome de quem se observa, e a indicação de onde está o resto. Uma tabela em
   * branco por aluna seria a folha a pedir que se redigitasse o que já está escrito. */
  saida.push('## Linha de base revisitada');
  saida.push('');
  saida.push('> O ponto de partida de cada aluna está na **linha de base do Corpo** (a leitura do');
  saida.push('> passo 3 e o recorte do passo 4). Não se reescreve aqui: aqui anota-se o que a aula');
  saida.push('> mostrou.');
  saida.push('');
  for (const aluna of (sujeitos.length ? sujeitos : ['[Preencher: aluna]'])) {
    saida.push('### ' + String(aluna));
    saida.push('');
    /* A COLUNA É A QUE O SCHEMA DECLARA (`Observado na aula`): mudar-lhe o nome aqui reprovaria a
     * folha no `validar-captura-ciclo.js` — e a folha é CONFIG, não prosa. O que mudou foi a coluna
     * da esquerda, que deixou de pedir o que o PO já não pergunta. */
    saida.push('| O que a aula mostrou | Observado na aula |');
    saida.push('|:--|:--:|');
    saida.push('| | |');
    saida.push('');
  }

  saida.push('**Notas soltas** — *o que surpreendeu? o que foi ajustado em tempo real? uma frase basta.*');
  saida.push('');
  saida.push('```');
  saida.push('______________________________________________________');
  saida.push('______________________________________________________');
  saida.push('```');
  saida.push('');
  saida.push('**Fecho da aula (preencher no fim):** **Estrutura** ' +
    BLOCOS_DA_AULA.map((b) => '☐ ' + b.toLowerCase()).join(' ') +
    ' · **Duração executada** `_____` min');
  saida.push('');
  saida.push('**Abandonado?** `__________________` · **Materiais** ☐ fotos ☐ vídeo ☐ áudio ☐ comentário: `______________`');
  return saida.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// 6. Harmonização (P-21 — o varrimento de juízo de valor)
// ---------------------------------------------------------------------------

// Os termos que a harmonização procura — juízo/essência sobre pessoas, não fato.
const TERMOS_DE_JUIZO = [
  'desatento', 'desatenta', 'torta', 'torto', 'feio', 'feia', 'fraco', 'fraca',
  'preguiçoso', 'preguiçosa', 'talentoso', 'talentosa', 'ruim', 'mau', 'má',
  'não sabe', 'não consegue', 'não sente', 'não controla', 'exagera', 'travada', 'travado',
  'insuficiente', 'incapaz', 'sem jeito', 'jeito nenhum', 'postura ruim',
];

/** Um valor do envelope como TEXTO para o varrimento: achata o que for estruturado
 *  (a matriz por marco, a grelha) — sem isso o varrimento leria «[object Object]». */
function textoDeValor(valor) {
  if (valor === null || valor === undefined) return '';
  if (Array.isArray(valor)) return valor.map(textoDeValor).join(' ');
  if (typeof valor === 'object') return Object.values(valor).map(textoDeValor).join(' ');
  return String(valor);
}

/** O varrimento: acha termos de juízo na prosa do plano e do PO. Devolve [{termo, onde, trecho}]. */
function varrerJuizo(plano, po) {
  const achados = [];
  const campos = [
    ['plano · objetivo', resp(plano, 'objetivo-geral')],
    ['plano · marcos', resp(plano, 'marcos-por-aula')],
    ['plano · estrutura', resp(plano, 'estrutura-de-cada-aula')],
    ['plano · aula-1', resp(plano, 'aula-1-sequencia')],
    ['PO · fenômeno', resp(po, 'fenomeno')],
    ['PO · sujeitos', resp(po, 'sujeitos')],
    ['PO · restrições', resp(po, 'restricoes')],
  ];
  /* O varrimento continua a olhar o `restricoes` — é prosa declarada pelo professor e pode conter
   * juízo («ela é frágil no tornozelo»). O que ele deixou de olhar é `flutuantes` e o ponto de
   * partida, que já não são nós do PO: os campos ausentes devolvem `undefined`, e um campo a mais
   * no varrimento não faz mal nenhum — o que faz mal é um campo a menos numa regra de juízo. */
  for (const [onde, valor] of campos) {
    const texto = textoDeValor(valor);
    for (const termo of TERMOS_DE_JUIZO) {
      const idx = texto.toLowerCase().indexOf(termo);
      if (idx === -1) continue;
      const trecho = texto.slice(Math.max(0, idx - 20), idx + termo.length + 30).replace(/\s+/g, ' ').trim();
      achados.push({ termo, onde, trecho });
    }
  }
  return achados;
}

function derivarHarmonizacao({ plano, po, contexto }) {
  const ciclo = String((contexto && contexto.ciclo) || 'NN');
  const achados = varrerJuizo(plano, po);

  const saida = [];
  /*
   * O FRONT-MATTER TEM DE ABRIR COM `---` (22/10/2026). Ele não abria, e o resultado saiu no
   * ar: sem os delimitadores o pandoc não lê metadado nenhum, o `$title$` do template fica
   * vazio, a página é publicada com um `<h1></h1>` EM BRANCO — e as duas linhas de YAML
   * vazam para o corpo do documento como um parágrafo literal:
   *
   *     title: “Harmonização de linguagem” subtitle: “O varrimento de juízo de valor…”
   *
   * O professor via a fonte crua no topo da página, e o título de verdade aparecia mais
   * abaixo, empurrado pelo cabeçalho vazio e pela ficha. Era o único dos documentos
   * derivados que não abria o bloco: os outros cinco (aula, referências, notação, glossário,
   * captura) sempre abriram. É a forma EXACTA do defeito que a cópia única persegue — o mesmo
   * gesto em cinco lugares, e um deles diferente —, e por isso o `title:` se escreve aqui
   * como nos outros, com o bloco à volta.
   *
   * O `title:` é o RÓTULO do menu (a `rotulo()` do gerador lê o front-matter); sem ele o item
   * sairia vazio na navegação — e é também o título do cabeçalho da página, pelo `$title$`
   * do template. Um `title:`, dois destinos: o menu e o `<h1>`.
   */
  saida.push('---');
  saida.push('projeto: Formação em Balé Clássico');
  saida.push('frente: Documento de apoio');
  saida.push('ciclo: "' + ciclo + '"');
  saida.push('title: "Harmonização de linguagem"');
  saida.push('subtitle: "O varrimento de juízo de valor — a proposta, não o filtro"');
  saida.push('---');
  saida.push('');
  /*
   * SEM `# …` NO CORPO. Este documento era o único do pacote com DOIS `<h1>` — o do
   * cabeçalho (vazio, por causa do front-matter sem delimitadores) e este, comprido, com
   * ciclo e escola. Era por isso que o título «aparecia mais abaixo» do que na anamnese: o
   * cabeçalho existia, mas em branco, e a única linha de título de verdade estava no corpo,
   * depois da ficha. Os outros cinco derivados nunca escrevem `#` no corpo — o título vem
   * do front-matter e o cabeçalho é o lugar dele. Aqui passa a ser igual: o `##` abaixo é o
   * primeiro nível do documento, e ciclo e escola já estão na ficha.
   */
  saida.push('> Esta tabela é **visível ao professor**. Se ele discordar de alguma harmonização, ele');
  saida.push('> reescreve a coluna "Publicado" com as próprias palavras. O harmonizador é uma');
  saida.push('> **proposta**, não um filtro.');
  saida.push('');
  saida.push('## Varrimento automático');
  saida.push('');
  saida.push('| Onde | Formulação evitada (juízo / essência) | Publicado (fato, sem juízo) |');
  saida.push('|:--|:--|:--|');
  if (achados.length) {
    for (const a of achados) {
      saida.push('| ' + a.onde + ' | “' + a.trecho + '” | [Preencher: a formulação harmonizada] |');
    }
  } else {
    saida.push('| — | nenhum termo de juízo detectado no varrimento automático | — |');
  }
  saida.push('');
  saida.push('## Nota sobre o vocabulário');
  saida.push('');
  saida.push('- **Não se avalia o bailarino.** O que entra no registro é o que **aconteceu**: "não executou');
  saida.push('  a série de pés", não "é frágil".');
  saida.push('- **"Precisa desenvolver"** é a forma do projeto para o que falta — nunca "insuficiente",');
  saida.push('  "fraco" ou "ruim".');
  saida.push('- Nenhum adjetivo essencializante sobre pessoas: nem "preguiçoso", nem "talentoso".');
  saida.push('');
  saida.push('## Revisão do professor');
  saida.push('');
  saida.push('*(espaço para o professor discordar de alguma linha e reescrever com as próprias palavras)*');
  saida.push('');
  saida.push('| Linha | Sua formulação |');
  saida.push('|:--|:--|');
  saida.push('| | |');
  saida.push('| | |');
  return saida.join('\n') + '\n';
}

module.exports = {
  slugDe,
  nomeDaEscola,
  derivarAula01,
  derivarDados,
  derivarReferencias,
  derivarNotacao,
  derivarGlossario,
  derivarCaptura,
  declaracaoDeCaptura,
  mesclarDeclaracao,
  precisaGravar,
  derivarHarmonizacao,
  notacaoEscolhida,
  dimensoesEItens,
  eixosDaObservacao,
  blocoDaDimensao,
  eixoDoBloco,
  rotuloDoEixo,
  varrerJuizo,
};
