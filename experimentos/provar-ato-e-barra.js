#!/usr/bin/env node
'use strict';

/**
 * provar-ato-e-barra.js — o cabeçalho do ato encolhe direito, e o «Fechar» só existe quando pode.
 *
 * Por que existe (18/10/2026). Quatro coisas mudaram na mesma tela, e nenhuma delas é
 * visível num `grep`:
 *
 *   1. **o controle de recolher cresceu** — a seta vive numa pastilha, o conjunto tem altura
 *      de controle. O que se mede é o RETÂNGULO onde o dedo bate, não a intenção;
 *   2. **no telefone ele nasce fechado** — e a tela grande continua a abri-lo. Se as duas
 *      larguras se comportassem igual, uma delas estaria errada;
 *   3. **a senha aceita não escreve «OK»** — o aceite passou a ser o filete do campo. Um
 *      texto verde por baixo do campo partia a linha do cabeçalho para dizer o que a cor diz;
 *   4. **o «Fechar a elicitação» está escondido** enquanto faltarem obrigatórios, e aparece
 *      quando não faltam. Era um botão desactivado sempre à vista.
 *
 * A bancada serve `porta/index.html` com a folha e o `nav.js` da fonte, e o `/api/mapa` é
 * escolhido pela QUERY: `?sobra=nao` (o caso de todo dia — faltam obrigatórios) e
 * `?sobra=sim` (nada falta). Sem as duas, a prova do «aparece» não seria uma prova.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-ato-e-barra.js
 *   node experimentos/provar-ato-e-barra.js --controle-negativo   # contra `git show HEAD:porta/index.html`
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');
const FONTE_PORTA = path.join(raiz, 'porta/index.html');
const NEGATIVO = process.argv.includes('--controle-negativo');

const PORTA = NEGATIVO
  ? execSync('git show HEAD:porta/index.html', { cwd: raiz, maxBuffer: 64 * 1024 * 1024 }).toString()
  : fs.readFileSync(FONTE_PORTA, 'utf8');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

/**
 * DOIS MAPAS, e é o segundo que prova o «aparece».
 *
 * `sobra=nao` — um nó obrigatório por responder. É o estado de qualquer elicitação a meio:
 * o «Fechar» tem de estar escondido.
 * `sobra=sim` — nenhum nó obrigatório. O «Fechar» tem de estar à vista e desactivado (a
 * senha ainda não foi dada) — e é essa a diferença entre «não existe» e «não se pode».
 */
const MAPA_COM_FALTA = {
  ok: true,
  nos: [{ id: 'familia', campo: 'Família', obrigatorio: true }],
  obrigatorios: 1, respondidas: 0, total: 1, tituloCabecalho: 'Prova',
};
const MAPA_SEM_FALTA = {
  ok: true,
  nos: [{ id: 'familia', campo: 'Família' }],
  obrigatorios: 0, respondidas: 0, total: 0, tituloCabecalho: 'Prova',
};

// O modo da bancada: `abrir()` escreve-o antes de navegar, e o servidor lê-o ao servir o mapa.
let modoSobra = 'nao';

let passou = 0;
let falhou = 0;

function provar(nome, obtido, esperado) {
  const igual = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (igual) {
    passou++;
    console.log('ok     ' + nome + (typeof obtido === 'object' ? '' : ' → ' + JSON.stringify(obtido)));
  } else {
    falhou++;
    console.log('FALHOU ' + nome);
    console.log('  obtido:   ' + JSON.stringify(obtido));
    console.log('  esperado: ' + JSON.stringify(esperado));
  }
}

function servir() {
  const srv = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const caminho = decodeURIComponent(url.pathname);
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    // `/api/mapa` chega com o PREFIXO da fonte (`/anamnese/api/mapa`): o `fetch` é
    // relativo à página, e a porta vive em três subdiretórios. Comparar por `indexOf(…)
    // === 0` não apanhava nenhum deles, e o `mapa` caía no genérico — a página morria com
    // «MAPA.nos is not iterable» e a prova acusava o sintoma errado.
    if (caminho.indexOf('/api/mapa') !== -1) {
      // O MODO VEM DO SERVIDOR, e não da query: o `fetch` do mapa leva `?fonte=`, e não o
      // `sobra` que está no endereço da PÁGINA. Ler `url.searchParams` aqui dava sempre o
      // caso de falta — e a prova do «aparece» passava sem nunca ter aparecido.
      return ok('application/json', JSON.stringify(modoSobra === 'sim' ? MAPA_SEM_FALTA : MAPA_COM_FALTA));
    }
    if (caminho.endsWith('/api/bastidores/professores')) {
      return ok('application/json', JSON.stringify({ ok: true, escola: 'valse',
        professores: [{ nome: 'Tiago Menegaz', slug: 'tiago-menegaz' }] }));
    }
    if (caminho.endsWith('/api/bastidores/alunas')) {
      return ok('application/json', JSON.stringify({ ok: true, alunas: ['Ana'] }));
    }
    // A senha é SEMPRE aceite: o que se prova não é a validação (é do servidor), é o SINAL
    // que a tela dá quando ela passa.
    if (caminho.endsWith('/api/bastidores/validar-senha')) {
      return ok('application/json', JSON.stringify({ ok: true }));
    }
    if (caminho.indexOf('/api/') !== -1) {
      return ok('application/json', JSON.stringify({ ok: true, opcoes: [] }));
    }
    if (caminho.endsWith('/assets/style.css')) {
      return ok(TIPOS['.css'], fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok(TIPOS['.js'], fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    }
    if (caminho.endsWith('/assets/lib-cifra.js')) {
      return ok(TIPOS['.js'], fs.readFileSync(path.join(raiz, 'tools/lib-cifra.js')));
    }
    if (caminho.endsWith('/assets/markdown.js')) {
      return ok(TIPOS['.js'], fs.readFileSync(path.join(raiz, 'porta/assets/markdown.js')));
    }
    return ok(TIPOS['.html'], PORTA);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({
    srv, base: `http://127.0.0.1:${srv.address().port}`,
  })));
}

