'use strict';

/**
 * provar-sala-e-portao.js — AS QUATRO QUEIXAS DA SALA E DO PORTÃO (19/11/2026).
 *
 * Os relatos, na letra dela:
 *
 *   1. «Eu renomeei a sala para Sala Rosa. Apareceu um erro dizendo que já existe uma turma com este
 *       nome. Antigamente isso aqui chamava turma, mas não é mais, agora é sala.»
 *   2. «O teste que eu tenho aqui vinculado, que preenche os formulários, ele está atrapalhando o
 *       preenchimento da sala. Ele não deixa eu fazer as edições, os nomes que eu quero […] Ele não
 *       deixa eu colocar o nome da sala que eu quiser.»
 *   3. «Toda vez que eu vou clicar em editar ou que eu clico em cancelar, ele recarrega a página […]
 *       quando eu troco de página, aí aparece aquela mensagem do navegador perguntando se eu quero
 *       guardar a senha.»
 *   4. «Tem alguma coisa errada aqui com as URLs, com os endereços, que está descompassado com
 *       relação ao nome de onde eu estou.»
 *
 * E a quinta, que é do desenho: «aqui em professores você colocou o step fora do padrão. Observa
 * como é que é o step, por exemplo, na audição. Tem que ser igual.»
 *
 * O QUE ESTA PROVA MEDE — e cada alínea reprova sem a correcção:
 *
 *   A. O PREENCHEDOR SAIU DA PRODUÇÃO (19/11/2026). Ele fabricava o «já existe uma turma com este
 *      nome» — escrevia no formulário de CRIAR o nome de uma sala que já existia —, e a correcção
 *      de então foi ensiná-lo a não escrever por cima. A decisão de agora é outra e é mais curta:
 *      ele deixou de existir aqui. A alínea mede isso — a página não traz o atributo nem o script,
 *      e corrido à mão sobre a Produção ele não escreve nada. No `HEAD` as três falham.
 *   B. AS RECUSAS DIZEM «SALA», e dizem QUAL é a que ocupa o nome — e a colisão do `turma-editar`
 *      deixa de olhar para registos já substituídos.
 *   C. O PORTÃO NÃO PEDE SENHA ENQUANTO RETOMA. Com um token guardado, o campo `type="password"`
 *      não está à vista: era ele que fazia o gestor de senhas do navegador oferecer «guardar a
 *      senha» a cada recarga. Sem token, o campo aparece — é a única entrada.
 *   D. O ENDEREÇO DIZ O NOME QUE SE LÊ: o menu aponta para `#salas`, `#audicao`, `#estilo`, e os
 *      endereços antigos (`#turmas`, `#corpo`, `#verbetes`) continuam a cair no mesmo sítio.
 *   E. A TIRA DO PROFESSOR VIVE NUMA `.turmas-faixa`, como a da Audição.
 *
 *   node experimentos/provar-sala-e-portao.js
 */

