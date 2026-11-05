'use strict';

/*
 * provar-cartao-da-aula.js — o cartão da listagem de aulas diz três dados do professor, três
 * frentes do guia, e não diz o ciclo.
 *
 * O QUE ELE MEDE, e por que cada coisa (04/11/2026):
 *
 *   1. A TURMA não mostra «Ciclo». A pesquisadora: «o ciclo não é um atributo estrutural da
 *      turma». O cartão continua a dizer o que é operacional: a turma, «Aula N de M», o dia, as
 *      horas, a duração e a sala (que segue «não declarada» — ela só existe no modelo com o
 *      PLANO-TABELA-DE-ATIVIDADES).
 *   2. O PROFESSOR mostra NOME, MODALIDADE e TRADIÇÃO — e não o slug. As duas primeiras vêm do
 *      perfil da PESSOA (`professores/<slug>/perfil.json`); a terceira, do plano, que é quem
 *      declara a metodologia de referência.
 *   3. O GUIA mostra as TRÊS FRENTES, e não um par por dimensão — a leitura que ela recusou («o
 *      guia não pode chamar tudo de técnica»).
 *
 * E o que ele NÃO pode voltar a ter: a frase de arquitetura («a aula não tem professor próprio»),
 * que saiu por ser bastidor a quem só quer saber quem dá a aula.
 *
 * COMO ELE MEDE. Roda o `tools/montar-publicacao.js` de verdade na escola viva e lê o HTML que
 * ele escreveu. `publicacao/` é uma SAÍDA declarada no `.gitignore` (reconstruída de zero a cada
 * execução), e é por isso que a prova a pode reescrever — o que ela não faz é tocar em fonte
 * nenhuma.
 *
 *   node experimentos/provar-cartao-da-aula.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const ESCOLA = 'breu';

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  ✓ ' + rotulo);
  } else {
    falhas += 1;
    console.log('  ✗ ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
  }
}

/** O texto de um painel, sem marcação — é o que o professor lê. */
const textoDe = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * O VALOR da caixa como ela aparece FECHADA — o `<span class="trio-v">` do botão.
 *
 * É o que se lê sem clicar (a conta: «23 critérios · 3 eixos»). O painel é o detalhe, e são duas
 * asserções diferentes de propósito: uma caixa pode ter bom detalhe e um valor mudo.
 */
function valorDaCaixa(html, chave) {
  const i = html.indexOf('data-balao="' + chave + '"');
  if (i === -1) return null;
  const j = html.indexOf('<span class="trio-v">', i);
  if (j === -1) return null;
  const fim = html.indexOf('</span>', j);
  return textoDe(html.slice(j, fim));
}

/**
 * O painel de um cartão, pelo `data-painel` da peça — a chave que a folha usa.
 *
 * É a chave, e não o rótulo: o rótulo é texto e muda com a redação; a chave é o contrato entre o
 * cartão e o painel (`aria-controls` da caixa aponta para ela). Procurar por texto faria a prova
 * passar a medir a minha própria redação.
 */
function painelDoCartao(html, chave) {
  const i = html.indexOf('data-painel="' + chave + '"');
  if (i === -1) return null;
  const fim = html.indexOf('</p></div>', i);
  return textoDe(html.slice(i, fim === -1 ? i + 2000 : fim));
}

