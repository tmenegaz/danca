#!/usr/bin/env node
'use strict';

/**
 * provar-o-cadastro-comercial-nao-se-perde.js — o registo de uma escola sobrevive a ser desabilitada,
 * e «não há cadastro» só se diz quando não há mesmo (22/11/2026).
 *
 * O QUE ELA DISSE, e é a queixa inteira:
 *
 *   «Eu desabilitei a escola viva, que é a escola Breu, e eu respeitei o tempo para poder apagá-la, e
 *   agora eu não consigo apagar. Aparece assim: há uma escola e ela não pode ser apagada neste estado.
 *   […] Breu, não há cadastro comercial desta escola e sem cadastro não há como saber que ela está
 *   suspensa. […] Eu já desabilitei, eu já esperei o tempo que tinha que esperar e eu não consigo
 *   apagar a escola. Eu não sei que regra é essa que você colocou sobre cadastro comercial desta
 *   escola.»
 *
 * O QUE ACONTECEU, medido no KV de produção a 22/11/2026:
 *
 *   antes de desabilitar (lido às 00:13):  {"estado":"ativa","plano":"basico","valor":"R$ 79,90",
 *                                           "capacidade":{…},"habilitadaEm":"2026-11-17…",
 *                                           "criadoEm":"…","historico":[6 elos]}
 *   depois de desabilitar (00:42:55):      {"estado":"suspensa","semRegisto":true,"plano":null,
 *                                           "desabilitadaEm":"2026-11-23T00:42:55.867Z",
 *                                           "historico":[1 elo]}
 *
 * O plano, o valor, a capacidade, a data de criação e cinco elos do histórico desapareceram — e no
 * lugar deles ficou o ESBOÇO QUE A LEITURA DEVOLVE QUANDO NÃO HÁ REGISTO. A causa é uma linha de
 * `gravarComercial`: `Object.assign({}, anterior, mudanca)` onde `anterior` era `lerComercial` — e
 * `lerComercial` responde `{semRegisto:true, plano:null, …}` a quem não tem registo. O objecto que
 * existe para dizer «não li nada» foi GRAVADO, e a partir daí a guarda do expurgo afirmou o
 * contrário do que o registo dizia: havia `estado:'suspensa'` e `desabilitadaEm`, e ela respondia
 * «não há cadastro desta escola».
 *
 * AS DUAS CORRECÇÕES, e cada uma tem a sua asserção:
 *
 *   1. A ESCRITA. O sinal de «não li nada» não se persiste: `gravarComercial` tira `semRegisto` e
 *      `motivo` do que lê antes de os misturar com a mudança, e volta a tirá-los do resultado.
 *   2. A REGRA. `semCadastro` deixou de ser um booleano sozinho: ele só vale quando não há NADA que
 *      o desminta — sem plano, sem data de desabilitação, sem data de habilitação, sem data de
 *      criação e sem histórico. A evidência vence um booleano.
 *
 * O QUE SE MEDE, e o terceiro grupo é o que a salvou:
 *
 *   A. A IDA E VOLTA — desabilitar uma escola QUE TEM contrato preserva o contrato inteiro. É o caso
 *      que ela tinha, e é o que o defeito destruía em todas as escolas.
 *   B. A ESCOLA SEM REGISTO — desabilitar uma que nunca teve contrato grava um registo sem o esboço
 *      dentro, e esse registo passa a deixar a escola expurgável quando a carência vence.
 *   C. A REGRA — quatro registos, quatro veredictos: o envenenado (que ela viu) passa a `pode: true`;
 *      o vazio de verdade continua a recusar com a frase honesta; o da escola habilitada recusa pelo
 *      motivo certo; o suspenso dentro da carência recusa com o tempo que falta.
 *   D. O PRAZO — a carência de teste é de **1 minuto**, por decisão dela a 22/11/2026 (eram 5).
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` carrega o `raiz.js` DAQUELE commit e corre as mesmas
 * asserções. Lá o contrato é destruído ao desabilitar (o `semRegisto` é gravado) e o registo
 * envenenado é recusado para sempre — os dois defeitos que ela viu.
 *
 *   node experimentos/provar-o-cadastro-comercial-nao-se-perde.js
 *   node experimentos/provar-o-cadastro-comercial-nao-se-perde.js --contra=e73342a6
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const CONTRA = (process.argv.find((x) => x.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let RAIZ_DO_MOTOR = RAIZ;
let TEMPORARIO = null;
if (CONTRA) {
  TEMPORARIO = fs.mkdtempSync(path.join(os.tmpdir(), 'cadastro-'));
  execSync('git archive ' + CONTRA + ' motor modelo biblioteca tools porta | tar -x -C ' + TEMPORARIO,
    { cwd: RAIZ, stdio: 'pipe' });
  RAIZ_DO_MOTOR = TEMPORARIO;
}
const raiz = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/raiz.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 330)));
}

/** O KV de mentira, com a mesma forma que o `gravarComercial` usa. */
function kvDeBolso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(c) { return dados.has(c) ? dados.get(c) : null; },
    async put(c, v) { dados.set(c, v); },
    async delete(c) { dados.delete(c); },
  };
}

