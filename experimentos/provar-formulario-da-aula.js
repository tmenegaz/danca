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
 * A MATRIZ (06/11/2026, a segunda volta do mesmo dia). Ela viu o formulário pronto e disse o que
 * faltava:
 *
 *   «a gente tem que elaborar um outro modelo onde a parte de cima a gente tem por linha os alunos
 *    e por coluna a gente precisa acrescentar outras colunas […] Eu não tenho essa linha de base
 *    orientada por aluno e eu preciso ter isso.»
 *
 * O QUE SE PROVA AQUI, e cada item corresponde a uma frase dela:
 *
 *   A. a matriz: as linhas são as alunas e as colunas são os aspectos — os quatro do corpo (que
 *      não tinham coluna nenhuma), os objectivos da técnica com os três espaços como colunas, e os
 *      da poiesis com os dois dela. 14 marcas por aluna, e todas com dono;
 *   B. «O plano foi seguido?» é UMA pergunta de três estados (sim / em parte / não) com um texto —
 *      as duas perguntas que diziam a mesma coisa deixaram de existir;
 *   C. a escrita obrigatória é uma só quando o plano é seguido — «o que aconteceu de novo»;
 *   D. o payload passa no `validar-dados-ciclo.js`, a linha de base vai por aluna, e uma marca
 *      fora do vocabulário é recusada (inclusive ali, que até hoje passava sem ser olhado);
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
      return c && !c.hidden && document.querySelector('#captura-campos details.eixo');
    }, { timeout: 15000 });

    // ----------------------------------------------------------------------------------------
    console.log('A. A matriz — as linhas são as alunas, as colunas são os aspectos');
    {
      const eixos = await pagina.$$eval('#captura-campos details.eixo > summary',
        (ss) => ss.map((x) => x.textContent.replace(/\s+/g, ' ').trim().split(' — ')[0]));
      provar('os três eixos aparecem, e nesta ordem: Corpo, Técnica, Poiesis',
        JSON.stringify(eixos) === JSON.stringify(['Corpo', 'Técnica', 'Poiesis']), eixos);

      /* A MATRIZ COMO ELA ESTÁ NA TELA: por eixo, as tabelas, o objectivo de cada uma (quando o
       * há) e as colunas. */
      const matriz = await pagina.evaluate(() => {
        const out = {};
        document.querySelectorAll('#captura-campos details.eixo').forEach((d) => {
          const nome = d.querySelector('summary').textContent.split('—')[0].trim();
          out[nome] = [...d.querySelectorAll('table')].map((t) => {
            const antes = t.previousElementSibling;
            return {
              objectivo: (antes && antes.classList.contains('matriz-objectivo')) ? antes.textContent.trim() : null,
              colunas: [...t.querySelectorAll('tr')[0].children].slice(1).map((c) => c.textContent.trim()),
              alunas: [...t.querySelectorAll('tr')].slice(1).map((tr) => tr.querySelector('th').textContent.trim()),
              selects: t.querySelectorAll('select').length,
            };
          });
        });
        return out;
      });

      // O QUE O PO DECLARA, eixo a eixo: os itens (sem repetir) e as dimensões onde aparecem.
      const doPo = { 'Corpo': { itens: [], dimensoes: [] }, 'Técnica': { itens: [], dimensoes: [] },
        'Poiesis': { itens: [], dimensoes: [] } };
      const eixoDe = { Corpo: 'Corpo', Tecnica: 'Técnica', Poiesis: 'Poiesis' };
      for (const d of PO.itensPorDimensao || []) {
        const e = eixoDe[String(d.eixo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')];
        if (!e) continue;
        if (d.dimensao && !doPo[e].dimensoes.includes(d.dimensao)) doPo[e].dimensoes.push(d.dimensao);
        for (const bruto of String(d.itens || '').split(';')) {
          const item = bruto.trim();
          if (!item || AUSENCIA.test(item)) continue;
          if (!doPo[e].itens.some((x) => x.toLowerCase() === item.toLowerCase())) doPo[e].itens.push(item);
        }
      }

      /* O CORPO: uma tabela, e as colunas são os quatro aspectos do recorte. Era o que faltava — a
       * linha de base revisitada estava morta, e o corpo não tinha coluna nenhuma. */
      const corpo = matriz['Corpo'] || [];
      provar('o Corpo é UMA tabela, com uma coluna por aspecto do recorte',
        corpo.length === 1 && JSON.stringify(corpo[0].colunas) === JSON.stringify(doPo['Corpo'].itens),
        { naTela: corpo[0] && corpo[0].colunas, noPo: doPo['Corpo'].itens });
      provar('as linhas do Corpo são as duas alunas do elenco',
        corpo[0] && JSON.stringify(corpo[0].alunas) === JSON.stringify(['Aluna A', 'Aluna B']),
        corpo[0] && corpo[0].alunas);
      provar('«sem restrições declaradas» NÃO é oferecido como aspecto a marcar',
        !(corpo[0] || { colunas: [] }).colunas.some((c) => AUSENCIA.test(c)),
        (corpo[0] || { colunas: [] }).colunas.filter((c) => AUSENCIA.test(c)));

      /* A TÉCNICA E A POIESIS: uma tabela por objectivo, e as DIMENSÕES como colunas. É a
       * inversão que mata a repetição — o objectivo estava escrito como coluna em cinco tabelas
       * (seis perguntas iguais por aluna) e passa a ser o título de uma tabela; as dimensões
       * estavam escritas como títulos e passam a ser as colunas. */
      const tecnica = matriz['Técnica'] || [];
      provar('a Técnica tem uma tabela por objectivo, e o objectivo é o título',
        tecnica.length === doPo['Técnica'].itens.length
          && JSON.stringify(tecnica.map((t) => t.objectivo)) === JSON.stringify(doPo['Técnica'].itens),
        { naTela: tecnica.map((t) => t.objectivo), noPo: doPo['Técnica'].itens });
      provar('…e as colunas da Técnica são os três espaços onde o PO a observa',
        tecnica.length > 0
          && tecnica.every((t) => JSON.stringify(t.colunas) === JSON.stringify(['Solo', 'Barra', 'Centro'])),
        tecnica.map((t) => t.colunas));
      const poiesis = matriz['Poiesis'] || [];
      provar('a Poiesis tem as dimensões dela como colunas: Musicalidade e Expressão',
        poiesis.length === doPo['Poiesis'].itens.length
          && poiesis.every((t) => JSON.stringify(t.colunas) === JSON.stringify(['Musicalidade', 'Expressão'])),
        poiesis.map((t) => t.colunas));

      /* E O NÚMERO: cada célula tem dono. 4 do corpo + 6 da técnica + 4 da poiesis, por aluna. */
      const todasAsTabelas = [].concat(corpo, tecnica, poiesis);
      const porAluna = todasAsTabelas.reduce((n, t) => n + t.selects / Math.max(t.alunas.length, 1), 0);
      provar('as marcas por aluna são 14 — e cada uma é de uma aluna (antes: 20, e 8 sem dono)',
        porAluna === 14, porAluna);
      const totalNaTela = await pagina.$$eval('#captura-campos details.eixo select', (x) => x.length);
      provar('…e todas as células da matriz são um controle na tela (2 alunas × 14)',
        totalNaTela === 28, totalNaTela);

      provar('o eixo que ainda não tem marca abre fechado, e o Corpo — a âncora — abre aberto',
        await pagina.evaluate(() => {
          const d = [...document.querySelectorAll('#captura-campos details.eixo')];
          return d[0].open === true && d.slice(1).every((x) => x.open === false);
        }));
      provar('o sumário de cada eixo diz quantas marcas tem lá dentro',
        await pagina.$$eval('#captura-campos details.eixo > summary',
          (ss) => ss.every((x) => /\d+ de \d+ marcados/.test(x.textContent))));
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nB. «O plano foi seguido?» — uma pergunta, três estados, um texto');
    {
      const antes = await pagina.evaluate(() => ({
        plano: [...document.querySelectorAll('input[name="captura-plano"]')].map((r) => r.value),
        marcado: [...document.querySelectorAll('input[name="captura-plano"]')]
          .filter((r) => r.checked).map((r) => r.value),
        surpresa: [...document.querySelectorAll('input[name="captura-surpreendeu"]')].map((r) => r.value),
        surpresaMarcada: [...document.querySelectorAll('input[name="captura-surpreendeu"]')]
          .filter((r) => r.checked).length,
        mudouVisivel: (() => { const l = document.querySelector('#linha-mudou');
          return !!(l && l.getBoundingClientRect().height > 0); })(),
        selectAntigo: (() => { const x = document.querySelector('#captura-plano');
          return !!(x && x.tagName === 'SELECT'); })(),
        ajusteAntigo: document.querySelectorAll('input[name="captura-ajuste"]').length,
        ajustesAntigo: !!document.querySelector('#captura-ajustes'),
      }));
      provar('a pergunta tem TRÊS estados: sim, em parte, não',
        JSON.stringify(antes.plano) === JSON.stringify(['sim', 'parcial', 'nao']), antes.plano);
      provar('…e nasce em «sim» (o caso comum), com o texto escondido',
        JSON.stringify(antes.marcado) === JSON.stringify(['sim']) && antes.mudouVisivel === false,
        { marcado: antes.marcado, visivel: antes.mudouVisivel });
      provar('o select do topo deixou de existir', antes.selectAntigo === false);
      provar('«Precisou de ajuste?» deixou de existir — era a mesma pergunta duas vezes',
        antes.ajusteAntigo === 0 && antes.ajustesAntigo === false,
        { radios: antes.ajusteAntigo, campo: antes.ajustesAntigo });
      provar('«surpreendeu» continua a ser um par de marcas, e nenhuma escolhida ao abrir',
        JSON.stringify(antes.surpresa) === JSON.stringify(['sim', 'nao'])
          && antes.surpresaMarcada === 0, antes.surpresa);

      await pagina.click('input[name="captura-plano"][value="parcial"]');
      await new Promise((r) => setTimeout(r, 150));
      const depois = await pagina.evaluate(() => {
        const l = document.querySelector('#linha-mudou');
        const t = document.querySelector('#captura-mudou');
        const a = t && t.previousElementSibling;
        return {
          visivel: !!(l && l.getBoundingClientRect().height > 0),
          vao: (t && a) ? Math.round(t.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : null,
        };
      });
      provar('…e com «em parte» o texto do que mudou aparece', depois.visivel === true, depois);
      provar('o rótulo e a caixa do texto não estão colados',
        depois.vao !== null && depois.vao >= 4, depois.vao);
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nC. A escrita: uma só quando o plano é seguido');
    {
      const escrever = await pagina.evaluate(() => {
        const t = document.querySelector('#captura-texto');
        return {
          existe: !!t,
          obriga: t ? /Obrigat[óo]rio/i.test(t.closest('.linha').textContent) : false,
        };
      });
      provar('«o que aconteceu de novo» existe e diz-se obrigatório',
        escrever.existe === true && escrever.obriga === true, escrever);
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nD. O que o formulário grava — a matriz nos blocos da folha');
    {
      await pagina.type('#captura-texto', 'A turma chegou cansada; o apoio apareceu no fim.');
      await pagina.type('#captura-mudou', 'encurtei o centro em dez minutos');
      await pagina.click('input[name="captura-surpreendeu"][value="sim"]');
      await pagina.evaluate(() => {
        // A PRIMEIRA CÉLULA DE CADA EIXO — o Corpo abre aberto; os outros dois, para marcar, abrem-se.
        document.querySelectorAll('#captura-campos details.eixo').forEach((d) => { d.open = true; });
        const s = document.querySelectorAll('#captura-campos details.eixo select');
        s[0].value = 'ok'; s[0].dispatchEvent(new Event('change', { bubbles: true }));
        s[1].value = 'parcial'; s[1].dispatchEvent(new Event('change', { bubbles: true }));
        document.querySelector('#captura-animo').value = '4';
        document.querySelector('#captura-interesse').value = '4';
        document.querySelector('#captura-harmonia').value = '5';
      });
      const payload = await pagina.evaluate((d) => {
        const r = coletarCaptura(d);
        return { faltando: r.faltando, aula: r.aula };
      }, { ciclo: ciclo.id, escola: 'calango', aulas: {}, apelidos });

      provar('com o obrigatório preenchido, nada falta', payload.faltando.length === 0, payload.faltando);
      const base = payload.aula && payload.aula.linha_de_base;
      provar('a linha de base é gravada POR ALUNA, com os quatro aspectos do PO',
        !!(base && Array.isArray(base.aluna_a) && base.aluna_a.length === 4
          && base.aluna_a.every((x) => x.item && typeof x.marca === 'string')),
        base && base.aluna_a && base.aluna_a.map((x) => x.marca));
      provar('…e as marcas que o professor deu estão lá, na ordem do PO',
        !!(base && base.aluna_a[0] && base.aluna_a[0].marca === 'ok'
          && base.aluna_a[1] && base.aluna_a[1].marca === 'parcial'),
        base && base.aluna_a && base.aluna_a.slice(0, 2));
      provar('os blocos da técnica continuam por aluna e por espaço',
        !!(payload.aula.solo && payload.aula.solo.aluna_a
          && Object.keys(payload.aula.solo.aluna_a).length === 2),
        payload.aula.solo && Object.keys(payload.aula.solo.aluna_a || {}));
      provar('o bloco `observado` (sem aluna) deixou de ser escrito',
        payload.aula.observado === undefined, Object.keys(payload.aula));
      provar('o plano seguido saiu do rádio, e o texto foi para `mudou`',
        payload.aula.condicoes_contorno.plano_seguido === 'parcial'
          && /encurtei/.test(payload.aula.condicoes_contorno.mudou),
        payload.aula.condicoes_contorno);
      provar('…e `relatorio.ajustes` é o MESMO texto (o caderno imprime-o em «O que decidi»)',
        payload.aula.relatorio.ajustes === payload.aula.condicoes_contorno.mudou,
        { ajustes: payload.aula.relatorio.ajustes, mudou: payload.aula.condicoes_contorno.mudou });
      provar('«surpreendeu» foi para o JSON como marca',
        payload.aula.relatorio.surpresas === 'sim', payload.aula.relatorio.surpresas);
      provar('o «o que aconteceu de novo» é o texto escrito',
        /cansada/.test(payload.aula.relatorio.texto), payload.aula.relatorio.texto);

      // O VALIDADOR DO JSON — a mesma porta por onde o arquivo passa antes do commit.
      const raizDoJson = JSON.stringify({
        ciclo: ciclo.id, escola: 'calango', professor: ciclo.professor,
        criado_em: '2026-11-06T10:00', apelidos,
        aulas: { [aulaDaProva.n]: payload.aula }, _nota: 'fixture da prova do formulario',
      }, null, 2) + '\n';
      const correr = (conteudo) => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prova-form-'));
        const arq = path.join(tmp, 'ciclo-01-prova-dados.json');
        fs.writeFileSync(arq, conteudo);
        let saida = '', codigo = 0;
        try {
          saida = execSync(`node tools/validar-dados-ciclo.js ${JSON.stringify(arq)}`,
            { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
        } catch (e) { codigo = e.status || 1; saida = String((e.stdout || '') + (e.stderr || '')); }
        fs.rmSync(tmp, { recursive: true, force: true });
        return { codigo, saida };
      };
      const bom = correr(raizDoJson);
      provar('o JSON que o formulário monta passa no validar-dados-ciclo.js',
        bom.codigo === 0 && !/\berro\b/i.test(bom.saida),
        { codigo: bom.codigo, saida: bom.saida.trim().split('\n').slice(-5) });

      /* A CONTRAPROVA DO VALIDADOR: a marca fora do vocabulário é recusada — inclusive no bloco
       * de itens, que até 06/11/2026 passava sem ser olhado (o valor de cada pessoa é uma lista,
       * e o teste «é um bloco por pessoa» dava-o por conferido). */
      const mau = JSON.parse(raizDoJson);
      mau.aulas[aulaDaProva.n].linha_de_base.aluna_a[0].marca = 'talvez';
      const ruim = correr(JSON.stringify(mau, null, 2) + '\n');
      provar('…e uma marca fora do vocabulário é recusada, mesmo na linha de base',
        ruim.codigo !== 0 && /linha_de_base\.aluna_a\[0\]/.test(ruim.saida),
        ruim.saida.trim().split('\n').filter((l) => /linha_de_base/.test(l)));
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
  console.log('TUDO CERTO — ' + total + ' asserções: a matriz tem as alunas por linha e os '
    + 'aspectos por coluna (4 do corpo + 6 da técnica + 4 da poiesis, por aluna), o corpo ganhou '
    + 'as quatro colunas que lhe faltavam, «o plano foi seguido?» é uma pergunta de três estados, '
    + 'o payload passa no validador com a linha de base por aluna e sem o bloco sem dono, e a '
    + 'página não estoura a 1280 nem a 390.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
