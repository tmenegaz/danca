#!/usr/bin/env node
'use strict';

/*
 * provar-a-franquia-de-aulas.js — a unidade comercial é a AULA, e o catálogo, a conta e a página
 * dizem a mesma coisa (17/11/2026).
 *
 * O QUE MUDOU, e a prova existe para o fixar: o §ADITIVO COMERCIAL de 17/11/2026 trocou a unidade
 * de contratação. A escola deixou de comprar «1 professor e 10 alunas» e passou a comprar «100
 * aulas por mês». As três consequências, e cada uma é uma secção desta prova:
 *
 *   1. O CATÁLOGO diz a franquia (100 · 300 · 800) e diz os pacotes (+20 / +50 / +100 a R$ 0,50 por
 *      aula). E diz os professores/alunos de outra maneira: como REFERÊNCIA de tamanho, «custo
 *      interno» — «não é correto afirmar que fichas de alunos ou registros de professores não custam
 *      nada», mas também não é correcto cobrá-las.
 *   2. A CONTA soma a franquia do plano com os pacotes, e devolve um EXCEDENTE em vez de uma recusa:
 *      «se ela der mais aulas do que o que ela contratou, tem um excedente. Aí ela tem que pagar
 *      pelo excedente.»
 *   3. A PÁGINA mostra a franquia, e NÃO apresenta professores nem alunos como limite — o §ADITIVO
 *      §2 proíbe-o por palavras próprias.
 *
 * O QUE ESTA PROVA NÃO FAZ: não conta aulas. O contador tem plano próprio
 * (PLANO-CONTADOR-DE-AULAS.md) e ainda não existe; aqui mede-se o que já está pronto para o
 * receber, e o `null` que ele devolve enquanto não há contagem.
 *
 *   node experimentos/provar-a-franquia-de-aulas.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
const mensalidades = require(path.join(RAIZ, 'motor/nucleo/mensalidades.js'));
const monitoramento = require(path.join(RAIZ, 'motor/nucleo/monitoramento.js'));
const CATALOGO = require(path.join(RAIZ, 'biblioteca/comercial/planos.json'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

/* ------------------------------- A BANCADA ------------------------------- */

/** Uma página de Produção com o contrato que se lhe der — o mesmo caminho que a rota usa. */
function paginaDaEscola(contrato, aulasUsadas) {
  const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
  const situacao = contrato ? mensalidades.situacaoDaEscola({
    escola: 'breu', contrato, livro: [], agora: '2026-11-17T12:00:00Z', aulasUsadas,
  }) : null;
  return bastidores.paginaProducao(
    'breu', {}, [], [], 'Brise Volet', 'brise-volet', [], [], {}, [], [], [],
    { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 }, null, null, [],
    new Set(), contrato
      ? { ok: true, contrato, situacao: Object.assign({}, situacao, { frase: 'Em dia.' }) }
      : { ok: true, contrato: null },
  );
}

