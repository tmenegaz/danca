#!/usr/bin/env node
'use strict';

/**
 * elicitar.js — o runtime mínimo do PE.
 *
 * Conduz UMA elicitação: recebe as respostas que já existem, casa o gatilho,
 * monta o documento do envelope, escreve-o e mede-o contra o próprio contrato.
 * Não pergunta, não tem terminal: a entrada é DECLARADA (um arquivo), para que
 * a elicitação seja reproduzível e testável. Quem pergunta é o hospedeiro — o
 * PE recebe o que foi respondido e decide o que fazer com isso.
 *
 * O que este runtime NUNCA faz, e é a fronteira do experimento:
 *
 *   - NÃO normaliza valor para fazê-lo casar com um ramo. Um valor que não
 *     casa produz uma PARADA declarada, não um salto inventado.
 *   - NÃO escreve o estado no documento. O estado é derivado a cada leitura e
 *     o envelope o recusa como campo (`additionalProperties: false` na raiz).
 *   - NÃO cria vocabulário. As opções de cada nó, a forma do gatilho e os
 *     desdobramentos são LIDOS do conteúdo — o PO declara, o PE verifica.
 *   - NÃO reescreve o conteúdo nem o plano. Ele lê os dois.
 *
 * A ordem dos três passos, e a razão de cada um:
 *
 *   1. montar   — o documento-base, com as respostas normalizadas e os elos de
 *                 ramificação que a execução produziu.
 *   2. medir    — o gate (`validar.js`) sobre o documento-base. O resultado é o
 *                 juízo, e é ele que o carimbo de `validacao` registra.
 *   3. derivar  — o estado, pelas cinco regras do contrato, casando a contagem
 *                 de respostas com a lista de obrigatórios LIDA do conteúdo.
 *
 * O documento final é medido uma segunda vez, já com o carimbo, para que o
 * runtime não possa emitir algo que ele mesmo recusaria.
 *
 * Uso:
 *   node elicitar.js                          só o estado `construida`
 *   node elicitar.js --respostas <caminho>    conduz a elicitação declarada
 *   node elicitar.js --respostas r.json --id anamnese-01-sala --json
 *   node elicitar.js --autoteste              prova que o runtime decide
 *
 * ⚠️ As duas rotinas de parada (`derivar-plano.js:113-152`) NÃO são exportadas
 *    pelo derivador: este runtime declara a SUA parada, com id próprio e
 *    descritivo (`valor-sem-ramo`), em vez de copiar o `ramo-3-inalcancavel`
 *    hardcoded de lá — que nomeia o ramo Nº 3 mesmo quando a parada é de outro
 *    valor. A divergência fica declarada, não replicada.
 *
 * ⚠️ O `validar.js` registra UM contrato (`plano`) e não tem função de
 *    registro: o esquema do envelope é carregado AQUI, à parte, e medido por
 *    `validarCom` — que é puro e exportado. O validador não é editado.
 */

// NÚCLEO AGNÓSTICO — sem `fs`, sem `path`, sem `http`, sem `process`. O runtime de
// elicitação recebe o CONTEÚDO (objeto), as respostas e as opções (com o ESQUEMA
// já carregado pelo adaptador) e devolve o documento, o estado e o relatório.
// Quem lê o conteúdo e o esquema do disco é o adaptador (motor/elicitar.js).

const {
  enderecar,
  valoresDaForma,
  procurarRamo,
} = require('./derivar-plano.js');
const { validarCom } = require('./validar.js');

/**
 * ⚠️ As DUAS notações de `conteudo.endereco` convivem no repositório, e são
 * ambas verdadeiras: o plano sai de `ramificacao/` e desce (`../../conteudo/…`);
 * o envelope é endereçado da RAIZ DO PE (`conteudo/…`). Medido nos dois.
 */
const ENDERECO_NO_ENVELOPE = 'conteudo/anamnese.json';
const NORMA_NO_ENVELOPE = 'ARQUITETURA-ANAMNESE.md#3';

