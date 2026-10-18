#!/usr/bin/env node
'use strict';

/**
 * provar-cabecalho-do-ato.js — os TRÊS documentos têm o mesmo cabeçalho.
 *
 * Por que existe (18/10/2026). A anamnese, o plano de ensino e o plano de observação
 * usam a MESMA barra — o mesmo HTML, o mesmo CSS. Mesmo assim, o dono do produto abriu os
 * três e viu três coisas diferentes: na anamnese os campos numa linha, no plano de ensino
 * empilhados, e no plano de observação empilhados e com um texto a mais. Estava certo: uma
 * única declaração — `.ctx-turma { flex: 1 1 100% }` — forçava a turma a ocupar a linha
 * inteira, e só os dois documentos que TÊM turma quebravam a linha. O CSS estava a fazer
 * o que lhe mandaram; ninguém tinha dito que os três deviam ficar iguais.
 *
 * É a mesma classe de defeito do `--gold-borda` em dois fundos e do corte 760 × 768: um
 * valor, dois lugares, e a diferença só aparece quando alguém olha os dois lado a lado.
 * Por isso esta prova mede o ARRANJO, não o retrato:
 *
 *   1. o cartão tem a MESMA caixa que o texto da página (nem mais largo, nem mais estreito);
 *   2. os campos ficam na MESMA linha — todos com o mesmo topo, dentro de 4px;
 *   3. não há TEXTO EXPLICATIVO dentro do cabeçalho (a lista de frases que saíram);
 *   4. o rótulo de cada campo existe e o controle ao lado é um controle (ou inscrição);
 *   5. a escola é inscrição nos três, e o número de colunas bate com o de campos visíveis.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` roda contra `git show HEAD:porta/index.html`.
 * A página de HEAD tem a turma a ocupar a linha inteira e os textos explicativos — se as
 * provas passassem nela, não estariam a provar nada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-cabecalho-do-ato.js
 *   node experimentos/provar-cabecalho-do-ato.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');
const FONTE_PORTA = path.join(raiz, 'porta/index.html');

/**
 * O mapa precisa do nó da TURMA — é ele que faz o campo existir no plano e no PO. Sem
 * ele, `noDaTurma()` devolve `null`, o campo fica `hidden`, e a prova mediria um cabeçalho
 * que não é o de produção. (Foi assim que uma versão anterior desta bancada «passou» com
 * três colunas no plano de ensino: a quarta não estava lá.)
 */
const MAPA = {
  ok: true,
  nos: [
    { id: 'plano-de-ensino', campo: 'Plano de ensino' },
    { id: 'contexto-turma', campo: 'Turma', opcoesDe: 'api/turmas', daCuradoria: 'turmas' },
  ],
  obrigatorios: 0, respondidas: 0, total: 2, tituloCabecalho: 'Prova',
};

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };

