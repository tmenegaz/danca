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
 *   C. a troca a correr, em jsdom — clique, teclado e folha chamam a MESMA função;
 *   D. a transferência, na ORDEM DO ACTO — a origem, depois as alunas DELA, depois o destino,
 *      depois o motivo; o destino nunca é a origem nem um elenco que já tem a aluna; a lista
 *      atualiza-se da leitura da página, sem F5;
 *   E. o passo 3 — «Anamneses», e o estado a concordar («lidas»);
 *   F. os quatro blocos que se dobram — inclusive o «O que já é bom», que entrou na segunda
 *      passagem a pedido dela;
 *   G. o «Concluir elenco» LIMPA o formulário — a próxima gravação não pode cair no elenco que
 *      acabou de ser criado;
 *   H. o RESPIRO entre os cartões, medido num navegador de verdade (a cascata era o defeito: uma
 *      regra de página vencia a margem da folha) — e um A/B que devolve o `margin:0` para mostrar
 *      que a medida sabe reprovar; e o FILETE PONTILHADO da listagem de elencos, comparado com a
 *      linha da «Exercícios com verbete» (é dela que o tracejado é o mesmo), com A/B próprio;
 *   I. o «Cancelar» — o botão que existia na marcação e nunca aparecia; e o gesto a DESCARTAR no
 *      servidor (o rascunho sai do KV), com o formulário a fechar-se a seguir, SEM confirmação;
 *   J. o FORMULÁRIO ABERTO ACOMPANHA A TRANSFERÊNCIA — sem isto, a caixa marcada no passo 2
 *      gravaria o elenco velho por cima do acto no «Seguir» seguinte.
 *
 *   uso: node experimentos/provar-abas-da-audicao.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let ok = 0;
