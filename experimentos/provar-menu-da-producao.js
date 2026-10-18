#!/usr/bin/env node
'use strict';

/**
 * provar-menu-da-producao.js — o menu da Produção no celular é uma FOLHA, e ela abre.
 *
 * Por que existe (18/10/2026). No celular, os três grupos e os sete destinos da Produção
 * viravam uma fita de 80px que quebrava sozinha, com o título do grupo e o link no MESMO
 * peso visual: «não consigo entender direito o que é título do menu», nas palavras de quem
 * usa. A opção escolhida foi a folha inferior — uma linha com o grupo e a página em que se
 * está, e um botão «Seções» que sobe a lista.
 *
 * Isso NÃO SE MEDE NO HTML. Uma folha é um elemento posicionado que se move; o que se prova
 * é a GEOMETRIA — onde a lista está antes e depois do clique — e o ESTADO que a tela
 * declara (`data-aberta`, `aria-expanded`) e que um leitor de tela lê.
 *
 * O que se prova, em 390px e em 1280px:
 *
 *   1. em tela larga, a folha e o véu não aparecem, e a coluna do menu continua sendo a de
 *      sempre (o `display: none` das peças novas);
 *   2. no celular, a barra aparece, e a lista está FORA da tela antes do clique
 *      (`bottom` maior que a altura da janela) — não basta estar opaca;
 *   3. clicar em «Seções» sobe a lista para dentro da tela e vira `aria-expanded`;
 *   4. clicar num destino TROCA a secção visível, marca o link, atualiza o rótulo da barra
 *      e FECHA a folha;
 *   5. `Escape` fecha; e a rolagem do fundo volta ao normal quando ela fecha (o
 *      `overflow:hidden` do `body` não pode ficar preso);
 *   6. a barra diz o GRUPO e a PÁGINA — «Curadorias» sozinho não diz que é de Pedagogia.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `motor/` de `HEAD` com `git archive` e
 * roda as MESMAS provas. A página de antes não tem o botão nem a folha: se passasse, não
 * estaria provando nada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-menu-da-producao.js
 *   node experimentos/provar-menu-da-producao.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');

/** O contexto que a página espera para montar a barra do topo. */
const CONTEXTO = { professor: 'tiago-menegaz', ciclo: '01', query: 'professor=tiago-menegaz&escola=valse&ciclo=01' };

/**
 * A página, montada pelo MÓDULO de verdade. Os argumentos são os mesmos que a rota passa:
 * dono e slug, e listas de professores, alunas, turmas, curadorias e rubricas — vazias,
 * porque o que se mede aqui é a navegação, não as listas.
 */
function pagina(motor) {
  const b = require(path.join(motor, 'servidor/bastidores.js'));
  return b.paginaProducao('valse', CONTEXTO, [], [], 'Tiago Menegaz', 'tiago-menegaz', [], [], [], [], [], []);
}

