'use strict';

/**
 * provar-elenco-na-turma.js — O ELENCO RECÉM-CRIADO CHEGA À TURMA SEM F5 (07/11/2026).
 *
 * O DEFEITO, tal como ela o relatou: «quando o professor cria uma Audição e logo em seguida vai
 * atribuir esse elenco na Turma, o elenco recém-criado não aparece na lista de seleção. Atualmente,
 * o professor é obrigado a recarregar a página manualmente para que o dado apareça.»
 *
 * A CAUSA NÃO ERA O DADO. A rota `/api/bastidores/linhas-de-base` já devolvia o elenco novo no
 * instante seguinte à gravação. O que estava fechado no tempo era a LISTA, e em dois sítios ao
 * mesmo tempo: as `<option>` do `<select id="cuelenco">`, escritas pelo servidor no HTML, e o
 * `ELENCOS` — o var que a nota do elenco consulta. Atualizar um só deixaria a nota a mentir sobre
 * um elenco que já se podia escolher.
 *
 * O CONSERTO, e a parte que esta prova guarda: a lista passa a ser RECALCULADA no cliente a cada
 * `carregarLinhas()` — que é por onde passa toda a gravação do elenco (criar, editar, concluir,
 * apagar, ler as anamneses) —, e o QUE é um elenco vem do servidor, por uma função só
 * (`elencosParaATurma`). Se o cliente filtrasse ou rotulasse por conta própria, haveria duas
 * regras, e duas divergem ao primeiro campo novo.
 *
 * O QUE SE PROVA, e por que cada coisa:
 *
 *   1. A REGRA. Uma linha apagada não é elenco; a que não tem recorte é rascunho; o rótulo diz
 *      quantas alunas e avisa do rascunho. É a frase que se lê no `<select>`, e ela tem de estar
 *      certa nos dois números — o singular e o plural.
 *   2. A ROTA. A resposta de `…/linhas-de-base` leva `elencos` prontos. Sem isto o cliente não tem
 *      de onde os tirar, e voltaria a haver uma regra só no HTML.
 *   3. O CLIENTE A CORRER, em jsdom: a página nasce SEM elenco nenhum, o professor cria um, e a
 *      `<option>` aparece — junto com o `ELENCOS` e a nota. É o defeito, medido onde ele vivia.
 *   4. A ESCOLHA NÃO SE PERDE. Quem está a editar uma Turma e vai criar um elenco volta com o
 *      formulário preenchido; limpar-lhe a escolha seria trocar um defeito por outro.
 *   5. O ELENCO APAGADO SAI. E sai da nota também — não se diz o estado de um elenco que já não
 *      existe, nem se deixa o `<select>` a apontar para ele.
 *   6. O PRIMEIRO DESENHO E A REPINTURA DIZEM O MESMO. É o que impede o defeito de voltar por
 *      outra porta: se as duas listas divergirem, a página muda de conteúdo ao primeiro refresh.
 *
 *   node experimentos/provar-elenco-na-turma.js
 */

const path = require('node:path');
const fs = require('node:fs');

const RAIZ = path.resolve(__dirname, '..');
const BASTIDORES = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
function bloco(titulo) { console.log('\n' + titulo); }

const USOS = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };

/** A página da Produção, com a lista de linhas de base que o servidor teria no arranque. */
function pagina(linhas) {
  return BASTIDORES.paginaProducao('calango', { nome: 'Calango', modalidade: 'bale-classico' },
    [], [], 'Dono', 'dono', [], [], {}, [], [], [], USOS,
    { modo: 'clara', paleta: 'bordo' }, '', linhas || []);
}

// ---------------------------------------------------------------------------
// 1. A REGRA — o que é um elenco, e como se rotula
// ---------------------------------------------------------------------------
bloco('1. A REGRA: o que é um elenco, e como se rotula');

const LINHAS = [
  { id: 'elenco-1', nome: 'Tami', alunas: ['Aluna A', 'Aluna B'], campos: [{ id: 'a' }, { id: 'b' }] },
  { id: 'elenco-2', nome: 'Só uma', alunas: ['Aluna C'], campos: [{ id: 'a' }] },
  { id: 'elenco-3', nome: 'Sem recorte', alunas: ['Aluna A'], campos: [] },
  { id: 'elenco-4', nome: 'Apagado', alunas: ['Aluna B'], campos: [{ id: 'a' }], apagada_em: '2026-11-07T10:00:00Z' },
  { id: 'elenco-5', alunas: [], campos: [] },
];
const ELENCOS = BASTIDORES.elencosParaATurma(LINHAS);

provar('as linhas apagadas não são elencos', ELENCOS.length === 4
  && !ELENCOS.some((e) => e.id === 'elenco-4'), ELENCOS.map((e) => e.id));
