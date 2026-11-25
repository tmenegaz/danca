#!/usr/bin/env node
'use strict';

/**
 * provar-ciclo-herdado-do-plano.js — o ciclo do PO não se escreve: ele vem do plano observado.
 *
 * O DEFEITO, nas palavras dela, e é a SEGUNDA vez que o pede (06/11/2026):
 *
 *   «eu quero evitar que eu tenha um plano de ensino chamado ciclo um e aí eu esqueça o número e o
 *    professor vá lá e coloque que então agora eu acho que é ciclo 20… Eu tenho que estar dentro do
 *    mesmo ciclo o plano de ensino e o plano de observação.»
 *
 * A entrega anterior foi a METADE DE BAIXO: um menu suspenso com os ciclos que têm plano, e uma
 * recusa no servidor quando os dois números divergem. Um menu oferece o leque — e o leque tem mais
 * de uma opção em qualquer escola com dois ciclos planejados. A recusa chega depois, como um «não»
 * a explicar um erro que já se escreveu. O que ela pediu é o contrário de um campo: *«quando eu
 * escolho ele, automaticamente ele tem que preencher para mim qual é o ciclo»*.
 *
 * O QUE ESTA PROVA MEDE, e cada asserção existe por um modo de falhar:
 *
 *   A. NÃO HÁ O QUE ESCREVER. O campo do ciclo, no PO, não é um `<select>` nem um campo de texto:
 *      é uma INSCRIÇÃO. É a diferença entre «oferece o leque» e «não há leque».
 *   B. O VALOR VEM DO PLANO. Com o plano do ciclo 01 escolhido, a inscrição diz 01 e o
 *      `contexto.ciclo` que o envelope levaria também.
 *   C. O GESTO DELA. Trocar o plano troca o ciclo — é exactamente o que ela descreveu, medido no
 *      DOM depois da troca, e não a promessa de que aconteceria.
 *   D. SEM PLANO NÃO SE INVENTA CICLO. A inscrição fica vazia e a NOTA diz que se escolhe o plano
 *      no primeiro bloco; o ato fica marcado como incompleto (`contextoFaltando`).
 *   E. A LACUNA TEM NOME. Um plano antigo que não declara ciclo deixa o ciclo vazio — e a nota diz
 *      isso, em vez de deixar um «—» a parecer avaria.
 *
 * O CONTROLE NEGATIVO (`--controle-negativo`) corre a MESMA medida contra `git show HEAD:porta/
 * index.html` e exige que ela REPROVE: a página de hoje ainda tem o `<select>` com os dois ciclos,
 * e é isso que prova que a prova mede alguma coisa. Sem ele, um verde aqui não diria nada.
 *
 * A PÁGINA É A FONTE (`porta/index.html`), servida por HTTP de verdade e lida em jsdom — o que se
 * afirma é a TELA, não o contrato.
 *
 *   node experimentos/provar-ciclo-herdado-do-plano.js
 *   node experimentos/provar-ciclo-herdado-do-plano.js --controle-negativo
 */

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.join(__dirname, '..');
const CONTEUDO_PO = path.join(RAIZ, 'porta/po/conteudo/po.json');
const PAGINA_FONTE = path.join(RAIZ, 'porta/index.html');
/* OS ASSETS SÃO OS DA FONTE, e não os de um pacote. A bancada vizinha
 * (`provar-dimensoes-plano`) servia os de `professores/perna-boa/ciclos/ciclo-01-batata`, que já
 * não existe — e o sintoma era a página a morrer em `Markdown is not defined`, porque a bancada
 * devolvia o `index.html` para todo pedido de asset. A fonte é `porta/assets` (o `markdown.js`) e
 * `tools/templates` (a `style.css` e o `nav.js` da raiz). */
const ASSETS_PAGINA = path.join(RAIZ, 'porta/assets');
const ASSETS_RAIZ = path.join(RAIZ, 'tools/templates');

