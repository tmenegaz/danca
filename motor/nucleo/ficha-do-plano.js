'use strict';

/**
 * ficha-do-plano.js — o PLANO DE ENSINO preenchido, escrito como documento.
 *
 * O QUE ELE SUBSTITUI, E POR QUÊ. O link «plano de ensino» da listagem abria a FONTE DO CICLO
 * — o Markdown que `derivar-plano-ciclo.js` produz para virar `plano-XX-<escola>.md`. Esse
 * texto é uma derivação: renomeia secções, junta campos, acrescenta notas e deixa dois
 * marcadores (`<!-- CALENDARIO -->`, `<!-- OBJETIVOS -->`) que só o gerador do ciclo resolve.
 * Servido sem o gerador, o marcador sumia e a secção «Objetivos por bloco e por aula» saía
 * VAZIA — o defeito que a pesquisadora viu. E o título dizia «Plano do Ciclo», que é o nome
 * do documento do ciclo, não o do que ela acabou de preencher.
 *
 * O PEDIDO, textual: «quando eu faço o plano de ensino e clico no link […] ele tem que ser o
 * plano de ensino. […] é só o que tá preenchido, o nome dos campos, todos eles listados, com
 * seus títulos, tudo certinho, bonitinho, mas marcado ali o que foi escolhido.» Não é
 * interpretação, nem reorganização, nem recorte: é o formulário com as respostas.
 *
 * É a mesma natureza da ficha da anamnese (`ficha.js`): o CONTEÚDO manda na ordem e nos
 * títulos, o envelope manda nos valores, e o que não foi respondido aparece como lacuna
 * declarada — nunca preenchido por adivinhação.
 *
 * Fronteira: puro (sem `fs`/`path`/`http`/`process`).
 */

const {
  respostaDo,
  emLista,
  comporPeriodicidade,
  comporMedida,
  comporData,
  condicaoDeRegistroEmTexto,
} = require('./derivar-po.js');

const LACUNA = '[a decidir]';

/* O QUE NÃO SE PERGUNTA CONTINUA A SER CAMPO DO DOCUMENTO (26/10/2026). Escola, professor,
 * turma, frequência, duração, calendário e número de aulas saíram do roteiro, mas continuam a
 * ser nós do mapa e continuam a ir para o envelope. No documento aparecem — é onde se lê «em
 * que condições este plano vale». */
const ROTULOS_DO_CABECALHO = {
  'contexto-escola': 'Escola',
  'contexto-professor': 'Professor',
  'contexto-turma': 'Turma observada',
  'contexto-frequencia': 'Frequência semanal',
  'contexto-duracao': 'Duração por aula',
  'contexto-calendario': 'Calendário',
  'contexto-total-aulas': 'Número total de aulas',
};

/** O texto de um valor simples, ou `null` quando não há nada a dizer. */
function textoDe(valor) {
  if (valor === null || valor === undefined) return null;
  if (Array.isArray(valor)) {
    /* A DURAÇÃO é uma LISTA DE PARTES (`[{numero:1,unidade:'hora'},{numero:30,...}]`), e não
     * uma lista de itens: compõe-se com a mesma função que o resto do sistema usa. Sem isto o
     * documento escrevia «[object Object]» — o dado certo e a página muda. */
    if (valor.length && valor.every((v) => v && typeof v === 'object' && !Array.isArray(v))) {
      const composto = comporMedida(valor) || comporPeriodicidade(valor) || comporData(valor);
      if (composto) return composto;
    }
    const itens = valor.map((v) => String(v == null ? '' : v).trim()).filter(Boolean);
    return itens.length ? itens.join('; ') : null;
  }
  if (typeof valor === 'object') {
    const composto = comporMedida(valor) || comporPeriodicidade(valor) || comporData(valor);
    return composto || null;
  }
  const t = String(valor).trim();
  return t === '' ? null : t;
}