// O contrato do envelope, como o documento o escreve. É um RÓTULO, não um caminho:
// o núcleo não resolve nada — quem lê o esquema do disco é o adaptador, que pode
// sobrescrever o rótulo via `opcoes.contrato` se o seu esquema morar noutro sítio.
const CONTRATO_NO_ENVELOPE = 'envelope/elicitacao-schema.json';
/**
 * A versão DESTE contrato. NÃO é `VERSAO_DO_CONTRATO`: aquela serve o plano, e
 * as duas peças versionam sozinhas — é o que o par `plano`/`envelope` do
 * `ramificacao/ramificacao-schema.json` já declara. De 1.0.0 para 1.1.0 porque
 * a chave `contexto` é ADITIVA: quem lia 1.0.x continua a ler o que entendia.
 * De 1.1.0 para 1.2.0 pelo mesmo motivo: o ELO do ajuste (`ajuste_de`, `motivo`,
 * `ajustado_em`) é aditivo — o envelope de uma anamnese ajustada aponta para a
 * anterior, e quem não conhece as chaves continua a ler o resto. A chave nova
 * não entra em silêncio (`envelope/README.md` §3).
 */
const VERSAO_DO_ENVELOPE = '1.2.0';

/**
 * Os quatro campos do bloco `contexto` — a única parte do envelope que diz DE
 * QUEM se está a falar. As respostas continuam clínicas; o apelido (nunca o
 * nome completo) vive aqui, e é regido pelo `apelidoObrigatorio` do conteúdo.
 */
const CAMPOS_DE_CONTEXTO = ['escola', 'professor', 'ciclo', 'aluna'];
/** Declarado em claro, não adivinhado pela extensão — como na âncora `.fipp`. */
const DIGEST_ALGORITMO = 'sha256';

const NO_DO_GATILHO = 'cabecalho.conhecimentoPrevio';

const COMENTARIO =
  'Elicitação DERIVADA — não escrita à mão. O documento é montado a partir do ' +
  'conteúdo (conteudo/anamnese.json) e das respostas declaradas, pelo runtime ' +
  'motor/elicitar.js. As respostas não passam por normalização: o valor que não ' +
  'casa com um ramo declarado produz uma parada, e a parada é fato, não juízo.';

// ---------------------------------------------------------------------------
// O insumo: quais nós são respondíveis
// ---------------------------------------------------------------------------

/**
 * Os nós respondíveis que o CONTEÚDO declara, na ordem em que ele os declara.
 *
 * ⚠️ Um nó é respondível quando a ele corresponde um `id` — porque é por esse
 *    `id` que o envelope casa a resposta, e é por ele que o derivador endereça
 *    o gatilho. O BLOCO não é respondível (não tem `id`); os seus CAMPOS são.
 *
 * ⚠️ Um nó é obrigatório quando traz `obrigatorio: true` — exatamente a
 *    declaração da prosa `obrigatoriedade` do conteúdo. Os quatro campos do
 *    `modulo-b` NÃO o trazem: a obrigatoriedade deles é condicional à entrada
 *    no módulo, e a condição vive em `condicaoDeEntrada`.
 *
 * ⚠️ Um elemento basilar com `subitens` DESMEMBRA: o agrupador continua na
 *    árvore, mas não responde por si — quem responde são os subitens, um a um
 *    («as cinco posições»: um elemento, dez subitens). Sem `subitens`, o
 *    elemento responde por si, pelos desdobramentos (`com-toque`,
 *    `com-barra`, `consciencia-propria`), cujo `forma` é RÓTULO — nunca passa
 *    por `valoresDaForma`. Quem declara o desmembramento é o conteúdo PO:
 *    o motor só lê o que está declarado.
 */
