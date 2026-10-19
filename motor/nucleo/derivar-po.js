'use strict';

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
    const partes = v.map((p) => {
      const n = p && p.numero !== null && p.numero !== undefined ? String(p.numero) : '';
      return n + (p && p.unidade ? ' ' + p.unidade : '');
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

// A linha de base: o formulário já a guarda como lista de `{sujeito, traz, precisaDesenvolver}`.
// A fonte a escreve como tabela (`| Aluno | Traz | Precisa desenvolver |`).
function tabelaDeLinhaDeBase(valor) {
  const itens = Array.isArray(valor) ? valor : [];
  const linhas = ['| Aluno | Traz | Precisa desenvolver |', '|:--|:--|:--|'];
  for (const item of itens) {
    if (!item || typeof item !== 'object') continue;
    const aluno = (item.sujeito || item.aluno || '[a decidir]');
    const traz = (item.traz || '[a decidir]');
    const precisa = (item.precisaDesenvolver || '[a decidir]');
    linhas.push('| **' + String(aluno) + '** | ' + String(traz) + ' | ' + String(precisa) + ' |');
  }
  return linhas.length > 2 ? linhas : ['| Aluno | Traz | Precisa desenvolver |', '|:--|:--|:--|'];
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
// (`Turmas` onde o campo é «Turmas observadas», `Escola` onde é «Escola / espaço»): o professor
// lia um nome no formulário e outro no documento. Aqui eles são declarados UMA vez, e a prova
// (`experimentos/provar-po-completo.js`) confere cada um contra o `campo` declarado no conteúdo
// do plano (`porta/plano/conteudo/plano.json`) — que é onde o formulário os lê.
const ROTULOS_DO_CONTEXTO = {
  'contexto-escola': 'Escola / espaço',
  'contexto-professor': 'Professor responsável',
  'contexto-turma': 'Turmas observadas',
  'contexto-frequencia': 'Frequência semanal',
  'contexto-duracao': 'Duração por aula',
  'contexto-calendario': 'Calendário',
  'contexto-total-aulas': 'Número total de aulas',
  'contexto-volume': 'Volume de trabalho',
  'contexto-registro': 'Condição de registro',
  'contexto-metodologia': 'Metodologia de referência',
  'contexto-metodologia-origem': 'Quem escolhe a metodologia',
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
  const base = comporLinhasDePlano(plano, ['contexto-escola', 'contexto-turma',
    'contexto-frequencia', 'contexto-duracao'], { 'contexto-escola': escola });
  const outro = respostaDo(envelope, 'campo-outro');
  return outro ? base + ' · ' + String(outro) : base;
}

// O CONTEXTO do PO (calendário, volume de trabalho, condição de registro) — tudo lido do
// plano referenciado; o que não estava previsto no plano vai no `contexto-outro` do PO.
function comporContexto(envelope, plano) {
  const base = comporLinhasDePlano(plano,
    ['contexto-calendario', 'contexto-volume', 'contexto-registro']);
  const outro = respostaDo(envelope, 'contexto-outro');
  return outro ? base + ' · ' + String(outro) : base;
}

// A METODOLOGIA E A NOTAÇÃO — declaradas, nunca deduzidas (P-16). Vivem no PLANO referenciado
// (o PO não as re-coleta: ele as lê na geração, como o campo empírico e o contexto). É o
// «ligar» do laudo L5: hoje ficavam presas no plano e não chegavam ao PO. Sem plano (ou sem
// valor), a lacuna sai declarada — nunca se preenche por inferência.
function comporMetodologiaENotacao(plano) {
  return comporLinhasDePlano(plano,
    ['contexto-metodologia', 'contexto-metodologia-origem', 'contexto-notacao']);
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
    if (dim) porDimensao.set(dim, emLista(r.itens));
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
  saida.push('---');
  saida.push('');

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
  lista('Dimensões observadas', respostaDo(envelope, 'dimensoes-de-observacao'));
  {
    const itens = itensPorDimensao(respostaDo(envelope, 'itens-por-dimensao'),
      emLista(respostaDo(envelope, 'dimensoes-de-observacao')));
    secao('Itens de cada dimensão', itens.length
      ? ['| Dimensão | Itens |', '|:--|:--|',
        ...itens.map((i) => '| **' + i.dimensao + '** | ' + (i.itens.join('; ') || '[a decidir]') + ' |')]
      : ['| Dimensão | Itens |', '|:--|:--|']);
  }
  // A metodologia e a notação vêm do PLANO referenciado (declaradas, nunca deduzidas — P-16).
  // Sem plano, a lacuna sai declarada; o PO não as re-coleta.
  prosa('Metodologia e notação', comporMetodologiaENotacao(plano));
  // Sujeitos: os apelidos (um por linha) — e as FLUTUANTES na sua própria seção. Elas viajavam
  // como um bullet dentro desta (`- **Flutuantes:** …`), e o extrator o lia como mais um sujeito:
  // `subjects: ["Vavá", "**Flutuantes:** …"]`. Dois nós, duas chaves.
  lista('Sujeitos', respostaDo(envelope, 'sujeitos'));
  lista('Flutuantes', respostaDo(envelope, 'flutuantes'));

  // A «Norma estabelecida» NÃO é perguntada pelo formulário: a norma que o cabecalho pede é a
  // METODOLOGIA (RAD/Vaganova/…), um conceito distinto do padrão de referência do PO. A lacuna
  // sai declarada — nunca preenchida por inferência da metodologia.
  secao('Norma estabelecida', ['- ' + LACUNA_NORMA]);

  // O ponto de partida sai como tabela; sem aluna, a tabela sai vazia (o validador acusa o
  // provisório, não o silêncio). As RESTRIÇÕES FÍSICAS (P-22) são o nó seguinte e saem na sua
  // própria seção: quando vinham aqui, o título `###` e o valor entravam como LINHAS da tabela
  // (`linhaDeBase: [ {…}, "### Restrições físicas declaradas (P-22)", "Nenhuma" ]`), e a leitura
  // as imprimia como se fossem dimensões da linha de base.
  secao('Linha de base', tabelaDeLinhaDeBase(respostaDo(envelope, 'linha-de-base')));
  lista('Restrições físicas declaradas (P-22)', respostaDo(envelope, 'restricoes'));

  lista('Critérios de inclusão', respostaDo(envelope, 'inclusao'));
  lista('Critérios de exclusão', respostaDo(envelope, 'exclusao'));

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
  itensPorDimensao,
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
  derivarPO,
  LACUNA_NORMA,
  CHECKLIST,
};
