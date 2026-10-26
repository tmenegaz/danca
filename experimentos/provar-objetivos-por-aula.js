#!/usr/bin/env node
'use strict';

/**
 * provar-objetivos-por-aula.js — o plano publica o APANHADO, e o detalhe fica na aula.
 *
 * O DEFEITO (26/10/2026, lido na tela pela pesquisadora). O plano trazia a tabela inteira da
 * sequência — bloco · objetivo · conteúdo do nível · tempos · compasso — e ela duplicava, linha
 * a linha, o que a `aula-01.md` já tem: as duas nascem da MESMA resposta da elicitação
 * (`aula-1-sequencia`). Medido na `batata`: «Solo» 4×, «Barra» 4×, «Centro» 4×, e o mesmo
 * objetivo repetido quando havia mais de um exercício para ele. «Eu não preciso desse
 * detalhamento aqui. Eu preciso apenas de um apanhado geral… faz com que eu duplique.»
 *
 * O QUE SE PROVA — e o lado que importa é o segundo:
 *
 *   1. a seção do plano é o CRUZAMENTO (bloco × objetivo → aula), com uma linha por par, e não
 *      uma linha por exercício: 14 exercícios viram 7 pares na `batata`;
 *   2. o DETALHE NÃO SE PERDEU: o link aponta para `aula-NN.html#sequencia-declarada`, que é
 *      onde o exercício, os tempos e o compasso se leem — e a página existe;
 *   3. o link só existe quando a página existe; uma aula ainda sem documento sai «a criar», e
 *      um objetivo sem marco sai `—` (nada é adivinhado);
 *   4. a ficha de identificação duplicada saiu do «Objetivo geral», e o dado que a máquina
 *      lia dela (a duração) continua no `## Contexto`, que é onde ele nasce.
 *
 * COMO É MEDIDA. O gerador de verdade (`tools/tabela-objetivos.js`) e o pacote de verdade
 * (`professores/cafe-no-bule/ciclos/ciclo-01-batata-bale-nivel-2-teste-2/`). Sem rede.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): o mesmo plano, na fonte de `HEAD` — a tabela
 * detalhada, contada como a página a publicava. Se o controle passasse, a prova não estaria a
 * provar nada.
 *
 *   node experimentos/provar-objetivos-por-aula.js [--controle-negativo]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');
const { tabela, nota } = require(path.join(raiz, 'tools/tabela-objetivos.js'));

const PROF = 'cafe-no-bule';
const VARIANTE = 'batata-bale-nivel-2-teste-2';
const PACOTE = path.join(raiz, 'professores', PROF, 'ciclos', 'ciclo-01-' + VARIANTE);
const PLANO_MD = path.join(raiz, 'professores', PROF, 'ciclos', 'ciclo-01-' + VARIANTE + '-plano.md');

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const ler = (...p) => fs.readFileSync(path.join(...p), 'utf8');
/** As linhas de DADOS de uma tabela Markdown (sem cabeçalho e sem separador). */
const linhasDeDados = (linhas) => linhas.filter((l) => /^\|/.test(l)).slice(2);

