#!/usr/bin/env node
'use strict';

/**
 * renderizar.js — a ficha imprimível da anamnese.
 *
 * Transforma o conteúdo PO (`../conteudo/anamnese.json`) na ficha que o
 * professor imprime e preenche à mão. Não pergunta, não grava resposta: só
 * RENDERIZA o que o PO já declara, na ordem em que o motor o enumeraria.
 *
 * O que este renderizador NUNCA faz, e é a fronteira dele:
 *
 *   - NÃO cria vocabulário. As opções de cada campo, as formas de verificação
 *     dos basilares, os perfis de entrada e a lista de métodos de origem são
 *     LIDOS do conteúdo — não há lista fixa aqui dentro.
 *   - NÃO inventa dado. A redação da triagem dos três ramos é lacuna no
 *     conteúdo (`[Preencher: …]`) e sai como lacuna: nenhuma pergunta nova
 *     nasce neste arquivo.
 *   - NÃO imprime nome completo nem dado sensível. A ficha pede o apelido
 *     estável (P-12), e é só ele que ela tem onde escrever.
 *   - NÃO executa o `≠` da norma. A condição de entrada dos módulos
 *     condicionais é prosa que compara com uma redação que nenhum valor
 *     elicitado assume (`ramificacao/README.md` §4-B); a ficha a escreve em
 *     língua clara, e a divergência segue declarada onde está — aqui não se
 *     conserta nada.
 *   - NÃO enumera nós por conta própria. Os nós respondíveis vêm de
 *     `nosRespondiveis()` (`../motor/elicitar.js`) — a MESMA lista contra a
 *     qual o envelope casa a contagem de respostas. Uma ficha que perdesse um
 *     nó deixaria de ser a ficha do conteúdo. `normalizarResposta()` e
 *     `prepararRespostas()` vêm do mesmo módulo: a leitura da resposta é a
 *     mesma que o motor já faz, e não uma segunda, paralela.
 *
 * A cobertura é verificável, não prometida: `--autoteste` prova que todo nó
 * respondível do conteúdo aparece na ficha — nenhum a menos. E o mesmo
 * autoteste prova que, SEM respostas, a ficha sai palavra por palavra igual:
 * a camada de valores marca, e não reescreve.
 *
 * Uso:
 *   node renderizar.js                        escreve em `ficha-anamnese.md`
 *   node renderizar.js --saida outra.md       escreve onde se mandar
 *   node renderizar.js --json                 só o relatório da renderização
 *   node renderizar.js --autoteste            prova a cobertura e as fronteiras
 *   node renderizar.js --respostas e.json --preenchida --saida f.md
 *                                             a ficha de conferência: com as
 *                                             respostas do envelope, e só com a
 *                                             opção escolhida nas escalas
 *
 * ⚠️ Duas coisas que a ficha NÃO decide, por serem regra de negócio do
 *    professor ou da escola, e não arquitetura deste experimento: o que o
 *    campo `Aula` significa na entrada (a ficha distingue entrada e
 *    revalidação pelo `Tipo de ficha`, e deixa `Aula` em branco), e qual das
 *    duas datas a ficha carrega. O campo é um só, e é o que se observa.
 */

const {
  nosRespondiveis,
  normalizarResposta,
  prepararRespostas,
} = require('./elicitar.js');