const CHAVE = (slug) => 'bastidores/' + slug + '/comercial';
const LER = (kv, slug) => JSON.parse(kv.dados.get(CHAVE(slug)) || 'null');

/** O contrato completo, tal como a `breu` tinha antes de o defeito o apagar (medido a 22/11/2026). */
const CONTRATO = {
  estado: 'ativa',
  plano: 'basico',
  planoNome: 'Básico',
  valor: 'R$ 79,90',
  valorCentavos: 7990,
  periodicidade: 'mês',
  professor: 'demi-plie',
  capacidade: { professores: 1, alunos: 10, aulas: 120 },
  extensoes: ['turma-pronta-configuracao'],
  pagamento: 'dispensado-pelo-proprietario',
  origem: 'painel',
  criadoEm: '2026-11-17T00:41:26.588Z',
  habilitadaEm: '2026-11-17T00:41:26.797Z',
  pacotes: ['p'],
  lotesProfessores: [],
  lotesAlunos: [],
  historico: [
    { em: '2026-11-17T00:41:26.797Z', para: 'ativa', por: 'painel', valor: 23990, nota: null },
    { em: '2026-11-18T00:13:16.795Z', para: 'ativa', por: 'proprietario', valor: 7990, nota: null },
  ],
};

const REGIME = '2026-11-16T12:29:36.744Z';

