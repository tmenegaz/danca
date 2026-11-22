#!/usr/bin/env node
'use strict';

/*
 * provar-o-passo-da-sala.js — A SALA TEM TRÊS PASSOS, E ELES ANDAM PARA A FRENTE.
 *
 * O RELATO DELA (12/11/2026): «quando eu estou no step um e clico avançar, ele já está criando a
 * sala e não vai para a rubrica, para o step dois. Ele precisa ir para o step dois. E aí do step
 * dois precisa avançar para o step três. Precisa cumprir as etapas.»
 *
 * A CAUSA NÃO ERA O PREENCHEDOR DE CAMPOS DA BANCADA — era o produto, e são duas regras certas
 * que se encontram mal:
 *
 *   1. «FORA DA EDIÇÃO, O FORMULÁRIO É NOVO» (19/10/2026). `aplicarEstadoDoFormulario` apaga a
 *      memória do preenchimento quando `producao:editando` não está ligado — e no caminho de
 *      CRIAR ele não está, de propósito: era assim que a rubrica e a associação da sala anterior
 *      deixavam de reaparecer.
 *   2. «A SEQUÊNCIA É OBRIGATÓRIA» (18/10/2026). `mostrarPasso` recusa abrir os passos 2 e 3 com
 *      a sala por completar — e pergunta isso ao FORMULÁRIO (`faltaDaTurma`).
 *
 * Juntas, a segunda pergunta a um formulário que a primeira acabou de esvaziar. O resultado é o
 * que ela viu: grava a sala, a página recarrega no passo 2, o passo 2 encontra o formulário vazio,
 * conclui que a sala está por completar e devolve a pessoa ao passo 1 — com os campos vazios, o
 * que parece que a sala não foi gravada. E o mesmo no passo 3.
 *
 * O QUE A PROVA MEDE. Não a aparência: o CAMINHO, com a página a recarregar como recarrega de
 * verdade. Cada gesto (submit do passo 1, submit do passo 2, «Gravar sala») é dado no documento
 * dele; o `sessionStorage` que fica é o que a recarga seguinte encontra; e o documento seguinte é
 * construído com ele — a mesma página servida pelo servidor, com a mesma memória.
 *
 *   node experimentos/provar-o-passo-da-sala.js
 *   node experimentos/provar-o-passo-da-sala.js --contra=<ref>   # controlo negativo
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const REF = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let destino = RAIZ;
if (REF) {
  destino = fs.mkdtempSync(path.join(os.tmpdir(), 'passo-da-sala-'));
  execSync('git archive ' + REF + ' motor modelo porta biblioteca tools teste | tar -x -C '
    + JSON.stringify(destino), { cwd: RAIZ, stdio: 'pipe' });
  fs.symlinkSync(path.join(RAIZ, 'node_modules'), path.join(destino, 'node_modules'), 'dir');
  console.log('CONTROLE NEGATIVO contra ' + REF + '\n');
}

const bastidores = require(path.join(destino, 'motor/servidor/bastidores.js'));

let n = 0;
let falhas = 0;
function provar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* DUAS SALAS, E ELAS SÃO O CASO DELA (12/11/2026).
 *
 * «Piano» é a sala de uma TURMA (a curadoria que a cita), e é citada por um plano de ensino.
 * «Rosa» já foi sala de uma turma — os planos de 08 a 10/11 citam-na — mas nenhuma turma a usa
 * hoje. São os dois lados do critério que o cartão tem de dizer. */
const SALAS = [
  { id: 'piano', nome: 'Piano', frequencia: 2, dias: ['qua', 'sex'], duracaoMin: 60,
    periodoInicio: '2026-11-20', periodoFim: '2026-12-20', rubricaId: 'r1' },
  { id: 'rosa', nome: 'Rosa', frequencia: 2, dias: ['ter'], duracaoMin: 60,
    periodoInicio: '2026-11-20', periodoFim: '2026-12-20' },
];
const CURADORIAS = [
  { id: 'pe-torto-bale-classico-piano', professor: 'pe-torto', turmas: ['Piano'],
    modalidade: 'Balé clássico', nivel: '1' },
];
const PARES = [
  { professor: 'pe-torto', turma: 'Piano', ciclo: '01' },
  { professor: 'pe-torto', turma: 'Rosa', ciclo: '01' },
];
const RUBRICAS = [{ id: 'r1', nome: 'Régua da casa', niveis: ['A', 'B', 'C'] }];

