#!/usr/bin/env node
'use strict';

/*
 * provar-financeiro-da-escola.js — o CPF valida a identidade, e a mensalidade tem livro
 * (16/11/2026).
 *
 * O QUE ELA PEDIU, ao pé da letra, em duas frentes:
 *
 *   «Agora nós temos o CPF, né? E essa regra tem que ser validada pelo CPF, porque o professor pode
 *   ter o mesmo nome, pode ser homônimo, inclusive nome e sobrenome.» E: «não tem como eu clicar e
 *   dizer não pago, isso não existe.»
 *
 *   «Eu preciso ter também uma forma de acompanhar mês a mês o pagamento de cada escola, como se
 *   fosse um extrato, e com um botão que indica se foi pago. […] Tem que ser possível eu mexer aqui
 *   no financeiro e mudar o plano da escola, e também mudar a capacidade extra.»
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. A COMPETÊNCIA É O MÊS LOCAL. Um pagamento às 22h de 31 de janeiro em Passo Fundo é 01h de 1
 *      de fevereiro em UTC — e cortar o ISO punha-o no mês seguinte, no livro, para sempre.
 *   B. O VENCIMENTO É O DIA DA ADESÃO, e um dia 31 em fevereiro vence a 28.
 *   C. O EXTRATO. Pago, em aberto, a vencer; o `situacao` derivado (em dia × em aberto ×
 *      aguardando); o próximo vencimento e os dias até ele.
 *   D. O LIVRO GUARDA O VALOR DO MOMENTO. Um mês pago por R$ 69,90 continua a valer R$ 69,90
 *      depois de um upgrade — o extrato de um ano atrás não pode dizer outra coisa.
 *   E. A PÁGINA, em jsdom: o botão «Marcar pago» faz o pedido certo; o contrato grava com o plano
 *      e os lotes; e NÃO existe botão de «não pago».
 *   F. O CPF, no servidor: com CPF novo, um homônimo NÃO é recusado — a pasta nasce ao lado. Sem
 *      CPF, a regra antiga continua (é o único sinal que resta).
 *
 *   node experimentos/provar-financeiro-da-escola.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const mensalidades = require(path.join(RAIZ, 'motor/nucleo/mensalidades.js'));
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));

let ok = 0;
let ko = 0;
function conferir(titulo, condicao, dado) {
  if (condicao) { ok += 1; console.log('  ok    ' + titulo); return; }
  ko += 1;
  console.log('  FALHA ' + titulo + (dado === undefined ? '' : '  → ' + JSON.stringify(dado)));
}

/** Um KV de mentira com o get/put que as duas camadas usam. */
function kvCom(dados) {
  const mapa = new Map(Object.entries(dados || {}));
  return {
    dados: mapa,
    async get(k) { return mapa.has(k) ? mapa.get(k) : null; },
    async put(k, v) { mapa.set(k, String(v)); },
    async delete(k) { mapa.delete(k); },
  };
}

