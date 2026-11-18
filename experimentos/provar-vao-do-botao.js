#!/usr/bin/env node
'use strict';

/**
 * provar-vao-do-botao.js — o botão de cada formulário da Produção não encosta no campo.
 *
 * Por que existe (26/10/2026). Na Produção, «Cadastrar aluna» e «Cadastrar termo» estavam
 * COLADOS no campo de cima: vão medido de 0px. A causa não era falta de desenho — era a
 * folha a fazer uma conta que a página desfazia. O `tools/templates/ciclo.css` dá vão ao
 * botão que vem LOGO depois de um controle (`:where(form) > :where(input, select, textarea)
 * + button.acao`), e nos dois formulários havia um `<div class="res">` no meio: o `.res` é
 * `display:none` até haver resposta, mas continua a ser o elemento anterior na conta do `+`,
 * e o vão da folha não chegava ao botão.
 *
 * O que se prova. Que a ação de cada formulário da Produção é a MESMA peça — a do
 * «Cadastrar professor», que é o modelo — e que ela não encosta no campo:
 *
 *   1. a ação está dentro de uma fileira `.par-botoes` (o contentor que o professor, a turma
 *      e a curadoria já usavam);
 *   2. a ação é `.acao` — e não o botão PADRÃO da folha. Era o caso do «Atribuir curadoria»:
 *      sem classe, saía com fundo de papel e filete na marca, ao lado de ações cheias de
 *      bordô na MESMA página, e 4px mais baixo;
 *   3. a cor de fundo, a cor do texto e a altura batem com as do «Cadastrar professor»;
 *   4. o vão entre a fileira e o que está acima dela é o do professor (>= 8px), e nunca 0.
 *
 * O QUE NÃO SE MEDE AQUI. A navegação da página: abrir cada secção pelo menu é a
 * `provar-menu-da-producao.js`. Aqui as secções são reveladas por script, porque o que se
 * mede é a geometria DENTRO do formulário, e ela não depende de como se chegou lá.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `motor/` de `REF_NEGATIVO` (padrão
 * `HEAD`) com `git archive` e corre as MESMAS provas. Com o código de antes, os três
 * formulários reprovam — se passassem, a prova não estaria a provar nada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-vao-do-botao.js
 *   node experimentos/provar-vao-do-botao.js --controle-negativo
 *   REF_NEGATIVO=HEAD~1 node experimentos/provar-vao-do-botao.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');

/** O contexto que a página espera — o mesmo das outras provas da Produção. */
const CONTEXTO = { professor: 'tiago-menegaz', ciclo: '01',
  query: 'professor=tiago-menegaz&escola=valse&ciclo=01' };

/**
 * Os formulários e o nome do botão que grava. O de professor é a REFERÊNCIA: é ele que o
 * dono do produto apontou como modelo da identidade.
 */
const REFERENCIA = 'form-prof';
const FORMULARIOS = [
  { form: 'form-prof', rotulo: 'Cadastrar professor' },
  { form: 'form-aluna', rotulo: 'Cadastrar aluna' },
  { form: 'form-termo', rotulo: 'Cadastrar termo' },
  { form: 'form-curadoria', rotulo: 'Atribuir curadoria' },
  { form: 'form-turma', rotulo: 'Avançar' },
];

function pagina(motor) {
  const b = require(path.join(motor, 'servidor/bastidores.js'));
  return b.paginaProducao('valse', CONTEXTO, [], [], 'Tiago Menegaz', 'tiago-menegaz', [], [], [], [], [], []);
}

function servir(html) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
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

/**
 * A leitura no navegador. Devolve, por formulário, o que a identidade precisa de saber: o
 * pai da ação, a classe dela, a cor e a altura computadas, e o vão até o que está acima.
 *
 * O VÃO É MEDIDO ATÉ O ELEMENTO ANTERIOR DA FILEIRA, e não até o último `input`: numa pilha
 * de formulário é a mesma coisa, mas na curadoria o que antecede o botão é o `.escolhedor`
 * das alunas — que é um bloco, e não um campo. Medir sempre contra o pai é a única conta que
 * vale nos cinco formulários.
 */
