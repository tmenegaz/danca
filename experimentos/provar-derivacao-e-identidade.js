#!/usr/bin/env node
'use strict';

/*
 * provar-derivacao-e-identidade.js — QUEM AJUSTA DUAS VEZES NÃO PÁRA NO ELO VENCIDO, E A
 * VARIANTE NÃO MUDA QUANDO A SALA É DERIVADA (10/11/2026).
 *
 * O QUE MOTIVOU, e são duas coisas que a pesquisadora encontrou no mesmo gesto — «alterar a
 * sala ou o estilo de uma turma e gravar o ajuste»:
 *
 *   1. «erro de curadoria ("não encontra…")». Derivar troca a IDENTIDADE do registo: o elo novo
 *      nasce com a data (`…-2026-11-10`) e o anterior desce ao histórico com `substituidaPor`.
 *      Quem tinha a página aberta ficava com o id de ANTES — e o gesto seguinte (ajustar o
 *      estilo depois da sala) chegava com um id que já não é o vigente. A resposta era «curadoria
 *      não encontrada (ou já substituída)»: uma porta fechada que não diz onde está a que abre.
 *   2. «o nome do plano de ensino está a usar o nome da sala?» — a variante (`<escola>-<turma>`)
 *      é a identidade da fonte e nomeia o `.conf`, os `.md`, a pasta do pacote e a âncora. O
 *      `compor-conf` compunha-a com o **id** da turma; e o id de uma Sala derivada leva a data.
 *      A partir do primeiro ajuste de horário, o `.conf` declarava `calango-rosa-2026-11-10`
 *      enquanto todos os escritores e o `hash-ciclo.sh` usavam `calango-rosa`: um ciclo, dois
 *      nomes.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. O ELO VENCIDO DIZ QUAL É O VIGENTE. As duas rotas de derivação (curadoria e sala)
 *      respondem 409 com `vigente` — o TOPO da cadeia de substituições, e não o vizinho — em vez
 *      de um 404 mudo. Um id que nunca existiu continua a ser 404 (controle negativo).
 *   B. A VARIANTE É A DO NOME. `comporConf` dá a mesma variante com a sala original e com os
 *      seus elos derivados, e ela é a mesma de `varianteDoContexto` — a função que nomeia os
 *      ficheiros. O cabeçalho do `.conf` nomeia o ficheiro onde ele vive.
 *   C. A PÁGINA RECARREGA DEPOIS DE GRAVAR — e o recado da cadeia atravessa a recarga. É o que
 *      devolve à lista a identidade fresca (o `cuderivar` do elo novo) sem perder o que falta.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): corre as MESMAS provas contra o `motor/` de
 * `REF_NEGATIVO` (por omissão `HEAD`), num diretório à parte. O código de antes responde 404,
 * compõe `calango-rosa-2026-11-10` e não recarrega — se passasse, a prova não provava nada.
 *
 * SEM REDE nos servidores: o KV é de memória e o repositório é um stub. O navegador é o do
 * `marp-cli` global (puppeteer-core); sem ele, as provas da página ficam NÃO FEITAS.
 *
 *   node experimentos/provar-derivacao-e-identidade.js
 *   REF_NEGATIVO=HEAD node experimentos/provar-derivacao-e-identidade.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'prova';
const DONO = 'pe-torto';
const TURMA = 'Rosa';
/* O ID DE UMA SALA DERIVADA — é ele que envenenava a variante. */
const TURMA_DERIVADA = 'rosa-2026-11-10';

/** Um KV de mentira com a forma do verdadeiro (get/put/delete/list). */
function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    _dados: dados,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, v); return { ok: true }; },
    async delete(k) { dados.delete(k); },
    async list() { return { keys: [...dados.keys()].map((name) => ({ name })), list_complete: true }; },
  };
}

const turma = (extra) => Object.assign({
  id: 'rosa', nome: TURMA, ordem: -1, frequencia: 3,
  dias: ['ter', 'qui', 'sáb'], horarios: { ter: '19:00', qui: '19:00', 'sáb': '19:00' },
  duracaoMin: 60, periodoInicio: '2026-11-20', periodoFim: '2026-12-20', ativo: true,
}, extra || {});

const curadoria = (extra) => Object.assign({
  id: 'pe-torto-bale-classico-rosa', professor: DONO, modalidade: 'Balé clássico',
  tradicao: 'RAD', grau: '', nivel: '1', nivelReferencia: 'Grade 1',
  turmas: [TURMA], linhaDeBase: null, linhaDeBaseNome: null, repertorio: [],
  alunas: [], vigenteDe: '2026-11-08',
}, extra || {});

