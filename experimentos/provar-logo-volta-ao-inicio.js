'use strict';

/*
 * provar-logo-volta-ao-inicio.js — clicar na marca leva à raiz do DOMÍNIO.
 *
 * O PEDIDO (20/10/2026). «Toda vez que eu clicar na logo, quero ir só para o domínio» —
 * `https://batata.tmenegaz77.workers.dev`, sem caminho nenhum.
 *
 * O QUE HAVIA. A marca era um `<span class="marca" aria-hidden="true">` com o SVG dentro: puro
 * ornamento. O clique não fazia nada, e o gesto de clicar na logo para voltar ao início — que
 * qualquer pessoa tenta — não tinha destino.
 *
 * POR QUE O `href` TEM DE SER ABSOLUTO. `index.html` significaria três coisas diferentes, porque
 * a mesma barra serve três níveis de endereço:
 *
 *   · no pacote da turma (`/aula-01`), é o índice do ciclo;
 *   · na porta (`/plano-observacao/`), é a própria porta outra vez;
 *   · nos Bastidores (`/bastidores/estudio`), é a pasta dos Bastidores.
 *
 * `/` é a única resposta certa nas três. Um `href` relativo levaria a três sítios e o gesto
 * deixaria de querer dizer «início».
 *
 * E HÁ UM QUARTO CONSUMIDOR, o que faz esta prova valer a pena: A PONTE. Um pacote gerado antes
 * de hoje traz o slot VAZIO (`<span class="marca"></span>`), e a ponte de produção preenche-o ao
 * servir — para o pacote velho ficar certo sem ser regerado. Se a ponte só pusesse o desenho, a
 * logo dos pacotes antigos continuaria a não se clicar.
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   A. A DEFINIÇÃO. A marca é um `<a>`, o `href` é `/`, o `<a>` tem nome acessível, e o desenho
 *      está num `<span aria-hidden>` — não no `<a>`, que ficaria sem nome.
 *   B. OS TRÊS CONSUMIDORES. A abertura do pacote (`--abertura`, que o `gerar-ciclo.sh` e o
 *      `criar-escola.sh` usam), a barra do sistema (`navSistema`, dos Bastidores) e o slot que a
 *      ponte preenche — todos com o mesmo `<a href="/">`.
 *   C. A PONTE. O slot vazio de um pacote antigo vira o link (com o desenho), e um pacote novo
 *      passa intacto (idempotência).
 *   D. O QUE NÃO PODE VOLTAR. O `<span class="marca">` sem link, e o `href` relativo.
 *
 *   node experimentos/provar-logo-volta-ao-inicio.js
 */

const fs = require('fs');
const path = require('path');

const { ABERTURA, MARCA, MARCA_NA_BARRA, navSistema } = require('../tools/templates/nav-html.js');

const RAIZ = path.join(__dirname, '..');

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

/**
 * A PONTE, sem subir um Worker. `comAparencia` é a função que preenche o slot — mas ela também
 * mexe em `data-modo`/`data-paleta`, e o que interessa aqui é só a substituição da marca. O
 * regex é lido do PRÓPRIO `producao.js`, para a prova não passar a medir uma cópia que ninguém
 * executa.
 */