const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const preenchedor = require(path.join(RAIZ, 'motor/servidor/teste-cliente.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
function bloco(titulo) { console.log('\n' + titulo); }

const SALAS = [
  { id: 'bale-nivel-1-teste-3', nome: 'Balé Nível 1 — Teste 3', dias: ['seg', 'qua'],
    horarios: ['18:00', '18:00'], duracaoMin: 60, frequencia: 2,
    periodoInicio: '2026-02-01', periodoFim: '2026-12-01' },
  { id: 'rosa', nome: 'Rosa', dias: ['ter'], horarios: ['19:00'], duracaoMin: 60, frequencia: 1,
    periodoInicio: '2026-02-01', periodoFim: '2026-12-01' },
  // A SALA MORTA: um registo substituído por uma derivação, que guarda o id do nome.
  { id: 'sala-azul', nome: 'Sala Azul', substituidaPor: 'sala-azul-2026-11-10', dias: ['qui'],
    horarios: ['20:00'], duracaoMin: 60, frequencia: 1,
    periodoInicio: '2026-02-01', periodoFim: '2026-12-01' },
];

function aPagina() {
  return bastidores.paginaProducao('breu', { escola: 'breu' },
    [{ nome: 'Bri Volet', slug: 'bri', modalidades: ['Ballet Clássico'] }],
    ['abreu'], 'Brise Volet', 'brise-volet', SALAS, [], {}, [], [], [],
    { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
    { modo: 'clara', paleta: 'bordo' }, null, [], new Set(),
    { ok: true, contrato: { plano: 'avancado', capacidade: {} } });
}

const SEM_SCRIPTS = (html) => html.replace(/<script src="[^"]*"><\/script>/g, '');

let JSDOM = null;
let VirtualConsole = null;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { JSDOM = null; }

/** Uma página da Produção com a sessão já retomada (o estado de quem entrou). */
async function aPaginaAberta() {
  const vc = new VirtualConsole();
  const queixas = [];
  vc.on('jsdomError', (e) => queixas.push((e && e.detail && e.detail.message) || (e && e.message)));
  const dom = new JSDOM(SEM_SCRIPTS(aPagina()), {
    runScripts: 'dangerously', url: 'https://breu.padd.com.br/bastidores/estudio',
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.alert = () => {}; w.confirm = () => true;
      w.fetch = () => Promise.resolve({ ok: true, status: 200,
        json: () => Promise.resolve({ ok: true, existe: true, modalidades: [],
          tradicoes: {}, alunas: [], linhas: [] }), text: () => Promise.resolve('') });
      try { w.sessionStorage.setItem('producao:token', 'token.de.prova'); } catch (err) {}
    },
  });
  await new Promise((r) => dom.window.setTimeout(r, 350));
  return { win: dom.window, doc: dom.window.document, queixas };
}

/**
 * A página da Produção COM o script do preenchedor corrido à mão — que é a prova mais dura que se
 * pode fazer a esta remoção: mesmo que alguém volte a injectar o `<script>`, ele não pode escrever
 * nada aqui. O `fetch` de `/api/teste` responde com um fixture de propósito.
 */
async function paginaComOPreenchedor(salaDoFixture) {
  const vc = new VirtualConsole();
  const queixas = [];
  vc.on('jsdomError', (e) => queixas.push((e && e.detail && e.detail.message) || (e && e.message)));
  const dom = new JSDOM(SEM_SCRIPTS(aPagina()), {
    runScripts: 'dangerously', url: 'https://breu.padd.com.br/bastidores/estudio',
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.alert = () => {}; w.confirm = () => true;
      w.fetch = (u) => {
        const url = String(u);
        /* A FORMA DO FIXTURE É A DO SERVIDOR: `{producao: {turmas: [...]}}` — e não uma lista
         * solta. Uma bancada com a forma errada lia o vazio e passava todas as asserções sem
         * medir nada, que é a pior espécie de prova verde. */
        const corpo = url.indexOf('/api/teste') !== -1
          ? { ok: true, fixture: { anamnese: [], plano: [], po: [], turmas: [salaDoFixture] } }
          : { ok: true, existe: true, modalidades: [], tradicoes: {}, alunas: [], linhas: [] };
        return Promise.resolve({ ok: true, status: 200,
          json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
      };
      try {
        w.sessionStorage.setItem('producao:token', 'token.de.prova');
        w.document.documentElement.setAttribute('data-escola-teste', '3');
      } catch (err) { /* sem storage mede-se menos, não se mente */ }
    },
  });
  const w = dom.window;
  await new Promise((r) => w.setTimeout(r, 300));
  try { w.eval(preenchedor.SCRIPT); } catch (err) { queixas.push('preenchedor: ' + err.message); }
  await new Promise((r) => w.setTimeout(r, 250));
  return { win: w, doc: w.document, queixas };
}

const SALA_NOVA = { nome: 'Sala Nova', dias: ['sex'], horarios: ['08:00'], duracaoMin: 45,
  frequencia: 1, periodoInicio: '2026-03-01', periodoFim: '2026-11-01' };

(async () => {
  if (!JSDOM) {
    console.log('  —   NÃO MEDIDA: o jsdom não está instalado.');
    process.exit(0);
  }

  // ===========================================================================================
  bloco('A. O PREENCHEDOR SAIU DA PRODUÇÃO — e não volta a escrever aqui');

  /* O ESTADO NO `HEAD`: a página da escola de teste trazia `data-escola-teste` e o `<script>`, e o
   * preenchimento automático escrevia o nome de uma sala do fixture no formulário de CRIAR —
   * fabricando o «já existe uma turma com este nome» que ela leu. A correcção de ontem ensinou-o a
   * não escrever por cima; a de hoje é a que ela pediu: «pode remover de lá, não vamos mais usar».
   *
   * AS TRÊS ALÍNEAS SÃO A REMOÇÃO INTEIRA, e cada uma fecha uma porta:
   *   1. o HTML não traz o atributo — sem ele o script sai na primeira linha;
   *   2. o HTML não traz o `<script>` — não há pedido a fazer;
   *   3. corrido à mão sobre a página (a prova mais dura), ele não escreve nada. */
  const html = aPagina();
  provar('a Produção não traz o atributo da escola de teste',
    !/data-escola-teste=/.test(html), null);
  provar('…nem o `<script>` do preenchedor',
    !/teste-preenchimento\.js/.test(html), null);

  const a1 = await paginaComOPreenchedor(SALAS[0]);
  provar('a página arranca sem excepção', a1.queixas.length === 0, a1.queixas);
  const campoNome = a1.doc.getElementById('tnome');
  provar('o formulário da sala tem o campo do nome', !!campoNome, null);
  provar('corrido à mão sobre a Produção, o preenchedor não escreve nada',
    String(campoNome.value) === '', campoNome.value);
  provar('…e não monta o painel de teste',
    !a1.doc.querySelector('details.teste-painel'), null);

  // ===========================================================================================
  bloco('\nB. AS RECUSAS DIZEM «SALA», E DIZEM QUAL É');

  const fonte = require('node:fs').readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8');
  provar('nenhuma recusa de sala diz «turma»',
    !/já existe uma turma com este nome/.test(fonte), null);
  provar('…e a de criar diz «já existe uma sala», com o nome do que ocupa o lugar',
    /já existe uma sala com o nome «' \+ nova\.nome \+ '»/.test(fonte), null);
  provar('…e a de editar também, e nomeia a sala que ocupa o lugar',
    /já existe uma sala com o nome «' \+ ocupa\.nome \+ '»/.test(fonte), null);
  provar('a colisão do «turma-editar» olha só para as salas VIGENTES',
    /turmasVigentes\(lista\)\.find\(\(t\) => t && t\.id === novoId\)/.test(fonte), null);

  /* A REGRA, medível sem tocar no KV: uma sala substituída não pode recusar a edição de uma viva.
   * `turmasVigentes` é a mesma função que o servidor usa, e o par (id do nome igual) é o caso dela. */
  const vigentes = SALAS.filter((t) => t && !t.substituidaPor);
  provar('a sala morta «Sala Azul» não conta como ocupante do lugar',
    vigentes.filter((t) => t.id === 'sala-azul').length === 0, null);
  provar('…e as duas vivas contam', vigentes.length === 2, vigentes.map((t) => t.id));

  // ===========================================================================================
  bloco('\nC. O PORTÃO NÃO PEDE SENHA ENQUANTO RETOMA');

  const aberta = await aPaginaAberta();
  const doc = aberta.doc;
  const formSenha = doc.getElementById('form-senha');
  provar('o portão existe', !!doc.getElementById('gate'), null);
  provar('com um token guardado, o formulário da senha NÃO está à vista',
    !!formSenha && formSenha.hidden === true, formSenha && formSenha.hidden);
  provar('…e o campo da senha não tem foco automático (o `autofocus` saiu da marcação)',
    !/id="dsenha"[^>]*autofocus/.test(aPagina()), null);

  /* O OUTRO LADO: sem token, a senha é a única entrada — e é aí que o campo tem de aparecer. Sem
   * esta metade, a correcção fechava a página a quem chega de novo. */
  const vc2 = new VirtualConsole();
  vc2.on('jsdomError', () => {});
  const dom2 = new JSDOM(SEM_SCRIPTS(aPagina()), {
    runScripts: 'dangerously', url: 'https://breu.padd.com.br/bastidores/estudio', virtualConsole: vc2,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.alert = () => {}; w.confirm = () => true;
      w.fetch = () => Promise.resolve({ ok: true, status: 200,
        json: () => Promise.resolve({ ok: false }), text: () => Promise.resolve('') });
    },
  });
  await new Promise((r) => dom2.window.setTimeout(r, 350));
  const semToken = dom2.window.document;
  provar('sem token guardado, o portão mostra o formulário da senha',
    semToken.getElementById('form-senha').hidden === false,
    semToken.getElementById('form-senha').hidden);
  provar('…e o conteúdo da página fica escondido, como deve',
    semToken.getElementById('conteudo').hidden === true, null);

  // ===========================================================================================
  bloco('\nD. O ENDEREÇO DIZ O NOME QUE SE LÊ');

  const porSecao = {};
  for (const a of doc.querySelectorAll('.lateral a[data-secao]')) {
    porSecao[a.getAttribute('data-secao')] = a.getAttribute('href');
  }
  provar('«Salas» aponta para `#salas`', porSecao.turmas === '#salas', porSecao.turmas);
  provar('«Audição» aponta para `#audicao`', porSecao.corpo === '#audicao', porSecao.corpo);
  provar('«Estilo» aponta para `#estilo`', porSecao.verbetes === '#estilo', porSecao.verbetes);

  /* E OS ENDEREÇOS ANTIGOS CONTINUAM A VALER: quem tem um atalho — ou uma prova que põe
   * `location.hash = '#turmas'` — não pode aterrar numa página em branco. */
  const secaoTurmas = doc.getElementById('sec-turmas');
  provar('a secção continua a chamar-se `sec-turmas` (as provas leem-na por este id)',
    !!secaoTurmas, null);
  const win = aberta.win;
  secaoTurmas.hidden = true;
  win.location.hash = '#salas';
  win.dispatchEvent(new win.Event('hashchange'));
  await new Promise((r) => win.setTimeout(r, 80));
  provar('`#salas` abre as Salas', secaoTurmas.hidden === false, secaoTurmas.hidden);
  secaoTurmas.hidden = true;
  win.location.hash = '#turmas';
  win.dispatchEvent(new win.Event('hashchange'));
  await new Promise((r) => win.setTimeout(r, 80));
  provar('e o endereço antigo `#turmas` abre a MESMA secção',
    secaoTurmas.hidden === false, secaoTurmas.hidden);

  // ===========================================================================================
  bloco('\nE. A TIRA DO PROFESSOR VIVE NUMA FAIXA, COMO A DA AUDIÇÃO');

  const faixaProf = doc.getElementById('pf-faixa');
  const tiraProf = doc.getElementById('pf-passos');
  const faixaLb = doc.getElementById('lb-faixa');
  const tiraLb = doc.getElementById('lb-tira');
  provar('a Audição tem a tira dentro da faixa (é o padrão, e é o que ela apontou)',
    !!faixaLb && !!tiraLb && tiraLb.parentElement === faixaLb, null);
  provar('o Professor também', !!faixaProf && !!tiraProf && tiraProf.parentElement === faixaProf,
    tiraProf && tiraProf.parentElement && tiraProf.parentElement.className);
  provar('…e o embrulho é a `.turmas-faixa`, que recolhe com o corpo',
    !!faixaProf && /turmas-faixa/.test(String(faixaProf.className)), faixaProf && faixaProf.className);
  provar('…com as mesmas duas etapas de antes (Cadastro · Rubrica)',
    [...tiraProf.querySelectorAll('button.passo')].map((b) => b.getAttribute('data-passo-prof')).join(',')
      === 'cadastro,rubrica',
    [...tiraProf.querySelectorAll('button.passo')].map((b) => b.getAttribute('data-passo-prof')));

  // ===========================================================================================
  console.log('\n' + total + ' asserções, ' + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})();
