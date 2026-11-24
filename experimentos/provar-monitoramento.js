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

/* AS LINHAS DA FATURA DE NOVEMBRO, lidas da API a 17/11/2026 — a soma dá o que ela viu no
 * ecrã: 1.933 min, $11,60 de valor, $11,60 de desconto, $0,00 a pagar. Duas linhas bastam para a
 * aritmética; uma terceira, de OUTUBRO, prova que meses diferentes não se misturam. */
const LINHAS_DA_FACTURA = [
  { quando: '2026-11-01T00:51:40Z', produto: 'actions', sku: 'Actions Linux', unidade: 'Minutes',
    quantidade: 141, precoUnitario: 0.006, bruto: 0.846, desconto: 0.846, liquido: 0 },
  { quando: '2026-11-17T00:12:31Z', produto: 'actions', sku: 'Actions Linux', unidade: 'Minutes',
    quantidade: 1792, precoUnitario: 0.006, bruto: 10.754, desconto: 10.754, liquido: 0 },
];
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
    /* A CALIBRAGEM ENTRA AQUI (17/11/2026), e a asserção muda com ela — de propósito.
     *
     * O run 3 é do fluxo «Publicar as escolas», que TEM um run medido (4 minutos). Sem medição
     * própria, ele leva a média do fluxo: 4. Somar 1 seria o mínimo arbitrário que, em produção,
     * fez o painel dizer 27,7% de uma cota estourada — com 2.810 execuções na janela e 500 lidas,
     * o piso por execução dava um número 5× menor do que a fatura.
     *
     * O QUE SE AFIRMA, então: o medido manda, e o não medido herda a média do seu fluxo. */
    conferir('o resumo soma os minutos facturados, e o não medido herda a média do seu fluxo',
      g.minutos === 1 + 4 + 4, g.minutos);
    conferir('…e diz quantas execuções foram medidas de facto',
      g.medidos === 1 && g.estimados === 2, [g.medidos, g.estimados]);
    /* O FLUXO SEM NENHUMA MEDIÇÃO fica com o mínimo de 1 minuto — e é o caso do «Fechar os
     * derivados», que não tem jobs medidos nesta fixture. */
    const fechar = g.fluxos.find((f) => f.workflow === 'Fechar os derivados');
    conferir('o fluxo sem nenhuma execução medida leva o mínimo de 1 minuto',
      fechar.minutos === 1 && fechar.calibrado === false, fechar);
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

    /* ── A CONFERÊNCIA CONTRA O FORNECEDOR (17/11/2026) ──────────────────────────────────────
     *
     * A conta é uma REGRA; a facturação é um CAMPO do fornecedor. No primeiro dia em produção os
     * dois discordaram por completo (`billable` zero com jobs de 13 a 34 segundos), e o painel tem
     * de mostrar os dois em vez de escolher um em silêncio. Estas três asserções fixam o que o
     * resumo faz com essa discordância. */
    const confere = monitor.resumirGithub({
      runs: [{ id: '9', workflow: 'Fechar os derivados', segundos: 18, quando: '2026-11-17T03:00:00Z' }],
      jobsPorRun: { 9: [{ segundos: 18 }] },
      conferencia: {
        run: '9', workflow: 'Fechar os derivados', quando: '2026-11-17T03:00:00Z',
        facturavelMs: 0, jobs: 1, segundos: 18, estimadoMinutos: 1,
      },
    });
    conferir('com o fornecedor a dizer zero, a conferência di-lo — e não atesta consumo',
      confere.conferencia && confere.conferencia.facturavelMinutos === 0 && confere.conferencia.atesta === false,
      confere.conferencia);
    conferir('…sem apagar o número da regra, que continua a ser o do painel',
      confere.minutos === 1, confere.minutos);
    const confereCobrado = monitor.resumirGithub({
      runs: [{ id: '9', workflow: 'X', segundos: 18, quando: 'q' }],
      jobsPorRun: { 9: [{ segundos: 18 }] },
      conferencia: { run: '9', workflow: 'X', facturavelMs: 120000, jobs: 2, segundos: 95, estimadoMinutos: 2 },
    });
    conferir('…e quando o fornecedor atesta 2 minutos, diz 2 e atesta',
      confereCobrado.conferencia.facturavelMinutos === 2 && confereCobrado.conferencia.atesta === true,
      confereCobrado.conferencia);
    const semConf = monitor.resumirGithub({
      runs: [{ id: '9', workflow: 'X', segundos: 18, quando: 'q' }],
    });
    conferir('…e sem resposta do fornecedor, a conferência é nula (não é zero)',
      semConf.conferencia === null, semConf.conferencia);
  }

  console.log('\nA2. Quem ainda corre, e quem só continua na tabela como história');
  {
    /* A TABELA AGREGA O MÊS, e o mês inclui fluxos fundidos ou apagados. A 17/11/2026 o «Regerar os
     * índices» tinha 768 min no topo e já não existia — foi fundido no `derivados.yml` a 16/11. Quem
     * olha para ali para decidir dinheiro lê «isto gasta 768 min por mês», e é falso. */
    const g = monitor.resumirGithub({
      runs: [
        { id: '1', workflow: 'Regerar os índices', segundos: 15, quando: '2026-11-16T01:30:00Z' },
        { id: '2', workflow: 'Publicar o sistema', segundos: 32, quando: '2026-11-17T13:10:00Z' },
      ],
      agora: '2026-11-17T16:00:00Z',
    });
    const antigo = g.fluxos.find((f) => f.workflow === 'Regerar os índices');
    const vivo = g.fluxos.find((f) => f.workflow === 'Publicar o sistema');
    conferir('um fluxo sem execuções nas últimas 24 h fica marcado, e um vivo não',
      antigo.activoUltimas24h === false && vivo.activoUltimas24h === true,
      [antigo.activoUltimas24h, vivo.activoUltimas24h]);

    const co = monitor.resumirCorreio({ contadores: { mes: '2026-11', enviados: 3, dias: {} }, hoje: '2026-11-17' });
    const cf = monitor.resumirCloudflare({ escolas: [], chaves: {} });
    const r = monitor.receita({ extrato: [], descontos: [], mes: '2026-11' });
    const html = painel.paginaDoMonitoramento({
      retrato: monitor.retrato({ github: g, correio: co, cloudflare: cf, receita: r, cambio: 5.4, agora: '2026-11-17T16:00:00Z' }),
      cambio: 5.4,
    });
    conferir('…e o ecrã diz isso ao lado do nome, em vez de deixar o número a mentir',
      /Regerar os índices<\/strong><br><span class="sub">sem execuções nas últimas 24 h/.test(html), null);
  }

  console.log('\nA3. A ROTAÇÃO: público enquanto o crédito aperta, privado no dia 1.º');
  {
    /* A POLÍTICA DECLARADA A 17/11/2026: em desenvolvimento, quando o crédito do mês aperta, o
     * repositório passa a público — os minutos de Actions em repositório público são gratuitos e
     * ilimitados — e no dia 1.º volta a privado. O painel tem de saber em que metade está, ou
     * mostra uma conta a pagar sobre minutos que o fornecedor não cobra. */
    const linhas = [{ quando: '2026-11-17T00:00:00Z', quantidade: 1936, bruto: 11.62,
      desconto: 11.62, liquido: 0, precoUnitario: 0.006 }];
    const pub = monitor.resumirGithub({
      runs: [], facturado: { ok: true, linhas }, agora: '2026-11-17T12:00:00Z', repositorioPublico: true,
    });
    const priv = monitor.resumirGithub({
      runs: [], facturado: { ok: true, linhas }, agora: '2026-11-17T12:00:00Z', repositorioPublico: false,
    });
    conferir('num repositório público a cobrança é zero, mesmo com a fatura a registar valor',
      pub.repositorioPublico === true && pub.cobravel === false && pub.cobravelUsd === 0
        && pub.liquidoDaFaturaUsd === 0, [pub.cobravel, pub.cobravelUsd, pub.liquidoDaFaturaUsd]);
    conferir('…e a projecção do fim do mês também é zero — não há conta a pagar',
      pub.liquidoPrevistoCobravelUsd === 0, pub.liquidoPrevistoCobravelUsd);
    conferir('…enquanto num repositório privado a projecção continua a existir',
      priv.cobravel === true && priv.liquidoPrevistoCobravelUsd > 0, priv.liquidoPrevistoCobravelUsd);

    const co = monitor.resumirCorreio({ contadores: { mes: '2026-11', enviados: 3, dias: {} }, hoje: '2026-11-17' });
    const cf = monitor.resumirCloudflare({ escolas: [], chaves: {} });
    const r = monitor.receita({ extrato: [], descontos: [], mes: '2026-11' });
    const html = (g) => painel.paginaDoMonitoramento({
      retrato: monitor.retrato({ github: g, correio: co, cloudflare: cf, receita: r, cambio: 5.4, agora: '2026-11-17T12:00:00Z' }),
      cambio: 5.4,
    });
    /* O LEMBRETE QUE A POLÍTICA PRECISA — e é assimétrico de propósito: esquecer de tornar público
     * dói no bolso e nota-se; esquecer de tornar PRIVADO no dia 1.º não dói em lado nenhum. */
    conferir('…e o ecrã diz que está público E que no dia 1.º volta a privado',
      /O repositório está público/.test(html(pub))
        && /No dia 1\.º ele volta a privado/.test(html(pub)), null);
    conferir('…e no estado privado diz a política, para não depender da memória de ninguém',
      /Repositório <strong>privado<\/strong>/.test(html(priv))
        && /torná-lo público até ao dia 1\.º/.test(html(priv)), null);
  }

  console.log('\nA4. O botão de migrar — o que faz, e o que recusa fazer');
  {
    const receita = monitor.receita({ extrato: [{ escola: 'breu', valorCentavos: 23990, meses: [] }], descontos: [], mes: '2026-11' });
    const m = monitor.impactoDaMigracao({ receita, cambio: 5.4, custosAtuaisUsd: 0 });
    const livre = m.cenarios.find((c) => c.id === 'github-free');
    const team = m.cenarios.find((c) => c.id === 'github-team');
    conferir('o plano gratuito entra na escada, a custo zero',
      Boolean(livre) && livre.usdMes === 0, livre && livre.usdMes);
    conferir('…e é o ÚNICO cuja migração se faz por API: a visibilidade',
      livre.migrar.possivel === true && livre.migrar.accao === 'visibilidade',
      livre.migrar);
    /* UM BOTÃO QUE PROMETE O QUE NÃO FAZ É PIOR DO QUE NÃO TER BOTÃO. Os planos pagos são
     * subscrições: nenhum dos três fornecedores expõe a mudança na API — e cada linha diz onde se
     * faz à mão, em vez de oferecer um clique que não cumpre. */
    const pagos = m.cenarios.filter((c) => c.id !== 'github-free');
    conferir('todos os planos pagos têm linha, com migração RECUSADA e o motivo dito',
      pagos.length === 5 && pagos.every((c) => c.migrar.possivel === false && c.migrar.motivo),
      pagos.map((c) => [c.id, c.migrar.possivel]));
    conferir('…e mandam ao sítio onde a mudança se faz à mão',
      pagos.every((c) => typeof c.migrar.ligacao === 'string' && /^https:\/\//.test(c.migrar.ligacao)),
      pagos.map((c) => c.migrar.ligacao));

    const co = monitor.resumirCorreio({ contadores: { mes: '2026-11', enviados: 3, dias: {} }, hoje: '2026-11-17' });
    const cf = monitor.resumirCloudflare({ escolas: [], chaves: {} });
    const html = (vis, rec) => painel.paginaDoMonitoramento({
      retrato: monitor.retrato({ github: null, correio: co, cloudflare: cf, receita, cambio: 5.4, agora: '2026-11-17T12:00:00Z' }),
      cambio: 5.4, visibilidade: vis, recado: rec, aba: 'migracao',
    });
    /* O FORMULÁRIO EXISTE E É UM POST DE VERDADE — não um `fetch`: a acção mais perigosa desta casa
     * não pode depender de um script correr. */
    const pub = html({ publico: true }, null);
    conferir('com o repositório público, o botão oferece TORNAR PRIVADO',
      /Tornar privado/.test(pub) && /name="publico" value="nao"/.test(pub)
        && /action="\/monitoramento\/visibilidade"/.test(pub), null);
    conferir('…e leva a confirmação explícita, porque abrir não se desfaz',
      /name="confirmado" value="sim"/.test(pub), null);
    const priv = html({ publico: false }, null);
    conferir('com o repositório privado, o botão oferece TORNAR PÚBLICO, e avisa do que isso custa',
      /Tornar público/.test(priv) && /name="publico" value="sim"/.test(priv)
        && /não se desfaz/.test(priv), null);
    conferir('…e nos planos pagos NÃO há botão de submeter, só a razão',
      (priv.match(/type="submit"/g) || []).length === 1, (priv.match(/type="submit"/g) || []).length);

    /* O RECADO — sucesso e falha, os dois ditos. Um recado que não se vê é o mesmo que não existir,
     * e um sucesso inventado é a mentira que este painel existe para não contar. */
    conferir('o recado de sucesso diz que ficou público',
      /Feito: o repositório está agora <strong>público<\/strong>/.test(html({ publico: true }, { ok: true, mudou: 'publico' })),
      (html({ publico: true }, { ok: true, mudou: 'publico' }).match(/mo-recado[\s\S]{0,160}/) || [null])[0]);
    conferir('…e o de falha diz que NADA mudou, com o motivo',
      /Não foi feito/.test(html({ publico: true }, { ok: false, falhou: 'o token não pode mudar a visibilidade' }))
        && /Nada mudou no repositório/.test(html({ publico: true }, { ok: false, falhou: 'x' })), null);

    /* A LEITURA/ESCRITA, sem rede: um `fetch` de mentira. O 403 traz a permissão no CABEÇALHO, e é
     * de lá que ela tem de sair — «o token não pode» não diz a ninguém o que corrigir. */
    const cabecalho = (v) => ({ headers: { get: (n) => (n.toLowerCase() === 'x-accepted-github-permissions' ? v : null) } });
    const nega = async () => ({ ok: false, status: 403,
      headers: { get: (n) => (n.toLowerCase() === 'x-accepted-github-permissions' ? 'administration=write' : null) },
      json: async () => ({}) });
    const r1 = await leitura.definirVisibilidadeDoRepo({ token: 'x', dono: 'd', repo: 'r', publico: true, fetchImpl: nega });
    conferir('um 403 devolve a permissão que falta, lida do cabeçalho do próprio GitHub',
      r1.ok === false && r1.pede === 'administration=write' && /administration=write/.test(r1.motivo),
      r1);
    const aceita = async (u, o) => ({
      ok: true, status: 200, headers: { get: () => null },
      json: async () => ({ private: JSON.parse(o.body).private }),
    });
    const r2 = await leitura.definirVisibilidadeDoRepo({ token: 'x', dono: 'd', repo: 'r', publico: true, fetchImpl: aceita });
    conferir('…e um pedido aceite devolve o estado NOVO, lido da resposta e não suposto',
      r2.ok === true && r2.publico === true && r2.privado === false, r2);
    /* SEM `publico` DEFINIDO NÃO SE ADIVINHA: um booleano em falta é recusa. */
    const r3 = await leitura.definirVisibilidadeDoRepo({ token: 'x', dono: 'd', repo: 'r', fetchImpl: aceita });
    conferir('…e um pedido sem visibilidade é RECUSADO, em vez de assumir um valor',
      r3.ok === false && /não diz para que visibilidade/.test(r3.motivo), r3.motivo);
  }

  console.log('\nA5. O estado da visibilidade não pode ser servido de uma cache velha');
  {
    /* MEDIDO AO VIVO NO PRIMEIRO MINUTO (17/11/2026): o repositório foi tornado público à mão no
     * GitHub e o painel continuou a dizer «está privado», porque a cache de UMA HORA — a da factura
     * — guardava a leitura anterior. Um painel que mostra o estado antigo da única coisa que ele
     * próprio muda é pior do que não mostrar estado nenhum.
     *
     * A correcção é a visibilidade ter cache PRÓPRIA e curta (5 minutos), e não a da factura. O
     * dinheiro não muda de minuto a minuto; a visibilidade muda com um clique. */
    const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/raiz.js'), 'utf8');
    conferir('a visibilidade tem carimbo próprio (`visibilidadeEm`), e não o da factura',
      /cache\.visibilidadeEm/.test(fonte) && /visibilidadeVelha/.test(fonte), null);
    conferir('…e a janela dela é de cinco minutos, não de uma hora',
      /5 \* 60 \* 1000/.test(fonte), null);
    /* E O CÂMBIO DECLARADO: sem ele a coluna «Da receita» fica sempre vazia, e a decisão de
     * contratar existe sem a conta que a informa. */
    const wr = fs.readFileSync(path.join(RAIZ, 'wrangler.danca.jsonc'), 'utf8');
    conferir('o câmbio está declarado no Worker — sem ele não há percentagem da receita',
      /"CAMBIO_USD_BRL"\s*:/.test(wr), null);
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
    /* A FORMA, E NÃO O NÚMERO (25/11/2026). Aqui esteve `length === 3`, e o número passou a ser
     * cinco quando as LISTAGENS e os APAGAMENTOS entraram na lista — as duas estavam declaradas nas
     * cotas desde o início e nunca eram nomeadas, e uma cota que existe e não se nomeia é uma cota
     * que ninguém vigia. Uma prova que fixa a contagem fica vermelha sobre um mundo melhor; o que
     * ela tem de afirmar é a REGRA: tudo o que não se mediu aparece, com a cota ao lado. */
    conferir('…e lista o que NÃO foi medido, com a cota ao lado',
      cf.naoMedido.length === 5 && cf.naoMedido.every((n) => Number(n.cota) > 0), cf.naoMedido);
    /* E as cotas que ele nomeia são as do plano, uma a uma — nomear uma cota que não existe seria
     * tão errado como não nomear a que existe. */
    const cotasDoPlano = [cf.cotas.pedidosDia, cf.cotas.leiturasKvDia, cf.cotas.escritasKvDia,
      cf.cotas.listasKvDia, cf.cotas.apagamentosKvDia];
    conferir('…e cada uma leva a cota do plano, e não um número inventado',
      cf.naoMedido.every((n) => cotasDoPlano.indexOf(Number(n.cota)) !== -1),
      cf.naoMedido.map((n) => n.cota));
    /* QUANDO SE MEDE, A LISTA FICA VAZIA — e o aviso do painel desaparece com ela. */
    const comAnalitica = monitor.resumirCloudflare({
      escolas: [{ slug: 'breu' }], chaves: {},
      analitica: { ok: true, truncado: false, janela: { desde: '2026-11-19', ate: '2026-11-25', dias: 7 },
        hoje: { dia: '2026-11-25', pedidos: 1, leituras: 2, escritas: 3, listas: 4, apagamentos: 5 },
        dias: [{ dia: '2026-11-20', pedidos: 10, leituras: 20, escritas: 30, listas: 40, apagamentos: 50 }],
        porScript: [] },
    });
    conferir('…e com a analítica lida a lista fica vazia',
      comAnalitica.naoMedido.length === 0 && comAnalitica.motivoNaoMedido === null,
      [comAnalitica.naoMedido.length, comAnalitica.motivoNaoMedido]);
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
    /* SÃO SEIS DESDE 17/11/2026: o GitHub FREE entrou na escada, a custo zero. Era a pergunta que
     * não tinha onde ser respondida — «e o grátis?» —, e é o único degrau que se muda por API. */
    conferir('…e os seis degraus estão todos na tabela, o gratuito incluído a zero',
      m.cenarios.length === 6 && m.cenarios.filter((c) => c.usdMes > 0).length === 5
        && m.cenarios.some((c) => c.id === 'github-free' && c.usdMes === 0),
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
    /* A BARRA É A PEÇA DA FOLHA, e não um `<div>` com uma largura escrita à mão.
     *
     * ERAM TRÊS E SÃO QUATRO (25/11/2026): a cota em AULAS entrou na frente das três do fornecedor,
     * porque é ela que responde à pergunta que decide — «quantas aulas cabem antes de a conta sair do
     * zero?». O número passou a ser contado, e não escrito: uma prova que fixa «três» volta a
     * reprovar a cada cota nova, e a correcção seria sempre aumentar o número — o que não é medição.
     * O que se afirma é a FORMA: toda barra é a peça da folha, e a das aulas existe. */
    const barras = [...d.querySelectorAll('progress.cota')];
    conferir('as barras são `<progress class="cota">` — a peça da folha, todas com `max=1000`',
      barras.length >= 3 && barras.every((b) => b.getAttribute('max') === '1000'), barras.length);
    conferir('…e a cota em AULAS é uma delas, e vem antes das do fornecedor',
      Boolean(d.getElementById('monitor-aulas'))
      && html.indexOf('monitor-aulas') < html.indexOf('monitor-github'), null);
    conferir('…e NÃO há `style=""` na marcação (regra 5 da identidade)',
      !/style="/.test(html), (html.match(/style="[^"]*"/g) || []).slice(0, 2));
    const css = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
    conferir('a peça `.cota` está declarada na folha, com os três níveis',
      /^\.cota \{/m.test(css) && /\.cota\[data-nivel="atencao"\]/.test(css)
        && /\.cota\[data-nivel="agora"\]/.test(css), null);
    /* «O QUE NÃO SE MEDE» TEM DE ESTAR NA PÁGINA — é a metade que faz disto um painel. */
    conferir('a página diz o que não foi medido, em vez de mostrar zero',
      /não mede|não foi medido/i.test(html) && /escritas de KV por dia/i.test(html), null);
    /* A DIVERGÊNCIA ENTRE A REGRA E A FATURA TEM DE APARECER NO ECRÃ. Sem a conferência, a página
     * di-lo (e não finge zero); com a conferência a zero, diz que os dois discordam e manda à
     * fatura. É a diferença entre um painel e um oráculo. */
    const gDiv = monitor.resumirGithub({
      runs: [{ id: '1', workflow: 'Fechar os derivados', segundos: 18, quando: '2026-11-17T01:00:00Z' }],
      jobsPorRun: { 1: [{ segundos: 18 }] },
      conferencia: { run: '1', workflow: 'Fechar os derivados', facturavelMs: 0, jobs: 1, segundos: 18, estimadoMinutos: 1 },
    });
    const retratoDiv = monitor.retrato({
      github: gDiv, correio: co, cloudflare: cf, receita: r, cambio: 5.4, agora: '2026-11-17T12:00:00Z',
    });
    const htmlDiv = painel.paginaDoMonitoramento({ retrato: retratoDiv, cambio: 5.4 });
    /* O QUE SE APRENDEU EM PRODUÇÃO, e a asserção muda com ele: o campo `billable` respondia ZERO
     * enquanto a fatura contava 1.930 minutos. Não é «a regra e o fornecedor discordam» — é «este
     * campo não serve». A página passa a dizê-lo com essas palavras. */
    /* A nota do `billable` só faz sentido com a fatura ao lado — é o contraste que a prova. */
    const gDivFact = monitor.resumirGithub({
      runs: [{ id: '1', workflow: 'Fechar os derivados', segundos: 18, quando: '2026-11-17T01:00:00Z' }],
      jobsPorRun: { 1: [{ segundos: 18 }] },
      conferencia: { run: '1', workflow: 'Fechar os derivados', facturavelMs: 0, jobs: 1, segundos: 18, estimadoMinutos: 1 },
      facturado: { ok: true, linhas: LINHAS_DA_FACTURA },
      agora: '2026-11-17T12:00:00Z',
    });
    const htmlDivFact = painel.paginaDoMonitoramento({
      retrato: monitor.retrato({
        github: gDivFact, correio: co, cloudflare: cf, receita: r, cambio: 5.4, agora: '2026-11-17T12:00:00Z',
      }),
      cambio: 5.4,
    });
    conferir('…e quando o campo de facturação diz zero, o ecrã diz que ele não serve para medir',
      /billable/.test(htmlDivFact) && /não serve para medir/.test(htmlDivFact)
        && /0 min facturáveis/.test(htmlDivFact), null);

    /* A FATURA É O NÚMERO PRINCIPAL — quando ela pôde ser lida. E quando não pôde, a página diz
     * que o número é a regra e pede a permissão exacta que o GitHub nomeia no 403. */
    const gSemFactura = monitor.resumirGithub({
      runs: [{ id: '1', workflow: 'X', segundos: 20, quando: '2026-11-10T00:00:00Z' }],
      jobsPorRun: { 1: [{ segundos: 20 }] },
      facturado: { ok: false, motivo: 'o token não pode ler a facturação', pede: 'plan=read' },
      agora: '2026-11-17T12:00:00Z',
    });
    const retratoSemFactura = monitor.retrato({
      github: gSemFactura, correio: co, cloudflare: cf, receita: r, cambio: 5.4, agora: '2026-11-17T12:00:00Z',
    });
    const htmlSemFactura = painel.paginaDoMonitoramento({ retrato: retratoSemFactura, cambio: 5.4 });
    conferir('…e sem a fatura, a página diz que o número é a REGRA, e não o consumo',
      /é a REGRA/.test(htmlSemFactura) && /Plan → Read-only/.test(htmlSemFactura), null);

    const gFact = monitor.resumirGithub({
      runs: [{ id: '1', workflow: 'X', segundos: 20, quando: '2026-11-10T00:00:00Z' }],
      jobsPorRun: { 1: [{ segundos: 20 }] },
      facturado: { ok: true, linhas: LINHAS_DA_FACTURA },
      agora: '2026-11-17T12:00:00Z',
    });
    conferir('o número principal passa a ser o da fatura, e a regra fica como atribuição',
      gFact.gastos === 1933 && gFact.fonteDoGasto === 'factura' && gFact.minutos === 1,
      [gFact.gastos, gFact.fonteDoGasto, gFact.minutos]);
    /* OS QUATRO NÚMEROS DA FATURA, e o que decide é o crédito que resta: usado $11,60 de $12. */
    conferir('…e guarda os quatro números da fatura sem os confundir (bruto, desconto, líquido, crédito)',
      gFact.fatura.brutoUsd === 11.6 && gFact.fatura.descontoUsd === 11.6
        && gFact.fatura.liquidoUsd === 0 && gFact.fatura.creditoRestanteUsd === 0.4,
      [gFact.fatura.brutoUsd, gFact.fatura.descontoUsd, gFact.fatura.liquidoUsd, gFact.fatura.creditoRestanteUsd]);
    /* A PROJECÇÃO: no dia 17 de um mês de 30, 1.933 min é 113,7/dia e fecha em 3.411. */
    conferir('…e projecta o fim do ciclo a partir do ritmo dos dias que já andaram',
      gFact.ciclo.projeccao === 3411 && gFact.ciclo.excedentePrevisto === 1411
        && Math.round(gFact.ciclo.liquidoPrevistoUsd * 100) === 847,
      [gFact.ciclo.projeccao, gFact.ciclo.excedentePrevisto, gFact.ciclo.liquidoPrevistoUsd]);
    /* O CRÉDITO ACABA EM 0,6 DIAS: $0,40 que restam ÷ $0,68 por dia. É a resposta a «me programar». */
    conferir('…e diz em quantos dias o crédito do mês se esgota',
      Math.round(gFact.ciclo.diasAteAcabarCredito * 10) === 6, gFact.ciclo.diasAteAcabarCredito);
    /* A FRANQUIA NÃO É UM LIMITE, É UM DESCONTO: um mês inteiro dentro dela paga ZERO. */
    const dentroDaFranquia = monitor.resumirFactura({
      linhas: [{ quando: '2026-10-05T00:00:00Z', quantidade: 1075, bruto: 6.45, desconto: 6.45, liquido: 0, precoUnitario: 0.006 }],
    });
    conferir('…e um mês inteiro dentro da franquia paga zero, por muito que o bruto assuste',
      dentroDaFranquia.brutoUsd === 6.45 && dentroDaFranquia.liquidoUsd === 0
        && dentroDaFranquia.creditoRestanteUsd === 5.55, dentroDaFranquia);
    const htmlFact = painel.paginaDoMonitoramento({
      retrato: monitor.retrato({
        github: gFact, correio: co, cloudflare: cf, receita: r, cambio: 5.4, agora: '2026-11-17T12:00:00Z',
      }),
      cambio: 5.4,
    });
    /* A PROJECÇÃO PASSOU A SER RUN RATE (17/11/2026) — «já gasto + ritmo × dias que faltam» —, e a
     * asserção mudou com ela. `ritmo × dias do mês` re-contabiliza os dias que já passaram e, num
     * mês em que a rotina mudou a meio, erra nos dois sentidos. A fixture tem DOIS dias de factura
     * (1 e 17), por isso não há cauda de 7 dias: o ritmo cai na média do mês, 1.933/17 = 113,7/dia,
     * e 1.933 + 113,7 × 13 = 3.411 min. */
    conferir('…e o ecrã mostra a projecção em DÓLARES, com o líquido a pagar (e não o bruto)',
      /Este mês fecha em 3411 min<\/strong>/.test(htmlFact)
        && /os 1933 já gastos mais 113,7 min\/dia × 13 dias que faltam/.test(htmlFact),
      (htmlFact.match(/Este mês fecha[\s\S]{0,240}/) || [null])[0]);
    /* E A SEGUNDA PERGUNTA — «preciso de contratar?» — tem o seu próprio número, sem a herança dos
     * dias caros deste mês. É o que impede alguém de pagar um plano por causa de um mês passado. */
    conferir('…e responde a «preciso de contratar?» com o mês inteiro ao ritmo de AGORA',
      /Um mês inteiro a este ritmo seriam 3411 min/.test(htmlFact)
        && /É este o número que responde a «preciso de contratar\?»/.test(htmlFact),
      (htmlFact.match(/Um mês inteiro[\s\S]{0,240}/) || [null])[0]);
    /* O PREÇO UNITÁRIO NÃO PODE SER ARREDONDADO A CÊNTIMOS: $0,006 mostrado como $0,01 é um erro
     * de 67% num número que a própria página usa para explicar a conta. Apanhado ao vivo, e é por
     * isso que a asserção existe. */
    conferir('o preço por minuto aparece com os decimais que tem ($0,006, não $0,01)',
      /a US\$ 0,006/.test(htmlFact) && !/a US\$ 0,01/.test(htmlFact), null);

    conferir('…e o crédito que resta é dito no ecrã, com a data em que acaba',
      /crédito<\/strong> ainda por usar/.test(htmlFact) && /esgota-se em 0,6 dias/.test(htmlFact),
      (htmlFact.match(/US\$ 0,40[\s\S]{0,200}/) || [null])[0]);

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

        /* ── A LARGURA DA TELA DE MONITORAMENTO (17/11/2026) ────────────────────────────────────
         *
         * «Está muito apertado, você não está usando nem a metade da página.» O DEFEITO MEDIDO:
         * numa janela de 1920 o `main` ocupava a largura toda e o `.conteudo` continuava preso a
         * 900px — 47% da página —, e a coluna «Da receita» partia o título em duas linhas (67px de
         * faixa). A correcção é uma regra de escopo `data-tela="monitoramento"` que sobe a caixa
         * para 1350px (900 × 1,5, o que ela pediu) e mantém os títulos numa linha.
         *
         * A asserção mede as duas coisas que doem: a fracção da janela usada e a altura da faixa
         * do cabeçalho da tabela. Números, não texto de CSS. */
        const paginaDoMonitor = painel.paginaDoMonitoramento({
          retrato: monitor.retrato({
            github: null,
            correio: monitor.resumirCorreio({ contadores: { mes: '2026-11', enviados: 0, dias: {} }, hoje: '2026-11-17' }),
            cloudflare: monitor.resumirCloudflare({ escolas: [], chaves: {} }),
            receita: monitor.receita({ extrato: [], descontos: [], mes: '2026-11' }),
            cambio: 5.4, agora: '2026-11-17T12:00:00Z',
          }),
          cambio: 5.4, visibilidade: { publico: true }, aba: 'migracao',
        });
        const srv2 = http.createServer((req, res) => {
          if (req.url.indexOf('/assets/style.css') === 0) {
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(css);
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
          res.end(paginaDoMonitor);
        });
        await new Promise((r) => srv2.listen(0, '127.0.0.1', r));
        const base2 = 'http://127.0.0.1:' + srv2.address().port;
        const pg2 = await br.newPage();
        try {
          await pg2.setViewport({ width: 1920, height: 1000 });
          await pg2.goto(base2 + '/', { waitUntil: 'load' });
          const larg = await pg2.evaluate(() => {
            const c = document.querySelector('.conteudo').getBoundingClientRect().width;
            const ths = [...document.querySelectorAll('#monitor-migracao thead th')]
              .map((e) => Math.round(e.getBoundingClientRect().height));
            return {
              vw: window.innerWidth,
              conteudo: Math.round(c),
              th: ths,
              transborda: document.documentElement.scrollWidth > window.innerWidth + 1,
            };
          });
          /* A FRACÇÃO: 1350 de 1920 é 70%. Eram 47% (900 de 1920). O limiar é o meio da página —
           * abaixo dele o painel volta a desperdiçar metade do ecrã. */
          conferir('numa janela de 1920 a coluna usa mais de metade da página (era 47%)',
            larg.conteudo / larg.vw > 0.6 && larg.conteudo === 1350,
            { conteudo: larg.conteudo, vw: larg.vw, fraccao: Math.round((larg.conteudo / larg.vw) * 100) + '%' });
          conferir('…e o título das colunas cabe numa linha (42px, não 67)',
            larg.th.length > 0 && larg.th.every((h) => h <= 48), larg.th);
          conferir('…sem fazer a página transbordar na horizontal', larg.transborda === false, larg.transborda);

          /* E O ECRÃ ESTREITO: a caixa nunca passa do que cabe, e a tabela rola dentro do bloco. */
          await pg2.setViewport({ width: 414, height: 900 });
          await pg2.goto(base2 + '/', { waitUntil: 'load' });
          const estreito = await pg2.evaluate(() => ({
            vw: window.innerWidth,
            conteudo: Math.round(document.querySelector('.conteudo').getBoundingClientRect().width),
            transborda: document.documentElement.scrollWidth > window.innerWidth + 1,
          }));
          conferir('…e a 414px a caixa encolhe com a janela, em vez de forçar scroll',
            estreito.conteudo < 400 && estreito.transborda === false, estreito);

          /* ── A INADIMPLÊNCIA (17/11/2026) ──────────────────────────────────────────────
           *
           * A ESCADA DELA: «não pagou um mês, fica inadimplente […] não pagou três meses, tá
           * inadimplente, aí eu posso expurgar». A tabela do monitor é o que lhe diz quem
           * contactar; a decisão de desabilitar e de expurgar continua a ser dela.
           *
           * O CASO, montado à mão e com os três degraus: uma escola em dia, uma com dois meses, e
           * uma com três. A de três tem de cair em «pode expurgar», e as contas têm de fechar. */
          const extratoDaEscada = [
            { escola: 'emdia', nome: 'Em Dia', plano: 'basico', valorCentavos: 6990,
              contratoVivo: true,
              meses: [{ mes: '2026-11', venceu: true, status: 'pago', valorCentavos: 6990 }] },
            { escola: 'dois', nome: 'Dois Meses', plano: 'intermediario', valorCentavos: 9990,
              contratoVivo: true,
              meses: [
                { mes: '2026-11', venceu: true, status: 'aberto', valorCentavos: 9990 },
                { mes: '2026-10', venceu: true, status: 'aberto', valorCentavos: 9990 },
              ] },
            { escola: 'tres', nome: 'Três Meses', plano: 'avancado', valorCentavos: 13990,
              contratoVivo: true,
              meses: [
                { mes: '2026-11', venceu: true, status: 'aberto', valorCentavos: 13990 },
                { mes: '2026-10', venceu: true, status: 'aberto', valorCentavos: 13990 },
                { mes: '2026-09', venceu: true, status: 'aberto', valorCentavos: 13990 },
              ] },
          ];
          const inad = monitor.inadimplencia({ extrato: extratoDaEscada, agora: '2026-11-17T12:00:00Z' });
          conferir('a escada conta as três classes: 1 em dia, 1 com dois meses, 1 com três',
            inad.emDia === 1 && inad.inadimplentes === 1 && inad.paraExpurgar === 1, inad);
          conferir('…e a dívida soma só o que venceu e não está pago',
            inad.dividaTotalCentavos === 9990 * 2 + 13990 * 3, inad.dividaTotalCentavos);
          conferir('…e a lista é só de quem deve, o mais antigo primeiro',
            inad.devedoras.length === 2 && inad.devedoras[0].escola === 'tres',
            inad.devedoras.map((d) => d.escola));
          conferir('…e a de três meses está no degrau «pode expurgar»',
            inad.devedoras[0].classe === 'para-expurgar' && inad.devedoras[0].mesesVencidos === 3,
            inad.devedoras[0].classe);
          conferir('…e a de dois, no degrau da conversa',
            inad.devedoras[1].classe === 'inadimplente' && inad.devedoras[1].mesesVencidos === 2,
            inad.devedoras[1].classe);
          /* O MÊS QUE AINDA NÃO VENCEU NÃO É DÍVIDA — cobrá-lo seria contar o futuro. */
          const soFuturo = monitor.inadimplencia({
            extrato: [{ escola: 'x', nome: 'X', contratoVivo: true,
              meses: [{ mes: '2026-11', venceu: false, status: 'aberto', valorCentavos: 6990 }] }],
            agora: '2026-11-17T12:00:00Z',
          });
          conferir('um mês que ainda não venceu não conta como atraso',
            soFuturo.inadimplentes === 0 && soFuturo.devedoras.length === 0, soFuturo);
          /* E A PÁGINA MOSTRA-A, com os três degraus ditos por palavras. */
          const paginaInad = painel.paginaDoMonitoramento({
            retrato: monitor.retrato({
              github: null,
              correio: monitor.resumirCorreio({ contadores: { mes: '2026-11', enviados: 0, dias: {} }, hoje: '2026-11-17' }),
              cloudflare: monitor.resumirCloudflare({ escolas: [], chaves: {} }),
              receita: monitor.receita({ extrato: extratoDaEscada, descontos: [], mes: '2026-11' }),
              inadimplencia: inad,
              cambio: 5.4, agora: '2026-11-17T12:00:00Z',
            }),
            cambio: 5.4, visibilidade: { publico: true }, aba: 'receita',
          });
          conferir('a aba da receita traz a caixa da inadimplência', /monitor-inadimplencia/.test(paginaInad), null);
          conferir('…com as duas escolas devedoras e o degrau de cada uma',
            /Dois Meses/.test(paginaInad) && /Três Meses/.test(paginaInad)
              && /pode expurgar/.test(paginaInad) && /contactar/.test(paginaInad), null);
          conferir('…e NÃO traz a que está em dia — a lista é para trabalhar',
            !/Em Dia/.test(paginaInad), null);
          conferir('…e diz que a decisão é dela, e não do sistema',
            /decisões dela/.test(paginaInad), null);
        } finally {
          await pg2.close();
          srv2.close();
        }
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