function preencherComoAPonte(html) {
  const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/producao.js'), 'utf8');
  const m = /texto = texto\.replace\(\s*(\/.*?\/g),/.exec(fonte);
  if (!m) return { html, achou: false };
  // A regex vem escrita como literal no código-fonte; `eval` de um literal controlado é a forma
  // de a usar sem a reescrever. Se ela mudar de forma, a prova diz que não a encontrou.
  const padrao = eval(m[1]); // eslint-disable-line no-eval
  /*
   * O CORPO da substituição também é o do `producao.js` — e tem de ser, porque ele decide entre
   * «o slot estava vazio» e «o slot já trazia o desenho». Replicá-lo aqui à mão seria a segunda
   * cópia que a própria ponte evita; a prova confere que o corpo existe e usa a mesma constante.
   */
  const temCorpo = /const desenho = dentro && dentro\.indexOf\('<svg'\) !== -1 \? dentro : MARCA;/.test(fonte);
  if (!temCorpo) return { html, achou: false, semCorpo: true };
  const novo = html.replace(padrao, (tudo, attrs, dentro) => {
    const desenho = dentro && dentro.indexOf('<svg') !== -1 ? dentro : MARCA;
    return MARCA_NA_BARRA.trim().replace('<span aria-hidden="true">' + MARCA + '</span>',
      '<span aria-hidden="true">' + desenho + '</span>');
  });
  return { html: novo, achou: true };
}

/** O `<a>` da marca, se houver — e o que ele declara. */
function linkDaMarca(html) {
  const m = /<a class="marca"([^>]*)>/.exec(html);
  if (!m) return null;
  const attrs = m[1];
  const href = (/\bhref="([^"]*)"/.exec(attrs) || [])[1] || null;
  const rotulo = (/\baria-label="([^"]*)"/.exec(attrs) || [])[1] || null;
  const fim = html.indexOf('</a>', m.index);
  const dentro = fim === -1 ? '' : html.slice(m.index + m[0].length, fim);
  return { href, rotulo, dentro, attrs };
}

