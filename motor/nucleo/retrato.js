/**
 * retrato.js — O ÚLTIMO RETRATO DE UMA ESCOLA, E O QUE DELE CABE NO PLANO NOVO (16/11/2026).
 *
 * O QUE É UM RETRATO, aqui. Quando uma escola é expurgada, os documentos preenchidos dela — as
 * anamneses, os planos de ensino, os planos de observação, os lançamentos — saem do repositório. O
 * commit do expurgo APAGA; o commit anterior ainda os tem todos, e é isso que este módulo chama o
 * retrato: o estado inteiro da escola no instante antes de ela sair.
 *
 * O QUE ELE NÃO É. Não é restauração da MÁQUINA — essa é a criação, e ela é outra coisa. Também não
 * promete fidelidade absoluta: devolve a LISTA dos documentos e a CONTAGEM de quem eles descrevem,
 * e quem escreve os ficheiros é o `tools/restaurar-retrato.js`.
 *
 * A REGRA DA CAPACIDADE, decidida por ela a 16/11/2026, e é o coração deste ficheiro: «avisa que
 * dados serão perdidos e pergunta se quer mesmo esse; sim, então restaura com a capacidade do que
 * está sendo contratado; não, então a pessoa escolhe outro plano. A escolha do que fica é
 * sequencial em ordem decrescente. Ou seja, recupera os mais recentes.»
 *
 * Três consequências, e as três estão no código:
 *
 *   1. A ORDEM É O TEMPO, e não o nome nem o id. Cada PESSOA (aluna ou professor) tem a data do
 *      seu documento mais recente; quem tem o mais recente fica. Uma aluna que trabalhou ontem não
 *      é sacrificada por uma que parou em agosto.
 *   2. O QUE SE CONTA SÃO PESSOAS, e não ficheiros. Um PO pode cobrir cinco alunas de uma vez;
 *      ele não vale uma vaga, vale as cinco que ele descreve — e por isso uma aluna que sai leva
 *      consigo o que era só dela, mas NÃO leva o PO que também é das outras.
 *   3. AVISAR É PARTE DA REGRA, e não da tela. `escolher` devolve `cabe: false` e a lista do que se
 *      perde; quem decide mostrar o aviso é a página, mas a decisão de o haver é daqui — a mesma
 *      função que a página consulta e que o servidor confere depois. Uma segunda conta no cliente
 *      diria «cabe» sobre o que o servidor recusa.
 *
 * NÃO SE INVENTA O QUE FALTA. Um documento sem dono reconhecível (sem `aluna`, sem `sujeitos`, sem
 * `professor`) não é atribuído a ninguém: fica. Descartá-lo por não se saber de quem é seria apagar
 * o que não se compreendeu — e a regra da casa é que a dúvida não destrói.
 */

/** A data de um documento, como ela se ordena. `gerado_em` é `YYYY-MM-DDTHH:MM`, e ordena-se como
 *  texto — mas um `resumo` antigo pode não a ter, e aí vale o nome (que carrega o carimbo) ou
 *  nada: um documento sem data é o MAIS antigo na ordenação, e nunca o mais recente. */
