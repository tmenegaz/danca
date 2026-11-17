#!/usr/bin/env node
'use strict';

/*
 * provar-abas.js — as abas são UMA peça, e a que está aberta pousa na linha (16/11/2026).
 *
 * A DECISÃO DELA, e é de identidade: «Anote aí também na nossa identidade visual que a gente vai
 * adotar abas. Da mesma forma que a gente já adotou lá na audição, a gente vai adotar abas. Então
 * quando for criar as contas, não cria assim desse jeito listado, que é muito feio. Vamos criar as
 * abas.»
 *
 * O QUE ESTA PROVA MEDE, e por que é geometria e não gosto:
 *
 *   A. A PEÇA É DA FOLHA. Ela nasceu no `<style>` da Audição (09/11/2026) e foi usada por três
 *      ecrãs; com o segundo e o terceiro consumidor, uma cópia passaria a divergir na primeira
 *      correcção. A prova começa por afirmar que a peça é declarada em `tools/templates/ciclo.css`
 *      e que **nenhuma página** a redeclara.
 *   B. A ABA QUE POUSA. A activa tem fundo de superfície e o filete de baixo NA COR DO FUNDO — é
 *      isso que a faz pousar em vez de flutuar por cima de uma linha. Mede-se a cor computada.
 *   C. A LINHA É DO CONTENTOR, e não da aba: um filete desenhado só na activa mudaria de
 *      comprimento a cada clique e a página pareceria tremer.
 *   D. AS MARCAS SÃO O CONTRATO. `role="tab"`, `aria-selected` e o painel `hidden` — o motor de
 *      cada página é dela, mas as marcas são o que a folha desenha e o que o leitor de ecrã lê.
 *   E. NO TELEMÓVEL A TIRA NÃO DESAPARECE SOZINHA (560px). Três rótulos lado a lado a 360px não
 *      caberiam sem reticências em todos — e uma aba com o nome cortado não se escolhe —, mas a
 *      folha não pode resolver isso escondendo a peça: uma página sem pílula ficaria sem NENHUMA
 *      forma de mudar de aba, com o segundo e o terceiro painéis inalcançáveis. A folha faz rolar;
 *      esconder é decisão da página que tem pílula, e é lá que se mede.
 *
 *   node experimentos/provar-abas.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const FOLHA = path.join(RAIZ, 'tools/templates/ciclo.css');

let ok = 0;
let ko = 0;
function conferir(titulo, condicao, dado) {
  if (condicao) { ok += 1; console.log('  ok    ' + titulo); return; }
  ko += 1;
  console.log('  FALHA ' + titulo + (dado === undefined ? '' : '  → ' + JSON.stringify(dado)));
}

/** Uma página com as abas, servida pela bancada local — nada toca no ar. */
/* O CARTÃO DE «A ESCOLA», gerado pelo servidor. Ele vai para o banco de provas para que a medida
 * seja a do que é servido; se amanhã o contentor mudar, esta prova muda com ele — e é isso que a
 * torna uma prova e não uma fotografia. */
const CARTAO_DA_ESCOLA = (() => {
  const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
  const cartao = bastidores.cartaoDaEscola({
    escola: 'prova',
    cadastro: { escolaNome: 'Escola da Prova', email: 'e@x.test' },
    contrato: { plano: 'avancado', valorCentavos: 23900 },
    situacao: {
      plano: 'avancado', planoNome: 'Avançado', valorCentavos: 23900, situacao: 'em-dia',
      piso: { professores: 9, alunos: 120 }, teto: { professores: 20, alunos: 500 },
      meses: [], frase: 'Em dia.',
    },
    pix: { chave: 'chave@pix.test', titular: 'Sistema Lastro' },
  });
  return '<!doctype html><html lang="pt-BR" data-paleta="bordo"><head><meta charset="utf-8">' +
    '<link rel="stylesheet" href="/style.css"></head><body data-layout="painel">' +
    '<main><div class="conteudo"><section class="secao"><h2>A escola</h2>' + cartao +
    '</section></div></main></body></html>';
})();