const NEGATIVO = process.argv.includes('--controle-negativo');
/** A página sob prova: a fonte, ou — no controle negativo — a de HEAD. */
let PAGINA_HTML = PAGINA_FONTE;

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* OS DOIS PLANOS DO CENÁRIO — e é ele que reproduz o que ela viu. O plano do ciclo 01 e o do
 * ciclo 02 existem ao mesmo tempo, como numa escola que já planejou dois ciclos. Com a lista
 * suspensa, os dois estavam oferecidos; o professor podia observar o plano do 01 e declarar 02. */
const PLANO_A = {
  id: 'plano-20260101-0100',
  contexto: { escola: 'barra', professor: 'leticia', ciclo: '01', turma: 'Balé Nível 1' },
  respostas: { 'objetivo-geral': { valor: 'Consolidar o alinhamento' } },
};
const PLANO_B = {
  id: 'plano-20260102-0200',
  contexto: { escola: 'barra', professor: 'leticia', ciclo: '02', turma: 'Balé Nível 1' },
  respostas: { 'objetivo-geral': { valor: 'Ampliar o repertório' } },
};
/** Um plano antigo, sem ciclo no contexto — o caso em que derivar é impossível. */
const PLANO_SEM_CICLO = {
  id: 'plano-antigo',
  contexto: { escola: 'barra', professor: 'leticia', turma: 'Balé Nível 1' },
  respostas: { 'objetivo-geral': { valor: 'Plano de antes do ciclo' } },
};

/** A ESTANTE VAZIA é um estado real: um professor que ainda não tem plano de ensino nenhum. */
let ESTANTE_VAZIA = false;
const PLANOS = () => (ESTANTE_VAZIA ? [] : [PLANO_A, PLANO_B, PLANO_SEM_CICLO]);

/** As rotas que a página pediu — é com elas que se prova que o PO não busca lista de ciclos. */
let PEDIDOS = [];

let PORTA = 0;
const PAGINA = () => `http://127.0.0.1:${PORTA}/plano-observacao/`;
const MIME = { '.html': 'text/html;charset=utf-8', '.json': 'application/json;charset=utf-8',
  '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

function apiDe(rota) {
  if (rota.startsWith('api/mapa')) {
    const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
    return { ok: true, ...porta.mapa(JSON.parse(fs.readFileSync(CONTEUDO_PO, 'utf8'))) };
  }
  if (rota.startsWith('api/planos')) {
    /* A ESTANTE DIZ O CICLO DE CADA PLANO — é o dado que a inscrição lê antes de o envelope
     * chegar. O servidor já o devolvia (`porta.planos` → `ciclo`), e é por isso que esta mudança
     * não precisou de rota nova. */
    return {
      ok: true,
      opcoes: PLANOS().map((p) => ({
        valor: p.id, carimbo: p.id, rotulo: p.respostas['objetivo-geral'].valor,
        detalhe: 'api/envelope/' + p.id, escola: 'barra', professor: 'leticia',
        turma: p.contexto.turma, ciclo: p.contexto.ciclo || null,
      })),
    };
  }
  if (rota.startsWith('api/envelope/')) {
    const id = decodeURIComponent(rota.slice('api/envelope/'.length));
    return PLANOS().find((p) => p.id === id) || { id, contexto: {}, respostas: {} };
  }
  if (rota.startsWith('api/anamneses')) {
    return { ok: true, opcoes: [], recorte: [] };
  }
  if (rota.startsWith('api/ciclos')) {
    /* A LISTA ANTIGA, e ela ainda responde: se a página nova a pedir, o pedido aparece em
     * `PEDIDOS` e a asserção A falha. Não se retira a rota do servidor — ela é do PLANO DE
     * ENSINO, que é onde um ciclo nasce. */
    return { ok: true, ciclos: [{ ciclo: '01', planos: 1, pos: 0, temPlano: true }],
      proximo: '02', comPlano: ['01', '02'] };
  }
  if (rota.startsWith('api/bastidores/turmas')) return { ok: true, turmas: [] };
  if (rota.startsWith('api/bastidores/')) return {};
  if (rota.startsWith('api/')) return { ok: true, opcoes: [], estados: [] };
  return null;
}

const servidor = http.createServer((req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, PAGINA()).pathname).replace(/^\/+/, '');
  const envia = (corpo, tipo) => { res.writeHead(200, { 'Content-Type': tipo }); res.end(corpo); };
  if (caminho.startsWith('plano-observacao/api/')) {
    const rota = caminho.slice('plano-observacao/'.length);
    PEDIDOS.push(rota);
    const dados = apiDe(rota);
    if (dados) return envia(JSON.stringify(dados), MIME['.json']);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('404 ' + rota);
  }
  if (caminho === 'plano-observacao/' || caminho === 'plano-observacao/index.html') {
    return envia(fs.readFileSync(PAGINA_HTML), MIME['.html']);
  }
  if (caminho === 'plano-observacao/po/conteudo/po.json') {
    return envia(fs.readFileSync(CONTEUDO_PO), MIME['.json']);
  }
  const base = caminho.startsWith('plano-observacao/assets/') ? ASSETS_PAGINA : ASSETS_RAIZ;
  /* A `style.css` do pacote é uma CÓPIA da folha de `tools/templates/ciclo.css` — o nome muda, a
   * peça é a mesma. Servir a fonte é o que mantém esta bancada a medir a identidade de hoje. */
  const pedido = path.basename(caminho);
  const arquivo = path.join(base, pedido === 'style.css' ? 'ciclo.css' : pedido);
  if (/^(plano-observacao\/)?assets\//.test(caminho) && fs.existsSync(arquivo)) {
    return envia(fs.readFileSync(arquivo), MIME[path.extname(arquivo)] || 'application/octet-stream');
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 ' + caminho);
});

