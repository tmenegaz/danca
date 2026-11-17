#!/usr/bin/env node
'use strict';

/**
 * propor-escola.js — A ESCOLA COMO LISTAGEM (17/11/2026).
 *
 * O PEDIDO. «A gente vai mudar completamente a forma de demonstração. Ao invés de colocar assim um
 * bloco que dentro desse bloco que tem bordas tem as abas, o cadastro, o contrato e o pagamento
 * […] a gente vai fazer igual na audição. […] lá na escola a gente vai ter também uma listagem,
 * ocupa toda a largura da página, e a gente vai ter as informações que é o nome da escola e o
 * contato da escola, e-mail e telefone bem rapidinho ali.»
 *
 * O QUE ESTA PROPOSTA DESENHA, e por que ele pediu para ver antes de implementar:
 *
 *   · a secção deixa de ser uma `.caixa` com três abas dentro e passa a ser a MESMA listagem das
 *     outras — `Secao → h2 → ul.lb-cartoes → li.trio-plano`, com a linha do nome, a linha dos
 *     factos e as caixas que se abrem (`motor/nucleo/lista-html.js`);
 *   · as três caixas são os três assuntos que eram abas: **Contrato**, **Situação** e **Pagar**;
 *   · a caixa «Situação» abre com o MÊS CORRENTE e, **só quando há**, com o que está em aberto —
 *     «se não tiver nenhum em aberto, nem exibe»;
 *   · a mesma caixa leva o link para uma página nova, `/bastidores/financeiro`, que lista o mês a
 *     mês completo — a listagem inteira, «só uma listagem mesmo».
 *
 * O QUE ELE **NÃO** FAZ, e é o ponto de método: não muda a produção. A proposta é um documento
 * separado, e a produção continua a emitir o cartão de abas até a decisão. O «antes» que se vê na
 * primeira moldura é o cartão REAL, lido de `bastidores.cartaoDaEscola` — não um desenho meu do
 * que a produção faria.
 *
 * AS PEÇAS SÃO AS DA FOLHA. Não há uma classe nova em nenhuma moldura: o cartão é `.trio-plano`,
 * as caixas são `.trio-item`, os painéis são `.trio-painel`, os pares são `.trio-grade`, os meses
 * em aberto são `.trio-falta`, a linha do contato é `.fatos`, e os selos são `ok`/`falha`/
 * `discreto` — os mesmos que o extrato de hoje já usa. O que esta proposta acrescenta é ARRANJO,
 * não desenho; e é por isso que ela pode ser aprovada sem uma peça nova.
 *
 * O QUE AINDA NÃO ESTÁ DECIDIDO, e a proposta mostra em vez de esconder: a secção `#sec-a-escola`
 * tem hoje a grade de duas colunas (formulário à esquerda, lista à direita) e nenhum formulário
 * para pôr à esquerda — medido, o cartão ocupa **371 px de 976**. Aqui ela passa a uma coluna só;
 * é a única regra de layout que a proposta introduce, e está escrita na página com o motivo.
 *
 *   node experimentos/propostas/propor-escola.js
 *   (o resultado é servido em /propostas/ pelo deploy das escolas)
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
const SAIDA = __dirname;

const CSS_DA_FOLHA = fs.readFileSync(path.join(RAIZ, 'tools', 'templates', 'ciclo.css'), 'utf8');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

const esc = (t) => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ============================================================== a página de onde se lê a verdade
 *
 * Duas coisas vêm da página REAL, e não de uma cópia: o `<style>` da Produção (que veste a `.secao`
 * e o `.lb-cartoes` no gabinete) e o ouvinte que abre as caixas. Copiados à mão, divergiriam no
 * primeiro dia — é a mesma razão pela qual a proposta da linha de base também os extrai de lá.
 */
function paginaDaProducao() {
  const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
  return bastidores.paginaProducao('breu', { escola: 'breu' },
    [{ nome: 'Demi Plié', slug: 'demi-plie' }], ['Aluna A'], 'Dono', 'dono',
    [{ nome: 'Turma X' }], [], {}, [], [], [], usos, { modo: 'clara', paleta: 'bordo' }, '');
}

function estiloDaPagina(pagina) {
  const achado = /<style>([\s\S]*?)<\/style>/.exec(pagina);
  return achado ? achado[1] : '';
}

/**
 * O OUVINTE DAS CAIXAS — `fecharPaineis` e os dois `addEventListener` que o chamam.
 *
 * Sem ele a proposta mostraria três caixas que não abrem, e metade do que se está a decidir é o
 * que está DENTRO delas. Extraído por marcadores estáveis; se a página mudar o handler, a proposta
 * muda com ela, e se ele desaparecer a proposta avisa em vez de fingir que abre.
 */
function scriptDoPainel(pagina) {
  const inicio = pagina.indexOf('function fecharPaineis');
  const marca = 'if (e.key === "Escape") fecharPaineis(null); });';
  const fim = pagina.indexOf(marca);
  if (inicio === -1 || fim === -1) return '';
  return pagina.slice(inicio, fim + marca.length);
}

/* ======================================================================= os dados da proposta
 *
 * A FORMA É A DE `dadosDaEscolaParaAProducao` (KV → `{ cadastro, contrato, situacao, pix }`), e os
 * campos são os que `mensalidades.situacaoDaEscola` devolve — `mes`, `nome`, `vencimento`, `venceu`,
 * `status`, `valorCentavos`, `valorPagoCentavos`, `emTexto`, e o par `piso`/`teto`. Inventar um
 * modelo mais simples daria uma proposta que não se pode implementar sem traduzir tudo outra vez.
 */
