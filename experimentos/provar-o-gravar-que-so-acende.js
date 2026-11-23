#!/usr/bin/env node
'use strict';

/**
 * provar-o-gravar-que-so-acende.js — o «Gravar» só acende quando algo mudou (23/11/2026).
 *
 * PALAVRAS DELA, e são a regra inteira:
 *
 *   «Quando eu abro a aba habilitações, ela já carrega as habilitações iniciais do professor. Ela já
 *    tem um estado próprio quando carrega e o botão gravar fica habilitado. Vamos fazer o seguinte,
 *    quando carregar as habilitações com esse estado inicial, para evitar custo, só vai habilitar o
 *    botão gravar quando mudar alguma coisa. […] se eu marcar as mesmas de novo, aí o gravar fica
 *    desabilitado de novo.»
 *
 * O CUSTO NÃO É O CLIQUE, é a GRAVAÇÃO: cada «Gravar» escreve `professores/<slug>/perfil.json` no
 * repositório. Um botão aceso sobre um estado que já está gravado é um convite a escrever o que já
 * lá está — e a mover a cadeia por nada.
 *
 * O QUE ESTA PROVA MEDE, e cada secção é uma forma de o botão errar:
 *
 *   §A o botão NASCE apagado, e fica apagado quando a leitura chega com o estado do professor.
 *   §B ele acende com uma diferença — e apaga quando a diferença desaparece (voltar ao mesmo).
 *   §C as duas caixas que se desmentem (uma tradição e «não ensina nenhuma») contam como mudança
 *      nos dois sentidos, e o regresso ao estado de origem volta a apagar o botão.
 *   §D CANCELAR devolve o estado e apaga o botão.
 *   §E GRAVAR: o que se grava passa a ser a base, e o botão apaga-se — sem esperar pela releitura.
 *   §F trocar de professor apaga o botão enquanto lê, e a leitura que FALHA deixa-o apagado e diz
 *      porquê: gravar por cima de um estado que não se leu apagaria o que lá está.
 *   §G o que sai no pedido é o mesmo mapa que a comparação usa — uma conta, não duas.
 *
 * O CONTROL NEGATIVO (`--contra=<sha>`) carrega o `motor/` de antes: lá o botão nasce aceso e nunca
 * se apaga, portanto §A, §B, §D e §F reprovam. Uma prova que só medisse o caminho feliz não
 * distinguiria a regra de um acidente.
 *
 * SEM REDE: as respostas de `/api/bastidores/perfil` são um `fetch` de bolso.
 *
 *   node experimentos/provar-o-gravar-que-so-acende.js
 *   node experimentos/provar-o-gravar-que-so-acende.js --contra=305171e6
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const CONTRA = (process.argv.find((x) => x.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let RAIZ_DO_CODIGO = RAIZ;
if (CONTRA) {
  RAIZ_DO_CODIGO = fs.mkdtempSync(path.join(os.tmpdir(), 'gravar-'));
  /* `porta/` VAI JUNTO: `motor/servidor/corpo-seed.js` lê os JSON de conteúdo dela, e um motor sem
   * eles não carrega — o controle morreria a carregar, e um controle que não corre não prova nada. */
  execSync('git archive ' + CONTRA + ' motor porta biblioteca modelo tools teste | tar -x -C ' + RAIZ_DO_CODIGO,
    { cwd: RAIZ, stdio: 'pipe' });
  console.log('CONTROLE NEGATIVO — o motor de ' + CONTRA + ', antes desta mudança\n');
}

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 300)));
}

const USOS_VAZIOS = () => ({ professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 });

/** A página da Produção, como o servidor a desenha — com o principal e um professor cadastrado. */
function pagina() {
  const bastidores = require(path.join(RAIZ_DO_CODIGO, 'motor/servidor/bastidores.js'));
  return bastidores.paginaProducao('breu', {}, [
    { nome: 'Brise Volet', slug: 'brise-volet', sal: 's1', hash: 'h1' },
    { nome: 'Ana Diag', slug: 'ana-diag', sal: 's2', hash: 'h2' },
  ], ['abreu'], 'Brise Volet', 'brise-volet', [], [], {}, [], [], [], USOS_VAZIOS(),
  null, null, [], new Set());
}

