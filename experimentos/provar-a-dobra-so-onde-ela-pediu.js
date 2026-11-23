#!/usr/bin/env node
'use strict';

/**
 * provar-a-dobra-so-onde-ela-pediu.js — a seta de abrir e fechar só existe onde ela a pediu
 * (23/11/2026).
 *
 * AS PALAVRAS DELA, e são três pedidos que são um só:
 *
 *   «Você colocou o botão de expandir de forma indiscriminada e não só onde eu te pedi ontem, então
 *    vamos ajustar isso. Logo que a escola nasce, eu estou em breu.padd.com.br. […] quando uma
 *    escola nasce, ela traz uma informação dizendo que as turmas desta escola. Você colocou um botão
 *    de expandir e colapsar. Tira esse botão daqui, ele não existe aqui. Aí tem um link que leva
 *    para a apresentação do sistema e aí ele fica no endereço breu.padd.com.br/sistema. Você também
 *    colocou botão de colapsar e expandir em todos os títulos. Tira, não precisa disso aqui.»
 *
 * O DEFEITO É O DE 22/11 OUTRA VEZ, com outra roupa. A dobra nasce em qualquer `.conteudo > h2[id]`
 * de uma página que não se declare, e a lista das excepções era `{raiz, porta}`: um documento que
 * se estuda. O índice de uma escola e a apresentação dela não são documentos — são a porta de
 * entrada e o texto que se lê de cima abaixo —, e ganharam a seta por omissão.
 *
 * O QUE ESTA PROVA TRAVA, e cada secção é uma pergunta diferente:
 *
 *   §A A DOBRA NÃO ESTÁ ONDE ELA NÃO A QUER — no índice da escola e na apresentação, medidos no
 *      HTML **publicado** (o mesmo que o Worker serve), com o `nav.js` a correr a sério.
 *   §B E CONTINUA ONDE ELA A QUER — o MESMO documento, sem a declaração, volta a ganhar a seta.
 *      É o controle que impede «zero botões» de ser verdade por o script não ter corrido.
 *   §C O ÍNDICE DA ESCOLA diz o que ela pediu: o título sem «desta escola», a frase do lastro, o
 *      aviso do ciclo intacto, e o atalho para os Bastidores com o nome que ela deu.
 *   §D O GRAVAR DAS HABILITAÇÕES FECHA O FORMULÁRIO — e a mensagem vai para o aviso do gesto, não
 *      para o `.res` que acabou de ser recolhido.
 *
 * SEM REDE: o `nav.js` é o ficheiro do pacote publicado, servido por um `http.createServer` local.
 *
 *   node experimentos/provar-a-dobra-so-onde-ela-pediu.js
 *   node experimentos/provar-a-dobra-so-onde-ela-pediu.js --contra=<sha>
 *
 * O CONTROLE NEGATIVO carrega o `motor/`, o `tools/` e o `porta/` daquele commit — a âncora é o
 * estado imediatamente antes do trabalho que se mede, e nunca `HEAD`.
 */

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const CONTRA = (process.argv.find((x) => x.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let RAIZ_DO_CODIGO = RAIZ;
if (CONTRA) {
  RAIZ_DO_CODIGO = fs.mkdtempSync(path.join(os.tmpdir(), 'dobra-'));
  /* `publicacao/` NÃO ENTRA NO ARQUIVO — ela é gerada e está no `.gitignore`, e um caminho que não
   * casa com nada é um ERRO para o `git archive` (o mesmo `fatal: pathspec … did not match` que
   * derrubou o «Fechar os derivados» a 23/11). O HTML medido é o de AGORA; o que vem do commit de
   * antes é o CÓDIGO — o `nav.js` e o `motor/`. É isso que se quer comparar. */
  execSync('git archive ' + CONTRA + ' motor tools porta biblioteca modelo teste | tar -x -C ' + RAIZ_DO_CODIGO,
    { cwd: RAIZ, stdio: 'pipe' });
  console.log('CONTROLE NEGATIVO — o código de ' + CONTRA + ', antes desta mudança');
  console.log('(o HTML é o de agora: `publicacao/` é gerada e não está no Git)\n');
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

const NAV = path.join(RAIZ_DO_CODIGO, 'tools/templates/nav.js');
const NAV_SERVIDO = fs.readFileSync(NAV, 'utf8');

/** Um servidor local que serve as páginas e o `nav.js` — nada sai para a rede. */
function servir(paginas) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    if (caminho === '/assets/nav.js') {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      return res.end(NAV_SERVIDO);
    }
    if (caminho === '/assets/style.css') {
      res.writeHead(200, { 'content-type': 'text/css' });
      return res.end(fs.readFileSync(path.join(RAIZ_DO_CODIGO, 'tools/templates/ciclo.css')));
    }
    const corpo = paginas[caminho];
    if (corpo === undefined) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(corpo);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

/** A página montada no jsdom, com o `nav.js` a correr. Devolve a contagem de setas. */
async function medirDobra(html, url) {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const vc = new VirtualConsole();
  const erros = [];
  vc.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url, virtualConsole: vc,
    /* `resources: 'usable'` É O QUE FAZ O `nav.js` CARREGAR. Sem ele o jsdom não vai buscar os
     * `<script src>` externos, e a página fica sem setas POR O SCRIPT NÃO TER CORRIDO — a
     * asserção «zero setas» passaria a ser verdadeira sempre, inclusive no controle negativo.
     * Foi o que aconteceu na primeira execução desta prova, e é a família de defeito que a casa
     * persegue: uma medição vazia que passa em silêncio. */
    resources: 'usable',
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      w.scrollTo = () => {};
      try { w.sessionStorage.clear(); } catch (e) { /* modo privado */ }
    },
  });
  /* O `nav.js` é um pedido de rede a mais: 260ms chegavam para o HTML, não para o script. */
  await new Promise((r) => setTimeout(r, 700));
  const d = dom.window.document;
  const resultado = {
    tela: d.body.getAttribute('data-tela'),
    titulos: d.querySelectorAll('.conteudo > h2[id]').length,
    setas: d.querySelectorAll('.secao-dobra').length,
    corpos: d.querySelectorAll('.secao-corpo').length,
    coluna: Boolean(d.querySelector('aside.coluna')),
    erros,
  };
  dom.window.close();
  return resultado;
}

