'use strict';

/* A DECLARAÇÃO DOS EIXOS — uma só, partilhada com o gerador e com o cartão (04/11/2026). */
const { EIXOS, blocoDaDimensao, eixoDoBloco } = require('./eixos.js');

/**
 * derivar-po.js — o envelope elicitado vira a FONTE do PO (`ciclo-XX-<escola>-po.md`).
 *
 * A geração não lê o envelope: lê a FONTE — o Markdown `## Seção`/`### Subcampo` que
 * `tools/validar-po-ciclo.js` extrai para o `po-XX.json` do pacote (e que
 * `tools/hash-ciclo.sh` ancora). Este módulo é a PONTE entre os dois: pega as respostas do
 * envelope do PO e emite o Markdown da fonte.
 *
 * Nada aqui inventa dado: o que o formulário não perguntou sai como lacuna declarada
 * (`[Preencher: …]`), a mesma notação da fonte atual. A ordem das seções, os títulos e os
 * nomes dos subcampos são os do contrato de extração (`tools/lib-extracao-md.js`), lidos do
 * mapa de `tools/validar-po-ciclo.js` — não de uma cópia.
 *
 * Fronteira: puro (sem `fs`/`path`/`http`/`process`). Recebe o envelope e devolve o Markdown.
 * É o irmão do `derivar-plano.js` (que deriva o PLANO da ramificação) — mas este deriva a
 * FONTE do recorte, no sentido inverso da elicitação.
 */

// A resposta do envelope pode vir crua ou como registro `{valor, origem, respondente, nota}`.
function valorDe(resposta) {
  if (resposta === null || resposta === undefined) return null;
  if (typeof resposta === 'object' && !Array.isArray(resposta) && 'valor' in resposta) {
    return resposta.valor;
  }
  return resposta;
}

// A resposta de um id no envelope, desembrulhada; `null` se ausente.
function respostaDo(envelope, id) {
  const respostas = (envelope && envelope.respostas) || {};
  const cru = respostas[id];
  if (cru === undefined) return null;
  return valorDe(cru);
}

// Um valor que o formulário guarda como texto corrido vira lista, uma linha por item.
// A regra vem do prompt (congelado): «as listas saem como listas — uma linha por item».
function emLista(valor) {
  if (valor === null || valor === undefined || valor === '') return [];
  if (Array.isArray(valor)) return valor.map(String).filter((v) => v.trim() !== '');
  return String(valor)
    .split(/\n+/)
    .map((v) => v.replace(/^[-*]\s+/, '').replace(/;\s*$/, '').trim())
    .filter((v) => v !== '');
}

/**
 * OS ITENS DE UMA DIMENSÃO — o `;` TAMBÉM SEPARA (01/11/2026).
 *
 * DEFEITO MEDIDO, e é o que faz a folha mentir. O `emLista` corta por LINHA e trata o `;` como
 * pontuação final — o que está certo para uma lista de prosa. Mas o campo «Itens observados» é
 * preenchido em linha corrida («alinhamento do pé de apoio; eixo do corpo na preparação»), e a
 * resposta da `batata` está exactamente assim. O efeito, medido na folha publicada:
 *
 *   o PO declara 4 dimensões × 2 itens = 8 itens
 *   a folha de captura sai com 4 COLUNAS, cada uma com dois critérios no cabeçalho
 *     «alinhamento do pé de apoio; eixo do corpo na preparação»
 *
 * O professor dá UM nível de rubrica a DOIS critérios que ele declarou separados, e nunca
 * consegue dizer «o eixo está bem, o pé não» — que é precisamente a distinção que ele escreveu.
 * E a unidade de tudo o resto depende disto: uma janela de itens sobre colunas que já agregam
 * dois itens é uma janela de gavetas.
 *
 * A CORRECÇÃO É AQUI, E NÃO NO `emLista`: o `;` é pontuação legítima numa frase de lista (o
 * `referencias`, por exemplo), e alargar a regra geral para todos os campos mudaria o sentido
 * de respostas que estão certas. O que separa itens é uma pergunta do CAMPO, não do formato.
 */
function itensDaDimensao(valor) {
  if (valor === null || valor === undefined || valor === '') return [];
  if (Array.isArray(valor)) {
    return valor.map(String).map((v) => v.trim()).filter((v) => v !== '')
      .reduce((todos, v) => todos.concat(itensDaDimensao(v)), []);
  }
  return String(valor)
    .split(/[\n;]+/)
    .map((v) => v.replace(/^[-*]\s+/, '').trim())
    .filter((v) => v !== '');
}

// A COMPOSIÇÃO DOS VALORES ESTRUTURADOS — o formulário grava o NÚMERO + a UNIDADE como
// objeto (`{vezes, por, dias}`, `{min, max, unidade}`, `{numero, unidade}` ou `{inicio, fim}`),
// e quem lê o envelope compõe o texto. Nada aqui inventa: o que veio vazio sai como `null`.
// Ficam AQUI (e não no derivar-plano) porque o PO também precisa compor os valores que lê do
// plano referenciado — e este módulo é a base sem dependências.
function comporPeriodicidade(v) {
  if (!v || typeof v !== 'object') return null;
  const partes = [];
  if (v.vezes !== null && v.vezes !== undefined) partes.push(String(v.vezes) + 'x');
  if (v.por) partes.push(v.por);
  if (Array.isArray(v.dias) && v.dias.length) partes.push('— ' + v.dias.join(' e '));
  return partes.length ? partes.join(' ') : null;
}

function comporMedida(v) {
  if (!v) return null;
  if (Array.isArray(v)) {
    /* A UNIDADE É UM IDENTIFICADOR, E AO LADO DE UM NÚMERO ELA CONCORDA COM ELE.
     * O conteúdo declara `hora` e `minuto` (os valores do widget), e o documento escrevia
     * «50 minuto». Pluraliza-se ao escrever, que é onde a palavra vira português. */
    const palavra = (n, u) => (Number(n) === 1 ? u : u + 's');
    const partes = v.map((p) => {
      const n = p && p.numero !== null && p.numero !== undefined ? String(p.numero) : '';
      return n + (p && p.unidade ? ' ' + palavra(n, p.unidade) : '');
    });
    return partes.length ? partes.join(' ') : null;
  }
  if (typeof v !== 'object') return String(v) || null;
  if (v.min !== null && v.min !== undefined && v.max !== null && v.max !== undefined) {
    return String(v.min) + '–' + String(v.max) + (v.unidade ? ' ' + v.unidade : '');
  }
  if (v.min !== null && v.min !== undefined) {
    return String(v.min) + (v.unidade ? ' ' + v.unidade : '');
  }
  if (v.numero !== null && v.numero !== undefined) {
    return String(v.numero) + (v.unidade ? ' ' + v.unidade : '');
  }
  return null;
}