function principal() {
  // ------------------------------------------------------------------ A
  console.log('\nA. a definição: um link para a raiz, com nome');
  {
    const el = linkDaMarca(MARCA_NA_BARRA);
    checar('a marca é um `<a class="marca">`', Boolean(el), MARCA_NA_BARRA.slice(0, 90));
    checar('e o `href` é `/` — a raiz do domínio, não `index.html`', el && el.href === '/',
      el && el.href);
    checar('o `<a>` tem nome acessível (`aria-label`)', Boolean(el && el.rotulo), el && el.rotulo);
    checar('e o desenho está num `<span aria-hidden>` dentro dele, e não no `<a>`',
      Boolean(el && /^<span aria-hidden="true"><svg/.test(el.dentro)),
      el && el.dentro.slice(0, 60));
    // O DEFEITO QUE SE EVITA: um `<a>` cujo conteúdo é todo `aria-hidden` fica sem nome.
    checar('o `<a>` NÃO tem `aria-hidden` — seria um link sem nome',
      Boolean(el && el.attrs.indexOf('aria-hidden') === -1), el && el.attrs);
    checar('e o SVG está lá dentro (o slot não está vazio)', Boolean(el && el.dentro.indexOf('<svg') !== -1));
  }

  // ------------------------------------------------------------------ B
  console.log('\nB. os três consumidores recebem o mesmo link');
  {
    // 1. A ABERTURA — usada pelo `gerar-ciclo.sh` (`node nav-html.js --abertura`) e pelo
    //    `criar-escola.sh` (o pacote-zero). É a barra do pacote e da porta.
    const elAbertura = linkDaMarca(ABERTURA);
    checar('a abertura do pacote (`--abertura`) traz a marca como link para `/`',
      Boolean(elAbertura && elAbertura.href === '/'), elAbertura);
    checar('e a abertura não traz o `<span class="marca">` sem link',
      ABERTURA.indexOf('<span class="marca"') === -1);

    // 2. A BARRA DO SISTEMA — os Bastidores.
    const sistema = navSistema({
      atual: 'producao',
      anamnese: '/anamnese/',
      plano: '/plano-ensino/',
      po: '/plano-observacao/',
    });
    const elSistema = linkDaMarca(sistema);
    checar('a barra do sistema (`navSistema`, dos Bastidores) também',
      Boolean(elSistema && elSistema.href === '/'), elSistema);

    // 3. A PONTE — o slot vazio de um pacote antigo.
    const velho = '<nav class="topnav" aria-label="Navegação do ciclo">\n'
      + '  <span class="marca" aria-hidden="true"></span>\n'
      + '  <a href="aula-01.html">Aula 01</a>\n</nav>';
    const preenchido = preencherComoAPonte(velho);
    checar('a ponte encontra o padrão do slot (a regex vem do `producao.js`)', preenchido.achou);
    const elPonte = linkDaMarca(preenchido.html);
    checar('o slot vazio de um pacote antigo vira link para `/`', Boolean(elPonte && elPonte.href === '/'),
      elPonte);
    checar('e com o desenho dentro', Boolean(elPonte && elPonte.dentro.indexOf('<svg') !== -1));
    checar('sem herdar o `aria-hidden="true"` do `<span>` velho',
      Boolean(elPonte && elPonte.attrs.indexOf('aria-hidden') === -1), elPonte && elPonte.attrs);
    checar('e o resto da barra passa intacto', preenchido.html.indexOf('<a href="aula-01.html">Aula 01</a>') !== -1);

    /*
     * O SEGUNDO ESTADO DO SLOT, e é o da MAIORIA dos pacotes. Um pacote gerado entre 18 e
     * 20/10 traz a marca PREENCHIDA — `<span class="marca"><svg…></svg></span>` — e não vazia.
     * Uma correcção que só olhasse o vazio deixaria esses pacotes com uma logo inerte, e o
     * sintoma é invisível: o desenho está lá. Este caso é o que separa «corrigi o meu» de
     * «corrigi o de quem já tinha».
     */
    const cheio = '<nav class="topnav" aria-label="Navegação do ciclo">\n'
      + '  <span class="marca">' + MARCA + '</span>\n</nav>';
    const preenchidoCheio = preencherComoAPonte(cheio);
    const elCheio = linkDaMarca(preenchidoCheio.html);
    checar('o slot PREENCHIDO de um pacote já gerado também vira link', Boolean(elCheio && elCheio.href === '/'),
      elCheio);
    checar('e o desenho que ele trazia é preservado (não é substituído por outro)',
      Boolean(elCheio && elCheio.dentro.indexOf('<svg') !== -1));
    checar('sem sobrar nenhum `<span class="marca">`', preenchidoCheio.html.indexOf('<span class="marca"') === -1);
  }

  // ------------------------------------------------------------------ C
  console.log('\nC. a ponte é idempotente: um pacote novo passa intacto');
  {
    const novo = '<nav class="topnav">' + MARCA_NA_BARRA.trim() + '</nav>';
    const depois = preencherComoAPonte(novo).html;
    checar('preencher uma página que já traz o link não a altera', depois === novo);
    checar('e o link não aparece duas vezes', (depois.match(/class="marca"/g) || []).length === 1,
      (depois.match(/class="marca"/g) || []).length);
  }

  // ------------------------------------------------------------------ D
  console.log('\nD. o que não pode voltar');
  {
    // A MARCA NÃO PODE VOLTAR A SER ORNAMENTO. Se alguém reintroduzir um `<span class="marca">`
    // como a marca da barra, o gesto de clicar na logo volta a não fazer nada — e o sintoma é
    // invisível, porque o desenho continua lá.
    const fonte = fs.readFileSync(path.join(RAIZ, 'tools/templates/nav-html.js'), 'utf8');
    checar('o `nav-html.js` não declara a marca como `<span>` sem link',
      !/const MARCA_NA_BARRA = '\s*<span class="marca"/.test(fonte));

    // O HREF RELATIVO. `index.html` é o erro que parece certo — e é o mais provável de voltar.
    checar('e nenhum consumidor usa `href="index.html"` para a marca',
      [ABERTURA, MARCA_NA_BARRA, navSistema({ anamnese: 'a', plano: 'b', po: 'c' })]
        .every((h) => !/<a class="marca" href="index\.html"/.test(h)));

    // O verificador de identidade passou a exigir o link: sem esta linha, a regra poderia voltar
    // ao `<span>` e o `check-identidade` continuaria a dizer «ok».
    const ident = fs.readFileSync(path.join(RAIZ, 'tools/check-identidade.js'), 'utf8');
    checar('o `check-identidade` exige o link (não só que o slot não esteja vazio)',
      /<a class="marca" href="\\\/"/.test(ident), 'a verificação da marca não exige o href="/"');
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal();
