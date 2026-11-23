#!/usr/bin/env node
'use strict';

/**
 * provar-a-raiz-sem-dobra-e-o-vazio-do-apagar.js — duas coisas que ela viu ao vivo (22/11/2026).
 *
 * 1. «Você também colocou o botão de colapsar e expandir no sistema lastro no endereço
 *     danca.padd.com.br, nesse não. Nesse endereço não é para ter o botão de colapsar e expandir,
 *     não. […] Ele é uma campanha de marketing, não é como uma ferramenta, não. É a parte de venda.
 *     Isso também é a mesma coisa no endereço lastro.padd.com.br.»
 *
 * 2. «Agora o botão apagar escola, ele não carrega a escola para eu poder apagar. Ele diz assim,
 *     carregando a lista de escolas e depois ele diz, não há escola para apagar. E não está certo,
 *     porque a escola Abreu ainda não foi expurgada.»
 *
 * AS DUAS TÊM A MESMA CAUSA DE FUNDO: uma regra certa com uma frase errada por cima. A dobra nasce
 * em qualquer documento de leitura, e a campanha é o único que não é. A lista do apagar filtra pelo
 * veredicto do servidor — certo, e é ela quem o decidiu a 16/11 —, mas o VAZIO dizia «não há
 * escola» quando havia uma.
 *
 * O QUE SE MEDE, e como:
 *
 *   A. A CAMPANHA (DOM, com a página de verdade e o `nav.js` de verdade): depois do script correr,
 *      NENHUM `.secao-dobra` existe na raiz, e nenhum `.secao-corpo` foi criado — as secções do
 *      documento ficaram exactamente como o pandoc as escreveu. É o mesmo `<nav.js>` das outras
 *      páginas, portanto o que se mede é a GUARDA, e não a ausência da peça.
 *   B. O CONTROLE DA DOBRA: a mesma guarda, na página de um documento do pacote, continua a criar
 *      os botões — senão «não tem dobra» seria verdade por a página não correr o script.
 *   C. O VAZIO DO APAGAR: a função é exercitada no DOM com uma resposta de `/api/escolas` de
 *      fixture, e são quatro casos:
 *        · nenhuma escola            → «Não há escola nenhuma neste sistema.»
 *        · uma, travada              → nomeia-a, diz o motivo que o SERVIDOR mandou, e leva a
 *                                      `/escolas-vivas` (o passo seguinte);
 *        · muitas, travadas          → conta-as e corta em 8, dizendo «…e mais N»;
 *        · uma, expurgável           → o cartão aparece, e NENHUM motivo é impresso (a regra de
 *                                      16/11: dentro da lista com cartões, não se explica).
 *
 * CONTROLE NEGATIVO: `--contra=02f53906` serve a raiz DAQUELE commit — a de antes destas duas
 * correcções — e mede o mesmo. Lá a campanha tem 11 botões de dobra, e o vazio diz «Não há escola
 * para apagar.» sobre uma escola que existe.
 *
 *   node experimentos/provar-a-raiz-sem-dobra-e-o-vazio-do-apagar.js
 *   node experimentos/provar-a-raiz-sem-dobra-e-o-vazio-do-apagar.js --contra=02f53906
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const CONTRA = (process.argv.find((x) => x.indexOf('--contra=') === 0) || '').split('=')[1] || '';

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 320)));
}

let TEMPORARIO = null;
process.on('exit', () => { try { if (TEMPORARIO) fs.rmSync(TEMPORARIO, { recursive: true, force: true }); } catch (e) {} });

/**
 * A PÁGINA DA RAIZ NUM DOM, com o `nav.js` a correr a sério.
 *
 * O `fetch` da raiz é substituído por um de bolso que responde a `/api/escolas` com a fixture
 * pedida — é a única forma de exercitar o vazio do apagar sem depender do KV de produção. O resto
 * (`/api/*`) responde vazio: esta prova mede a dobra e o vazio, não o painel inteiro.
 */