function servir() {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      // `no-store`: sem ele o Chrome reaproveita a primeira resposta entre navegações, e o
      // controle negativo serve a página NOVA jurando que é a velha.
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/api/bastidores/professores')) {
      return ok('application/json', JSON.stringify({ ok: true, escola: 'valse',
        professores: [{ nome: 'Tiago Menegaz', slug: 'tiago-menegaz' }] }));
    }
    if (caminho.endsWith('/api/bastidores/alunas')) {
      return ok('application/json', JSON.stringify({ ok: true, alunas: ['Ana', 'Bia'] }));
    }
    if (caminho.endsWith('/api/planos')) {
      return ok('application/json', JSON.stringify({ ok: true, opcoes: [
        { valor: 'plano-20261018-0900', rotulo: 'Balé Nível 1', turma: 'Balé Nível 1', escola: 'valse' },
      ] }));
    }
    if (caminho.indexOf('/api/') !== -1) {
      return ok('application/json', JSON.stringify(Object.assign({
        opcoes: [{ valor: 'Balé Nível 1', rotulo: 'Balé Nível 1' }],
      }, MAPA)));
    }
    if (caminho.endsWith('/assets/style.css')) return ok(TIPOS['.css'], fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    if (caminho.endsWith('/assets/nav.js')) return ok(TIPOS['.js'], fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    if (caminho.endsWith('/assets/lib-cifra.js')) return ok(TIPOS['.js'], fs.readFileSync(path.join(raiz, 'tools/lib-cifra.js')));
    if (caminho.endsWith('/assets/markdown.js')) return ok(TIPOS['.js'], fs.readFileSync(path.join(raiz, 'porta/assets/markdown.js')));
    ok(TIPOS['.html'], fs.readFileSync(process.env.PROVA_PORTA_HTML || FONTE_PORTA));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

/** Os três documentos, e quantos CONTROLES cada um deve mostrar. */
const DOCUMENTOS = [
  // a anamnese é o padrão: professor, ciclo, aluna, senha
  { fonte: 'anamnese', esperados: ['professor', 'ciclo', 'aluna', 'senha do professor'] },
  // o plano acrescenta a turma (um select) e mantém a senha
  { fonte: 'plano-ensino', esperados: ['professor', 'ciclo', 'turma observada', 'senha do professor'] },
  // o PO não tem aluna nem senha; a turma é LEITURA
  { fonte: 'plano-observacao', esperados: ['professor', 'ciclo', 'turma observada'] },
];

/** As frases que saíram do cabeçalho. Se alguma voltar, a prova falha e diz qual. */
const FRASES_QUE_SAIRAM = [
  'escolha o plano de ensino no corpo do formulário',
  'vem do plano de ensino referenciado',
  'aqui é leitura',
  'use o cabeçalho',
  'a turma observada é escolhida no',
];

/* A leitura, no navegador. Uma função só, para os três documentos medirem o mesmo. */
function medir() {
  const barra = document.getElementById('barra');
  const faixa = barra.closest('.faixa');
  // O bloco de texto da página: a primeira `.caixa` do conteúdo (o portal). É com ele que
  // o cartão tem de coincidir — é ele que o usuário vê logo abaixo.
  const caixa = document.querySelector('.conteudo .caixa');
  const campos = [...barra.querySelectorAll('.ctx-campos > .campo')].filter((e) => e.offsetParent);
  const q = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), top: Math.round(r.top) }; };
  const rotulo = (c) => {
    const l = c.querySelector('label, .ctx-rotulo');
    return l ? l.textContent.trim() : '';
  };
  return {
    barra: q(barra), faixa: faixa ? q(faixa) : null, caixa: caixa ? q(caixa) : null,
    altura: Math.round(barra.getBoundingClientRect().height),
    campos: campos.map((c) => ({
      rotulo: rotulo(c),
      top: Math.round(c.getBoundingClientRect().top),
      w: Math.round(c.getBoundingClientRect().width),
      // O controle: um `<select>`/`<input>` visível, ou a inscrição (a turma do PO).
      controle: (() => {
        const el = c.querySelector('select, input:not([type=hidden])');
        if (el) return el.tagName.toLowerCase();
        return c.querySelector('.ctx-inscricao') ? 'inscricao' : 'nenhum';
      })(),
    })),
    escolaTag: (document.querySelector('#ctx-escola-nome') || {}).tagName || null,
    escolaVisivel: (document.querySelector('#ctx-escola-nome') || {}).offsetParent !== null,
    escolaInputEscondido: (() => { const i = document.getElementById('ctx-escola'); return i ? i.type === 'hidden' : false; })(),
    textosDoCabecalho: (barra.innerText || '').replace(/\s+/g, ' ').toLowerCase(),
    transbordaDoc: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  };
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-cabecalho-do-ato: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-cabecalho-do-ato: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const negativo = process.argv.includes('--controle-negativo');
  if (negativo) {
    const antiga = execSync('git show HEAD:porta/index.html', { cwd: raiz, maxBuffer: 64 * 1024 * 1024 }).toString();
    const temp = path.join(os.tmpdir(), 'porta-anterior-cabecalho.html');
    fs.writeFileSync(temp, antiga);
    process.env.PROVA_PORTA_HTML = temp;
    console.log('CONTROLE NEGATIVO — a porta de HEAD (antes de os três cabeçalhos ficarem iguais)\n');
  }

  const { srv, base } = await servir();
  const navegador = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let ok = 0;
  let ko = 0;
  const provar = (rotulo, condicao, detalhe) => {
    if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
    else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
  };

  for (const doc of DOCUMENTOS) {
    for (const largura of [1280, 390]) {
      console.log('\n' + doc.fonte + ' · ' + largura + 'px');
      const p = await navegador.newPage();
      await p.setViewport({ width: largura, height: 900 });
      await p.goto(base + '/' + doc.fonte + '/?professor=tiago-menegaz&escola=valse&ciclo=01', { waitUntil: 'networkidle0', timeout: 60000 });
      for (let i = 0; i < 8; i += 1) await new Promise((r) => setTimeout(r, 60));
      const r = await p.evaluate(medir);

      // 1) a caixa do cartão é a do texto
      provar('o cartão tem a MESMA caixa do bloco de texto da página',
        Boolean(r.caixa) && r.barra.x === r.caixa.x && Math.abs(r.barra.w - r.caixa.w) <= 1,
        { cartao: r.barra, texto: r.caixa });

      // 2) os campos na mesma linha (no celular, a quebra é por desenho — não se exige)
      const topos = r.campos.map((c) => c.top);
      const espalhamento = Math.max(...topos) - Math.min(...topos);
      if (largura >= 1280) {
        provar('os campos estão TODOS na mesma linha (topo igual, ±4px)',
          espalhamento <= 4, { topos, espalhamento });
      } else {
        provar('no celular os campos quebram por desenho, e o cartão não transborda',
          r.transbordaDoc === false, { transborda: r.transbordaDoc });
      }

      // 3) os rótulos são os do documento, na ordem
      provar('os rótulos são os do documento, na ordem esperada',
        JSON.stringify(r.campos.map((c) => c.rotulo)) === JSON.stringify(doc.esperados),
        r.campos.map((c) => c.rotulo));

      // 4) cada campo tem controle — e a turma do PO é inscrição, não campo
      provar('todo campo tem um controle (ou uma inscrição) ao lado',
        r.campos.every((c) => c.controle !== 'nenhum'),
        r.campos.map((c) => c.rotulo + '=' + c.controle));
      if (doc.fonte === 'plano-observacao') {
        const turma = r.campos.find((c) => c.rotulo === 'turma observada');
        provar('no Plano de Observação a turma é INSCRIÇÃO, não campo',
          Boolean(turma) && turma.controle === 'inscricao', turma && turma.controle);
      }
      if (doc.fonte === 'plano-ensino') {
        const turma = r.campos.find((c) => c.rotulo === 'turma observada');
        provar('no Plano de Ensino a turma é ESCOLHA, e por isso é campo',
          Boolean(turma) && turma.controle === 'select', turma && turma.controle);
      }

      // 5) nenhum texto explicativo voltou
      const sobrou = FRASES_QUE_SAIRAM.filter((f) => r.textosDoCabecalho.indexOf(f) !== -1);
      provar('nenhum texto explicativo no cabeçalho', sobrou.length === 0, sobrou);

      // 6) a escola é inscrição nos três
      provar('a escola é inscrição (SPAN visível) e o campo dela é hidden',
        r.escolaTag === 'SPAN' && r.escolaVisivel === true && r.escolaInputEscondido === true,
        { tag: r.escolaTag, visivel: r.escolaVisivel, hidden: r.escolaInputEscondido });

      await p.close();
    }
  }

  await navegador.close();
  srv.close();
  console.log('\n' + (negativo ? 'controle negativo: ' : '') +
    'provar-cabecalho-do-ato: ' + ok + ' de ' + (ok + ko) + ' passaram');
  process.exit(ko ? 1 : 0);
})();
