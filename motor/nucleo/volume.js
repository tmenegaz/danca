/**
 * volume.js — A FAIXA DE VOLUME DE UMA AULA, A PARTIR DA DURAÇÃO (20/11/2026).
 *
 * O PROBLEMA QUE ISTO RESOLVE, e ele apareceu três vezes na mesma noite.
 *
 * A faixa de volume tinha de ser DECLARADA, por duração exacta, no `.conf` da escola:
 * `VOLUME_MIN`/`VOLUME_MAX` até 60 minutos, e `VOLUME_MIN_<dur>`/`VOLUME_MAX_<dur>` acima. Uma
 * escola nova nasce (`tools/criar-escola.sh`) a declarar **só 60 e 120**. Resultado medido:
 *
 *   · a turma passou a 90 min  → «sem faixa de volume para 90 min» → a geração morreu;
 *   · passou a 110 min         → «sem faixa de volume para 110 min» → a geração morreu;
 *   · e a 70 min, antes disso, o mesmo.
 *
 * Cada duração nova exigia uma intervenção à mão em três ficheiros. Isso não escala para o que a
 * escola é: «Eu posso ter aulas de 20 minutos, de 10 minutos? […] Eu poderia ter uma oficina de
 * 4 horas […] ensaios de 6 horas?» — e a resposta tem de ser sim, sem ninguém editar um `.conf`.
 *
 * A TABELA NÃO ERA PEDAGOGIA, ERA ARITMÉTICA. Medida nas cinco linhas que o repositório declara
 * (`experimentos/simulacao-marau/ciclo-01-marau-plano.md` e os `.conf` das escolas):
 *
 *   | duração | faixa      | tempos por minuto |
 *   | 60 min  | 80–100     | 1,33 – 1,67       |
 *   | 75 min  | 100–120    | 1,33 – 1,60       |
 *   | 90 min  | 120–150    | 1,33 – 1,67       |
 *   | 110 min | 145–185    | 1,32 – 1,68       |
 *   | 120 min | 150–200    | 1,25 – 1,67       |
 *
 * É uma linha recta de 4/3 a 5/3 tempos por minuto, amostrada em cinco pontos. O sistema estava a
 * pedir à escola que declarasse à mão cada ponto de uma função que ele próprio sabe calcular.
 *
 * A ORDEM DAS RESPOSTAS, e é ela que torna a mudança segura:
 *
 *   1. **A faixa declarada para aquela duração ganha** — `VOLUME_MIN_110`/`VOLUME_MAX_110`, ou
 *      `VOLUME_MIN`/`VOLUME_MAX` até 60 minutos. Nada do que já está escrito muda de sentido;
 *      uma escola que quer uma dose diferente da padrão continua a mandar.
 *   2. **A proporção da escola**, se ela declarar uma (`VOLUME_POR_MINUTO_MIN`/`_MAX`).
 *   3. **A proporção padrão**, 4/3 a 5/3 — a que as cinco linhas medidas já seguem.
 *
 * Só a 2 e a 3 são novas; a 1 é tudo o que existe hoje, intacto. É por isso que esta correcção
 * não reescreve nenhum documento publicado.
 *
 * O QUE ISTO NÃO SABE, e não finge saber: a proporção mente nos extremos. Aos 10 minutos, 14
 * tempos não dão para aquecer, barra e centro; às 6 horas, 800 tempos não são uma aula, são
 * fadiga. Esses limites são pedagógicos e ficam declarados como aviso — `suspeitaDaDuracao` —,
 * nunca como bloqueio. O sistema registra; não avalia.
 */

'use strict';

/* 4/3 e 5/3 — em fracção, e não em decimal, porque `4 * 60 / 3` dá 80 exacto e `1.3333 * 60` dá
 * 79.998. A diferença aparece no `ceil`/`floor`, e um volume de 79 tempos num dia em que a tabela
 * diz 80 seria um defeito invisível que ninguém procuraria. */
const PROPORCAO_PADRAO = Object.freeze({
  min: Object.freeze({ numerador: 4, denominador: 3 }),
  max: Object.freeze({ numerador: 5, denominador: 3 }),
});