/**
 * O PERFIL DE CADA PROFESSOR, como o servidor o devolve. O principal declara **ballet clássico** e
 * **não ensina nenhuma tradição** — que é exactamente o estado que ela descreveu.
 */
const PERFIS = {
  'brise-volet': { existe: true, modalidades: ['bale-classico'], tradicoes: { 'bale-classico': [] } },
  'ana-diag': { existe: true, modalidades: [], tradicoes: {} },
};

/** Monta o DOM com um `fetch` de bolso. `falharLeitura` faz o GET do perfil responder mal. */
async function montar({ falharLeitura = false } = {}) {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const vc = new VirtualConsole();
  const erros = [];
  vc.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
  const gravacoes = [];
  let leituras = 0;

  const dom = new JSDOM(pagina(), {
    runScripts: 'dangerously', url: 'https://breu.padd.com.br/bastidores/estudio', virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      Object.defineProperty(w, 'localStorage', {
        configurable: true, value: { getItem: () => null, setItem() {}, removeItem() {} },
      });
      w.scrollTo = () => {};
      w.fetch = (url, opcoes) => {
        const caminho = String(url);
        if (caminho.indexOf('/api/bastidores/perfil') === -1) {
          return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({ ok: true }) });
        }
        if (opcoes && opcoes.method === 'POST') {
          const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
          gravacoes.push(corpo);
          /* O SERVIDOR GUARDA E PASSA A DEVOLVER O QUE RECEBEU — é o que permite medir que, depois
           * de gravar, a releitura confirma a base em vez de a desmentir. */
          PERFIS[corpo.professor] = {
            existe: true, modalidades: corpo.modalidades, tradicoes: corpo.tradicoes,
          };
          return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({
            ok: true, professor: corpo.professor, descontinuadas: [],
          }) });
        }
        leituras += 1;
        const alvo = decodeURIComponent(String(caminho).split('professor=')[1] || '');
        if (falharLeitura) {
          return Promise.reject(new Error('a rede caiu'));
        }
        const perfil = PERFIS[alvo] || { existe: false, modalidades: [], tradicoes: {} };
        return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({
          ok: true, professor: alvo, slug: alvo, nome: alvo, dono: alvo === 'brise-volet',
          existe: perfil.existe, perfil: null,
          modalidades: perfil.modalidades, tradicoes: perfil.tradicoes,
          descontinuadas: [], catalogo: [],
        }) });
      };
    },
  });
  await new Promise((r) => setTimeout(r, 400));
  const d = dom.window.document;
  return {
    dom, d, erros, gravacoes,
    get leituras() { return leituras; },
    botao: () => d.getElementById('hab-enviar'),
    ligado: () => d.getElementById('hab-enviar').disabled === false,
    nota: () => String((d.getElementById('hab-nota') || {}).textContent || ''),
    caixa: (v) => d.querySelector('#hab-modalidades input[value="' + v + '"]'),
    tradicao: (mod, valor) => d.querySelector('#hab-trad-' + mod + ' input[name=hab-tradicao][value="' + valor + '"]'),
    semTradicao: (mod) => d.querySelector('#hab-trad-' + mod + ' input[name=hab-sem-tradicao]'),
    trocarProfessor: (slug) => {
      const sel = d.getElementById('hab-professor');
      sel.value = slug;
      sel.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    },
    espera: (ms) => new Promise((r) => setTimeout(r, ms)),
  };
}

/* ============================================================================================ */

