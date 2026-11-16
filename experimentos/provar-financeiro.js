'use strict';

/*
 * provar-financeiro.js — a chave que recebe, os descontos concedidos, e a carência de três meses
 * (25/11/2026).
 *
 * O QUE ELA PEDIU, e cada pedido tem a sua asserção:
 *
 *   1. «a coluna que é quando for habilitada tem que indicar a data e a hora» → as duas colunas
 *      novas na lista das vivas, com hora e não só dia;
 *   2. «o apagar aquela escola só vai poder contar se do tempo em que ela foi desabilitada […]
 *      a partir dessa data conta três meses» → `carenciaAte`, e o exemplo dela (12/01/2027 →
 *      12/04/2027);
 *   3. «um botão que abre ali um formulário e uma listagem que eu coloco a minha chave Pix» → a
 *      página, o campo, a gravação;
 *   4. «para qual escola eu tô concedendo desconto e quanto […] e também mostra quando eu concedi
 *      o desconto» → o formulário, a listagem com data, valor e razão.
 *
 * E TRÊS REGRAS QUE NÃO SÃO PEDIDOS DELA, MAS SÃO O QUE IMPEDE O PEDIDO DE MENTIR:
 *
 *   · o KV manda sobre o segredo (o ecrã não pode deixar de ter efeito quando o segredo existe);
 *   · os descontos moram numa chave só (a listagem não pode custar uma enumeração do KV — a lição
 *     de 18/10/2026, escrita no AGENTS.md);
 *   · `/financeiro` não existe no endereço público (a chave dela não se publica).
 *
 *   node experimentos/provar-financeiro.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

/** Um KV de bolso — o mesmo contrato que o Worker usa (`get`/`put`), sem rede nenhuma. */
function kvDeBolso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    chaves() { return [...dados.keys()].sort(); },
  };
}