/** O que a página diz sobre o cabeçalho, medido no navegador. */
const MEDIR_CABECALHO = () => {
  const ato = document.querySelector('details.ctx-ato');
  const sum = ato && ato.querySelector('summary');
  const seta = ato && ato.querySelector('.ctx-seta');
  const caixa = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  };
  const fechar = document.getElementById('fechar');
  return {
    transborda: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    existe: !!sum,
    aberto: ato ? ato.open : null,
    resumo: caixa(sum),
    seta: caixa(seta),
    raioSeta: seta ? getComputedStyle(seta).borderTopLeftRadius : null,
    fonteResumo: sum ? getComputedStyle(sum).fontSize : null,
    fechar: fechar ? {
      escondido: fechar.hidden,
      desactivado: fechar.disabled,
      caixa: caixa(fechar),
    } : null,
  };
};

(async () => {
  const executablePath = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executablePath) {
    console.error('provar-ato-e-barra: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (e) {
    console.error('provar-ato-e-barra: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(1);
  }

  const { srv, base } = await servir();
  const browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await browser.newPage();
  const erros = [];
  pg.on('pageerror', (e) => erros.push(e.message));

  const abrir = async (largura, sobra) => {
    modoSobra = sobra;
    await pg.setViewport({ width: largura, height: 900 });
    await pg.goto(`${base}/anamnese/?professor=tiago-menegaz&escola=valse&ciclo=01&sobra=${sobra}`,
      { waitUntil: 'load' });
    // O boot é assíncrono (busca o mapa, os professores, as alunas): espera-se pela barra.
    await pg.waitForFunction(() => {
      const b = document.getElementById('barra');
      return b && !b.classList.contains('oculto');
    }, { timeout: 8000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 250));
    return pg.evaluate(MEDIR_CABECALHO);
  };

  // --------------------------------------------------------------------------
  // 1. O CONTROLE — altura de dedo, não altura de linha
  // --------------------------------------------------------------------------
  {
    const d = await abrir(1200, 'nao');
    provar('o acordeão do contexto existe', d.existe, true);
    provar('na tela grande ele nasce ABERTO', d.aberto, true);
    provar('o alvo do toque tem pelo menos 44px', d.resumo.h >= 44, true);
    provar('…e a pastilha da seta tem 30px', d.seta, { w: 30, h: 30 });
    provar('…redonda', d.raioSeta, '50%');
    provar('…e o nome do bloco vai a 15px', d.fonteResumo, '15px');
  }

  // --------------------------------------------------------------------------
  // 2. NO TELEFONE NASCE FECHADO — e a tela grande não
  // --------------------------------------------------------------------------
  {
    const d = await abrir(390, 'nao');
    provar('no telefone ele nasce FECHADO', d.aberto, false);
    provar('…e o alvo continua com 44px ou mais', d.resumo.h >= 44, true);
    provar('…e a pastilha não encolhe', d.seta, { w: 30, h: 30 });
    provar('…e a página não estoura na largura', d.transborda, false);

    // Tocar abre — o recolhido é um estado, não uma parede.
    await pg.evaluate(() => {
      const s = document.querySelector('details.ctx-ato > summary');
      if (s) s.click();
    });
    const depois = await pg.evaluate(() => document.querySelector('details.ctx-ato').open);
    provar('…e tocar na faixa abre', depois, true);

    const g = await abrir(1024, 'nao');
    provar('a 1024 (tablet) ainda nasce aberto — o corte é 768', g.aberto, true);
  }

  // --------------------------------------------------------------------------
  // 3. A SENHA ACEITA — filete verde, sem a palavra
  // --------------------------------------------------------------------------
  {
    await abrir(1200, 'nao');
    const antes = await pg.evaluate(() => ({
      caixaOk: !!document.querySelector('.barra .campo-senha.ok'),
      texto: (document.getElementById('senha-status') || {}).textContent || '',
    }));
    provar('antes de digitar, o campo não está marcado', antes.caixaOk, false);
    provar('…e o estado está vazio', antes.texto, '');

    await pg.evaluate(() => {
      const s = document.getElementById('senha');
      s.value = 'segredo';
      s.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await pg.waitForFunction(
      () => !!document.querySelector('.barra .campo-senha.ok'),
      { timeout: 6000 }).catch(() => {});
    // O FILETE TRANSICIONA (`transition: border-color .15s`, na folha). Ler no mesmo
    // instante devolve o valor de PARTIDA — o ouro —, e a prova acusaria um defeito que não
    // existe. Mede-se depois de a transição acabar; é o que o olho vê.
    await new Promise((r) => setTimeout(r, 300));
    const depois = await pg.evaluate(() => {
      const caixa = document.querySelector('.barra .campo-senha');
      const entrada = document.getElementById('senha');
      return {
        caixaOk: !!caixa && caixa.classList.contains('ok'),
        texto: (document.getElementById('senha-status') || {}).textContent || '',
        filete: entrada ? getComputedStyle(entrada).borderTopColor : null,
      };
    });
    provar('a senha aceita marca o campo', depois.caixaOk, true);
    provar('…e NÃO escreve «OK»', depois.texto, '');
    provar('…e o filete fica verde', depois.filete, 'rgb(29, 107, 47)');
  }

  // --------------------------------------------------------------------------
  // 4. O «FECHAR» — escondido enquanto falta, à vista quando não
  // --------------------------------------------------------------------------
  {
    const comFalta = await abrir(1200, 'nao');
    provar('com obrigatório em falta, o «Fechar» está ESCONDIDO', comFalta.fechar.escondido, true);
    provar('…e nem ocupa altura', comFalta.fechar.caixa.h, 0);
    provar('…e continua desactivado (a segunda tranca)', comFalta.fechar.desactivado, true);

    const semFalta = await abrir(1200, 'sim');
    provar('sem obrigatório em falta, o «Fechar» APARECE', semFalta.fechar.escondido, false);

    // E ele tem CORPO onde vive. A altura medida antes disto era 0 porque a condução ainda
    // não estava aberta — o botão existe no DOM desde o início, dentro de `#conducao`, que
    // nasce oculta. Medir um botão numa secção `display:none` mede a secção, não o botão.
    // O CONTEXTO INTEIRO, como o professor o preenche: a aluna é um dos quatro campos da
    // anamnese (`CAMPOS_DO_CONTEXTO`), e sem ela o «Começar» não habilita — a prova estaria a
    // medir uma condução que nunca abriu.
    await pg.evaluate(() => {
      const a = document.getElementById('ctx-aluna');
      if (a) { a.value = 'Ana'; a.dispatchEvent(new Event('change', { bubbles: true })); }
      const s = document.getElementById('senha');
      s.value = 'segredo';
      s.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await pg.waitForFunction(() => !document.getElementById('comecar').disabled, { timeout: 6000 })
      .catch(() => {});
    await pg.click('#comecar').catch(() => {});
    await pg.waitForFunction(() => {
      const c = document.getElementById('conducao');
      return c && !c.classList.contains('oculto');
    }, { timeout: 6000 }).catch(() => {});
    const aberto = await pg.evaluate(() => {
      const f = document.getElementById('fechar');
      const r = f.getBoundingClientRect();
      const c = document.getElementById('conducao');
      return {
        conducaoAberta: !!c && !c.classList.contains('oculto'),
        escondido: f.hidden, altura: Math.round(r.height), largura: Math.round(r.width),
      };
    });
    provar('a condução abre (o «Começar» é o caminho real)', aberto.conducaoAberta, true);
    provar('…e ali o «Fechar» continua à vista', aberto.escondido, false);
    provar('…com altura de botão', aberto.altura >= 32, true);

    // DESPRE-ENCHER FAZ DESAPARECER — o jogo que o dono do produto descreveu. Aqui é o
    // caminho do produto: apagar a única resposta obrigatória (o nó `familia`, que o mapa
    // de teste marca como obrigatório) e ver o botão sair.
    const comFaltaDeNovo = await abrir(1200, 'nao');
    provar('voltar a faltar esconde-o outra vez', comFaltaDeNovo.fechar.escondido, true);
  }

  provar('nenhum erro de JavaScript na página', erros, []);

  await browser.close();
  srv.close();

  console.log('\nprovar-ato-e-barra: ' + passou + ' de ' + (passou + falhou) + ' passaram');
  process.exit(falhou ? 1 : 0);
})().catch((e) => {
  console.error('provar-ato-e-barra quebrou: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
