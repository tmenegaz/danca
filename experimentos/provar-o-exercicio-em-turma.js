#!/usr/bin/env node
'use strict';

/*
 * provar-o-exercicio-em-turma.js — «EM TURMA» QUER DIZER A TURMA, E NÃO O PLANO.
 *
 * O RELATO DELA (12/11/2026): «eu tenho três exercícios como conteúdo — o battement tendu, o plié e
 * o battement fondu. Mas quando eu vou na listagem de exercícios com verbete, no estilo […] o
 * battement fondu está como livre. Isso não está certo. Em algum momento do processo, quando foi
 * incluído o battement tendu na turma […] eu fui derivar, dessa derivação, eu incluí o battement
 * fondu e aí atribuir turma, feito o processo, que daí se chama gravar o ajuste. Gravei o ajuste, o
 * battement fondu aparece aqui como um desses exercícios, mas lá no estilo, ele não está como em
 * turma, ele está como livre.»
 *
 * O QUE FOI MEDIDO NOS DADOS DO AR, antes de mexer:
 *
 *   TURMA (curadoria)  repertorio = Battement tendu · Plié · Battement fondu   ← os TRÊS
 *   último PLANO       repertorio = Battement tendu · Plié                      ← nasceu às 08:37
 *
 * O `fondu` entrou na Turma DEPOIS de o último plano nascer, e a etiqueta lia os PLANOS. Não era
 * um erro de cálculo: era a fonte errada. Quem declara o repertório é a TURMA; o plano lê-o dela
 * no instante em que nasce — perguntar ao plano «esta turma usa este exercício?» é perguntar a uma
 * fotografia se a pessoa ainda está na sala.
 *
 * A REGRA QUE FICA, e é o que esta prova mede:
 *
 *   1. o PRESENTE vem das TURMAS — `conteudosDaEscola`, que é o dono da composição (mapa antigo +
 *      `repertorio` das curadorias vigentes, com «a turma que declarou não herda a memória»);
 *   2. o PASSADO QUE AINDA MANDA vem dos PLANOS — um exercício que a turma já não declara mas que
 *      um documento cita continua a precisar de ajuste, porque gravar por cima reescreveria o que
 *      já está assinado. A etiqueta diz o que o gesto vai fazer;
 *   3. `null` só quando NENHUMA das duas fontes se lê: não se afirma «livre» sobre um dado que não
 *      se viu — a mesma regra da estante do acervo.
 *
 * MEDE-SE A ROTA, E NÃO A FUNÇÃO. `GET /api/bastidores/verbete` é o que o Estilo recebe, e é o
 * `emTurma` dessa resposta que o selo desenha. Medir a função interna mediria a bancada — e não
 * teria controlo negativo nenhum, porque no código de antes ela nem era exportada (foi o que
 * aconteceu à primeira versão deste ficheiro: rebentou em vez de reprovar). A rota existe nos dois
 * lados; o alfabeto e o vocabulário vêm do repositório local, e o GitHub é substituído por um
 * `fetch` que os serve — zero rede.
 *
 *   node experimentos/provar-o-exercicio-em-turma.js
 *   node experimentos/provar-o-exercicio-em-turma.js --contra=<ref>
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const REF = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let destino = RAIZ;
if (REF) {
  destino = fs.mkdtempSync(path.join(os.tmpdir(), 'exercicio-em-turma-'));
  execSync('git archive ' + REF + ' motor modelo porta biblioteca tools teste | tar -x -C '
    + JSON.stringify(destino), { cwd: RAIZ, stdio: 'pipe' });
  fs.symlinkSync(path.join(RAIZ, 'node_modules'), path.join(destino, 'node_modules'), 'dir');
  console.log('CONTROLE NEGATIVO contra ' + REF + '\n');
}

const bastidores = require(path.join(destino, 'motor/servidor/bastidores.js'));

let n = 0;
let falhas = 0;
function provar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* O KV EM MEMÓRIA — a bancada de sempre: um `get`/`put` que guarda o que lhe derem, para a rota
 * correr com os dados dela sem subir o Worker e sem tocar no ar. */
function kvDeMemoria(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, valor); },
    async delete(chave) { dados.delete(chave); },
    dados,
  };
}

const ESCOLA = 'calango';
/* A CHAVE DO KV É `bastidores/<escola>/…` — o `RAIZ` do servidor, e não o caminho do espelho local
 * do acervo (`escola/…`). Errar aqui dá um mapa VAZIO e uma prova que passa por ausência: foi o que
 * aconteceu à primeira versão deste ficheiro, e é a razão de a asserção do `fondu` existir. */
const R = (sufixo) => 'bastidores/' + ESCOLA + '/' + sufixo;