/*
 * As chaves DESCRITIVAS que o conteúdo pode declarar em QUALQUER nó, e que o
 * motor apenas TRANSPORTA — nunca interpreta. É a mesma lei do desmembramento e
 * do id desconhecido: quem declara é o conteúdo, o recipiente só carrega.
 *
 *   explicacao    — texto curto para o professor: o que é, o que preencher, por
 *                   que existe. A tela o mostra ao lado da pergunta; o motor
 *                   não sabe se ele fala de balé ou de matemática.
 *   opcoesDe      — um caminho de API de onde a TELA busca as opções marcáveis
 *                   (o motor não conhece o que ele devolve — só o repassa).
 *   repetirPor    — o id de OUTRO nó: a tela repete ESTE nó uma vez por valor
 *                   selecionado (o acoplamento sujeitos × linha de base).
 *   camposDoItem  — os campos que a tela desenha dentro de cada repetição.
 *
 * Nada aqui é regra de domínio. Sem nenhuma chave, o nó sai como sempre.
 */
function descritores(campo) {
  return {
    explicacao: campo.explicacao || null,
    opcoesDe: campo.opcoesDe || null,
    // Onde o professor CRIA o que ainda não existe na fonte acima — um caminho
    // declarado pelo conteúdo. O PE não sabe o que há lá; a tela só o segue.
    criarEm: campo.criarEm || null,
    // A regra que DERIVA este campo do cruzamento com a fonte (Frente 4): o
    // conteúdo declara o corte (o que é ótimo, o que é observável), o PE fornece
    // os valores, e a tela monta a sugestão. O motor não interpreta o corte.
    derivarDe: campo.derivarDe || null,
    repetirPor: campo.repetirPor || null,
    camposDoItem: campo.camposDoItem || null,
    // As chaves de FORMA: valem em qualquer família (o conteúdo declara-as onde
    // fizer sentido). `multipla` desenha caixas de seleção; `exclusiva` é a opção
    // que anula as demais; `aberto` guarda o campo do que não está na lista.
    multipla: campo.multipla === true,
    colunas: campo.colunas || null,
    exclusiva: campo.exclusiva || null,
    aberto: campo.aberto === true,
    // AS FORMAS DE VALOR. O PE não sabe o que é «frequência semanal» nem «volume
    // de trabalho» — sabe compor NÚMERO + UNIDADE. Quem diz quais unidades
    // existem, quantos pares e se é uma faixa é o CONTEÚDO; o recipiente fornece
    // o mecanismo. É a mesma lei do `opcoesDe`: a forma vem do dado.
    //   medida        — { unidades: [...], pares?: N }  ou  { unidades: [...], faixa: true }
    //   periodicidade — { unidades: [...], dias?: true }
    //   data          — { partes?: N, rotulos?: [...] }
    medida: campo.medida || null,
    periodicidade: campo.periodicidade || null,
    data: campo.data || null,
    // De ONDE vem o valor inicial: um campo do CONTEXTO DO ATO (a barra —
    // escola, professor, ciclo). O conteúdo declara a origem; o PE só copia, e
    // copia como SUGESTÃO — a primeira edição do professor a aposenta.
    deContexto: campo.deContexto || null,
    // O SEMA do campo para a correção socrática (Frente 5): o conteúdo declara
    // SÓ o nome do conceito (ex.: «objetivo»), e o SISTEMA resolve o que esse
    // conceito exige — a regra e a pergunta são infraestrutura, não conteúdo.
    socratico: campo.socratico || null,
  };
}