/** Uma tabela de verdade, a partir das linhas gravadas e das colunas que o conteúdo declara. */
function tabela(linhas, colunas) {
  const cols = Array.isArray(colunas) && colunas.length ? colunas : null;
  const registos = (Array.isArray(linhas) ? linhas : []).filter((l) => l && typeof l === 'object');
  if (!registos.length) return null;
  const nomes = cols || Object.keys(registos[0]).filter((k) => k && k.charAt(0) !== '_');
  if (!nomes.length) return null;
  const saida = ['| ' + nomes.join(' | ') + ' |', '|' + nomes.map(() => ':--').join('|') + '|'];
  for (const linha of registos) {
    const celulas = nomes.map((c) => {
      const v = linha[c];
      return String(v === null || v === undefined ? '' : v).replace(/\|/g, '\\|').trim();
    });
    if (celulas.some((c) => c !== '')) saida.push('| ' + celulas.join(' | ') + ' |');
  }
  return saida.length > 2 ? saida : null;
}

/* A MATRIZ POR OBJETIVO (os blocos de cada objetivo, o parâmetro de medição): uma linha por
 * objetivo, com o que foi marcado nele. Grava-se `[{marco: N, marcados: [...]}]`, e o número é
 * do OBJETIVO — a leitura por linha é a única que não repete o nome do bloco uma vez por
 * objetivo (com vinte parâmetros e três objetivos, a matriz do avesso teria sessenta nomes). */
function porObjetivo(valor, objetivos) {
  const linhas = (Array.isArray(valor) ? valor : [])
    .filter((l) => l && typeof l === 'object' && !Array.isArray(l));
  if (!linhas.length) return null;
  const saida = [];
  for (const linha of linhas) {
    const n = Number(linha.marco);
    const marcados = (Array.isArray(linha.marcados) ? linha.marcados : [])
      .map((v) => String(v).trim()).filter(Boolean);
    if (!Number.isFinite(n) && !marcados.length) continue;
    const qual = Number.isFinite(n) ? (objetivos[n - 1] || '') : '';
    const rotulo = 'Objetivo ' + (Number.isFinite(n) ? n : '?')
      + (qual ? ' — ' + qual : '');
    saida.push('- **' + rotulo + ':** ' + (marcados.length ? marcados.join(', ') : LACUNA));
  }
  return saida.length ? saida : null;
}

/** O registro (quem está na sala, quem observa): dois grupos, ditos por palavras. */
function registroEmLinhas(valor) {
  const t = condicaoDeRegistroEmTexto(valor);
  if (!t) return null;
  return emLista(t).length ? emLista(t).map((l) => '- ' + l) : ['- ' + t];
}

/**
 * O documento de UM campo: o título já foi escrito por quem chama; aqui vem o corpo, em
 * linhas de Markdown. A ordem dos testes é a do conteúdo — a forma mais específica primeiro.
 */
