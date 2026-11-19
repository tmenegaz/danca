'use strict';

/**
 * provar-pagina-do-professor.js — A PÁGINA QUE NASCIA MORTA (19/11/2026).
 *
 * O RELATO, com as palavras dela:
 *
 *   «Tem algo quebrando a página professores. Quando eu faço o Ctrl+Shift+R e recarrego a página, aí
 *    a página professores fica completamente travada. A URL bastidores, produção, nome, ballet,
 *    nível, fica uma URL imensa na página professores e eu não consigo editar. […] Não funciona o
 *    editar do professor. Eu já troquei de página, já fui para outros lugares, não funciona.»
 *
 * A CAUSA, e é uma linha. `retomarAbaDoProfessor()` era chamada a MEIO do script, e lê
 * `PROFESSORES_DA_ESCOLA` — uma `var` atribuída muito mais abaixo. `var` não tem zona morta: vale
 * `undefined` até à linha que a atribui, e `undefined.length` lança. Com um professor em foco no
 * `sessionStorage`, a excepção acontecia em TODAS as visitas:
 *
 *   · as declarações de função (içadas) continuavam a existir — `editarProfessor` era `function`;
 *   · as INSTRUÇÕES seguintes nunca corriam — e é nelas que vivem os ouvintes de clique de
 *     `button.editar`, o `submit` do formulário da sala e o do cadastro do professor;
 *   · sem `preventDefault`, os formulários passavam a submeter por GET e a URL enchia-se dos
 *     campos (`?nome=…&modalidade=…`) — a «URL imensa» que ela viu;
 *   · e como a chave fica no `sessionStorage`, a página nascia morta a partir do primeiro «Editar».
 *
 * O QUE ESTA PROVA MEDE, e é o que impede o regresso:
 *
 *   A. O script servido CORRE SEM UMA ÚNICA EXCEPÇÃO, com um professor em foco no `sessionStorage`
 *      (que é o estado em que ela estava). É o A/B: no `HEAD` de ontem, esta secção lança.
 *   B. Os ouvintes que faltavam EXISTEM, medidos pelo efeito e não pelo texto: clicar «Editar»
 *      preenche a ficha, e submeter o formulário não muda a URL.
 *   C. A orgânica nova: três abas, dois passos, e a modalidade no «Associar» (e não no passo 1).
 *
 *   node experimentos/provar-pagina-do-professor.js
 */

const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

const BASE = 'https://escola-de-prova.tmenegaz77.workers.dev';

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
function bloco(titulo) { console.log('\n' + titulo); }

