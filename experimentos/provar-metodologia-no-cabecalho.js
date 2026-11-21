#!/usr/bin/env node
'use strict';

/**
 * provar-metodologia-no-cabecalho.js — a metodologia sai do formulário e passa a ler-se.
 *
 * O PEDIDO DELA (03/11/2026): «a metodologia de referência e sua respectiva escolha já vêm
 * pré-definidas e vinculadas estruturalmente no processo de Curadoria […]. Portanto, exigir que o
 * professor preencha isso novamente dentro do preenchimento do Plano de Ensino gera redundância
 * operacional». E a direção de domínio que ela fixou: **o professor escolhe** — a metodologia
 * pertence ao professor, como a modalidade.
 *
 * O QUE MUDOU, e são quatro coisas que se medem em separado:
 *
 *   §A  o CONTEÚDO: os dois nós do Bloco 1 deixaram de se perguntar. O `contexto-metodologia`
 *       passou a `noCabecalho` + `daCuradoria: 'tradicao'`, e o `contexto-metodologia-origem`
 *       («Eu escolho · A escola impõe») já não existe — a pergunta deixou de ser perguntável
 *       quando a resposta passou a ser uma premissa do domínio.
 *   §B  o ROTEIRO e o FORMULÁRIO: nenhum dos dois desenha um campo para a metodologia, e o item
 *       «Quem escolhe a metodologia» não aparece em sítio nenhum do mapa.
 *   §C  o CABEÇALHO: a metodologia aparece lá, com o RÓTULO do catálogo («Francesa», não
 *       `francesa`), lida da curadoria — e diz de onde vem.
 *   §D  o DOCUMENTO: o `.md` do plano continua a publicar «Metodologia de referência», e deixou de
 *       publicar «Quem escolhe a metodologia». O envelope leva o valor semeado, senão o documento
 *       diria «[a decidir]» sobre um dado que a curadoria declara.
 *   §E  o CONTROLE NEGATIVO: sem curadoria não há metodologia inventada — o cabeçalho não a mostra
 *       e o documento declara a lacuna.
 *
 * A §C corre em JSDOM com a página de verdade; a §D corre o derivador de verdade. Nada de cópias
 * das regras: se a função mudar de nome, a prova falha em vez de passar a medir outra coisa.
 *
 *   node experimentos/provar-metodologia-no-cabecalho.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const { mapa } = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { derivarPlano } = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));

const CONTEUDO = JSON.parse(fs.readFileSync(path.join(PORTA, 'plano/conteudo/plano.json'), 'utf8'));
const MAPA = Object.assign({ ok: true }, mapa(CONTEUDO));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const TURMA = {
  id: 't1', nome: 'Turma da prova', frequencia: 2, dias: ['ter', 'qui'], duracaoMin: 60,
  periodoInicio: '2027-02-02', periodoFim: '2027-04-29',
};
const TERMOS = [
  { id: 'plie', termo: 'Plié', categoria: 'passo' },
  { id: 'battement-tendu', termo: 'Battement tendu', categoria: 'passo' },
];
const ROTULOS = { RAD: 'RAD', francesa: 'Francesa', Vaganova: 'Vaganova', cubana: 'Cubana',
  compartilhada: 'Compartilhada' };

/* O ENVELOPE DE PROVA — o que a página semeia a partir da curadoria, escrito à mão: a §D mede o
 * DOCUMENTO, e para isso o envelope tem de existir sem passar pelo browser. */
const ENVELOPE_DE_PROVA = {
  'contexto-metodologia': 'Francesa',
  'contexto-notacao': 'Benesh',
};

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
};

