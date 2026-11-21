'use strict';

/**
 * provar-leituras-do-po.js — o cabeçalho do Plano de Observação lê o plano que ele referencia.
 *
 * O QUE MOTIVOU, nas palavras da pesquisadora:
 *
 *   «No formulário do plano de ensino nós fizemos os ajustes para colocar em cima, no cabeçalho,
 *    junto de onde diz escola, professor, ciclo e turma observada, os campos que já vêm
 *    preenchidos dos bastidores produção. Acontece que essa solução não foi estendida até o plano
 *    de observação. Então eu tenho dados redundantes aqui no plano de observação e precisam ser
 *    posicionados no cabeçalho da mesma forma que fizemos no plano de ensino.»
 *
 * ERAM DOIS PROBLEMAS, e a prova mede os dois separadamente:
 *
 *   1. o PO PERGUNTAVA o que já sabia — «Professor responsável» e «Escola / espaço» (duas vezes:
 *      na identificação e outra vez dentro de «Onde se observa») eram campos de texto para dados
 *      que o cabeçalho do ato já tem;
 *   2. e NÃO MOSTRAVA o que vem do plano — frequência, duração, calendário, volume e condição de
 *      registro, que ele mesmo lê do plano referenciado para escrever o documento, não estavam em
 *      lado nenhum do formulário.
 *
 * A REGRA QUE ISSO NÃO PODE QUEBRAR: os três campos continuam a ser NÓS do mapa e continuam a ir
 * para o envelope. Quem os escreve é a semeadura do contexto do ato (`deContexto`), como no plano
 * de ensino — o que sai é o DEGRAU, não o dado. A prova confere isso no depósito, e não no código.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): o `po.json` de antes, derivado do commit que
 * introduziu as `leituras`, menos um. Espera-se que reprove os três degraus e as cinco leituras.
 *
 *   node experimentos/provar-leituras-do-po.js [--controle-negativo]
 *   REF_NEGATIVO=<sha> node experimentos/provar-leituras-do-po.js --controle-negativo
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, execFileSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');
const negativo = process.argv.indexOf('--controle-negativo') !== -1;
const ESCOLA = 'breu';
const ARQUIVO = 'porta/po/conteudo/po.json';
const PAGINA = path.join(raiz, 'porta', 'index.html');

/* O conteúdo servido. No controle negativo, o de ANTES das `leituras` — o ref deriva-se do
 * commit que introduziu o marcador, menos um. Fixá-lo em `HEAD` daria o código novo depois do
 * commit, e o controle mediria o presente jurando medir o passado. */
const conteudoServido = (() => {
  if (!negativo) return fs.readFileSync(PAGINA.replace(/index\.html$/, 'po/conteudo/po.json'), 'utf8');
  const em = (ref) => {
    try {
      return execFileSync('git', ['show', ref + ':' + ARQUIVO], { cwd: raiz, encoding: 'utf8' });
    } catch (e) { return null; }
  };
  let ref = process.env.REF_NEGATIVO || '';
  if (!ref) {
    if (em('HEAD') !== null && em('HEAD').indexOf('"leituras"') === -1) ref = 'HEAD';
    else {
      let sha = '';
      try {
        sha = execFileSync('git', ['log', '-1', '--format=%H', '-S"leituras"', '--', ARQUIVO],
          { cwd: raiz, encoding: 'utf8' }).trim();
      } catch (e) { sha = ''; }
      ref = sha ? sha + '~1' : '';
    }
  }
  const texto = ref ? em(ref) : null;
  if (texto === null) {
    console.error('provar-leituras-do-po: controle sem referência — NÃO FEITO.');
    process.exit(2);
  }
  console.log('  (controle sobre ' + ref + ')');
  return texto;
})();

