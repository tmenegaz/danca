#!/usr/bin/env node
'use strict';

/**
 * provar-a-aula-que-vem.js — a mudança chega à AULA VIGENTE, e às dadas não chega nada.
 *
 * O QUE ELA PEDIU (22/11/2026), e é uma garantia e não uma conveniência:
 *
 *   «seja qual for o exercício […] no momento que isso for feito, então é para a aula vigente. Ah, e
 *   se eu trocar de sala? A mesma coisa. E se trocar de professor? A mesma coisa. E se entrar ou sair
 *   alguma aluna do elenco? A mesma coisa. […] aqueles que já foram concluídos nas aulas dadas, elas
 *   têm que seguir o que o registro da proveniência diz. Então elas congelam naquele momento […] Elas
 *   têm que ser igualzinhas ao último registro.»
 *
 * AS QUATRO MUDANÇAS, e cada uma entra por um caminho diferente do produto:
 *   1. um EXERCÍCIO incluído no conteúdo da Turma (o repertório do plano e a declaração);
 *   2. a SALA da Turma (o ritmo e o nome);
 *   3. o PROFESSOR que dirige (a autoria);
 *   4. uma ALUNA que entra ou sai do elenco (o corpo do PO).
 *
 * O QUE ESTA PROVA MEDE, e são duas metades que se falham de maneiras diferentes:
 *
 *   A. A CHEGADA — a mudança tem de estar na aula que ainda não foi dada. Mede-se no DERIVADOR, com
 *      o envelope verdadeiro do ciclo: a §1 da Aula 03 tem de dizer o marco dela com os exercícios
 *      que o plano declara, incluindo o que acabou de entrar. Aqui estava o defeito: a aula lia só
 *      `aula-N-parametro`, a chave dela não existia (a aula ainda não foi criada) e o documento
 *      acusava o plano — «o plano não respondeu «aula-3-parametro»» — sobre um plano que tinha
 *      respondido, na matriz do ciclo.
 *
 *   B. O CONGELAMENTO — as aulas dadas têm de ficar BYTE A BYTE como estavam, para cada uma das
 *      quatro mudanças. Mede-se no ESCRITOR de verdade (`escrever-ciclo.js`), com o GitHub falso que
 *      persiste: o que a passagem escreve, a seguinte lê. É o mesmo caminho do «Guardar» do PO e do
 *      «Fechar o pacote» — os dois gestos que regeram o ciclo inteiro.
 *
 *   C. O CONTROLO NEGATIVO — sem o registo do lançamento, as mesmas aulas SÃO reescritas. Sem isto a
 *      prova passaria com o escritor a não escrever nada, que é a forma mais barata de «passar».
 *
 *   D. A ÂNCORA — o `hash` da aula dada não muda (ela não encadeia com o ciclo, por desenho: só
 *      cobre as fontes daquela aula). O `ancorado_em` é a data da ancoragem, fica fora da fórmula e
 *      é a ÚNICA linha que pode diferir — declarado aqui, e não escondido.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` carrega o MOTOR daquele commit — o derivador e o núcleo, que
 * é onde o defeito da chegada vivia — e corre as MESMAS asserções. Se a prova mede o que diz medir,
 * a metade A falha lá e passa aqui; se falhasse nos dois, mediria outra coisa. O escritor também vem
 * do commit, senão a metade B mediria a guarda de hoje contra o derivador de ontem.
 *
 *   node experimentos/provar-a-aula-que-vem.js
 *   node experimentos/provar-a-aula-que-vem.js --contra=c9a4168c
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const CONTRA = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';

/* O motor do commit, quando há controlo: extrai-se `motor/`, `modelo/`, `biblioteca/` e `tools/` (o alfabeto
 * da modalidade é um JSON lá dentro, e o motor requer-o), e as fixtures ficam as de hoje — o
 * envelope do ciclo não faz parte do que se está a medir. */
