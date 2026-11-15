#!/usr/bin/env node
'use strict';

/**
 * provar-estado-da-turma.js — a etiqueta da Turma diz o ESTADO de agora, e não o do minuto em
 * que a página abriu.
 *
 * O QUE ELA RELATOU (15/11/2026), na letra dela:
 *
 *   «eu fui na turma e aí eu vi que turma, apesar de eu já ter criado o plano de ensino e o plano
 *   de observação, ainda está livre e com o botão editar disponível para mim e não com o botão
 *   derivar. […] Só que o erro é que permitiu eu editar e tá com a etiqueta livre.»
 *
 * O DEFEITO NÃO ERA A REGRA. A regra sempre esteve certa e sempre morou num sítio só
 * (`curadoriaVinculadaA`): o servidor RECUSOU a edição e foi ele que escreveu a frase que ela
 * citou. O que mentia era a TELA — o cartão nasce desenhado no instante em que a página é montada,
 * e o plano de ensino nasce noutra aba (a porta). Entre uma coisa e outra, o cartão ficava a dizer
 * o passado.
 *
 * O QUE SE MEDE, e por que não basta ler o fonte:
 *
 *   A. A ROTA. `GET /api/bastidores/curadorias-estado` responde, por turma, se ela já tem plano —
 *      com o selo e as acções já desenhados. Medida com o Worker EM PROCESSO, com e sem envelope
 *      de plano no KV: as duas respostas, porque uma só não distingue «acerta sempre» de «diz
 *      sempre a mesma coisa».
 *   B. A MESMA PEÇA. O pedaço do cartão e o pedaço da rota são o MESMO texto, comparação literal
 *      das duas cadeias. Duas cópias da frase divergem no primeiro ajuste, e a divergência não dá
 *      erro nenhum.
 *   C. A REPINTURA. A página é montada a dizer «livre» (é o retrato do servidor no minuto em que
 *      nasceu) e a rota de prova responde «vinculada» — o caso real, ao contrário do caminho
 *      fácil. Depois de o foco acontecer, o cartão tem de dizer «vinculada» e o botão «Derivar».
 *   D. A GUARDA. Se o botão estiver atrasado e alguém carregar em «Editar», o formulário abre em
 *      «Derivar» e diz porquê — em vez de oferecer um caminho que o servidor recusa no fim.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `motor/` de `HEAD` e corre as MESMAS provas.
 * A página de antes não tem gancho nenhum no cartão e a rota não existe: se passasse, a bancada
 * não estaria a provar nada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-estado-da-turma.js
 *   node experimentos/provar-estado-da-turma.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
let MOTOR = path.join(RAIZ, 'motor');
const NEGATIVO = process.argv.includes('--controle-negativo');

if (NEGATIVO) {
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'motor-estado-da-turma-'));
  /* VÃO AS PASTAS QUE OS `require` DO MOTOR ALCANÇAM: `motor/` inteiro, o catálogo e o
   * vocabulário (`biblioteca/`), a folha e a barra (`tools/`), os cenários de teste (`teste/`) e o
   * esquema do ciclo (`modelo/`) e o conteúdo da porta (`porta/`) — sem estas o `require` rebenta
   * antes da primeira asserção, e um controle negativo que não corre não controla nada. */
  execSync('git archive HEAD motor biblioteca tools teste modelo porta | tar -x -C ' + destino,
    { cwd: RAIZ, stdio: 'pipe' });
  MOTOR = path.join(destino, 'motor');
  console.log('CONTROLE NEGATIVO — o motor de HEAD (antes da repintura do cartão)\n');
}

const bastidores = require(path.join(MOTOR, 'servidor/bastidores.js'));

