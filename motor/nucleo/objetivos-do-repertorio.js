/**
 * O EXERCÍCIO NOVO E O OBJECTIVO A QUE ELE SERVE (20/11/2026).
 *
 * O QUE ESTE MÓDULO RESOLVE, e por que ele vive no núcleo. Um exercício entra no Estilo e nasce
 * LIVRE: ele não pertence a aula nenhuma, e mexer no Estilo não dispara processo nenhum. O momento
 * em que ele passa a ser conteúdo de uma aula é a TURMA — «é na turma, a antiga curadoria. Então
 * quando eu vou derivar a turma é que vai nascer esse modal». E a declaração que falta é uma só:
 * **a que objectivo ele serve.**
 *
 * PORQUE A DECLARAÇÃO É NECESSÁRIA, e não um enfeite. O «Parâmetro de medição» da Aula 01 é a
 * matriz `[{marco: N, marcados: [termos]}]` — «o objectivo N observa estes exercícios» —, e é dela
 * que a sequência (o item 10) tira o «Conteúdo do nível» de cada linha. Sem a declaração, o
 * exercício entra no repertório da Turma e **não entra em aula nenhuma**: está disponível no menu e
 * nunca é escolhido, porque ninguém disse a que objectivo ele responde.
 *
 * PORQUE A ESCRITA NÃO É FEITA AQUI NO PLANO, e é a regra da casa. A declaração vai para a TURMA,
 * ao lado do repertório dela; quem a leva ao `aula-1-parametro` é a DERIVAÇÃO da cadeia, que é o
 * gesto que já ia correr. Escrever no envelope do plano a partir do Estilo seria o atalho que
 * salta a curadoria — «a gente não vai fazer nunca nenhum desvio para colocar direto, porque a
 * gente estaria quebrando o nosso próprio sistema».
 *
 * SEM PLANO NÃO HÁ NADA A DECLARAR, e é de propósito. Sem plano de ensino não existem objectivos a
 * que ligar o exercício: a Turma está em suspensão, e o plano, quando nascer, puxa o envelope dela
 * e leva o conteúdo consigo. Disparar aí seria «só custo» — e a regra do silêncio é a mesma da
 * geração: `gerarOsCiclosDasTurmas` já devolve `motivo: 'sem-plano'` e não dispara nada.
 *
 * Sem `fs`, `path`, `http` ou `process`: é núcleo.
 */

const planoDoCiclo = require('./derivar-plano-ciclo.js');

/** O valor de uma resposta, em qualquer das duas formas que o envelope usa (`{valor}` ou crua). */
function valorDaResposta(respostas, chave) {
  const reg = respostas ? respostas[chave] : null;
  const valor = reg && reg !== null && typeof reg === 'object' && !Array.isArray(reg) && 'valor' in reg
    ? reg.valor
    : reg;
  return valor === undefined ? null : valor;
}

/** Escreve o valor preservando a forma que a resposta já tinha — `{valor}` continua `{valor}`. */
function comValor(respostas, chave, valor) {
  const atual = respostas[chave];
  respostas[chave] = (atual && typeof atual === 'object' && !Array.isArray(atual) && 'valor' in atual)
    ? Object.assign({}, atual, { valor })
    : valor;
  return respostas;
}

/** Uma lista de termos, sem vazios nem repetidos, na ordem em que veio. */
function termosLimpios(valor) {
  const lista = Array.isArray(valor) ? valor : (valor === null || valor === undefined ? [] : [valor]);
  const saida = [];
  for (const item of lista) {
    const t = String(item === null || item === undefined ? '' : item).trim();
    if (t && saida.indexOf(t) === -1) saida.push(t);
  }
  return saida;
}

/**
 * As declarações guardadas na TURMA, lidas como lista.
 *
 * A forma guardada é um mapa `{termo: [marco, ...]}` — o exercício e os objectivos a que ele serve.
 * Um mapa e não uma lista de pares porque a pergunta que se faz ao dado é sempre «e este
 * exercício?»; e os marcos porque dois exercícios novos na mesma derivação são duas declarações.
 *
 * TUDO O QUE NÃO FOR UM NÚMERO INTEIRO POSITIVO É DESCARTADO, e em silêncio não: o que sobra é o que
 * se pode aplicar. Inventar um objectivo a partir de um valor estragado seria escrever pedagogia
 * que ninguém declarou.
 */