(async () => {
  console.log('A. O catálogo: a franquia é a unidade, e as pessoas são referência');
  {
    /* A ESCADA VEM DO CATÁLOGO (25/11/2026). Aqui estava `{basico:100, intermediario:300,
     * avancado:800}` escrito à mão, e ele sobreviveu à mudança para 130/320/500 a reprovar a
     * própria decisão: uma prova que guarda uma segunda cópia do dado não guarda o dado, guarda a
     * cópia — e a cópia envelhece sem avisar. O que se continua a afirmar é a FORMA: três planos,
     * franquias crescentes, e o catálogo a ser o sítio onde elas vivem. */
    const franquias = comercial.ASSINATURAS.map((a) => Number(a.aulas));
    conferir('os três planos vendem aulas, e a franquia cresce de degrau para degrau',
      franquias.length === 3 && franquias.every((n) => n > 0)
      && franquias[1] > franquias[0] && franquias[2] > franquias[1], franquias);
    conferir('…e `franquiaDoPlano` devolve o que o catálogo diz, plano a plano',
      comercial.ASSINATURAS.every((a) => comercial.franquiaDoPlano(a.id) === Number(a.aulas)),
      comercial.ASSINATURAS.map((a) => [a.id, comercial.franquiaDoPlano(a.id)]));
    conferir('…e os preços são os da escada decidida: 69,90 / 99,90 / 139,90',
      comercial.ASSINATURAS.map((a) => a.preco).join(',') === '69.9,99.9,139.9',
      comercial.ASSINATURAS.map((a) => a.preco));

    /* O EIXO QUE MORREU. A partir de 17/11 as pessoas não são limite comercial — o catálogo
     * continua a declará-las, e é isso que se mede: que continuam lá (custo interno medido) e que
     * já não são o eixo (a franquia é que é). */
    conferir('os campos de professores e alunos continuam no catálogo — são custo interno medido',
      comercial.ASSINATURAS.every((a) => Number(a.professores) > 0 && Number(a.alunos) > 0),
      comercial.ASSINATURAS.map((a) => [a.professores, a.alunos]));
    conferir('…e o catálogo diz que a unidade é a aula', funcionamento().unidade === 'aula', funcionamento().unidade);
    /* A PÁGINA RECEBE AS DUAS COISAS, e separadas: `aulas` para mostrar, `referencia` para medir. */
    const p = funcionamento().assinaturas[0];
    conferir('…e a página recebe `aulas` à parte e as pessoas dentro de «referencia»',
      p.aulas === Number(comercial.ASSINATURAS[0].aulas) && p.referencia
      && p.referencia.professores === Number(comercial.ASSINATURAS[0].professores)
      && p.referencia.alunos === Number(comercial.ASSINATURAS[0].alunos), p);
    conferir('…e já não recebe professores/alunos como campo de topo a parecer limite',
      p.professores === undefined && p.alunos === undefined, Object.keys(p));
  }

  console.log('\nB. A conta: a franquia soma, e o excedente paga-se');
  {
    /* `c` NUNCA REBENTA. Uma prova que estoura não reprova: ela interrompe, e as asserções
     * seguintes nunca correm — foi o que aconteceu no controlo A/B desta própria prova, com o
     * catálogo posto a zero. O `situacaoDaFranquia` devolve `null` quando o plano não tem franquia
     * (é legítimo: um contrato anterior ao eixo), e a prova tem de dizer «falhou», e não morrer. */
    const c = (contrato, n) => comercial.situacaoDaFranquia({ contrato, aulasUsadas: n })
      || { franquia: null, estado: null, excedente: null, usadas: null, restantes: null, frase: '' };
    /* A FRANQUIA DO MEIO, lida do catálogo: 320 com a escada de 25/11/2026, e o que quer que o
     * catálogo passe a dizer se ela voltar a mexer-lhe. As fronteiras dos quatro estados são
     * DERIVADAS dela — 80% e a própria franquia —, e é a forma da regra que se mede, não o número. */
    const FR = Number(comercial.ASSINATURAS[1].aulas);
    conferir('a franquia do plano é a base (Intermediário = ' + FR + ')',
      c({ plano: 'intermediario' }, 0).franquia === FR, c({ plano: 'intermediario' }, 0).franquia);

    /* OS QUATRO ESTADOS, com as fronteiras DERIVADAS da franquia. */
    const antesDoCorte = Math.floor(FR * 0.8) - 1;
    const noCorte = Math.ceil(FR * 0.8);
    conferir(antesDoCorte + ' é «folga» e ' + noCorte + ' é «perto» — o corte dos 80% é declarado',
      c({ plano: 'intermediario' }, antesDoCorte).estado === 'folga'
      && c({ plano: 'intermediario' }, noCorte).estado === 'perto',
      [c({ plano: 'intermediario' }, antesDoCorte).estado, c({ plano: 'intermediario' }, noCorte).estado]);
    conferir('aos ' + FR + ' é «limite» — e ainda não há excedente',
      c({ plano: 'intermediario' }, FR).estado === 'limite' && c({ plano: 'intermediario' }, FR).excedente === 0);
    conferir('aos ' + (FR + 50) + ' é «passou», com 50 de excedente',
      c({ plano: 'intermediario' }, FR + 50).estado === 'passou'
      && c({ plano: 'intermediario' }, FR + 50).excedente === 50,
      c({ plano: 'intermediario' }, FR + 50).excedente);

    /* `null` ≠ `0` — a distinção que o cartão usa para calar em vez de mentir. */
    const semContagem = c({ plano: 'basico' }, null);
    const zero = c({ plano: 'basico' }, 0);
    conferir('sem contagem, `usadas` é null e o estado também', semContagem.usadas === null && semContagem.estado === null, semContagem);
    conferir('…mas com contagem a zero, é zero e o estado é «folga»', zero.usadas === 0 && zero.estado === 'folga', zero);
    conferir('…e a frase do sem-contagem diz que o consumo não é contado por este ecrã',
      /ainda não é\s+contado/i.test(semContagem.frase || '') || /não é\s+contado/i.test(semContagem.frase || ''),
      semContagem.frase);

    /* OS PACOTES SOMAM, e por ids — o preço vem do catálogo, não do registo. */
    conferir('os três pacotes são +20/+50/+100 a R$ 10 / R$ 25 / R$ 50',
      comercial.pacotesDeAulas().map((x) => [x.aulas, x.preco].join('/')).join(' ') === '20/10 50/25 100/50',
      comercial.pacotesDeAulas());
    const BASE_B = Number(comercial.ASSINATURAS[0].aulas);
    const pequeno = Number(comercial.pacotesDeAulas()[0].aulas);
    conferir('Básico + um pacote pequeno = ' + (BASE_B + pequeno) + ' aulas',
      c({ plano: 'basico', pacotes: ['p'] }, 0).franquia === BASE_B + pequeno, null);
    conferir('…e dois pacotes iguais somam duas vezes',
      c({ plano: 'basico', pacotes: ['p', 'p'] }, 0).franquia === BASE_B + 2 * pequeno, null);
    conferir('…e um pacote que o catálogo não tem é ignorado, sem rebentar',
      c({ plano: 'basico', pacotes: ['zzz'] }, 0).franquia === BASE_B, null);
    /* Um contrato ANTIGO (objecto em vez de id) continua legível — o registo não se migra à força. */
    conferir('um contrato antigo com pacotes em objecto continua a somar',
      c({ plano: 'basico', pacotes: [{ id: 'x', aulas: 20, preco: 10 }] }, 0).franquia === BASE_B + 20, null);

    /* A CONTA DO DINHEIRO: o pacote entra na mensalidade, e o total é o do catálogo. */
    const conta = comercial.calcular({ assinatura: 'basico', pacotes: ['m'] });
    const medio = Number(comercial.pacotesDeAulas()[1].aulas);
    conferir('Básico + pacote médio = R$ 94,90 e ' + (BASE_B + medio) + ' aulas',
      conta.total === 'R$ 94,90' && conta.capacidadeTotal.aulas === BASE_B + medio,
      [conta.total, conta.capacidadeTotal.aulas]);
    conferir('…e o desconto continua a não ser inventado', conta.descontoCentavos === 0, conta.descontoCentavos);
  }

  console.log('\nC. A regra do preço: a aula da extensão custa mais do que a do plano de cima');
  {
    /* A REGRA DA PROPRIETÁRIA, e é ela que fixou os R$ 0,50: «o custo unitário da aula da extensão é
     * maior do que o custo unitário da aula no próximo plano». Abaixo disso, ninguém migra. */
    const porAula = (id) => comercial.assinaturaPorId(id).preco / comercial.franquiaDoPlano(id);
    const daExtensao = comercial.pacotesDeAulas().map((x) => x.preco / x.aulas);
    conferir('todos os pacotes custam o mesmo por aula — um preço, e não três',
      daExtensao.every((v) => Math.abs(v - 0.5) < 1e-9), daExtensao);
    conferir('…e esse preço é maior do que a aula do Intermediário (R$ 0,333)',
      daExtensao[0] > porAula('intermediario'), porAula('intermediario'));
    conferir('…e maior do que a do Avançado (R$ 0,175)',
      daExtensao[0] > porAula('avancado'), porAula('avancado'));

    /* O PONTO DE VIRAGEM, calculado: acima dele migrar custa menos do que ficar com extensões. */
    const viragem = (de, para, preco) => Math.ceil(
      comercial.franquiaDoPlano(de)
      + (comercial.assinaturaPorId(para).preco - comercial.assinaturaPorId(de).preco) / preco);
    /* O PONTO DE VIRAGEM NÃO SE ESCREVE, confere-se a FORMA: ele existe (cai acima da franquia do
     * plano de baixo e abaixo da do plano de cima) — que é o que faz a janela da extensão existir. O
     * número muda com a escada, e a asserção não pode mudar com ele sem dizer nada. */
    const v1 = viragem('basico', 'intermediario', 0.5);
    const v2 = viragem('intermediario', 'avancado', 0.5);
    conferir('a migração do Básico acontece às ' + v1 + ' aulas — dentro da franquia do de cima',
      v1 > comercial.franquiaDoPlano('basico') && v1 < comercial.franquiaDoPlano('intermediario'), v1);
    conferir('…e a do Intermediário às ' + v2 + ' — também dentro',
      v2 > comercial.franquiaDoPlano('intermediario') && v2 < comercial.franquiaDoPlano('avancado'), v2);
    /* E os dois lados do ponto, medidos: abaixo o desembolso manda; acima, o preço por aula. */
    const desembolso = (plano, aulas, preco) => comercial.assinaturaPorId(plano).preco
      + Math.ceil(Math.max(0, aulas - comercial.franquiaDoPlano(plano)) / 20) * 20 * preco;
    conferir('abaixo das 160, o Básico com extensões desembolsa menos do que o Intermediário',
      desembolso('basico', 140, 0.5) < comercial.assinaturaPorId('intermediario').preco,
      desembolso('basico', 140, 0.5));
    conferir('acima das 160, desembolsa mais — e é isso que faz migrar',
      desembolso('basico', 200, 0.5) > comercial.assinaturaPorId('intermediario').preco,
      desembolso('basico', 200, 0.5));
  }

  console.log('\nD. A página da escola: a franquia aparece, o limite de gente não');
  {
    /* A escada lida do catálogo, outra vez neste bloco: `BASE_B` e `pequeno` vivem no escopo do B,
     * e uma variável de outro bloco é exactamente o tipo de acoplamento que faz uma prova parecer
     * verde por acidente. */
    const BASE_B = Number(comercial.ASSINATURAS[0].aulas);
    const pequeno = Number(comercial.pacotesDeAulas()[0].aulas);
    /* SEM CONTAGEM DE AULAS, o cartão mostra a franquia e CALA o consumo. */
    const semContagem = paginaDaEscola({ plano: 'basico', capacidade: { professores: 1, alunos: 10 } });
    conferir('o cartão diz a franquia de aulas do plano (' + BASE_B + ' aulas por mês)',
      /Franquia de aulas/.test(semContagem)
      && new RegExp(BASE_B + ' aulas por mês').test(semContagem), null);
    conferir('…e NÃO afirma um consumo que não foi medido', !/Consumo do mês/.test(semContagem), null);
    /* COM CONTAGEM, mostra os dois números. */
    const comContagem = paginaDaEscola({ plano: 'basico', capacidade: { professores: 1, alunos: 10 } }, 40);
    conferir('com contagem, o cartão diz 40 de ' + BASE_B,
      /Consumo do mês/.test(comContagem)
      && new RegExp('40 de ' + BASE_B).test(comContagem), null);
    /* E O EXCEDENTE, quando passa — 30 acima da franquia, seja ela qual for. */
    const acima = BASE_B + 30;
    const passou = paginaDaEscola({ plano: 'basico', capacidade: { professores: 1, alunos: 10 } }, acima);
    conferir('acima da franquia (' + acima + ' aulas), o cartão diz 30 excedente',
      /30 excedente/.test(passou), null);

    /* O QUE NÃO PODE ESTAR: número nenhum de gente. A referência de tamanho passou por aqui uma
     * tarde (17/11/2026) e saiu no mesmo dia, por decisão dela: «Isso não existe mais, esse tipo de
     * referência não existe mais.» */
    conferir('o cartão já não diz «Piso contratado» nem «Teto do plano»',
      !/Piso contratado/.test(semContagem) && !/Teto do plano/.test(semContagem), null);
    conferir('…nem «Tamanho de referência» nem «Referência do topo», que também saíram',
      !/Tamanho de referência/.test(semContagem) && !/Referência do topo/.test(semContagem), null);
    /* E O QUE FICA É O QUE SE COBRA: o plano, a mensalidade REAL, a franquia e o que foi contratado
     * além. O contrato do teste acima não declara valor — e um contrato sem valor não mostra a
     * linha, que é o comportamento certo (não se inventa um preço). Este declara. */
    const comValor = paginaDaEscola({
      plano: 'intermediario', pacotes: ['p'], valorCentavos: 10990, valor: 'R$ 109,90',
      capacidade: { professores: 3, alunos: 40 },
    });
    conferir('…e o cartão diz a mensalidade real do contrato: R$ 109,90',
      /Mensalidade/.test(comValor) && /R\$ 109,90/.test(comValor), null);
    const COM_PACOTE = Number(comercial.ASSINATURAS[1].aulas) + pequeno;
    conferir('…e a franquia com o pacote somado: ' + COM_PACOTE + ' aulas por mês',
      /Franquia de aulas/.test(comValor)
      && new RegExp(COM_PACOTE + ' aulas por mês').test(comValor), null);
    conferir('…e o que foi contratado além dela: +20 aulas',
      /Aulas extras/.test(comValor) && /\+20 aulas/.test(comValor), null);
  }

  console.log('\nE. A receita em aulas: a mesma receita, no eixo novo');
  {
    const r = (extrato) => monitoramento.receita({ extrato, descontos: [], mes: '2026-11' });
    const dois = [
      { escola: 'a', valorCentavos: 6990, franquia: { franquia: 100, usadas: 40 } },
      { escola: 'b', valorCentavos: 13990, franquia: { franquia: 800, usadas: 50 } },
    ];
    const cheio = r(dois).aulas;
    conferir('a franquia vendida soma-se dos contratos: 900 aulas',
      cheio.franquiaTotal === 900 && cheio.contratosComFranquia === 2, cheio);
    conferir('…e o preço por aula contratada sai do MRR ÷ aulas (R$ 0,23)',
      cheio.precoContratadoCentavos === 23, cheio.precoContratadoCentavos);
    conferir('…e o preço por aula USADA também, quando a contagem é inteira',
      cheio.usadas === 90 && cheio.precoUsadoCentavos === 233, [cheio.usadas, cheio.precoUsadoCentavos]);

    /* A SOMA É INTEIRA OU NÃO É: um contrato sem contagem faz o parque ser `null`. */
    const parcial = r([dois[0], { escola: 'b', valorCentavos: 13990, franquia: { franquia: 800, usadas: null } }]).aulas;
    conferir('um contrato sem contagem faz o consumo do parque ser null — e não uma parte',
      parcial.usadas === null && parcial.precoUsadoCentavos === null
        && parcial.contratosComContagem === 1 && parcial.contratosComFranquia === 2, parcial);
    /* E SEM NENHUMA CONTAGEM, o mesmo — e a franquia continua a ser dita. */
    const nenhuma = r([{ escola: 'a', valorCentavos: 6990, franquia: { franquia: 100, usadas: null } }]).aulas;
    conferir('sem nenhuma contagem, a franquia diz-se e o consumo é null',
      nenhuma.franquiaTotal === 100 && nenhuma.usadas === null, nenhuma);
    /* UMA ESCOLA SEM FRANQUIA (contrato anterior ao eixo) conta zero, e não rebenta. */
    const antiga = r([{ escola: 'c', valorCentavos: 19990 }]).aulas;
    conferir('um contrato sem franquia não rebenta a conta e não soma aulas',
      antiga.franquiaTotal === 0 && antiga.contratosComFranquia === 0 && antiga.precoContratadoCentavos === null, antiga);
  }

  console.log('');
  if (ko) {
    console.log('FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + ok + ' asserção(ões).');
})();

/** O catálogo como a página o recebe — uma vez, para as asserções que o leem. */
function funcionamento() {
  return comercial.catalogoDaPagina();
}
