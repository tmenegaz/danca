#!/usr/bin/env node
'use strict';

/*
 * provar-abas-da-audicao.js — a prova da Audição em três abas (09/11/2026).
 *
 * PORQUE ESTA PROVA EXISTE. As três abas nasceram de um pedido dela — «reestruturar a página
 * 'corpo' em 3 abas», com «a listagem a permanecer visível em todas», e no telemóvel «similar à
 * que existe para a anamnese» (o «Ações», que sobe uma folha). Há duas formas de isto falhar sem
 * dar erro: a listagem ficar DENTRO do painel que se esconde, e a folha do telemóvel abrir uma
 * aba que não muda nada. Nenhuma das duas aparece num `node --check`.
 *
 * O QUE SE MEDE:
 *
 *   A. a marcação — a tira, os três painéis, a faixa dos passos fora deles, e a listagem FORA dos
 *      painéis (é ela que tem de ficar à vista nas três abas);
 *   B. a folha do telemóvel — o botão, o véu, os itens, e o corte dos 560px na folha;
 *   C. a troca a correr, em jsdom — clique, teclado e folha chamam a MESMA função: `aria-selected`,
 *      `hidden` dos painéis, e a faixa dos passos a sair fora da aba 1;
 *   D. a transferência — o «para o elenco» nasce VAZIO e sem o elenco de origem, e a lista do
 *      destino é reescrita quando a origem muda (o par inválido deixa de ser oferecido);
 *   E. o passo 3 — «Anamneses», e o estado a concordar («lidas»);
 *   F. os blocos que se dobram — trabalho, musicalidade e o comum nascem `<details open>`; o «O que
 *      já é bom» fica como estava (não foi pedido, e a simetria não é razão).
 *
 *   uso: node experimentos/provar-abas-da-audicao.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let ok = 0;
const falhas = [];
function provar(nome, condicao, detalhe) {
  if (condicao) { ok += 1; console.log('  ok  ' + nome); return; }
  falhas.push(nome + (detalhe ? ' — ' + detalhe : ''));
  console.log('  FALHA ' + nome + (detalhe ? ' — ' + detalhe : ''));
}

/** Dois elencos concluídos (com recorte), que é o mínimo para a transferência existir. */
function linhasDaProva() {
  return [
    { id: 'elenco-a', nome: 'Elenco A', professor: 'curador', alunas: ['Aluna Um'],
      campos: [{ id: 'x', nome: 'X' }] },
    { id: 'elenco-b', nome: 'Elenco B', professor: 'curador', alunas: ['Aluna Dois'],
      campos: [{ id: 'y', nome: 'Y' }] },
  ];
}

function montarPagina() {
  const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
  return bastidores.paginaProducao('barra', { escola: 'barra' }, [{ nome: 'Curador' }],
    ['Aluna Um', 'Aluna Dois'], 'Dono', 'dono', [{ nome: 'Turma X' }], [], {}, [], [], [], usos,
    { modo: 'clara', paleta: 'bordo' }, '', linhasDaProva());
}