const espera = (win, ms = 150) => new Promise((r) => win.setTimeout(r, ms));

/**
 * ESPERAR POR UMA CONDIÇÃO, E NÃO POR UM TEMPO (25/11/2026).
 *
 * O QUE ACONTECEU. Aqui estava `await espera(win, 350)` antes de `win.eval('iniciar()…')`, e a
 * linha seguinte rebentava com `ReferenceError: iniciar is not defined` — **uma vez em quatro**
 * corridas da bateria inteira, e nunca quando a prova corria sozinha. Reproduzido: seis cópias em
 * paralelo dão uma falha em seis. O jsdom carrega `nav.js` e o script da página de forma
 * assíncrona (`resources: 'usable'`), e 350 ms chegam com a máquina livre e não chegam com seis
 * node a competir.
 *
 * O defeito não era a espera ser curta — era ser uma ESPERA. Uma prova que mede a tela não pode
 * depender de a tela ter tido tempo: espera-se pela CONDIÇÃO que se vai usar, com um tecto, e é o
 * tecto que falha quando algo está mesmo partido. É a mesma correcção que o
 * `provar-o-parametro-do-plano` já tinha recebido.
 */
async function esperarPor(win, condicao, capMs = 15000, passo = 25) {
  const inicio = Date.now();
  for (;;) {
    let ok = false;
    try { ok = await condicao(); } catch (erro) { ok = false; }
    if (ok) return true;
    if (Date.now() - inicio >= capMs) return false;
    await espera(win, passo);
  }
}

