#!/usr/bin/env node
'use strict';

/**
 * provar-escola-fixa.js — a ESCOLA da página é uma inscrição, não um campo.
 *
 * Por que existe. Até 18/10/2026 o cabeçalho do ato (anamnese, plano de ensino e plano
 * de observação) abria a escola num `<input type=text>` que o professor podia reescrever.
 * Isso não era só feio: era um campo que MENTIA duas vezes. Primeira, porque o Worker de
 * cada escola resolve o slug por `ESCOLA_SLUG` e ignora o `?escola=` da URL quando a var
 * existe (`escolaDe`, no motor) — o que se digitava ali não governava nada. Segunda,
 * porque o envelope GRAVAVA o que estava no campo: dava para escrever `outra-escola`,
 * ver a tela concordar e o dado ir para a chave da escola de verdade, ou o contrário,
 * sem aviso nenhum.
 *
 * O que ele prova, nas TRÊS fontes, num navegador de verdade:
 *   1. o valor que aparece é o do SERVIDOR, mesmo quando a URL diz outra escola;
 *   2. não existe controle editável para a escola (nem input visível, nem select);
 *   3. a inscrição não é campo: sem filete de campo, altura de texto — e digitar nela
 *      não muda nada;
 *   4. sem servidor (modo local), o `?escola=` da URL continua valendo — é o mesmo
 *      critério do `escolaDe`, na ordem inversa;
 *   5. o valor que a tela mostra é o que entra no envelope (fonte única).
 *
 * Controle negativo: contra a página ANTERIOR (`git show HEAD:porta/index.html`), as
 * provas 1, 2 e 3 falham. Se elas passassem ali, não estariam provando nada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global), como o provar-celular.js.
 *
 * Uso:
 *   node experimentos/provar-escola-fixa.js
 *   CHROME_PATH=/usr/bin/chromium node experimentos/provar-escola-fixa.js
 *   node experimentos/provar-escola-fixa.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');
const FONTE_PORTA = path.join(raiz, 'porta/index.html');

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };

/* O mapa mínimo que a porta aceita — o mesmo que os testes de DOM usam. */
const MAPA = { ok: true, nos: [{ id: 'n1', campo: 'Pergunta' }], obrigatorios: 0,
  respondidas: 0, total: 1, tituloCabecalho: 'Prova' };

/**
 * O SERVIDOR DA PROVA. Responde três coisas, e é nelas que a prova se apoia:
 *   - `/api/bastidores/professores` devolve `{escola, professores}`, como o Worker;
 *   - o resto de `/api/` devolve o mapa;
 *   - a porta é servida em toda rota que não seja `/api/` nem `/assets/`.
 *
 * `escolaNoServidor` é o que distingue produção de modo local — e ele NÃO pode ir por
 * query na página: a busca da lista é `fetch('/api/bastidores/professores')`, absoluta, e
 * não carrega o `?` da página. Um `?semEscola=1` na URL nunca chegaria ao servidor para
 * mudar a resposta. Por isso são DOIS servidores, um para cada resposta de verdade.
 *
 * `no-store` em tudo: sem ele o Chrome reaproveita a primeira resposta entre navegações e
 * o controle negativo serve a página nova jurando que é a velha.
 */