/** `semCuradoria` é o CONTROLE NEGATIVO da §E; `tradicao` é a chave que a direção curou. */
function servir({ semCuradoria = false, tradicao = 'francesa' } = {}) {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://local');
    const rel = u.pathname.replace(/^\/+/, '').replace(/^plano-ensino\//, '');
    const envia = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    const json = (o) => envia(MIME['.json'], JSON.stringify(o));

    if (rel === 'api/mapa') return json(MAPA);
    if (rel === 'api/bastidores/professores') {
      return json({ ok: true, professores: [{ nome: 'Prova', slug: 'prova' }],
        opcoes: [{ valor: 'prova', rotulo: 'Prova' }] });
    }
    if (rel === 'api/bastidores/turmas') {
      return json({ ok: true, turmas: [TURMA], opcoes: [{ valor: TURMA.nome, rotulo: TURMA.nome }] });
    }
    if (rel === 'api/bastidores/termos') {
      return json({ ok: true, termos: TERMOS,
        opcoes: TERMOS.map((t) => ({ valor: t.id, rotulo: t.termo })) });
    }
    if (rel === 'api/bastidores/turma-conteudos') {
      return json({ ok: true, relacoes: { [TURMA.id]: ['plie'] } });
    }
    if (rel.startsWith('api/bastidores/curadoria-professor')) {
      return json({
        ok: true,
        rotulos: ROTULOS,
        curadorias: semCuradoria ? [] : [{
          id: 'c1', professor: 'prova', modalidade: 'Balé clássico', tradicao,
          nivel: '1', nivelReferencia: 'Grade 1', turmas: [TURMA.nome],
          repertorio: ['Plié'], alunas: ['Aluna A'],
        }],
      });
    }
    if (rel.startsWith('api/')) return json({ ok: true, opcoes: [] });

    if (rel === 'assets/style.css') return envia(MIME['.css'], fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css')));
    if (rel === 'assets/nav.js') return envia(MIME['.js'], fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')));
    /* OS ASSETS QUE A PÁGINA PEDE COM O CAMINHO DA *OUTRA* PÁGINA (20/11/2026).
     *
     * O `porta/index.html` carrega `<script src="/plano-observacao/assets/markdown.js">` — absoluto,
     * e é de propósito: a mesma porta é servida em `/anamnese/`, `/plano-ensino/` e
     * `/plano-observacao/`, e um `src` relativo acertava num e dava 404 nos outros dois (está
     * escrito lá, a 20/10/2026).
     *
     * A bancada descia o caminho com `PORTA + rel` e, para `plano-observacao/assets/markdown.js`,
     * caía no `catch-all` — que devolve **o `index.html`** para tudo o que não encontra. O browser
     * recebia HTML onde esperava JavaScript, não definia `Markdown`, e a página morria em
     * «Markdown is not defined» a meio do arranque. O sintoma lia-se como defeito da página.
     *
     * Aqui os assets resolvem-se pelo NOME, venha o prefixo que vier: é o mesmo que o servidor de
     * verdade faz, que serve `porta/assets/*` sob todos os endereços da porta. */
    const asset = /(?:^|\/)assets\/(.+)$/.exec(rel);
    if (asset) {
      const f = path.join(PORTA, 'assets', asset[1]);
      if (fs.existsSync(f) && fs.statSync(f).isFile()) {
        return envia(MIME[path.extname(f)] || 'application/octet-stream', fs.readFileSync(f));
      }
    }
    const alvo = rel ? path.join(PORTA, rel) : path.join(PORTA, 'index.html');
    if (alvo.startsWith(PORTA) && fs.existsSync(alvo) && fs.statSync(alvo).isFile()) {
      return envia(MIME[path.extname(alvo)] || 'application/octet-stream', fs.readFileSync(alvo));
    }
    return envia(MIME['.html'], fs.readFileSync(path.join(PORTA, 'index.html')));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () =>
    pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

async function abrir(opcoes) {
  const { srv, base } = await servir(opcoes);
  const caminho = 'plano-ensino/?professor=prova&escola=prova&ciclo=01';
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
  const dom = await JSDOM.fromURL(base + '/' + caminho, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), base + '/' + caminho), i);
      w.CSS = w.CSS || {};
      if (!w.CSS.escape) w.CSS.escape = (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
      w.confirm = () => true;
      w.alert = () => {};
      w.addEventListener('unhandledrejection', (e) => {
        problemas.push('REJEIÇÃO: ' + ((e.reason && e.reason.message) || e.reason));
      });
      w.addEventListener('error', (e) => problemas.push('ERRO: ' + e.message));
    },
  });
  const w = dom.window;
  await new Promise((r) => setTimeout(r, 1500));
  return { w, srv, problemas };
}