async function abrir() {
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
  vc.on('error', (...a) => problemas.push(a.join(' ')));
  const dom = await JSDOM.fromURL(PAGINA(), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), PAGINA()), i);
      w.confirm = () => true;
      w.alert = () => {};
    },
  });
  const win = dom.window;
  /* A CONDIÇÃO É A QUE A LINHA SEGUINTE USA — `iniciar` existir. Enquanto o script da página não
   * tiver corrido, a função não existe, e um `eval` que a chame rebenta com `ReferenceError`. */
  const chegou = await esperarPor(win, () => typeof win.iniciar === 'function');
  if (!chegou) {
    throw new Error('a página não arrancou em 15 s: `iniciar` não existe na janela '
      + '(o script de `porta/index.html` não chegou a correr)');
  }
  /* O ARRANQUE É ESPERADO, E NÃO CORRIDO ATRÁS. O jsdom aborta o primeiro `iniciar()` a meio
   * («Not implemented: navigation to another Document»), e o que fica de fora é justamente o fim
   * da função — onde os ouvintes de `#pergunta` são presos. Sem esta linha a bancada dispara um
   * `change` que cai no vazio, e mede a sua própria pressa. Aqui espera-se o arranque da própria
   * página (a mesma `iniciar`, uma segunda vez: ela é idempotente por desenho — preencher duas
   * vezes o mesmo campo dá o mesmo campo). */
  await win.eval('iniciar().catch(() => {})');
  await espera(win, 300);
  return { dom, win, doc: win.document, problemas };
}

/**
 * ESCOLHE UM PLANO — o mesmo caminho que o gesto dela percorre.
 *
 * A PESSOA marca o rádio da opção, e o `change` que o browser dispara sobe até o ouvinte
 * delegado de `#pergunta`, que chama `gravarRespostaDoNo(MAPA.nos[INDICE])`. É essa função que
 * grava a resposta e manda o cabeçalho refazer-se — e é ela que esta bancada chama, depois de
 * marcar o rádio como o browser marcaria.
 *
 * **PORQUE NÃO O `change` SINTÉTICO, e é uma limitação da bancada, dita por palavras:** em
 * jsdom, um `change` disparado sobre o rádio CHEGA ao elemento (`addEventListener` no
 * `#pergunta` conta-o) e NÃO chega ao ouvinte delegado da página — medido, e sem erro nenhum
 * pelo caminho. A ligação dos ouvintes é anterior a esta mudança e é a mesma de todos os campos
 * da página (é ela que grava qualquer resposta); o que esta prova mede é outra coisa: que o
 * ciclo do cabeçalho NASCE do plano no momento em que a resposta do plano é gravada. Medir a
 * ligação de ouvintes aqui seria medir o jsdom, não a tela.
 */
async function escolherPlano(win, carimbo) {
  const escolhido = await win.eval(`(async () => {
    const i = MAPA.nos.findIndex((n) => n.id === 'plano-de-ensino');
    if (i < 0) return { ok: false, porque: 'o no plano-de-ensino nao esta no mapa' };
    irPara(i);
    await new Promise((r) => setTimeout(r, 60));
    const alvo = document.querySelector('#pergunta input[name="valor"][value=' + JSON.stringify(${JSON.stringify(carimbo)}) + ']');
    if (!alvo) {
      return { ok: false, porque: 'a opção não está na tela',
        naTela: [...document.querySelectorAll('#pergunta input[name="valor"]')].map((e) => e.value) };
    }
    alvo.checked = true;
    gravarRespostaDoNo(MAPA.nos[INDICE]);
    return { ok: String(RESPOSTAS.get('plano-de-ensino')) === ${JSON.stringify(carimbo)},
      resposta: String(RESPOSTAS.get('plano-de-ensino')) };
  })()`);
  if (!escolhido.ok) {
    throw new Error('a escolha do plano «' + carimbo + '» não chegou à página: '
      + JSON.stringify(escolhido));
  }
  /* A LEITURA DO ENVELOPE DO PLANO É ASSÍNCRONA (`carregarPlanoReferenciado`): o ciclo vem dela
   * quando chega. Espera-se — é o tempo que a tela real também leva. */
  await espera(win, 350);
}