function comporData(v) {
  if (!v || typeof v !== 'object') return null;
  const partes = [v.inicio, v.fim].filter((p) => p);
  return partes.length ? partes.join(' → ') : null;
}

// Uma lacuna declarada — o formulário não perguntou, e não se inventa a resposta.
const LACUNA_NORMA =
  '[Preencher: padrão — descreva o padrão de referência contra o qual a execução deste ciclo será confrontada]';

// O título do documento, no mesmo formato da fonte atual.
function tituloDoPO(contexto) {
  const escola = (contexto && contexto.escola) || 'Escola';
  const ciclo = (contexto && contexto.ciclo) || 'NN';
  return 'Plano de Observação do Ciclo ' + ciclo + ' — ' + escola;
}

// O ESTADO vem do checklist: todos marcados ⇒ validado; senão, aguardando (a norma segue
// sem marcar, como na fonte atual).
function estadoDoPO(checklist) {
  const marcados = Object.values(checklist || {});
  return marcados.length > 0 && marcados.every((v) => v === true) ? 'Input_PO_Validado' : 'Input_PO_Aguardando';
}

/**
 * A LINHA DE BASE DO PO VEM DO ACTO DA TURMA — e não de uma cópia no envelope (06/11/2026).
 *
 * O QUE MUDOU, e porquê. Até hoje o PO perguntava, por aluna, «o que traz / o que precisa
 * desenvolver» — e isso passou a ser o passo 3 e o passo 4 do Corpo da linha de base: a leitura
 * cruza a anamnese e o recorte escolhe os aspectos. Perguntá-lo outra vez no PO era pedir ao
 * professor que reescrevesse, à mão, o que ele acabou de decidir em quatro passos — e as duas
 * versões podiam discordar sem que nada falhasse. Palavras dela: «a linha de base que a gente
 * construiu já atende a esses itens… o motivo da remoção é redundância».
 *
 * O QUE O DOCUMENTO IMPRIME: o RECORTE, agrupado como o professor o viu no passo 4 — um grupo por
 * linha, e só os grupos que têm aspectos escolhidos. É a mesma arrumação da tabela dos outros
 * eixos (a dimensão e o que nela se observa), e é o que o validador lê como `linhaDeBase`.
 *
 * `recorte` é `[{ id, nome, grupo }]` — os campos do acto (`campos` no ficheiro da versão).
 */
function tabelaDoRecorte(recorte) {
  const cabecalho = ['| Grupo | Aspectos observados |', '|:--|:--|'];
  const grupos = agruparRecorte(recorte);
  if (!grupos.length) return cabecalho.concat(['| — | [a decidir: a linha de base da turma não '
    + 'tem recorte do corpo] |']);
  for (const g of grupos) cabecalho.push('| **' + g.grupo + '** | ' + g.aspectos.join('; ') + ' |');
  return cabecalho;
}

/**
 * O RECORTE AGRUPADO — só os grupos que têm aspectos, na ordem em que o acto os guarda.
 *
 * A ORDEM É A DO ACTO, e não alfabética: o professor escolheu os aspectos percorrendo a anamnese,
 * e a lista que ele revê tem de aparecer como ele a construiu. Ordenar aqui seria uma segunda
 * opinião sobre a mesma lista.
 */
function agruparRecorte(recorte) {
  const por = new Map();
  for (const c of (Array.isArray(recorte) ? recorte : [])) {
    if (!c || typeof c !== 'object') continue;
    const nome = String(c.nome || c.id || '').trim();
    if (!nome) continue;
    const grupo = String(c.grupo || '').trim() || 'Corpo';
    if (!por.has(grupo)) por.set(grupo, []);
    por.get(grupo).push(nome);
  }
  return [...por.entries()].map(([grupo, aspectos]) => ({ grupo, aspectos }));
}

/** A linha de base que a derivação recebeu: `{ nome, em, turma, alunas, recorte }`. */
function linhaDeBaseDoActo(opcoes) {
  const lb = (opcoes && opcoes.linhaDeBase) || null;
  if (!lb || typeof lb !== 'object') return null;
  return {
    nome: String(lb.nome || lb.id || '').trim(),
    em: lb.em || null,
    turma: String(lb.turma || '').trim(),
    alunas: Array.isArray(lb.alunas) ? lb.alunas.map((a) => String(a)).filter(Boolean) : [],
    recorte: Array.isArray(lb.recorte) ? lb.recorte : [],
  };
}

// As seis folhas do checklist, na ordem do conteúdo (e do schema): id → chave do objeto.
const CHECKLIST = [
  ['checklist-fenomeno-definido', 'phenomenonOperationallyDefined'],
  ['checklist-fronteiras-claras', 'scopeBoundariesClear'],
  ['checklist-norma-estabelecida', 'normClearlyEstablished'],
  ['checklist-criterios-exclusivos', 'criteriaMutuallyExclusive'],
  ['checklist-justificativa-fundada', 'justificationGrounded'],
  ['checklist-recorte-viavel', 'cutFeasible'],
];

// A resposta EXPLÍCITA de uma folha do checklist: `sim` | `não` | `null` (não marcada).
// O professor declara «não» de propósito (é um achado); a ausência é outra coisa.
function respostaExplicitaDaFolha(valor) {
  const cru = String(valor || '').trim().toLowerCase();
  if (cru === 'sim') return 'sim';
  if (cru === 'não' || cru === 'nao') return 'não';
  return null;
}

// Um valor está «presente» quando traz conteúdo legível (lista não vazia ou texto).
function presente(valor) {
  if (valor === null || valor === undefined) return false;
  if (Array.isArray(valor)) return valor.some((v) => String(v || '').trim() !== '');
  return String(valor).trim() !== '';
}

