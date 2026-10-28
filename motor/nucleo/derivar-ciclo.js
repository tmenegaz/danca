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

const { respostaDo, emLista } = require('./derivar-po.js');
// O MOTOR DO REGISTRO DE NOTAÇÃO — o alfabeto é dado, e é ele que compõe a grade (20/10/2026).
const moduloNotacao = require('./notacao.js');
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

/** A resposta de um id no envelope (alias curto do `respostaDo` do irmão). */
function resp(envelope, id) {
  return respostaDo(envelope, id);
}

/**
 * Prosa honesta: o valor, ou uma lacuna declarada. Um valor que é o EXEMPLO do gabarito
 * (o template vazado no campo) também vira lacuna — não se publica o exemplo como dado.
 */
const GABARITO_VAZADO = /^(Bloco\s*\|.*proporção alvo|Ex\.:|ex\.:|Exemplo)/i;
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

/** A proporção declarada como percentagem simples («35%» → 35). O que não for uma
 *  percentagem numérica («um terço», «conforme a turma») NÃO se converte: ler prosa não
 *  é derivar. Devolve `null`, e a célula fica lacuna. */
function percentagemDaProporcao(valor) {
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*%/.exec(String(valor == null ? '' : valor));
  return m ? Number(m[1].replace(',', '.')) : null;
}