function declaracoesLidas(valor) {
  const mapa = valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {};
  const saida = [];
  for (const [chave, marcos] of Object.entries(mapa)) {
    const termo = String(chave === null || chave === undefined ? '' : chave).trim();
    if (!termo) continue;
    const numeros = [];
    for (const bruto of (Array.isArray(marcos) ? marcos : [])) {
      const n = Number(bruto);
      if (!Number.isInteger(n) || n < 1) continue;
      if (numeros.indexOf(n) === -1) numeros.push(n);
    }
    if (!numeros.length) continue;
    numeros.sort((a, b) => a - b);
    saida.push({ termo, objetivos: numeros });
  }
  return saida;
}

/** As declarações de volta ao mapa que a Turma guarda — o inverso de `declaracoesLidas`. */
function declaracoesEmMapa(declaracoes) {
  const mapa = {};
  for (const d of (Array.isArray(declaracoes) ? declaracoes : [])) {
    if (!d || !d.termo) continue;
    const numeros = (Array.isArray(d.objetivos) ? d.objetivos : [])
      .map(Number).filter((n) => Number.isInteger(n) && n >= 1);
    if (!numeros.length) continue;
    mapa[String(d.termo)] = Array.from(new Set(numeros)).sort((a, b) => a - b);
  }
  return mapa;
}

/**
 * O ESTADO DE UMA DECLARAÇÃO ACERCA DO PLANO — o que já está feito, e o que ainda falta.
 *
 * Três respostas possíveis, e são todas diferentes:
 *   · `sem-plano`  — não há plano: nada a declarar, e nada a disparar;
 *   · `ja-na-aula` — o exercício já está no repertório deste plano: a declaração já foi aplicada
 *                    (ou o professor já o pôs lá à mão). Não se reaplica — e é isto que faz a
 *                    regra ser idempotente e respeitar quem, depois, desmarcar no plano;
 *   · `nova`       — o exercício é novo nesta aula: é aqui que a pergunta se faz.
 */
function estadoDaDeclaracao({ plano, termo, repertorio }) {
  const nome = String(termo || '').trim();
  if (!nome) return { estado: 'sem-termo' };
  if (!plano) return { estado: 'sem-plano' };
  /* O QUE A AULA JÁ USA. `repertorio` é o que o plano declara; `aula-1-sequencia` é o que ele
   * imprime. Os dois, porque um plano antigo pode não ter o campo `repertorio` preenchido e ter a
   * sequência — e a pergunta é «esta aula já fala deste exercício?», não «que campo está cheio?». */
  const daAula = termosLimpios(valorDaResposta(plano.respostas || {}, 'repertorio'));
  const sequencia = valorDaResposta(plano.respostas || {}, 'aula-1-sequencia');
  const daSequencia = [];
  for (const linha of (Array.isArray(sequencia) ? sequencia : [])) {
    const conteudo = String((linha && (linha['Conteúdo do nível'] || linha.conteudo)) || '').trim();
    if (conteudo) daSequencia.push(conteudo);
  }
  if (daAula.indexOf(nome) !== -1 || daSequencia.indexOf(nome) !== -1) {
    return { estado: 'ja-na-aula' };
  }
  const acordado = termosLimpios(repertorio);
  if (acordado.length && acordado.indexOf(nome) === -1) {
    /* O exercício pedido não é conteúdo acordado da Turma. Não é erro de quem chamou — é o caso de
     * a lista da Turma ter mudado na mesma derivação, e a ordem das duas coisas não importar. O que
     * NÃO se faz é declarar o que a Turma não acordou. */
    return { estado: 'fora-do-repertorio' };
  }
  return { estado: 'nova' };
}