(async () => {
  console.log('\nA. A competência é o mês LOCAL, e não o do UTC');
  {
    conferir('um pagamento ao meio-dia fica no mês dele',
      mensalidades.competencia('2026-11-16T12:00:00Z') === '2026-11', null);
    /* 01/02 às 02:30 UTC é 31/01 às 23:30 em Passo Fundo: o mês é JANEIRO. */
    conferir('um pagamento às 23h do último dia do mês fica no mês que ela viveu',
      mensalidades.competencia('2026-02-01T02:30:00Z') === '2026-01',
      mensalidades.competencia('2026-02-01T02:30:00Z'));
    conferir('a aritmética do calendário atravessa o ano',
      mensalidades.somarMeses('2026-12', 1) === '2027-01'
        && mensalidades.somarMeses('2026-01', -1) === '2025-12', null);
    conferir('a lista entre duas datas é contínua e inclui as pontas',
      mensalidades.mesesEntre('2026-10-16T12:00:00Z', '2027-01-10T12:00:00Z').join(',')
        === '2026-10,2026-11,2026-12,2027-01', null);
    conferir('um mês inválido não produz lista nenhuma',
      mensalidades.mesesEntre('', '2026-01-01T00:00:00Z').length === 0, null);
  }

  console.log('\nB. O vencimento é o dia da adesão');
  {
    conferir('adesão a 16 → vence a 16 de cada mês',
      mensalidades.vencimentoDe('2026-11', 16) === '2026-11-16', null);
    conferir('um dia 31 em fevereiro vence no último dia do mês (28)',
      mensalidades.vencimentoDe('2026-02', 31) === '2026-02-28', null);
    conferir('…e num mês de 30, a 30', mensalidades.vencimentoDe('2026-04', 31) === '2026-04-30', null);
    conferir('sem contrato datado, o dia é 1', mensalidades.diaDaAdesao(null) === 1, null);
    conferir('o dia sai do fuso local, e não do ISO cortado',
      mensalidades.diaDaAdesao('2026-11-01T02:30:00Z') === 31,
      mensalidades.diaDaAdesao('2026-11-01T02:30:00Z'));
  }

  console.log('\nC. O extrato: o que está pago, o que está em aberto, o que ainda vem');
  {
    const contrato = {
      plano: 'basico', planoNome: 'Básico', valorCentavos: 6990, valor: 'R$ 69,90',
      capacidade: { professores: 1, alunos: 10 }, estado: 'ativa',
      criadoEm: '2026-08-16T12:00:00Z',
    };
    const livro = [
      { escola: 'teste', mes: '2026-08', status: 'pago', valorCentavos: 6990, planoNome: 'Básico', em: '2026-08-20T10:00:00Z' },
      { escola: 'teste', mes: '2026-09', status: 'pago', valorCentavos: 6990, planoNome: 'Básico', em: '2026-09-18T10:00:00Z' },
      { escola: 'teste', mes: '2026-10', status: 'pago', valorCentavos: 6990, planoNome: 'Básico', em: '2026-10-19T10:00:00Z' },
      { escola: 'outra', mes: '2026-11', status: 'pago', valorCentavos: 13990, planoNome: 'Avançado', em: '2026-11-02T10:00:00Z' },
    ];
    const s = mensalidades.situacaoDaEscola({
      escola: 'teste', contrato, livro, agora: '2026-11-16T21:36:00Z',
    });
    conferir('a lista vai do mais recente para o mais antigo',
      s.meses.map((m) => m.mes).join(',') === '2026-11,2026-10,2026-09,2026-08',
      s.meses.map((m) => m.mes));
    conferir('outubro aparece PAGO, com o dia em que foi pago',
      s.meses.find((m) => m.mes === '2026-10').status === 'pago'
        && Boolean(s.meses.find((m) => m.mes === '2026-10').emTexto), null);
    conferir('novembro está A VENCER (o dia 16 ainda não passou quando ela olha)',
      s.meses[0].status === 'aberto' && s.meses[0].venceu === false, s.meses[0]);
    conferir('…e a situação é «em dia», porque nada venceu em aberto', s.situacao === 'em-dia', s.situacao);
    conferir('…e o próximo vencimento é o dia 16 deste mês', s.proximoVencimento === '2026-11-16', s.proximoVencimento);
    conferir('…e os dias até ele são contados a partir de hoje', s.diasParaVencer === 0, s.diasParaVencer);
    /* O MESMO EXTRATO, OLHADO UM MÊS DEPOIS: novembro venceu sem pagamento. */
    const depois = mensalidades.situacaoDaEscola({
      escola: 'teste', contrato, livro, agora: '2026-12-20T12:00:00Z',
    });
    conferir('quando o mês vence sem pagamento, a situação passa a «em aberto»',
      depois.situacao === 'em-aberto' && depois.vencidos.indexOf('2026-11') !== -1,
      { situacao: depois.situacao, vencidos: depois.vencidos });
    /* DOIS MESES EM ABERTO (novembro e dezembro): o próximo vencimento é o do MAIS ANTIGO — é a
     * data do primeiro que se deixou passar, e é ela que se paga primeiro. */
    conferir('…e o próximo vencimento é o do mês mais antigo por pagar',
      depois.proximoVencimento === '2026-11-16', depois.proximoVencimento);
    conferir('…e os dias até ele são negativos (já passou)', depois.diasParaVencer < 0, depois.diasParaVencer);

    /* SEM CONTRATO DATADO NÃO HÁ COBRANÇA — e a lista fica vazia em vez de inventar um princípio. */
    const semInicio = mensalidades.situacaoDaEscola({ escola: 'teste', contrato: {}, livro, agora: '2026-11-16T12:00:00Z' });
    conferir('uma escola sem contrato datado não tem mensalidades — e a situação é «aguardando»',
      semInicio.meses.length === 0 && semInicio.situacao === 'aguardando', semInicio.situacao);
    conferir('…e a frase diz isso em palavras, e não «em dia»',
      /Aguardando/.test(mensalidades.fraseDaSituacao(semInicio.situacao)), null);
    /* O LIVRO DE OUTRA ESCOLA NÃO ENTRA NESTE EXTRATO. */
    conferir('o extrato de uma escola não mostra os meses de outra',
      s.meses.every((m) => m.mes !== '2026-11' || m.status !== 'pago'), null);
  }

  console.log('\nD. O livro guarda o valor do momento, e não recalcula depois');
  {
    const kv = kvCom({});
    const pago = await mensalidades.registarPagamento(kv, {
      escola: 'teste', mes: '2026-11', valorCentavos: 6990, plano: 'basico', planoNome: 'Básico',
      por: 'proprietario',
    });
    conferir('o mês fica registado como pago', pago.ok && pago.pagamento.status === 'pago', pago);
    /* O CONTRATO MUDA (upgrade). O mês pago NÃO pode mudar com ele. */
    const contratoNovo = {
      plano: 'avancado', planoNome: 'Avançado', valorCentavos: 13990, estado: 'ativa',
      criadoEm: '2026-08-16T12:00:00Z',
    };
    const livronovo = await mensalidades.lerLivro(kv);
    const s = mensalidades.situacaoDaEscola({
      escola: 'teste', contrato: contratoNovo, livro: livronovo, agora: '2026-11-20T12:00:00Z',
    });
    const novembro = s.meses.find((m) => m.mes === '2026-11');
    conferir('…e um upgrade depois não reescreve o que foi cobrado em novembro',
      novembro.status === 'pago' && novembro.valorPagoCentavos === 6990, novembro);
    conferir('…mas o mês SEGUINTE já é cobrado pelo contrato novo',
      s.valorCentavos === 13990, s.valorCentavos);
    /* O MESMO MÊS DUAS VEZES NÃO DUPLICA: é o mesmo facto. */
    await mensalidades.registarPagamento(kv, { escola: 'teste', mes: '2026-11', valorCentavos: 6990 });
    const lista = await mensalidades.lerLivro(kv);
    conferir('marcar o mesmo mês duas vezes não duplica a linha',
      lista.filter((l) => l.escola === 'teste' && l.mes === '2026-11').length === 1, lista.length);
    /* SEM MÊS, RECUSA — em vez de gravar uma linha que nenhum extrato sabe ler. */
    const semMes = await mensalidades.registarPagamento(kv, { escola: 'teste' });
    conferir('um pedido sem mês é recusado', semMes.ok === false && Boolean(semMes.erro), semMes);
  }

  console.log('\nE. Na página: um botão que paga, outro que muda o contrato, e nenhum que «despaga»');
  {
    const catalogo = comercial.catalogoDaPagina();
    const plano = catalogo.assinaturas[0];
    const extrato = [{
      escola: 'teste', nome: 'Teste', frase: 'Em aberto: há mensalidade vencida sem pagamento registado.',
      situacao: 'em-aberto', plano: plano.id, planoNome: plano.nome, valorCentavos: 6990,
      valor: plano.precoTexto, capacidade: { professores: 1, alunos: 10 },
      lotesProfessores: [1], lotesAlunos: [],
      proximoVencimento: '2026-11-16', diasParaVencer: -3,
      meses: [
        { mes: '2026-11', nome: 'novembro de 2026', vencimento: '2026-11-16', status: 'aberto', venceu: true, valorCentavos: 6990, valorPagoCentavos: null },
        { mes: '2026-10', nome: 'outubro de 2026', vencimento: '2026-10-16', status: 'pago', venceu: false, valorCentavos: 6990, valorPagoCentavos: 6990, emTexto: '19/10/2026 às 07:00', planoNome: 'Básico' },
      ],
    }];
    const html = painel.paginaFinanceira({
      pix: { chave: 'chave@pix.test', titular: 'Sistema Lastro' },
      descontos: [], escolas: [{ slug: 'teste', nome: 'Teste' }], extrato, catalogo,
    });
    conferir('a página tem o extrato da escola, com os dois meses',
      /data-conta="teste"/.test(html) && /novembro de 2026/.test(html) && /outubro de 2026/.test(html), null);
    conferir('…o mês pago mostra a data em que foi pago',
      /19\/10\/2026 às 07:00/.test(html), null);
    conferir('…e o mês em aberto tem o botão «Marcar pago»',
      /data-pagar="teste" data-mes="2026-11">Marcar pago/.test(html), null);
    conferir('…e o mês pago NÃO tem botão nenhum — «não pago» não existe',
      !/data-pagar="teste" data-mes="2026-10"/.test(html), null);
    conferir('a página diz que a escola está em aberto', /Em aberto/.test(html), null);
    conferir('…e o contrato abre no plano em vigor, e não no primeiro da lista',
      new RegExp('<option value="' + plano.id + '"[^>]*selected').test(html), null);
    conferir('…e os lotes em vigor vêm marcados',
      /data-contrato-lote data-eixo="professores" data-qtd="1" checked/.test(html), null);
    conferir('…e há um botão para gravar o contrato',
      /data-contrato-gravar="teste"/.test(html), null);
    /* O CATÁLOGO INTEIRO, e não só o plano em vigor: é o que torna «upgrade ou downgrade» possível
     * sem uma segunda página. A contagem é feita no DOM — `data-contrato-plano` também aparece no
     * script da página, e contar ocorrências de texto diria dois seletores onde há um. */
    conferir('…e o catálogo inteiro é oferecido, para upgrade e downgrade',
      (catalogo.assinaturas || []).every((a) => html.indexOf('value="' + a.id + '"') !== -1),
      (catalogo.assinaturas || []).filter((a) => html.indexOf('value="' + a.id + '"') === -1).map((a) => a.id));

    /* A CORRER, em jsdom: o clique do «Marcar pago» e o do contrato. */
    const { JSDOM, VirtualConsole } = require('jsdom');
    const erros = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
    const pedidos = [];
    let recarregou = false;
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'https://danca.padd.com.br/financeiro',
      virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
        /* O `location.reload()` do jsdom não é redefinível e não navega: o caminho de sucesso
         * termina nele, e o que se pode afirmar é o que vem ANTES — o pedido, e a ausência do
         * `alert` que só aparece quando o servidor recusa. É o mesmo critério do resto desta casa:
         * mede-se o que a página FEZ, não o que o motor de teste faria a seguir. */
        recarregou = 'jsdom';
        w.alert = (t) => erros.push('alert: ' + t);
        w.fetch = (u, init) => {
          pedidos.push({ url: String(u), corpo: JSON.parse((init && init.body) || '{}') });
          return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({ ok: true, contrato: { planoNome: 'Básico', valor: 'R$ 69,90' } }) });
        };
      },
    });
    await new Promise((r) => setTimeout(r, 250));
    const d = dom.window.document;
    conferir('…um só seletor de plano na página', d.querySelectorAll('[data-contrato-plano]').length === 1,
      d.querySelectorAll('[data-contrato-plano]').length);

    d.querySelector('[data-pagar]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    conferir('o clique do «Marcar pago» vai a `/api/financeiro/mensalidade` com a escola e o mês',
      pedidos.length === 1 && pedidos[0].url === '/api/financeiro/mensalidade'
        && pedidos[0].corpo.escola === 'teste' && pedidos[0].corpo.mes === '2026-11', pedidos[0]);
    conferir('…e não houve recusa nenhuma (o caminho de sucesso não passa por um `alert`)',
      erros.filter((e) => e.indexOf('alert: ') === 0).length === 0, erros.slice(0, 1));

    /* O CONTRATO: escolhe o plano mais caro e marca um lote de alunas. */
    recarregou = false;
    pedidos.length = 0;
    const caixa = d.querySelector('[data-contrato="teste"]');
    const select = caixa.querySelector('[data-contrato-plano]');
    select.value = catalogo.assinaturas[catalogo.assinaturas.length - 1].id;
    const loteAlunas = caixa.querySelector('[data-contrato-lote][data-eixo="alunos"]');
    loteAlunas.checked = true;
    caixa.querySelector('[data-contrato-gravar]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    conferir('o «Gravar o contrato» vai a `/api/financeiro/contrato` com o plano e os lotes',
      pedidos.length === 1 && pedidos[0].url === '/api/financeiro/contrato'
        && pedidos[0].corpo.plano === catalogo.assinaturas[catalogo.assinaturas.length - 1].id
        && JSON.stringify(pedidos[0].corpo.lotesAlunos) === JSON.stringify([Number(loteAlunas.getAttribute('data-qtd'))]),
      pedidos[0]);
    conferir('…e o lote de professores que já estava em vigor vai junto',
      JSON.stringify(pedidos[0].corpo.lotesProfessores) === JSON.stringify([1]), pedidos[0].corpo.lotesProfessores);
    /* O `location.reload()` É O FIM DO CAMINHO DE SUCESSO, e o jsdom não navega: ele emite
     * «Not implemented: navigation». Isso não é um erro da página — é o teste a chegar ao sítio
     * onde a página já fez o que tinha de fazer. Tudo o resto é erro. */
    const errosDaPagina = erros.filter((e) => !/Not implemented: navigation/.test(e));
    conferir('…e nada disto faz a página lançar', errosDaPagina.length === 0, errosDaPagina.slice(0, 2));
    dom.window.close();
  }

  console.log('\nE2. O lado da escola: o cartão «A escola», na Produção dela');
  {
    const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
    const usos = { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 };
    const situacao = mensalidades.situacaoDaEscola({
      escola: 'teste',
      contrato: { plano: 'basico', planoNome: 'Básico', valorCentavos: 6990,
        capacidade: { professores: 1, alunos: 10 }, criadoEm: '2026-08-16T12:00:00Z', estado: 'ativa' },
      livro: [{ escola: 'teste', mes: '2026-10', status: 'pago', valorCentavos: 6990,
        planoNome: 'Básico', em: '2026-10-19T10:00:00Z' }],
      agora: '2026-11-20T12:00:00Z',
    });
    const html = bastidores.paginaProducao('teste', { professor: 'p', ciclo: '01', query: '' }, [], [],
      'Dono', 'dono', [], [], [], [], [], [], usos, { modo: 'clara', paleta: 'bordo' }, '', [], [], {
        ok: true,
        cadastro: { escolaNome: 'Escola Teste', cnpj: '12.345.678/0001-90', email: 'e@x.test',
          telefone: '54 99999-0000' },
        contrato: { plano: 'basico', planoNome: 'Básico', valorCentavos: 6990 },
        pix: { chave: 'chave@pix.test', titular: 'Sistema Lastro' },
        situacao: Object.assign({}, situacao, { frase: mensalidades.fraseDaSituacao(situacao.situacao) }),
      });

    conferir('a Produção ganhou a secção «A escola», no grupo Configuração',
      /id="sec-a-escola"/.test(html) && /data-secao="a-escola"/.test(html), null);
    conferir('…com o CADASTRO que ela preencheu na criação', /Escola Teste/.test(html)
      && /12\.345\.678\/0001-90/.test(html) && /e@x\.test/.test(html), null);
    conferir('…com o CONTRATO: o plano e o que a mensalidade inclui',
      /Básico/.test(html) && /R\$ 69,90/.test(html) && /1 professor\(es\) e 10 aluna\(s\)/.test(html), null);
    conferir('…com o EXTRATO: o mês pago e o mês em aberto',
      /outubro de 2026/.test(html) && /selo ok">pago/.test(html)
        && /novembro de 2026/.test(html) && /selo falha">em aberto/.test(html), null);
    conferir('…e o botão de pagar abre a chave Pix, com a instrução do nome na descrição',
      /Pagar agora — ver a chave Pix/.test(html) && /chave@pix\.test/.test(html)
        && /escreva o nome da escola/i.test(html), null);
    /* O LADO DA ESCOLA NÃO ESCREVE: nenhum botão muda estado, plano ou pagamento. */
    conferir('…e NÃO há botão que mude o estado, o plano ou o pagamento — quem concilia é ela',
      !/data-pagar=/.test(html) && !/data-contrato-gravar/.test(html)
        && !/Marcar pago/.test(html), null);
    /* SEM PIX CONFIGURADO, DIZ-SE — em vez de um botão que abre uma caixa vazia. */
    const semPix = bastidores.paginaProducao('teste', { professor: 'p', ciclo: '01', query: '' }, [], [],
      'Dono', 'dono', [], [], [], [], [], [], usos, { modo: 'clara', paleta: 'bordo' }, '', [], [], {
        ok: true, cadastro: { escolaNome: 'Escola Teste' }, contrato: null, pix: null,
        situacao: Object.assign({}, situacao, { frase: 'x' }),
      });
    conferir('sem chave Pix configurada, a página diz isso em vez de abrir uma caixa vazia',
      /ainda não está configurada no sistema/.test(semPix), null);
  }

  console.log('\nF. O CPF é o validador — o homônimo deixa de ser recusado');
  {
    /* A REGRA VIVE NA ROTA, e o que se pode medir sem um Worker inteiro é a CONDIÇÃO: a recusa por
     * nome acontece só quando NÃO há CPF. A prova lê o código da rota — é a única forma de afirmar
     * uma condição negativa sem construir um GitHub e um Cloudflare falsos para o caminho todo. */
    const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/raiz.js'), 'utf8');
    conferir('a recusa por nome está condicionada à AUSÊNCIA de CPF',
      /if \(colisao && !cadastro\.cpf\) \{/.test(fonte), null);
    conferir('…e o homônimo com CPF novo ganha uma pasta ao lado (o sufixo numérico)',
      /while \(existentes\.some\(\(p\) => p\.slug === professor \+ '-' \+ sufixo\)/.test(fonte), null);
    conferir('…e a mensagem antiga aponta o CPF como a saída, e não só o sobrenome',
      /é o CPF que separa dois homônimos/.test(fonte), null);
    /* O CPF CONTINUA A SER ÚNICO: dois cadastros com o mesmo número são recusados antes disto. */
    conferir('a unicidade do CPF continua a ser verificada antes de tudo',
      /const jaTem = await cpfJaUsado\(env, cadastro\.cpf\);/.test(fonte), null);
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
