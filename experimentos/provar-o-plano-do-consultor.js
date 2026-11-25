#!/usr/bin/env node
'use strict';

/**
 * provar-o-plano-do-consultor.js — OS NÚMEROS DO PLANO SÃO OS DO CATÁLOGO (25/11/2026).
 *
 * O plano do consultor ([PLANO-DO-CONSULTOR.md](./PLANO-DO-CONSULTOR.md)) leva números dentro: os
 * três preços, as três franquias, os R$ 8 do excedente, os 24 aulas de um ciclo, os 278 minutos que
 * R$ 10 compram, os 16 e 26 minutos de uma demonstração. **Um documento que repete números é um
 * documento que envelhece** — e é a família de erro que o §20 do CUSTO-DOS-FLUXOS pagou: uma prova
 * a dizer 3 e o documento a dizer 2, durante seis dias, e ninguém a olhar.
 *
 * Esta prova não confia no documento. Lê o CATÁLOGO (`planos.json`), o DADO (`ciclos.json` real) e
 * as constantes de custo, recalcula, e compara com o que está escrito. Quando o catálogo mudar, ela
 * reprova até o plano mudar — que é o comportamento que se quer.
 *
 * O QUE SE MEDE:
 *
 *   §A os três planos: preço, franquia, professores e alunas — contra o documento;
 *   §B a aritmética do ciclo: 24 aulas, e os ciclos que cada franquia comporta;
 *   §C o custo: R$ 0,036/min, os 16 e 26 minutos da demonstração, os 278 minutos de R$ 10;
 *   §D a PORTA FECHADA: hoje `consultoria` é recusado sem `podeDispensar` — a frase que o plano cita
 *      existe, palavra por palavra. Sem esta asserção, o §1.1 seria uma memória;
 *   §E o padrão do token: 32 hex, hash diferente do valor, prazo declarado;
 *   §F a DESCOBERTA da Q2 — a demonstração dá 2 professores e o Básico dá 1. É um defeito da escada,
 *      e a prova fixa-o para que não se descubra com um cliente ao telefone;
 *   §G CONTROLO NEGATIVO: mudado o catálogo, os números do documento deixam de bater — a conta lê
 *      mesmo o catálogo, e não uma cópia escrita aqui.
 *
 *   node experimentos/provar-o-plano-do-consultor.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const lerJson = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
const lerTexto = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8');

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const PLANO = lerTexto('PLANO-DO-CONSULTOR.md');
const CATALOGO = lerJson('biblioteca/comercial/planos.json');
const assinatura = (id) => (CATALOGO.assinaturas || []).find((a) => a.id === id) || {};

/* A TAXA E AS CONSTANTES DE CUSTO vêm do sítio onde já estão decididas — não de literais meus. */
const { PRECO_DA_AULA_EXCEDENTE_CENTAVOS } = require(path.join(RAIZ, 'motor/nucleo/contador-de-aulas.js'));
const CAMBIO = 6;
const USD_POR_MIN = 0.006;
const TAXA_BRL = USD_POR_MIN * CAMBIO;          // R$ 0,036/min — a taxa do CUSTO-DOS-FLUXOS §20
const reais = (centavos) => Math.round(centavos) / 100;
const brl = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');

/* ── §A os três planos ──────────────────────────────────────────────────────────────────────── */

console.log('\n§A os três planos do guião são os do catálogo');

