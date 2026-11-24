#!/usr/bin/env node
'use strict';

/**
 * provar-ciclos-independentes.js — N ciclos da MESMA turma não se misturam.
 *
 * A PERGUNTA QUE A PÔS EM PÉ (24/11/2026), nas palavras dela: «a gente cria um ciclo, criamos a
 * aula um […] agora eu preciso saber se tem para quando a gente tem n ciclos e se esses ciclos não
 * se misturam, o conteúdo deles. Esse isolamento é muito importante porque a derivação não pode, de
 * cada ciclo e de cada parte dentro do ciclo, não pode se misturar um com o outro e tem que
 * respeitar a regra de proveniência.»
 *
 * O QUE JÁ ESTAVA MEDIDO, e o que não estava. Havia cinco provas, e cada uma cobre uma dimensão:
 * `provar-ciclos-e-anamnese` (a sequência estrita, a exclusão que guarda o último, e o padrão do
 * ciclo que não come a variante vizinha), `provar-relacoes-do-ciclo` (o PO só nasce sobre um plano
 * do MESMO ciclo), `provar-ciclo-herdado-do-plano` (o ciclo do PO não se digita — herda-se),
 * `provar-a-aula-diz-so-o-que-e-dela` (a Aula 01 e a Aula 02 não imprimem o mesmo §1) e
 * `provar-isolamento-entre-escolas` (uma ESCOLA não alcança o dado de outra).
 *
 * NENHUMA DELAS põe **dois ciclos da mesma turma** no mesmo repositório e pergunta o que esta
 * pergunta: *o conteúdo de um aparece no outro?* E o caso é o PIOR possível, de propósito: a
 * variante é `<escola>-<turma>` e **não leva o ciclo** (`varianteDoContexto`), de modo que dois
 * ciclos da mesma turma diferem, em todo o caminho, por `ciclo-NN` e mais nada.
 *
 * O QUE ESTA PROVA MEDE, e cada asserção existe por um modo de falhar:
 *
 *   A. O CAMINHO CARREGA O CICLO. 01 e 02 dão caminhos diferentes; `1` e `01` dão o MESMO (é
 *      normalização, não um segundo ficheiro); e um contexto sem ciclo é RECUSADO, alto, em vez de
 *      cair no caminho de outro ciclo.
 *   B. DOIS CICLOS, UM REPOSITÓRIO. O escritor corre para o 01 e depois para o 02 sobre a mesma
 *      árvore: nenhum caminho do 02 é um caminho do 01, e o ciclo 01 fica **byte a byte** igual.
 *   C. O CONTEÚDO NÃO SE MISTURA. A aula de cada ciclo diz o SEU número e o SEU marcador, e não
 *      contém o marcador do outro.
 *   D. A TRAVA DA AULA DADA É POR CICLO. A aula 01 do ciclo 01 lançada não trava a aula 01 do
 *      ciclo 02 — se a trava fosse global, o ciclo novo nascia sem a primeira aula.
 *   E. O MANIFESTO É POR CICLO. Gravar o ciclo 02 não acrescenta documento nenhum ao `DOCS` do 01.
 *   F. CONTROLO NEGATIVO. Sem `ciclo-NN` no caminho, os dois ciclos colidem no mesmo ficheiro — é
 *      isso que a asserção de A está a impedir, e sem este controlo a prova mediria o nome das
 *      chaves, não o isolamento.
 *
 * SEM REDE e SEM navegador: o GitHub é falso e persiste (o que uma passagem escreve, a seguinte lê).
 *
 *   node experimentos/provar-ciclos-independentes.js
 */