provar('a ordem é a da fonte — a lista não se reordena no cliente',
  ELENCOS.map((e) => e.id).join(',') === 'elenco-1,elenco-2,elenco-3,elenco-5',
  ELENCOS.map((e) => e.id));
provar('o rótulo conta as alunas no plural', ELENCOS[0].rotulo === 'Tami — 2 alunas', ELENCOS[0].rotulo);
provar('e no singular quando é uma', ELENCOS[1].rotulo === 'Só uma — 1 aluna', ELENCOS[1].rotulo);
provar('rascunho é NÃO ter recorte escolhido', ELENCOS[2].rascunho === true
  && ELENCOS[0].rascunho === false, [ELENCOS[0].rascunho, ELENCOS[2].rascunho]);
provar('e o rascunho avisa-se no próprio rótulo',
  ELENCOS[2].rotulo === 'Sem recorte — 1 aluna (rascunho)', ELENCOS[2].rotulo);
/* Sem `nome` — e sem `campos`, que é o mesmo que dizer rascunho — o rótulo cai no `id` e diz
   as duas coisas. Uma opção em branco no `<select>` seria a pior saída: escolhe-se sem saber o quê. */
provar('elenco sem nome declarado usa o id — não fica uma opção em branco',
  ELENCOS[3].nome === 'elenco-5' && ELENCOS[3].rotulo === 'elenco-5 — 0 alunas (rascunho)',
  ELENCOS[3].rotulo);
provar('as alunas viajam em texto, e a nota do elenco conta-as',
  Array.isArray(ELENCOS[0].alunas) && ELENCOS[0].alunas.join('|') === 'Aluna A|Aluna B',
  ELENCOS[0].alunas);

// ---------------------------------------------------------------------------
// 2. A ROTA — os elencos vão prontos, e não são uma segunda regra
// ---------------------------------------------------------------------------
bloco('\n2. A ROTA: `…/linhas-de-base` leva os elencos prontos');

const FONTE = fs.readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8');
const ROTA = (() => {
  const i = FONTE.indexOf("if (path === '/api/bastidores/linhas-de-base')");
  return i === -1 ? '' : FONTE.slice(i, i + 9000);
})();
/* A FUNÇÃO PASSOU A SER `elencosComAsTurmas` EM 12/11/2026, e a asserção mudou com ela — não
 * desapareceu. A lista que a rota devolve passou a levar o vínculo de cada elenco com a sua turma
 * (`emTurma`, `rotuloMover`), para a repintura do cliente não perder o que a página já dizia. O que
 * se continua a exigir é o essencial: a rota NÃO compõe a lista por sua conta — chama a função que
 * a página também chama. */
