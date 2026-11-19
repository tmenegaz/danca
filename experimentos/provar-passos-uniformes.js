'use strict';

/**
 * provar-passos-uniformes.js — A MESMA FORMA EM TODAS AS SECÇÕES COM PASSOS (19/11/2026).
 *
 * Dois pedidos dela, na mesma mensagem, e os dois são de identidade visual:
 *
 *   «Em professores, você colocou os steps dentro de cadastro. Ele é acima do cadastro, ele é fora
 *    do cadastro. Aí o step só aparece quando eu estou na aba cadastro. Se eu mudar para habilitação,
 *    por exemplo, ele não pode aparecer, isso está certo. Mas o lugar onde você colocou os steps é
 *    que está errado.»
 *
 *   «O que for de step, a gente vai usar avançar. Então, onde tiver seguir, vai se tornar avançar. E
 *    toda vez que expandir o formulário para começar um registro novo, tem que ter o botão cancelar
 *    também, porque pode ser que a pessoa desista do processo. E quando clicar em cancelar […] vai
 *    colapsar o acordeon que guarda o formulário.»
 *
 * O QUE ESTA PROVA MEDE, e cada alínea falha no `HEAD`:
 *
 *   A. A TIRA DO PROFESSOR É A PRIMEIRA LINHA DO CORPO, fora da aba — irmã do `.col-form`, antes
 *      das abas, como na Audição. E ela desaparece quando a aba à vista não é o Cadastro.
 *   B. UM NOME SÓ PARA O MESMO GESTO: os cinco botões de passo dizem «Avançar», e não há nenhum
 *      «Seguir» na página.
 *   C. O «CANCELAR» EXISTE EM TODAS AS SEIS SECÇÕES QUANDO O FORMULÁRIO ABRE — e não existe quando
 *      ele está recolhido.
 *   D. CLICAR NELE CANCELA: o formulário fecha e o que se tinha escrito sai. Medido nas seis, uma a
 *      uma, pelo efeito.
 *
 *   node experimentos/provar-passos-uniformes.js
 */

const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

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
    [{ nome: 'Bri Volet', slug: 'bri', modalidades: ['Ballet Clássico'] }],
    ['abreu'], 'Brise Volet', 'brise-volet',
    [{ id: 'rosa', nome: 'Rosa', dias: ['ter'], horarios: { ter: '19:00' }, duracaoMin: 60,
      frequencia: 1, periodoInicio: '2026-02-01', periodoFim: '2026-12-01' }],
    [], {}, [], [], [],
    { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
    { modo: 'clara', paleta: 'bordo' }, null, [], new Set(),
    { ok: true, contrato: { plano: 'avancado', capacidade: {} } });
}

let JSDOM = null;
let VirtualConsole = null;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { JSDOM = null; }

/** Uma Produção aberta, com a sessão retomada e um `fetch` que responde o suficiente. */
async function abrir() {
  const vc = new VirtualConsole();
  const queixas = [];
  vc.on('jsdomError', (e) => queixas.push((e && e.detail && e.detail.message) || (e && e.message)));
  const dom = new JSDOM(aPagina().replace(/<script src="[^"]*"><\/script>/g, ''), {
    runScripts: 'dangerously', url: 'https://breu.padd.com.br/bastidores/producao',
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.alert = () => {}; w.confirm = () => true;
      w.fetch = () => Promise.resolve({ ok: true, status: 200,
        json: () => Promise.resolve({ ok: true, existe: true, modalidades: [], tradicoes: {},
          alunas: [], linhas: [], professores: [], turmas: [] }),
        text: () => Promise.resolve('') });
      try { w.sessionStorage.setItem('producao:token', 'token.de.prova'); } catch (err) {}
    },
  });
  const win = dom.window;
  await new Promise((r) => win.setTimeout(r, 400));
  return { win, doc: win.document, queixas };
}

/* AS SEIS SECÇÕES COM FORMULÁRIO, o botão de cancelar de cada uma, e o campo que se escreve para
 * provar que o cancelamento limpa. O das Salas é o único cuja limpeza passa pela recarga — e é por
 * isso que ele mede outra coisa: que a memória do formulário foi apagada. */
const SECOES = [
  { id: 'sec-professores', cancelar: 'prof-cancelar', campo: 'pnome' },
  { id: 'sec-alunas', cancelar: 'aluna-cancelar-1', campo: 'anome' },
  { id: 'sec-turmas', cancelar: 't-cancelar', campo: 'tnome' },
  { id: 'sec-corpo', cancelar: 'lb-cancelar', campo: 'lbnome' },
  { id: 'sec-verbetes', cancelar: 'vb-cancelar', campo: 'vnnome' },
  { id: 'sec-curadorias', cancelar: 'cu-cancelar', campo: 'cuturma' },
];

