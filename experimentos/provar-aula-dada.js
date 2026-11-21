#!/usr/bin/env node
'use strict';

/**
 * provar-aula-dada.js — «regenerar o ciclo afecta só a aula que ainda não foi dada».
 *
 * A REGRA, na letra da pesquisadora (21/11/2026): «regenerar o ciclo afecta só a aula que ainda
 * não foi dada; as outras ficam e não se apagam.»
 *
 * PORQUE ELA PRECISA DE PROVA, e não de boa vontade. O «Guardar» do PO é o gesto da cascata do
 * elenco: tirar uma aluna, regravar, e o `escrever-ciclo.js` regera o ciclo inteiro. Até hoje, a
 * lista de fontes tinha `-aula-01.md` e `-captura-aula-01.md` escritas à mão e INCONDICIONAIS — a
 * correcção do elenco de hoje reescrevia o plano e a folha de observação de uma aula que já
 * aconteceu, e o diff de proveniência passava a mostrar como mudança do professor uma mudança que
 * ele não fez. A mesma coisa no `tools/regerar-derivados.js`, cuja razão de existir é justamente
 * pôr os derivados em dia.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. A REGRA, no núcleo — o que conta como «já aconteceu», e as formas de escrever o número.
 *   B. O ESCRITOR: com a aula 01 lançada, o «Guardar» do PO NÃO escreve a aula nem a folha dela,
 *      diz porquê, e não inventa um elo em `historico/`; e continua a corrigir o PRESENTE
 *      (harmonização, dados, cópia cifrada).
 *   C. O CONTROLO NEGATIVO: sem lançamento, a aula É escrita. Sem esta secção a prova passaria com
 *      o escritor a não escrever NADA — que é a forma mais fácil de «passar» sem medir.
 *   D. A REPARAÇÃO: aula lançada com a fonte ausente é reconstruída — não há facto a preservar, e
 *      um buraco no pacote não é prova de nada.
 *   E. A LISTA DE DOCUMENTOS só cresce: um ciclo que já declara a aula 02 não a perde quando a
 *      lista é refeita.
 *
 *   node experimentos/provar-aula-dada.js
 */

const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const { aulasLancadas, podeRegenerar, numeroDaAula, aulasRegeneraveis } =
  require(path.join(RAIZ, 'motor/nucleo/aulas-do-ciclo.js'));