function nosRespondiveis(conteudo) {
  const nos = [];
  const registrar = (no) => nos.push(no);

  for (const campo of conteudo.cabecalho.campos) {
    // Um campo do cabeçalho pode declarar mais do que a forma: `nota` é a
    // instrução da professora (por que o campo existe, o que ele não mede),
    // `multipla`/`colunas` desenham a escolha múltipla, `exclusiva` é a opção
    // que anula as demais, e `aberto` guarda o campo do que não está na lista.
    // O motor não inventa nada disso — só repassa o que está declarado no
    // conteúdo, para o servidor não precisar adivinhar.
    registrar({
      ...descritores(campo),
      id: campo.id,
      campo: campo.campo,
      obrigatorio: campo.obrigatorio === true,
      familia: campo.ramifica ? 'gatilho' : 'cabecalho',
      endereco: 'cabecalho.' + campo.id,
      forma: campo.forma || null,
      valores: campo.forma ? valoresDaForma(campo.forma) : null,
      ramifica: campo.ramifica || null,
      nota: campo.nota || null,
      multipla: campo.multipla === true,
      colunas: campo.colunas || null,
      exclusiva: campo.exclusiva || null,
      aberto: campo.aberto === true,
    });
  }

  const desdobramentos = (conteudo.observacaoInicial.desdobramentos || []).map((d) => d.id);
  for (const elemento of conteudo.observacaoInicial.elementos) {
    const forma = elemento.forma || null;
    const valores = forma ? valoresDaForma(forma) : null;
    const subitens = elemento.subitens || [];
    // O desmembramento é declarado pelo conteúdo. O elemento pode recusá-lo
    // (`semDesdobramentos`): o motor não julga se a recusa faz sentido, só a lê.
    const desdobramentosDoElemento = elemento.semDesdobramentos ? [] : desdobramentos;

    if (subitens.length) {
      for (const subitem of subitens) {
        // O subitem pode declarar a PRÓPRIA forma — e vence a do elemento
        // quando declara. É o que torna marcável um subitem que descreve um
        // item de um conjunto (escola, frequência, duração…): sem forma, ele
        // sairia como campo de escrita livre. Sem declarar, herda — o
        // comportamento de sempre.
        const formaDoSubitem = subitem.forma !== undefined ? subitem.forma : forma;
        const valoresDoSubitem =
          subitem.forma !== undefined
            ? subitem.forma
              ? valoresDaForma(subitem.forma)
              : null
            : valores;
        registrar({
          ...descritores(subitem),
          id: subitem.id,
          campo: subitem.elemento,
          // A obrigatoriedade do subitem vence a do elemento quando declarada —
          // um conjunto pode ter itens que se aplicam e itens que não.
          obrigatorio:
            subitem.obrigatorio === undefined
              ? elemento.obrigatorio === true
              : subitem.obrigatorio === true,
          familia: 'subitem',
          endereco:
            'observacaoInicial.elementos[' + elemento.id + '].subitens[' + subitem.id + ']',
          natureza: elemento.natureza,
          grupo: elemento.id,
          forma: formaDoSubitem,
          valores: valoresDoSubitem,
          desdobramentos: desdobramentosDoElemento,
        });
      }
      continue;
    }

    registrar({
      ...descritores(elemento),
      id: elemento.id,
      campo: elemento.elemento,
      obrigatorio: elemento.obrigatorio === true,
      familia: 'basilar',
      endereco: 'observacaoInicial.elementos[' + elemento.id + ']',
      natureza: elemento.natureza,
      forma,
      valores,
      desdobramentos: desdobramentosDoElemento,
    });
  }

  for (const bloco of conteudo.blocos) {
    for (const campo of bloco.campos) {
      registrar({
        ...descritores(campo),
        id: campo.id,
        campo: campo.campo,
        obrigatorio: campo.obrigatorio === true,
        familia: 'bloco',
        endereco: 'blocos[' + bloco.bloco + '].' + campo.id,
        bloco: bloco.bloco,
        dimensao: campo.dimensao || bloco.dimensao,
        opcoes: campo.opcoes || null,
        // A mesma FORMA do cabeçalho vale num bloco: um campo que declara
        // `forma` (RAD · Vaganova · …) vira opções marcáveis, não texto livre.
        forma: campo.forma || null,
        valores: campo.forma ? valoresDaForma(campo.forma) : null,
      });
    }
  }

  for (const modulo of conteudo.modulosCondicionais || []) {
    for (const campo of modulo.campos || []) {
      registrar({
        ...descritores(campo),
        id: campo.id,
        campo: campo.campo,
        obrigatorio: campo.obrigatorio === true,
        familia: 'modulo',
        endereco: modulo.id + '.' + campo.id,
        modulo: modulo.id,
        opcoes: campo.opcoes || null,
      });
    }
  }

  return nos;
}

