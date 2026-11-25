#!/usr/bin/env node
'use strict';

/*
 * provar-o-copiar.js — o botão «Copiar» copia, e é o mesmo nas três páginas.
 *
 * O DEFEITO QUE ISTO MEDE (25/11/2026), na letra dela: «Quando eu clico no botão copiar, que ele é
 * copiar o pix desse mês, ele não copia nada, não funciona. Se eu selecionar o texto todo e aí
 * clicar em copiar também não funciona. […] O botão de copiar que copia a chave pix funciona e
 * inclusive ele tem uma mensagem depois que clica em copiar que é copiado e isso é bom.»
 *
 * ELE ESTAVA A DESCREVER UMA ASSIMETRIA EXACTA, e a causa não era a cópia: era o OUVINTE. A rotina
 * do `[data-copiar]` vivia dentro do script da Produção, e só dele. As páginas do mês a mês e do
 * financeiro emitiam o botão — a marcação estava lá, o campo estava lá — e nenhuma delas tinha quem
 * escutasse o clique. Seleccionar o texto e carregar em «Copiar» também não fazia nada, porque o
 * clique continuava a não ter destino.
 *
 * A CORRECÇÃO É A DA CASA: uma implementação, num sítio. `motor/nucleo/copiar.js` emite o script,
 * e as três páginas servem-no.
 *
 * O QUE SE MEDE:
 *
 *   A. O MÓDULO — a rotina é texto de cliente, e tem de ser válida e completa;
 *   B. AS TRÊS PÁGINAS — cada uma serve a rotina, UMA vez, e é a do módulo;
 *   C. A CÓPIA, de facto — em jsdom, nas três páginas, com as quebras de linha do documento;
 *   D. A RESPOSTA — o botão diz «Copiado» e volta ao rótulo de origem;
 *   E. A RESERVA — sem `navigator.clipboard`, selecciona e usa o `execCommand`;
 *   F. os controlos negativos.
 *
 *   node experimentos/provar-o-copiar.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
const mensalidades = require(path.join(RAIZ, 'motor/nucleo/mensalidades.js'));
const { SCRIPT_DO_COPIAR } = require(path.join(RAIZ, 'motor/nucleo/copiar.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* O DOCUMENTO DELA, à letra: duas linhas, e as quebras fazem parte do que se cola no banco. */
const PAYLOAD = '00020126580014BR.GOV.BCB.PIX0136chave-do-nubank\n'
  + '5204000053039865802BR5920SISTEMA LASTRO6009PASSO FUNDO\n'
  + '62070503***6304ABCD';
const MES = '2026-11';
/* A DATA EM QUE ELA COLOU A COBRANÇA — e ela é parte do facto, não um detalhe do teste: `gravarNoMapa`
 * grava sempre o `em`, e é ele que distingue a cobrança emitida NO PRAZO da emitida JÁ NO ATRASO
 * (com a mora). Aqui o mês já venceu (a adesão é a 1.º), portanto a cobrança que serve é a que foi
 * emitida depois disso — é o caso de um mês atrasado cuja cobrança foi refeita com multa e juros. */
const EMITIDA_NO_ATRASO = '2026-11-20T12:00:00.000Z';

/* O MAPA DA COBRANÇA ENTRA NA CONTA DO EXTRATO (25/11/2026). O estado de cada cobrança passou a ser
 * decidido por `mensalidades.situacaoDaEscola` — o mesmo sítio que diz «atrasado» e calcula a mora —,
 * e a linha do mês traz `cobranca` com `serve` e o motivo. Um fixture que montasse a situação sem o
 * mapa mediria uma página com uma linha que o motor nunca produz: sem `cobranca`, a célula não tem
 * documento nenhum para copiar, e a prova passaria a medir o vazio. */
const MAPA = { [MES]: { texto: PAYLOAD, em: EMITIDA_NO_ATRASO } };

function situacaoComMesAberto() {
  return mensalidades.situacaoDaEscola({
    escola: 'breu',
    contrato: {
      plano: 'avancado', planoNome: 'Avançado', valorCentavos: 13990,
      criadoEm: '2026-11-01T12:00:00.000Z', estado: 'ativa',
    },
    livro: [], agora: new Date('2026-11-25T12:00:00.000Z'),
    cobrancas: MAPA,
  });
}

