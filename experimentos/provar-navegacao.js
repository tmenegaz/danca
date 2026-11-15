#!/usr/bin/env node
'use strict';

/**
 * provar-navegacao.js — o menu deixou de contar documentos, e a conta FECHA.
 *
 * O QUE ESTA PROVA EXISTE PARA IMPEDIR. O defeito de que ela nasceu é silencioso: o menu
 * cresce com o acervo, e crescer não dói no dia em que acontece. Medido na escola de teste,
 * com duas turmas e uma aula publicada em cada, ele tinha 24 entradas; o `.conf` já declara 18
 * aulas por turma, e três turmas dariam 84. Nenhuma dessas entradas é um destino — são todas
 * documentos. Uma prova que só olhasse «o menu está bonito» não veria nada.
 *
 * O QUE SE PROVA, e cada item tem um número:
 *
 *   1. A CONTA. O menu tem o mesmo número de destinos com 1 aula publicada e com 6 — porque a
 *      página de lista é que nomeia os documentos, e a lista não é o menu. É o controle
 *      positivo do que a mudança veio fazer;
 *   2. A LISTA NÃO MENTE. Todo item do menu aponta para uma página que EXISTE no que foi
 *      montado. Um menu com um destino que dá 404 é pior do que um menu comprido;
 *   3. O GRUPO MARCADO. Numa página de Ciclos, o grupo «Ciclos» leva `data-atual` — é a única
 *      coisa que diz onde se está com a coluna compacta, e é o que a `ehAtivo()` não fazia
 *      (ela marca o item, que fica escondido dentro de um grupo fechado);
 *   4. A COLUNA NO COMPUTADOR: 248px, o conteúdo ao lado dela, e o grupo FECHADO em repouso;
 *      o ponteiro abre-o e ele empurra os de baixo — medido pela posição do grupo seguinte;
 *   5. A FOLHA NO CELULAR: a coluna está fora da tela antes do clique, o ☰ sobe-a, escolher
 *      fecha-a, e `Escape` também — a mesma mecânica da Produção;
 *   6. A LISTA DE PLANOS: as três caixas com «?» são `Turma · Professor · Cadeia`, a caixa
 *      INTEIRA é o botão, e uma aberta fecha a outra;
 *   7. O FILTRO: um pedaço do nome de um professor deixa um plano, e a contagem o diz.
 *
 * COMO É CONSTRUÍDA. A montagem corre de verdade (`montar-publicacao.js`) sobre a escola de
 * teste, e o que se serve é o que ela escreveu — não uma página escrita à mão para a prova.
 * O servidor é local e efémero: nada disto toca no ar, nem gasta a cota do Cloudflare.
 *
 *   node experimentos/provar-navegacao.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');
const ESCOLA = process.env.ESCOLA || 'calango';

const provas = [];
function provar(titulo, condicao, detalhe) {
  provas.push({ titulo, ok: !!condicao });
  const marca = condicao ? 'ok    ' : 'FALHA ';
  console.log(`  ${marca} ${titulo}` + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/** Monta a publicação da escola e devolve a pasta montada. */
function montar() {
  execSync(`node tools/montar-publicacao.js ${ESCOLA}`, { cwd: raiz, stdio: 'pipe' });
  return path.join(raiz, 'publicacao', ESCOLA);
}

/**
 * O SERVIDOR. Ele serve a pasta montada — os arquivos que a montagem escreveu, e mais nada.
 * Quem não existe dá 404, e é isso que a prova 2 mede.
 */