const { criarEscritorDeCiclo, docsGerados } =
  require(path.join(RAIZ, 'motor/servidor/escrever-ciclo.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* ========================================================================================== */
console.log('\nA · A REGRA — «já aconteceu» é o registo, e o número da aula tem três formas');
/* ========================================================================================== */
{
  provar('o número normaliza 01, 1 e aula-01 para o mesmo',
    numeroDaAula('01') === '01' && numeroDaAula('1') === '01' && numeroDaAula('aula-01') === '01',
    [numeroDaAula('01'), numeroDaAula('1'), numeroDaAula('aula-01')]);
  provar('…e o que não é aula nenhuma devolve vazio',
    numeroDaAula('') === '' && numeroDaAula('x') === '' && numeroDaAula(null) === '',
    [numeroDaAula(''), numeroDaAula('x'), numeroDaAula(null)]);

  const dados = { aulas: { '01': { presentes: ['a'] }, '02': { presentes: ['b'] } } };
  const lancadas = aulasLancadas(dados);
  provar('as aulas com registo são reconhecidas (com e sem zero à frente)',
    lancadas.has('01') && lancadas.has('02'), [...lancadas]);

  provar('uma aula lançada não se regera',
    podeRegenerar('01', lancadas) === false && podeRegenerar('1', lancadas) === false,
    podeRegenerar('01', lancadas));
  provar('uma aula que nunca foi lançada regera-se',
    podeRegenerar('03', lancadas) === true, podeRegenerar('03', lancadas));

  provar('o ciclo que nasce (sem dados) deixa tudo regerável',
    aulasLancadas(null).size === 0 && podeRegenerar('01', aulasLancadas(null)) === true,
    podeRegenerar('01', aulasLancadas(null)));
  provar('a cópia CIFRADA não tem `aulas`, e não tranca nada por engano',
    aulasLancadas({ _cifrado: true, lancamentos: 2, apelidos: {} }).size === 0,
    [...aulasLancadas({ lancamentos: 2 })]);
  provar('uma entrada de `aulas` que não é objecto não é um lançamento',
    aulasLancadas({ aulas: { '01': null, '02': { presentes: [] } } }).has('01') === false,
    [...aulasLancadas({ aulas: { '01': null } })]);

  provar('a lista das regeráveis respeita a ordem declarada e não repete',
    aulasRegeneraveis(['01', '02', '03', '01'], lancadas).join(',') === '03',
    aulasRegeneraveis(['01', '02', '03', '01'], lancadas));
}

/* ========================================================================================== */
console.log('\nB · O ESCRITOR — a aula dada fica como está, e o presente continua a corrigir-se');
/* ========================================================================================== */

const CONF = [
  'CICLO="01"', 'ESCOLA="batata"', 'NOME="Ciclo 01 — batata"', 'DURACOES="60"',
  'VOLUME_MIN="3"', 'VOLUME_MAX="5"',
  'DOCS="plano harmonizacao aula-01 captura-aula-01 notacao"',
  'DIAS="segunda 18:00"',
].join('\n') + '\n';
const SCHEMA = JSON.stringify({ _declaracao: { porVariante: {} } }, null, 2);

/** O GitHub falso que PERSISTE: o que uma passagem escreve, a seguinte lê. */
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
      if (/\.conf$/.test(caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 's1', content: Buffer.from(CONF).toString('base64') }) };
      }
      if (/captura-schema\.json$/.test(caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 's2', content: Buffer.from(SCHEMA).toString('base64') }) };
      }
      if (Object.prototype.hasOwnProperty.call(arquivos, caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 'x' + caminho, content: Buffer.from(arquivos[caminho]).toString('base64') }) };
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

const CTX = { escola: 'batata', professor: 'acucar', ciclo: '01', turma: 'sala-rosa', variante: 'batata-sala-rosa' };
const BASE = 'professores/acucar/ciclos';
const DADOS = BASE + '/ciclo-01-batata-sala-rosa-dados.json';
const AULA = BASE + '/ciclo-01-batata-sala-rosa-aula-01.md';
const CAPTURA = BASE + '/ciclo-01-batata-sala-rosa-captura-aula-01.md';
const HARMONIZACAO = BASE + '/ciclo-01-batata-sala-rosa-harmonizacao.md';
const CIFRADO = BASE + '/ciclo-01-batata-sala-rosa-dados.cifrado.json';
const PLANO = { objetivo: 'x', turma: 'sala-rosa', professor: 'acucar', ciclo: '01' };
const PO = {
  id: 'po-20261121-0900', ciclo: '01', escola: 'batata', contexto: CTX,
  respostas: { horizonte: 'x', sujeitos: ['Aluna A'] },
};

/* Os três ficheiros da aula JÁ EXISTEM, como no repositório: um plano e uma folha de uma aula que
 * aconteceu, e o registo do lançamento ao lado. É esse o estado que a regra protege — se os
 * ficheiros não existissem, não haveria facto nenhum para preservar (é a secção D). */
const AULA_NO_REPOSITORIO = [
  '# Plano para a Aula 01',
  '',
  'Este é o plano que o professor levou para a sala. Ninguém o reescreve depois.',
  '',
].join('\n');
const CAPTURA_NO_REPOSITORIO = [
  '# Captura da aula 01',
  '',
  '| Bloco | O que se observa |',
  '|:--|:--|',
  '| Barra | o que se observou naquela manhã |',
  '',
].join('\n');