(async () => {
  const negativo = process.argv.includes('--controle-negativo');

  if (negativo) {
    console.log('CONTROLE NEGATIVO — a fonte de HEAD (antes do apanhado)\n');
    const antiga = execSync('git show HEAD:professores/' + PROF + '/ciclos/ciclo-01-' + VARIANTE
      + '-plano.md', { cwd: raiz, encoding: 'utf8' });
    const secaoAntiga = (/## Sequência de exercícios por bloco[\s\S]*?(?=\n## )/.exec(antiga) || [''])[0];
    const linhasAntigas = linhasDeDados(secaoAntiga.split('\n'));
    provar('a fonte de HEAD tinha a tabela detalhada publicada no plano',
      linhasAntigas.length === 14, linhasAntigas.length);
    provar('…e o bloco «Solo» aparecia 4 vezes, uma por exercício (a duplicação medida)',
      (secaoAntiga.match(/\*\*Solo\*\*/g) || []).length === 4,
      (secaoAntiga.match(/\*\*Solo\*\*/g) || []).length);
    provar('…e o apanhado não existia (nem a seção, nem o marcador)',
      antiga.indexOf('Objetivos por bloco e por aula') === -1 && antiga.indexOf('<!-- OBJETIVOS -->') === -1);
    console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ') + total + ' asserção(ões), '
      + falhas + ' falha(s). (o controle negativo descreve o código de antes; as falhas aqui '
      + 'invalidariam a prova)');
    process.exit(falhas ? 1 : 0);
  }

  // ---------------------------------------------------------------- 1) o apanhado
  console.log('\n1. uma linha por PAR bloco × objetivo, e não por exercício');
  const plano = JSON.parse(ler(PACOTE, 'plano-01.json'));
  const linhas = tabela(plano, ['aula-01']);
  const dados = linhasDeDados(linhas);
  provar('14 exercícios viram 7 pares (Solo 4× → 1×, Barra 4× → 1×, Centro 4× → 1×)',
    dados.length === 7, dados.length);
  const contar = (bloco) => dados.filter((l) => l.indexOf('| **' + bloco + '**') === 0).length;
  provar('«Solo» aparece 1× por objetivo (dois objetivos → duas linhas)', contar('Solo') === 2, contar('Solo'));
  provar('«Barra» idem', contar('Barra') === 2, contar('Barra'));
  provar('«Centro» idem', contar('Centro') === 2, contar('Centro'));
  provar('«Musicalidade» idem', contar('Musicalidade') === 1, contar('Musicalidade'));
  provar('a ordem dos blocos é a do documento (Solo, Barra, Centro, Musicalidade)',
    /Solo[\s\S]*Barra[\s\S]*Centro[\s\S]*Musicalidade/.test(dados.join('\n')));
  provar('as três colunas são as pedidas: Bloco, Objetivo específico, Aula',
    linhas[0] === '| Bloco | Objetivo específico | Aula |', linhas[0]);
  provar('não sobra nenhuma coluna de detalhe (conteúdo do nível, tempos, compasso)',
    !/Tempos|Compasso|Conteúdo do nível/.test(linhas.join('\n')));

  // ---------------------------------------------------------------- 2) o link
  console.log('\n2. o detalhe não se perdeu: o link leva à sequência dentro da aula');
  const htmlAula = ler(PACOTE, 'aula-01.html');
  provar('a aula 01 publica o âncora da sequência detalhada',
    htmlAula.indexOf('id="sequencia-declarada"') !== -1);
  provar('…e o apanhado liga a ela, na linha do objetivo 1',
    linhas.some((l) => /\]\(aula-01\.html#sequencia-declarada\)/.test(l)), linhas);
  provar('a aula 01 tem o detalhe que saiu do plano (tempos e compasso)',
    /8, 4\/4/.test(htmlAula) && /16, 3\/4/.test(htmlAula));

  // ---------------------------------------------------------------- 3) nada é adivinhado
  console.log('\n3. sem página e sem marco, a célula DIZ o que falta');
  const semDocumento = tabela(plano, []);
  provar('sem documento de aula, nenhum link é inventado',
    !/\]\(aula-/.test(semDocumento.join('\n')), semDocumento.filter((l) => /Aula 0/.test(l)));
  provar('…e a célula diz «a criar»', /Aula 01 \*\(a criar\)\*/.test(semDocumento.join('\n')));
  const semMarco = tabela({ marcosPorAula: [], estruturaDeCadaAula: plano.estruturaDeCadaAula }, ['aula-01']);
  provar('objetivo sem marco de aula sai «—», e não uma aula suposta',
    semMarco.filter((l) => /^\|/.test(l)).slice(2).every((l) => /\| — \|$/.test(l)), semMarco);
  provar('plano sem estrutura nenhuma declara a lacuna, em vez de uma tabela vazia',
    tabela({ marcosPorAula: [] }, []).join('\n').indexOf('[a decidir') !== -1);

  // ---------------------------------------------------------------- 4) a página
  console.log('\n4. a página do plano: entra o apanhado, sai a duplicação');
  const htmlPlano = ler(PACOTE, 'plano.html');
  provar('a seção existe, com o nome decidido',
    htmlPlano.indexOf('id="objetivos-por-bloco-e-por-aula"') !== -1);
  provar('a tabela detalhada saiu do plano',
    htmlPlano.indexOf('id="sequencia-de-exercicios-por-bloco"') === -1);
  provar('…e não sobrou nenhum «Tempos» nem «Compasso» na página do plano',
    !/<th[^>]*>Tempos</.test(htmlPlano) && !/<th[^>]*>Compasso</.test(htmlPlano));
  provar('o marcador foi substituído (não viaja comentário para a página)',
    htmlPlano.indexOf('<!-- OBJETIVOS -->') === -1);
  /* A FICHA DUPLICADA SAIU (26/10/2026). Ela repetia, debaixo do objetivo geral, a duração, as
     datas e o volume que o «Contexto» declara seis linhas acima e que o «Calendário do Ciclo»
     calcula. O que se exige é que o «Objetivo geral» não tenha tabela nenhuma. */
  const objetivo = (/<h2 id="objetivo-geral">[\s\S]*?(?=<h2 )/.exec(htmlPlano) || [''])[0];
  provar('sob o «Objetivo geral» não há tabela — só a prosa',
    objetivo.indexOf('<table') === -1, objetivo.length);
  provar('…e a duração continua na página, no Contexto (é de lá que a máquina a lê)',
    plano.contexto && plano.contexto.duracaoPorAula
    && htmlPlano.indexOf('Duração por aula') !== -1);

  // ---------------------------------------------------------------- 5) a fonte
  console.log('\n5. a fonte do plano: o marcador, e não um retrato do dia da elicitação');
  const fonte = ler(PLANO_MD);
  provar('a fonte tem o marcador — é o gerador que preenche',
    (fonte.match(/<!-- OBJETIVOS -->/g) || []).length === 1);
  provar('a fonte não tem a tabela detalhada (o detalhe é da aula)',
    fonte.indexOf('## Sequência de exercícios por bloco') === -1);
  provar('a nota que acompanha a tabela diz de quem é o detalhe',
    nota.join('\n').indexOf('vive na **aula**') !== -1);

  console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ') + total + ' asserção(ões), '
    + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})();
