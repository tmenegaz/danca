#!/usr/bin/env node
'use strict';

/**
 * provar-faixa-do-ato-no-celular.js — o cabeçalho «Contexto do ato», ABERTO, cabe num telefone.
 *
 * O QUE A PESQUISADORA VIU (04/11/2026): «nos formulários do Plano de Observação e do Plano de
 * Ensino, ao clicar para colapsar/expandir o contexto do ato, os campos de texto e informações do
 * cabeçalho (escola, professor, ciclo, turma observada, frequência semanal, duração) ficam
 * totalmente acavalados e sobrepostos, impedindo a leitura e a usabilidade em telas móveis».
 *
 * PORQUE É QUE NENHUMA BANCADA APANHOU ISTO — e é a parte que importa. As que existem medem
 * outra coisa: a `provar-celular` mede a folha da **Produção** (`motor/servidor/bastidores.js`),
 * e a `provar-contexto-do-ato` mede a LÓGICA da faixa num DOM falso (jsdom), que **não calcula
 * geometria**: um elemento pode ter `width: 0` e continuar «presente». Acavalar é sobreposição de
 * caixas, e isso só se vê num motor de layout. Mede-se no Chrome.
 *
 * O QUE ELE MEDE, e é a definição operacional de «acavalado»:
 *   1. nenhum par de campos visíveis se SOBREPÕE (as caixas não se cruzam em X **e** em Y);
 *   2. nenhum campo TRANSBORDA a faixa;
 *   3. o controle cabe DENTRO do seu campo (o `<select>` não é mais largo do que a coluna);
 *   4. a página não transborda na horizontal;
 *   5. nenhum campo fica esmagado (altura de leitura).
 *
 * Mede nas larguras reais de telefone (320 · 360 · 390 · 414) com a barra ABERTA — que é o
 * estado do defeito. Fechada ela não mostra os campos, e medir isso seria medir nada.
 *
 * Requer Chrome/Chromium (o `puppeteer-core` que vem com o marp-cli global), como a
 * `provar-celular`. Sem ele o resultado é declarado NÃO FEITO — nunca um «passou» silencioso.
 *
 *   node experimentos/provar-faixa-do-ato-no-celular.js
 *   CHROME_PATH=/usr/bin/chromium node experimentos/provar-faixa-do-ato-no-celular.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const { mapa } = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const CONTEUDO = JSON.parse(fs.readFileSync(path.join(PORTA, 'po', 'conteudo', 'po.json'), 'utf8'));
const MAPA = mapa(CONTEUDO);

/* O PLANO É O ENVELOPE VERDADEIRO — o da `breu`, lido do acervo (04/11/2026).
 *
 * A primeira versão desta bancada inventava valores curtos («sex · 1x», «45 min») e a geometria
 * passava em tudo. Mas o que ela viu no telefone foram as frases reais do cabeçalho —
 * «Frequência semanal: qua e sex · 2x/semana», «Calendário: 03/03/2027 a 30/06/2027»,
 * «Condição de registro: Na sala: professor, alunas da turma» —, e é o COMPRIMENTO delas que
 * decide se a coluna aguenta. Um stub curto mede um cabeçalho que não existe.
 */
const ENVELOPE = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'escola', 'breu', 'envelopes', 'plano-20261104-1732.json'), 'utf8'));
const PLANO = {
  id: ENVELOPE.id || 'plano-20261104-1732',
  contexto: ENVELOPE.contexto,
  respostas: ENVELOPE.respostas,
};
const TURMA = {
  id: 'bale-nivel-1-teste-3',
  nome: (ENVELOPE.respostas['contexto-turma'] || {}).valor || 'Balé Nível 1 — Teste 3',
  dias: ['qua', 'sex'], horaInicio: '16:30', duracao: 45,
  periodoInicio: '2027-03-03', periodoFim: '2027-06-30',
};

/** As larguras de telefone que se medem — as mesmas da `provar-celular`, com a mais estreita. */
const LARGURAS = [320, 360, 390, 414];

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };

/* O SERVIDOR SERVE A PORTA DE VERDADE. Não é `file://`: a folha é pedida em `/assets/style.css`,
 * caminho absoluto de raiz — em `file://` isso resolve para a raiz do disco, a página abre SEM
 * folha, e medir o desenho dela assim dá «nada transborda» em toda a parte. O silêncio falso é
 * pior do que o alarme falso. */