async function abrirRaiz(html, navJs, respostaDaLista) {
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });

  const dom = new JSDOM(html, {
    url: 'https://danca.padd.com.br/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({
        matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {},
      });
      w.alert = () => {};
      w.confirm = () => true;
      w.scrollTo = () => {};
      if (w.Element && w.Element.prototype && w.Element.prototype.scrollIntoView !== undefined) {
        w.Element.prototype.scrollIntoView = () => {};
      }
      w.fetch = async (u) => {
        const url = String(u);
        const json = (o) => Promise.resolve({
          ok: true, status: 200,
          json: async () => o,
          text: async () => JSON.stringify(o),
        });
        if (url.indexOf('api/escolas') !== -1) return json(respostaDaLista);
        if (url.indexOf('api/') !== -1) return json({ ok: true });
        return json({});
      };
    },
  });
  const w = dom.window;
  const d = w.document;
  await new Promise((r) => w.setTimeout(r, 120));
  /* O `nav.js` ENTRA DEPOIS DO DOCUMENTO EXISTIR, e não pelo `beforeParse`: ali ainda não há
   * `<head>` para lhe dar pai, e o jsdom não vai à rede buscar um `<script src>` (não é um
   * `fetch`). Inserido com `textContent` e `runScripts: 'dangerously'`, corre como qualquer
   * script inline — e é o mesmo texto que a produção serve. */
  const s = d.createElement('script');
  s.textContent = navJs;
  d.head.appendChild(s);
  await new Promise((r) => w.setTimeout(r, 200));
  return { dom, w, d, problemas };
}

/** As quatro respostas de `/api/escolas` que os casos precisam. */
const LISTA = (escolas) => ({ ok: true, escolas, fuso: { id: 'America/Sao_Paulo' } });
const TRAVADA = (slug, motivo) => ({
  slug, expurgavel: false, estadoComercial: 'ativa', motivoDoExpurgo: motivo,
  url: 'https://' + slug + '.padd.com.br/',
});