// ---------------------------------------------------------------------------
// As respostas
// ---------------------------------------------------------------------------

/**
 * Uma resposta pode chegar em duas formas, e as duas são aceitas:
 *
 *   "en-dehors": "com-toque"                                   — o atalho
 *   "en-dehors": {"valor": …, "nota": "…"}                      — o registro
 *
 * O atalho não é uma forma pobre: é a forma CURTA do mesmo fato. Ele é
 * completado com a procedência que a elicitação declara — perguntado ao
 * professor — e nunca com uma inventada. Nenhum campo é adivinhado.
 */
function normalizarResposta(cru) {
  const eRegistro =
    cru !== null && typeof cru === 'object' && !Array.isArray(cru) && 'valor' in cru;
  if (eRegistro) {
    return {
      valor: cru.valor === undefined ? null : cru.valor,
      origem: cru.origem === undefined ? 'perguntado' : cru.origem,
      respondente: cru.respondente === undefined ? 'professor' : cru.respondente,
      nota: cru.nota === undefined ? null : cru.nota,
    };
  }
  return {
    valor: cru === undefined ? null : cru,
    origem: 'perguntado',
    respondente: 'professor',
    nota: null,
  };
}

function temResposta(respostas, id) {
  return Object.prototype.hasOwnProperty.call(respostas, id);
}

/**
 * As respostas declaradas, normalizadas e filtradas pelos nós que o conteúdo
 * declara. Um `id` desconhecido NÃO entra e NÃO desaparece: ele é relatado —
 * um id a mais na contagem inflaria a decisão do corte em silêncio.
 */
function prepararRespostas(nos, respostasCruas) {
  const conhecidos = new Set(nos.map((no) => no.id));
  const respostas = {};
  const desconhecidos = [];

  for (const chave of Object.keys(respostasCruas || {})) {
    if (!conhecidos.has(chave)) {
      desconhecidos.push(chave);
      continue;
    }
    respostas[chave] = normalizarResposta(respostasCruas[chave]);
  }

  return { respostas, desconhecidos };
}

// ---------------------------------------------------------------------------
// A ramificação
// ---------------------------------------------------------------------------

/**
 * Executa a ramificação por valor e devolve o elo — ou a parada.
 *
 * A doutrina do derivador, reusada sem alteração: igualdade ESTRITA de string,
 * sem normalização (`derivar-plano.js:100-110`). O destino do elo é o `id` do
 * módulo (`modulo-a`), nunca o número do ramo (1/2/3) — medido na `description`
 * de `definitions.ramificacao.ramo` e na de `destino.id`.
 *
 * ⚠️ Um destino `pela-condicao` (o `modulo-b`) não tem valor selecionador: o
 *    seu salto não é decidível por esta mecânica, e isso é uma parada
 *    estrutural — ela acontece mesmo quando todos os valores casam.
 */