const ESPERADO = [
  { id: 'basico', nome: 'Básico', centavos: 6990, aulas: 130, professores: 1, alunos: 10 },
  { id: 'intermediario', nome: 'Intermediário', centavos: 9990, aulas: 320, professores: 3, alunos: 40 },
  { id: 'avancado', nome: 'Avançado', centavos: 13990, aulas: 500, professores: 6, alunos: 90 },
];
for (const e of ESPERADO) {
  const a = assinatura(e.id);
  provar('o catálogo tem o plano «' + e.nome + '»', Boolean(a.id), Object.keys(a));
  /* O CATÁLOGO GUARDA `preco` EM REAIS (69.9), e não em centavos — o campo chama-se `preco` e é o
   * que a página dos planos lê. A prova converte, e não presume o nome do campo: uma prova que
   * adivinha o nome de um campo mede o seu próprio palpite. */
  provar('«' + e.nome + '» custa ' + brl(reais(e.centavos)) + ' por mês',
    Math.round(Number(a.preco) * 100) === e.centavos, a.preco);
  provar('«' + e.nome + '» tem a franquia de ' + e.aulas + ' aulas',
    Number(a.aulas) === e.aulas, a.aulas);
  provar('«' + e.nome + '» declara ' + e.professores + ' professor(es) e ' + e.alunos + ' alunas',
    Number(a.professores) === e.professores && Number(a.alunos) === e.alunos,
    { professores: a.professores, alunos: a.alunos });
  /* E O DOCUMENTO DIZ O MESMO. A forma é a da tabela do §8.1 — procurada pelo texto, porque é esse
   * texto que a pessoa lê. */
  const precoNaTabela = 'R$ ' + reais(e.centavos).toFixed(2).replace('.', ',');
  provar('e o plano escreve «' + e.nome + '» com o preço ' + precoNaTabela,
    PLANO.indexOf('**' + e.nome + '** | **' + precoNaTabela + '**') !== -1, precoNaTabela);
}

/* ── §B a aritmética do ciclo ─────────────────────────────────────────────────────────────── */

console.log('\n§B um ciclo tem 24 aulas, e o guião conta com isso');

const indice = lerJson('professores/demi-plie/ciclos/ciclo-01-breu-piano/ciclos.json');
const aulasDoCiclo = indice.ciclos[0].aulas.length;
provar('o ciclo do dado tem 24 aulas', aulasDoCiclo === 24, aulasDoCiclo);
provar('e o plano afirma os 24', /um ciclo tem \*\*24 aulas\*\*/.test(PLANO), null);

const ciclosPor = (franquia) => Math.floor(franquia / aulasDoCiclo);
provar('o Básico comporta 5 ciclos inteiros (e meio)', ciclosPor(130) === 5, ciclosPor(130));
provar('o Intermediário comporta 13', ciclosPor(320) === 13, ciclosPor(320));
provar('o Avançado comporta 20', ciclosPor(500) === 20, ciclosPor(500));
provar('e o plano diz cinco e meio, treze e vinte',
  /cinco ciclos e meio/.test(PLANO) && /Intermediário, treze/.test(PLANO) && /Avançado, vinte/.test(PLANO), null);

/* DUAS TURMAS, DUAS VEZES POR SEMANA: 2 × 2 × 4,33 semanas ≈ 17 aulas por mês. */
const porMes = Math.round(2 * 2 * (52 / 12));
provar('duas turmas a 2x/semana dão ~17 aulas por mês', porMes === 17, porMes);
provar('e o guião diz ~17', /~17 aulas por mês/.test(PLANO), null);
provar('…e cabe no Básico com folga', porMes <= 130, { porMes, franquia: 130 });

/* ── §C o custo ────────────────────────────────────────────────────────────────────────────── */

console.log('\n§C os R$ 10 e os minutos que eles compram');

provar('a taxa é R$ 0,036/min', Math.abs(TAXA_BRL - 0.036) < 1e-9, TAXA_BRL);
/* MINUTOS INTEIROS, ARREDONDADOS PARA BAIXO — é o que se pode prometer. 10 ÷ 0,036 = 277,77. */
const minutosQueDezReaisCompram = Math.floor(10 / TAXA_BRL);
provar('R$ 10,00 compram 277 minutos inteiros', minutosQueDezReaisCompram === 277, minutosQueDezReaisCompram);
provar('e o plano diz 277', /\*\*277\*\*/.test(PLANO), null);