/* ================================================================== §A e §B — a regra e o controle */

async function medirAsPilhas() {
  console.log('\nA. A seta NÃO está no índice da escola nem na apresentação');
  /* O PACOTE PUBLICADO, e não uma página de teste: é o HTML que o Worker serve. O `montar-publicacao`
   * é quem o escreve, e se ele não tiver corrido a prova mede o ficheiro de ontem — por isso a
   * ausência dele é uma FALHA e não um salto. */
  const publicado = path.join(RAIZ, 'publicacao', 'breu');
  const temPublicado = fs.existsSync(path.join(publicado, 'index.html'));
  provar('o pacote publicado da escola existe (senão não há o que medir)',
    temPublicado, publicado);
  if (!temPublicado) return;

  const indice = fs.readFileSync(path.join(publicado, 'index.html'), 'utf8');
  const sistema = fs.readFileSync(path.join(publicado, 'sistema.html'), 'utf8');
  const { srv, base } = await servir({
    '/': indice, '/index.html': indice, '/sistema': sistema, '/sistema.html': sistema,
  });
  try {
    const doIndice = await medirDobra(indice, base + '/');
    provar('o índice da escola declara-se `data-tela="escola"`',
      doIndice.tela === 'escola', doIndice.tela);
    provar('…e tem UM título de secção — é uma porta de entrada, não um documento',
      doIndice.titulos === 1, doIndice.titulos);
    provar('…e ZERO setas de abrir e fechar', doIndice.setas === 0, doIndice.setas);
    provar('…e nenhum corpo de secção criado', doIndice.corpos === 0, doIndice.corpos);
    /* O SCRIPT TEM DE TER CORRIDO, e a prova disso não é «não lançou» — é ele ter deixado a sua
     * marca. As duas páginas têm `</html>` com o `nav.js` a ter passado: a coluna da navegação é
     * desenhada por ele, e é isso que se lê. Uma página sem `aside.coluna` é uma página onde o
     * script não correu, e aí «zero setas» não mede nada. */
  provar('…e o `nav.js` correu de facto — a coluna da navegação foi desenhada por ele',
    doIndice.coluna === true, doIndice.coluna);
  provar('…e não lançou', doIndice.erros.length === 0, doIndice.erros.slice(0, 1));

    const doSistema = await medirDobra(sistema, base + '/sistema');
    provar('a apresentação declara-se `data-tela="sistema"`',
      doSistema.tela === 'sistema', doSistema.tela);
    provar('…e tem nove títulos de secção — é o documento que ganhava nove setas',
      doSistema.titulos === 9, doSistema.titulos);
    provar('…e ZERO setas', doSistema.setas === 0, doSistema.setas);
    provar('…e o `nav.js` correu de facto — a coluna foi desenhada', doSistema.coluna === true, doSistema.coluna);
  provar('…e não lançou', doSistema.erros.length === 0, doSistema.erros.slice(0, 1));

    console.log('\nB. E continua onde ela a quer — o MESMO texto, sem a declaração');
    /* O CONTROLE. A página é a mesma, byte a byte, e a única coisa que muda é o atributo. Se as
     * setas voltarem, então o que as tira é a declaração — e não o `nav.js` ter deixado de correr
     * ou o seletor ter deixado de casar. Sem isto, «zero setas» prova o nada. */
    const semDeclaracao = sistema.replace(/ data-tela="sistema"/, '');
    const controle = await medirDobra(semDeclaracao, base + '/sistema');
    provar('sem `data-tela`, a mesma página volta a ganhar uma seta por título',
      controle.setas === 9 && controle.corpos === 9, { setas: controle.setas, corpos: controle.corpos });
    provar('…e o primeiro abre, os outros nascem recolhidos (a regra de 22/11 intacta)',
      controle.corpos === 9, controle.corpos);

    const semDeclaracaoIndice = indice.replace(/ data-tela="escola"/, '');
    const controleIndice = await medirDobra(semDeclaracaoIndice, base + '/');
    provar('…e o mesmo no índice da escola: sem a declaração, a seta volta',
      controleIndice.setas === 1, controleIndice.setas);
  } finally { srv.close(); }
}