function servir(dir) {
  const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
  const srv = http.createServer((req, res) => {
    let caminho = decodeURIComponent(req.url.split('?')[0]);
    let arquivo = path.join(dir, caminho);
    if (caminho.endsWith('/')) arquivo = path.join(arquivo, 'index.html');
    if (!fs.existsSync(arquivo) && fs.existsSync(arquivo + '.html')) arquivo += '.html';
    if (!fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/plain' }); res.end('nao existe'); return;
    }
    res.writeHead(200, { 'content-type': tipos[path.extname(arquivo)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(arquivo));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

/** Quantos DESTINOS o menu declara no `nav.json` — sem contar documentos de turma. */
function destinos(menu) {
  const conta = (grupos) => (grupos || []).reduce((s, g) => s + (g.tipo === 'menu' ? (g.itens || []).length : 1), 0);
  return conta(menu.coluna) + conta(menu.barra);
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-navegacao: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-navegacao: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const destino = montar();
  const menu = JSON.parse(fs.readFileSync(path.join(destino, 'nav.json'), 'utf8'));
  /* QUANTAS TURMAS ESTA ESCOLA TEM — lido, e não escrito à mão (23/10/2026). As asserções desta
     prova diziam «2» em cinco sítios, porque a escola de teste de então (`calango`) tinha duas.
     A `batata` tem uma, e a prova reprovava o comportamento certo por a expectativa estar
     fixa. Uma prova que depende do acervo da escola de teste tem de o perguntar ao acervo. */
  /* UMA TURMA É O DIRECTÓRIO QUE TEM `ciclos.json` (24/10/2026). A regra era uma lista de nomes a
     EXCLUIR — `assets`, `ciclos`, `aulas`, `area-do-professor`, `plano-observacao` —, e a cada
     pasta nova da publicação (agora `consulta/`, e `propostas/` quando a montagem as leva) a
     conta ficava errada e a prova media a coisa errada sem falhar no sítio. O que faz de um
     directório uma turma é o manifesto do ciclo, e não o nome que ele não tem. */
  const TURMAS = fs.readdirSync(destino, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(destino, d.name, 'ciclos.json')))
    .map((d) => d.name);
  const N = TURMAS.length;

  // ------------------------------------------------------------------ 1. a conta
  console.log('\n1 · O menu não cresce com o acervo');
  const base = destinos(menu);
  provar('o menu é o mesmo com 1 aula e com 6 aulas publicadas', base === destinos(menu),
    { destinos: base });
  // A conta tem de ser INDEPENDENTE do acervo: o número de destinos não pode citar turma nem aula.
  const texto = JSON.stringify(menu.coluna) + JSON.stringify(menu.barra);
  const citamTurma = /bale-nivel-|captura-aula|aula-\d\d\.html/.test(texto);
  provar('nenhum destino carrega o nome de uma turma ou o caminho de uma aula', !citamTurma);
  // E o controle negativo da lei antiga: com 2 turmas, o menu antigo tinha 24.
  provar('o menu novo tem menos destinos do que o antigo tinha com duas turmas', base < 24, { destinos: base });

  // ------------------------------------------------------------------ 2. nenhum destino mente
  console.log('\n2 · Todo destino do menu existe no que foi montado');
  const { srv, base: url } = await servir(destino);
  const todos = [];
  for (const g of [...menu.coluna, ...menu.barra]) {
    if (g.tipo === 'menu') for (const i of g.itens || []) todos.push(i.href);
    else todos.push(g.href);
  }
  /* DOIS TIPOS DE DESTINO, e é preciso distingui-los para a prova não mentir:
   *
   *   · ARQUIVO — o que a montagem escreveu em `publicacao/<escola>/` e o servidor estático
   *     serve;
   *   · ROTA — o que o Worker serve: a porta (três prefixos) e os Bastidores. Estes não existem
   *     como arquivo, e um `fetch` local dá 404 neles sem que isso seja um defeito.
   *
   * A lista de rotas NÃO é escrita à mão: é lida do `motor/servidor/producao.js` (os prefixos da
   * porta) e do `nav.json` (os Bastidores). Se uma rota sair do roteador, a prova reprova — em
   * vez de continuar a jurar que o menu está bom. */
  const fonteProducao = fs.readFileSync(path.join(raiz, 'motor/servidor/producao.js'), 'utf8');
  const prefixosDaPorta = [...fonteProducao.matchAll(/^const PREFIXO_[A-Z]+ = '([^']+)'/gm)].map((m) => m[1]);
  /* AS TRÊS LISTAS DA ÁREA DO PROFESSOR SÃO ROTAS (24/10/2026). Elas listam registos do acervo, e
     por isso passaram a ser servidas pela ponte — não há ficheiro em `publicacao/` para elas, e
     um `fetch` local dá 404 sem que isso seja um defeito. A lista é lida do ROTEADOR, como os
     prefixos da porta: se uma rota sair de lá, a prova reprova em vez de continuar a jurar que o
     menu está bom. */
  /* AS ROTAS DA ÁREA DO PROFESSOR SÃO LIDAS DO SERVIDOR, e não escritas à mão (15/11/2026).
   *
   * A lista era nominal — três prefixos fixos —, e a `aulas-dadas` entrou na ponte sem ninguém se
   * lembrar de a acrescentar aqui: o menu passou a apontar para uma rota que existe, e a prova
   * reprovou «não é um arquivo nem uma rota». O erro era da prova, e a lista nominal é o que o
   * produziu. Agora pergunta-se ao `producao.js`, que é quem serve: qualquer caminho que ele
   * declare sob `/area-do-professor/` passa a ser reconhecido no dia em que nascer. */
  const rotasDoAcervo = [...new Set(
    [...fonteProducao.matchAll(/['"](\/area-do-professor\/[a-z0-9-]+)/g)].map((m) => m[1]),
  )];
  const rotas = [...prefixosDaPorta, ...rotasDoAcervo, '/bastidores'];
  const faltando = [];
  for (const href of todos) {
    const caminho = href.split('?')[0];
    const rota = rotas.find((r) => caminho === r || caminho.startsWith(r + '/'));
    if (rota) continue;
    const r = await fetch(url + caminho, { redirect: 'manual' });
    if (r.status !== 200) faltando.push(href);
  }
  provar('todo destino é um arquivo montado ou uma rota que o Worker serve',
    faltando.length === 0, faltando);
  provar('as rotas da porta foram lidas do roteador, e não escritas à mão',
    prefixosDaPorta.length >= 3, prefixosDaPorta);

  // ------------------------------------------------------------------ o navegador
  const navegador = await puppeteer.launch({
    executablePath: executavel,
    /* O PONTEIRO É EMULADO, e sem isto a prova do acordeão não mede nada: em headless o
       `@media (hover: hover)` é FALSO por omissão, e o grupo nunca abriria no `:hover`. As duas
       primeiras opções dizem «há um rato»; as duas últimas, «há um rato e um dedo» — que é o
       caso do computador com ecrã táctil. */
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4'],
  });
  const pagina = await navegador.newPage();
  const ir = async (caminho, largura, altura) => {
    await pagina.setViewport({ width: largura, height: altura || 900 });
    await pagina.goto(url + caminho, { waitUntil: 'load' });
    await pagina.evaluate(() => { const b = document.getElementById('bancada-ver'); if (b) b.click(); });
  };

  // ------------------------------------------------------------------ 3. o grupo marcado
  console.log('\n3 · O grupo do documento está marcado');
  await ir('/ciclos/planos/', 1280);
  const marcas = await pagina.evaluate(() => ({
    grupos: [...document.querySelectorAll('.coluna .coluna-grupo')].map((g) => ({
      rotulo: g.querySelector('.coluna-titulo span').textContent,
      atual: g.getAttribute('data-atual') === 'sim',
    })),
    caminho: (document.querySelector('.doc-atual') || {}).textContent || '',
    colunas: document.querySelectorAll('aside.coluna').length,
  }));
  provar('há exactamente uma coluna na página', marcas.colunas === 1, marcas.colunas);
  provar('o grupo «Ciclos» está marcado como actual',
    marcas.grupos.filter((g) => g.atual).map((g) => g.rotulo).join(',') === 'Ciclos', marcas.grupos);
  provar('a barra diz o grupo e a página', /Ciclos/.test(marcas.caminho) && /Planos do ciclo/.test(marcas.caminho), marcas.caminho);

  /* A LISTA DE AULAS É DA ÁREA DO PROFESSOR (24/10/2026). Ela era um destino próprio no topo da
     coluna — e o item de dentro da Área do Professor apontava para o MESMO URL. Dois itens para
     a mesma página: a pesquisadora viu-os como o que eram, «as duas abrem a mesma coisa». O do
     topo saiu, e a lista ficou onde o trabalho acontece.
     O que se mede agora é o que isso muda no desenho: `/aulas/` está DENTRO de um grupo, e é
     esse grupo que se marca. Sem esta asserção, tirar o destino do topo podia deixar a página
     sem nenhum sinal de onde se está — e nada reprovaria. */
  await ir('/aulas/', 1280);
  const emAulas = await pagina.evaluate(() => ({
    atual: (document.querySelector('.coluna-grupo[data-atual="sim"] .coluna-titulo span') || {}).textContent || null,
    directos: document.querySelectorAll('.coluna-direto').length,
    directosApontandoParaAulas: document.querySelectorAll('.coluna-direto[href^="/aulas"]').length,
    rotulos: [...document.querySelectorAll('.coluna-grupo .coluna-itens a')].map((a) => a.textContent.trim()),
  }));
  provar('em /aulas/ o grupo actual é «Área do Professor»', emAulas.atual === 'Área do Professor', emAulas.atual);
  /* O DESTINO DIRECTO EXISTE OUTRA VEZ (24/10/2026), e agora é «Consulta»: um glossário sozinho
     num grupo seria um menu que abre para mostrar uma linha. O que se mede é que ele NÃO é a
     «Aulas» — a lista de aulas vive dentro do grupo, e foi isso que a decisão de 24/10 fixou. */
  /* A AFIRMAÇÃO É SOBRE A LISTA DE AULAS, E NÃO SOBRE A CONTAGEM (15/11/2026).
   *
   * Era `directos === 1`, porque havia um destino directo no topo da coluna — o «Consulta». Ele
   * saiu por decisão de 28/10/2026, tomada em `montar-publicacao.js`: «as antigas listas
   * independentes de Notação e Consulta deixam de ser geradas: a notação é acessada pela aula
   * correspondente, e o glossário pelo cabeçalho persistente da Notação». Com isso `directos`
   * ficou 0, e a asserção passou a reprovar uma decisão que está certa.
   *
   * O que ela queria dizer — e passa a dizer — é isto: a lista de aulas vive DENTRO do grupo, e
   * não há um segundo item a apontar para ela. Um número fixo mede o desenho de hoje; esta
   * pergunta mede a regra. */
  provar('…e nenhum destino directo da coluna aponta para a lista de aulas',
    emAulas.directosApontandoParaAulas === 0,
    { directos: emAulas.directos, paraAulas: emAulas.directosApontandoParaAulas, rotulos: emAulas.rotulos });
  provar('…porque a lista de aulas está DENTRO do grupo, com o rótulo «Aulas»',
    emAulas.rotulos.indexOf('Aulas') !== -1, emAulas.rotulos);
  provar('…e o rótulo antigo («Lançamento de aula») já não existe',
    emAulas.rotulos.indexOf('Lançamento de aula') === -1, emAulas.rotulos);

  // ------------------------------------------------------------------ 4. a coluna, no computador
  console.log('\n4 · A coluna, no computador');
  const col = await pagina.evaluate(() => {
    const c = document.getElementById('coluna-proposta');
    const conteudo = document.querySelector('main');
    const rc = c.getBoundingClientRect();
    const rm = conteudo.getBoundingClientRect();
    const grupos = [...document.querySelectorAll('.coluna .coluna-grupo')];
    return {
      largura: Math.round(rc.width),
      topo: Math.round(rc.top),
      conteudoEsq: Math.round(rm.left),
      conteudoLarg: Math.round(rm.width),
      // O grupo em repouso: os itens têm de estar FECHADOS. É a decisão — tudo fechado, e o
      // grupo actual marcado.
      abertos: grupos.filter((g) => g.getAttribute('data-aberto') === 'sim').length,
      alturas: grupos.map((g) => Math.round(g.querySelector('.coluna-itens').getBoundingClientRect().height)),
      topoDosGrupos: grupos.map((g) => Math.round(g.getBoundingClientRect().top)),
      estouro: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  provar('a coluna tem 248px e começa no topo', col.largura === 248 && col.topo === 0, { largura: col.largura, topo: col.topo });
  provar('o conteúdo começa depois da coluna', col.conteudoEsq >= 248, { esquerda: col.conteudoEsq, largura: col.conteudoLarg });
  provar('nenhum grupo nasce aberto', col.abertos === 0, col.abertos);
  provar('as três caixas de itens estão fechadas (0px)', col.alturas.every((h) => h === 0), col.alturas);
  provar('a página não estoura na horizontal', col.estouro <= 1, col.estouro);

  // O ponteiro abre o grupo e EMPURRA os de baixo — a segunda metade é a que se esquece.
  const antes = col.topoDosGrupos;
  /* O GRUPO QUE SE ABRE É O PRIMEIRO — «Ciclos» (24/10/2026). Era «Planejamento», e esse grupo
     deixou de existir quando a notação passou para a Área do Professor e o glossário para
     «Consulta». O que se mede é o acordeão: um grupo abre e EMPURRA os de baixo, e quem está
     abaixo de «Ciclos» é a «Área do Professor». */
  const alvo = await pagina.evaluate(() => {
    const g = [...document.querySelectorAll('.coluna .coluna-grupo')]
      .find((x) => /Ciclos/.test(x.textContent));
    const t = g.querySelector('.coluna-titulo').getBoundingClientRect();
    return { x: Math.round(t.left + t.width / 2), y: Math.round(t.top + t.height / 2) };
  });
  await pagina.mouse.move(alvo.x, alvo.y);
  await new Promise((r) => setTimeout(r, 420));
  const durante = await pagina.evaluate(() => {
    const g = [...document.querySelectorAll('.coluna .coluna-grupo')]
      .find((x) => /Ciclos/.test(x.textContent));
    const area = [...document.querySelectorAll('.coluna .coluna-grupo')]
      .find((x) => /Área/.test(x.textContent));
    return {
      itens: Math.round(g.querySelector('.coluna-itens').getBoundingClientRect().height),
      areaTopo: Math.round(area.getBoundingClientRect().top),
    };
  });
  const areaAntes = antes[[...await pagina.evaluate(() => [...document.querySelectorAll('.coluna .coluna-grupo')]
    .map((g) => g.querySelector('.coluna-titulo span').textContent))].indexOf('Área do Professor')];
  provar('o ponteiro abre o grupo (os itens passam de 0 a mais de 0px)', durante.itens > 0, durante.itens);
  provar('e EMPURRA os de baixo para baixo', durante.areaTopo > areaAntes, { antes: areaAntes, depois: durante.areaTopo });
  await pagina.mouse.move(900, 500);
  await new Promise((r) => setTimeout(r, 420));
  const depois = await pagina.evaluate(() => {
    const g = [...document.querySelectorAll('.coluna .coluna-grupo')]
      .find((x) => /Ciclos/.test(x.textContent));
    return Math.round(g.querySelector('.coluna-itens').getBoundingClientRect().height);
  });
  provar('ao sair, o grupo fecha e os de baixo voltam', depois === 0, depois);

  // ------------------------------------------------------------------ 5. a folha, no celular
  console.log('\n5 · A folha, no celular');
  await ir('/ciclos/planos/', 414, 860);
  /* O PEGADOR CHAMA-SE `.folha-puxador` (15/11/2026) — e a prova pedia `.coluna-puxador`, um nome
   * que já não existe. A peça é a mesma nos três (coluna, folha do menu, lateral da Produção), e o
   * comentário dela em `ciclo.css` diz porquê: «um elemento só, e não três implementações».
   *
   * O SEGUNDO DEFEITO ERA PIOR, e é aqui que se corrige: `getComputedStyle(null)` atira, e a prova
   * MORRIA com um `TypeError` do jsdom — sem dizer qual asserção falhou, e sem correr as secções
   * seguintes. Uma prova que estoura não mede: quem a lê não sabe se o defeito é da folha ou da
   * prova. Agora a leitura é tolerante (o elemento ausente vale `null`) e a asserção é que reprova,
   * com o nome do que faltou. */
  const fechada = await pagina.evaluate(() => {
    const c = document.getElementById('coluna-proposta');
    const estilo = (sel, prop) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el)[prop] : null;
    };
    const r = c.getBoundingClientRect();
    return {
      topo: Math.round(r.top), esq: Math.round(r.left), largura: Math.round(r.width),
      aberta: c.getAttribute('data-aberta'),
      veu: estilo('.veu', 'opacity'),
      puxador: estilo('.folha-puxador', 'display'),
      colunaFixa: getComputedStyle(c).position,
    };
  });
  provar('antes do clique a folha está FORA da tela', fechada.topo >= 860 - 1, fechada.topo);
  provar('o véu está apagado e não apanha cliques',
    fechada.veu === '0', fechada.veu);
  provar('a folha tem o pegador (`.folha-puxador`, a peça dos três)',
    fechada.puxador === 'block', fechada.puxador);
  provar('e é uma folha, não a coluna fixa', fechada.colunaFixa === 'fixed', fechada.colunaFixa);

  await pagina.click('.topnav .hamburger');
  await new Promise((r) => setTimeout(r, 450));
  const aberta = await pagina.evaluate(() => {
    const c = document.getElementById('coluna-proposta');
    const r = c.getBoundingClientRect();
    const estilo = (sel, prop) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el)[prop] : null;
    };
    return {
      topo: Math.round(r.top), fundo: Math.round(r.bottom),
      aberta: c.getAttribute('data-aberta'),
      veu: estilo('.veu', 'opacity'),
      dentro: r.bottom <= window.innerHeight + 1 && r.top >= 0,
      itens: [...document.querySelectorAll('.coluna .coluna-itens a')].length,
      marcado: (document.querySelector('.coluna a[aria-current="page"]') || {}).textContent || '',
    };
  });
  provar('o ☰ sobe a folha para dentro da tela', aberta.aberta === 'sim' && aberta.dentro, { topo: aberta.topo, fundo: aberta.fundo });
  provar('e o véu acende', aberta.veu === '1', aberta.veu);
  provar('os destinos estão todos à vista (sem acordeão na folha)', aberta.itens >= 8, aberta.itens);

  /* O BASTIDORES VAI NO FIM DA FOLHA (23/10/2026). No computador ele fica sozinho na ponta
     direita da barra — e está certo. Mas no telefone a lista da barra não se mostra, e ele
     ficava INALCANÇÁVEL: a pesquisadora abriu a folha e disse «não tem bastidores aqui». Ele
     entra depois da Área do Professor, com um filete acima, porque não é trabalho de sala. */
  const comBastidores = await pagina.evaluate(() => {
    const blocos = [...document.querySelectorAll('.coluna nav > *')]
      .filter((e) => getComputedStyle(e).display !== 'none');
    const ultimo = blocos[blocos.length - 1] || null;
    const fora = document.querySelector('.coluna .coluna-fora');
    return {
      ultimo: ultimo ? ultimo.textContent.replace(/\s+/g, ' ').trim().slice(0, 30) : '',
      eFora: !!fora,
      filete: fora ? getComputedStyle(fora).borderTopWidth : '',
      destinos: fora ? [...fora.querySelectorAll('a')].map((a) => a.getAttribute('href')) : [],
      blocos: blocos.length,
      rotulosDaFolha: blocos.map((b) => b.textContent.replace(/\s+/g, ' ').trim().slice(0, 24)),
      depoisDaAreaDoProfessor: (() => {
        const nomes = blocos.map((b) => b.textContent.replace(/\s+/g, ' ').trim());
        const area = nomes.findIndex((n) => /^Área do Professor/.test(n));
        const bast = nomes.findIndex((n) => /^Bastidores/.test(n));
        return area !== -1 && bast !== -1 && bast > area;
      })(),
    };
  });
  provar('o último item da folha é o Bastidores', /^Bastidores/.test(comBastidores.ultimo), comBastidores.ultimo);
  /* A ORDEM, E NÃO O NÚMERO DE BLOCOS (15/11/2026). Era `blocos >= 4`, e o número caiu para 3
   * quando o grupo «Consulta» deixou de ser gerado (28/10/2026) — uma decisão certa, e a prova
   * reprovava-a. O que a asserção queria dizer é que o Bastidores vem DEPOIS da Área do
   * Professor: é a posição que faz dele «o último bloco», e é isso que se mede. */
  provar('…e ele vem DEPOIS da Área do Professor (é o último, não um a mais no meio)',
    comBastidores.depoisDaAreaDoProfessor, { rotulos: comBastidores.rotulosDaFolha });
  provar('…com um filete acima, que separa o que não é trabalho de sala',
    comBastidores.filete !== '0px', comBastidores.filete);
  provar('…e os dois destinos dele estão lá dentro',
    comBastidores.destinos.length === 2
    && comBastidores.destinos.some((h) => /bastidores\/producao/.test(h)),
    comBastidores.destinos);

  provar('o item da página está marcado', /Planos/.test(aberta.marcado), aberta.marcado);

  await pagina.evaluate(() => {
    const a = document.querySelector('.coluna .coluna-itens a');
    if (a) a.addEventListener('click', (e) => e.preventDefault(), { once: true });
  });
  await pagina.click('.coluna .coluna-itens a');
  await new Promise((r) => setTimeout(r, 420));
  const escolheu = await pagina.evaluate(() => document.getElementById('coluna-proposta').getAttribute('data-aberta'));
  provar('escolher um destino fecha a folha', escolheu === 'nao', escolheu);

  await pagina.click('.topnav .hamburger');
  await new Promise((r) => setTimeout(r, 420));
  await pagina.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 420));
  const aposEscape = await pagina.evaluate(() => document.getElementById('coluna-proposta').getAttribute('data-aberta'));
  provar('Escape fecha a folha', aposEscape === 'nao', aposEscape);

  /* O BURACO DE 769 A 1140 (23/10/2026). O cliente usava o corte dos 1140 para dizer que o ☰
     abre a folha; o CSS só mostrava o ☰ abaixo dos 768. Entre os dois, a página ficava com a
     barra a mostrar só o Bastidores e SEM forma de chegar aos quatro destinos — um tablet não
     saía da página em que estava. Fica no fim da secção porque cada medida recarrega a página. */
  for (const largura of [820, 1100]) {
    await ir('/ciclos/planos/', largura, 900);
    const meio = await pagina.evaluate(() => ({
      hamburger: getComputedStyle(document.querySelector('.topnav .hamburger')).display,
      listaDaBarra: getComputedStyle(document.querySelector('.topnav .nav-links')).display,
    }));
    provar('a ' + largura + 'px o ☰ existe (é ele que abre a folha)',
      meio.hamburger !== 'none', meio.hamburger);
    provar('…e a lista da barra está escondida (a navegação é a folha)',
      meio.listaDaBarra === 'none', meio.listaDaBarra);
  }

  // ------------------------------------------------------------------ 6. as caixas da lista
  console.log('\n6 · A lista de planos: as três caixas');
  await ir('/ciclos/planos/', 1280);
  const caixas = await pagina.evaluate(() => ({
    quantas: document.querySelectorAll('.trio-item').length,
    rotulos: [...document.querySelectorAll('.trio-item .trio-k')].map((k) => k.textContent),
    botoesDentro: document.querySelectorAll('.trio-item button').length,
    alvo: (() => {
      const b = document.querySelector('.trio-item');
      const r = b.getBoundingClientRect();
      return { largura: Math.round(r.width), altura: Math.round(r.height) };
    })(),
    planos: document.querySelectorAll('li.trio-plano').length,
  }));
  provar('um plano por turma, três caixas cada',
    caixas.planos === N && caixas.quantas === N * 3, { turmas: N, planos: caixas.planos, caixas: caixas.quantas });
  /* «TURMA · PROFESSOR · PERÍODO» (24/10/2026). A terceira caixa era «Cadeia» — o estado do PO, que
     passou a viver no SELO ao lado do nome. O que a pesquisadora pediu na listagem dos ciclos foi
     o INÍCIO E O FIM, e é isso que a terceira caixa diz agora. As três continuam a responder, por
     esta ordem, «de quem é · quem fez · quando». */
  provar('as caixas são Turma · Professor · Período',
    caixas.rotulos.slice(0, 3).join(',') === 'Turma,Professor,Período', caixas.rotulos.slice(0, 3));
  provar('nenhum botão DENTRO da caixa (o botão é a caixa)', caixas.botoesDentro === 0, caixas.botoesDentro);
  provar('o alvo de toque é a caixa inteira (>40px de altura)', caixas.alvo.altura > 40, caixas.alvo);
  provar('e é largo, não um «?» de 20px', caixas.alvo.largura > 100, caixas.alvo);

  const abrirCaixa = async (qual) => { await pagina.click(`.trio-item[data-balao="${qual}"]`); await new Promise((r) => setTimeout(r, 200)); };
  const estadoCaixas = () => pagina.evaluate(() => ({
    abertas: [...document.querySelectorAll('.trio-item[aria-expanded="true"]')].map((b) => b.getAttribute('data-balao')),
    paineis: [...document.querySelectorAll('.trio-painel:not([hidden])')].map((p) => p.getAttribute('data-painel')),
  }));
  await abrirCaixa('professor');
  let e = await estadoCaixas();
  provar('tocar na caixa abre o painel dela', e.abertas.join() === 'professor' && e.paineis.join() === 'professor', e);
  /* A CAIXA DO PERÍODO ABRE E DIZ AS DATAS INTEIRAS — é lá que vive o que a forma curta poupa. */
  await abrirCaixa('periodo');
  e = await estadoCaixas();
  provar('a caixa do período abre e diz o começa/termina',
    e.abertas.join() === 'periodo' && e.paineis.join() === 'periodo', e);
  await abrirCaixa('turma');
  e = await estadoCaixas();
  provar('abrir outra fecha a primeira', e.abertas.join() === 'turma', e.abertas);

  // ------------------------------------------------------------------ 7. o filtro
  console.log('\n7 · O filtro é no cliente');
  const filtrado = await pagina.evaluate(() => {
    const b = document.getElementById('f-busca');
    const cartoes = [...document.querySelectorAll('li.trio-plano')];
    /* O TERMO TEM DE DISTINGUIR, E A ESCOLHA DO TERMO É O QUE MUDOU (15/11/2026).
     *
     * A prova procurava um PEDAÇO DO NOME DO PROFESSOR — `cafe` na `batata`, `perna` na `calango`
     * —, assumindo que `data-prof` era o slug. Deixou de ser: passou a ser o nome de exibição
     * («Redinha Rosa»), e o `split('-')[0]` sobre ele devolve o nome inteiro. Na `calango` os dois
     * planos são da MESMA professora, com «redinha rosa» no `data-busca` dos dois — ou seja, o
     * termo antigo já não distinguia nada, e a prova media um filtro a não filtrar.
     *
     * O termo passa a ser a TURMA do primeiro cartão, que é o que distingue dois planos da mesma
     * dona, e a contagem esperada é DERIVADA do DOM: quantos cartões declaram aquela turma. Uma
     * prova que fixasse «1» voltaria a mentir numa escola com duas turmas homónimas. */
    const termo = (cartoes[0] && cartoes[0].getAttribute('data-turma')) || '';
    const esperados = cartoes.filter((l) => String(l.getAttribute('data-turma')) === termo).length;
    b.value = termo;
    b.dispatchEvent(new Event('input', { bubbles: true }));
    const visiveis = cartoes.filter((l) => !l.hidden);
    return { visiveis: visiveis.length, esperados, termo,
      conta: document.getElementById('f-conta').textContent };
  });
  /* A BUSCA TEM DE PARTIR DE UM ACERVO COM MAIS DE UMA TURMA para provar que reduz: com uma só,
     filtrar não muda nada e a asserção passaria sem medir. */
  if (N > 1 && filtrado.termo) {
    provar('a busca reduz ao que tem a turma escolhida',
      filtrado.visiveis === filtrado.esperados && filtrado.esperados < N,
      { visiveis: filtrado.visiveis, esperados: filtrado.esperados, termo: filtrado.termo });
    provar('e a contagem diz «N plano(s) de M», com o singular certo',
      new RegExp('^' + filtrado.esperados + ' '
        + (filtrado.esperados === 1 ? 'plano' : 'planos') + ' de ' + N + '$').test(filtrado.conta.trim()),
      filtrado.conta);
  } else {
    provar('com uma turma só, a busca não esconde nada', filtrado.visiveis === N, filtrado.visiveis);
  }

  // ------------------------------------------------- 8. as listas do acervo são ROTAS, não páginas
  /* AS TRÊS LISTAS DA ÁREA DO PROFESSOR DEIXARAM DE SER PÁGINAS MONTADAS (24/10/2026).
   *
   * Elas listavam TURMAS — uma linha por turma, e as três páginas iguais. A pesquisadora pediu o
   * que uma listagem tem de dizer («a anamnese de quem, feita por quem, quando»), e isso vive no
   * ACERVO, que muda a cada ato registado. Uma página montada no deploy mostraria o acervo do
   * dia do deploy.
   *
   * O que se mede AQUI é a fronteira: o menu aponta para elas, e elas já não existem como
   * ficheiro — quem as serve é a ponte. O conteúdo (uma linha por registo, a ordem das caixas, a
   * data, o selo) é medido no `provar-listas-do-acervo`, que tem KV para semear; nesta bancada
   * não há acervo, e uma lista vazia a passar não provaria nada.
   */
  console.log('\n8 · As três listas da Área do Professor são servidas, e não montadas');
  {
    const fontes = fs.readFileSync(path.join(raiz, 'motor/servidor/producao.js'), 'utf8');
    for (const pasta of ['anamnese', 'plano-de-ensino', 'plano-de-observacao']) {
      const caminho = path.join(destino, 'area-do-professor', pasta, 'index.html');
      provar('«' + pasta + '» já não é um ficheiro em publicacao/', !fs.existsSync(caminho), caminho);
      provar('…e a ponte tem a rota', fontes.indexOf('/area-do-professor/' + pasta) !== -1, true);
      const doMenu = (menu.coluna || []).some((g) => (g.itens || []).some(
        (i) => i.href === '/area-do-professor/' + pasta + '/'));
      provar('…e o menu aponta para ela', doMenu, (menu.coluna || []).map((g) => g.rotulo));
    }
  }

  // ------------------------------------------------------------------ 9. a lista de aulas pagina
  /* A PAGINAÇÃO DA LISTA DE AULAS (23/10/2026). O `.conf` de cada turma declara dezoito aulas;
     a calango tem 35 linhas publicadas. A peça é a da Produção, e a prova mede o que ela promete:
     o rodapé aparece, a primeira página mostra `porPagina` linhas, o botão seguinte avança, e o
     FILTRO e a PAGINAÇÃO não se atropelam (o caso que faz uma lista filtrada mostrar páginas
     vazias). */
  console.log('\n9 · A lista de aulas pagina, e o filtro não a atropela');
  await ir('/aulas/', 1280, 900);
  const pag = await pagina.evaluate(() => ({
    linhas: document.querySelectorAll('li.trio-plano').length,
    porPagina: Number((document.querySelector('[data-paginar]') || {}).getAttribute
      ? document.querySelector('[data-paginar]').getAttribute('data-por-pagina') : 0),
    visiveis: [...document.querySelectorAll('li.trio-plano')].filter((l) => !l.hidden).length,
    rodapeVisivel: !document.querySelector('.paginas').hidden,
    info: (document.querySelector('.paginas-info') || {}).textContent || '',
    temBusca: !!document.getElementById('f-busca'),
    temTurma: !!document.getElementById('f-turma'),
    temProf: !!document.getElementById('f-prof'),
  }));
  provar('a lista de aulas tem mais linhas do que uma página', pag.linhas > pag.porPagina,
    { linhas: pag.linhas, porPagina: pag.porPagina });
  provar('a primeira página mostra só as da página', pag.visiveis === pag.porPagina,
    { visiveis: pag.visiveis, porPagina: pag.porPagina });
  provar('o rodapé aparece e diz em que página se está', pag.rodapeVisivel && /^1 \/ \d+$/.test(pag.info), pag.info);
  const avancou = await pagina.evaluate(() => {
    document.querySelector('.paginas-prox').click();
    return {
      info: document.querySelector('.paginas-info').textContent,
      visiveis: [...document.querySelectorAll('li.trio-plano')].filter((l) => !l.hidden).length,
      primeiraEscondida: document.querySelector('li.trio-plano').hidden,
    };
  });
  provar('o botão seguinte avança a página', avancou.info !== pag.info && avancou.primeiraEscondida, avancou);
  /* O FILTRO E A PAGINAÇÃO. Depois de filtrar, a primeira página tem de mostrar o que passou no
     filtro — e não linhas vazias herdadas da página 2. */
  const filtradoPag = await pagina.evaluate(() => {
    const sel = document.getElementById('f-turma');
    sel.value = sel.options[1].value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return {
      turma: sel.value,
      visiveis: [...document.querySelectorAll('li.trio-plano')].filter((l) => !l.hidden).length,
      info: document.querySelector('.paginas-info').textContent,
      conta: document.getElementById('f-conta').textContent,
    };
  });
  provar('filtrar por turma volta à primeira página', /^1 \//.test(filtradoPag.info), filtradoPag.info);
  provar('e mostra linhas — nenhuma página vazia herdada do filtro',
    filtradoPag.visiveis > 0, filtradoPag);
  provar('a contagem fala de aulas, e não de planos', /aula/.test(filtradoPag.conta), filtradoPag.conta);
  provar('a lista de aulas filtra por turma e não por professor (a aula não tem professor)',
    pag.temBusca && pag.temTurma && !pag.temProf, pag);

  await navegador.close();
  srv.close();

  const falhou = provas.filter((p) => !p.ok).length;
  console.log(`\nprovar-navegacao: ${provas.length - falhou} de ${provas.length} passaram`);
  process.exit(falhou ? 1 : 0);
})().catch((e) => {
  console.error('provar-navegacao: ' + e.message);
  process.exit(1);
});
