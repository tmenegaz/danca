#!/usr/bin/env node
'use strict';

/**
 * provar-pendencia-do-po.js — a etiqueta «PO aguardando» diz PORQUE está a aguardar.
 *
 * O QUE ELA RELATOU (15/11/2026):
 *
 *   «eu só tenho um ciclo, que é o ciclo 01, e a etiqueta dele diz que o PO está aguardando. Então
 *   eu não sei qual dos dois está errado, o PO ou se é o ciclo. Porque eu também refiz o plano de
 *   ensino e o plano de observação manualmente, mas não editei nada, não mudei nada. Só mandei
 *   gerar de novo. E o ciclo continua com a mesma etiqueta.»
 *
 * NÃO HAVIA DOIS VALORES EM DESACORDO — havia um valor e nenhuma razão. O `po_state` da âncora é
 * escrito pelo derivador a partir da linha `state:` do PO, e ela só passa a `Input_PO_Validado`
 * com as SEIS folhas do checklist marcadas (PROTOCOLO, ciclo de vida do estado). Cinco são
 * inferidas do que já está escrito; a sexta — «Critérios mutuamente exclusivos» — não é inferível,
 * e nasce «não» de propósito. Regenerar o documento sem marcar essa caixa dá o mesmo documento e a
 * mesma etiqueta. A tela dizia a verdade e escondia o motivo.
 *
 * O QUE SE MEDE, e por que não basta ler o código:
 *
 *   A. A ETIQUETA DIZ O MOTIVO. No ciclo real que ela abriu, o cartão nomeia a caixa que falta —
 *      no `title` do selo e na linha de contexto —, e num PO todo marcado NÃO diz nada. As duas
 *      metades, porque uma só não distingue «acerta sempre» de «diz sempre a mesma coisa».
 *   B. A ETIQUETA E O DOCUMENTO NÃO PODEM DIVERGIR. Em todos os POs do repositório, o estado
 *      declarado e as caixas desmarcadas contam a mesma história: aguardando ⟺ há caixa por
 *      marcar. É o invariante que faz a frase ser verdadeira — sem ele, a frase seria mais uma
 *      cópia do mesmo facto.
 *   C. O CAMINHO EXISTE. Com o formulário do PO aberto, marcar «sim» naquela linha FICA — o valor
 *      não é reescrito pela semente, e a sugestão é aposentada. É a resposta à pergunta implícita
 *      dela («então o PO nunca sai de aguardando?»): sai, e o gesto é uma caixa.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `motor/` e o `tools/` de `HEAD` e corre as
 * MESMAS provas. Em `HEAD` o cartão não nomeia nada: se passasse, a bancada não provava nada.
 *
 *   node experimentos/provar-pendencia-do-po.js
 *   node experimentos/provar-pendencia-do-po.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.includes('--controle-negativo');

let RAIZ_DO_CODIGO = RAIZ;
if (NEGATIVO) {
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'pendencia-do-po-'));
  /* As pastas que os `require` alcançam: o motor, o catálogo, a folha, os cenários de teste, o
   * esquema do ciclo e o conteúdo da porta. */
  execSync('git archive HEAD motor biblioteca tools teste modelo porta | tar -x -C ' + destino,
    { cwd: RAIZ, stdio: 'pipe' });
  RAIZ_DO_CODIGO = destino;
  console.log('CONTROLE NEGATIVO — o motor e as ferramentas de HEAD (antes de a etiqueta dizer o motivo)\n');
}

const montar = require(path.join(RAIZ_DO_CODIGO, 'tools/montar-publicacao.js'));

/* O ITEM DO CARTÃO, ou nada. No código de ANTES `itemDoPlano` não era exportado — e é bom que a
 * bancada não rebente por isso: um controle negativo que não corre não controla nada. Sem a
 * função, o item vem vazio e cada asserção reprova pelo seu próprio nome. */
const itemDe = (t) => (typeof montar.itemDoPlano === 'function' ? montar.itemDoPlano(t) : {});
const porta = require(path.join(RAIZ_DO_CODIGO, 'motor/nucleo/porta.js'));
const listas = require(path.join(RAIZ_DO_CODIGO, 'motor/nucleo/lista-html.js'));

