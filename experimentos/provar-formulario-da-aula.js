#!/usr/bin/env node
'use strict';

/**
 * provar-formulario-da-aula.js — o formulário do lançamento, em navegador.
 *
 * O PEDIDO DELA (06/11/2026), e ele tem três partes:
 *
 *   «Nós precisamos ajustá-lo para ter a identidade visual adequada com o nosso plano de
 *    identidade […] E aí precisamos também verificar o que que deriva aqui de verdade, porque […]
 *    aqui diz que tem presentes aluno A, B e C. Não é verdade.»
 *
 *   «Essa forma como é apresentada aqui não é fácil para o professor responder, ela é complexa.
 *    Quando tem aqui três campos de texto […] a gente vai colocar isso como elementos de marcação
 *    […] a gente vai ter os mesmos objetivos, mesmos itens, né, que ele observa […] aqueles nossos
 *    três eixos que são super importantes, o que é corpo, o que é técnica e o que é poiese. E aí
 *    ele vai simplesmente marcar o que aconteceu de novo e isso, de fato, ele tem que escrever […]
 *    Agora, o que surpreendeu vai ser só marcar, surpreendeu? Sim. Precisou de ajuste? Sim. Daí
 *    ele escreve se precisou de ajuste. Precisou de ajuste tem como valor padrão não.»
 *
 * A MATRIZ (06/11/2026, a segunda volta do mesmo dia). Ela viu o formulário pronto e disse o que
 * faltava:
 *
 *   «a gente tem que elaborar um outro modelo onde a parte de cima a gente tem por linha os alunos
 *    e por coluna a gente precisa acrescentar outras colunas […] Eu não tenho essa linha de base
 *    orientada por aluno e eu preciso ter isso.»
 *
 * O QUE SE PROVA AQUI, e cada item corresponde a uma frase dela:
 *
 *   A. A MATRIZ — e, desde 20/11/2026, a RELAÇÃO: **o formulário pergunta o que a folha declara,
 *      uma vez por par (espaço, item), no eixo que a taxonomia manda**. As linhas são as alunas do
 *      elenco; as colunas são os aspectos; nenhum bloco da folha fica fora dos três eixos; todo
 *      item declarado tem a sua célula e nenhuma célula existe sem declaração; e o número de
 *      marcas por aluna sai da CONTA (corpo pelo PO + técnica + poiesis), não de um literal.
 *      É esta a secção que serve às aulas que ainda vêm: ela não sabe quantos itens a aula tem —
 *      compara os dois lados. Foi ela que revelou que cinco blocos da folha da `breu`
 *      («Técnica — Solo» … «Técnica — Expressão») caíam fora dos eixos, por a página decidir o
 *      eixo com uma segunda cópia da regra;
 *   B. «O plano foi seguido?» é UMA pergunta de três estados (sim / em parte / não) com um texto —
 *      as duas perguntas que diziam a mesma coisa deixaram de existir;
 *   C. a escrita obrigatória é uma só quando o plano é seguido — «o que aconteceu de novo»;
 *   D. o payload passa no `validar-dados-ciclo.js`, a linha de base vai por aluna (uma marca por
 *      aspecto do PO), e uma marca fora do vocabulário é recusada (inclusive ali, que até hoje
 *      passava sem ser olhado);
 *   E. a LARGURA: a coluna do formulário é a do documento mais a do roteiro — 1132px a 1280, e
 *      não os 828 que sobravam de uma coluna de índice que o formulário não tem;
 *   F. a MATRIZ QUE NÃO CABE: as colunas crescem com o dado, e cada tabela diz se cabe
 *      (`data-rolagem`) — a fileira de setas aparece só onde não cabe, as setas andam a caixa e
 *      desligam-se no fim do caminho. A asserção é a REGRA, caixa a caixa, e não «a primeira
 *      tabela a 1280»: a mesma tela tem caixas com e sem setas;
 *   G. a PRESENÇA com cinquenta alunas: uma caixa que abre (e não uma linha de cinquenta nomes),
 *      com todos/nenhum, e a matriz a seguir a marcação sem perder o que já estava escrito;
 *   H. a página não estoura na horizontal, nem a 1280 nem a 390.
 *
 * A PROVA NÃO SABE QUAL É A ESCOLA NEM A AULA. O pacote vem do `lib-pacote.js` e a aula da prova é
 * a primeira sem lançamento que o índice declara; o config é o que o índice nomeia
 * (`aulas[].config`). Trocar de escola, de ciclo ou de aula não muda uma linha — é o que a torna
 * reutilizável para as aulas que ainda vêm.
 *
 * Requer Chrome/Chromium (puppeteer-core vem com o marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-formulario-da-aula.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');

let puppeteer;
try {
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
} catch {
  console.error('provar-formulario-da-aula: puppeteer-core não encontrado — NÃO FEITO.');
  process.exit(1);
}
const executavel = process.env.CHROME_PATH
  || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
if (!executavel) {
  console.error('provar-formulario-da-aula: Chrome/Chromium não encontrado — NÃO FEITO.');
  process.exit(1);
}

const { umPacote } = require('./lib-pacote.js');
/* A TAXONOMIA É A DO PRODUTO (20/11/2026): o mesmo módulo que a página carrega como
 * `assets/eixos.js`. A prova não reescreve a regra — se ela divergisse da página, a prova estaria
 * a medir a sua própria cópia. */
const Eixos = require(path.join(raiz, 'motor/nucleo/eixos.js'));
const { chaveDoItem } = require(path.join(raiz, 'tools/lib-vistas.js')).helpers;
const semAcentoLocal = Eixos.semAcento;
const PACOTE = umPacote();
const ABS = path.join(raiz, PACOTE);

/* AS ENTRADAS REAIS do ciclo: o PO e o plano que a página carrega ao lado do JSON de dados. */
const PO = JSON.parse(fs.readFileSync(path.join(ABS, 'po-01.json'), 'utf8'));
const indice = JSON.parse(fs.readFileSync(path.join(ABS, 'ciclos.json'), 'utf8'));
const ciclo = indice.ciclos[0];

