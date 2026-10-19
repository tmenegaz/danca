#!/usr/bin/env node
'use strict';

/**
 * provar-manifesto-da-turma.js — o manifesto da variante passa a ser DERIVADO do cadastro da
 * turma (fase 2 da decisão «o ciclo é da turma», 16/10/2026; 19/10/2026).
 *
 * **O defeito que esta prova trava.** O run `39192752959` mostrou, na mesma mensagem, os dois
 * lados do mesmo problema:
 *
 *   tools/gerar-ciclo.sh "tiago-menegaz" "01" "fita"
 *   erro: Pré-requisito 5 incompleto — 'DATA_INICIO' não está declarado em ciclo-01-fita.conf.
 *
 * O PO da turma tinha sido gravado (a fase 1 da migração põe a turma no nome da fonte:
 * `ciclo-01-fita-teste-po.md`), mas o gerador continuava a ler o manifesto da ESCOLA — escrito à
 * mão em 15/10, com `DATA_INICIO="[Preencher: …]"`, `DURACOES="60"` e `DIAS="2@19:00,4@19:00"`.
 * O manifesto da TURMA nunca existia. E como o workflow despacha `escola=fita`, o ciclo da turma
 * `teste` gerava com o ritmo de nenhuma turma.
 *
 * **A raiz, medida.** O mesmo fato aparecia com dois valores, e nenhum dos dois tinha de onde ser
 * conferido: o plano dizia 3×/semana, 55 min e 7 aulas; o cadastro da turma diz
 * 4×/semana, 75 min e 9 aulas no período. O `.conf`, escrito à mão, não era cópia de nenhum dos
 * dois. A regra que sai daqui é a de `PLANO-CICLO-DA-TURMA.md` §3.1: a TURMA manda no RITMO, o
 * PLANO no CONTEÚDO, a ESCOLA na NORMA — e o que diverge é REPORTADO, nunca silenciado.
 *
 * O que esta prova fixa:
 *
 *   1. o `.conf` da variante é COMPOSTO das três fontes, e as seis chaves que o Pré-requisito 5
 *      exige saem todas do cadastro da turma — nenhuma é inventada, nenhuma é «mock»;
 *   2. a turma é achada pelo NOME (é o que o contexto carrega) e pelo `id`, e só entre as
 *      VIGENTES — a derivada (`teste-2026-10-16`) é a que vale hoje;
 *   3. a contagem de aulas é a do CALENDÁRIO, não uma estimativa: 9 na turma real, com as quatro
 *      manhãs por semana;
 *   4. a turma sem hora é RECUSADA, e a recusa nomeia os dias que faltam — a hora é o que ancora
 *      o prazo de lançamento, e inventá-la produziria um calendário falso;
 *   5. o `DOCS` já escrito é PRESERVADO (e o plano entra no começo): re-eliciar o plano depois de
 *      o ciclo ter aulas não pode apagar as fontes que o gerador escreveu;
 *   6. o que diverge entre plano e turma é REPORTADO em `conflitos`, sem bloquear — quem decide é
 *      quem opera, e a prova não deixa o aviso virar silêncio;
 *   7. a faixa de volume que o gerador vai exigir para ESTA duração é declarada ANTES do CI
 *      (é a pendência que hoje trava a turma de 75 min);
 *   8. o manifesto composto passa o Pré-requisito 5 na MESMA condição do gerador — a prova
 *      carrega o texto num `bash` e corre a checagem, em vez de confiar no olho;
 *   9. sem turma no contexto, nada muda: o caminho antigo continua a valer, inteiro.
 *
 *   uso: node experimentos/provar-manifesto-da-turma.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  comporConf, faltasDaTurma, aulasNoPeriodo, acharTurma, variaveisDoConf,
} = require('../motor/servidor/compor-conf.js');
const { atualizarManifesto, docsDoConf } = require('../motor/servidor/escrever-plano.js');

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

// ---------------------------------------------------------------- o cadastro REAL da escola
// Copiado do KV (`bastidores/fita/turmas`), lido em 19/10/2026 com
//   wrangler kv key get "bastidores/fita/turmas" --namespace-id=… --remote
// Só os campos que a derivação usa, e sem inventar nada: `bale-nivel-2` é uma turma VAZIA (é
// assim que ela está no KV — `dias: []`), e é ela que prova a recusa.
const TURMAS = [
  {
    id: 'teste', nome: 'Teste', dias: ['ter', 'qua', 'qui', 'sex'],
    horarios: { ter: '09:00', qua: '09:00', qui: '09:00', sex: '11:00' },
    duracaoMin: 75, periodoInicio: '2026-10-16', periodoFim: '2026-10-30', rubricaId: 'padrao',
  },
  { id: 'bale-nivel-2', nome: 'Balé Nível 2', dias: [], horarios: {}, duracaoMin: null },
  {
    id: 'teste-antiga', nome: 'Teste', dias: ['seg'], horarios: { seg: '08:00' },
    duracaoMin: 60, periodoInicio: '2026-09-01', periodoFim: '2026-09-30', substituidaPor: 'teste',
  },
  {
    id: 'teste-3', nome: 'Teste 3', dias: ['qua', 'sáb'],
    horarios: { qua: '13:00', sáb: '10:00' },
    duracaoMin: 50, periodoInicio: '2026-10-16', periodoFim: '2026-10-30',
  },
];

// O `.conf` da ESCOLA — o dono da norma. É ele que `comporConf` lê para a identidade e para a
// faixa de volume, e é o único manifesto que continua escrito à mão.
const CONF_DA_ESCOLA = `# variante: Fita
VARIANTE="fita"
ESCOLA="Fita"
RESPONSAVEL="Tiago"
ESCOLA_HABILITADA="sim"

DATA_INICIO="[Preencher: data de início — o plano elicitado a estabelece]"
TOTAL_AULAS="5"

VOLUME_MIN="80"
VOLUME_MAX="100"
VOLUME_MIN_120="150"
VOLUME_MAX_120="200"

DOCS="plano"
`;

// O envelope do plano da turma `teste`, como a porta o grava. Ele DIVERGE do cadastro de
// propósito: 3 dias contra 4, 55 min contra 75, 7 aulas contra 9. É o caso real de 18/10.
const ENVELOPE = {
  contexto: { professor: 'tiago-menegaz', ciclo: '01', escola: 'fita', turma: 'Teste' },
  respostas: {
    'objetivo-geral': 'Objetivo geral do ciclo - teste',
    'contexto-frequencia': { vezes: 3, por: 'semana', dias: ['ter', 'qui', 'sex'] },
    'contexto-duracao': { numero: 55, unidade: 'minutos' },
    'contexto-calendario': { inicio: '2026-10-16', fim: '2026-10-30' },
    'contexto-total-aulas': 7,
  },
};

/**
 * Um `fetch` falso com DOIS arquivos (o `.conf` da escola e o da variante). O da variante pode
 * não existir — é o estado real: o da turma nunca foi escrito. `escritas` guarda o que foi enviado.
 */
