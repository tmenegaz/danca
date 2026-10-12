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

  const objetivo = prosa(resp(plano, 'aula-1-objetivo'), 'objetivo específico da Aula 01');
  const parametro = prosa(resp(plano, 'aula-1-parametro'), 'parâmetro de medição da Aula 01');
  const sequencia = emLista(resp(plano, 'aula-1-sequencia')).filter((v) => !GABARITO_VAZADO.test(v));
  const estrutura = emLista(resp(plano, 'estrutura-de-cada-aula')).filter((v) => !GABARITO_VAZADO.test(v));
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
  saida.push('subtitle: "Sem deslocamento, sem giro, sem mudança de direção"');
  saida.push('objetivo-especifico: "' + (String(resp(plano, 'aula-1-objetivo') || '').trim() || '[Preencher]') + '"');
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
      for (const b of estrutura) corpo.push('| ' + b.replace(/—.*$/, '').trim() + ' | [Preencher] | [Preencher] |');
      corpo.push('| **Total** | **' + (volumeTotal || '[Preencher]') + '** | **100%** |');
      corpo.push('');
    }
    corpo.push('### Sequência declarada');
    corpo.push('');
    if (sequencia.length) {
      for (const s of sequencia) corpo.push('- ' + s);
    } else {
      corpo.push('- [Preencher: a sequência conectada da Aula 01]');
    }
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
  saida.push('subtitle: "Fontes que sustentam o recorte e a progressão do Ciclo ' + ciclo + '"');
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

function derivarNotacao({ plano, contexto }) {
  const notacao = notacaoEscolhida(plano);
  if (!notacao) return null;

  const sequencia = emLista(resp(plano, 'aula-1-sequencia')).filter((v) => !GABARITO_VAZADO.test(v));
  const saida = [];
  const ciclo = String((contexto && contexto.ciclo) || 'NN');

  saida.push('---');
  saida.push('projeto: Formação em Balé Clássico');
  saida.push('frente: Documento de apoio');
  saida.push('ciclo: "' + ciclo + '"');
  saida.push('title: "Notação em ' + notacao + '"');
  saida.push('subtitle: "Registro dos exercícios da Aula 01 para repetição sem depender da memória"');
  saida.push('---');
  saida.push('');
  saida.push('## Aviso de proveniência (leia antes de usar)');
  saida.push('');
  saida.push('Este documento **não é uma transcrição do sistema ' + notacao + '**. É um **código do');
  saida.push('ciclo**: um conjunto pequeno de sinais, **baseado em conceitos do sistema**, com o qual os');
  saida.push('exercícios deste ciclo podem ser lidos de volta sem depender da memória de quem deu a aula.');
  saida.push('');
  saida.push('> **Nota (P-15).** Um ciclo que registra exercícios em notação declara o código usado. Este');
  saida.push('> código é do ciclo — os sinais valem para os exercícios registrados aqui, e um sinal novo');
  saida.push('> exige uma linha nova no [Glossário do código ' + notacao + '](glossario-' + slugDe(notacao) + '.html).');
  saida.push('');
  saida.push('## Exercícios da Aula 01');
  saida.push('');
  saida.push('| Exercício | Registro |');
  saida.push('|:--|:--|');
  if (sequencia.length) {
    for (const s of sequencia) saida.push('| ' + s + ' | [Preencher: notação do exercício] |');
  } else {
    saida.push('| [Preencher: exercício] | [Preencher: notação do exercício] |');
  }
  saida.push('');
  saida.push('> **Sobre os símbolos:** os sinais deste código são digitáveis e legíveis numa folha');
  saida.push('> impressa. Nenhum deles substitui a escrita completa do sistema — eles **apontam** para a');
  saida.push('> frase, e a frase é que é a aula.');
  return saida.join('\n') + '\n';
}

