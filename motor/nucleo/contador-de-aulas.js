/**
 * contador-de-aulas.js — QUANTAS AULAS ESTA ESCOLA PROCESSOU NESTE MÊS (25/11/2026).
 *
 * A pergunta que ele responde, e a razão de existir: a franquia é de AULAS (130 · 320 · 500 na
 * escada de 25/11/2026), a renovação é mensal e não cumulativa, e o que passar da franquia paga-se.
 * Sem este número, `comercial.situacaoDaFranquia` mostra a franquia e cala o consumo — que é o
 * estado em que o sistema viveu até hoje.
 *
 * O QUE ELE É: **puro**. Não fala com o KV, não lê o ASSETS, não compõe HTML. Recebe uma lista de
 * ciclos (o `ciclos.json` de cada turma) e um mês, e devolve números. É o que se pode medir sem
 * bancada, e é por isso que a regra mora aqui e não numa página.
 *
 * A DEFINIÇÃO DE «UMA AULA PROCESSADA», e ela é a do plano (PLANO-CONTADOR-DE-AULAS.md §2):
 *
 *     Uma aula conta quando está no `aulas` do `-dados.json`, uma vez por número de aula.
 *
 * Na prática, e é o que os `ciclos.json` publicados dizem: **`lancada === true`**. Regravar a mesma
 * aula não soma (a chave é o número, e `fundirAulas` funde); regerar o pacote não soma (a geração
 * preserva `aulas`); a aula não dada não soma (não há registo).
 *
 * A COMPETÊNCIA É A DA DATA DA AULA, e não a do lançamento. Uma aula de 30 de novembro lançada a 2
 * de dezembro é de NOVEMBRO — a mesma regra do livro das mensalidades, e a que evita que a virada
 * do mês faça uma aula saltar de franquia.
 *
 * O QUE NÃO SE GUARDA: um total. O que se guarda é o CONJUNTO de aulas processadas por mês
 * (ver `fundirNaContagem`), e o número é `Object.keys(...).length`. Um total guardado pode divergir
 * da fonte que o justifica e ninguém sabe qual vale; um conjunto é idempotente — a mesma aula
 * registada duas vezes continua a ser uma.
 */

/**
 * O PREÇO DA AULA QUE PASSA A FRANQUIA — R$ 8,00, decidido pela proprietária a 25/11/2026.
 *
 * «Vamos cobrar melhor, vamos cobrar R$ 8 por aula a mais, que daí ela percebe que qualquer um dos
 * três pacotes, se ela tivesse contratado eles, ela teria um custo por aula menor do que pagar R$ 8
 * por aula a mais no excedente do pacote.»
 *
 * O NÚMERO É UM COMANDO, e a conta que o justifica está no catálogo: o pacote pequeno (20 aulas por
 * R$ 10,00) dá R$ 0,50 por aula, o médio e o grande o mesmo. A R$ 8,00 a aula excedente custa
 * **dezasseis vezes** o pacote — é esse salto que ela quer que a escola veja, porque é ele que faz a
 * escola comprar o pacote em vez de continuar no excedente. Cobrar R$ 5,00 (a primeira ideia dela) já
 * seria mais caro do que o pacote, mas por pouco; a R$ 8,00 não há dúvida. Ver `provar-o-contador`.
 *
 * É DADO DECLARADO, e não uma conta: no dia em que o preço do pacote mudar, este número muda com
 * ele, e a prova reprova enquanto os dois não estiverem coerentes.
 */
const PRECO_DA_AULA_EXCEDENTE_CENTAVOS = 800;

/** `2026-11-04` → `2026-11`. Devolve `null` quando o que recebe não é um dia — quem chama trata a
 *  ausência, e não se inventa um mês para uma data que não existe. */
function competenciaDaData(data) {
  const texto = String(data == null ? '' : data).trim();
  const m = /^(\d{4})-(\d{2})-\d{2}/.exec(texto);
  if (!m) return null;
  const mes = Number(m[2]);
  return mes >= 1 && mes <= 12 ? m[1] + '-' + m[2] : null;
}

/** A contagem vazia. Ausente é diferente de zero: `meses` vazio diz «nada foi lido ainda». */
function contagemVazia() {
  return { atualizadoEm: null, fonte: null, meses: {} };
}

/**
 * A CHAVE DE UMA AULA NA CONTAGEM — `<variante>/<numero>`.
 *
 * A variante identifica o ciclo dentro da escola (é o nome da pasta publicada, `piano`, `rosa`), e o
 * número é o da aula. A mesma aula registada duas vezes é a MESMA chave — é isso que faz a contagem
 * ser idempotente sem depender de quem escreve.
 */