let total = 0;
let falhas = 0;
function checar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + descricao); return; }
  falhas += 1;
  console.log('  ✗ ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

// =====================================================================================
// O AMBIENTE — um KV de bancada, sem `GITHUB_TOKEN`
// =====================================================================================
function criarKv(inicial) {
  const mapa = new Map(Object.entries(inicial || {}));
  return {
    mapa,
    async get(k) { return mapa.has(k) ? mapa.get(k) : null; },
    async put(k, v) { mapa.set(k, String(v)); },
    async delete(k) { mapa.delete(k); },
    async list() { return { keys: [...mapa.keys()].map((name) => ({ name })) }; },
  };
}

const ESCOLA = 'breu';
const TURMA = {
  id: 'bale-nivel-1', nome: 'Balé Nível 1', ordem: 1,
  dias: ['ter', 'qui'], horarios: { ter: '19:00', qui: '19:00' }, frequencia: 2,
  duracaoMin: 60, periodoInicio: '2027-02-01', periodoFim: '2027-04-30', ativo: true,
};
/* O PROFESSOR É A MESMA CADEIA DO ENVELOPE, e a igualdade é o que a regra compara (`p.professor
 * === c.professor`). Um fixture que os escrevesse de duas maneiras mediria a normalização que não
 * existe e daria um «livre» verde por acidente. */
const PROFESSOR = 'coqui';
const CURADORIA = {
  id: 'c1', professor: PROFESSOR, modalidade: 'Balé Clássico', tradicao: 'Vaganova',
  turmas: ['Balé Nível 1'], alunas: ['Vavá'], vigencia: '2027-02-01', duracaoMin: 60,
};

function ambiente(comPlano) {
  const inicial = {
    'bastidores/breu/turmas': JSON.stringify([TURMA]),
    'bastidores/breu/professores': JSON.stringify([{ nome: 'Coqui de Redinha', slug: PROFESSOR, modalidade: 'bale-classico' }]),
    'bastidores/breu/alunas': JSON.stringify(['Vavá']),
    'bastidores/breu/curadorias': JSON.stringify([CURADORIA]),
  };
  if (comPlano) {
    // A chave física é NAMESPACED pela escola (`<escola>/envelope/<id>.json`) — gravar sem o
    // prefixo faria a bancada passar com um código que, no ar, não encontrava plano nenhum.
    inicial['breu/envelope/plano-20261115-1101.json'] = JSON.stringify({
      id: 'plano-20261115-1101', fonte: 'plano', gerado_em: '2026-11-15T11:01:00Z',
      contexto: { escola: ESCOLA, professor: PROFESSOR, ciclo: '01', turma: 'Balé Nível 1' },
      respostas: { 'contexto-turma': { valor: 'Balé Nível 1' } },
    });
  }
  const kv = criarKv(inicial);
  const env = {
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', PADD_KV: kv,
  };
  return { kv, env };
}

const pedir = (env, caminho) => bastidores.fetch(new Request(
  'https://breu.tmenegaz77.workers.dev' + caminho, {}), env);

/** A página, montada pelo próprio servidor — com o mesmo `pares` que ele usaria. */
function pagina(comPlano) {
  const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
  const pares = comPlano ? [{ professor: PROFESSOR, turma: 'Balé Nível 1', ciclo: '01' }] : [];
  return bastidores.paginaProducao(ESCOLA, { escola: ESCOLA, professor: PROFESSOR, ciclo: '01', query: '' },
    [{ nome: 'Coqui de Redinha', slug: PROFESSOR }], ['Vavá'], 'Tiago', 'tiago',
    [TURMA], [], {}, [CURADORIA], [], pares, usos,
    { modo: 'clara', paleta: 'bordo' }, '', [], new Set());
}

// =====================================================================================
// A. A ROTA — uma resposta por estado, e as duas são diferentes
// =====================================================================================
async function aRota() {
  console.log('\nA. A ROTA — o estado da Turma, do lado do servidor');
  {
    const { env } = ambiente(true);
    const r = await pedir(env, '/api/bastidores/curadorias-estado');
    const d = await r.json();
    const e = d && d.estados ? d.estados.c1 : null;
    checar('a rota responde 200', r.status === 200, r.status);
    checar('com plano de ensino, a turma vem VINCULADA', e && e.vinculada === true, e);
    checar('…e o selo é o de vinculada', /class="selo vinculada"/.test(String(e && e.selo)), e && e.selo);
    checar('…e as acções abrem em «Derivar»', /data-modo="derivar"/.test(String(e && e.acoes)), e && e.acoes);
    checar('…e o «Excluir» vem desligado — o que está vinculado não se apaga',
      /disabled/.test(String(e && e.acoes)) && !/data-tipo="curadoria"/.test(String(e && e.acoes)), e && e.acoes);
  }
  {
    const { env } = ambiente(false);
    const r = await pedir(env, '/api/bastidores/curadorias-estado');
    const d = await r.json();
    const e = d && d.estados ? d.estados.c1 : null;
    checar('sem plano de ensino, a MESMA turma vem LIVRE', e && e.vinculada === false, e);
    checar('…e o selo é o de livre', /class="selo livre"/.test(String(e && e.selo)), e && e.selo);
    checar('…e as acções abrem em «Editar»', /data-modo="editar"/.test(String(e && e.acoes)), e && e.acoes);
  }
}

// =====================================================================================
// B. A MESMA PEÇA — o cartão e a rota não podem divergir
// =====================================================================================
async function aMesmaPeca() {
  console.log('\nB. A MESMA PEÇA — o pedaço do cartão é o que a rota devolve');
  for (const comPlano of [true, false]) {
    const html = pagina(comPlano);
    const { env } = ambiente(comPlano);
    const r = await pedir(env, '/api/bastidores/curadorias-estado');
    const d = await r.json();
    const e = (d && d.estados && d.estados.c1) || null;
    const rotulo = comPlano ? 'com plano' : 'sem plano';
    checar('a rota responde o estado (' + rotulo + ')', e !== null, { status: r.status, corpo: d });
    if (!e) continue;
    checar('o cartão tem o gancho do selo (' + rotulo + ')',
      html.indexOf('data-selo-da-turma="c1"') !== -1);
    /* A IGUALDADE É LITERAL, e é o coração da secção: se o cartão passasse a escrever o selo por
     * conta própria, esta linha reprovava no mesmo commit em que a cópia nascesse. */
    checar('…e o selo do cartão é o da rota, carácter a carácter (' + rotulo + ')',
      html.indexOf('<span data-selo-da-turma="c1">' + e.selo + '</span>') !== -1);
    checar('…e as acções também (' + rotulo + ')',
      html.indexOf('<span class="acoes" data-acoes-da-turma="c1">' + e.acoes + '</span>') !== -1);
  }
}

// =====================================================================================
// C e D. O CLIENTE — a repintura e a guarda, num navegador
// =====================================================================================
function servir(html, estado) {
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
    // O `teste-preenchimento.js` é servido pelo Worker ao vivo; aqui é um ficheiro vazio, e não a
    // página — senão o `<script>` engolia HTML e a bancada contava um erro que não é do defeito.
    if (caminho.endsWith('/scripts/teste-preenchimento.js')) {
      return ok('text/javascript', '');
    }
    if (caminho === '/api/bastidores/curadorias-estado') {
      return ok('application/json', JSON.stringify(estado.rota));
    }
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({
    srv, base: 'http://127.0.0.1:' + srv.address().port,
  })));
}