const CADASTRO = {
  escolaNome: 'Escola Breu',
  cnpj: '12.345.678/0001-90',
  email: 'contato@escolabreu.com.br',
  telefone: '(11) 98888-7777',
  responsavel: 'Fulana de Tal',
};

const CONTRATO = {
  plano: 'professor',
  planoNome: 'Plano Professor',
  valorCentavos: 9900,
  piso: { professores: 9, alunos: 120 },
  teto: { professores: 20, alunos: 300 },
  extra: { professores: { qtd: 2, valorCentavos: 3000 }, alunos: { qtd: 15, valorCentavos: 1500 } },
  criadoEm: '2026-08-14T12:00:00Z',
};

const PIX = { chave: '00020126580014BR.GOV.BCB.PIX0136lastro-escola-breu-2617', titular: 'Sistema Lastro' };

/** Os meses, do mais recente para o mais antigo — a ordem que `situacaoDaEscola` já devolve. */
function meses({ outubroAberto = false } = {}) {
  /* A LISTA VAI ATÉ HOJE, e não além (17/11/2026). `mensalidades.mesesEntre(inicio, hoje)` não
   * produz mês futuro: o mês que ainda não chegou é o `proximoVencimento`, e aparece no painel do
   * contrato — não como uma linha «a vencer» no extrato. A primeira versão desta bancada tinha
   * dezembro na lista, e mostrava um estado que a regra real nunca gera. */
  return [
    { mes: '2026-11', nome: 'novembro de 2026', vencimento: '2026-11-10', venceu: false,
      status: 'pago', valorCentavos: 9900, valorPagoCentavos: 9900, emTexto: '10/11/2026 14:02' },
    { mes: '2026-10', nome: 'outubro de 2026', vencimento: '2026-10-10', venceu: outubroAberto,
      status: outubroAberto ? 'aberto' : 'pago', valorCentavos: 9900,
      valorPagoCentavos: outubroAberto ? null : 9900,
      emTexto: outubroAberto ? null : '09/10/2026 09:41' },
    { mes: '2026-09', nome: 'setembro de 2026', vencimento: '2026-09-10', venceu: false,
      status: 'pago', valorCentavos: 9900, valorPagoCentavos: 9900, emTexto: '10/09/2026 11:15' },
    { mes: '2026-08', nome: 'agosto de 2026', vencimento: '2026-08-14', venceu: false,
      status: 'pago', valorCentavos: 4900, valorPagoCentavos: 4900, emTexto: '14/08/2026 16:30' },
  ];
}

function situacao({ outubroAberto = false } = {}) {
  const lista = meses({ outubroAberto });
  return {
    escola: 'breu',
    situacao: outubroAberto ? 'em-aberto' : 'em-dia',
    mesDeHoje: '2026-11',
    inicio: '2026-08-14',
    meses: lista,
    emAberto: lista.filter((m) => m.status === 'aberto').map((m) => m.mes),
    vencidos: lista.filter((m) => m.venceu).map((m) => m.mes),
    proximoVencimento: outubroAberto ? '2026-10-10' : '2026-12-10',
    proximoMes: outubroAberto ? '2026-10' : '2026-12',
    diasParaVencer: outubroAberto ? -38 : 23,
    valorCentavos: 9900,
    plano: 'professor',
    planoNome: 'Plano Professor',
    piso: CONTRATO.piso,
    teto: CONTRATO.teto,
    extra: CONTRATO.extra,
    frase: outubroAberto
      ? 'Em aberto: há mensalidade vencida sem pagamento registado.'
      : 'Em dia: não há mensalidade vencida em aberto.',
  };
}

const dadosDaEscola = (opcoes) => ({
  escola: 'breu', cadastro: CADASTRO, contrato: CONTRATO, pix: PIX, situacao: situacao(opcoes),
});

/* =============================================================================== as peças
 *
 * Cada função devolve a marcação de UMA coisa, e nenhuma delas inventa classe. A ordem em que
 * aparecem é a ordem em que o olho as lê: o rótulo, o valor, o painel.
 */
const emReais = (centavos) => 'R$ ' + ((Math.round(Number(centavos) || 0)) / 100)
  .toFixed(2).replace('.', ',');

const gente = (q) => (q ? q.professores + ' professor(es) e ' + q.alunos + ' aluna(s)' : null);

/** Um par rótulo/valor — o interior de um `.trio-grade`. */
const par = (rotulo, valor) => (valor
  ? '<div><span class="trio-k">' + esc(rotulo) + '</span><span class="trio-v">'
    + esc(String(valor)) + '</span></div>'
  : '');

/** A caixa que abre um painel. O «?» é desenho, não alvo — a caixa inteira é o botão. */
function caixa(balao, rotulo, valor, { aberta = false } = {}) {
  return '<button type="button" class="trio-item" data-balao="' + balao + '"'
    + ' aria-expanded="' + (aberta ? 'true' : 'false') + '" aria-controls="es-painel-' + balao + '"'
    + ' aria-label="ver ' + esc(rotulo.toLowerCase()) + ' da escola">'
    + '<span class="trio-k">' + esc(rotulo) + '</span>'
    + '<span class="trio-v">' + esc(valor) + '</span>'
    + '<span class="trio-q" aria-hidden="true">?</span></button>';
}

function painel(balao, corpo, { aberto = false } = {}) {
  return '<div class="trio-painel" data-painel="' + balao + '" id="es-painel-' + balao + '"'
    + (aberto ? '' : ' hidden') + '>' + corpo + '</div>';
}