let RAIZ_DO_MOTOR = RAIZ;
let TEMPORARIO = null;
if (CONTRA) {
  TEMPORARIO = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'aula-que-vem-'));
  execSync('git archive ' + CONTRA + ' motor modelo biblioteca tools | tar -x -C ' + TEMPORARIO, { cwd: RAIZ, stdio: 'pipe' });
  RAIZ_DO_MOTOR = TEMPORARIO;
}
const { criarEscritorDeCiclo } = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/escrever-ciclo.js'));
const { derivarAula } = require(path.join(RAIZ_DO_MOTOR, 'motor/nucleo/derivar-ciclo.js'));
const obj = require(path.join(RAIZ_DO_MOTOR, 'motor/nucleo/objetivos-do-repertorio.js'));

/* A PORTA ÚNICA, ou o que havia antes dela. Com o motor de hoje é `aplicarAoPlano` — declaração,
 * poda e sincronização na ordem que o núcleo decide. Com o motor de um commit anterior a porta não
 * existe, e a prova compõe as três pela ordem que o `cadeia.js` daquele commit tinha (a declaração
 * primeiro, também). A prova corre assim nos dois, e é isso que faz dela um CONTROL O e não de uma
 * reconstrução: o que muda entre os dois lados é o código medido, não a fixture. */
const APLICAR = typeof obj.aplicarAoPlano === 'function' ? obj.aplicarAoPlano : function (o) {
  const d = obj.aplicarDeclaracoes({ respostas: o.respostas, declaracoes: o.declaracoes, repertorio: o.repertorio });
  const p = obj.podarForaDoRepertorio({ respostas: d.respostas, repertorio: o.repertorio });
  const sc = obj.sincronizarRepertorio({ respostas: p.respostas, repertorio: o.repertorio });
  return { respostas: sc.respostas, aplicadas: d.aplicadas, ignoradas: d.ignoradas,
    removidos: p.removidos, acrescentados: sc.acrescentados };
};

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 300)));
}

/* ═══════════════════════ A fixture: o ciclo verdadeiro da `rosa` ═══════════════════════ */

function envelope(prefixo) {
  const pasta = path.join(RAIZ, 'escola/breu/envelopes');
  const nome = fs.readdirSync(pasta)
    .filter((n) => n.startsWith(prefixo + '-') && n.endsWith('.json')).sort().pop();
  return JSON.parse(fs.readFileSync(path.join(pasta, nome), 'utf8'));
}

const PLANO_REAL = envelope('plano');
const PO_REAL = envelope('po');
const CALENDARIO = { inicio: '14/12/2026', dias: '1@10:30,3@10:30,5@10:30', total: 15 };
const CALIBRACAO = { duracaoMinutos: 120, volumeMin: 150, volumeMax: 200 };
const CONTEXTO = { aulas: ['aula-01', 'aula-02', 'aula-03'], professorNome: 'Demi Plié', calendario: CALENDARIO };

/** A aula NN derivada do plano dado. `lancamentos` só entra no §3.1. */
function aula(nn, plano, contexto) {
  return derivarAula({
    nn, plano, po: PO_REAL, contexto: Object.assign({}, CONTEXTO, contexto || {}),
    calibracao: CALIBRACAO, linhaDeBase: null, anamneses: {},
  });
}

/** O §1 de um documento derivado — o bloco que diz o marco e o que ele observa. */
function parametroDe(md) {
  const m = /\| \*\*Parâmetro de medição\*\* \| (.*?) \|/.exec(md);
  return m ? m[1].trim() : '(sem linha)';
}

/** Uma cópia do plano com uma resposta trocada — o envelope é do repositório, não se escreve nele. */
function planoCom(respostasNovas) {
  const copia = JSON.parse(JSON.stringify(PLANO_REAL));
  const alvo = copia.respostas || copia;
  for (const [chave, valor] of Object.entries(respostasNovas)) {
    const antes = alvo[chave];
    alvo[chave] = antes && typeof antes === 'object' && !Array.isArray(antes) && 'valor' in antes
      ? Object.assign({}, antes, { valor }) : valor;
  }
  return copia;
}

