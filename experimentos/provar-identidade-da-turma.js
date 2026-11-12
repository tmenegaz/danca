#!/usr/bin/env node
'use strict';

/*
 * provar-identidade-da-turma.js — UMA TURMA CHAMA-SE PELO ELENCO (11/11/2026).
 *
 * O QUE MOTIVOU, na letra dela:
 *
 *   «a turma na listagem e a construção do index da turma e também da turma em si […] está sendo
 *    montada com o nome do professor. Eu acho que a turma ela deveria ter um nome. […] no mundo
 *    real é mais comum a gente dizer que a turma ela é do elenco do que a gente dizer que a turma
 *    ela é do professor. Porque o professor ele pode mudar e a turma ela é mais presente, ela se
 *    preserva por mais tempo. […] é o elenco que é a turma, que é o conjunto de meninas que dá a
 *    razão de ser para o termo turma e não o professor.»
 *
 * E o caso que mostra o defeito, dito por ela: «se falar assim, é a turma de ballet do professor
 * Pedro, tá, mas qual delas? É a iniciante, a intermediária, a avançada?» — o nome de quem ensina
 * não distingue nada justamente quando há mais do que uma.
 *
 * O QUE ELA VIU JUNTO, e que é o mesmo pedido:
 *
 *   «quando eu estou no modo edição da turma […] as etiquetas estão aparecendo aqui vinculada e
 *    ajustada em, estão sem a borda inferior» e «o texto abaixo […] está engolindo a margem
 *    inferior das etiquetas».
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. O NOME, no núcleo. O elenco escolhido manda; sem ele, o nome que existe é o da SALA; sem
 *      nenhum dos dois, a modalidade. O professor NÃO é o nome, e o rótulo composto diz elenco,
 *      modalidade, nível e professor — sem repetir o que já disse.
 *   B. A GUARDA DO ELENCO REPETIDO: o mesmo corpo não ocupa duas vezes a mesma modalidade e o
 *      mesmo nível — e a recusa diz qual é a outra Turma, a sala dela e quem a ensina. Não colide
 *      noutra modalidade, noutro nível, contra um elo substituído nem contra si mesma.
 *   C. A LISTAGEM, no navegador, sobre a página de verdade: o `<b>` da linha é o ELENCO, e o
 *      professor desce para o complemento — onde continua a ser o atalho para o plano de ensino
 *      dele quando esse plano existe.
 *   D. AS ETIQUETAS: com dois selos, um não tapa o outro; e o complemento não encosta na etiqueta.
 *      É a geometria que ela viu quebrada — e a causa era a `linha1` dissolvida em
 *      `display:contents` com os dois selos na MESMA faixa da grelha.
 *   E. A ROTA: a guarda é do servidor, e não só do formulário. Criar e derivar são os dois
 *      caminhos por onde a repetição entraria, e os dois recusam.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): corre as MESMAS provas contra o `motor/` de
 * `REF_NEGATIVO` (por omissão `HEAD`). O código de antes chama a linha pelo nome do professor,
 * não tem a guarda do elenco, e sobrepõe as duas etiquetas a 560px — se passasse, a prova não
 * provava nada.
 *
 * SEM REDE: o KV é de memória e o repositório não é consultado (o `GITHUB_TOKEN` vai vazio).
 *
 *   node experimentos/provar-identidade-da-turma.js
 *   REF_NEGATIVO=HEAD node experimentos/provar-identidade-da-turma.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const negativo = process.argv.indexOf('--controle-negativo') !== -1;

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

let motor = path.join(RAIZ, 'motor');
let raizDoMotor = RAIZ;
if (negativo) {
  const ref = process.env.REF_NEGATIVO || 'HEAD';
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'turma-identidade-negativo-'));
  execSync('git archive ' + ref + ' motor modelo porta biblioteca tools teste | tar -x -C '
    + JSON.stringify(destino), { cwd: RAIZ, stdio: 'pipe' });
  fs.symlinkSync(path.join(RAIZ, 'node_modules'), path.join(destino, 'node_modules'), 'dir');
  motor = path.join(destino, 'motor');
  raizDoMotor = destino;
  console.log('CONTROLE NEGATIVO contra ' + ref + '\n');
}

/* ==========================================================================================
 * A. O NOME, NO NÚCLEO
 * ======================================================================================== */

const nucleo = require(path.join(motor, 'nucleo/estado-da-turma.js'));

const ELENCOS = [
  { id: 'tami', nome: 'tami', alunas: ['Aluna A', 'Aluna B'] },
  { id: 'ami', nome: 'ami', alunas: ['Aluna C'] },
];