(async () => {
  console.log('\nA. O botão nasce apagado, e fica apagado com o estado do professor à vista');
  {
    const t = await montar();
    provar('na marcação, o «Gravar» já vem `disabled` — sem JavaScript não há Gravar a fingir',
      /<button type="submit" class="acao grande" id="hab-enviar" disabled/.test(pagina()), null);
    provar('com a leitura respondida, o botão continua APAGADO', t.ligado() === false,
      { disabled: t.botao().disabled });
    provar('…e o `title` diz porquê: nada mudou',
      /Nada mudou desde que as habilitações abriram/.test(t.botao().title || ''), t.botao().title);
    provar('…e o estado do professor está à vista — ballet clássico marcado',
      Boolean(t.caixa('bale-classico') && t.caixa('bale-classico').checked), null);
    provar('…e «não ensina nenhuma tradição em ballet clássico» também',
      Boolean(t.semTradicao('bale-classico') && t.semTradicao('bale-classico').checked), null);
    /* A leitura NÃO se conta em unidades: o mesmo endpoint serve o campo «habilidade» do cadastro e
     * o perfil, e a página pode perguntar-lhe mais do que uma vez no arranque. O que a prova precisa
     * de saber é que a base veio do SERVIDOR — e é isso que as duas asserções acima medem. */
    provar('…e a leitura foi feita (é ela que fixa a base)', t.leituras >= 1, t.leituras);
    provar('os scripts da página não lançam', t.erros.length === 0, t.erros.slice(0, 1));
    t.dom.window.close();
  }

  console.log('\nB. Acende com uma diferença, e apaga quando a diferença desaparece');
  {
    const t = await montar();
    t.caixa('jazz').click();
    await t.espera(40);
    provar('marcar OUTRA modalidade acende o botão', t.ligado() === true, null);
    provar('…e o `title` de «nada mudou» sai', !/Nada mudou/.test(t.botao().title || ''), t.botao().title);

    t.caixa('jazz').click();
    await t.espera(40);
    provar('desmarcá-la apaga o botão outra vez — o estado voltou ao de origem',
      t.ligado() === false, null);
    provar('…e volta o `title` de «nada mudou»',
      /Nada mudou desde que as habilitações abriram/.test(t.botao().title || ''), t.botao().title);

    /* «se eu ficar passeando por aqui e decidir que é a mesma coisa» — duas voltas completas, para
     * não medir só a primeira. */
    t.caixa('contemporaneo').click();
    t.caixa('jazz').click();
    await t.espera(40);
    provar('duas modalidades diferentes: aceso', t.ligado() === true, null);
    t.caixa('jazz').click();
    t.caixa('contemporaneo').click();
    await t.espera(40);
    provar('…e ao voltar ao estado de origem, apagado outra vez', t.ligado() === false, null);
    t.dom.window.close();
  }

  console.log('\nC. As duas caixas que se desmentem contam como mudança nos dois sentidos');
  {
    const t = await montar();
    /* Tirar «não ensina nenhuma» sem pôr tradição nenhuma É uma diferença: o perfil passa a ter a
     * modalidade com o campo por declarar. O ecrã tem de o saber. */
    t.semTradicao('bale-classico').click();
    await t.espera(40);
    provar('desmarcar «não ensina nenhuma» acende o botão', t.ligado() === true, null);

    const caixas = [...t.d.querySelectorAll('#hab-trad-bale-classico input[name=hab-tradicao]')];
    provar('há tradições para escolher no ballet clássico (senão não se media nada)',
      caixas.length > 0, caixas.length);
    if (caixas.length) {
      caixas[0].click();
      await t.espera(40);
      provar('marcar uma tradição mantém o botão aceso', t.ligado() === true, null);
      /* Voltar a «não ensina nenhuma» desmarca a tradição — e devolve o estado de origem. */
      t.semTradicao('bale-classico').click();
      await t.espera(40);
      provar('…e voltar a «não ensina nenhuma» apaga-a (as duas não podem ser verdade)',
        caixas[0].checked === false, null);
      provar('…e o botão apaga-se, porque o estado voltou ao de origem', t.ligado() === false, null);
    }
    t.dom.window.close();
  }

  console.log('\nD. Cancelar devolve o estado e apaga o botão');
  {
    const t = await montar();
    t.caixa('jazz').click();
    await t.espera(40);
    provar('antes de cancelar, o botão está aceso', t.ligado() === true, null);

    t.d.getElementById('hab-cancelar').click();
    await t.espera(120);
    provar('cancelar apaga o botão', t.ligado() === false, null);
    provar('…e as caixas voltam ao que o professor declara',
      t.caixa('jazz').checked === false && t.caixa('bale-classico').checked === true, null);
    provar('…e nada foi gravado', t.gravacoes.length === 0, t.gravacoes.length);
    t.dom.window.close();
  }

  console.log('\nE. Gravar: o que se gravou passa a ser a base, e o botão apaga-se');
  {
    const t = await montar();
    t.caixa('jazz').click();
    await t.espera(40);
    t.d.getElementById('form-habilitacao')
      .dispatchEvent(new t.dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await t.espera(400);

    provar('o pedido saiu — uma vez, com as duas modalidades',
      t.gravacoes.length === 1
      && JSON.stringify((t.gravacoes[0] || {}).modalidades || []) === JSON.stringify(['bale-classico', 'jazz']),
      t.gravacoes[0]);
    provar('depois de gravar, o botão está APAGADO — o que está à vista é o que está gravado',
      t.ligado() === false, { disabled: t.botao().disabled });
    provar('…e a releitura confirmou a base (as caixas continuam como estavam)',
      t.caixa('jazz').checked === true && t.caixa('bale-classico').checked === true, null);
    provar('…e mexer outra vez acende-o de novo', (t.caixa('jazz').click(), t.ligado() === true), null);
    t.dom.window.close();
  }

  console.log('\nF. Trocar de professor, e a leitura que falha');
  {
    const t = await montar();
    t.trocarProfessor('ana-diag');
    /* O `change` do select dispara a leitura; a base é posta a `null` ANTES do pedido. O instante é
     * o que se mede: enquanto não se sabe o estado do outro, não se grava. */
    provar('ao trocar de professor, o botão apaga-se de imediato — o estado do outro ainda não veio',
      t.ligado() === false, null);
    await t.espera(120);
    provar('…e depois da leitura fica apagado, porque o estado de origem é o dela',
      t.ligado() === false && t.caixa('bale-classico').checked === false, null);

    const f = await montar({ falharLeitura: true });
    provar('a leitura que FALHA deixa o botão apagado', f.ligado() === false, null);
    provar('…e a nota diz porquê — gravar por cima apagaria o que lá está',
      /Não foi possível ler o que este professor declara agora/.test(f.nota())
      && /apagaria o que lá está/.test(f.nota()), f.nota());
    provar('…e o `title` do botão diz o mesmo',
      /ainda não foi lido/.test(f.botao().title || ''), f.botao().title);
    f.dom.window.close();
    t.dom.window.close();
  }

  console.log('\nH. O perfil que ainda não foi perguntado — o caso mais comum dos reais');
  {
    /* MEDIDO NO REPOSITÓRIO: dos quinze perfis em `professores/<slug>/perfil.json`, **treze** têm
     * `modalidades:['bale-classico']` e **nenhum mapa de tradições**. Nesse estado a caixa do
     * generalista aparece DESMARCADA, e o ecrã diz «ainda não foi perguntado».
     *
     * É o caso que a primeira versão desta regra errava: com a base calculada do que ficou pintado,
     * marcar «não ensina nenhuma» dava o mesmo retrato de não a marcar, e o botão ficava apagado
     * sobre uma declaração que a pessoa estava a fazer. Por isso a base vem do SERVIDOR, com o
     * `~` a separar a chave vazia da chave ausente. */
    PERFIS['brise-volet'] = { existe: true, modalidades: ['bale-classico'], tradicoes: null };
    const t = await montar();
    provar('com o mapa de tradições ausente, o botão está apagado à chegada',
      t.ligado() === false, null);
    provar('…e a caixa do generalista aparece DESMARCADA (é «ainda não foi perguntado»)',
      Boolean(t.semTradicao('bale-classico')) && t.semTradicao('bale-classico').checked === false, null);

    t.semTradicao('bale-classico').click();
    await t.espera(40);
    provar('…e marcá-la ACENDE o botão — é uma declaração, não um ecrã parado',
      t.ligado() === true, null);

    t.d.getElementById('form-habilitacao')
      .dispatchEvent(new t.dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await t.espera(400);
    const enviado = t.gravacoes[0] || {};
    provar('…e o pedido leva a chave VAZIA, que é «não ensina nenhuma»',
      enviado.tradicoes && Object.prototype.hasOwnProperty.call(enviado.tradicoes, 'bale-classico')
      && Array.isArray(enviado.tradicoes['bale-classico'])
      && enviado.tradicoes['bale-classico'].length === 0, enviado.tradicoes);
    provar('…e depois de gravar o botão apaga-se, com a chave agora declarada',
      t.ligado() === false, null);

    /* E O CONTRÁRIO: desmarcar o generalista de um perfil que o tinha declarado devolve o
     * «não perguntado» — e é por isso que ele acende. */
    t.semTradicao('bale-classico').click();
    await t.espera(40);
    provar('desmarcá-la volta a acender o botão', t.ligado() === true, null);
    t.d.getElementById('form-habilitacao')
      .dispatchEvent(new t.dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await t.espera(400);
    const segundo = t.gravacoes[1] || {};
    provar('…e o pedido deixa de levar a chave — «ainda não foi perguntado»',
      segundo.tradicoes && !Object.prototype.hasOwnProperty.call(segundo.tradicoes, 'bale-classico'),
      segundo.tradicoes);
    provar('…e o botão apaga-se outra vez', t.ligado() === false, null);
    PERFIS['brise-volet'] = { existe: true, modalidades: ['bale-classico'], tradicoes: { 'bale-classico': [] } };
    t.dom.window.close();
  }

  console.log('\nG. Uma conta só: o que sai no pedido é o que a comparação leu');
  {
    const t = await montar();
    if (t.tradicao('bale-classico', 'RAD')) {
      t.semTradicao('bale-classico').click();
      t.tradicao('bale-classico', 'RAD').click();
      await t.espera(40);
      t.d.getElementById('form-habilitacao')
        .dispatchEvent(new t.dom.window.Event('submit', { bubbles: true, cancelable: true }));
      await t.espera(400);
      const enviado = t.gravacoes[0] || {};
      provar('o mapa das tradições vai no pedido com a tradição escolhida',
        enviado.tradicoes && JSON.stringify(enviado.tradicoes['bale-classico']) === JSON.stringify(['RAD']),
        enviado.tradicoes);
      provar('…e o botão apaga-se, porque a base passou a incluir a tradição', t.ligado() === false, null);
      provar('…e desmarcá-la volta a acendê-lo', (t.tradicao('bale-classico', 'RAD').click(), t.ligado() === true), null);
    } else {
      provar('há uma tradição chamada RAD no ballet clássico para esta prova', false, null);
    }
    t.dom.window.close();
  }

  console.log('');
  if (CONTRA) {
    console.log('CONTROLE NEGATIVO: ' + total + ' asserções, ' + falhas + ' falharam — o código de '
      + CONTRA + ' tem de reprovar.');
    console.log(falhas > 0 ? 'CONTROLE CERTO — o código de antes reprova.' : 'A PROVA NÃO PROVA NADA.');
    process.exit(falhas > 0 ? 0 : 1);
  }
  console.log(falhas === 0
    ? 'TUDO CERTO — ' + total + ' asserções: o «Gravar» nasce apagado, só acende com uma diferença '
      + 'verdadeira, apaga-se quando ela desaparece, e não se acende sobre um estado que não se leu.'
    : 'FALHOU — ' + (total - falhas) + '/' + total + ' asserção(ões).');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
