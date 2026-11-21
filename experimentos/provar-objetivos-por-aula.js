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
 *   2. o DETALHE NÃO SE PERDEU: o link aponta para `aula-NN.html#exercicios-da-aula-NN`, que é
 *      onde o exercício, os tempos e o compasso se leem — e a página existe;
 *   3. o link só existe quando a página existe; uma aula ainda sem documento sai «a criar», e
 *      um objetivo sem marco sai `—` (nada é adivinhado);
 *   4. a ficha de identificação duplicada saiu do «Objetivo geral», e o dado que a máquina
 *      lia dela (a duração) continua no `## Contexto`, que é onde ele nasce.
 *
 * E O MODELO NOVO (26/10/2026, segunda metade do mesmo dia):
 *
 *   6. o objetivo é uma LISTA do ciclo (`## Objetivos específicos`), e a aula cita os números
 *      dela (`## Marcos parciais por aula`, coluna «Objetivos») — não é a posição da aula;
 *   7. a ESTRUTURA DA AULA vem do quadro do volume, e não dos objetivos: a contradição que a
 *      pesquisadora viu («a aula 1 só tem Solo e Barra», ao lado de «Solo 30 · Barra 30 ·
 *      Centro 30 · Musicalidade 10») não pode voltar;
 *   8. o modelo suporta o que a versão anterior não suportava — dois objetivos numa aula e um
 *      objetivo em duas aulas.
 *
 * COMO É MEDIDA. O gerador de verdade (`tools/tabela-objetivos.js`) e o pacote de verdade
 * (`professores/demi-plie/ciclos/ciclo-01-breu-rosa/`). Sem rede. Era o pacote da `batata`, e
 * mudou a 20/11/2026 com o expurgo daquela escola: a mudança é de FIXTURE, e as asserções
 * passaram a medir os factos da `breu` (três objetivos, quatro blocos, o compasso da aula do dia)
 * em vez dos números de outra escola.
 *
 * O CONTROLE NEGATIVO NÃO SE FAZ NESTE FIXTURE: o plano da `breu` nasceu depois da mudança, e
 * não há em `git` um estado dele anterior ao apanhado. `--controle-negativo` diz isso e sai com 2
 * — «não feito» é uma resposta; um controle que passa por vacuidade não é.
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
const { derivarPlano } = require(path.join(raiz, 'motor/nucleo/derivar-plano-ciclo.js'));
/* O MAPA SERVIDO, montado pela porta de verdade — não pelo conteúdo em bruto: é a porta que já
 * engoliu uma chave em silêncio (o `recortePeloPlano`), e é ela que a tela lê. */
const portaMapa = (conteudo) => require(path.join(raiz, 'motor/nucleo/porta.js')).mapa(conteudo);

const PROF = 'demi-plie';
const VARIANTE = 'breu-rosa';
const PACOTE = path.join(raiz, 'professores', PROF, 'ciclos', 'ciclo-01-' + VARIANTE);
const PLANO_MD = path.join(raiz, 'professores', PROF, 'ciclos', 'ciclo-01-' + VARIANTE + '-plano.md');

/* O FIXTURE FOI EXPURGADO, E ISSO NÃO SE DISFARÇA (27/10/2026).
 *
 * O PACOTE E O PLANO QUE ESTA PROVA MEDE são os da escola `batata`, e a `batata` foi expurgada do
 * repositório (`b6519ef`, «expurgar a escola batata») — as fontes do ciclo saíram com ela. A prova
 * morria com um `ENOENT` no `plano-01.json`, que se lê como «a prova está avariada» quando o que
 * aconteceu foi o objeto de medição deixar de existir.
 *
 * O QUE SE FAZ: diz-se, e não se inventa. Substituir por um fixture de fabrico seria medir a
 * fábrica; saltar em silêncio seria pior, porque o rodapé do commit continuaria a citar «51
 * asserções». Quem quiser esta prova de volta gera o pacote de novo (`tools/gerar-ciclo.sh`) e
 * aponta `PROF`/`VARIANTE` — é uma linha, e está registado no REGISTRO.
 */
