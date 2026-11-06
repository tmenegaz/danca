#!/usr/bin/env node
'use strict';

/**
 * provar-formulario-da-aula.js — o formulário do lançamento, em navegador.
 *
 * O PEDIDO DELA (06/11/2026), e ele tem três partes:
 *
 *   «Nós precisamos ajustá-lo para ter a identidade visual adequada com o nosso plano de
 *    identidade […] E aí precisamos também verificar o que que deriva aqui de verdade, porque […]
 *    aqui diz que tem presentes aluno A, B e C. Não é verdade.»
 *
 *   «Essa forma como é apresentada aqui não é fácil para o professor responder, ela é complexa.
 *    Quando tem aqui três campos de texto […] a gente vai colocar isso como elementos de marcação
 *    […] a gente vai ter os mesmos objetivos, mesmos itens, né, que ele observa […] aqueles nossos
 *    três eixos que são super importantes, o que é corpo, o que é técnica e o que é poiese. E aí
 *    ele vai simplesmente marcar o que aconteceu de novo e isso, de fato, ele tem que escrever […]
 *    Agora, o que surpreendeu vai ser só marcar, surpreendeu? Sim. Precisou de ajuste? Sim. Daí
 *    ele escreve se precisou de ajuste. Precisou de ajuste tem como valor padrão não.»
 *
 * O QUE SE PROVA AQUI, e cada item corresponde a uma frase dela:
 *
 *   A. os itens de «o que se observou» são os do PO, nos três eixos — nada é inventado, e a
 *      dimensão de onde cada item veio aparece;
 *   B. «surpreendeu» é MARCA (dois rádios, e nenhum escolhido ao abrir), «precisou de ajuste» é
 *      MARCA com padrão NÃO, e o texto do ajuste só aparece no «sim»;
 *   C. a escrita obrigatória é uma só — «o que aconteceu de novo»;
 *   D. o payload que o formulário monta passa no `validar-dados-ciclo.js`, e as marcas chegam
 *      ao JSON como `observado` (por eixo, com o texto do item);
 *   E. a página não estoura na horizontal, nem a 1280 nem a 390.
 *
 * Requer Chrome/Chromium (puppeteer-core vem com o marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-formulario-da-aula.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');

let puppeteer;
try {
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
} catch {
  console.error('provar-formulario-da-aula: puppeteer-core não encontrado — NÃO FEITO.');
  process.exit(1);
}
const executavel = process.env.CHROME_PATH
  || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
if (!executavel) {
  console.error('provar-formulario-da-aula: Chrome/Chromium não encontrado — NÃO FEITO.');
  process.exit(1);
}

const { umPacote } = require('./lib-pacote.js');
const PACOTE = umPacote();
const ABS = path.join(raiz, PACOTE);

/* AS ENTRADAS REAIS do ciclo: o PO e o plano que a página carrega ao lado do JSON de dados. */
const PO = JSON.parse(fs.readFileSync(path.join(ABS, 'po-01.json'), 'utf8'));
const indice = JSON.parse(fs.readFileSync(path.join(ABS, 'ciclos.json'), 'utf8'));
const ciclo = indice.ciclos[0];

/* A AULA DA PROVA: a primeira que o índice declara como DADA e que ainda não tem lançamento —
 * é a única em que o painel abre (`primeiraSemDado`). Derivada do índice, não fixa em código. */
const arquivoDados = ciclo.arquivo;
const apelidos = { aluna_a: 'Aluna A', aluna_b: 'Aluna B' };
const DADOS_EM_CLARO = JSON.stringify({ ciclo: ciclo.id, escola: 'calango', aulas: {},
  apelidos }, null, 2) + '\n';

/* O item que o PO declara como AUSÊNCIA, e não como coisa a olhar. */
const AUSENCIA = /^sem\s+(restri|nenhum|altera)/i;

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