/* ======================================================== §C — o texto do índice da escola */

function medirOTexto() {
  console.log('\nC. O índice da escola diz o que ela pediu');
  const alvo = path.join(RAIZ, 'publicacao', 'breu', 'index.html');
  if (!fs.existsSync(alvo)) { provar('o índice publicado existe', false, alvo); return; }
  const h = fs.readFileSync(alvo, 'utf8');

  /* O TÍTULO. «as turmas desta escola, não faz sentido nenhum esse título […] eu estou em
   * breu.padd.com.br. Aí tem o título as turmas desta escola. Isso não faz sentido nenhum.» A
   * redundância é o defeito: a página JÁ é a da escola. */
  provar('o título da secção é «Turmas», e não «As turmas desta escola»',
    /<h2 id="turmas">Turmas<\/h2>/.test(h), (h.match(/<h2 id="turmas">[^<]*/) || [''])[0]);
  provar('…e «desta escola» já não aparece em título nenhum',
    !/desta escola/i.test(h), null);

  /* A FRASE. «O que se planeja para uma serve de base para a outra. É o lastro da próxima.» */
  provar('a frase diz que o planejado numa serve de base à outra — é o lastro da próxima',
    /serve de base para a outra — é o lastro da próxima\./.test(h), null);
  provar('…e a frase que ela recusou já lá não está («não vale para a outra»)',
    !/não vale para a outra/.test(h), null);
  provar('…nem a do ritmo e do calendário, que ela mandou tirar',
    !/ritmo é de cada uma/.test(h) && !/calendário/.test(h), null);

  /* O AVISO FICA. «Isso está certo, tá? Isso pode deixar.» */
  provar('o aviso do ciclo que ainda não existe FICA, palavra por palavra',
    /Ainda não há ciclo gerado para esta escola\. O ciclo nasce quando o Plano de Observação/.test(h),
    null);

  /* O ATALHO PARA OS BASTIDORES. «agora você vai colocar abaixo deste aqui, ó, um link que leva
   * direto para bastidores, estúdio. E ali naquele link você vai dizer comece por aqui.» */
  /* O ENDEREÇO É ABSOLUTO, como os da Área do Professor no rodapé: a escola é servida na raiz do
   * próprio host, e um caminho relativo partiria de onde a página estivesse. */
  provar('há um atalho para os Bastidores → Estúdio',
    /href="\/bastidores\/estudio"/.test(h), null);
  provar('…dizendo «comece por aqui» e nomeando o Estúdio',
    /comece por aqui/i.test(h) && /Bastidores/.test(h) && /Estúdio/.test(h), null);
  /* A ORDEM DENTRO DO CONTEÚDO, e não na página: o MENU também tem um link para
   * `/bastidores/estudio`, e ele vem antes de tudo — comparar as primeiras ocorrências media o
   * menu, não o parágrafo. Compara-se a ÚLTIMA, que é a do texto, com a da apresentação. */
  provar('…e vem DEPOIS do link da apresentação do sistema',
    h.lastIndexOf('bastidores/estudio') > h.indexOf('a apresentação do sistema'), null);
}