/** A duração, em minutos, de um valor do cadastro. Devolve `0` quando não há duração legível. */
function minutosDeDuracao(valor) {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

/** Uma fracção `{numerador, denominador}` a partir de dois números do `.conf`. `null` se inválida. */
function proporcaoDe(minimo, maximo) {
  const a = Number(String(minimo == null ? '' : minimo).replace(',', '.'));
  const b = Number(String(maximo == null ? '' : maximo).replace(',', '.'));
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
  if (a > b) return null;
  /* Guarda-se como décimos inteiros para a conta sair em aritmética de inteiros: 1,4 tempos por
   * minuto é 14/10. Assim não há `float` no caminho, e o resultado é reprodutível. */
  return { min: { numerador: Math.round(a * 1000), denominador: 1000 },
    max: { numerador: Math.round(b * 1000), denominador: 1000 } };
}

/** `ceil` de uma fracção vezes um inteiro, sem passar por vírgula flutuante. */
function teto(faccao, minutos) {
  return Math.ceil((faccao.numerador * minutos) / faccao.denominador);
}

/** `floor` de uma fracção vezes um inteiro, pela mesma razão. */
function chao(faccao, minutos) {
  return Math.floor((faccao.numerador * minutos) / faccao.denominador);
}

/**
 * A FAIXA DE VOLUME PARA UMA DURAÇÃO, com a origem declarada.
 *
 * Devolve `{ min, max, origem, proporcao }`, onde `origem` é:
 *   · `'declarada'` — o `.conf` da escola declara o par desta duração, e é ele que manda;
 *   · `'proporcao-da-escola'` — a escola declarou `VOLUME_POR_MINUTO_MIN`/`_MAX`;
 *   · `'proporcao-padrao'` — 4/3 a 5/3;
 *   · `null` — sem duração legível não há faixa (e é a lacuna, não um zero: um zero faria a aula
 *     sair com um volume de 0 tempos sem dizer porquê).
 *
 * `identidade` é o mapa de variáveis do `.conf` da escola (ou da variante, que as copia).
 */
function faixaDoVolume(duracaoMin, identidade) {
  const minutos = minutosDeDuracao(duracaoMin);
  if (!minutos) return { min: 0, max: 0, origem: null, proporcao: null, minutos: 0 };
  const m = identidade || {};
  const ler = (chave) => String(m[chave] == null ? '' : m[chave]).trim();

  /* 1. A DECLARADA GANHA — e a escada é a de sempre: o par explícito da duração, e o genérico
   *    até 60 minutos (a forma que as escolas de antes desta data declaram). */
  const explicitos = minutos <= 60
    ? [[ler('VOLUME_MIN_' + minutos), ler('VOLUME_MAX_' + minutos)], [ler('VOLUME_MIN'), ler('VOLUME_MAX')]]
    : [[ler('VOLUME_MIN_' + minutos), ler('VOLUME_MAX_' + minutos)]];
  for (const par of explicitos) {
    const a = Number(par[0]);
    const b = Number(par[1]);
    if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b >= a) {
      return { min: a, max: b, origem: 'declarada', proporcao: null, minutos };
    }
  }

  /* 2 e 3. A PROPORÇÃO — a da escola quando existe, a padrão quando não. */
  const daEscola = proporcaoDe(ler('VOLUME_POR_MINUTO_MIN'), ler('VOLUME_POR_MINUTO_MAX'));
  const proporcao = daEscola || PROPORCAO_PADRAO;
  const min = teto(proporcao.min, minutos);
  const max = chao(proporcao.max, minutos);
  if (!(max >= min) || max <= 0) {
    return { min: 0, max: 0, origem: null, proporcao: null, minutos };
  }
  return {
    min, max,
    origem: daEscola ? 'proporcao-da-escola' : 'proporcao-padrao',
    proporcao: {
      min: proporcao.min.numerador / proporcao.min.denominador,
      max: proporcao.max.numerador / proporcao.max.denominador,
    },
    minutos,
  };
}

/**
 * O AVISO DE DURAÇÃO SUSPEITA — o que a proporção não sabe, e diz que não sabe.
 *
 * Aos 10 minutos, 14 tempos não dão para aquecer, barra e centro. Às 6 horas, 800 tempos não são
 * uma aula, são fadiga. A linha recta está aritmeticamente certa e pedagogicamente cega nos
 * extremos.
 *
 * Devolve `null` quando não há nada a dizer — e é o caso comum, para a esmagadora maioria das
 * aulas não levar um aviso que só faria ruído.
 */
const DURACAO_CURTA = 30;
const DURACAO_LONGA = 180;