/**
 * O IMPACTO DE INCLUIR UM EXERCÍCIO — o que o modal mostra antes de perguntar.
 *
 * Devolve, para cada objectivo escolhido, a linha do parâmetro que ganha o termo, e os blocos que
 * essa linha declara. É o que permite dizer «o objectivo 1 passa a observar Battement jeté» em vez
 * de «tem certeza?».
 *
 * O QUE ELE **NÃO** FAZ: somar tempos. Incluir um exercício não muda a estimativa por bloco — quem
 * muda a soma é a LINHA do item 10, e essa é escrita pelo professor, com os tempos dele. Somar
 * aqui seria inventar trabalho que ninguém declarou. (Remover é outra coisa e já é automática: as
 * linhas que citam o exercício caem por `linhasDoRepertorio`, e a soma desce sozinha.)
 */
function impactoDaInclusao({ plano, termo, objetivos, repertorio }) {
  const nome = String(termo || '').trim();
  if (!nome) return null;
  const respostas = (plano && plano.respostas) || {};
  const marcos = planoDoCiclo.marcosEmTexto(valorDaResposta(respostas, 'marcos-por-aula'));
  const escolhidos = (Array.isArray(objetivos) ? objetivos : [])
    .map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= marcos.length);

  const parametro = Array.isArray(valorDaResposta(respostas, 'aula-1-parametro'))
    ? valorDaResposta(respostas, 'aula-1-parametro') : [];
  const marcadosDoMarco = new Map();
  for (const linha of parametro) {
    if (!linha || typeof linha !== 'object' || Array.isArray(linha)) continue;
    const n = Number(linha.marco);
    if (!Number.isInteger(n) || n < 1) continue;
    marcadosDoMarco.set(n, termosLimpios(linha.marcados));
  }

  /* A ESTRUTURA — em que blocos cada objectivo é trabalhado. É a relação objetivo × bloco, e não a
   * estrutura da AULA: um objectivo marcado «Solo e Barra» diz onde ELE se trabalha. */
  const estrutura = valorDaResposta(respostas, 'estrutura-de-cada-aula');
  const blocosDoMarco = new Map();
  for (const linha of (Array.isArray(estrutura) ? estrutura : [])) {
    if (!linha || typeof linha !== 'object' || Array.isArray(linha)) continue;
    const n = Number(linha.marco);
    if (!Number.isInteger(n) || n < 1) continue;
    blocosDoMarco.set(n, termosLimpios(linha.marcados));
  }

  const linhas = escolhidos.map((n) => {
    const antes = marcadosDoMarco.get(n) || [];
    const depois = antes.indexOf(nome) === -1 ? antes.concat([nome]) : antes.slice();
    return {
      n,
      texto: marcos[n - 1] || '',
      jaObserva: antes.indexOf(nome) !== -1,
      antes,
      depois,
      blocos: blocosDoMarco.get(n) || [],
    };
  });

  const blocos = [];
  for (const l of linhas) {
    for (const b of l.blocos) if (blocos.indexOf(b) === -1) blocos.push(b);
  }
  const canonica = planoDoCiclo.BLOCOS_DA_AULA;
  blocos.sort((a, b) => {
    const ia = canonica.indexOf(a) === -1 ? canonica.length : canonica.indexOf(a);
    const ib = canonica.indexOf(b) === -1 ? canonica.length : canonica.indexOf(b);
    return ia - ib;
  });

  const estado = estadoDaDeclaracao({ plano, termo: nome, repertorio });

  return {
    termo: nome,
    estado: estado.estado,
    objetivos: linhas,
    blocos,
    /* Quantas linhas do item 10 já citam o exercício. Para um exercício novo é ZERO — e dizê-lo é
     * o que evita a leitura errada de que o sistema fará a linha: quem a escreve é o professor. */
    linhasDoItem10: contarNoItem10(respostas, nome),
    /* Os objectivos que o plano tem, para a janela os oferecer todos. Nenhum pré-seleccionado: a
     * escolha é a declaração pedagógica, e o sistema não escolhe pedagogia. */
    marcos: marcos.map((texto, i) => ({ n: i + 1, texto })),
  };
}

