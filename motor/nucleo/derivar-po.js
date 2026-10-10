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
 */
function derivarPO(envelope) {
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
  lista('Fenómeno', respostaDo(envelope, 'fenomeno'));
  prosa('Onde se observa', respostaDo(envelope, 'where'));
  prosa('Contexto', respostaDo(envelope, 'contexto'));
  lista('Alunas', respostaDo(envelope, 'sujeitos'));

  // A «Norma estabelecida» NÃO é perguntada pelo formulário: a norma que o cabecalho pede é a
  // METODOLOGIA (RAD/Vaganova/…), um conceito distinto do padrão de referência do PO. A lacuna
  // sai declarada — nunca preenchida por inferência da metodologia.
  secao('Padrão estabelecido', ['- ' + LACUNA_NORMA]);

  // O ponto de partida sai como tabela; sem aluna, a tabela sai vazia (o validador acusa o
  // provisório, não o silêncio).
  secao('Ponto de partida', tabelaDeLinhaDeBase(respostaDo(envelope, 'linha-de-base')));

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
  subcampo('Ligação à pergunta', justificativa.referenceToProblem);
  subcampo('Explicação da escolha', justificativa.explanationOfCut);
  subcampo('O que fica de fora', justificativa.whatIsLeftOut);
  subcampo('Base do método', justificativa.theoreticalBasis);

  prosa('Condições em que a aula acontece', respostaDo(envelope, 'condicoes-de-contorno'));
  lista('Limitações', respostaDo(envelope, 'limitacoes'));

  saida.push('## Conferência antes de fechar');
  saida.push('');
  for (const [id, chave] of CHECKLIST) {
    const marcado = checklist[chave];
    const rotulo = ROTULO_DO_CHECKLIST[chave] || chave;
    saida.push('### ' + rotulo);
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
  derivarPO,
  LACUNA_NORMA,
  CHECKLIST,
};