function suspeitaDaDuracao(duracaoMin) {
  const minutos = minutosDeDuracao(duracaoMin);
  if (!minutos) return null;
  if (minutos < DURACAO_CURTA) {
    return 'uma aula de ' + minutos + ' min é curta para aquecer, barra e centro: a proporção dá '
      + 'o número, mas o número pode não dar a aula. Vale conferir a distribuição por bloco.';
  }
  if (minutos > DURACAO_LONGA) {
    return 'uma aula de ' + minutos + ' min não é o mesmo que três aulas seguidas: a proporção '
      + 'estica o volume, e o que estica com ele é a fadiga. Vale conferir a dose por exercício.';
  }
  return null;
}


/* ===========================================================================
 * O IMPACTO DE MUDAR A DURAÇÃO — o «antes/depois» que o gesto mostra
 * ===========================================================================
 *
 * PORQUE ISTO EXISTE. Mudar a duração de uma Sala é raro — «é muito raro, mas muito raro, mas
 * pode acontecer» — e quando acontece, o que a pessoa vê é um formulário onde o número mudou. O
 * que ela NÃO vê é o que mudou atrás: o total de volume, as proporções por bloco, e a dose por
 * exercício. Três coisas, e as três comportam-se de maneira diferente:
 *
 *   1. **O total de volume** — recalcula-se sozinho, pela faixa da duração nova. É aritmética.
 *   2. **As proporções por bloco** — dependem da UNIDADE em que foram escritas:
 *        · em `percentual`, não mudam: 30% de 90 tempos são 27, 30% de 165 são 49,5. Um clique.
 *        · em `minutos`, a soma tem de fechar com a duração, e os números foram escritos para a
 *          duração ANTIGA. Aos 60 min, 18+18+18+6=60 ✓; aos 120, os mesmos 18+18+18+6=60 deixam
 *          METADE da aula por declarar. Aqui não basta confirmar: os números têm de ser
 *          reajustados — e a proporção diz para quanto.
 *   3. **A dose por exercício** (`contexto-volume`, ex.: 3 a 6 séries) — NÃO tem conta. Uma série
 *      não é tempo: dobrar a duração pode significar mais tempo por exercício, ou mais
 *      exercícios, ou mais intensidade — três respostas pedagógicas, e nenhuma é aritmética. O
 *      sistema diz que a dose foi escrita para outra duração e PEDE A DECISÃO; não sugere número,
 *      porque o número seria inventado.
 *
 * O QUE ELA DECIDIU (20/11/2026): «a dose de três a seis séries vamos pedir para ser revista e a
 * gente não vai propor número, é o professor que vai decidir, mas a gente diz que ele tem que
 * rever». E: «se manter assim vai dar errado» — não dá errado TECNICAMENTE (o documento gera, o
 * PDF sai); o que acontece é que o plano passa a declarar uma dose pensada para outra aula. É um
 * erro pedagógico, e o sistema não deve fingir que sabe corrigi-lo.
 */

/** O valor de uma resposta do envelope, desembrulhando `{valor, origem, …}`. */
function valorDaResposta(envelope, id) {
  const cru = ((envelope && envelope.respostas) || {})[id];
  if (cru === undefined || cru === null) return null;
  if (typeof cru === 'object' && !Array.isArray(cru) && 'valor' in cru) return cru.valor;
  return cru;
}

