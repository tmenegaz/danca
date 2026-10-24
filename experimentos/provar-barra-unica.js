'use strict';

/*
 * provar-barra-unica.js — UMA barra por domínio, desenhada no momento de servir.
 *
 * O DEFEITO (20/10/2026, medido pela pesquisadora a navegar). A barra de navegação era ESCRITA em
 * quatro sítios — o índice da escola, o pacote do ciclo (`gerar_nav`), a porta
 * (`gerar_nav_zero`, congelada na criação da escola) e os Bastidores (`navSistema`) — e cada um
 * era um retrato do dia em que aquela página nasceu. O resultado:
 *
 *   · indo da raiz para a ANAMNESE, a barra voltava à antiga — sem Ciclos, sem Aulas, sem
 *     Planejamento e sem os Bastidores;
 *   · saindo de um formulário («continuar de onde parei»), o mesmo regresso;
 *   · no pacote da turma, «Área do Professor» tinha os três formulários e não tinha a captura em
 *     aula, a harmonização nem o lançamento;
 *   · o pacote não tinha «Bastidores» de todo.
 *
 * A correcção NÃO foi acertar links: foi inverter. A barra passa a ser DADO — o `nav.json` que a
 * montagem publica — e é DESENHADA na ponte de produção, em toda página HTML que ela serve. Uma
 * definição, um desenho, todas as páginas, incluindo as já geradas que nunca serão regeradas.
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   A. O DADO. `publicacao/<escola>/nav.json` existe, tem os cinco grupos e TODOS os href são
 *      absolutos — é o que faz a mesma barra valer dentro do pacote e na porta.
 *   B. O DESENHO AO SERVIR. A mesma página, servida pela ponte, sai com a barra inteira: cinco
 *      grupos, a Área do Professor completa e os Bastidores. Isto é medido em TRÊS páginas que
 *      traziam barras DIFERENTES — a raiz, o pacote e a porta —, e é o coração da prova.
 *   C. A BARRA VELHA NÃO SOBREVIVE. A página do fixture traz, no arquivo, a barra de ontem; o que
 *      sai do Worker é a de hoje. Sem isto, uma página antiga continuaria a mandar.
 *   D. O ITEM DA PÁGINA. Cada página acende um item — e só um.
 *   E. A DEGRADAÇÃO. Sem `nav.json` (ou numa página sem `<nav>`), a ponte serve o que tem e não
 *      estraga nada. Uma barra que falta é um defeito; uma página em branco é um desastre.
 *
 * ÁRVORE DE PROVA: um pacote-zero e duas turmas de mentira, num directório temporário (`--raiz`).
 *
 *   node experimentos/provar-barra-unica.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const FERRAMENTA = path.join(RAIZ, 'tools', 'montar-publicacao.js');

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

const ESCOLA = 'prova-barra';
const PROF = 'prova-professor';
const HOST = 'https://' + ESCOLA + '.example';

function escrever(base, rel, texto) {
  const alvo = path.join(base, rel);
  fs.mkdirSync(path.dirname(alvo), { recursive: true });
  fs.writeFileSync(alvo, texto, 'utf8');
}

/*
 * A BARRA DE ONTEM, escrita à mão no fixture. É a que a pesquisadora viu: três itens na raiz
 * («Sistema Lastro · Área do Professor · Bastidores»), com a Área do Professor reduzida aos três
 * formulários. Se alguma página servida ainda a tiver, a inversão não aconteceu.
 */
const BARRA_DE_ONTEM =
  '<nav class="topnav" aria-label="Navegação">\n' +
  '  <a class="ativo" href="index.html">Sistema Lastro</a>\n' +
  '  <details class="menu"><summary>Área do Professor</summary><div class="submenu">\n' +
  '    <a href="/anamnese/?professor=prova&escola=' + ESCOLA + '&ciclo=01">Anamnese do aluno</a>\n' +
  '    <a href="/plano-ensino/?professor=prova&escola=' + ESCOLA + '&ciclo=01">Plano de ensino</a>\n' +
  '    <a href="/plano-observacao/?professor=prova&escola=' + ESCOLA + '&ciclo=01">Plano de Observação</a>\n' +
  '  </div></details>\n' +
  '  <details class="menu"><summary>Bastidores</summary><div class="submenu">\n' +
  '    <a href="/bastidores/producao">Produção</a>\n' +
  '  </div></details>\n' +
  '</nav>';