/** As três páginas que emitem um `[data-copiar]`, e o botão que interessa em cada uma. */
function asTresPaginas() {
  const s = situacaoComMesAberto();
  return {
    financeiro: {
      html: painel.paginaFinanceira({
        pix: {}, descontos: [], escolas: [],
        extrato: [Object.assign({}, s, {
          escola: 'breu', nome: 'Breu', frase: 'x', cobrancas: MAPA,
        })],
        catalogo: comercial.catalogoDaPagina(),
      }),
      alvo: 'cob-breu-2026-11',
      url: 'https://danca.padd.com.br/financeiro',
    },
    'mês a mês': {
      html: bastidores.paginaFinanceiro('breu', {}, {}, {
        situacao: s, cadastro: { escolaNome: 'Breu' }, pix: { chave: '0215' }, cobrancas: MAPA,
      }),
      alvo: 'mes-pix-2026-11',
      url: 'https://danca.padd.com.br/bastidores/estudio/financeiro',
    },
    'o «Pagar» da escola': {
      html: bastidores.paginaProducao('breu',
        { professor: 'demi-plie', ciclo: '01', query: '' }, [{ nome: 'Demi' }], [], 'Demi Plié',
        'demi-plie', [], [], [], [], [], [],
        { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
        { modo: 'clara', paleta: 'bordo' }, '', [], new Set(),
        { cadastro: { escolaNome: 'Breu' }, situacao: s, pix: { chave: '0215' }, cobrancas: MAPA },
        [], null, [], undefined, null),
      alvo: 'escola-cobranca-1',
      url: 'https://danca.padd.com.br/bastidores/estudio',
    },
  };
}

let jsdom = null;
try { jsdom = require('jsdom'); } catch (e) { jsdom = null; }

/** Abre a página em jsdom com o `navigator.clipboard` deitando mão ao texto. */
async function abrir(html, url, { comClipboard = true } = {}) {
  const dom = new jsdom.JSDOM(html, {
    runScripts: 'dangerously', url: url || 'https://danca.padd.com.br/',
    /* O `fetch` QUE A PRODUÇÃO CHAMA NO ARRANQUE. O jsdom não o tem, e a página grande lança
     * `fetch is not defined` a meio do próprio script — ruído que não mede nada daqui. Um stub que
     * recusa é a resposta certa: nenhuma destas medições depende de rede. */
    beforeParse(janela) {
      janela.fetch = () => Promise.reject(new Error('sem rede nesta prova'));
    },
  });
  const capturado = { copiado: null, seleccionou: 0 };
  if (comClipboard) {
    Object.defineProperty(dom.window.navigator, 'clipboard', {
      value: { writeText: (texto) => { capturado.copiado = texto; return Promise.resolve(); } },
      configurable: true,
    });
  } else {
    dom.window.document.execCommand = () => { capturado.seleccionou += 1; return true; };
  }
  return { dom, capturado };
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  /* ── A. O MÓDULO ─────────────────────────────────────────────────────────────────────── */
  console.log('\nA. O MÓDULO — a rotina é texto de cliente, e tem de ser válida');

  {
    provar('a rotina é uma string, como tem de ser para entrar num `<script>`',
      typeof SCRIPT_DO_COPIAR === 'string' && SCRIPT_DO_COPIAR.trim().length > 0);
    let parseia = true;
    try { new Function(SCRIPT_DO_COPIAR); } catch (e) { parseia = false; }
    provar('…e ela é JavaScript válido', parseia);
    /* AS TRÊS GUARDAS, cada uma por um motivo medido — ver o cabeçalho do módulo. */
    provar('a rotina tem a guarda contra dois registos do mesmo ouvinte',
      /if \(window\.__copiarLigado\) return;/.test(SCRIPT_DO_COPIAR));
    provar('…não rebenta quando o campo não existe', /if \(!campo\) return;/.test(SCRIPT_DO_COPIAR));
    provar('…e guarda o rótulo de origem UMA vez, e não a cada clique',
      /if \(!b\.getAttribute\("data-rotulo"\)\)/.test(SCRIPT_DO_COPIAR));
    /* O `setSelectionRange` é uma AFIRMAÇÃO ESTRUTURAL, e digo-o porque não a consigo medir: no
     * jsdom o `select()` de um `<textarea>` já põe a selecção inteira, e a asserção do clube passa
     * com ou sem ela (o controlo negativo provou-o). O que ela resolve é o Safari de telemóvel, que
     * sem esta chamada selecciona a primeira linha e copia meia cobrança. */
    provar('a reserva pede a selecção inteira (`setSelectionRange`) — o Safari precisa dele',
      /setSelectionRange\(0, String\(campo\.value\)\.length\)/.test(SCRIPT_DO_COPIAR));
  }

  const paginas = asTresPaginas();

  /* ── B. AS TRÊS PÁGINAS ──────────────────────────────────────────────────────────────── */
  console.log('\nB. AS TRÊS PÁGINAS — cada uma serve a rotina, e é a do módulo');

  {
    for (const [nome, p] of Object.entries(paginas)) {
      /* `__copiarLigado` aparece duas vezes por inclusão (o `if` e a atribuição). Duas cópias do
       * ouvinte na mesma página fazem o rótulo piscar sem nunca mostrar nada. */
      const blocos = (p.html.match(/__copiarLigado/g) || []).length / 2;
      provar('a página do ' + nome + ' serve a rotina', blocos === 1, { blocos });
      /* O `alvo` é o VALOR do atributo, e não o seletor: o que se procura no HTML é
       * `data-copiar="…"`, e um `[data-copiar="…"]` escrito aqui nunca casaria. (Foi assim que a
       * primeira versão desta prova reprovou três vezes sobre um acerto.) */
      provar('…e o botão que ela desenha está lá',
        p.html.indexOf('data-copiar="' + p.alvo + '"') !== -1, p.alvo);
      /* E É A DO MÓDULO, e não uma segunda escrita à mão: o texto servido tem de conter o do
       * `copiar.js`, byte a byte. */
      provar('…e é a do módulo, e não uma segunda escrita à mão',
        p.html.indexOf(SCRIPT_DO_COPIAR) !== -1);
    }
  }

  /* ── C. A CÓPIA, DE FACTO ────────────────────────────────────────────────────────────── */
  console.log('\nC. A CÓPIA — o clique copia o documento, nas três');

  if (!jsdom) {
    console.log('  NÃO FEITO — sem jsdom nesta máquina; a cópia não corre.');
  } else {
    for (const [nome, p] of Object.entries(paginas)) {
      const { dom, capturado } = await abrir(p.html, p.url);
      const botao = dom.window.document.querySelector('[data-copiar="' + p.alvo + '"]');
      if (!botao) { provar('o botão do ' + nome + ' existe', false); dom.window.close(); continue; }
      botao.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      await esperar(60);
      provar('no ' + nome + ', o clique COPIA o documento', capturado.copiado === PAYLOAD,
        { copiou: capturado.copiado && capturado.copiado.slice(0, 30) });
      /* AS QUEBRAS DE LINHA SÃO O CONTEÚDO. Uma cópia que as achatasse daria um Pix inválido — e
       * é o mesmo cuidado que o resto da cobrança tem. */
      provar('…com as quebras de linha intactas', capturado.copiado === PAYLOAD);
      provar('…e o botão passa a dizer «Copiado»', botao.textContent === 'Copiado',
        botao.textContent);
      dom.window.close();
    }
  }

  /* ── D. A RESPOSTA ───────────────────────────────────────────────────────────────────── */
  console.log('\nD. A RESPOSTA — «Copiado» e volta ao rótulo de origem');

  if (!jsdom) {
    console.log('  NÃO FEITO — sem jsdom nesta máquina.');
  } else {
    const minimo = '<!doctype html><html><body>'
      + '<textarea id="c" readonly>' + PAYLOAD + '</textarea>'
      + '<button type="button" data-copiar="c">Copiar</button>'
      + '</body></html>'.replace('</body>', '<script>' + SCRIPT_DO_COPIAR + '</script></body>');
    const { dom } = await abrir(minimo);
    const d = dom.window.document;
    const botao = d.querySelector('[data-copiar]');
    botao.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await esperar(60);
    provar('diz «Copiado» depois do clique', botao.textContent === 'Copiado', botao.textContent);
    /* DOIS CLIQUES RÁPIDOS NÃO ESTRAGAM O RÓTULO. A versão que vivia na Produção lia o
     * `textContent` a cada clique: ao segundo, o «antes» passava a ser «Copiado» e o botão ficava a
     * dizer isso para sempre. É este o controlo que prova a correcção. */
    botao.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await esperar(60);
    await esperar(1700);
    provar('…e dois cliques rápidos não o deixam preso em «Copiado»',
      botao.textContent === 'Copiar', botao.textContent);
    dom.window.close();
  }

  /* ── E. A RESERVA ────────────────────────────────────────────────────────────────────── */
  console.log('\nE. A RESERVA — sem `navigator.clipboard`');

  if (!jsdom) {
    console.log('  NÃO FEITO — sem jsdom nesta máquina.');
  } else {
    /* Contexto inseguro, permissão negada, navegador antigo: o `navigator.clipboard` pode não
     * existir. A reserva selecciona o campo e usa o `execCommand`. */
    const minimo = '<!doctype html><html><body>'
      + '<textarea id="c" readonly>' + PAYLOAD + '</textarea>'
      + '<button type="button" data-copiar="c">Copiar</button>'
      + '</body></html>'.replace('</body>', '<script>' + SCRIPT_DO_COPIAR + '</script></body>');
    const { dom, capturado } = await abrir(minimo, null, { comClipboard: false });
    const d = dom.window.document;
    const botao = d.querySelector('[data-copiar]');
    const campo = d.getElementById('c');
    botao.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await esperar(60);
    provar('a reserva chama o `execCommand` uma vez', capturado.seleccionou === 1,
      capturado.seleccionou);
    provar('…e deixa o campo com a selecção inteira', campo.selectionEnd === PAYLOAD.length,
      { seleccao: campo.selectionEnd, total: PAYLOAD.length });
    provar('…e o botão diz «Copiado» mesmo assim', botao.textContent === 'Copiado',
      botao.textContent);
    dom.window.close();
  }

  /* ── F. OS CONTROLOS NEGATIVOS ───────────────────────────────────────────────────────── */
  console.log('\nF. OS CONTROLOS NEGATIVOS');

  {
    /* O DEFEITO ORIGINAL, REPRODUZIDO: a mesma marcação sem a rotina. É a página que ela tinha —
     * o botão existe, o campo existe, e o clique não faz nada. */
    const semRotina = '<!doctype html><html><body>'
      + '<textarea id="c" readonly>' + PAYLOAD + '</textarea>'
      + '<button type="button" data-copiar="c">Copiar</button></body></html>';
    if (!jsdom) {
      console.log('  NÃO FEITO — sem jsdom nesta máquina.');
    } else {
      const { dom, capturado } = await abrir(semRotina);
      const botao = dom.window.document.querySelector('[data-copiar]');
      botao.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      await esperar(60);
      provar('CONTROLO: sem a rotina, o clique não copia nada — é o defeito que ela descreveu',
        capturado.copiado === null && botao.textContent === 'Copiar',
        { copiou: capturado.copiado, rotulo: botao.textContent });
      dom.window.close();
    }
    provar('CONTROLO: as três páginas não trazem nenhuma OUTRA cópia da rotina escrita à mão',
      Object.values(paginas).every((p) => {
        const blocos = (p.html.match(/__copiarLigado/g) || []).length / 2;
        return blocos === 1 && (p.html.match(/execCommand/g) || []).length === 1;
      }));
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o «Copiar» é uma rotina só, servida às três páginas; '
      + 'copia o documento inteiro em cada uma, com as quebras de linha; o botão diz «Copiado» e '
      + 'volta ao rótulo de origem; e sem o `navigator.clipboard` a reserva selecciona e copia.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})();