let total = 0;
let falhas = 0;
function checar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + descricao); return; }
  falhas += 1;
  console.log('  ✗ ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* OS PACOTES REAIS — conf, âncora e fonte do PO no mesmo sítio, como no repositório. */
const CICLOS = [
  { professor: 'pe-torto', variante: 'calango-piano', nome: 'Piano', ciclo: '01' },
  { professor: 'redinha-rosa', variante: 'calango-rosa', nome: 'Rosa', ciclo: '01' },
  { professor: 'lapis-rosa', variante: 'batata-bale-nivel-1-teste-2', nome: 'Balé Nível 1 — Teste 2', ciclo: '01' },
];
const PASTA_DE = (c) => path.join('professores', c.professor, 'ciclos', `ciclo-${c.ciclo}-${c.variante}`);
const turmaDe = (c) => ({ pasta: PASTA_DE(c), nome: c.nome, variante: c.variante, ciclo: c.ciclo,
  resumo: {}, documentos: {} });

/** Os campos que o gerador escreve numa âncora — só os que esta prova lê. */
function ancorarUmaCopia(dir, { estado, caixas }) {
  const conf = path.join(dir, 'ciclo-01-x.conf');
  fs.writeFileSync(conf, 'NOME="Cópia"\nPROFESSOR="Docente"\nCICLO="01"\nTOTAL_AULAS="8"\n');
  fs.writeFileSync(path.join(dir, 'ciclo-01-x.fipp'),
    `id: ciclo-01-x\nhash: abc\nancorado_em: 2026-11-15\npo_state: ${estado}\n`);
  const linhas = caixas.map(([rotulo, marcado]) => `- [${marcado ? 'x' : ' '}] ${rotulo}`);
  fs.writeFileSync(path.join(dir, 'ciclo-01-x-po.md'),
    ['---', 'state: ' + estado, '---', '', '**Fenómeno.** Um.', '', '## Checklist de validação', '']
      .concat(linhas.flatMap((l) => [l, '']))
      .concat(['## Outra secção', '', '- [ ] isto não é do checklist', ''])
      .join('\n'));
  return { pasta: path.join(dir, 'ciclo-01-x'), nome: 'Cópia', variante: 'x', ciclo: '01',
    resumo: {}, documentos: {} };
}

// =====================================================================================
// A. A ETIQUETA DIZ O MOTIVO
// =====================================================================================
function aEtiquetaDiz() {
  console.log('\nA. A ETIQUETA DIZ O MOTIVO — o ciclo real, e um PO todo marcado');

  const real = itemDe(turmaDe(CICLOS[0]));
  checar('o ciclo que ela abriu continua a dizer «PO aguardando»',
    real.selo === 'PO aguardando' && real.seloClasse === 'alerta', { selo: real.selo, classe: real.seloClasse });
  checar('…e agora diz QUAL caixa falta',
    /Critérios mutuamente exclusivos/.test(String(real.seloDica)), real.seloDica);
  checar('…e o `title` do selo leva a mesma frase, para quem passa o rato',
    /title="No Plano de Observação falta marcar «Critérios mutuamente exclusivos»\."/.test(
      listas.cartaoDaLista(real, 0)), listas.cartaoDaLista(real, 0).match(/class="selo[^>]*>/));
  checar('…e a linha de contexto também, para quem lê no telemóvel',
    /No Plano de Observação falta marcar/.test(real.contexto), real.contexto);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'po-casos-'));
  try {
    const dirTodo = path.join(tmp, 'todo');
    const dirFalta = path.join(tmp, 'falta');
    const dirSem = path.join(tmp, 'sem');
    for (const d of [dirTodo, dirFalta, dirSem]) fs.mkdirSync(d, { recursive: true });

    const seis = (quantasFaltam) => [
      ['Fenómeno definido de forma observável', true],
      ['Fronteiras do escopo claras', true],
      ['Norma claramente estabelecida', true],
      ['Critérios mutuamente exclusivos', quantasFaltam === 0],
      ['Justificativa fundamentada', true],
      ['Âmbito viável', true],
    ];
    const todo = ancorarUmaCopia(dirTodo, { estado: 'Input_PO_Validado', caixas: seis(0) });
    const falta = ancorarUmaCopia(dirFalta, { estado: 'Input_PO_Aguardando', caixas: seis(1) });
    ancorarUmaCopia(dirSem, { estado: 'Input_PO_Aguardando', caixas: [] });

    const iTodo = itemDe(todo);
    checar('um PO com as seis caixas marcadas diz «PO validado»', iTodo.selo === 'PO validado', iTodo.selo);
    checar('…e NÃO acrescenta razão nenhuma', iTodo.seloDica === ''
      && !/falta marcar/.test(iTodo.contexto), { dica: iTodo.seloDica, contexto: iTodo.contexto });

    const iFalta = itemDe(falta);
    checar('o caso dela — a mesma caixa em falta, noutro ciclo — repete a frase',
      /Critérios mutuamente exclusivos/.test(iFalta.seloDica), iFalta.seloDica);
    /* A CONTRAPROVA DO LEITOR: a frase não pode nascer do nada. Um ciclo sem secção de checklist
     * nenhuma não tem caixas por marcar que se possam nomear — e a etiqueta fica como estava, em
     * vez de inventar um motivo. */
    const iSem = itemDe(ancorarUmaCopia(dirSem, { estado: 'Input_PO_Aguardando', caixas: [] }));
    checar('sem secção de checklist, a etiqueta fica sem razão — não se inventa uma',
      iSem.selo === 'PO aguardando' && iSem.seloDica === '', { selo: iSem.selo, dica: iSem.seloDica });
    /* E A SECÇÃO É RECORTADA: uma caixa desmarcada FORA do checklist não é do checklist. */
    checar('uma caixa desmarcada fora do checklist não entra na frase',
      !/isto não é do checklist/.test(iSem.seloDica + iSem.contexto), iSem.seloDica);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// =====================================================================================
// B. O ESTADO E AS CAIXAS CONTAM A MESMA HISTÓRIA
// =====================================================================================
function oEstadoEAsCaixas() {
  console.log('\nB. O ESTADO E AS CAIXAS NÃO PODEM DIVERGIR — em todos os POs do repositório');
  let vistos = 0;
  for (const c of CICLOS) {
    const pasta = path.join(RAIZ, PASTA_DE(c));
    const poMd = path.join(pasta, '..', `ciclo-${c.ciclo}-${c.variante}-po.md`);
    const fipp = path.join(pasta, '..', `ciclo-${c.ciclo}-${c.variante}.fipp`);
    if (!fs.existsSync(poMd) || !fs.existsSync(fipp)) continue;
    vistos += 1;
    const texto = fs.readFileSync(poMd, 'utf8');
    const estado = (/^state:[ \t]*(.*)$/m.exec(texto) || [])[1] || '';
    const daAncora = (/^po_state:[ \t]*(.*)$/m.exec(fs.readFileSync(fipp, 'utf8')) || [])[1] || '';
    const dados = montar.dadosDoPlano(turmaDe(c), 0);
    const marcadas = (texto.match(/^-[ \t]*\[x\]/gm) || []).length;
    const abertas = (texto.match(/^-[ \t]*\[ \]/gm) || []).length;
    checar(c.variante + ': a âncora copia o estado do documento', daAncora === estado,
      { ancora: daAncora, documento: estado });
    checar(c.variante + ': aguardando ⟺ há caixa por marcar',
      (estado === 'Input_PO_Aguardando') === (abertas > 0), { estado, marcadas, abertas });
    checar(c.variante + ': a razão que a lista mostra é a contagem de caixas abertas',
      (dados.poPendentes || []).length === abertas, { pendencias: dados.poPendentes || [], abertas });
  }
  checar('a prova mediu os POs que existem hoje (nenhum desapareceu por baixo dela)', vistos === 3, vistos);
}

// =====================================================================================
// C. O CAMINHO EXISTE — marcar a caixa fica marcado
// =====================================================================================
async function oCaminhoExiste() {
  console.log('\nC. O CAMINHO EXISTE — marcar «sim» naquela linha FICA');
  const id = 'checklist-criterios-exclusivos';
  const conteudoPO = JSON.parse(fs.readFileSync(path.join(RAIZ_DO_CODIGO, 'porta/po/conteudo/po.json'), 'utf8'));
  const mapa = porta.mapa(conteudoPO);
  const pagina = fs.readFileSync(path.join(RAIZ_DO_CODIGO, 'porta/index.html'), 'utf8');

  /* A PORTA É SERVIDA COMO AO VIVO: o formulário do PO só abre com contexto completo (professor,
   * ciclo vindo do plano escolhido) e com curadoria — as três travas correm antes de os
   * `addEventListener` serem ligados, e um stub magro devolveria à lista em silêncio. Medido. */
  const servidor = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const caminho = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const envia = (corpo, tipo) => { res.writeHead(200, { 'Content-Type': tipo, 'Cache-Control': 'no-store' }); res.end(corpo); };
    const api = caminho.match(/^(anamnese|plano-ensino|plano-observacao)\/(api\/.*)$/);
    const rota = api ? api[2] : (caminho.startsWith('api/') ? caminho : null);
    if (rota && /^api\/mapa/.test(rota)) return envia(JSON.stringify(mapa), 'application/json');
    if (rota && /^api\/planos/.test(rota)) {
      return envia(JSON.stringify({ ok: true, opcoes: [{
        valor: 'plano-20261115-1101', rotulo: 'Plano de ensino — Teste 2', ciclo: '01', turma: 'Teste 2' }] }), 'application/json');
    }
    if (rota && /^api\/envelope\//.test(rota)) {
      return envia(JSON.stringify({ ok: true, contexto: { ciclo: '01', escola: 'batata', professor: 'docente' },
        respostas: { 'contexto-turma': { valor: 'Teste 2' } } }), 'application/json');
    }
    if (rota && /^api\/bastidores\/curadoria-professor/.test(rota)) {
      return envia(JSON.stringify({ ok: true, professor: 'docente', curadorias: [{
        id: 'c1', professor: 'docente', escola: 'batata', turmas: ['Teste 2'], alunas: ['Aluna Um'] }] }), 'application/json');
    }
    if (rota && /^api\/bastidores\/professores/.test(rota)) {
      return envia(JSON.stringify({ ok: true, escola: 'batata',
        professores: [{ nome: 'Docente', slug: 'docente' }], alunas: [] }), 'application/json');
    }
    if (rota) return envia(JSON.stringify({ ok: true, opcoes: [], estados: [], turmas: [], preenchido: [] }), 'application/json');
    if (/^plano-observacao\/(index\.html)?$/.test(caminho)) return envia(pagina, 'text/html; charset=utf-8');
    const origem = caminho.replace(/^(anamnese|plano-ensino|plano-observacao)\//, '');
    if (origem === 'assets/markdown.js') return envia(fs.readFileSync(path.join(RAIZ_DO_CODIGO, 'porta/assets/markdown.js')), 'text/javascript');
    if (origem === 'assets/style.css') return envia(fs.readFileSync(path.join(RAIZ_DO_CODIGO, 'tools/templates/ciclo.css')), 'text/css');
    if (origem === 'assets/nav.js') return envia(fs.readFileSync(path.join(RAIZ_DO_CODIGO, 'tools/templates/nav.js')), 'text/javascript');
    res.writeHead(404); res.end('404');
  });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + servidor.address().port;

  const vc = new VirtualConsole();
  const problemas = [];
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
  const dom = await JSDOM.fromURL(base + '/plano-observacao/?professor=docente&escola=batata&ciclo=01', {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), base + '/plano-observacao/'), i);
      w.CSS = w.CSS || {};
      if (!w.CSS.escape) w.CSS.escape = (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
      w.confirm = () => true;
      w.alert = () => {};
    },
  });
  await new Promise((r) => setTimeout(r, 900));
  const w = dom.window;
  try {
    const antes = await w.eval(`JSON.stringify({ v: RESPOSTAS.get(${JSON.stringify(id)}),
      sugerida: SUGERIDAS.has(${JSON.stringify(id)}), tela: document.body.getAttribute('data-tela') })`);
    const inicio = JSON.parse(antes);
    checar('o formulário do PO abriu (a bancada mede o caminho dela, não uma simulação)',
      inicio.tela === 'porta' && inicio.v === 'não', inicio);
    checar('a linha nasce «não» e semeada — é a pré-inscrição que explica no próprio campo',
      inicio.sugerida === true, inicio);

    const depois = JSON.parse(await w.eval(`(function(){
      var no = MAPA.nos.find(function(n){return n.id===${JSON.stringify(id)};});
      INDICE = MAPA.nos.indexOf(no);
      renderPergunta();
      var radio = document.querySelector('#pergunta input[name="valor"][value="sim"]');
      if (!radio) return JSON.stringify({ erro: 'sem rádio «sim»' });
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      return JSON.stringify({ v: RESPOSTAS.get(${JSON.stringify(id)}),
        sugerida: SUGERIDAS.has(${JSON.stringify(id)}) });
    })()`));
    checar('marcar «sim» grava «sim»', depois.v === 'sim', depois);
    checar('…e aposenta a sugestão — a escolha do professor não é reescrita pela semente',
      depois.sugerida === false, depois);

    // A REPINTURA é o que desfazia o gesto se a sugestão continuasse viva: `atualizarBarra` chama
    // `derivarChecklist`, que re-deriva toda a folha ainda semeada.
    const repintado = JSON.parse(await w.eval(`(function(){
      atualizarBarra();
      return JSON.stringify({ v: RESPOSTAS.get(${JSON.stringify(id)}), sugerida: SUGERIDAS.has(${JSON.stringify(id)}) });
    })()`));
    checar('…e a repintura não o desfaz', repintado.v === 'sim' && repintado.sugerida === false, repintado);

    /* E o outro lado, que não pode regredir: as folhas que LÊEM um campo continuam a segui-lo. */
    const segue = JSON.parse(await w.eval(`(function(){
      RESPOSTAS.delete('fenomeno');
      atualizarBarra();
      return JSON.stringify({ fenomeno: RESPOSTAS.get('checklist-fenomeno-definido') });
    })()`));
    checar('apagar o campo que uma folha monitora continua a virar a folha para «não»',
      segue.fenomeno === 'não', segue);
    checar('nenhum erro de página', problemas.length === 0, problemas);
  } finally {
    dom.window.close();
    servidor.close();
  }
}

(async () => {
  aEtiquetaDiz();
  oEstadoEAsCaixas();
  await oCaminhoExiste();

  console.log('\n' + (falhas ? '✗ ' + falhas + ' de ' + total + ' reprovaram' : '✓ ' + total + ' de ' + total));
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.error('provar-pendencia-do-po rebentou:', e && e.stack ? e.stack : e);
  process.exit(1);
});