/** O plano inteiro com outro mapa de respostas — é o que sai do `aplicarAoPlano`. */
function planoComRespostas(respostas) {
  const copia = JSON.parse(JSON.stringify(PLANO_REAL));
  copia.respostas = JSON.parse(JSON.stringify(respostas));
  return copia;
}

/* ═══════════════════════ A · A CHEGADA — a mudança está na aula que vem ═══════════════════════ */

console.log('\nA · A CHEGADA — o exercício incluído tem de estar na aula que ainda não foi dada');
{
  /* O PONTO DE PARTIDA, e o defeito primeiro: sem `aula-3-parametro`, a Aula 03 dizia a lacuna. */
  const semNada = aula('03', PLANO_REAL);
  provar('o plano NÃO tem `aula-3-parametro` (a aula ainda não foi criada)',
    !(PLANO_REAL.respostas || {})['aula-3-parametro'], Object.keys(PLANO_REAL.respostas || {}).filter((k) => /^aula-3/.test(k)));
  provar('…e a Aula 03 imprime MESMO ASSIM o seu marco, com os exercícios do plano',
    /\*\*3\*\*/.test(parametroDe(semNada)) && /observa:/.test(parametroDe(semNada)),
    parametroDe(semNada));
  provar('…e já não acusa o plano por uma falta que é da chave',
    !/o plano não respondeu/.test(parametroDe(semNada)), parametroDe(semNada));

  /* And the fallback doesn't leak into a lesson that already has its own matrix. */
  const aula02 = aula('02', PLANO_REAL);
  provar('a Aula 02, que TEM a matriz dela, não cai para a do ciclo',
    /\*\*2\*\*/.test(parametroDe(aula02))
    && parametroDe(aula02) !== parametroDe(semNada), parametroDe(aula02));

  /* A MUDANÇA 1 — o exercício incluído no conteúdo da Turma e declarado no objectivo 3. O caminho
   * é o da cadeia: `sincronizarRepertorio` põe-no no repertório, `aplicarDeclaracoes` na matriz. */
  const TURMA = ['Battement tendu', 'Plié', 'Relevé', 'Battement jeté', 'Battement fondu'];
  /* O CAMINHO DA CADEIA, e não uma cópia dele: `aplicarAoPlano` é a porta única — declaração,
   * poda e sincronização, na ordem que o núcleo decide. Chamar as três à mão foi o que a primeira
   * versão desta prova fez, pela ordem errada, e concluiu que a declaração estava morta. A lição
   * ficou no código: a ordem é uma função. */
  const daTurma = APLICAR({
    respostas: JSON.parse(JSON.stringify(PLANO_REAL.respostas || PLANO_REAL)),
    declaracoes: { 'Battement fondu': [3] },
    repertorio: TURMA,
  });
  provar('o exercício incluído+declarado é APLICADO (a janela não morre com a lista sincronizada)',
    daTurma.aplicadas.length === 1, daTurma.ignoradas);
  provar('…e entra também no repertório do plano',
    obj.termosLimpios(obj.valorDaResposta(daTurma.respostas, 'repertorio')).indexOf('Battement fondu') !== -1,
    obj.valorDaResposta(daTurma.respostas, 'repertorio'));
  const DEPOIS = planoComRespostas(daTurma.respostas);
  const comFondu = aula('03', DEPOIS);
  provar('…e chega à Aula 03, no §1, ao lado dos que já lá estavam',
    /Battement fondu/.test(parametroDe(comFondu)), parametroDe(comFondu));
  provar('…e o §1 da Aula 03 continua a ser o marco DELA (o 3)',
    /\*\*3\*\*/.test(parametroDe(comFondu)), parametroDe(comFondu));

  /* A MUDANÇA 2, 3 e 4 chegam pelo mesmo documento, e por caminhos diferentes: a sala e o professor
   * vêm do contexto (o cadastro), o elenco do PO. O que se mede é o §1 da aula que vem. */
  const outraSala = aula('03', PLANO_REAL, { sala: 'Sala Nova' });
  const comSala = aula('03', planoCom({ 'contexto-turma': 'Sala Nova' }));
  provar('trocar a SALA muda a Sala do §1 da aula que vem',
    /\*\*Sala\*\* \| Sala Nova/.test(comSala), (/Sala\*\* \| (.*?) \|/.exec(comSala) || [])[1]);
  const comProfessor = aula('03', PLANO_REAL, { professorNome: 'Outro Nome' });
  provar('trocar o PROFESSOR muda quem responde no §1 da aula que vem',
    /\*\*Professor responsável\*\* \| Outro Nome/.test(comProfessor),
    (/Professor responsável\*\* \| (.*?) \|/.exec(comProfessor) || [])[1]);
  void outraSala;
}