// A INFERÊNCIA de uma folha — o «pré-preenchido» do checklist (Bloco 4 do pedido): quando o
// professor não marcou, o que ele JÁ respondeu decide.
//
// A REGRA É DO CONTEÚDO (19/10/2026). Ela vivia aqui, num `switch` que ninguém via do lado do
// formulário — e por isso a folha dizia «pré-preenchido» na tela e chegava ao documento em
// branco: eram dois juízos sobre o mesmo dado, e só um deles corria no formulário. Agora o
// conteúdo declara, em `derivadoDe`, de que campos cada folha se lê (`qualquer`: basta um com
// conteúdo; `doPlano`: lê no plano referenciado, não no envelope; `sempre`: o valor por
// omissão, quando nenhum campo decide), e as duas pontas aplicam a MESMA declaração.
const SEM_DECLARACAO = {
  phenomenonOperationallyDefined: ['fenomeno'],
  scopeBoundariesClear: ['contexto', 'explicacao-do-recorte'],
  normClearlyEstablished: ['contexto-metodologia'],
  criteriaMutuallyExclusive: [],
  justificationGrounded: ['referencia-ao-problema', 'base-teorica'],
  cutFeasible: ['o-que-fica-de-fora', 'explicacao-do-recorte'],
};

function inferirFolha(chave, envelope, plano, declaracao) {
  const noEnvelope = (id) => presente(respostaDo(envelope, id));
  const noPlano = (id) => presente(respostaDo(plano, id));

  const regra = declaracao || { qualquer: SEM_DECLARACAO[chave] || [] };
  if (regra.sempre !== undefined) {
    const cru = String(regra.sempre || '').trim().toLowerCase();
    return cru === 'sim';
  }
  const fonte = regra.doPlano ? noPlano : noEnvelope;
  return (regra.qualquer || []).some((id) => fonte(id));
}

// A folha resolvida: a resposta explícita vence; sem ela, a inferência preenche.
function folhaDoChecklist(chave, valor, envelope, plano, declaracao) {
  const explicita = respostaExplicitaDaFolha(valor);
  if (explicita === 'sim') return true;
  if (explicita === 'não') return false;
  return inferirFolha(chave, envelope, plano, declaracao);
}

// O nome humano de cada folha do checklist — o professor lê o nome, o extrator lê a chave.
//
// ESTES RÓTULOS SÃO OS DO CONTEÚDO, e aqui são só a RESERVA: quem gera o PO passa os rótulos do
// conteúdo (`opcoes.rotulos`, vindo de `porta/po/conteudo/po.json`). Quatro deles já tinham
// derivado do campo que o formulário mostra («Fronteiras do escopo claras» → «Fronteiras claras»,
// «Norma claramente estabelecida» → «Padrão estabelecido», «Critérios mutuamente exclusivos» →
// «Critérios que não se sobrepõem», «Justificativa fundamentada» → «Justificação com base»): o
// professor marcava um item e o documento assinava outro. A prova
// (`experimentos/provar-po-completo.js`) confere este mapa contra o conteúdo, para a reserva não
// voltar a derivar em silêncio.
const ROTULO_DO_CHECKLIST = {
  phenomenonOperationallyDefined: 'Fenómeno definido de forma observável',
  scopeBoundariesClear: 'Fronteiras do escopo claras',
  normClearlyEstablished: 'Norma claramente estabelecida',
  criteriaMutuallyExclusive: 'Critérios mutuamente exclusivos',
  justificationGrounded: 'Justificativa fundamentada',
  cutFeasible: 'Âmbito viável',
};

/** Os rótulos do checklist, por id do nó — o que o conteúdo declara (para quem os tem à mão). */
function rotulosDoChecklist(conteudoPO) {
  const mapa = {};
  const blocos = (conteudoPO && conteudoPO.blocos) || [];
  for (const bloco of blocos) {
    for (const campo of bloco.campos || []) {
      if (campo && campo.id && campo.campo) mapa[campo.id] = campo.campo;
    }
  }
  return mapa;
}

/**
 * A DECLARAÇÃO da inferência, por id do nó — o `derivadoDe` que o conteúdo escreve em cada
 * folha do checklist. O formulário e o documento têm de ler a MESMA regra: quando cada um tinha
 * a sua, a tela mostrava «pré-preenchido» e o documento saía em branco.
 */
function derivadosDoChecklist(conteudoPO) {
  const mapa = {};
  const blocos = (conteudoPO && conteudoPO.blocos) || [];
  for (const bloco of blocos) {
    for (const campo of bloco.campos || []) {
      if (campo && campo.id && campo.derivadoDe) mapa[campo.id] = campo.derivadoDe;
    }
  }
  return mapa;
}

/**
 * A derivação: o envelope elicitado vira o Markdown da fonte do PO.
 *
 * `envelope` — o documento que o motor gravou (`{respostas, contexto, id, …}`).
 * Devolve `{ markdown, meta, checklist, estado }`, onde `meta` é o cabeçalho YAML e
 * `checklist` é o objeto das seis folhas (para o relatório e o `state`).
 *
 * `plano` (opcional) — o envelope do PLANO DE ENSINO referenciado. O PO não duplica o
 * contexto (escola/turma/frequência/duração/calendário/volume/registro): ele o LÊ do plano
 * na geração. Sem `plano`, essas partes saem como lacuna declarada — nunca se inventa dado.
 */

// A CONDIÇÃO DE REGISTRO em texto — quem está na sala e quem observa. Ela deixou de ser prosa:
// o professor MARCA (o professor e as alunas já vêm marcados; o observador, ele escolhe). Aqui
// ela volta a ser a frase que o documento lê — a mesma no PO e no plano. Um valor em texto
// (plano antigo) passa como veio: proveniência não reescreve.
function condicaoDeRegistroEmTexto(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'object' || Array.isArray(valor)) {
    const texto = String(valor).trim();
    return texto || null;
  }
  const lista = (v) => (Array.isArray(v)
    ? v.map((x) => String(x == null ? '' : x).trim()).filter(Boolean)
    : []);
  const presentes = lista(valor.presentes);
  const observa = lista(valor.observa);
  const partes = [];
  if (presentes.length) partes.push('na sala: ' + presentes.join(', '));
  if (observa.length) partes.push('observa: ' + observa.join(', '));
  const outro = String(valor.outro == null ? '' : valor.outro).trim();
  if (outro) partes.push('outra condição: ' + outro);
  if (!partes.length) return null;
  const frase = partes.join(' · ');
  return frase.charAt(0).toUpperCase() + frase.slice(1) + '.';
}