async function principal() {
  const PAGINA = montarPagina();

  console.log('\nA. A marcação das três abas');

  const abas = [...PAGINA.matchAll(/<button type="button" class="aba" role="tab" id="lb-aba-(\d)"[^>]*data-aba="(\d)"/g)];
  provar('a tira tem as três abas, com role="tab" e data-aba',
    abas.length === 3 && abas.map((m) => m[2]).join(',') === '1,2,3',
    'encontradas: ' + abas.length);
  provar('a tira é um tablist e a primeira aba nasce escolhida',
    /class="abas" role="tablist"[^>]*id="lb-abas"/.test(PAGINA) &&
    /id="lb-aba-1"[^>]*aria-selected="true"/.test(PAGINA) &&
    /id="lb-aba-2"[^>]*aria-selected="false"/.test(PAGINA) &&
    /id="lb-aba-3"[^>]*aria-selected="false"/.test(PAGINA));
  provar('os três nomes são os que ela pediu',
    /Escolha de elenco<\/button>/.test(PAGINA) &&
    /O que os recortes olham<\/button>/.test(PAGINA) &&
    /Transferência<\/button>/.test(PAGINA));

  provar('o painel 1 nasce à vista, e os outros dois escondidos',
    /<div class="aba-painel" id="lb-painel-1"[^>]*>/.test(PAGINA) &&
    /id="lb-painel-2"[^>]*hidden/.test(PAGINA) &&
    /id="lb-painel-3"[^>]*hidden/.test(PAGINA));

  const iFaixa = PAGINA.indexOf('id="lb-faixa"');
  const iPainel1 = PAGINA.indexOf('id="lb-painel-1"');
  const iPainel3 = PAGINA.indexOf('id="lb-painel-3"');
  const iLista = PAGINA.indexOf('id="lb-lista"');
  const iColLista = PAGINA.indexOf('<div class="col-lista"', iPainel1);
  provar('a faixa dos passos fica FORA dos painéis (e acima deles)',
    iFaixa !== -1 && iPainel1 !== -1 && iFaixa < iPainel1);
  provar('a listagem fica DEPOIS dos três painéis — e fora deles',
    iColLista > iPainel3 && iLista > iColLista,
    'índices: painel3=' + iPainel3 + ', col-lista=' + iColLista + ', lista=' + iLista);

  /* A listagem tem de ser irmã do `.col-form`, e não filha de um painel. O `<div
   * class="col-lista">` abre depois do último painel, e é isso que a marcação diz: os três
   * painéis cabem no miolo, e a lista vem a seguir. */
  const trechoPaineis = PAGINA.slice(iPainel1, iColLista);
  provar('os três painéis cabem dentro do `.col-form`, e a lista vem depois',
    /id="lb-painel-1"/.test(trechoPaineis) &&
    /id="lb-painel-2"/.test(trechoPaineis) &&
    /id="lb-painel-3"/.test(trechoPaineis));

  console.log('\nB. A folha do telemóvel');

  provar('o botão «Abas» existe, nasce fechado e aponta para o menu',
    /id="lb-abas-botao"[^>]*aria-expanded="false"[^>]*aria-controls="lb-abas-menu"/.test(PAGINA));
  provar('o véu e o menu nascem escondidos',
    /id="lb-abas-veu"[^>]*hidden/.test(PAGINA) &&
    /id="lb-abas-menu"[^>]*hidden/.test(PAGINA));
  const itensDaFolha = [...PAGINA.matchAll(/class="menu-de-acoes-item" data-aba="(\d)"/g)];
  provar('a folha traz as mesmas três abas', itensDaFolha.length === 3,
    'itens: ' + itensDaFolha.length);
  provar('o corte dos 560px esconde a tira e mostra a folha',
    /@media \(max-width:560px\)\{\.abas\{display:none;\}#lb-abas-folha\{display:block/.test(PAGINA));
  provar('a faixa tem regra própria para o `hidden` (o `display:flex` vencia o atributo)',
    /\.turmas-faixa\[hidden\]\{display:none;\}/.test(PAGINA));
  provar('recolhida a secção, as abas saem (não se troca painel que não está à vista)',
    /\.secao\[data-recolhido="sim"\] #lb-abas,/.test(PAGINA) &&
    /\.secao\[data-recolhido="sim"\] #lb-abas-folha\{display:none;\}/.test(PAGINA));

  console.log('\nC. A troca, a correr (jsdom)');

  let JSDOM, VirtualConsole;
  try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
  catch (e) { throw new Error('jsdom ausente: ' + e.message); }
  const vc = new VirtualConsole();
  vc.on('jsdomError', () => {});
  vc.on('error', () => {});
  const dom = new JSDOM(PAGINA.replace(/<script src="[^"]*"><\/script>/g, ''), {
    runScripts: 'dangerously', url: 'https://barra.workers.dev/bastidores/producao',
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.confirm = () => true;
      w.alert = () => {};
      w.fetch = (u) => {
        const url = String(u);
        const corpo = url.indexOf('alunas-com-anamnese') !== -1
          ? { ok: true, alunas: [{ aluna: 'Aluna Um', carimbo: 'anamnese-a', novo: false, lidaEm: null }] }
          : url.indexOf('campos-do-corpo') !== -1
            ? { ok: true, campos: [{ id: 'x', nome: 'X', grupo: 'g', eixo: 'Funcional',
                dimensao: 'funcional', opcoes: ['A', 'B'] }], grupos: ['g'] }
            : url.indexOf('linhas-de-base') !== -1 ? { ok: true, linhas: [] } : { ok: true };
        return Promise.resolve({ ok: true, status: 200,
          json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
      };
    },
  });
  const win = dom.window;
  const doc = win.document;
  await new Promise((r) => win.setTimeout(r, 300));

  const aba = (n) => doc.getElementById('lb-aba-' + n);
  const painel = (n) => doc.getElementById('lb-painel-' + n);
  const faixa = doc.getElementById('lb-faixa');
  const lista = doc.getElementById('lb-lista');

  provar('a página arrancou e a troca de aba é uma função só',
    typeof win.abrirAbaDaAudicao === 'function');
  provar('a listagem está no documento, fora dos painéis',
    !!lista && painel(1).contains(lista) === false && painel(2).contains(lista) === false &&
    painel(3).contains(lista) === false);

  aba(2).click();
  provar('clicar na aba 2 mostra o painel 2 e esconde o 1',
    painel(2).hidden === false && painel(1).hidden === true);
  provar('…e a faixa dos passos sai (não há passos fora da aba 1)', faixa.hidden === true);
  provar('…e o `aria-selected` acompanha',
    aba(2).getAttribute('aria-selected') === 'true' &&
    aba(1).getAttribute('aria-selected') === 'false');
  provar('CONTROLO: a listagem continua à vista depois da troca', lista.hidden === false);

  aba(1).click();
  provar('voltar à aba 1 devolve a faixa dos passos', faixa.hidden === false);

  const nav = doc.getElementById('lb-abas');
  nav.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  provar('a seta direita muda de aba', painel(2).hidden === false &&
    aba(2).getAttribute('aria-selected') === 'true');
  nav.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  provar('o End vai à última', painel(3).hidden === false);
  nav.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  provar('o Home volta à primeira', painel(1).hidden === false && faixa.hidden === false);

  const botao = doc.getElementById('lb-abas-botao');
  const menu = doc.getElementById('lb-abas-menu');
  const veu = doc.getElementById('lb-abas-veu');
  botao.click();
  provar('o «Abas» sobe a folha (menu e véu à vista)',
    menu.hidden === false && veu.hidden === false &&
    botao.getAttribute('aria-expanded') === 'true');
  doc.querySelector('#lb-abas-menu [data-aba="3"]').click();
  provar('escolher na folha troca a aba E fecha a folha',
    painel(3).hidden === false && menu.hidden === true && veu.hidden === true);
  botao.click();
  veu.click();
  provar('o véu fecha a folha sem trocar de aba', menu.hidden === true && painel(3).hidden === false);

  console.log('\nD. A transferência — o destino nasce vazio, e nunca é a origem');

  const de = doc.getElementById('mv-de');
  const para = doc.getElementById('mv-para');
  provar('a origem nasce no primeiro elenco (é o que o servidor desenhou)',
    de.value === 'elenco-a', 'origem=' + de.value);
  provar('o destino nasce VAZIO — nada pré-preenchido',
    para.value === '' && /escolha o elenco de destino/.test(para.options[0].textContent),
    'destino=' + JSON.stringify(para.value));
  provar('…e o elenco de origem NÃO está na lista do destino',
    [...para.options].every((o) => o.value !== 'elenco-a'),
    'opções: ' + [...para.options].map((o) => o.value).join(','));

  de.value = 'elenco-b';
  de.dispatchEvent(new win.Event('change', { bubbles: true }));
  provar('mudar a origem reescreve o destino SEM o novo elenco de origem',
    [...para.options].every((o) => o.value !== 'elenco-b') &&
    [...para.options].some((o) => o.value === 'elenco-a'),
    'opções: ' + [...para.options].map((o) => o.value).join(','));

  para.value = 'elenco-a';
  de.value = 'elenco-a';
  de.dispatchEvent(new win.Event('change', { bubbles: true }));
  provar('voltar a origem ao mesmo elenco apaga a escolha inválida do destino',
    para.value === '' && [...para.options].every((o) => o.value !== 'elenco-a'));

  const formMover = doc.getElementById('form-mover');
  const resMover = doc.querySelector('[data-res="transferencia"]');
  let pedidos = 0;
  const fetchDaPagina = win.fetch;
  win.fetch = () => { pedidos += 1; return fetchDaPagina.apply(null, arguments); };
  formMover.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
  provar('sem destino escolhido o formulário NÃO chega à rede, e diz porquê',
    pedidos === 0 && resMover.className === 'res erro' && /destino/.test(resMover.textContent),
    'pedidos=' + pedidos + ', res=' + resMover.textContent);
  win.fetch = fetchDaPagina;

  console.log('\nE. O passo 3 chama-se «Anamneses»');

  /* O RÓTULO VIVE NA FONTE (`LB_PASSOS`), e não no HTML que ele gera: a tira desenha os quatro
   * passos a partir da constante, e procurar a string na página encontraria o resultado — que é
   * o mesmo, mas não diz onde a decisão está escrita. */
  const FONTE = require('fs').readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8');
  provar('a tira do passo 3 diz «Anamneses»', /\[3, 'Anamneses'\]/.test(FONTE));
  provar('…e o estado concorda com eles: «lidas»', /LEITURA_FEITA \? "lidas" : "por ler"/.test(PAGINA));

  console.log('\nF. Os blocos que se dobram');

  win.pintarClassificacao({
    atencao: [{ nome: 'Joelho', eixo: 'Funcional', texto: 'por trabalhar' }],
    excelencia: [{ nome: 'Pé', eixo: 'Técnica', texto: 'bom' }],
    musicalidade: [{ nome: 'Ouvido', eixo: 'Musicalidade', texto: 'a trabalhar' }],
    comuns: [{ nome: 'Tronco', eixo: 'Poiesis', texto: 'igual em todas' }],
  });
  const leitura = doc.getElementById('lb-leitura');
  const dobrados = leitura.querySelectorAll('details.bloco-lista');
  provar('três blocos se dobram: trabalho, musicalidade e o comum',
    dobrados.length === 3, 'dobrados: ' + dobrados.length);
  provar('…e os três nascem ABERTOS (o resultado do gesto fica à vista)',
    [...dobrados].every((d) => d.hasAttribute('open')));
  const titulos = [...dobrados].map((d) => d.querySelector('.bloco-titulo').textContent);
  provar('…com os títulos certos',
    titulos.some((t) => /precisa de ser trabalhado/.test(t)) &&
    titulos.some((t) => /Musicalidade/.test(t)) &&
    titulos.some((t) => /grupo tem em comum/.test(t)),
    titulos.join(' | '));
  provar('o «O que já é bom» fica fora do acordeão — não foi pedido',
    /<h4>O que já é bom/.test(leitura.innerHTML) &&
    !titulos.some((t) => /já é bom/.test(t)));

  win.pintarClassificacao({ atencao: [], excelencia: [], musicalidade: [], comuns: [] });
  provar('mesmo vazio, os três blocos dobrados existem e dizem o que falta',
    doc.getElementById('lb-leitura').querySelectorAll('details.bloco-lista').length === 3);

  dom.window.close();

  console.log('');
  if (falhas.length) {
    console.log('FALHARAM ' + falhas.length + ' de ' + (ok + falhas.length) + ' provas:');
    falhas.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log(ok + ' prova(s) passaram, 0 falharam');
}

principal().catch((erro) => { console.error('erro na prova:', erro); process.exit(1); });