/** O que a escola CONTRATOU. É a antiga aba «O contrato e o pagamento», sem o extrato. */
function painelDoContrato(s) {
  const aMais = s.extra
    ? [s.extra.professores && s.extra.professores.qtd
      ? '+' + s.extra.professores.qtd + ' professor(es)' : '',
    s.extra.alunos && s.extra.alunos.qtd ? '+' + s.extra.alunos.qtd + ' aluna(s)' : '']
      .filter(Boolean).join(' e ')
    : '';
  const pares = [
    par('Plano', s.planoNome || s.plano),
    par('Mensalidade', s.valorCentavos ? emReais(s.valorCentavos) : null),
    par('Piso contratado', gente(s.piso) ? 'a partir de ' + gente(s.piso) : null),
    par('Além do piso', aMais || null),
    par('Teto do plano', gente(s.teto) ? 'até ' + gente(s.teto) : null),
    par('Próximo vencimento', s.proximoVencimento
      ? s.proximoVencimento + (s.diasParaVencer != null
        ? (s.diasParaVencer >= 0
          ? ' (em ' + s.diasParaVencer + ' dia(s))'
          : ' (venceu há ' + Math.abs(s.diasParaVencer) + ' dia(s))')
        : '')
      : null),
  ].filter(Boolean).join('');
  return pares ? '<div class="trio-grade">' + pares + '</div>' : '';
}

/**
 * A SITUAÇÃO — o mês corrente, e SÓ o que está em aberto.
 *
 * O PEDIDO, ao pé da letra: «quando expandir esse bloco a gente vai ter as informações do mês
 * corrente, se está pago e se tem algum em aberto. É isso que vai exibir somente. Se não tiver
 * nenhum em aberto, nem exibe.» Não é uma lista dos doze meses comprimida: é a resposta a «estou
 * em dia?», e a lista inteira vive na página que o link abre.
 *
 * O `trio-falta` é a peça que a folha já tem para «o que falta» — o mesmo círculo de alerta. Uma
 * lista de meses em aberto desenhada à mão seria o segundo desenho da mesma ideia.
 */
function painelDaSituacao(s) {
  const doMes = s.meses.find((m) => m.mes === s.mesDeHoje) || s.meses[0] || null;
  const vencidos = s.meses.filter((m) => m.venceu);

  const pares = [
    par('Mês corrente', doMes ? doMes.nome : null),
    par('Situação', doMes
      ? (doMes.status === 'pago'
        ? 'pago em ' + (doMes.emTexto || '').split(' ')[0]
        : (doMes.venceu ? 'venceu sem pagamento' : 'a vencer'))
      : null),
    par('Valor', doMes ? emReais(doMes.status === 'pago' ? doMes.valorPagoCentavos : doMes.valorCentavos) : null),
  ].filter(Boolean).join('');

  /* O TÍTULO DO PAINEL É UM SÓ, E DIZ A MESMA COISA UMA VEZ (17/11/2026).
   *
   * A primeira versão mostrava a frase do estado («Em aberto: há mensalidade vencida…») e, logo
   * abaixo, o rótulo «Em aberto:» da lista — a mesma palavra duas vezes em três linhas.
   *
   * A REGRA, agora: quando há mês vencido, o título É a lista (o rótulo e os meses, que é o que
   * há para saber); quando não há, o título é a frase que o sistema já compõe («Em dia: não há
   * mensalidade vencida em aberto»), e nenhuma lista aparece. Nos dois casos o painel responde à
   * mesma pergunta — «estou em dia?» —, e a lista inteira vive na página que o link abre. */
  const titulo = vencidos.length
    ? '<p class="trio-nota">Em aberto:</p>'
    : '<p class="trio-frase">' + esc(s.frase || '') + '</p>';
  const emAberto = vencidos.length
    ? '<ul class="trio-falta">' + vencidos.map((m) =>
      '<li>' + esc(m.nome) + ' · venceu ' + esc((m.vencimento || '').slice(8, 10) + '/'
        + (m.vencimento || '').slice(5, 7)) + ' · ' + esc(emReais(m.valorCentavos)) + '</li>').join('')
      + '</ul>'
    : '';

  /* O «PAGAR» FICA AO LADO DO MÊS EM ABERTO (17/11/2026). «Para não ter que voltar até o pagar
   * […] coloca ali do lado o botão de pagar, aí já abre a chave Pix.» Quem acabou de ver o mês
   * vencido tem o gesto à mão, em vez de ter de o procurar na terceira caixa.
   *
   * É um BOTÃO, e não um segundo `.trio-item`: a caixa da fila abriria um painel a partir de
   * dentro de outro painel, e a fila das três ficava a dizer que há quatro. O `data-abre` diz
   * qual caixa abrir; o ouvinte da página trata disso — e o rótulo nomeia o mês, para o gesto
   * não ser anónimo. */
  const mesVencido = vencidos.length === 1 ? vencidos[0].nome.split(' de ')[0] : null;
  const botaoPagar = '<button type="button" class="acao pequena" data-abre="pagar"'
    + ' title="abrir a chave Pix para pagar o que está em aberto">'
    + (mesVencido ? 'Pagar ' + esc(mesVencido) : 'Pagar') + '</button>';

  return titulo
    + (pares ? '<div class="trio-grade">' + pares + '</div>' : '')
    + emAberto
    + '<p class="par-botoes">' + botaoPagar
    + '<a class="acao secundario pequena"'
    + ' href="/bastidores/financeiro" title="ver todos os meses, com o que foi pago e quando">'
    + 'Ver o mês a mês</a></p>';
}