function provarONome() {
  console.log('A. O NOME DA TURMA É O ELENCO');
  if (typeof nucleo.nomeDaTurma !== 'function') {
    provar('o núcleo sabe o nome de uma Turma', false, Object.keys(nucleo));
    provar('…e sabe o rótulo composto', false);
    provar('…e sabe a guarda do elenco repetido', false);
    return;
  }
  const comElenco = { linhaDeBase: 'tami', linhaDeBaseNome: 'tami', turmas: ['Rosa'],
    modalidade: 'Balé clássico' };
  provar('o nome é o ELENCO, e não o professor nem a sala',
    nucleo.nomeDaTurma(comElenco, { elencos: ELENCOS }) === 'tami',
    nucleo.nomeDaTurma(comElenco, { elencos: ELENCOS }));

  // O elenco que já não está na lista não fica sem nome: o registo guarda `linhaDeBaseNome`.
  provar('o elenco apagado da lista continua a dar nome (o registo guarda o nome)',
    nucleo.nomeDaTurma({ linhaDeBase: 'sumiu', linhaDeBaseNome: 'sumiu', turmas: ['Rosa'] },
      { elencos: ELENCOS }) === 'sumiu');

  // Sem elenco, o nome que existe é o da SALA — é o nome que a Turma então tem.
  provar('sem elenco, a Turma chama-se pela SALA',
    nucleo.nomeDaTurma({ turmas: ['Rosa'], modalidade: 'Balé clássico' }, { elencos: ELENCOS })
      === 'Rosa');
  provar('sem elenco e sem sala, chama-se pela modalidade',
    nucleo.nomeDaTurma({ turmas: [], modalidade: 'Balé clássico' }) === 'Balé clássico');
  provar('uma Turma vazia não inventa nome', nucleo.nomeDaTurma(null) === '');

  // O COMPOSTO — o que ela pediu: elenco, modalidade, nível e professor.
  const composto = nucleo.rotuloDaTurma(comElenco, {
    elencos: ELENCOS, professor: 'Pe Torto', modalidade: 'Balé clássico', nivel: 'Grade 1',
  });
  provar('o rótulo composto diz elenco, modalidade, nível e professor',
    composto === 'tami · Balé clássico · Grade 1 · Pe Torto', composto);
  provar('…e não repete o que já disse',
    nucleo.rotuloDaTurma({ linhaDeBaseNome: 'tami', modalidade: 'tami' },
      { professor: 'Pe Torto' }) === 'tami · Pe Torto');
}

function provarAGuarda() {
  console.log('\nB. O MESMO ELENCO NÃO OCUPA DUAS VEZES O MESMO NÍVEL');
  if (typeof nucleo.mesmaTurmaPorElenco !== 'function') {
    provar('o núcleo sabe reconhecer o elenco repetido', false, Object.keys(nucleo));
    return;
  }
  const uma = (extra) => Object.assign({
    id: 'a', professor: 'pe-torto', modalidade: 'Balé clássico', tradicao: 'RAD',
    grau: '', nivel: '1', nivelReferencia: 'Grade 1', turmas: ['Rosa'], linhaDeBase: 'tami',
    linhaDeBaseNome: 'tami', alunas: [],
  }, extra || {});
  const lista = [uma(), uma({ id: 'b', modalidade: 'Jazz', turmas: ['Piano'] })];

  provar('o mesmo elenco na mesma modalidade e no mesmo nível é reconhecido',
    (nucleo.mesmaTurmaPorElenco(lista, { elenco: 'tami', modalidade: 'Balé clássico',
      nivel: 'Grade 1' }) || {}).id === 'a');
  provar('noutra modalidade, não colide',
    nucleo.mesmaTurmaPorElenco(lista, { elenco: 'tami', modalidade: 'Dança moderna',
      nivel: 'Grade 1' }) === null);
  provar('noutro nível, não colide',
    nucleo.mesmaTurmaPorElenco(lista, { elenco: 'tami', modalidade: 'Balé clássico',
      nivel: 'Grade 2' }) === null);
  provar('quem está a ser gravado não colide consigo mesmo',
    nucleo.mesmaTurmaPorElenco(lista, { elenco: 'tami', modalidade: 'Balé clássico',
      nivel: 'Grade 1', excetoId: 'a' }) === null);
  provar('um elo já substituído não ocupa lugar',
    nucleo.mesmaTurmaPorElenco([uma({ substituidaPor: 'z' })], { elenco: 'tami',
      modalidade: 'Balé clássico', nivel: 'Grade 1' }) === null);
  provar('sem elenco não há o que comparar',
    nucleo.mesmaTurmaPorElenco(lista, { elenco: '', modalidade: 'Balé clássico' }) === null);
  provar('uma leitura falhada não inventa colisão',
    nucleo.mesmaTurmaPorElenco(null, { elenco: 'tami', modalidade: 'Balé clássico' }) === null);

  const frase = nucleo.motivoDoElencoRepetido(uma(), {
    nomeDoElenco: 'tami', elenco: 'tami', modalidade: 'Balé clássico', nivel: 'Grade 1',
  });
  provar('a recusa nomeia o elenco', /«tami»/.test(frase), frase);
  provar('…e diz qual é a outra Turma e a sala dela', /Rosa/.test(frase), frase);
  provar('…e quem a ensina', /pe-torto/.test(frase), frase);
  provar('…e diz o que fazer', /Ajuste a que já existe/.test(frase), frase);
}