/* O que a página sabe, pelas funções DELA: nada é recalculado aqui. */
const MEDIR = `(function(){
  var no = MAPA.nos.filter(function(n){ return n.id === 'contexto-metodologia'; })[0] || null;
  var noOrigem = MAPA.nos.filter(function(n){ return n.id === 'contexto-metodologia-origem'; })[0] || null;
  var leitura = document.querySelector('[data-leitura="contexto-metodologia"]');
  var campo = document.querySelector('#pergunta [data-campo-aberto="contexto-metodologia"]');
  // A LEITURA DO CORPO — a que diz de onde vem. O nó é do cabeçalho e não tem degrau no roteiro,
  // mas o mapa continua a sabê-lo desenhar: é por aqui que se lê a frase da origem.
  var corpo = null;
  if (no) {
    INDICE = MAPA.nos.indexOf(no);
    renderPergunta();
    var q = document.getElementById('pergunta');
    var bloco = q ? q.querySelector('.leitura-do-cabecalho') : null;
    corpo = bloco ? (bloco.textContent || '').replace(/\\s+/g, ' ').trim() : null;
  }
  var noRoteiro = Array.prototype.slice.call(document.querySelectorAll('#roteiro li'))
    .map(function(li){ return (li.textContent || '').trim(); });
  return {
    existe: Boolean(no),
    noCabecalho: no ? Boolean(no.noCabecalho) : null,
    daCuradoria: no ? (no.daCuradoria || null) : null,
    noOrigem: Boolean(noOrigem),
    valorSemeado: RESPOSTAS.get('contexto-metodologia') || null,
    rotuloNaBarra: leitura ? (leitura.textContent || '').replace(/\\s+/g, ' ').trim() : null,
    leituraNoCorpo: corpo,
    temCampoNoCorpo: Boolean(campo),
    roteiro: noRoteiro
  };
})()`;