/** As linhas da sequência (item 10) que já citam o exercício. */
function contarNoItem10(respostas, termo) {
  const sequencia = valorDaResposta(respostas, 'aula-1-sequencia');
  let quantas = 0;
  for (const linha of (Array.isArray(sequencia) ? sequencia : [])) {
    const conteudo = String((linha && (linha['Conteúdo do nível'] || linha.conteudo)) || '').trim();
    if (conteudo === termo) quantas += 1;
  }
  return quantas;
}

/**
 * A DECLARAÇÃO APLICADA AO PLANO — o elo novo nasce com o exercício no parâmetro.
 *
 * Chamada pela derivação da cadeia, com as `respostas` do elo anterior já copiadas. Muda o objecto
 * que recebe e devolve o que fez:
 *
 *   · `aula-1-parametro` — o termo entra em `marcados` de cada objectivo declarado (a linha é
 *     criada quando ainda não existe);
 *   · `repertorio` — o termo entra na lista acordada do plano, que é o que faz `parametroEmLinhas`
 *     não o filtrar de volta: o filtro do parâmetro é contra o repertório do próprio plano.
 *
 * E NÃO FAZ O QUE NÃO LHES PERTENCE: um exercício que a Turma não acordou não se declara
 * (`fora-do-repertorio`), e um que a aula já usa não se reaplica (`ja-na-aula`). A segunda regra é
 * a que respeita quem desmarca no plano: depois de o exercício estar lá, o plano é a autoridade, e
 * a declaração da Turma deixa de opinar.
 */
function aplicarDeclaracoes({ respostas, declaracoes, repertorio }) {
  const saida = respostas || {};
  const aplicadas = [];
  const ignoradas = [];
  /* A entrada é o mapa que a Turma guarda, ou a lista já lida: `declaracoesLidas` normaliza o mapa,
   * e a lista passa pelo mesmo cuidado (números inteiros, sem repetidos). */
  const lista = Array.isArray(declaracoes)
    ? declaracoesLidas(declaracoesEmMapa(declaracoes))
    : declaracoesLidas(declaracoes);
  for (const d of lista) {
    const planoComoEnvelope = { respostas: saida };
    const estado = estadoDaDeclaracao({ plano: planoComoEnvelope, termo: d.termo, repertorio });
    if (estado.estado !== 'nova') {
      ignoradas.push({ termo: d.termo, motivo: estado.estado });
      continue;
    }

    const marcos = planoDoCiclo.marcosEmTexto(valorDaResposta(saida, 'marcos-por-aula'));
    /* Sem marcos lidos não se inventa objectivo: um plano sem a lista de objectivos não tem onde
     * ancorar a declaração, e a lacuna fica dita em vez de preenchida. */
    const objetivos = marcos.length
      ? d.objetivos.filter((n) => n >= 1 && n <= marcos.length)
      : [];
    if (!objetivos.length) {
      ignoradas.push({ termo: d.termo, motivo: marcos.length ? 'objectivo-inexistente' : 'sem-objectivos' });
      continue;
    }

    /* A MATRIZ. A forma é `[{marco, marcados}]`, e as linhas que não são objecto (a prosa antiga)
     * ficam como estão: converter o que está lá seria reescrever o passado. */
    const bruto = valorDaResposta(saida, 'aula-1-parametro');
    const matriz = Array.isArray(bruto)
      ? bruto.filter((l) => l && typeof l === 'object' && !Array.isArray(l)).map((l) => ({
        marco: Number(l.marco),
        marcados: termosLimpios(l.marcados),
      }))
      : [];
    for (const n of objetivos) {
      let linha = matriz.find((l) => l.marco === n);
      if (!linha) { linha = { marco: n, marcados: [] }; matriz.push(linha); }
      if (linha.marcados.indexOf(d.termo) === -1) linha.marcados.push(d.termo);
    }
    matriz.sort((a, b) => a.marco - b.marco);
    comValor(saida, 'aula-1-parametro', matriz);

    /* O REPERTÓRIO DO PLANO, ao fim do parâmetro — é a mesma ordem do documento: o repertório é
     * lido da sequência, e a sequência do parâmetro. */
    const acordadoNoPlano = termosLimpios(valorDaResposta(saida, 'repertorio'));
    if (acordadoNoPlano.indexOf(d.termo) === -1) acordadoNoPlano.push(d.termo);
    comValor(saida, 'repertorio', acordadoNoPlano);

    aplicadas.push({ termo: d.termo, objetivos });
  }
  return { respostas: saida, aplicadas, ignoradas };
}