/* ==========================================================================================
 * B2. AS ROTAS — a guarda é do servidor
 * ======================================================================================== */

function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, v); return { ok: true }; },
    async delete(k) { dados.delete(k); },
    async list() { return { keys: [...dados.keys()].map((name) => ({ name })), list_complete: true }; },
  };
}

const ESCOLA = 'prova';
const SALA = 'Rosa';
const OUTRA_SALA = 'Piano';

const salaDaEscola = (nome, id) => ({
  id, nome, ordem: 0, frequencia: 3, dias: ['ter', 'qui', 'sáb'],
  horarios: { ter: '19:00', qui: '19:00', 'sáb': '19:00' },
  duracaoMin: 60, periodoInicio: '2026-11-20', periodoFim: '2026-12-20', ativo: true,
});

function bastidoresDe(semente) {
  const b = require(path.join(motor, 'servidor/bastidores.js'));
  const kv = kvDeMentira(semente);
  const env = {
    ESCOLA_SLUG: ESCOLA, PADD_KV: kv, FUSO: 'America/Sao_Paulo',
    SENHA_ADMIN: 'prova', GITHUB_TOKEN: '',
  };
  const pedir = async (caminho, corpo) => {
    const resposta = await b.fetch(new Request(
      'https://' + ESCOLA + '.tmenegaz77.workers.dev' + caminho,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) }),
    env);
    const texto = await resposta.text();
    let json = null;
    try { json = JSON.parse(texto); } catch (erro) { json = null; }
    return { status: resposta.status, json };
  };
  const ler = async (chave) => JSON.parse((await kv.get('bastidores/' + ESCOLA + '/' + chave)) || '[]');
  return { pedir, ler };
}

/* A TURMA DA ROSA, DO ELENCO `tami` — e o elenco nasce SEM ALUNAS de propósito.
 *
 * Um elenco com gente já é apanhado pela regra da ALUNA («estas alunas já estão noutra sala de
 * «Balé clássico»»), que é mais antiga e mais forte. A guarda do elenco existe para o que essa
 * regra não vê: o elenco recém-criado, ainda sem ninguém dentro — que ocuparia duas vezes a mesma
 * modalidade e o mesmo nível em silêncio. Provar com um elenco povoado mediria a regra antiga e
 * daria por provada a nova. */
const turmaDaRosa = () => ({
  id: 'pe-torto-bale-classico-rosa-2026-11-10', professor: 'pe-torto',
  modalidade: 'Balé clássico', tradicao: 'RAD', grau: '', nivel: '1',
  nivelReferencia: 'Grade 1', turmas: [SALA], linhaDeBase: 'tami', linhaDeBaseNome: 'tami',
  repertorio: [], alunas: [], vigenteDe: '2026-11-10',
});

function semente(extra) {
  const linhas = [
    { id: 'tami', nome: 'tami', professor: 'pe-torto', alunas: [], campos: [] },
    { id: 'ami', nome: 'ami', professor: 'pe-torto', alunas: [], campos: [] },
    { id: 'comgente', nome: 'comgente', professor: 'pe-torto', alunas: ['Aluna A'], campos: [] },
  ];
  return Object.assign({
    ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([turmaDaRosa()]),
    ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([
      salaDaEscola(SALA, 'rosa'), salaDaEscola(OUTRA_SALA, 'piano')]),
    ['bastidores/' + ESCOLA + '/linhas-de-base']: JSON.stringify(linhas),
    ['bastidores/' + ESCOLA + '/professores']: JSON.stringify([
      { nome: 'Pe Torto', slug: 'pe-torto' }]),
  }, extra || {});
}

