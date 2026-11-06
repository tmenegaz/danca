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

/*
 * A LINHA DE BASE DE PRODUÇÃO, como ela está no KV do `calango` a 05/11/2026 — e a curadoria que
 * NÃO existe ao lado dela.
 *
 * Este é o par que produziu o defeito do dia: `curadorias` VAZIO, e uma linha de base «teste»
 * enviada para «Balé Nível 1 — Teste 1» com a Aluna A e a Aluna B. Medido por API, não por ecrã:
 * `GET /api/bastidores/alunas-da-turma?turma=…` devolvia as duas, e
 * `GET /anamnese/api/anamneses?turma=…` devolvia `{"opcoes": [], "recorte": []}` — o nó `sujeitos`
 * do PO oferecia ZERO alunas a um professor que tinha o processo todo feito.
 */
const LINHAS_DA_PRODUCAO = [
  {
    id: 'teste',
    nome: 'teste',
    professor: 'sapo-bailarino',
    turma: 'Balé Nível 1 — Teste 1',
    enviada_em: '2026-11-05T23:55:43.186Z',
    alunas: ['Aluna A', 'Aluna B'],
    campos: [{ id: 'formato-anatomico-dos-joelhos' }],
  },
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

function mundo(turmaDoPlano, linhasDeBase) {
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
    /* O LEITOR DAS LINHAS DE BASE. Sem ele (`undefined`), as funções do núcleo caem na curadoria —
     * e é isso que faz os casos antigos desta prova continuarem a medir o que mediam. */
    ...(linhasDeBase === undefined ? {} : { lerLinhasDeBase: async () => linhasDeBase }),
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
    /* A REGRA MUDOU A 05/11/2026, E A ASSERÇÃO ACOMPANHA-A — invertida, não apagada (é a mesma
     * lei das outras provas deste repositório). O texto obrigava a dizer «curadoria» porque era ela
     * que declarava o elenco; desde o passo 5 quem o declara é a LINHA DE BASE. O que se continua a
     * medir é «o texto diz de onde vem a lista a quem preenche» — só que a resposta certa é outra. */
    checar('e o texto diz de onde vem a lista a quem preenche — a regra não é só do código',
      Boolean(no && /turma do plano/i.test(no.explicacao.preencher || ''))
        && Boolean(no && /linha de base/i.test(no.explicacao.preencher || ''))
        && Boolean(no && /linha de base/i.test(no.explicacao.porQue || '')),
      no && no.explicacao);

    const tela = fs.readFileSync(path.join(PORTA, 'index.html'), 'utf8');
    checar('a tela compõe o endereço com o plano escolhido (`enderecoDeOpcoes`)',
      /function enderecoDeOpcoes\(no\)/.test(tela) && /parametros\.set\('plano'/.test(tela));
    checar('e trocar o plano esquece a lista e os sujeitos marcados (`esquecerSujeitosDaTurma`)',
      /function esquecerSujeitosDaTurma\(\)/.test(tela)
        && /id === 'plano-de-ensino'\)\s*esquecerSujeitosDaTurma\(\)/.test(tela));
    checar('nenhum leitor de opções ficou a ler a lista SEM o recorte',
      (tela.match(/OPCOES\.get\(no\.opcoesDe\)/g) || []).length === 0,
      (tela.match(/OPCOES\.get\(no\.opcoesDe\)/g) || []).length);
  }

  // ------------------------------------------------------------------ E'
  console.log('\nE. o MAPA que a tela lê traz a marca que ela precisa');
  {
    /*
     * A CHAVE MORRIA NO MAPA (20/10/2026). O conteúdo do PO declarava `recortePeloPlano` no nó
     * `sujeitos`, a tela sabia compor `?plano=`, a rota sabia recortar — e o filtro continuava
     * a não funcionar, porque `descritores()` do `elicitar.js` é uma lista FECHADA: o que não
     * está nela nunca chega ao mapa que o `/api/mapa` serve. A marca ficava pelo caminho, e a
     * tela pedia a lista inteira.
     *
     * É o mesmo defeito de antes, uma camada acima: cada peça certa, e o dado a não atravessar.
     * Por isso a asserção não é «o nó tem a marca» — é «o que o CONTEÚDO declara chega ao MAPA»,
     * que é a pergunta que se deve fazer a cada chave nova.
     */
    const { nosRespondiveis } = require('../motor/nucleo/elicitar.js');
    /*
     * A PROVA MEDIA A CAMADA ERRADA (20/10/2026, corrigida no mesmo dia). Ela chamava
     * `nosRespondiveis` — o gerador do motor — e dava verde com o filtro a não funcionar no
     * site, porque entre o motor e o cliente há uma SEGUNDA construção do mapa: a `porta.mapa`,
     * que também era uma lista fechada. Duas listas em série, e a prova a medir a primeira.
     *
     * O que se mede agora é o mapa que o `/api/mapa` REALMENTE serve — `porta.mapa` —, e a
     * concordância entre as duas camadas: é a travessia que interessa, não a peça.
     */
    const doPO = nosRespondiveis(ler('po/conteudo/po.json'));
    const noMotor = doPO.find((no) => no.id === 'sujeitos');
    checar('o motor (`nosRespondiveis`) produz a marca no nó `sujeitos`',
      Boolean(noMotor && noMotor.recortePeloPlano === true), noMotor && noMotor.recortePeloPlano);

    const { mapa } = require('../motor/nucleo/porta.js');
    const servido = mapa(ler('po/conteudo/po.json'));
    const noMapa = servido.nos.find((no) => no.id === 'sujeitos');
    checar('e o mapa SERVIDO (`porta.mapa`, o do `/api/mapa`) também a traz — é ele que a tela lê',
      Boolean(noMapa && noMapa.recortePeloPlano === true), noMapa && noMapa.recortePeloPlano);

    /*
     * A GUARDA GENÉRICA: nenhuma chave de COMPORTAMENTO declarada no conteúdo se pode perder no
     * mapa. São as que mudam o que a tela desenha ou pede — não as de texto (o rótulo, a
     * explicação, que viajam noutro caminho). Uma chave nova nesta lista e esquecida no
     * `descritores()` é uma chave morta, e o sintoma é sempre mudo: a tela comporta-se como se
     * ela não existisse.
     */
    const COMPORTAMENTO = [
      'opcoesDe', 'criarEm', 'derivarDe', 'repetirPor', 'camposDoItem', 'multipla', 'colunas',
      'exclusiva', 'aberto', 'tabela', 'lista', 'escala', 'daTurma', 'doPlano', 'daCuradoria',
      'porMarco', 'registro', 'valores', 'abertoRotulo', 'forma', 'ramifica', 'socratico',
      'derivado', 'derivadoDe', 'recortePeloPlano', 'recortePeloProfessor',
    ];
    const perdidas = [];
    for (const fonte of ['po/conteudo/po.json', 'plano/conteudo/plano.json', 'conteudo/anamnese.json']) {
      // A CAMADA FINAL, e não a do meio: é o que o cliente recebe.
      const mapaDesta = mapa(ler(fonte)).nos;
      const porId = new Map(mapaDesta.map((no) => [no.id, no]));
      const colher = (obj, saida) => {
        if (Array.isArray(obj)) { obj.forEach((x) => colher(x, saida)); return saida; }
        if (!obj || typeof obj !== 'object') return saida;
        if (obj.id) saida.push(obj);
        for (const v of Object.values(obj)) colher(v, saida);
        return saida;
      };
      for (const campo of colher(ler(fonte), [])) {
        const no = porId.get(campo.id);
        if (!no) continue;   // o campo não é respondível neste formulário
        for (const chave of COMPORTAMENTO) {
          if (!(chave in campo)) continue;
          const declarado = campo[chave];
          if (declarado === null || declarado === false) continue;
          // `false` e `null` são valores legítimos do motor; o que não pode é a chave sumir.
          if (!(chave in no)) {
            perdidas.push(fonte + ':' + campo.id + '.' + chave);
          }
        }
      }
    }
    checar('nenhuma chave de comportamento declarada no conteúdo se perde no mapa',
      perdidas.length === 0, perdidas);
  }

  // ------------------------------------------------------------------ F
  console.log('\nF. a PONTE de produção repassa a curadoria ao roteador');
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

  /* ------------------------------------------------------------------ G
   * A LINHA DE BASE PASSOU A SER A FONTE DO ELENCO (05/11/2026).
   *
   * O passo 5 da linha de base é o acto que declara «estas alunas foram para esta turma neste
   * dia», e a curadoria ficou com a atribuição (que professor, que turma). O recorte por turma
   * continuou a perguntar à curadoria, e por isso, em produção, o PO de uma turma com linha de
   * base enviada oferecia ZERO alunas.
   */
  console.log('\nG. a linha de base é a fonte do elenco — e a curadoria é o recurso declarado');
  {
    /* O CASO DE PRODUÇÃO: curadorias VAZIAS e uma linha de base enviada. É o estado real do
     * `calango` a 05/11/2026, e é ele que a secção mede. */
    checar('com a curadoria VAZIA, o elenco vem da linha de base enviada',
      JSON.stringify(porta.alunasDaTurma([], { turma: 'Balé Nível 1 — Teste 1' }, LINHAS_DA_PRODUCAO)) === '["Aluna A","Aluna B"]',
      porta.alunasDaTurma([], { turma: 'Balé Nível 1 — Teste 1' }, LINHAS_DA_PRODUCAO));

    checar('a linha de base VENCE a curadoria quando as duas falam da mesma turma',
      JSON.stringify(porta.alunasDaTurma(CURADORIAS, { turma: 'Balé Nível 1 — Teste 1' }, LINHAS_DA_PRODUCAO)) === '["Aluna A","Aluna B"]',
      porta.alunasDaTurma(CURADORIAS, { turma: 'Balé Nível 1 — Teste 1' }, LINHAS_DA_PRODUCAO));

    /* O CONTROLE POSITIVO DO RECURSO: uma turma que NUNCA recebeu linha de base continua a ler a
     * curadoria. Sem este ramo, a correcção acima apagaria o único caminho de quem ainda não usou
     * o fluxo novo — e a lista ficaria vazia sem uma palavra a explicar porquê. */
    checar('turma sem linha de base nenhuma cai na curadoria — o recurso declarado',
      JSON.stringify(porta.alunasDaTurma(CURADORIAS, { turma: 'Balé Nível 1 — Teste 1' }, [])) === '["Aluna C"]',
      porta.alunasDaTurma(CURADORIAS, { turma: 'Balé Nível 1 — Teste 1' }, []));

    checar('CONTROLE NEGATIVO: a linha de base de OUTRA turma não empresta o elenco',
      JSON.stringify(porta.alunasDaTurma(CURADORIAS, { turma: 'Balé Nível 2 — Teste 1' }, LINHAS_DA_PRODUCAO)) === '["Aluna B"]',
      porta.alunasDaTurma(CURADORIAS, { turma: 'Balé Nível 2 — Teste 1' }, LINHAS_DA_PRODUCAO));

    checar('sem turma continua a não haver recorte (`null`), com ou sem linhas de base',
      porta.alunasDaTurma(CURADORIAS, {}, LINHAS_DA_PRODUCAO) === null);

    /* SEM TURMA ESCOLHIDA — o nó `sujeitos` aberto antes do `plano-de-ensino`. A regra dela é
     * explícita: só se seleciona quem já tem linha de base. */
    checar('sem turma, a lista do professor são as alunas com linha de base DELE',
      JSON.stringify(porta.alunasDoProfessor(CURADORIAS, 'sapo-bailarino', LINHAS_DA_PRODUCAO)) === '["Aluna A","Aluna B"]',
      porta.alunasDoProfessor(CURADORIAS, 'sapo-bailarino', LINHAS_DA_PRODUCAO));
    checar('…e a linha de base de OUTRO professor não entra',
      porta.alunasDoProfessor([], 'outro-professor', LINHAS_DA_PRODUCAO).length === 0,
      porta.alunasDoProfessor([], 'outro-professor', LINHAS_DA_PRODUCAO));
    checar('CONTROLE: sem linhas de base legíveis, a curadoria volta a responder',
      JSON.stringify(porta.alunasDoProfessor(CURADORIAS, 'sapo-bailarino', []).sort()) === '["Aluna A","Aluna B","Aluna C"]',
      porta.alunasDoProfessor(CURADORIAS, 'sapo-bailarino', []));

    /* E A ROTA, que é onde o defeito se via. O `lerLinhasDeBase` é o mesmo que a Produção usa. */
    const { rotas } = mundo([], LINHAS_DA_PRODUCAO);
    const porTurma = await pedir(rotas, '/api/anamneses?turma=' + encodeURIComponent('Balé Nível 1 — Teste 1'));
    checar('a ROTA recorta pela linha de base, e a lista deixa de vir vazia',
      JSON.stringify(valores(porTurma.dados)) === '["Aluna A","Aluna B"]', valores(porTurma.dados));
    checar('…e declara o recorte que aplicou',
      JSON.stringify(porTurma.dados.recorte) === '["Aluna A","Aluna B"]', porTurma.dados.recorte);

    const peloPlano = await pedir(rotas, '/api/anamneses?plano=plano-n1');
    checar('o caminho da TELA (`?plano=`) chega ao mesmo elenco, pela turma do plano',
      JSON.stringify(valores(peloPlano.dados)) === '["Aluna A","Aluna B"]', valores(peloPlano.dados));
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