(async () => {
  if (!JSDOM) {
    console.log('  —   NÃO MEDIDA: o jsdom não está instalado.');
    process.exit(0);
  }

  // ===========================================================================================
  bloco('A. A TIRA DO PROFESSOR É A PRIMEIRA LINHA DO CORPO — fora da aba, como na Audição');

  const html = aPagina();
  const iFaixa = html.indexOf('id="pf-faixa"');
  const iColForm = html.indexOf('id="professores-miolo"');
  const iAbas = html.indexOf('id="pf-abas"');
  const iPainelCad = html.indexOf('id="pf-painel-cadastro"');
  provar('a faixa existe', iFaixa !== -1, null);
  provar('…vem ANTES da coluna que tem as abas', iFaixa < iColForm, { iFaixa, iColForm });
  provar('…e antes das abas em si', iFaixa < iAbas, { iFaixa, iAbas });
  provar('…e FORA do painel da aba do cadastro (é isso que ela pediu)',
    iFaixa < iPainelCad && html.indexOf('id="pf-passos"') < iPainelCad, { iFaixa, iPainelCad });
  provar('…com o mesmo embrulho da Audição (`turmas-faixa` + `passos`)',
    /class="turmas-faixa" id="pf-faixa"/.test(html) && /class="passos"[^>]*id="pf-passos"/.test(html),
    null);

  const a = await abrir();
  provar('a página arranca sem excepção', a.queixas.length === 0, a.queixas);
  const faixa = a.doc.getElementById('pf-faixa');
  provar('na aba do Cadastro (a que abre), a tira está à vista',
    !!faixa && faixa.hidden === false, faixa && faixa.hidden);

  /* A TROCA DE ABA É PELO MOTOR — a tira, a folha do telemóvel e o teclado passam todos por ele. */
  if (typeof a.win.abrirAbaDoProfessor === 'function') a.win.abrirAbaDoProfessor('habilitacoes');
  await new Promise((r) => a.win.setTimeout(r, 60));
  provar('na aba das Habilitações ela desaparece — o passo é do cadastro',
    a.doc.getElementById('pf-faixa').hidden === true, a.doc.getElementById('pf-faixa').hidden);
  if (typeof a.win.abrirAbaDoProfessor === 'function') a.win.abrirAbaDoProfessor('cadastro');
  await new Promise((r) => a.win.setTimeout(r, 60));
  provar('…e volta quando se volta ao Cadastro',
    a.doc.getElementById('pf-faixa').hidden === false, a.doc.getElementById('pf-faixa').hidden);

  // ===========================================================================================
  bloco('\nB. UM NOME SÓ PARA O MESMO GESTO — «Avançar», e não «Seguir»');

  const botoes = ['t-enviar', 'prof-enviar', 'aluna-seguir', 'lb-seguir', 'vb-seguir'];
  for (const id of botoes) {
    const b = a.doc.getElementById(id);
    provar('#' + id + ' diz «Avançar»', !!b && b.textContent.trim() === 'Avançar',
      b && b.textContent.trim());
  }
  /* O QUE SE LÊ NA TELA, E NÃO O TEXTO DO DOCUMENTO: `body.textContent` inclui o `<script>`, e há
   * lá variáveis com «podeSeguir» no nome. A pergunta é sobre o que a pessoa lê — botões, rótulos e
   * legendas. */
  const rotulos = [...a.doc.querySelectorAll('button, a, label, legend, summary, h1, h2, h3')]
    .map((el) => String(el.textContent || '').trim()).filter(Boolean);
  const sobrou = rotulos.filter((t) => /Seguir/i.test(t));
  provar('não sobrou nenhum «Seguir» nos rótulos da página', sobrou.length === 0, sobrou);

  // ===========================================================================================
  bloco('\nC. O «CANCELAR» EXISTE SEMPRE QUE O FORMULÁRIO ESTÁ ABERTO — nas seis');

  for (const sec of SECOES) {
    const bt = a.doc.getElementById(sec.cancelar);
    provar(sec.id + ': recolhido, o «Cancelar» não aparece',
      !!bt && bt.hidden === true, bt && bt.hidden);
  }
  for (const sec of SECOES) {
    a.win.abrirOFormularioDe(sec.id);
    await new Promise((r) => a.win.setTimeout(r, 30));
    const bt = a.doc.getElementById(sec.cancelar);
    provar(sec.id + ': aberto para CRIAR, o «Cancelar» aparece — é o que ela pediu',
      !!bt && bt.hidden === false, bt && bt.hidden);
  }

  // ===========================================================================================
  bloco('\nD. CLICAR «CANCELAR» NA CRIAÇÃO FECHA O FORMULÁRIO E DESCARTA O QUE SE ESCREVEU');

  for (const sec of SECOES) {
    const b = await abrir();
    b.win.abrirOFormularioDe(sec.id);
    const campo = b.doc.getElementById(sec.campo);
    if (campo) {
      campo.value = 'escrito para desistir';
      campo.dispatchEvent(new b.win.Event('input', { bubbles: true }));
    }
    const bt = b.doc.getElementById(sec.cancelar);
    bt.dispatchEvent(new b.win.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => b.win.setTimeout(r, 200));

    const aberto = typeof b.win.formularioDaSecaoAberto === 'function'
      ? b.win.formularioDaSecaoAberto(sec.id) : null;
    provar(sec.id + ': o «Cancelar» fecha o formulário', aberto === false, aberto);
    provar(sec.id + ': …e o botão sai com ele',
      b.doc.getElementById(sec.cancelar).hidden === true,
      b.doc.getElementById(sec.cancelar).hidden);
    /* AS SALAS SÃO A EXCEPÇÃO DECLARADA: o cancelamento delas limpa a memória e RECARREGA a
     * página — é a mesma regra de sempre nesta secção, e o que se mede é a memória. */
    if (sec.id === 'sec-turmas') {
      let guardado = 'nao-vazio';
      try { guardado = b.win.sessionStorage.getItem('producao:form') || ''; } catch (err) {}
      provar('sec-turmas: …e a memória do formulário foi apagada', guardado === '', guardado);
    } else {
      const depois = b.doc.getElementById(sec.campo);
      provar(sec.id + ': …e o que estava escrito saiu',
        !depois || String(depois.value || '') === '', depois && depois.value);
    }
    b.win.close();
  }

  // ===========================================================================================
  console.log('\n' + total + ' asserções, ' + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})();