// ---------------------------------------------------------------------------
// OS RÓTULOS DO CONTEXTO — a FONTE ÚNICA dos pares que o PO compõe lendo o PLANO.
//
// Eles estavam escritos à mão em DOIS derivadores (`derivar-po.js` e `derivar-plano-ciclo.js`,
// que derivam o PO e o plano), e três já tinham derivado do rótulo que o formulário mostra
// (`Turmas` onde o campo é «Turma observada», `Escola` onde é «Escola / espaço»): o professor
// lia um nome no formulário e outro no documento. Aqui eles são declarados UMA vez, e a prova
// (`experimentos/provar-po-completo.js`) confere cada um contra o `campo` declarado no conteúdo
// do plano (`porta/plano/conteudo/plano.json`) — que é onde o formulário os lê.
const ROTULOS_DO_CONTEXTO = {
  'contexto-escola': 'Escola / espaço',
  'contexto-professor': 'Professor responsável',
  'contexto-turma': 'Turma observada',
  'contexto-frequencia': 'Frequência semanal',
  'contexto-duracao': 'Duração por aula',
  'contexto-calendario': 'Calendário',
  'contexto-total-aulas': 'Número total de aulas',
  'contexto-volume': 'Volume de trabalho',
  'contexto-registro': 'Condição de registro',
  'contexto-metodologia': 'Metodologia de referência',
  'contexto-notacao': 'Notação dominada',
};

// Os COMPOSITORES: o valor CRU do envelope do plano vira o texto que o documento lê. O plano
// guarda o número e a unidade como OBJETO (`{vezes, por, dias}`, `{min, unidade}`), a turma como
// LISTA e o registro como marcação — e cada um tem a sua composição. Sem esta tabela, o
// `comporLinhasDePlano` genérico escreveria `[object Object]` no documento.
const COMPOR_DO_CONTEXTO = {
  'contexto-turma': (v) => {
    const turmas = emLista(v);
    return turmas.length ? turmas.join(' · ') : null;
  },
  'contexto-frequencia': comporPeriodicidade,
  'contexto-duracao': comporMedida,
  'contexto-calendario': comporData,
  'contexto-volume': comporMedida,
  'contexto-registro': condicaoDeRegistroEmTexto,
};

// Uma linha `Rótulo: valor` composta, pulando o que não veio; `[a decidir]` quando nada veio.
// Os pares chegam por ID do plano (`contexto-*`) e o rótulo vem do mapa acima: quem chama não
// repete o nome do campo, e não há como o documento divergir do formulário em silêncio.
// `substituicoes` troca o valor de um id (o PO lê a ESCOLA dele, não a do plano).
function comporLinhasDePlano(plano, ids, substituicoes) {
  const troca = substituicoes || {};
  const linhas = [];
  for (const id of ids) {
    const cru = Object.prototype.hasOwnProperty.call(troca, id)
      ? troca[id] : respostaDo(plano, id);
    const compor = COMPOR_DO_CONTEXTO[id];
    const composto = (compor ? compor(cru) : cru);
    const rotulo = ROTULOS_DO_CONTEXTO[id] || id;
    const vazio = composto === null || composto === undefined || composto === '';
    linhas.push(rotulo + ': ' + (vazio ? '[a decidir]' : String(composto)));
  }
  return linhas.join(' · ');
}

// O CAMPO EMPÍRICO do PO (escola, turma, frequência, duração por aula). A escola é do PO
// (a declaração própria do âmbito); turma, frequência e duração vêm do plano referenciado.
function comporCampoEmpirico(envelope, plano) {
  const escola = respostaDo(envelope, 'campo-escola') || respostaDo(plano, 'contexto-escola');
  /* O «OUTRO DADO DO CAMPO» SAIU (06/11/2026). Era uma caixa livre para o que o plano não previa —
   * e o que o plano prevê passou a ser a linha de base da turma: a escola, o elenco e o recorte do
   * corpo. Uma caixa de «o resto» ao lado de um dado que já existe é onde se escreve a segunda
   * versão do mesmo facto. Palavras dela: «a gente já atendeu esses dois quando fizemos as
   * separações… então isso aqui está redundante». */
  return comporLinhasDePlano(plano, ['contexto-escola', 'contexto-turma',
    'contexto-frequencia', 'contexto-duracao'], { 'contexto-escola': escola });
}

// O CONTEXTO do PO (calendário, volume de trabalho, condição de registro) — tudo lido do plano
// referenciado. O `contexto-outro` saiu pela mesma razão do `campo-outro` (06/11/2026).
function comporContexto(envelope, plano) {
  return comporLinhasDePlano(plano,
    ['contexto-calendario', 'contexto-volume', 'contexto-registro']);
}

// A METODOLOGIA E A NOTAÇÃO — declaradas, nunca deduzidas (P-16). Vivem no PLANO referenciado
// (o PO não as re-coleta: ele as lê na geração, como o campo empírico e o contexto). É o
// «ligar» do laudo L5: hoje ficavam presas no plano e não chegavam ao PO. Sem plano (ou sem
// valor), a lacuna sai declarada — nunca se preenche por inferência.
function comporMetodologiaENotacao(plano) {
  // «QUEM ESCOLHE A METODOLOGIA» SAIU (03/11/2026). Era um item do Bloco 1 do plano («Eu escolho ·
  // A escola impõe»), e a resposta deixou de ser perguntável: a premissa é do domínio e é
  // permanente — «o professor escolhe, a metodologia pertence ao professor». Um facto que não
  // varia com o ciclo não se pergunta ciclo a ciclo; perguntá-lo sugeria que podia variar.
  return comporLinhasDePlano(plano, ['contexto-metodologia', 'contexto-notacao']);
}

// O VALOR de um campo de PROSA, ou a lacuna declarada. O `null` do envelope é «não
// respondeu» — e a lacuna é declarada, nunca escrita como `null` no documento.
function textoOuLacuna(valor) {
  return valor === null || valor === undefined || valor === '' ? '[a decidir]' : String(valor);
}

// OS ITENS DE CADA DIMENSÃO, na forma do documento (`| Dimensão | Itens |`). O formulário grava
// `{ sujeito: <dimensão>, itens: "item\nitem" }` (é o `repetirPor` da dimensão); a forma antiga
// (texto corrido, `Dimensão — item`) também é aceita. As dimensões SEM itens entram com o vazio:
// a dimensão marcada e não preenchida é uma lacuna declarada, não um silêncio.
function itensPorDimensao(valor, dimensoes) {
  const porDimensao = new Map();
  for (const r of (Array.isArray(valor) ? valor : [])) {
    if (!r || typeof r !== 'object') continue;
    const dim = String(r.sujeito || r.dimensao || '').trim();
    // `itensDaDimensao` e não `emLista`: é ele que aceita o `;` (ver o comentário da função).
    if (dim) porDimensao.set(dim, itensDaDimensao(r.itens));
  }
  if (!porDimensao.size && typeof valor === 'string') {
    for (const linha of String(valor).split(/\n+/)) {
      const m = /^(.+?)\s*[—–:|]\s*(.+)$/.exec(linha.trim());
      if (m && !porDimensao.has(m[1].trim())) porDimensao.set(m[1].trim(), [m[2].trim()]);
    }
  }
  const nomes = dimensoes.length ? dimensoes : [...porDimensao.keys()];
  return nomes.map((d) => ({ dimensao: d, itens: porDimensao.get(d) || [] }));
}