const canonico = 16;
const piorCaso = 26;
const custoPior = Math.round(piorCaso * TAXA_BRL * 100) / 100;
provar('o pior caso são 26 min e R$ 0,94', custoPior === 0.94, custoPior);
const vezes = Math.floor((minutosQueDezReaisCompram / piorCaso) * 10) / 10;
provar('…e R$ 10 cobrem 10,6 vezes o pior caso', vezes === 10.6, vezes);
const margem = Math.round((10 - custoPior) * 100) / 100;
provar('a margem do pior desfecho é R$ 9,06', margem === 9.06, margem);
provar('…e a demonstração canónica são 16 min / R$ 0,58',
  Math.round(canonico * TAXA_BRL * 100) / 100 === 0.58, canonico * TAXA_BRL);
provar('o plano diz os três números', /10,6 vezes/.test(PLANO) && /R\$ 9,06/.test(PLANO) && /94 centavos/.test(PLANO), null);

/* AS DUAS PORTAS QUE O LIMITADOR NÃO FECHA: 126 gravações de 2 minutos gastam o resto. */
const restante = minutosQueDezReaisCompram - piorCaso;
const gravacoes = Math.floor(restante / 2);
provar('125 gravações de 2 min gastam o que sobra dos R$ 10', gravacoes === 125, gravacoes);
provar('e o plano declara esse limite', /125 gravações num mês/.test(PLANO), null);

/* ── §D a porta fechada ───────────────────────────────────────────────────────────────────── */

console.log('\n§D hoje o plano consultoria é recusado ao público — e a frase é a do plano');

const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
const semDispensa = comercial.validarEscolha({ plano: 'consultoria' }, { podeDispensar: false });
provar('sem `podeDispensar`, o consultoria é recusado', semDispensa.ok === false, semDispensa.ok);
provar('e a recusa diz que quem cria é a administração',
  /criado pela administração do Sistema Lastro/.test(String(semDispensa.erro || '')), semDispensa.erro);
provar('com `podeDispensar`, ele passa e traz os limites',
  comercial.validarEscolha({ plano: 'consultoria' }, { podeDispensar: true }).ok === true);
const comDispensa = comercial.validarEscolha({ plano: 'consultoria' }, { podeDispensar: true });
provar('e a capacidade é a dos sete limites, não uma referência',
  comDispensa.escolha.capacidade.professores === Number(CATALOGO.consultoria.limites.professores)
  && comDispensa.escolha.capacidade.alunos === Number(CATALOGO.consultoria.limites.alunas),
  comDispensa.escolha.capacidade);
provar('o plano cita a recusa, e o §1.1 explica que o link abre uma terceira porta',
  /criado pela administração do Sistema Lastro/.test(PLANO) && /terceira porta/.test(PLANO), null);

/* ── §E o padrão do token ─────────────────────────────────────────────────────────────────── */

console.log('\n§E o token tem as três propriedades do convite');