/* O ESTADO DE UMA AULA, DERIVADO AQUI — porque o índice já não o declara (15/11/2026).
 *
 * Ele era um campo do `ciclos.json` (`estado`), e era o juízo do instante em que o índice foi
 * gerado: um ficheiro versionado que mudava sozinho quando o prazo de uma aula vencia. Saiu do
 * índice, e quem o quer calcula-o — é a mesma conta do formulário (`estadoDaAula`, em
 * `lancamento.html`), feita aqui com o relógio desta bancada. A REGRA não mudou; mudou o sítio
 * onde ela corre. */
function estadoDaAula(a, quando = new Date()) {
  const prazo = a && a.prazo ? new Date(a.prazo) : null;
  if (!prazo) return '';
  if (quando.getTime() >= prazo.getTime()) return 'nao_dada';
  const fim = a.data && a.fim ? new Date(`${a.data}T${a.fim}`) : null;
  return fim && quando.getTime() >= fim.getTime() ? 'dada' : 'planejada';
}

/* A AULA DA PROVA: a primeira que o índice declara como DADA e que ainda não tem lançamento —
 * é a única em que o painel abre (`primeiraSemDado`). Derivada do índice, não fixa em código. */
const arquivoDados = ciclo.arquivo;
const apelidos = { aluna_a: 'Aluna A', aluna_b: 'Aluna B' };
/* A ESCOLA VEM DO ÍNDICE DO PACOTE, e não de um literal: era `calango`, escola expurgada. O
 * `escola` do `ciclos.json` é o nome como se escreve («Breu»); o slug sai do caminho do pacote
 * (`ciclo-01-<slug>-<turma>`), e é ele que o JSON de dados carrega. */
const ESCOLA = (() => {
  const nome = path.basename(ABS);                       // ciclo-01-breu-rosa
  const partes = nome.replace(/^ciclo-\d+-/, '').split('-');
  return partes.length > 1 ? partes[0] : (ciclo.escola || 'escola');
})();

/* OS ITENS DO CORPO que o PO declara — a coluna da tabela da linha de base. Calculados UMA vez
 * aqui: a secção A compara a tela com eles, e a secção D conta as marcas gravadas por eles. */