/* O GITHUB, EM MINIATURA. A rota lê o alfabeto e o vocabulário do repositório; aqui servem-se os
 * ficheiros LOCAIS, no formato do Contents API (`{ sha, content }` em base64). Zero rede — a regra
 * da casa: mede-se na bancada, e ao ar vai-se uma vez, no fim. */
function servirOModalidade() {
  const fsLocal = require('fs');
  const pasta = path.join(destino, 'biblioteca/modalidades/bale-classico/');
  const alfa = fsLocal.readFileSync(pasta + 'notacao.json', 'utf8');
  const voc = fsLocal.readFileSync(pasta + 'vocabulario.json', 'utf8');
  const b64 = (t) => Buffer.from(t, 'utf8').toString('base64');
  const antes = globalThis.fetch;
  globalThis.fetch = async (u) => {
    const url = String(u);
    const t = url.indexOf('vocabulario') !== -1 ? voc : alfa;
    return { status: 200, ok: true, json: async () => ({ sha: 'x', content: b64(t) }),
      text: async () => t };
  };
  return () => { globalThis.fetch = antes; };
}

/** A resposta que o Estilo recebe: `{ nome: emTurma }` por exercício. */
async function emTurmaDaRota(curadorias, turmas, legado) {
  const restaurar = servirOModalidade();
  try {
    const kv = kvDeMemoria(Object.assign({
      [R('turmas')]: JSON.stringify(turmas || []),
      [R('curadorias')]: JSON.stringify(curadorias || []),
    }, legado ? { [R('turma-conteudos')]: JSON.stringify(legado) } : {}));
    const resposta = await bastidores.fetchSemRede(
      new Request('https://calango.workers.dev/api/bastidores/verbete'),
      { PADD_KV: kv, ESCOLA_SLUG: ESCOLA, GITHUB_TOKEN: 'x' });
    const dados = await resposta.json();
    const mapa = {};
    for (const x of (dados.exercicios || [])) mapa[x.nome] = x.emTurma;
    return mapa;
  } finally { restaurar(); }
}

