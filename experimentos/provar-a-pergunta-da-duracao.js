#!/usr/bin/env node
'use strict';

/*
 * provar-a-pergunta-da-duracao.js — o que muda quando a aula muda de duração (20/11/2026).
 *
 * PORQUE ESTA PROVA EXISTE, e não é uma prova de cobertura.
 *
 * A duração de uma aula era um número que o sistema tratava como se fosse uma constante: a faixa
 * de volume tinha uma linha por duração exacta, e cada duração nova partia a geração. A 20/11/2026
 * ela perguntou — «eu posso ter aulas de 20 minutos, de 10 minutos? […] ensaios de 6 horas?» —, e a
 * resposta passou a ser sim. Mas «sim» abre três comportamentos diferentes, e é isso que se mede
 * aqui, um a um, porque cada um erra de uma maneira distinta:
 *
 *   1. A FAIXA. Erra se a ordem for outra que a declarada → proporção da escola → proporção
 *      padrão. Se a proporção ganhar de um par declarado, a escola perde o comando do seu próprio
 *      número em silêncio.
 *   2. O IMPACTO. Erra se a unidade não for respeitada. Em `percentual` as fatias não mudam (30%
 *      de outra coisa continua a ser 30%); em `minutos` a soma tem de fechar com a duração nova, e
 *      reescalonar uma tabela de percentagens daria 60% onde havia 30%.
 *   3. O REESCALONAMENTO. Erra se não preservar a INTENÇÃO. A regra de três mantém a relação entre
 *      blocos — e é isso que o professor quer dizer com «recalcular», não apenas que a soma feche.
 *
 * E mede-se também o que a proporção NÃO sabe: aos 10 minutos e às 6 horas a recta está
 * aritmeticamente certa e pedagogicamente cega. A frase existe, e existe para não bloquear.
 */

const volume = require('../motor/nucleo/volume.js');

let n = 0;
let falhas = 0;
function igual(rotulo, obtido, esperado) {
  n += 1;
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + '  (obtido ' + JSON.stringify(obtido) + ', esperado '
    + JSON.stringify(esperado) + ')');
}

/** O valor de uma resposta do envelope, na forma que o formulário grava. */
const resp = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });

/** Um plano com a distribuição por bloco na unidade pedida. */
function planoCom(unidade, valores, dose) {
  const linhas = valores.map((v, k) => ({
    Bloco: ['Solo', 'Barra', 'Centro', 'Musicalidade'][k] || ('Bloco ' + (k + 1)),
    'Proporção alvo': /%$/.test(String(v)) ? String(v) : v + ' min',
    Justificativa: '—',
  }));
  const respostas = { 'distribuicao-de-volume': resp({ unidade, linhas }) };
  if (dose) respostas['contexto-volume'] = resp(dose);
  return { respostas };
}

