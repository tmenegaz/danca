#!/usr/bin/env node
'use strict';

/**
 * provar-manifesto-do-plano.js — o plano preenche o manifesto, e o CI deixa de acusar
 * «DATA_INICIO não está declarado» (18/10/2026).
 *
 * O defeito que esta prova trava apareceu como um CI vermelho de dois dias na escola `fita`,
 * com esta mensagem:
 *
 *   tools/gerar-ciclo.sh: line 102: DOCS: defina DOCS (lista ordenada de documentos) no manifesto
 *
 * e, atrás dela, uma segunda recusa que ninguém tinha visto ainda:
 *
 *   erro: Pré-requisito 5 incompleto — 'DATA_INICIO' não está declarado em ciclo-01-fita.conf.
 *
 * As duas têm a mesma raiz: **o manifesto da variante não era atualizado pelo ato do PLANO**.
 * Só o PO o fazia (`escrever-ciclo.js`, passo 4). Um ciclo com plano e sem PO — que é o estado
 * normal de quem acabou de eliciar o plano — ficava com `DOCS=""` e com
 * `DATA_INICIO="[Preencher: …]"`, e o Pré-requisito 5 recusa a lacuna. Não havia como o CI
 * ficar verde sem um PO, e o erro que aparecia primeiro (`DOCS`) escondia o segundo.
 *
 * A terceira causa, medida aqui também: `minutosDaDuracao()` exigia `Array.isArray` e devolvia
 * `null` para a forma que o envelope realmente usa (`{numero, unidade}`). `DURACOES` e
 * `DURACAO_POR_DIA` **nunca** eram escritos pelo ato — foi assim que um plano de 55 min
 * conviveu, sem ninguém notar, com um manifesto de 60.
 *
 * O que esta prova fixa:
 *
 *   1. a duração chega como OBJETO e é lida — era o caso que devolvia `null`;
 *   2. duas durações viram LISTA (`60,120`), não soma (`180`) — o `.conf` lê `DURACOES` como
 *      «curta e longa», e 180 min aplicaria uma faixa de volume que não existe;
 *   3. o ato do plano escreve o CONTEXTO no manifesto: `DATA_INICIO`, `DIAS`, `FREQUENCIA`,
 *      `DURACOES`, `DURACAO_POR_DIA`, `TOTAL_AULAS`;
 *   4. e liga o `DOCS` na MESMA escrita — uma segunda escrita falharia, porque a primeira já
 *      mudou o `sha`;
 *   5. é idempotente: manifesto já completo não gera escrita nenhuma;
 *   6. o PLANO prevalece sobre um valor escrito à mão — é ele que estabelece o calendário, e o
 *      `.conf` é derivado dele. A exceção é a HORA do `DIAS`, que é institucional e não
 *      elicitada: ela é lida do próprio manifesto e preservada;
 *   7. o resultado é ACEITO pelo Pré-requisito 5, na MESMA condição que o gerador aplica
 *      (`[ -z "$valor" ] || grep -q '\['`): a prova carrega o manifesto num `bash` e corre a
 *      checagem, em vez de confiar no olho.
 *
 *   uso: node experimentos/provar-manifesto-do-plano.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { minutosDaDuracao, linhasDeContexto, aplicarLinhas, calibracaoDoConf } =
  require('../motor/servidor/escrever-ciclo.js');
const { atualizarManifesto } = require('../motor/servidor/escrever-plano.js');

const RAIZ = path.join(__dirname, '..');
let falhas = 0;

function ok(titulo, condicao, detalhe) {
  if (condicao) {
    console.log('  ok     ' + titulo);
  } else {
    falhas++;
    console.log('  FALHA  ' + titulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
  }
}
function igual(titulo, obtido, esperado) {
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  ok(titulo + (a === b ? '' : '  (obtido ' + a + ', esperado ' + b + ')'), a === b, { obtido, esperado });
}

// ---------------------------------------------------------------- o manifesto de uma escola
// A forma REAL de uma variante recém-criada: `DOCS=""` e a lacuna do calendário. É o que
// `tools/criar-escola.sh` escreve e o que o ato do plano tem de completar.
const CONF_CRU = `# variante de ensaio
VARIANTE="fita"
ESCOLA="Fita"
ESCOLA_HABILITADA="sim"

FREQUENCIA="2x/semana"
DIAS="2@19:00,4@19:00"
DURACAO_POR_DIA="60 min por encontro"
DURACOES="60"
DATA_INICIO="[Preencher: data de início — o plano elicitado a estabelece]"

NOME="Ciclo 01 — Fita"
OBJETIVO_GERAL="[Preencher: objetivo geral do ciclo — o plano elicitado a estabelece]"
TOTAL_AULAS="5"

DOCS=""
`;

// O envelope do plano, na forma que a porta grava: `contexto` + `respostas` por id de nó.
const ENVELOPE = {
  contexto: { professor: 'tiago-menegaz', ciclo: '01', escola: 'fita', turma: 'Teste' },
  respostas: {
    'objetivo-geral': 'Objetivo geral do ciclo - teste',
    'marcos-por-aula': 'marco 1 teste\nmarco 2 teste\nmarco 3 teste',
    'contexto-frequencia': { vezes: 3, por: 'semana', dias: ['ter', 'qui', 'sex'] },
    'contexto-duracao': { numero: 55, unidade: 'minutos' },
    'contexto-calendario': { inicio: '2026-10-16', fim: '2026-10-30' },
    'contexto-total-aulas': 7,
    'contexto-volume': { min: 3, max: 6, unidade: 'séries' },
    'contexto-registro': { presentes: ['professor', 'alunas da turma'], observa: ['o próprio professor'] },
    'contexto-metodologia': 'Escola livre',
    'contexto-metodologia-origem': 'Eu escolho',
  },
};

/** Um `fetch` falso que serve o `CONF_CRU` e captura o PUT. `escritas` conta as gravações. */
function criarFetch(confInicial) {
  const estado = { conteudo: confInicial, escritas: 0, enviado: null };
  const falso = async (url, opt) => {
    if (!opt || opt.method === 'GET') {
      return {
        status: 200,
        json: async () => ({ sha: 'sha-' + estado.escritas, content: Buffer.from(estado.conteudo).toString('base64') }),
      };
    }
    estado.escritas++;
    estado.enviado = JSON.parse(opt.body);
    estado.conteudo = Buffer.from(estado.enviado.content, 'base64').toString('utf8');
    return { status: 200, json: async () => ({}) };
  };
  return { falso, estado };
}

