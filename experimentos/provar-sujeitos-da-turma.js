'use strict';

/*
 * provar-sujeitos-da-turma.js — o Plano de Observação de uma turma só oferece as alunas DELA.
 *
 * O DEFEITO (20/10/2026). A escola `calango` tinha três turmas e três anamneses — uma aluna por
 * turma. A curadoria da direção dizia, com todas as letras:
 *
 *   Balé Nível 1 — Teste 1  →  Aluna C
 *   Balé Nível 2 — Teste 1  →  Aluna B
 *   Balé Nível 3 — Teste 1  →  Aluna A
 *
 * O Plano de Observação da turma 1 oferecia as três. Medido no Worker ao vivo:
 * `sujeitos oferecidos: ['Aluna C', 'Aluna B', 'Aluna A']`.
 *
 * A CAUSA não foi um filtro ausente — era um filtro que existia e não recortava. A tela filtra
 * a lista por `daCuradoria('alunas')`, que é a UNIÃO das curadorias do professor: com uma
 * curadoria por turma, a união é sempre «todas». O recorte tem de ser por TURMA.
 *
 * DE ONDE VEM O VÍNCULO. Não da anamnese: o conteúdo dela declara que «os nove blocos e os
 * módulos condicionais não decidem para que turma a aluna vai». Vem da CURADORIA, que declara
 * professor, turma e alunas de uma vez — e que já é a fonte que o `bastidores.js` usa
 * (`turmasDaCuradoria`, `alunaVinculadaA`).
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   A. A REGRA. `alunasDaTurma` lê os dois formatos do registo, respeita a substituição, e
 *      distingue três casos que NÃO podem colapsar: sem turma (`null`, «não pediram recorte»),
 *      turma sem curadoria (`[]`, «ninguém atribuído» — e não «todas»), e turma com curadoria.
 *   B. A LISTA. `porta.anamneses` com `{alunas}` recorta; sem recorte não recorta; com recorte
 *      vazio devolve vazio — o lado seguro.
 *   C. A ROTA. `GET /api/anamneses?turma=` recorta; `?plano=` resolve a turma pelo envelope do
 *      plano escolhido; sem parâmetro responde a lista inteira (o comportamento de antes).
 *   D. A DECLARAÇÃO. O conteúdo do PO declara `recortePeloPlano` no nó `sujeitos` e explica a
 *      regra ao professor; e a tela compõe o endereço com o plano escolhido — sem a declaração,
 *      o recorte não chega ao servidor e nada disto serve.
 *
 * SEM REDE: um GitHub falso em memória, e as curadorias passadas por uma função de leitura.
 *
 *   node experimentos/provar-sujeitos-da-turma.js
 */

const fs = require('fs');
const path = require('path');

const porta = require('../motor/nucleo/porta.js');
const acervo = require('../motor/servidor/acervo-envelopes.js');
const { criarMemoria } = require('../motor/nucleo/armazenamento.js');
const { criarRotas } = require('../motor/servidor/rotas.js');

const RAIZ = path.join(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(PORTA, p), 'utf8'));

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'calango';

/*
 * A CURADORIA REAL DO CALANGO, como o Worker a devolveu às 08:0x de 20/10/2026. É o dado que
 * produziu o defeito: três turmas, uma aluna cada, e nenhuma intersecção.
 */
const CURADORIAS = [
  { id: 'p-1', professor: 'sapo-bailarino', modalidade: 'Balé clássico', turmas: ['Balé Nível 1 — Teste 1'], alunas: ['Aluna C'] },
  { id: 'p-2', professor: 'sapo-bailarino', modalidade: 'Balé clássico', turmas: ['Balé Nível 2 — Teste 1'], alunas: ['Aluna B'] },
  { id: 'p-3', professor: 'sapo-bailarino', modalidade: 'Balé clássico', turmas: ['Balé Nível 3 — Teste 1'], alunas: ['Aluna A'] },
];