function chaveDaAula({ variante, numero } = {}) {
  const v = String(variante == null ? '' : variante).trim();
  const n = String(numero == null ? '' : numero).trim();
  if (!v || !n) return null;
  return v + '/' + n.padStart(2, '0');
}

/**
 * LÊ O QUE ESTÁ GUARDADO. Aceita o texto do KV ou o objecto já lido, e devolve sempre a mesma
 * forma — um `meses` que é um objecto, mesmo quando o que havia lá era lixo.
 *
 * Um KV com lixo NÃO rebenta e NÃO se lê como zero: devolve a contagem vazia, com `meses: {}`. Quem
 * mostra o consumo trata o vazio como «não contado» (ver `resumo`), e é a disciplina de sempre —
 * «não li» não é «não há».
 */
function lerContagem(bruto) {
  if (bruto === null || bruto === undefined || bruto === '') return contagemVazia();
  let d = bruto;
  if (typeof d === 'string') {
    try { d = JSON.parse(d); } catch (erro) { return contagemVazia(); }
  }
  if (!d || typeof d !== 'object') return contagemVazia();
  const meses = {};
  const origem = d.meses && typeof d.meses === 'object' ? d.meses : {};
  for (const mes of Object.keys(origem)) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) continue;
    const aulas = origem[mes];
    if (!aulas || typeof aulas !== 'object') continue;
    const limpo = {};
    for (const chave of Object.keys(aulas)) {
      /* DOIS dígitos no mínimo — é o `padStart(2,'0')` de `chaveDaAula` —, e sem tecto acima: um
       * ciclo de cem aulas existe, e uma chave de três dígitos é uma aula e não lixo. */
      if (!/^[^/]+\/\d{2,4}$/.test(chave)) continue;
      const data = String(aulas[chave] == null ? '' : aulas[chave]).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(data)) limpo[chave] = data;
    }
    if (Object.keys(limpo).length) meses[mes] = limpo;
  }
  return {
    atualizadoEm: d.atualizadoEm || null,
    fonte: d.fonte || null,
    meses,
  };
}

/**
 * REGISTA UMA AULA NA CONTAGEM — e a operação é idempotente, que é a propriedade toda.
 *
 * A data decide o mês (a competência da aula, não a do lançamento). Se a mesma chave já está
 * naquele mês, nada muda; se está noutro mês — o caso raro de a data da aula ser corrigida —, sai do
 * mês antigo e entra no novo. A aula é uma, e é isso que a contagem promete.
 *
 * Devolve uma contagem NOVA: uma falha a meio não deixa o objecto de quem chamou meio aplicado.
 */
function fundirNaContagem(contagem, aula, quando) {
  const base = lerContagem(contagem);
  const chave = chaveDaAula(aula);
  const competencia = competenciaDaData(aula && aula.data);
  if (!chave || !competencia) return base;
  const meses = {};
  for (const mes of Object.keys(base.meses)) {
    if (mes === competencia) continue;
    const semEsta = {};
    for (const k of Object.keys(base.meses[mes])) if (k !== chave) semEsta[k] = base.meses[mes][k];
    if (Object.keys(semEsta).length) meses[mes] = semEsta;
  }
  meses[competencia] = Object.assign({}, meses[competencia] || {}, base.meses[competencia] || {});
  meses[competencia][chave] = String(aula.data).slice(0, 10);
  return {
    atualizadoEm: quando || new Date().toISOString(),
    fonte: base.fonte,
    meses,
  };
}

/**
 * A CONTAGEM A PARTIR DOS CICLOS — o `ciclos.json` de cada turma, como o pacote os publica.
 *
 * `ciclos` é a lista `[{ variante, aulas: [{ n, data, lancada }] }]`. Devolve a mesma forma que
 * `fundirNaContagem` produz, para as duas estradas darem no mesmo sítio: a reconciliação (esta) e o
 * lançamento (a de cima).
 *
 * Uma aula sem `data` NÃO entra: a competência é a data, e uma aula que não se sabe quando foi não
 * se pode somar a mês nenhum. Fica de fora e é dita — `semData` conta quantas, para o ecrã poder
 * avisar em vez de esconder.
 */