function servir(escolaNoServidor) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const responder = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/api/bastidores/professores')) {
      const corpo = { ok: true, professores: [{ nome: 'Tiago Menegaz', slug: 'tiago-menegaz' }] };
      if (escolaNoServidor) corpo.escola = escolaNoServidor;
      return responder('application/json', JSON.stringify(corpo));
    }
    // A requisição do mapa é RELATIVA (`api/mapa` a partir de `/anamnese/`): o caminho
    // chega como `/anamnese/api/mapa`. Por isso a busca é por trecho, não por prefixo.
    if (caminho.indexOf('/api/') !== -1) return responder('application/json', JSON.stringify(MAPA));
    if (caminho.endsWith('/assets/style.css')) return responder('text/css; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    if (caminho.endsWith('/assets/nav.js')) return responder('text/javascript', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    if (caminho.endsWith('/assets/lib-cifra.js')) return responder('text/javascript', fs.readFileSync(path.join(raiz, 'tools/lib-cifra.js')));
    if (caminho.endsWith('/assets/markdown.js')) return responder('text/javascript', fs.readFileSync(path.join(raiz, 'porta/assets/markdown.js')));
    // A PORTA é o que está sendo provado: pode ser a do disco ou a de `HEAD` (controle
    // negativo), passada por variável de ambiente.
    const fonte = process.env.PROVA_PORTA_HTML || FONTE_PORTA;
    responder('text/html; charset=utf-8', fs.readFileSync(fonte));
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

const FONTES = [
  { fonte: 'anamnese', caminho: '/anamnese/', esperado: ['escola', 'professor', 'ciclo', 'aluna'] },
  { fonte: 'plano-ensino', caminho: '/plano-ensino/', esperado: ['escola', 'professor', 'ciclo'] },
  { fonte: 'plano-observacao', caminho: '/plano-observacao/', esperado: ['escola', 'professor', 'ciclo'] },
];

/* A leitura da barra, no navegador. Tudo o que a prova precisa vem daqui, uma vez. */
function leituraDaBarra() {
  const campo = document.getElementById('ctx-escola');
  const inscricao = document.getElementById('ctx-escola-nome');
  const caixa = document.getElementById('ctx-escola-campo');
  const visiveis = [...document.querySelectorAll('input, select, textarea')]
    .filter((e) => e.offsetParent !== null);
  const doCampo = visiveis.filter((e) => e === campo || e.id === 'ctx-escola-nome'
    || (e.getAttribute('name') === 'escola') || (e.getAttribute('aria-label') || '').indexOf('escola') !== -1);
  const estilo = inscricao ? getComputedStyle(inscricao) : null;
  return {
    valor: campo ? campo.value : null,
    tipo: campo ? campo.type : null,
    editavel: campo ? campo.offsetParent !== null : null,
    inscricao: inscricao ? inscricao.textContent.trim() : null,
    inscricaoVisivel: inscricao ? inscricao.offsetParent !== null : false,
    tagDaInscricao: inscricao ? inscricao.tagName : null,
    controlesDeEscola: doCampo.map((e) => e.tagName.toLowerCase() + (e.type ? '[' + e.type + ']' : '')),
    filete: estilo ? estilo.borderBottomWidth + ' ' + estilo.borderBottomStyle : null,
    cursor: estilo ? estilo.cursor : null,
    altura: estilo ? Math.round(inscricao.getBoundingClientRect().height) : null,
    caixaExiste: Boolean(caixa),
  };
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-escola-fixa: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-escola-fixa: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const negativo = process.argv.includes('--controle-negativo');
  if (negativo) {
    // A página ANTERIOR, direto do commit — não uma cópia editada à mão.
    const antiga = execSync('git show HEAD:porta/index.html', { cwd: raiz, maxBuffer: 64 * 1024 * 1024 }).toString();
    const temp = path.join(require('os').tmpdir(), 'porta-anterior-escola.html');
    fs.writeFileSync(temp, antiga);
    process.env.PROVA_PORTA_HTML = temp;
    console.log('CONTROLE NEGATIVO — a porta de HEAD (antes de a escola virar inscrição)\n');
  }

  const producao = await servir('valse');
  const local = await servir('');   // sem `ESCOLA_SLUG`: é o estado do modo local
  const navegador = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let ok = 0;
  let ko = 0;
  const provar = (rotulo, condicao, detalhe) => {
    if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
    else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : ' — ' + detalhe)); }
  };
  const abrir = async (url) => {
    const p = await navegador.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    for (let i = 0; i < 6; i += 1) await new Promise((r) => setTimeout(r, 60));
    return p;
  };

  for (const alvo of FONTES) {
    console.log('\n' + alvo.fonte);
    const p = await abrir(producao.base + alvo.caminho + '?professor=tiago-menegaz&escola=OUTRA-ESCOLA&ciclo=01');

    // ---------------------------------------- 1) o servidor vence a URL
    let r = await p.evaluate(leituraDaBarra);
    provar('a escola inscrita é a do SERVIDOR (valse), não a da URL (OUTRA-ESCOLA)',
      r.valor === 'valse' && r.inscricao === 'valse',
      'campo=' + r.valor + ' · inscrição=' + r.inscricao);

    // ---------------------------------------- 2) não há controle de escola
    provar('não existe controle editável para a escola',
      r.controlesDeEscola.length === 0, r.controlesDeEscola.join(','));
    provar('o campo da escola está oculto (type=hidden) e não é focável',
      r.tipo === 'hidden' && r.editavel === false, 'type=' + r.tipo + ' · visível=' + r.editavel);

    // ---------------------------------------- 3) a inscrição não é campo
    provar('a escola é pintada como TEXTO, num elemento não editável',
      r.inscricaoVisivel && r.tagDaInscricao === 'SPAN', r.tagDaInscricao);
    provar('a inscrição não tem filete de campo',
      r.filete === '0px none', r.filete);
    provar('a inscrição não anuncia cursor de texto', r.cursor === 'auto' || r.cursor === 'default', r.cursor);
    provar('a inscrição é mais baixa que um campo do sistema (42,5px)',
      typeof r.altura === 'number' && r.altura < 42, r.altura + 'px');

    // Digitar sobre ela não muda nada — não há onde digitar.
    await p.keyboard.type('HACKEADA');
    r = await p.evaluate(leituraDaBarra);
    provar('digitar sobre a inscrição não altera a escola', r.valor === 'valse', r.valor);

    // ---------------------------------------- 5) a tela e o envelope são o mesmo dado
    const noEnvelope = await p.evaluate(() => {
      const campo = document.getElementById('ctx-escola');
      return campo ? campo.value : null;
    });
    provar('o valor da tela é o que o envelope levaria', noEnvelope === 'valse', noEnvelope);
    await p.close();

    // ---------------------------------------- 4) sem servidor, a URL vale
    const q = await abrir(local.base + alvo.caminho + '?professor=tiago-menegaz&escola=fita&ciclo=01');
    const doUrl = await q.evaluate(leituraDaBarra);
    provar('sem ESCOLA_SLUG (modo local), o ?escola= da URL continua valendo',
      doUrl.valor === 'fita' && doUrl.inscricao === 'fita',
      'campo=' + doUrl.valor + ' · inscrição=' + doUrl.inscricao);
    await q.close();
  }

  await navegador.close();
  producao.srv.close();
  local.srv.close();
  console.log('\n' + (negativo ? 'controle negativo: ' : '') + 'provar-escola-fixa: ' + ok + ' de ' + (ok + ko) + ' passaram');
  process.exit(ko ? 1 : 0);
})();