function medir(formularios) {
  const receita = formularios.map((f) => f.form);
  const out = {};
  for (const id of receita) {
    const form = document.getElementById(id);
    if (!form) { out[id] = { existe: false }; continue; }
    const visivel = (e) => Boolean(e) && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
    const botao = [...form.querySelectorAll('button')]
      .find((b) => b.type === 'submit' && visivel(b));
    if (!botao) { out[id] = { existe: true, botao: null }; continue; }
    const fileira = botao.closest('.par-botoes');
    const pai = botao.parentElement;
    // Sem fileira, mede-se contra o que antecede a AÇÃO — é isso que o controle negativo
    // precisa de mostrar: com o código de antes o vão é 0, e não «não medido».
    const anterior = fileira ? fileira.previousElementSibling : botao.previousElementSibling;
    const r = (e) => e.getBoundingClientRect();
    const cs = getComputedStyle(botao);
    // O `.res` nasce `display:none` e é o elemento anterior na marcação: o vão tem de ser
    // medido contra o que está RENDERIZADO acima, senão media-se contra uma caixa invisível.
    let acima = anterior;
    while (acima && !visivel(acima)) acima = acima.previousElementSibling;
    out[id] = {
      existe: true,
      rotulo: botao.textContent.trim(),
      naFileira: Boolean(fileira),
      pai: pai.tagName.toLowerCase() + (pai.className ? '.' + pai.className.split(' ')[0] : ''),
      classes: botao.className.split(' ').filter(Boolean).sort(),
      fundo: cs.backgroundColor,
      cor: cs.color,
      altura: Math.round(r(botao).height),
      acima: acima ? acima.tagName.toLowerCase() + (acima.className ? '.' + acima.className.split(' ')[0] : '') : null,
      vao: acima ? Math.round(r(botao).top - r(acima).bottom) : null,
    };
  }
  return out;
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-vao-do-botao: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-vao-do-botao: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const negativo = process.argv.includes('--controle-negativo');
  let motor = path.join(raiz, 'motor');
  if (negativo) {
    /* O CÓDIGO DE ANTES, extraído do commit — não uma cópia editada à mão. Vão as pastas que
       os `require` do motor pedem: `biblioteca/` (o catálogo), `tools/` (a barra e a cifra) e
       `teste/` (os fixtures, exigidos no topo do módulo). */
    const ref = process.env.REF_NEGATIVO || 'HEAD';
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'motor-vao-'));
    execSync('git archive ' + ref + ' motor biblioteca tools teste | tar -x -C ' + destino, { cwd: raiz, stdio: 'pipe' });
    motor = path.join(destino, 'motor');
    console.log('CONTROLE NEGATIVO — o motor de ' + ref + ' (antes da fileira do botão)\n');
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

  for (const largura of [1280, 390]) {
    console.log('\n' + (largura >= 1000 ? 'tela larga' : 'celular') + ' (' + largura + 'px)');
    const p = await navegador.newPage();
    await p.setViewport({ width: largura, height: 900 });
    await p.goto(base + '/bastidores/producao', { waitUntil: 'networkidle0', timeout: 60000 });
    /* O portão e a recolha das secções saem da frente, por script: o que se mede é o
       formulário, não o caminho até ele (esse é a `provar-menu-da-producao.js`). */
    await p.evaluate(() => {
      const gate = document.getElementById('gate');
      if (gate) gate.hidden = true;
      const conteudo = document.getElementById('conteudo');
      if (conteudo) conteudo.hidden = false;
      /* E O RECOLHIMENTO (18/11/2026). As secções passaram a nascer recolhidas — «quando abrir a
       * primeira vez, deve estar colapsado» —, e recolhida a secção o formulário sai da frente com
       * `display:none`: o botão deixa de ter caixa e o vão mede zero. Quem sabe abrir uma secção é
       * a página; chama-se a função dela, em vez de imitar o efeito. */
      document.querySelectorAll('.secao').forEach((s) => {
        s.hidden = false;
        if (typeof definirSecaoRecolhida === 'function') definirSecaoRecolhida(s.id, false);
        else {
          s.setAttribute('data-recolhido', 'nao');
          s.querySelectorAll('.col-form').forEach((f) => { f.hidden = false; });
        }
      });
      if (typeof definirFormularioRecolhido === 'function') definirFormularioRecolhido(false);
    });
    const medidas = await p.evaluate(medir, FORMULARIOS);

    const referencia = medidas[REFERENCIA];
    provar('o formulário de referência (o do professor) tem ação à vista',
      Boolean(referencia) && referencia.existe === true && Boolean(referencia.rotulo),
      referencia);

    for (const f of FORMULARIOS) {
      const m = medidas[f.form];
      // O formulário da turma só mostra o «Avançar» com a faixa no primeiro passo; se não
      // houver botão à vista, ele não entra na conta — e diz-se, em vez de passar calado.
      if (!m || !m.rotulo) { console.log('  —     ' + f.form + ': sem ação à vista nesta largura'); continue; }
      provar(f.form + ': a ação «' + m.rotulo + '» está numa fileira `.par-botoes`', m.naFileira === true, m.pai);
      provar(f.form + ': a ação é `.acao` (não o botão padrão da folha)',
        m.classes.indexOf('acao') !== -1, m.classes);
      provar(f.form + ': a cor de fundo é a do «Cadastrar professor»',
        referencia && m.fundo === referencia.fundo, { dele: m.fundo, referencia: referencia && referencia.fundo });
      provar(f.form + ': a cor do texto é a do «Cadastrar professor»',
        referencia && m.cor === referencia.cor, { dele: m.cor, referencia: referencia && referencia.cor });
      provar(f.form + ': a altura é a do «Cadastrar professor»',
        referencia && m.altura === referencia.altura, { dele: m.altura, referencia: referencia && referencia.altura });
      provar(f.form + ': não encosta no campo acima (vão >= 8px)',
        typeof m.vao === 'number' && m.vao >= 8, { vao: m.vao, acima: m.acima });
    }
    await p.close();
  }

  await navegador.close();
  srv.close();
  console.log('\n' + (negativo ? 'controle negativo: ' : '') +
    'provar-vao-do-botao: ' + ok + ' de ' + (ok + ko) + ' passaram');
  process.exit(ko ? 1 : 0);
})();
