#!/usr/bin/env node
'use strict';

/*
 * provar-monitoramento.js — o consumo, a receita, e o que muda se ela crescer (17/11/2026).
 *
 * O PEDIDO, e as três coisas que ele junta:
 *
 *   «um botão que vai ser monitoramento, e ali eu quero saber cada processo quando ele ocorre, o
 *   quanto ele gastou, quanto falta para o teto, qual é a capacidade total, tanto no GitHub com o
 *   workflow, o CICD, quanto no Cloudflare com ocupação de espaços e os workers e o KV, quanto no
 *   Resend […] eu tenha a receita […] e preciso também fazer uma comparação de quando eu migrar […]
 *   qual é o impacto na minha receita.»
 *
 * E a razão, que é o que decide o desenho: «para não ser pega de surpresa e poder se programar […]
 * para tomar medidas antes que seja tarde demais.»
 *
 * O QUE ESTA PROVA MEDE, e porque cada coisa importa:
 *
 *   A. A CONTA DO GITHUB — porque o número depende de uma regra do fornecedor que é fácil de errar:
 *      **cada job arredondado ao minuto**. Um run de 11 s custa 1 minuto; quatro jobs de 6 a 25 s
 *      custam 4 minutos para 64 s de trabalho. Foi essa diferença (2×) que virou a conta do §L9c ao
 *      contrário em 16/11/2026 — e um monitor que a erre mente sobre a única cota que aperta.
 *   B. AS DUAS COTAS DO RESEND — mês E dia. Mostrar só a mensal dá 97% de folga no dia em que a
 *      diária recusa o envio.
 *   C. O QUE NÃO SE MEDE, DITO. O Cloudflare não expõe operações de KV a este Worker; um zero com
 *      cara de medição é pior do que a ausência do número.
 *   D. A RECEITA — do mesmo livro que o Financeiro, com os descontos descontados uma vez (um por
 *      escola, o mais recente).
 *   E. A MIGRAÇÃO — o custo de cada degrau em percentagem da receita, que é a única forma de «o
 *      mesmo $5» pesar o que pesa.
 *   F. A PÁGINA — as três abas, a barra como peça da folha (e não um `<div>` com `style=""`), e o
 *      preço da tabela a não inventar números.
 *
 *   node experimentos/provar-monitoramento.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const monitor = require(path.join(RAIZ, 'motor/nucleo/monitoramento.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
const leitura = require(path.join(RAIZ, 'motor/servidor/leitura-do-monitor.js'));

let ok = 0;
let ko = 0;
function conferir(titulo, condicao, dado) {
  if (condicao) { ok += 1; console.log('  ok    ' + titulo); return; }
  ko += 1;
  console.log('  FALHA ' + titulo + (dado === undefined ? '' : '  → ' + JSON.stringify(dado)));
}

(async () => {
  console.log('A. A conta do GitHub — cada job arredondado ao minuto');
  {
    /* O RUN DE 11 SEGUNDOS: 1 minuto, e não 0,18. */
    const curto = monitor.minutosDoRun({ id: '1', segundos: 11 }, null);
    conferir('um run de 11 segundos custa 1 minuto facturado',
      curto.minutos === 1 && curto.estimado === true, curto);

    /* O RUN DE QUATRO JOBS: 4 minutos para 64 segundos de trabalho. É o número que decidiu a conta
     * do §L9c — e é o que faz a diferença entre «cabe» e «não cabe». */
    const quatro = monitor.minutosDoRun({ id: '2', segundos: 64 },
      [{ segundos: 10 }, { segundos: 6 }, { segundos: 23 }, { segundos: 25 }]);
    conferir('quatro jobs de 64 s somados custam 4 minutos, e não 1',
      quatro.minutos === 4 && quatro.jobs === 4 && quatro.estimado === false, quatro);
    /* E UM JOB DE 61 SEGUNDOS CUSTA 2: o tecto é por job, não pelo run. */
    conferir('um job de 61 segundos custa 2 minutos (o arredondamento é por job)',
      monitor.minutosDoRun({ id: '3', segundos: 61 }, [{ segundos: 61 }]).minutos === 2, null);

    /* O RESUMO: por fluxo, com a última vez e o custo dela. */
    const g = monitor.resumirGithub({
      runs: [
        { id: '1', workflow: 'Fechar os derivados', segundos: 11, quando: '2026-11-17T01:00:00Z' },
        { id: '2', workflow: 'Publicar as escolas', segundos: 64, quando: '2026-11-17T02:00:00Z' },
        { id: '3', workflow: 'Publicar as escolas', segundos: 50, quando: '2026-11-16T02:00:00Z' },
      ],
      jobsPorRun: { 2: [{ segundos: 10 }, { segundos: 6 }, { segundos: 23 }, { segundos: 25 }] },
    });
    conferir('o resumo soma os minutos facturados, e não o tempo de relógio',
      g.minutos === 1 + 4 + 1, g.minutos);
    conferir('…e agrupa por workflow, do mais caro para o mais barato',
      g.fluxos.length === 2 && g.fluxos[0].workflow === 'Publicar as escolas' && g.fluxos[0].runs === 2,
      g.fluxos.map((f) => [f.workflow, f.minutos]));
    conferir('…e diz quando foi a última vez, e quanto ela custou',
      g.fluxos[0].ultimaEm === '2026-11-17T02:00:00Z' && g.fluxos[0].ultimoMinutos === 4,
      [g.fluxos[0].ultimaEm, g.fluxos[0].ultimoMinutos]);
    conferir('…e conta quantos entraram pelo mínimo (sem os jobs medidos)',
      g.estimados === 2, g.estimados);

    /* O TETO E O EXCEDENTE, com a conta do plano. */
    conferir('o incluído do plano gratuito são 2.000 minutos ($12 a $0,006)',
      monitor.minutosIncluidos(null) === 2000, monitor.minutosIncluidos(null));
    const estourado = monitor.resumirGithub({
      runs: Array.from({ length: 2100 }, (_, i) => ({ id: String(i), workflow: 'X', segundos: 11, quando: 'q' })),
    });
    conferir('passando o incluído, o excedente aparece em minutos e em dólar',
      estourado.excedenteMinutos === 100 && Math.round(estourado.excedenteUsd * 100) === 60,
      [estourado.excedenteMinutos, estourado.excedenteUsd]);
    conferir('…e o Team muda o incluído, sem mudar a conta',
      monitor.minutosIncluidos({ computeUsd: 18 }) === 3000, null);
  }

  console.log('\nB. As duas cotas do Resend — e a que aperta primeiro');
  {
    const c = monitor.resumirCorreio({
      contadores: { mes: '2026-11', enviados: 24, falhados: 1, dias: { '2026-11-17': { enviados: 12 } } },
      hoje: '2026-11-17',
    });
    conferir('o mês e o dia são contados em separado',
      c.enviados === 24 && c.enviadosHoje === 12, [c.enviados, c.enviadosHoje]);
    conferir('…e o painel sabe qual das duas manda: aqui é o DIA',
      c.manda === 'dia' && c.fraccaoDia > c.fraccao, [c.manda, c.fraccaoDia, c.fraccao]);
    conferir('…com o que resta em cada uma',
      c.restantes === 3000 - 24 && c.restantesHoje === 100 - 12, [c.restantes, c.restantesHoje]);
    /* NUM DIA SEM ENVIO, a mensal manda — e a diária não inventa alerta. */
    const calmo = monitor.resumirCorreio({
      contadores: { mes: '2026-11', enviados: 2500, dias: {} }, hoje: '2026-11-17',
    });
    conferir('no fim do mês e sem envios no dia, quem manda é a cota mensal',
      calmo.manda === 'mes' && calmo.enviadosHoje === 0, [calmo.manda, calmo.enviadosHoje]);
    /* O PLANO PAGO TIRA A COTA DIÁRIA, e o painel tem de deixar de a mostrar. */
    const pago = monitor.resumirCorreio({
      contadores: { mes: '2026-11', enviados: 10, dias: {} }, hoje: '2026-11-17',
      plano: monitor.COTAS.resend.planos[1],
    });
    conferir('no plano pago, o limite diário desaparece do painel',
      pago.limiteDia === null && pago.total === 50000, [pago.limiteDia, pago.total]);
  }

  console.log('\nC. O Cloudflare — o que se mede, e o que se diz que não');
  {
    const cf = monitor.resumirCloudflare({
      escolas: [{ slug: 'breu' }, { slug: 'calango' }],
      chaves: { breu: { total: 120, bytes: 2 * 1024 * 1024 }, calango: { total: 80, bytes: 1024 * 1024 } },
    });
    conferir('a ocupação soma chaves e bytes das escolas',
      cf.chaves === 200 && Math.round(cf.armazenamentoGb * 1024) === 3, [cf.chaves, cf.armazenamentoGb]);
    conferir('…e lista o que NÃO foi medido, com a cota ao lado',
      cf.naoMedido.length === 3 && cf.naoMedido.every((n) => Number(n.cota) > 0), cf.naoMedido);
    conferir('…e diz PORQUE não foi medido, em vez de mostrar zero',
      /analítica|analytics/i.test(cf.motivoNaoMedido), cf.motivoNaoMedido);
    /* SEM CHAVES LIDAS, a escola aparece com `medido: false` — não desaparece da lista. */
    const semLeitura = monitor.resumirCloudflare({ escolas: [{ slug: 'nova' }], chaves: {} });
    conferir('uma escola cujo KV não foi lido aparece marcada, e não some',
      semLeitura.porEscola.length === 1 && semLeitura.porEscola[0].medido === false, semLeitura.porEscola);
  }

  console.log('\nD. A receita — do livro do financeiro, com o desconto contado uma vez');
  {
    const extrato = [
      { escola: 'duo', valorCentavos: 23900, meses: [
        { mes: '2026-11', status: 'pago', valorPagoCentavos: 23900, venceu: false },
        { mes: '2026-10', status: 'pago', valorPagoCentavos: 22900, venceu: false },
      ] },
      { escola: 'breu', valorCentavos: 13990, meses: [
        { mes: '2026-11', status: 'aberto', valorCentavos: 13990, venceu: true },
      ] },
    ];
    /* DOIS DESCONTOS PARA A MESMA ESCOLA: vale o mais recente — a lista vem ordenada assim, e
     * somar os dois contaria o substituído duas vezes. */
    const r = monitor.receita({
      extrato, mes: '2026-11',
      descontos: [
        { escola: 'duo', valorCentavos: 5000, em: '2026-11-10T00:00:00Z' },
        { escola: 'duo', valorCentavos: 9000, em: '2026-09-01T00:00:00Z' },
      ],
    });
    conferir('o MRR é a soma dos contratos menos os descontos',
      r.brutoCentavos === 37890 && r.descontosCentavos === 5000 && r.mrrCentavos === 32890,
      [r.brutoCentavos, r.descontosCentavos, r.mrrCentavos]);
    conferir('…e o desconto substituído não é contado duas vezes',
      r.descontosCentavos === 5000, r.descontosCentavos);
    conferir('o recebido é o do MÊS, e não o de todos os meses pagos',
      r.recebidoNoMesCentavos === 23900, r.recebidoNoMesCentavos);
    conferir('…e o em aberto é o que venceu sem pagamento',
      r.emAbertoCentavos === 13990, r.emAbertoCentavos);
    conferir('o anual é 12× o mês — o número que se compara com um custo anual',
      r.anualCentavos === r.mrrCentavos * 12, r.anualCentavos);
  }

  console.log('\nE. A migração — o custo em percentagem da receita');
  {
    const r = { mrrCentavos: 100000 }; // R$ 1.000/mês
    const m = monitor.impactoDaMigracao({ receita: r, cambio: 5, custosAtuaisUsd: 0 });
    conferir('com R$ 1.000/mês e câmbio 5, a receita em dólar é 200',
      Math.round(m.receitaUsd) === 200, m.receitaUsd);
    conferir('…e os cinco degraus estão todos na tabela',
      m.cenarios.length === 5 && m.cenarios.every((c) => c.usdMes > 0),
      m.cenarios.map((c) => [c.id, c.usdMes]));
    /* O CLOUDFLARE É $5: sobre $200 de receita são 2,5%. A conta é o que ela quer ver. */
    const cf = m.cenarios.find((c) => c.id === 'cloudflare-paid');
    conferir('…e cada um traz a fracção da receita que ele come',
      Math.abs(cf.fraccaoDaReceita - 0.025) < 1e-9, cf.fraccaoDaReceita);
    /* O MESMO $5 SOBRE UMA RECEITA PEQUENA PESA OUTRA COISA — é a razão de a coluna existir. */
    const pequena = monitor.impactoDaMigracao({ receita: { mrrCentavos: 6990 }, cambio: 5, custosAtuaisUsd: 0 });
    const cfPequena = pequena.cenarios.find((c) => c.id === 'cloudflare-paid');
    conferir('…e o mesmo plano pesa mais numa receita pequena',
      cfPequena.fraccaoDaReceita > cf.fraccaoDaReceita, [cfPequena.fraccaoDaReceita, cf.fraccaoDaReceita]);
    /* SEM CÂMBIO, a percentagem NÃO É CALCULADA — e isso diz-se, em vez de se inventar. */
    const semCambio = monitor.impactoDaMigracao({ receita: r, cambio: null, custosAtuaisUsd: 0 });
    conferir('sem câmbio declarado, não há percentagem — e a frase diz isso',
      semCambio.cenarios.every((c) => c.fraccaoDaReceita === null) && /câmbio/i.test(semCambio.frase),
      semCambio.frase);
    /* SEM RECEITA, a frase não divide por zero. */
    const zero = monitor.impactoDaMigracao({ receita: { mrrCentavos: 0 }, cambio: 5, custosAtuaisUsd: 0 });
    conferir('sem receita, a frase diz o que se passa em vez de dividir por zero',
      /não existe|100%/i.test(zero.frase), zero.frase);
  }

  console.log('\nF. O retrato: o pior indicador manda, e os níveis são os da casa');
  {
    const folgado = monitor.retrato({
      github: { fraccao: 0.1 }, correio: { fraccao: 0.05, fraccaoDia: 0.02 },
      cloudflare: { fraccaoArmazenamento: 0.001 }, receita: { mrrCentavos: 0 },
    });
    conferir('com tudo abaixo de 80%, o nível é «folga»',
      folgado.nivel === 'folga' && folgado.piorFraccao === 0.1, folgado.nivel);
    const atencao = monitor.retrato({ github: { fraccao: 0.85 }, correio: { fraccao: 0.05 }, cloudflare: {} });
    conferir('passando dos 80%, o nível é «atencao» — o pior, e não a média',
      atencao.nivel === 'atencao', atencao.nivel);
    const agora = monitor.retrato({ github: { fraccao: 0.1 }, correio: { fraccao: 0.04, fraccaoDia: 0.97 }, cloudflare: {} });
    conferir('uma cota diária a 97% sobe o alarme mesmo com o resto em folga',
      agora.nivel === 'agora' && agora.piorFraccao === 0.97, [agora.nivel, agora.piorFraccao]);
  }

  console.log('\nG. A leitura: o que se pede ao GitHub e o que se guarda');
  {
    /* A JANELA CORTA O QUE É ANTIGO, e o teste não faz rede: um `fetch` de mentira devolve a
     * página, e o que se mede é o filtro. */
    const agora = '2026-11-17T12:00:00Z';
    const pedidos = [];
    const falso = async (url) => {
      pedidos.push(url);
      return {
        ok: true, status: 200,
        json: async () => ({ workflow_runs: [
          { id: 1, name: 'A', run_started_at: '2026-11-17T01:00:00Z', updated_at: '2026-11-17T01:01:00Z', status: 'completed' },
          { id: 2, name: 'B', run_started_at: '2026-09-01T01:00:00Z', updated_at: '2026-09-01T01:01:00Z', status: 'completed' },
        ] }),
      };
    };
    const j = await leitura.runsDoGithub({ token: 'x', dono: 'd', repo: 'r', dias: 30, agora, fetchImpl: falso });
    conferir('a janela de 30 dias deixa entrar o run de hoje e corta o de setembro',
      j.ok && j.runs.length === 1 && j.runs[0].id === '1', j.runs.map((r) => r.id));
    conferir('…e pede os 100 por página, com a autorização',
      pedidos.length === 1 && /per_page=100/.test(pedidos[0]), pedidos[0]);
    /* SEM TOKEN NÃO SE PEDE NADA — e o motivo é dito. */
    const semToken = await leitura.runsDoGithub({ token: null, dono: 'd', repo: 'r', dias: 30, agora });
    conferir('sem token, não há pedido e o motivo é dito',
      semToken.ok === false && /GITHUB_TOKEN/.test(semToken.motivo), semToken.motivo);
  }

  console.log('\nH. A página: três abas, a peça da folha, e nenhum número inventado');
  {
    const g = monitor.resumirGithub({ runs: [{ id: '1', workflow: 'Fechar os derivados', segundos: 11, quando: '2026-11-17T01:00:00Z' }] });
    const co = monitor.resumirCorreio({ contadores: { mes: '2026-11', enviados: 3, dias: { '2026-11-17': { enviados: 1 } } }, hoje: '2026-11-17' });
    const cf = monitor.resumirCloudflare({ escolas: [{ slug: 'breu' }], chaves: { breu: { total: 10, bytes: 5000 } } });
    const r = monitor.receita({ extrato: [{ escola: 'breu', valorCentavos: 13990, meses: [] }], descontos: [], mes: '2026-11' });
    const retrato = monitor.retrato({ github: g, correio: co, cloudflare: cf, receita: r, cambio: 5.4, agora: '2026-11-17T12:00:00Z' });
    const html = painel.paginaDoMonitoramento({ retrato, cambio: 5.4 });

    const { JSDOM } = require('jsdom');
    const d = new JSDOM(html).window.document;
    const abas = [...d.querySelectorAll('#mo-abas [role="tab"]')].map((b) => b.getAttribute('data-aba'));
    conferir('o monitoramento está em três abas: consumo, receita e migração',
      JSON.stringify(abas) === JSON.stringify(['consumo', 'receita', 'migracao']), abas);
    conferir('…e abre no consumo, com os outros dois escondidos',
      d.getElementById('mo-painel-consumo').hidden === false
        && d.getElementById('mo-painel-receita').hidden === true
        && d.getElementById('mo-painel-migracao').hidden === true, null);
    conferir('…com os três fornecedores na aba do consumo',
      d.getElementById('monitor-github') && d.getElementById('monitor-cloudflare')
        && d.getElementById('monitor-resend'), null);
    /* A BARRA É A PEÇA DA FOLHA, e não um `<div>` com uma largura escrita à mão. */
    const barras = [...d.querySelectorAll('progress.cota')];
    conferir('as barras são `<progress class="cota">` — a peça da folha',
      barras.length === 3 && barras.every((b) => b.getAttribute('max') === '1000'), barras.length);
    conferir('…e NÃO há `style=""` na marcação (regra 5 da identidade)',
      !/style="/.test(html), (html.match(/style="[^"]*"/g) || []).slice(0, 2));
    const css = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
    conferir('a peça `.cota` está declarada na folha, com os três níveis',
      /^\.cota \{/m.test(css) && /\.cota\[data-nivel="atencao"\]/.test(css)
        && /\.cota\[data-nivel="agora"\]/.test(css), null);
    /* «O QUE NÃO SE MEDE» TEM DE ESTAR NA PÁGINA — é a metade que faz disto um painel. */
    conferir('a página diz o que não foi medido, em vez de mostrar zero',
      /não mede|não foi medido/i.test(html) && /escritas de KV por dia/i.test(html), null);
    conferir('…e diz que o Resend conta o que o sistema pediu, não a fatura',
      /não é a fatura|Bounces/i.test(html), null);
    /* A RECEITA E A MIGRAÇÃO trazem os números, e não só os títulos. */
    conferir('a aba da receita mostra o mês e o ano',
      /R\$ 139,90/.test(html) && /R\$ 1\.678,80|1678,80/.test(html), null);
    conferir('a aba da migração traz os cinco degraus com a fracção da receita',
      /GitHub Team/.test(html) && /Resend Pro/.test(html) && /da receita/i.test(html), null);
    conferir('…e o câmbio usado não está escondido',
      /1 = R\$ 5,4/.test(html), (html.match(/Câmbio[^<]*/) || [])[0]);
  }

  /* ------------------------------------------------ a geometria, num navegador */
  const executavel = process.env.CHROME_PATH ||
    ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (executavel) {
    console.log('\nI. A barra, medida num navegador de verdade');
    let puppeteer = null;
    try {
      const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team', 'marp-cli');
      puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
    } catch (erro) { puppeteer = null; }
    if (!puppeteer) {
      console.log('  (puppeteer não encontrado — a medição da barra NÃO foi feita)');
    } else {
      const css = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
      const pagina = '<!doctype html><html lang="pt-BR" data-paleta="verde"><head><meta charset="utf-8">' +
        '<link rel="stylesheet" href="/assets/style.css"></head><body data-layout="painel"><main>' +
        '<div class="conteudo">' +
        '<progress class="cota" data-nivel="folga" value="100" max="1000">10%</progress>' +
        '<progress class="cota" data-nivel="atencao" value="850" max="1000">85%</progress>' +
        '<progress class="cota" data-nivel="agora" value="980" max="1000">98%</progress>' +
        '<progress class="cota" data-nivel="folga" value="0" max="1000">0%</progress>' +
        '</div></main></body></html>';
      const srv = http.createServer((req, res) => {
        if (req.url.indexOf('/assets/style.css') === 0) {
          res.writeHead(200, { 'Content-Type': 'text/css' });
          res.end(css);
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
        res.end(pagina);
      });
      await new Promise((r) => srv.listen(0, '127.0.0.1', r));
      const base = 'http://127.0.0.1:' + srv.address().port;
      const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
      try {
        const pg = await br.newPage();
        await pg.setViewport({ width: 1280, height: 800 });
        await pg.goto(base + '/', { waitUntil: 'load' });
        const m = await pg.evaluate(() => {
          const todas = [...document.querySelectorAll('progress.cota')];
          const cs = (el) => getComputedStyle(el);
          return {
            altura: todas.map((b) => Math.round(b.getBoundingClientRect().height)),
            largura: todas.map((b) => Math.round(b.getBoundingClientRect().width)),
            raio: todas.map((b) => cs(b).borderRadius),
            aparencia: cs(todas[0]).appearance || cs(todas[0]).webkitAppearance,
          };
        });
        conferir('a barra tem altura de traço (≤ 12px) e largura de coluna',
          m.altura.every((h) => h > 0 && h <= 12) && m.largura.every((l) => l > 100),
          { altura: m.altura, largura: m.largura });
        conferir('…e é a peça despida da folha, não o `<progress>` do navegador',
          m.aparencia === 'none', m.aparencia);
        conferir('…e os cantos são de pílula', m.raio.every((r) => /999px/.test(r)), m.raio);
      } finally {
        await br.close();
        srv.close();
      }
    }
  }

  console.log('');
  if (ko) {
    console.log('FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + ok + ' asserção(ões).');
})();