/**
 * A CADEIA DE TRÊS ELOS — a versão de 08/11 foi ajustada a 09/11, e essa a 10/11. É o caso que
 * distingue «seguir a seta» de «olhar o vizinho»: a página de 08/11 tem de ser mandada para a de
 * 10/11, e não para a de 09/11.
 */
function sementeDaCuradoria() {
  return [
    curadoria({ id: 'pe-torto-bale-classico-rosa', substituidaPor: 'pe-torto-bale-classico-rosa-2026-11-09', substituidaEm: '2026-11-09' }),
    curadoria({ id: 'pe-torto-bale-classico-rosa-2026-11-09', vigenteDe: '2026-11-09', substituidaPor: 'pe-torto-bale-classico-rosa-2026-11-10', substituidaEm: '2026-11-10' }),
    curadoria({ id: 'pe-torto-bale-classico-rosa-2026-11-10', vigenteDe: '2026-11-10' }),
  ];
}

function sementeDasTurmas() {
  return [
    turma({ id: 'rosa', substituidaPor: TURMA_DERIVADA, substituidaEm: '2026-11-10' }),
    turma({ id: TURMA_DERIVADA, vigenteDe: '2026-11-10', substitui: 'rosa' }),
  ];
}

/* ------------------------------------------------------------------------------------------
 * A. O SERVIDOR — o elo vencido aponta o vigente
 * ---------------------------------------------------------------------------------------- */

/** A ponte dos Bastidores com o KV semeado. O repositório é stubado: nenhuma prova vai à rede. */
function bastidoresDe(motor, semente) {
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
  return { b, kv, env, pedir };
}

async function provarOEloVencido(motor) {
  console.log('\nA. O ELO VENCIDO DIZ QUAL É O VIGENTE');

  {
    const { pedir } = bastidoresDe(motor, {
      ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify(sementeDaCuradoria()),
      // A SALA TAMBÉM: a rota confere que a turma existe no cadastro antes de gravar.
      ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([turma()]),
    });
    const velho = await pedir('/api/bastidores/curadoria-derivar', {
      senhaDirecao: 'prova', derivarDe: 'pe-torto-bale-classico-rosa',
      vigencia: '2026-11-10', turmas: [TURMA], modalidade: 'Balé clássico',
    });
    provar('a curadoria vencida não é um beco: a resposta é 409',
      velho.status === 409, velho);
    provar('…e nomeia o TOPO do elo, e não o vizinho',
      (velho.json || {}).vigente === 'pe-torto-bale-classico-rosa-2026-11-10',
      velho.json);
    provar('…e a frase diz que a página está um ajuste atrás',
      /já foi ajustada/.test(String((velho.json || {}).erro || ''))
        && /recarregue/.test(String((velho.json || {}).erro || '')), velho.json && velho.json.erro);

    const inexistente = await pedir('/api/bastidores/curadoria-derivar', {
      senhaDirecao: 'prova', derivarDe: 'nao-existe-em-lugar-nenhum',
      vigencia: '2026-11-10', turmas: [TURMA],
    });
    provar('um id que nunca existiu continua a ser 404 (controle negativo)',
      inexistente.status === 404, inexistente);

    const vigente = await pedir('/api/bastidores/curadoria-derivar', {
      senhaDirecao: 'prova', derivarDe: 'pe-torto-bale-classico-rosa-2026-11-10',
      vigencia: '2026-11-10', turmas: [TURMA], tradicao: 'RAD',
    });
    provar('o elo VIGENTE grava (o caminho normal continua aberto)',
      vigente.status === 201, vigente);
  }

  {
    const { pedir } = bastidoresDe(motor, {
      ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify(sementeDasTurmas()),
    });
    const velha = await pedir('/api/bastidores/turma-derivar', {
      senhaDirecao: 'prova', derivarDe: 'rosa', vigencia: '2026-11-10',
      dias: ['ter'], horarios: { ter: '20:00' }, duracaoMin: 60,
      periodoInicio: '2026-11-20', periodoFim: '2026-12-20',
    });
    provar('a SALA vencida responde 409 e aponta a vigente',
      velha.status === 409 && (velha.json || {}).vigente === TURMA_DERIVADA, velha);
  }
}

/* ------------------------------------------------------------------------------------------
 * B. A VARIANTE — do NOME, e a mesma em todo o lado
 * ---------------------------------------------------------------------------------------- */

