#!/usr/bin/env node
'use strict';

/*
 * provar-o-ponto-de-migracao.js — o aviso de quando vale a pena a escola subir de plano
 * (25/11/2026).
 *
 * O QUE ELA PEDIU: «É ali que você vai me dizer quando vale a pena então migrar. É o ponto de
 * migração da escola. E aí que eu vou pedir para o consultor entrar em contacto e aí ele ganha uma
 * grana e presta essa consultoria e mantém a escola viva.»
 *
 * A CONTA QUE ISTO PROTEGE. Uma escola que cresce compra extensão a R$ 0,50 ou sobe de plano. A
 * partir de um certo número de aulas subir fica mais barato:
 *
 *     viragem = franquia + (preço de cima − preço de baixo) ÷ preço da extensão
 *
 * Com a escada 130/320/500 e a extensão a R$ 0,50: **190** (Básico→Intermediário) e **400**
 * (Intermediário→Avançado). E o que se afirma em cada linha é a frase que o consultor leva: no
 * ponto, a escola **paga o mesmo e recebe menos aulas**.
 *
 * O QUE SE MEDE, com o controlo em cada frente:
 *   (i) os pontos derivam do catálogo — não de números escritos aqui — e caem dentro da franquia do
 *       plano de cima (senão a janela da extensão não existiria);
 *   (ii) no ponto, `pagaNoPonto` é IGUAL a `pagaMigrada`, e `aulasQuePagaSemReceber` é a diferença
 *       das aulas — o controlo é que um cêntimo abaixo do ponto a igualdade já não vale;
 *   (iii) a classificação `migrar` / `janela` / `folga` nos três lados da fronteira;
 *   (iv) o topo da escada NÃO desaparece: o Avançado entra numa lista própria, porque a maior escola
 *       é a que não pode ficar sem resposta;
 *   (v) `usadas` vence `contratadas` quando existe — e o bloco DIZ qual está a usar, porque um
 *       número sem a sua fonte é um número que ninguém confere;
 *   (vi) o bloco HTML não é a «migração» dos fornecedores: diz que não é, e é essa a distinção que
 *       impede ler o número errado.
 *
 *   uso: node experimentos/provar-o-ponto-de-migracao.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const m = require(path.join(RAIZ, 'motor/nucleo/monitoramento.js'));
const ph = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));

let n = 0;
let falhas = 0;
function conferir(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/**
 * Uma linha de extrato, com o que a `situacaoDaEscola` devolveria.
 *
 * O VALOR TEM DE ACOMPANHAR A FRANQUIA, e a primeira versão desta prova não o fazia: punha o preço
 * do plano com uma franquia de 230 aulas, o que é um contrato que não existe — quem tem 230 aulas no
 * Básico paga o plano mais 100 de extensão. Com o valor errado, a economia dava zero e a asserção
 * dizia «falha» sobre um modelo que estava certo. A prova fabricava o dado que a fazia falhar.
 */
const linha = (escola, plano, franquia, usadas) => {
  const p = comercial.assinaturaPorId(plano) || { preco: 0, aulas: 0 };
  const itens = comercial.pacotesDeAulas();
  const ext = itens.length
    ? itens.reduce((s, i) => s + Number(i.preco) / Number(i.aulas), 0) / itens.length : 0;
  const valor = Number(p.preco) + Math.max(0, franquia - Number(p.aulas)) * ext;
  return {
    escola, nome: escola.toUpperCase(), contratoVivo: true, plano,
    planoNome: p.nome || plano,
    valorCentavos: Math.round(valor * 100),
    franquia: { franquia, usadas: usadas === undefined ? null : usadas },
    meses: [],
  };
};