function criarFetch({ escola = CONF_DA_ESCOLA, variante = null } = {}) {
  const arquivos = {};
  if (escola !== null) arquivos['ciclo-01-fita.conf'] = escola;
  if (variante !== null) arquivos['ciclo-01-fita-teste.conf'] = variante;
  const estado = { escritas: [], enviado: null };
  const falso = async (url, opt) => {
    const nome = decodeURIComponent(String(url).split('/').pop());
    const metodo = (opt && opt.method) || 'GET';
    if (metodo === 'GET') {
      if (!(nome in arquivos)) return { status: 404, json: async () => ({ message: 'Not Found' }) };
      return {
        status: 200,
        json: async () => ({ sha: 'sha-' + nome, content: Buffer.from(arquivos[nome]).toString('base64') }),
      };
    }
    estado.escritas.push(nome);
    estado.enviado = JSON.parse(opt.body);
    arquivos[nome] = Buffer.from(estado.enviado.content, 'base64').toString('utf8');
    return { status: 200, json: async () => ({}) };
  };
  return { falso, estado, arquivos };
}

/** O `lerTurmas` que a ponte injeta — aqui, uma lista fixa. */
const lerTurmas = async () => TURMAS;

(async () => {
  console.log('MANIFESTO DA TURMA — o .conf da variante é derivado, não escrito à mão\n');

  // ── 1. Achar a turma: pelo nome (o que o contexto traz), pelo id, e só entre as vigentes ──
  console.log('1. A turma é achada pelo NOME e pelo id, entre as VIGENTES');
  igual('«Teste» (nome) → id teste', (acharTurma(TURMAS, 'Teste') || {}).id, 'teste');
  igual('«teste» (id) → o mesmo', (acharTurma(TURMAS, 'teste') || {}).id, 'teste');
  igual('a substituída NÃO é a resposta', (acharTurma(TURMAS, 'Teste') || {}).periodoInicio, '2026-10-16');
  igual('id da substituída devolve ela própria (é vigente? não) → null',
    acharTurma(TURMAS, 'teste-antiga'), null);
  igual('turma inexistente → null', acharTurma(TURMAS, 'não existe'), null);
  igual('sem referência → null', acharTurma(TURMAS, ''), null);

  // ── 2. A contagem de aulas é a do calendário ───────────────────────────────
  console.log('\n2. As aulas do período são contadas, não estimadas');
  igual('Teste: ter/qua/qui/sex, 16/10 → 30/10 → 9 aulas', aulasNoPeriodo(TURMAS[0]), 9);
  igual('Teste 3: qua/sáb no mesmo período → 4 aulas (o sábado conta)',
    aulasNoPeriodo(TURMAS.find((t) => t.id === 'teste-3')), 4);
  igual('turma vazia → null (não há o que contar)', aulasNoPeriodo(TURMAS[1]), null);

  // ── 3. O que falta na turma é dito com nome ────────────────────────────────
  console.log('\n3. A turma sem hora é RECUSADA, e a recusa nomeia os dias');
  const semHora = { id: 'x', nome: 'X', dias: ['ter', 'qui'], duracaoMin: 60,
    periodoInicio: '2026-10-16', periodoFim: '2026-10-30' };
  const faltaSemHora = faltasDaTurma(semHora);
  igual('uma falta só', faltaSemHora.length, 1);
  ok('…e ela diz QUAIS dias e POR QUÊ',
    /ter, qui/.test(faltaSemHora[0]) && /prazo de lançamento/.test(faltaSemHora[0]), faltaSemHora);
  ok('a turma vazia acumula as quatro faltas', faltasDaTurma(TURMAS[1]).length === 4,
    faltasDaTurma(TURMAS[1]));
  let recusou = null;
  try { comporConf({ turma: semHora, identidade: {}, escola: 'fita', ciclo: '01' }); }
  catch (e) { recusou = e; }
  ok('comporConf RECUSA em vez de inventar uma hora', recusou !== null);
  igual('…e devolve a lista de faltas no erro', (recusou && recusou.falta) || [], faltaSemHora);

  // ── 4. O manifesto composto: as seis chaves do Pré-requisito 5 vêm da TURMA ─
  console.log('\n4. As seis chaves do Pré-requisito 5 saem do cadastro da turma');
  const identidade = variaveisDoConf(CONF_DA_ESCOLA);
  const composto = comporConf({
    turma: TURMAS[0], plano: ENVELOPE, identidade, escola: 'fita', ciclo: '01',
  });
  const v = variaveisDoConf(composto.texto);
  igual('VARIANTE', v.VARIANTE, 'fita-teste');
  igual('FREQUENCIA (4 dias, não os 3 do plano)', v.FREQUENCIA, '4x/semana');
  igual('DIAS com a hora de CADA dia', v.DIAS, '2@09:00,3@09:00,4@09:00,5@11:00');
  igual('DURACOES (75 da turma, não 55 do plano)', v.DURACOES, '75');
  igual('DATA_INICIO em dd/mm/aaaa', v.DATA_INICIO, '16/10/2026');
  igual('TOTAL_AULAS (9 do calendário, não 7 do plano)', v.TOTAL_AULAS, '9');
  igual('ESCOLA vem do .conf da escola', v.ESCOLA, 'Fita');
  igual('ESCOLA_HABILITADA vem do .conf da escola', v.ESCOLA_HABILITADA, 'sim');
  igual('OBJETIVO_GERAL vem do PLANO', v.OBJETIVO_GERAL, 'Objetivo geral do ciclo - teste');
  igual('DOCS nasce «plano»', v.DOCS, 'plano');
  ok('o arquivo se declara DERIVADO', /DERIVADO\. Não edite à mão\./.test(composto.texto));

  // ── 5. O que diverge é REPORTADO, não silenciado ───────────────────────────
  console.log('\n5. Plano × turma: o conflito é reportado');
  igual('dois conflitos (aulas e duração)', composto.conflitos.length, 2);
  ok('o das aulas nomeia os dois números',
    composto.conflitos.some((c) => /7 aulas/.test(c) && /9/.test(c)), composto.conflitos);
  ok('o da duração nomeia os dois números',
    composto.conflitos.some((c) => /55\/75|55/.test(c) && /75/.test(c)), composto.conflitos);
  const coerente = comporConf({
    turma: TURMAS[0], identidade, escola: 'fita', ciclo: '01',
    plano: { respostas: {
      'contexto-total-aulas': 9,
      'contexto-duracao': { numero: 75, unidade: 'minutos' },
      'contexto-calendario': { inicio: '2026-10-16', fim: '2026-10-30' },
    } },
  });
  igual('plano coerente com a turma → zero conflitos', coerente.conflitos, []);

  // ── 6. A faixa de volume da Regra 9 é declarada ANTES do CI ────────────────
  console.log('\n6. A faixa de volume que o gerador vai exigir é dita antes do CI');
  igual('a turma de 75 min exige VOLUME_MIN_75 (a escola só declara 60 e 120)',
    composto.pendencias.length, 1);
  ok('…e a pendência nomeia a chave e o dono',
    /VOLUME_MIN_75/.test(composto.pendencias[0]) && /escola é o dono/.test(composto.pendencias[0]),
    composto.pendencias);
  const comFaixa = variaveisDoConf(CONF_DA_ESCOLA + '\nVOLUME_MIN_75="100"\nVOLUME_MAX_75="125"\n');
  const comFaixaTexto = comporConf({
    turma: TURMAS[0], plano: ENVELOPE, identidade: comFaixa, escola: 'fita', ciclo: '01',
  });
  igual('declarada a faixa, a pendência desaparece', comFaixaTexto.pendencias, []);
  // A faixa tem de VIAJAR para dentro do manifesto: o gerador lê `ciclo-01.conf` (o base) mais a
  // variante da TURMA, e não o `.conf` da escola. Sem a cópia, o número existiria do outro lado do
  // repositório e a turma de 75 min seria recusada por uma chave que a escola declara.
  igual('…e o par resolvido é COPIADO para o manifesto',
    [variaveisDoConf(comFaixaTexto.texto).VOLUME_MIN_75,
      variaveisDoConf(comFaixaTexto.texto).VOLUME_MAX_75], ['100', '125']);
  ok('sem a faixa, nenhuma chave de volume é inventada no texto',
    !/^VOLUME_(MIN|MAX)($|_75)/m.test(composto.texto), composto.texto);

  // A escola sem `.conf` não é silêncio: o que ficou por preencher é DITO.
  const semBase = criarFetch({ escola: null });
  const rSemBase = await atualizarManifesto({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    contexto: ENVELOPE.contexto, plano: ENVELOPE, fetchImpl: semBase.falso, lerTurmas,
  });
  ok('sem o .conf da escola, a pendência diz o que não veio de lá',
    rSemBase.ok === true && (rSemBase.pendencias || []).some((x) => /não existe/.test(x) && /RESPONSAVEL/.test(x)),
    rSemBase.pendencias);

  // ── 7. O ato do plano CRIA o manifesto da turma ────────────────────────────
  console.log('\n7. O ato do plano cria o .conf da turma (que nunca existiu)');
  const novo = criarFetch();
  const r1 = await atualizarManifesto({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    contexto: ENVELOPE.contexto, plano: ENVELOPE, fetchImpl: novo.falso, lerTurmas,
  });
  ok('a escrita foi aceita', r1.ok === true, r1);
  ok('o resultado diz que é DERIVADO', r1.derivado === true, r1);
  ok('…e que o arquivo foi CRIADO', r1.criado === true, r1);
  igual('uma escrita, no arquivo da TURMA', novo.estado.escritas, ['ciclo-01-fita-teste.conf']);
  igual('o PUT não leva sha (o arquivo não existia)', 'sha' in novo.estado.enviado, false);
  const criado = novo.arquivos['ciclo-01-fita-teste.conf'];
  ok('…e o conteúdo é o composto', /^VARIANTE="fita-teste"$/m.test(criado) && /^DIAS="2@09:00/m.test(criado));
  ok('o .conf da ESCOLA não foi tocado', novo.arquivos['ciclo-01-fita.conf'] === CONF_DA_ESCOLA);

  // ── 8. Idempotência: a segunda passagem não escreve ────────────────────────
  console.log('\n8. A segunda passagem não escreve nada');
  const r2 = await atualizarManifesto({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    contexto: ENVELOPE.contexto, plano: ENVELOPE, fetchImpl: novo.falso, lerTurmas,
  });
  ok('devolve ok', r2.ok === true, r2);
  igual('…sem escrever', r2.atualizado, false);
  igual('…e sem uma segunda gravação', novo.estado.escritas.length, 1);

  // ── 9. O DOCS já escrito é PRESERVADO ──────────────────────────────────────
  console.log('\n9. Re-eliciar o plano não apaga as fontes que o gerador escreveu');
  igual('o DOCS do composto é lido (é dele que se parte)',
    docsDoConf(criado), 'plano');
  const comAulas = comporConf({
    turma: TURMAS[0], plano: ENVELOPE, identidade, escola: 'fita', ciclo: '01',
    docs: 'plano harmonizacao aula-01 captura-aula-01',
  });
  igual('DOCS com aulas é preservado inteiro',
    variaveisDoConf(comAulas.texto).DOCS, 'plano harmonizacao aula-01 captura-aula-01');
  const semPlano = comporConf({
    turma: TURMAS[0], plano: ENVELOPE, identidade, escola: 'fita', ciclo: '01',
    docs: 'aula-01 captura-aula-01',
  });
  igual('DOCS sem o plano recebe o plano NO COMEÇO',
    variaveisDoConf(semPlano.texto).DOCS, 'plano aula-01 captura-aula-01');
  const conferido = criarFetch({ variante: composto.texto.replace('DOCS="plano"', 'DOCS="plano aula-01"') });
  await atualizarManifesto({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    contexto: ENVELOPE.contexto, plano: ENVELOPE, fetchImpl: conferido.falso, lerTurmas,
  });
  ok('a escrita manteve o aula-01',
    /^DOCS="plano aula-01"$/m.test(conferido.arquivos['ciclo-01-fita-teste.conf']),
    conferido.arquivos['ciclo-01-fita-teste.conf']);

  // ── 10. Turma fora do cadastro: recusa com nome, e nenhuma escrita ─────────
  console.log('\n10. Turma que o cadastro não tem: recusa, e nada é escrito');
  const vazio = criarFetch();
  const r3 = await atualizarManifesto({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    contexto: Object.assign({}, ENVELOPE.contexto, { turma: 'Inventada' }),
    plano: ENVELOPE, fetchImpl: vazio.falso, lerTurmas,
  });
  ok('não passa', r3.ok === false, r3);
  ok('…e diz qual turma, e o que fazer',
    /«Inventada»/.test(r3.erro) && /Cadastre a turma/.test(r3.erro), r3.erro);
  igual('nenhuma escrita', vazio.estado.escritas, []);

  // ── 11. Sem turma no contexto, o caminho antigo continua inteiro ───────────
  console.log('\n11. Sem turma no contexto, nada muda');
  const antigo = criarFetch({ variante: CONF_DA_ESCOLA.replace('VARIANTE="fita"', 'VARIANTE="fita"') });
  const contextoAntigo = { professor: 'tiago-menegaz', ciclo: '01', escola: 'fita' };
  const r4 = await atualizarManifesto({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    contexto: contextoAntigo, plano: ENVELOPE, fetchImpl: antigo.falso, lerTurmas,
  });
  ok('aceita', r4.ok === true, r4);
  ok('…e NÃO é derivado (é o caminho de atualização)',
    !r4.derivado && r4.caminho === 'professores/tiago-menegaz/ciclos/ciclo-01-fita.conf', r4);
  ok('…e o DATA_INICIO do plano entrou na variante da escola (/fita)',
    /^DATA_INICIO="16\/10\/2026"$/m.test(antigo.arquivos['ciclo-01-fita.conf']));
  igual('o arquivo escrito é o da ESCOLA', antigo.estado.escritas, ['ciclo-01-fita.conf']);

  // ── 12. O manifesto composto passa o Pré-requisito 5 no bash real ──────────
  console.log('\n12. O manifesto composto passa o Pré-requisito 5 (checagem do gerador)');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'conf-turma-'));
  const arquivo = path.join(tmp, 'ciclo-01-fita-teste.conf');
  fs.writeFileSync(arquivo, composto.texto, 'utf8');
  // A condição é a do `tools/gerar-ciclo.sh`, copiada: vazio OU com «[» reprova.
  const script = `
    set -euo pipefail
    source "${arquivo}"
    for campo in ESCOLA FREQUENCIA DIAS DURACOES DATA_INICIO TOTAL_AULAS; do
      valor="\${!campo:-}"
      if [ -z "$valor" ] || printf '%s' "$valor" | grep -q '\\['; then
        echo "FALTOU $campo" >&2 ; exit 1
      fi
    done
    echo "OK $ESCOLA|$FREQUENCIA|$DIAS|$DURACOES|$DATA_INICIO|$TOTAL_AULAS"
  `;
  let saida = '';
  let passou = true;
  try {
    saida = execFileSync('bash', ['-c', script], { encoding: 'utf8' }).trim();
  } catch (erro) {
    passou = false;
    saida = String((erro && erro.stderr) || erro);
  }
  ok('o Pré-requisito 5 aceita o manifesto derivado', passou, saida);
  igual('…e os seis campos são os da turma',
    saida.replace(/^OK /, ''),
    'Fita|4x/semana|2@09:00,3@09:00,4@09:00,5@11:00|75|16/10/2026|9');

  // O contraponto: o manifesto que o CI leu (o da ESCOLA, escrito à mão em 15/10) REPROVA — é o
  // defeito de origem. Medido no `.conf` da `valse`, que existe em disco: o da `fita` foi o do
  // run 39192752959, mas a escola foi expurgada em 19/10/2026 e o arquivo já não existe. O
  // defeito, porém, não era daquela escola: é o mesmo em todo `.conf` escrito à mão — a lacuna
  // `[Preencher: …]` em `DATA_INICIO`. Provar com o que está em disco é o que mantém esta prova
  // a correr num clone limpo.
  const doCi = path.join(tmp, 'ciclo-01-valse.conf');
  fs.writeFileSync(doCi, fs.readFileSync(path.join(RAIZ, 'professores', 'tiago-menegaz', 'ciclos', 'ciclo-01-valse.conf'), 'utf8'), 'utf8');
  let reprovou = false;
  let motivo = '';
  try {
    execFileSync('bash', ['-c', script.replace(arquivo, doCi)], { encoding: 'utf8', stdio: 'pipe' });
  } catch (erro) {
    reprovou = true;
    motivo = String((erro && erro.stderr) || '').trim();
  }
  ok('o manifesto que o CI leu REPROVA (é o defeito de origem)', reprovou, motivo);
  igual('…e o campo que ele acusa é o DATA_INICIO', motivo.split('\n')[0], 'FALTOU DATA_INICIO');

  fs.rmSync(tmp, { recursive: true, force: true });

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — 0 falha(s).');
})();