provar('a resposta da rota inclui `elencos`',
  /elencos:\s*elencosComAsTurmas\(/.test(ROTA), ROTA ? 'achou a rota' : 'não achou a rota');
provar('e sai da MESMA função que desenha a página — não de uma segunda cópia',
  (ROTA.match(/elencosComAsTurmas\(/g) || []).length === 1
    && (ROTA.match(/elencosParaATurma\(/g) || []).length === 0,
  { comTurmas: (ROTA.match(/elencosComAsTurmas\(/g) || []).length,
    crua: (ROTA.match(/elencosParaATurma\(/g) || []).length });
provar('…e essa função usa a regra única do rótulo (`elencosParaATurma`)',
  /function elencosComAsTurmas\([\s\S]{0,400}?elencosParaATurma\(/.test(FONTE),
  'procura no ficheiro');

// ---------------------------------------------------------------------------
// 3. O CLIENTE A CORRER — o defeito, medido onde ele vivia
// ---------------------------------------------------------------------------
(async () => {
  let JSDOM, VirtualConsole;
  try {
    ({ JSDOM, VirtualConsole } = require('jsdom'));
  } catch (e) {
    console.error('provar-elenco-na-turma: jsdom ausente: ' + e.message);
    process.exit(2);
  }

  // O que o servidor devolve a cada `fetch`. A prova muda-o para simular criar e apagar.
  let DO_SERVIDOR = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', () => {});
  vc.on('error', () => {});

  const dom = new JSDOM(pagina([]).replace(/<script src="[^"]*"><\/script>/g, ''), {
    runScripts: 'dangerously', url: 'https://calango.workers.dev/bastidores/producao',
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.confirm = () => true;
      w.alert = () => {};
      w.fetch = (u) => {
        const url = String(u);
        const corpo = url.indexOf('linhas-de-base') !== -1
          ? { ok: true, linhas: DO_SERVIDOR, elencos: BASTIDORES.elencosParaATurma(DO_SERVIDOR) }
          : { ok: true };
        return Promise.resolve({ ok: true, status: 200,
          json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
      };
    },
  });
  const win = dom.window;
  await new Promise((r) => win.setTimeout(r, 300));

  const sel = win.document.getElementById('cuelenco');
  const nota = win.document.getElementById('cu-elenco-nota');
  const texto = () => Array.prototype.slice.call(sel.options).map((o) => o.textContent);

  bloco('\n3. O CLIENTE A CORRER: a página nasce sem elenco, o professor cria um');

  provar('o `<select>` da Turma está na página', !!sel);
  provar('sem elenco nenhum, a única opção diz isso',
    sel.options.length === 1 && texto()[0] === BASTIDORES.ROTULO_NENHUM_ELENCO, texto());
  provar('e o `ELENCOS` do cliente arranca vazio', win.ELENCOS.length === 0, win.ELENCOS.length);

  // O PROFESSOR CRIA O ELENCO NA AUDIÇÃO. O servidor passa a devolvê-lo; `carregarLinhas` corre
  // no fim da gravação — é o caminho que a tela já usava.
  DO_SERVIDOR = LINHAS.slice(0, 3);
  await win.carregarLinhas();
  await new Promise((r) => win.setTimeout(r, 60));

  provar('a `<option>` do elenco recém-criado APARECE sem recarregar a página',
    texto().some((t) => t === 'Tami — 2 alunas'), texto());
  provar('as outras duas também, na ordem da fonte',
    texto().join(' | ') === '— escolher — | Tami — 2 alunas | Só uma — 1 aluna | Sem recorte — 1 aluna (rascunho)',
    texto());
  provar('o `ELENCOS` do cliente foi atualizado com a lista do servidor',
    win.ELENCOS.length === 3 && win.ELENCOS[0].id === 'elenco-1', win.ELENCOS.map((e) => e.id));
  provar('e a opção vazia deixou de dizer «nenhum» — passou a «escolher»',
    texto()[0] === BASTIDORES.ROTULO_ESCOLHER_ELENCO, texto()[0]);

  // -------------------------------------------------------------------------
  bloco('\n4. A ESCOLHA EM CURSO NÃO SE PERDE');

  sel.value = 'elenco-2';
  win.mostrarElenco('elenco-2');
  provar('a nota diz o estado do elenco escolhido',
    nota.hidden === false && /Só uma/.test(nota.textContent) && /1 aluna/.test(nota.textContent),
    { hidden: nota.hidden, texto: nota.textContent });

  // Uma gravação qualquer volta a repintar a lista.
  DO_SERVIDOR = LINHAS.slice(0, 3);
  await win.carregarLinhas();
  await new Promise((r) => win.setTimeout(r, 60));
  provar('a escolha em curso sobrevive a uma repintura', sel.value === 'elenco-2', sel.value);
  provar('e a nota continua a dizer o mesmo',
    nota.hidden === false && /Só uma/.test(nota.textContent), nota.textContent);

  // -------------------------------------------------------------------------
  bloco('\n5. O ELENCO APAGADO SAI — da lista e da nota');

  DO_SERVIDOR = LINHAS.filter((l) => l.id !== 'elenco-2');
  await win.carregarLinhas();
  await new Promise((r) => win.setTimeout(r, 60));
  provar('a opção do elenco apagado desaparece',
    !texto().some((t) => /Só uma/.test(t)), texto());
  provar('e o `<select>` não fica a apontar para ele', sel.value === '', sel.value);
  provar('a nota desaparece: não se diz o estado de um elenco que já não existe',
    nota.hidden === true && nota.textContent === '', { hidden: nota.hidden, texto: nota.textContent });

  // -------------------------------------------------------------------------
  bloco('\n6. O PRIMEIRO DESENHO E A REPINTURA DIZEM O MESMO');

  const opcoesDoServidor = (() => {
    const html = pagina(LINHAS.slice(0, 3));
    const m = /<select id="cuelenco">([\s\S]*?)<\/select>/.exec(html);
    return m ? [...m[1].matchAll(/<option[^>]*>([\s\S]*?)<\/option>/g)].map((x) => x[1]) : null;
  })();
  provar('o HTML do servidor já traz as mesmas opções',
    !!opcoesDoServidor && opcoesDoServidor.length === 4, opcoesDoServidor);

  DO_SERVIDOR = LINHAS.slice(0, 3);
  await win.carregarLinhas();
  await new Promise((r) => win.setTimeout(r, 60));
  provar('e a repintura do cliente diz exactamente o mesmo',
    JSON.stringify(opcoesDoServidor) === JSON.stringify(texto()),
    { servidor: opcoesDoServidor, cliente: texto() });

  win.close();

  console.log('\n' + (falhas
    ? 'FALHOU — ' + falhas + ' de ' + total + ' asserções'
    : 'TUDO CERTO — ' + total + ' asserções, 0 falha(s)') + '.');
  process.exit(falhas ? 1 : 0);
})().catch((err) => {
  console.error('provar-elenco-na-turma: ' + (err && err.message ? err.message : err));
  process.exit(2);
});