/** Um número em português, sem zeros à direita: 13.5 → «13,5»; 45 → «45». */
function numeroEmPortugues(n) {
  return String(Math.round(n * 100) / 100).replace('.', ',');
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
function distribuicaoDoTempo(estrutura, volume, volumeTotal) {
  // A distribuição declarada chega na forma da grelha — array de objetos, um por linha.
  // As duas primeiras colunas são o bloco e a proporção, na ordem em que foram gravadas.
  const porBloco = new Map();
  if (Array.isArray(volume)) {
    for (const linha of volume) {
      if (!linha || typeof linha !== 'object' || Array.isArray(linha)) continue;
      const valores = Object.values(linha);
      const nome = String(valores[0] == null ? '' : valores[0]).trim();
      if (!nome) continue;
      porBloco.set(nome.toLowerCase(), valores[1]);
    }
  }
  const linhas = [];
  for (const bloco of estrutura) {
    const proporcao = porBloco.get(nomeDoBloco(bloco).toLowerCase());
    const percentagem = percentagemDaProporcao(proporcao);
    const tempos = percentagem !== null && volumeTotal
      ? numeroEmPortugues((percentagem / 100) * volumeTotal)
      : null;
    const fatia = proporcao === null || proporcao === undefined || String(proporcao).trim() === ''
      ? null
      : String(proporcao).trim();
    linhas.push('| ' + bloco.replace(/—.*$/, '').trim() + ' | ' +
      (tempos || '[Preencher]') + ' | ' + (fatia || '[Preencher]') + ' |');
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
function derivarAula01({ plano, po, contexto, calibracao }) {
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
  const parametroLinhas = parametroEmLinhas(resp(plano, 'aula-1-parametro'),
    marcosEmTexto(resp(plano, 'marcos-por-aula')));
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
  const tituloDaAula = objetivo && !objetivo.startsWith('[Preencher') ? objetivo : 'Aula 01';
  saida.push('title: "Aula 01 — ' + tituloDaAula + '"');
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

  /* A CONDIÇÃO DA AULA DESCEU PARA O CORPO (28/10/2026). Ela era o `subtitle:` do
   * documento — «Sem deslocamento, sem giro, sem mudança de direção» —, e essa é a única
   * coisa que o subtítulo dizia que o corpo não dissesse: por isso sai do cabeçalho como
   * PROSA, e não como decoração. As outras páginas perderam o subtítulo por repetição
   * (referências, notação); esta perdê-lo-ia com informação dentro. */
  saida.push('**Condição desta aula.** Sem deslocamento, sem giro, sem mudança de direção.', '');

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

  // §2 — Condições preliminares.
  secao('2. Condições preliminares de preparação (força e flexibilidade)',
    condicoes.length ? condicoes.map((v) => '- ' + v) : ['- [Preencher: condições preliminares de preparação]']);

  // §3 — A sequência conectada.
  {
    const corpo = [];
    if (estrutura.length) {
      corpo.push('### Distribuição do tempo da aula');
      corpo.push('');
      corpo.push('| Bloco | Tempos | Fatia |');
      corpo.push('|:--|--:|--:|');
      for (const linha of distribuicaoDoTempo(estrutura, linhasDaTabela(resp(plano, 'distribuicao-de-volume')), volumeTotal)) {
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
    secao('3. A sequência conectada (fio condutor)', corpo);
  }

  // §4 — Musicalidade (não derivável do plano: lacuna).
  secao('4. Bloco de musicalidade',
    ['| Item | Trabalho |', '|:--|:--|', '| **Pulso** | [Preencher: trabalho de pulso da Aula 01] |']);

  // §5 — Guia de observação do professor: as dimensões do PO viram as linhas.
  {
    const dims = emLista(resp(po, 'dimensoes-de-observacao')).filter((v) => !GABARITO_VAZADO.test(v));
    const corpo = ['| Dimensão | O que se observa | Como se registra |', '|:--|:--|:--|'];
    if (dims.length) {
      for (const d of dims) corpo.push('| ' + d + ' | [Preencher] | marca por aluno |');
    } else {
      corpo.push('| [Preencher] | [Preencher] | marca por aluno |');
    }
    secao('5. Guia de observação do professor', corpo);
  }

  // §6 — Distribuição do volume físico: o que a sequência não calculou fica lacuna.
  secao('6. Distribuição do volume físico',
    ['| Bloco | Tempos | Fatia |', '|:--|--:|--:|', '| **Total** | **' + (volumeTotal || '[Preencher]') + '** | **100%** |']);

  // §7 — Proveniência consolidada.
  secao('7. Proveniência consolidada',
    ['Documento derivado do plano do ciclo e das fontes do PO. Ciclo **simulado** — a cadeia foi',
     'gerada pelo «Guardar» do PO (proveniência acrescenta, não edita).']);

  // §8 — Registro de auditoria.
  {
    const corpo = ['| Verificação | Resultado |', '|:--|:--|'];
    corpo.push('| Objetivo específico declarado | ' + (objetivo.startsWith('[Preencher') ? 'não' : 'ok') + ' |');
    corpo.push('| Duração declarada (Pré-requisito 4) | ok — ' + duracaoMin + ' minutos |');
    corpo.push('| Volume dentro da faixa (Regra 9) | ' +
      (volumeTotal ? 'ok — ' + volumeTotal + ' tempos em ' + volMin + '–' + volMax : '[Preencher]') + ' |');
    secao('8. Registro de auditoria da aula', corpo);
  }

  // §9 — Próximo passo.
  secao('9. Próximo passo', ['[Preencher: o próximo passo da progressão do ciclo]']);

  return saida.join('\n') + '\n';
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
  return Array.isArray(valor) && valor.some((l) => l && typeof l === 'object' && !Array.isArray(l))
    ? valor.filter((l) => l && typeof l === 'object' && !Array.isArray(l))
    : null;
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

  const composicoes = linhas ? moduloNotacao.comporTodas(linhas, alfabetoDoCiclo) : null;

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
      const legenda = [musica ? musica : 'música ainda não declarada',
        posicao ? posicao.emPalavras : '',
        objetivo ? 'objetivo ' + objetivo : '']
        .filter(Boolean).join(' · ');
      saida.push('*' + legenda + '*');
      saida.push('');
      saida.push('| Compasso | Contagem | Notação | Descrição |');
      saida.push('|:--:|:--:|:--|:--|');

      if (c.estado === 'lacuna') {
        // A LACUNA NÃO ESCONDE O MOTIVO. Uma célula vazia diria «não sei»; a frase diz o que falta.
        saida.push('| — | — | [Preencher: notação do exercício] | ' + c.detalhe + ' |');
      } else {
        for (const s of c.segmentos) {
          saida.push('| ' + s.compasso + ' | ' + s.contagem + ' | `' + s.bloco + '` | ' + s.descricao + ' |');
        }
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
  const composicoes = linhas && alfabeto ? moduloNotacao.comporTodas(linhas, alfabeto) : null;
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
function dimensoesEItens(po) {
  const dimensoes = emLista(resp(po, 'dimensoes-de-observacao')).filter((v) => !GABARITO_VAZADO.test(v));
  const cru = resp(po, 'itens-por-dimensao');
  const porDimensao = new Map();

  // Forma canónica (repetirPor): uma lista de `{sujeito: <dimensão>, itens: <texto>}`.
  for (const r of Array.isArray(cru) ? cru : []) {
    if (!r || typeof r !== 'object') continue;
    const dim = String(r.sujeito || r.dimensao || '').trim();
    const itens = emLista(r.itens).filter((v) => !GABARITO_VAZADO.test(v));
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

  // Dimensões sem itens (o professor marcou a dimensão mas não escreveu os itens).
  return dimensoes.map((d) => ({ dimensao: d, itens: porDimensao.get(d) || [] }));
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
function declaracaoDeCaptura({ po, escola }) {
  const dims = dimensoesEItens(po);
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
  blocos['Linha de base revisitada (P-10)'] = {
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
  const blocos = {};
  for (const [titulo, bloco] of Object.entries(derivada.blocos || {})) {
    const velho = anterior.blocos[titulo];
    if (!velho) { blocos[titulo] = bloco; continue; }
    const colunas = {};
    for (const [rotulo, coluna] of Object.entries(bloco.colunas || {})) {
      const jaEra = velho.colunas && velho.colunas[rotulo];
      colunas[rotulo] = jaEra ? { chave: jaEra.chave, tipo: jaEra.tipo } : coluna;
    }
    blocos[titulo] = {
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
function derivarCaptura({ po, contexto }) {
  const sujeitos = emLista(resp(po, 'sujeitos')).filter((v) => !GABARITO_VAZADO.test(v));
  const flutuantes = emLista(resp(po, 'flutuantes')).filter((v) => !GABARITO_VAZADO.test(v));
  const linhaDeBase = Array.isArray(resp(po, 'linha-de-base')) ? resp(po, 'linha-de-base') : [];
  const dims = dimensoesEItens(po);
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
    (flutuantes.length ? ' · **Flutuantes:** ' + flutuantes.join(', ') : '') +
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
  });

  saida.push('## Linha de base revisitada');
  saida.push('');
  const linhasDeBase = linhaDeBase.filter((i) => i && typeof i === 'object');
  if (linhasDeBase.length) {
    for (const item of linhasDeBase) {
      const aluna = String(item.sujeito || item.aluno || '[Preencher: aluna]');
      const precisa = String(item.precisaDesenvolver || item.precisa || '[Preencher]');
      saida.push('### ' + aluna);
      saida.push('');
      saida.push('| O que o PO declara que precisa desenvolver | Observado na aula |');
      saida.push('|:--|:--:|');
      for (const p of emLista(precisa)) saida.push('| ' + p + ' | |');
      saida.push('');
    }
  } else {
    saida.push('### [Preencher: aluna]');
    saida.push('');
    saida.push('| O que o PO declara que precisa desenvolver | Observado na aula |');
    saida.push('|:--|:--:|');
    saida.push('| [Preencher] | |');
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
    ['PO · flutuantes', resp(po, 'flutuantes')],
  ];
  const linhasDeBase = Array.isArray(resp(po, 'linha-de-base')) ? resp(po, 'linha-de-base') : [];
  for (const item of linhasDeBase) {
    if (!item || typeof item !== 'object') continue;
    campos.push(['PO · linha de base (' + String(item.sujeito || item.aluno || '?') + ')',
      [item.traz, item.precisaDesenvolver].filter(Boolean).join(' ')]);
  }
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
  varrerJuizo,
};