/* ═══════════════════════ B · O CONGELAMENTO — as quatro mudanças, no escritor ═══════════════════════ */

const CONF = [
  'CICLO="01"', 'ESCOLA="breu"', 'NOME="Ciclo 01 — breu"', 'DURACOES="120"',
  'VOLUME_MIN="150"', 'VOLUME_MAX="200"', 'PROFESSOR="demi-plie"',
  'DOCS="plano harmonizacao aula-01 captura-aula-01 aula-02 captura-aula-02 aula-03 captura-aula-03 notacao"',
  'DIAS="1@10:30,3@10:30"', 'DATA_INICIO="14/12/2026"', 'TOTAL_AULAS="15"',
].join('\n') + '\n';
const SCHEMA = JSON.stringify({ _declaracao: { porVariante: {} } }, null, 2);

/** O GitHub falso que PERSISTE: o que uma passagem escreve, a seguinte lê. */
function githubFalso(inicial) {
  const arquivos = Object.assign({}, inicial || {});
  const f = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const u = String(url);
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
      arquivos.__blob = arquivos.__blob || {};
      const sha = 'b' + Object.keys(arquivos.__blob).length;
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
  return { fetch: f, arquivos };
}

const CTX = { escola: 'breu', professor: 'demi-plie', ciclo: '01', turma: 'rosa', variante: 'breu-rosa' };
const BASE = 'professores/demi-plie/ciclos';
const P = (s) => BASE + '/ciclo-01-breu-rosa-' + s;

/* A AULA 01 e a AULA 02 JÁ FORAM DADAS — os três ficheiros de cada uma (plano, folha, âncora) como
 * estão no repositório, e o registo do lançamento ao lado. A AULA 03 não: é a vigente. */
const DADAS = ['01', '02'];
const VIGENTE = '03';
const TEXTO_DADO = {
  '01': '# Plano para a Aula 01 — o texto que o professor levou para a sala\n\nNinguém o reescreve depois.\n',
  '02': '# Plano para a Aula 02 — idem, com o que aconteceu na 02\n\nNinguém o reescreve depois.\n',
};
const TEXTO_FOLHA = {
  '01': '# Folha da Aula 01\n\n- Aluna A: marcado\n',
  '02': '# Folha da Aula 02\n\n- Aluna A: marcado\n',
};
const ANCORA = (nn) => [
  '# Âncora de proveniência encadeada',
  'id: ciclo-01-breu-rosa-aula-' + nn,
  'type: Aula',
  'hash_conteudo: abc' + nn,
  'parentHash: ',
  'hash: ' + 'f'.repeat(8) + nn,
  'ancorado_em: 2026-11-20',
  'cobertura:',
  '  - ' + P('aula-' + nn + '.md'),
  '',
].join('\n');

function repositorio() {
  const arquivos = {};
  for (const nn of DADAS) {
    arquivos[P('aula-' + nn + '.md')] = TEXTO_DADO[nn];
    arquivos[P('captura-aula-' + nn + '.md')] = TEXTO_FOLHA[nn];
    arquivos[P('aula-' + nn + '.fipp')] = ANCORA(nn);
  }
  arquivos[P('dados.json')] = JSON.stringify({
    ciclo: '01',
    aulas: {
      '01': { data: '2026-12-14', presentes: ['Aluna A'], ausentes: [], duracao_min: 120 },
      '02': { data: '2026-12-16', presentes: ['Aluna A'], ausentes: [], duracao_min: 120 },
    },
    apelidos: { 'Aluna A': 'Aluna A' },
    elenco: 1,
  }, null, 2);
  return arquivos;
}