function ramificar(conteudo, respostas) {
  const modulos = conteudo.modulosCondicionais || [];
  const porValor = modulos.filter((m) => typeof m.ramificaPor === 'string');
  const pelaCondicao = modulos.filter((m) => typeof m.ramificaPor !== 'string');
  const elos = [];
  const paradas = [];

  let gatilho = null;
  if (porValor.length === 1) {
    const modulo = porValor[0];
    const campo = enderecar(conteudo, modulo.ramificaPor);
    const ramos = Array.isArray(modulo.ramos) ? modulo.ramos : [];
    // ⚠️ `ramificaPor` é o ENDEREÇO do campo (`cabecalho.conhecimentoPrevio`);
    //    a chave de `respostas` é o `id` do nó (`conhecimentoPrevio`). O elo
    //    registra o endereço — é ele que a `description` de
    //    `definitions.ramificacao.no` nomeia —, e a resposta se busca pelo `id`.
    const idDoGatilho = campo.id;
    gatilho = {
      no: modulo.ramificaPor,
      id: idDoGatilho,
      campo: campo.campo,
      valoresDeclarados: valoresDaForma(campo.forma),
      destino: modulo.id,
      ramos: ramos.map((r) => r.nivelDeclarado),
    };

    if (temResposta(respostas, idDoGatilho)) {
      const valor = respostas[idDoGatilho].valor;
      const ramo = typeof valor === 'string' ? procurarRamo(valor, ramos) : null;

      if (ramo) {
        elos.push({
          no: modulo.ramificaPor,
          valor,
          ramo: modulo.id,
          em: null,
        });
      } else {
        paradas.push({
          id: 'valor-sem-ramo',
          tipo: 'valor-sem-ramo',
          no: modulo.ramificaPor,
          valorRecebido: valor,
          ramosConsiderados: gatilho.ramos,
          motivo:
            'O valor `' + String(valor) + '` não casa, por igualdade estrita de string, com ' +
            'nenhum dos ' + ramos.length + ' ramos de `' + modulo.id + '`, que esperam `' +
            gatilho.ramos.join('`, `') + '`. A elicitação PARA neste ponto e a parada fica ' +
            'registrada como fato. Divergência com o derivador: lá a parada sai com o id ' +
            'fixo `ramo-3-inalcancavel`, que nomeia o ramo Nº 3 mesmo quando o valor ' +
            'parado é outro.',
        });
      }
    } else {
      paradas.push({
        id: 'gatilho-sem-resposta',
        tipo: 'gatilho-nao-respondido',
        no: modulo.ramificaPor,
        valorRecebido: null,
        ramosConsiderados: gatilho.ramos,
        motivo:
          'O gatilho `' + modulo.ramificaPor + '` ainda não foi respondido: a elicitação ' +
          'não ramificou, e a entrada em `' + modulo.id + '` permanece indecidida. ' +
          'A ausência de elo é o registro — não se presume um ramo.',
      });
    }
  } else {
    paradas.push({
      id: 'gatilhos-em-numero-incompativel',
      tipo: 'mecanica-nao-aplicavel',
      no: null,
      valorRecebido: null,
      ramosConsiderados: [],
      motivo:
        'Esta mecânica mede UM gatilho por valor; o conteúdo declara ' +
        porValor.length + '. Nenhuma ramificação foi executada.',
    });
  }

  for (const modulo of pelaCondicao) {
    paradas.push({
      id: modulo.id + '-sem-gatilho',
      tipo: 'condicao-nao-avaliavel',
      no: null,
      valorRecebido: null,
      ramosConsiderados: [],
      motivo:
        '`' + modulo.id + '` é destino declarado, mas NÃO declara `ramificaPor`: a sua ' +
        'condição de entrada vive em prosa (`condicaoDeEntrada`) e não é avaliável por ' +
        'esta mecânica. O contrato nunca exigiu gatilho de todo destino — exigir seria inferir.',
    });
  }

  return { gatilho, elos, paradas };
}

// ---------------------------------------------------------------------------
// O estado
// ---------------------------------------------------------------------------

/**
 * As cinco regras do contrato, na ordem em que o contrato as ordena:
 *
 *   construida   0 respostas
 *   em_curso     ≥1 resposta E ≥1 obrigatório pendente
 *   validada     o carimbo diz `passou`
 *   recusada     o carimbo diz `falhou`
 *   completa     todos os obrigatórios respondidos E o carimbo ainda não correu
 *
 * ⚠️ O CORTE NÃO É A CONTAGEM SOLTA: é a contagem casada com a lista de
 *    obrigatórios que o CONTEÚDO declara — o envelope não possui essa lista, ele
 *    a lê do conteúdo (`elicitacao-schema.json:150`).
 */