function dataDoResumo(nome, resumo) {
  const r = resumo || {};
  const candidatos = [r.ajustado_em, r.gerado_em, r.em];
  for (const c of candidatos) {
    const texto = String(c || '').trim();
    if (texto) return texto;
  }
  /* O CARIMBO DO NOME VIRA A MESMA FORMA DO `gerado_em` — `YYYY-MM-DDTHH:MM`. Aqui esteve
   * `20260215T19:30`, e a diferença não é cosmética: `20260215…` compara-se com `2026-03-01…`
   * carácter a carácter, e o `0` é maior do que o `-` — o documento sem data passava a ordenar como
   * o MAIS RECENTE, que é o contrário do que se quer. */
  const noNome = /(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/.exec(String(nome || ''));
  return noNome ? (noNome[1] + '-' + noNome[2] + '-' + noNome[3] + 'T' + noNome[4] + ':' + noNome[5]) : '';
}

/** Os donos de um documento: as alunas que ele descreve e o professor que o escreveu.
 *
 *  `aluna` (anamnese) e `sujeitos` (PO) são a mesma pergunta com nomes diferentes — o acervo
 *  escreve as duas, e uma leitura que só conhecesse uma perderia metade dos documentos. */
function donosDoResumo(resumo) {
  const r = resumo || {};
  const alunos = [];
  for (const bruto of [r.aluna, ...(Array.isArray(r.sujeitos) ? r.sujeitos : [])]) {
    const nome = String(bruto || '').trim();
    if (nome && alunos.indexOf(nome) === -1) alunos.push(nome);
  }
  const professor = String(r.professor || '').trim();
  return { alunos, professor: professor || null };
}

/**
 * A LISTA de documentos de um `.indice.json` do acervo — `[{nome, resumo}]`.
 *
 * O ACERVO ESCREVEU O ÍNDICE COM DOIS NOMES para a mesma lista (`nomes` desde a versão 4,
 * `envelopes` antes), e o `repo-escola.js` já lê os dois pelo mesmo motivo: um ficheiro antigo que
 * ficasse ilegível seria uma escola cujos documentos não se restauram. Lê-se o que houver.
 */
function listaDoIndice(indice) {
  const d = indice || {};
  const nomes = Array.isArray(d.nomes) ? d.nomes : (Array.isArray(d.envelopes) ? d.envelopes : []);
  const resumos = (d.resumos && typeof d.resumos === 'object') ? d.resumos : {};
  const lista = [];
  const vistos = new Set();
  for (const bruto of nomes) {
    const nome = String(bruto || '').trim();
    if (!nome || vistos.has(nome)) continue;
    vistos.add(nome);
    lista.push({ nome, resumo: resumos[nome] || null });
  }
  return lista;
}

/**
 * QUEM O RETRATO DESCREVE — e há quanto tempo cada pessoa apareceu pela última vez.
 *
 * As duas listas saem ORDENADAS pelo mais recente, que é a ordem em que a capacidade vai cortar.
 * Uma pessoa sem data fica no fim: `''` ordena antes de qualquer data, e aqui o que se quer é o
 * contrário — quem não tem data é o primeiro a sair, não o primeiro a ficar.
 */
function contar(indice) {
  const lista = listaDoIndice(indice);
  const alunos = new Map();
  const professores = new Map();
  let semDono = 0;

  const guardar = (mapa, chave, quando, quandoProprio) => {
    const antes = mapa.get(chave) || { ultimo: '', proprio: '' };
    mapa.set(chave, {
      ultimo: quando > antes.ultimo ? quando : antes.ultimo,
      proprio: quandoProprio > antes.proprio ? quandoProprio : antes.proprio,
    });
  };

  for (const { nome, resumo } of lista) {
    const quando = dataDoResumo(nome, resumo);
    const { alunos: donas, professor } = donosDoResumo(resumo);
    if (!donas.length && !professor) semDono += 1;
    for (const aluna of donas) {
      /* O SEGUNDO CRITÉRIO, e ele só serve para DESEMPATAR (ver `ordenar`). Um PO que cobre cinco
       * alunas dá às cinco a mesma data, e sem desempate a vaga decidia-se pelo nome — alfabético,
       * e portanto arbitrário. Quem tem material PRÓPRIO mais recente (um documento só dela)
       * ganha o desempate: é a que trabalhou, e não apenas a que foi descrita de passagem. */
      const soDela = donas.length === 1;
      guardar(alunos, aluna, quando, soDela ? quando : '');
    }
    if (professor) guardar(professores, professor, quando, quando);
  }

  /* A ORDEM É O TEMPO, e o desempate também: primeiro a última aparição (documento próprio ou
   * partilhado), depois o documento próprio mais recente, e só no fim o nome. */
  const ordenar = (mapa) => [...mapa.entries()]
    .map(([nome, datas]) => ({ nome, ultimo: datas.ultimo, proprio: datas.proprio }))
    .sort((a, b) => {
      if (a.ultimo !== b.ultimo) return a.ultimo < b.ultimo ? 1 : -1;
      if (a.proprio !== b.proprio) return a.proprio < b.proprio ? 1 : -1;
      return a.nome.localeCompare(b.nome);
    });

  return {
    documentos: lista.length,
    semDono,
    alunos: ordenar(alunos),
    professores: ordenar(professores),
  };
}

/**
 * O QUE DO RETRATO CABE NA CAPACIDADE CONTRATADA.
 *
 * `capacidade` é `{ professores, alunos }` — o incluído do plano mais os lotes, exactamente o
 * `capacidadeTotal` que o `comercial.calcular` devolve. Nada é recalculado aqui: uma segunda conta
 * da capacidade diria um número diferente do que se cobra.
 *
 * Devolve `cabe` (não se perde ninguém), as listas do que fica e do que sai, e o mapa
 * `manter` — o conjunto de nomes de FICHEIRO que sobrevivem. É esse mapa que o `indiceFiltrado` e o
 * `tools/restaurar-retrato.js` usam: a decisão é tomada uma vez, aqui.
 */
function escolher(indice, { professores = 0, alunos = 0 } = {}) {
  const contagem = contar(indice);
  const limiteAlunos = Math.max(0, Number(alunos) || 0);
  const limiteProfessores = Math.max(0, Number(professores) || 0);

  const ficamAlunos = contagem.alunos.slice(0, limiteAlunos).map((a) => a.nome);
  const saemAlunos = contagem.alunos.slice(limiteAlunos).map((a) => a.nome);
  const ficamProfessores = contagem.professores.slice(0, limiteProfessores).map((p) => p.nome);
  const saemProfessores = contagem.professores.slice(limiteProfessores).map((p) => p.nome);

  const conjuntoAlunos = new Set(ficamAlunos);
  const conjuntoProfessores = new Set(ficamProfessores);

  const lista = listaDoIndice(indice);
  const manter = new Set();
  const porNome = new Map();

  for (const { nome, resumo } of lista) {
    porNome.set(nome, resumo);
    const { alunos: donas, professor } = donosDoResumo(resumo);
    /* UM DOCUMENTO DE ALUNAS SEGUE AS ALUNAS. Se nenhuma das que ele descreve fica, ele sai — um PO
     * sobre cinco alunas que já não existem não é memória de nada, é um registo órfão. Basta UMA
     * das suas alunas ficar para ele ficar: nesse caso ele continua a descrever quem está. */
    if (donas.length) {
      if (donas.some((a) => conjuntoAlunos.has(a))) manter.add(nome);
      continue;
    }
    /* SEM ALUNAS, O DOCUMENTO É DO PROFESSOR (o plano de ensino, o PO do ciclo). E sem professor
     * também — um documento que não se consegue atribuir —, FICA: a dúvida não destrói. */
    if (!professor || conjuntoProfessores.has(professor)) manter.add(nome);
  }

  /* A CADEIA DOS AJUSTES NÃO PODE FICAR PENDURADA. Um PO de ajuste (`ajuste_de`) que sobrevive
   * sem o PO que o originou é um registo que aponta para o vazio — e o acervo lê essa referência
   * para mostrar «ajuste de». Sai o ajuste, não a base: quem ficou tem de estar inteiro. */
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const nome of [...manter]) {
      const resumo = porNome.get(nome) || {};
      const base = String(resumo.ajuste_de || '').trim();
      if (!base) continue;
      if (!porNome.has(base + '.json') || manter.has(base + '.json')) continue;
      manter.delete(nome);
      mudou = true;
    }
  }

  const mantidos = lista.map((d) => d.nome).filter((n) => manter.has(n));
  const descartados = lista.map((d) => d.nome).filter((n) => !manter.has(n));

  return {
    ok: true,
    cabe: saemAlunos.length === 0 && saemProfessores.length === 0,
    documentos: { total: lista.length, mantidos: mantidos.length, descartados: descartados.length },
    alunos: { total: contagem.alunos.length, mantidos: ficamAlunos, descartados: saemAlunos },
    professores: {
      total: contagem.professores.length, mantidos: ficamProfessores, descartados: saemProfessores,
    },
    capacidade: { professores: limiteProfessores, alunos: limiteAlunos },
    mantidos,
    descartados,
  };
}