const puladas = [];
const falhas = [];
function provar(nome, condicao, detalhe) {
  if (condicao) { ok += 1; console.log('  ok  ' + nome); return; }
  falhas.push(nome + (detalhe ? ' — ' + detalhe : ''));
  console.log('  FALHA ' + nome + (detalhe ? ' — ' + detalhe : ''));
}
function naoMedida(nome, motivo) {
  puladas.push(nome);
  console.log('  —   ' + nome + ': NÃO MEDIDA (' + motivo + ')');
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

/** Os elencos como a rota `/linhas-de-base` os devolve — o MESMO leitor do servidor. */
function elencosDaRota() {
  return bastidores.elencosParaATurma(linhasDaProva());
}

function montarPagina() {
  const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
  return bastidores.paginaProducao('barra', { escola: 'barra' }, [{ nome: 'Curador' }],
    ['Aluna Um', 'Aluna Dois'], 'Dono', 'dono', [{ nome: 'Turma X' }], [], {}, [], [], [], usos,
    { modo: 'clara', paleta: 'bordo' }, '', linhasDaProva());
}

/* ------------------------------------------------------------------ H. a geometria */

/** O CSS da Produção, extraído do próprio JS — nada de cópia que possa envelhecer. */
function cssDaProducao() {
  const src = fs.readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8');
  const i = src.indexOf("'.lateral{position:");
  // O FIM DO BLOCO: o `</style>` da MESMA vista. Sem aspas no padrão — a linha do arquivo é
  // `'</style></head><body …`, e uma aspa depois do `>` não existe.
  const j = src.indexOf("</style></head>", i);
  if (i < 0 || j < 0) throw new Error('bastidores.js: bloco de estilo da Produção não encontrado');
  return [...src.slice(i, j).matchAll(/'((?:[^'\\]|\\.)*)'/g)]
    .map((m) => m[1].replace(/\\'/g, "'"))
    .join('\n');
}

/** Uma listagem de elencos em miniatura, com as MESMAS classes que a página emite. */
function paginaDaLista({ semMargem = false, semFilete = false } = {}) {
  const folha = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
  const cartao = (nome) => '<li class="trio-plano"><div class="trio-linha">' +
    '<span class="trio-nome"><b>' + nome + '</b></span></div>' +
    '<div class="fatos"><span>1 aspecto</span><span>1 aluna</span></div>' +
    '<div class="trio-dono">curador</div></li>';
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<style>' + folha + '</style><style>' + cssDaProducao() + '</style>' +
    // O A/B DO RESPIRO: a regra que a página tinha a 09/11/2026 (antes da correção), reinjetada
    // por último — é ela que apagava o respiro da folha.
    (semMargem ? '<style>.lb-cartoes>li{margin:0;}</style>' : '') +
    // O A/B DO FILETE: a mesma regra de «reset», com o `border-bottom:0` que apagava o tracejado.
    (semFilete ? '<style>.lb-cartoes>li{padding:0;border-bottom:0;}</style>' : '') +
    '</head><body data-layout="painel">' +
    '<div class="secao"><div class="turmas-corpo"><div class="col-lista">' +
    '<h3>Elencos</h3><div class="rolagem"><ul class="lb-cartoes" id="lb-lista">' +
    cartao('Elenco A') + cartao('Elenco B') + cartao('Elenco C') +
    '</ul></div>' +
    // A REFERÊNCIA: uma linha de `.lista` — a das «Exercícios com verbete». É dela que a
    // listagem de elencos passa a vestir o filete, e é com ela que a medida se compara.
    '<ul class="lista" id="lista-referencia"><li>Referência</li></ul>' +
    '</div></div></div></body></html>';
}

async function medirRespiro() {
  const executablePath = process.env.CHROME_PATH ||
    ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executablePath) {
    naoMedida('o respiro entre os cartões', 'sem Chrome/Chromium');
    naoMedida('o A/B do respiro', 'sem Chrome/Chromium');
    naoMedida('o filete pontilhado da listagem de elencos', 'sem Chrome/Chromium');
    naoMedida('o A/B do filete', 'sem Chrome/Chromium');
    return;
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (e) {
    naoMedida('o respiro entre os cartões', 'sem puppeteer-core');
    naoMedida('o A/B do respiro', 'sem puppeteer-core');
    naoMedida('o filete pontilhado da listagem de elencos', 'sem puppeteer-core');
    naoMedida('o A/B do filete', 'sem puppeteer-core');
    return;
  }
  const semMargem = path.join(os.tmpdir(), 'provar-abas-lista-sem-margem.html');
  const semFilete = path.join(os.tmpdir(), 'provar-abas-lista-sem-filete.html');
  const comMargem = path.join(os.tmpdir(), 'provar-abas-lista.html');
  fs.writeFileSync(semMargem, paginaDaLista({ semMargem: true }));
  fs.writeFileSync(semFilete, paginaDaLista({ semFilete: true }));
  fs.writeFileSync(comMargem, paginaDaLista());

  const browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    /** O vão entre cartões consecutivos, em px, na largura pedida. */
    const vaos = async (arquivo, largura) => {
      await page.setViewport({ width: largura, height: 900 });
      await page.goto('file://' + arquivo, { waitUntil: 'load' });
      return page.evaluate(() => {
        const cartoes = [...document.querySelectorAll('#lb-lista > li')];
        const saida = [];
        for (let i = 1; i < cartoes.length; i++) {
          saida.push(Math.round((cartoes[i].getBoundingClientRect().top -
            cartoes[i - 1].getBoundingClientRect().bottom) * 100) / 100);
        }
        return saida;
      });
    };
    /** O filete da ÚLTIMA aresta da linha: o que se lê como tracejado por baixo do cartão. */
    const filetes = async (arquivo, largura) => {
      await page.setViewport({ width: largura, height: 900 });
      await page.goto('file://' + arquivo, { waitUntil: 'load' });
      return page.evaluate(() => {
        const ler = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const cs = getComputedStyle(el);
          return cs.borderBottomWidth + ' ' + cs.borderBottomStyle + ' ' + cs.borderBottomColor;
        };
        return { elenco: ler('#lb-lista > li'), referencia: ler('#lista-referencia > li') };
      });
    };

    const noComputador = await vaos(comMargem, 1280);
    const noCelular = await vaos(comMargem, 320);
    const minimo = (lista) => Math.min(...lista);
    provar('os cartões do elenco têm respiro entre si (computador, 1280px)',
      minimo(noComputador) >= 6, 'vãos medidos: ' + JSON.stringify(noComputador));
    provar('…e no celular (320px)', minimo(noCelular) >= 6,
      'vãos medidos: ' + JSON.stringify(noCelular));
    provar('…e não se encavalam (nenhum vão negativo)',
      [...noComputador, ...noCelular].every((v) => v >= 0));

    /* O A/B. Sem ele, «o vão é 9,6px» não prova que a medida distingue uma coisa da outra: a
     * regra que a página tinha antes é reinjectada, e o vão tem de cair a zero. */
    const antes = minimo(await vaos(semMargem, 1280));
    provar('CONTROLO A/B: com o `margin:0` de antes, o vão cai a zero', antes === 0,
      'vão medido com a regra antiga: ' + antes);

    /* O FILETE. A queixa de 09/11/2026: a listagem de elencos não tinha o tracejado inferior
     * que Estilo, Salas, Professores e Alunos têm. O padrão é a linha de `.lista` — a das
     * «Exercícios com verbete» —, e a prova compara as duas arestas, e não um valor escrito à
     * mão: é a IGUALDADE entre elas que se quer, em qualquer largura. */
    for (const largura of [1280, 320]) {
      const { elenco, referencia } = await filetes(comMargem, largura);
      provar('a listagem de elencos tem filete pontilhado em baixo (' + largura + 'px)',
        !!elenco && /\bdotted\b/.test(elenco) && !/^0px/.test(elenco),
        'filete do elenco: ' + elenco + ' · referência .lista: ' + referencia);
      provar('…e é o MESMO da lista de exercícios com verbete (' + largura + 'px)',
        !!elenco && elenco === referencia,
        'elenco: ' + elenco + ' · referência: ' + referencia);
    }

    /* O A/B DO FILETE: devolve-se o `border-bottom:0` de «reset» que a página tinha e a aresta
     * tem de desaparecer — senão a medida passaria mesmo sem a correção. */
    const semOFilete = (await filetes(semFilete, 1280)).elenco;
    provar('CONTROLO A/B: com o `border-bottom:0` de antes, o filete desaparece',
      !!semOFilete && /^0px/.test(semOFilete),
      'filete medido com a regra antiga: ' + semOFilete);
  } finally {
    await browser.close();
    try { fs.unlinkSync(semMargem); fs.unlinkSync(semFilete); fs.unlinkSync(comMargem); } catch (e) { /* nada */ }
  }
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
    /Recorte<\/button>/.test(PAGINA) &&
    /Transferência<\/button>/.test(PAGINA));
  provar('a aba 2 chama-se «Recorte» — e não a descrição longa do primeiro rótulo',
    !/O que os recortes olham<\/button>/.test(PAGINA) &&
    [...PAGINA.matchAll(/class="aba" role="tab" id="lb-aba-\d"[^>]*>([^<]*)</g)]
      .map((m) => m[1]).join(' | ') === 'Escolha de elenco | Recorte | Transferência',
    'abas: ' + [...PAGINA.matchAll(/class="aba" role="tab" id="lb-aba-\d"[^>]*>([^<]*)</g)]
      .map((m) => m[1]).join(' | '));
  provar('a folha do telemóvel diz o MESMO que a tira',
    [...PAGINA.matchAll(/class="menu-de-acoes-item" data-aba="\d">([^<]*)</g)]
      .map((m) => m[1]).join(' | ') === 'Escolha de elenco | Recorte | Transferência');

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
  const ELENCOS_DA_ROTA = elencosDaRota();
  /* O `confirm` É CONTADO, e não só respondido (09/11/2026). O «Cancelar» do elenco deixou de
   * perguntar: o clique cessa a edição, como o da Turma. A prova mede os dois lados — que o
   * descarte continua a acontecer, e que não houve pergunta pelo caminho. */
  let confirmacoes = 0;
  /* A LISTA QUE O SERVIDOR DEVOLVE É VIVA, e não uma constante: as secções I e J medem o que a
   * página faz DEPOIS de uma transferência, e para isso a resposta de `linhas-de-base` tem de poder
   * mudar. Uma lista congelada mediria o primeiro desenho para sempre — e o defeito que se mede
   * aqui é exactamente o de uma tela que não acompanha o servidor. */
  let linhasNaRota = linhasDaProva();
  const dom = new JSDOM(PAGINA.replace(/<script src="[^"]*"><\/script>/g, ''), {
    runScripts: 'dangerously', url: 'https://barra.workers.dev/bastidores/producao',
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.confirm = () => { confirmacoes += 1; return true; };
      w.alert = () => {};
      w.fetch = (u) => {
        const url = String(u);
        const corpo = url.indexOf('alunas-com-anamnese') !== -1
          ? { ok: true, alunas: [{ aluna: 'Aluna Um', carimbo: 'anamnese-a', novo: false, lidaEm: null }] }
          : url.indexOf('campos-do-corpo') !== -1
            ? { ok: true, campos: [{ id: 'x', nome: 'X', grupo: 'g', eixo: 'Funcional',
                dimensao: 'funcional', opcoes: ['A', 'B'] }], grupos: ['g'] }
            : url.indexOf('linhas-de-base') !== -1
              ? { ok: true, linhas: linhasNaRota, elencos: bastidores.elencosParaATurma(linhasNaRota) }
              : { ok: true };
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

  console.log('\nD. A transferência, na ordem do acto');

  const de = doc.getElementById('mv-de');
  const aluna = doc.getElementById('mv-aluna');
  const para = doc.getElementById('mv-para');
  const formMover = doc.getElementById('form-mover');
  const semDois = doc.getElementById('mv-sem-dois');
  const enviarMover = doc.getElementById('mv-enviar');
  const mudar = (el) => el.dispatchEvent(new win.Event('change', { bubbles: true }));
  const valores = (el) => [...el.options].map((o) => o.value);

  provar('com dois elencos concluídos o formulário aparece, e o aviso de falta sai',
    formMover.hidden === false && semDois.hidden === true);
  provar('os quatro campos estão na ORDEM DO ACTO: origem, aluna, destino, motivo',
    [...doc.querySelectorAll('#form-mover select, #form-mover input')].map((x) => x.id)
      .join(',') === 'mv-de,mv-aluna,mv-para,mv-motivo',
    'ordem: ' + [...doc.querySelectorAll('#form-mover select, #form-mover input')]
      .map((x) => x.id).join(','));
  provar('a ORIGEM nasce vazia — é o primeiro campo, e nada está escolhido',
    de.value === '' && /escolha o elenco de origem/.test(de.options[0].textContent),
    'origem=' + JSON.stringify(de.value));
  provar('a ALUNA nasce desligada e diz que a origem vem primeiro',
    aluna.disabled === true && /origem primeiro/.test(aluna.options[0].textContent));
  provar('o DESTINO nasce desligado e só com a opção vazia',
    para.disabled === true && valores(para).join('') === '');
  provar('o «Mover» nasce desligado', enviarMover.disabled === true);

  de.value = 'elenco-a';
  mudar(de);
  provar('escolher a origem carrega SÓ as alunas DELA (não as da escola inteira)',
    valores(aluna).join(',') === ',Aluna Um' && aluna.disabled === false,
    'alunas: ' + valores(aluna).join(','));
  provar('…e o destino continua vazio: a aluna vem antes dele',
    valores(para).join('') === '' && para.disabled === true);

  aluna.value = 'Aluna Um';
  mudar(aluna);
  provar('escolhida a aluna, o destino oferece os outros elencos — e não a origem',
    valores(para).join(',') === ',elenco-b', 'destinos: ' + valores(para).join(','));
  provar('…sem vir preenchido', para.value === '');
  provar('…e o «Mover» ainda espera o destino', enviarMover.disabled === true);

  /* O ELENCO QUE JÁ TEM A ALUNA NÃO É OFERECIDO — o núcleo recusa («já está no elenco»), e a
   * lista deixa de o propor. O controlo é o `elenco-b` do cenário anterior, que continua a ser
   * oferecido por não a ter. */
  win.ELENCOS_MOVIVEIS.push({ id: 'elenco-c', rotulo: 'Elenco C — 1 aluna',
    alunas: ['Aluna Um'], rascunho: false });
  win.pintarTransferencia();
  provar('o elenco que JÁ tem a aluna não aparece no destino',
    valores(doc.getElementById('mv-para')).join(',') === ',elenco-b',
    'destinos: ' + valores(doc.getElementById('mv-para')).join(','));

  /* A ABA 3 VIVE DA LEITURA DA LISTA (09/11/2026): um elenco concluído na aba 1 aparece aqui sem
   * recarregar a página. O caminho é o `carregarLinhas`, por onde passa toda a gravação. */
  win.ELENCOS_MOVIVEIS = ELENCOS_DA_ROTA.concat([{ id: 'elenco-d', rotulo: 'Elenco D — 2 alunas',
    alunas: ['Aluna Um', 'Aluna Dois'], rascunho: false }]);
  win.pintarTransferencia();
  provar('um elenco concluído depois de a página abrir entra nas ORIGENS sem F5',
    valores(de).indexOf('elenco-d') !== -1, 'origens: ' + valores(de).join(','));
  provar('…e a escolha em curso sobrevive à repintura', de.value === 'elenco-a',
    'origem=' + de.value);

  const salvo = win.ELENCOS_MOVIVEIS;
  win.ELENCOS_MOVIVEIS = [{ id: 'elenco-a', rotulo: 'Elenco A', alunas: ['Aluna Um'], rascunho: false }];
  win.pintarTransferencia();
  provar('com MENOS de dois elencos o formulário sai e a frase diz o que falta',
    formMover.hidden === true && semDois.hidden === false &&
    /DOIS elencos concluídos/.test(semDois.textContent), semDois.textContent.slice(0, 60));
  win.ELENCOS_MOVIVEIS = salvo;
  win.pintarTransferencia();
  provar('…e volta quando o segundo elenco existe outra vez', formMover.hidden === false);

  const resMover = doc.querySelector('[data-res="transferencia"]');
  let pedidos = 0;
  let corpoEnviado = null;
  const fetchDaPagina = win.fetch;
  win.fetch = (u, init) => {
    if (init && init.method === 'POST') { pedidos += 1; corpoEnviado = JSON.parse(init.body); }
    return fetchDaPagina(u, init);
  };
  formMover.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
  provar('sem destino escolhido o formulário NÃO chega à rede, e diz o que falta',
    pedidos === 0 && resMover.className === 'res erro' && /destino/.test(resMover.textContent),
    'pedidos=' + pedidos + ', res=' + resMover.textContent);

  para.value = 'elenco-b';
  mudar(para);
  provar('com o destino escolhido o «Mover» acende', enviarMover.disabled === false);

  /* DEPOIS DO ATO A PÁGINA NÃO RECARREGA: a listagem é que se relê. Mede-se pelo pedido da lista
   * (`GET …/linhas-de-base`), que passa a contar uma vez mais — e pela ausência do
   * `location.reload()` que lá estava, agora que o estado se repinta em sítio. */
  let leiturasDaLista = 0;
  win.fetch = (u, init) => {
    const url = String(u);
    if (init && init.method === 'POST') { pedidos += 1; corpoEnviado = JSON.parse(init.body); }
    else if (url.indexOf('linhas-de-base') !== -1) leiturasDaLista += 1;
    return fetchDaPagina(u, init);
  };
  const leiturasAntes = leiturasDaLista;
  formMover.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise((r) => win.setTimeout(r, 60));
  provar('o pedido leva aluna, origem e destino — os três campos do acto',
    pedidos === 1 && corpoEnviado && corpoEnviado.aluna === 'Aluna Um' &&
    corpoEnviado.de === 'elenco-a' && corpoEnviado.para === 'elenco-b',
    'corpo=' + JSON.stringify(corpoEnviado));
  provar('…e a LISTA é relida depois do ato (sem recarregar a página)',
    leiturasDaLista === leiturasAntes + 1,
    'leituras: ' + leiturasAntes + ' -> ' + leiturasDaLista);
  const iHandler = PAGINA.indexOf('var formMover');
  const trechoDoHandler = PAGINA.slice(iHandler,
    PAGINA.indexOf('function marcados(', iHandler));
  provar('…e o handler da transferência já não tem `location.reload`',
    trechoDoHandler.length > 200 && !/location\.reload/.test(trechoDoHandler),
    'trecho com ' + trechoDoHandler.length + ' caracteres');
  win.fetch = fetchDaPagina;

  console.log('\nE. O passo 3 chama-se «Anamneses»');

  /* O RÓTULO VIVE NA FONTE (`LB_PASSOS`), e não no HTML que ele gera: a tira desenha os quatro
   * passos a partir da constante, e procurar a string na página encontraria o resultado — que é
   * o mesmo, mas não diz onde a decisão está escrita. */
  const FONTE = fs.readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8');
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
  provar('os QUATRO blocos da leitura se dobram', dobrados.length === 4,
    'dobrados: ' + dobrados.length);
  provar('…e os quatro nascem ABERTOS (o resultado do gesto fica à vista)',
    [...dobrados].every((d) => d.hasAttribute('open')));
  const titulos = [...dobrados].map((d) => d.querySelector('.bloco-titulo').textContent);
  provar('…com os títulos certos, o «O que já é bom» incluído',
    titulos.some((t) => /precisa de ser trabalhado/.test(t)) &&
    titulos.some((t) => /já é bom/.test(t)) &&
    titulos.some((t) => /Musicalidade/.test(t)) &&
    titulos.some((t) => /grupo tem em comum/.test(t)),
    titulos.join(' | '));
  provar('…e nenhum bloco fica com um `h4` por cima do `summary` (o título não se repete)',
    leitura.querySelectorAll('h4').length === 0,
    'h4: ' + leitura.querySelectorAll('h4').length);

  win.pintarClassificacao({ atencao: [], excelencia: [], musicalidade: [], comuns: [] });
  provar('mesmo vazio, os quatro blocos dobrados existem e dizem o que falta',
    doc.getElementById('lb-leitura').querySelectorAll('details.bloco-lista').length === 4);

  console.log('\nG. O «Concluir elenco» limpa o formulário');

  const modo = doc.getElementById('lb-modo');
  const nome = doc.getElementById('lb-nome');
  modo.value = 'elenco-a';
  nome.value = 'Recorte de prova';
  const caixaDaAluna = doc.querySelector('input[name="lb-aluna"]');
  if (caixaDaAluna) caixaDaAluna.checked = true;
  const resLB = doc.querySelector('[data-res="linha-base"]');

  const fetchAntesDoConcluir = win.fetch;
  let postsDoElenco = 0;
  win.fetch = (u, init) => {
    if (init && init.method === 'POST') {
      postsDoElenco += 1;
      return Promise.resolve({ ok: true, status: 200,
        json: () => Promise.resolve({ ok: true, linha: { id: 'elenco-a', nome: 'Recorte de prova' },
          disparos: [], aviso: '' }), text: () => Promise.resolve('') });
    }
    return fetchAntesDoConcluir(u, init);
  };
  const concluiu = await win.concluirElenco();
  win.fetch = fetchAntesDoConcluir;

  provar('o «Concluir elenco» grava e devolve verdadeiro', concluiu === true && postsDoElenco === 1,
    'ok=' + concluiu + ', pedidos=' + postsDoElenco);
  provar('o id do elenco SAI do formulário — a próxima gravação não edita o recém-criado',
    modo.value === '', 'modo=' + JSON.stringify(modo.value));
  provar('o nome sai', nome.value === '', 'nome=' + JSON.stringify(nome.value));
  provar('as alunas ficam desmarcadas',
    doc.querySelectorAll('input[name="lb-aluna"]:checked').length === 0);
  provar('o formulário volta ao passo 1 — pronto para o próximo elenco',
    win.LB_PASSO === 1 && doc.querySelector('#lb-painel-1 .passo-painel[data-passo="1"]').hidden === false);
  provar('a frase do resultado fica à vista (não se apaga o que aconteceu)',
    /concluído/.test(resLB.textContent) && resLB.className === 'res ok',
    'res=' + resLB.textContent.slice(0, 60));
  provar('o professor NÃO é limpo — é quem está a trabalhar',
    doc.getElementById('lb-professor').value !== '', doc.getElementById('lb-professor').value);

  console.log('\nH. O respiro entre os cartões do elenco (navegador)');
  await medirRespiro();

  console.log('\nI. O «Cancelar» — o botão que nunca aparecia');

  const caixaCancelar = doc.getElementById('lb-linha-cancelar');
  win.limparForm();
  provar('fora da edição, o «Cancelar» não está à vista', caixaCancelar.hidden === true);

  win.editarLinha('elenco-a');
  provar('no modo de edição o «Cancelar» aparece', caixaCancelar.hidden === false);
  provar('…e o botão diz o que faz e o nome que a Turma usa',
    /descartar/i.test(doc.getElementById('lb-cancelar').getAttribute('title') || '') &&
    doc.getElementById('lb-cancelar').textContent.trim() === 'Cancelar',
    doc.getElementById('lb-cancelar').textContent.trim());

  /* DESCARTAR É UM ATO NO SERVIDOR (09/11/2026). Limpar o ecrã deixava o rascunho no KV — e o
   * rascunho é o que a listagem mostra: o professor «cancelava» e via as alterações lá. */
  let descartes = [];
  const fetchAntesDoDescartar = win.fetch;
  win.fetch = (u, init) => {
    const url = String(u);
    if (url.indexOf('linha-de-base/descartar') !== -1) {
      descartes.push(JSON.parse(init.body));
      return Promise.resolve({ ok: true, status: 200,
        json: () => Promise.resolve({ ok: true, descartado: true, mantemActo: true,
          aviso: 'alterações descartadas — o elenco voltou à versão concluída.' }),
        text: () => Promise.resolve('') });
    }
    return fetchAntesDoDescartar(u, init);
  };
  win.editarLinha('elenco-a');
  const confirmacoesAntesDoCancelar = confirmacoes;
  doc.getElementById('lb-cancelar').click();
  await new Promise((r) => win.setTimeout(r, 120));
  win.fetch = fetchAntesDoDescartar;

  provar('o «Cancelar» NÃO pergunta nada — o clique cessa a edição',
    confirmacoes === confirmacoesAntesDoCancelar,
    'confirmações: ' + (confirmacoes - confirmacoesAntesDoCancelar));
  provar('o «Cancelar» descarta no SERVIDOR, com o id do elenco aberto',
    descartes.length === 1 && descartes[0].id === 'elenco-a',
    'pedidos: ' + JSON.stringify(descartes));
  provar('…e o formulário fica limpo: o id sai, o nome sai',
    doc.getElementById('lb-modo').value === '' && doc.getElementById('lb-nome').value === '');
  provar('…e o botão volta a esconder-se', caixaCancelar.hidden === true);
  provar('…e a frase diz o que ficou',
    /descartad/i.test(doc.querySelector('[data-res="linha-base"]').textContent),
    doc.querySelector('[data-res="linha-base"]').textContent);

  /* SEM NADA ABERTO NÃO SE PEDE CONFIRMAÇÃO NEM SE CHAMA O SERVIDOR — mas o clique não pode
   * morrer: o teclado chega ao botão mesmo escondido. */
  let descartesVazios = 0;
  win.fetch = (u) => {
    if (String(u).indexOf('linha-de-base/descartar') !== -1) descartesVazios += 1;
    return fetchAntesDoDescartar(u);
  };
  doc.getElementById('lb-cancelar').click();
  await new Promise((r) => win.setTimeout(r, 60));
  win.fetch = fetchAntesDoDescartar;
  provar('sem elenco aberto o «Cancelar» não chama o servidor', descartesVazios === 0);

  console.log('\nJ. O formulário aberto acompanha a transferência');

  /* O DEFEITO, do lado do cliente: o professor edita o elenco A, vai à aba 3 e move uma aluna
   * DELE. O formulário continua com a caixa marcada, e o «Seguir» seguinte gravaria o elenco velho
   * por cima do acto. A página relê o elenco depois da lista — mede-se a caixa. */
  win.editarLinha('elenco-a');
  const caixaDaAlunaAberta = [...doc.querySelectorAll('input[name="lb-aluna"]')]
    .find((c) => c.value === 'Aluna Um');
  provar('antes da transferência a aluna está marcada no formulário',
    Boolean(caixaDaAlunaAberta && caixaDaAlunaAberta.checked));

  /* O SERVIDOR PASSA A DIZER OUTRA COISA: a origem perdeu a aluna, o destino ganhou-a. É o que a
   * rota devolve depois do acto, e o que a resposta da transferência traz no teste seguinte. */
  linhasNaRota = [
    Object.assign({}, linhasDaProva()[0], { alunas: ['Aluna Dois'] }),
    Object.assign({}, linhasDaProva()[1], { alunas: ['Aluna Dois', 'Aluna Um'] }),
  ];
  const fetchDoMovimento = win.fetch;
  win.fetch = (u, init) => {
    if (init && init.method === 'POST' && String(u).indexOf('elenco-mover') !== -1) {
      return Promise.resolve({ ok: true, status: 200,
        json: () => Promise.resolve({ ok: true, aluna: 'Aluna Um', de: 'elenco-a', para: 'elenco-b',
          proximo: '' }), text: () => Promise.resolve('') });
    }
    return fetchDoMovimento(u, init);
  };
  win.abrirAbaDaAudicao('3');
  de.value = 'elenco-a';
  mudar(de);
  aluna.value = 'Aluna Um';
  mudar(aluna);
  para.value = 'elenco-b';
  mudar(para);
  formMover.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise((r) => win.setTimeout(r, 250));
  win.fetch = fetchDoMovimento;

  const caixaDepoisDaTransferencia = [...doc.querySelectorAll('input[name="lb-aluna"]')]
    .find((c) => c.value === 'Aluna Um');
  provar('depois do ato a aluna já não está marcada no formulário aberto',
    Boolean(caixaDepoisDaTransferencia) && caixaDepoisDaTransferencia.checked === false,
    caixaDepoisDaTransferencia ? 'marcada=' + caixaDepoisDaTransferencia.checked : 'a caixa desapareceu');
  provar('…e o formulário continua a editar o MESMO elenco (não se perdeu o fio)',
    doc.getElementById('lb-modo').value === 'elenco-a', doc.getElementById('lb-modo').value);
  provar('…e a frase da transferência fica à vista depois da releitura',
    /passou de/.test(doc.querySelector('[data-res="transferencia"]').textContent),
    doc.querySelector('[data-res="transferencia"]').textContent);

  /* REPETIR UMA TRANSFERÊNCIA JÁ FEITA NÃO SE CONTA COMO ATO NOVO (09/11/2026): o servidor
   * responde `jaEstava`, e a frase é a do aviso — não «passou de A para B» de um ato que não
   * aconteceu agora. */
  const resMoverNovo = doc.querySelector('[data-res="transferencia"]');
  /* A PÁGINA ATRASADA: o professor tinha a aba aberta de antes. É o único estado em que ele
   * CONSEGUE repetir o gesto — na página nova a aluna já não está na origem, e a lista não a
   * oferece. O servidor é quem sabe que os actos já dizem o que se pediu. */
  linhasNaRota = linhasDaProva();
  win.ELENCOS_MOVIVEIS = bastidores.elencosParaATurma(linhasNaRota);
  win.pintarTransferencia();
  const fetchDaRepeticao = win.fetch;
  win.fetch = (u, init) => {
    if (init && init.method === 'POST' && String(u).indexOf('elenco-mover') !== -1) {
      return Promise.resolve({ ok: true, status: 200,
        json: () => Promise.resolve({ ok: true, jaEstava: true, aluna: 'Aluna Um',
          de: 'elenco-a', para: 'elenco-b',
          aviso: 'a transferência já estava nos actos; o rascunho que a mostrava atrasada foi acertado.' }),
        text: () => Promise.resolve('') });
    }
    return fetchDaRepeticao(u, init);
  };
  de.value = 'elenco-a';
  mudar(de);
  aluna.value = 'Aluna Um';
  mudar(aluna);
  para.value = 'elenco-b';
  mudar(para);
  formMover.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise((r) => win.setTimeout(r, 150));
  win.fetch = fetchDaRepeticao;
  provar('a repetição mostra o AVISO, e não um «passou de» de um ato que não houve',
    /já estava/.test(resMoverNovo.textContent) && !/passou de/.test(resMoverNovo.textContent),
    resMoverNovo.textContent);

  /* ---------------------------------------------- K. AS DUAS ABAS APRENDEM A ESPERAR (15/11/2026)
   *
   * O PEDIDO, na letra dela: «As abas recorte e transferência não podem estar habilitadas
   * enquanto não existir um elenco gravado.»
   *
   * O QUE SE MEDE, e não se lê: com a lista de elencos VAZIA, as abas 2 e 3 nascem desligadas, o
   * `title` diz por quê, o clique não troca de painel e nem o atalho directo (`abrirAbaDaAudicao`,
   * que é o que a folha do telemóvel e o teclado chamam) passa. Depois de gravado UM elenco
   * concluído, as duas abrem; apagado o último, voltam a fechar — e se a aba aberta for a 2 ou a
   * 3, a página volta sozinha à 1, em vez de ficar a mostrar um recorte de um acervo que já não
   * tem elenco. Um RASCUNHO não conta: «gravado» é o que passou do passo 1 e tem recorte, que é
   * a mesma lista que a transferência oferece.
   */
  console.log('\nK. as abas 2 e 3 sem elenco gravado (15/11/2026)');
  {
    const tituloDas = (n) => aba(n) && aba(n).getAttribute('title');
    /* O CONTROLE NEGATIVO NÃO PODE QUEBRAR A PROVA: com o código de antes da correção a função
     * não existe, e um `TypeError` pararia tudo em vez de mostrar o que falta. Sem ela, o estado
     * das abas fica o do servidor — que é exactamente o defeito que se quer medir. */
    const pintarAbas = () => { if (typeof win.pintarAbasDaAudicao === 'function') win.pintarAbasDaAudicao(); };
    const itemDa = (n) => doc.querySelector('#lb-abas-menu [data-aba="' + n + '"]');
    const irParaAbaUm = () => { aba(1).click(); };

    irParaAbaUm();
    linhasNaRota.length = 0;
    win.ELENCOS_GRAVADOS = 0;
    pintarAbas();
    provar('sem elenco nenhum, a aba 2 está DESLIGADA', aba(2).disabled === true);
    provar('…e a aba 3 também', aba(3).disabled === true);
    provar('…e a aba 1 continua a abrir', aba(1).disabled === false);
    provar('…o `title` diz por quê (uma aba apagada e muda manda procurar defeito)',
      /elenco gravado/i.test(String(tituloDas(2))), tituloDas(2));
    provar('…e a folha do telemóvel diz o mesmo (o `disabled` dela também)',
      Boolean(itemDa(2)) && itemDa(2).disabled === true && /elenco gravado/i.test(String(itemDa(2).getAttribute('title'))),
      itemDa(2) && itemDa(2).outerHTML.slice(0, 120));

    aba(2).click();
    provar('clicar na aba 2 não troca de painel', painel(2).hidden === true && painel(1).hidden === false);
    win.abrirAbaDaAudicao('3');
    provar('…e o atalho directo `abrirAbaDaAudicao("3")` também não passa',
      painel(3).hidden === true && painel(1).hidden === false);

    /* UM ELENCO CONCLUÍDO — é o que a lista do servidor devolve e o que o cliente relê. */
    linhasNaRota.push({ id: 'elenco-k', nome: 'Elenco K', professor: 'curador',
      alunas: ['Aluna Um'], campos: [{ id: 'x', nome: 'X' }] });
    await win.carregarLinhas();
    await new Promise((r) => win.setTimeout(r, 120));
    provar('gravado um elenco, as duas abas ACENDEM',
      aba(2).disabled === false && aba(3).disabled === false, { g: win.ELENCOS_GRAVADOS });
    provar('…e o `title` sai com a razão (não fica a explicar uma espera que acabou)', !tituloDas(2));
    aba(2).click();
    provar('…e a aba 2 abre mesmo', painel(2).hidden === false && painel(1).hidden === true);

    /* APAGAR O ÚLTIMO COM A ABA 2 À VISTA — o caso em que a tela mostraria o recorte de nada. */
    linhasNaRota.length = 0;
    await win.carregarLinhas();
    await new Promise((r) => win.setTimeout(r, 120));
    provar('apagado o último elenco, a página volta à aba 1',
      painel(1).hidden === false && painel(2).hidden === true);
    provar('…e as duas voltam a estar desligadas',
      aba(2).disabled === true && aba(3).disabled === true);

    /* UM RASCUNHO NÃO É UM ELENCO GRAVADO. */
    linhasNaRota.push({ id: 'rascunho-k', nome: 'Rascunho', professor: 'curador', alunas: [], campos: [] });
    await win.carregarLinhas();
    await new Promise((r) => win.setTimeout(r, 120));
    provar('um RASCUNHO (sem recorte) não conta como elenco gravado',
      aba(2).disabled === true && aba(3).disabled === true, { g: win.ELENCOS_GRAVADOS });

    linhasNaRota.length = 0;
    await win.carregarLinhas();
    await new Promise((r) => win.setTimeout(r, 120));
    irParaAbaUm();
  }

  /* O FECHO DEPOIS DA ÚLTIMA RESPOSTA. A conclusão disparou leituras assíncronas
   * (`carregarLinhas`), e fechar a janela antes de elas voltarem faz o jsdom chamar
   * `getElementById` num documento morto — uma exceção assíncrona que mata a prova depois de
   * todas as asserções terem passado. Espera-se que a fila esvazie, e fecha-se no fim. */
  await new Promise((r) => win.setTimeout(r, 150));

  dom.window.close();

  console.log('');
  if (puladas.length) {
    console.log('NÃO MEDIDAS (' + puladas.length + '): ' + puladas.join(' · '));
  }
  if (falhas.length) {
    console.log('FALHARAM ' + falhas.length + ' de ' + (ok + falhas.length) + ' provas:');
    falhas.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log(ok + ' prova(s) passaram, 0 falharam');
}

principal().catch((erro) => { console.error('erro na prova:', erro); process.exit(1); });