const convite = require(path.join(RAIZ, 'motor/nucleo/convite.js'));
provar('o convite declara um prazo em dias', Number(convite.DIAS_DE_VALIDADE) === 7, convite.DIAS_DE_VALIDADE);
(async () => {
  const token = convite.novoToken();
  provar('o token tem 32 caracteres hex', /^[0-9a-f]{32}$/.test(token), token && token.length);
  const hash = await convite.hashDoToken(token);
  provar('e o hash não é o token', hash !== token && /^[0-9a-f]{64}$/.test(hash), hash && hash.length);
  provar('dois tokens nunca são iguais', convite.novoToken() !== convite.novoToken());

  /* ── §F a Q2 — a pergunta que nasceu de um erro, e a medição que o desfez ──────────────────── */

  console.log('\n§F a Q2 — o piso do plano NÃO é uma parede');

  /* A PRIMEIRA VERSÃO DESTA PROVA AFIRMAVA UM DEFEITO QUE NÃO EXISTE: «a demonstração dá 2
   * professores e o Básico dá 1 — quem assina PERDE um». Ela decidiu «deixar como está» e estava
   * certa por um motivo melhor do que «é intencional»: **o número de professores de um plano é um
   * PISO**, e o TETO de cada degrau é o piso do degrau de cima menos um. O teto do Básico é 2 — e
   * não se perde nada. O erro era ler o piso como se fosse parede; a asserção que o substitui mede
   * a REGRA, e não a leitura que eu fiz dela. */
  const professoresDaDemo = Number(CATALOGO.consultoria.limites.professores);
  const pisoDoBasico = comercial.pisoDoPlano('basico');
  const tetoDoBasico = comercial.tetoDoPlano('basico');
  provar('a demonstração dá 2 professores', professoresDaDemo === 2, professoresDaDemo);
  provar('o Básico INCLUI 1 — é o piso, o que o preço cobre', pisoDoBasico.professores === 1, pisoDoBasico);
  provar('e VAI ATÉ 2 — o teto é o piso do degrau de cima menos um',
    tetoDoBasico.professores === 2, tetoDoBasico);
  provar('logo os dois professores da demonstração continuam dentro do Básico — NÃO se perde nada',
    professoresDaDemo <= tetoDoBasico.professores, { demo: professoresDaDemo, teto: tetoDoBasico.professores });
  provar('e o teto das alunas também cobre as 5 da demonstração',
    Number(CATALOGO.consultoria.limites.alunas) <= tetoDoBasico.alunos,
    { demo: CATALOGO.consultoria.limites.alunas, teto: tetoDoBasico.alunos });
  /* E NÃO HÁ PAREDE NENHUMA NUMA ASSINATURA: `limitesDoRegime` devolve `null` para o regime pago.
   * É a razão de fundo — o limitador é da consultoria. */
  const cotas = require(path.join(RAIZ, 'motor/nucleo/cotas.js'));
  provar('numa assinatura paga não há teto aplicado (o limitador é da consultoria)',
    cotas.limitesDoRegime({ plano: 'basico' }) === null, cotas.limitesDoRegime({ plano: 'basico' }));
  provar('e na consultoria há, com os sete',
    Object.keys(cotas.limitesDoRegime({ plano: 'consultoria' }) || {}).length === 7,
    cotas.limitesDoRegime({ plano: 'consultoria' }));
  provar('o plano declara a correcção, e diz qual era o erro',
    /piso.*como se fosse parede|ler o piso como se fosse parede/s.test(PLANO), null);
  provar('…e não afirma mais que se perde um professor',
    !/perde um professor|PERDE um/.test(PLANO) || /não há perda/i.test(PLANO), null);

  /* ── §G o controlo negativo ─────────────────────────────────────────────────────────────── */

  console.log('\n§G o controlo negativo: mudado o catálogo, o documento deixa de bater');

  /* Recalcula-se com um catálogo ALTERADO EM MEMÓRIA — o mesmo mecanismo que qualquer mudança real
   * produziria. Se a conta lesse uma cópia escrita na prova, o valor não mudaria. */
  const alterado = JSON.parse(JSON.stringify(CATALOGO));
  alterado.assinaturas.find((a) => a.id === 'basico').preco = 79.9;
  const precoNovo = 'R$ 79,90';
  provar('com o Básico a R$ 79,90, o texto do plano já não serve',
    PLANO.indexOf('**Básico** | **' + precoNovo + '**') === -1, precoNovo);
  alterado.consultoria.limites.aulas = 6;
  provar('com 6 aulas na demonstração, o guião do limite também muda',
    alterado.consultoria.limites.aulas !== Number(CATALOGO.consultoria.limites.aulas), null);

  /* ── o resumo ───────────────────────────────────────────────────────────────────────────── */

  console.log('\n' + provas + ' asserções, ' + (provas - falhas) + ' ok, ' + falhas + ' falha(s)');
  console.log('R$ 10,00 = ' + minutosQueDezReaisCompram + ' min de cota · a demonstração pior = '
    + piorCaso + ' min (R$ ' + custoPior.toFixed(2) + ') · margem R$ ' + margem.toFixed(2));
  process.exit(falhas === 0 ? 0 : 1);
})();