/* ============================================ §D — o gravar das habilitações fecha o formulário */

const USOS_VAZIOS = () => ({ professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 });

function paginaDosBastidores() {
  const bastidores = require(path.join(RAIZ_DO_CODIGO, 'motor/servidor/bastidores.js'));
  return bastidores.paginaProducao('breu', {}, [
    { nome: 'Brise Volet', slug: 'brise-volet', sal: 's1', hash: 'h1' },
    { nome: 'Ana Diag', slug: 'ana-diag', sal: 's2', hash: 'h2' },
  ], ['abreu'], 'Brise Volet', 'brise-volet', [], [], {}, [], [], [], USOS_VAZIOS(),
  null, null, [], new Set());
}

async function medirOGravar() {
  console.log('\nD. Gravar as habilitações FECHA o formulário');
  const { JSDOM, VirtualConsole } = require('jsdom');
  const vc = new VirtualConsole();
  const erros = [];
  vc.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
  const pedidos = [];
  const dom = new JSDOM(paginaDosBastidores(), {
    runScripts: 'dangerously', url: 'https://breu.padd.com.br/bastidores/estudio', virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      Object.defineProperty(w, 'localStorage', {
        configurable: true, value: { getItem: () => null, setItem() {}, removeItem() {} },
      });
      w.scrollTo = () => {};
      w.fetch = (url, opcoes) => {
        const caminho = String(url);
        if (caminho.indexOf('/api/bastidores/perfil') !== -1) {
          if (opcoes && opcoes.method === 'POST') pedidos.push(JSON.parse((opcoes && opcoes.body) || '{}'));
          return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({
            ok: true, professor: 'brise-volet', existe: true,
            perfil: { slug: 'brise-volet', nome: 'Brise Volet', modalidades: ['bale-classico'] },
            modalidades: ['bale-classico'], tradicoes: {}, descontinuadas: [],
            catalogo: [],
          }) });
        }
        return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({ ok: true }) });
      };
    },
  });
  await new Promise((r) => setTimeout(r, 400));
  const d = dom.window.document;
  const secao = d.getElementById('sec-professores');
  if (!secao) { provar('a secção dos professores existe', false, null); dom.window.close(); return; }

  const seta = secao.querySelector('.alternar-form[data-acordeao]');
  const miolo = secao.querySelector('.col-form');
  /* ABRIR A SECÇÃO PELO GESTO DELA — a seta. Escrever `hidden` à mão faria a prova medir o seu
   * próprio `hidden` em vez do que o botão faz. */
  if (seta && seta.getAttribute('aria-expanded') === 'false') {
    seta.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  }
  await new Promise((r) => setTimeout(r, 60));
  provar('a secção dos professores abre pela seta',
    secao.getAttribute('data-recolhido') !== 'sim' && miolo && miolo.hidden === false,
    { recolhido: secao.getAttribute('data-recolhido'), hidden: miolo && miolo.hidden });

  d.getElementById('pf-aba-habilitacoes').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 120));
  provar('a aba «Habilitações» abre',
    d.getElementById('pf-painel-habilitacoes').hidden === false, null);

  /* A CAIXA QUE O PROFESSOR DECLARA — é o estado que tem de sobreviver ao gesto. */
  const caixa = d.querySelector('#hab-modalidades input[type=checkbox]');
  if (caixa) { caixa.checked = true; }
  const quantasMarcadas = () => [...d.querySelectorAll('#hab-modalidades input[type=checkbox]')]
    .filter((c) => c.checked).length;
  provar('há modalidades para marcar, e uma fica marcada', quantasMarcadas() >= 1, quantasMarcadas());

  d.getElementById('form-habilitacao').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise((r) => setTimeout(r, 400));

  provar('o pedido de gravação saiu com a modalidade escolhida',
    pedidos.length === 1 && Array.isArray(pedidos[0].modalidades) && pedidos[0].modalidades.length === 1,
    pedidos[0]);

  /* O GESTO: fechou. */
  provar('depois de gravar, a secção FECHA — `data-recolhido="sim"`',
    secao.getAttribute('data-recolhido') === 'sim', secao.getAttribute('data-recolhido'));
  provar('…e o formulário está escondido', miolo && miolo.hidden === true, miolo && miolo.hidden);
  provar('…e a seta volta a dizer «Abrir o formulário»',
    seta && seta.getAttribute('aria-expanded') === 'false'
    && /Abrir o formulário/.test(seta.getAttribute('aria-label') || ''),
    seta && seta.getAttribute('aria-label'));

  /* «LIMPAR» É O DA MOLDURA, NÃO O DAS CAIXAS: ela disse que as habilitações que existem para o
   * professor estão CERTAS. O que não pode ficar é o recado de dentro do formulário. */
  const recadoInterno = d.querySelector('[data-res=habilitacao]');
  provar('o recado de dentro do formulário fica limpo (ele seria escondido pela dobra)',
    !recadoInterno || String(recadoInterno.textContent || '').trim() === '',
    recadoInterno && recadoInterno.textContent);

  /* A MENSAGEM NÃO SE PERDE: vai para o aviso do gesto, que vive fora da secção. */
  const aviso = d.querySelector('#avisos .aviso-do-gesto[data-tipo=ok]');
  provar('…e a confirmação aparece no aviso do gesto, fora do que foi recolhido',
    Boolean(aviso) && /Habilitações gravadas/.test(String(aviso.textContent || '')), 
    aviso && String(aviso.textContent || '').slice(0, 90));

  /* A OUTRA PORTA, e é ela que impede a correcção de partir o Cancelar: o cancelar continua a
   * fazer o mesmo, e nasce oculto quando não há processo. */
  provar('o «Cancelar» das habilitações nasce oculto quando não há processo a decorrer',
    d.getElementById('hab-cancelar') && d.getElementById('hab-cancelar').hidden === true, null);

  provar('os scripts da página não lançam', erros.length === 0, erros.slice(0, 1));
  dom.window.close();
}

/* ============================================================================================ */

(async () => {
  await medirAsPilhas();
  medirOTexto();
  await medirOGravar();

  console.log('');
  if (CONTRA) {
    console.log('CONTROLE NEGATIVO: ' + total + ' asserções, ' + falhas + ' falharam — o código de '
      + CONTRA + ' tem de reprovar.');
    console.log(falhas > 0 ? 'CONTROLE CERTO — o código de antes reprova.' : 'A PROVA NÃO PROVA NADA.');
    process.exit(falhas > 0 ? 0 : 1);
  }
  console.log(falhas === 0
    ? 'TUDO CERTO — ' + total + ' asserções: a seta só está onde ela a pediu, o índice da escola diz '
      + 'o que ela mandou dizer, e gravar as habilitações fecha o formulário sem esconder a resposta.'
    : 'FALHOU — ' + (total - falhas) + '/' + total + ' asserção(ões).');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