/**
 * OS OBJETIVOS ESPECÍFICOS DO PLANO, AGRUPADOS PELO BLOCO EM QUE SE TRABALHAM (06/11/2026).
 *
 * PORQUE ISTO EXISTE. A auditoria reversa da §5.15 de ARQUITETURA-GERAL mediu o que o PO pedia à
 * mão e o plano já tinha: a **dimensão** (o bloco) já era derivada, e o **objetivo por bloco**
 * também é — `marcos-por-aula` diz quais são, `estrutura-de-cada-aula` diz em que blocos cada um
 * é trabalhado, e cruzando os dois sai, para cada bloco, a lista de objetivos que ali se
 * perseguem. A decisão dela foi o HÍBRIDO: os objetivos entram **derivados** como critérios, e o
 * campo do professor fica só com o que é dele — o critério que o objetivo não nomeia.
 *
 * O QUE ESTA FUNÇÃO **NÃO** LÊ: `aula-1-parametro`. Os parâmetros são os EXERCÍCIOS do nível da
 * turma (plié, battement tendu, port de bras), e um exercício não é um critério de observação —
 * «plié» não diz o que se vê. Lê-los aqui encheria a folha de colunas que ninguém sabe marcar.
 *
 * A FORMA LEGADA É LIDA: uma lista de marcos com o número escrito à frente («01: reconhecer o
 * apoio») é o mesmo que a lista sem número, e o `estrutura-de-cada-aula` de um envelope antigo
 * pode ser uma lista de blocos e não de `{marco, marcados}` — nesse caso não há cruzamento, e o
 * resultado é vazio em vez de errado.
 */
function objetivosPorBlocoDoPlano(plano) {
  const porBloco = new Map();
  if (!plano) return porBloco;
  const textos = emLista(respostaDo(plano, 'marcos-por-aula')).map((linha) => {
    const t = String(linha == null ? '' : linha);
    const i = t.indexOf(':');
    const prefixo = i > 0 ? t.slice(0, i).trim() : '';
    return (/^\d{1,3}$/.test(prefixo) ? t.slice(i + 1) : t).trim();
  }).filter(Boolean);
  const estrutura = respostaDo(plano, 'estrutura-de-cada-aula');
  for (const linha of (Array.isArray(estrutura) ? estrutura : [])) {
    if (!linha || typeof linha !== 'object' || Array.isArray(linha)) continue;
    const n = Number(linha.marco);
    if (!Number.isFinite(n) || n < 1) continue;
    const texto = textos[n - 1];
    if (!texto) continue;
    for (const b of (Array.isArray(linha.marcados) ? linha.marcados : [])) {
      const bloco = String(b).trim();
      if (!bloco) continue;
      if (!porBloco.has(bloco)) porBloco.set(bloco, []);
      if (porBloco.get(bloco).indexOf(texto) === -1) porBloco.get(bloco).push(texto);
    }
  }
  return porBloco;
}

/**
 * OS ITENS DE CADA DIMENSÃO, COM OS OBJETIVOS DO PLANO À FRENTE (06/11/2026).
 *
 * A ORDEM É A DA AUTORIDADE: primeiro o que o PLANO decide (os objetivos que aquele bloco
 * persegue), depois o que o professor escreveu para ver além deles. Inverter seria apresentar a
 * escrita como se fosse a norma.
 *
 * A DIMENSÃO PODE VIR COM O PREFIXO DO EIXO («Técnica — Barra»): é a forma gravada nos POs antes
 * de 04/11, e `blocoDaDimensao` é quem a lê. Comparar o rótulo cru contra os blocos do plano
 * perderia todos os POs antigos — e o sintoma seria uma folha sem os objetivos, em silêncio.
 *
 * NÃO SE DUPLICA: se o professor já escreveu o objetivo com as mesmas palavras (é o que a tela
 * lhe diz para fazer quando o objetivo já se vê), ele entra uma vez só.
 */
function itensComObjetivos(itens, plano) {
  const porBloco = objetivosPorBlocoDoPlano(plano);
  if (!porBloco.size) return itens;
  const chave = (t) => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return itens.map((d) => {
    const objetivos = porBloco.get(blocoDaDimensao(d.dimensao)) || [];
    const escritos = d.itens || [];
    const vistos = new Set(objetivos.map(chave));
    const restantes = escritos.filter((i) => !vistos.has(chave(i)));
    return { dimensao: d.dimensao, itens: objetivos.concat(restantes) };
  });
}

