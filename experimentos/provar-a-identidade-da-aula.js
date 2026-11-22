#!/usr/bin/env node
'use strict';

/**
 * provar-a-identidade-da-aula.js — o §1 diz quem dá a aula, onde e em que dia; o §5 manda ao formulário.
 *
 * O QUE ELA PEDIU (22/11/2026), na Aula 01 da `breu`:
 *
 *   «falta dizer quem é o professor responsável pela aula, aonde essa aula acontece, aonde eu me
 *    refiro à sala, qual é o espaço que acontece essa aula e o dia da semana que isso acontece. Essa
 *    aula específica […] tem que dizer a data e o dia, se é uma segunda, uma terça, uma quarta,
 *    enfim. […] Você não vai transformar isso aqui num calendário, viu? Você vai dizer o dia
 *    específico, a data e o dia da semana específico.»
 *
 *   «nesse guia de observação do professor, a gente tem que explicar para ele que ele tem que
 *    preencher o formulário da aula que ele vai dar. E o que que representa aqui neste documento
 *    cada um dos espaços dos blocos que expande ou colapsa […] um botão com essa explicação
 *    melhorada e um botão em seguida que leva direto ao formulário.»
 *
 * O QUE SE MEDE, e por que cada asserção existe:
 *
 *   A. O §1 tem as três linhas — professor, sala, data e dia —, e os valores são os do dado: o nome
 *      do PERFIL (e não o slug da pasta), a turma do plano (a «sala» do produto), e a data da aula
 *      N no calendário.
 *   B. A DATA ESTÁ CERTA, e a prova não pergunta ao mesmo código que a escreveu: o dia da semana é
 *      recalculado pelo `Intl.DateTimeFormat` do Node, e a data é comparada com o `ciclos.json`
 *      publicado — que o `calendario.py` gerou, em Python. Duas implementações, o mesmo dia.
 *   C. NÃO É UM CALENDÁRIO: uma data, uma linha. Se o §1 passasse a listar as quinze aulas, esta
 *      asserção reprovava — é o que ela disse com todas as letras.
 *   D. A LACUNA MUDOU DE SÍTIO, e não desapareceu: sem calendário no contexto, o §1 diz que falta
 *      e nomeia os campos; com calendário, diz o dia. Um documento que não sabe não inventa.
 *   E. O §5 diz para que serve o guia, e tem os DOIS botões: o que abre a explicação e o que leva ao
 *      formulário. O do formulário é RELATIVO e o ficheiro existe ao lado do documento no pacote —
 *      um botão que aponta para um 404 é pior do que nenhum.
 *   F. As PEÇAS SÃO AS DA FOLHA: `.acoes-do-ato`, `.acao`, `.bloco-lista`, `.bloco-cabeca`,
 *      `.bloco-titulo`, `.bloco-corpo` — nenhuma classe inventada no documento.
 *   G. O `plano-aula-NN.json` deixou de declarar a data como lacuna: ela passou a vir do documento.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` extrai o `motor/` e o `tools/` desse commit. Lá o §1 não tem
 * nenhuma das três linhas e o §5 não tem botão nenhum — o defeito, medido.
 *
 *   node experimentos/provar-a-identidade-da-aula.js
 *   node experimentos/provar-a-identidade-da-aula.js --contra=e504f372
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const CICLOS = path.join(RAIZ, 'professores/demi-plie/ciclos');
const CONF = path.join(CICLOS, 'ciclo-01-breu-rosa.conf');
const PACOTE = path.join(CICLOS, 'ciclo-01-breu-rosa');
const ENVELOPES = path.join(RAIZ, 'escola/breu/envelopes');
const PLANO = path.join(ENVELOPES, 'plano-20261122-0849.json');
const PO = path.join(ENVELOPES, 'po-20261122-0849.json');

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 300)));
}

const json = (caminho) => JSON.parse(fs.readFileSync(caminho, 'utf8'));

/** A §1 de um documento derivado. */
function secao1(md) {
  const i = md.indexOf('## 1.');
  const j = md.indexOf('## 2.');
  return i === -1 || j === -1 ? '' : md.slice(i, j);
}
/** O valor de uma linha item/valor do §1, pelo rótulo. */
function linhaDoItem(md, rotulo) {
  const re = new RegExp('\\|\\s*\\*\\*' + rotulo + '\\*\\*\\s*\\|\\s*([^|]*)\\|');
  const m = re.exec(secao1(md));
  return m ? m[1].trim() : null;
}
/** A §5 de um documento derivado. */
function secao5(md) {
  const i = md.indexOf('## 5.');
  const j = md.indexOf('## 6.');
  return i === -1 ? '' : (j === -1 ? md.slice(i) : md.slice(i, j));
}
/** O dia da semana por uma SEGUNDA implementação (a do Node), a partir de `dd/mm/aaaa`. */
function diaPeloNode(dataBr) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(dataBr || '').trim());
  if (!m) return '';
  const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return new Intl.DateTimeFormat('pt-PT', { weekday: 'long', timeZone: 'UTC' }).format(d);
}