function dadosCom(lancadas) {
  return JSON.stringify({
    ciclo: '01', escola: 'batata', professor: 'acucar', criado_em: '2026-11-01', po: 'po-anterior',
    apelidos: { aluna_a: 'Aluna A' },
    aulas: lancadas || {},
  }, null, 2) + '\n';
}

(async () => {
  {
    const gh = githubFalso({
      [DADOS]: dadosCom({ '01': { data: '2026-11-20', ultimo_lancamento: '2026-11-20T20:00', presentes: ['aluna_a'], marcas: {} } }),
      [AULA]: AULA_NO_REPOSITORIO,
      [CAPTURA]: CAPTURA_NO_REPOSITORIO,
    });
    const escrever = criarEscritorDeCiclo({
      token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: gh.fetch,
    });
    const r = await escrever({ plano: PLANO, po: PO, contexto: CTX });

    const escritos = (r.escritas || []).map((e) => e.caminho);
    provar('o «Guardar» do PO correu e escreveu alguma coisa (o teste não passa por vacuidade)',
      escritos.length > 0, escritos);
    provar('a `-aula-01.md` NÃO foi reescrita', escritos.indexOf(AULA) === -1, escritos);
    provar('a `-captura-aula-01.md` NÃO foi reescrita', escritos.indexOf(CAPTURA) === -1, escritos);
    provar('…e continuam no repositório, com o texto que tinham',
      gh.arquivos[AULA] === AULA_NO_REPOSITORIO && gh.arquivos[CAPTURA] === CAPTURA_NO_REPOSITORIO,
      { aula: gh.arquivos[AULA] === AULA_NO_REPOSITORIO, captura: gh.arquivos[CAPTURA] === CAPTURA_NO_REPOSITORIO });

    const travadas = (r.travadas || []).map((t) => t.caminho);
    provar('o relatório DIZ que ficaram travadas, e nomeia as duas',
      travadas.indexOf(AULA) !== -1 && travadas.indexOf(CAPTURA) !== -1, travadas);
    provar('…e diz porquê, sem deixar o silêncio a explicar',
      (r.travadas || []).every((t) => /já foi lançada/.test(String(t.motivo || ''))),
      (r.travadas || []).map((t) => t.motivo));

    provar('nenhum ELO foi inventado para elas (não houve substituição)',
      (r.elos || []).every((e) => e.de !== AULA && e.de !== CAPTURA),
      (r.elos || []).map((e) => e.de));
    provar('…e nada foi para `historico/` com o texto da aula',
      (r.elos || []).every((e) => gh.arquivos[e.para] !== AULA_NO_REPOSITORIO),
      (r.elos || []).map((e) => e.para));

    /* O PRESENTE CONTINUA A CORRIGIR-SE. Travar a aula não pode travar o ciclo: a harmonização e
     * os dados descrevem o ciclo de hoje, e é para isso que o «Guardar» do PO existe. */
    provar('a `-harmonizacao.md` foi escrita (o presente não fica travado com o passado)',
      escritos.indexOf(HARMONIZACAO) !== -1, escritos);
    provar('o `-dados.json` foi escrito', escritos.indexOf(DADOS) !== -1, escritos);
    provar('…e a aula lançada sobreviveu dentro dele',
      (() => { try { return Boolean(JSON.parse(gh.arquivos[DADOS]).aulas['01']); } catch { return false; } })(),
      gh.arquivos[DADOS] && gh.arquivos[DADOS].slice(0, 200));
    provar('a cópia cifrada acompanhou a fonte',
      Boolean(r.cifrado && r.cifrado.ok) && Boolean(gh.arquivos[CIFRADO]), r.cifrado);
  }

  /* ======================================================================================== */
  console.log('\nC · O CONTROLO NEGATIVO — sem lançamento, a aula É escrita');
  /* ======================================================================================== */
  {
    const gh = githubFalso({
      [DADOS]: dadosCom({}),
      [AULA]: AULA_NO_REPOSITORIO,
      [CAPTURA]: CAPTURA_NO_REPOSITORIO,
    });
    const escrever = criarEscritorDeCiclo({
      token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: gh.fetch,
    });
    const r = await escrever({ plano: PLANO, po: PO, contexto: CTX });
    const escritos = (r.escritas || []).map((e) => e.caminho);

    provar('sem aula lançada, a `-aula-01.md` é regerada', escritos.indexOf(AULA) !== -1, escritos);
    provar('…e a `-captura-aula-01.md` também', escritos.indexOf(CAPTURA) !== -1, escritos);
    provar('…a versão anterior fica como elo em `historico/` (o derivado mudou, e a prova disso fica)',
      (r.elos || []).some((e) => e.de === AULA && /\/historico\//.test(e.para)),
      (r.elos || []).map((e) => e.de));
    provar('…e nenhuma fonte ficou travada (a regra não tranca o que não é facto)',
      (r.travadas || []).length === 0, r.travadas);
  }

  /* ======================================================================================== */
  console.log('\nD · A REPARAÇÃO — a fonte da aula lançada que falta é reconstruída');
  /* ======================================================================================== */
  {
    const gh = githubFalso({
      [DADOS]: dadosCom({ '01': { data: '2026-11-20', ultimo_lancamento: '2026-11-20T20:00', presentes: ['aluna_a'] } }),
      /* A `-aula-01.md` NÃO está lá: alguém a apagou à mão. A folha está. */
      [CAPTURA]: CAPTURA_NO_REPOSITORIO,
    });
    const escrever = criarEscritorDeCiclo({
      token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: gh.fetch,
    });
    const r = await escrever({ plano: PLANO, po: PO, contexto: CTX });
    const escritos = (r.escritas || []).map((e) => e.caminho);

    provar('a fonte ausente da aula lançada é reconstruída', escritos.indexOf(AULA) !== -1, escritos);
    provar('…e o relatório diz que foi uma reparação, não uma reescrita',
      (r.reparadas || []).some((x) => x.caminho === AULA), r.reparadas);
    provar('…e a folha, que existia, continua travada',
      (r.travadas || []).some((x) => x.caminho === CAPTURA),
      (r.travadas || []).map((x) => x.caminho));
  }

  /* ======================================================================================== */
  console.log('\nE · A LISTA DE DOCUMENTOS só cresce — nenhuma aula é tirada de lá');
  /* ======================================================================================== */
  {
    const comAula2 = docsGerados({
      plano: PLANO,
      atuais: ['plano', 'harmonizacao', 'aula-01', 'aula-02', 'captura-aula-01', 'captura-aula-02', 'referencias'],
    });
    provar('a aula 02 já declarada sobrevive à lista nova',
      comAula2.indexOf('aula-02') !== -1, comAula2);
    provar('…e a folha da aula 02 também', comAula2.indexOf('captura-aula-02') !== -1, comAula2);
    provar('…a aula 01 continua no princípio', comAula2[2] === 'aula-01' && comAula2[3] === 'captura-aula-01',
      comAula2.slice(0, 6));
    provar('as aulas saem em ordem numérica (02 não vem antes de 01)',
      comAula2.filter((d) => /^aula-\d+$/.test(d)).join(',') === 'aula-01,aula-02',
      comAula2.filter((d) => /^aula-\d+$/.test(d)));

    const semNada = docsGerados({ plano: PLANO, atuais: [] });
    provar('um ciclo do zero ganha a aula 01 e a folha dela',
      semNada.indexOf('aula-01') !== -1 && semNada.indexOf('captura-aula-01') !== -1, semNada);
    provar('…e a lista mantém a ordem do manifesto (plano · harmonização · aula · captura · referências)',
      semNada[0] === 'plano' && semNada[1] === 'harmonizacao'
      && semNada[semNada.length - 1] === 'referencias',
      semNada);
  }

  console.log('\n' + (total - falhas) + '/' + total + ' asserções'
    + (falhas ? ' — ' + falhas + ' FALHA(S)' : ' — verde'));
  process.exit(falhas ? 1 : 0);
})();