async function provarAsRotas() {
  console.log('\nB2. A GUARDA É DO SERVIDOR — criar e derivar recusam o elenco repetido');

  // CRIAR: o mesmo elenco, a mesma modalidade, o mesmo nível, noutra sala.
  {
    const { pedir, ler } = bastidoresDe(semente());
    const r = await pedir('/api/bastidores/curadoria', {
      senhaDirecao: 'prova', professor: 'pe-torto', modalidade: 'Balé clássico',
      tradicao: 'RAD', grau: '', nivel: '1', turmas: [OUTRA_SALA], linhaDeBase: 'tami',
    });
    provar('criar uma segunda Turma com o mesmo elenco e o mesmo nível é recusado',
      r.status === 409, r);
    const erro = String((r.json || {}).erro || '');
    provar('…e a recusa diz qual é o elenco', /«tami»/.test(erro), erro);
    provar('…e aponta a outra Turma', (r.json || {}).repetidoEm === turmaDaRosa().id,
      (r.json || {}).repetidoEm);
    const lista = await ler('curadorias');
    provar('…e NADA foi escrito', lista.length === 1, lista.length);
  }

  // CRIAR noutro nível: é outra Turma, e é aceite.
  {
    const { pedir } = bastidoresDe(semente());
    const r = await pedir('/api/bastidores/curadoria', {
      senhaDirecao: 'prova', professor: 'pe-torto', modalidade: 'Balé clássico',
      tradicao: 'RAD', grau: '', nivel: '2', turmas: [OUTRA_SALA], linhaDeBase: 'tami',
    });
    provar('o mesmo elenco NOUTRO nível é aceite', r.status === 201, r.status);
  }

  // CRIAR com outro elenco: aceite.
  {
    const { pedir } = bastidoresDe(semente());
    const r = await pedir('/api/bastidores/curadoria', {
      senhaDirecao: 'prova', professor: 'pe-torto', modalidade: 'Balé clássico',
      tradicao: 'RAD', grau: '', nivel: '1', turmas: [OUTRA_SALA], linhaDeBase: 'ami',
    });
    provar('outro elenco no mesmo nível é aceite', r.status === 201, r.status);
  }

  // DERIVAR: trocar de sala mantendo o elenco, mas para uma combinação que já é de outra Turma.
  {
    // A Rosa é do elenco `tami`; a Piano já é do elenco `ami`, no mesmo nível.
    const sementeDupla = semente({
      ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([
        turmaDaRosa(),
        Object.assign(turmaDaRosa(), {
          id: 'outro-bale-classico-piano-2026-11-10', professor: 'outro',
          turmas: [OUTRA_SALA], linhaDeBase: 'ami', linhaDeBaseNome: 'ami', alunas: [],
        }),
      ]),
    });
    const { pedir } = bastidoresDe(sementeDupla);
    const r = await pedir('/api/bastidores/curadoria-derivar', {
      senhaDirecao: 'prova', derivarDe: turmaDaRosa().id, vigencia: '2026-11-11',
      linhaDeBase: 'ami',
    });
    provar('derivar para um elenco que já ocupa a mesma modalidade e o mesmo nível é recusado',
      r.status === 409, r);
    provar('…e a recusa é a do elenco, não outra',
      /já é a Turma/.test(String((r.json || {}).erro || '')), (r.json || {}).erro);
  }

  // A REGRA DA ALUNA CONTINUA A MANDAR PRIMEIRO, e não é substituída por esta.
  {
    const comAluna = semente({
      ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([
        Object.assign(turmaDaRosa(), { alunas: ['Aluna A'] }),
      ]),
    });
    const { pedir } = bastidoresDe(comAluna);
    const r = await pedir('/api/bastidores/curadoria', {
      senhaDirecao: 'prova', professor: 'pe-torto', modalidade: 'Balé clássico',
      tradicao: 'RAD', grau: '', nivel: '1', turmas: [OUTRA_SALA], linhaDeBase: 'comgente',
    });
    provar('um elenco COM alunas é recusado pela regra da aluna, que é a mais antiga',
      r.status === 409 && /alunas já estão noutra sala/.test(String((r.json || {}).erro || '')),
      (r.json || {}).erro);
  }

  // DERIVAR sem tocar no elenco: aceite (o elo de origem não ocupa contra si mesmo).
  {
    const { pedir } = bastidoresDe(semente());
    const r = await pedir('/api/bastidores/curadoria-derivar', {
      senhaDirecao: 'prova', derivarDe: turmaDaRosa().id, vigencia: '2026-11-11',
      professor: 'redinha-rosa',
    });
    provar('derivar SEM tocar no elenco continua aceite (trocar o professor)',
      r.status === 201, r);
  }
}

/* ==========================================================================================
 * C e D. A LISTAGEM E AS ETIQUETAS, no navegador
 * ======================================================================================== */