const TURMAS = [
  { id: 'bale-nivel-1-teste-2', nome: 'Balé Nível 1 — Teste 2', ativo: true, frequencia: 2,
    dias: ['seg', 'qua'], horarios: { seg: '17:30', qua: '17:30' }, duracaoMin: 50,
    periodoInicio: '2027-02-01', periodoFim: '2027-04-30', programaReferencia: 'RAD',
    nivelReferencia: 'Grade 1', rubrica: ['Excelente', 'Bom', 'Em construção'] },
];
const TERMOS = [{ id: 'arabesque', termo: 'Arabesque' }, { id: 'jete', termo: 'Jeté' },
  { id: 'rond-de-jambe', termo: 'Rond de jambe' }];

/* O PLANO É DA ESCOLA VIVA, mas as CINCO LEITURAS são substituídas por valores conhecidos.
 *
 * O que esta prova mede é a LIGAÇÃO — «o cabeçalho mostra o que o plano referenciado declara» —,
 * e não o conteúdo de um envelope que muda a cada geração. Fixar as expectativas no envelope de
 * hoje é o que apodrece: o plano da `breu` já diz «3x semanal / 2 horas / 14/12/2026», e o dia em
 * que a professora o regerar com outro ritmo a prova reprova por o dado ter mudado, não por a
 * ligação ter quebrado. Os três valores substituídos são os que o `textoDoValor` da porta
 * formata de forma determinística (periodicidade, medida e data); os outros dois — volume e
 * condição de registro — já vêm no formato que a asserção espera. */
const PLANO = JSON.parse(fs.readFileSync(
  path.join(raiz, 'escola/breu/envelopes/plano-20261120-2052.json'), 'utf8'));
PLANO.contexto = Object.assign({}, PLANO.contexto, { escola: ESCOLA, professor: 'perna-boa' });
PLANO.respostas['contexto-frequencia'].valor = { vezes: 2, por: 'semanal', dias: [] };
PLANO.respostas['contexto-duracao'].valor = [{ numero: 50, unidade: 'minuto' }];
PLANO.respostas['contexto-calendario'].valor = { inicio: '2027-02-01', fim: '2027-04-30' };

function kv(inicial) {
  const m = new Map(Object.entries(inicial || {}));
  return {
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, String(v)); },
    async delete(k) { m.delete(k); },
    async list(p) {
      return { keys: [...m.keys()].filter((k) => !p || k.startsWith(p)).map((name) => ({ name })),
        list_complete: true };
    },
  };
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.json': 'application/json' };

function assets(dir, trocas) {
  return {
    async fetch(pedido) {
      const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      const trocado = trocas && trocas[url.pathname];
      if (trocado !== undefined) {
        return new Response(trocado, { status: 200,
          headers: { 'Content-Type': 'application/json' } });
      }
      let p = path.join(dir, url.pathname);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p)) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(p), { status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream' } });
    },
  };
}

/* COM PLANO e SEM PLANO — as duas metades. `comPlano: false` serve um índice vazio: é o estado
 * de quem ainda não fez o plano de ensino, e nele não há leitura nenhuma a inventar. */
function envDaBancada(comPlano) {
  const base = {
    ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([
      { id: 'c1', professor: 'perna-boa', turmas: [TURMAS[0].nome], alunas: ['Aluna A'] }]),
    ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify(TURMAS),
    ['bastidores/' + ESCOLA + '/professores']: JSON.stringify([
      { nome: 'Perna Boa', slug: 'perna-boa', senha: 'p' }]),
    ['bastidores/' + ESCOLA + '/turma-conteudos']: JSON.stringify({
      'bale-nivel-1-teste-2': TERMOS.map((t) => t.id) }),
  };
  if (comPlano) {
    base[ESCOLA + '/envelope/plano-20261120-2052.json'] = JSON.stringify(PLANO);
    base[ESCOLA + '/envelope/.indice.json'] = JSON.stringify({
      versao: 4, incompleto: false, nomes: ['plano-20261120-2052.json'], resumos: {} });
  } else {
    base[ESCOLA + '/envelope/.indice.json'] = JSON.stringify({
      versao: 4, incompleto: false, nomes: [], resumos: {} });
  }
  return {
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', PROFESSOR_NOME: 'Perna Boa',
    SENHA_PROFESSOR: 'p', SENHA_ADMIN: 'd',
    PADD_KV: kv(base),
    ASSETS: assets(path.join(raiz, 'publicacao', ESCOLA), {
      '/plano-observacao/po/conteudo/po.json': conteudoServido,
    }),
  };
}