(async () => {
  let raizHtml = fs.readFileSync(path.join(RAIZ, 'raiz/index.html'), 'utf8');
  let navJs = fs.readFileSync(path.join(RAIZ, 'raiz/assets/nav.js'), 'utf8');
  let pacoteHtml = fs.readFileSync(
    path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa/plano.html'), 'utf8');
  let pacoteNav = fs.readFileSync(
    path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa/assets/nav.js'), 'utf8');

  if (CONTRA) {
    TEMPORARIO = fs.mkdtempSync(path.join(os.tmpdir(), 'raiz-'));
    execSync('git archive ' + CONTRA + ' raiz | tar -x -C ' + TEMPORARIO, { cwd: RAIZ, stdio: 'pipe' });
    execSync('git archive ' + CONTRA + ' professores/demi-plie/ciclos/ciclo-01-breu-rosa | tar -x -C '
      + TEMPORARIO, { cwd: RAIZ, stdio: 'pipe' });
    raizHtml = fs.readFileSync(path.join(TEMPORARIO, 'raiz/index.html'), 'utf8');
    navJs = fs.readFileSync(path.join(TEMPORARIO, 'raiz/assets/nav.js'), 'utf8');
    pacoteHtml = fs.readFileSync(
      path.join(TEMPORARIO, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa/plano.html'), 'utf8');
    pacoteNav = fs.readFileSync(
      path.join(TEMPORARIO, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa/assets/nav.js'), 'utf8');
  }

  /* ═══════════ A · A CAMPANHA NÃO TEM A DOBRA ═══════════ */

  console.log('\nA · A CAMPANHA — a raiz não tem o botão de colapsar e expandir');
  {
    const { w, d, dom } = await abrirRaiz(raizHtml, navJs, LISTA([]));
    const r = {
      tela: d.body.getAttribute('data-tela'),
      botoes: d.querySelectorAll('.secao-dobra').length,
      corpos: d.querySelectorAll('.secao-corpo').length,
      titulos: d.querySelectorAll('.conteudo > h2[id]').length,
    };
    /* A PÁGINA TEM DEZ TÍTULOS DE SECÇÃO — sem eles, «zero botões» seria verdade por não haver
     * onde os pôr, e a asserção não mediria nada. É o controle que dá sentido ao zero. */
    provar('a raiz declara-se como `raiz` (a tela que não é documento de leitura)',
      r.tela === 'raiz', r.tela);
    provar('…e tem títulos de secção onde a dobra os poria', r.titulos >= 8, r.titulos);
    provar('…e NENHUM botão de colapsar e expandir foi criado', r.botoes === 0, r.botoes);
    provar('…nem nenhum corpo de secção (o texto ficou onde o pandoc o escreveu)', r.corpos === 0, r.corpos);
    provar('nenhum erro de script na página da campanha', (dom.window.__erros || []).length === 0,
      dom.window.__erros);
    w.close();
  }

  /* ═══════════ B · O CONTROLE — a mesma guarda deixa o documento ter dobra ═══════════ */

  console.log('\nB · O CONTROLE — num documento do pacote, a mesma guarda cria os botões');
  {
    const { w, d } = await abrirRaiz(pacoteHtml, pacoteNav, LISTA([]));
    const botoes = d.querySelectorAll('.secao-dobra').length;
    provar('o documento do plano continua a ganhar os seus botões de dobra', botoes >= 8, botoes);
    w.close();
  }

  /* ═══════════ C · O VAZIO DO APAGAR ═══════════ */

  console.log('\nC · O APAGAR — o vazio diz a verdade, e diz o passo seguinte');
  const abrirApagar = async (escolas) => {
    const { w, d } = await abrirRaiz(raizHtml, navJs, LISTA(escolas));
    const btn = d.getElementById('btn-apagar');
    if (btn) btn.click();
    await new Promise((r) => w.setTimeout(r, 260));
    const lista = d.getElementById('apagar-lista');
    const texto = lista ? String(lista.textContent || '').replace(/\s+/g, ' ').trim() : '';
    const lig = lista ? lista.querySelector('a[href="/escolas-vivas"]') : null;
    /* O CARTÃO DE UMA ESCOLA É `button.cartao` — o mesmo `<button>` que ela escolhe antes de
       * escrever a confirmação. Procurar um atributo inventado dava zero em todos os casos, e a
       * asserção do caso positivo passaria a medir a minha suposição em vez do produto. */
    const cartoes = lista ? lista.querySelectorAll('button.cartao').length : 0;
    return { w, d, texto, temLigacao: !!lig, cartoes, lista };
  };

  {
    const semNada = await abrirApagar([]);
    provar('sem escola nenhuma, a frase é a verdadeira («não há escola nenhuma»)',
      /Não há escola nenhuma neste sistema/.test(semNada.texto), semNada.texto.slice(0, 160));
    provar('…e não se oferece caminho para lado nenhum', semNada.temLigacao === false, semNada.temLigacao);
    semNada.w.close();
  }

  {
    const MOTIVO = 'A escola está habilitada: apagá-la seria apagar o que está a ser usado.';
    const uma = await abrirApagar([TRAVADA('breu', MOTIVO)]);
    provar('com uma escola que não pode ser apagada, NOMEIA-SE a escola',
      /\bbreu\b/.test(uma.texto), uma.texto.slice(0, 200));
    provar('…e diz-se o motivo que o SERVIDOR mandou (não um inventado pela página)',
      uma.texto.indexOf(MOTIVO) !== -1, uma.texto.slice(0, 240));
    provar('…e NÃO se diz «não há escola para apagar» — a frase falsa',
      !/Não há escola para apagar/i.test(uma.texto), uma.texto.slice(0, 200));
    provar('…e o passo seguinte está lá: uma ligação para as escolas vivas',
      uma.temLigacao === true, uma.texto.slice(-120));
    uma.w.close();
  }

  {
    const muitas = [];
    for (let i = 1; i <= 12; i += 1) muitas.push(TRAVADA('escola-' + i, 'A escola está habilitada.'));
    const r = await abrirApagar(muitas);
    provar('com muitas travadas, o número é dito («Há 12 escolas»)',
      /Há 12 escolas/.test(r.texto), r.texto.slice(0, 90));
    provar('…e a lista corta em 8, dizendo quanto ficou de fora',
      /escola-8/.test(r.texto) && !/escola-9\b/.test(r.texto) && /e mais 4/.test(r.texto),
      r.texto.slice(-140));
    r.w.close();
  }

  {
    const pode = Object.assign(TRAVADA('duo', 'irrelevante'), { expurgavel: true });
    const r = await abrirApagar([pode]);
    provar('quando ALGUMA pode ser apagada, o cartão dela aparece',
      r.cartoes >= 1, { cartoes: r.cartoes });
    provar('…e NENHUM motivo se imprime na lista (a regra de 16/11 continua)',
      !/irrelevante/.test(r.texto) && !/A escola está habilitada/.test(r.texto),
      r.texto.slice(0, 160));
    r.w.close();
  }

  if (CONTRA) {
    console.log('\n' + (falhas ? 'CONTROLE CONFORME — ' : 'CONTROLE SUSPEITO — ') + falhas + ' de '
      + total + ' asserções falham com a raiz de ' + CONTRA + '.');
    process.exit(falhas ? 0 : 1);
  }

  console.log('');
  if (falhas) { console.log('FALHARAM ' + falhas + ' de ' + total + ' asserções.'); process.exit(1); }
  console.log('TUDO CERTO — ' + total + ' asserções: a campanha (`raiz`, que serve '
    + 'danca.padd.com.br e lastro.padd.com.br) não ganha um único botão de colapsar — e o mesmo '
    + '`nav.js` continua a dar-lhos a um documento do pacote; e o vazio do «Apagar escola» deixou '
    + 'de dizer «não há escola» sobre uma escola que existe: nomeia-a, repete o motivo que o '
    + 'servidor mandou, e oferece o passo seguinte.');
})();