/** O Pix — a antiga aba «Pagar», sem acordeão dentro de acordeão. */
function painelDoPagar(pix, s) {
  if (!pix || !pix.chave) {
    return '<p class="trio-nota">A chave Pix ainda não está configurada no sistema. Para pagar, '
      + 'fale com a administração do Sistema Lastro.</p>';
  }
  /* DUAS COISAS NA DESCRIÇÃO, E NÃO UMA (17/11/2026). «Tem que dizer qual é a escola que está
   * fazendo o pagamento e o mês, e dizer qual é o mês que está pagando.» O nome da escola liga o
   * pagamento à escola; o mês liga-o à competência. Sem o segundo, um Pix de outubro pago em
   * novembro podia ser lido como novembro — e a conciliação é feita à mão, por quem lê a
   * descrição. */
  const vencidos = (s && s.meses ? s.meses.filter((m) => m.venceu) : []);
  const emAberto = vencidos.length
    ? '<p class="trio-nota">Em aberto: <strong>' + esc(vencidos.map((m) => m.nome).join(' e '))
      + '</strong>.</p>'
    : '';
  return '<p class="trio-frase">Pague por Pix para <strong>' + esc(pix.titular || 'o Sistema Lastro')
    + '</strong>.</p>'
    + '<p class="trio-nota"><strong>Na descrição do Pix escreva duas coisas:</strong> o nome da '
    + 'escola — «' + esc(CADASTRO.escolaNome) + '» — e o mês a que o pagamento se refere. A '
    + 'conciliação é feita à mão, e é por esses dois nomes que o pagamento é ligado à escola e ao '
    + 'mês certos.</p>'
    + emAberto
    + '<label class="campo-rotulo" for="escola-pix-chave">Chave Pix</label>'
    + CHAVE_PIX(pix.chave)
    + '<p class="trio-nota">Confirmado o pagamento, o mês passa a «pago». A conciliação é feita '
    + 'em até 24 horas.</p>';
}

/**
 * A CHAVE E O BOTÃO QUE A COPIA (17/11/2026).
 *
 * O PEDIDO: «quando abrir a chave Pix, coloca ali um botãozinho desse de copiar, igual a gente tem
 * […] quando vai gerar a chave do GitHub». A razão é de quem usa: seleccionar texto à mão com o
 * rato, num telefone, é onde a chave se copia mal — e uma chave Pix copiada mal não falha na hora,
 * falha no dia em que o dinheiro não aparece.
 *
 * A PEÇA É A DA CASA. O `par-associar` já é «o controle e o botão na mesma linha» — é o que o
 * verbete usa para o «+». Nada de contentor novo; o que a folha da página ganha é a mesma cedência
 * que ela já dá ao `select` (`.par-associar select{flex:1 1 auto}`), agora para o `input`. */
function CHAVE_PIX(chave) {
  return '<p class="par-associar">'
    + '<input id="escola-pix-chave" readonly value="' + esc(chave) + '"'
    + ' aria-label="chave Pix da escola">'
    + '<button type="button" class="acao secundario pequena" data-copiar="escola-pix-chave"'
    + ' title="copiar a chave para a área de transferência">Copiar</button>'
    + '</p>';
}

/* ============================================================================== o cartão
 *
 * A FORMA É A DO `cartaoDaLista` (`motor/nucleo/lista-html.js`), replicada aqui com os três
 * painéis que a escola precisa. Se isto for aprovado, o que se faz é MOVER esta função para
 * `bastidores.js` — o arranjo já está provado, e não é preciso traduzi-lo.
 */
function cartaoDaEscolaProposto(dados, { aberto = '' } = {}) {
  const s = dados.situacao || {};
  const c = dados.cadastro || {};
  const nome = String(c.escolaNome || dados.escola || '').trim();

  const estado = s.situacao === 'em-aberto' ? 'falha' : (s.situacao === 'aguardando' ? 'discreto' : 'ok');
  const rotuloEstado = s.situacao === 'em-aberto' ? 'em aberto'
    : (s.situacao === 'aguardando' ? 'aguardando' : 'em dia');

  const doMes = s.meses && (s.meses.find((m) => m.mes === s.mesDeHoje) || s.meses[0]);
  const valorDaSituacao = s.situacao === 'em-aberto'
    ? (s.vencidos && s.vencidos.length === 1 ? '1 mês em aberto'
      : (s.vencidos ? s.vencidos.length + ' meses em aberto' : 'em aberto'))
    : (doMes ? doMes.nome.split(' de ')[0] + ' · pago' : 'aguardando');

  const fatos = [c.email || c.escolaEmail, c.telefone || c.escolaTelefone].filter(Boolean);
  const contexto = [c.cnpj ? 'CNPJ ' + c.cnpj : null,
    c.responsavel ? 'responsável ' + c.responsavel : null].filter(Boolean).join(' · ');

  return '<li class="trio-plano" id="es-cartao">'
    + '<div class="trio-linha"><span class="trio-nome"><b>' + esc(nome) + '</b>'
    + ' <span class="selo ' + estado + '" title="como está a mensalidade desta escola">'
    + esc(rotuloEstado) + '</span></span></div>'
    + (fatos.length ? '<div class="fatos">' + fatos.map((f) => '<span>' + esc(f) + '</span>').join('') + '</div>' : '')
    + (contexto ? '<div class="trio-dono">' + esc(contexto) + '</div>' : '')
    + '<div class="trio">'
    + caixa('contrato', 'Contrato', s.planoNome || s.plano || '—', { aberta: aberto === 'contrato' })
    + caixa('situacao', 'Situação', valorDaSituacao, { aberta: aberto === 'situacao' })
    + caixa('pagar', 'Pagar', dados.pix && dados.pix.chave ? 'Pix' : 'sem chave', { aberta: aberto === 'pagar' })
    + '</div>'
    + painel('contrato', painelDoContrato(s), { aberto: aberto === 'contrato' })
    + painel('situacao', painelDaSituacao(s), { aberto: aberto === 'situacao' })
    + painel('pagar', painelDoPagar(dados.pix, s), { aberto: aberto === 'pagar' })
    + '</li>';
}