/** Um `<nav>` mais uma marca, para a página não ser só a barra. */
const pagina = (corpo) => '<!DOCTYPE html><html lang="pt-BR"><head><title>x</title></head><body>\n'
  + corpo + '\n<main><h1>Documento</h1></main></body></html>\n';

/**
 * A ÁRVORE. O pacote-zero traz a apresentação (com a barra de ontem) e a porta (com a barra de
 * ontem também — é o retrato congelado na criação da escola). Cada turma traz o que o menu lê: o
 * `.conf` com o `NOME`, o `ciclos.json` com as aulas, e as páginas que os links apontam.
 */
function arvore() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'barra-unica-'));
  const ciclos = path.join('professores', PROF, 'ciclos');
  const zero = path.join(ciclos, 'ciclo-01-' + ESCOLA);

  escrever(raiz, path.join(zero, 'index.html'), pagina(BARRA_DE_ONTEM));
  escrever(raiz, path.join(zero, 'assets', 'style.css'), 'body{}\n');
  escrever(raiz, path.join(zero, 'assets', 'favicon.svg'), '<svg/>\n');
  /*
   * A PORTA precisa do seu CONTEÚDO (`plano/`, `po/`, `conteudo/`), e não só do `index.html`:
   * sem ele a ponte serve o erro — e com razão. A prova COPIA a porta verdadeira do repositório
   * e substitui-lhe o `index.html` pela página com a barra de ontem: é exactamente o estado de
   * uma escola criada antes desta correcção, cuja porta ficou congelada com a barra do dia em
   * que nasceu. É essa a página que o professor abre em `/plano-observacao/`.
   */
  fs.cpSync(path.join(RAIZ, 'porta'), path.join(raiz, zero, 'plano-observacao'),
    { recursive: true });
  escrever(raiz, path.join(zero, 'plano-observacao', 'index.html'),
    pagina('<div data-tela="porta">' + BARRA_DE_ONTEM + '</div>'));
  escrever(raiz, path.join(ciclos, 'ciclo-01-' + ESCOLA + '.conf'), 'ESCOLA="Prova Barra"\n');

  const turma = (variante, nome, total) => {
    const pacote = path.join(ciclos, 'ciclo-01-' + ESCOLA + '-' + variante);
    escrever(raiz, path.join(pacote, 'index.html'), pagina(BARRA_DE_ONTEM));
    for (const p of ['plano', 'aula-01', 'captura-aula-01', 'harmonizacao', 'lancamento',
      'glossario-benesh', 'notacao', 'referencias']) {
      escrever(raiz, path.join(pacote, p + '.html'), pagina(BARRA_DE_ONTEM));
    }
    escrever(raiz, path.join(pacote, 'ciclos.json'), JSON.stringify({
      ciclos: [{ id: '01', escola: 'Prova Barra', inicio: '2026-10-20', fim: '2026-12-17',
        total_aulas: total, duracao_min: 60,
        aulas: [{ n: '01', lancada: false }] }],
    }, null, 2) + '\n');
    escrever(raiz, path.join(ciclos, 'ciclo-01-' + ESCOLA + '-' + variante + '.conf'),
      'NOME="Ciclo 01 — Prova Barra · ' + nome + '"\n');
  };
  turma('nivel-1', 'Balé Nível 1', 18);
  turma('nivel-2', 'Balé Nível 2', 12);
  return raiz;
}

/** O ASSETS da escola: a pasta publicada, servida como o Cloudflare a serve. */
const TIPOS = { '.html': 'text/html;charset=utf-8', '.json': 'application/json',
  '.css': 'text/css', '.svg': 'image/svg+xml' };

function assetsDe(pub) {
  return {
    async fetch(pedido) {
      const url = new URL(typeof pedido === 'string' ? pedido
        : pedido instanceof URL ? pedido.href : pedido.url);
      let alvo = path.join(pub, decodeURIComponent(url.pathname));
      if (fs.existsSync(alvo) && fs.statSync(alvo).isDirectory()) alvo = path.join(alvo, 'index.html');
      if (!fs.existsSync(alvo) || !fs.statSync(alvo).isFile()) {
        return new Response('', { status: 404 });
      }
      return new Response(fs.readFileSync(alvo), {
        status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(alvo)] || 'application/octet-stream' },
      });
    },
  };
}