if (!fs.existsSync(PLANO_MD) || !fs.existsSync(path.join(PACOTE, 'plano-01.json'))) {
  console.error('provar-objetivos-por-aula: NÃO FEITO — o fixture (' + VARIANTE + ') foi expurgado'
    + '\n  do repositório. A prova não mede: o objeto que ela media já não existe.');
  process.exit(1);
}

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
    /* O REF NÃO SE FIXA EM `HEAD` (26/10/2026). A primeira redação dizia `HEAD`, e funcionava
       enquanto a mudança estava por commitar: depois do commit, `HEAD` é o estado NOVO, e o
       controle passou a descrever o presente em vez do passado — três asserções «FALHA» a
       dizer que a fonte de HEAD não tinha o que já tivesse. O ref passa a ser DERIVADO: o
       commit que introduziu «Objetivos específicos» neste ficheiro, menos um. É o último
       estado em que o defeito existia, e continua certo em qualquer clone. */
    const caminhoNoGit = 'professores/' + PROF + '/ciclos/ciclo-01-' + VARIANTE + '-plano.md';
    const em = (r) => {
      try { return execSync('git show ' + r + ':' + caminhoNoGit, { cwd: raiz, encoding: 'utf8' }); }
      catch (e) { return null; }
    };
    /* A MARCA É O APANHADO, e não a lista dos objetivos (26/10/2026). As três primeiras
       asserções deste controle descrevem o estado ANTES do apanhado (a tabela detalhada com 14
       linhas); a lista dos objetivos veio depois, noutro commit. Ancorar no marcador do apanhado
       põe o `ref` no último estado em que as CINCO asserções eram verdade — e é estável, porque
       o marcador nasceu uma vez só. */
    const MARCA = '<!-- OBJETIVOS -->';
    let ref = process.env.REF_NEGATIVO || '';
    if (!ref) {
      // 1. a mudança ainda está por commitar: HEAD é o estado de antes.
      if (em('HEAD') !== null && em('HEAD').indexOf(MARCA) === -1) {
        ref = 'HEAD';
      } else {
        // 2. já está no histórico: o commit que a introduziu, menos um.
        let sha = '';
        try {
          sha = execSync('git log -1 --format=%H -S"' + MARCA + '" -- ' + caminhoNoGit,
            { cwd: raiz, encoding: 'utf8' }).trim();
        } catch (e) { sha = ''; }
        ref = sha ? sha + '~1' : 'HEAD';
      }
    }
    console.log('CONTROLE NEGATIVO — a fonte de ' + ref + ' (antes do apanhado)\n');
    let antiga = '';
    try {
      antiga = execSync('git show ' + ref + ':' + caminhoNoGit, { cwd: raiz, encoding: 'utf8' });
    } catch (e) {
      /* O CONTROLE PRECISA DE UM «ANTES», E ESTE FIXTURE NÃO O TEM (20/11/2026). O plano da `breu`
       * nasceu DEPOIS da mudança que esta prova mede (26/10/2026): não existe, em `ref` nenhum,
       * um estado dele anterior ao apanhado. O controle descrevia a `batata`, que foi expurgada
       * com a escola. Diz-se — e não se finge um controle que passaria por vacuidade. */
      console.error('provar-objetivos-por-aula: CONTROLE NEGATIVO NÃO FEITO — ' + caminhoNoGit
        + '\n  não existe em ' + ref + ': o fixture (`' + VARIANTE + '`) nasceu depois da mudança'
        + ' que a\n  prova mede, e o fixture anterior (a `batata`) foi expurgado com a escola.'
        + '\n  A prova sem `--controle-negativo` mede o presente, e passa.');
      process.exit(2);
    }
    const secaoAntiga = (/## Sequência de exercícios por bloco[\s\S]*?(?=\n## )/.exec(antiga) || [''])[0];
    const linhasAntigas = linhasDeDados(secaoAntiga.split('\n'));
    provar('a fonte de HEAD tinha a tabela detalhada publicada no plano',
      linhasAntigas.length === 14, linhasAntigas.length);
    provar('…e o bloco «Solo» aparecia 4 vezes, uma por exercício (a duplicação medida)',
      (secaoAntiga.match(/\*\*Solo\*\*/g) || []).length === 4,
      (secaoAntiga.match(/\*\*Solo\*\*/g) || []).length);
    provar('…e o apanhado não existia (nem a seção, nem o marcador)',
      antiga.indexOf('Objetivos por bloco e por aula') === -1 && antiga.indexOf('<!-- OBJETIVOS -->') === -1);
    /* A CONTRADIÇÃO QUE O MODELO NOVO DESFAZ (26/10/2026). A fonte de HEAD tinha a secção
       «Estrutura de cada aula» — a relação objetivo × bloco com o título que a fazia passar por
       estrutura da aula — E o quadro do volume com os quatro blocos. As duas afirmações sobre a
       mesma aula, na mesma página. */
    provar('…e a fonte de HEAD tinha «Estrutura de cada aula» ao lado do volume (a contradição)',
      antiga.indexOf('## Estrutura de cada aula') !== -1
      && /## Distribuição do volume pelos blocos/.test(antiga));
    provar('…e ainda não tinha a lista dos objetivos',
      antiga.indexOf('## Objetivos específicos') === -1);
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
    htmlAula.indexOf('id="exercicios-da-aula-01"') !== -1);
  provar('…e o apanhado liga a ela, na linha do objetivo 1',
    linhas.some((l) => /\]\(aula-01\.html#exercicios-da-aula-01\)/.test(l)), linhas);
  /* O DETALHE É A TABELA DA MÚSICA, e os valores são os da aula do dia — não os de outra escola.
   * A asserção lia `8, 4/4` e `16, 3/4`, que eram o compasso da `batata`; o que ela tem de medir
   * é que a aula publica compasso E tempos, com números dentro. */
  const compassos = (htmlAula.match(/<td[^>]*>\s*\d+\s*\/\s*\d+\s*<\/td>/g) || []);
  provar('a aula 01 tem o detalhe que saiu do plano (tempos e compasso)',
    compassos.length > 0 && /<th[^>]*>Tempos<\/th>/.test(htmlAula), { compassos: compassos.length });

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

  // ---------------------------------------------------------------- 6) a lista e a ligação
  console.log('\n6. o objetivo é uma LISTA do ciclo, e a aula cita o número dele');
  provar('o plano publica «Objetivos específicos» como lista',
    htmlPlano.indexOf('id="objetivos-especificos"') !== -1);
  provar('…com as três colunas: N, objetivo e os blocos onde é trabalhado',
    /id="objetivos-especificos"[\s\S]{0,1200}<th[^>]*>N<\/th>[\s\S]{0,300}<th[^>]*>Objetivo específico<\/th>/
      .test(htmlPlano));
  provar('o extraído tem o número, o texto e os blocos de cada objetivo',
    Array.isArray(plano.objetivosEspecificos) && plano.objetivosEspecificos.length === 3
    && plano.objetivosEspecificos.every((o) => o.n && o.objetivo && o.blocos),
    plano.objetivosEspecificos);
  provar('…e o objetivo 01 declara dois blocos, e o 03 três',
    plano.objetivosEspecificos[0].blocos.split('·').length === 2
    && plano.objetivosEspecificos[2].blocos.split('·').length === 3,
    plano.objetivosEspecificos.map((o) => o.blocos));
  provar('a tabela dos marcos ganhou a coluna dos objetivos, e o marco em texto ficou',
    /id="marcos-parciais-por-aula"[\s\S]{0,900}<th[^>]*>Objetivos<\/th>[\s\S]{0,300}<th[^>]*>Marco<\/th>/
      .test(htmlPlano));
  provar('…e cada marco carrega o número do objetivo E o texto (o lançamento lê o texto)',
    plano.marcosPorAula.every((m) => m.n && m.objetivos && m.marco), plano.marcosPorAula);

  // ---------------------------------------------------------------- 7) a estrutura vem do volume
  console.log('\n7. a ESTRUTURA DA AULA vem do volume — e não dos objetivos');
  provar('«Estrutura de cada aula» deixou de ser uma secção do plano',
    htmlPlano.indexOf('id="estrutura-de-cada-aula"') === -1);
  provar('o quadro do volume passou a dizer que É a estrutura',
    htmlPlano.indexOf('id="blocos-da-aula-e-distribuicao-do-volume"') !== -1);
  provar('…e a nota diz que o ciclo declara o padrão e a aula pode ter outra',
    /padrão\s+do ciclo/i.test(htmlPlano) && /declara a sua\s+no próprio documento/.test(htmlPlano));
  /* A CONTRADIÇÃO, MEDIDA. O objetivo 01 é trabalhado em Solo e Barra; a estrutura tem quatro
     blocos. As duas coisas são verdadeiras e não se contradizem — desde que o título não diga
     que a segunda é a primeira. */
  provar('o objetivo 01 é trabalhado em 2 blocos, e a estrutura declara 4 (não se contradizem)',
    plano.objetivosEspecificos[0].blocos.split('·').length === 2
    && plano.distribuicaoDeVolume.length === 4, plano.distribuicaoDeVolume.length);
  /* E A AULA: os blocos dela vêm do volume. A derivação lê o envelope, e o envelope tem os dois;
     o que se prova é o RESULTADO na página — a aula 01 declara os quatro blocos. */
  const blocosDaAula = (htmlAula.match(/<(?:strong|td)[^>]*>(Solo|Barra|Centro|Musicalidade)</g) || []);
  provar('a aula 01 declara os quatro blocos da estrutura (e não só os do objetivo 01)',
    ['Solo', 'Barra', 'Centro', 'Musicalidade'].every((b) => blocosDaAula.join('').indexOf(b) !== -1),
    blocosDaAula.length);

  // ---------------------------------------------------------------- 8) o modelo que faltava
  console.log('\n8. o modelo suporta 2 objetivos numa aula e 1 objetivo em duas aulas');
  const multi = Object.assign({}, plano, {
    marcosPorAula: [
      { n: '01', objetivos: '01, 03', marco: 'a' },
      { n: '02', objetivos: '01', marco: 'b' },
    ],
  });
  const comMulti = linhasDeDados(tabela(multi, ['aula-01', 'aula-02']));
  const doObjetivo01 = comMulti.filter((l) => l.indexOf('| **') === 0 && /\*\*01\*\*/.test(l));
  provar('a aula 01 cita dois objetivos, e o objetivo 01 aparece nas aulas 01 e 02',
    doObjetivo01.length === 2
    && doObjetivo01.every((l) => /Aula 01/.test(l) && /Aula 02/.test(l)), doObjetivo01);
  provar('…e o objetivo 02, sem aula nenhuma, sai «—» (nada é adivinhado)',
    comMulti.some((l) => /\*\*02\*\*/.test(l) && /\| — \|$/.test(l)),
    comMulti.filter((l) => /\*\*02\*\*/.test(l)));

  // ---------------------------------------------------------------- 9) a régua, uma só
  console.log('\n9. a régua aparece UMA vez, e o horizonte deixou de prometer «critério»');
  provar('a régua da rubrica está na página', htmlPlano.indexOf('id="regua-da-rubrica"') !== -1);
  provar('…e a tabela de critérios que a repetia saiu',
    htmlPlano.indexOf('id="rubrica-de-avaliacao-final"') === -1);
  /* O QUE O LANÇAMENTO LÊ. Se este campo desaparecesse, o formulário caía na régua PADRÃO em
     silêncio — `Satisfatório · Razoável · Em desenvolvimento · Não se aplica` no lugar da régua
     da turma. É a asserção que guarda isso. */
  provar('…e `reguaDaRubrica` continua no extraído (é o que o lançamento lê)',
    Array.isArray(plano.reguaDaRubrica) && plano.reguaDaRubrica.length > 0, plano.reguaDaRubrica);
  /* OS NÍVEIS SÃO OS QUE O PROFESSOR DECLAROU — incluindo o erro de escrita dele. A `breu`
   * declara «Em desenvovimento» (sem o «l»), e é assim que tem de sair: o sistema não corrige as
   * palavras de quem declara. E é este detalhe que faz a asserção discriminar: a régua PADRÃO do
   * motor (`derivar-plano-ciclo.js`, `NIVEIS_DA_RUBRICA`) diz «Em desenvolvimento», com o «l» —
   * se o extraído caísse nela em silêncio, esta linha reprovava. */
  provar('…com os níveis que a turma declarou, e não os padrão do motor',
    plano.reguaDaRubrica.join(' · ') === 'Satisfatório · Razoável · Em desenvovimento · Não se aplica',
    plano.reguaDaRubrica);
  provar('o «Critério de extensão» passou a «Horizonte do ciclo»',
    htmlPlano.indexOf('id="horizonte-do-ciclo"') !== -1
    && htmlPlano.indexOf('id="criterio-de-extensao"') === -1);
  provar('…e a nota diz que é horizonte, não régua de nota',
    /O horizonte, e não um critério de nota/.test(htmlPlano.replace(/\s+/g, ' ')));
  provar('…e separa o horizonte declarado do «+4 aulas» que o calendário calcula',
    /é conta do gerador/.test(htmlPlano.replace(/\s+/g, ' ')));

  // ------------------------------------------- 10) o formulário deixa entrar a relação
  console.log('\n10. etapa 2: o professor declara em que aula cada objetivo é perseguido');
  /* O DEFEITO QUE ESTA SECÇÃO TRAVA é o do `descritores()`: chaves que existem no conteúdo e
     não na lista fechada do motor chegam ao navegador SEM a marca, o nó cai no texto livre e o
     professor volta a escrever à mão — sem aviso nenhum. Por isso se mede o mapa SERVIDO. */
  const mapaDoPlano = portaMapa(JSON.parse(ler(raiz, 'porta', 'plano', 'conteudo', 'plano.json')));
  const noDosObjetivos = (mapaDoPlano.nos || []).find((n) => n.id === 'marcos-por-aula');
  const noDasAulas = (mapaDoPlano.nos || []).find((n) => n.id === 'aula-de-cada-objetivo');
  provar('o mapa servido traz a lista dos objetivos como lista numerada',
    !!(noDosObjetivos && noDosObjetivos.lista), noDosObjetivos && Object.keys(noDosObjetivos));
  provar('…e traz o campo novo «em que aula cada objetivo», apontado à lista',
    !!(noDasAulas && noDasAulas.aulasDoObjetivo
      && noDasAulas.aulasDoObjetivo.de === 'marcos-por-aula'),
    noDasAulas && noDasAulas.aulasDoObjetivo);
  provar('…e o bloco antigo já não se chama «Estrutura de cada aula»',
    !(mapaDoPlano.nos || []).some((n) => n.blocoTitulo === 'Estrutura de cada aula'));

  /* A DERIVAÇÃO. Dois objetivos na aula 01 e um objetivo que atravessa 01 e 02 — os dois casos
     que a forma do documento aceitava desde a etapa 1 e que não tinham por onde entrar. */
  const envelopeComMapa = (mapa) => ({
    contexto: {},
    respostas: {
      'marcos-por-aula': { valor: ['Eixo vertical na barra', 'Port de bras no centro',
        'Improvisar com a música'] },
      'aula-de-cada-objetivo': { valor: mapa },
      'estrutura-de-cada-aula': { valor: [
        { marco: 1, marcados: ['Barra'] }, { marco: 2, marcados: ['Centro'] },
        { marco: 3, marcados: ['Musicalidade'] }] },
    },
  });
  const derivado = derivarPlano(envelopeComMapa([
    { objetivo: 1, aulas: ['01'] },
    { objetivo: 2, aulas: ['01', '02'] },
    { objetivo: 3, aulas: ['03'] },
  ])).markdown;
  const marcosDerivados = linhasDeDados(
    (/## Marcos parciais por aula[\s\S]*?(?=\n## )/.exec(derivado) || [''])[0].split('\n'));
  provar('a aula 01 declara os DOIS objetivos que persegue',
    /^\| \*\*01\*\* \| 01, 02 \|/.test(marcosDerivados[0] || ''), marcosDerivados[0]);
  provar('…e a aula 02 volta a citar o objetivo 02 (ele atravessa duas aulas)',
    /^\| \*\*02\*\* \| 02 \|/.test(marcosDerivados[1] || ''), marcosDerivados[1]);
  provar('…e a aula 01 não ganha a linha da 02: são três aulas, não seis',
    marcosDerivados.length === 3, marcosDerivados.length);

  /* O PADRÃO NÃO MUDOU. Um envelope antigo, sem o campo novo, continua a sair 1:1 — é o que
     garante que a etapa 2 não reescreve o passado dos planos já entregues. */
  const semMapa = derivarPlano({ contexto: {}, respostas: {
    'marcos-por-aula': { valor: ['um', 'dois', 'três'] },
  } }).markdown;
  const marcosSemMapa = linhasDeDados(
    (/## Marcos parciais por aula[\s\S]*?(?=\n## )/.exec(semMapa) || [''])[0].split('\n'));
  provar('sem a resposta nova, o padrão 1:1 continua (objetivo N na aula N)',
    marcosSemMapa.length === 3 && /^\| \*\*02\*\* \| 02 \| dois \|$/.test(marcosSemMapa[1] || ''),
    marcosSemMapa);

  console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ') + total + ' asserção(ões), '
    + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})();