(async () => {
  console.log('MANIFESTO DO PLANO — o ato do plano completa o .conf\n');

  // ── 1. A duração: objeto × lista ────────────────────────────────────────────
  console.log('1. A duração vem como OBJETO, e duas durações são lista');
  igual('{numero:55, unidade:minutos} → 55', minutosDaDuracao({ numero: 55, unidade: 'minutos' }), '55');
  igual('{numero:2, unidade:horas} → 120', minutosDaDuracao({ numero: 2, unidade: 'horas' }), '120');
  /* A FORMA COMPOSTA, e esta asserção já dizia o contrário (20/11/2026).
   *
   * O campo do plano é UMA duração em duas parcelas — o conteúdo declara-o com
   * `"medida": { "pares": 2, "fixas": ["hora", "minuto"] }`, e o rótulo é «Duração por aula».
   * A leitura de «lista de alternativas» é do `DURACOES` do `.conf`, que é outro campo com o
   * mesmo nome. A confusão custou uma geração: uma Sala de 70 min (1 h 10) compôs
   * `DURACAO_POR_DIA="10,60 min por encontro"` e o gerador morreu na Regra 9. */
  igual('1 hora + 10 minutos → "70" (é uma duração, não duas)', minutosDaDuracao([
    { numero: 1, unidade: 'hora' }, { numero: 10, unidade: 'minuto' },
  ]), '70');
  igual('2 horas + 30 minutos → "150"', minutosDaDuracao([
    { numero: 2, unidade: 'hora' }, { numero: 30, unidade: 'minuto' },
  ]), '150');
  igual('CONTROLE NEGATIVO: a ordem das parcelas não muda a soma', minutosDaDuracao([
    { numero: 10, unidade: 'minuto' }, { numero: 1, unidade: 'hora' },
  ]), '70');
  igual('duração repetida não se duplica', minutosDaDuracao([
    { numero: 60, unidade: 'minutos' }, { numero: 60, unidade: 'minutos' },
  ]), '60');
  igual('sem duração → null', minutosDaDuracao(null), null);
  igual('texto solto não é inventado → null', minutosDaDuracao('55 minutos'), null);

  /* ── 1.1 A FAIXA DE VOLUME E A DA DURACAO (20/11/2026) ────────────────────────
   *
   * O DEFEITO MEDIDO. A Sala Rosa passou de 60 para 90 minutos. O .conf da variante passou a
   * declarar DURACOES="90" e VOLUME_MIN_90="120" / VOLUME_MAX_90="150" — mas calibracaoDoConf
   * continuava a ler VOLUME_MIN / VOLUME_MAX, as chaves da faixa de 60, que o comporConf já não
   * escreve num manifesto de 90. Lia 0, o volume-alvo dava 0, e a Aula 01 saía com
   * «[Preencher: volume em tempos]» — que o gerar-ciclo.sh RECUSA:
   *
   *   erro: aula-01 não declara 'volume-total-90:' para o dia de 90 min (Regra 9).
   *
   * A escada é a do próprio gerador (corrigida em 18/10/2026 para o mesmo problema numa aula
   * de 75 min): acima dos 60, a chave explícita da duração; até 60, ela ou a genérica. */
  const cal = (texto) => calibracaoDoConf(texto);
  igual('45 min sem chave própria → a faixa genérica', cal(
    'DURACOES="45"\nVOLUME_MIN="80"\nVOLUME_MAX="100"').volumeMin, 80);
  igual('60 min com a chave _60 explícita → essa', cal(
    'DURACOES="60"\nVOLUME_MIN_60="90"\nVOLUME_MAX_60="110"').volumeMax, 110);
  igual('90 min → VOLUME_MIN_90, e não a de 60', cal(
    'DURACOES="90"\nVOLUME_MIN="80"\nVOLUME_MIN_90="120"\nVOLUME_MAX_90="150"').volumeMin, 120);
  igual('120 min → VOLUME_MIN_120', cal(
    'DURACOES="120"\nVOLUME_MIN_120="150"\nVOLUME_MAX_120="200"').volumeMax, 200);
  /* E A NEGATIVA QUE IMPORTA, que mudou de forma em 20/11/2026 mas não de conteúdo.
   *
   * ANTES: «90 min sem a chave → 0». O zero era a lacuna, e era melhor do que ler a faixa de 60
   * numa aula de 90 — que foi o defeito de 19/10/2026 («uma aula de 75 min era medida com a régua
   * da de 120»).
   *
   * AGORA: a faixa calcula-se (4/3 a 5/3 da duração), portanto o zero deixou de ser a resposta
   * certa. O que a negativa tem de continuar a garantir é o essencial: **o par de 60 não é lido
   * numa aula de 90**. A aula de 90 min com `VOLUME_MIN=80` declarado tem de responder 120–150 —
   * a proporção — e não 80–100, e a origem tem de dizer que o número foi calculado. */
  const semChave = cal('DURACOES="90"\nVOLUME_MIN="80"\nVOLUME_MAX="100"');
  igual('CONTROLE NEGATIVO: 90 min sem a chave NÃO lê a faixa de 60', semChave.volumeMin, 120);
  igual('…e o máximo também não', semChave.volumeMax, 150);
  igual('…e a origem diz que o número foi calculado, e não declarado',
    semChave.volumeOrigem, 'proporcao-padrao');
  /* A mesma negativa numa duração que nenhuma tabela previu — é o caso que falhava na geração
   * («sem faixa de volume para 94 min»), e é o que a proporção vem resolver. */
  const semTabela = cal('DURACOES="94"');
  igual('94 min, que nenhuma tabela previu, tem faixa', semTabela.volumeMin, 126);
  igual('…e o máximo é 5/3 da duração', semTabela.volumeMax, 156);
  /* E a PROPORÇÃO DA ESCOLA ganha da padrão — é a válvula de quem quer outra dose. */
  const daEscola = cal('DURACOES="60"\nVOLUME_POR_MINUTO_MIN="1.5"\nVOLUME_POR_MINUTO_MAX="2.0"');
  igual('a proporção da escola ganha da padrão', daEscola.volumeMax, 120);
  igual('…e a origem nomeia a escola', daEscola.volumeOrigem, 'proporcao-da-escola');

  // ── 2. As linhas de contexto que o plano sabe responder ─────────────────────
  console.log('\n2. O contexto que o plano já responde');
  const linhas = linhasDeContexto(ENVELOPE, CONF_CRU);
  const mapa = Object.fromEntries(linhas.map((l) => [l.chave, l.valor]));
  igual('DATA_INICIO em dd/mm/aaaa', mapa.DATA_INICIO, '16/10/2026');
  igual('FREQUENCIA', mapa.FREQUENCIA, '3x/semana');
  igual('DIAS preserva a hora e acrescenta o dia novo', mapa.DIAS, '2@19:00,4@19:00,5@19:00');
  igual('DURACOES', mapa.DURACOES, '55');
  igual('DURACAO_POR_DIA', mapa.DURACAO_POR_DIA, '55 min por encontro');
  igual('TOTAL_AULAS', mapa.TOTAL_AULAS, '7');

  // ── 3. A escrita no manifesto: contexto + DOCS, uma vez só ──────────────────
  console.log('\n3. O ato do plano escreve o manifesto (contexto + DOCS)');
  const { falso, estado } = criarFetch(CONF_CRU);
  const r1 = await atualizarManifesto({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    contexto: ENVELOPE.contexto, plano: ENVELOPE, fetchImpl: falso,
  });
  ok('a escrita foi aceita', r1.ok === true, r1);
  igual('UMA escrita, não duas (o sha muda na primeira)', estado.escritas, 1);
  const novo = estado.conteudo;
  ok('DATA_INICIO saiu da lacuna', !/\[Preencher[^\]]*data de início/.test(novo));
  ok('…e vale 16/10/2026', /^DATA_INICIO="16\/10\/2026"$/m.test(novo));
  ok('DOCS virou "plano"', /^DOCS="plano"$/m.test(novo));
  ok('DURACOES = 55', /^DURACOES="55"$/m.test(novo));
  ok('TOTAL_AULAS = 7', /^TOTAL_AULAS="7"$/m.test(novo));
  ok('o comentário do topo sobreviveu', novo.startsWith('# variante de ensaio'));
  ok('o OBJETIVO_GERAL não foi tocado', /\[Preencher: objetivo geral/.test(novo));

  // ── 4. Idempotência ────────────────────────────────────────────────────────
  console.log('\n4. Segunda passagem não escreve nada');
  const r2 = await atualizarManifesto({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    contexto: ENVELOPE.contexto, plano: ENVELOPE, fetchImpl: falso,
  });
  ok('devolve ok', r2.ok === true, r2);
  igual('…sem escrever', r2.atualizado, false);
  igual('…e sem uma segunda gravação', estado.escritas, 1);

  // ── 5. A precedência: o plano é a fonte; a hora institucional é preservada ─
  console.log('\n5. O plano prevalece, menos na hora institucional');
  const CONF_COM_DATA = CONF_CRU.replace(
    'DATA_INICIO="[Preencher: data de início — o plano elicitado a estabelece]"',
    'DATA_INICIO="01/11/2026"',
  ).replace('DIAS="2@19:00,4@19:00"', 'DIAS="2@19:00,4@19:00"');
  const comData = criarFetch(CONF_COM_DATA);
  await atualizarManifesto({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    contexto: ENVELOPE.contexto, plano: ENVELOPE, fetchImpl: comData.falso,
  });
  ok('a data do PLANO prevalece sobre a escrita à mão',
    /^DATA_INICIO="16\/10\/2026"$/m.test(comData.estado.conteudo), comData.estado.conteudo);

  // A hora é institucional: o plano traz os DIAS, não a hora. Quem a tem é o manifesto.
  const envelopeSemHora = { contexto: ENVELOPE.contexto, respostas: Object.assign({}, ENVELOPE.respostas) };
  delete envelopeSemHora.respostas['contexto-frequencia'];
  const comHora = criarFetch(CONF_COM_DATA);
  await atualizarManifesto({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    contexto: ENVELOPE.contexto, plano: envelopeSemHora, fetchImpl: comHora.falso,
  });
  ok('sem resposta de frequência, o DIAS do manifesto (com a hora) fica intacto',
    /^DIAS="2@19:00,4@19:00"$/m.test(comHora.estado.conteudo), comHora.estado.conteudo);

  const semPlano = criarFetch(CONF_COM_DATA);
  await atualizarManifesto({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    contexto: ENVELOPE.contexto, plano: null, fetchImpl: semPlano.falso,
  });
  ok('sem envelope, só o DOCS é ligado — o contexto fica intacto',
    /^DATA_INICIO="01\/11\/2026"$/m.test(semPlano.estado.conteudo) &&
    /^DOCS="plano"$/m.test(semPlano.estado.conteudo), semPlano.estado.conteudo);

  // ── 6. O manifesto resultante passa o Pré-requisito 5 do gerador ───────────
  // A prova que fecha o caso, com a MESMA condição que `tools/gerar-ciclo.sh` aplica:
  //
  //   for campo in ESCOLA FREQUENCIA DIAS DURACOES DATA_INICIO TOTAL_AULAS; do
  //     valor="${!campo:-}"
  //     if [ -z "$valor" ] || printf '%s' "$valor" | grep -q '\['; then ... exit 1
  //
  // Correr o script inteiro exigiria copiar o repositório (o `RAIZ` sai da localização do
  // script, não do `cwd`), e o que se quer medir é a guarda — então é a guarda que corre.
  console.log('\n6. O manifesto resultante passa o Pré-requisito 5');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'manifesto-'));
  try {
    const confFinal = path.join(tmp, 'ciclo-01-fita.conf');
    fs.writeFileSync(confFinal, estado.conteudo);
    const base = path.join(RAIZ, 'professores/tiago-menegaz/ciclos/ciclo-01.conf');

    const script = `
      set -euo pipefail
      source "${base}"
      source "${confFinal}"
      faltando=""
      for campo in ESCOLA FREQUENCIA DIAS DURACOES DATA_INICIO TOTAL_AULAS; do
        valor="\${!campo:-}"
        if [ -z "$valor" ] || printf '%s' "$valor" | grep -q '\\['; then faltando="$faltando $campo"; fi
      done
      if [ -n "$faltando" ]; then echo "FALTANDO:$faltando"; exit 1; fi
      if [ -z "$DOCS" ]; then echo "DOCS-VAZIO"; exit 1; fi
      echo "OK:$DATA_INICIO|$DURACOES|$TOTAL_AULAS|$DOCS"
    `;
    let saida = '';
    let codigo = 0;
    try {
      saida = execFileSync('bash', ['-c', script], { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (err) {
      codigo = 1;
      saida = String((err.stdout || '') + (err.stderr || '')).trim();
    }
    igual('o Pré-requisito 5 aceita o manifesto', codigo, 0);
    igual('…e os quatro campos vieram do plano', saida, 'OK:16/10/2026|55|7|plano');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  /* ── 7. O NÚCLEO E O GERADOR CONTAM O MESMO ─────────────────────────────────
   *
   * A faixa de volume vive em dois mundos que não se podem `require`: o núcleo é JavaScript e
   * resolve-a em aritmética de inteiros (`motor/nucleo/volume.js`); o gerador é `bash` e resolve-a
   * em `awk`. Duas implementações da mesma conta divergem em silêncio — a de 19/10/2026 divergiu e
   * uma aula de 75 min foi medida com a régua da de 120.
   *
   * Esta secção é o único sítio onde as duas são chamadas lado a lado. Não compara textos: compara
   * os números que cada uma produz para as durações que a escola usa e para as que ela inventa. */
  console.log('\n7. A faixa de volume: o núcleo e o gerador contam o mesmo');
  const doNucleo = require('../motor/nucleo/volume.js');
  const doShell = (dur) => {
    const script = [
      'source /dev/stdin <<< \'\'',
      'pmin=1.333; pmax=1.667',
      'min="$(awk -v d=' + dur + ' -v p="$pmin" \'BEGIN{printf "%d", int(d*p + 0.9999)}\')"',
      'max="$(awk -v d=' + dur + ' -v p="$pmax" \'BEGIN{printf "%d", int(d*p)}\')"',
      'printf "%s-%s" "$min" "$max"',
    ].join('\n');
    return execFileSync('bash', ['-c', script], { encoding: 'utf8' }).trim();
  };
  const DURACOES_PROVADAS = [10, 20, 45, 50, 60, 70, 75, 88, 90, 94, 100, 110, 120, 150, 240];
  const divergentes = DURACOES_PROVADAS.filter((d) => {
    const n = doNucleo.faixaDoVolume(d, {});
    return doShell(d) !== n.min + '-' + n.max;
  });
  igual('o núcleo e o gerador dão a MESMA faixa nas ' + DURACOES_PROVADAS.length
    + ' durações provadas', divergentes.join(',') || 'nenhuma', 'nenhuma');
  /* E o par que a Regra 9 já publicava é reproduzido pela proporção, sem chave declarada — é o que
   * mostra que a tabela era a recta, e não a recta uma aproximação da tabela. */
  const sessenta = doNucleo.faixaDoVolume(60, {});
  igual('60 min, sem chave declarada → 80–100, exactamente o par que a Regra 9 publicava',
    sessenta.min + '-' + sessenta.max + ' · ' + sessenta.origem, '80-100 · proporcao-padrao');
  const noventa = doNucleo.faixaDoVolume(90, {});
  igual('90 min, sem chave declarada → 120–150, a linha de 90 da tabela',
    noventa.min + '-' + noventa.max, '120-150');
  /* A declarada ganha sempre — a garantia de que nada do que está escrito muda de sentido. */
  const declarada = doNucleo.faixaDoVolume(120, { VOLUME_MIN_120: '150', VOLUME_MAX_120: '200' });
  igual('120 min COM o par declarado → o par declarado, e não a proporção',
    declarada.min + '-' + declarada.max + ' · ' + declarada.origem, '150-200 · declarada');

  console.log('\n' + (falhas === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + falhas + ' falha(s).');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((err) => {
  console.error('FALHOU:', err && err.stack || err);
  process.exit(1);
});