const inscricao = (doc) => doc.getElementById('ctx-ciclo-nome');
/** O TEXTO da inscrição, e vazio quando ela não existe — a página de HEAD não a tem, e o controle
 * negativo tem de REPROVAR as asserções em vez de rebentar na primeira. */
const textoDaInscricao = (doc) => { const e = inscricao(doc); return e ? e.textContent.trim() : ''; };
const valor = (doc) => String((doc.getElementById('ctx-ciclo') || {}).value || '');
const nota = (doc) => String((doc.getElementById('ctx-ciclo-nota') || {}).textContent || '');

(async () => {
  if (NEGATIVO) {
    const temp = path.join(os.tmpdir(), 'porta-ciclo-negativo.html');
    fs.writeFileSync(temp, execSync('git show HEAD:porta/index.html', { cwd: RAIZ, maxBuffer: 64 * 1024 * 1024 }));
    PAGINA_HTML = temp;
    console.log('CONTROLE NEGATIVO — a porta de HEAD (o ciclo do PO ainda é uma lista)\n');
  } else {
    console.log('PO — o ciclo vem do plano de ensino observado\n');
  }
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  PORTA = servidor.address().port;

  const { win, doc, problemas } = await abrir();
  PEDIDOS = PEDIDOS.slice();

  /* ------------------------------------------------------------------------------------- */
  console.log('A. Não há o que escrever — o campo do ciclo não é um campo');
  {
    const entrada = doc.getElementById('ctx-ciclo');
    provar('o ciclo do PO é um `<input type="hidden">`, e não um campo de texto',
      Boolean(entrada) && String(entrada.getAttribute('type')) === 'hidden',
      entrada && entrada.getAttribute('type'));
    provar('…não existe `<select id="ctx-ciclo">` (a lista suspensa saiu)',
      doc.querySelector('select#ctx-ciclo') === null);
    provar('…e não sobra um campo editável de ciclo no cabeçalho',
      doc.querySelector('#ctx-ciclo-campo input:not([type=hidden])') === null,
      [...doc.querySelectorAll('#ctx-ciclo-campo input')].map((e) => e.getAttribute('type')));
    provar('o rótulo é uma `.ctx-rotulo`, e não um `<label for>` de um controle que não existe',
      doc.querySelector('#ctx-ciclo-campo > .ctx-rotulo') !== null
        && doc.querySelector('#ctx-ciclo-campo > label[for="ctx-ciclo"]') === null);
    provar('o valor é uma INSCRIÇÃO (`.ctx-inscricao`), a peça que o cabeçalho já usa para a turma',
      Boolean(inscricao(doc)) && inscricao(doc).classList.contains('ctx-inscricao'));
    /* A LISTA DE CICLOS NÃO SE PEDE. É a prova mais directa de que o leque deixou de existir: se
     * a página ainda perguntasse ao servidor quais são os ciclos, haveria uma lista a escolher. */
    provar('o PO não pede a lista de ciclos ao servidor (a lista era o leque)',
      PEDIDOS.filter((r) => r.indexOf('api/ciclos') === 0).length === 0,
      PEDIDOS.filter((r) => r.indexOf('api/ciclos') === 0));
  }

  /* ------------------------------------------------------------------------------------- */
  console.log('\nB. O valor vem do plano — e o envelope leva o mesmo');
  {
    await escolherPlano(win, PLANO_A.id, problemas);
    provar('com o plano do ciclo 01 escolhido, a inscrição diz 01',
      textoDaInscricao(doc) === '01', textoDaInscricao(doc));
    provar('…e o valor que o envelope leva (`contexto.ciclo`) também é 01',
      valor(doc) === '01' && win.eval('contextoDoAto().ciclo') === '01',
      { campo: valor(doc), contexto: win.eval('contextoDoAto().ciclo') });
    provar('a nota diz que não se escreve, e porquê',
      /Não se escreve/.test(nota(doc)) && /plano de ensino/.test(nota(doc)), nota(doc));
  }

  /* ------------------------------------------------------------------------------------- */
  console.log('\nC. O gesto dela: trocar o plano troca o ciclo');
  {
    await escolherPlano(win, PLANO_B.id, problemas);
    provar('escolher o plano do ciclo 02 passa a inscrição a 02',
      textoDaInscricao(doc) === '02', textoDaInscricao(doc));
    provar('…e o contexto acompanha, sem ninguém ter escrito nada',
      win.eval('contextoDoAto().ciclo') === '02', win.eval('contextoDoAto().ciclo'));
    provar('a nota deixa de nomear o ciclo anterior',
      !/01/.test(nota(doc)), nota(doc));
  }

  /* ------------------------------------------------------------------------------------- */
  console.log('\nD. Sem plano não se inventa ciclo');
  {
    /* A ESTANTE VAZIA: um professor que ainda não tem plano de ensino. É o único estado em que o
     * PO existe sem plano escolhido — e é onde a tentação de «sugerir 01» apareceria. */
    ESTANTE_VAZIA = true;
    const semEstante = await abrir();
    ESTANTE_VAZIA = false;
    provar('sem nenhum plano na estante, a inscrição do ciclo fica vazia',
      textoDaInscricao(semEstante.doc) === '',
      textoDaInscricao(semEstante.doc));
    provar('…e o valor que o envelope levaria também',
      semEstante.win.eval('contextoDoAto().ciclo') === '',
      semEstante.win.eval('contextoDoAto().ciclo'));
    provar('a nota diz que se escolhe o plano, em vez de deixar um «—» a parecer avaria',
      /escolha-o/i.test(nota(semEstante.doc)), nota(semEstante.doc));
    provar('o ato fica marcado como incompleto (o ciclo falta)',
      semEstante.win.eval('contextoFaltando().indexOf("ciclo") !== -1'),
      semEstante.win.eval('contextoFaltando()'));
    provar('…e nenhum erro de jsdom ao abrir sem estante',
      semEstante.problemas.length === 0, semEstante.problemas);
  }

  /* ------------------------------------------------------------------------------------- */
  console.log('\nE. A lacuna tem nome: um plano antigo que não declara ciclo');
  {
    await escolherPlano(win, PLANO_SEM_CICLO.id, problemas);
    provar('a inscrição fica vazia — não se inventa um ciclo', textoDaInscricao(doc) === '',
      textoDaInscricao(doc));
    provar('…e a nota diz que o PLANO não declara ciclo',
      /não declara ciclo/.test(nota(doc)), nota(doc));
  }

  /* ------------------------------------------------------------------------------------- */
  console.log('\nF. A página não rebentou ao fazer tudo isto');
  {
    provar('nenhum erro de jsdom durante a execução', problemas.length === 0, problemas);
  }

  servidor.close();
  const total = provas;
  console.log('');
  if (NEGATIVO) {
    /* NO CONTROLE NEGATIVO O VERDE É REPROVAR: se a página de HEAD passasse estas asserções, elas
     * não estariam a medir a mudança — estariam a medir o que sempre foi. */
    const passou = provas - falhas;
    if (falhas === 0) {
      console.log('FALHOU O CONTROLE — a página de HEAD passou as ' + total
        + ' asserções: esta prova não mede o que diz medir.');
      process.exit(1);
    }
    console.log('TUDO CERTO (controle negativo) — a porta de HEAD reprova em ' + falhas
      + ' de ' + total + ' asserções, e as que passam (' + passou + ') são as que não mudaram.');
    process.exit(0);
  }
  console.log(falhas === 0
    ? 'TUDO CERTO — ' + total + ' asserções: o ciclo do Plano de Observação não se escreve, vem do plano de ensino observado, e a tela diz de onde.'
    : 'FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('\nERRO na prova:', erro && erro.stack ? erro.stack : erro);
  try { servidor.close(); } catch (e) { /* já fechado */ }
  process.exit(1);
});
