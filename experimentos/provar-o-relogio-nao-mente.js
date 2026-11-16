#!/usr/bin/env node
'use strict';

/*
 * provar-o-relogio-nao-mente.js — as horas que o sistema mostra são as horas de quem lê
 * (16/11/2026).
 *
 * O QUE ELA VIU:
 *
 *   «O relógio que você está usando como referência está errado. Olha só, eu estou em Passo Fundo,
 *   no Rio Grande do Sul, e agora, no dia 16 de novembro de 2026, são 9:59. Então, está aparecendo
 *   para mim aqui que a escola, ela foi habilitada ao meio-dia e 25. Não tem sentido isso.»
 *
 * NÃO ERA O RELÓGIO, ERA O RÓTULO. O instante gravado estava certo
 * (`habilitadaEm: 2026-11-16T12:25:53Z`); a tela cortava os dígitos do ISO e escrevia «16/11/2026
 * às 12:25», como se o `Z` do fim não existisse. As 12:25 UTC são as 09:25 em Passo Fundo.
 *
 * É A MESMA FAMÍLIA DA «senha não reconhecida»: o dado certo com um texto ao lado a mentir. E o
 * custo não é estético — a carência é lida nessa hora, e três horas de erro são a diferença entre
 * «já pode apagar» e «ainda não».
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. A CONVERSÃO — 12:25Z dá 09:25; o deslocamento é −180; e a VIrada de dia (02:00Z = 23:00 do
 *      dia anterior) muda o DIA, que era o pior dos casos do corte do ISO;
 *   B. A TABELA DAS VIVAS — a hora que ela vai ler, e o cabeçalho a dizer de que relógio é;
 *   C. O REGISTO DO EXPURGO e a frase do prazo — a mesma hora local;
 *   D. A PÁGINA — a data da carência no cartão é pedida no fuso da escola, e o servidor declara-o;
 *   E. O QUE NÃO PODE MUDAR — o INSTANTE continua a ser comparado em UTC. A carência não se
 *      desloca três horas por causa da formatação: a regra é a mesma, e é a razão de a conversão
 *      acontecer só na última linha.
 *   F. O CONTROLE NEGATIVO — com o corte do ISO de volta, a mesma asserção reproduz o «12:25».
 *
 *   node experimentos/provar-o-relogio-nao-mente.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const fuso = require(path.join(RAIZ, 'motor/nucleo/fuso.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

/** O instante do relato dela, ao segundo. */
const O_CASO = '2026-11-16T12:25:53.252Z';