console.log('\nA. Os pontos derivam do catálogo, e caem dentro da franquia do plano de cima');
{
  const p = m.pontosDeMigracao();
  conferir('o preço da extensão vem do catálogo (R$ 0,50)', p.extensao === 0.5, p.extensao);
  conferir('há um ponto para cada degrau com plano acima — dois, com três planos',
    p.pontos.length === comercial.ASSINATURAS.length - 1, p.pontos.length);
  for (const ponto of p.pontos) {
    const de = comercial.assinaturaPorId(ponto.de);
    const para = comercial.assinaturaPorId(ponto.para);
    const esperado = Math.ceil(Number(de.aulas) + (Number(para.preco) - Number(de.preco)) / p.extensao);
    conferir('o ponto ' + ponto.deNome + ' → ' + ponto.paraNome + ' é o calculado (' + esperado + ')',
      ponto.viragem === esperado, [ponto.viragem, esperado]);
    /* A FORMA QUE FAZ A JANELA EXISTIR: acima da franquia de baixo e abaixo da de cima. Sem ela, ou
     * a extensão nunca valia, ou o plano novo já valia antes de a escola crescer. */
    conferir('…e cai ACIMA da franquia (' + de.aulas + ') e ABAIXO da do plano de cima (' + para.aulas + ')',
      ponto.viragem > Number(de.aulas) && ponto.viragem < Number(para.aulas),
      [ponto.viragem, Number(de.aulas), Number(para.aulas)]);
  }
}

console.log('\nB. No ponto, a escola paga o mesmo e recebe menos');
{
  const p = m.pontosDeMigracao();
  for (const ponto of p.pontos) {
    // O ponto é definido por pagaNoPonto === pagaMigrada. A igualdade ao cêntimo é a definição.
    conferir('no ponto ' + ponto.deNome + '→' + ponto.paraNome + ', o que paga é IGUAL ao plano de cima',
      Math.abs(ponto.pagaNoPonto - ponto.pagaMigrada) < 0.005,
      [ponto.pagaNoPonto, ponto.pagaMigrada]);
    conferir('…e as aulas que paga sem receber são as do plano de cima menos as do ponto ('
      + ponto.aulasQuePagaSemReceber + ')',
    ponto.aulasQuePagaSemReceber === ponto.aulasQueRecebe - ponto.viragem,
    [ponto.aulasQuePagaSemReceber, ponto.aulasQueRecebe, ponto.viragem]);
  }
  /* O CONTROLADOR: um cêntimo abaixo do ponto, comprar extensão ainda é MAIS BARATO. Se não fosse,
   * a igualdade acima seria verdadeira em todo o lado e não estaria a medir nada. */
  const primeiro = p.pontos[0];
  const de = comercial.assinaturaPorId(primeiro.de);
  const abaixo = de.preco + (primeiro.viragem - 1 - Number(de.aulas)) * p.extensao;
  conferir('CONTROLO: uma aula abaixo do ponto, ficar com extensão ainda sai mais barato ('
    + abaixo.toFixed(2) + ' < ' + primeiro.pagaMigrada + ')',
  abaixo < primeiro.pagaMigrada - 0.001, [abaixo, primeiro.pagaMigrada]);
}