function servir() {
  const srv = http.createServer((req, res) => {
    /* A PORTA RESPONDE EM TRÊS CAMINHOS (`/anamnese/`, `/plano-ensino/`, `/plano-observacao/`),
     * e o prefixo da frente não é um diretório: é a mesma página. Sem esta linha, o pedido caía
     * em 404 e a bancada media uma página de erro. */
    /* A PORTA TEM CAMINHO CANÓNICO E REDIRECCIONA PARA ELE: quem entra por
     * `/plano-observacao/?…` acaba em `/area-do-professor/plano-de-observacao/`. Os dois
     * prefixos não são diretórios — são a mesma página, e o servidor da bancada tem de servir a
     * mesma página nos dois. Sem isto, o primeiro pedido respondia e o `goto` seguinte caía em
     * 404, e a bancada media uma página de erro a dizer «não encontrado». */
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '')
      .replace(/^area-do-professor\//, '')
      .replace(/^plano-observacao\//, '')
      .replace(/^plano-ensino\//, '')
      .replace(/^anamnese\//, '') || 'index.html';
    const mapa = {
      'assets/style.css': path.join('tools', 'templates', 'ciclo.css'),
      'assets/nav.js': path.join('tools', 'templates', 'nav.js'),
    };
    /* AS RESPOSTAS DO SERVIDOR, stubadas. Sem o MAPA a faixa não se monta; sem o PLANO as
     * quatro leituras (frequência, duração, calendário, nº de aulas) não se desenham — e são
     * exactamente elas que ela viu acavaladas ao lado da turma. Medir o cabeçalho sem elas
     * seria medir um cabeçalho que não existe em produção. */
    const json = (o) => {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify(o));
    };
    if (rel === 'api/mapa') return json(MAPA);
    if (rel === 'api/envelope/' + PLANO.id) return json(PLANO);
    if (rel === 'api/planos') {
      return json({ ok: true, opcoes: [{ valor: PLANO.id, rotulo: 'Plano de teste', carimbo: PLANO.id,
        detalhe: 'api/envelope/' + PLANO.id }] });
    }
    /* A CURADORIA — SEM ELA O PORT NÃO DEIXA PREENCHER. `podePreencher` recusa quando o
     * professor não tem curadoria que o ligue à turma, e o port faz `location.replace` para a
     * lista. A primeira versão desta bancada não a tinha: a página caía em
     * `/area-do-professor/plano-de-observacao/`, o `FONTE` deixava de ser `po` (o caminho
     * canónico não começa por `/plano-observacao/`), e a bancada media a **anamnese** a dizer
     * «passou». Um falso verde é pior do que um vermelho — é o que esta nota existe para não
     * repetir. */
    if (rel.startsWith('api/bastidores/curadoria-professor')) {
      return json({ ok: true, curadorias: [{ id: 'c1', professor: 'prova',
        modalidade: 'Balé clássico', turmas: [TURMA.nome], alunas: ['Aluna A'] }] });
    }
    if (rel.startsWith('api/bastidores/turmas')) {
      return json({ ok: true, turmas: [TURMA], opcoes: [{ valor: TURMA.nome, rotulo: TURMA.nome }] });
    }
    if (rel.startsWith('api/')) return json({ ok: true, opcoes: [], turmas: [TURMA] });

    const tentativas = [mapa[rel], rel, path.join('porta', rel)].filter(Boolean);
    const alvo = tentativas.map((x) => path.join(RAIZ, x))
      .find((x) => x.startsWith(RAIZ) && fs.existsSync(x) && fs.statSync(x).isFile());
    /* O DESCONHECIDO QUE NÃO É ASSET É A PORTA — é o que o Worker faz (uma página, três
     * frentes). Um asset que falta continua a ser 404, para a bancada não medir uma página sem
     * folha e chamar-lhe «nada transborda». */
    if (!alvo) {
      if (!rel.startsWith('assets/')) {
        const pagina = path.join(PORTA, 'index.html');
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end(fs.readFileSync(pagina));
        return;
      }
      res.writeHead(404); res.end('nao encontrado'); return;
    }
    res.writeHead(200, {
      'content-type': TIPOS[path.extname(alvo)] || 'application/octet-stream',
      // `no-store` NÃO É DETALHE: sem ele o Chrome guarda a folha por heurística e a segunda
      // navegação serve o CSS da primeira — o que faz um controle negativo passar.
      'cache-control': 'no-store',
    });
    res.end(fs.readFileSync(alvo));
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1',
    () => ok({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

/* A MEDIÇÃO, feita DENTRO da página. Devolve caixas medidas, e é a partir desses números que as
 * asserções decidem — a prova não inventa geometria, lê-a. */
const MEDIR = () => {
  const barra = document.querySelector('.barra');
  const ato = document.querySelector('details.ctx-ato');
  if (!barra || !ato) return { erro: 'a faixa ou o contexto do ato não existem' };
  const caixa = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const visivel = (el) => {
    if (!el || el.hidden) return false;
    const r = el.getBoundingClientRect();
    const estilo = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && estilo.display !== 'none' && estilo.visibility !== 'hidden';
  };
  const campos = [...document.querySelectorAll('.ctx-campos > .campo')]
    .filter(visivel)
    .map((el) => {
      /* O RÓTULO é `label` nos campos que se preenchem e `.ctx-rotulo` nas LEITURAS (o que vem
       * do plano/turma não se edita). Ler só o `label` deixava metade do cabeçalho por medir —
       * e é nessas metades que o defeito apareceu. */
      const rotulo = el.querySelector('label, .ctx-rotulo');
      const valor = el.querySelector('.ctx-inscricao');
      return {
        texto: (rotulo ? rotulo.textContent : '').trim() || '(sem rótulo)',
        caixa: caixa(el),
        rotulo: rotulo ? caixa(rotulo) : null,
        valor: valor ? caixa(valor) : null,
        controles: [...el.querySelectorAll('select, input')].filter(visivel).map(caixa),
      };
    });
  return {
    aberto: ato.open,
    barra: caixa(barra),
    ato: caixa(ato),
    campos,
    rolagem: { largura: document.documentElement.scrollWidth, janela: window.innerWidth },
  };
};

(async () => {
  const executablePath = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executablePath) {
    console.error('provar-faixa-do-ato-no-celular: Chrome/Chromium não encontrado — NÃO FEITO.');
    console.error('  defina CHROME_PATH, ou rode onde houver navegador.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (erro) {
    console.error('provar-faixa-do-ato-no-celular: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(1);
  }

  const { srv, base } = await servir();
  const browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    for (const largura of LARGURAS) {
      console.log('\n' + largura + 'px — a faixa com o «Contexto do ato» ABERTO');
      await page.setViewport({ width: largura, height: 900 });
      /* `?plano=` — é assim que a Área do Professor entrega um PO a observar, e é o que faz as
       * quatro leituras do cabeçalho existirem. Sem ele a faixa mostra dois campos e a bancada
       * media um cabeçalho mais pobre do que o que se usa. */
      await page.goto(base + '/plano-observacao/?professor=prova&escola=prova&ciclo=01&plano='
        + encodeURIComponent(PLANO.id), { waitUntil: 'load' });
      await new Promise((r) => setTimeout(r, 500));
      /* O estado do defeito é com o bloco ABERTO — e com a faixa VISÍVEL. A faixa nasce com a
       * classe `oculto` (a porta é agnóstica: ela aparece quando o mapa chega e há contexto).
       * Sem mapa não há faixa, e medir uma faixa `display: none` daria «nada transborda» — o
       * silêncio falso que esta bancada existe para não produzir. É a geometria do cabeçalho
       * que se mede, e o `oculto` não é dela. */
      const montou = await page.evaluate(() => {
        const barra = document.getElementById('barra');
        const ato = document.querySelector('details.ctx-ato');
        if (!barra || !ato) return false;
        barra.classList.remove('oculto');
        if (!ato.open) ato.open = true;
        return true;
      });
      if (!montou) {
      provar('a faixa existe no documento', false,
        await page.evaluate(() => ({ titulo: document.title, len: document.body.innerHTML.length,
          ids: [...document.querySelectorAll('[id]')].slice(0, 6).map((e) => e.id),
          corpo: document.body.innerHTML.slice(0, 200) })));
      continue;
    }
      await new Promise((r) => setTimeout(r, 150));
      const m = await page.evaluate(MEDIR);

      if (m.erro) { provar('a página abriu com a faixa', false, m.erro); continue; }
      provar('o bloco está aberto (é o estado do defeito)', m.aberto === true);
      provar('há campos a medir', m.campos.length >= 4,
        m.campos.map((c) => c.texto + ' ' + JSON.stringify(c.caixa)));

      // 1. NENHUM PAR SE SOBREPÕE — é a definição de «acavalado».
      const sobrepostos = [];
      for (let i = 0; i < m.campos.length; i++) {
        for (let j = i + 1; j < m.campos.length; j++) {
          const a = m.campos[i].caixa;
          const b = m.campos[j].caixa;
          const cruzaX = a.x < b.x + b.w && b.x < a.x + a.w;
          const cruzaY = a.y < b.y + b.h && b.y < a.y + a.h;
          if (cruzaX && cruzaY) sobrepostos.push([m.campos[i].texto, m.campos[j].texto]);
        }
      }
      provar('nenhum par de campos se sobrepõe', sobrepostos.length === 0, sobrepostos);

      // 2. NENHUM CAMPO TRANSBORDA A FAIXA.
      const fora = m.campos.filter((c) => c.caixa.x < m.barra.x - 1
        || c.caixa.x + c.caixa.w > m.barra.x + m.barra.w + 1).map((c) => c.texto);
      provar('todo campo cabe dentro da faixa', fora.length === 0, { fora, barra: m.barra });

      // 3. O CONTROLE CABE DENTRO DO SEU CAMPO.
      const estourados = [];
      for (const c of m.campos) {
        for (const k of c.controles) {
          if (k.x < c.caixa.x - 1 || k.x + k.w > c.caixa.x + c.caixa.w + 1) {
            estourados.push({ campo: c.texto, controle: k, caixa: c.caixa });
          }
        }
      }
      provar('todo controle cabe dentro do campo dele', estourados.length === 0, estourados);

      // 4. NÃO HÁ TRANSBORDO HORIZONTAL — o sintoma que se lê como «a página anda para o lado».
      provar('a página não transborda na horizontal',
        m.rolagem.largura <= m.rolagem.janela + 1, m.rolagem);

      // 5. RÓTULO E VALOR NÃO SE SOBREPÕEM DENTRO DO CAMPO. É o defeito tal como ela o viu:
      //    o rótulo («frequência semanal») e o valor («sex · 1x») a caírem um por cima do outro
      //    dentro da mesma caixa, porque vão para colunas da grelha do campo e o valor não cabe.
      const dentro = [];
      for (const c of m.campos) {
        if (!c.rotulo || !c.valor) continue;
        const r = c.rotulo;
        const v = c.valor;
        const cruzaX = r.x < v.x + v.w && v.x < r.x + r.w;
        const cruzaY = r.y < v.y + v.h && v.y < r.y + r.h;
        if (cruzaX && cruzaY) dentro.push({ campo: c.texto, rotulo: r, valor: v });
      }
      provar('rótulo e valor não se sobrepõem dentro do campo', dentro.length === 0, dentro);

      // 6. E O VALOR NÃO SAI PELA BORDA DO SEU CAMPO — ele é mais largo do que a coluna quando
      //    a grelha lhe dá `auto` e o texto é uma frase.
      const vazados = m.campos.filter((c) => c.valor
        && (c.valor.x < c.caixa.x - 1 || c.valor.x + c.valor.w > c.caixa.x + c.caixa.w + 1))
        .map((c) => ({ campo: c.texto, valor: c.valor, caixa: c.caixa }));
      provar('o valor cabe dentro do seu campo', vazados.length === 0, vazados);

      /* 7. O RÓTULO TEM LARGURA PARA SER LIDO — o defeito tal como ele se dá (04/11/2026).
       *
       * Medido com o envelope verdadeiro: a 360px o campo «Frequência semanal» saía com
       * `rótulo = 0px` de largura e o valor com 129px. A grelha do campo é
       * `minmax(0,1fr) auto`, e o valor — uma frase («qua e sex · 2x/semana») — pede mais do que
       * o `auto` lhe dá; o que cede é a coluna do rótulo, que encolhe até zero. O texto continua
       * lá, empilhado sobre si mesmo e por cima do valor: é o «acavalado» que ela descreveu.
       *
       * A régua é a do propósito: um rótulo de uma linha precisa de largura para a palavra mais
       * longa que tem. Abaixo de 40px nenhum destes rótulos («Frequência semanal», «Duração por
       * aula», «Condição de registro») se lê. */
      const rotulosMudos = m.campos
        .filter((c) => c.rotulo && c.texto !== '(sem rótulo)' && c.rotulo.w < 40)
        .map((c) => ({ campo: c.texto, rotulo: c.rotulo, valor: c.valor }));
      provar('todo rótulo tem largura para ser lido (>= 40px)', rotulosMudos.length === 0,
        rotulosMudos);

      // 8. TODO CAMPO TEM ALTURA DE LEITURA — nenhum rótulo esmagado.
      const esmagados = m.campos.filter((c) => c.caixa.h < 24 || (c.rotulo && c.rotulo.h < 8))
        .map((c) => ({ texto: c.texto, caixa: c.caixa, rotulo: c.rotulo }));
      provar('todo campo tem altura de leitura', esmagados.length === 0, esmagados);
    }
  } finally {
    await browser.close();
    srv.close();
  }

  console.log('\nmedido em ' + LARGURAS.join(', ') + 'px');
  if (falhas) {
    console.log('\nFALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('\nTUDO CERTO — ' + total + ' asserções: o «Contexto do ato» aberto cabe num '
    + 'telefone, com os campos empilhados sem se acavalarem.');
})();