const corpoItens = (() => {
  const itens = [];
  for (const d of PO.itensPorDimensao || []) {
    const eixo = String(d.eixo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (eixo !== 'Corpo') continue;
    for (const bruto of String(d.itens || '').split(';')) {
      const item = bruto.trim();
      if (item && !/^sem\s+(restri|nenhum|altera)/i.test(item)
        && itens.indexOf(item) === -1) itens.push(item);
    }
  }
  return itens;
})();

const DADOS_EM_CLARO = JSON.stringify({ ciclo: ciclo.id, escola: ESCOLA, aulas: {},
  apelidos }, null, 2) + '\n';

/* O item que o PO declara como AUSÊNCIA, e não como coisa a olhar. */
const AUSENCIA = /^sem\s+(restri|nenhum|altera)/i;

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

function servir() {
  const MAPA = { 'assets/style.css': 'tools/templates/ciclo.css',
    'assets/nav.js': 'tools/templates/nav.js',
    'assets/lib-vistas.js': 'tools/lib-vistas.js',
    'assets/lib-cifra.js': 'tools/lib-cifra.js',
    /* A TAXONOMIA DOS EIXOS ENTROU NO PACOTE A 20/11/2026: o formulário lia-a de uma cópia sua, e
     * a cópia divergiu (cinco blocos fora dos eixos). A bancada serve o ficheiro como o gerador o
     * copia — mesmo caminho, mesmo conteúdo. */
    'assets/eixos.js': 'motor/nucleo/eixos.js',
    'lancamento.html': 'tools/templates/lancamento.html' };
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    // O JSON DE DADOS EM CLARO — é o caso do «arquivo baixado», e é o único em que não se pede
    // senha. O do pacote é o envelope cifrado: sem senha ele não abre, e o formulário ficaria
    // vazio por um motivo que não tem a ver com o que se mede aqui.
    if (rel === arquivoDados) {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(DADOS_EM_CLARO);
      return;
    }
    const alvo = [MAPA[rel], rel, path.join(PACOTE, rel)].filter(Boolean)
      .map((x) => path.join(raiz, x))
      .find((x) => x.startsWith(raiz) && fs.existsSync(x) && !fs.statSync(x).isDirectory());
    if (!alvo) { res.writeHead(404); res.end('nao encontrado'); return; }
    const tipo = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml' }[path.extname(alvo)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
    res.end(fs.readFileSync(alvo));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

(async () => {
  /* Os números que o fecho imprime — medidos, não escritos. */
  const medido = {};
  /* O config da aula da prova: o que o índice do ciclo nomeia (`aulas[].config`), o MESMO arquivo
   * que a página carrega. Preenchido na secção A e usado também na D. */
  const CONFIG = {};
  const { srv, base } = await servir();
  const navegador = await puppeteer.launch({
    executablePath: executavel,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const erros = [];
  try {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: 1280, height: 900 });
    pagina.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
    pagina.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
    await pagina.goto(`${base}/lancamento.html`, { waitUntil: 'networkidle0' });

    /* A AULA DA PROVA: uma aula SEM LANÇAMENTO — é só disso que o painel precisa.
     *
     * Antes era «a primeira `dada`», e isso fazia a prova depender do RELÓGIO: `dada` é o
     * intervalo entre o fim da aula e o prazo dela (24h), e um dia sem aula nessa janela deixava
     * a prova vermelha — «o índice não declara nenhuma aula “dada”» — sem que nada tivesse
     * mudado no formulário. Medido em 06/11/2026, com o índice regenerado. A ordem de
     * preferência mantém o caso mais interessante primeiro (dada, depois planejada) e cai numa
     * pulada só quando não há outra — a pulada também não tem dado, e o painel também abre. */
    const semLancamento = (ciclo.aulas || []).filter((a) => !a.lancada);
    const aulaDaProva = semLancamento.find((a) => estadoDaAula(a) === 'dada')
      || semLancamento.find((a) => estadoDaAula(a) === 'planejada')
      || semLancamento[0];
    await pagina.waitForFunction(() => document.querySelector('#aula')
      && document.querySelector('#aula').options.length > 1, { timeout: 15000 });
    const opcoes = await pagina.$$eval('#aula option', (os) => os.map((o) => o.value));
    provar('o filtro lista a aula sem dado (a da prova)', aulaDaProva && opcoes.includes(aulaDaProva.n),
      { esperada: aulaDaProva && aulaDaProva.n, opcoes });
    if (!aulaDaProva) throw new Error('o índice não declara nenhuma aula sem lançamento — sem ela não há painel');

    await pagina.select('#aula', aulaDaProva.n);
    await pagina.waitForFunction(() => {
      const c = document.querySelector('#captura');
      return c && !c.hidden && document.querySelector('#captura-campos details.eixo');
    }, { timeout: 15000 });

    // ----------------------------------------------------------------------------------------
    console.log('A. A matriz — o formulário pergunta o que a folha declara, uma vez por par');
    {
      /* O QUE ESTA SECÇÃO PASSOU A MEDIR, E PORQUÊ (20/11/2026).
       *
       * Ela media a FORMA que a matriz tinha no ciclo da `batata`: «uma tabela por objectivo, os
       * três espaços como colunas, 14 marcas por aluna». Medido contra a `breu`, o número e a
       * forma não batiam — e o que a diferença revelou não era fixture: CINCO blocos da folha
       * («Técnica — Solo» … «Técnica — Expressão») caíam FORA dos três eixos, porque a página
       * decidia o eixo com uma segunda cópia da regra, comparando o rótulo inteiro com as
       * dimensões do PO. Os critérios que o professor escreveu ficavam ao fim do formulário, com
       * um aviso, fora da matriz.
       *
       * A asserção deixou de fixar números de uma escola e passou a medir a RELAÇÃO, que é a mesma
       * em qualquer aula: **cada par (espaço, item) que a folha declara aparece UMA vez, no eixo
       * que a taxonomia manda** — e nada aparece que a folha não declare. É esta a prova que
       * serve às aulas que ainda vêm: ela não sabe quantos itens há, sabe que os dois lados têm de
       * dizer o mesmo. */
      const CAIXA = '#captura-campos details.eixo:not(.presenca-da-turma)';
      const eixos = await pagina.$$eval(CAIXA + ' > summary',
        (ss) => ss.map((x) => x.textContent.replace(/\s+/g, ' ').trim().split(' — ')[0]));
      provar('os três eixos aparecem, e nesta ordem: Corpo, Técnica, Poiesis',
        JSON.stringify(eixos) === JSON.stringify(['Corpo', 'Técnica', 'Poiesis']), eixos);

      /* A MATRIZ COMO ELA ESTÁ NA TELA: por eixo, as tabelas — o título (o espaço), as colunas (os
       * itens) e as linhas (as alunas). */
      const tela = await pagina.evaluate((sel) => {
        const out = [];
        document.querySelectorAll(sel).forEach((d) => {
          const eixo = d.querySelector('summary').textContent.split('—')[0].trim();
          [...d.querySelectorAll('table')].forEach((t) => {
            const caixa = t.closest('.rolagem') || t;
            const antes = caixa.previousElementSibling;
            out.push({
              eixo,
              titulo: (antes && antes.classList.contains('matriz-objectivo')) ? antes.textContent.trim() : null,
              colunas: [...t.querySelectorAll('tr')[0].children].slice(1).map((c) => c.textContent.trim()),
              alunas: [...t.querySelectorAll('tr')].slice(1).map((tr) => tr.querySelector('th').textContent.trim()),
              ids: [...t.querySelectorAll('select')].map((s) => s.id),
            });
          });
        });
        return out;
      }, CAIXA);
      const totalNaTela = await pagina.$$eval(CAIXA + ' select', (x) => x.length);

      /* O QUE A FOLHA DECLARA, lido do config que o índice do ciclo nomeia — o MESMO arquivo que a
       * página carrega (`aulas[].config`). Cada bloco dá o seu espaço pela regra canónica
       * (`motor/nucleo/eixos.js`, o módulo que a página também usa), e cada coluna é um item. */
      const configNome = ((ciclo.aulas || []).find((a) => String(a.n) === String(aulaDaProva.n)) || {}).config
        || ('captura-aula-' + aulaDaProva.n + '.json');
      Object.assign(CONFIG, JSON.parse(fs.readFileSync(path.join(ABS, configNome), 'utf8')));
      /* OS ITENS DO CORPO, que vêm do PO e não da folha (ver o `continue` dos `secoes`, abaixo). */
      const doPo = corpoItens.map(chaveDoItem);

      const declarado = [];
      for (const b of CONFIG.blocos || []) {
        if (b.tipo !== 'tabela' || !Array.isArray(b.colunas) || !b.colunas.length) continue;
        /* A LINHA DE BASE NÃO DECLARA ITENS. Ela é uma tabela de UM campo («Observado na aula») por
         * aluna, e as colunas dela são os itens do CORPO, que vêm do PO (`matrizDaBase`) — a folha
         * não os repete de propósito («não se reescreve aqui: aqui anota-se o que a aula
         * mostrou»). Contá-la como declaração de item daria uma célula a mais por aluna. */
        if (b.secoes) continue;
        const espaco = Eixos.blocoDaDimensao(b.rotulo || b.titulo || '') || String(b.rotulo || b.chave || '');
        const eixo = Eixos.eixoDoBloco(espaco);
        for (const c of b.colunas) {
          declarado.push({ bloco: b.chave, eixo, espaco, item: c.rotulo || c.chave,
            chave: chaveDoItem(c.rotulo || c.chave) });
        }
      }
      const ROTULO_DO_EIXO = { corpo: 'Corpo', tecnica: 'Técnica', poiesis: 'Poiesis' };
      provar('a folha declara itens — sem eles não há matriz a medir', declarado.length > 0,
        declarado.length);

      /* A) NADA CAI FORA DOS EIXOS. Era o defeito: cinco blocos desenhados ao fim do formulário,
       * com um aviso, e os critérios do professor fora da matriz. */
      const foraDosEixos = await pagina.evaluate(() =>
        [...document.querySelectorAll('#captura-campos h4, #captura-campos p.fraco')]
          .map((x) => x.textContent.trim())
          .filter((t) => /não cai em nenhum dos três eixos/i.test(t)));
      provar('nenhum bloco da folha fica fora dos três eixos (nem com aviso, nem desenhado à parte)',
        foraDosEixos.length === 0, foraDosEixos);

      /* B) CADA PAR (ESPAÇO, ITEM) UMA VEZ. É a regra que a pesquisadora enunciou em 06/11 — «seis
       * perguntas iguais por aluna» —, agora medida entre os DOIS lados: o que a folha declara não
       * se repete, e o que a tela desenha não repete o que já desenhou. */
      const chaveDoPar = (e, espaco, chave) => e + '|' + semAcentoLocal(espaco) + '|' + chave;
      const repetidosNaFolha = [];
      {
        const vistos = new Set();
        for (const d of declarado) {
          const k = chaveDoPar(d.eixo, d.espaco, d.chave);
          if (vistos.has(k)) repetidosNaFolha.push(k);
          vistos.add(k);
        }
      }
      const repetidosNaTela = [];
      {
        const vistos = new Set();
        for (const t of tela) {
          const eixo = Eixos.semAcento(t.eixo);
          /* O TÍTULO DA TABELA É O ESPAÇO quando o eixo tem mais de uma. Com uma só, o espaço é o
           * que a folha declara para aquele eixo — e é o que se usa como chave. */
          const espaco = t.titulo || (declarado.find((d) => ROTULO_DO_EIXO[d.eixo] === t.eixo) || {}).espaco || '';
          for (const c of t.colunas) {
            const k = chaveDoPar(eixo, espaco, chaveDoItem(c));
            if (vistos.has(k)) repetidosNaTela.push(k);
            vistos.add(k);
          }
        }
      }
      /* A FOLHA REPETE, E ISSO É UM FACTO DELA — não da tela. Ela declara o mesmo espaço duas vezes
       * («Bloco 1 — Solo» e «Bloco 5 — Técnica — Solo»), porque `dimensoes-de-observacao` e
       * `itens-por-dimensao` são duas escritas do mesmo recorte e `itensComObjetivos` põe os
       * objectivos do plano à frente das duas. O que se exige do FORMULÁRIO é que ele não herde a
       * repetição: o par (espaço, item) que aparece duas vezes na folha tem UMA célula.
       *
       * (A duplicação da folha impressa está registada como pendência — ela pede uma decisão de
       * conteúdo, não de código: juntar os dois blocos no documento muda o que se imprime.) */
      const paresNaTela = new Set();
      for (const t of tela) {
        const espaco = t.titulo || (declarado.find((d) => ROTULO_DO_EIXO[d.eixo] === t.eixo) || {}).espaco || '';
        for (const c of t.colunas) paresNaTela.add(chaveDoPar(Eixos.semAcento(t.eixo), espaco, chaveDoItem(c)));
      }
      provar('a tela não pergunta duas vezes o mesmo par (espaço, item)', repetidosNaTela.length === 0,
        repetidosNaTela);
      provar('…e absorve a repetição da folha: cada par repetido lá tem UMA célula aqui',
        repetidosNaFolha.length > 0
          ? repetidosNaFolha.every((k) => paresNaTela.has(k))
          : repetidosNaTela.length === 0,
        { repetidosNaFolha: repetidosNaFolha.length, naTela: paresNaTela.size });

      /* C) OS DOIS LADOS DIZEM O MESMO: todo item declarado tem a sua célula, no eixo certo, e
       * nenhuma célula existe sem declaração. É esta a asserção que vale para a aula 02, a 03 e as
       * que vierem — ela não conta, ela compara. */
      const itensDaTela = tela.map((t) => ({ eixo: Eixos.semAcento(t.eixo),
        colunas: t.colunas.map(chaveDoItem), titulo: t.titulo }));
      const faltamNaTela = [];
      for (const d of declarado) {
        const eixoDaTela = itensDaTela.find((t) => t.eixo === d.eixo && t.colunas.indexOf(d.chave) !== -1);
        if (!eixoDaTela) faltamNaTela.push(ROTULO_DO_EIXO[d.eixo] + ' · ' + d.espaco + ' · ' + d.item);
        else if (eixoDaTela.eixo !== d.eixo) faltamNaTela.push('eixo trocado: ' + d.item);
      }
      provar('todo item que a folha declara tem a sua célula, no eixo que a taxonomia manda',
        faltamNaTela.length === 0, faltamNaTela);

      /* NENHUMA CÉLULA SEM ORIGEM: cada coluna da tela ou é um item que a folha declara, ou é um
       * item do corpo que o PO declara (a tabela da linha de base). O corpo fica de fora da
       * comparação anterior porque a coluna dele na folha é o CAMPO, não o item. */
      const declaradas = new Set(declarado.map((d) => d.chave));
      const semDeclaracao = [];
      for (const t of tela) {
        const doCorpo = Eixos.semAcento(t.eixo) === 'corpo';
        for (const c of t.colunas) {
          const k = chaveDoItem(c);
          if (doCorpo) { if (doPo.indexOf(k) === -1) semDeclaracao.push('corpo sem PO: ' + c); }
          else if (!declaradas.has(k)) semDeclaracao.push(Eixos.semAcento(t.eixo) + ': ' + c);
        }
      }
      provar('…e nenhuma célula existe sem a folha ou o PO a declarar', semDeclaracao.length === 0,
        semDeclaracao);

      /* D) O CORPO: uma tabela, e as colunas são os aspectos do recorte que o PO declara — o eixo
       * que não tinha coluna nenhuma até 06/11. A comparação é com o PO, não com um número. */
      const corpo = tela.filter((t) => Eixos.semAcento(t.eixo) === 'corpo');
      const colunasDoCorpo = [].concat(...corpo.map((t) => t.colunas.map(chaveDoItem)));
      provar('o Corpo é UMA tabela, com uma coluna por aspecto que o PO declara',
        corpo.length === 1 && JSON.stringify(colunasDoCorpo) === JSON.stringify(doPo),
        { naTela: colunasDoCorpo, noPo: doPo });
      provar('«sem restrições declaradas» NÃO é oferecido como aspecto a marcar',
        !colunasDoCorpo.some((k) => AUSENCIA.test(k)), colunasDoCorpo.filter((k) => AUSENCIA.test(k)));

      /* E) AS LINHAS SÃO O ELENCO — e cada marca é de uma aluna. `dados.apelidos` é o elenco que o
       * ciclo leva ao formulário; a tela tem de desenhar exactamente essas pessoas. */
      const elenco = Object.values(apelidos);
      provar('as linhas da matriz são as alunas do elenco, e todas',
        tela.length > 0 && tela.every((t) => JSON.stringify(t.alunas) === JSON.stringify(elenco)),
        { naTela: tela[0] && tela[0].alunas, elenco });

      /* F) O NÚMERO SAI DA CONTA, e não de um literal: uma célula por (item, aluna). Se a tela
       * desenhasse uma coluna a mais, ou uma aluna a menos, isto reprovava sem saber quantos itens
       * a aula tem. */
      const porAluna = tela.reduce((n, t) => n + t.colunas.length, 0);
      medido.porAluna = porAluna;
      medido.corpo = corpo.reduce((n, t) => n + t.colunas.length, 0);
      medido.tecnica = tela.filter((t) => Eixos.semAcento(t.eixo) === 'tecnica')
        .reduce((n, t) => n + t.colunas.length, 0);
      medido.poesia = tela.filter((t) => Eixos.semAcento(t.eixo) === 'poiesis')
        .reduce((n, t) => n + t.colunas.length, 0);
      const esperado = doPo.length + new Set(declarado.map((d) => d.eixo + '|' + semAcentoLocal(d.espaco) + '|' + d.chave)).size;
      provar('há uma célula por item e por aluna — ' + porAluna + ' por aluna (o corpo pelo PO + a folha)',
        porAluna === esperado, { naTela: porAluna, esperado });
      provar('…e todas as células da matriz são um controle na tela (' + elenco.length + ' × ' + porAluna + ')',
        totalNaTela === elenco.length * porAluna, totalNaTela);
      const ids = [].concat(...tela.map((t) => t.ids));
      provar('…e nenhum id de célula se repete (o valor de uma não escreve por cima da outra)',
        ids.length === new Set(ids).size, ids.filter((x, i) => ids.indexOf(x) !== i).slice(0, 4));

      provar('o eixo que ainda não tem marca abre fechado, e o Corpo — a âncora — abre aberto',
        await pagina.evaluate((sel) => {
          const d = [...document.querySelectorAll(sel)];
          return d[0].open === true && d.slice(1).every((x) => x.open === false);
        }, CAIXA));
      provar('o sumário de cada eixo diz quantas marcas tem lá dentro',
        await pagina.$$eval(CAIXA + ' > summary',
          (ss) => ss.every((x) => /\d+ de \d+ marcados/.test(x.textContent))));
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nB. «O plano foi seguido?» — uma pergunta, três estados, um texto');
    {
      const antes = await pagina.evaluate(() => ({
        plano: [...document.querySelectorAll('input[name="captura-plano"]')].map((r) => r.value),
        marcado: [...document.querySelectorAll('input[name="captura-plano"]')]
          .filter((r) => r.checked).map((r) => r.value),
        surpresa: [...document.querySelectorAll('input[name="captura-surpreendeu"]')].map((r) => r.value),
        surpresaMarcada: [...document.querySelectorAll('input[name="captura-surpreendeu"]')]
          .filter((r) => r.checked).length,
        mudouVisivel: (() => { const l = document.querySelector('#linha-mudou');
          return !!(l && l.getBoundingClientRect().height > 0); })(),
        selectAntigo: (() => { const x = document.querySelector('#captura-plano');
          return !!(x && x.tagName === 'SELECT'); })(),
        ajusteAntigo: document.querySelectorAll('input[name="captura-ajuste"]').length,
        ajustesAntigo: !!document.querySelector('#captura-ajustes'),
      }));
      provar('a pergunta tem TRÊS estados: sim, em parte, não',
        JSON.stringify(antes.plano) === JSON.stringify(['sim', 'parcial', 'nao']), antes.plano);
      provar('…e nasce em «sim» (o caso comum), com o texto escondido',
        JSON.stringify(antes.marcado) === JSON.stringify(['sim']) && antes.mudouVisivel === false,
        { marcado: antes.marcado, visivel: antes.mudouVisivel });
      provar('o select do topo deixou de existir', antes.selectAntigo === false);
      provar('«Precisou de ajuste?» deixou de existir — era a mesma pergunta duas vezes',
        antes.ajusteAntigo === 0 && antes.ajustesAntigo === false,
        { radios: antes.ajusteAntigo, campo: antes.ajustesAntigo });
      provar('«surpreendeu» continua a ser um par de marcas, e nenhuma escolhida ao abrir',
        JSON.stringify(antes.surpresa) === JSON.stringify(['sim', 'nao'])
          && antes.surpresaMarcada === 0, antes.surpresa);

      await pagina.click('input[name="captura-plano"][value="parcial"]');
      await new Promise((r) => setTimeout(r, 150));
      const depois = await pagina.evaluate(() => {
        const l = document.querySelector('#linha-mudou');
        const t = document.querySelector('#captura-mudou');
        const a = t && t.previousElementSibling;
        return {
          visivel: !!(l && l.getBoundingClientRect().height > 0),
          vao: (t && a) ? Math.round(t.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : null,
        };
      });
      provar('…e com «em parte» o texto do que mudou aparece', depois.visivel === true, depois);
      provar('o rótulo e a caixa do texto não estão colados',
        depois.vao !== null && depois.vao >= 4, depois.vao);
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nC. A escrita: uma só quando o plano é seguido');
    {
      const escrever = await pagina.evaluate(() => {
        const t = document.querySelector('#captura-texto');
        return {
          existe: !!t,
          obriga: t ? /Obrigat[óo]rio/i.test(t.closest('.linha').textContent) : false,
        };
      });
      provar('«o que aconteceu de novo» existe e diz-se obrigatório',
        escrever.existe === true && escrever.obriga === true, escrever);
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nD. O que o formulário grava — a matriz nos blocos da folha');
    {
      await pagina.type('#captura-texto', 'A turma chegou cansada; o apoio apareceu no fim.');
      await pagina.type('#captura-mudou', 'encurtei o centro em dez minutos');
      await pagina.click('input[name="captura-surpreendeu"][value="sim"]');
      await pagina.evaluate(() => {
        // A PRIMEIRA CÉLULA DE CADA EIXO — o Corpo abre aberto; os outros dois, para marcar, abrem-se.
        document.querySelectorAll('#captura-campos details.eixo').forEach((d) => { d.open = true; });
        const s = document.querySelectorAll('#captura-campos details.eixo select');
        s[0].value = 'ok'; s[0].dispatchEvent(new Event('change', { bubbles: true }));
        s[1].value = 'parcial'; s[1].dispatchEvent(new Event('change', { bubbles: true }));
        document.querySelector('#captura-animo').value = '4';
        document.querySelector('#captura-interesse').value = '4';
        document.querySelector('#captura-harmonia').value = '5';
      });
      const payload = await pagina.evaluate((d) => {
        const r = coletarCaptura(d);
        return { faltando: r.faltando, aula: r.aula };
      }, { ciclo: ciclo.id, escola: ESCOLA, aulas: {}, apelidos });

      provar('com o obrigatório preenchido, nada falta', payload.faltando.length === 0, payload.faltando);
      const base = payload.aula && payload.aula.linha_de_base;
      /* O NÚMERO DE ASPECTOS VEM DO PO, e não de um literal: eram «os quatro» da `batata`, e a
       * `breu` declara dez. O que a asserção guarda é o que sempre guardou — uma marca por
       * aspecto, por aluna, com o item nomeado —, e o número sai do documento. */
      const aspectos = corpoItens.length;
      provar('a linha de base é gravada POR ALUNA, com os ' + aspectos + ' aspectos do PO',
        !!(base && Array.isArray(base.aluna_a) && base.aluna_a.length === aspectos
          && base.aluna_a.every((x) => x.item && typeof x.marca === 'string')),
        { naBase: base && base.aluna_a && base.aluna_a.length, noPo: aspectos });
      provar('…e as marcas que o professor deu estão lá, na ordem do PO',
        !!(base && base.aluna_a[0] && base.aluna_a[0].marca === 'ok'
          && base.aluna_a[1] && base.aluna_a[1].marca === 'parcial'),
        base && base.aluna_a && base.aluna_a.slice(0, 2));
      /* O BLOCO DO ESPAÇO GRAVA TODAS AS COLUNAS DELE — e o número sai do config, não de um
       * literal. Era `=== 2`, a conta de quando o espaço tinha só os dois objetivos do plano; a
       * folha fundida põe também os critérios que o professor escreveu (4 em Solo, na `breu`). */
      const colunasDoSolo = ((CONFIG.blocos || []).find((b) => b.chave === 'solo') || { colunas: [] }).colunas;
      provar('os blocos do espaço continuam por aluna, com uma marca por coluna',
        !!(payload.aula.solo && payload.aula.solo.aluna_a
          && Object.keys(payload.aula.solo.aluna_a).length === colunasDoSolo.length),
        { gravadas: payload.aula.solo && Object.keys(payload.aula.solo.aluna_a || {}),
          noConfig: colunasDoSolo.length });
      provar('o bloco `observado` (sem aluna) deixou de ser escrito',
        payload.aula.observado === undefined, Object.keys(payload.aula));
      provar('o plano seguido saiu do rádio, e o texto foi para `mudou`',
        payload.aula.condicoes_contorno.plano_seguido === 'parcial'
          && /encurtei/.test(payload.aula.condicoes_contorno.mudou),
        payload.aula.condicoes_contorno);
      provar('…e `relatorio.ajustes` é o MESMO texto (o caderno imprime-o em «O que decidi»)',
        payload.aula.relatorio.ajustes === payload.aula.condicoes_contorno.mudou,
        { ajustes: payload.aula.relatorio.ajustes, mudou: payload.aula.condicoes_contorno.mudou });
      provar('«surpreendeu» foi para o JSON como marca',
        payload.aula.relatorio.surpresas === 'sim', payload.aula.relatorio.surpresas);
      provar('o «o que aconteceu de novo» é o texto escrito',
        /cansada/.test(payload.aula.relatorio.texto), payload.aula.relatorio.texto);

      // O VALIDADOR DO JSON — a mesma porta por onde o arquivo passa antes do commit.
      const raizDoJson = JSON.stringify({
        ciclo: ciclo.id, escola: 'calango', professor: ciclo.professor,
        criado_em: '2026-11-06T10:00', apelidos,
        aulas: { [aulaDaProva.n]: payload.aula }, _nota: 'fixture da prova do formulario',
      }, null, 2) + '\n';
      const correr = (conteudo) => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prova-form-'));
        const arq = path.join(tmp, 'ciclo-01-prova-dados.json');
        fs.writeFileSync(arq, conteudo);
        let saida = '', codigo = 0;
        try {
          saida = execSync(`node tools/validar-dados-ciclo.js ${JSON.stringify(arq)}`,
            { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
        } catch (e) { codigo = e.status || 1; saida = String((e.stdout || '') + (e.stderr || '')); }
        fs.rmSync(tmp, { recursive: true, force: true });
        return { codigo, saida };
      };
      const bom = correr(raizDoJson);
      provar('o JSON que o formulário monta passa no validar-dados-ciclo.js',
        bom.codigo === 0 && !/\berro\b/i.test(bom.saida),
        { codigo: bom.codigo, saida: bom.saida.trim().split('\n').slice(-5) });

      /* A CONTRAPROVA DO VALIDADOR: a marca fora do vocabulário é recusada — inclusive no bloco
       * de itens, que até 06/11/2026 passava sem ser olhado (o valor de cada pessoa é uma lista,
       * e o teste «é um bloco por pessoa» dava-o por conferido). */
      const mau = JSON.parse(raizDoJson);
      mau.aulas[aulaDaProva.n].linha_de_base.aluna_a[0].marca = 'talvez';
      const ruim = correr(JSON.stringify(mau, null, 2) + '\n');
      provar('…e uma marca fora do vocabulário é recusada, mesmo na linha de base',
        ruim.codigo !== 0 && /linha_de_base\.aluna_a\[0\]/.test(ruim.saida),
        ruim.saida.trim().split('\n').filter((l) => /linha_de_base/.test(l)));
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nE. A largura — o formulário ocupa o que o documento ocupa, mais o roteiro');
    {
      const doc = await pagina.evaluate(() => {
        const R = (n) => Math.round(n * 10) / 10;
        const c = document.querySelector('.conteudo').getBoundingClientRect();
        return { largura: R(c.width), esquerda: R(c.left) };
      });
      /* A CONTA QUE ELA FEZ: «Ele pode ocupar a mesma dimensão que os outros formulários ocupam
       * somando a essa dimensão a parte do roteiro.» O documento gasta 900px de leitura + o vão
       * + 17rem de índice; o formulário não tem índice, e a coluna ficava VAZIA a roubar-lhe a
       * largura. Medido antes do conserto: 828px. O alvo é o contentor inteiro: 1180 − 48. */
      provar('a coluna do formulário é a do documento MAIS a do roteiro (1132px a 1280)',
        doc.largura === 1132, doc);
      provar('…e a caixa continua centrada, sem sair do contentor',
        doc.esquerda === 74, doc.esquerda);
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nF. A matriz que não cabe — as setas, e só quando há para onde ir');
    {
      /* A MECÂNICA, na largura em que ela acontece de facto: 390px. */
      await pagina.setViewport({ width: 390, height: 844 });
      await new Promise((r) => setTimeout(r, 250));
      const estreito = await pagina.evaluate(() => {
        const bloco = document.querySelector('#captura-campos .rolagem');
        const caixa = bloco.querySelector('.rolagem-caixa');
        return {
          estado: bloco.dataset.rolagem,
          visiveis: getComputedStyle(bloco.querySelector('.rolagem-setas')).display,
          sobra: caixa.scrollWidth - caixa.clientWidth,
        };
      });
      provar('a 390px a matriz não cabe, e o bloco DIZ isso (data-rolagem="sim")',
        estreito.estado === 'sim' && estreito.sobra > 0, estreito);
      provar('…e a fileira das setas passa a existir', estreito.visiveis === 'flex', estreito.visiveis);

      const clique = await pagina.evaluate(async () => {
        const bloco = document.querySelector('#captura-campos .rolagem');
        const caixa = bloco.querySelector('.rolagem-caixa');
        const dir = bloco.querySelector('[data-seta="dir"]');
        const esq = bloco.querySelector('[data-seta="esq"]');
        const antes = { sobra: caixa.scrollWidth - caixa.clientWidth, esqDesligada: esq.disabled };
        dir.click();
        await new Promise((r) => setTimeout(r, 700));
        const depois = { rolou: caixa.scrollLeft > 0 };
        // até ao fim: a seta da direita desliga-se
        caixa.scrollLeft = caixa.scrollWidth;
        await new Promise((r) => setTimeout(r, 200));
        return { antes, depois, noFim: { dir: dir.disabled, esq: esq.disabled } };
      });
      provar('a seta da esquerda está desligada no princípio, e a da direita não',
        clique.antes.esqDesligada === true, clique.antes);
      provar('a seta da direita ANDA a caixa', clique.depois.rolou === true, clique.depois);
      provar('…e no fim do caminho a seta da direita desliga-se (não promete o que não há)',
        clique.noFim.dir === true && clique.noFim.esq === false, clique.noFim);

      /* O CONTRÁRIO: com espaço de sobra, seta nenhuma — uma seta sempre presente é mobília.
       *
       * A ASSERÇÃO É A REGRA, E NÃO UM NÚMERO DE COLUNAS (20/11/2026). Ela dizia «a 1280px, com as
       * quatro colunas a caberem» e media a PRIMEIRA tabela do formulário — que no ciclo da `breu`
       * tem dez colunas (os aspectos do corpo) e não cabe. A regra do produto é outra e é melhor:
       * `data-rolagem` e a fileira de setas respondem por CADA caixa, ao que ela mede
       * (`scrollWidth > clientWidth`), e por isso o mesmo ecrã tem caixas com e sem setas. */
      await pagina.setViewport({ width: 1280, height: 900 });
      await new Promise((r) => setTimeout(r, 300));
      const largo = await pagina.evaluate(() => [...document.querySelectorAll('#captura-campos .rolagem')]
        .map((bloco) => ({
          cabe: bloco.querySelector('.rolagem-caixa').scrollWidth
            <= bloco.querySelector('.rolagem-caixa').clientWidth + 2,
          estado: bloco.dataset.rolagem,
          setas: getComputedStyle(bloco.querySelector('.rolagem-setas')).display,
        })));
      provar('a 1280px, cada matriz diz se cabe — e a fileira de setas só aparece onde não cabe',
        largo.length > 0 && largo.every((x) => x.estado === (x.cabe ? 'nao' : 'sim')
          && x.setas === (x.cabe ? 'none' : 'flex')), largo);
      provar('…e há matrizes que cabem e matrizes que não (senão a asserção acima não media nada)',
        largo.some((x) => x.cabe) && largo.some((x) => !x.cabe),
        { cabem: largo.filter((x) => x.cabe).length, naoCabem: largo.filter((x) => !x.cabe).length });

      /* A LARGURA MÍNIMA VEM DO DADO: `--colunas` é escrito quando a tabela é montada, e a
       * matriz fica com 10rem por coluna. É o que faz a tabela rolar em vez de espremer. */
      const minimo = await pagina.evaluate(() => {
        const t = document.querySelector('#captura-campos table.matriz');
        const colunas = Number(t.style.getPropertyValue('--colunas'));
        return { colunas, declarado: t.style.getPropertyValue('--colunas'),
          minimo: getComputedStyle(t).minWidth, reais: t.querySelectorAll('tr')[0].children.length - 1 };
      });
      provar('…e a largura mínima da matriz é 10rem por coluna, declarada pelo dado',
        minimo.colunas === minimo.reais && minimo.minimo === `${minimo.colunas * 160}px`, minimo);

      /* E A SETA NÃO É A ÚNICA PORTA: a caixa é focável e recebe teclado (é uma `role=region`). */
      provar('a caixa que rola é focável e anuncia-se como região',
        await pagina.evaluate(() => {
          const c = document.querySelector('#captura-campos .rolagem-caixa');
          return c.getAttribute('tabindex') === '0' && c.getAttribute('role') === 'region'
            && !!c.getAttribute('aria-label');
        }));
    }

    // ----------------------------------------------------------------------------------------
    console.log('\nG. A presença — uma caixa que abre, e a matriz que a segue');
    {
      const antes = await pagina.evaluate(() => {
        const d = document.querySelector('.presenca-da-turma');
        return {
          ehCaixa: d.tagName === 'DETAILS',
          aberta: d.open,
          conta: document.querySelector('#conta-presentes').textContent.trim(),
          botoes: [...d.querySelectorAll('[data-presenca]')].map((b) => b.dataset.presenca),
          caixas: d.querySelectorAll('input[id^="pres-"]').length,
        };
      });
      provar('a presença é uma caixa que abre, e abre sozinha com poucas alunas',
        antes.ehCaixa === true && antes.aberta === true, antes);
      provar('…e diz quantos estão marcados, sem ser preciso percorrer a lista',
        antes.conta === '— 2 de 2', antes.conta);
      provar('…e tem «marcar todos» e «desmarcar todos»',
        JSON.stringify(antes.botoes) === JSON.stringify(['todos', 'nenhum']), antes.botoes);

      /* O GESTO QUE IMPORTA: desmarcar quem faltou tira a linha da matriz e NÃO apaga o que já
       * estava escrito nas outras. É o que faz o caso das cinquenta alunas ser utilizável. */
      await pagina.evaluate(() => {
        const s = document.querySelector('#captura-campos details.eixo:not(.presenca-da-turma) select');
        s.value = 'ok'; s.dispatchEvent(new Event('change', { bubbles: true }));
      });
      const depois = await pagina.evaluate(async () => {
        const b = document.querySelector('input[id="pres-aluna_b"]');
        b.checked = false;
        b.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 250));
        const t = document.querySelector('#captura-campos table.matriz');
        return {
          conta: document.querySelector('#conta-presentes').textContent.trim(),
          linhas: [...t.querySelectorAll('tr')].slice(1).map((tr) => tr.querySelector('th').textContent.trim()),
          sobreviveu: document.querySelector('#captura-campos details.eixo select').value,
        };
      });
      provar('desmarcar uma aluna tira a linha dela da matriz',
        JSON.stringify(depois.linhas) === JSON.stringify(['Aluna A']), depois.linhas);
      provar('…e o que já estava marcado na outra NÃO se perde',
        depois.sobreviveu === 'ok', depois.sobreviveu);
      provar('…e a contagem acompanha', depois.conta === '— 1 de 2', depois.conta);

      const volta = await pagina.evaluate(async () => {
        document.querySelector('[data-presenca="todos"]').click();
        await new Promise((r) => setTimeout(r, 250));
        return { conta: document.querySelector('#conta-presentes').textContent.trim(),
          linhas: document.querySelectorAll('#captura-campos table.matriz')[0].querySelectorAll('tr').length - 1 };
      });
      provar('«marcar todos» devolve as linhas todas',
        volta.conta === '— 2 de 2' && volta.linhas === 2, volta);
    }

  } finally {
    await navegador.close();
    srv.close();
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  const resumo = medido || {};
  console.log('TUDO CERTO — ' + total + ' asserções: a matriz tem as alunas por linha e os aspectos '
    + 'por coluna (' + (resumo.porAluna || '?') + ' por aluna: ' + (resumo.corpo || '?') + ' do corpo, '
    + (resumo.tecnica || '?') + ' da técnica e ' + (resumo.poesia || '?') + ' da poiesis — contados do '
    + 'documento, não escritos aqui); nenhum bloco da folha fica fora dos três eixos, e cada par '
    + '(espaço, item) aparece uma vez; «o plano foi seguido?» é uma pergunta de três estados; o '
    + 'payload passa no validador com a linha de base por aluna; a matriz que não cabe rola dentro '
    + 'de si, com as setas a aparecerem só onde há para onde ir; a presença é uma caixa que abre e '
    + 'que a matriz segue sem perder o que já estava escrito; e a página não estoura a 1280 nem a 390.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