async function oCliente() {
  console.log('\nC. A REPINTURA — o cartão que nasceu «livre» passa a dizer o que é');
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-estado-da-turma: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(1);
  }
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  const puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));

  // A PÁGINA É A DE ANTES DO PLANO — o retrato do servidor no minuto em que nasceu. É o caso
  // real, e é o único em que a repintura tem trabalho a fazer.
  const html = pagina(false);
  const estado = { rota: { ok: true, estados: {} } };
  const { srv, base } = await servir(html, estado);
  const browser = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));

  const cartao = () => page.evaluate(() => {
    const caixa = (attr) => {
      const todos = document.querySelectorAll('[' + attr + ']');
      for (let i = 0; i < todos.length; i++) if (todos[i].getAttribute(attr) === 'c1') return todos[i];
      return null;
    };
    const selo = caixa('data-selo-da-turma');
    const acoes = caixa('data-acoes-da-turma');
    const botao = acoes ? acoes.querySelector('[data-curadoria-ajustar]') : null;
    return {
      selo: selo ? selo.textContent.trim() : null,
      classeDoSelo: selo ? (selo.querySelector('.selo') || {}).className || '' : '',
      modoDoBotao: botao ? botao.getAttribute('data-modo') : null,
      rotuloDoBotao: botao ? botao.textContent.trim() : null,
      modo: (document.getElementById('cumodo') || {}).value || '',
      enviar: (document.getElementById('cu-enviar') || {}).textContent || '',
      temMapa: typeof VINCULADAS === 'object' && VINCULADAS !== null,
      mapa: typeof VINCULADAS === 'object' && VINCULADAS !== null ? VINCULADAS.c1 : undefined,
    };
  });

  try {
    await page.setViewport({ width: 1280, height: 950 });
    // PRIMEIRA CARGA: a rota responde o que o servidor diria DEPOIS de o plano nascer.
    estado.rota = {
      ok: true,
      estados: { c1: {
        vinculada: true,
        selo: '<span class="selo vinculada" title="já nasceu o plano de ensino desta curadoria; mexer-lhe mudaria o passado">vinculada</span>',
        acoes: '<button class="ajustar acao pequena" data-curadoria-ajustar="c1" data-modo="derivar" title="Derivar">Derivar</button>',
      } },
    };
    await page.goto(base + '/bastidores/producao', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 700));

    const montada = await cartao();
    /* O RETRATO DO SERVIDOR, medido no HTML e não no DOM: é ele que diz «livre» antes de a rota
     * responder. Lido depois da carga, já a repintura teria acontecido — e a bancada mediria o
     * resultado, não o ponto de partida. */
    checar('a página é SERVIDA a dizer «livre» (o retrato de quando nasceu)',
      /<span data-selo-da-turma="c1"><span class="selo livre"/.test(html));
    checar('o cartão tem os dois ganchos', montada.selo !== null && montada.modoDoBotao !== null, montada);
    checar('…e o mapa de vinculadas existe no cliente', montada.temMapa === true, montada.temMapa);
    checar('depois do foco, o selo diz «vinculada»', montada.selo === 'vinculada', montada.selo);
    checar('…e o botão passa a «Derivar»', montada.modoDoBotao === 'derivar' && montada.rotuloDoBotao === 'Derivar', montada);
    checar('…e o mapa do cliente soube-o', montada.mapa === true, montada.mapa);
    checar('nenhum erro de script na página', erros.length === 0, erros);

    console.log('\nD. A GUARDA — um «Editar» atrasado não abre o formulário que o servidor recusa');
    // SEGUNDA CARGA: a rota falha, para o cartão FICAR a dizer «Editar» — é o botão atrasado que
    // ela encontrou, e é sobre ele que a guarda trabalha.
    estado.rota = { ok: false };
    await page.goto(base + '/bastidores/producao', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));
    const atrasada = await cartao();
    checar('com a rota a falhar, o cartão fica como nasceu — «Editar»', atrasada.modoDoBotao === 'editar', atrasada.mododoBotao);
    // O estado chegou por outra via (a rota voltou depois, ou a lista soube-o): a guarda olha para
    // o mapa, e o mapa é que manda.
    const guardada = await page.evaluate(() => {
      // No código de antes este mapa não existe, e a guarda não existe com ele: forçar `true` aqui
      // é o que dá à bancada o ESTADO em que a guarda se mede, também no controle negativo.
      if (typeof VINCULADAS === 'object' && VINCULADAS) VINCULADAS.c1 = true;
      ajustarCuradoria('c1', 'editar');
      // O RECADO VAI PARA O PRIMEIRO `.res` DA SECÇÃO À VISTA, e não para um `.res` escolhido
      // por nós: procurar o que tem texto evita repetir aqui a regra do `alvoDoRecado`.
      const res = [].slice.call(document.querySelectorAll('.res')).filter((e) => e.textContent.trim())[0] || {};
      return {
        modo: document.getElementById('cumodo').value,
        enviar: document.getElementById('cu-enviar').textContent,
        frase: String(res.textContent || ''),
        vigenciaVisivel: !document.getElementById('cu-vigencia-campo').hidden,
      };
    });
    checar('carregar em «Editar» com a turma vinculada abre o formulário em DERIVAR',
      guardada.modo === 'derivar', guardada.modo);
    checar('…e diz PORQUE, com a frase do servidor',
      /já tem plano de ensino/.test(guardada.frase) && /Derivar/.test(guardada.frase), guardada.frase);
    checar('…e o botão de gravação passa a «Gravar ajuste»', guardada.enviar === 'Gravar ajuste', guardada.enviar);
    checar('…e a vigência aparece — derivar é datar a versão nova', guardada.vigenciaVisivel === true, guardada.vigenciaVisivel);
  } finally {
    await browser.close();
    srv.close();
  }
}

(async () => {
  await aRota();
  await aMesmaPeca();
  await oCliente();

  console.log('\n' + (falhas ? '✗ ' + falhas + ' de ' + total + ' reprovaram' : '✓ ' + total + ' de ' + total));
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.error('provar-estado-da-turma rebentou:', e && e.stack ? e.stack : e);
  process.exit(1);
});