function corpoDoCampo(campo, envelope, contexto) {
  const id = campo.id;
  const valor = respostaDo(envelope, id);

  if (campo.noCabecalho) {
    const rotulo = ROTULOS_DO_CABECALHO[id];
    /* O RITMO VEM DA TURMA, e o envelope guarda o que foi semeado. Quando o envelope não o
     * traz (planos antigos), o valor sai da turma que o próprio plano declara — que é a
     * fonte que a tela usa. Sem turma, é lacuna. */
    const daTurma = contexto && contexto.daTurma ? contexto.daTurma(id) : null;
    const t = textoDe(valor) || textoDe(daTurma);
    return [t ? '- **' + (rotulo || campo.campo) + ':** ' + t : '- **' + (rotulo || campo.campo)
      + ':** ' + LACUNA];
  }

  if (campo.porMarco) {
    const marcos = contexto && contexto.objetivos ? contexto.objetivos : [];
    return porObjetivo(valor, marcos);
  }
  if (campo.tabela) {
    const linhas = Array.isArray(valor) ? valor : (valor && valor.linhas) || [];
    const t = tabela(linhas, campo.tabela.colunas);
    if (t) {
      const unidade = valor && !Array.isArray(valor) && valor.unidade
        ? ['', '*Unidade: ' + valor.unidade + '.*'] : [];
      return t.concat(unidade);
    }
    return null;
  }
  if (campo.lista) {
    const itens = emLista(valor);
    return itens.length ? itens.map((v, i) => (i + 1) + '. ' + v) : null;
  }
  if (campo.aulasDoObjetivo) {
    /* A RELAÇÃO objetivo → aula. Uma linha por objetivo, como o campo a guarda. */
    const linhas = (Array.isArray(valor) ? valor : [])
      .filter((l) => l && typeof l === 'object' && !Array.isArray(l));
    if (!linhas.length) return null;
    const objetivos = (contexto && contexto.objetivos) || [];
    const saida = [];
    for (const linha of linhas) {
      const n = Number(linha.objetivo);
      if (!Number.isFinite(n)) continue;
      const aulas = (Array.isArray(linha.aulas) ? linha.aulas : [])
        .map((a) => String(a).trim()).filter(Boolean);
      const qual = objetivos[n - 1] || '';
      if (!aulas.length && !qual) continue;
      saida.push('- **Objetivo ' + n + (qual ? ' — ' + qual : '') + ':** aula '
        + (aulas.length ? aulas.map((a) => String(Number(a) || a)).join(', ') : LACUNA));
    }
    return saida.length ? saida : null;
  }
  if (campo.escala) {
    /* A RÉGUA: os níveis, na ordem. Não há «escolha» a marcar aqui — o critério de cada aula
     * nasce no lançamento, e o documento diz isso por não marcar nada.
     *
     * A RÉGUA É DA TURMA (`escala.daTurma`), e a tela a lê do cadastro. O envelope guarda o que
     * foi semeado; quando não guarda — planos anteriores a esta rodada —, o documento lê a
     * turma, que é a fonte que a tela usa. Sem nenhuma das duas, é lacuna declarada. */
    const niveis = emLista(valor);
    if (niveis.length) return niveis.map((n) => '- ' + n);
    const daTurma = campo.escala.daTurma && contexto && contexto.daTurma
      ? contexto.daTurma('escala:' + campo.escala.daTurma) : null;
    const daRégua = emLista(daTurma);
    return daRégua.length ? daRégua.map((n) => '- ' + n) : null;
  }
  if (campo.registro) return registroEmLinhas(valor);
  if (campo.medida) {
    const t = comporMedida(valor);
    return t ? [t] : null;
  }
  if (campo.periodicidade) {
    const t = comporPeriodicidade(valor);
    return t ? [t] : null;
  }
  if (campo.data) {
    const t = comporData(valor);
    return t ? [t] : null;
  }
  if (campo.multipla || campo.opcoes) {
    const escolhidos = emLista(valor);
    const opcoes = Array.isArray(campo.opcoes) ? campo.opcoes.map(String) : [];
    if (opcoes.length) {
      /* MARCADO O QUE FOI ESCOLHIDO — é o pedido: cada alternativa à vista, e a escolhida
       * assinalada. Uma escolha que não está na lista (o campo aberto) entra no fim, dita. */
      const fora = escolhidos.filter((e) => opcoes.indexOf(e) === -1);
      return opcoes.map((o) => (escolhidos.indexOf(o) === -1 ? '- ☐ ' : '- ☑ ') + o)
        .concat(fora.map((f) => '- ☑ ' + f));
    }
    return escolhidos.length ? escolhidos.map((e) => '- ' + e) : null;
  }

  const t = textoDe(valor);
  if (!t) return null;
  const itens = emLista(valor);
  return itens.length > 1 ? itens.map((v) => '- ' + v) : [t];
}

/**
 * A ficha inteira. Devolve `{ markdown, relatorio }` — o relatório conta o que ficou em
 * lacuna, para a folha poder dizê-lo sem ninguém o calcular à mão.
 */