const producao = require(path.join(raiz, 'motor/servidor/producao.js'));

function servir(env) {
  const srv = http.createServer(async (req, res) => {
    const pedacos = [];
    for await (const p of req) pedacos.push(p);
    const corpo = Buffer.concat(pedacos);
    const r = await producao.fetch(new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + req.url, {
      method: req.method,
      headers: req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : undefined,
      body: corpo.length && req.method !== 'GET' ? corpo : undefined,
    }), env);
    res.writeHead(r.status, {
      'content-type': r.headers.get('content-type') || 'text/html; charset=utf-8',
      'cache-control': 'no-store' });
    res.end(Buffer.from(await r.arrayBuffer()));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

let total = 0;
let falhas = 0;
function provar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok     ' + descricao); return; }
  falhas += 1;
  console.log('  FALHOU ' + descricao
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 400)));
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-leituras-do-po: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(2);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-leituras-do-po: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(2);
  }

  const { srv, base } = await servir(envDaBancada(true));
  const navegador = await puppeteer.launch({ executablePath: executavel,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 1280, height: 1000 });
  if (process.env.DIAG) {
    pagina.on('console', (m) => console.log('  [console]', m.type(), String(m.text()).slice(0, 200)));
    pagina.on('response', (r) => console.log('  [resp]', r.status(), r.url().replace(base, '')));
    pagina.on('requestfailed', (r) => console.log('  [falhou]', r.url().replace(base, '')));
  }
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(String(e && e.message).slice(0, 160)));

  /* ABRIR ESPERA PELO QUE A PÁGINA AINDA VAI BUSCAR. A turma do cabeçalho do PO vem da ESTANTE
   * (`api/planos`), que chega depois do primeiro desenho — e medir a 3,2 s apanhava o «—» de
   * antes. A espera é declarada e tem prazo: se o valor nunca chegar, a asserção reprova, em vez
   * de o «—» passar por resposta. */
  const esperarPor = async (fn, ms) => {
    const limite = Date.now() + (ms || 9000);
    for (;;) {
      const v = await fn();
      if (v) return v;
      if (Date.now() > limite) return v;
      await new Promise((r) => setTimeout(r, 200));
    }
  };
  const abrir = async () => {
    await pagina.goto(base + '/plano-observacao/?escola=' + ESCOLA
      + '&ciclo=01&professor=perna-boa&fonte=po&abrir=1', { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1200));
    await esperarPor(() => pagina.evaluate(() => {
      const t = document.getElementById('ctx-turma-conteudo');
      const valor = t ? String(t.textContent || '').trim() : '';
      return valor && valor !== '—' ? valor : '';
    }));
    await esperarPor(() => pagina.evaluate(() => {
      const c = document.querySelector('.barra details.ctx-ato .ctx-campos');
      return c && c.querySelectorAll('[data-leitura]').length >= 5;
    }));
  };
  const lerCabecalho = () => pagina.evaluate(() => {
    const caixa = document.querySelector('.barra details.ctx-ato .ctx-campos');
    const leituras = [...(caixa ? caixa.querySelectorAll('[data-leitura]') : [])].map((n) => ({
      id: n.getAttribute('data-leitura'),
      rotulo: (n.querySelector('.ctx-rotulo') || {}).textContent || '',
      valor: (n.querySelector('.ctx-inscricao') || {}).textContent || '',
      title: n.title,
    }));
    const turma = document.getElementById('ctx-turma-conteudo');
    return {
      leituras,
      turma: turma ? String(turma.textContent || '').trim() : null,
      // Um controle de sanidade: o cabeçalho não pode ter virado uma parede de campos.
      temSelect: !!document.getElementById('ctx-professor'),
      transborda: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  const lerRoteiro = () => pagina.evaluate(() => {
    const passos = [...document.querySelectorAll('#roteiro li[data-i]')]
      .map((li) => li.textContent.replace(/\s+/g, ' ').trim());
    const grupos = [...document.querySelectorAll('#roteiro li.grupo')]
      .map((li) => li.textContent.replace(/\s+/g, ' ').trim());
    const deposito = {};
    for (const id of ['professor', 'escola', 'campo-escola', 'plano-de-ensino']) {
      deposito[id] = typeof RESPOSTAS !== 'undefined' ? (RESPOSTAS.get(id) ?? null) : '(sem RESPOSTAS)';
    }
    const faltam = typeof contextoFaltandoCompleto === 'function'
      ? contextoFaltandoCompleto().slice() : null;
    return { passos, grupos, deposito, faltam };
  });

  await abrir();
  const cabecalho = await lerCabecalho();
  const roteiro = await lerRoteiro();

  console.log('\n1. O PO deixou de PERGUNTAR o que o cabeçalho já sabe');
  const norm = (t) => String(t).toLowerCase();
  /* O NÚMERO DO DEGRAU FAZ PARTE DO TEXTO do `<li>` («1Professor responsável»), e por isso a
   * pergunta é «contém», e não «começa por»: com `indexOf(...) === 0` o controle negativo
   * passava nas duas — a asserção media a numeração, não o campo. */
  provar('«Professor responsável» não é mais um degrau',
    !roteiro.passos.some((p) => norm(p).indexOf('professor responsável') !== -1),
    roteiro.passos.slice(0, 4));
  provar('«Escola / espaço» não é mais um degrau',
    !roteiro.passos.some((p) => norm(p).indexOf('escola / espaço') !== -1),
    roteiro.passos.filter((p) => norm(p).indexOf('escola') !== -1));
  /* O NÚMERO EXACTO NÃO SE FIXA. Ele já esteve em 30, quando os dois campos redundantes saíram do
   * mapa; hoje o mapa tem outro recorte (seis blocos, os campos aninhados) e o roteiro está em 23.
   * O facto que esta asserção guarda é o SENTIDO da mudança — o roteiro ENCOLHEU em relação aos 33
   * de antes —, e fixá-lo num literal reprovaria a prova cada vez que o mapa se reorganizasse, o
   * que é a mesma armadilha das datas fixas do `provar-aulas-dadas`. */
  provar('o roteiro encolheu em relação aos 33 de antes, e não ficou vazio',
    roteiro.passos.length > 0 && roteiro.passos.length < 33, roteiro.passos.length);

  console.log('\n2. …mas o DADO continua a ser gravado (sai o degrau, não o dado)');
  for (const id of ['professor', 'escola', 'campo-escola']) {
    provar('a resposta de «' + id + '» continua no depósito',
      roteiro.deposito[id] !== null && roteiro.deposito[id] !== undefined
      && String(roteiro.deposito[id]).trim() !== '', roteiro.deposito[id]);
  }
  provar('o fecho não acusa contexto em falta', Array.isArray(roteiro.faltam)
    && roteiro.faltam.length === 0, roteiro.faltam);

  console.log('\n3. O cabeçalho diz o que vem do PLANO REFERENCIADO');
  const porId = new Map(cabecalho.leituras.map((l) => [l.id, l]));
  const esperadas = [
    ['contexto-frequencia', 'Frequência semanal', '2x semanal'],
    ['contexto-duracao', 'Duração por aula', '50 minutos'],
    ['contexto-calendario', 'Calendário', '01/02/2027'],
    ['contexto-volume', 'Volume de trabalho', '3–6 séries'],
    ['contexto-registro', 'Condição de registro', 'na sala'],
  ];
  for (const [id, rotulo, trecho] of esperadas) {
    const lida = porId.get(id);
    provar('«' + rotulo + '» está no cabeçalho, com o valor do plano',
      !!lida && norm(lida.valor).indexOf(norm(trecho)) !== -1,
      lida || cabecalho.leituras.map((l) => l.id));
    provar('…e é LEITURA, não campo (diz de onde vem)',
      !!lida && /plano de ensino referenciado/i.test(lida.title || ''), lida && lida.title);
  }
  /* A TURMA DO CABEÇALHO É A DO PLANO (`contexto-turma`), não a do cadastro da estante: o PO
   * observa a turma que o plano referenciado declara. Comparar com `TURMAS[0].nome` media a
   * fixture, e não a ligação. */
  provar('a turma observada continua no seu lugar próprio',
    String(cabecalho.turma) === String(PLANO.respostas['contexto-turma'].valor),
    cabecalho.turma + ' / plano: ' + PLANO.respostas['contexto-turma'].valor);
  provar('a turma NÃO se repete nas leituras — seria a segunda resposta do mesmo dado',
    !cabecalho.leituras.some((l) => l.id === 'contexto-turma'),
    cabecalho.leituras.map((l) => l.id));

  console.log('\n4. As palavras são as do DOCUMENTO, não outras');
  /* O documento escreve estes cinco pelo `derivar-po.js`. Se a tela usasse outras palavras para
   * o mesmo dado, o professor leria duas versões do mesmo fato — a doença que o projeto combate
   * desde 26/10. Duas das cinco são conferidas contra o texto que o próprio servidor deriva. */
  const { derivarPO } = require(path.join(raiz, 'motor/nucleo/derivar-po.js'));
  const po = derivarPO({ id: 'po-x', contexto: { escola: ESCOLA, professor: 'perna-boa', ciclo: '01' },
    respostas: { 'plano-de-ensino': { valor: 'plano-20261120-2052', origem: 'declarado' } } }, PLANO,
  { rotulos: {}, derivados: {} });
  const textoDoDocumento = String(po.markdown || '');
  provar('o documento diz «2x semanal» como o cabeçalho',
    norm(textoDoDocumento).indexOf('2x semanal') !== -1,
    (textoDoDocumento.match(/Frequência[^·\n]{0,60}/i) || [])[0]);
  provar('o documento diz «50 minutos» como o cabeçalho',
    textoDoDocumento.indexOf('50 minutos') !== -1,
    (textoDoDocumento.match(/\d+ minuto\w*/g) || []).slice(0, 3));

  console.log('\n5. A tela continua a ser uma tela');
  provar('os controles do ato continuam lá', cabecalho.temSelect === true);
  provar('não transborda a 1280 px', cabecalho.transborda === false);
  await pagina.setViewport({ width: 390, height: 900 });
  await new Promise((r) => setTimeout(r, 400));
  const estreito = await lerCabecalho();
  provar('…nem a 390 px', estreito.transborda === false);
  provar('…e as cinco leituras continuam à vista', estreito.leituras.length === 5,
    estreito.leituras.map((l) => l.id));
  provar('nenhum erro de JavaScript na página', erros.length === 0, erros.slice(0, 3));

  await navegador.close();
  srv.close();

  /* ------------------------------------------------------------------ sem plano */
  const sem = await servir(envDaBancada(false));
  const nav2 = await puppeteer.launch({ executablePath: executavel,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pag2 = await nav2.newPage();
  await pag2.setViewport({ width: 1280, height: 900 });
  await pag2.goto(sem.base + '/plano-observacao/?escola=' + ESCOLA
    + '&ciclo=01&professor=perna-boa&fonte=po&abrir=1', { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 2600));
  const vazio = await pag2.evaluate(() => {
    const caixa = document.querySelector('.barra details.ctx-ato .ctx-campos');
    return [...(caixa ? caixa.querySelectorAll('[data-leitura]') : [])]
      .map((n) => n.getAttribute('data-leitura'));
  });
  console.log('\n6. SEM plano escolhido não há leitura nenhuma — a lacuna não é um valor');
  provar('o cabeçalho não inventa as cinco', vazio.length === 0, vazio);
  await nav2.close();
  sem.srv.close();

  console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ') + total + ' asserção(ões), '
    + falhas + ' falha(s).' + (negativo ? ' (controle negativo: espera-se reprovar)' : ''));
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.error('provar-leituras-do-po: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