function provarAVariante(motor) {
  console.log('\nB. A VARIANTE NÃO MUDA QUANDO A SALA É DERIVADA');

  const { comporConf } = require(path.join(motor, 'servidor/compor-conf.js'));
  const { varianteDoContexto } = require(path.join(motor, 'servidor/escrever-po.js'));
  const plano = { respostas: { 'objetivo-geral': { valor: 'Teste' } } };

  const compor = (id) => comporConf({
    turma: turma({ id }), plano, identidade: { ESCOLA: 'Calango', RESPONSAVEL: 'Pe Torto' },
    escola: 'calango', ciclo: '01', docs: ['plano'],
  });
  const original = compor('rosa');
  const derivada = compor(TURMA_DERIVADA);
  const doContexto = varianteDoContexto({ escola: 'calango', turma: TURMA });

  provar('a sala original dá a variante do nome',
    original.derivados.VARIANTE === 'calango-rosa', original.derivados.VARIANTE);
  provar('a sala DERIVADA dá a MESMA variante',
    derivada.derivados.VARIANTE === 'calango-rosa', derivada.derivados.VARIANTE);
  provar('…que é a mesma que nomeia os ficheiros (`varianteDoContexto`)',
    derivada.derivados.VARIANTE === doContexto, doContexto);
  provar('…e o cabeçalho do `.conf` nomeia o ficheiro onde ele vive',
    derivada.texto.indexOf('ciclo-01-calango-rosa.conf') !== -1
      && derivada.texto.indexOf('calango-rosa-2026-11-10') === -1,
    (derivada.texto.match(/^# ciclo-.*$/m) || [])[0]);
  provar('…e o NOME de exibição continua com a escola e a sala',
    derivada.texto.indexOf('NOME="Ciclo 01 — Calango · Rosa"') !== -1,
    (derivada.texto.match(/^NOME=.*$/m) || [])[0]);
}

/* ------------------------------------------------------------------------------------------
 * C. A PÁGINA — recarrega depois de gravar, e o recado atravessa
 * ---------------------------------------------------------------------------------------- */

const CONTEXTO = {
  professor: DONO, ciclo: '01',
  query: 'professor=' + DONO + '&escola=' + ESCOLA + '&ciclo=01',
};

const CADEIA_PENDENTE = {
  executada: true, ok: false, completa: true,
  fecharam: ['Vínculos e etiquetas', 'Plano de ensino'],
  restam: ['Plano de observação', 'Documentos gerados (HTML e PDF)'],
  porOrcamento: false,
  alvos: [{ turma: TURMA, ok: false, etapas: [] }],
  faltam: [{
    turma: TURMA, chave: 'plano-de-observacao', rotulo: 'Plano de observação',
    estado: 'pendente', falta: 'o PO é anterior à mudança — a cadeia deriva um elo novo',
    href: '/plano-observacao/?professor=' + DONO + '&escola=' + ESCOLA
      + '&ciclo=01&fonte=po&ajustar=po-20261103-2221',
  }],
  recado: 'a cadeia avançou até «Plano de ensino», e isso ficou gravado. '
    + 'Falta Plano de observação, Documentos gerados (HTML e PDF).',
};

async function provarAPagina(motor) {
  console.log('\nC. A PÁGINA RECARREGA, E O RECADO DA CADEIA ATRAVESSA A RECARGA');

  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('  NÃO FEITO — Chrome/Chromium não encontrado.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('  NÃO FEITO — puppeteer-core não encontrado (vem do marp-cli global).');
    process.exit(1);
  }

  const b = require(path.join(motor, 'servidor/bastidores.js'));
  /* `trms` É O CADASTRO DAS SALAS — sem ele o `<select>` da sala nasce vazio e o formulário
   * recusa «falta a sala» antes de qualquer pedido. É a mesma lista que o servidor desenha. */
  /* `paresSim` DIZ QUE A TURMA JÁ TEM PLANO — é o que faz o botão da lista ser «Derivar» (e não
   * «Editar»). Sem ele, o formulário gravaria pela rota de edição, e a prova mediria outra coisa. */
  const paresSim = [{ professor: DONO, turma: TURMA, ciclo: '01' }];
  const html = b.paginaProducao(ESCOLA, CONTEXTO, [], [], 'Pe Torto', DONO,
    [turma()], [], {}, [curadoria()], [], paresSim);

  const visto = { posts: [], paginas: 0 };
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      return ok('text/css; charset=utf-8', fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok('text/javascript', fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')));
    }
    if (caminho === '/api/bastidores/curadoria-derivar' && req.method === 'POST') {
      let corpo = '';
      req.on('data', (c) => { corpo += c; });
      req.on('end', () => {
        let d = {};
        try { d = JSON.parse(corpo); } catch (e) { d = {}; }
        visto.posts.push(d);
        ok('application/json', JSON.stringify({
          ok: true,
          curadoria: Object.assign(curadoria(), { id: 'pe-torto-bale-classico-rosa-2026-11-10' }),
          substitui: 'pe-torto-bale-classico-rosa',
          cadeia: CADEIA_PENDENTE,
        }));
      });
      return;
    }
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    /* SÓ A PÁGINA CONTA. O favicon e os assets também não são `/api/`, e contá-los dava uma
     * «recarga» que nunca houve — o oposto do que se está a medir. */
    if (caminho === '/bastidores/producao') visto.paginas += 1;
    ok('text/html; charset=utf-8', html);
  });
  const base = await new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto(
    'http://127.0.0.1:' + srv.address().port)));

  const navegador = await puppeteer.launch({
    executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const p = await navegador.newPage();
  /* OS `alert` DA PÁGINA BLOQUEIAM O PROTOCOLO. Eles são a recusa de um formulário incompleto —
   * a mesma que o professor lê —, e aqui só interessa que não travem a medição. */
  const alertas = [];
  p.on('dialog', async (d) => { alertas.push(d.message()); await d.dismiss(); });
  const erros = [];
  p.on('pageerror', (e) => erros.push(String(e && e.message || e)));
  p.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  await p.setViewport({ width: 1280, height: 900 });
  /* A SECÇÃO NOVE A URL — como no uso real: as secções dos Bastidores são escolhidas pelo `#hash`,
   * e é ele que diz qual `.res` recebe o recado. Sem ele, a caixa de destino seria a do painel,
   * que não é onde a pessoa está. A recarga preserva o hash, e é isso que faz o recado voltar ao
   * sítio certo. */
  await p.goto(base + '/bastidores/producao#curadorias', { waitUntil: 'networkidle0', timeout: 60000 });

  /* O GESTO: «Ajustar» na linha da curadoria, e o «Gravar ajuste» do formulário. */
  const clicou = await p.evaluate(() => {
    const b = document.querySelector('[data-curadoria-ajustar]');
    if (!b) return false;
    b.click();
    return true;
  });
  provar('a lista traz o «Ajustar» da turma', clicou);
  if (!clicou) {
    await navegador.close();
    srv.close();
    return;
  }

  await p.evaluate(() => {
    /* O formulário exige a tradição (o `ajustarCuradoria` já a preenche) e a vigência (idem). */
    document.getElementById('form-curadoria')
      .dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 2500));

  provar('o «Gravar ajuste» foi enviado', visto.posts.length === 1,
    { posts: visto.posts, alertas: alertas, erros: erros });
  provar('…com o elo de onde se partiu', visto.posts[0] && visto.posts[0].derivarDe === 'pe-torto-bale-classico-rosa',
    visto.posts[0] && visto.posts[0].derivarDe);

  const recarregou = visto.paginas >= 2;
  provar('a página RECARREGOU depois de gravar (a lista vem fresca do servidor)', recarregou,
    { paginas: visto.paginas });

  const caixa = await p.evaluate(() => {
    const el = document.querySelector('.res[data-res="curadorias"]');
    return el ? {
      texto: el.textContent,
      link: Boolean(el.querySelector('a[href*="plano-observacao"]')),
      notas: el.querySelectorAll('[data-cadeia]').length,
    } : null;
  });
  provar('…e o recado da cadeia está à vista',
    Boolean(caixa) && /a cadeia avançou/.test(caixa.texto), caixa);
  provar('…com o «abrir» do que falta', Boolean(caixa) && caixa.link, caixa);
  provar('…e sem empilhar (uma nota e a linha da etapa)', Boolean(caixa) && caixa.notas === 2, caixa);
  provar('…e sem deixar o recado guardado para a próxima carga',
    await p.evaluate(() => {
      try { return sessionStorage.getItem('producao:cadeia') === null; } catch (e) { return false; }
    }));

  await navegador.close();
  srv.close();
}

/* ------------------------------------------------------------------------------------------ */

(async () => {
  const negativo = process.argv.includes('--controle-negativo');
  let motor = path.join(RAIZ, 'motor');
  if (negativo) {
    const ref = process.env.REF_NEGATIVO || 'HEAD';
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'motor-ident-'));
    execSync('git archive ' + ref + ' motor modelo porta biblioteca tools teste | tar -x -C ' + destino,
      { cwd: RAIZ, stdio: 'pipe' });
    fs.symlinkSync(path.join(RAIZ, 'node_modules'), path.join(destino, 'node_modules'), 'dir');
    motor = path.join(destino, 'motor');
    console.log('CONTROLE NEGATIVO — o motor de ' + ref + ' (antes do elo vencido e da variante)');
  }

  await provarOEloVencido(motor);
  provarAVariante(motor);
  await provarAPagina(motor);

  console.log('');
  if (falhas) {
    console.log('FALHARAM ' + falhas + ' de ' + provas + ' asserções.');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + provas + ' asserções: o elo vencido aponta o vigente, a variante '
    + 'não muda quando a sala é derivada, e a página recarrega depois de gravar levando o recado.');
})();