(async () => {
  console.log('A. A carência conta da desabilitação — nas duas réguas');
  {
    /* O EXEMPLO DELA, textual: «se hoje é dia 15 de novembro de 2026, aí no dia 12 de janeiro de
     * 2027 a escola deixou de pagar e eu desabilitei. Aí a partir dessa data conta três meses.»
     *
     * AS DUAS RÉGUAS SÃO MEDIDAS (16/11/2026), porque o regime de teste é um interruptor: a régua
     * de produção é passada à mão (`{minutos: null}`) e continua a ser afirmada, e a de teste é a
     * que corre hoje, por omissão. Medir só a que está ligada deixaria a de produção a estrear-se
     * no dia em que apaga escolas a sério. */
    const exemplo = raiz.carenciaAte('2027-01-12T00:00:00.000Z', { minutos: null });
    conferir('12/01/2027 + 3 meses = 12/04/2027 — o exemplo dela, ao dia',
      exemplo === '2027-04-12T00:00:00.000Z', exemplo);
    conferir('a hora da desabilitação é preservada (o prazo é um instante, não um dia)',
      raiz.carenciaAte('2026-11-15T22:51:00.000Z', { minutos: null }) === '2027-02-15T22:51:00.000Z',
      raiz.carenciaAte('2026-11-15T22:51:00.000Z', { minutos: null }));
    conferir('91 dias NÃO é três meses: a conta antiga daria 13/04, não 12/04',
      !!exemplo && !exemplo.startsWith('2027-04-13'), exemplo);
    conferir('31/01 transborda para o mês seguinte em vez de ENCURTAR a carência',
      raiz.carenciaAte('2027-01-31T00:00:00.000Z', { minutos: null }) === '2027-05-01T00:00:00.000Z',
      raiz.carenciaAte('2027-01-31T00:00:00.000Z', { minutos: null }));
    conferir('sem data de desabilitação não há prazo (e não se inventa um)',
      raiz.carenciaAte(null, { minutos: null }) === null, null);
    conferir('…e uma data inválida também não produz prazo',
      raiz.carenciaAte('ontem', { minutos: null }) === null, null);

    /* A RÉGUA DE TESTE — 5 minutos, por decisão dela: «para fim de teste coloca `desabilitadaEm` +
     * 5 minutos». É a que está ligada, e é a que a varredura do expurgo usa por omissão. */
    conferir('a régua LIGADA é a de teste, de 5 minutos',
      raiz.CARENCIA_DE_TESTE_MINUTOS === 5, raiz.CARENCIA_DE_TESTE_MINUTOS);
    conferir('…e ela dá 12/01/2027 00:05 a partir de 12/01/2027 00:00',
      raiz.carenciaAte('2027-01-12T00:00:00.000Z') === '2027-01-12T00:05:00.000Z',
      raiz.carenciaAte('2027-01-12T00:00:00.000Z'));
    conferir('…e o texto diz com que régua se mediu, para o relatório não mentir',
      /5 minutos/.test(raiz.descricaoDaCarencia()) && /3 meses/.test(raiz.descricaoDaCarencia(null)),
      [raiz.descricaoDaCarencia(), raiz.descricaoDaCarencia(null)]);
  }

  console.log('\nB. As duas datas ficam gravadas quando o estado muda');
  {
    const kv = kvDeBolso();
    await raiz.gravarComercial(kv, 'valse', { estado: 'ativa', plano: 'basico' }, 'proprietario');
    let c = await raiz.lerComercial(kv, 'valse');
    conferir('habilitar grava `habilitadaEm`', Boolean(c.habilitadaEm), c.habilitadaEm);
    conferir('…e NÃO grava uma data de desabilitação que não aconteceu', !c.desabilitadaEm, c.desabilitadaEm);

    await new Promise((r) => setTimeout(r, 5));
    await raiz.gravarComercial(kv, 'valse', { estado: 'suspensa', nota: 'sem pagamento' }, 'proprietario');
    c = await raiz.lerComercial(kv, 'valse');
    conferir('desabilitar grava `desabilitadaEm`', Boolean(c.desabilitadaEm), c.desabilitadaEm);
    conferir('…e NÃO apaga a data em que foi habilitada — são dois factos, não um',
      Boolean(c.habilitadaEm) && c.habilitadaEm < c.desabilitadaEm, { h: c.habilitadaEm, d: c.desabilitadaEm });

    await new Promise((r) => setTimeout(r, 5));
    await raiz.gravarComercial(kv, 'valse', { estado: 'ativa' }, 'proprietario');
    c = await raiz.lerComercial(kv, 'valse');
    conferir('reabilitar move `habilitadaEm` para agora e MANTÉM a desabilitação anterior',
      c.habilitadaEm > c.desabilitadaEm, { h: c.habilitadaEm, d: c.desabilitadaEm });
    conferir('o histórico não perde nenhuma das três transições',
      Array.isArray(c.historico) && c.historico.length === 3, c.historico && c.historico.length);

    /* Uma escola nova nasce `aguardando`: isso não é uma habilitação. */
    const kv2 = kvDeBolso();
    await raiz.gravarComercial(kv2, 'nova', { estado: 'aguardando' }, 'sistema');
    const c2 = await raiz.lerComercial(kv2, 'nova');
    conferir('nascer «aguardando» não finge uma habilitação', !c2.habilitadaEm, c2.habilitadaEm);
  }

  console.log('\nC. A chave Pix: o KV manda, o segredo responde');
  {
    const segredo = { PIX_CHAVE: 'chave-do-worker', PIX_TITULAR: 'Titular do Worker' };
    const vazio = kvDeBolso();
    let pix = await raiz.lerPix(vazio, segredo);
    conferir('sem nada no KV, a chave vem do segredo do Worker', pix.chave === 'chave-do-worker', pix);

    const kv = kvDeBolso();
    await raiz.gravarPix(kv, { chave: '02150062917', titular: 'Thiago' }, 'proprietario');
    pix = await raiz.lerPix(kv, segredo);
    conferir('com chave no KV, é o KV que a página mostra', pix.chave === '02150062917', pix);
    conferir('…e o titular vem na mesma resposta', pix.titular === 'Thiago', pix.titular);

    const soChave = kvDeBolso();
    await raiz.gravarPix(soChave, { chave: '02150062917', titular: '' }, 'proprietario');
    pix = await raiz.lerPix(soChave, segredo);
    conferir('titular em branco NÃO inventa o do segredo nem um nome de tratamento',
      pix.titular === null, pix.titular);

    conferir('guardar uma chave vazia é recusado, e diz o quê',
      (await raiz.gravarPix(kvDeBolso(), { chave: '   ' }, 'x')).ok === false, null);
    conferir('…e a lacuna `[Preencher: …]` também não passa por chave',
      (await raiz.gravarPix(kvDeBolso(), { chave: '[Preencher: a chave]' }, 'x')).ok === false, null);
  }

  console.log('\nD. Os descontos: uma chave só, e um por escola');
  {
    const kv = kvDeBolso();
    const a = await raiz.concederDesconto(kv, { escola: 'valse', valorCentavos: 2000, motivo: 'início' }, 'x');
    conferir('conceder grava o valor em reais e em cêntimos', a.ok && a.desconto.valor === '20,00' &&
      a.desconto.valorCentavos === 2000, a.desconto);
    conferir('…e guarda a razão, que é o que se relê seis meses depois', a.desconto.motivo === 'início', a.desconto);
    conferir('…e a data em que foi concedido', Boolean(Date.parse(a.desconto.em || '')), a.desconto.em);

    /* O PONTO NÃO É «EXISTEM DUAS CHAVES», é «o número de chaves NÃO CRESCE com o número de
     * descontos». Uma chave por desconto obrigaria a enumerar o KV para desenhar a listagem — e a
     * enumeração é o que estourou a cota diária em 18/10/2026. */
    conferir('TUDO mora numa chave só — a listagem não enumera o KV',
      kv.chaves().filter((k) => k.startsWith('financeiro/')).join(',') === 'financeiro/descontos',
      kv.chaves());

    await raiz.concederDesconto(kv, { escola: 'breu', valorCentavos: 5000 }, 'x');
    await new Promise((r) => setTimeout(r, 5));
    await raiz.concederDesconto(kv, { escola: 'valse', valorCentavos: 3000 }, 'x');
    const lista = await raiz.lerDescontos(kv);
    conferir('um desconto por escola: o segundo substitui o primeiro',
      lista.length === 2 && lista.filter((d) => d.escola === 'valse').length === 1, lista.map((d) => d.escola));
    conferir('…e vale o valor novo', lista.find((d) => d.escola === 'valse').valor === '30,00', lista);
    conferir('a listagem vem do mais recente para o mais antigo',
      lista[0].escola === 'valse', lista.map((d) => d.escola));

    conferir('retirar apaga o da escola pedida e só esse',
      (await raiz.retirarDesconto(kv, 'valse')).ok &&
      (await raiz.lerDescontos(kv)).map((d) => d.escola).join(',') === 'breu', null);
    conferir('retirar o que não existe é recusado, e não «deu certo»',
      (await raiz.retirarDesconto(kv, 'nao-existe')).ok === false, null);
    conferir('valor zero ou negativo é recusado',
      (await raiz.concederDesconto(kvDeBolso(), { escola: 'valse', valorCentavos: 0 })).ok === false, null);
    conferir('escola com slug inválido é recusada',
      (await raiz.concederDesconto(kvDeBolso(), { escola: '../etc', valorCentavos: 100 })).ok === false, null);
  }

  console.log('\nE. A lista das vivas: as duas colunas, com hora');
  {
    const escolas = [{
      slug: 'valse', nome: 'Valse', professor: 'ana', criada_em: '2026-01-05',
      comercial: {
        estado: 'suspensa', planoNome: 'Intermediário', valor: '99,90',
        habilitadaEm: '2026-08-01T10:30:00.000Z',
        desabilitadaEm: '2026-11-15T22:51:00.000Z',
        carenciaAte: '2027-02-15T22:51:00.000Z',
      },
    }];
    const html = painel.paginaDasVivas({ escolas, professores: [] });
    conferir('a tabela ganha a coluna «Habilitada»', html.includes('<th>Habilitada</th>'), null);
    conferir('a tabela ganha a coluna «Desabilitada»', html.includes('<th>Desabilitada</th>'), null);
    conferir('a data da habilitação vem com a HORA', html.includes('01/08/2026 às 10:30'), null);
    conferir('a data da desabilitação vem com a HORA', html.includes('15/11/2026 às 22:51'), null);
    conferir('…e a linha diz que ainda está em carência, com a data em que sai',
      /em carência até 15\/02\/2027 às 22:51/.test(html), null);
    conferir('as colunas de antes continuam lá (Plano, Acesso, Estado)',
      html.includes('<th>Plano</th>') && html.includes('<th>Acesso</th>') &&
      html.includes('<th>Estado</th>'), null);

    /* E DEPOIS DA CARÊNCIA a mesma linha diz o contrário — senão o selo seria decoração. */
    const depois = painel.paginaDasVivas({
      escolas: [{ slug: 'velha', nome: 'Velha', criada_em: '2020-01-01',
        comercial: { estado: 'suspensa', desabilitadaEm: '2020-01-01T00:00:00.000Z',
          carenciaAte: '2020-04-01T00:00:00.000Z' } }],
      professores: [],
    });
    conferir('passada a carência, a linha diz «pode apagar»', /pode apagar/.test(depois), null);
  }

  console.log('\nF. A página do financeiro');
  {
    const html = painel.paginaFinanceira({
      pix: { chave: '02150062917', titular: null, atualizadoEm: '2026-11-16T01:00:00.000Z' },
      descontos: [{ escola: 'valse', valor: '20,00', em: '2026-11-15T10:20:00.000Z', motivo: 'início de atividade' }],
      escolas: [{ slug: 'valse', nome: 'Valse' }, { slug: 'breu' }],
    });
    conferir('tem o campo da chave Pix', /id="pix-chave"/.test(html), null);
    conferir('…e ele já vem com a chave que está a receber', html.includes('value="02150062917"'), null);
    conferir('tem o campo do titular', /id="pix-titular"/.test(html), null);
    conferir('tem o botão de guardar', /id="pix-gravar"/.test(html), null);
    conferir('diz quando a chave mudou pela última vez', /Última alteração: 16\/11\/2026 às 01:00/.test(html), null);
    conferir('tem o formulário do desconto, com a escola numa lista', /id="desconto-escola"/.test(html) &&
      html.includes('<option value="valse">') && html.includes('<option value="breu">'), null);
    conferir('…o valor, e a razão', /id="desconto-valor"/.test(html) && /id="desconto-motivo"/.test(html), null);
    conferir('a listagem mostra a escola, o valor, QUANDO e a razão',
      html.includes('Valse') === false && html.includes('<td>valse</td>') === false
        ? false
        : (/R\$ 20,00/.test(html) && /15\/11\/2026 às 10:20/.test(html) && /início de atividade/.test(html)),
      null);
    conferir('…e cada linha tem como retirar o desconto',
      /data-retirar-desconto="valse"/.test(html), null);
    conferir('sem chave configurada, a página DIZ isso em vez de mostrar uma de exemplo',
      /Ainda não há chave configurada/.test(painel.paginaFinanceira({ pix: {}, descontos: [], escolas: [] })), null);
    conferir('sem desconto nenhum, a listagem explica o que apareceria ali',
      /Nenhum desconto concedido/.test(painel.paginaFinanceira({ pix: {}, descontos: [], escolas: [] })), null);
    conferir('sem escola viva, o formulário do desconto fica desligado em vez de mentir',
      (() => {
        const vazio = painel.paginaFinanceira({ pix: {}, descontos: [], escolas: [] });
        return /Nenhuma escola viva para receber desconto/.test(vazio) &&
          /id="desconto-gravar" type="button" disabled/.test(vazio);
      })(), null);
  }

  console.log('\nG. O financeiro não existe no endereço público');
  {
    /* A REGRA DO SERVIDOR, e não a marca do HTML. A chave dela e a lista de descontos são a conta
     * e a negociação de clientes; o público responde 404 a tudo o que não seja a apresentação, os
     * assets, o criar escola e o `/api/pagina`. Uma asserção sobre o HTML diria só que o botão não
     * está desenhado — e quem escrevesse o pedido à mão não passaria pelo desenho. */
    const env = { HOST_PUBLICO: 'lastro.padd.com.br', HOST_DONO: 'danca.padd.com.br', SENHA_RAIZ: 'x' };
    const pedir = (caminho, metodo) => raiz.fetch(
      new Request('https://lastro.padd.com.br' + caminho, { method: metodo || 'GET' }), env);
    const pagina = await pedir('/financeiro');
    conferir('«/financeiro» responde 404 no público', pagina.status === 404, pagina.status);
    const pix = await pedir('/api/financeiro/pix', 'POST');
    conferir('…e o POST da chave também', pix.status === 404, pix.status);
    const desconto = await pedir('/api/financeiro/desconto', 'POST');
    conferir('…e o do desconto também', desconto.status === 404, desconto.status);
  }

  console.log('');
  console.log(ko === 0 ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