const barraDe = (html) => (/<nav class="topnav"[\s\S]*?<\/nav>/.exec(html) || [''])[0];

/** Os rótulos de topo da barra, na ordem em que aparecem. */
function gruposDa(html) {
  const nav = barraDe(html);
  if (!nav) return [];
  return [...nav.matchAll(/<summary>([^<]+)<\/summary>|<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/g)]
    .map((m) => (m[1] || m[2] || '').trim())
    .filter(Boolean);
}

/** Os hrefs de uma barra, sem repetição e por ordem. */
function hrefsDa(html) {
  const nav = barraDe(html);
  if (!nav) return [];
  return [...new Set([...nav.matchAll(/href="([^"]*)"/g)].map((m) => m[1]))];
}

/**
 * A COLUNA — e é ela que passou a ser o menu (23/10/2026).
 *
 * `gruposDa` lê `<summary>`, que é a forma da barra antiga. A coluna não tem `summary`: tem um
 * `<button class="coluna-titulo">` por grupo, e os destinos por baixo. Duas formas no mesmo
 * ficheiro, uma função para cada — e as provas dizem qual estão a medir, em vez de darem por
 * boa uma leitura vazia (`[]` em `.every` PASSA, e foi assim que uma versão anterior desta
 * prova se dava por certa sem ter medido nada).
 */
function colunaDe(html) {
  const m = /<aside class="coluna"[\s\S]*?<\/aside>/.exec(html || '');
  return m ? m[0] : null;
}

/**
 * Os DESTINOS DE TOPO da coluna, por ordem: os grupos e os directos.
 *
 * «Aulas» é um `<a class="coluna-direto">` — destino e não pasta —, e uma leitura que só
 * procurasse `<button class="coluna-titulo">` perdia-o. Foi o que aconteceu à primeira versão
 * destes leitores, e a asserção deu por falta o menu certo. Uma coluna tem as duas coisas, e é
 * preciso ler as duas.
 */
function titulosDaColuna(html) {
  const c = colunaDe(html);
  if (!c) return [];
  const saida = [];
  const re = /<button type="button" class="coluna-titulo"[^>]*><span>([^<]+)<\/span>|<a[^>]*class="coluna-direto[^"]*"[^>]*>([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(c))) {
    const texto = (m[1] || m[2] || '').trim();
    if (texto) saida.push(texto);
  }
  return saida;
}

/**
 * Os DESTINOS da coluna, por ordem, com o grupo a que pertencem.
 *
 * Uma coluna é uma lista de títulos e de links. O que interessa a esta prova é o conjunto de
 * destinos — «o mesmo menu em todas as páginas» —, e não a forma: um `<a class="coluna-direto">`
 * é destino ele próprio; um `<div class="coluna-grupo">` traz os seus.
 */
function destinosDaColuna(html) {
  const c = colunaDe(html);
  if (!c) return [];
  const corpo = c.replace(/^[\s\S]*?<nav>/, '').replace(/<\/nav>[\s\S]*$/, '');
  const saida = [];
  // Divide pelos grupos, para cada link ficar com o título de cima.
  const partes = corpo.split(/<div class="coluna-grupo"/).filter(Boolean);
  for (const parte of partes) {
    const titulo = (/<span>([^<]+)<\/span>/.exec(parte) || [])[1] || '';
    if (!titulo) {
      // Antes do primeiro grupo: são os destinos DIRECTOS («Aulas»).
      for (const m of parte.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/g)) {
        saida.push({ grupo: null, rotulo: m[2].trim(), href: m[1] });
      }
      continue;
    }
    const itens = [...parte.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/g)]
      .map((m) => ({ grupo: titulo.trim(), rotulo: m[2].trim(), href: m[1] }));
    saida.push({ grupo: titulo.trim(), rotulo: titulo.trim(), href: null }, ...itens);
  }
  return saida;
}

function itensDa(html, grupo) {
  const nav = barraDe(html);
  const m = new RegExp('<summary>' + grupo + '</summary>([\\s\\S]*?)</details>').exec(nav);
  if (!m) return [];
  return [...m[1].matchAll(/<a[^>]*>([^<]+)<\/a>/g)].map((x) => x[1].trim());
}

