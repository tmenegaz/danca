#!/usr/bin/env node
'use strict';

/*
 * provar-senha-do-lancamento.js — o campo da senha existe onde a página o pede.
 *
 * O DEFEITO (20/10/2026, encontrado pela pesquisadora a lançar uma aula). Preenchido o
 * formulário de lançamento e mandado gravar, a página respondia «informe a sua senha no campo
 * acima» — e não havia campo nenhum acima. O campo existia no arquivo; estava é DENTRO do bloco
 * que o modo captura escondia inteiro.
 *
 * A causa, em uma linha: o bloco `#acoes-md` guardava duas coisas de naturezas diferentes — o que
 * serve a GERAR um arquivo (botão, entregável, autor, ajuda) e a SENHA, que AUTENTICA. Esconder o
 * bloco para esconder o «Gerar .md» escondia também a autenticação, no modo em que se grava.
 *
 * O QUE ESTA PROVA FIXA — e a segunda parte é o que a torna uma prova, e não uma conferência de
 * texto:
 *
 *   A. A REGRA. Com o formulário aberto, o campo da senha NÃO está escondido; os controles do «.md»
 *      estão. Com a página em leitura, todos estão.
 *   B. A REGRA É A QUE CORRE. Não se lê o texto à procura de uma frase: extrai-se do template o
 *      BLOCO que decide a visibilidade e executa-se, sobre um DOM construído com a marcação REAL
 *      do mesmo template. É o código de produção a correr — sobre um `<div>` de mentira.
 *   C. AS MENSAGENS NOMEIAM O CAMPO. As duas frases que mandam digitar a senha apontam para o
 *      campo «Sua senha» pelo nome. Apontar para «o campo acima» foi o que fez o defeito parecer
 *      um problema de layout quando era de estrutura.
 *   D. O CONTROL NEGATIVO. A versão anterior do template, aplicada ao mesmo DOM pela mesma via,
 *      REPROVA — o campo fica escondido. Sem isto, a prova passaria a aprovar qualquer coisa.
 *
 *   node experimentos/provar-senha-do-lancamento.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const RAIZ = path.join(__dirname, '..');
const TEMPLATE = path.join(RAIZ, 'tools', 'templates', 'lancamento.html');

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

const fonte = fs.readFileSync(TEMPLATE, 'utf8');

/**
 * A MARCAÇÃO DO BLOCO, extraída do template. É o `<div id="acoes-md">` inteiro, com os
 * `data-so-leitura` que a correção introduziu.
 */
function marcacaoDaBarra(texto) {
  const m = /<div class="acoes" id="acoes-md">[\s\S]*?<\/div>\s*\n\s*<div id="saida">/.exec(texto);
  if (!m) return null;
  return m[0].replace(/<div id="saida">$/, '').trim();
}

/**
 * O BLOCO DE LÓGICA que decide a visibilidade, extraído do template pelo comentário que o
 * encima. Extrair, e não reescrever: uma prova que reescreve a regra prova a reescrita.
 */