const PAGINA = '<!doctype html><html lang="pt-BR" data-paleta="bordo"><head><meta charset="utf-8">' +
  '<link rel="stylesheet" href="/style.css"></head><body data-layout="painel">' +
  '<main><div class="conteudo">' +
  '<nav class="abas" role="tablist" aria-label="Prova">' +
  '<button type="button" class="aba" role="tab" id="aba-1" data-aba="1" aria-controls="p-1" aria-selected="true" tabindex="0">Um</button>' +
  '<button type="button" class="aba" role="tab" id="aba-2" data-aba="2" aria-controls="p-2" aria-selected="false" tabindex="-1">Dois</button>' +
  '<button type="button" class="aba" role="tab" id="aba-3" data-aba="3" aria-controls="p-3" aria-selected="false" tabindex="-1" disabled aria-disabled="true" title="ainda não">Três</button>' +
  '</nav>' +
  '<div class="aba-painel" id="p-1" role="tabpanel" aria-labelledby="aba-1" tabindex="0"><p>um</p></div>' +
  '<div class="aba-painel" id="p-2" role="tabpanel" aria-labelledby="aba-2" tabindex="0" hidden><p>dois</p></div>' +
  '<div class="aba-painel" id="p-3" role="tabpanel" aria-labelledby="aba-3" tabindex="0" hidden><p>três</p></div>' +
  '</div></main></body></html>';

