'use strict';

/**
 * provar-avancar-nao-grava.js — «EU NEM CLIQUEI EM GRAVAR, E ELE GRAVOU» (19/11/2026).
 *
 * O relato, na letra dela:
 *
 *   «Eu criei a sala chamada Rosa. Aí cliquei em avançar. Aí cliquei em voltar. Aí mudou o nome da
 *    sala, cliquei em avançar de novo, gravou a sala. Então agora eu tenho duas salas gravadas e eu
 *    nem cliquei ainda em gravar a sala. Isso está errado. […] Isso está acontecendo em audição
 *    também acontece isso, em estilo também acontece isso. Todos os que têm step isso está
 *    acontecendo. Em professores isso também acontece. Tem que corrigir.»
 *
 * E a outra metade, que é a mesma queixa vista de outro lado:
 *
 *   «O nome do professor só pode ser carregado a partir da modalidade. É pela modalidade que eu vou
 *    saber quais são os professores.»
 *
 * O QUE ESTAVA ERRADO. O botão do passo 1 de cada um destes formulários era `<button type="submit">`,
 * e o `submit` de cada um gravava. «Avançar» prometia IR e fazia GRAVAR: cada passagem pelo passo 1
 * deixava um registo novo no KV (na sala, duas salas com nomes diferentes), e quem voltasse para
 * corrigir uma vírgula pagava o erro com um registo a mais.
 *
 * O QUE ESTA PROVA MEDE — e cada alínea reprova no `HEAD`:
 *
 *   A. O «AVANÇAR» DA SALA NÃO É UM `submit`. Ele muda de passo e não faz um único pedido de escrita.
 *      Medido num DOM a sério: intercepta-se o `fetch`, clica-se, e conta-se o que saiu.
 *   B. O MESMO NO PROFESSOR: «Avançar» compõe, guarda o rascunho, e não grava.
 *   C. O MESMO NA AUDIÇÃO: «Seguir» muda de painel e não grava.
 *   D. O «GRAVAR» É UM SÓ, NO FIM: o «Gravar sala» é que envia — e envia a sala inteira (o que o
 *      passo 1 compôs E o par modalidade × professor).
 *   E. O PROFESSOR SÓ SE ESCOLHE DEPOIS DA MODALIDADE: sem modalidade, o `<select>` está desabilitado
 *      e não oferece ninguém.
 *
 *   node experimentos/provar-avancar-nao-grava.js
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

const SALAS = [{ id: 'rosa', nome: 'Rosa', dias: ['ter'], horarios: { ter: '19:00' },
  duracaoMin: 60, frequencia: 1, periodoInicio: '2026-02-01', periodoFim: '2026-12-01' }];

function aPagina() {
  return bastidores.paginaProducao('breu', { escola: 'breu' },
    [{ nome: 'Bri Volet', slug: 'bri', modalidades: ['Ballet Clássico'] }],
    ['abreu'], 'Brise Volet', 'brise-volet', SALAS, [], {}, [], [], [],
    { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
    { modo: 'clara', paleta: 'bordo' }, null, [], new Set(),
    { ok: true, contrato: { plano: 'avancado', capacidade: {} } });
}

let JSDOM = null;
let VirtualConsole = null;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { JSDOM = null; }

/**
 * Abre a página e devolve o que interessa: o DOM, e a LISTA DOS PEDIDOS que saíram.
 *
 * O `fetch` é o ponto de medida, e é o único honesto: o que se quer saber é se «Avançar» escreve no
 * servidor. Um `submit` disparado é uma hipótese; um `POST` é um facto.
 */
async function abrir() {
  const vc = new VirtualConsole();
  const queixas = [];
  vc.on('jsdomError', (e) => queixas.push((e && e.detail && e.detail.message) || (e && e.message)));
  const pedidos = [];
  const dom = new JSDOM(aPagina().replace(/<script src="[^"]*"><\/script>/g, ''), {
    runScripts: 'dangerously', url: 'https://breu.padd.com.br/bastidores/producao',
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.alert = () => {}; w.confirm = () => true;
      w.fetch = (u, i) => {
        pedidos.push({ url: String(u), metodo: (i && i.method) || 'GET',
          corpo: (i && i.body) || '' });
        return Promise.resolve({ ok: true, status: 200,
          json: () => Promise.resolve({ ok: true, id: 'rosa', turma: 'Rosa', slug: 'bri',
            existe: true, modalidades: [], tradicoes: {}, alunas: [], linhas: [], turmas: SALAS }),
          text: () => Promise.resolve('') });
      };
      try { w.sessionStorage.setItem('producao:token', 'token.de.prova'); } catch (err) {}
    },
  });
  const win = dom.window;
  await new Promise((r) => win.setTimeout(r, 400));
  return { win, doc: win.document, pedidos, queixas };
}

const escritas = (pedidos) => pedidos.filter((p) => p.metodo !== 'GET');