/* ========================================================================= a página do mês a mês
 *
 * A LISTA INTEIRA, numa página própria — «um outro URL», como ela pediu. É «só uma listagem»: um
 * cartão por mês, do mais recente para o mais antigo, como se lê um extrato. Não tem caixa para
 * abrir, porque não há mais nada a saber: o cartão já diz o mês, o valor, o vencimento e, quando
 * está pago, quando e por onde.
 */
function cartaoDoMes(m) {
  const selo = m.status === 'pago'
    ? '<span class="selo ok">pago</span>'
    : (m.venceu ? '<span class="selo falha">em aberto</span>' : '<span class="selo discreto">a vencer</span>');
  const venc = (m.vencimento || '');
  const vencTexto = m.status === 'pago'
    ? 'venceu ' + venc.slice(8, 10) + '/' + venc.slice(5, 7)
    : (m.venceu ? 'venceu ' + venc.slice(8, 10) + '/' + venc.slice(5, 7)
      : 'vence ' + venc.slice(8, 10) + '/' + venc.slice(5, 7));
  const valor = emReais(m.status === 'pago' ? m.valorPagoCentavos : m.valorCentavos);
  /* O VALOR NÃO SE DIZ DUAS VEZES (17/11/2026). A primeira versão punha-o nos factos e outra vez
   * nesta linha, e a leitura ficava «R$ 99,00 · venceu 10/11 · pago em 10/11 · R$ 99,00». A linha
   * de baixo diz o que os factos não dizem: QUANDO foi pago, ou porque é que não foi. */
  const detalhe = m.status === 'pago'
    ? 'pago em ' + (m.emTexto || '').split(' ')[0]
    : (m.venceu ? 'sem pagamento registado' : 'ainda não venceu');
  return '<li class="trio-plano">'
    + '<div class="trio-linha"><span class="trio-nome"><b>' + esc(m.nome) + '</b> ' + selo
    + '</span></div>'
    + '<div class="fatos"><span>' + esc(valor) + '</span><span>' + esc(vencTexto) + '</span></div>'
    + '<div class="trio-dono">' + esc(detalhe) + '</div>'
    + '</li>';
}

function listaDoExtrato(s) {
  const pagos = s.meses.filter((m) => m.status === 'pago').length;
  const abertos = s.meses.filter((m) => m.venceu).length;
  const resumo = s.meses.length + ' mês(es) desde ' + (s.meses[s.meses.length - 1] || {}).nome
    + ' · ' + pagos + ' pago(s)'
    + (abertos ? ' · ' + abertos + ' em aberto' : ' · nada em aberto');
  return '<ul class="lb-cartoes">' + s.meses.map(cartaoDoMes).join('') + '</ul>'
    + '<p class="trio-nota">' + esc(resumo) + '</p>';
}

/* ================================================================================== os documentos */

/**
 * UMA JANELA DA PROPOSTA — a moldura que a folha desenha, servida com a folha de verdade.
 *
 * O QUE ENTRA E O QUE NÃO ENTRA. Entra o `ciclo.css` (as peças) e o `<style>` da página (o que
 * veste a `.secao` e o `.lb-cartoes`). Não entra a barra: a pergunta é a listagem, e a barra
 * ocuparia 60px de uma janela de 390px a tirar espaço ao que se está a avaliar.
 *
 * A ÚNICA REGRA DE LAYOUT QUE A PROPOSTA ACRESCENTA está escrita aqui, com o motivo à vista: a
 * secção da escola passa a uma coluna. Hoje ela é filha de uma grade de duas colunas — formulário
 * à esquerda, lista à direita — e não tem formulário nenhum: medido a 1280px, o cartão ocupa
 * 371px de 976, com 576px vazios ao lado.
 */
/**
 * OS DOIS GESTOS QUE A PÁGINA ACRESCENTA (17/11/2026) — e que a implementação leva consigo.
 *
 * 1. **COPIAR A CHAVE.** O `navigator.clipboard` é o caminho; quando ele não existe ou é negado
 *    (contexto inseguro, permissão), o campo é seleccionado e o `execCommand("copy")` faz o
 *    mesmo. O botão diz «Copiado» por 1,6s — sem resposta, a pessoa carrega outra vez a pensar
 *    que não funcionou.
 *
 * 2. **ABRIR A CAIXA INDICADA.** O «Pagar» do painel da Situação não é uma quarta caixa da fila:
 *    é um botão que pede à caixa «Pagar» que se abra. Um `.trio-item` dentro de um painel abriria
 *    um painel a partir de outro, e a fila passaria a dizer que há quatro.
 */
const GESTOS = [
  '(function () {',
  '  document.addEventListener("click", function (e) {',
  '    var b = e.target.closest("[data-copiar]");',
  '    if (!b) return;',
  '    var campo = document.getElementById(b.getAttribute("data-copiar"));',
  '    if (!campo) return;',
  '    var marcar = function () {',
  '      var antes = b.textContent;',
  '      b.textContent = "Copiado";',
  '      setTimeout(function () { b.textContent = antes; }, 1600);',
  '    };',
  '    var escolher = function () {',
  '      campo.focus();',
  '      campo.select();',
  '      try { document.execCommand("copy"); } catch (err) { /* o campo fica seleccionado */ }',
  '      marcar();',
  '    };',
  '    if (navigator.clipboard && navigator.clipboard.writeText) {',
  '      navigator.clipboard.writeText(campo.value).then(marcar, escolher);',
  '    } else {',
  '      escolher();',
  '    }',
  '  });',
  '})();',
  '(function () {',
  '  document.addEventListener("click", function (e) {',
  '    var b = e.target.closest("[data-abre]");',
  '    if (!b) return;',
  '    var cartao = b.closest("li");',
  '    var alvo = cartao && cartao.querySelector(\'.trio-item[data-balao="\'',
  '      + b.getAttribute("data-abre") + \'"]\');',
  '    if (!alvo) return;',
  '    e.preventDefault();',
  '    alvo.click();',
  '  });',
  '})();',
].join('\n');

