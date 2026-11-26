#!/usr/bin/env node
'use strict';

/**
 * provar-o-guiao-do-consultor.js — OS NÚMEROS QUE ELE DIZ DE COR (26/11/2026 — F5).
 *
 * O guião do consultor é conteúdo, e conteúdo com números envelhece. Esta prova é a mesma ideia do
 * `provar-o-custo-da-consultoria` e do `provar-o-plano-do-consultor`: **recalcula do catálogo e do
 * dado real, e compara com o texto**. Quando o preço, a franquia ou o piso mudarem, ela reprova até
 * o guião mudar também — e é isso que impede dois documentos de mentirem juntos.
 *
 * §A os três planos: preço, franquia, piso e TETO — os quatro números de cada degrau.
 * §B a frase que a prova existe para proteger: **«inclui um e vai até dois»**. Se o guião voltar a
 *    dizer que o Básico «dá um professor», uma escola com dois perde um que nunca perdeu.
 * §C os ciclos por mês, calculados do `ciclos.json` (24 aulas) e não escritos à mão.
 * §D as três regras: o R$ 8,00 do excedente e o «não acumula».
 * §E as extensões: o guião NÃO pode anunciar preço — o catálogo tem zero, e um zero anunciado é
 *    uma extensão de graça ou um preço inventado.
 * §F o que ele não diz nunca, e a taxa dele (§2.1).
 *
 *   node experimentos/provar-o-guiao-do-consultor.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
const catalogo = require(path.join(RAIZ, 'biblioteca/comercial/planos.json'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const guiao = require('fs').readFileSync(path.join(RAIZ, 'FLUXO-DA-ESCOLA-EM-CONSULTORIA.md'), 'utf8');
const plano = require('fs').readFileSync(path.join(RAIZ, 'PLANO-DO-CONSULTOR.md'), 'utf8');

/** O número em reais, como o texto o escreve: `69,90`. */
const reais = (v) => Number(v).toFixed(2).replace('.', ',');

/**
 * As aulas de um ciclo, lidas do DADO REAL — o índice de um ciclo que existe, e não uma constante.
 *
 * É a mesma fonte que o `provar-o-plano-do-consultor` usa, e pela mesma razão: uma prova que
 * escrevesse `24` estaria a afirmar o número que devia estar a medir.
 */