(async () => {
  const idDe = (x) => String(x).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  console.log('1. O CASO DELA — a Turma declara três, o último plano declara dois');

  /* OS DADOS SÃO OS DO AR a 12/11/2026: a Turma com os três, e o último plano — nascido às 08:37,
   * antes de o `fondu` entrar — com dois. É o caso que ela descreveu, e o que o código de antes
   * respondia «livre». */
  const mapa = await emTurmaDaRota(
    [{ id: 'pe-torto-bale-classico-piano-2026-11-11-3', professor: 'pe-torto', turmas: ['Piano'],
      modalidade: 'bale-classico', nivel: '1',
      repertorio: ['Battement tendu', 'Plié', 'Battement fondu'] }],
    [{ id: 'piano', nome: 'Piano', dias: ['qua'], duracaoMin: 60 }]);

  provar('o `Battement fondu` vem EM TURMA — pela Turma, e não pelo plano',
    (mapa['Battement fondu'] || []).indexOf('Piano') !== -1, mapa['Battement fondu']);
  provar('…e os outros dois também, e pela turma certa',
    (mapa['Battement tendu'] || []).indexOf('Piano') !== -1
      && (mapa['Plié'] || []).indexOf('Piano') !== -1,
    { tendu: mapa['Battement tendu'], plie: mapa['Plié'] });
  provar('…e a etiqueta que o selo desenha é «em turma» nos três',
    ['Battement tendu', 'Plié', 'Battement fondu'].every((x) => (mapa[x] || []).length),
    ['Battement tendu', 'Plié', 'Battement fondu'].map((x) => mapa[x]));
  provar('a turma aparece UMA vez — o id e o nome não fazem duas',
    (mapa['Battement fondu'] || []).length === 1, mapa['Battement fondu']);

  console.log('\n2. A TURMA QUE REDUZIU — o que ela tirou continua a precisar de ajuste');

  /* A REGRA NÃO É «só a turma manda»: é «a turma diz o presente; o documento escrito não se
   * reescreve». Um exercício que saiu da Turma mas está num plano ASSINADO continua a ser
   * ACRESCENTAR, não corrigir no lugar — e a etiqueta tem de o dizer, senão o professor descobre
   * o gesto depois de o fazer. */
  const red = await emTurmaDaRota(
    [{ id: 'c1', professor: 'pe-torto', turmas: ['Piano'], repertorio: ['Plié'] }],
    [{ id: 'piano', nome: 'Piano' }]);
  /* E O PLANO, AQUI, TEM DE SER O ANTIGO — um que cite os três. A rota lê os planos do índice do
   * acervo, e a bancada não tem esse índice: o que ela tem é a resposta do KV. Por isso este caso
   * mede o que a TURMA declara, e o «plano antigo» é verificado na secção 4, sobre a função. */
  provar('o que a Turma ainda declara está em turma',
    (red['Plié'] || []).indexOf('Piano') !== -1, red['Plié']);
  provar('o que ela tirou fica livre no PRESENTE — sem plano que o cite, é corrigir no lugar',
    (red['Battement tendu'] || []).length === 0, red['Battement tendu']);

  console.log('\n3. O MAPA ANTIGO — a escola que nunca teve curadoria');

  const antigo = await emTurmaDaRota([], [{ id: 'rosa', nome: 'Rosa' }], { rosa: ['plie'] });
  provar('um termo só no mapa antigo continua em turma, pelo nome da sala',
    (antigo['Plié'] || []).indexOf('Rosa') !== -1, antigo['Plié']);

  console.log('\n4. A FUNÇÃO — o plano que já está escrito, e as fontes que não se leem');

  if (typeof bastidores.turmasPorTermo !== 'function') {
    provar('a rota lê a TURMA e não só o plano', false,
      'a função não está exportada — o código não é deste contrato');
  } else {
    /* O PLANO ANTIGO, aqui. A rota não o vê porque a bancada não tem índice de envelopes; a
     * função recebe-o por argumento justamente para isto: poder medir a união sem inventar um
     * acervo. É o mesmo idioma do `jaLido` de `paresComPlano`. */
    const comPlanoVelho = await bastidores.turmasPorTermo(
      { PADD_KV: kvDeMemoria({
        [R('turmas')]: JSON.stringify([{ id: 'piano', nome: 'Piano' }]),
        [R('curadorias')]: JSON.stringify([{ id: 'c1', turmas: ['Piano'],
          repertorio: ['Plié'] }]),
      }) }, ESCOLA,
      [{ professor: 'pe-torto', turma: 'Piano', ciclo: '01',
        repertorio: ['Battement tendu', 'Plié', 'Battement fondu'] }]);
    const emTurma = (nome) => (comPlanoVelho && (comPlanoVelho[nome] || comPlanoVelho[idDe(nome)])) || [];
    provar('o que a Turma tirou mas um plano cita CONTINUA em turma — o lado seguro',
      emTurma('Battement tendu').indexOf('Piano') !== -1, emTurma('Battement tendu'));
    provar('…e o que a Turma declara continua, como sempre',
      emTurma('Plié').indexOf('Piano') !== -1, emTurma('Plié'));

    /* `null` EXPLÍCITO é «tentei ler e não consegui» — distinto de omitir o argumento, que manda
     * ler. A função passou a distinguir os dois: antes, um `||` tratava-os como a mesma coisa. */
    const semNada = await bastidores.turmasPorTermo({}, ESCOLA, null);
    provar('sem KV e sem planos, a resposta é `null` — e não um mapa vazio', semNada === null, semNada);

    const semTurmas = await bastidores.turmasPorTermo(
      { PADD_KV: kvDeMemoria({ [R('turmas')]: JSON.stringify([]) }) }, ESCOLA, []);
    provar('uma escola sem turmas responde mapa vazio — que é uma resposta, não uma ausência',
      semTurmas && Object.keys(semTurmas).length === 0, semTurmas);
  }

  console.log('\n5. A ETIQUETA — a regra que o cliente desenha');

  /* `emTurma: porTermo === null ? null : (porTermo[nome] || porTermo[id] || [])`. É a linha da
   * rota, e é ela que o selo lê: «lista com nomes» é EM TURMA, «lista vazia» é LIVRE, e `null`
   * não é nenhuma das duas — não se afirma «livre» sobre um dado que não se viu. */
  const selo = (porTermo, nome) => (porTermo === null ? '(sem leitura)'
    : ((porTermo[nome] || porTermo[idDe(nome)] || []).length ? 'em turma' : 'livre'));
  provar('os três exercícios dela dizem «em turma»',
    selo(mapa, 'Battement tendu') === 'em turma' && selo(mapa, 'Plié') === 'em turma'
      && selo(mapa, 'Battement fondu') === 'em turma',
    ['Battement tendu', 'Plié', 'Battement fondu'].map((x) => selo(mapa, x)));
  provar('um exercício que ninguém usa diz «livre» — e não «sem leitura»',
    selo(mapa, 'Battement jeté') === 'livre', selo(mapa, 'Battement jeté'));
  provar('…e uma leitura falhada não diz nem uma coisa nem outra',
    selo(null, 'Plié') === '(sem leitura)');

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + n + ' asserções.');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + n + ' asserções: «em turma» vem da TURMA, o plano só acrescenta o '
    + 'que já está escrito, e as fontes que não se leem devolvem silêncio e não «livre».');
})();