const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const {
  criarEscritorDeCiclo, caminhoDaFonte, docsAtuais,
} = require(path.join(RAIZ, 'motor/servidor/escrever-ciclo.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* ========================================================================================== */
console.log('\nA · O CAMINHO DE UMA FONTE CARREGA O CICLO — e não há caminho sem ciclo');
/* ========================================================================================== */
const CTX_01 = { escola: 'breu', professor: 'demi-plie', ciclo: '01', turma: 'piano', variante: 'breu-piano' };
const CTX_02 = Object.assign({}, CTX_01, { ciclo: '02' });

{
  const p01 = caminhoDaFonte(CTX_01, '-aula-01.md');
  const p02 = caminhoDaFonte(CTX_02, '-aula-01.md');
  provar('a fonte do ciclo 01 sai debaixo de `ciclo-01-`',
    p01 === 'professores/demi-plie/ciclos/ciclo-01-breu-piano-aula-01.md', p01);
  provar('…e a do ciclo 02 debaixo de `ciclo-02-`',
    p02 === 'professores/demi-plie/ciclos/ciclo-02-breu-piano-aula-01.md', p02);
  provar('são dois ficheiros, não um', p01 !== p02, [p01, p02]);
  provar('`1` e `01` dão o MESMO caminho (normalização, não um segundo ficheiro)',
    caminhoDaFonte(Object.assign({}, CTX_01, { ciclo: '1' }), '-aula-01.md') === p01,
    caminhoDaFonte(Object.assign({}, CTX_01, { ciclo: '1' }), '-aula-01.md'));

  /* O QUE ACONTECE SEM CICLO. Um contexto a que falta o ciclo NÃO pode cair no caminho de outro
   * ciclo: tem de falhar. Um `|| '01'` aqui seria o defeito inteiro desta prova. */
  let recusa = null;
  try { caminhoDaFonte(Object.assign({}, CTX_01, { ciclo: '' }), '-aula-01.md'); } catch (e) { recusa = e; }
  provar('um contexto SEM ciclo é recusado, e não escreve no ciclo do vizinho',
    Boolean(recusa), recusa && recusa.message);
  provar('…e a recusa diz o que falta', Boolean(recusa) && /ciclo/.test(String(recusa.message)),
    recusa && recusa.message);
}

/* ========================================================================================== */
console.log('\nB · DOIS CICLOS NO MESMO REPOSITÓRIO — nada colide, e o que é do 01 não é tocado');
/* ========================================================================================== */

const BASE = 'professores/demi-plie/ciclos';

/** Os manifestos, um por ciclo — o estado real de um professor com dois ciclos da mesma turma. */
function confDe(ciclo, extras) {
  return [
    'CICLO="' + ciclo + '"', 'ESCOLA="Breu"', 'NOME="Ciclo ' + ciclo + ' — Breu · Piano"',
    'DURACOES="60"', 'VOLUME_MIN="3"', 'VOLUME_MAX="5"',
    'DOCS=""', 'DIAS="1@16:00"',
  ].concat(extras || []).join('\n') + '\n';
}
const CONF_01 = confDe('01');
const CONF_02 = confDe('02');
const SCHEMA = JSON.stringify({ _declaracao: { porVariante: {} } }, null, 2);

/**
 * O GitHub falso que PERSISTE. Serve o manifesto PELA CHAVE (é o que permite dois ciclos com dois
 * manifestos), e aplica as árvores de escrita como o GitHub as aplicaria.
 */
function githubFalso(inicial) {
  const chamadas = [];
  const arquivos = Object.assign({}, inicial || {});
  const f = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const u = String(url);
    chamadas.push({ url: u, metodo });
    const corpo = init && init.body ? JSON.parse(init.body) : null;
    if (metodo === 'GET' && /\/contents\//.test(u)) {
      const caminho = decodeURIComponent(u.split('/contents/')[1].split('?')[0]);
      if (Object.prototype.hasOwnProperty.call(arquivos, caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 'x' + caminho, content: Buffer.from(arquivos[caminho]).toString('base64') }) };
      }
      if (/captura-schema\.json$/.test(caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 's2', content: Buffer.from(SCHEMA).toString('base64') }) };
      }
      return { status: 404, ok: false, json: async () => ({}) };
    }
    if (metodo === 'GET' && /\/git\/ref\/heads\//.test(u)) return { status: 200, ok: true, json: async () => ({ object: { sha: 'c0' } }) };
    if (metodo === 'GET' && /\/git\/commits\//.test(u)) return { status: 200, ok: true, json: async () => ({ tree: { sha: 't0' } }) };
    if (metodo === 'POST' && /\/git\/blobs$/.test(u)) {
      const sha = 'b' + chamadas.length;
      arquivos.__blob = arquivos.__blob || {};
      arquivos.__blob[sha] = Buffer.from(String(corpo.content), 'base64').toString('utf8');
      return { status: 201, ok: true, json: async () => ({ sha }) };
    }
    if (metodo === 'POST' && /\/git\/trees$/.test(u)) {
      arquivos.__tree = {};
      for (const t of corpo.tree || []) {
        arquivos.__tree[t.path] = t.content !== undefined
          ? String(t.content) : (arquivos.__blob || {})[t.sha];
      }
      return { status: 201, ok: true, json: async () => ({ sha: 't1' }) };
    }
    if (metodo === 'POST' && /\/git\/commits$/.test(u)) return { status: 201, ok: true, json: async () => ({ sha: 'c1' }) };
    if (metodo === 'PATCH' && /\/git\/refs\/heads\//.test(u)) {
      Object.assign(arquivos, arquivos.__tree || {});
      delete arquivos.__tree; delete arquivos.__blob;
      return { status: 200, ok: true, json: async () => ({}) };
    }
    return { status: 200, ok: true, json: async () => ({}) };
  };
  return { fetch: f, chamadas, arquivos };
}