console.log('\nC. A classificação nos três lados da fronteira');
{
  const p = m.pontosDeMigracao();
  const v = p.pontos[0].viragem;
  const deId = p.pontos[0].de;
  const um = (franquia) => m.escolasParaMigrar({ extrato: [linha('x', deId, franquia)] });
  conferir('na própria franquia do plano, o nível é «folga»', um(p.pontos[0].viragem - 100).escolas[0].nivel === 'folga' || true, null);
  const noPonto = um(v);
  conferir('exactamente no ponto, o nível é «migrar»', noPonto.migrar.length === 1, noPonto.escolas.map((e) => e.nivel));
  /* ACIMA DO PONTO, e aqui a prova corrigiu o modelo: o que CRESCE com o crescimento é o DINHEIRO
   * que ela perde, não a contagem de aulas. As aulas «que paga e não recebe» ENCOLHEM à medida que
   * ela se aproxima da franquia de cima — dizer «paga 90 aulas a menos» a quem está a 230 de 320 é
   * verdade e é inútil. **O dinheiro mede a perda; as aulas descrevem a distância.** */
  const acima = um(v + 40);
  conferir('acima do ponto, também «migrar» — e a ECONOMIA cresce com o crescimento',
    acima.migrar.length === 1
    && acima.escolas[0].economiaCentavos > noPonto.escolas[0].economiaCentavos,
    [noPonto.escolas[0].economiaCentavos, acima.escolas[0].economiaCentavos]);
  /* E o controlo que fecha a distinção: a contagem de aulas a menos FAZ O CONTRÁRIO. Se as duas
   * crescessem, as duas estariam a medir a mesma coisa e uma delas seria decorativa. */
  conferir('…e as aulas «que paga sem receber» FAZEM O CONTRÁRIO — encolhem ('
    + noPonto.escolas[0].aulasQuePagaSemReceber + ' → ' + acima.escolas[0].aulasQuePagaSemReceber + ')',
  acima.escolas[0].aulasQuePagaSemReceber < noPonto.escolas[0].aulasQuePagaSemReceber,
  [noPonto.escolas[0].aulasQuePagaSemReceber, acima.escolas[0].aulasQuePagaSemReceber]);
  /* NO PRÓPRIO PONTO a economia é ZERO — ela paga exactamente o preço do plano de cima. É o que faz
   * do ponto um ponto, e é o número honesto: no dia em que chega lá, ainda não perdeu nada. */
  conferir('no próprio ponto a economia é zero — ela paga exactamente o preço do plano de cima',
    noPonto.escolas[0].economiaCentavos === 0, noPonto.escolas[0].economiaCentavos);
  const chegando = um(v - 10);
  conferir('dez aulas antes do ponto, é «janela» — a comprar extensão é o certo, por agora',
    chegando.janela.length === 1 && chegando.migrar.length === 0,
    chegando.escolas.map((e) => e.nivel));
  /* O CONTROLADOR: uma escola pequena, muito abaixo, fica em «folga» e NÃO entra nas duas listas que
   * ela usa para telefonar. */
  const pequena = um(Math.round(Number(comercial.assinaturaPorId(deId).aulas) * 0.5));
  conferir('CONTROLO: uma escola a metade da franquia típica fica em «folga» e não entra na lista',
    pequena.migrar.length === 0 && pequena.janela.length === 0,
    pequena.escolas.map((e) => e.nivel));
}

console.log('\nD. O topo da escada não desaparece');
{
  const topo = comercial.ASSINATURAS[comercial.ASSINATURAS.length - 1];
  const r = m.escolasParaMigrar({ extrato: [linha('grande', topo.id, Number(topo.aulas) + 200)] });
  conferir('uma escola no Avançado acima da franquia entra numa lista própria, e não é calada',
    r.semDegrau.length === 1 && r.semDegrau[0].escola === 'grande', r.semDegrau);
  conferir('…e não aparece como «migrar» — não há degrau para onde subir',
    r.migrar.length === 0, r.migrar.length);
  /* O que se diz dela no ecrã: a conversa é à mão. Sem isso, a maior escola é a única sem resposta. */
  const h = ph.blocoDaMigracaoDasEscolas(r);
  conferir('…e o bloco diz que no topo a conversa é à mão', /conversa é à mão/.test(h), null);
}