/** Um número de uma célula da proporção: aceita «40%», «30 min», «2,5». */
function numeroDaCelula(valor) {
  const limpo = String(valor == null ? '' : valor).replace(/[^\d,.-]/g, '').replace(',', '.');
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

/** O nome do bloco e a proporção de uma linha da tabela, procurados pelo NOME da coluna. */
function linhaDoBloco(linha) {
  if (!linha || typeof linha !== 'object' || Array.isArray(linha)) return null;
  let nome = '';
  let celula = null;
  for (const chave of Object.keys(linha)) {
    const k = String(chave).toLowerCase();
    if (!nome && /^(bloco|blocos|momento|parte)$/.test(k)) nome = String(linha[chave] == null ? '' : linha[chave]).trim();
    if (celula === null && /(propor|fatia|percent|porcent|tempo|minuto|duracao)/.test(k)) celula = linha[chave];
  }
  if (!nome) return null;
  return { bloco: nome, valor: numeroDaCelula(celula) };
}

/** O total de uma tabela de proporções, arredondado a duas casas. */
function somar(linhas) {
  const total = linhas.reduce((s, l) => s + (l.valor === null ? 0 : l.valor), 0);
  return Math.round(total * 100) / 100;
}

/** Um número legível em português: inteiro sem casas, fraccionário com uma. */
function numeroLegivel(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

/**
 * O IMPACTO DE IR DE `deMin` PARA `paraMin` MINUTOS.
 *
 * Devolve um objecto com as três partes, e `null` quando a duração não mudou (não há nada a
 * perguntar, e um modal sem pergunta é um clique a mais).
 *
 *   {
 *     mudou: { de, para },
 *     volume:  { de: {min,max,total}, para: {min,max,total} },
 *     proporcao: { unidade, precIsAjuste, linhas: [{bloco, de, para}], totalDe, totalPara, alvoDe, alvoPara },
 *     dose:    { valor, texto, paraRever },
 *     suspeita: '…' | null,
 *   }
 */
function impactoDaDuracao({ plano, deMin, paraMin, identidadeDe, identidadePara }) {
  const de = minutosDeDuracao(deMin);
  const para = minutosDeDuracao(paraMin);
  if (!de || !para || de === para) return null;

  /* 1. O VOLUME TOTAL. A faixa é a da duração, e o total é o ponto médio — a mesma conta que a
   *    `derivarAula01` já faz (`Math.round((volMin + volMax) / 2)`). Duas contas diferentes para o
   *    mesmo número fariam a prévia dizer uma coisa e o documento outra. */
  const faixaDe = faixaDoVolume(de, identidadeDe || identidadePara);
  const faixaPara = faixaDoVolume(para, identidadePara || identidadeDe);
  const totalDe = faixaDe.min && faixaDe.max ? Math.round((faixaDe.min + faixaDe.max) / 2) : 0;
  const totalPara = faixaPara.min && faixaPara.max ? Math.round((faixaPara.min + faixaPara.max) / 2) : 0;

  /* 2. AS PROPORÇÕES POR BLOCO. A unidade decide tudo, e é ela que está declarada no envelope —
   *    não se adivinha pela forma do número. */
  const bruto = valorDaResposta(plano, 'distribuicao-de-volume');
  const registado = bruto && !Array.isArray(bruto) && typeof bruto === 'object' ? bruto : null;
  const unidade = registado && registado.unidade ? String(registado.unidade).trim().toLowerCase() : null;
  const linhasDoPlano = Array.isArray(bruto) ? bruto
    : (registado && Array.isArray(registado.linhas)) ? registado.linhas : [];
  const linhasLidas = linhasDoPlano.map(linhaDoBloco).filter(Boolean);

  let proporcao = null;
  if (linhasLidas.length && (unidade === 'percentual' || unidade === 'minutos')) {
    const emMinutos = unidade === 'minutos';
    const linhas = linhasLidas.map((l) => ({
      bloco: l.bloco,
      de: l.valor,
      /* Em minutos, a regra de três: o que o bloco tinha era uma fatia do tempo antigo, e a mesma
       * fatia do tempo novo é `valor × para ÷ de`. Arredonda a uma casa — meio minuto é legível,
       * 16,666 não é. */
      para: l.valor === null ? null : (emMinutos
        ? Math.round((l.valor * para / de) * 10) / 10
        : l.valor),
    }));
    const totalDe = somar(linhasLidas);
    const totalPara = somar(linhas.map((l) => ({ valor: l.para })));
    proporcao = {
      unidade,
      /* SÓ OS MINUTOS PRECISAM DE INTERVENÇÃO. Em percentual a soma é 100 e não se move; em
       * minutos a soma tem de fechar com a duração, e mudou de alvo. */
      precisaAjuste: emMinutos,
      alvoDe: emMinutos ? de : 100,
      alvoPara: emMinutos ? para : 100,
      totalDe, totalPara,
      linhas,
    };
  }

  /* 3. A DOSE POR EXERCÍCIO. Não tem conta, e o sistema não inventa uma. */
  const dose = valorDaResposta(plano, 'contexto-volume');
  let doseTexto = null;
  if (dose && typeof dose === 'object') {
    const min = dose.min !== undefined ? dose.min : dose.minimo;
    const max = dose.max !== undefined ? dose.max : dose.maximo;
    const un = dose.unidade || dose.unidades || '';
    if (min !== undefined || max !== undefined) {
      doseTexto = numeroLegivel(Number(min)) + (String(min) !== String(max) ? ' a ' + numeroLegivel(Number(max)) : '')
        + (un ? ' ' + String(un) : '');
    }
  } else if (dose !== null && dose !== undefined && String(dose).trim()) {
    doseTexto = String(dose).trim();
  }

  return {
    mudou: { de, para },
    volume: {
      de: { min: faixaDe.min, max: faixaDe.max, total: totalDe, origem: faixaDe.origem },
      para: { min: faixaPara.min, max: faixaPara.max, total: totalPara, origem: faixaPara.origem },
    },
    proporcao,
    dose: { texto: doseTexto, paraRever: Boolean(doseTexto) },
    suspeita: suspeitaDaDuracao(para),
  };
}

/**
 * O REESCALONAMENTO DA DISTRIBUIÇÃO POR BLOCO — a decisão «sim, recalcula» posta em prática.
 *
 * O QUE ELE RESOLVE, com o número: uma aula de 60 min com 18+18+18+6 = 60 minutos declarados. A
 * duração passa a 120. As fatias em PERCENTUAL não têm problema — 30% continua a ser 30% de outra
 * coisa. As fatias em MINUTOS têm: 18+18+18+6 continuam a somar 60 numa aula de 120, e **metade da
 * aula fica por declarar**. O formulário só avisa («faltar avisa»), portanto gravaria, e a Aula 01
 * imprimiria os tempos a metade.
 *
 * A CONTA É A REGRA DE TRÊS, e ela preserva a INTENÇÃO e não só a soma: o que o professor declarou
 * foi uma proporção entre blocos (o Solo vale o mesmo que a Barra). Multiplicar todos pelo mesmo
 * factor mantém essa relação, e é isso que ele quer dizer com «recalcular».
 *
 * O QUE NÃO É REESCALONADO, e é de propósito: se a soma declarada não fechava com a duração antiga,
 * a nova também não fecha — a diferença é conservada, e não distribuída. Inventar o que faltava
 * seria decidir pedagogia, e a lacuna é informação.
 *
 * Devolve o valor novo de `distribuicao-de-volume` (a mesma forma do envelope, com as linhas
 * trocadas), ou `null` quando não há nada a reescalonar — sem tabela, em percentual, ou sem linhas
 * legíveis. `null` significa «não toques», e não «falhou».
 */
function escalarDistribuicao(atual, deMin, paraMin) {
  const de = minutosDeDuracao(deMin);
  const para = minutosDeDuracao(paraMin);
  if (!de || !para || de === para) return null;
  if (!atual || typeof atual !== 'object') return null;
  const bruto = (atual && typeof atual === 'object' && 'valor' in atual && !Array.isArray(atual.valor))
    ? atual.valor : atual;
  if (!bruto || typeof bruto !== 'object') return null;
  const unidade = String(bruto.unidade || '').trim().toLowerCase();
  /* EM PERCENTUAL NÃO SE TOCA — e o teste é o que impede o pior dos mundos: reescalonar uma tabela
   * de percentagens transformaria 30% em 60%, e a soma deixaria de ser 100. */
  if (unidade !== 'minutos') return null;
  const linhas = Array.isArray(bruto.linhas) ? bruto.linhas : null;
  if (!linhas || !linhas.length) return null;

  let mudouAlgo = false;
  const novas = linhas.map((linha) => {
    if (!linha || typeof linha !== 'object' || Array.isArray(linha)) return linha;
    const copia = Object.assign({}, linha);
    for (const chave of Object.keys(copia)) {
      if (!/(propor|fatia|percent|porcent|tempo|minuto|duracao)/i.test(String(chave))) continue;
      const numero = numeroDaCelula(copia[chave]);
      if (numero === null || numero === 0) continue;
      const escalado = Math.round((numero * para / de) * 10) / 10;
      const sufixo = String(copia[chave]).replace(/[\d.,-]+/g, '');
      copia[chave] = numeroLegivel(escalado) + (sufixo || '');
      mudouAlgo = true;
    }
    return copia;
  });
  if (!mudouAlgo) return null;
  const valorNovo = Object.assign({}, bruto, { linhas: novas });
  return 'valor' in atual && !Array.isArray(atual.valor) ? Object.assign({}, atual, { valor: valorNovo }) : valorNovo;
}

module.exports = {
  PROPORCAO_PADRAO,
  DURACAO_CURTA,
  DURACAO_LONGA,
  minutosDeDuracao,
  proporcaoDe,
  faixaDoVolume,
  suspeitaDaDuracao,
  /* O IMPACTO DE MUDAR A DURAÇÃO — o que o gesto mostra antes de gravar. */
  impactoDaDuracao,
  escalarDistribuicao,
  numeroLegivel,
};