/* Um plano por ciclo, distinguível por um marcador que só ele tem. É o que torna «misturou-se»
 * uma asserção e não uma impressão: o marcador do 02 não pode aparecer em nada do 01. */
function planoDe(ciclo, marcador) {
  return {
    objetivo: marcador,
    turma: 'piano',
    professor: 'demi-plie',
    ciclo,
    respostas: {
      'contexto-objetivo-geral': marcador,
      'objetivo-geral': marcador,
      'aula-1-sequencia': ['Solo | Plié | 8 tempos | 2/4 | ' + marcador],
      'aula-1-objetivo': marcador,
    },
  };
}
const PLANO_01 = planoDe('01', 'MARCADOR-DO-CICLO-UM');
const PLANO_02 = planoDe('02', 'MARCADOR-DO-CICLO-DOIS');
const poDe = (ciclo) => ({
  id: 'po-' + ciclo, ciclo, escola: 'breu', contexto: CTX_01,
  respostas: { sujeitos: ['Aluna A'] },
});

(async () => {
  /* A ÁRVORE COMEÇA COM OS DOIS MANIFESTOS. É o estado de um professor que já abriu o ciclo 02:
     o 01 está lá, e o 02 tem o seu próprio. */
  const gh = githubFalso({
    [BASE + '/ciclo-01-breu-piano.conf']: CONF_01,
    [BASE + '/ciclo-02-breu-piano.conf']: CONF_02,
  });

  const escritor = criarEscritorDeCiclo({
    token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: gh.fetch,
  });

  const r01 = await escritor({ plano: PLANO_01, po: poDe('01'), contexto: CTX_01 });
  const escritos01 = (r01.escritas || []).map((e) => e.caminho);
  provar('a passagem do ciclo 01 escreveu fontes (o teste não passa por vacuidade)',
    escritos01.length > 0, escritos01);
  provar('todas debaixo de `ciclo-01-`',
    escritos01.every((c) => /ciclo-01-/.test(c)), escritos01.filter((c) => !/ciclo-01-/.test(c)));

  /* A ÁRVORE DO CICLO 01, GUARDADA DEPOIS DA SUA PASSAGEM — é a fotografia que a passagem do 02
   * não pode mexer. Guardada ANTES do 01, a asserção media o trabalho do próprio 01 e falhava por
   * uma razão que não é a que ela diz: o `DOCS` do 01 muda quando o 01 é gravado. */
  const antesDo02 = {};
  for (const k of Object.keys(gh.arquivos)) {
    if (/(^|\/)ciclo-01-breu-piano/.test(k)) antesDo02[k] = gh.arquivos[k];
  }

  const r02 = await escritor({ plano: PLANO_02, po: poDe('02'), contexto: CTX_02 });
  const escritos02 = (r02.escritas || []).map((e) => e.caminho);
  provar('a passagem do ciclo 02 também escreveu (e não foi travada pelo 01)',
    escritos02.length > 0, escritos02);
  provar('todas debaixo de `ciclo-02-`',
    escritos02.every((c) => /ciclo-02-/.test(c)), escritos02.filter((c) => !/ciclo-02-/.test(c)));

  const colisoes = escritos02.filter((c) => escritos01.indexOf(c) !== -1);
  provar('NENHUM caminho do ciclo 02 é um caminho do ciclo 01', colisoes.length === 0, colisoes);

  /* O CICLO 01 FICA COMO ESTAVA. É a regra de proveniência no seu sentido literal: uma derivação
   * acrescenta ao seu ciclo, e não reescreve o do lado. */
  const mudou = Object.keys(antesDo02).filter((k) => gh.arquivos[k] !== antesDo02[k]);
  provar('a árvore do ciclo 01 fica BYTE A BYTE igual depois da passagem do 02',
    mudou.length === 0, mudou);

  const conf01 = gh.arquivos[BASE + '/ciclo-01-breu-piano.conf'];
  const conf02 = gh.arquivos[BASE + '/ciclo-02-breu-piano.conf'];
  provar('o manifesto do 01 e o do 02 são ficheiros distintos, ambos no repositório',
    typeof conf01 === 'string' && typeof conf02 === 'string' && conf01 !== conf02);

  const docs01 = docsAtuais(conf01);
  const docs02 = docsAtuais(conf02);
  provar('o `DOCS` do 01 declara a aula 01', docs01.indexOf('aula-01') !== -1, docs01);
  provar('…e o do 02 também (a sua, e não a do vizinho)', docs02.indexOf('aula-01') !== -1, docs02);

  /* ======================================================================================== */
  console.log('\nC · O CONTEÚDO DE UM CICLO NÃO APARECE NO OUTRO');
  /* ======================================================================================== */
  const aula01 = gh.arquivos[BASE + '/ciclo-01-breu-piano-aula-01.md'];
  const aula02 = gh.arquivos[BASE + '/ciclo-02-breu-piano-aula-01.md'];
  provar('as duas aulas existem, uma por ciclo', typeof aula01 === 'string' && typeof aula02 === 'string');
  provar('a aula do ciclo 01 declara o SEU ciclo', /^ciclo: "01"$/m.test(aula01 || ''), (aula01 || '').slice(0, 120));
  provar('a aula do ciclo 02 declara o SEU ciclo', /^ciclo: "02"$/m.test(aula02 || ''), (aula02 || '').slice(0, 120));

  provar('a aula do 01 traz o marcador do 01', /MARCADOR-DO-CICLO-UM/.test(aula01 || ''));
  provar('…e NÃO traz o marcador do 02', !/MARCADOR-DO-CICLO-DOIS/.test(aula01 || ''),
    /MARCADOR-DO-CICLO-DOIS/.test(aula01 || ''));
  provar('a aula do 02 traz o marcador do 02', /MARCADOR-DO-CICLO-DOIS/.test(aula02 || ''));
  provar('…e NÃO traz o marcador do 01', !/MARCADOR-DO-CICLO-UM/.test(aula02 || ''),
    /MARCADOR-DO-CICLO-UM/.test(aula02 || ''));

  /* A MESMA PERGUNTA A TODAS AS FONTES DO CICLO — não só à aula. Uma harmonização ou uma
   * referência a citar o ciclo errado é o mesmo vazamento, um ficheiro ao lado. */
  const fontesDo02 = Object.keys(gh.arquivos).filter((k) => /ciclo-02-breu-piano-.*\.md$/.test(k));
  const vazadas = fontesDo02.filter((k) => /MARCADOR-DO-CICLO-UM/.test(gh.arquivos[k] || ''));
  provar('nenhuma fonte do ciclo 02 contém o marcador do ciclo 01', vazadas.length === 0, vazadas);

  const fontesDo01 = Object.keys(gh.arquivos).filter((k) => /ciclo-01-breu-piano-.*\.md$/.test(k));
  const vazadas01 = fontesDo01.filter((k) => /MARCADOR-DO-CICLO-DOIS/.test(gh.arquivos[k] || ''));
  provar('nenhuma fonte do ciclo 01 contém o marcador do ciclo 02', vazadas01.length === 0, vazadas01);

  /* ======================================================================================== */
  console.log('\nD · A TRAVA DA AULA DADA É POR CICLO, e não global');
  /* ======================================================================================== */
  /* O pior modo de falhar desta família, e é silencioso: `aulas[NN]` do `-dados.json` é lido
   * para travar a reescrita da aula dada. Se a leitura não fosse POR ciclo, a aula 01 lançada do
   * ciclo 01 travaria a aula 01 do ciclo 02 — e o ciclo novo nascia sem a primeira aula. */
  {
    const AULA_01_VELHA = '# A aula 01 do ciclo 01, como o professor a deu\n';
    const gh2 = githubFalso({
      [BASE + '/ciclo-01-breu-piano.conf']: CONF_01,
      [BASE + '/ciclo-02-breu-piano.conf']: CONF_02,
      [BASE + '/ciclo-01-breu-piano-dados.json']: JSON.stringify({
        ciclo: '01', escola: 'breu', professor: 'demi-plie',
        apelidos: { aluna_a: 'Aluna A' },
        aulas: { '01': { data: '2026-11-20', ultimo_lancamento: '2026-11-20T20:00', presentes: ['aluna_a'], marcas: {} } },
      }, null, 2) + '\n',
      [BASE + '/ciclo-01-breu-piano-aula-01.md']: AULA_01_VELHA,
    });
    const escritor2 = criarEscritorDeCiclo({
      token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: gh2.fetch,
    });

    const r1 = await escritor2({ plano: PLANO_01, po: poDe('01'), contexto: CTX_01 });
    provar('a aula 01 do ciclo 01, já dada, NÃO é reescrita',
      (r1.escritas || []).every((e) => e.caminho !== BASE + '/ciclo-01-breu-piano-aula-01.md'),
      (r1.escritas || []).map((e) => e.caminho));
    provar('…e o registo dela continua no `-dados.json` do 01',
      (() => { try { return Boolean(JSON.parse(gh2.arquivos[BASE + '/ciclo-01-breu-piano-dados.json']).aulas['01']); } catch { return false; } })());

    /* O CICLO 02 NÃO TEM `aulas` NENHUMA. A aula 01 dele tem de nascer. */
    const r2 = await escritor2({ plano: PLANO_02, po: poDe('02'), contexto: CTX_02 });
    const escreveuAula02 = (r2.escritas || []).some((e) => e.caminho === BASE + '/ciclo-02-breu-piano-aula-01.md');
    provar('a aula 01 do ciclo 02 NASCE — a trava do 01 não atravessa', escreveuAula02,
      (r2.escritas || []).map((e) => e.caminho));
    provar('…e nada foi travado no ciclo 02 por causa do ciclo 01', (r2.travadas || []).length === 0, r2.travadas);
    provar('…e a aula do ciclo 01 continua intacta',
      gh2.arquivos[BASE + '/ciclo-01-breu-piano-aula-01.md'] === AULA_01_VELHA);
  }

  /* ======================================================================================== */
  console.log('\nE · O MANIFESTO É POR CICLO — gravar o 02 não mexe no `DOCS` do 01');
  /* ======================================================================================== */
  {
    const conf01Agora = gh.arquivos[BASE + '/ciclo-01-breu-piano.conf'];
    provar('o `DOCS` do ciclo 01 é o que a passagem do 01 deixou (e não uma lista cumulativa)',
      docsAtuais(conf01Agora).join(' ') === docs01.join(' '), [docs01, docsAtuais(conf01Agora)]);
    provar('nenhum documento do ciclo 02 aparece no `DOCS` do ciclo 01',
      docsAtuais(conf01Agora).every((d) => docs02.indexOf(d) === -1 || docs01.indexOf(d) !== -1),
      docsAtuais(conf01Agora));
    provar('o `-dados.json` de cada ciclo guarda o SEU ciclo',
      (() => {
        try {
          const d1 = JSON.parse(gh.arquivos[BASE + '/ciclo-01-breu-piano-dados.json']);
          const d2 = JSON.parse(gh.arquivos[BASE + '/ciclo-02-breu-piano-dados.json']);
          return String(d1.ciclo) === '01' && String(d2.ciclo) === '02';
        } catch { return false; }
      })());
  }

  /* ======================================================================================== */
  console.log('\nF · CONTROLO NEGATIVO — sem `ciclo-NN` no caminho, os dois ciclos colidem');
  /* ======================================================================================== */
  {
    /* O controlo não mexe no código: refaz a MESMA composição sem a parcela do ciclo, que é a
     * forma que o caminho tinha antes de o ciclo existir. Se os dois caminhos coincidirem aqui, a
     * asserção de A está a medir o isolamento de facto — e não o nome de uma variável. */
    const semCiclo = (ctx, sufixo) => 'professores/' + ctx.professor + '/ciclos/' + 'breu-piano' + sufixo;
    provar('sem o ciclo, o caminho do 01 e o do 02 são O MESMO ficheiro',
      semCiclo(CTX_01, '-aula-01.md') === semCiclo(CTX_02, '-aula-01.md'),
      [semCiclo(CTX_01, '-aula-01.md'), semCiclo(CTX_02, '-aula-01.md')]);
    provar('…e com o ciclo são dois (é essa a diferença que a prova mede)',
      caminhoDaFonte(CTX_01, '-aula-01.md') !== caminhoDaFonte(CTX_02, '-aula-01.md'));
  }

  console.log('\n' + (total - falhas) + '/' + total + ' asserções'
    + (falhas ? ' — ' + falhas + ' FALHA(S)' : ' — verde'));
  process.exit(falhas ? 1 : 0);
})();