const TRACO = '_'.repeat(30);
const ID_DO_METODO = 'matriz-metodologica-de-origem';
// «Não foi medido» — o sentinel que a porta grava quando o professor declara que NÃO
// mediu o item (a terceira via das opções da anamnese). Na ficha, ele BLOQUEIA a marcação
// de caixa: sai «*não foi medido*» em vez de uma escolha — o derivado não inventa valor.
const NAO_MEDIDO = 'não foi medido';
function valoresDaForma(forma) {
  return String(forma)
    .split('·')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

// ---------------------------------------------------------------------------
// A camada de valores: onde a resposta marcada se escreve
// ---------------------------------------------------------------------------

/**
 * O que a professora respondeu, na forma em que a ficha sabe perguntar.
 *
 * Um envelope guarda `respostas` como OBJETO de registros (`{valor, origem,
 * respondente, nota}`), e o `valor` tem quatro shapes medidos no envelope
 * real: escalar, lista de um, lista de dois (escala + id do desdobramento) e
 * ausente. Os quatro caem em duas perguntas — «qual opção da escala» e «com
 * qual apoio» — e é só isso que esta camada sabe ler.
 *
 * A `nota` viaja com a resposta: é o que a professora escreveu SOBRE a escolha,
 * e não se perde aqui — sai no registro, para quem imprime decidir a forma.
 * Ausente ou só branco, sai `null`.
 *
 * Sem respostas, as duas perguntas devolvem vazio, e quem marca não marca
 * nada: o caminho em branco é o mesmo de antes desta camada existir.
 */
function valoresRespondidos(registro, desdobramentos) {
  if (!registro) return { respondido: [], escala: null, desdobramentos: [], nota: null };

  const cru = registro.valor;
  const lista = Array.isArray(cru) ? cru : cru == null ? [] : [cru];
  const desdobramentoPorId = desdobramentos || {};

  // O 1.º elemento é a opção da escala, quando ela existe. O envelope o grava
  // como a resposta declarada, e não como índice — a igualdade é exata.
  const escala = lista.length && !desdobramentoPorId[lista[0]] ? lista[0] : null;

  // Os demais são ids de desdobramento. Um deles pode vir em 1.º lugar, se a
  // escada do nó estiver em branco; ler o id pelo POOL, e não pela posição,
  // mantém os dois casos no mesmo caminho.
  const apoios = lista.filter((v) => desdobramentoPorId[v] != null);

  const nota =
    typeof registro.nota === 'string' && registro.nota.trim() ? registro.nota : null;

  return { respondido: lista, escala, desdobramentos: apoios, nota };
}

/**
 * `☐ a  **b**  ☐ c` — a caixa de quem foi marcado, e a de quem não foi.
 *
 * A marca é o NEGRITO, e não um `☑`: a linha do cabeçalho entra na moldura,
 * cuja largura sai de `Math.max(…l.length)`, e um glifo mais largo mexeria na
 * régua. Os pools de escala e de desdobramento são disjuntos no conteúdo
 * medido, então marcar por igualdade exata contra a lista declarada não corre
 * o risco de acender a opção errada. Sem resposta, a lista de escolhas é
 * vazia, nada é marcado, e a linha sai como sempre saiu.
 *
 * Com `preenchida` — a ficha conferida contra o envelope — a escala encolhe à
 * escolha: as opções não escolhidas saem, e fica só o que a aluna respondeu.
 * A supressão tem duas bordas declaradas: só age quando há escolha (linha sem
 * nenhuma marca sai com todos os `☐`, porque a pergunta existe e ficou sem
 * resposta), e o `null` do agrupador — que significa «aqui não se marca» — não
 * é escolha nenhuma e por isso mantém a escala inteira.
 */
function caixas(valores, escolhidos, preenchida) {
  const marcados =
    escolhidos == null ? [] : Array.isArray(escolhidos) ? escolhidos : [escolhidos];
  if (preenchida && marcados.length) {
    return valores
      .filter((v) => marcados.indexOf(v) !== -1)
      .map((v) => '**' + v + '**')
      .join('  ');
  }
  return valores
    .map((v) => (marcados.indexOf(v) !== -1 ? '**' + v + '**' : '☐ ' + v))
    .join('  ');
}

/** `☒ Com toque — …` — a linha de desdobramento, com a caixa de quem foi apoiado. */
function linhaDeDesdobramento(desdobramento, marcado) {
  return (marcado ? '☒ ' : '☐ ') + desdobramento.forma + ' — ' + desdobramento.exemplo;
}

/**
 * A escala do elemento basilar, com o bloqueio do «não foi medido»: quando o envelope
 * traz o sentinel, a escala sai em itálico (o derivado não marca nenhuma caixa), e os
 * desdobramentos ficam sem apoio — o apoio não foi medido junto.
 */
function caixasOuNaoMedido(resposta, valores, preenchida) {
  if (resposta && resposta.escala === NAO_MEDIDO) return '*' + NAO_MEDIDO + '*';
  return caixas(valores, resposta ? resposta.respondido : null, preenchida);
}

/**
 * `Bloco 2` · `Blocos 2 e 4` · `Blocos 2, 4 e 5` — a lista de blocos onde um
 * basilar aprofunda. A enumeração é a da casa: vírgula entre os itens, `e`
 * antes do último (cf. `REGRAS.md` 8, 16 e 17). O `e` repetido que saía em
 * `Blocos 2 e 4 e 5` foi corrigido em 01/10/2026.
 */
function listaDeBlocos(numeros) {
  const lista = Array.isArray(numeros) ? numeros : [];
  if (!lista.length) return '—';
  if (lista.length === 1) return 'Bloco ' + lista[0];
  return 'Blocos ' + lista.slice(0, -1).join(', ') + ' e ' + lista[lista.length - 1];
}

/** Os métodos de origem, lidos do próprio conteúdo (P-16: declarado, não deduzido). */
function metodosDeOrigem(conteudo) {
  for (const modulo of conteudo.modulosCondicionais || []) {
    for (const campo of modulo.campos || []) {
      if (campo.id === ID_DO_METODO) return campo.opcoes || [];
    }
  }
  return [];
}

/** O gatilho da ramificação, lido do cabeçalho — nunca um `id` fixo aqui. */
function noDoGatilho(nos) {
  return nos.find((no) => no.familia === 'gatilho') || null;
}

// ---------------------------------------------------------------------------
// Os blocos de escrita
// ---------------------------------------------------------------------------

/**
 * A caixa do topo: a identificação da ficha e o tipo.
 *
 * Só o campo «Método declarado» recebe marca: os demais são linha de
 * identificação, e o apelido não é elicitado — é o professor que o escreve.
 * O `Data:` também fica em branco, porque a data da ficha é a da observação,
 * e não a de nascimento que o envelope guarda.
 */
function cabecalhoDaFicha(conteudo, noGatilho, respostaDoMetodo, preenchida) {
  const metodos = metodosDeOrigem(conteudo);
  const marcados = respostaDoMetodo ? respostaDoMetodo.respondido : null;
  const linhas = [
    'Data: ____/____/______',
    'Ciclo: ______        Aula: ______',
    'Escola: ______________________________',
    'Professor(a): ______________________________',
    'Método declarado (P-16): ' + caixas(metodos, marcados, preenchida) + '  ☐ Outro: __________',
    'Aluna (apelido — ' + conteudo.apelidoObrigatorio + '): ______________________________',
    '',
    'Tipo de ficha:',
    '☐ Linha de base zero (entrada — antes do ciclo)',
    '☐ Revalidação (a cada aula dada)',
  ];

  if (noGatilho) {
    linhas.push('');
    linhas.push(
      'O campo «' + noGatilho.campo + '» é o gatilho: é o que decide se os ' +
        'módulos condicionais do fim desta ficha entram.'
    );
  }

  const largura = Math.max(...linhas.map((l) => l.length)) + 2;
  const caixa = ['┌' + '─'.repeat(largura) + '┐'];
  for (const linha of linhas) {
    caixa.push('│ ' + linha.padEnd(largura - 1) + '│');
  }
  caixa.push('└' + '─'.repeat(largura) + '┘');
  return caixa;
}

/**
 * Um campo do conteúdo: o rótulo, as caixas (ou a lacuna) e a dimensão.
 *
 * O campo chega em dois shapes: o NÓ do motor (blocos e módulos, com `opcoes`)
 * e o campo CRU do conteúdo (bloco 1, com `forma`). O rótulo e a resposta saem
 * do `id`, que existe nos dois.
 *
 * Quando o campo declara UM só valor, esse valor é o enunciado do que se
 * escreve — a data de nascimento, no caso do `idade` — e o que a aluna
 * respondeu entra no lugar do branco. Sem resposta, sai o branco de sempre.
 */
function campoEmLinhas(campo, registro, resposta, preenchida) {
  const linhas = [];
  linhas.push('**' + campo.campo + '**');

  const valores = campo.opcoes || campo.valores ||
    (campo.forma ? valoresDaForma(campo.forma) : []);
  const dito = resposta && resposta.respondido.length ? resposta.respondido[0] : null;
  if (dito === NAO_MEDIDO) {
    // O bloqueio do derivado: medir não é obrigatório, e «não foi medido» não é uma
    // escolha da escala — sai em itálico, fora das caixas, para não marcar nenhuma.
    linhas.push('*' + NAO_MEDIDO + '*');
  } else if (valores.length > 1) {
    linhas.push(caixas(valores, resposta ? resposta.respondido : null, preenchida));
  } else if (valores.length === 1) {
    linhas.push(dito == null ? TRACO + '  — ' + valores[0] : '**' + dito + '**');
  } else {
    linhas.push(TRACO);
  }

  // A nota do professor sobre ESTA resposta — não a `nota` do conteúdo, que
  // sai em itálico no cabeçalho do bloco. Sai em citação, como a do elemento
  // basilar, e só quando tem valor: o nó sem nota não ganha linha nenhuma.
  if (resposta && resposta.nota) linhas.push('> ' + resposta.nota);

  if (campo.dimensao) linhas.push('*Dimensão:* ' + campo.dimensao);
  linhas.push('');
  registro(campo.id);
  return linhas;
}

/** Os três ramos do Módulo A — a triagem é lacuna declarada, e sai lacuna. */
function ramoEmLinhas(ramo, lacunas) {
  const linhas = [];
  linhas.push('**Ramo ' + ramo.ramo + ' — nível declarado: ' + ramo.nivelDeclarado + '**');
  linhas.push('Verifica: ' + ramo.verifica);
  // `triagem` é string no conteúdo medido (a lacuna inteira, verbatim) e virá
  // array quando a fonte externa a preencher. Os dois shapes são o mesmo dado.
  const triagem = ramo.triagem == null
    ? []
    : Array.isArray(ramo.triagem) ? ramo.triagem : [ramo.triagem];
  for (const item of triagem) {
    if (/^\[Preencher/.test(String(item))) {
      // Uma entrada por ramo: as três redações coincidem no conteúdo medido, e
      // a coincidência é o FATO — deduplicá-la esconderia que são três lacunas.
      lacunas.push({ ramo: ramo.ramo, lacuna: item });
      linhas.push('Triagem: ' + item);
    } else {
      linhas.push('☐ ' + item);
    }
  }
  linhas.push('');
  return linhas;
}

// ---------------------------------------------------------------------------
// A renderização
// ---------------------------------------------------------------------------

function renderizar(conteudo, opcoes) {
  opcoes = opcoes || {};
  // `preenchida` é a conferência contra o envelope: a escala encolhe à escolha.
  // Ausente — como na ficha em branco e no autoteste — nada encolhe.
  const preenchida = Boolean(opcoes.preenchida);
  const nos = nosRespondiveis(conteudo);
  const noGatilho = noDoGatilho(nos);
  const impressos = [];
  const lacunas = [];
  const secoes = [];

  const registrar = (id) => {
    if (impressos.indexOf(id) === -1) impressos.push(id);
  };

  const observacao = conteudo.observacaoInicial;
  const elementoPorId = {};
  for (const elemento of observacao.elementos) elementoPorId[elemento.id] = elemento;
  const desdobramentoPorId = {};
  for (const desdobramento of observacao.desdobramentos || []) {
    desdobramentoPorId[desdobramento.id] = desdobramento;
  }

  // Sem `respostas`, `prepararRespostas` devolve vazio e `respostaDe` devolve
  // `null` em toda parte: a ficha sai palavra por palavra como sempre saiu.
  const { respostas, desconhecidos } = prepararRespostas(nos, opcoes.respostas);
  const VAZIA = { respondido: [], escala: null, desdobramentos: [] };
  const respostaDe = (id) =>
    respostas[id] ? valoresRespondidos(respostas[id], desdobramentoPorId) : null;
  const respostaDoElemento = (id) => respostaDe(id) || VAZIA;

  // Um desdobramento só se marca onde o envelope o gravou, e só no nó que o
  // declarou: `com-barra` marcado numa posição não acende o mesmo apoio nas
  // outras cinco. O envelope grava um id por nó, e é o id que decide.
  const apoio = (resposta, id) => resposta.desdobramentos.indexOf(id) !== -1;

  const saida = [];

  // --- A abertura --------------------------------------------------------
  saida.push('# Observação inicial — anamnese de balé clássico');
  saida.push('');
  saida.push(
    '## Linha de base · ficha do professor',
    ''
  );
  saida.push(
    'Esta ficha registra o que se observou. Não é uma avaliação, e não decide ' +
      'para que turma a aluna vai — a decisão é do professor. Observe, marque o ' +
      'que viu e deixe em branco o que não observou.',
    ''
  );
  saida.push(conteudo.oQueFicaFora, '');
  saida.push('---', '');
  for (const linha of cabecalhoDaFicha(conteudo, noGatilho, respostaDe(ID_DO_METODO), preenchida)) {
    saida.push(linha);
  }
  saida.push('', '---', '');

  // --- Bloco 1: a identificação ------------------------------------------
  const cabecalho = conteudo.cabecalho;
  saida.push('### ' + cabecalho.bloco + '. ' + cabecalho.titulo);
  saida.push('');
  saida.push('**Objetivo:** ' + cabecalho.objetivo);
  saida.push('');
  if (cabecalho.nota) saida.push('*' + cabecalho.nota + '*', '');

  const inicioIdentificacao = saida.length;
  for (const campo of cabecalho.campos) {
    for (const linha of campoEmLinhas(campo, registrar, respostaDe(campo.id), preenchida)) {
      saida.push(linha);
    }
  }
  secoes.push({
    titulo: cabecalho.titulo,
    itens: saida.length - inicioIdentificacao,
  });
  saida.push('---', '');

  // --- A observação inicial: os basilares, e o que desmembra -------------
  saida.push('### A observação inicial — os elementos');
  saida.push('');
  saida.push('*' + observacao.nota + '*');
  saida.push('');
  saida.push(
    'É a versão rápida do que os nove blocos investigam em detalhe.'
  );
  saida.push('');
  saida.push('| Elemento | Natureza | Onde aprofunda |');
  saida.push('|:--|:--|:--|');
  // Um elemento com `subitens` agrupa e desmembra: ele sai na tabela como a
  // linha que nomeia o grupo, e cada subitem sai numa linha própria (▸).
  for (const no of nos.filter((n) => n.familia === 'basilar' || n.familia === 'subitem')) {
    if (no.familia === 'subitem') {
      const agrupador = elementoPorId[no.grupo] || {};
      saida.push(
        '| ▸ ' + no.campo + ' | *de* ' + agrupador.elemento + ' | ' +
          listaDeBlocos(agrupador.ondeAprofunda) + ' |'
      );
      continue;
    }
    const elemento = elementoPorId[no.id] || {};
    saida.push(
      '| ' + elemento.elemento + ' | ' + elemento.natureza + ' | ' +
        listaDeBlocos(elemento.ondeAprofunda) + ' |'
    );
  }
  saida.push('');

  // Um elemento com `subitens` desmembra: o título e a orientação saem como a
  // prosa que nomeia o grupo, e cada subitem vira uma pergunta própria — mesma
  // escala, mesmos auxiliares. O agrupador não responde por si, e por isso o
  // `registrar` dele é o de cada subitem, não o do elemento.
  for (const elemento of observacao.elementos) {
    const no = nos.find((n) => n.id === elemento.id) || {};
    const filhos = nos.filter((n) => n.familia === 'subitem' && n.grupo === elemento.id);
    const valores = elemento.forma ? valoresDaForma(elemento.forma) : [];
    // O agrupador não responde por si: a escala dele sai em branco, e quem a
    // traz marcada é cada subitem, na reimpressão abaixo. Um elemento sem
    // filhos responde sozinho, e aí a escala leva a marca dele.
    const escala = valores.length
      ? caixasOuNaoMedido(
          filhos.length ? null : respostaDoElemento(elemento.id),
          valores,
          preenchida,
        )
      : null;

    saida.push('**' + elemento.elemento + '** — *' + elemento.natureza + '*');
    if (elemento.oQueE) saida.push(elemento.oQueE);
    if (elemento.orientacao) saida.push(elemento.orientacao);
    if (elemento.nota) saida.push('> ' + elemento.nota);
    saida.push('');
    if (escala) saida.push(escala, '');

    if (filhos.length) {
      for (const filho of filhos) {
        const respostaDoFilho = respostaDoElemento(filho.id);
        saida.push('**' + filho.campo + '**');
        if (valores.length) saida.push(caixasOuNaoMedido(respostaDoFilho, valores, preenchida), '');
        for (const id of filho.desdobramentos || []) {
          const desdobramento = desdobramentoPorId[id] || {};
          saida.push(linhaDeDesdobramento(desdobramento, apoio(respostaDoFilho, id)));
        }
        saida.push('');
        registrar(filho.id);
      }
      continue;
    }

    const respostaDoNo = respostaDoElemento(elemento.id);
    for (const id of no.desdobramentos || []) {
      const desdobramento = desdobramentoPorId[id] || {};
      saida.push(linhaDeDesdobramento(desdobramento, apoio(respostaDoNo, id)));
    }
    saida.push('');
    registrar(elemento.id);
  }

  saida.push('*' + observacao.notaDesdobramentos + '*');
  saida.push('');

  saida.push('**Perfis de entrada** — o que a observação inicial verifica, conforme o que a aluna traz:');
  saida.push('');
  saida.push('| Perfil | O que verifica |');
  saida.push('|:--|:--|');
  for (const perfil of observacao.perfisDeEntrada) {
    saida.push('| ' + perfil.perfil + ' | ' + perfil.verifica + ' |');
  }
  saida.push('');
  saida.push('---', '');

  // --- As três dimensões -------------------------------------------------
  saida.push('### As três dimensões');
  saida.push('');
  // `dimensoes` é uma LISTA de `{id, blocos, cobre}` — `Object.entries` sobre ela
  // devolveria índices numéricos como nome e `undefined` como prosa. O nome sai
  // do `id`, e a prosa, do `cobre`; ambos são LIDOS do conteúdo, não criados aqui.
  for (const dimensao of conteudo.dimensoes) {
    const onde = listaDeBlocos(dimensao.blocos);
    const itens = dimensao.blocosComItens && dimensao.blocosComItens.length
      ? ' — e os itens marcados do ' + listaDeBlocos(dimensao.blocosComItens)
      : '';
    saida.push('- **' + dimensao.id + '** — ' + dimensao.cobre + ' (' + onde + itens + ')');
  }
  saida.push('', '---', '');

  // --- Os nove blocos, do 2 ao 9 -----------------------------------------
  const inicioBlocos = saida.length;
  for (const bloco of conteudo.blocos) {
    saida.push('### ' + bloco.bloco + '. ' + bloco.titulo);
    saida.push('');
    saida.push('**Objetivo:** ' + bloco.objetivo);
    saida.push('');
    if (bloco.nota) saida.push('*' + bloco.nota + '*', '');
    if (bloco.dimensaoPorItem) {
      saida.push('*A dimensão é marcada item a item — cada item traz a sua.*', '');
    } else {
      saida.push('*Dimensão:* ' + bloco.dimensao, '');
    }

    for (const campo of bloco.campos) {
      const no = nos.find((n) => n.id === campo.id) || {};
      for (const linha of campoEmLinhas(no, registrar, respostaDe(no.id), preenchida)) {
        saida.push(linha);
      }
    }
    saida.push('---', '');
  }
  secoes.push({ titulo: 'Blocos ' + conteudo.blocos[0].bloco + ' a ' + conteudo.blocos[conteudo.blocos.length - 1].bloco, itens: saida.length - inicioBlocos });

  // --- Os módulos condicionais -------------------------------------------
  saida.push('### Os módulos condicionais');
  saida.push('');
  saida.push(
    '**Estes dois blocos são condicionais.** Eles entram quando a aluna ' +
      'declarou experiência prévia no Bloco 1 — isto é, quando o campo «' +
      (noGatilho ? noGatilho.campo : 'conhecimento prévio') +
      '» foi marcado em qualquer nível que não seja «' +
      (noGatilho && noGatilho.valores ? noGatilho.valores[0] : 'nunca fez') +
      '». Se a aluna nunca fez balé, os dois ficam em branco.'
  );
  saida.push('');
  saida.push(
    'Os campos destes módulos não são obrigatórios: a obrigatoriedade deles é ' +
      'condicional à entrada no módulo.'
  );
  saida.push('');

  for (const modulo of conteudo.modulosCondicionais) {
    saida.push('#### ' + modulo.titulo);
    saida.push('');
    saida.push('**Função:** ' + modulo.funcao);
    saida.push('');
    if (modulo.ramificaPor) {
      saida.push('*Ramifica a partir de:* ' + modulo.ramificaPor, '');
    }
    for (const ramo of modulo.ramos || []) {
      for (const linha of ramoEmLinhas(ramo, lacunas)) saida.push(linha);
    }
    for (const campo of modulo.campos || []) {
      const no = nos.find((n) => n.id === campo.id) || {};
      for (const linha of campoEmLinhas(no, registrar, respostaDe(no.id), preenchida)) {
        saida.push(linha);
      }
    }
  }
  saida.push('---', '');

  // --- O ponto de partida ------------------------------------------------
  saida.push('### O ponto de partida');
  saida.push('');
  saida.push(
    'O que se registra é o que a aluna **traz** e o que ela **precisa desenvolver** ' +
      '— nas palavras do professor. É esta a forma em que o dado vive.'
  );
  saida.push('');
  saida.push('Aluna (apelido): ____________________');
  saida.push('');
  saida.push('**Traz:**');
  saida.push('');
  saida.push(TRACO, TRACO, '');
  saida.push('**Precisa desenvolver:**');
  saida.push('');
  saida.push(TRACO, TRACO, '');
  saida.push('---', '');

  // --- O fecho -----------------------------------------------------------
  saida.push('### O que esta ficha não decide');
  saida.push('');
  saida.push('**A lista é aberta.** O mínimo obrigatório é ' + conteudo.listaAberta.minimoObrigatorio + '.');
  saida.push(
    'O que se acrescenta a ele é discricionário: ' + conteudo.listaAberta.discricionario + '.'
  );
  saida.push('**' + conteudo.listaAberta.regra.charAt(0).toUpperCase() + conteudo.listaAberta.regra.slice(1) + '.**');
  saida.push('');

  const markdown = saida.join('\n') + '\n';
  const porFamilia = {};
  for (const no of nos) porFamilia[no.familia] = (porFamilia[no.familia] || 0) + 1;
  const ausentes = nos.map((no) => no.id).filter((id) => impressos.indexOf(id) === -1);

  // A resposta só vira marca onde o nó foi impresso: um envelope que traga um
  // id que a ficha não imprime é resposta que não chegou à página, e o
  // relatório conta as duas coisas separadas de propósito.
  const usadas = Object.keys(respostas).filter((id) => impressos.indexOf(id) !== -1);
  const naoImpressas = Object.keys(respostas).filter((id) => impressos.indexOf(id) === -1);

  return {
    markdown,
    relatorio: {
      documento: conteudo.documento,
      norma: conteudo.norma,
      conteudo: opcoes.conteudo || 'conteudo',
      nos: {
        total: nos.length,
        porFamilia,
        impressos: impressos.length,
      },
      cobertura: ausentes.length === 0 ? 'integral' : 'incompleta',
      ausentes,
      lacunas,
      secoes,
      respostas: {
        usadas: usadas.length,
        naoImpressas,
        desconhecidos,
      },
      // `Buffer` é global do Node, não do Workers runtime: o byte-count UTF-8 usa o
      // TextEncoder (Web Standard, nos dois). É o mesmo número — prova: a ficha sai
      // byte a byte idêntica nos dois adaptadores.
      bytes: new TextEncoder().encode(markdown).length,
      linhas: markdown.split('\n').length - 1,
    },
  };
}

// ---------------------------------------------------------------------------
// A exportação do NÚCLEO da ficha: só lógica pura, sem fs/path/http/process.
// A leitura do conteúdo do disco, o autoteste e a CLI ficam no adaptador
// (ficha/renderizar.js).
// ---------------------------------------------------------------------------

module.exports = {
  ID_DO_METODO,
  valoresDaForma,
  valoresRespondidos,
  caixas,
  linhaDeDesdobramento,
  caixasOuNaoMedido,
  listaDeBlocos,
  metodosDeOrigem,
  noDoGatilho,
  cabecalhoDaFicha,
  campoEmLinhas,
  ramoEmLinhas,
  renderizar,
};