/**
 * O EXERCÍCIO QUE SAI DA TURMA SAI DO PLANO — a outra metade da mesma regra.
 *
 * A INCLUSÃO TEM JANELA, A REMOÇÃO NÃO, e é decisão dela (20/11/2026): «quando eu removo, não tem
 * impacto […] o modal não precisaria existir para remover, porque aí ele se desvincula dos
 * objetivos.» Desvincular-se é trabalho da derivação — e, sem esta função, não acontecia: o elo
 * novo copiava o `repertorio` e a matriz do parâmetro do elo anterior, e o exercício removido
 * continuava a ser impresso no documento. «Em nenhum lugar da aula pode existir algo que não
 * esteja definido na curadoria» é de 03/11/2026, e vale nos dois sentidos.
 *
 * A REGRA É DE IDENTIDADE, e não de gesto: o plano diz o que a Turma ensina hoje, e é a lista dela
 * que decide. Por isso a poda corre em TODA a derivação — a troca de elenco, a mudança de sala, a
 * derivação da Turma —, e não só no gesto que mexeu no repertório.
 *
 * O QUE NÃO SE TOCA: o elo anterior (a proveniência acrescenta), a sequência escrita pelo
 * professor (o documento filtra-a pelo repertório, e a linha cai na leitura, não na escrita), e a
 * Turma que não declara repertório nenhum — sem lista acordada não há com que comparar, e uma poda
 * contra uma lista vazia apagaria o plano inteiro.
 */
function podarForaDoRepertorio({ respostas, repertorio }) {
  const saida = respostas || {};
  const acordado = termosLimpios(repertorio);
  if (!acordado.length) return { respostas: saida, removidos: [] };

  const removidos = [];
  const anotar = (t) => { if (removidos.indexOf(t) === -1) removidos.push(t); };
  const dentro = (t) => acordado.indexOf(t) !== -1;

  const doPlano = termosLimpios(valorDaResposta(saida, 'repertorio'));
  const ficam = [];
  for (const t of doPlano) {
    if (dentro(t)) ficam.push(t);
    else anotar(t);
  }
  if (removidos.length) comValor(saida, 'repertorio', ficam);

  /* A MATRIZ DO PARÂMETRO, linha a linha. As linhas que não são objecto (a prosa antiga) ficam
   * como estão: converter o que está lá seria reescrever o passado. E a linha do objectivo que
   * fica sem exercício nenhum NÃO se apaga — o objectivo continua a existir; o que ele observa é
   * que mudou. */
  const bruto = valorDaResposta(saida, 'aula-1-parametro');
  if (Array.isArray(bruto)) {
    let mudou = false;
    const matriz = bruto.map((l) => {
      if (!l || typeof l !== 'object' || Array.isArray(l)) return l;
      const marcados = termosLimpios(l.marcados);
      const aqui = [];
      for (const t of marcados) {
        if (dentro(t)) aqui.push(t);
        else anotar(t);
      }
      if (aqui.length === marcados.length) return l;
      mudou = true;
      return Object.assign({}, l, { marcados: aqui });
    });
    if (mudou) comValor(saida, 'aula-1-parametro', matriz);
  }
  return { respostas: saida, removidos };
}

module.exports = {
  valorDaResposta,
  termosLimpios,
  declaracoesLidas,
  declaracoesEmMapa,
  estadoDaDeclaracao,
  impactoDaInclusao,
  aplicarDeclaracoes,
  podarForaDoRepertorio,
};