async function principal() {
  const raiz = arvore();
  try {
    const saida = execFileSync(process.execPath, [FERRAMENTA, ESCOLA, '--raiz', raiz],
      { encoding: 'utf8', cwd: raiz });
    const pub = path.join(raiz, 'publicacao', ESCOLA);
    checar('a montagem corre e diz o que publicou', saida.indexOf(ESCOLA) !== -1, saida.trim());

    // ── A. O DADO ────────────────────────────────────────────────────────────────────────
    console.log('\nA. O MENU COMO DADO (`nav.json`)');
    const arquivoDoMenu = path.join(pub, 'nav.json');
    checar('a montagem publica o `nav.json` ao lado das páginas', fs.existsSync(arquivoDoMenu));
    const menu = JSON.parse(fs.readFileSync(arquivoDoMenu, 'utf8'));
    /* A VERSÃO SUBIU PARA 2 EM 23/10/2026, quando o menu ganhou `coluna` e `barra`. O que a
       asserção guarda continua a ser o mesmo: o dia em que a forma mudar outra vez, o desenho
       tem de saber com o que fala. */
    checar('o menu tem versão — o dia em que a forma mudar, o desenho sabe com o que fala',
      menu.versao >= 1, menu.versao);
    checar('e a versão 2 traz as duas partes: a coluna e a barra',
      Array.isArray(menu.coluna) && Array.isArray(menu.barra), Object.keys(menu));

    const hrefsDoMenu = [];
    const colher = (g) => (g.tipo === 'menu' ? (g.itens || []).forEach((i) => hrefsDoMenu.push(i.href))
      : hrefsDoMenu.push(g.href));
    [...(menu.coluna || []), ...(menu.barra || [])].forEach(colher);
    checar('todos os href do menu são absolutos (é o que o torna válido em qualquer página)',
      hrefsDoMenu.every((h) => /^\//.test(h)), hrefsDoMenu.filter((h) => !/^\//.test(h)));

    /* OS DESTINOS SÃO DOZE, E NENHUM DELES É UM DOCUMENTO (23/10/2026).
       A asserção antiga procurava «Sistema Lastro» como grupo do menu. Ele deixou de ser um
       item de lista: é a MARCA da coluna, que leva à raiz — e um menu que repete a marca na
       lista é um item a dizer o que o topo já diz. */
    const rotulos = [...(menu.coluna || []), ...(menu.barra || [])].map((g) => g.rotulo);
    for (const grupo of ['Ciclos', 'Planejamento', 'Área do Professor', 'Bastidores']) {
      checar('o menu tem «' + grupo + '»', rotulos.indexOf(grupo) !== -1, rotulos);
    }
    /* «AULAS» DEIXOU DE SER UM DESTINO DO TOPO (24/10/2026). Ela era um `tipo: 'link'` na coluna
       — e o mesmo URL aparecia outra vez dentro da Área do Professor. Dois itens para a mesma
       página: a pesquisadora viu-os como aquilo que eram. A lista ficou dentro do grupo, e a
       asserção passou a medir isso em vez de medir a existência do destino. */
    checar('«Aulas» já NÃO é um destino directo no topo da coluna',
      !(menu.coluna || []).some((g) => g.rotulo === 'Aulas'),
      (menu.coluna || []).filter((g) => g.rotulo === 'Aulas'));
    checar('…e nenhum grupo da coluna é `tipo: link` (só há grupos a abrir)',
      (menu.coluna || []).every((g) => g.tipo === 'menu'),
      (menu.coluna || []).filter((g) => g.tipo !== 'menu').map((g) => g.rotulo));
    checar('«Bastidores» está na BARRA, e não na coluna',
      (menu.barra || []).some((g) => g.rotulo === 'Bastidores')
        && !(menu.coluna || []).some((g) => g.rotulo === 'Bastidores'));

    const area = (menu.coluna || []).find((g) => g.rotulo === 'Área do Professor') || { itens: [] };
    const areaRotulos = area.itens.map((i) => i.rotulo);
    for (const item of ['Anamnese', 'Plano de ensino', 'Plano de Observação', 'Aulas']) {
      checar('a Área do Professor inclui «' + item + '»',
        areaRotulos.some((r) => r.indexOf(item) === 0), areaRotulos);
    }
    /* O RÓTULO ANTIGO NÃO VOLTA (24/10/2026). «Lançamento de aula» prometia um formulário e
       entregava uma lista — as mesmas aulas que o lançamento e a captura servem, uma linha de
       cada vez. O nome passou a ser o do acervo; o documento (`lancamento.html`) continua a
       chamar-se «Lançamento de aula — formulário eletrônico», porque ele É o formulário. */
    checar('…e já não diz «Lançamento de aula» (o item abre a LISTA, não um formulário)',
      !areaRotulos.some((r) => r.indexOf('Lançamento') === 0), areaRotulos);
    /* E NÃO INCLUI O QUE SAIU — a asserção é INVERTIDA em vez de apagada, porque o que se mede
       continua a ser o mesmo: que o menu não carregue documentos. A harmonização passou a viver
       na Produção (é assunto da direção), e a captura para impressão é uma AÇÃO da linha da
       aula, na lista de aulas. */
    for (const saiu of ['Harmonização', 'Captura em aula']) {
      checar('a Área do Professor já NÃO inclui «' + saiu + '» (saiu do menu)',
        !areaRotulos.some((r) => r.indexOf(saiu) === 0), areaRotulos);
    }
    checar('nenhum item do menu tem o nome de uma turma',
      !/Balé Nível|bale-nivel/.test(JSON.stringify(menu)), null);
    checar('e a Área do Professor tem QUATRO itens, com duas turmas ou com três',
      area.itens.length === 4, areaRotulos);

    // ── B. O DESENHO AO SERVIR ───────────────────────────────────────────────────────────
    console.log('\nB. A MESMA BARRA EM TODAS AS PÁGINAS (desenhada pela ponte)');
    const producao = require('../motor/servidor/producao.js');
    // A Área do Professor só abre com professor cadastrado — o freio é do produto, não do teste.
    const env = { ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', PROFESSOR_NOME: 'Sapo Bailarino',
      ASSETS: assetsDe(pub) };

    const paginas = [
      ['a raiz', '/'],
      ['a apresentação', '/sistema.html'],
      ['o pacote da turma', '/nivel-1/plano.html'],
      ['a porta', '/plano-observacao/'],
      // A PÁGINA DE ESCOLHA DE TURMA (23/10/2026): o menu passou a apontar para ela, e não para
      // a porta. É onde «Área do Professor» se acende.
      ['a escolha de turma do PO', '/area-do-professor/plano-de-observacao/'],
    ];
    const medidas = [];
    for (const [nome, caminho] of paginas) {
      const r = await producao.fetch(new Request(HOST + caminho), env);
      const html = await r.text();
      medidas.push({ nome, caminho, status: r.status, html });
      const grupos = gruposDa(html);      // a barra
      const titulos = titulosDaColuna(html);  // a coluna
      checar(nome + ' é servida (200)', r.status === 200, r.status);
      checar(nome + ' tem UMA barra, e não duas',
        (html.match(/<nav class="topnav"/g) || []).length === 1,
        (html.match(/<nav class="topnav"/g) || []).length);
      /* UMA COLUNA, e não duas. A ponte passou a tirar a coluna que a página já trazia antes de
         desenhar a nova (`nav.aplicar`); sem isso, cada passagem — a montagem, e depois o Worker
         a servir — deixava uma ao lado da outra. */
      checar(nome + ' tem UMA coluna, e não duas',
        (html.match(/<aside class="coluna"/g) || []).length === 1,
        (html.match(/<aside class="coluna"/g) || []).length);
      /* TRÊS GRUPOS DE TRABALHO, e não quatro (24/10/2026): «Aulas» deixou de ser um destino do
         topo da coluna — ela está DENTRO da Área do Professor, onde o trabalho acontece. O
         número dos grupos é o do `nav.json`, e não uma lista escrita à mão. */
      const gruposDeTrabalho = (menu.coluna || []).map((g) => g.rotulo);
      checar(nome + ' tem os grupos de trabalho do menu na coluna',
        gruposDeTrabalho.every((g) => titulos.indexOf(g) !== -1), { esperados: gruposDeTrabalho, titulos });
      /* O BASTIDORES ESTÁ NOS DOIS SÍTIOS, E ISSO É A REGRA (23/10/2026). Na BARRA ele é o
         único item do canto direito, e é o que o computador mostra. Na COLUNA ele entra como
         último bloco da FOLHA — sem ele, no telefone ficava inalcançável, porque a lista da
         barra não se mostra e quem navega é a folha. Quem o esconde na coluna do computador é
         o CSS (`.coluna-fora`), não o desenho: é o mesmo HTML para as duas formas, e é a
         largura que decide qual delas está em vigor.
         A asserção era «na barra E NÃO na coluna», e passou a guardar o contrário — com a
         razão, para a próxima sessão não a «corrigir» de volta. */
      checar(nome + ' tem os Bastidores na BARRA (o canto direito do computador)',
        grupos.indexOf('Bastidores') !== -1, { barra: grupos });
      checar(nome + ' …e também no FIM da folha (senão no telefone não há como chegar lá)',
        titulos.indexOf('Bastidores') === titulos.length - 1, { coluna: titulos });
      const area2 = destinosDaColuna(html).filter((d) => d.grupo === 'Área do Professor').map((d) => d.rotulo);
      checar(nome + ' tem a Área do Professor com quatro destinos',
        ['Anamnese do aluno', 'Plano de ensino', 'Plano de Observação', 'Aulas']
          .every((x) => area2.indexOf(x) !== -1), area2);
    }

    // A IGUALDADE, e não só a presença: quatro páginas com o MESMO menu é o que o produto pede.
    const referência = destinosDaColuna(medidas[0].html).map((d) => d.href).join('|');
    for (const m of medidas.slice(1)) {
      checar('a coluna de ' + m.nome + ' é IDÊNTICA à da raiz (mesmos href, mesma ordem)',
        destinosDaColuna(m.html).map((d) => d.href).join('|') === referência);
    }

    // Nenhum link da barra pode estar morto: uma barra que anuncia o que não existe é um menu
    // que mente — e é pior do que não o anunciar.
    const mortos = [];
    const hrefsDeTudo = destinosDaColuna(medidas[0].html).map((d) => d.href)
      .concat(hrefsDa(medidas[0].html)).filter(Boolean);
    for (const href of hrefsDeTudo) {
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const limpo = href.split('#')[0].split('?')[0];
      if (/^\/(anamnese|plano-ensino|plano-observacao|bastidores)/.test(limpo)) continue; // a porta
      let alvo = path.join(pub, decodeURIComponent(limpo));
      if (fs.existsSync(alvo) && fs.statSync(alvo).isDirectory()) alvo = path.join(alvo, 'index.html');
      if (!fs.existsSync(alvo)) mortos.push(href);
    }
    checar('nenhum link da barra aponta para um arquivo que não existe', mortos.length === 0, mortos);

    // ── C. A BARRA DE ONTEM NÃO SOBREVIVE ────────────────────────────────────────────────
    console.log('\nC. A BARRA VELHA NÃO CHEGA AO NAVEGADOR');
    // O arquivo publicado em disco já traz a barra de hoje: o site continua certo mesmo servido
    // sem a ponte (um `file://`, um pré-visualizador, um Worker com o `run_worker_first` off).
    const naRaiz = fs.readFileSync(path.join(pub, 'nivel-1', 'plano.html'), 'utf8');
    checar('o arquivo publicado em disco já traz a coluna de hoje (o site continua certo sem Worker)',
      titulosDaColuna(naRaiz).indexOf('Ciclos') !== -1, titulosDaColuna(naRaiz));

    /*
     * E A PONTE É A SEGUNDA CINTURA. O caso real que isto cobre: uma página gerada DEPOIS da
     * última montagem — o pacote que o `gerar-ciclo` produziu, a porta que o `criar-escola`
     * congelou — chega ao ASSETS com a barra do dia em que nasceu. Se a barra só fosse corrigida
     * pela montagem, essas páginas voltariam a mostrar a velha. Planta-se a barra de ontem num
     * arquivo publicádo e mede-se o que sai do Worker: se sair a de hoje, quem a desenhou foi a
     * ponte. E a contraprova fica registada — o arquivo em disco continua com a velha.
     */
    const atrasada = path.join(pub, 'nivel-2', 'aula-01.html');
    fs.writeFileSync(atrasada, pagina(BARRA_DE_ONTEM), 'utf8');
    checar('a página plantada tem MESMO a barra de ontem em disco (é a contraprova)',
      titulosDaColuna(fs.readFileSync(atrasada, 'utf8')).indexOf('Ciclos') === -1);
    const tarde = await producao.fetch(new Request(HOST + '/nivel-2/aula-01.html'), env);
    const htmlTarde = await tarde.text();
    checar('e a ponte serve-a com o menu de HOJE — é a ponte que o desenha, não o arquivo',
      titulosDaColuna(htmlTarde).indexOf('Ciclos') !== -1, titulosDaColuna(htmlTarde));
    checar('a página atrasada também ganha os Bastidores',
      gruposDa(htmlTarde).indexOf('Bastidores') !== -1, gruposDa(htmlTarde));

    // ── D. O ITEM DA PÁGINA ──────────────────────────────────────────────────────────────
    console.log('\nD. CADA PÁGINA ACENDE O SEU ITEM — E SÓ UM');
    // A apresentação (`sistema.html`) NÃO é um item do menu — ela é o documento ao qual a raiz
    // dá acesso. Aí não se acende nada, e é honesto: dizer «estás aqui» num sítio que a barra
    // não anuncia seria pior. Nas páginas que SÃO um item, acende-se um e um só.
    /* O SINAL MUDOU DE LUGAR (23/10/2026). Na barra de `details` o item aceso dizia «estás
       aqui» e via-se ao abrir o grupo. Na coluna COMPACTA o grupo nasce fechado, e o item aceso
       ficaria escondido lá dentro: quem responde «estás aqui» é o GRUPO (`data-atual`), e é o
       que o desenho pinta com o filete de ouro.
       A raiz e a apresentação não são destino nenhum do menu — e aí não se marca nada, que é
       honesto: dizer «estás aqui» num sítio que o menu não anuncia seria pior. */
    for (const m of medidas) {
      const marcados = [...(colunaDe(m.html) || '').matchAll(/<div class="coluna-grupo" data-atual="sim">/g)];
      const acesos = [...(colunaDe(m.html) || '').matchAll(/aria-current="page"/g)];
      if (/^\/(sistema|$)/.test(m.caminho)) {
        checar(m.nome + ' não marca nenhum grupo (não é um destino do menu)', marcados.length === 0, marcados.length);
      } else if (/^\/nivel-1|^\/plano-observacao/.test(m.caminho)) {
        /* A página do PACOTE e a PORTA não são destinos do menu: o plano de uma turma chega-se
           pela lista de planos, e o formulário chega-se pela página de escolha de turma — que é
           quem leva o contexto. Nada se marca, e o caminho na barra diz em que documento se
           está. (Antes de 23/10/2026 a porta era o destino, e marcava; deixou de o ser.) */
        checar(m.nome + ' não marca grupo (chega-se pela lista)', marcados.length === 0, marcados.length);
      } else {
        checar(m.nome + ' marca exactamente um grupo', marcados.length === 1, marcados.length);
      }
      checar(m.nome + ' não acende mais do que um item da coluna', acesos.length <= 1, acesos.length);
    }
    const daEscolha = medidas.find((m) => /area-do-professor/.test(m.caminho));
    checar('a escolha de turma acende «Área do Professor»',
      /<div class="coluna-grupo" data-atual="sim">\s*<button[^>]*><span>Área do Professor<\/span>/
        .test(colunaDe(daEscolha.html) || ''), colunaDe(daEscolha.html).slice(0, 200));

    const caminhoDaRaiz = (colunaDe(medidas[0].html) || '').length
      ? (barraDe(medidas[0].html).match(/class="doc-atual"[^>]*>([\s\S]*?)<\/span>/) || [])[1] : '';
    checar('a barra da raiz diz em que documento se está',
      /Sistema Lastro/.test(String(caminhoDaRaiz).replace(/<[^>]*>/g, '')), caminhoDaRaiz);

    // ── D2. O BLOCO QUE A PÁGINA PUNHA ANTES DO ☰ SOBREVIVE ─────────────────────────────
    //
    // A Produção não tem só a lista de links: entre a marca e o ☰ ela traz o `s5-sessao` (o
    // caminho «Pedagogia · Turmas») e o `s5-secoes` (o botão que abre a folha), que o
    // `sessaoNaBarra()` do `bastidores.js` entrega ao construtor da barra como `extras`. Eles
    // não estão no `nav.json` — são o estado da página, não a lista.
    //
    // Quando a barra passou a ser DESENHADA ao servir, o desenho passou a ser um só e apagou o
    // que não conhecia: a Produção deixou de ter as duas peças. O sintoma foi o relatado —
    // rolar a página deixou de levar o caminho para a barra, porque as peças que ele acende já
    // não existiam no HTML.
    console.log('\nD2. O BLOCO DA PÁGINA ENTRE A MARCA E O ☰ NÃO SE PERDE');
    const { extrasDaBarra, aplicar } = require('../motor/nucleo/nav.js');
    const menuDaProva = { grupos: [{ rotulo: 'Sistema Lastro', href: '/', tipo: 'link' }] };
    const COM_EXTRAS = '<nav class="topnav"><a class="marca" href="/"><span><svg></svg></span></a>\n'
      + '  <span class="s5-sessao" id="s5-sessao">Produção · Painel</span>'
      + '<button type="button" class="s5-secoes" id="s5-secoes">Seções</button>\n'
      + '  <button class="hamburger"><span></span></button>'
      + '<div class="nav-links" id="nav-links">velho</div></nav>';
    checar('o bloco é lido do `<nav>`, entre a marca e o ☰',
      /s5-sessao/.test(extrasDaBarra(COM_EXTRAS)) && /s5-secoes/.test(extrasDaBarra(COM_EXTRAS)),
      extrasDaBarra(COM_EXTRAS));
    const aplicado = aplicar(pagina(COM_EXTRAS), menuDaProva, '/bastidores/producao');
    checar('…e a barra desenhada volta a trazê-lo, no mesmo lugar',
      /s5-sessao/.test(aplicado) && /s5-secoes/.test(aplicado), null);
    checar('…antes do ☰, que é o que faz o ☰ não andar',
      aplicado.indexOf('s5-secoes') < aplicado.indexOf('class="hamburger"'), null);
    checar('…e a lista velha NÃO sobrevive (o desenho é o de hoje, não o da página)',
      !/velho/.test(aplicado));
    const semExtras = aplicar(pagina(BARRA_DE_ONTEM), menuDaProva, '/');
    checar('numa página sem bloco nada é inventado — o resultado é o de antes',
      !/s5-/.test(semExtras), null);

    // ── E. A DEGRADAÇÃO ──────────────────────────────────────────────────────────────────
    console.log('\nE. SEM MENU, A PÁGINA NÃO SE ESTRAGA');
    // O cache do menu vive no módulo; recarrega-se para exercer o caminho «não há nav.json».
    delete require.cache[require.resolve('../motor/servidor/producao.js')];
    const semMenu = require('../motor/servidor/producao.js');
    const semNav = path.join(raiz, 'sem-nav');
    fs.cpSync(pub, semNav, { recursive: true });
    fs.rmSync(path.join(semNav, 'nav.json'));
    const r = await semMenu.fetch(new Request(HOST + '/nivel-1/plano.html'),
      { ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', PROFESSOR_NOME: 'x', ASSETS: assetsDe(semNav) });
    const html = await r.text();
    checar('sem `nav.json` a página é servida na mesma (200)', r.status === 200, r.status);
    checar('e fica com a barra que trazia — degradar é melhor do que inventar',
      (html.match(/<nav class="topnav"/g) || []).length === 1);
    checar('e o resto da página continua lá', /<main><h1>Documento<\/h1><\/main>/.test(html));

    // Uma página sem `<nav>` nenhum não ganha uma barra do nada: quem não tem barra é porque
    // não a quer (um documento para impressão, por exemplo).
    const semBarra = path.join(raiz, 'sem-barra');
    fs.cpSync(pub, semBarra, { recursive: true });
    escrever(semBarra, 'nivel-1/limpo.html', '<!DOCTYPE html><html><body><p>só texto</p></body></html>\n');
    delete require.cache[require.resolve('../motor/servidor/producao.js')];
    const outro = require('../motor/servidor/producao.js');
    const r2 = await outro.fetch(new Request(HOST + '/nivel-1/limpo.html'),
      { ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', PROFESSOR_NOME: 'x', ASSETS: assetsDe(semBarra) });
    const html2 = await r2.text();
    checar('a uma página sem `<nav>` não se acrescenta uma barra', /<nav/.test(html2) === false);
    checar('e ela sai inteira', /só texto/.test(html2));
  } finally {
    fs.rmSync(raiz, { recursive: true, force: true });
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