function servir() {
  const MAPA = { 'assets/style.css': 'tools/templates/ciclo.css',
    'assets/nav.js': 'tools/templates/nav.js',
    'assets/lib-vistas.js': 'tools/lib-vistas.js',
    'assets/lib-cifra.js': 'tools/lib-cifra.js',
    'lancamento.html': 'tools/templates/lancamento.html' };
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    // O JSON DE DADOS EM CLARO — é o caso do «arquivo baixado», e é o único em que não se pede
    // senha. O do pacote é o envelope cifrado: sem senha ele não abre, e o formulário ficaria
    // vazio por um motivo que não tem a ver com o que se mede aqui.
    if (rel === arquivoDados) {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(DADOS_EM_CLARO);
      return;
    }
    const alvo = [MAPA[rel], rel, path.join(PACOTE, rel)].filter(Boolean)
      .map((x) => path.join(raiz, x))
      .find((x) => x.startsWith(raiz) && fs.existsSync(x) && !fs.statSync(x).isDirectory());
    if (!alvo) { res.writeHead(404); res.end('nao encontrado'); return; }
    const tipo = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml' }[path.extname(alvo)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
    res.end(fs.readFileSync(alvo));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

(async () => {
  const { srv, base } = await servir();
  const navegador = await puppeteer.launch({
    executablePath: executavel,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const erros = [];
  try {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: 1280, height: 900 });
    pagina.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
    pagina.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
    await pagina.goto(`${base}/lancamento.html`, { waitUntil: 'networkidle0' });

    /* A AULA DA PROVA: a primeira `dada` sem lançamento. */
    const aulaDaProva = (ciclo.aulas || []).find((a) => a.estado === 'dada' && !a.lancada);
    await pagina.waitForFunction(() => document.querySelector('#aula')
      && document.querySelector('#aula').options.length > 1, { timeout: 15000 });
    const opcoes = await pagina.$$eval('#aula option', (os) => os.map((o) => o.value));
    provar('o filtro lista a aula sem dado (a da prova)', aulaDaProva && opcoes.includes(aulaDaProva.n),
      { esperada: aulaDaProva && aulaDaProva.n, opcoes });
    if (!aulaDaProva) throw new Error('o índice não declara nenhuma aula «dada» — sem ela não há painel');

    await pagina.select('#aula', aulaDaProva.n);
    await pagina.waitForFunction(() => {
      const c = document.querySelector('#captura');
      return c && !c.hidden && document.querySelector('#captura-campos .observado');
    }, { timeout: 15000 });

    // ----------------------------------------------------------------------------------------
    console.log('A. «o que se observou» — os itens são os do PO, nos três eixos');
    {
      const itens = await pagina.$$eval('#captura-campos .observado h4', (hs) => hs.map((h) => h.textContent.trim()));
      provar('os três eixos aparecem, e nesta ordem: Corpo, Técnica, Poiesis',
        JSON.stringify(itens) === JSON.stringify(['Corpo', 'Técnica', 'Poiesis']), itens);

      const porEixo = await pagina.evaluate(() => {
        const out = {};
        document.querySelectorAll('#captura-campos .observado h4').forEach((h) => {
          const linhas = [];
          let n = h.nextElementSibling;
          while (n && n.tagName !== 'H4') {
            if (n.tagName === 'TABLE') {
              n.querySelectorAll('tbody tr, tr').forEach((tr) => {
                const th = tr.querySelector('th.aluna');
                if (th) linhas.push(th.textContent.trim());
              });
            }
            n = n.nextElementSibling;
          }
          out[h.textContent.trim()] = linhas;
        });
        return out;
      });

      // O QUE O PO DECLARA, eixo a eixo, sem repetir o mesmo item dentro do eixo.
      const esperado = { Corpo: [], Técnica: [], Poiesis: [] };
      const rotulo = { corpo: 'Corpo', tecnica: 'Técnica', poiesis: 'Poiesis' };
      for (const d of PO.itensPorDimensao || []) {
        const eixo = rotulo[String(d.eixo || '').toLowerCase().normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')];
        if (!eixo) continue;
        for (const bruto of String(d.itens || '').split(';')) {
          const item = bruto.trim();
          if (!item || AUSENCIA.test(item)) continue;
          if (!esperado[eixo].some((x) => x.toLowerCase() === item.toLowerCase())) esperado[eixo].push(item);
        }
      }
      provar('os itens de cada eixo são EXACTAMENTE os do PO',
        JSON.stringify(porEixo) === JSON.stringify(esperado), { naTela: porEixo, noPo: esperado });

      const todos = Object.values(porEixo).flat();
      provar('«sem restrições declaradas» NÃO é oferecido como item de marca',
        !todos.some((t) => AUSENCIA.test(t)), todos.filter((t) => AUSENCIA.test(t)));
      provar('o mesmo item não aparece duas vezes no mesmo eixo (as três dimensões da Técnica '
        + 'trabalham os mesmos objectivos)',
        Object.values(porEixo).every((l) => new Set(l.map((x) => x.toLowerCase())).size === l.length),
        porEixo);
      provar('o eixo nomeia as dimensões de onde os itens vieram',
        await pagina.evaluate(() => {
          const h = [...document.querySelectorAll('#captura-campos .observado h4')]
            .find((x) => x.textContent.trim() === 'Técnica');
          return !!(h && h.nextElementSibling && h.nextElementSibling.textContent.includes('·')
            && /Solo/.test(h.nextElementSibling.textContent));
        }));
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nB. «surpreendeu» e «precisou de ajuste» — marcas, com os padrões dela');
    {
      const surpresa = await pagina.evaluate(() => ({
        existe: [...document.querySelectorAll('textarea')].some((t) => t.id === 'captura-surpresas'),
        radios: [...document.querySelectorAll('input[name="captura-surpreendeu"]')].map((r) => r.value),
        marcado: [...document.querySelectorAll('input[name="captura-surpreendeu"]')]
          .filter((r) => r.checked).map((r) => r.value),
      }));
      provar('o campo de texto livre «o que surpreendeu» deixou de existir',
        surpresa.existe === false);
      provar('«surpreendeu» é um par de marcas sim/não',
        JSON.stringify(surpresa.radios) === JSON.stringify(['sim', 'nao']), surpresa.radios);
      provar('ao abrir, nenhuma marca está escolhida (em branco = não respondi)',
        surpresa.marcado.length === 0, surpresa.marcado);

      const ajuste = await pagina.evaluate(() => ({
        marcado: [...document.querySelectorAll('input[name="captura-ajuste"]')]
          .filter((r) => r.checked).map((r) => r.value),
        linhaVisivel: (() => { const l = document.querySelector('#linha-ajuste');
          return !!(l && l.getBoundingClientRect().height > 0); })(),
      }));
      provar('«precisou de ajuste» tem o padrão NÃO, como ela pediu',
        JSON.stringify(ajuste.marcado) === JSON.stringify(['nao']), ajuste.marcado);
      provar('…e com «não», o campo do que foi ajustado não ocupa a tela',
        ajuste.linhaVisivel === false);

      await pagina.click('input[name="captura-ajuste"][value="sim"]');
      await new Promise((r) => setTimeout(r, 120));
      const depois = await pagina.evaluate(() => {
        const l = document.querySelector('#linha-ajuste');
        const h = l && l.getBoundingClientRect().height;
        const t = document.querySelector('#captura-ajustes');
        const a = t && t.previousElementSibling;
        return { visivel: !!h, altura: Math.round(h || 0),
          vaoDoRotulo: (t && a) ? Math.round(t.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : null };
      });
      provar('…e com «sim», ele aparece', depois.visivel === true && depois.altura > 40, depois);
      provar('o rótulo e a caixa do ajuste não estão colados',
        depois.vaoDoRotulo !== null && depois.vaoDoRotulo >= 4, depois.vaoDoRotulo);
      await pagina.click('input[name="captura-ajuste"][value="nao"]');
      await new Promise((r) => setTimeout(r, 120));
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nC. a escrita obrigatória é uma só');
    {
      const obrig = await pagina.evaluate(() => {
        const t = document.querySelector('#captura-texto');
        const campo = t && t.closest('.linha');
        return { existe: !!t, texto: campo ? campo.textContent.replace(/\s+/g, ' ').trim().slice(0, 200) : '' };
      });
      provar('«o que aconteceu de novo» continua a ser escrito', obrig.existe === true);
      provar('…e o texto diz que é obrigatório',
        /Obrigat[óo]rio/i.test(obrig.texto), obrig.texto);
      const textareas = await pagina.$$eval('#captura-campos textarea', (ts) => ts.map((t) => t.id));
      provar('sobraram DUAS áreas de texto no painel (o que aconteceu e o ajuste), e não três',
        textareas.length === 2 && textareas.includes('captura-texto') && textareas.includes('captura-ajustes'),
        textareas);
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nD. o que o formulário grava — `observado` por eixo, e o validador aceita');
    {
      // Preenche o que é obrigatório, marca dois itens e recolhe o payload do próprio formulário.
      await pagina.type('#captura-texto', 'A turma chegou cansada; o apoio apareceu no fim.');
      await pagina.click('input[name="captura-surpreendeu"][value="sim"]');
      await pagina.evaluate(() => {
        const po = document.querySelector('#captura-campos .observado');
        const selects = po.querySelectorAll('select');
        selects[0].value = 'ok'; selects[0].dispatchEvent(new Event('change', { bubbles: true }));
        if (selects[1]) { selects[1].value = 'parcial'; selects[1].dispatchEvent(new Event('change', { bubbles: true })); }
        document.querySelector('#captura-animo').value = '4';
        document.querySelector('#captura-interesse').value = '4';
        document.querySelector('#captura-harmonia').value = '5';
      });
      const payload = await pagina.evaluate((d) => {
        window.__dadosDeProva = d;
        const r = coletarCaptura(d);
        // `coletarCaptura` é do escopo do `<script>` clássico: existe no global.
        return { faltando: r.faltando, aula: r.aula };
      }, { ciclo: ciclo.id, escola: 'calango', aulas: {}, apelidos });

      provar('com o obrigatório preenchido, nada falta', payload.faltando.length === 0, payload.faltando);
      const obs = payload.aula && payload.aula.observado;
      provar('o payload leva `observado` com os três eixos',
        obs && ['corpo', 'tecnica', 'poiesis'].every((k) => Array.isArray(obs[k]) && obs[k].length),
        obs && Object.keys(obs));
      provar('cada item leva o TEXTO que o professor leu e a marca que ele deu',
        obs && obs.corpo[0] && typeof obs.corpo[0].item === 'string' && obs.corpo[0].item.trim()
          && obs.corpo[0].marca === 'ok' && obs.corpo[1] && obs.corpo[1].marca === 'parcial',
        obs && obs.corpo && obs.corpo.slice(0, 2));
      provar('«surpreendeu» foi para o JSON como marca, e não como prosa',
        payload.aula.relatorio.surpresas === 'sim', payload.aula.relatorio.surpresas);
      provar('sem ajuste, `ajustes` sai vazio', payload.aula.relatorio.ajustes === '',
        payload.aula.relatorio.ajustes);
      provar('o «o que aconteceu de novo» é o texto escrito',
        /cansada/.test(payload.aula.relatorio.texto), payload.aula.relatorio.texto);

      // O VALIDADOR DO JSON — a mesma porta por onde o arquivo passa antes do commit.
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prova-form-'));
      const arq = path.join(tmp, 'ciclo-01-prova-dados.json');
      // A raiz completa: o validador exige `professor`, `criado_em` e `_nota` — a mesma raiz que
      // o gravador escreve. Sem eles a prova mediria a fixture, e não o formulário.
      fs.writeFileSync(arq, JSON.stringify({ ciclo: ciclo.id, escola: 'calango',
        professor: ciclo.professor, criado_em: '2026-11-06T10:00',
        apelidos, aulas: { [aulaDaProva.n]: payload.aula },
        _nota: 'fixture da prova do formulario' }, null, 2) + '\n');
      let saida = '', codigo = 0;
      try {
        saida = execSync(`node tools/validar-dados-ciclo.js ${JSON.stringify(arq)}`,
          { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      } catch (e) { codigo = e.status || 1; saida = String((e.stdout || '') + (e.stderr || '')); }
      fs.rmSync(tmp, { recursive: true, force: true });
      provar('o JSON que o formulário monta passa no validar-dados-ciclo.js',
        codigo === 0 && !/\berro\b/i.test(saida), { codigo, saida: saida.trim().split('\n').slice(-6) });
      provar('…e o validador reconhece as marcas dos eixos (não as denuncia)',
        !/observado/.test(saida), saida.trim().split('\n').filter((l) => /observado/.test(l)));
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nE. a página não estoura, em 1280 e em 390');
    for (const [largura, altura] of [[1280, 900], [390, 844]]) {
      await pagina.setViewport({ width: largura, height: altura });
      await new Promise((r) => setTimeout(r, 200));
      const m = await pagina.evaluate(() => ({
        estouro: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        fonte: getComputedStyle(document.body).fontSize,
      }));
      provar(`a ${largura}px não há estouro horizontal`, m.estouro === 0, m.estouro);
    }

    provar('a página não deu erro de JavaScript', erros.length === 0, erros.slice(0, 3));
  } finally {
    await navegador.close();
    srv.close();
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: os itens da marcação são os do PO nos três '
    + 'eixos, «surpreendeu» e «precisou de ajuste» são marcas (com o padrão NÃO no ajuste), a '
    + 'escrita obrigatória é uma só, o payload passa no validador com `observado` por eixo, e a '
    + 'página não estoura a 1280 nem a 390.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