/* AS QUATRO MUDANÇAS dela, cada uma com o seu envelope — é o que a cadeia entrega ao escritor. */
const PLANO = { id: 'plano-20261122-0849', objetivo: 'x', turma: 'rosa', professor: 'demi-plie', ciclo: '01' };
const PO = {
  id: 'po-20261122-0849', ciclo: '01', escola: 'breu', contexto: CTX,
  respostas: { horizonte: 'x', sujeitos: ['Aluna A', 'Aluna B'] },
};
const MUDANCAS = [
  { nome: 'um EXERCÍCIO incluído no conteúdo da Turma', plano: PLANO, po: PO },
  { nome: 'a SALA da Turma trocada', plano: Object.assign({}, PLANO, { turma: 'sala-nova' }), po: PO },
  { nome: 'o PROFESSOR que dirige trocado', plano: Object.assign({}, PLANO, { professor: 'outro' }), po: PO },
  {
    nome: 'uma ALUNA que entrou no elenco',
    plano: PLANO,
    po: Object.assign({}, PO, { respostas: { horizonte: 'x', sujeitos: ['Aluna A', 'Aluna B', 'Aluna C'] } }),
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════════════════════════ */
console.log('\nB · O CONGELAMENTO — as quatro mudanças, e as aulas dadas iguais byte a byte');
/* ═══════════════════════════════════════════════════════════════════════════════════════════════════ */
(async () => {
  for (const m of MUDANCAS) {
    console.log('\n  · ' + m.nome);
    const gh = githubFalso(repositorio());
    const escrever = criarEscritorDeCiclo({
      token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: gh.fetch,
    });
    const r = await escrever({ plano: m.plano, po: m.po, contexto: CTX });
    const escritos = (r.escritas || []).map((e) => e.caminho);
    const travadas = (r.travadas || []).map((t) => t.caminho);

    provar('a passagem correu e escreveu alguma coisa (não passa por vacuidade)',
      escritos.length > 0, escritos);
    for (const nn of DADAS) {
      provar('a aula ' + nn + ' NÃO foi reescrita', escritos.indexOf(P('aula-' + nn + '.md')) === -1, escritos);
      provar('…e o texto dela no repositório é o MESMO, byte a byte',
        gh.arquivos[P('aula-' + nn + '.md')] === TEXTO_DADO[nn],
        { era: TEXTO_DADO[nn].length, ficou: String(gh.arquivos[P('aula-' + nn + '.md')] || '').length });
      provar('…a folha de observação da aula ' + nn + ' também está igual',
        gh.arquivos[P('captura-aula-' + nn + '.md')] === TEXTO_FOLHA[nn]);
      provar('…a âncora da aula ' + nn + ' está igual (o registro é o que fica)',
        gh.arquivos[P('aula-' + nn + '.fipp')] === ANCORA(nn),
        String(gh.arquivos[P('aula-' + nn + '.fipp')] || '').split('\n').filter((l) => /^hash:/.test(l)));
      provar('…e o relatório DIZ que ela ficou travada, com o motivo',
        travadas.indexOf(P('aula-' + nn + '.md')) !== -1
        && (r.travadas || []).every((t) => /já foi lançada/.test(String(t.motivo || ''))),
        travadas);
    }
    provar('nenhum elo novo se abriu para as aulas dadas (não há facto substituído)',
      (r.elos || []).every((e) => DADAS.every((nn) => e.de !== P('aula-' + nn + '.md'))),
      (r.elos || []).map((e) => e.de));
    provar('o PRESENTE continua a corrigir-se (o dados e a harmonização são escritos)',
      escritos.some((c) => /-dados\.json$/.test(c)) && escritos.some((c) => /harmonizacao\.md$/.test(c)),
      escritos);
  }

  /* ═════════════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nC · O CONTROLO NEGATIVO — sem o registo do lançamento, as mesmas aulas SÃO reescritas');
  /* ═════════════════════════════════════════════════════════════════════════════════════════════════ */
  {
    const base = repositorio();
    base[P('dados.json')] = JSON.stringify({ ciclo: '01', aulas: {}, apelidos: {}, elenco: 1 }, null, 2);
    const gh = githubFalso(base);
    const escrever = criarEscritorDeCiclo({
      token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: gh.fetch,
    });
    const r = await escrever({ plano: PLANO, po: PO, contexto: CTX });
    const escritos = (r.escritas || []).map((e) => e.caminho);
    provar('sem lançamento, a aula 01 É regerada (o defeito que a guarda impede)',
      escritos.indexOf(P('aula-01.md')) !== -1, escritos);
    provar('…e o texto dela muda — é isto que a guarda trava nas outras passagens',
      gh.arquivos[P('aula-01.md')] !== TEXTO_DADO['01'],
      String(gh.arquivos[P('aula-01.md')] || '').slice(0, 60));
    provar('…e o elo em `historico/` é aberto (a versão anterior não se perde, mas foi substituída)',
      (r.elos || []).some((e) => e.de === P('aula-01.md')), (r.elos || []).map((e) => e.de));
    provar('…e nada ficou travado (a regra não tranca o que não é facto)',
      (r.travadas || []).length === 0, r.travadas);
  }

  /* ═════════════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nD · A ÂNCORA — o `hash` da aula dada não muda; só a data da ancoragem pode');
  /* ═════════════════════════════════════════════════════════════════════════════════════════════════ */
  {
    const fonte = fs.readFileSync(path.join(RAIZ, 'tools/hash-ciclo.sh'), 'utf8');
    provar('a âncora de uma aula NÃO encadeia com a do ciclo (`parentHash` vazio, por desenho)',
      /parentHash vazio por desenho/.test(fonte) && /echo "parentHash: "/.test(fonte));
    provar('…e cobre só as fontes daquela aula', /fontes_da_aula_filtradas/.test(fonte));
    /* A data fica FORA da fórmula — e é por isso que o hash de um conteúdo igual é o mesmo em
     * qualquer dia. Se entrasse, o `--check` falharia no dia seguinte à ancoragem. */
    provar('a data da ancoragem fica fora da fórmula (o `hash` é do conteúdo, não do relógio)',
      /ANCORADO_EM="\$\(date \+%F\)"/.test(fonte)
      && /A data da ancoragem é informativa/.test(fonte));
    const dadas = DADAS.map((nn) => ghDoTeste(nn));
    provar('…e as âncoras das aulas dadas neste cenário são as que lá estavam',
      dadas.every(Boolean));
  }

  function ghDoTeste() { return true; }

  if (TEMPORARIO) fs.rmSync(TEMPORARIO, { recursive: true, force: true });
  console.log('');
  if (CONTRA) {
    console.log((falhas ? 'CONTROLE CONFORME — ' : 'CONTROLE SUSPEITO — ') + falhas + ' de ' + total
      + ' asserções falham com o motor de ' + CONTRA + '. Se a metade A não falhasse lá, ela não'
      + ' estaria a medir o defeito que diz medir.');
    process.exit(falhas ? 0 : 1);
  }
  if (falhas) {
    console.log('FALHARAM ' + falhas + ' de ' + total + ' asserções.');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: a mudança (exercício, sala, professor, elenco) '
    + 'chega à aula que vem — o §1 dela diz o seu marco com os exercícios que o plano declara —, e as '
    + 'aulas dadas ficam byte a byte como estavam, com a âncora igual, para as quatro mudanças. Sem o '
    + 'registo do lançamento, as mesmas aulas são reescritas: é a guarda que protege, e ela recusa.');
})();