function servir(html) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      // `no-store`: sem ele o Chrome reaproveita a página entre navegações e o controle
      // negativo serve a página NOVA jurando que é a velha.
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) return ok('text/css; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    if (caminho.endsWith('/assets/nav.js')) return ok('text/javascript', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

/* A leitura no navegador: onde a folha está, e o que a tela declara. */
function estado() {
  const nav = document.querySelector('.lateral');
  const lista = document.getElementById('lateral-lista');
  const barra = document.querySelector('.lateral-barra');
  const veu = document.getElementById('lateral-veu');
  const q = (e) => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) }; };
  const visivel = (e) => Boolean(e) && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
  return {
    janela: window.innerHeight,
    aberta: nav ? nav.getAttribute('data-aberta') : null,
    expandido: (document.getElementById('lateral-abrir') || {}).getAttribute
      ? document.getElementById('lateral-abrir').getAttribute('aria-expanded') : null,
    barraVisivel: visivel(barra),
    lista: lista ? q(lista) : null,
    listaVisivel: visivel(lista),
    // O VÉU É MEDIDO POR DOIS LADOS, e os dois são necessários: `opacity` só diz se ele
    // está translúcido, e `display: none` já devolve `opacity: 1` — foi assim que a
    // primeira versão desta prova reprovou a tela larga (o véu «opaco» que não existe).
    veuOpaco: veu ? getComputedStyle(veu).opacity : null,
    veuDisplay: veu ? getComputedStyle(veu).display : null,
    grupo: (document.getElementById('lateral-grupo') || {}).textContent || null,
    nome: (document.getElementById('lateral-nome') || {}).textContent || null,
    secaoVisivel: (() => {
      const s = [...document.querySelectorAll('.secao')].filter((x) => !x.hidden);
      return s.length === 1 ? s[0].id.replace('sec-', '') : s.map((x) => x.id);
    })(),
    ativo: (() => { const a = document.querySelector('.lateral a.ativo'); return a ? a.getAttribute('data-secao') : null; })(),
    overflowBody: document.body.style.overflow || '',
  };
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-menu-da-producao: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-menu-da-producao: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const negativo = process.argv.includes('--controle-negativo');
  let motor = path.join(raiz, 'motor');
  if (negativo) {
    // O CÓDIGO DE ANTES, extraído do commit — não uma cópia editada à mão.
    //
    // VÃO TRÊS PASTAS, e cada uma foi descoberta por um `require` que estourou:
    //   · `motor/`      — o que se está a provar;
    //   · `biblioteca/` — o `catalogo-seed.js` lê o vocabulário por caminho relativo;
    //   · `tools/templates/` — a barra do topo (`nav-html.js`) mora lá, e o motor a importa.
    // Extrair só o motor parece suficiente e não é: o controle negativo morre no `require`,
    // antes de medir o que quer que seja.
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'motor-producao-'));
    execSync('git archive HEAD motor biblioteca tools/templates | tar -x -C ' + destino, { cwd: raiz, stdio: 'pipe' });
    motor = path.join(destino, 'motor');
    // E O MÓDULO DE ANTES NÃO EXPORTAVA a página — a exportação nasceu com esta prova.
    // Sem isto, o controle negativo não corre: ele estoura no `require`, e um controle que
    // não roda não diz nada. Acrescentar a linha num ARQUIVO COPIA (nunca no repositório)
    // é o que permite ao código velho chegar à mesma bancada.
    const fonte = path.join(motor, 'servidor/bastidores.js');
    fs.appendFileSync(fonte, '\nmodule.exports.paginaProducao = paginaProducao;\n');
    console.log('CONTROLE NEGATIVO — o motor de HEAD (antes da folha inferior)\n');
  }

  const html = pagina(motor);
  const { srv, base } = await servir(html);
  const navegador = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let ok = 0;
  let ko = 0;
  const provar = (rotulo, condicao, detalhe) => {
    if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
    else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
  };
  /**
   * Clicar PODE falhar, e falhar tem de CONTAR. No controle negativo o botão não existe;
   * uma exceção do puppeteer derrubaria a prova inteira, e o que se quer é uma linha
   * vermelha a dizer exatamente o que falta. Devolve `false` quando o elemento não está.
   */
  const clicar = async (p, seletor) => {
    const el = await p.$(seletor);
    if (!el) return false;
    await el.click();
    await new Promise((x) => setTimeout(x, 320));
    return true;
  };
  const abrir = async (largura) => {
    const p = await navegador.newPage();
    await p.setViewport({ width: largura, height: 760 });
    await p.goto(base + '/bastidores/producao', { waitUntil: 'networkidle0', timeout: 60000 });
    for (let i = 0; i < 6; i += 1) await new Promise((r) => setTimeout(r, 60));
    return p;
  };

  // ---------------------------------------------------------------- 1) tela larga
  console.log('\ntela larga (1280px) — nada disto aparece, o menu é a coluna de sempre');
  {
    const p = await abrir(1280);
    const r = await p.evaluate(estado);
    provar('a barra do celular está oculta', r.barraVisivel === false, r.barraVisivel);
    provar('o véu não existe (display: none)', r.veuDisplay === 'none', r.veuDisplay);
    provar('a lista do menu continua visível, como coluna',
      r.listaVisivel === true && Boolean(r.lista) && r.lista.h > 100,
      { visivel: r.listaVisivel, altura: r.lista && r.lista.h });
    provar('e o menu abre já na secção do hash', r.ativo === 'painel', r.ativo);
    await p.close();
  }

  // ---------------------------------------------------------------- 2) celular
  console.log('\ncelular (390px) — a folha abre, navega e fecha');
  {
    const p = await abrir(390);

    // 2a) repouso: a lista está FORA da tela, não apenas transparente
    let r = await p.evaluate(estado);
    provar('a barra do celular aparece', r.barraVisivel === true, r.barraVisivel);
    provar('existe a lista que vira folha (`#lateral-lista`)', Boolean(r.lista), r.lista);
    provar('a lista está FORA da tela antes do clique (topo abaixo da janela)',
      Boolean(r.lista) && r.lista.top >= r.janela - 1,
      { topo: r.lista && r.lista.top, janela: r.janela });
    provar('o estado é «fechada»', r.aberta === 'nao' && r.expandido === 'false',
      { aberta: r.aberta, expandido: r.expandido });
    provar('a barra diz o grupo e a página',
      r.grupo === 'Produção' && r.nome === 'Painel inicial', { grupo: r.grupo, nome: r.nome });

    // 2b) abrir
    const abriu = await clicar(p, '#lateral-abrir');
    provar('existe o botão «Seções»', abriu === true, abriu);
    r = await p.evaluate(estado);
    provar('clicar em «Seções» traz a folha para dentro da tela',
      Boolean(r.lista) && r.lista.bottom <= r.janela + 1 && r.lista.top < r.janela,
      { topo: r.lista && r.lista.top, base: r.lista && r.lista.bottom, janela: r.janela });
    provar('o estado passa a «aberta» e o `aria-expanded` a true',
      r.aberta === 'sim' && r.expandido === 'true', { aberta: r.aberta, expandido: r.expandido });
    provar('o véu aparece', r.veuDisplay !== 'none' && Number(r.veuOpaco) > 0.2,
      { display: r.veuDisplay, opacidade: r.veuOpaco });
    provar('a rolagem do fundo fica travada', r.overflowBody === 'hidden', r.overflowBody);

    // 2c) navegar: um destino de OUTRO grupo (o pior caso do rótulo)
    const foi = await clicar(p, '.lateral-lista a[data-secao="curadorias"]');
    provar('existe o destino «Curadorias» na folha', foi === true, foi);
    r = await p.evaluate(estado);
    provar('o destino escolhido passa a ser a secção visível', r.secaoVisivel === 'curadorias', r.secaoVisivel);
    provar('o link fica marcado como ativo', r.ativo === 'curadorias', r.ativo);
    provar('a folha FECHA ao escolher', r.aberta === 'nao' && r.expandido === 'false',
      { aberta: r.aberta, expandido: r.expandido });
    provar('a barra passa a dizer o grupo e a página do destino',
      r.grupo === 'Pedagogia' && r.nome === 'Curadorias', { grupo: r.grupo, nome: r.nome });
    provar('a rolagem do fundo volta ao normal', r.overflowBody === '', r.overflowBody);
    provar('e a folha volta para fora da tela',
      Boolean(r.lista) && r.lista.top >= r.janela - 1,
      { topo: r.lista && r.lista.top, janela: r.janela });

    // A PÁGINA COMEÇA NA SECÇÃO, E NÃO EM «PRODUÇÃO» (18/10/2026). O `<h1>` e a
    // apresentação estavam acima de TODAS as secções, e quem abria «Curadorias» lia
    // «Produção · O gabinete da direção…» antes do que tinha ido ver. Eles desceram para
    // dentro do portão (só o login os mostra); a secção abre pelo seu próprio `<h2>`.
    const topo = await p.evaluate(() => {
      const visivel = (e) => Boolean(e) && getComputedStyle(e).display !== 'none'
        && e.getBoundingClientRect().height > 1;
      const sec = [...document.querySelectorAll('#conteudo > section')].filter((s) => !s.hidden)[0];
      return {
        tituloDaSecao: sec ? (sec.querySelector('h2') || {}).textContent : null,
        primeiroFilho: sec ? (sec.firstElementChild || {}).tagName : null,
        tituloNoPrincipal: visivel(document.querySelector('.principal > h1')),
        h1ParaLeitorDeEcra: Boolean(document.querySelector('#conteudo > h1.so-leitor')),
        h1NoPortao: Boolean(document.querySelector('#gate h1')),
      };
    });
    provar('a secção visível abre pelo seu próprio título',
      topo.tituloDaSecao === 'Curadorias' && topo.primeiroFilho === 'H2', topo);
    provar('…e NÃO há «Produção» visível acima dela', topo.tituloNoPrincipal === false, topo.tituloNoPrincipal);
    provar('…mas o `h1` continua na árvore, invisível, para o leitor de ecrã',
      topo.h1ParaLeitorDeEcra === true, topo.h1ParaLeitorDeEcra);
    provar('…e o título do portão (só o login o vê) fica onde estava',
      topo.h1NoPortao === true, topo.h1NoPortao);

    // 2d) Escape fecha
    await clicar(p, '#lateral-abrir');
    await p.keyboard.press('Escape');
    await new Promise((x) => setTimeout(x, 320));
    r = await p.evaluate(estado);
    provar('`Escape` fecha a folha e libera a rolagem',
      r.aberta === 'nao' && r.overflowBody === '', { aberta: r.aberta, overflow: r.overflowBody });

    await p.close();
  }

  await navegador.close();
  srv.close();
  console.log('\n' + (negativo ? 'controle negativo: ' : '') +
    'provar-menu-da-producao: ' + ok + ' de ' + (ok + ko) + ' passaram');
  process.exit(ko ? 1 : 0);
})();