function contagemDosCiclos(ciclos, quando) {
  const meses = {};
  let semData = 0;
  let lancadas = 0;
  for (const c of Array.isArray(ciclos) ? ciclos : []) {
    if (!c || typeof c !== 'object') continue;
    const variante = String(c.variante == null ? '' : c.variante).trim();
    if (!variante) continue;
    for (const a of Array.isArray(c.aulas) ? c.aulas : []) {
      if (!a || a.lancada !== true) continue;
      const competencia = competenciaDaData(a.data);
      const chave = chaveDaAula({ variante, numero: a.n });
      if (!competencia || !chave) { semData += 1; continue; }
      lancadas += 1;
      meses[competencia] = meses[competencia] || {};
      meses[competencia][chave] = String(a.data).slice(0, 10);
    }
  }
  return {
    contagem: {
      atualizadoEm: quando || new Date().toISOString(),
      /* A FONTE é o que permite saber se a cópia está velha sem a recalcular: é o conjunto das
       * aulas processadas e das suas datas, assinado. Duas leituras iguais dão a mesma assinatura —
       * e é isso que faz a reconciliação não gastar uma escrita de KV quando nada mudou. */
      fonte: assinaturaDosMeses(meses),
      meses,
    },
    lancadas,
    semData,
  };
}

/**
 * A ASSINATURA DO CONTEÚDO — o que diz «esta cópia está em dia» sem a comparar campo a campo.
 *
 * Não é criptográfica e não precisa de ser: ela não protege nada, mede igualdade. Um FNV-1a de 32
 * bits sobre o texto canónico dos meses dá colisões a cada ~4 mil milhões de versões distintas, e
 * uma colisão aqui significa «não reescrevi uma cópia que já estava certa» — o pior desfecho é um
 * número velho até à vista seguinte.
 */
function assinaturaDosMeses(meses) {
  const partes = [];
  for (const mes of Object.keys(meses || {}).sort()) {
    const chaves = Object.keys(meses[mes]).sort();
    partes.push(mes + ':' + chaves.map((k) => k + '=' + meses[mes][k]).join(','));
  }
  const texto = partes.join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'fnv1a:' + h.toString(16).padStart(8, '0');
}

/**
 * QUANTAS AULAS PROCESSADAS NUM MÊS. O número, e só.
 *
 * Recebe a contagem (o que está guardado) ou uma lista de ciclos (o que está publicado) — as duas
 * estradas, e a função aceita as duas porque a pergunta é a mesma e o chamador é que sabe onde está
 * o dado. `null` quando não há contagem nenhuma: **não contado ≠ zero**, e é a distinção que o
 * `situacaoDaFranquia` já sabe respeitar.
 */
function contarAulasDoMes({ contagem, ciclos, competencia } = {}) {
  const mes = String(competencia == null ? '' : competencia).trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return null;
  if (contagem === null || contagem === undefined) {
    if (!Array.isArray(ciclos)) return null;
    const feito = contagemDosCiclos(ciclos);
    return Object.keys(feito.contagem.meses[mes] || {}).length;
  }
  const lida = lerContagem(contagem);
  /* Uma contagem sem NENHUM mês é «não lido» e não «zero aulas». Só quando há meses — mesmo de
   * outros — é que o zero deste mês é uma afirmação: contou-se, e este mês está vazio. */
  if (!Object.keys(lida.meses).length) return null;
  return Object.keys(lida.meses[mes] || {}).length;
}

/**
 * AS AULAS PREVISTAS NUM MÊS — o segundo número, e ele NÃO se soma ao primeiro.
 *
 * «Se ela não vai dar aquele tanto de aula que ela planejou […] é problema dela. Agora, se ela der
 * mais aulas do que o que ela contratou, tem um excedente.» Planear não custa nada; processar custa.
 * As previstas servem o ALERTA («este ciclo prevê 40 aulas e a franquia tem 23 livres») e nunca o
 * excedente.
 *
 * Conta todas as aulas do calendário cuja data cai no mês, lançadas ou não — é a expectativa, e não
 * o facto.
 */
function previstasDoMes({ ciclos, competencia } = {}) {
  const mes = String(competencia == null ? '' : competencia).trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return null;
  let total = 0;
  for (const c of Array.isArray(ciclos) ? ciclos : []) {
    if (!c || !Array.isArray(c.aulas)) continue;
    for (const a of c.aulas) {
      if (a && competenciaDaData(a.data) === mes) total += 1;
    }
  }
  return total;
}