function paginaDaProducao(b, curadorias, pares) {
  return b.paginaProducao('calango',
    { professor: 'pe-torto', escola: 'calango', query: 'professor=pe-torto&escola=calango' },
    [{ nome: 'Redinha Rosa', slug: 'redinha-rosa' }], [], 'Pe Torto', 'pe-torto',
    [salaDaEscola(SALA, 'rosa'), salaDaEscola(OUTRA_SALA, 'piano')], [], [],
    curadorias, [], pares || [], undefined, undefined, undefined,
    [{ id: 'tami', nome: 'tami', professor: 'pe-torto', alunas: ['Aluna A', 'Aluna B'],
      campos: [{ id: 'passe', nome: 'o passé', grupo: 'X' }] },
      { id: 'ami', nome: 'ami', professor: 'pe-torto', alunas: ['Aluna C'],
        campos: [{ id: 'plie', nome: 'o plié', grupo: 'X' }] }], []);
}

const CURADORIAS_DA_PROVA = [
  turmaDaRosa(),
  {
    id: 'redinha-rosa-jazz-piano-2026-11-10', professor: 'redinha-rosa', modalidade: 'Jazz',
    tradicao: 'RAD', grau: '', nivel: '2', nivelReferencia: 'Grade 2', turmas: [OUTRA_SALA],
    linhaDeBase: 'ami', linhaDeBaseNome: 'ami', repertorio: [], alunas: ['Aluna C'],
    vigenteDe: '2026-11-10',
  },
];