/**
 * O `.indice.json` DO RETRATO, FILTRADO — o que o repositório volta a ter.
 *
 * PORQUE SE FILTRA O ÍNDICE ANTIGO em vez de o reconstruir: os `resumos` são o que o acervo
 * escreveu quando gravou cada documento, com campos que ninguém deriva de novo (o `objetivo` do
 * plano, os `sujeitos` do PO). Recalculá-los exigiria abrir cada envelope e reimplementar o
 * resumo — duas versões da mesma coisa, a divergir na primeira correção. O que aqui se faz é tirar
 * linhas: os nomes que saíram, os resumos deles, e mais nada.
 */
function indiceFiltrado(indice, escolha) {
  const d = indice || {};
  const manter = new Set((escolha && escolha.mantidos) || []);
  const resumos = (d.resumos && typeof d.resumos === 'object') ? d.resumos : {};
  const resumosNovos = {};
  for (const nome of manter) {
    if (resumos[nome]) resumosNovos[nome] = resumos[nome];
  }
  const saida = Object.assign({}, d, {
    versao: Number(d.versao) || 4,
    nomes: [...manter],
    resumos: resumosNovos,
  });
  if (Array.isArray(d.envelopes)) saida.envelopes = [...manter];
  return JSON.stringify(saida, null, 2) + '\n';
}

/** O AVISO, numa frase — a mesma para a página, para a prova e para o relatório do CLI. */
function fraseDoAviso(escolha) {
  if (!escolha || escolha.cabe) return '';
  const partes = [];
  const p = escolha.professores.descartados.length;
  const a = escolha.alunos.descartados.length;
  if (p) partes.push(p + (p === 1 ? ' professor' : ' professores'));
  if (a) partes.push(a + (a === 1 ? ' aluna' : ' alunas'));
  if (!partes.length) return '';
  return 'Este plano inclui ' + escolha.capacidade.professores
    + (escolha.capacidade.professores === 1 ? ' professor' : ' professores') + ' e '
    + escolha.capacidade.alunos + (escolha.capacidade.alunos === 1 ? ' aluna' : ' alunas')
    + '. O retrato desta escola tem ' + escolha.professores.total
    + (escolha.professores.total === 1 ? ' professor' : ' professores') + ' e '
    + escolha.alunos.total + (escolha.alunos.total === 1 ? ' aluna' : ' alunas')
    + ': vão perder-se ' + partes.join(' e ') + ' — os registos mais antigos.';
}

module.exports = {
  dataDoResumo,
  donosDoResumo,
  listaDoIndice,
  contar,
  escolher,
  indiceFiltrado,
  fraseDoAviso,
};