function aPagina() {
  return bastidores.paginaProducao('breu', { escola: 'breu' },
    [{ nome: 'Ana Diag', slug: 'ana-diag', rubrica: { nome: 'Padrão', niveis: ['Ótimo', 'Bom'] } }],
    ['abreu'], 'Brise Volet', 'brise-volet', [], [], {}, [], [], [],
    { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
    { modo: 'clara', paleta: 'bordo' }, null, [], new Set(),
    { ok: true, contrato: { plano: 'avancado', capacidade: {} } });
}

/* O ATALHO QUE TORNA A PROVA ÚTIL NO «ANTES». Com o defeito, o passo 2 não existe na página (o
 * script morreu antes de o servidor o desenhar? não: o HTML é do servidor) — mas o `#passo-prof-rubrica`
 * SÓ existe depois desta correcção, e ler `.hidden` de `null` fazia a bancada rebentar em vez de
 * reprovar. Uma bancada que estoura não conta quantas asserções falham, e é isso que se quer saber. */
function el(doc, id) { return doc.getElementById(id) || { hidden: true, value: '' }; }

let JSDOM = null;
let VirtualConsole = null;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { JSDOM = null; }

(async () => {
  if (!JSDOM) {
    console.log('  —   NÃO MEDIDA: o jsdom não está instalado.');
    process.exit(0);
  }

  // -------------------------------------------------------------------------------------------
  bloco('A. O SCRIPT CORRE ATÉ AO FIM — com um professor em foco, que é o estado dela');

  /* O ESTADO SEMEADO É O QUE O «EDITAR» DEIXA: o slug em foco e a aba. É a chave que sobrevive à
   * recarga e que, no `HEAD` de ontem, fazia o arranque lançar. Sem esta semente a prova mediria
   * uma página que nunca esteve quebrada. */
  const erros = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => erros.push((e && e.detail && e.detail.message) || (e && e.message)));
  const dom = new JSDOM(aPagina().replace(/<script src="[^"]*"><\/script>/g, ''), {
    runScripts: 'dangerously', url: BASE + '/bastidores/producao', pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.alert = () => {};
      w.confirm = () => true;
      /* AS RESPOSTAS SÃO AS DAS ROTAS QUE A PÁGINA CHAMA — e a da FICHA responde com o nome, que é
       * o que `preencherFichaDoProfessor` escreve. Um `{ok: true}` vazio apagava o nome que o clique
       * já tinha posto, e a bancada leria o artefacto do stub como defeito do produto. */
      w.fetch = (u) => {
        const url = String(u);
        let corpo = { ok: true, existe: true, modalidades: [], tradicoes: {}, alunas: [], linhas: [] };
        if (url.indexOf('/ficha-do-professor') !== -1) {
          corpo = { ok: true, slug: 'ana-diag', nome: 'Ana Diag', cpf: '', telefone: '',
            email: '', modalidade: '', desligado: false };
        }
        return Promise.resolve({ ok: true, status: 200,
          json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
      };
      try {
        w.sessionStorage.setItem('producao:professor-em-foco', 'ana-diag');
        w.sessionStorage.setItem('producao:professor-passo', 'rubrica');
      } catch (err) { /* sem storage a semente não entra, e a prova mede menos — não mente */ }
    },
  });
  const win = dom.window;
  const doc = win.document;
  await new Promise((r) => win.setTimeout(r, 600));

  provar('o arranque não lança nenhuma excepção (é o defeito que travava a página)',
    erros.length === 0, erros);
  provar('…e o professor em foco foi retomado',
    String(el(doc, 'rubr-prof-alvo').value) === 'ana-diag',
    el(doc, 'rubr-prof-alvo').value);
  provar('…no passo 2 do cadastro — a régua volta à vista depois da recarga',
    !el(doc, 'passo-prof-rubrica').hidden && el(doc, 'passo-prof-cadastro').hidden === true, {
      rubrica: el(doc, 'passo-prof-rubrica').hidden,
      cadastro: el(doc, 'passo-prof-cadastro').hidden,
    });

  // -------------------------------------------------------------------------------------------
  bloco('\nB. OS OUVINTES QUE FALTAVAM — medidos pelo efeito, e não pelo texto');

  /* «NÃO FUNCIONA O EDITAR» — e a razão era o ouvinte que nunca foi registado. O que se mede é o
   * efeito: clicar o botão preenche a ficha e acende o «Cancelar». Uma asserção sobre o texto do
   * script diria que o `addEventListener` lá está, o que é verdade mesmo quando ele nunca corre. */
  const botaoEditar = [...doc.querySelectorAll('button.editar')]
    .find((b) => b.getAttribute('data-slug') === 'ana-diag');
  provar('o botão «Editar» do professor existe na listagem', !!botaoEditar, null);
  botaoEditar.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  await new Promise((r) => win.setTimeout(r, 300));
  provar('…e clicá-lo abre a ficha (o ouvinte de clique está registado)',
    String(el(doc, 'pnome').value).trim() === 'Ana'
      && String(el(doc, 'prof-alvo').value) === 'ana-diag',
    { nome: el(doc, 'pnome').value, alvo: el(doc, 'prof-alvo').value });
  provar('…acende o «Cancelar» — o que ela dizia faltar',
    el(doc, 'prof-cancelar').hidden === false, el(doc, 'prof-cancelar').hidden);
  provar('…e leva a régua dele para o passo 2',
    String(el(doc, 'rubr-nome').value) === 'Padrão', el(doc, 'rubr-nome').value);

  /* OS RÓTULOS DOS DOIS PASSOS, MEDIDOS ANTES DO SUBMIT — o submit troca o rótulo do botão por
   * «cadastrando...» enquanto o pedido corre, e uma asserção depois dele leria o estado do gesto e
   * não o da página. */
  const avancar = doc.getElementById('prof-enviar');
  provar('o passo 1 fecha com «Avançar»', avancar && avancar.textContent.trim() === 'Avançar',
    avancar && avancar.textContent);
  /* «GRAVAR É GRAVAR» (19/11/2026) — o rótulo do passo 2 passou a ser o mesmo de todas as
   * secções. Era «Gravar cadastrar professor», que é a frase a explicar-se a si própria: dois
   * verbos, e nenhum deles o que a pessoa faz. */
  const gravar = doc.getElementById('rubr-gravar');
  provar('o passo 2 fecha com «Gravar», como todas as secções',
    gravar && gravar.textContent.trim() === 'Gravar', gravar && gravar.textContent);

  /* A URL IMENSA ERA O FORMULÁRIO A SUBMETER POR GET. Aqui o `submit` é cancelado, e a prova mede
   * exactamente isso: a URL não muda. */
  const urlAntes = win.location.href;
  const formProf = doc.getElementById('form-prof');
  const ev = new win.Event('submit', { bubbles: true, cancelable: true });
  formProf.dispatchEvent(ev);
  await new Promise((r) => win.setTimeout(r, 200));
  provar('submeter o cadastro NÃO põe os campos na URL (o `preventDefault` está registado)',
    win.location.href === urlAntes && ev.defaultPrevented,
    { antes: urlAntes, depois: win.location.href, cancelado: ev.defaultPrevented });

  // -------------------------------------------------------------------------------------------
  bloco('\nC. A ORGÂNICA NOVA: TRÊS ABAS, DOIS PASSOS, E A MODALIDADE NO ASSOCIAR');

  const abas = [...doc.querySelectorAll('#pf-abas .aba')].map((b) => b.getAttribute('data-aba'));
  provar('as abas do professor são três', JSON.stringify(abas) === JSON.stringify([
    'cadastro', 'habilitacoes', 'desligamento']), abas);
  const passosProf = [...doc.querySelectorAll('#pf-passos button.passo')]
    .map((b) => b.getAttribute('data-passo-prof'));
  provar('…e o cadastro tem dois passos: cadastro e rubrica',
    JSON.stringify(passosProf) === JSON.stringify(['cadastro', 'rubrica']), passosProf);

  /* A MODALIDADE MUDOU DE PASSO — «você manteve, é para tirar […] aqui é que vem a modalidade da
   * sala, no associar». As duas asserções são a mesma pergunta em dois sítios: o campo não está no
   * passo 1, e está no passo 2. */
  const painelSala = doc.getElementById('passo-turma');
  const painelAssociar = doc.getElementById('passo-vincular');
  provar('a modalidade SAIU do passo 1 da sala',
    !painelSala.querySelector('#tmodalidade'), [...painelSala.querySelectorAll('select')]
      .map((s) => s.id));
  provar('…e está no «Associar»', !!painelAssociar.querySelector('#vinc-modalidade'), null);
  provar('…antes do professor — é ela que recorta a lista dele',
    painelAssociar.innerHTML.indexOf('vinc-modalidade') < painelAssociar.innerHTML.indexOf('vinc-professor'),
    null);
  provar('o passo 1 da sala já não exige modalidade para avançar',
    (() => {
      doc.getElementById('tnome').value = 'Rosa';
      doc.querySelector('input[name="dia"][value="seg"]').checked = true;
      doc.getElementById('tduracao').value = '45';
      doc.getElementById('tinicio').value = '2027-03-03';
      doc.getElementById('tfim').value = '2027-06-30';
      return JSON.stringify(win.faltaDaTurma()) === '[]';
    })(), win.faltaDaTurma && win.faltaDaTurma());
  /* A FALTA DA SALA MUDOU DE NOME E DE CONDIÇÃO (19/11/2026). Ela era «escolher a sala» e exigia
   * uma sala GRAVADA; desde que o «Avançar» deixou de gravar, o passo 2 é onde a sala nasce, e o que
   * se exige é que esteja COMPOSTA — aqui já está, porque a alínea de cima a preencheu. O que sobra
   * é o par do passo: a modalidade e o professor. */
  provar('…e o «Associar» pede a modalidade e o professor (a sala já está composta)',
    JSON.stringify(win.faltaDaAssociacao())
      === JSON.stringify(['escolher a modalidade', 'escolher o professor']),
    win.faltaDaAssociacao && win.faltaDaAssociacao());

  // -------------------------------------------------------------------------------------------
  console.log('\n' + (falhas ? 'FALHAS: ' + falhas + ' de ' + total : 'tudo certo: ' + total + '/' + total));
  process.exit(falhas ? 1 : 0);
})();