/**
 * O RESUMO — tudo o que o ecrã precisa, numa chamada, com o excedente já em reais.
 *
 * `franquia` vem de fora (`comercial.franquiaDoContrato`), e é de propósito: este módulo não sabe o
 * que é um plano. Passa-se o número e ele compara.
 *
 * AS TRÊS COISAS QUE O RESUMO NUNCA FAZ:
 *   · inventar um zero quando não há contagem — devolve `processadas: null` e `estado: null`;
 *   · cobrar a prevista — o excedente é só `processadas - franquia`;
 *   · esconder o número de aulas excedentes atrás do valor — os dois saem, porque a frase que a
 *     escola lê é «3 aulas além da franquia, R$ 24,00», e não um total sem explicação.
 */
function resumo({ contagem, ciclos, competencia, franquia, precoCentavos } = {}) {
  const mes = String(competencia == null ? '' : competencia).trim();
  const f = Math.max(0, Math.round(Number(franquia) || 0));
  const preco = Number.isFinite(Number(precoCentavos))
    ? Math.max(0, Math.round(Number(precoCentavos))) : PRECO_DA_AULA_EXCEDENTE_CENTAVOS;
  const processadas = contarAulasDoMes({ contagem, ciclos, competencia: mes });
  const previstas = Array.isArray(ciclos) ? previstasDoMes({ ciclos, competencia: mes }) : null;
  if (processadas === null) {
    return {
      competencia: mes,
      processadas: null,
      previstas,
      franquia: f,
      restantes: null,
      excedenteAulas: null,
      precoDaAulaCentavos: preco,
      excedenteCentavos: null,
      estado: null,
      frase: 'A franquia é de ' + f + ' aula(s) por mês. O consumo deste mês ainda não é contado.',
    };
  }
  const excedenteAulas = Math.max(0, processadas - f);
  const excedenteCentavos = excedenteAulas * preco;
  const restantes = Math.max(0, f - processadas);
  let estado = 'folga';
  if (processadas > f) estado = 'passou';
  else if (processadas === f && f > 0) estado = 'limite';
  else if (f > 0 && processadas / f >= 0.8) estado = 'perto';
  const excedenteEmReais = (excedenteCentavos / 100).toFixed(2).replace('.', ',');
  const precificado = (preco / 100).toFixed(2).replace('.', ',');
  const frases = {
    folga: processadas + ' de ' + f + ' aula(s) neste mês — ' + restantes + ' ainda disponíveis.',
    perto: processadas + ' de ' + f + ' aula(s) neste mês. A franquia está a chegar ao fim: '
      + restantes + ' disponíveis, e a seguinte já é excedente.',
    limite: processadas + ' de ' + f + ' aula(s) — a franquia deste mês está exactamente usada. '
      + 'A próxima aula é excedente, a R$ ' + precificado + ' cada.',
    passou: processadas + ' de ' + f + ' aula(s): ' + excedenteAulas + ' além da franquia, a R$ '
      + precificado + ' cada, dão R$ ' + excedenteEmReais + ' — cobrados no mês seguinte, além da '
      + 'mensalidade.',
  };
  return {
    competencia: mes,
    processadas,
    previstas,
    franquia: f,
    restantes,
    excedenteAulas,
    precoDaAulaCentavos: preco,
    excedenteCentavos,
    estado,
    frase: frases[estado],
  };
}

/**
 * O EXCEDENTE DE UM MÊS, PARA A CONTA DO MÊS SEGUINTE.
 *
 * «Isso a gente tem que calcular para fazer a cobrança no próximo mês, então a gente tem que
 * registrar esse excedente. Ele não pode ficar sem registro lá no financeiro e incluir no cálculo do
 * valor do próximo mês automaticamente, mas isso precisa estar discriminado para mim.»
 *
 * A conta é do mês FECHADO e entra no mês ABERTO. Devolve `null` quando não há contagem — e aí o mês
 * seguinte não ganha linha nenhuma, em vez de ganhar uma linha de R$ 0,00 que ninguém sabe explicar.
 */
function excedenteDoMes({ contagem, competencia, franquia, precoCentavos } = {}) {
  const r = resumo({ contagem, competencia, franquia, precoCentavos });
  if (r.estado === null || !r.excedenteAulas) return null;
  return {
    competencia: r.competencia,
    aulas: r.excedenteAulas,
    precoDaAulaCentavos: r.precoDaAulaCentavos,
    centavos: r.excedenteCentavos,
    processadas: r.processadas,
    franquia: r.franquia,
  };
}

module.exports = {
  PRECO_DA_AULA_EXCEDENTE_CENTAVOS,
  competenciaDaData,
  contagemVazia,
  chaveDaAula,
  lerContagem,
  fundirNaContagem,
  contagemDosCiclos,
  assinaturaDosMeses,
  contarAulasDoMes,
  previstasDoMes,
  resumo,
  excedenteDoMes,
};