function documento({ corpo, variantes, largura, rotulo, estilo, script, abrir = '', umaColuna = true }) {
  return [
    '<!doctype html>',
    '<html lang="pt-BR" data-modo="clara" data-paleta="bordo" data-modo-fonte="escola">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + esc(rotulo) + '</title>',
    '<style>' + CSS_DA_FOLHA + '</style>',
    '<style>' + estilo + '</style>',
    '<style>',
    '  body { margin: 0; background: var(--cream, #fbf8f3); }',
    '  .palco { padding: 1.1rem; max-width: ' + largura + 'px; }',
    '  .palco > h2 { margin: 0 0 .8rem; }',
    '  .palco > p { font: .85rem/1.5 var(--ui, system-ui); color: var(--texto-suave, #5a5348);',
    '    margin: 0 0 1rem; }',
    /* O CAMPO DA CHAVE CEDE A LARGURA AO BOTÃO (17/11/2026) — a mesma regra que a página já dá
     * ao `select` do `.par-associar`, aplicada ao `input`. Sem ela o campo não encolhe, e o
     * «Copiar» sai da caixa no telemóvel. */
    '  .par-associar input { flex: 1 1 auto; min-width: 0; max-width: none; }',
    /* AS DUAS SECÇÕES PASSAM A UMA COLUNA — a regra que a proposta introduz. A de «A escola»
     * porque não tem formulário ao lado; a do extrato porque é uma listagem de ponta a ponta.
     *
     * A MOLDURA DO «HOJE» NÃO A LEVA (`umaColuna: false`). Sem essa distinção, o «antes» saía
     * com a largura da proposta e a comparação mentia a favor da proposta — o defeito que
     * qualquer bancada corre o risco de ter. */
    umaColuna ? '  #sec-a-escola, #sec-financeiro { grid-template-columns: minmax(0, 1fr); }' : '',
    '</style>',
    '</head>',
    '<body>',
    '<div class="palco">',
    '<p>' + rotulo + '</p>',
    corpo,
    '</div>',
    script ? '<script>' + script + '</script>' : '',
    '<script>',
    GESTOS,
    '</script>',
    '<script>',
    /* A CAIXA ABERTA À CHEGADA. A moldura mostra o estado fechado — que é como a página nasce —,
     * e quem quer ver o que há dentro abre a caixa com o clique que a página já tem. Este atalho
     * existe só para a proposta poder mostrar os três painéis lado a lado sem pedir três cliques. */
    '(function () {',
    /* O ESTADO PEDIDO VEM NO ENDEREÇO (`#contrato`, `#situacao`, `#pagar`), e não do texto do
     * ficheiro: a mesma página serve as três caixas abertas, e é o invólucro que escolhe qual.
     *
     * A MESMA PÁGINA SERVE OS DOIS CENÁRIOS (`#situacao` e `#situacao-aberto`). As duas listagens
     * viajam aqui dentro — uma em dia, outra com um mês vencido —, e a que não foi pedida nunca
     * chega ao DOM. Não é economia de bytes por si: é a diferença entre uma bancada de oito
     * páginas de 190kB (1,5MB copiados para CADA escola) e uma de seis. */
    '  var VARIANTES = ' + JSON.stringify(variantes || {}) + ';',
    '  var h = (location.hash || "").replace("#", "");',
    '  var querAberto = /aberto/.test(h);',
    '  if (querAberto && VARIANTES.aberto) {',
    '    var lista = document.getElementById("es-lista");',
    '    if (lista) lista.outerHTML = VARIANTES.aberto;',
    '  }',
    '  var alvo = h.replace("-aberto", "") || ' + JSON.stringify(abrir) + ';',
    '  if (!alvo) return;',
    '  var b = document.querySelector(\'.trio-item[data-balao="\' + alvo + \'"]\');',
    '  if (b) b.click();',
    '})();',
    '</script>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/** A SECÇÃO, como ela ficaria na página — a listagem a ocupar a largura toda. */
function secao(dados, { aberto = '' } = {}) {
  return '<section class="secao" id="sec-a-escola">'
    + '<h2>A escola</h2>'
    + '<ul class="lb-cartoes" id="es-lista">' + cartaoDaEscolaProposto(dados, { aberto }) + '</ul>'
    + '</section>';
}

/** A PÁGINA DO MÊS A MÊS — a listagem inteira, com o mesmo cartão. */
function paginaDoExtrato(dados) {
  return '<section class="secao" id="sec-financeiro">'
    + '<h2>Mês a mês</h2>'
    + '<p class="sub">' + esc(CADASTRO.escolaNome) + ' · ' + esc(dados.situacao.planoNome || '')
    + ' · ' + esc(emReais(dados.situacao.valorCentavos)) + ' por mês</p>'
    + listaDoExtrato(dados.situacao)
    + '</section>';
}

/* ================================================================================= o invólucro
 *
 * AS DUAS LARGURAS SÃO IFRAMES, e não duas `<div>` de larguras diferentes na mesma página: as
 * regras de telemóvel da folha são `@media (max-width)`, que respondem à JANELA. Numa `<div>` de
 * 390px dentro de um ecrã de 1280px elas não disparavam, e a proposta mentiria sobre o telemóvel.
 */
function paginaDaProposta() {
  const lado = (ficheiro, classe, rotulo, largura, nota) => [
    '<figure class="postura ' + classe + '">',
    '<figcaption><b>' + rotulo + '</b><span>' + largura + '</span></figcaption>',
    '<p>' + nota + '</p>',
    '<div class="moldura"><iframe src="' + ficheiro + '" title="' + rotulo + '"></iframe></div>',
    '</figure>',
  ].join('\n');

  return [
    '<!doctype html>',
    '<html lang="pt-BR" data-modo="clara" data-paleta="bordo">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Proposta — a escola como listagem</title>',
    '<style>' + CSS_DA_FOLHA + '</style>',
    '<style>',
    '  body { margin: 0; background: var(--cream, #fbf8f3); color: var(--tinta, #1f1c1a); }',
    /* O `main` DA FOLHA É UMA GRADE DE DUAS COLUNAS — `minmax(0,1fr) 17rem` —, para a página ter
     * a coluna de apoio à direita. Esta página não tem coluna de apoio: é uma bancada de molduras.
     * Sem esta linha o conteúdo ficava nos 272px da segunda coluna, e as molduras de 1240px
     * transbordavam para fora da página. A bancada da linha de base resolve-o com
     * `data-layout="painel"`; a regra explícita diz a mesma coisa sem depender do atributo. */
    '  main { display: block; max-width: 1640px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }',
    '  h1 { font: 700 1.5rem/1.25 var(--serif, Georgia, serif); color: var(--burgundy, #6b1f2e);',
    '    margin: 0 0 .4rem; }',
    '  h2.rodada { font: 700 1.05rem/1.3 var(--ui, system-ui); color: var(--burgundy, #6b1f2e);',
    '    margin: 2.4rem 0 .2rem; padding-bottom: .35rem;',
    '    border-bottom: 1px solid var(--gold-borda, #a08a58); }',
    '  .abre { font: .95rem/1.6 var(--serif, Georgia, serif); color: var(--texto-suave, #5a5348);',
    '    max-width: 76ch; margin: 0 0 1rem; }',
    '  .posturas { display: flex; flex-wrap: wrap; gap: 2rem; align-items: flex-start; }',
    '  .postura { margin: 0; flex: 0 0 auto; }',
    '  .postura figcaption { display: flex; align-items: baseline; gap: .5rem;',
    '    font: 700 .95rem/1.3 var(--ui, system-ui); color: var(--burgundy, #6b1f2e); }',
    '  .postura figcaption span { font-weight: 400; color: var(--texto-suave, #5a5348); }',
    '  .postura > p { font: .85rem/1.5 var(--ui, system-ui); color: var(--texto-suave, #5a5348);',
    '    max-width: 46ch; margin: .25rem 0 .75rem; }',
    '  .moldura { border: 1px solid var(--gold-borda, #a08a58); border-radius: 10px;',
    '    overflow: hidden; background: #fff; box-shadow: 0 8px 24px rgba(31,28,26,.10); }',
    '  .moldura iframe { display: block; border: 0; background: #fff; }',
    '  .postura.celular .moldura { width: 390px; }',
    '  .postura.celular iframe { width: 390px; height: 860px; }',
    '  .postura.desktop .moldura { width: 1240px; max-width: 100%; }',
    '  .postura.desktop iframe { width: 1240px; height: 620px; }',
    '  .postura.larga .moldura { width: 1240px; max-width: 100%; }',
    '  .postura.larga iframe { width: 1240px; height: 860px; }',
    /* AS MOLDURAS DE COMPUTADOR SÓ APARECEM QUANDO CABEM INTEIRAS (17/11/2026). São janelas de
     * 1240px e não encolhem — um `<iframe>` tem a largura que lhe for dada, e reduzi-lo mostraria
     * a página de computador numa janela que já não é a de computador. Abaixo de 1320px ficam as
     * do telemóvel, que é onde a decisão é difícil. */
    '  @media (max-width: 1319px) {',
    '    .postura.desktop, .postura.larga { display: none; }',
    '    .postura.celular .moldura, .postura.celular iframe { width: 100%; max-width: 390px; }',
    '  }',
    '</style>',
    '</head>',
    '<body>',
    '<main>',
    '<h1>Proposta — a escola como listagem</h1>',
    '<p class="abre">A secção deixa de ser uma caixa com três abas dentro e passa a ser a mesma '
    + 'listagem das outras secções: o nome com o selo do estado, o contato na linha de baixo, e '
    + '<b>três caixas que se abrem</b> — Contrato, Situação e Pagar. As caixas são as peças que a '
    + 'Audição já usa; o que muda é o arranjo. <b>Clique nas caixas</b>: elas abrem, e é dentro '
    + 'delas que está o que se está a decidir.</p>',

    '<h2 class="rodada">O que está lá hoje</h2>',
    '<div class="posturas">',
    lado('proposta-escola-hoje.html', 'desktop', 'Hoje', '1240 × 620',
      'A caixa com as três abas, dentro de uma coluna de 38% da secção. Medido: <b>371px de '
      + '976</b> — e 576px vazios ao lado, porque a secção é uma grade de duas colunas à espera '
      + 'de um formulário que não existe.'),
    '</div>',

    '<h2 class="rodada">A listagem — em dia</h2>',
    '<div class="posturas">',
    lado('proposta-escola-desktop.html', 'desktop', 'Computador', '1240 × 620',
      'O cartão ocupa a largura da página. As três caixas ficam em três colunas; clique numa para '
      + 'ver o que ela guarda.'),
    lado('proposta-escola-celular.html', 'celular', 'Celular', '390 × 860',
      'Os três blocos cabem numa fila; o nome, o contato e o contexto descem. Abaixo de 360px as '
      + 'caixas passam a uma coluna, como em todas as listas.'),
    '</div>',

    '<h2 class="rodada">As três caixas, abertas</h2>',
    '<div class="posturas">',
    lado('proposta-escola-desktop.html#contrato', 'desktop', 'Contrato', '1240 × 620',
      'O plano, a mensalidade, o piso («a partir de»), o que foi contratado além dele, o teto e o '
      + 'próximo vencimento. É a antiga aba «O contrato e o pagamento», sem o extrato.'),
    lado('proposta-escola-desktop.html#situacao', 'desktop', 'Situação — em dia', '1240 × 620',
      'O mês corrente e o valor. <b>Não há secção de «em aberto»</b> — ela não existe quando não '
      + 'há nada em aberto, como você pediu. O link leva à página do mês a mês.'),
    lado('proposta-escola-desktop.html#pagar', 'desktop', 'Pagar', '1240 × 620',
      'A chave Pix <b>com o botão que a copia</b>, e a instrução de escrever na descrição '
      + '<b>o nome da escola e o mês</b> a que o pagamento se refere.'),
    '</div>',

    '<h2 class="rodada">Situação com um mês em aberto</h2>',
    '<div class="posturas">',
    lado('proposta-escola-desktop.html#situacao-aberto', 'desktop', 'Computador', '1240 × 620',
      'O mesmo painel, agora com outubro vencido: o bloco «Em aberto» aparece com o mês, a data em '
      + 'que venceu e o valor — e desaparece quando não há nenhum. <b>E o botão «Pagar outubro»</b> '
      + 'abre a chave Pix sem ter de voltar à terceira caixa.'),
    lado('proposta-escola-celular.html#situacao-aberto', 'celular', 'Celular', '390 × 860',
      'No telemóvel o painel ocupa a largura toda, abaixo das três caixas.'),
    '</div>',

    '<h2 class="rodada">A página do mês a mês — <code>/bastidores/financeiro</code></h2>',
    '<div class="posturas">',
    lado('proposta-escola-extrato-desktop.html', 'larga', 'Computador', '1240 × 860',
      'A listagem inteira, do mais recente para o mais antigo. É «só uma listagem»: um cartão por '
      + 'mês, com o selo, o valor, o vencimento e — quando está pago — a data e a forma.'),
    lado('proposta-escola-extrato-celular.html', 'celular', 'Celular', '390 × 860',
      'A mesma lista no telemóvel.'),
    '</div>',

    '<p class="abre">O que esta proposta <b>não</b> decide: a barra e o menu da página nova (aqui '
    + 'não aparecem, para não roubar largura ao que se está a avaliar), e o nome do endereço — '
    + '<code>/bastidores/financeiro</code> é sugestão, e muda sem custo.</p>',
    '<p class="abre">Em janelas com menos de 1320px de largura as molduras do computador não '
    + 'aparecem — são janelas de 1240px, e encolhê-las mostraria outra página. Num ecrã largo '
    + 'vê-se tudo; num estreito ficam as do telemóvel, que é onde a decisão é difícil.</p>',
    '</main>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/* ======================================================================================== main */

(async () => {
  const pagina = paginaDaProducao();
  const estilo = estiloDaPagina(pagina);
  const script = scriptDoPainel(pagina);
  if (!script) {
    console.error('propor-escola: o ouvinte das caixas não foi encontrado na página — as caixas '
      + 'não vão abrir na proposta.');
  }

  const emDia = dadosDaEscola();
  const comAberto = dadosDaEscola({ outubroAberto: true });

  /* O «ANTES» É O CARTÃO REAL — a função que a produção usa hoje, e não um desenho meu dela. */
  const hoje = '<section class="secao" id="sec-a-escola"><h2>A escola</h2>'
    + bastidores.cartaoDaEscola(dadosDaEscola()) + '</section>';

  const arquivos = {
    'proposta-escola-hoje.html': documento({
      corpo: hoje, largura: 1240, rotulo: 'Hoje — a caixa com as três abas', estilo, script,
      umaColuna: false,
    }),
    'proposta-escola-desktop.html': documento({
      corpo: secao(emDia),
      /* A LISTAGEM DO CENÁRIO «EM ABERTO» VIAJA NA MESMA PÁGINA, e só entra no DOM quando o
       * endereço a pede (`#situacao-aberto`). Ver a nota no script, em `documento`. */
      variantes: { aberto: secao(comAberto) },
      largura: 1240, rotulo: 'A escola, como listagem', estilo, script,
    }),
    'proposta-escola-celular.html': documento({
      corpo: secao(emDia),
      variantes: { aberto: secao(comAberto) },
      largura: 390, rotulo: 'A escola, como listagem (celular)', estilo, script,
    }),
    'proposta-escola-extrato-desktop.html': documento({
      corpo: paginaDoExtrato(comAberto), largura: 1240,
      rotulo: 'Mês a mês — a listagem inteira', estilo, script,
    }),
    'proposta-escola-extrato-celular.html': documento({
      corpo: paginaDoExtrato(comAberto), largura: 390,
      rotulo: 'Mês a mês (celular)', estilo, script,
    }),
    'proposta-escola.html': paginaDaProposta(),
  };

  for (const [nome, texto] of Object.entries(arquivos)) {
    fs.writeFileSync(path.join(SAIDA, nome), texto, 'utf8');
    console.log(nome + ' — ' + Math.round(texto.length / 1024) + ' kB');
  }
  console.log('\npropor-escola: ' + Object.keys(arquivos).length + ' páginas em experimentos/propostas/');
})().catch((erro) => {
  console.error('propor-escola: ' + (erro && erro.message ? erro.message : erro));
  process.exit(1);
});