function pagina() {
  return bastidores.paginaProducao('calango',
    { professor: 'pe-torto', escola: 'calango', query: 'professor=pe-torto&escola=calango' },
    [{ nome: 'Pe Torto', slug: 'pe-torto' }], ['Aluna A'], 'Pe Torto', 'pe-torto',
    SALAS, [], {}, CURADORIAS, RUBRICAS, PARES,
    { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() },
    { modo: 'clara', paleta: 'bordo' }, '', []);
}
const HTML = pagina();

// ==========================================================================================
console.log('1. O CRITÉRIO DO CARTÃO — «em turma» quer dizer que uma TURMA usa esta sala');

{
  /* O CARTÃO DA SALA dizia `livre` / `curada` / `vinculada`, e as três palavras respondiam a uma
   * pergunta só: «posso editar no lugar?». A pergunta que ela faz ao cartão é outra — «esta sala
   * está em alguma turma?» —, e a resposta estava lá dentro, disfarçada. Pior: uma sala sem turma
   * nenhuma dizia `vinculada` só porque um plano de ensino antigo a cita, e isso lê-se como «está
   * em turma», que é falso. */
  function cartao(nome) {
    const i = HTML.indexOf('data-turma-ajustar="' + nome.toLowerCase() + '"');
    const ini = HTML.lastIndexOf('<li', i);
    const fim = HTML.indexOf('</li>', i);
    return HTML.slice(ini, fim);
  }
  const piano = cartao('Piano');
  const rosa = cartao('Rosa');
  provar('a sala que uma turma usa diz «em turma»', /class="selo[^"]*"[^>]*>em turma</.test(piano),
    piano.slice(0, 400));
  provar('…e a sala que nenhuma turma usa NÃO diz «em turma»',
    !/>em turma</.test(rosa), rosa.slice(0, 400));
  provar('nenhuma das duas diz «vinculada» — a palavra que ela não reconhece',
    !/>vinculada</.test(piano) && !/>vinculada</.test(rosa));
  /* A NOTA «CITADA POR N PLANOS» NASCEU E MORREU NO MESMO DIA. Ela foi escrita aqui de manhã
   * (12/11/2026) e a pesquisadora cortou-a à tarde: «essa parte citada que você colocou na
   * listagem pode remover. Isso é informação só para nós […] não cabe aqui para o professor».
   *
   * A ASSERÇÃO NÃO SE APAGA — INVERTE-SE, que é o que guarda a decisão. O que fica dito na tela
   * é o que o professor precisa para decidir; a contagem de planos é auditoria, e o lugar dela é
   * o `title` de quem a procura. */
  provar('a sala sem turma não escreve na listagem quantos planos a citam — isso é auditoria',
    !/citada/.test(rosa) && !/nota-falta/.test(rosa), rosa.slice(0, 700));
  provar('…e a sala em turma também não', !/citada/.test(piano), piano.slice(0, 700));
  provar('…mas o número não se perde: está no `title` do botão, para quem o procurar',
    /1 plano de ensino cita esta sala/.test(rosa)
      && /1 plano de ensino cita esta sala/.test(piano),
    (rosa.match(/title="Derivar[^"]*"/) || [])[0]);
  provar('a sala que nenhuma turma usa e nenhum plano cita diz «livre»',
    (() => {
      const p = paginaComSalas([{ id: 'nova', nome: 'Nova', frequencia: 2, dias: ['seg'],
        duracaoMin: 60, periodoInicio: '2026-11-20', periodoFim: '2026-12-20' }]);
      const i = p.indexOf('data-turma-ajustar="nova"');
      return /class="selo[^"]*"[^>]*>livre</.test(p.slice(p.lastIndexOf('<li', i), p.indexOf('</li>', i)));
    })());
  provar('o título do selo diz PORQUE — o critério é automático e está escrito',
    /a turma[^"]*usa esta sala|já está numa turma/i.test(piano),
    (piano.match(/title="[^"]*"/) || [])[0]);
}

function paginaComSalas(salas) {
  return bastidores.paginaProducao('calango',
    { professor: 'pe-torto', escola: 'calango', query: 'professor=pe-torto&escola=calango' },
    [{ nome: 'Pe Torto', slug: 'pe-torto' }], ['Aluna A'], 'Pe Torto', 'pe-torto',
    salas, [], {}, CURADORIAS, RUBRICAS, PARES,
    { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() },
    { modo: 'clara', paleta: 'bordo' }, '', []);
}

// ==========================================================================================
(async () => {
  let JSDOM, VirtualConsole;
  try { ({ JSDOM, VirtualConsole } = require(path.join(RAIZ, 'node_modules', 'jsdom'))); } catch (e) {
    console.error('jsdom ausente: ' + e.message);
    process.exit(2);
  }

  const NAVJS = fs.readFileSync(path.join(destino, 'tools/templates/nav.js'), 'utf8');

  /* UM DOCUMENTO = UMA CARGA DA PÁGINA. A memória da aba (`sessionStorage`) entra por
   * `beforeParse`, porque é ela que a página lê no arranque, e é o que uma recarga encontra. */
  function abrir(memoria) {
    const vc = new VirtualConsole();
    vc.on('jsdomError', () => {});
    vc.on('error', () => {});
    const dom = new JSDOM(HTML.replace(/<script src="[^"]*"><\/script>/g, '')
      .replace('</body>', '<script>' + NAVJS + '</script></body>'), {
      runScripts: 'dangerously',
      url: 'https://calango.workers.dev/bastidores/estudio',
      pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {} });
        w.confirm = () => true;
        w.alert = () => {};
        for (const k of Object.keys(memoria || {})) {
          if (memoria[k] === null) continue;
          try { w.sessionStorage.setItem(k, memoria[k]); } catch (err) {}
        }
        w.fetch = (u, opcoes) => {
          const url = String(u);
          const corpo = url.indexOf('validar-producao') !== -1
            ? { ok: true, direcao: true, token: 'T' }
            : url.indexOf('/api/bastidores/turma-rubrica') !== -1
              ? { ok: true, turma: 'piano' }
              : url.indexOf('/api/bastidores/turma') !== -1
                ? { ok: true, id: 'piano', modo: 'criar' }
                : url.indexOf('/api/bastidores/rubrica') !== -1
                  ? { ok: true, id: 'r1' }
                  : { ok: true };
          const texto = JSON.stringify(corpo);
          return Promise.resolve({ ok: true, status: 200,
            json: () => Promise.resolve(corpo), text: () => Promise.resolve(texto) });
        };
      },
    });
    return dom;
  }
  const espera = (win, ms) => new Promise((r) => win.setTimeout(r, ms));

  function memoriaDe(win) {
    const m = {};
    for (let i = 0; i < win.sessionStorage.length; i += 1) {
      const k = win.sessionStorage.key(i);
      m[k] = win.sessionStorage.getItem(k);
    }
    return m;
  }

  function submeter(win, id) {
    const f = win.document.getElementById(id);
    f.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
  }

  function passoVisivel(doc) {
    const p = doc.getElementById('passo-rubrica');
    const t = doc.getElementById('passo-turma');
    const v = doc.getElementById('passo-vincular');
    if (p && p.hidden === false) return 'rubrica';
    if (v && v.hidden === false) return 'vincular';
    if (t && t.hidden === false) return 'turma';
    return '(nenhum)';
  }

  // ---------------------------------------------------------------------------------------
  console.log('\n2. O CAMINHO — passo 1 grava a sala e SEGUE para o passo 2');

  /* A CARGA COM QUE A PESSOA CHEGA. Um token válido (o servidor confirma-o), e mais nada: é a
   * aba de quem abre a Produção. */
  const A = abrir({ 'producao:token': 'T' });
  const wa = A.window;
  await espera(wa, 400);
  provar('a página abre no passo 1', passoVisivel(wa.document) === 'turma', passoVisivel(wa.document));

  const doc = wa.document;
  doc.getElementById('tnome').value = 'Piano';
  ['qua', 'sex'].forEach((d) => {
    const caixa = doc.querySelector('input[name="dia"][value="' + d + '"]');
    if (caixa) caixa.checked = true;
  });
  doc.getElementById('tduracao').value = '60';
  doc.getElementById('tinicio').value = '2026-11-20';
  doc.getElementById('tfim').value = '2026-12-20';
  doc.dispatchEvent(new wa.Event('input', { bubbles: true }));
  doc.dispatchEvent(new wa.Event('change', { bubbles: true }));
  provar('com a sala preenchida, o «Avançar» acende',
    doc.getElementById('t-enviar').disabled === false);

  submeter(wa, 'form-turma');
  await espera(wa, 200);
  const memoriaDepoisDoPasso1 = memoriaDe(wa);
  provar('o passo 1 grava a sala e pede o passo 2',
    memoriaDepoisDoPasso1['producao:passo'] === 'rubrica',
    memoriaDepoisDoPasso1['producao:passo']);
  provar('…e a sala acabada de gravar fica em foco',
    memoriaDepoisDoPasso1['producao:vinc-turma'] === 'piano',
    memoriaDepoisDoPasso1['producao:vinc-turma']);

  // A RECARGA. É o mesmo documento servido outra vez, com a memória que ficou.
  const B = abrir(memoriaDepoisDoPasso1);
  const wb = B.window;
  await espera(wb, 400);
  provar('depois da recarga, a página está NO PASSO 2 — e não de volta no 1',
    passoVisivel(wb.document) === 'rubrica', passoVisivel(wb.document));
  provar('…a faixa deixa «Rubricas» acender',
    (() => {
      const b = wb.document.querySelector('#sec-turmas button.passo[data-passo="rubrica"]');
      return !!b && b.disabled === false;
    })());
  /* O FORMULÁRIO NASCE VAZIO — é a regra de 11/11 («os campos… têm que ficar vazios, só com os
   * placeholders»), e ela NÃO se suspende a meio do caminho. O que diz de que sala se está a
   * falar é a linha do passo, e é isso que a asserção seguinte mede. */
  provar('…e o formulário do passo 1 nasce vazio, porque a sala já está gravada',
    wb.document.getElementById('tnome').value === '',
    wb.document.getElementById('tnome').value);
  provar('…e o passo 2 diz de que sala é',
    (() => {
      const l = wb.document.getElementById('rubr-turma');
      return !!l && l.hidden === false && /Piano/.test(l.textContent);
    })(),
    (() => { const l = wb.document.getElementById('rubr-turma');
      return l ? { oculto: l.hidden, texto: l.textContent } : null; })());

  // ---------------------------------------------------------------------------------------
  console.log('\n3. O CAMINHO — passo 2 grava a rubrica e SEGUE para o passo 3');

  wb.document.getElementById('rubr-nome').value = 'Régua da casa';
  const addNivel = wb.document.getElementById('rubr-add');
  addNivel.click();
  addNivel.click();
  const nomes = wb.document.querySelectorAll('#rubr-niveis input');
  if (nomes[0]) nomes[0].value = 'A';
  if (nomes[1]) nomes[1].value = 'B';
  submeter(wb, 'form-rubrica');
  await espera(wb, 200);
  const memoriaDepoisDoPasso2 = memoriaDe(wb);
  provar('o passo 2 pede o passo 3', memoriaDepoisDoPasso2['producao:passo'] === 'vincular',
    memoriaDepoisDoPasso2['producao:passo']);

  const C = abrir(memoriaDepoisDoPasso2);
  const wc = C.window;
  await espera(wc, 400);
  provar('depois da recarga, a página está NO PASSO 3 — e não de volta no 1',
    passoVisivel(wc.document) === 'vincular', passoVisivel(wc.document));
  provar('…e o passo 3 diz de que sala é',
    (() => {
      const l = wc.document.getElementById('vinc-turma-nome');
      return !!l && l.hidden === false && /Piano/.test(l.textContent);
    })(),
    (() => { const l = wc.document.getElementById('vinc-turma-nome');
      return l ? { oculto: l.hidden, texto: l.textContent } : null; })());

  // ---------------------------------------------------------------------------------------
  console.log('\n4. O FIM — gravar a sala devolve ao passo 1, com os campos vazios');

  const selR = wc.document.getElementById('vinc-rubrica');
  if (selR) {
    for (let i = 0; i < selR.options.length; i += 1) {
      if (selR.options[i].value === 'r1') { selR.value = 'r1'; break; }
    }
    selR.dispatchEvent(new wc.Event('change', { bubbles: true }));
  }
  provar('no passo 3, com a rubrica escolhida, o «Gravar sala» acende',
    wc.document.getElementById('vinc-gravar').disabled === false);
  wc.document.getElementById('vinc-gravar').click();
  await espera(wc, 200);
  const memoriaDoFim = memoriaDe(wc);
  provar('o passo 3 conclui e volta ao passo 1',
    memoriaDoFim['producao:passo'] === 'turma', memoriaDoFim['producao:passo']);

  const D = abrir(memoriaDoFim);
  const wd = D.window;
  await espera(wd, 400);
  provar('depois da recarga, a página está no passo 1', passoVisivel(wd.document) === 'turma',
    passoVisivel(wd.document));
  provar('…e os campos nascem vazios, só com os placeholders',
    wd.document.getElementById('tnome').value === '',
    wd.document.getElementById('tnome').value);
  provar('…e nenhuma sala fica em foco',
    !wd.sessionStorage.getItem('producao:vinc-turma'),
    wd.sessionStorage.getItem('producao:vinc-turma'));

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + n + ' asserções.');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + n + ' asserções: a sala anda do passo 1 para o 2, do 2 para o 3, '
    + 'e o fim volta ao 1 com os campos vazios.');
})();