(async () => {
  console.log('A. A conversão: o instante é o mesmo, a hora é a dela');
  {
    conferir('12:25:53 UTC são 09:25 em Passo Fundo — a hora que ela leu no relógio',
      fuso.quandoLocal(O_CASO) === '16/11/2026 às 09:25', fuso.quandoLocal(O_CASO));
    conferir('…e não «12:25»', fuso.quandoLocal(O_CASO).indexOf('12:25') === -1, fuso.quandoLocal(O_CASO));
    conferir('o deslocamento é −180 minutos', fuso.deslocamentoEmMinutos(O_CASO) === -180,
      fuso.deslocamentoEmMinutos(O_CASO));
    conferir('…e a etiqueta diz «UTC−3»', fuso.etiquetaDoFuso(O_CASO) === 'UTC\u22123',
      fuso.etiquetaDoFuso(O_CASO));

    /* A VIRADA DE DIA — o pior caso do corte do ISO. Um carimbo das 23:30 de Passo Fundo é
     * 02:30Z do dia seguinte, e o corte dizia o DIA errado a quem o viveu. */
    conferir('02:00Z é 23:00 do DIA ANTERIOR — e o dia muda',
      fuso.quandoLocal('2026-11-17T02:00:00.000Z') === '16/11/2026 às 23:00',
      fuso.quandoLocal('2026-11-17T02:00:00.000Z'));
    conferir('…e `diaLocal` concorda com `quandoLocal` (o mesmo instante, o mesmo dia)',
      fuso.diaLocal('2026-11-17T02:00:00.000Z') === '16/11/2026',
      fuso.diaLocal('2026-11-17T02:00:00.000Z'));

    conferir('a meia-noite UTC é 21:00 do dia anterior — e continua a ser o dia certo',
      fuso.diaLocal('2026-11-17T00:00:00.000Z') === '16/11/2026',
      fuso.diaLocal('2026-11-17T00:00:00.000Z'));

    conferir('sem data, o traço — nunca uma célula vazia, que se lê como defeito',
      fuso.quandoLocal(null) === '—' && fuso.diaLocal('ontem') === '—', null);
    conferir('a hora sozinha é local', fuso.horaLocal(O_CASO) === '09:25', fuso.horaLocal(O_CASO));

    /* A RESERVA — sem ICU, o mesmo resultado para as datas de hoje. Ela existe para a tabela não
     * deixar de se desenhar; e a prova afirma as duas pontas para o dia em que a reserva for
     * chamada a sério. */
    const comIntl = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).format(new Date(O_CASO));
    conferir('o ICU diz o mesmo que a casa (09:25)', comIntl === '09:25', comIntl);
  }

  console.log('\nB. A tabela das vivas mostra a hora dela');
  {
    const html = painel.paginaDasVivas({
      escolas: [{
        slug: 'duo', nome: 'Duo', criada_em: '2026-11-16T11:00:00.000Z',
        comercial: {
          estado: 'suspensa',
          habilitadaEm: O_CASO,
          desabilitadaEm: '2026-11-16T12:57:35.133Z',
          /* O PRAZO É RELATIVO AO AGORA, e tem de ser: o selo de carência só aparece enquanto o
           * veredicto do servidor disser que ela ainda corre (`restanteMs`), e uma data fixa
           * deixaria esta asserção a depender do dia em que a prova corre. A lição é a de sempre —
           * uma prova não pode ter prazo próprio. */
          carenciaAte: new Date(Date.now() + 5 * 60000).toISOString(),
          expurgavel: false,
          restanteMs: 5 * 60000,
        },
      }],
      professores: [],
    });
    conferir('a coluna «Habilitada» diz 09:25, e não 12:25',
      html.includes('16/11/2026 às 09:25') && !html.includes('16/11/2026 às 12:25'),
      (html.match(/\d\d\/\d\d\/\d{4} às \d\d:\d\d/g) || []));
    conferir('a coluna «Desabilitada» diz 09:57', html.includes('16/11/2026 às 09:57'), null);
    /* O PRAZO É O MESMO INSTANTE NOS DOIS SÍTIOS — o que muda é a hora em que se escreve. A
     * asserção compara com o formatador, e não com um texto que eu digite aqui. */
    const carenciaDaVez = painel.paginaDasVivas({
      escolas: [{ slug: 'x', nome: 'X', criada_em: O_CASO, comercial: {
        estado: 'suspensa', habilitadaEm: O_CASO, desabilitadaEm: '2026-11-16T12:57:35.133Z',
        carenciaAte: new Date(Date.now() + 5 * 60000).toISOString(),
        expurgavel: false, restanteMs: 5 * 60000 } }],
      professores: [],
    });
    conferir('a carência é escrita na mesma hora local que as outras datas',
      /em carência até \d\d\/\d\d\/\d{4} às \d\d:\d\d/.test(carenciaDaVez)
      && carenciaDaVez.indexOf(fuso.quandoLocal(new Date(Date.now() + 5 * 60000).toISOString())) !== -1,
      (/em carência[^<]*/.exec(carenciaDaVez) || [])[0]);
    conferir('o cabeçalho diz de que relógio são as horas',
      /<th title="[^"]*Brasília[^"]*UTC\u22123[^"]*">Habilitada/.test(html),
      (/<th[^>]*>Habilitada<\/th>/.exec(html) || [])[0]);
  }

  console.log('\nC. O registo do expurgo e a frase do prazo dizem a mesma hora');
  {
    /* A FRASE DO PRAZO É O QUE ELA LÊ ANTES DE DECIDIR. Se dissesse «12:58 UTC», a decisão seria
     * tomada três horas à frente do relógio dela. */
    const veredicto = raiz.estadoDoExpurgo(
      { estado: 'suspensa', desabilitadaEm: '2026-11-16T12:57:35.133Z' },
      { agora: Date.parse('2026-11-16T13:00:00.000Z') });
    /* A FRASE TEM DE DIZER A MESMA HORA QUE A TABELA — e não uma hora qualquer que passe no
     * teste. `12:57:35Z + 5 min` são 10:02 em Passo Fundo; o que se afirma é a igualdade com o
     * formatador, que é a única fonte. */
    const prazoLocal = fuso.quandoLocal(veredicto.carenciaAte);
    conferir('a frase do prazo usa a hora local',
      veredicto.motivo.indexOf(prazoLocal) !== -1, { motivo: veredicto.motivo, prazoLocal });
    conferir('…e essa hora é 10:02, não 13:02', /10:02/.test(veredicto.motivo), veredicto.motivo);
    conferir('…e não diz «UTC» a ninguém', !/UTC/.test(veredicto.motivo), veredicto.motivo);
  }

  console.log('\nD. A página de apagar pede a data no fuso da escola');
  {
    const html = fs.readFileSync(path.join(RAIZ, 'raiz/index.html'), 'utf8');
    /* A REGRA É DO BLOCO DO MODAL, e não do `cartao()`: escrito como `d.fuso` dentro do cartão, o
     * `d` era o parâmetro do `fetch` e não existe ali — e o `ReferenceError` matava o desenho da
     * lista inteira. Foi medido, e é o que a secção abaixo (a página a correr) confirma. */
    conferir('o `toLocaleDateString` do cartão leva o fuso',
      /toLocaleDateString\("pt-BR",[\s\S]{0,80}timeZone: zonaDaEscola/.test(html), null);
    conferir('…e o fuso vem do servidor, guardado fora do `cartao`',
      /var zonaDaEscola = null;/.test(html) && /zonaDaEscola = \(d\.fuso && d\.fuso\.id\) \|\| null;/.test(html), null);

    /* E O SERVIDOR DECLARA-O — sem isso, a página não teria o que usar. */
    const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/raiz.js'), 'utf8');
    conferir('o `/api/escolas` declara o fuso da casa',
      /fuso: \{ id: fuso\.FUSO_PADRAO, rotulo: fuso\.ROTULO_DO_FUSO/.test(fonte), null);

    /* E A PÁGINA, A CORRER. O texto acima prova que o argumento está lá; este prova que ele faz o
     * que se pretende. O cartão de uma escola cuja carência venceu às 02:00Z tem de dizer 15/11 —
     * o dia ANTERIOR —, e não 16/11, que é o dia do servidor. */
    const { JSDOM, VirtualConsole } = require('jsdom');
    const vc = new VirtualConsole();
    const erros = [];
    vc.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
    const resposta = {
      ok: true,
      carencia: '5 minutos (regime de teste)',
      fuso: { id: 'America/Sao_Paulo', rotulo: fuso.ROTULO_DO_FUSO, etiqueta: 'UTC−3' },
      escolas: [{
        slug: 'vencida', professor: 'p', ciclo: '01', total: 3, estadoComercial: 'suspensa',
        desabilitadaEm: '2026-11-16T01:55:00.000Z',
        carenciaAte: '2026-11-16T02:00:00.000Z',
        expurgavel: true, motivoDoExpurgo: 'A carência venceu.',
        url: 'https://vencida.padd.com.br/',
      }],
    };
    const dom = new JSDOM(html, {
      runScripts: 'dangerously', url: 'https://danca.padd.com.br/', virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
        w.scrollTo = () => {};
        w.fetch = (u) => Promise.resolve({
          status: 200, ok: true,
          json: () => Promise.resolve(String(u).indexOf('api/escolas') !== -1 ? resposta : { ok: true }),
        });
      },
    });
    await new Promise((r) => setTimeout(r, 350));
    const dd = dom.window.document;
    const abrir = dd.getElementById('btn-apagar') || Array.from(dd.querySelectorAll('button'))
      .find((b) => /apagar escola/i.test(b.textContent || ''));
    if (abrir) abrir.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 500));
    const lista = dd.getElementById('apagar-lista');
    const textoDoCartao = lista ? String(lista.textContent || '') : '';
    conferir('o cartão da escola apagável é desenhado (a lista não morre a meio)',
      /vencida/.test(textoDoCartao), textoDoCartao.slice(0, 120));
    conferir('…e a data da carência é o DIA LOCAL — 15/11, e não 16/11',
      /15\/11\/2026/.test(textoDoCartao), textoDoCartao);
    conferir('…e os scripts da página não lançam', erros.length === 0, erros.slice(0, 1));
    dom.window.close();
  }

  console.log('\nE. O que NÃO pode mudar: o instante continua a ser comparado em UTC');
  {
    /* A CONVERSÃO É DE ESCRITA, e só de escrita. Se a comparação da carência passasse a usar a
     * hora local, o prazo deslocava-se três horas — e um prazo que se desloca não é um prazo. */
    const emCarencia = raiz.estadoDoExpurgo(
      { estado: 'suspensa', desabilitadaEm: '2026-11-16T12:57:00.000Z' },
      { agora: Date.parse('2026-11-16T13:00:00.000Z') });
    conferir('três minutos depois da desabilitação a carência AINDA corre', emCarencia.pode === false, emCarencia);
    const vencida = raiz.estadoDoExpurgo(
      { estado: 'suspensa', desabilitadaEm: '2026-11-16T12:57:00.000Z' },
      { agora: Date.parse('2026-11-16T13:03:00.000Z') });
    conferir('seis minutos depois, ela venceu', vencida.pode === true, vencida);
    conferir('…e o prazo gravado continua a ser o mesmo instante, em ISO/UTC',
      emCarencia.carenciaAte === '2026-11-16T13:02:00.000Z', emCarencia.carenciaAte);

    /* E O DADO GUARDADO NÃO SE REEscreve em hora local. O KV é UTC; quem converter para gravar
     * faria o instante depender de onde a escola está. */
    const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/raiz.js'), 'utf8');
    conferir('o estado comercial grava em ISO/UTC, e não na hora local',
      /const agora = new Date\(\)\.toISOString\(\);/.test(fonte), null);
  }

  console.log('\nF. O controle negativo: o corte do ISO dava «12:25»');
  {
    /* A REGRA ANTIGA, aplicada ao mesmo instante. Não é uma paráfrase: é o mesmo `exec` que
     * estava no `painel-html.js` até hoje, e é ele que produz a hora que ela viu. */
    const antigo = (iso) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(iso || ''));
      return m ? m[3] + '/' + m[2] + '/' + m[1] + ' às ' + m[4] + ':' + m[5] : '—';
    };
    conferir('a regra antiga devolve «16/11/2026 às 12:25» — o relato dela, ao pé da letra',
      antigo(O_CASO) === '16/11/2026 às 12:25', antigo(O_CASO));
    conferir('…e a nova devolve «09:25»', fuso.quandoLocal(O_CASO) === '16/11/2026 às 09:25',
      fuso.quandoLocal(O_CASO));
    conferir('…e no dia da virada as duas discordam do DIA, não só da hora',
      antigo('2026-11-17T02:00:00.000Z').slice(0, 10) !== fuso.quandoLocal('2026-11-17T02:00:00.000Z').slice(0, 10),
      { antigo: antigo('2026-11-17T02:00:00.000Z'), novo: fuso.quandoLocal('2026-11-17T02:00:00.000Z') });
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