function derivarGlossario({ plano, contexto }) {
  const notacao = notacaoEscolhida(plano);
  if (!notacao) return null;

  const saida = [];
  const ciclo = String((contexto && contexto.ciclo) || 'NN');

  saida.push('---');
  saida.push('projeto: Formação em Balé Clássico');
  saida.push('frente: Documento de apoio');
  saida.push('ciclo: "' + ciclo + '"');
  saida.push('title: "Glossário do código ' + notacao + ' do ciclo"');
  saida.push('subtitle: "Todo símbolo, termo e categoria que aparece no registro da Aula 01"');
  saida.push('---');
  saida.push('');
  saida.push('> **Aviso de proveniência (Regra 8).** Este glossário explica um **código do ciclo**, não o');
  saida.push('> sistema ' + notacao + '. Cada verbete declara a sua **origem**: *sistema* ou *convenção do ciclo*.');
  saida.push('');
  saida.push('> **Nota (P-15/P-16).** O glossário e o registro são um par: um símbolo só existe no registro');
  saida.push('> se tiver verbete aqui, e todo verbete aqui aponta para onde aparece.');
  saida.push('');
  saida.push('## Índice de símbolos');
  saida.push('');
  saida.push('| Símbolo | Nome | Onde aparece no registro |');
  saida.push('|:---:|:---|:---|');
  saida.push('| `[` | abre bloco | em todos os blocos de notação |');
  saida.push('| `]` | fecha bloco | em todos os blocos de notação |');
  saida.push('| `:` | dois-pontos | em todos os blocos de notação |');
  saida.push('');
  saida.push('## Convenções de escrita do ciclo');
  saida.push('');
  saida.push('### `[` — abre bloco {#abre-bloco}');
  saida.push('');
  saida.push('- **Significado:** início de um bloco de notação.');
  saida.push('- **Origem:** convenção do ciclo.');
  saida.push('');
  saida.push('### `]` — fecha bloco {#fecha-bloco}');
  saida.push('');
  saida.push('- **Significado:** fim de um bloco de notação.');
  saida.push('- **Origem:** convenção do ciclo.');
  saida.push('');
  saida.push('### `:` — dois-pontos {#dois-pontos}');
  saida.push('');
  saida.push('- **Significado:** separa a categoria do conteúdo no bloco.');
  saida.push('- **Origem:** convenção do ciclo.');
  saida.push('');
  saida.push('> **[Preencher: verbetes dos sinais do ciclo]** — cada exercício registrado na');
  saida.push('> [Notação em ' + notacao + '](notacao.html) que introduza um sinal novo ganha aqui o seu verbete');
  saida.push('> (P-16).');
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
 * A declaração `porVariante` da captura: um bloco por dimensão (as colunas são os itens) e,
 * por fim, o bloco fixo da linha de base revisitada (P-10). Os TÍTULOS e os RÓTULOS de coluna
 * são os MESMOS que o Markdown da folha emite — é o que o `validar-captura-ciclo.js` confere.
 */
function declaracaoDeCaptura({ po, escola }) {
  const dims = dimensoesEItens(po);
  const blocos = {};
  dims.forEach((d, i) => {
    const titulo = 'Bloco ' + (i + 1) + ' — ' + d.dimensao;
    const colunas = {};
    for (const item of d.itens) {
      const rotulo = rotuloDoItem(item);
      colunas[rotulo] = { chave: slugDe(rotulo), tipo: 'marca' };
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
  saida.push('> classificação (P-06). Marcação: ✓ aconteceu · ~ parcial · X não aconteceu · ? não vi · vazio = não observei.');
  saida.push('');

  const presentes = sujeitos.length ? sujeitos.join(' ☐ ') : '☐ [Preencher: alunas]';
  saida.push('**Data:** `___/___/____` · **Presentes:** ☐ ' + presentes +
    (flutuantes.length ? ' · **Flutuantes:** ' + flutuantes.join(', ') : '') +
    ' · **Início:** `__:__` · **Fim:** `__:__` · **Duração efetiva:** `___ min`');
  saida.push('');

  saida.push('## Condições de contorno (P-11)');
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

  saida.push('## Linha de base revisitada (P-10)');
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
  saida.push('**Fecho da aula (preencher no fim):** **Estrutura** ☐ solo ☐ barra ☐ centro ☐ presença · **Duração executada** `_____` min');
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
    const texto = String(valor || '');
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
  const escola = nomeDaEscola(contexto);
  const achados = varrerJuizo(plano, po);

  const saida = [];
  // O `title:` é o RÓTULO do menu (a `rotulo()` do gerador lê o front-matter);
  // sem ele o item sairia vazio na navegação. O H1 abaixo continua a linha
  // comprida com ciclo/escola — o título do menu é o rótulo curto.
  saida.push('title: "Harmonização de linguagem"');
  saida.push('subtitle: "O varrimento de juízo de valor (P-21) — a proposta, não o filtro"');
  saida.push('');
  saida.push('# Harmonização de linguagem — Ciclo ' + ciclo + ' — ' + escola);
  saida.push('');
  saida.push('> Esta tabela é **visível ao professor**. Se ele discordar de alguma harmonização, ele');
  saida.push('> reescreve a coluna "Publicado" com as próprias palavras. O harmonizador é uma');
  saida.push('> **proposta**, não um filtro.');
  saida.push('');
  saida.push('## Varrimento automático (P-21)');
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
  saida.push('  a série de pés", não "é frágil" (P-06/P-22).');
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
  derivarHarmonizacao,
  notacaoEscolhida,
  dimensoesEItens,
  varrerJuizo,
};