(function principal() {
  // ── 1. A ORDEM DA FAIXA ────────────────────────────────────────────────────
  console.log('\n1. A faixa de volume: declarado ganha, proporção depois, padrão no fim');

  const declarado = volume.faixaDoVolume(90, { VOLUME_MIN_90: '120', VOLUME_MAX_90: '150' });
  igual('90 min com par declarado → o par declarado', [declarado.min, declarado.max, declarado.origem],
    [120, 150, 'declarada']);
  /* A PROVA QUE IMPORTA: a proporção da escola existe, e o par declarado ganha dela na mesma. */
  const declaradoSobreProporcao = volume.faixaDoVolume(90, {
    VOLUME_MIN_90: '110', VOLUME_MAX_90: '140',
    VOLUME_POR_MINUTO_MIN: '2.0', VOLUME_POR_MINUTO_MAX: '2.5',
  });
  igual('…e ganha até da proporção da escola', [declaradoSobreProporcao.min, declaradoSobreProporcao.max,
    declaradoSobreProporcao.origem], [110, 140, 'declarada']);

  const daEscola = volume.faixaDoVolume(60, {
    VOLUME_POR_MINUTO_MIN: '1.5', VOLUME_POR_MINUTO_MAX: '2.0',
  });
  igual('sem par, a proporção da escola manda', [daEscola.min, daEscola.max, daEscola.origem],
    [90, 120, 'proporcao-da-escola']);

  const padrao = volume.faixaDoVolume(60, {});
  igual('sem nada, a proporção padrão reproduz o par que a Regra 9 publicava',
    [padrao.min, padrao.max, padrao.origem], [80, 100, 'proporcao-padrao']);

  /* A ESCADA DOS 60: até 60 minutos o par genérico ainda vale — é a forma que as escolas de antes
   * desta data declaram, e recusá-la reescreveria o que está publicado. */
  const generico = volume.faixaDoVolume(45, { VOLUME_MIN: '70', VOLUME_MAX: '95' });
  igual('45 min lê o par GENÉRICO (a forma antiga continua a valer)',
    [generico.min, generico.max, generico.origem], [70, 95, 'declarada']);
  /* E acima dos 60 o genérico NÃO é lido: foi o defeito de 19/10/2026, quando uma aula de 75 min
   * foi medida com a régua da de 120. */
  const acima60 = volume.faixaDoVolume(75, { VOLUME_MIN: '80', VOLUME_MAX: '100' });
  igual('75 min NÃO lê o par genérico de 60', [acima60.min, acima60.max, acima60.origem],
    [100, 125, 'proporcao-padrao']);

  igual('sem duração não há faixa — e é null, não zero', volume.faixaDoVolume(0, {}).origem, null);

  // ── 2. O IMPACTO: PERCENTUAL E MINUTOS ────────────────────────────────────
  console.log('\n2. O impacto: em percentagem nada muda; em minutos a soma tem de fechar');

  const emPercentagem = volume.impactoDaDuracao({
    plano: planoCom('percentual', ['30%', '30%', '30%', '10%'], '3 a 6 séries'),
    deMin: 90, paraMin: 120,
  });
  igual('em percentagem as fatias NÃO mudam', emPercentagem.proporcao.linhas.map((l) => l.para),
    [30, 30, 30, 10]);
  igual('…e não há nada a reajustar', emPercentagem.proporcao.precisaAjuste, false);
  igual('…e a soma continua 100', [emPercentagem.proporcao.totalDe, emPercentagem.proporcao.totalPara],
    [100, 100]);
  igual('…e a dose aparece, e pede revisão', [emPercentagem.dose.texto, emPercentagem.dose.paraRever],
    ['3 a 6 séries', true]);

  const emMinutos = volume.impactoDaDuracao({
    plano: planoCom('minutos', [18, 18, 18, 6], '3 a 6 séries'),
    deMin: 90, paraMin: 120,
  });
  igual('em minutos as fatias SÃO reajustadas', emMinutos.proporcao.linhas.map((l) => l.para),
    [24, 24, 24, 8]);
  igual('…e há o que reajustar', emMinutos.proporcao.precisaAjuste, true);
  igual('…e o alvo acompanha a duração', [emMinutos.proporcao.alvoDe, emMinutos.proporcao.alvoPara],
    [90, 120]);
  /* O QUE A CONTA NÃO FAZ, e é de propósito: a soma declarada era 60 numa aula de 90 — 30 minutos
   * por declarar. A nova é 80 numa de 120: a lacuna é CONSERVADA, e não distribuída. Inventar o que
   * faltava seria decidir pedagogia. */
  igual('…e a lacuna declarada é conservada, não distribuída',
    [emMinutos.proporcao.totalDe, emMinutos.proporcao.totalPara], [60, 80]);

  igual('a duração igual não tem impacto nenhum',
    volume.impactoDaDuracao({ plano: planoCom('minutos', [30, 30], '3 a 6'), deMin: 90, paraMin: 90 }),
    null);

  // ── 3. O REESCALONAMENTO ──────────────────────────────────────────────────
  console.log('\n3. O reescalonamento preserva a INTENÇÃO, e não só a soma');

  const escalado = volume.escalarDistribuicao(
    resp({ unidade: 'minutos', linhas: [
      { Bloco: 'Solo', 'Proporção alvo': '18 min' },
      { Bloco: 'Barra', 'Proporção alvo': '18 min' },
      { Bloco: 'Centro', 'Proporção alvo': '18 min' },
      { Bloco: 'Musicalidade', 'Proporção alvo': '6 min' },
    ] }), 60, 120);
  igual('60 → 120 minutos: 18/18/18/6 passa a 36/36/36/12',
    escalado.valor.linhas.map((l) => l['Proporção alvo']), ['36 min', '36 min', '36 min', '12 min']);
  igual('…e a soma fecha com a duração nova',
    escalado.valor.linhas.reduce((s, l) => s + parseInt(l['Proporção alvo'], 10), 0), 120);
  igual('…e a forma do envelope é preservada (valor/origem/respondente)',
    [escalado.origem, escalado.respondente], ['perguntado', 'professor']);

  /* A NEGATIVA QUE PROTEGE DO PIOR: reescalonar percentagens transformaria 30% em 60%, e a soma
   * deixaria de ser 100. A resposta é `null` — «não toques». */
  igual('percentagem NÃO é reescalonada', volume.escalarDistribuicao(
    resp({ unidade: 'percentual', linhas: [{ Bloco: 'Solo', 'Proporção alvo': '50%' }] }), 60, 120), null);
  igual('duração igual também não', volume.escalarDistribuicao(
    resp({ unidade: 'minutos', linhas: [{ Bloco: 'Solo', 'Proporção alvo': '30 min' }] }), 60, 60), null);

  // ── 4. O QUE A PROPORÇÃO NÃO SABE ─────────────────────────────────────────
  console.log('\n4. A proporção não sabe tudo — e passa a dizer que não sabe');

  igual('10 minutos é curta, e a frase diz porquê',
    /curta para aquecer, barra e centro/.test(String(volume.suspeitaDaDuracao(10))), true);
  igual('6 horas é longa, e a frase diz porquê',
    /não é o mesmo que três aulas seguidas/.test(String(volume.suspeitaDaDuracao(360))), true);
  /* O CASO COMUM NÃO LEVA AVISO — um aviso em toda a aula é ruído, e ruído ensina a ignorar. */
  igual('60, 90 e 120 minutos não têm nada a dizer',
    [60, 90, 120].map((d) => volume.suspeitaDaDuracao(d)), [null, null, null]);

  console.log('\n' + (falhas === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + n + ' asserções: a faixa vem'
    + ' do declarado, senão da proporção da escola, senão da padrão; em percentagem a mudança de'
    + ' duração não toca nas fatias, em minutos a regra de três reescalona-as preservando a relação'
    + ' entre blocos e a lacuna que já existia; e a duração extrema produz uma frase, nunca um'
    + ' bloqueio.');
  process.exit(falhas === 0 ? 0 : 1);
})();