(async () => {
  const contra = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
  let base = RAIZ;
  if (contra) {
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'identidade-aula-'));
    /* O PACOTE VAI JUNTO (e não só o `.conf`): a §G mede o `plano-aula-01.json` que o validador
     * escreveu, e no controle negativo tem de ser o do commit — senão as asserções dessa secção
     * mediriam o worktree e passariam sobre o código de antes, que é a pior forma de passar. */
    execSync('git archive ' + contra
      + ' motor modelo porta biblioteca tools escola professores/demi-plie/ciclos/ciclo-01-breu-rosa.conf'
      + ' professores/demi-plie/ciclos/ciclo-01-breu-rosa professores/demi-plie/perfil.json'
      + ' | tar -x -C ' + destino, { cwd: RAIZ, stdio: 'pipe' });
    base = destino;
  }
  const pacoteEm = (dir) => path.join(dir, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa');
  const nucleo = require(path.join(base, 'motor/nucleo/derivar-ciclo.js'));
  const escritor = require(path.join(base, 'motor/servidor/escrever-ciclo.js'));
  const { calibracaoDoConf } = escritor;
  /* NO CONTROLE NEGATIVO a função do calendário ainda não existe — é isso que se está a medir. O
   * que NÃO se faz é inventar uma: o manifesto é lido aqui, do mesmo sítio, e a prova usa o que o
   * commit tiver. Sem ela, o contexto vai sem calendário e o §1 sai sem data — o defeito. */
  const calendarioDoConf = typeof escritor.calendarioDoConf === 'function'
    ? escritor.calendarioDoConf
    : (texto) => {
      const pegar = (chave) => {
        const m = new RegExp('^' + chave + '="([^"]*)"', 'm').exec(texto || '');
        return m ? m[1].trim() : '';
      };
      return { inicio: pegar('DATA_INICIO'), dias: pegar('DIAS'), total: pegar('TOTAL_AULAS') };
    };

  const plano = json(PLANO);
  const po = json(PO);
  const confTexto = fs.readFileSync(CONF, 'utf8');
  const cal = calibracaoDoConf(confTexto);
  const calendario = calendarioDoConf(confTexto);
  const perfil = json(path.join(RAIZ, 'professores/demi-plie/perfil.json'));
  const contexto = {
    professor: 'demi-plie', professorNome: perfil.nome, ciclo: '01', escola: 'breu',
    escolaNome: 'Breu', calendario,
  };
  const derivar = (nn, ctx) => nucleo.derivarAula({
    nn, plano, po, contexto: Object.assign({}, contexto, ctx || {}), calibracao: cal,
  });

  /* ───────────────────────────────── A. As três linhas, e o dado de cada uma */
  console.log('\nA. O §1 diz quem, onde e em que dia');
  const aula1 = derivar('01');
  provar('o professor responsável é o NOME do perfil, e não o slug',
    linhaDoItem(aula1, 'Professor responsável') === perfil.nome,
    [linhaDoItem(aula1, 'Professor responsável'), perfil.nome]);
  provar('a sala é a turma do plano («Rosa»)',
    linhaDoItem(aula1, 'Sala') === 'Rosa', linhaDoItem(aula1, 'Sala'));
  provar('a data e o dia estão na mesma linha', /^\S.*,\s*\d{2}\/\d{2}\/\d{4}$/.test(linhaDoItem(aula1, 'Data e dia') || ''),
    linhaDoItem(aula1, 'Data e dia'));

  /* ───────────────────────────────── B. A data está certa — medida por fora */
  console.log('\nB. A data é a da aula, e o dia da semana confere');
  const PACOTE_BASE = pacoteEm(base);
  const publicadas = json(path.join(PACOTE_BASE, 'ciclos.json')).ciclos[0].aulas.map((a) => a.data);
  const daAula1 = calendario.inicio && /^(\d{2})\/(\d{2})\/(\d{4})$/.test(calendario.inicio);
  provar('o manifesto declara início, dias e total (é dele que sai a conta)',
    Boolean(daAula1 && calendario.dias && calendario.total), calendario);
  const esperada1 = publicadas[0].split('-').reverse().join('/');
  provar('…e a data do §1 é a que o `ciclos.json` publicado declara para a aula 01',
    (linhaDoItem(aula1, 'Data e dia') || '').indexOf(esperada1) !== -1,
    [linhaDoItem(aula1, 'Data e dia'), esperada1]);
  provar('…e o dia da semana é o que o Node calcula (segunda implementação)',
    (linhaDoItem(aula1, 'Data e dia') || '').toLowerCase()
      .indexOf(diaPeloNode(esperada1).toLowerCase()) === 0,
    [linhaDoItem(aula1, 'Data e dia'), diaPeloNode(esperada1)]);
  const aula2 = derivar('02');
  const esperada2 = publicadas[1].split('-').reverse().join('/');
  provar('a Aula 02 traz a data DELA, e o dia dela',
    (linhaDoItem(aula2, 'Data e dia') || '').indexOf(esperada2) !== -1
      && (linhaDoItem(aula2, 'Data e dia') || '').toLowerCase()
        .indexOf(diaPeloNode(esperada2).toLowerCase()) === 0,
    [linhaDoItem(aula2, 'Data e dia'), diaPeloNode(esperada2)]);

  /* ───────────────────────────────────────────── C. Não é um calendário */
  console.log('\nC. É uma data, não um calendário');
  const datasNoCapitulo1 = (secao1(aula1).match(/\d{2}\/\d{2}\/\d{4}/g) || []);
  provar('o §1 tem UMA data (a desta aula) — e não as do ciclo',
    datasNoCapitulo1.length === 1, datasNoCapitulo1);
  provar('…e as outras aulas do ciclo não são citadas ali',
    publicadas.slice(1).every((iso) => secao1(aula1).indexOf(iso.split('-').reverse().join('/')) === -1),
    publicadas.slice(1, 3));

  /* ──────────────────────────────── D. Sem calendário, a lacuna nomeia o que falta */
  console.log('\nD. Sem calendário, o documento declara a falta — e não inventa');
  const semCalendario = derivar('01', { calendario: null });
  const linhaSem = linhaDoItem(semCalendario, 'Data e dia') || '';
  provar('a linha diz «[Preencher: …]» e nomeia os campos do manifesto',
    /\[Preencher: a data e o dia desta aula/.test(linhaSem) && /DATA_INICIO/.test(linhaSem)
      && /DIAS/.test(linhaSem) && /TOTAL_AULAS/.test(linhaSem), linhaSem);

  /* ──────────────────────────── E. O §5: para que serve, e os dois botões */
  /* O SEGUNDO BOTÃO SAIU (22/11/2026), por decisão dela: «tira esse botão como preencher o
   * formulário. Pode tirar isso, não tem sentido existir isso. A ideia é que esse texto que você
   * colocou fique aqui na guia de observação do professor.» O texto e o espaço que ele abre
   * ficam; o atalho redundante — um segundo controle para o mesmo `<details>`, que já abre
   * sozinho no `summary` — saiu. O que se mede agora é isso: UM botão, e a explicação lá. */
  console.log('\nE. O §5 manda ao formulário, com um botão e a explicação no lugar');
  /* DUAS VISTAS DO MESMO TEXTO, e cada uma serve uma pergunta diferente: `cinco` é o bloco CRU
   * (onde se procura marcação — o `<a>`, o `<details>`), e `cincoProsa` desfaz as quebras de linha
   * do Markdown («registo faz-se no\n> formulário») e o `>` das citações, para as asserções sobre
   * FRASES medirem a frase e não a largura da coluna. */
  const cinco = secao5(aula1);
  const cincoProsa = cinco.replace(/^> ?/gm, '').replace(/\s+/g, ' ');
  provar('diz que o guia se leva para a sala e o registo se faz no formulário',
    /registo faz-se no formulário/.test(cincoProsa) && /O guia não se preenche/.test(cincoProsa), null);
  provar('o botão «Como preencher o formulário» saiu (o `<details>` abre sozinho no `summary`)',
    cinco.indexOf('Como preencher o formulário') === -1, null);
  provar('tem UM botão só, o que leva ao formulário',
    (cinco.match(/class="acao[^"]*"/g) || []).length === 1
    && /<a class="acao" href="lancamento\.html">/.test(cinco), (cinco.match(/class="acao[^"]*"/g) || []));
  provar('…e o `lancamento.html` existe ao lado do documento, no pacote',
    fs.existsSync(path.join(PACOTE_BASE, 'lancamento.html')), 'lancamento.html');
  provar('a explicação é um `<details>` que abre e fecha — o espaço dela no guia',
    /<details class="bloco-lista" id="guia-do-formulario">/.test(cinco)
    && /<summary class="bloco-cabeca">/.test(cinco), null);
  provar('a explicação nomeia os blocos do formulário, um a um',
    ['Presentes', 'Ânimo', 'Corpo', 'Técnica', 'Poiesis', 'Depois da aula']
      .every((b) => cincoProsa.indexOf(b) !== -1),
    ['Presentes', 'Ânimo', 'Corpo', 'Técnica', 'Poiesis', 'Depois da aula']
      .filter((b) => cincoProsa.indexOf(b) === -1));
  provar('…e diz o que cada um representa NESTE documento',
    /corresponde à coluna de alunas das tabelas de cada eixo/.test(cincoProsa), null);

  /* ──────────────────────────────────── F. As peças são as da folha */
  console.log('\nF. As peças são as da folha');
  const folha = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
  for (const peca of ['.acoes-do-ato', '.acao', '.bloco-lista', '.bloco-cabeca', '.bloco-titulo', '.bloco-corpo']) {
    provar('a folha declara ' + peca,
      folha.indexOf(peca + ' ') !== -1 || folha.indexOf(peca + '{') !== -1
        || folha.indexOf(peca + ',') !== -1, null);
  }

  /* ──────────────────────────── G. A lacuna da data saiu do validador */
  console.log('\nG. O `plano-aula-NN.json` já não declara a data como lacuna');
  const validador = fs.readFileSync(path.join(base, 'tools/validar-aula-ciclo.js'), 'utf8');
  /* O NOME AINDA APARECE NO COMENTÁRIO que explica a saída — e é isso que se quer: o registo do
   * que saiu. O que não pode haver é a LACUNA declarada, que é a atribuição dentro de `LACUNAS`. */
  provar('o validador não declara `dataEHorarioDestaAula` como lacuna',
    !/'identificacao\.dataEHorarioDestaAula'\s*:/.test(validador), null);
  provar('…e a lista de lacunas está vazia, com o motivo escrito ao lado',
    /const LACUNAS = \{\};/.test(validador), null);
  const planoDaAula = json(path.join(PACOTE_BASE, 'plano-aula-01.json'));
  provar('o `plano-aula-01.json` do pacote traz a data e o dia na identificação',
    /segunda-feira, 14\/12\/2026/.test(JSON.stringify(planoDaAula.identificacao || {})),
    planoDaAula.identificacao && planoDaAula.identificacao.dataEDia);

  if (base !== RAIZ) fs.rmSync(base, { recursive: true, force: true });

  console.log('');
  if (falhas) {
    console.log((contra ? 'CONTROLE: ' : '') + 'FALHARAM ' + falhas + ' de ' + total + ' asserções.');
    process.exit(1);
  }
  console.log((contra ? 'CONTROLE CONFORME — ' : 'TUDO CERTO — ') + total + ' asserções: o §1 diz quem '
    + 'dá a aula, em que sala e em que dia (uma data, não um calendário), e o §5 explica o formulário '
    + 'e leva lá com um botão — com o dia da semana conferido por fora do código que o escreve.');
})();
