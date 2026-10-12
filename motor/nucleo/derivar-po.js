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

function booleanoDoChecklist(valor) {
  return String(valor || '').trim().toLowerCase() === 'sim';
}

// O nome humano de cada folha do checklist — o professor lê o nome, não a chave.
const ROTULO_DO_CHECKLIST = {
  phenomenonOperationallyDefined: 'Fenómeno definido de forma observável',
  scopeBoundariesClear: 'Fronteiras claras',
  normClearlyEstablished: 'Padrão estabelecido',
  criteriaMutuallyExclusive: 'Critérios que não se sobrepõem',
  justificationGrounded: 'Justificação com base',
  cutFeasible: 'Âmbito viável',
};

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

// Uma linha `Rótulo: valor` composta, pulando o que não veio; `[a decidir]` quando nada veio.
function comporLinhasDePlano(plano, pares) {
  const linhas = [];
  for (const [rotulo, valor] of pares) {
    const composto = valor === null || valor === undefined || valor === '' ? null : String(valor);
    linhas.push(rotulo + ': ' + (composto || '[a decidir]'));
  }
  return linhas.join(' · ');
}

// O CAMPO EMPÍRICO do PO (escola, turma, frequência, duração por aula). A escola é do PO
// (a declaração própria do âmbito); turma, frequência e duração vêm do plano referenciado.
function comporCampoEmpirico(envelope, plano) {
  const escola = respostaDo(envelope, 'campo-escola') || respostaDo(plano, 'contexto-escola');
  const base = comporLinhasDePlano(plano, [
    ['Escola', escola],
    ['Turma', respostaDo(plano, 'contexto-turma')],
    ['Frequência', comporPeriodicidade(respostaDo(plano, 'contexto-frequencia'))],
    ['Duração por aula', comporMedida(respostaDo(plano, 'contexto-duracao'))],
  ]);
  const outro = respostaDo(envelope, 'campo-outro');
  return outro ? base + ' · ' + String(outro) : base;
}

// O CONTEXTO do PO (calendário, volume de trabalho, condição de registro) — tudo lido do
// plano referenciado; o que não estava previsto no plano vai no `contexto-outro` do PO.
function comporContexto(envelope, plano) {
  const base = comporLinhasDePlano(plano, [
    ['Calendário', comporData(respostaDo(plano, 'contexto-calendario'))],
    ['Volume de trabalho', comporMedida(respostaDo(plano, 'contexto-volume'))],
    ['Condição de registro', respostaDo(plano, 'contexto-registro')],
  ]);
  const outro = respostaDo(envelope, 'contexto-outro');
  return outro ? base + ' · ' + String(outro) : base;
}

function derivarPO(envelope, plano) {
  const contexto = (envelope && envelope.contexto) || {};
  const saida = [];

  const justificativa = {
    referenceToProblem: respostaDo(envelope, 'referencia-ao-problema'),
    explanationOfCut: respostaDo(envelope, 'explicacao-do-recorte'),
    whatIsLeftOut: respostaDo(envelope, 'o-que-fica-de-fora'),
    theoreticalBasis: respostaDo(envelope, 'base-teorica'),
  };

  const checklist = {};
  for (const [id, chave] of CHECKLIST) {
    checklist[chave] = booleanoDoChecklist(respostaDo(envelope, id));
  }

  const estado = estadoDoPO(checklist);

  saida.push('---');
  saida.push('projeto: Formação em Balé Clássico');
  saida.push('frente: PO');
  saida.push('ciclo: "' + (contexto.ciclo || 'NN') + '"');
  saida.push('escola: ' + (contexto.escola || 'Escola'));
  saida.push('responsavel: ' + (contexto.professor || 'Professor'));
  saida.push('professor: ' + (contexto.professor || 'Professor'));
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

  prosa('Pergunta', respostaDo(envelope, 'question'));
  lista('Fenômeno', respostaDo(envelope, 'fenomeno'));
  // Campo empírico e Contexto agora vêm do PLANO referenciado (não do PO): o PO não duplica
  // a dose, o calendário, o volume nem a condição de registro — ele os lê na geração.
  prosa('Campo empírico', comporCampoEmpirico(envelope, plano));
  prosa('Contexto', comporContexto(envelope, plano));
  // Sujeitos: os apelidos (um por linha) + a declaração das flutuantes — o único
  // dado de alunas que a anamnese não cobre, e que por isso vive no PO.
  {
    const sujeitos = emLista(respostaDo(envelope, 'sujeitos'));
    const flutuantes = emLista(respostaDo(envelope, 'flutuantes'));
    const corpo = sujeitos.length ? sujeitos.map((v) => '- ' + v) : ['- [a decidir]'];
    corpo.push('- **Flutuantes:** ' + (flutuantes.length ? flutuantes.join(', ') : '[a decidir]'));
    secao('Sujeitos', corpo);
  }

  // A «Norma estabelecida» NÃO é perguntada pelo formulário: a norma que o cabecalho pede é a
  // METODOLOGIA (RAD/Vaganova/…), um conceito distinto do padrão de referência do PO. A lacuna
  // sai declarada — nunca preenchida por inferência da metodologia.
  secao('Norma estabelecida', ['- ' + LACUNA_NORMA]);

  // O ponto de partida sai como tabela; sem aluna, a tabela sai vazia (o validador acusa o
  // provisório, não o silêncio). Depois, as restrições físicas (P-22): declaradas, nunca
  // avaliadas — «nenhuma» é informação, e a ausência de resposta é lacuna.
  secao('Linha de base', [
    ...tabelaDeLinhaDeBase(respostaDo(envelope, 'linha-de-base')),
    '',
    '### Restrições físicas declaradas (P-22)',
    '',
    emLista(respostaDo(envelope, 'restricoes')).join('\n') || '[a decidir]',
  ]);

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

  saida.push('## Checklist de validação');
  saida.push('');
  for (const [id, chave] of CHECKLIST) {
    const marcado = checklist[chave];
    const rotulo = ROTULO_DO_CHECKLIST[chave] || chave;
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
      escola: contexto.escola || 'Escola',
      responsavel: contexto.professor || 'Professor',
      professor: contexto.professor || 'Professor',
      title: tituloDoPO(contexto),
      state: estado,
    },
    checklist,
    estado,
  };
}

module.exports = {
  valorDe,
  respostaDo,
  emLista,
  comporPeriodicidade,
  comporMedida,
  comporData,
  comporCampoEmpirico,
  comporContexto,
  derivarPO,
  LACUNA_NORMA,
  CHECKLIST,
};