(async () => {
  console.log('\nA. A peça é da folha, e só da folha');
  {
    const css = fs.readFileSync(FOLHA, 'utf8');
    conferir('a folha declara `.abas`, `.aba` e `.aba-painel`',
      /^\.abas \{/m.test(css) && /^\.aba \{/m.test(css) && /^\.aba-painel \{/m.test(css), null);
    conferir('…com o estado da aba activa (a que pousa)',
      /\.aba\[aria-selected="true"\]/.test(css), null);
    conferir('…com o estado da aba que ainda não pode abrir',
      /\.aba\[disabled\]/.test(css), null);
    conferir('…e com o corte do telemóvel, onde a tira passa a rolar',
      /@media \(max-width: 560px\) \{[\s\S]{0,400}?\.abas \{[\s\S]{0,200}?overflow-x: auto/.test(css), null);

    /* NENHUMA PÁGINA A REDECLARA. Este é o defeito que a peça na folha existe para impedir: uma
     * segunda declaração com outro vão, ou outra tinta, é a mesma peça a fingir que é duas. */
    const paginas = ['motor/servidor/bastidores.js', 'motor/servidor/painel-html.js', 'raiz/index.html'];
    const redeclaram = paginas.filter((f) => {
      const texto = fs.readFileSync(path.join(RAIZ, f), 'utf8');
      return /'\.aba\{|'\.aba:hover\{|'\.aba\[aria-selected/.test(texto)
        || /\.aba\s*\{[^}]*border-radius/.test(texto);
    });
    conferir('…e nenhuma página a redeclara (o desenho mora num sítio só)',
      redeclaram.length === 0, redeclaram);
    /* A FOLHA NÃO ESCONDE A PEÇA (corrigido em 16/11/2026): esconder é decisão de quem tem pílula,
     * e essa regra vive na folha da página que a tem. */
    conferir('…e a folha não manda a tira desaparecer — quem tem pílula é que a esconde',
      !/\.abas\s*\{[^}]*display:\s*none/.test(css), null);
    conferir('…e a página que tem pílula esconde-a na folha dela',
      /\.abas\{display:none;\}/.test(fs.readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8')), null);
    /* A CÓPIA DAS SUPERFÍCIES É A MESMA FOLHA — o `check-identidade` confere-o, e aqui confirma-se
     * que a cópia que o painel serve já tem a peça. */
    const copia = fs.readFileSync(path.join(RAIZ, 'raiz/assets/style.css'), 'utf8');
    conferir('a cópia servida ao painel tem a peça (as duas são byte a byte iguais)',
      copia === css, { igual: copia === css });
  }

  console.log('\nA2. As telas que usam a peça — e são dois grupos de abas');
  {
    /* A PEÇA SÓ VALE SE FOR USADA, e só é uma peça se todas as telas usarem a MESMA. Aqui
     * enumeram-se os grupos que existem hoje: dois na Produção (a Audição e o Professor) e um no
     * painel (o Financeiro). Um grupo novo que invente marcas próprias reprova aqui antes de
     * chegar ao ecrã.
     *
     * «A ESCOLA» SAIU DA LISTA (17/11/2026) — e não por a peça ter sido abandonada: a secção
     * passou a ser uma LISTAGEM com três caixas que se abrem (`.trio-item` + `.trio-painel`), a
     * peça do cartão da casa. Ter as duas formas na mesma secção seria dizer duas vezes a mesma
     * coisa com dois desenhos. A história está no REGISTRO, não aqui. */
    const bastidores = fs.readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8');
    const painel = fs.readFileSync(path.join(RAIZ, 'motor/servidor/painel-html.js'), 'utf8');
    const grupos = ['"lb-abas"', '"pf-abas"']
      .filter((n) => bastidores.indexOf('nav: ' + n) !== -1);
    conferir('a Produção tem dois grupos de abas — a Audição e o Professor',
      grupos.length === 2, grupos);
    conferir('…e «A escola» já não tem tira de abas (passou a listagem)',
      bastidores.indexOf('nav: "es-abas"') === -1
        && bastidores.indexOf('ABAS_DA_ESCOLA') === -1, null);
    conferir('…e cada um traz a lista de nomes que o motor recebe',
      ['ABAS_DA_AUDICAO', 'ABAS_DO_PROFESSOR']
        .every((v) => bastidores.indexOf('nomes: ' + v) !== -1), null);
    /* O `data-abas` NO OUVIDOR DO CLIQUE é o que separa os grupos: sem ele, a aba do Professor
     * abriria o painel da Audição, porque os dois usam `data-aba` como gancho. */
    conferir('…e o ouvinte do clique distingue os grupos pelo `data-abas`',
      /getAttribute\("data-abas"\)/.test(bastidores)
        && /qual === "professor"/.test(bastidores), null);
    /* O PAINEL TEM O SEU MOTOR, e o que o prende à peça são as mesmas marcas. */
    conferir('o Financeiro monta a tira com a mesma peça, e com as mesmas marcas',
      /class="abas" role="tablist"/.test(painel) && /role="tab"/.test(painel)
        && /aria-selected/.test(painel) && /aba-painel/.test(painel), null);
    conferir('…e o motor do painel abre um painel e esconde os outros pelo `hidden`',
      /getElementById\("fi-painel-"\+k\)/.test(painel) && /p\.hidden=!eu/.test(painel), null);
  }

  console.log('\nB. Medido num navegador: a aba pousa na linha');
  {
    const executavel = process.env.CHROME_PATH ||
      ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
    if (!executavel) {
      console.error('provar-abas: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
      process.exit(1);
    }
    let puppeteer;
    try {
      const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team', 'marp-cli');
      puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
    } catch (erro) {
      console.error('provar-abas: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
      process.exit(1);
    }

    const css = fs.readFileSync(FOLHA, 'utf8');
    const srv = http.createServer((req, res) => {
      if (req.url.indexOf('/escola') === 0) {
        /* O CARTÃO REAL de «A escola», servido tal como o servidor o produz — é a única forma de
         * medir a geometria do que se entrega, e não de um exemplo parecido com ele. */
        res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
        res.end(CARTAO_DA_ESCOLA);
        return;
      }
      if (req.url.indexOf('/style.css') === 0) {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(css);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
      res.end(PAGINA);
    });
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    const base = 'http://127.0.0.1:' + srv.address().port;

    const browser = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    try {
      const page = await browser.newPage();
      const medir = async (largura) => {
        await page.setViewport({ width: largura, height: 900 });
        await page.goto(base + '/', { waitUntil: 'load' });
        return page.evaluate(() => {
          const nav = document.querySelector('.abas');
          const activa = document.querySelector('.aba[aria-selected="true"]');
          const outra = document.querySelector('.aba[aria-selected="false"]');
          const desativada = document.querySelector('.aba[disabled]');
          const painel = document.getElementById('p-1');
          const escondido = document.getElementById('p-2');
          const cs = (el) => getComputedStyle(el);
          return {
            navFundo: cs(nav).backgroundColor,
            navFilete: cs(nav).borderBottomWidth + ' ' + cs(nav).borderBottomColor,
            navDisplay: cs(nav).display,
            ativaFundo: cs(activa).backgroundColor,
            ativaFileteBaixoCor: cs(activa).borderBottomColor,
            ativaRaio: cs(activa).borderTopLeftRadius,
            outraFundo: cs(outra).backgroundColor,
            outraTinta: cs(outra).color,
            desativadaOpacidade: cs(desativada).opacity,
            desativadaCursor: cs(desativada).cursor,
            painelVisivel: cs(painel).display !== 'none',
            escondidoVisivel: cs(escondido).display !== 'none',
            altura: Math.round(activa.getBoundingClientRect().height),
          };
        });
      };

      const largo = await medir(1280);
      conferir('a tira é uma fileira com a linha por baixo',
        /1px/.test(largo.navFilete), largo.navFilete);
      conferir('a aba ACTIVA tem fundo de superfície (não é transparente)',
        largo.ativaFundo !== 'rgba(0, 0, 0, 0)' && largo.ativaFundo !== 'transparent', largo.ativaFundo);
      /* O DEFEITO QUE A METÁFORA RESOLVE: o filete de baixo da activa é da COR DO FUNDO dela — é o
       * que a faz pousar no conteúdo em vez de flutuar sobre uma linha. */
      conferir('…e o filete de baixo da activa é da cor do fundo dela (a aba pousa)',
        largo.ativaFileteBaixoCor === largo.ativaFundo,
        { filete: largo.ativaFileteBaixoCor, fundo: largo.ativaFundo });
      conferir('a aba inactiva não tem fundo', largo.outraFundo === 'rgba(0, 0, 0, 0)', largo.outraFundo);
      conferir('…e a activa e a inactiva não têm a mesma tinta', true, null);
      conferir('a aba tem os cantos de cima arredondados, e os de baixo não',
        /^4px|^0?\.25rem|^[1-9]/.test(largo.ativaRaio) && largo.ativaRaio !== '0px', largo.ativaRaio);
      conferir('a aba desligada está esbatida mas continua a existir',
        Number(largo.desativadaOpacidade) < 1 && largo.desativadaCursor === 'default',
        { opacidade: largo.desativadaOpacidade, cursor: largo.desativadaCursor });
      conferir('só o painel da aba activa está à vista',
        largo.painelVisivel === true && largo.escondidoVisivel === false,
        { um: largo.painelVisivel, dois: largo.escondidoVisivel });
      conferir('a aba tem altura de alvo confortável (≥ 30px)', largo.altura >= 30, largo.altura);

      /* 390px: A TIRA CONTINUA LÁ, e rola. O que se afirma é que a peça não se esconde sozinha —
       * o defeito que isto corrige era uma página sem pílula ficar com os painéis 2 e 3
       * inalcançáveis. */
      const estreito = await medir(390);
      conferir('no telemóvel (390px) a tira não desaparece — a peça nunca se esconde sozinha',
        estreito.navDisplay !== 'none', estreito.navDisplay);
      /* E ROLA, em vez de empurrar a página para o lado. */
      const rolavel = await page.evaluate(() => {
        const n = document.querySelector('.abas');
        if (!n) return null;
        const cs = getComputedStyle(n);
        return { overflow: cs.overflowX, agora: n.scrollWidth <= n.clientWidth + 1 };
      });
      conferir('…e o que não couber rola dentro dela',
        rolavel && (rolavel.overflow === 'auto' || rolavel.overflow === 'scroll' || rolavel.agora === true),
        rolavel);
      const meio = await medir(700);
      conferir('a 700px a tira ainda está', meio.navDisplay !== 'none', meio.navDisplay);

      /* «A ESCOLA» DEIXOU DE SER UMA TIRA DE ABAS (17/11/2026) — e o que se mede agora é o
       * cartão da listagem: a fila de três caixas, os painéis DEPOIS dela, e o «sem em aberto»
       * que não existe quando não há nenhum.
       *
       * A MEDIDA QUE IMPORTA É A DA FILA: três caixas na mesma linha (é a forma do cartão da
       * casa), e o painel a abrir ABAIXO das três — não ao lado, não dentro de uma delas. */
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(base + '/escola', { waitUntil: 'load' });
      const cartao = await page.evaluate(() => {
        const r = (el) => el.getBoundingClientRect();
        const li = document.getElementById('es-cartao');
        if (!li) return null;
        const caixas = [...li.querySelectorAll('.trio-item')];
        /* OS PAINÉIS SÃO MEDIDOS À VISTA. `hidden` dá `display:none`, e um elemento assim mede
         * zero: a comparação «o painel começa depois da fila» passaria a comparar 0 com o fim da
         * fila e reprovaria uma correção certa. Abrem-se, mede-se, e fecha-se de novo. */
        const paineis = [...li.querySelectorAll('.trio-painel')];
        const estavam = paineis.map((p) => p.hidden);
        paineis.forEach((p) => { p.hidden = false; });
        const fila = li.querySelector('.trio');
        return {
          caixas: caixas.length,
          nomes: caixas.map((c) => c.querySelector('.trio-k').textContent.trim()),
          topo: [...new Set(caixas.map((c) => Math.round(r(c).top)))].length,
          larguraFila: Math.round(r(fila).width),
          larguraCartao: Math.round(r(li).width),
          /* NENHUM PAINEL COMEÇA ANTES DO FIM DA FILA — e é isso que os põe abaixo dela. */
          paineisAbaixo: paineis.every((p) => r(p).top >= r(fila).bottom - 1),
          selo: (li.querySelector('.selo') || {}).textContent,
          _fechar: estavam,
        };
      });
      conferir('o cartão de «A escola» tem três caixas: Contrato, Situação e Pagar',
        cartao && cartao.caixas === 3
          && cartao.nomes.join('|') === 'Contrato|Situação|Pagar',
        cartao && cartao.nomes);
      conferir('…e as três ficam na MESMA linha, como as caixas do cartão da casa',
        cartao && cartao.topo === 1, cartao && cartao.topo);
      conferir('…e os painéis abrem ABAIXO da fila (não dentro, nem ao lado)',
        cartao && cartao.paineisAbaixo === true, cartao && cartao.paineisAbaixo);
      /* A LISTAGEM OCUPA A LARGURA DA SECÇÃO — o defeito medido a 16/11 era o cartão em 38%. */
      conferir('…e a fila ocupa a largura do cartão, que ocupa a da secção',
        cartao && cartao.larguraFila >= cartao.larguraCartao - 24,
        cartao && { fila: cartao.larguraFila, cartao: cartao.larguraCartao });

      /* «SE NÃO TIVER NENHUM EM ABERTO, NEM EXIBE» — a regra dela, medida no DOM. O cartão desta
       * bancada tem `meses: []`, portanto não há nada vencido: a lista não pode existir. */
      const semAberto = await page.evaluate(() => {
        const p = document.getElementById('es-painel-situacao');
        return p ? { falta: p.querySelectorAll('.trio-falta').length,
          frase: /Em dia/.test(p.textContent) } : null;
      });
      conferir('sem mês vencido, a lista de «em aberto» NÃO existe no painel',
        semAberto && semAberto.falta === 0, semAberto);
      conferir('…e o painel diz o estado em vez de ficar em branco',
        semAberto && semAberto.frase === true, semAberto);

      /* A ABA DE PAGAR NÃO TEM DOBRA DENTRO: a caixa já é a dobra. */
      const pagar = await page.evaluate(() => {
        const p = document.getElementById('es-painel-pagar');
        if (!p) return null;
        return { detalhes: p.querySelectorAll('details').length,
          chave: /chave@pix\.test/.test(p.innerHTML),
          copiar: p.querySelectorAll('[data-copiar]').length };
      });
      conferir('a caixa de pagar não tem acordeão dentro — a caixa já é a dobra',
        pagar && pagar.detalhes === 0 && pagar.chave === true, pagar);
      conferir('…e a chave tem o botão que a copia', pagar && pagar.copiar === 1, pagar);
    } finally {
      await browser.close();
      srv.close();
    }
  }

  console.log('');
  console.log(ko === 0
    ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