function derivarEstado(contagem, validacao) {
  if (contagem.respondidos === 0) return 'construida';
  if (contagem.pendentes > 0) return 'em_curso';
  if (validacao && validacao.resultado === 'passou') return 'validada';
  if (validacao && validacao.resultado === 'falhou') return 'recusada';
  return 'completa';
}

// ---------------------------------------------------------------------------
// A elicitação
// ---------------------------------------------------------------------------

function carimbarAgora() {
  const agora = new Date();
  const dois = (n) => String(n).padStart(2, '0');
  return (
    agora.getFullYear() +
    '-' + dois(agora.getMonth() + 1) +
    '-' + dois(agora.getDate()) +
    'T' + dois(agora.getHours()) +
    ':' + dois(agora.getMinutes())
  );
}

/**
 * Só o declarado entra: campo em branco não é contexto, é ausência dele. Sem
 * nenhum campo, devolve `null` — e então a chave não nasce no documento.
 */
function normalizarContexto(cru) {
  if (!cru || typeof cru !== 'object' || Array.isArray(cru)) return null;
  const contexto = {};
  for (const campo of CAMPOS_DE_CONTEXTO) {
    const valor = cru[campo];
    if (typeof valor !== 'string') continue;
    const limpo = valor.trim();
    if (limpo === '') continue;
    contexto[campo] = limpo;
  }
  return Object.keys(contexto).length === 0 ? null : contexto;
}

/**
 * Conduz uma elicitação inteira e devolve o documento, o estado e o relatório.
 * Tudo o que o runtime decidiu fica no relatório — inclusive o que ele NÃO fez.
 */
function elicitar(conteudo, respostasCruas, opcoes) {
  const ajustes = opcoes || {};
  const nos = nosRespondiveis(conteudo);
  const obrigatorios = nos.filter((no) => no.obrigatorio);
  const { respostas, desconhecidos } = prepararRespostas(nos, respostasCruas);

  const respondidos = obrigatorios.filter((no) => temResposta(respostas, no.id));
  const pendentes = obrigatorios.filter((no) => !temResposta(respostas, no.id));
  const contagem = {
    nos: nos.length,
    obrigatorios: obrigatorios.length,
    respondidos: respondidos.length,
    pendentes: pendentes.length,
    idsPendentes: pendentes.map((no) => no.id),
  };

  const ramificacao = ramificar(conteudo, respostas);
  const geradoEm = ajustes.geradoEm || carimbarAgora();
  const id = ajustes.id || 'anamnese-' + geradoEm.slice(0, 10);

  const base = {
    $comentario: COMENTARIO,
    envelope: VERSAO_DO_ENVELOPE,
    id,
    conteudo: {
      // O endereço vem do caminho de fato lido (o CLI e a porta o passam em
      // `opcoes`); a `norma` vem do PRÓPRIO conteúdo, que se auto-identifica
      // (`documento`/`norma` — é a leitura M1 do plano). Os dois caem nas
      // constantes da anamnese quando o conteúdo não os traz — é o que mantém
      // o comportamento de sempre, byte a byte.
      endereco: ajustes.endereco || ENDERECO_NO_ENVELOPE,
      norma: ajustes.norma || conteudo.norma || NORMA_NO_ENVELOPE,
      digest: null,
      digestAlgoritmo: DIGEST_ALGORITMO,
    },
    respostas,
    ramificacoes: ramificacao.elos,
    ancora: null,
    gerado_em: geradoEm,
  };

  // O ELO do ajuste — a anamnese ajustada aponta para a anterior. Só nasce
  // quando há ajuste: uma anamnese comum não carrega a chave. É o mesmo
  // mecanismo do lançamento (`ajuste_de`/`ajustado_em`/`motivo`), e a fronteira
  // é a mesma: a proveniência acrescenta, não sobrescreve.
  if (ajustes.ajuste && ajustes.ajuste.de) {
    base.ajuste_de = String(ajustes.ajuste.de);
    base.ajustado_em = ajustes.ajuste.em || geradoEm;
    base.motivo = ajustes.ajuste.motivo == null ? null : String(ajustes.ajuste.motivo);
  }

  // ⚠️ A AUSÊNCIA de `respostas` É o estado `construida` — não se emite o objeto vazio.
  if (Object.keys(respostas).length === 0) delete base.respostas;

  // O contexto entra em `base` — e não depois — para que o documento FINAL seja
  // medido com ele: o runtime não emite o que ele recusaria. Sem contexto, a
  // chave não nasce; não há bloco vazio a fingir identidade.
  const contexto = normalizarContexto(ajustes.contexto);
  if (contexto) base.contexto = contexto;

  // O núcleo não lê o esquema do disco: o adaptador injeta-o. Sem ele, a recusa é
  // declarada — nunca um `fs` silencioso dentro da lógica.
  if (!ajustes.esquema || typeof ajustes.esquema !== 'object') {
    throw new Error('núcleo sem esquema: o adaptador injeta `opcoes.esquema` (o contrato já carregado)');
  }
  const esquema = ajustes.esquema;
  const errosDoBase = validarCom(base, esquema);
  const validacao = {
    contrato: ajustes.contrato || CONTRATO_NO_ENVELOPE,
    resultado: errosDoBase.length === 0 ? 'passou' : 'falhou',
    motivos: errosDoBase.map((erro) => (erro.caminho || '(raiz)') + ' — ' + erro.mensagem),
  };

  const documento = {};
  for (const chave of Object.keys(base)) documento[chave] = base[chave];
  documento.validacao = validacao;

  // O documento final é medido de novo: o runtime não emite o que ele recusaria.
  const errosDoDocumento = validarCom(documento, esquema);
  const estado = derivarEstado(contagem, validacao);

  return {
    documento,
    estado,
    relatorio: {
      id,
      estado,
      contagem,
      gatilho: ramificacao.gatilho,
      elos: ramificacao.elos,
      paradas: ramificacao.paradas,
      idsDesconhecidos: desconhecidos,
      validacao,
      errosDoDocumento,
    },
  };
}
/**
 * Um conjunto de respostas completo, com o gatilho fixado pelo caso. As
 * respostas dos nós de opção são o PRIMEIRO valor declarado — não uma escolha
 * pedagógica: o autoteste mede o runtime, não a aluna.
 */