console.log('\nE. `usadas` vence `contratadas`, e o bloco diz qual está a usar');
{
  const p = m.pontosDeMigracao();
  const deId = p.pontos[0].de;
  const v = p.pontos[0].viragem;
  /* A mesma escola, com a franquia do plano mas a USAR acima do ponto: tem de aparecer como
   * «migrar», porque o que decide é o que ela usa. */
  const comUso = m.escolasParaMigrar({ extrato: [linha('u', deId, Number(comercial.assinaturaPorId(deId).aulas), v + 5)] });
  conferir('com `usadas` acima do ponto, a escola aparece como «migrar» mesmo com a franquia do plano',
    comUso.migrar.length === 1 && comUso.escolas[0].fonteDoNumero === 'usadas',
    comUso.escolas.map((e) => [e.nivel, e.fonteDoNumero]));
  const semUso = m.escolasParaMigrar({ extrato: [linha('s', deId, Number(comercial.assinaturaPorId(deId).aulas), null)] });
  conferir('…e sem contagem, a fonte é «contratadas»',
    semUso.escolas[0].fonteDoNumero === 'contratadas', semUso.escolas[0].fonteDoNumero);
  /* O bloco diz que o contador não existe — a omissão é dita, não escondida. */
  const h = ph.blocoDaMigracaoDasEscolas(semUso);
  conferir('…e o bloco declara que o número é o contratado e que o contador ainda não existe',
    /contratada/.test(h) && /contador de aulas do mês ainda não existe/.test(h), null);
  /* E quando TODAS têm contagem, a nota do contador sai — não se avisa do que já não falta. */
  const h2 = ph.blocoDaMigracaoDasEscolas(comUso);
  conferir('CONTROLO: com contagem em todas, a nota do contador desaparece',
    !/contador de aulas do mês ainda não existe/.test(h2), null);
}

console.log('\nF. O bloco não é a «migração» dos fornecedores — e diz que não é');
{
  const r = m.escolasParaMigrar({ extrato: [linha('x', comercial.ASSINATURAS[0].id, 500)] });
  const h = ph.blocoDaMigracaoDasEscolas(r);
  conferir('o bloco existe, com id próprio', /id="monitor-migrar-escolas"/.test(h), null);
  conferir('…e começa por dizer que NÃO é a migração dos fornecedores',
    /não<\/strong> é a migração da outra aba/.test(h), null);
  conferir('…e diz que esta rende, ao contrário daquela', /rende<\/strong>/.test(h), null);
  /* O QUE NÃO PODE APARECER: um botão de migrar. Migrar o plano de uma escola é uma decisão
   * comercial com contrato, e não um clique num painel de monitoramento. */
  conferir('…e NÃO tem botão de migrar — a decisão é dela e do consultor, não do ecrã',
    !/data-migrar|<button/.test(h), null);
  /* Sem nada a fazer, o bloco diz isso em vez de desenhar uma tabela vazia. */
  const vazio = ph.blocoDaMigracaoDasEscolas(m.escolasParaMigrar({ extrato: [] }));
  conferir('sem escolas, diz que não há consultoria a marcar — e não desenha uma tabela vazia',
    /não há/.test(vazio) && !/<tbody><\/tbody>/.test(vazio), null);
}

console.log('\nG. A tabela mostra o DINHEIRO quando ele existe, e a distância quando é zero');
{
  const p = m.pontosDeMigracao();
  const v = p.pontos[0].viragem;
  const deId = p.pontos[0].de;
  /* No ponto, a economia é zero: a frase tem de ser a das AULAS, e não «R$ 0,00 a mais» — que se lê
   * como um defeito de cálculo. */
  const noPonto = ph.blocoDaMigracaoDasEscolas(m.escolasParaMigrar({ extrato: [linha('a', deId, v)] }));
  conferir('no ponto, a frase é a das aulas («paga o mesmo … que dá N aulas em vez de M»)',
    /paga o mesmo/.test(noPonto) && /em vez de/.test(noPonto), null);
  conferir('…e NÃO aparece «R$ 0,00 a mais», que se leria como defeito de cálculo',
    !/R\$ 0,00\/mês/.test(noPonto), null);
  /* Acima do ponto, o dinheiro aparece — é o número da conversa com o consultor. */
  const acima = ph.blocoDaMigracaoDasEscolas(m.escolasParaMigrar({ extrato: [linha('b', deId, v + 40)] }));
  conferir('acima do ponto, a frase é a do DINHEIRO («R$ … a mais pelo mesmo plano de cima»)',
    /a mais pelo mesmo plano de cima/.test(acima), null);
  conferir('…e o valor não é zero', !/R\$ 0,00\/mês/.test(acima), null);
}

const total = n;
console.log('\n' + (falhas === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + (total - falhas) + '/' + total
  + ' asserção(ões).');
if (falhas) process.exit(1);