async function provarANavegador() {
  console.log('\nC. A LISTAGEM: O `<b>` É O ELENCO, E O PROFESSOR DESCE PARA O COMPLEMENTO');

  let executavel = null;
  for (const c of ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (fs.existsSync(c)) { executavel = c; break; }
  }
  if (!executavel) { console.log('  (sem Chrome — NÃO FEITO)'); return false; }

  const b = require(path.join(motor, 'servidor/bastidores.js'));
  const html = paginaDaProducao(b, CURADORIAS_DA_PROVA,
    [{ professor: 'pe-torto', turma: SALA, ciclo: '01' }]);

  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      return ok('text/css', fs.readFileSync(path.join(raizDoMotor, 'tools/templates/ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok('application/javascript', fs.readFileSync(path.join(raizDoMotor, 'tools/templates/nav.js')));
    }
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });

  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  const puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const nav = await puppeteer.launch({
    executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const p = await nav.newPage();
  p.on('dialog', (d) => d.dismiss().catch(() => {}));

  await p.setViewport({ width: 1280, height: 900 });
  await p.goto(base + '/bastidores/producao', { waitUntil: 'networkidle0', timeout: 60000 });
  // O portão da direção esconde o conteúdo; o que se mede é a página por dentro dele.
  await p.evaluate(() => {
    location.hash = '#curadorias';
    const c = document.getElementById('conteudo');
    if (c) c.hidden = false;
    const s = document.getElementById('sec-curadorias');
    if (s) s.hidden = false;
    const m = document.getElementById('curadorias-miolo');
    if (m) m.hidden = false;
  });
  await new Promise((r) => setTimeout(r, 250));

  const linhas = await p.evaluate(() => [...document.querySelectorAll('#cu-lista li[data-curadoria]')]
    .map((li) => ({
      b: (li.querySelector('.linha-turma > .nome > b') || {}).textContent || '',
      dono: (li.querySelector('.dono') || {}).textContent || '',
      donoHtml: (li.querySelector('.dono') || {}).innerHTML || '',
      titulo: li.getAttribute('title') || '',
      // OS TRÊS BLOCOS (12/11/2026): o valor de cada um, pela ordem em que se leem.
      blocos: [...li.querySelectorAll('.trio-item .trio-v')].map((x) => x.textContent),
    })));
  provar('a lista tem as duas Turmas', linhas.length === 2, linhas.length);
  const daRosa = linhas.find((l) => l.b === 'tami') || {};
  provar('o `<b>` da linha é o ELENCO', daRosa.b === 'tami', daRosa);
  provar('…e o professor desceu para o complemento', /Pe Torto/.test(daRosa.dono || ''), daRosa.dono);
  /* A SALA SAIU DO COMPLEMENTO A 12/11/2026 — ela passou a ter BLOCO PRÓPRIO no cartão (Sala,
   * Elenco, Conteúdo). A asserção não foi apagada: passou a exigir as duas metades, uma em cada
   * sítio — o complemento diz em que linha se ensina, e um dos blocos diz em que sala. Uma prova
   * que só se apaga no dia em que o código muda deixa de guardar o que guardava. */
  provar('…e o complemento diz a modalidade, a tradição e o nível — sem a sala, que ganhou bloco',
    /Balé clássico/.test(daRosa.dono || '') && /RAD/.test(daRosa.dono || '')
      && /Grade 1/.test(daRosa.dono || '') && !/Rosa/.test(daRosa.dono || ''), daRosa.dono);
  provar('…e a sala está no bloco dela, com o nome que a Turma declara',
    (daRosa.blocos || []).indexOf('Rosa') !== -1, daRosa.blocos);
  provar('…e o professor é um link para o plano de ensino dele',
    /class="nome-link"/.test(daRosa.donoHtml || '') && /\/plano-ensino\//.test(daRosa.donoHtml || ''),
    daRosa.donoHtml);
  provar('…e a Turma sem professor com plano não promete uma página que não existe',
    !/nome-link/.test((linhas.find((l) => l.b === 'ami') || {}).donoHtml || ''),
    (linhas.find((l) => l.b === 'ami') || {}).donoHtml);
  provar('…e a linha inteira tem o rótulo composto no `title`',
    /tami · Balé clássico · Grade 1 · Pe Torto/.test(daRosa.titulo || ''), daRosa.titulo);


  console.log('\nD. AS ETIQUETAS: UMA NÃO TAPA A OUTRA, E O COMPLEMENTO NÃO ENCOSTA');

  /** A geometria de uma linha: os selos entre si e o vão até o complemento. */
  const medir = () => p.evaluate(() => {
    const li = document.querySelector('#cu-lista li[data-curadoria]');
    if (!li) return null;
    const r = (el) => {
      if (!el) return null;
      const x = el.getBoundingClientRect();
      return { t: x.top, b: x.bottom, l: x.left, r: x.right, h: x.height };
    };
    const linha1 = li.querySelector('.linha-turma');
    const dono = li.querySelector('.dono');
    const selos = [...li.querySelectorAll('.linha-turma > .nome > .selo')].map((s) => ({
      texto: s.textContent.trim(), ...r(s),
    }));
    return {
      li: r(li),
      linha1: r(linha1),
      dono: dono ? r(dono) : null,
      selos,
      alturaDoTexto: parseFloat(getComputedStyle(li).fontSize),
      largura: li.clientWidth,
      transborda: li.scrollWidth > li.clientWidth + 1,
    };
  });

  const cruzam = (a, b) => a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5;

  for (const largura of [1280, 900, 560, 390]) {
    await p.setViewport({ width: largura, height: 900 });
    await new Promise((r) => setTimeout(r, 220));
    const g = await medir();
    if (!g) { provar('a ' + largura + 'px: a linha existe', false); continue; }
    /* AS ETIQUETAS DO ESTADO SÃO DUAS — e a terceira, o «!» da revisão pendente (12/11/2026), não é
     * uma delas: é o aviso de que o passo 3 e o recorte têm de ser refeitos depois de uma troca de
     * aluna. O que a asserção tem de garantir é o que ela sempre garantiu — que o estado está dito
     * na linha e que nada se sobrepõe (a verificação abaixo, par a par, é a que mede o defeito de
     * 11/11). Fixar o número em dois proibiria o aviso; fixá-lo em três proibiria a Turma sem
     * revisão. Por isso o que se exige são as duas do estado, e o resto é livre. */
    provar('a ' + largura + 'px: a Turma diz o estado em duas etiquetas (livre/vinculada + ajustada em)',
      g.selos.length >= 2
        && g.selos.some((s) => /^(livre|vinculada)$/.test(s.texto))
        && g.selos.some((s) => /^ajustada em/.test(s.texto)),
      g.selos.map((s) => s.texto));
    if (!g.linha1) {
      provar('a ' + largura + 'px: a linha do nome existe (`.linha-turma`)', false, g);
      continue;
    }
    // QUALQUER PAR — e não só o primeiro: com três etiquetas (o «rever» incluído) o defeito
    // aparecia na segunda, não na primeira.
    const sobrepostos = [];
    for (let i = 0; i < g.selos.length; i += 1) {
      for (let j = i + 1; j < g.selos.length; j += 1) {
        if (cruzam(g.selos[i], g.selos[j])) sobrepostos.push([g.selos[i].texto, g.selos[j].texto]);
      }
    }
    provar('a ' + largura + 'px: nenhuma etiqueta se sobrepõe a outra', sobrepostos.length === 0,
      sobrepostos);
    if (g.dono) {
      const fundoDaEtiqueta = Math.max(...g.selos.map((s) => s.b));
      provar('a ' + largura + 'px: o complemento não encosta na etiqueta (vão ≥ 1px)',
        g.dono.t - fundoDaEtiqueta >= 1, { fundoDaEtiqueta, topoDoDono: g.dono.t });
    }
    provar('a ' + largura + 'px: a linha não transborda', !g.transborda,
      { scrollWidth: g.largura });
  }

  // O «REVER» DO ELENCO DIVERGENTE É UMA ETIQUETA DO NOME — e não uma linha acima dele.
  // Fica por último porque injeta um terceiro selo na linha, e as medidas acima são as do estado
  // que a página serve.
  await p.setViewport({ width: 1280, height: 900 });
  await new Promise((r) => setTimeout(r, 220));
  const rever = await p.evaluate(() => {
    const li = document.querySelector('#cu-lista li[data-curadoria]');
    const id = li.getAttribute('data-curadoria');
    marcarCuradoriasDivergentes([{ curadoria: id, turma: 'Rosa' }]);
    const selo = li.querySelector('.selo-rever');
    if (!selo) return { achou: false };
    const alvoDoNome = li.querySelector('.linha-turma > .nome > b');
    if (!alvoDoNome) return { achou: true, semNome: true };
    const nome = alvoDoNome.getBoundingClientRect();
    const caixa = selo.getBoundingClientRect();
    // Uma etiqueta que abre linha própria põe-se ACIMA do nome; a que é do nome fica ao lado.
    return {
      achou: true,
      dentroDaLinha: Boolean(selo.closest('.linha-turma')),
      acimaDoNome: caixa.bottom <= nome.top + 0.5,
    };
  });
  provar('o selo «rever» existe quando o elenco diverge', rever.achou, rever);
  provar('…e vive DENTRO da linha do nome, ao lado dele',
    rever.dentroDaLinha === true, rever);
  provar('…e não abre uma linha própria por cima do nome',
    rever.acimaDoNome === false, rever);

  console.log('\nE. A LISTAGEM É A MESMA PEÇA DAS OUTRAS (`.turma`), E NÃO UMA VARIANTE');

  const peca = await p.evaluate(() => {
    const li = document.querySelector('#cu-lista li[data-curadoria]');
    const salas = document.querySelector('#lista-turmas li.turma, #tb-lista li.turma, li.turma[data-turma]');
    return {
      classes: li.className,
      temLinhaTurma: Boolean(li.querySelector(':scope > .linha-turma')),
      nomeDentro: Boolean(li.querySelector('.linha-turma > .nome')),
      acoesDentro: Boolean(li.querySelector('.linha-turma > .acoes')),
      donoFora: Boolean(li.querySelector(':scope > .dono')),
      temLinha1: Boolean(li.querySelector('.linha1')),
      historico: Boolean(li.querySelector('.historico, .ajuste, details')),
      salas: Boolean(salas),
    };
  });
  provar('a Turma é um `li.turma`', /(^|\s)turma(\s|$)/.test(peca.classes), peca.classes);
  provar('…com `.linha-turma` a envolver o nome e as ações',
    peca.temLinhaTurma && peca.nomeDentro && peca.acoesDentro, peca);
  provar('…e o complemento (`.dono`) por baixo, fora da linha',
    peca.donoFora, peca);
  provar('…e sem a marcação antiga (`.linha1`)', peca.temLinha1 === false, peca);
  provar('…e sem o bloco do histórico do ajuste (é registro, não informação de trabalho)',
    peca.historico === false, peca);

  console.log('\nF. O VÉU COBRE A TELA INTEIRA, DIZ O QUE FAZ, E TRanca');

  const veu = await p.evaluate(() => {
    const v = document.getElementById('veu');
    if (!v) return { existe: false };
    ocupar('a gravar a Turma…', 'Vinculação');
    const cs = getComputedStyle(v);
    const cx = v.getBoundingClientRect();
    const texto = (document.getElementById('veu-texto') || {}).textContent || '';
    const cartao = v.querySelector('.veu-cartao');
    const etiqueta = v.querySelector('.veu-etiqueta');
    const filhos = [...document.body.children].filter((x) => x.id !== 'veu');
    /* A TRANSPARÊNCIA MEDE-SE NA COR COMPUTADA, e não no que o CSS diz: é o navegador que
       resolve a `color-mix` para um `rgba`, e é esse valor que a tela pinta. */
    /* O ALFA, NAS DUAS NOTAÇÕES. O Chrome devolve `rgba(...)` para um `rgba()` escrito à mão e
       `color(srgb ... / 0.55)` para o resultado de uma `color-mix` — a segunda é a que este véu
       usa. Ler só a primeira dava `null` e a prova reprovava o que estava certo. */
    const cor = cs.backgroundColor;
    const alfa = (function (c) {
      let mm = c.match(/rgba?\(([^)]+)\)/);
      if (mm) {
        const p = mm[1].split(',').map((x) => Number(x.trim()));
        return p.length === 4 ? p[3] : (p.length === 3 ? 1 : null);
      }
      mm = c.match(/\/\s*([\d.]+)\s*%/);
      if (mm) return Number(mm[1]) / 100;
      mm = c.match(/\/\s*([\d.]+)\s*\)/);
      if (mm) return Number(mm[1]);
      return c === 'transparent' ? 0 : null;
    })(cor);
    return {
      existe: true,
      visivel: cs.display !== 'none' && Number(cs.opacity) > 0.9,
      display: cs.display, opacidade: cs.opacity, z: Number(cs.zIndex),
      cobreATela: Math.abs(cx.width - window.innerWidth) < 1
        && Math.abs(cx.height - window.innerHeight) < 1,
      cor, alfa,
      temCartao: Boolean(cartao),
      temGiro: Boolean(cartao && getComputedStyle(cartao, '::before').animationName
        && getComputedStyle(cartao, '::before').animationName !== 'none'),
      etiqueta: etiqueta ? etiqueta.textContent : '',
      etiquetaEhSelo: Boolean(etiqueta && etiqueta.classList.contains('selo')),
      texto,
      trancouTudo: filhos.every((x) => x.inert),
      acimaDeTudo: Math.max(...[...document.querySelectorAll('.lateral, .topnav, header')]
        .map((x) => Number(getComputedStyle(x).zIndex) || 0)) < Number(cs.zIndex),
    };
  });
  provar('o véu existe na página', veu.existe, veu);
  provar('…e, ocupado, fica VISÍVEL (opacidade > 0)', veu.visivel, veu);
  provar('…e cobre a janela inteira', veu.cobreATela, veu);
  provar('…e fica acima da coluna e da barra', veu.acimaDeTudo, veu);
  provar('…e é TRANSLÚCIDO: deixa ver a página por baixo (alfa entre 0,3 e 0,8)',
    typeof veu.alfa === 'number' && veu.alfa >= 0.3 && veu.alfa <= 0.8, { cor: veu.cor, alfa: veu.alfa });
  provar('…e o que se lê está num cartão opaco', veu.temCartao, veu);
  provar('…e tem o giro a rodar', veu.temGiro, veu);
  provar('…e traz a etiqueta semântica, que é o selo do catálogo',
    veu.etiqueta === 'Vinculação' && veu.etiquetaEhSelo, veu);
  provar('…e diz o que está a acontecer', /a gravar a Turma/.test(veu.texto), veu.texto);
  provar('…e tranca tudo o que está por baixo', veu.trancouTudo, veu);

  const saiu = await p.evaluate(() => {
    liberar();
    const v = document.getElementById('veu');
    const filhos = [...document.body.children].filter((x) => x.id !== 'veu');
    return { display: getComputedStyle(v).display, trancado: filhos.some((x) => x.inert) };
  });
  provar('…e sai quando o trabalho acaba', saiu.display === 'none', saiu);
  provar('…e destranca a página', saiu.trancado === false, saiu);

  console.log('\nG. OS CAMPOS DO FORMULÁRIO DIZEM «— escolher —» QUANDO ESTÃO VAZIOS');

  const campos = await p.evaluate(() => {
    const ids = ['cuprofessor', 'cumodalidade', 'cutradicao', 'cuturma', 'cuelenco'];
    const out = {};
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) { out[id] = null; return; }
      out[id] = {
        primeira: (el.options[0] || {}).textContent || '',
        valor: (el.options[0] || {}).value,
        seleccionada: el.value,
      };
    });
    // o grau é repovoado pelo cliente: escolhe-se uma tradição e lê-se a primeira opção
    const trad = document.getElementById('cutradicao');
    if (trad) { trad.value = 'RAD'; trad.dispatchEvent(new Event('change')); }
    const g = document.getElementById('cugrau');
    out.cugrau = g ? { primeira: (g.options[0] || {}).textContent || '', valor: (g.options[0] || {}).value } : null;
    return out;
  });
  for (const id of ['cuprofessor', 'cumodalidade', 'cutradicao', 'cuelenco']) {
    provar('o campo «' + id + '» abre com «— escolher —»',
      Boolean(campos[id]) && campos[id].valor === '' && /escolher/.test(campos[id].primeira),
      campos[id]);
  }
  provar('o campo «cugrau» abre com «— escolher —» também depois de repovoado',
    Boolean(campos.cugrau) && campos.cugrau.valor === '' && /escolher/.test(campos.cugrau.primeira),
    campos.cugrau);

  await nav.close();
  srv.close();
  return true;
}

/* ------------------------------------------------------------------------------------------ */

(async () => {
  provarONome();
  provarAGuarda();
  await provarAsRotas();
  await provarANavegador();

  console.log('\n' + (falhas === 0 ? 'TODAS AS ' : '') + provas + ' provas, '
    + falhas + (falhas === 1 ? ' falha' : ' falhas'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
