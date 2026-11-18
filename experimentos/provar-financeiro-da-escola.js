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
/* O CATÁLOGO CRU — a prova do teto lê o número declarado, e não a função que o devolve. */
const CATALOGO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'biblioteca/comercial/planos.json'), 'utf8'));

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
      /* O CONTRATO DE TESTE PASSA A TER UM PACOTE DE AULAS (17/11/2026), e não lotes de gente:
       * é o eixo que existe. O `franquia` vem como a `situacaoDaEscola` o devolve. */
      pacotes: ['p'], lotesProfessores: [], lotesAlunos: [],
      franquia: { plano: plano.id, baseAulas: 100, aulasExtras: 20, franquia: 120,
        usadas: null, restantes: null, excedente: null, estado: null, frase: '' },
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
    /* O PACOTE EM VIGOR VEM MARCADO — e é a mesma regra que valia para os lotes: «um `select` que
     * abre no primeiro plano faz dela a autora de um downgrade que não pediu». Um formulário que
     * abre com o pacote por marcar retira-lho no próximo «Gravar». */
    conferir('…e o pacote de aulas em vigor vem marcado',
      /data-contrato-pacote data-pacote="p" checked/.test(html), null);
    conferir('…e o formulário já não oferece lotes de gente',
      !/data-contrato-lote/.test(html), null);
    conferir('…e há um botão para gravar o contrato',
      /data-contrato-gravar="teste"/.test(html), null);
    /* O CATÁLOGO INTEIRO, e não só o plano em vigor: é o que torna «upgrade ou downgrade» possível
     * sem uma segunda página. A contagem é feita no DOM — `data-contrato-plano` também aparece no
     * script da página, e contar ocorrências de texto diria dois seletores onde há um. */
    conferir('…e o catálogo inteiro é oferecido, para upgrade e downgrade',
      (catalogo.assinaturas || []).every((a) => html.indexOf('value="' + a.id + '"') !== -1),
      (catalogo.assinaturas || []).filter((a) => html.indexOf('value="' + a.id + '"') === -1).map((a) => a.id));

    /* AS TRÊS ABAS DO FINANCEIRO (16/11/2026) — «cada um desses vai viver em uma aba». O que se
     * afirma é o contrato com a folha: três abas com `role="tab"`, UM painel à vista e os outros
     * dois `hidden`; e cada assunto DENTRO do seu painel — a chave na «chave», o desconto nos
     * «descontos», e o extrato nas «mensalidades», que é a que abre. */
    {
      const { JSDOM } = require('jsdom');
      const d0 = new JSDOM(html).window.document;
      const abas = [...d0.querySelectorAll('#fi-abas [role="tab"]')].map((b) => b.getAttribute('data-aba'));
      conferir('o financeiro está em três abas: mensalidades, chave e descontos',
        JSON.stringify(abas) === JSON.stringify(['mensalidades', 'chave', 'descontos']), abas);
      const paineis = ['mensalidades', 'chave', 'descontos']
        .map((n) => d0.getElementById('fi-painel-' + n));
      conferir('…com um só painel à vista, e é o das mensalidades (é o que se abre todos os meses)',
        paineis[0] && !paineis[0].hidden && paineis[1].hidden && paineis[2].hidden,
        paineis.map((p) => !!(p && p.hidden)));
      conferir('…e a aba à vista é a que está marcada como selecionada',
        d0.getElementById('fi-aba-mensalidades').getAttribute('aria-selected') === 'true'
          && d0.getElementById('fi-aba-chave').getAttribute('aria-selected') === 'false', null);
      conferir('…a chave Pix vive na aba da chave, e não na das mensalidades',
        paineis[1].querySelector('#pix-chave') && !paineis[0].querySelector('#pix-chave'), null);
      conferir('…o formulário do desconto vive na aba dos descontos',
        paineis[2].querySelector('#financeiro-desconto')
          && !paineis[0].querySelector('#financeiro-desconto'), null);
      conferir('…e o extrato de cada escola fica nas mensalidades',
        paineis[0].querySelector('[data-conta="teste"]')
          && !paineis[2].querySelector('[data-conta="teste"]'), null);
    }

    /* A COLUNA «ESCOLA» — o estado da escola viva, dentro do financeiro (16/11/2026): «Se eu
     * desabilitar lá na escola viva, aqui no financeiro tem que mostrar que está desabilitado».
     * São dois sítios a ler o MESMO estado, e é isso que se mede: o selo vem do contrato, e não de
     * uma cópia guardada no livro. */
    {
      const comEstado = (e) => Object.assign({}, extrato[0], { escola: e, nome: e, estadoComercial: e === 'null' ? null : e });
      const tres = painel.paginaFinanceira({
        pix: { chave: 'k@p.test', titular: 'T' }, descontos: [],
        escolas: [{ slug: 'ativa', nome: 'Ativa' }, { slug: 'suspensa', nome: 'Suspensa' }],
        extrato: [comEstado('ativa'), comEstado('suspensa'), comEstado('null')], catalogo,
      });
      const { JSDOM } = require('jsdom');
      const d0 = new JSDOM(tres).window.document;
      const linha = (e) => {
        const c = d0.querySelector('[data-conta="' + e + '"]');
        return c ? c.querySelector('table') : null;
      };
      /* O SELO É A SEGUNDA CÉLULA — «Mês | Escola | Vencimento | Valor | Situação | Pago/ação» —, e
       * repete-se em cada linha de propósito: a linha lê-se sozinha. */
      const selos = (e) => {
        const tab = linha(e);
        return tab ? [...tab.querySelectorAll('tbody tr')]
          .map((tr) => (tr.children[1] || {}).textContent.trim()) : [];
      };
      const cabecalho = (d0.querySelector('[data-conta="ativa"] thead') || { textContent: '' }).textContent;
      conferir('o extrato ganhou a coluna «Escola», ao lado do mês',
        /MêsEscola/.test(cabecalho.replace(/\s+/g, '')), cabecalho.replace(/\s+/g, ' '));
      conferir('…habilitada quando o contrato está activo',
        selos('ativa').every((s) => /habilitada/.test(s)), selos('ativa'));
      conferir('…desabilitada quando ela foi suspensa nas escolas vivas',
        selos('suspensa').every((s) => /desabilitada/.test(s)), selos('suspensa'));
      /* SEM ESTADO NÃO SE INVENTA «HABILITADA»: uma escola que ainda não foi habilitada não está
       * nem numa coisa nem na outra, e dizer «habilitada» seria pior do que não dizer nada. */
      conferir('…e «a aguardar» quando ainda não há estado nenhum',
        selos('null').every((s) => /a aguardar/.test(s)), selos('null'));
    }

    /* A CAPACIDADE EXTRA, DECOMPOSTA (16/11/2026): «foi contratado o plano avançado de R$ 139,90
     * mais a capacidade de mais três professores e mais 30 alunos» — e o financeiro tem de dizer o
     * mesmo que o cartão da escola, senão são duas contas diferentes para a mesma mensalidade. */
    {
      const avancado = comercial.catalogoDaPagina().assinaturas.find((a) => /avancado/i.test(a.id));
      if (!avancado) conferir('o catálogo tem o plano avançado', false, null);
      else {
        /* O CASO DA «duo»: 9 professores e 120 alunas no avançado, e os lotes não ficaram guardados
         * no contrato — a decomposição tem de sair da tabela de preços, e não do nada. */
        const extra = mensalidades.extraDoContrato({
          plano: avancado.id, valorCentavos: avancado.precoCentavos + 5000 + 5000,
          capacidade: { professores: (avancado.inclui.professores || 6) + 3,
            alunos: (avancado.inclui.alunos || 90) + 30 },
        });
        conferir('a capacidade extra é decomposta em professores e alunas',
          extra && extra.professores.qtd === 3 && extra.alunos.qtd === 30, extra);
        /* O PREÇO DO LOTE É O DA TABELA, em reais — 50 por cada professor e por cada alunas —, e o
         * total fecha com o que ficou por cima do plano. */
        const preco = (q) => (q.lotes || []).reduce((s, l) => s + Number(l.preco || 0), 0);
        conferir('…com o preço de cada lote, e um total que fecha com a mensalidade',
          extra && preco(extra.professores) === 50 && preco(extra.alunos) === 50
            && extra.totalCentavos === 10000, extra && [extra.professores.lotes, extra.alunos.lotes, extra.totalCentavos]);
        /* SEM EXTRA, NADA A DIZER — e `null` é a resposta, para a página não escrever «+0». */
        conferir('sem capacidade extra, a decomposição é vazia',
          mensalidades.extraDoContrato({
            plano: avancado.id, valorCentavos: avancado.precoCentavos,
            capacidade: { professores: avancado.inclui.professores, alunos: avancado.inclui.alunos },
            lotesProfessores: [], lotesAlunos: [],
          }) === null, null);
      }
    }

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

    /* A ABA TROCA DE VERDADE — e a que estava à vista esconde-se. Sem isto, `role="tablist"` seria
     * uma promessa por cumprir, e as três caixas ficavam todas à vista por baixo. */
    d.getElementById('fi-aba-chave').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    conferir('o clique na aba «A chave Pix» mostra o painel dela e esconde o das mensalidades',
      !d.getElementById('fi-painel-chave').hidden && d.getElementById('fi-painel-mensalidades').hidden
        && d.getElementById('fi-aba-chave').getAttribute('aria-selected') === 'true', null);
    /* E VOLTA-SE ÀS MENSALIDADES, porque é lá que está o botão do clique seguinte. */
    d.getElementById('fi-aba-mensalidades').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    conferir('…e o clique na aba das mensalidades devolve o extrato à vista',
      !d.getElementById('fi-painel-mensalidades').hidden && d.getElementById('fi-painel-chave').hidden, null);

    d.querySelector('[data-pagar]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    conferir('o clique do «Marcar pago» vai a `/api/financeiro/mensalidade` com a escola e o mês',
      pedidos.length === 1 && pedidos[0].url === '/api/financeiro/mensalidade'
        && pedidos[0].corpo.escola === 'teste' && pedidos[0].corpo.mes === '2026-11', pedidos[0]);
    conferir('…e não houve recusa nenhuma (o caminho de sucesso não passa por um `alert`)',
      erros.filter((e) => e.indexOf('alert: ') === 0).length === 0, erros.slice(0, 1));

    /* O CONTRATO: escolhe o plano mais caro e marca um PACOTE DE AULAS (17/11/2026).
     *
     * As caixas de lote de gente saíram do formulário — «aquele adicional antigo por lote legado
     * que já não se vende mais, a gente também vai tirar» —, e o que se marca agora é a franquia a
     * mais. Esta asserção mede o que o pedido LEVA, que é onde o defeito estaria: um pacote marcado
     * na página e não enviado seria um valor a mais no ecrã e a menos no livro. */
    recarregou = false;
    pedidos.length = 0;
    const caixa = d.querySelector('[data-contrato="teste"]');
    const select = caixa.querySelector('[data-contrato-plano]');
    select.value = catalogo.assinaturas[catalogo.assinaturas.length - 1].id;
    const pacote = caixa.querySelector('[data-contrato-pacote]');
    pacote.checked = true;
    caixa.querySelector('[data-contrato-gravar]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    conferir('o «Gravar o contrato» vai a `/api/financeiro/contrato` com o plano e o pacote de aulas',
      pedidos.length === 1 && pedidos[0].url === '/api/financeiro/contrato'
        && pedidos[0].corpo.plano === catalogo.assinaturas[catalogo.assinaturas.length - 1].id
        && JSON.stringify(pedidos[0].corpo.pacotes) === JSON.stringify([pacote.getAttribute('data-pacote')]),
      pedidos[0]);
    /* E OS LOTES DE GENTE VÃO VAZIOS: o formulário já não os tem, e um contrato gravado daqui deixa
     * de os carregar. É a consequência declarada de os retirar. */
    conferir('…e os lotes de gente vão vazios — o eixo não se vende mais',
      JSON.stringify(pedidos[0].corpo.lotesProfessores) === '[]'
        && JSON.stringify(pedidos[0].corpo.lotesAlunos) === '[]',
      [pedidos[0].corpo.lotesProfessores, pedidos[0].corpo.lotesAlunos]);
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
    /* UMA PÁGINA, UM CONSTRUTOR (17/11/2026). As asserções do «Pagar» comparam DUAS escolas — a
     * que deve e a que está em dia —, e comparar duas páginas construídas por dois blocos de
     * argumentos diferentes é comparar duas coisas e chamar-lhes o mesmo nome. A lista de
     * argumentos fica aqui, uma vez; o que muda de caso para caso é a `situacao`. */
    const paginaDaEscolaCom = (sit) => bastidores.paginaProducao('teste',
      { professor: 'p', ciclo: '01', query: '' }, [], [], 'Dono', 'dono', [], [], [], [], [], [], usos,
      { modo: 'clara', paleta: 'bordo' }, '', [], [], {
        ok: true,
        cadastro: { escolaNome: 'Escola Teste', cnpj: '12.345.678/0001-90', email: 'e@x.test',
          telefone: '54 99999-0000' },
        contrato: { plano: 'basico', planoNome: 'Básico', valorCentavos: 6990 },
        pix: { chave: 'chave@pix.test', titular: 'Sistema Lastro' },
        situacao: sit,
      });
    const situacao = mensalidades.situacaoDaEscola({
      escola: 'teste',
      contrato: { plano: 'basico', planoNome: 'Básico', valorCentavos: 6990,
        capacidade: { professores: 1, alunos: 10 }, criadoEm: '2026-08-16T12:00:00Z', estado: 'ativa' },
      livro: [{ escola: 'teste', mes: '2026-10', status: 'pago', valorCentavos: 6990,
        planoNome: 'Básico', em: '2026-10-19T10:00:00Z' }],
      agora: '2026-11-20T12:00:00Z',
    });
    const mudancasDePlano = (modulo, sit) => modulo.mudancaDePlano(sit);
    const html = paginaDaEscolaCom(Object.assign({}, situacao,
      { frase: mensalidades.fraseDaSituacao(situacao.situacao) }));

    conferir('a Produção ganhou a secção «A escola», no grupo Configuração',
      /id="sec-a-escola"/.test(html) && /data-secao="a-escola"/.test(html), null);
    conferir('…com o CADASTRO que ela preencheu na criação', /Escola Teste/.test(html)
      && /12\.345\.678\/0001-90/.test(html) && /e@x\.test/.test(html), null);
    /* O CONTRATO DIZ O QUE SE COBRA (17/11/2026): o plano, a mensalidade e a FRANQUIA. O número de
     * professores e alunas saiu do cartão por decisão dela — «Isso não existe mais, esse tipo de
     * referência não existe mais» —, e o que ficou é a unidade que se vende. */
    conferir('…com o CONTRATO: o plano, a mensalidade e a franquia de aulas',
      /Básico/.test(html) && /R\$ 69,90/.test(html) && /Franquia de aulas/.test(html)
        && /aulas por mês/.test(html), null);
    conferir('…e já sem o número de professores e alunas, que saiu a 17/11/2026',
      !/1 professor\(es\) e 10 aluna\(s\)/.test(html), null);
    /* O ESTADO DO CARTÃO (17/11/2026). O extrato saiu do cartão — vive na página própria —, e o
     * que o cartão diz de relance é o SELO. Nesta situação há mês vencido (setembro e novembro não
     * estão no livro, e as duas datas já passaram a 20/11), portanto o selo é «em aberto». */
    conferir('…com o estado à vista: um mês vencido faz o selo dizer «em aberto»',
      /selo falha"[^>]*>em aberto/.test(html), null);
    /* AS TRÊS CAIXAS DE «A ESCOLA» (17/11/2026) — a secção deixou de ser uma caixa com abas e
     * passou a ser o cartão da listagem, com Contrato, Situação e Pagar. O que se afirma é o que
     * ela pediu: as três na fila, os painéis abaixo, e o «em aberto» só quando há. */
    {
      const { JSDOM } = require('jsdom');
      const d0 = new JSDOM(html).window.document;
      const cartao = d0.getElementById('es-cartao');
      const caixas = cartao ? [...cartao.querySelectorAll('.trio-item')]
        .map((b) => b.getAttribute('data-balao')) : [];
      conferir('«A escola» tem três caixas: contrato, situação e pagar',
        JSON.stringify(caixas) === JSON.stringify(['contrato', 'situacao', 'pagar']), caixas);
      conferir('…e a listagem já não tem tira de abas',
        d0.getElementById('es-abas') === null, null);
      const p = (n) => d0.getElementById('es-painel-' + n);
      conferir('…e os três painéis nascem escondidos',
        p('contrato') && p('contrato').hidden && p('situacao').hidden && p('pagar').hidden, null);
      /* O CONTRATO CARREGA O QUE SE CONTRATOU, e não o extrato: o mês a mês tem página própria. */
      conferir('…o painel do contrato traz o plano, a mensalidade e a franquia',
        p('contrato') && /Básico/.test(p('contrato').innerHTML)
          && /R\$ 69,90/.test(p('contrato').innerHTML)
          && /Franquia de aulas/.test(p('contrato').innerHTML), null);
      conferir('…e NÃO traz o extrato — o mês a mês mudou para a página própria',
        p('contrato') && !/outubro de 2026/.test(p('contrato').innerHTML), null);
      /* O MÊS CORRENTE, E SÓ O QUE ESTÁ EM ABERTO. A `agora` da bancada é 20/11/2026, por isso o
       * mês corrente é novembro — e ele mesmo já venceu (dia 10), tal como setembro: os dois
       * entram na lista, e OUTUBRO não (está pago, e é o que o livro tem). */
      conferir('…a situação mostra o mês corrente, e não a data da última mensalidade',
        p('situacao') && /novembro de 2026/.test(p('situacao').innerHTML), null);
      /* Três vencidos nesta bancada: agosto, setembro e novembro (o dia da adesão é 16, e a
       * «agora» é 20/11). Outubro está pago, e é o que NÃO pode aparecer na lista. */
      conferir('…e lista o que está vencido, e só isso',
        p('situacao') && p('situacao').querySelectorAll('.trio-falta li').length === 3
          && /setembro de 2026/.test(p('situacao').innerHTML)
          && p('situacao').querySelectorAll('.trio-falta li')[0].textContent.indexOf('outubro') === -1,
        p('situacao') && [...p('situacao').querySelectorAll('.trio-falta li')]
          .map((l) => l.textContent.trim().slice(0, 18)));
      conferir('…e leva à página do mês a mês por um link',
        p('situacao') && /href="\/bastidores\/producao\/financeiro"/.test(p('situacao').innerHTML), null);
      /* O «PAGAR» SÓ APARECE QUANDO HÁ O QUE PAGAR (17/11/2026). «Esse botão de pagar só vai
       * aparecer quando a escola tiver inadimplente para aquele mês ali que aparece. Senão ele não
       * aparece.»
       *
       * Duas escolas, a mesma página: a que deve (esta, com agosto, setembro e novembro vencidos) e
       * a que está em dia. A regra é do ESTADO, e é por isso que a prova tem de medir os dois lados
       * — um botão que aparece sempre passaria numa prova que só olhasse para a devedora. */
      const pagarEm = (raiz) => [...raiz.querySelectorAll('[data-abre="pagar"]')];
      conferir('quem deve um mês vê um «Pagar», e ele abre a caixa do Pix',
        pagarEm(p('situacao')).length === 1
          && /^pagar$/i.test(pagarEm(p('situacao'))[0].textContent.trim())
          && pagarEm(p('situacao'))[0].getAttribute('data-abre') === 'pagar', null);
      conferir('…e com ele ao lado, «Ver o mês a mês» fica secundário — um só gesto principal',
        /class="acao secundario pequena" href="\/bastidores\/producao\/financeiro"/.test(p('situacao').innerHTML),
        null);
      /* A QUE ESTÁ EM DIA: nenhum «Pagar», e o «Ver o mês a mês» passa a ser o gesto principal.
       * O contrato começa em OUTUBRO e o livro tem os dois meses — não há vencido nenhum. */
      const emDia = mensalidades.situacaoDaEscola({
        escola: 'teste',
        contrato: { plano: 'basico', planoNome: 'Básico', valorCentavos: 6990,
          capacidade: { professores: 1, alunos: 10 }, criadoEm: '2026-10-05T12:00:00Z', estado: 'ativa' },
        livro: [
          { escola: 'teste', mes: '2026-10', status: 'pago', valorCentavos: 6990,
            planoNome: 'Básico', em: '2026-10-08T10:00:00Z' },
          { escola: 'teste', mes: '2026-11', status: 'pago', valorCentavos: 6990,
            planoNome: 'Básico', em: '2026-11-09T10:00:00Z' },
        ],
        agora: '2026-11-20T12:00:00Z',
      });
      const dEmDia = new JSDOM(paginaDaEscolaCom(Object.assign({}, emDia,
        { frase: mensalidades.fraseDaSituacao(emDia.situacao) }))).window.document;
      const situacaoEmDia = dEmDia.getElementById('es-painel-situacao');
      conferir('…e quem está em dia NÃO vê botão de pagar — não se paga duas vezes o mesmo mês',
        situacaoEmDia && pagarEm(situacaoEmDia).length === 0
          && emDia.meses.every((m) => m.status === 'pago'), emDia.situacao);
      conferir('…e sem «Pagar», «Ver o mês a mês» deixa de ser secundário',
        /class="acao pequena" href="\/bastidores\/producao\/financeiro"/.test(situacaoEmDia.innerHTML), null);
      /* UM MÊS SÓ: o botão diz QUAL. «Pagar» sozinho, numa escola com meses antigos em aberto, não
       * diz a que mês se está a pagar — e é o mês que liga o Pix à competência. */
      const umMes = mensalidades.situacaoDaEscola({
        escola: 'teste',
        contrato: { plano: 'basico', planoNome: 'Básico', valorCentavos: 6990,
          capacidade: { professores: 1, alunos: 10 }, criadoEm: '2026-11-02T12:00:00Z', estado: 'ativa' },
        livro: [], agora: '2026-11-20T12:00:00Z',
      });
      const dUmMes = new JSDOM(paginaDaEscolaCom(Object.assign({}, umMes,
        { frase: mensalidades.fraseDaSituacao(umMes.situacao) }))).window.document;
      conferir('…e com um mês só em aberto, o botão nomeia-o — «Pagar novembro»',
        /^pagar novembro$/i.test(
          (pagarEm(dUmMes.getElementById('es-painel-situacao'))[0] || { textContent: '' })
            .textContent.trim()), umMes.meses.map((m) => m.mes));
      conferir('…e a chave de pagar vive na caixa de pagar, com o botão de copiar',
        p('pagar') && /chave@pix\.test/.test(p('pagar').innerHTML)
          && p('pagar').querySelectorAll('[data-copiar]').length === 1, null);
    }

    /* SEM ACORDEÃO DENTRO DA CAIXA (16/11/2026): «o pagar não precisa ter esse botão de colapsar e
     * expandir. A caixa já é isso.» A chave está à vista quando a caixa abre, e a instrução com
     * ela — agora com as DUAS coisas: o nome da escola e o mês. */
    conferir('…e a caixa de pagar mostra a chave Pix, com a instrução do nome E do mês',
      /chave@pix\.test/.test(html) && /o nome da escola/i.test(html)
        && /o mês a que o pagamento se refere/i.test(html), null);
    conferir('…sem um acordeão dentro da aba — a aba já é a dobra',
      !/Pagar agora — ver a chave Pix/.test(html)
        && !/es-painel-pagar"[^>]*>[\s\S]{0,400}?<details/.test(html), null);
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

    /* O «PAGAR» DO MÊS A MÊS CHEGA AQUI COM A CAIXA ABERTA (17/11/2026).
     *
     * O link de cada linha em aberto é `/bastidores/producao?abrir=pagar#a-escola`, e quem o segue
     * tem de encontrar a chave Pix à vista — «ele leva para o mesmo lugar que a gente tem lá na
     * listagem da escola, que é o pagar, onde a gente exibe a informação e a chave Pix».
     *
     * ISTO EXECUTA O GESTO, e não procura o texto dele. A diferença importa: uma prova que
     * verificasse a presença de `history.replaceState` na página passaria com o gesto a apontar
     * para a caixa errada, ou a limpá-lo antes de o usar. Aqui o documento é construído com o
     * `location` que o link produz, o JavaScript da página corre, e o que se mede é o resultado: a
     * caixa aberta e o parâmetro fora do endereço.
     *
     * O `fetch` é substituído por uma promessa que nunca resolve — a página pede as listas ao
     * servidor, e não há servidor aqui. Uma promessa pendente é mais honesta do que uma que
     * responde vazio: o que se quer medir é o gesto que corre ANTES de qualquer resposta. */
    {
      const { JSDOM: JSDOMScripts, VirtualConsole } = require('jsdom');
      const rota = 'https://x.test/bastidores/producao?abrir=pagar#a-escola';
      const erros = [];
      const vc = new VirtualConsole();
      vc.on('jsdomError', (e) => erros.push(String(e.message)));
      const d2 = new JSDOMScripts(html, {
        runScripts: 'dangerously', url: rota, virtualConsole: vc,
        beforeParse(janela) { janela.fetch = () => new Promise(() => {}); },
      });
      const p2 = d2.window.document.getElementById('es-painel-pagar');
      conferir('o «Pagar» do mês a mês abre a caixa do Pix na listagem da escola',
        !!p2 && p2.hidden === false, p2 && p2.hidden);
      conferir('…e o `?abrir=` sai do endereço depois de usado — senão a caixa reabria sozinha',
        d2.window.location.search === '' && d2.window.location.hash === '#a-escola',
        { search: d2.window.location.search, hash: d2.window.location.hash });
      /* SEM O PARÂMETRO, a caixa continua fechada: o gesto não é «abrir sempre». */
      const domFechado = new JSDOMScripts(html, {
        runScripts: 'dangerously', url: 'https://x.test/bastidores/producao#a-escola',
        virtualConsole: vc, beforeParse(janela) { janela.fetch = () => new Promise(() => {}); },
      });
      conferir('…e sem o parâmetro a caixa do Pix nasce fechada',
        domFechado.window.document.getElementById('es-painel-pagar').hidden === true, null);
      conferir('…e o gesto não levanta erro nenhum ao correr',
        erros.length === 0, erros.slice(0, 2));
      d2.window.close(); domFechado.window.close();
    }

    /* E3. A PÁGINA DO MÊS A MÊS (17/11/2026) — «um outro URL», «só uma listagem».
     *
     * «Aqui a gente vai ter um link que vai levar para uma outra página, um outro URL […] mostra
     * a listagem mês a mês de tudo, seguindo também o mesmo padrão da listagem. Vai ocupar a
     * página toda, mas aí é só uma listagem mesmo.»
     *
     * UMA TABELA, E NÃO CARTÕES (17/11/2026). «Coloca aqui no mês a mês, coloca como tabela, tá? É
     * bem mais fácil de ver.» A prova mudou com o desenho: mede a GRADE — as cinco colunas, o
     * mais recente primeiro, o valor na sua coluna —, e não mais o cartão que deixou de existir.
     *
     * E MEDE A PAGINAÇÃO, que é o que impede a página de crescer sem fim: «imagina se isso cresce
     * 10, 20, 30 anos. Vai ficar gigantesco desse jeito.» Dez por página, o rodapé da casa com os
     * quatro botões, e o selector de 10/20/50/100 preso a ESTE painel. */
    const paginaDoMes = bastidores.paginaFinanceiro('teste',
      { professor: 'p', ciclo: '01', query: '' }, { modo: 'clara', paleta: 'bordo' }, {
        cadastro: { escolaNome: 'Escola Teste' },
        situacao: Object.assign({}, situacao, { frase: mensalidades.fraseDaSituacao(situacao.situacao) }),
      });
    const { JSDOM: JSDOM2 } = require('jsdom');
    const d1 = new JSDOM2(paginaDoMes).window.document;
    const colunas = [...d1.querySelectorAll('#fi-meses table > thead > tr > th')].map((t) => t.textContent.trim());
    conferir('o mês a mês é uma TABELA com as cinco colunas do extrato',
      JSON.stringify(colunas) === JSON.stringify(['Mês', 'Vencimento', 'Valor', 'Situação', 'Pagar']),
      colunas);
    const linhas = [...d1.querySelectorAll('#fi-meses tbody > tr')];
    conferir('…com uma linha por mês, e nenhum cartão em volta',
      linhas.length === situacao.meses.length && !/lb-cartoes/.test(paginaDoMes),
      { linhas: linhas.length, meses: situacao.meses.length });
    conferir('…e o mais recente vem primeiro (é assim que se lê um extrato)',
      linhas.length > 1 && /novembro/.test(linhas[0].textContent)
        && /agosto/.test(linhas[linhas.length - 1].textContent), null);
    conferir('…e cada célula é um dado, na coluna dele — o valor não se mistura com o estado',
      linhas.every((tr) => {
        const td = [...tr.children];
        return td.length === 5 && /^R\$ \d+,\d\d$/.test(td[2].textContent.trim())
          && /selo/.test(td[3].innerHTML);
      }), null);
    conferir('…cada um com o selo do seu estado',
      /selo ok/.test(paginaDoMes) && /selo falha/.test(paginaDoMes), null);
    conferir('…e quando foi pago, o dia vive na coluna do estado — não numa sexta coluna',
      /class="dono">\d\d\/\d\d\/\d{4}<\/span>/.test(paginaDoMes), null);
    /* A PAGINAÇÃO. A peça nasce `hidden` e é o cliente que a mostra — o que se prova na marcação é
     * que ela ESTÁ lá, presa a este painel, e com os quatro botões. */
    const rodape = d1.querySelector('#fi-meses .paginas');
    conferir('…e a tabela é paginada a dez por página, pelo painel `fi-meses`',
      d1.querySelector('#fi-meses').getAttribute('data-por-pagina') === '10', null);
    conferir('…e o rodapé é a peça da casa, com os quatro botões: primeira, anterior, seguinte, última',
      !!rodape && ['paginas-primeira', 'paginas-ant', 'paginas-prox', 'paginas-ultima']
        .every((k) => !!rodape.querySelector('.' + k)), null);
    conferir('…e o seletor oferece 10, 20, 50 e 100, preso a ESTE painel por `data-tamanho-de`',
      d1.querySelector('#fi-meses-por-pagina').getAttribute('data-tamanho-de') === 'fi-meses'
        && [...d1.querySelectorAll('#fi-meses-por-pagina option')].map((o) => o.value).join(',')
          === '10,20,50,100', null);
    conferir('…e o rodapé fica FORA da caixa que rola de lado, senão a navegação andava com a tabela',
      !d1.querySelector('#fi-meses .rolagem-caixa .paginas'), null);
    /* O RESUMO vai para a barra de cima, e não para um rodapé de cartões: quantos meses, quantos
     * pagos, quantos em aberto. É a pergunta «como está esta escola?» respondida antes da grade. */
    const barra = d1.querySelector('.caixa.filtrar .sub');
    conferir('…e a barra conta os meses e quantos estão em aberto',
      !!barra && /mês\(es\)/.test(barra.textContent) && /em aberto/.test(barra.textContent),
      barra && barra.textContent);

    /* O «PAGAR» DE CADA LINHA (17/11/2026). «Para aqueles meses que já estão pagos, o botão de pagar
     * ele fica visível, mas desabilitado. E para aquele mês que é em aberto, inadimplente, ele fica
     * habilitado e ele leva para o mesmo lugar que a gente tem lá na listagem da escola.»
     *
     * A COLUNA EXISTE SEMPRE — o que muda é o estado do controlo. Uma coluna que aparecesse e
     * desaparecesse linha a linha ler-se-ia como avaria. */
    const pagarDe = (tr) => tr.children[4].querySelector('button, a');
    const pagas = linhas.filter((tr) => /pago/.test(tr.children[3].textContent.trim()));
    const abertas = linhas.filter((tr) => /em aberto/.test(tr.children[3].textContent.trim()));
    conferir('cada linha tem um Pagar, e o do mês pago está DESABILITADO (visível, inerte)',
      pagas.length > 0 && pagas.every((tr) => {
        const b = pagarDe(tr);
        return b && b.tagName === 'BUTTON' && b.hasAttribute('disabled')
          && /^pagar$/i.test(b.textContent.trim());
      }), { pagas: pagas.length });
    conferir('…e o do mês em aberto está HABILITADO, e leva à caixa do Pix da listagem da escola',
      abertas.length > 0 && abertas.every((tr) => {
        const b = pagarDe(tr);
        return b && b.tagName === 'A' && /^pagar$/i.test(b.textContent.trim())
          && /\/bastidores\/producao\?abrir=pagar#a-escola$/.test(b.getAttribute('href'));
      }), { abertas: abertas.length });

    conferir('…e há um caminho de volta para a escola',
      /href="\/bastidores\/producao#a-escola"/.test(paginaDoMes), null);
    /* SEM MÊS NENHUM, a página diz porque — e não deixa uma tabela vazia. */
    const semMeses = bastidores.paginaFinanceiro('teste',
      { professor: 'p', ciclo: '01', query: '' }, { modo: 'clara', paleta: 'bordo' },
      { cadastro: { escolaNome: 'Escola Teste' }, situacao: { meses: [] } });
    conferir('sem meses, a página diz que a cobrança ainda não começou',
      /A cobrança começa quando a escola é habilitada/.test(semMeses)
        && !/id="fi-meses"/.test(semMeses), null);

    /* ─── E4. O «PLANO CONTRATADO», E A MUDANÇA QUE SÓ VALE NO MÊS SEGUINTE ───────────────
     *
     * «A escola Breu contratou o plano que no total dá R$ 239,90. Ela já pagou […] aí ela quer
     * mudar o plano, vai para o básico […] o total ficou R$ 169,90, só que isso é para o próximo
     * mês. […] Tem que colocar: breu, plano contratado básico, valor R$ 169,90 por mês. E aí a
     * mudança vai passar a valer no mês seguinte.»
     *
     * O CASO DELA, ao cêntimo: adesão a 17/11, novembro pago a 239,90 no plano Avançado, contrato
     * agora Básico a 169,90. O que se afirma é o que o ecrã tem de dizer — o plano que se cobra
     * hoje, o mês em que a mudança pega, o dia em que vence, e que a linha paga NÃO se reescreve.
     */
    {
      const situacaoQueMudou = mensalidades.situacaoDaEscola({
        escola: 'teste',
        contrato: { plano: 'basico', planoNome: 'Básico', valorCentavos: 16990,
          capacidade: { professores: 4, alunos: 40 }, criadoEm: '2026-11-17T13:00:00Z', estado: 'ativa' },
        livro: [{ escola: 'teste', mes: '2026-11', status: 'pago', valorCentavos: 23990,
          planoNome: 'Avançado', em: '2026-11-17T14:00:00Z' }],
        agora: '2026-11-17T15:00:00Z',
      });
      const html4 = bastidores.paginaFinanceiro('teste',
        { professor: 'p', ciclo: '01', query: '' }, { modo: 'clara', paleta: 'bordo' }, {
          cadastro: { escolaNome: 'Breu' },
          situacao: Object.assign({}, situacaoQueMudou,
            { frase: mensalidades.fraseDaSituacao(situacaoQueMudou.situacao) }),
        });
      const d4 = new JSDOM2(html4).window.document;
      const ficha = d4.querySelector('.mes-a-mes');
      conferir('o mês a mês diz «Plano contratado», com o plano e o valor que se cobra hoje',
        /Plano contratado:\s*<\/strong>\s*Básico · R\$ 169,90 por mês/.test(ficha.innerHTML),
        (ficha.textContent.match(/Plano contratado[^.]*\./) || [''])[0]);
      conferir('…e não repete o plano no subtítulo, onde estava sem dizer de que plano se tratava',
        !/class="sub">Breu · Básico/.test(html4)
          && /<p class="sub">Breu<\/p>/.test(html4), null);
      conferir('…e diz que a mudança passa a valer em dezembro de 2026',
        /passa a valer em <strong>dezembro de 2026<\/strong>/.test(ficha.innerHTML)
          && mensalidades.mudancaDePlano(situacaoQueMudou).mes === '2026-12', null);
      conferir('…e nomeia o dia da primeira cobrança no plano novo — 17/12/2026',
        /17\/12\/2026/.test(ficha.textContent), null);
      conferir('…e em 17/11 o mês novo ainda não existe, por isso a frase é FUTURO',
        mudancasDePlano(mensalidades, situacaoQueMudou).emVigor === false
          && /passa a valer em/.test(ficha.textContent), null);
      /* A PARTIR DE DEZEMBRO O MÊS JÁ ESTÁ NA LISTA, E O FUTURO PASSA A SER FALSO: a mudança já
       * está em vigor, e o que há é uma cobrança por pagar. Dizer «passa a valer» sobre um mês que
       * já está no extrato faria o leitor procurar o que ainda falta acontecer. */
      const jaEmDezembro = mensalidades.situacaoDaEscola({
        escola: 'teste',
        contrato: { plano: 'basico', planoNome: 'Básico', valorCentavos: 16990,
          capacidade: { professores: 4, alunos: 40 }, criadoEm: '2026-11-17T13:00:00Z', estado: 'ativa' },
        livro: [{ escola: 'teste', mes: '2026-11', status: 'pago', valorCentavos: 23990,
          planoNome: 'Avançado', em: '2026-11-17T14:00:00Z' }],
        agora: '2026-12-18T12:00:00Z',
      });
      const htmlDez = bastidores.paginaFinanceiro('teste',
        { professor: 'p', ciclo: '01', query: '' }, { modo: 'clara', paleta: 'bordo' }, {
          cadastro: { escolaNome: 'Breu' }, situacao: jaEmDezembro,
        });
      const fichaDez = new JSDOM2(htmlDez).window.document.querySelector('.mes-a-mes');
      conferir('…e em dezembro a frase vira «já está em vigor», porque o mês já está no extrato',
        mensalidades.mudancaDePlano(jaEmDezembro).emVigor === true
          && /já está em vigor/.test(fichaDez.textContent)
          && !/passa a valer/.test(fichaDez.textContent), null);
      conferir('…e não reescreve o mês pago: novembro continua com o plano com que foi pago',
        /novembro de 2026/.test(ficha.textContent)
          && /Avançado · R\$ 239,90/.test(ficha.textContent)
          && /o que foi pago não se reescreve/.test(ficha.textContent), null);
      /* A CONTA DO VALOR NA LINHA em aberto é a do CONTRATO, e a do PAGO é a do livro — é o que
       * faz as duas linhas poderem dizer valores diferentes sem parecer erro de soma. */
      conferir('…e a linha de novembro mostra o que foi PAGO, não o valor de hoje',
        situacaoQueMudou.meses[0].valorCentavos === 23990
          && situacaoQueMudou.valorCentavos === 16990, null);

      /* SEM MUDANÇA, NADA SE DIZ: um aviso que aparece sempre deixa de ser aviso. */
      const semMudanca = mensalidades.mudancaDePlano(mensalidades.situacaoDaEscola({
        escola: 'teste',
        contrato: { plano: 'basico', planoNome: 'Básico', valorCentavos: 16990,
          criadoEm: '2026-10-05T12:00:00Z', estado: 'ativa' },
        livro: [{ escola: 'teste', mes: '2026-11', status: 'pago', valorCentavos: 16990,
          planoNome: 'Básico', em: '2026-11-06T10:00:00Z' }],
        agora: '2026-11-20T12:00:00Z',
      }));
      conferir('…e com o mesmo plano no último mês pago, não há aviso nenhum a inventar',
        semMudanca === null, semMudanca);
    }

    /* ─── E5. O MÊS A MÊS FICA DENTRO DA PRODUÇÃO, COM A COLUNA DELA ─────────────────────
     *
     * «Eu estou em escola, situação, e vou ver mês a mês. Quando eu faço isso, você está me
     * tirando aqui do lugar de produção […] o menu todo de navegação que eu tenho à minha
     * disposição desaparece do lado esquerdo. Tem que ficar aqui no mesmo lugar.»
     *
     * MEDE-SE A COLUNA, E NÃO A INTENÇÃO: se ela existe, se é a mesma peça (`.lateral` com os
     * mesmos grupos), se o item «A escola» vem marcado do servidor — porque o script que o
     * marcaria na Produção é o mesmo que esconde as secções, e esse não corre aqui —, e se os
     * destinos apontam para a Produção em vez de serem saltos para lado nenhum.
     */
    {
      const html5 = bastidores.paginaFinanceiro('teste',
        { professor: 'p', ciclo: '01', query: '' }, { modo: 'clara', paleta: 'bordo' }, {
          cadastro: { escolaNome: 'Escola Teste' },
          situacao: Object.assign({}, situacao, { frase: 'x', meses: [] }),
        });
      const d5 = new JSDOM2(html5).window.document;
      conferir('a página do mês a mês tem a coluna da esquerda da Produção',
        !!d5.querySelector('.corpo > .lateral') && !!d5.querySelector('.corpo > .principal'), null);
      conferir('…com os mesmos quatro grupos do menu',
        [...d5.querySelectorAll('.lateral .coluna-grupo')]
          .map((g) => g.getAttribute('data-grupo')).join(',') ===
          'producao,configuracao,pessoas,pedagogia',
        [...d5.querySelectorAll('.lateral .coluna-grupo')].map((g) => g.getAttribute('data-grupo')));
      conferir('…e o item «A escola» marcado como a página em curso, do SERVIDOR',
        (d5.querySelector('.lateral a[aria-current="page"]') || {}).textContent === 'A escola'
          && d5.querySelector('.lateral .coluna-grupo[data-grupo="configuracao"]')
            .getAttribute('data-atual') === 'sim', null);
      /* OS DESTINOS SAEM DA PÁGINA: um `#turmas` aqui não levava a nada, porque secções não há. */
      const destinos = [...d5.querySelectorAll('.lateral a[data-secao]')]
        .map((a) => a.getAttribute('href'));
      conferir('…e cada destino aponta para a Produção, e não para um `#` sem secções',
        destinos.length > 0 && destinos.every((h) => /^\/bastidores\/producao#/.test(h)),
        destinos.slice(0, 3));
      conferir('…e a barra do celular já nasce com o grupo e a página certos',
        d5.getElementById('lateral-grupo').textContent === 'Configuração'
          && d5.getElementById('lateral-nome').textContent === 'Mês a mês', null);
      /* A COLUNA É A MESMA FUNÇÃO, e a prova vê-o pela marca que só ela põe: o `data-grupo`. Se
       * alguém copiar o bloco, as duas cópias continuam a passar aqui — e é por isso que a
       * asserção seguinte compara com a Produção, e não com uma lista escrita à mão. */
      conferir('…e é a MESMA coluna da Produção, grupo por grupo',
        [...d5.querySelectorAll('.lateral .coluna-grupo')].map((g) => g.innerHTML).join('|')
          .replace(/\/bastidores\/producao#/g, '#')
          .replace(/ class="ativo" aria-current="page"/g, '') ===
        [...new JSDOM2(html).window.document.querySelectorAll('.lateral .coluna-grupo')]
          .map((g) => g.innerHTML).join('|'), null);
      /* O GESTO DA FOLHA VEM COM A COLUNA, e sem ele o botão «Seções» do celular não abriria nada.
       * A asserção não procura o nome da função — COMPILA cada `<script>` da página. Foi assim que
       * um erro real apareceu nesta frente: o gesto e o código da altura da barra partilhavam o
       * mesmo invólucro, e a constante reutilizada ficou com a abertura e sem o fecho. Uma procura
       * por `function abrirMenu(` passaria com o script a rebentar no browser. */
      const compila = (corpo) => { try { new Function(corpo); return true; } catch (e) { return false; } };
      const guiões = [...html5.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
      conferir('…e o gesto da folha do celular vem com ela, e compila',
        guiões.length > 0 && guiões.every(compila)
          && /getElementById\("lateral-abrir"\)/.test(html5)
          && /getElementById\("lateral-veu"\)/.test(html5),
        guiões.map((g, i) => (compila(g) ? null : 'script ' + i)).filter(Boolean));
    }
  }

  console.log('\nG. O piso e o teto — «a partir de» e «até»');
  {
    /* «Capacidade dá ideia de teto, então dá ideia de que tem só nove professores e 120 alunos. O
     * nosso não é capacidade, o nosso é a partir de.» E o teto também foi dito: «qual é o teto de
     * quem contrata o plano intermediário? É o base do plano avançado menos um.» */
    const piso = (id) => comercial.pisoDoPlano(id);
    const teto = (id) => comercial.tetoDoPlano(id);
    conferir('o piso é o que o plano inclui — 1/10 · 3/40 · 6/90',
      JSON.stringify([piso('basico'), piso('intermediario'), piso('avancado')])
        === JSON.stringify([{ professores: 1, alunos: 10 }, { professores: 3, alunos: 40 },
          { professores: 6, alunos: 90 }]), null);
    conferir('o teto dos degraus de baixo é DERIVADO: o piso do degrau de cima menos um',
      teto('basico').professores === 2 && teto('basico').alunos === 39
        && teto('intermediario').professores === 5 && teto('intermediario').alunos === 89,
      [teto('basico'), teto('intermediario')]);
    /* SÓ O TOPO DECLARA UM NÚMERO, porque não tem degrau acima — e o número está no catálogo.
     * A 17/11/2026 o campo mudou de nome: o teto de GENTE deixou de ser comercial e passou a
     * REFERÊNCIA interna (`professoresReferencia`), porque a unidade comercial é a aula. O valor
     * é o mesmo; o nome diz o que ele é. A leitura aceita os dois, e a nota fica aqui para quem
     * procurar o nome antigo. */
    const tetoDoCatalogo = (eixo) => {
      const t = CATALOGO.teto || {};
      const novo = eixo === 'professores' ? t.professoresReferencia : t.alunosReferencia;
      return novo != null ? novo : t[eixo];
    };
    conferir('o topo da escada declara o teto, e ele vem do catálogo',
      teto('avancado').professores === tetoDoCatalogo('professores')
        && teto('avancado').alunos === tetoDoCatalogo('alunos'), teto('avancado'));
    conferir('…e a escada é coerente: o piso de cada degrau cabe no teto do anterior',
      ['basico', 'intermediario', 'avancado'].every((id) => {
        const p = piso(id); const t2 = teto(id);
        return p.professores <= t2.professores && p.alunos <= t2.alunos;
      }), null);
    /* O TETO NUNCA FICA ABAIXO DO PISO — senão o próprio adicional punha a escola fora do teto. */
    const comLote = comercial.limitesDoContrato({ plano: 'basico', lotes: { professores: [3], alunos: [] } });
    conferir('um adicional no plano de baixo levanta o piso, e o teto acompanha (nunca fica atrás)',
      comLote.piso.professores === 4 && comLote.teto.professores === 4, comLote);
    /* E O ECRÃ DIZ AS DUAS COISAS. O total contratado sem os lotes guardados também é piso. */
    const duo = comercial.limitesDoContrato({ plano: 'avancado', capacidade: { professores: 9, alunos: 120 } });
    conferir('o contrato da «duo» lê-se «a partir de 9 / até 20 professores»',
      duo.piso.professores === 9 && duo.teto.professores === 20, duo);
  }

  console.log('\nH. A página do financeiro: empilhar, paginar, colapsar');
  {
    const catalogo = comercial.catalogoDaPagina();
    const conta = (slug) => ({
      escola: slug, nome: slug.toUpperCase(), situacao: 'em-dia', plano: 'basico',
      planoNome: 'Básico', valorCentavos: 6990, piso: { professores: 1, alunos: 10 },
      teto: { professores: 2, alunos: 39 }, meses: [],
    });
    const catorze = Array.from({ length: 14 }, (_, i) => conta('escola' + i));
    const html = painel.paginaFinanceira({
      pix: { chave: 'k@p.test', titular: 'T' }, descontos: [],
      escolas: catorze.map((c) => ({ slug: c.escola, nome: c.nome })), extrato: catorze, catalogo,
    });
    const { JSDOM } = require('jsdom');
    const d = new JSDOM(html).window.document;
    /* «A gente vai empilhar […] Tem que botar aqui no bloco todo um botão de colapsar.» */
    conferir('as escolas ficam empilhadas numa lista, e cada uma é dobrável',
      d.querySelectorAll('#fi-contas ul.trio-lista > li').length === 14
        && d.querySelectorAll('#fi-contas details[open][data-conta]').length === 14, null);
    conferir('…e o resumo de cada uma diz quem é, mesmo dobrada',
      /ESCOLA0/.test(d.querySelector('details[data-conta="escola0"] summary').textContent)
        && /Básico/.test(d.querySelector('details[data-conta="escola0"] summary').textContent), null);
    /* «coloca uma paginação que exibe no máximo 10 por página». */
    conferir('a lista é paginada com o máximo de 10 por página',
      d.getElementById('fi-contas').getAttribute('data-por-pagina') === '10', null);
    conferir('…e o rodapé das páginas é a peça da casa (nasce escondido)',
      d.querySelector('#fi-contas .paginas[hidden]') && d.querySelector('#fi-contas .paginas-info'), null);
    /* «que eu possa classificar em quantidades que eu quero exibir por página, 10, 20, 50 e 100». */
    const opcoes = [...d.querySelectorAll('#fi-por-pagina option')].map((o) => o.value);
    conferir('…e o seletor oferece 10, 20, 50 e 100',
      JSON.stringify(opcoes) === JSON.stringify(['10', '20', '50', '100']), opcoes);
    conferir('…e o botão de dobrar todas existe, ao lado do seletor',
      d.getElementById('fi-dobrar') && /Recolher todas/.test(d.getElementById('fi-dobrar').textContent), null);
    /* A PÁGINA ANDA DE VERDADE: o script da peça é o da casa, e ele esconde os itens das outras. */
    const dom = new JSDOM(html, {
      runScripts: 'dangerously', url: 'https://danca.padd.com.br/financeiro',
      beforeParse(w) { w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }); },
    });
    await new Promise((r) => setTimeout(r, 200));
    const dd = dom.window.document;
    const visiveis = [...dd.querySelectorAll('#fi-contas ul.trio-lista > li')].filter((li) => !li.hidden);
    conferir('a primeira página mostra dez das catorze',
      visiveis.length === 10, visiveis.length);
    conferir('…e o rodapé diz em que página se está',
      /1 \/ 2/.test(dd.querySelector('#fi-contas .paginas-info').textContent),
      dd.querySelector('#fi-contas .paginas-info').textContent);
    /* O SELECTOR MANDA NA PEÇA: muda o `data-por-pagina` e repagina. */
    const sel = dd.getElementById('fi-por-pagina');
    sel.value = '20';
    sel.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 50));
    const depois = [...dd.querySelectorAll('#fi-contas ul.trio-lista > li')].filter((li) => !li.hidden);
    conferir('escolher 20 por página mostra as catorze de uma vez',
      depois.length === 14
        && dd.querySelector('#fi-contas .paginas').hidden === true, depois.length);
    dom.window.close();
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