function completar(conteudo, valorDoGatilho) {
  const respostas = {};
  for (const no of nosRespondiveis(conteudo)) {
    if (no.id === 'conhecimentoPrevio') {
      respostas[no.id] = valorDoGatilho;
    } else if (no.familia === 'basilar' || no.familia === 'subitem') {
      // A escala do elemento, com o desdobramento como auxiliar — quando o
      // elemento declarou desdobramento. Sem ele, a resposta é só a escala.
      const desdobramento = (no.desdobramentos || [])[0];
      if (!no.valores || !no.valores.length) {
        respostas[no.id] = desdobramento === undefined ? 'campo aberto' : desdobramento;
      } else {
        respostas[no.id] = desdobramento === undefined
          ? [no.valores[0]]
          : [no.valores[0], desdobramento];
      }
    } else if (no.opcoes && no.opcoes.length) {
      respostas[no.id] = no.opcoes[0];
    } else {
      respostas[no.id] = 'campo aberto';
    }
  }
  return respostas;
}

// ---------------------------------------------------------------------------
// A exportação do NÚCLEO: só lógica pura. CONTEUDO/ESQUEMA_DO_ENVELOPE, o
// enderecoDoConteudo (path), o autoteste e a CLI ficam no adaptador —
// motor/elicitar.js — que injeta o esquema em `opcoes.esquema`.
// ---------------------------------------------------------------------------

module.exports = {
  ENDERECO_NO_ENVELOPE,
  NORMA_NO_ENVELOPE,
  NO_DO_GATILHO,
  nosRespondiveis,
  normalizarResposta,
  prepararRespostas,
  ramificar,
  derivarEstado,
  carimbarAgora,
  elicitar,
  completar,
};