/** O GitHub em memória: só a árvore e a leitura de conteúdo — esta prova não grava nada. */
function githubDeBolso(arquivos) {
  const mapa = new Map(Object.entries(arquivos || {}));
  const fetchFalso = async (url) => {
    if (String(url).indexOf('/git/trees/') !== -1) {
      return new Response(JSON.stringify({
        sha: 'arvore', tree: [...mapa.keys()].map((p) => ({ path: p, type: 'blob', sha: 'sha' })),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const m = /\/contents\/(.+?)(\?|$)/.exec(String(url));
    const caminho = m ? decodeURIComponent(m[1]) : '';
    if (!mapa.has(caminho)) return new Response('not found', { status: 404 });
    return new Response(JSON.stringify({
      sha: 'sha', content: Buffer.from(mapa.get(caminho), 'utf8').toString('base64'),
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return { fetchFalso, arquivos: mapa };
}

/*
 * O envelope de uma anamnese. O APELIDO mora no CONTEXTO, não nas respostas: é de lá que o
 * `resumoDoEnvelope` o tira, e é ele que a lista mostra.
 */
function anamnese(aluna) {
  return JSON.stringify({
    id: 'anamnese-' + aluna.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    contexto: { escola: ESCOLA, professor: 'sapo-bailarino', ciclo: '01', aluna },
    respostas: {},
  });
}

/** O envelope de um plano de ensino, com a turma no `contexto-turma` das respostas. */
function plano(id, turma) {
  return JSON.stringify({
    id, escola: ESCOLA, professor: 'sapo-bailarino',
    respostas: { 'contexto-turma': { valor: turma, origem: 'declarado' } },
  });
}

function mundo(turmaDoPlano) {
  const gh = githubDeBolso({
    'escola/calango/envelopes/anamnese-aluna-a.json': anamnese('Aluna A'),
    'escola/calango/envelopes/anamnese-aluna-b.json': anamnese('Aluna B'),
    'escola/calango/envelopes/anamnese-aluna-c.json': anamnese('Aluna C'),
    'escola/calango/envelopes/plano-n1.json': plano('plano-n1', 'Balé Nível 1 — Teste 1'),
    'escola/calango/envelopes/plano-n2.json': plano('plano-n2', 'Balé Nível 2 — Teste 1'),
    'escola/calango/envelopes/.indice.json': JSON.stringify({ versao: 1, envelopes: {} }),
  });
  const kv = criarMemoria();
  const armazenamento = acervo.combinar(acervo.criarAcervoDeEnvelopes({
    token: 'token-de-prova', escola: ESCOLA, senhaCripto: null,
    fetchImpl: gh.fetchFalso, legado: kv,
  }), kv);
  const rotas = criarRotas({
    armazenamento,
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    escolaDoWorker: ESCOLA,
    agora: () => '2026-10-20T08:00',
    lerCuradorias: async () => (turmaDoPlano === undefined ? CURADORIAS : turmaDoPlano),
  });
  return { rotas, armazenamento, gh };
}

async function pedir(rotas, caminho) {
  const resposta = await rotas.responder(new Request('http://local' + caminho, { method: 'GET' }));
  const texto = await resposta.text();
  let dados = null;
  try { dados = JSON.parse(texto); } catch { dados = texto; }
  return { status: resposta.status, dados };
}

const valores = (dados) => (dados && Array.isArray(dados.opcoes) ? dados.opcoes.map((o) => o.valor).sort() : null);

async function principal() {
  // ------------------------------------------------------------------ A
  console.log('\nA. a regra: quem a curadoria declara naquela turma');
  // A REGRA TEM DE EXISTIR. Sem esta guarda, um `HEAD` sem ela derrubava a prova com um
  // `TypeError` — e um estouro não diz QUAL asserção falhou, que é a única coisa que se lhe pede.
  if (typeof porta.alunasDaTurma !== 'function') {
    checar('a regra `alunasDaTurma` existe no núcleo', false,
      'motor/nucleo/porta.js não a exporta — o recorte por turma não existe');
    console.log('\nFALHOU — a regra do recorte não existe; as secções B, C e D dependem dela.');
    process.exit(1);
  }
  {
    checar('a turma 1 declara UMA aluna, e é a certa',
      JSON.stringify(porta.alunasDaTurma(CURADORIAS, { turma: 'Balé Nível 1 — Teste 1', professor: 'sapo-bailarino' })) === '["Aluna C"]',
      porta.alunasDaTurma(CURADORIAS, { turma: 'Balé Nível 1 — Teste 1', professor: 'sapo-bailarino' }));
    checar('a turma 2 declara outra, e nenhuma das duas se mistura',
      JSON.stringify(porta.alunasDaTurma(CURADORIAS, { turma: 'Balé Nível 2 — Teste 1' })) === '["Aluna B"]',
      porta.alunasDaTurma(CURADORIAS, { turma: 'Balé Nível 2 — Teste 1' }));
    checar('SEM TURMA não há recorte — `null`, não «todas»',
      porta.alunasDaTurma(CURADORIAS, {}) === null);
    checar('turma sem curadoria é lista VAZIA, e não «todas» — a ausência de atribuição não é permissão',
      JSON.stringify(porta.alunasDaTurma(CURADORIAS, { turma: 'Turma que não existe' })) === '[]',
      porta.alunasDaTurma(CURADORIAS, { turma: 'Turma que não existe' }));
    checar('a curadoria de OUTRO professor não serve para recortar esta turma',
      JSON.stringify(porta.alunasDaTurma(CURADORIAS, { turma: 'Balé Nível 1 — Teste 1', professor: 'outro' })) === '[]');
    checar('o formato ANTIGO do registo (`turma`, um nome) continua a valer',
      JSON.stringify(porta.alunasDaTurma(
        [{ professor: 'p', turma: 'Balé Nível 1 — Teste 1', alunas: ['Aluna C'] }],
        { turma: 'Balé Nível 1 — Teste 1' })) === '["Aluna C"]');
    checar('a curadoria SUBSTITUÍDA não conta — o histórico não se reescreve, mas não se aplica',
      JSON.stringify(porta.alunasDaTurma(
        [{ professor: 'p', turmas: ['Balé Nível 1 — Teste 1'], alunas: ['Antiga'], substituidaPor: 'nova' }],
        { turma: 'Balé Nível 1 — Teste 1' })) === '[]');
    checar('duas curadorias na MESMA turma somam (a lista não perde ninguém atribuído)',
      JSON.stringify(porta.alunasDaTurma(
        [{ professor: 'p', turmas: ['X'], alunas: ['A'] }, { professor: 'p', turmas: ['X'], alunas: ['B'] }],
        { turma: 'X' }).sort()) === '["A","B"]');
  }

  // ------------------------------------------------------------------ B
  console.log('\nB. a lista de anamneses obedece ao recorte');
  {
    const { armazenamento } = mundo();
    const todas = await porta.anamneses(armazenamento);
    checar('sem recorte, a lista é a da escola inteira (o comportamento de antes)',
      todas.length === 3, todas.map((o) => o.valor));

    const soC = await porta.anamneses(armazenamento, { alunas: ['Aluna C'] });
    checar('com recorte, só a aluna daquela turma',
      JSON.stringify(soC.map((o) => o.valor)) === '["Aluna C"]', soC.map((o) => o.valor));
    checar('e o resumo dela continua completo (o recorte filtra, não mutila)',
      soC.length === 1 && soC[0].carimbo && soC[0].detalhe, soC[0]);

    const vazio = await porta.anamneses(armazenamento, { alunas: [] });
    checar('recorte VAZIO devolve vazio — e não a lista inteira', vazio.length === 0, vazio.map((o) => o.valor));
  }

  // ------------------------------------------------------------------ C
  console.log('\nC. a rota: o recorte chega por `turma` ou pelo `plano` escolhido');
  {
    const { rotas } = mundo();

    const semParametro = await pedir(rotas, '/api/anamneses');
    checar('sem parâmetro, a lista inteira (nada muda para quem não pede recorte)',
      JSON.stringify(valores(semParametro.dados)) === '["Aluna A","Aluna B","Aluna C"]',
      valores(semParametro.dados));

    const porTurma = await pedir(rotas, '/api/anamneses?turma=' + encodeURIComponent('Balé Nível 1 — Teste 1'));
    checar('?turma= recorta para a aluna daquela turma',
      JSON.stringify(valores(porTurma.dados)) === '["Aluna C"]', valores(porTurma.dados));
    checar('e a resposta DECLARA o recorte que aplicou (quem lê não adivinha)',
      porTurma.dados.turma === 'Balé Nível 1 — Teste 1'
        && JSON.stringify(porTurma.dados.recorte) === '["Aluna C"]', porTurma.dados);

    // O CAMINHO DA TELA: ela manda o carimbo do plano, e a turma vem do envelope.
    const porPlano = await pedir(rotas, '/api/anamneses?plano=plano-n1');
    checar('?plano= resolve a turma pelo envelope do plano, e recorta por ela',
      JSON.stringify(valores(porPlano.dados)) === '["Aluna C"]', valores(porPlano.dados));

    const outroPlano = await pedir(rotas, '/api/anamneses?plano=plano-n2&professor=sapo-bailarino');
    checar('e o OUTRO plano traz a outra aluna — o recorte não é «a primeira turma»',
      JSON.stringify(valores(outroPlano.dados)) === '["Aluna B"]', valores(outroPlano.dados));

    const planoInexistente = await pedir(rotas, '/api/anamneses?plano=plano-que-nao-existe');
    checar('plano inexistente não inventa turma: a lista volta inteira, como sem parâmetro',
      JSON.stringify(valores(planoInexistente.dados)) === '["Aluna A","Aluna B","Aluna C"]',
      valores(planoInexistente.dados));

    const semCuradoria = mundo([]);
    const turmaSemNinguem = await pedir(semCuradoria.rotas,
      '/api/anamneses?turma=' + encodeURIComponent('Balé Nível 1 — Teste 1'));
    checar('turma sem curadoria devolve lista VAZIA pela rota — não vaza ninguém',
      JSON.stringify(valores(turmaSemNinguem.dados)) === '[]', valores(turmaSemNinguem.dados));
  }

  // ------------------------------------------------------------------ D
  console.log('\nD. a declaração: sem ela o recorte não chega ao servidor');
  {
    const po = ler('po/conteudo/po.json');
    const achar = (no) => {
      if (Array.isArray(no)) { for (const x of no) { const r = achar(x); if (r) return r; } return null; }
      if (!no || typeof no !== 'object') return null;
      if (no.id === 'sujeitos') return no;
      for (const v of Object.values(no)) { const r = achar(v); if (r) return r; }
      return null;
    };
    const no = achar(po);
    checar('o nó `sujeitos` do conteúdo declara `recortePeloPlano`', Boolean(no && no.recortePeloPlano === true), no);
    checar('e continua a vir das anamneses (`opcoesDe`)', no && no.opcoesDe === 'api/anamneses', no && no.opcoesDe);
    checar('e o texto explica o recorte a quem preenche — a regra não é só do código',
      Boolean(no && /turma do plano/i.test(no.explicacao.preencher || ''))
        && Boolean(no && /curadoria/i.test(no.explicacao.porQue || '')),
      no && no.explicacao);

    const tela = fs.readFileSync(path.join(PORTA, 'index.html'), 'utf8');
    checar('a tela compõe o endereço com o plano escolhido (`enderecoDeOpcoes`)',
      /function enderecoDeOpcoes\(no\)/.test(tela) && /\?plano=/.test(tela));
    checar('e trocar o plano esquece a lista e os sujeitos marcados (`esquecerSujeitosDaTurma`)',
      /function esquecerSujeitosDaTurma\(\)/.test(tela)
        && /id === 'plano-de-ensino'\)\s*esquecerSujeitosDaTurma\(\)/.test(tela));
    checar('nenhum leitor de opções ficou a ler a lista SEM o recorte',
      (tela.match(/OPCOES\.get\(no\.opcoesDe\)/g) || []).length === 0,
      (tela.match(/OPCOES\.get\(no\.opcoesDe\)/g) || []).length);
  }

  // ------------------------------------------------------------------ E
  console.log('\nE. a PONTE de produção repassa a curadoria ao roteador');
  {
    // A PASSA ÀS COSTAS DA PROVA ANTERIOR (20/10/2026). As secções C e D chamam `criarRotas` de
    // fora, com a `lerCuradorias` já nas mãos — e por isso não viam que a ponte de produção a
    // deitava fora: `montarPorta` recebia o parâmetro e não o punha no objecto do roteador. No
    // Worker o sintoma era mudo e plausível («turma X» na resposta, lista vazia), e o site ficou
    // assim. Montar a porta verdadeira é o que mede a LIGAÇÃO, e não as pontas.
    const { montarPorta } = require('../motor/servidor/cloudflare.js');
    const { criarMemoria } = require('../motor/nucleo/armazenamento.js');
    const base = criarMemoria();
    await base.guardar('envelope/anamnese-aluna-a.json', anamnese('Aluna A'));
    await base.guardar('envelope/anamnese-aluna-c.json', anamnese('Aluna C'));
    const guardado = new Map();
    const armazenamento = {
      ler: (c) => base.ler(c),
      listar: (p) => {
        const vistos = guardado.get(p);
        return vistos ? Promise.resolve(vistos) : base.listar(p);
      },
      guardar: (c, t) => base.guardar(c, t),
      existe: (c) => base.existe(c),
      apagar: (c) => base.apagar(c),
    };
    // O `criarRotas` guarda o índice lido; a memória é a mesma, e a lista de chaves vem dela.
    guardado.clear();

    let chamada = 0;
    const responder = montarPorta({
      armazenamento,
      conteudoTexto: fs.readFileSync(path.join(PORTA, 'conteudo/anamnese.json'), 'utf8'),
      esquemaTexto: fs.readFileSync(path.join(PORTA, 'envelope/elicitacao-schema.json'), 'utf8'),
      poTexto: fs.readFileSync(path.join(PORTA, 'po/conteudo/po.json'), 'utf8'),
      planoTexto: fs.readFileSync(path.join(PORTA, 'plano/conteudo/plano.json'), 'utf8'),
      fichaHtml: (t) => String(t || ''),
      escolaDoWorker: ESCOLA,
      lerCuradorias: async () => { chamada += 1; return CURADORIAS; },
    });
    const resposta = await responder(new Request('http://local/api/anamneses?turma=' + encodeURIComponent('Balé Nível 1 — Teste 1')));
    const corpo = JSON.parse(await resposta.text());
    checar('a ponte chama a leitura de curadorias que recebeu', chamada === 1, chamada);
    checar('e o recorte chega ao cliente pela ponte de produção, e não só pelo roteador',
      JSON.stringify(valores(corpo)) === '["Aluna C"]', valores(corpo));
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((erro) => {
  console.error('\nERRO na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