function main() {
  // ------------------------------------------------------------------ o cartão
  console.log('\n1. A montagem da escola viva');
  execFileSync(process.execPath, [path.join(RAIZ, 'tools/montar-publicacao.js'), ESCOLA],
    { cwd: RAIZ, stdio: 'pipe' });
  const pagina = path.join(RAIZ, 'publicacao', ESCOLA, 'aulas', 'index.html');
  checar('a listagem de aulas foi montada', fs.existsSync(pagina), pagina);
  const html = fs.readFileSync(pagina, 'utf8');

  // ---------------------------------------------------------------- 2. a turma
  console.log('\n2. A turma: o ciclo saiu, e o operacional ficou');
  const turma = painelDoCartao(html, 'turma');
  checar('há um painel de Turma', Boolean(turma), turma);
  checar('o painel NÃO diz «Ciclo»', Boolean(turma) && !/Ciclo/.test(turma), turma);
  checar('diz a turma', Boolean(turma) && /Turma Balé Nível 1 — Teste 3/.test(turma), turma);
  checar('diz em que aula se está («Aula 1 de 35»)', Boolean(turma) && /Aula 1 de 35/.test(turma), turma);
  checar('diz o dia', Boolean(turma) && /Dia \d\d\/\d\d\/\d{4}/.test(turma), turma);
  checar('diz a hora de início e a de fim',
    Boolean(turma) && /Começa às \d\d:\d\d/.test(turma) && /Termina às \d\d:\d\d/.test(turma), turma);
  checar('diz a duração', Boolean(turma) && /Duração \d+ min/.test(turma), turma);
  checar('e mantém a sala dita «não declarada» (não inventa um sítio)',
    Boolean(turma) && /Sala não declarada/.test(turma), turma);

  // ------------------------------------------------------------ 3. o professor
  console.log('\n3. O professor: três dados, e nenhum é o slug');
  const professor = painelDoCartao(html, 'professor');
  checar('há um painel de Professor', Boolean(professor), professor);
  checar('dá o NOME do professor', Boolean(professor) && /Coqui de Redinha/.test(professor), professor);
  checar('dá a MODALIDADE, com o rótulo do catálogo («Balé clássico»)',
    Boolean(professor) && /Modalidade Balé clássico/.test(professor), professor);
  checar('dá a TRADIÇÃO DE REFERÊNCIA, do plano («RAD»)',
    Boolean(professor) && /Tradição de referência RAD/.test(professor), professor);
  checar('e NÃO mostra o identificador no lugar do nome',
    Boolean(professor) && !/^Professor coqui-de-redinha/.test(professor), professor);
  checar('a nota de arquitetura não voltou',
    html.indexOf('não tem professor próprio') === -1);

  // ----------------------------------------------------------------- 4. o guia
  console.log('\n4. O guia: as três frentes, e não uma por dimensão');
  const guia = painelDoCartao(html, 'guia-de-observacao');
  checar('há um painel de Guia de observação', Boolean(guia), guia);
  const valorDoGuia = valorDaCaixa(html, 'guia-de-observacao');
  checar('a caixa FECHADA conta critérios e eixos («23 critérios · 3 eixos»)',
    Boolean(valorDoGuia) && /\d+ critérios · 3 eixos/.test(valorDoGuia), valorDoGuia);
  checar('o painel tem o Corpo como frente própria', /Corpo \d+/.test(guia), guia);
  checar('…a Técnica, com os blocos dela', /Técnica \d+ · Barra, Centro/.test(guia), guia);
  checar('…e a Poiesis, com os blocos dela', /Poiesis \d+ · Musicalidade, Expressão/.test(guia), guia);
  checar('o Corpo não repete o próprio nome («Corpo 15 · Corpo» seria um erro)',
    !/Corpo \d+ · Corpo/.test(guia), guia);
  /* O CORPO CONTA QUINZE — e a fonte mudou com a regra de 04/11/2026: o detalhe do corpo vive na
   * AULA 01, e o plano publica o ponteiro. O cartão lia a tabela do `plano-01.json`, que deixou de
   * existir; lê agora `plano-aula-01.json` (`guiaDeObservacao.Corpo`), e o plano serve de recurso
   * para os pacotes gerados antes da mudança. Sem esta troca, o «Corpo 15» virava «sem dimensões»
   * — em silêncio, que é o modo de falhar desta família. */
  checar('o corpo conta os 15 aspectos da aula (a fonte única)',
    /Corpo 15/.test(guia) && !/sem dimensões/.test(valorDoGuia), { guia: guia, valor: valorDoGuia });

  // ------------------------------------------------- 5. o que já estava, e fica
  console.log('\n5. O que já estava certo, e continua');
  checar('o nome da aula é o link para ela', /<a href="\/bale-nivel-1-teste-3\/aula-01\.html"/.test(html));
  checar('a linha aponta o guia completo na aula (§5)', html.indexOf('Guia de observação do professor') !== -1);
  const acoes = (html.match(/Lançar|Captura para impressão|PDF da aula/g) || []);
  checar('os três botões continuam (Lançar · Captura · PDF)', acoes.length >= 3, acoes.length);

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + n + ' asserções: a turma sem o ciclo e com o operacional, o professor '
    + 'com nome, modalidade e tradição (nenhum é o slug), e o guia em três frentes — Corpo com os '
    + 'aspectos da aula, Técnica e Poiesis com os blocos do PO.');
}

main();