function regraDaVisibilidade(texto) {
  const i = texto.indexOf('const acoesMd = el(\'acoes-md\');');
  if (i === -1) return null;
  /*
   * O FIM DA REGRA É ONDE A PROFUNDIDADE DE CHAVES VOLTA A ZERO E FECHA UMA INSTRUÇÃO.
   *
   * A primeira versão disto procurava a string `\n  }` — e a reconstrução do controlo negativo
   * tem a regra velha numa linha só (`if (acoesMd) acoesMd.hidden = emFormulario;`), que não tem
   * `\n  }` nenhum. A extracção devolvia lixo, o DOM não era aplicado, e o controlo negativo
   * «passava» sem medir nada. Um extractor que só funciona na forma nova não serve para comparar
   * com a velha — e comparar com a velha é metade do valor desta prova.
   */
  /** O fim da instrução que começa em `de`: o `;` de profundidade zero, ou o `}` do bloco. */
  const fimDaInstrucao = (de) => {
    let profundidade = 0;
    let abriu = false;
    for (let j = de; j < texto.length; j += 1) {
      const c = texto[j];
      if (c === '{') { profundidade += 1; abriu = true; }
      else if (c === '}') {
        profundidade -= 1;
        if (abriu && profundidade === 0) return j + 1;
      } else if (c === ';' && profundidade === 0 && !abriu) return j + 1;
    }
    return -1;
  };

  let fim = fimDaInstrucao(i);
  if (fim === -1) return null;
  /*
   * A REGRA É A INSTRUÇÃO MAIS OS `if` QUE A SEGUEM. A primeira versão parava na primeira
   * instrução (`const acoesMd = …;`) e a prova verificava, sem saber, só a declaração — o
   * `querySelectorAll` que é a correção ficava de fora. Uma prova que mede metade da regra
   * aprova metade do defeito.
   */
  for (;;) {
    const resto = texto.slice(fim);
    const m = /^\s*\n?\s*(if\s*\(|else\s)/.exec(resto);
    if (!m) break;
    const inicio = fim + m[0].length - m[1].length;
    const proximo = fimDaInstrucao(inicio);
    if (proximo === -1) break;
    fim = proximo;
  }
  return texto.slice(i, fim);
}

/** Corre a regra sobre um DOM real, com o `emFormulario` que se lhe der. */
function aplicar(textoDoTemplate, emFormulario) {
  const marca = marcacaoDaBarra(textoDoTemplate);
  const regra = regraDaVisibilidade(textoDoTemplate);
  if (!marca || !regra) return null;

  const dom = new JSDOM('<!DOCTYPE html><body>' + marca + '</body>');
  const doc = dom.window.document;
  // O `el()` do template: por id, no documento.
  const el = (id) => doc.getElementById(id);
  // A regra usa `querySelectorAll(...).forEach` — está no DOM do jsdom, como no navegador.
  // eslint-disable-next-line no-new-func
  const executar = new Function('el', 'emFormulario', regra + '\nreturn { acoesMd: el(\'acoes-md\') };');
  const { acoesMd } = executar(el, emFormulario);

  const escondido = (no) => Boolean(no && (no.hidden || no.hasAttribute('hidden')));
  const senha = el('senha');
  const senhaVisivel = Boolean(senha) && !escondido(senha)
    && !escondido(senha.closest('[hidden]')) && !escondido(acoesMd);
  const gerar = el('gerar');
  const autor = el('autor');
  return {
    senhaPresente: Boolean(senha),
    senhaVisivel,
    barraEscondida: escondido(acoesMd),
    gerarEscondido: escondido(gerar) || escondido(gerar && gerar.closest('[hidden]')),
    autorEscondido: escondido(autor) || escondido(autor && autor.closest('[hidden]')),
  };
}

function principal() {
  console.log('provar-senha-do-lancamento — o campo existe onde a página o pede\n');

  // ── A. A REGRA, no template que está no repositório ──────────────────────────────
  console.log('A. A regra, com o formulário aberto e em leitura');
  const noFormulario = aplicar(fonte, true);
  const emLeitura = aplicar(fonte, false);

  checar('a marcação do bloco e a regra foram extraídas do template',
    Boolean(noFormulario && emLeitura));

  if (noFormulario && emLeitura) {
    checar('o campo da senha existe na marcação', noFormulario.senhaPresente);
    checar('com o formulário aberto, o campo da senha NÃO está escondido', noFormulario.senhaVisivel,
      noFormulario);
    checar('com o formulário aberto, o «Gerar .md» está escondido', noFormulario.gerarEscondido,
      noFormulario);
    checar('e o «Gerado por» também — é do arquivo, não da autenticação', noFormulario.autorEscondido,
      noFormulario);

    checar('em leitura, o campo da senha continua à vista', emLeitura.senhaVisivel, emLeitura);
    checar('em leitura, o «Gerar .md» aparece', !emLeitura.gerarEscondido, emLeitura);
    checar('em leitura, o bloco inteiro está visível', !emLeitura.barraEscondida, emLeitura);
  }

  // ── B. A REGRA É A QUE CORRE ─────────────────────────────────────────────────────
  console.log('\nB. A regra provada é a que corre — não uma reescrita para a prova');
  const regra = regraDaVisibilidade(fonte) || '';
  checar('a regra faz `querySelectorAll` sobre `[data-so-leitura]`',
    /querySelectorAll\('\[data-so-leitura\]'\)/.test(regra), regra.slice(0, 120));
  checar('e NÃO esconde o contentor inteiro (`acoesMd.hidden = emFormulario` foi o defeito)',
    !/acoesMd\.hidden\s*=\s*emFormulario/.test(regra));
  checar('o contentor é explicitamente mantido visível',
    /acoesMd\.hidden\s*=\s*false/.test(regra), regra.slice(0, 200));
  const marcados = (marcacaoDaBarra(fonte) || '').match(/data-so-leitura/g) || [];
  checar('a marcação tem os controles do «.md» marcados (e só eles)', marcados.length >= 4, marcados.length);
  checar('e o `#senha` NÃO está entre os marcados',
    !/data-so-leitura[^>]*>[\s\S]{0,200}id="senha"/.test(marcacaoDaBarra(fonte) || ''));

  // ── C. AS MENSAGENS ──────────────────────────────────────────────────────────────
  console.log('\nC. As mensagens apontam para o campo pelo nome');
  checar('a mensagem do envio nomeia o campo «Sua senha»',
    /informe a sua senha no campo “Sua senha”/.test(fonte));
  // A FRASE QUE SE LANÇA, e não a que se cita: o comentário da correção cita o texto antigo de
  // propósito (é a memória do defeito), e uma asserção que olhasse o arquivo inteiro reprovava a
  // própria documentação da correção.
  checar('e não diz «no campo acima» — era o que apontava para o nada',
    !/throw new Error\('informe a sua senha no campo acima/.test(fonte),
    (fonte.match(/throw new Error\('[^\n]*senha[^\n]*/) || [])[0]);
  checar('a mensagem do ciclo cifrado também nomeia o campo',
    /no campo <strong>“Sua senha”<\/strong>/.test(fonte));
  checar('e o campo ganha o foco quando a falta é a senha',
    /if \(\/senha\/i\.test\(String\(e\.message\)\)\)/.test(fonte));

  // ── D. O CONTROLO NEGATIVO ───────────────────────────────────────────────────────
  console.log('\nD. Controlo negativo — a versão anterior reprova pela mesma via');
  /*
   * Reconstrói-se o template ANTERIOR: o bloco escondido inteiro, e a senha sem marca. Se a prova
   * aprovasse isto, estaria a aprovar o defeito — e não serviria para nada.
   */
  const anterior = fonte
    .replace(/ data-so-leitura/g, '')
    .replace(/const acoesMd = el\('acoes-md'\);\s*\n\s*if \(acoesMd\) \{[\s\S]*?\n  \}/,
      "const acoesMd = el('acoes-md');\n  if (acoesMd) acoesMd.hidden = emFormulario;");
  const antes = aplicar(anterior, true);
  checar('a versão anterior foi reconstruída (a regra antiga está lá)',
    /acoesMd\.hidden = emFormulario/.test(anterior));
  checar('e nela o campo da senha FICA ESCONDIDO no formulário — é o defeito, reproduzido',
    Boolean(antes) && antes.senhaVisivel === false, antes);

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal();