(async () => {
  /* ═══════════ A · A IDA E VOLTA — desabilitar não pode apagar o contrato ═══════════ */

  console.log('\nA · DESABILITAR UMA ESCOLA COM CONTRATO PRESERVA O CONTRATO');
  {
    const kv = kvDeBolso({ [CHAVE('breu')]: JSON.stringify(CONTRATO) });
    const r = await raiz.gravarComercial(kv, 'breu', { estado: 'suspensa' }, 'proprietario');
    const g = LER(kv, 'breu');
    provar('a gravação devolve ok', r.ok === true, r);
    provar('o estado passou a «suspensa»', g.estado === 'suspensa', g.estado);
    provar('…com a data de desabilitação', typeof g.desabilitadaEm === 'string' && g.desabilitadaEm.length > 10,
      g.desabilitadaEm);
    provar('O CONTRATO INTEIRO SOBREVIVE — plano, valor, capacidade',
      g.plano === 'basico' && g.valor === 'R$ 79,90' && g.capacidade
      && g.capacidade.aulas === 120, { plano: g.plano, valor: g.valor, capacidade: g.capacidade });
    provar('…e as datas de criação e de habilitação',
      g.criadoEm === CONTRATO.criadoEm && g.habilitadaEm === CONTRATO.habilitadaEm,
      { criadoEm: g.criadoEm, habilitadaEm: g.habilitadaEm });
    provar('…e o histórico cresce em vez de recomeçar (2 elos + o novo)',
      Array.isArray(g.historico) && g.historico.length === 3 && g.historico[2].para === 'suspensa',
      g.historico && g.historico.length);
    provar('…e NÃO se grava o sinal de «não li nada»', g.semRegisto === undefined && g.motivo === undefined,
      { semRegisto: g.semRegisto, motivo: g.motivo });
  }

  /* ═══════════ B · A ESCOLA SEM REGISTO — o esboço não entra no que se escreve ═══════════ */

  console.log('\nB · DESABILITAR UMA ESCOLA QUE NUNCA TEVE CONTRATO NÃO GRAVA O ESBOÇO');
  {
    const kv = kvDeBolso();
    const r = await raiz.gravarComercial(kv, 'nova', { estado: 'suspensa' }, 'proprietario');
    const g = LER(kv, 'nova');
    provar('grava, e o registo existe', r.ok === true && !!g, g);
    provar('…com o estado e a data', g.estado === 'suspensa' && !!g.desabilitadaEm, g);
    provar('…e SEM `semRegisto` — o defeito era exactamente este campo gravado',
      g.semRegisto === undefined, g.semRegisto);
    provar('…e sem `motivo` (a frase da leitura não é dado)', g.motivo === undefined, g.motivo);
    /* O EFEITO, que é o que importa: a escola passa a poder ser expurgada quando a carência vence. */
    const agora = Date.parse(g.desabilitadaEm) + 61 * 1000;
    const v = raiz.estadoDoExpurgo(g, { agora, regimeDesde: REGIME });
    provar('…e um minuto depois ela PODE ser apagada', v.pode === true, v.motivo);
  }

  /* ═══════════ C · A REGRA — quatro registos, quatro veredictos ═══════════ */

  console.log('\nC · A REGRA — a evidência vence o booleano');
  {
    /* O REGISTO ENVENENADO, exactamente como ficou no KV de produção: `semRegisto: true` E
     * `estado: 'suspensa'` E `desabilitadaEm`. É o caso dela, e é o que a guarda lia ao contrário. */
    const envenenado = {
      estado: 'suspensa', semRegisto: true, plano: null, nota: null,
      atualizadoEm: '2026-11-23T00:42:55.867Z', atualizadoPor: 'proprietario',
      desabilitadaEm: '2026-11-23T00:42:55.867Z',
      historico: [{ em: '2026-11-23T00:42:55.867Z', para: 'suspensa', por: 'proprietario', valor: null, nota: null }],
    };
    const agora = Date.parse('2026-11-23T01:00:00Z');
    const v1 = raiz.estadoDoExpurgo(envenenado, { agora, regimeDesde: REGIME });
    provar('o registo que ela viu (suspensa + data + semRegisto) PODE ser apagado', v1.pode === true,
      v1.motivo);
    provar('…e o motivo não fala de cadastro nenhum — fala da carência', !/cadastro/i.test(v1.motivo || ''),
      v1.motivo);
    provar('…e `semCadastro` é falso: há registo, e ele diz o que interessa', v1.semCadastro === false,
      v1.semCadastro);

    /* O VAZIO DE VERDADE — nenhum campo, só o esboço. A frase honesta continua a ser a resposta. */
    const vazio = { estado: 'ativa', motivo: 'sem registo comercial', semRegisto: true, plano: null, valor: null };
    const v2 = raiz.estadoDoExpurgo(vazio, { agora, regimeDesde: REGIME });
    provar('sem registo nenhum, continua a recusar com a frase honesta',
      v2.pode === false && /Não há cadastro comercial/.test(v2.motivo || ''), v2.motivo);
    provar('…e diz que não há como saber se está suspensa', /sem cadastro não há como saber/.test(v2.motivo || ''),
      v2.motivo);

    /* A HABILITADA — o motivo certo, e não o do cadastro. */
    const v3 = raiz.estadoDoExpurgo(CONTRATO, { agora, regimeDesde: REGIME });
    provar('a escola habilitada recusa por estar habilitada, e não por cadastro',
      v3.pode === false && /está habilitada/.test(v3.motivo || '') && v3.semCadastro === false, v3.motivo);

    /* DENTRO DA CARÊNCIA — o tempo que falta, com a régua nova. */
    const recente = Object.assign({}, CONTRATO, {
      estado: 'suspensa', desabilitadaEm: new Date(agora - 20 * 1000).toISOString(),
    });
    const v4 = raiz.estadoDoExpurgo(recente, { agora, regimeDesde: REGIME });
    provar('suspensa há 20 segundos, a carência de 1 minuto ainda não venceu', v4.pode === false,
      v4.motivo);
    provar('…e o tempo que falta é dito em segundos', v4.restanteMs > 0 && v4.restanteMs <= 60 * 1000,
      v4.restanteMs);
    const v5 = raiz.estadoDoExpurgo(recente, { agora: agora + 45 * 1000, regimeDesde: REGIME });
    provar('…e 65 segundos depois de desabilitada, ela já pode', v5.pode === true, v5.motivo);
  }

  /* ═══════════ D · O PRAZO — 1 minuto, por decisão dela ═══════════ */

  console.log('\nD · O PRAZO — a carência de teste é de 1 minuto');
  {
    const base = '2026-11-23T00:00:00.000Z';
    const ate = raiz.carenciaAte ? raiz.carenciaAte(base) : null;
    /* `carenciaAte` não é exportada; mede-se pelo veredicto, que é o que a tela lê. */
    const v = raiz.estadoDoExpurgo(
      Object.assign({}, CONTRATO, { estado: 'suspensa', desabilitadaEm: base }),
      { agora: Date.parse(base) + 59 * 1000, regimeDesde: REGIME });
    const w = raiz.estadoDoExpurgo(
      Object.assign({}, CONTRATO, { estado: 'suspensa', desabilitadaEm: base }),
      { agora: Date.parse(base) + 61 * 1000, regimeDesde: REGIME });
    provar('aos 59 segundos ainda não pode', v.pode === false, v.motivo);
    provar('…e aos 61 segundos pode — a régua é de um minuto, e não de cinco', w.pode === true, w.motivo);
    /* A FRASE DIZ O INSTANTE, não a duração («o prazo vence 22/11/2026 às 21:01»), e é assim que
     * deve ser: o que a pessoa precisa é de saber quando, e a régua está escrita na nota da lista.
     * O que se mede é o NÚMERO — o `carenciaAte` devolvido é exactamente 60 segundos depois da
     * desabilitação. Uma frase que dissesse «1 minuto» seria uma segunda cópia do prazo, e a
     * segunda cópia é a que fica velha. */
    const c = Date.parse(v.carenciaAte) - Date.parse(base);
    provar('…e o prazo devolvido é exactamente 60 segundos depois da desabilitação', c === 60 * 1000, c);
    void ate;
  }

  /* ===== E - O CICLO INTEIRO: o caminho que ela vai percorrer =====
   *
   * A CAUSA COMPLETA, medida. O expurgo limpa o KV por PREFIXO - `prefixosDaEscola(slug)` devolve
   * `['breu/', 'bastidores/breu/']` - , e `bastidores/breu/comercial` esta dentro do prefixo. Ou
   * seja: **um expurgo que falha a meio apaga o proprio registo que autoriza o expurgo**. Foi assim
   * que o contrato da breu desapareceu entre as 00:13 (lido inteiro) e as 00:42 (ja nao existia):
   * a limpeza do KV correu, e depois ela desabilitou a escola - e o `gravarComercial`, sem nada
   * para ler, gravou o esboco.
   *
   * Nao e um defeito para corrigir agora (apagar o registo de uma escola que se esta a expurgar e
   * o que o expurgo FAZ; o que estava errado era o que se gravava a seguir). O que se mede aqui e
   * que o caminho de recuperacao existe e e o que ela vai fazer: sem registo -> desabilitar ->
   * 1 minuto -> pode. */
  console.log('\nE - O CICLO: escola sem registo (o que o expurgo deixa), desabilitada, e 1 minuto');
  {
    const kv = kvDeBolso();
    const semNada = await raiz.lerComercial(kv, 'breu');
    provar('sem registo, a leitura devolve o esboco e marca-o como tal', semNada.semRegisto === true,
      semNada);

    const r = await raiz.gravarComercial(kv, 'breu', { estado: 'suspensa' }, 'proprietario');
    provar('desabilitar grava (o gesto nao falha por nao haver registo antes)', r.ok === true, r);
    const g = LER(kv, 'breu');

    const antes = raiz.estadoDoExpurgo(g, {
      agora: Date.parse(g.desabilitadaEm) + 30 * 1000, regimeDesde: REGIME });
    const depois = raiz.estadoDoExpurgo(g, {
      agora: Date.parse(g.desabilitadaEm) + 61 * 1000, regimeDesde: REGIME });
    provar('aos 30 segundos: ainda nao, e o motivo e a carencia', antes.pode === false
      && /carência/.test(antes.motivo || ''), antes.motivo);
    provar('aos 61 segundos: PODE - o caminho a partir de uma escola sem registo funciona',
      depois.pode === true, depois.motivo);
    provar('...e a recusa dos 30 segundos NAO fala de cadastro (o defeito original)',
      !/cadastro/i.test(antes.motivo || ''), antes.motivo);
  }


  if (TEMPORARIO) fs.rmSync(TEMPORARIO, { recursive: true, force: true });
  console.log('');
  if (CONTRA) {
    console.log((falhas ? 'CONTROLE CONFORME — ' : 'CONTROLE SUSPEITO — ') + falhas + ' de ' + total
      + ' asserções falham com o `raiz.js` de ' + CONTRA + '.');
    process.exit(falhas ? 0 : 1);
  }
  if (falhas) { console.log('FALHARAM ' + falhas + ' de ' + total + ' asserções.'); process.exit(1); }
  console.log('TUDO CERTO — ' + total + ' asserções: desabilitar uma escola preserva o contrato inteiro '
    + '(plano, valor, capacidade, datas e histórico), o esboço da leitura não é gravado nem numa escola '
    + 'sem registo, «não há cadastro» só se diz quando não há evidência nenhuma, e a carência de teste '
    + 'é de 1 minuto.');
})();