function derivarPO(envelope, plano, opcoes) {
  const contexto = (envelope && envelope.contexto) || {};
  const saida = [];
  // OS RÓTULOS do checklist: os do CONTEÚDO, quando quem chama os traz (é o que a rota faz —
  // `conteudoPO` está em escopo lá). O mapa declarado aqui é a RESERVA, e a prova o confere
  // contra o conteúdo: sem esta porta, o documento chamava «Fronteiras claras» o item que o
  // professor marcou como «Fronteiras do escopo claras», e nada denunciava.
  const rotulos = (opcoes && opcoes.rotulos) || {};
  const rotuloDaFolha = (id, chave) => rotulos[id] || ROTULO_DO_CHECKLIST[chave] || chave;

  const justificativa = {
    referenceToProblem: respostaDo(envelope, 'referencia-ao-problema'),
    explanationOfCut: respostaDo(envelope, 'explicacao-do-recorte'),
    whatIsLeftOut: respostaDo(envelope, 'o-que-fica-de-fora'),
    theoreticalBasis: respostaDo(envelope, 'base-teorica'),
  };

  const derivados = (opcoes && opcoes.derivados) || {};
  const checklist = {};
  for (const [id, chave] of CHECKLIST) {
    checklist[chave] = folhaDoChecklist(
      chave, respostaDo(envelope, id), envelope, plano, derivados[id],
    );
  }

  const estado = estadoDoPO(checklist);

  // A IDENTIDADE do documento: a RESPOSTA manda, e o contexto é a reserva. O formulário semeia
  // `professor`/`escola` do contexto e diz «corrija se necessário» — quem corrige o próprio nome
  // não pode ver o slug (`leticia`) reproduzido no documento.
  const doCabecalho = (id, doContexto) => respostaDo(envelope, id) || contexto[doContexto] || null;
  // A identidade sai UMA vez: o YAML e o `meta` são a mesma coisa, e escrevê-la em dois lugares
  // era como se deixava um deles para trás.
  const identidade = {
    escola: doCabecalho('escola', 'escolaNome') || doCabecalho('escola', 'escola') || 'Escola',
    professor: doCabecalho('professor', 'professorNome')
      || doCabecalho('professor', 'professor') || 'Professor',
  };

  saida.push('---');
  saida.push('projeto: Formação em Balé Clássico');
  saida.push('frente: PO');
  saida.push('ciclo: "' + (contexto.ciclo || 'NN') + '"');
  saida.push('escola: ' + identidade.escola);
  saida.push('responsavel: ' + identidade.professor);
  saida.push('professor: ' + identidade.professor);
  saida.push('title: "' + tituloDoPO(contexto) + '"');
  saida.push('state: ' + estado);
  /*
   * DE QUE ENVELOPE ESTA FONTE NASCEU (22/10/2026).
   *
   * Sem esta linha, a fonte não sabia dizer qual dos POs gravados é o dela — e quando dois
   * enchiam o mesmo ciclo, a única forma de saber qual deles a `-aula-01.md` descrevia era
   * comparar textos à mão. O carimbo é a identidade do elo: é o `id` do envelope no acervo,
   * o mesmo que o índice da estante mostra e o mesmo que a recusa 409 nomeia.
   *
   * É `envelope`, e não `id`, de propósito: o `id` do envelope é o documento; a fonte é uma
   * VISTA dele, e o nome diz de onde veio. O `tools/check-pacote.js` compara este campo com o
   * `po` que o `-dados.json` declarou — se não bater, o pacote mistura dois POs.
   */
  if (envelope && envelope.id) saida.push('envelope: ' + String(envelope.id));
  saida.push('---');
  saida.push('');

  /* A LINHA DO TÍTULO É O FENÓMENO (04/11/2026).
   *
   * A pesquisadora: «na linha logo abaixo do título principal do plano de observação (seguindo a
   * mesma lógica que estamos a estruturar para as aulas), o elemento a ser exibido não deve ser
   * tratado como horizonte ou pergunta, mas sim denominado formalmente como Fenómeno».
   *
   * É a MESMA POSIÇÃO que a Aula 01 já usa para «O que esta aula deixa de fora»: um parágrafo em
   * negrito, imediatamente sob o título, que diz o recorte de uma frase. No PO o recorte é o
   * FENÓMENO — o que se vai OLHAR —, e não o horizonte (a intenção de fim de ano) nem a pergunta
   * (o que se quer entender). São três coisas diferentes, e a que encabeça o documento é a
   * observável.
   *
   * UMA LINHA, e não uma lista: a lista do fenómeno continua na secção dela («## Fenómeno»), que
   * é o que o contrato extrai. Aqui é o resumo de leitura — com a lacuna dita quando não há
   * fenómeno declarado, porque um Plano de Observação sem ele não tem o que observar. */
  {
    /* Sem filtro de «gabarito vazado»: este ficheiro não o tem, e a secção «## Fenómeno» também
     * não — a coerência entre a linha e a secção vale mais do que uma limpeza que só metade do
     * documento faria. */
    const fenomeno = emLista(respostaDo(envelope, 'fenomeno')).map((v) => String(v).trim()).filter(Boolean);
    saida.push(fenomeno.length
      ? '**Fenómeno.** ' + fenomeno.join(' · ')
      : '**Fenómeno.** [Preencher: o que se vai olhar — comportamentos observáveis, não impressões.]');
    saida.push('');
  }

  const secao = (titulo, corpo) => {
    saida.push('## ' + titulo);
    saida.push('');
    for (const linha of corpo) saida.push(linha);
    saida.push('');
  };
  const lista = (titulo, valor) => {
    const itens = emLista(valor);
    secao(titulo, itens.length ? itens.map((v) => '- ' + v) : ['- [a decidir]']);
  };
  const prosa = (titulo, valor) => {
    secao(titulo, [valor === null || valor === '' ? '[a decidir]' : String(valor)]);
  };

  // O ÂMBITO que o cabeçalho fixa: QUAL plano esta observação observa, e o horizonte de fundo.
  // Os dois são nós respondíveis e não tinham destino nenhum — o documento lia o plano e não
  // dizia qual era, e o horizonte declarado sumia.
  prosa('Plano de ensino', respostaDo(envelope, 'plano-de-ensino'));
  prosa('Horizonte', respostaDo(envelope, 'horizonte'));

  prosa('Pergunta', respostaDo(envelope, 'question'));
  lista('Fenômeno', respostaDo(envelope, 'fenomeno'));
  // Campo empírico e Contexto agora vêm do PLANO referenciado (não do PO): o PO não duplica
  // a dose, o calendário, o volume nem a condição de registro — ele os lê na geração.
  prosa('Campo empírico', comporCampoEmpirico(envelope, plano));
  prosa('Contexto', comporContexto(envelope, plano));
  // O ESCOPO OBSERVADO (Bloco 2): as dimensões e os itens de cada uma. O conteúdo declara que a
  // dimensão «organiza a folha de captura: cada dimensão vira um bloco, e os itens dela viram as
  // colunas» — e o PO é a NORMA do que se observa: sem esta seção, o escopo existia só na folha
  // derivada e o documento que o professor assina não dizia o que observa. Os ITENS saem em
  // TABELA (dimensão ↔ itens), que é a forma chave-valor do par.
  /* AS DIMENSÕES SÃO TRÊS EIXOS, E NÃO UMA LISTA SOB «TÉCNICA» (04/11/2026).
   *
   * O QUE ESTAVA ERRADO, e era de leitura. As dimensões nascem do plano como `<eixo> — <bloco>`,
   * com o eixo ESCRITO no conteúdo (`doPlano.eixo: "Técnica"`) — de modo que o documento listava
   * «Técnica — Musicalidade» e «Técnica — Expressão». O conteúdo delas («resposta ao pulso na
   * marcação», «olhar acompanha o braço») é **poiésis**, e o rótulo era uma afirmação falsa sobre
   * o que se mede. A pesquisadora: «elementos como musicalidade e expressão pertencem estritamente
   * ao eixo da poiesis e jamais devem ser rotulados ou agrupados sob o eixo técnico».
   *
   * NADA É RENOMEADO NO DADO (P-03). Os rótulos gravados nos POs continuam a ser os que lá estão,
   * e os `itens-por-dimensao` referenciam-nos pelo nome. O que muda é a LEITURA — a mesma regra da
   * §5 da aula, e a mesma declaração (`motor/nucleo/eixos.js`): o prefixo sai, e o bloco fica.
   *
   * O CORPO É UM EIXO E NÃO TEM DIMENSÕES NO PO: o que ele leva é o PONTO DE PARTIDA de cada
   * sujeito e as RESTRIÇÕES declaradas — que é o que o professor consolidou da anamnese, e é o
   * mesmo par que a §5 da aula publica. Sem sujeito escolhido, o eixo DIZ que falta. */
  const baseDoPO = linhaDeBaseDoActo(opcoes) || { nome: '', em: null, turma: '', alunas: [], recorte: [] };
  const dimensoesDoPo = emLista(respostaDo(envelope, 'dimensoes-de-observacao'));
  const porEixo = new Map();
  for (const d of dimensoesDoPo) {
    const bloco = blocoDaDimensao(d);
    const eixo = eixoDoBloco(bloco);
    if (!porEixo.has(eixo)) porEixo.set(eixo, []);
    porEixo.get(eixo).push(bloco);
  }
  /* A LISTA continua a ser a declaração do professor — mas lida pelo BLOCO, e não pelo rótulo com
   * o eixo errado à frente. É ela que a listagem e o cartão leem. */
  const declaradas = [];
  for (const d of dimensoesDoPo) {
    const bloco = blocoDaDimensao(d);
    if (bloco && declaradas.indexOf(bloco) === -1) declaradas.push(bloco);
  }
  lista('Dimensões observadas', declaradas);
  {
    /* OS OBJETIVOS DO PLANO ENTRAM COMO CRITÉRIOS (06/11/2026) — o híbrido decidido por ela na
     * §5.15: o que o plano decide não se reescreve, e o campo do professor fica com o critério.
     * Sem plano legível, a lista é a que o PO tem — e o documento não inventa nada. */
    const itens = itensComObjetivos(
      itensPorDimensao(respostaDo(envelope, 'itens-por-dimensao'),
        emLista(respostaDo(envelope, 'dimensoes-de-observacao'))), plano);
    /* A COLUNA DO EIXO É DECLARADA, e não deduzida por quem lê o documento. É o que impede a
     * reincidência: o eixo deixa de ser um prefixo dentro do nome e passa a ser um campo. */
    const linhasPorEixo = { corpo: [], tecnica: [], poiesis: [] };
    for (const i of itens) {
      const eixo = eixoDoBloco(blocoDaDimensao(i.dimensao));
      if (!linhasPorEixo[eixo]) linhasPorEixo[eixo] = [];
      linhasPorEixo[eixo].push(['**' + blocoDaDimensao(i.dimensao) + '**', i.itens.join('; ') || '[a decidir]']);
    }
    /* O CORPO: APONTA, NÃO COPIA. O ponto de partida de cada sujeito já está na secção «Linha de
     * base», e repeti-lo aqui punha a mesma afirmação duas vezes no mesmo documento — a segunda
     * cópia é a que fica para trás quando a primeira é corrigida. O eixo diz ONDE o corpo se
     * observa e QUANTOS sujeitos estão declarados; o registo fica no sítio dele. É a mesma
     * disciplina da §5 da aula, onde o corpo aponta para o plano e para o PO em vez de os repetir. */
    /* O EIXO DO CORPO: UM GRUPO POR LINHA, E SÓ OS QUE TÊM ASPECTOS ESCOLHIDOS (06/11/2026).
     *
     * Era «Ponto de partida» (quantos sujeitos) e «Restrições». As duas linhas deixaram de existir
     * como campos: o ponto de partida é o recorte do passo 4, e as restrições físicas passaram a
     * ser declaradas na linha de base (a anamnese por sujeito). O que se imprime aqui é o recorte
     * — os mesmos grupos que a folha do passo 4 mostra, na mesma ordem, e nada mais. É a mesma
     * arrumação das dimensões: o eixo, o grupo, o que nele se observa. */
    const gruposDoCorpo = agruparRecorte(baseDoPO.recorte);
    if (gruposDoCorpo.length) {
      for (const g of gruposDoCorpo) {
        linhasPorEixo.corpo.push(['**' + g.grupo + '**', g.aspectos.join('; ')]);
      }
    } else {
      linhasPorEixo.corpo.push(['**Recorte do corpo**',
        '[a decidir: a linha de base da turma ainda não tem recorte — ele é o passo 4 do Corpo]']);
    }
    /* AS RESTRIÇÕES FICAM (06/11/2026) — e é a única linha desta tabela que continua a ser
     * escrita à mão no PO. A razão é factual, e foi verificada no conteúdo da anamnese: ela regista
     * «Dor/desconforto» como um estado da mobilidade do cambré (uma observação), e não tem campo
     * para lesão, cirurgia ou limitação médica. O recorte escolhe o que se observa sem perguntar o
     * que não se pode pedir. Este é o único sítio do sistema onde «lesão, dor, limitação médica» se
     * DECLARA (P-22) — tirá-lo apagaria a informação, e não a tornaria redundante. */
    const restricoes = String(respostaDo(envelope, 'restricoes') || '').trim();
    linhasPorEixo.corpo.push(['**Restrições**', restricoes || 'sem restrições declaradas']);

    const corpo = ['| Eixo | Dimensão | Itens |', '|:--|:--|:--|'];
    for (const e of EIXOS) {
      for (const [rotulo, valor] of linhasPorEixo[e.id] || []) {
        corpo.push('| ' + e.rotulo + ' | ' + rotulo + ' | ' + valor + ' |');
      }
    }
    /* Nenhuma dimensão caiu em eixo nenhum — e isso não se cala: a tabela diz que o PO declarou
     * dimensões e nenhuma foi classificada. */
    if (corpo.length === 2 && itens.length) {
      for (const i of itens) corpo.push('| — | **' + i.dimensao + '** | ' + (i.itens.join('; ') || '[a decidir]') + ' |');
    }
    secao('Itens de cada dimensão', corpo);
  }
  // A metodologia e a notação vêm do PLANO referenciado (declaradas, nunca deduzidas — P-16).
  // Sem plano, a lacuna sai declarada; o PO não as re-coleta.
  prosa('Metodologia e notação', comporMetodologiaENotacao(plano));
  // Sujeitos: os apelidos (um por linha). AS FLUTUANTES SAÍRAM (06/11/2026): quem entra e sai do
  // grupo passou a ser o elenco que a linha de base da turma fixa — uma lista à parte no PO seria
  // a segunda declaração do mesmo facto, e a que ficasse para trás seria a que o documento lê.
  lista('Sujeitos', baseDoPO.alunas.length ? baseDoPO.alunas : respostaDo(envelope, 'sujeitos'));

  // A «Norma estabelecida» NÃO é perguntada pelo formulário: a norma que o cabecalho pede é a
  // METODOLOGIA (RAD/Vaganova/…), um conceito distinto do padrão de referência do PO. A lacuna
  // sai declarada — nunca preenchida por inferência da metodologia.
  secao('Norma estabelecida', ['- ' + LACUNA_NORMA]);

  // O ponto de partida sai como tabela; sem aluna, a tabela sai vazia (o validador acusa o
  // provisório, não o silêncio). As RESTRIÇÕES FÍSICAS (P-22) são o nó seguinte e saem na sua
  // própria seção: quando vinham aqui, o título `###` e o valor entravam como LINHAS da tabela
  // (`linhaDeBase: [ {…}, "### Restrições físicas declaradas (P-22)", "Nenhuma" ]`), e a leitura
  // as imprimia como se fossem dimensões da linha de base.
  secao('Linha de base', tabelaDoRecorte(baseDoPO.recorte));
  lista('Restrições físicas declaradas', respostaDo(envelope, 'restricoes'));

  /* OS CRITÉRIOS DE INCLUSÃO E DE EXCLUSÃO DEIXARAM DE SE PERGUNTAR (06/11/2026) — e continuam a
   * existir no documento, porque um recorte sem borda não é um recorte. O que os define passou a
   * ser o que o professor JÁ decidiu no passo 4: o que ele escolheu é o que entra; o resto da
   * anamnese é o que fica de fora, e a ausência declara-se em vez de se omitir. É a diferença
   * entre «não olhei» e «não olho» — e é ela que dá valor à evidência. */
  const gruposDaInclusao = agruparRecorte(baseDoPO.recorte);
  lista('Critérios de inclusão', gruposDaInclusao.length
    ? gruposDaInclusao.map((g) => g.grupo + ': ' + g.aspectos.join('; '))
    : null);
  const quantosDoRecorte = gruposDaInclusao.reduce((soma, g) => soma + g.aspectos.length, 0);
  const totalDaAnamnese = Number(opcoes && opcoes.universoDoCorpo) || null;
  lista('Critérios de exclusão', gruposDaInclusao.length
    ? ['Os aspectos do corpo que o recorte do passo 4 não selecionou'
      + (totalDaAnamnese ? ' (' + quantosDoRecorte + ' de ' + totalDaAnamnese + ')' : '')
      + ' — a ausência é declarada, e não é esquecimento: o que fica de fora está nomeado no índice '
      + 'do recorte']
    : null);

  saida.push('## Justificativa');
  saida.push('');
  const subcampo = (nome, valor) => {
    saida.push('### ' + nome);
    saida.push('');
    saida.push(valor === null || valor === '' ? '[a decidir]' : String(valor));
    saida.push('');
  };
  subcampo('referenceToProblem', justificativa.referenceToProblem);
  subcampo('explanationOfCut', justificativa.explanationOfCut);
  subcampo('whatIsLeftOut', justificativa.whatIsLeftOut);
  subcampo('theoreticalBasis', justificativa.theoreticalBasis);

  prosa('Condições de contorno da execução', respostaDo(envelope, 'condicoes-de-contorno'));
  lista('Limitações', respostaDo(envelope, 'limitacoes'));

  // OS MÓDULOS CONDICIONAIS (o horizonte de conjunto e o compromisso de reavaliação): quatro nós
  // respondíveis que não chegavam a documento nenhum. Cada módulo é UMA seção com dois
  // SUBCAMPOS, na forma do `###` (a mesma da Justificativa) — e o título do `###` é a chave do
  // schema, que é o que o validador casa.
  secao('Horizonte do conjunto', [
    '### objetivoGeralDeConjunto', '',
    textoOuLacuna(respostaDo(envelope, 'objetivo-geral-de-conjunto')), '',
    '### numeroEstimadoDeCiclos', '',
    textoOuLacuna(respostaDo(envelope, 'numero-estimado-de-ciclos')),
  ]);
  secao('Compromisso de reavaliação', [
    '### marcosDecididosAte', '',
    textoOuLacuna(respostaDo(envelope, 'marcos-decididos-ate')), '',
    '### criterioDeExtensao', '',
    textoOuLacuna(respostaDo(envelope, 'criterio-de-extensao')),
  ]);

  saida.push('## Checklist de validação');
  saida.push('');
  for (const [id, chave] of CHECKLIST) {
    const marcado = checklist[chave];
    const rotulo = rotuloDaFolha(id, chave);
    // O título do `###` é a CHAVE do schema (é ela que o validador casa); o texto do
    // item é o rótulo humano — o professor lê o nome, o extrator lê a chave.
    saida.push('### ' + chave);
    saida.push('');
    saida.push('- [' + (marcado ? 'x' : ' ') + '] ' + rotulo);
    saida.push('');
  }

  return {
    markdown: saida.join('\n') + '\n',
    meta: {
      frente: 'PO',
      ciclo: contexto.ciclo || 'NN',
      escola: identidade.escola,
      responsavel: identidade.professor,
      professor: identidade.professor,
      title: tituloDoPO(contexto),
      state: estado,
    },
    checklist,
    estado,
  };
}

module.exports = {
  valorDe,
  condicaoDeRegistroEmTexto,
  respostaDo,
  emLista,
  itensDaDimensao,
  itensPorDimensao,
  objetivosPorBlocoDoPlano,
  itensComObjetivos,
  textoOuLacuna,
  rotulosDoChecklist,
  derivadosDoChecklist,
  ROTULOS_DO_CONTEXTO,
  COMPOR_DO_CONTEXTO,
  ROTULO_DO_CHECKLIST,
  comporPeriodicidade,
  comporMedida,
  comporData,
  comporCampoEmpirico,
  comporContexto,
  agruparRecorte,
  tabelaDoRecorte,
  linhaDeBaseDoActo,
  derivarPO,
  LACUNA_NORMA,
  CHECKLIST,
};