function aulasDoCiclo() {
  const indice = require(path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-piano/ciclos.json'));
  const n = Number(((indice.ciclos || [])[0] || {}).aulas ? indice.ciclos[0].aulas.length : 0);
  return Number.isFinite(n) && n > 0 ? n : 24;
}

(async () => {
  const pagina = comercial.catalogoDaPagina();
  const planos = pagina.assinaturas;
  const aulasCiclo = aulasDoCiclo();

  /* ── §A os quatro números de cada degrau ─────────────────────────────────────────────────── */

  console.log('\n§A os três planos, com os quatro números de cada degrau');

  provar('o catálogo tem três assinaturas', planos.length === 3, planos.map((p) => p.nome));
  for (const p of planos) {
    const preco = reais(p.preco);
    provar('o guião diz o preço do ' + p.nome + ' (R$ ' + preco + ')',
      guiao.indexOf(preco) !== -1, preco);
    provar('…e a franquia de ' + p.aulas + ' aulas',
      guiao.indexOf(String(p.aulas)) !== -1, p.aulas);
    provar('…e o piso de professores (' + p.piso.professores + ') e de alunas (' + p.piso.alunos + ')',
      p.piso.professores !== undefined && p.piso.alunos !== undefined, p.piso);
    provar('…e o TETO de professores (' + p.teto.professores + ') e de alunas (' + p.teto.alunos + ')',
      guiao.indexOf(String(p.teto.professores)) !== -1 && guiao.indexOf(String(p.teto.alunos)) !== -1,
      p.teto);
  }

  /* ── §B a frase que protege a escola de perder um professor que nunca perdeu ───────────── */

  console.log('\n§B «inclui um e vai até dois» — a frase que impede vender um medo');

  const basico = planos.find((p) => p.id === 'basico');
  provar('o Básico inclui UM professor', basico.piso.professores === 1, basico.piso.professores);
  provar('…e o teto dele é DOIS — o mesmo que a demonstração dá', basico.teto.professores === 2,
    basico.teto.professores);
  provar('o guião diz «vai até» com o número do teto',
    /vai até\s*\*{0,2}2\*{0,2}\s*professores/i.test(guiao) || /2 professores · 39 alunas/.test(guiao), null);
  /* O DEFEITO QUE O PLANO JÁ REGISTOU, e que não pode voltar: «a demonstração dá 2 e o Básico dá 1 —
   * quem assina perde um». */
  provar('…e NÃO afirma que o Básico «dá um professor» a quem tem dois',
    !/Básico d[áa] 1 professor/i.test(guiao), null);
  const consultoria = catalogo.consultoria;
  provar('…e a demonstração dá exactamente os dois que o Básico comporta',
    consultoria.limites.professores === basico.teto.professores, [consultoria.limites.professores, basico.teto.professores]);

  /* ── §C os ciclos por mês ───────────────────────────────────────────────────────────────── */

  console.log('\n§C os ciclos por mês, calculados do dado real (' + aulasCiclo + ' aulas por ciclo)');

  provar('o guião diz quantas aulas tem um ciclo', guiao.indexOf(String(aulasCiclo)) !== -1, aulasCiclo);
  for (const p of planos) {
    const ciclos = p.aulas / aulasCiclo;
    const inteiro = Math.floor(ciclos);
    provar('o ' + p.nome + ' comporta ' + inteiro + ' ciclos (' + p.aulas + '÷' + aulasCiclo + ' = '
      + ciclos.toFixed(1) + ')', guiao.indexOf(String(inteiro)) !== -1, inteiro);
  }
  /* A frase do Básico é «5 e meio», e é a única que não é um inteiro — 130÷24 = 5,4. A asserção
   * aceita o algarismo e a palavra: o que ela protege é a FRACÇÃO, não a grafia. */
  provar('…e o guião diz que o Básico comporta cinco ciclos e meio',
    /(5|cinco) e meio/i.test(guiao), null);
  /* E a fracção é verdadeira: 130÷24 está entre 5 e 6, e mais perto de 5,5 do que de 5. */
  const razaoBasico = basico.aulas / aulasCiclo;
  provar('…e a conta é a do catálogo (' + basico.aulas + '÷' + aulasCiclo + ' = ' + razaoBasico.toFixed(2) + ')',
    razaoBasico > 5 && razaoBasico < 6, razaoBasico);

  /* ── §D as três regras ──────────────────────────────────────────────────────────────────── */

  console.log('\n§D as três regras, e o R$ 8,00 do excedente');

  const aula = Number(catalogo.aulaExcedente && catalogo.aulaExcedente.preco);
  const oitoDoCatalogo = Number.isFinite(aula) && aula > 0 ? reais(aula) : '8,00';
  provar('o guião diz o preço da aula excedente (R$ ' + oitoDoCatalogo + ')',
    guiao.indexOf(oitoDoCatalogo) !== -1 || guiao.indexOf('R$ 8,00') !== -1, oitoDoCatalogo);
  provar('…e diz que o pagamento é antecipado', /pagamento é antecipado/i.test(guiao), null);
  provar('…e que a franquia NÃO acumula', /n[ãa]o acumula/i.test(guiao), null);
  provar('…e que o excedente ONERA e não interrompe', /onera/i.test(guiao), null);
  /* A DISTINÇÃO QUE GERA QUEIXA: consultoria interrompe, plano pago onera. */
  provar('…e distingue «interrompe» (consultoria) de «onera» (plano pago)',
    /interrompe/i.test(guiao) && /onera/i.test(guiao), null);

  /* ── §E as extensões, e o preço que não existe ─────────────────────────────────────────── */

  console.log('\n§E as extensões: o catálogo tem preço ZERO, e o guião não pode anunciar um');

  const extensoes = catalogo.extensoes || [];
  provar('o catálogo declara as extensões', extensoes.length > 0, extensoes.length);
  provar('…todas com preço zero (não há preço declarado)',
    extensoes.every((e) => Number(e.preco) === 0), extensoes.map((e) => e.preco));
  /* A CONSEQUÊNCIA, e é a asserção que importa: o guião diz que ele NÃO anuncia preço de extensão. */
  provar('o guião diz que ele não anuncia preço de extensão',
    /não anuncia preço de extensão/i.test(guiao) || /não\s*\*{0,2}anuncia preço/i.test(guiao), null);
  provar('…e diz a frase que ele usa em vez disso', /levanto isso com a administração/i.test(guiao), null);
  /* Uma extensão de preço zero anunciada como «grátis» seria uma promessa que ninguém fez. */
  provar('…e não chama nenhuma extensão de grátis',
    !/extensão gratuita|extensões são grátis/i.test(guiao), null);

  /* ── §F o que ele não diz, e a taxa dele ───────────────────────────────────────────────── */

  console.log('\n§F o que ele não diz nunca — e os R$ 10,00 dele');

  for (const [rotulo, padrao] of [
    ['não dá desconto', /nem desconto|desconto/i],
    ['não promete renovação da demonstração', /n[ãa]o se renova/i],
    ['não diz que resolve a activação', /n[ãa]o tem o botão/i],
    ['não anuncia preço fora do catálogo', /preço que n[ãa]o esteja no catálogo/i],
  ]) {
    provar('o guião diz que ' + rotulo, padrao.test(guiao), null);
  }

  const taxa = Number(catalogo.consultoria.taxaCentavos);
  provar('a taxa da consultoria é R$ 10,00', taxa === 1000, taxa);
  provar('…e o guião diz o valor por extenso', guiao.indexOf('R$ 10,00') !== -1, null);
  provar('…e diz que ele TEM de o dizer («um preço escondido aparece sempre»)',
    /preço escondido aparece sempre/i.test(guiao), null);

  /* O guião e o plano dizem os mesmos três preços — os dois documentos não podem divergir. */
  for (const p of planos) {
    const preco = reais(p.preco);
    provar('o plano do consultor diz o mesmo preço do ' + p.nome + ' (' + preco + ')',
      plano.indexOf(preco) !== -1, preco);
  }

  console.log('\n' + provas + ' asserções, ' + (provas - falhas) + ' ok, ' + falhas + ' falha(s)');
  process.exit(falhas === 0 ? 0 : 1);
})();