(async () => {
  if (!JSDOM) {
    console.log('  —   NÃO MEDIDA: o jsdom não está instalado.');
    process.exit(0);
  }

  // ===========================================================================================
  bloco('A. O «AVANÇAR» DA SALA NÃO GRAVA — muda de passo e mais nada');

  const a = await abrir();
  provar('a página arranca sem excepção', a.queixas.length === 0, a.queixas);

  const botao = a.doc.getElementById('t-enviar');
  provar('o «Avançar» da sala NÃO é um botão de submeter',
    botao && String(botao.getAttribute('type')).toLowerCase() === 'button',
    botao && botao.getAttribute('type'));

  /* PREENCHE O PASSO 1 COMO ELA PREENCHEU, e conta as escritas antes e depois do clique. */
  a.doc.getElementById('tnome').value = 'Sala Rosa';
  ['seg'].forEach((d) => {
    const cx = a.doc.querySelector('input[name="dia"][value="' + d + '"]');
    if (cx) { cx.checked = true; cx.dispatchEvent(new a.win.Event('change', { bubbles: true })); }
  });
  a.doc.getElementById('tduracao').value = '60';
  a.doc.getElementById('tinicio').value = '2026-02-01';
  a.doc.getElementById('tfim').value = '2026-12-01';
  a.doc.getElementById('tnome').dispatchEvent(new a.win.Event('input', { bubbles: true }));

  const antes = escritas(a.pedidos).length;
  provar('o «Avançar» está aceso com a sala composta', botao.disabled === false, botao.disabled);
  botao.dispatchEvent(new a.win.MouseEvent('click', { bubbles: true }));
  await new Promise((r) => a.win.setTimeout(r, 120));

  const depois = escritas(a.pedidos).length;
  provar('clicar «Avançar» não faz nenhuma escrita no servidor', depois === antes,
    escritas(a.pedidos).map((p) => p.metodo + ' ' + p.url));
  provar('…e a sala em foco continua vazia — nada foi gravado', !a.win.turmaEmFoco(),
    a.win.turmaEmFoco && a.win.turmaEmFoco());

  /* O PASSO 2 ABRIU. É o que o botão promete — e é a única coisa que ele faz. */
  const painelVinc = a.doc.getElementById('passo-vincular');
  const painelTurma = a.doc.getElementById('passo-turma');
  provar('…e o passo 2 (Associar) ficou à vista', !!painelVinc && painelVinc.hidden === false,
    painelVinc && painelVinc.hidden);
  provar('…com o passo 1 escondido', !!painelTurma && painelTurma.hidden === true,
    painelTurma && painelTurma.hidden);

  /* VOLTAR E AVANÇAR OUTRA VEZ — o caso exato dela: «mudou o nome, cliquei em avançar de novo». */
  painelVinc.hidden = true;
  painelTurma.hidden = false;
  a.doc.getElementById('tnome').value = 'Sala Azul';
  a.doc.getElementById('tnome').dispatchEvent(new a.win.Event('input', { bubbles: true }));
  botao.dispatchEvent(new a.win.MouseEvent('click', { bubbles: true }));
  await new Promise((r) => a.win.setTimeout(r, 120));
  provar('voltar, mudar o nome e avançar outra vez também não grava',
    escritas(a.pedidos).length === antes, escritas(a.pedidos).map((p) => p.metodo + ' ' + p.url));
  provar('…e não há DUAS salas criadas — porque não há sala nenhuma criada',
    !escritas(a.pedidos).some((p) => /\/turma$/.test(p.url)), escritas(a.pedidos).map((p) => p.url));

  // ===========================================================================================
  bloco('\nB. O MESMO NO PROFESSOR — «Avançar» compõe, e não grava');

  const b = await abrir();
  const botaoProf = b.doc.getElementById('prof-enviar');
  provar('o «Avançar» do professor NÃO é um botão de submeter',
    botaoProf && String(botaoProf.getAttribute('type')).toLowerCase() === 'button',
    botaoProf && botaoProf.getAttribute('type'));
  const antesProf = escritas(b.pedidos).length;
  b.doc.getElementById('pnome').value = 'Bri';
  b.doc.getElementById('pnome').dispatchEvent(new b.win.Event('input', { bubbles: true }));
  botaoProf.dispatchEvent(new b.win.MouseEvent('click', { bubbles: true }));
  await new Promise((r) => b.win.setTimeout(r, 120));
  provar('clicar «Avançar» no professor não grava nada',
    escritas(b.pedidos).length === antesProf, escritas(b.pedidos).map((p) => p.metodo + ' ' + p.url));
  provar('…e a ficha composta fica guardada como rascunho (é o que o passo 2 vai gravar)',
    !!b.doc.getElementById('passo-prof-rubrica') &&
      b.doc.getElementById('passo-prof-rubrica').hidden === false,
    b.doc.getElementById('passo-prof-rubrica') && b.doc.getElementById('passo-prof-rubrica').hidden);

  // ===========================================================================================
  bloco('\nC. O MESMO NA AUDIÇÃO — «Seguir» muda de painel');

  const c = await abrir();
  const antesLb = escritas(c.pedidos).length;
  const seguir = c.doc.getElementById('lb-seguir');
  provar('o «Seguir» da Audição existe', !!seguir, null);
  if (seguir) {
    seguir.dispatchEvent(new c.win.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => c.win.setTimeout(r, 150));
  }
  provar('clicar «Seguir» não grava o elenco',
    !escritas(c.pedidos).some((p) => /linha-de-base/.test(p.url)),
    escritas(c.pedidos).map((p) => p.metodo + ' ' + p.url));
  provar('…e não gravou nada de nada', escritas(c.pedidos).length === antesLb,
    escritas(c.pedidos).map((p) => p.metodo + ' ' + p.url));

  // ===========================================================================================
  bloco('\nD. O «GRAVAR» É UM SÓ, NO FIM — e leva a sala inteira');

  const d = await abrir();
  /* A SALA COMPOSTA NO PASSO 1, SEM PASSAR POR PEDIDO NENHUM. */
  d.doc.getElementById('tnome').value = 'Sala Rosa';
  ['seg'].forEach((dia) => {
    const cx = d.doc.querySelector('input[name="dia"][value="' + dia + '"]');
    if (cx) { cx.checked = true; cx.dispatchEvent(new d.win.Event('change', { bubbles: true })); }
  });
  d.doc.getElementById('tduracao').value = '60';
  d.doc.getElementById('tinicio').value = '2026-02-01';
  d.doc.getElementById('tfim').value = '2026-12-01';
  d.doc.getElementById('tnome').dispatchEvent(new d.win.Event('input', { bubbles: true }));
  d.doc.getElementById('t-enviar').dispatchEvent(new d.win.MouseEvent('click', { bubbles: true }));
  await new Promise((r) => d.win.setTimeout(r, 150));

  /* E O PASSO 2 COMPLETO. */
  const selMod = d.doc.getElementById('vinc-modalidade');
  const opcao = [...selMod.options].find((o) => o.value && o.value.indexOf('Ballet') !== -1);
  selMod.value = opcao ? opcao.value : (selMod.options[1] || {}).value;
  selMod.dispatchEvent(new d.win.Event('change', { bubbles: true }));
  await new Promise((r) => d.win.setTimeout(r, 250));

  bloco('E. O PROFESSOR SÓ SE ESCOLHE DEPOIS DA MODALIDADE');
  provar('…a lista de professores acendeu quando a modalidade foi escolhida',
    d.doc.getElementById('vinc-professor').disabled === false,
    d.doc.getElementById('vinc-professor').disabled);

  const selProf = d.doc.getElementById('vinc-professor');
  selProf.value = 'bri';
  selProf.dispatchEvent(new d.win.Event('change', { bubbles: true }));
  await new Promise((r) => d.win.setTimeout(r, 120));

  const gravar = d.doc.getElementById('vinc-gravar');
  provar('o «Gravar sala» está aceso com tudo composto', gravar.disabled === false, gravar.disabled);
  const antesD = escritas(d.pedidos).length;
  gravar.dispatchEvent(new d.win.MouseEvent('click', { bubbles: true }));
  await new Promise((r) => d.win.setTimeout(r, 250));

  const saidas = escritas(d.pedidos).slice(antesD);
  provar('clicar «Gravar sala» faz UMA escrita — a que conclui a sequência',
    saidas.length === 1, saidas.map((p) => p.metodo + ' ' + p.url));
  const unico = saidas[0] || { url: '', corpo: '' };
  provar('…na rota que associa o professor à sala',
    /\/turma-professor$/.test(unico.url), unico.url);
  let corpo = {};
  try { corpo = JSON.parse(unico.corpo); } catch (err) { corpo = {}; }
  provar('…e leva o que o passo 1 compôs (o nome da sala)',
    String((corpo.sala || {}).nome || '') === 'Sala Rosa', corpo.sala && corpo.sala.nome);
  provar('…e o par do passo 2 (modalidade e professor)',
    !!(corpo.modalidade && corpo.professor), { modalidade: corpo.modalidade,
      professor: corpo.professor });

  // ===========================================================================================
  bloco('\nF. SEM MODALIDADE NÃO HÁ PROFESSOR — a lista nasce fechada');

  const f = await abrir();
  const selF = f.doc.getElementById('vinc-professor');
  provar('o `<select>` do professor nasce desabilitado', selF.disabled === true, selF.disabled);
  provar('…e não oferece nenhum professor',
    [...selF.options].every((o) => o.value === ''), [...selF.options].map((o) => o.value));
  provar('…e diz qual é o passo que falta',
    /modalidade/i.test(selF.textContent), selF.textContent);

  // ===========================================================================================
  console.log('\n' + total + ' asserções, ' + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})();