(async () => {
  // ===================================================================================
  console.log('\nA. O CONTEÚDO — a pergunta deixou de existir; o dado passou a leitura');
  const noMet = (MAPA.nos || []).find((n) => n.id === 'contexto-metodologia');
  const noOri = (MAPA.nos || []).find((n) => n.id === 'contexto-metodologia-origem');
  const bruto = CONTEUDO.blocos[0].campos;
  const brutoMet = bruto.find((c) => c.id === 'contexto-metodologia');

  provar('o nó da metodologia continua a existir (o dado não se apaga)', Boolean(noMet));
  provar('…e é do CABEÇALHO — não se preenche no corpo', noMet.noCabecalho === true, noMet && noMet.noCabecalho);
  provar('…e declara de onde vem: `daCuradoria: tradicao`', noMet.daCuradoria === 'tradicao', noMet.daCuradoria);
  provar('…e deixou de ser obrigatório (não é o professor que o responde)', noMet.obrigatorio !== true,
    noMet.obrigatorio);
  provar('…e o campo de FORMA saiu (não é escolha nem texto livre)', brutoMet.forma === undefined
    && brutoMet.aberto === undefined, brutoMet);
  provar('o nó «Quem escolhe a metodologia» já não existe — nem no conteúdo nem no mapa',
    noOri === undefined && bruto.find((c) => c.id === 'contexto-metodologia-origem') === undefined,
    Boolean(noOri));
  provar('…e nenhum outro nó pergunta «eu escolho / a escola impõe»',
    JSON.stringify(CONTEUDO).indexOf('A escola impõe') === -1);

  // ===================================================================================
  console.log('\nB e C. A PÁGINA — sem campo no corpo, e a leitura no cabeçalho');
  const a = await abrir({ tradicao: 'francesa' });
  const m = await a.w.eval(MEDIR);
  a.w.close(); a.srv.close();

  provar('a página abriu sem erro de script', a.problemas.length === 0, a.problemas.slice(0, 2));
  provar('não há campo de resposta para a metodologia no corpo do formulário',
    m.temCampoNoCorpo === false);
  provar('o roteiro não tem degrau para a metodologia',
    !m.roteiro.some((t) => /Metodologia/i.test(t)), m.roteiro.filter((t) => /Metodologia/i.test(t)));
  provar('…nem para «quem escolhe»',
    !m.roteiro.some((t) => /Quem escolhe/i.test(t)), m.roteiro.filter((t) => /Quem escolhe/i.test(t)));
  provar('o envelope foi semeado com a metodologia da curadoria (senão o documento ficava em lacuna)',
    m.valorSemeado === 'Francesa', m.valorSemeado);
  provar('o cabeçalho mostra a metodologia, com o RÓTULO do catálogo («Francesa», não `francesa`)',
    Boolean(m.rotuloNaBarra) && /Francesa/.test(m.rotuloNaBarra) && !/francesa/.test(m.rotuloNaBarra),
    m.rotuloNaBarra);
  provar('a leitura do corpo diz de onde vem — e nomeia o professor como autor da escolha',
    /curadoria/.test(m.leituraNoCorpo || '') && /professor que escolhe/.test(m.leituraNoCorpo || ''),
    m.leituraNoCorpo);
  provar('…e diz que não se preenche ali',
    /Não se preenche aqui/.test(m.leituraNoCorpo || ''), m.leituraNoCorpo);

  // ===================================================================================
  console.log('\nD. O DOCUMENTO — publica a metodologia e deixou de publicar a autoria');
  const { markdown } = derivarPlano({
    contexto: { escola: 'prova', professor: 'prova', ciclo: '01', turma: TURMA.nome },
    respostas: Object.fromEntries(Object.entries(ENVELOPE_DE_PROVA)
      .map(([k, v]) => [k, { valor: v }])),
  });
  provar('o `.md` publica «Metodologia de referência» com o valor semeado',
    /\*\*Metodologia de referência\*\*\s*\|\s*Francesa/.test(markdown),
    (markdown.match(/\*\*Metodologia[^|]*\|[^|\n]*/) || [])[0]);
  provar('…e NÃO publica «Quem escolhe a metodologia»',
    !/Quem escolhe a metodologia/.test(markdown));

  // ===================================================================================
  console.log('\nE. O CONTROLE NEGATIVO — sem curadoria, nada se inventa');
  const b = await abrir({ semCuradoria: true });
  const n = await b.w.eval(MEDIR);
  b.w.close(); b.srv.close();
  provar('sem curadoria, a metodologia NÃO é semeada', n.valorSemeado === null, n.valorSemeado);
  provar('…e o cabeçalho não a mostra (não há valor a mostrar)',
    n.rotuloNaBarra === null || !/Francesa|RAD|Vaganova/.test(n.rotuloNaBarra), n.rotuloNaBarra);
  const semMetodologia = derivarPlano({
    contexto: { escola: 'prova', professor: 'prova', ciclo: '01' }, respostas: {},
  });
  provar('…e o documento declara a lacuna em vez de escolher uma metodologia',
    /\*\*Metodologia de referência\*\*\s*\|\s*\[a decidir\]/.test(semMetodologia.markdown),
    (semMetodologia.markdown.match(/\*\*Metodologia[^|]*\|[^|\n]*/) || [])[0]);

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — a metodologia é da curadoria, lê-se no cabeçalho, e o professor deixou de a '
      + 'responder duas vezes.'
    : 'FALHARAM ' + falhas + ' de ' + total + ' asserções.'));
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