function renderizar(conteudo, envelope) {
  const saida = [];
  const lacunas = [];
  const respondidos = [];

  const objetivos = (() => {
    const textos = emLista(respostaDo(envelope, 'marcos-por-aula'))
      .map((linha) => {
        const idx = linha.indexOf(':');
        const prefixo = idx > 0 ? linha.slice(0, idx).trim() : '';
        return /^\d{1,3}$/.test(prefixo) ? linha.slice(idx + 1).trim() : linha.trim();
      })
      .filter(Boolean);
    return textos;
  })();

  /* A TURMA DO PLANO — de onde saem os quatro valores do cabeçalho quando o envelope não os
   * traz. É o MESMO cadastro que a tela lê; aqui ele chega pronto (quem chama resolve). */
  const turmas = envelope && envelope._turmas ? envelope._turmas : [];
  /* A TURMA: a que o plano respondeu — e, se o envelope for antigo ao ponto de não a ter na
   * resposta, a do seu próprio contexto. Não há terceira via: sem turma identificada, o que
   * dela vem sai como lacuna declarada, e não se adivinha qual é. */
  const nomeDaTurma = textoDe(respostaDo(envelope, 'contexto-turma'))
    || textoDe(envelope && envelope.contexto && envelope.contexto.turma);
  const turma = Array.isArray(turmas)
    ? turmas.find((t) => t && String(t.nome) === String(nomeDaTurma)) || null
    : null;

  const daTurma = (id) => {
    if (!turma) return null;
    if (id === 'contexto-frequencia') {
      const dias = Array.isArray(turma.dias) ? turma.dias.filter(Boolean) : [];
      const vezes = dias.length || Number(turma.frequencia) || 0;
      if (!vezes) return null;
      return { vezes: vezes, por: 'semanal', dias: dias };
    }
    if (id === 'contexto-duracao') {
      if (!turma.duracaoMin) return null;
      const horas = Math.floor(turma.duracaoMin / 60);
      const minutos = turma.duracaoMin % 60;
      const partes = [];
      if (horas) partes.push({ numero: horas, unidade: 'hora' });
      if (minutos || !horas) partes.push({ numero: minutos, unidade: 'minuto' });
      return partes;
    }
    if (id === 'contexto-calendario') {
      if (!turma.periodoInicio && !turma.periodoFim) return null;
      return { inicio: turma.periodoInicio || null, fim: turma.periodoFim || null };
    }
    if (id === 'contexto-total-aulas') {
      const t = textoDe(respostaDo(envelope, 'contexto-total-aulas'));
      return t || null;
    }
    /* A RÉGUA DA RUBRICA também é da turma (`escala.daTurma: 'rubrica'`). Chega por aqui para
     * o documento não ter uma segunda maneira de ler o mesmo cadastro. */
    if (id === 'escala:rubrica') return Array.isArray(turma.rubrica) ? turma.rubrica : null;
    return null;
  };

  const contexto = { objetivos, daTurma };

  const escreverCampo = (campo) => {
    const corpo = corpoDoCampo(campo, envelope, contexto);
    const titulo = '**' + campo.campo + '**' + (campo.obrigatorio ? '' : ' *(opcional)*');
    if (!corpo || !corpo.length) {
      lacunas.push(campo.campo);
      saida.push(titulo, '');
      saida.push(LACUNA, '');
      return;
    }
    respondidos.push(campo.campo);
    saida.push(titulo, '');
    for (const linha of corpo) saida.push(linha);
    saida.push('');
  };

  /* O NÍVEL DO TÍTULO É O DA FOLHA, e não o do markdown: `folha()` renderiza o corpo um degrau
   * abaixo do `<h1>` (`corpoDaFicha` → `paraHtml(markdown, 2)`), de modo que `#` sai `<h2>` e
   * `##` sairia `<h3>` — uma secção a saltar um nível. O campo é TEXTO EM NEGRITO, e não um
   * título: ele nomeia o que se respondeu, e não abre uma divisão do documento. */
  const bloco = (titulo, campos) => {
    if (!campos.length) return;
    saida.push('# ' + titulo, '');
    for (const campo of campos) escreverCampo(campo);
  };

  /* O CABEÇALHO NÃO LEVA NÚMERO. O conteúdo declara `bloco: 1` para ele E para o primeiro
   * bloco, e a numeração duplicada lia-se como dois «1» no mesmo documento. O cabeçalho é a
   * resposta que abre o plano, não um degrau: fica com o título e mais nada. */
  const cabecalho = conteudo.cabecalho || {};
  bloco(cabecalho.titulo || 'Objetivo geral', cabecalho.campos || []);

  for (const b of conteudo.blocos || []) {
    bloco((b.bloco ? b.bloco + '. ' : '') + (b.titulo || ''), b.campos || []);
  }

  return {
    markdown: saida.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n',
    relatorio: { respondidos, lacunas },
  };
}

module.exports = { renderizar };
