#!/usr/bin/env node
'use strict';

/**
 * provar-saidas-estaveis.js — gerar de novo sem mudar nada tem de dar o MESMO texto.
 *
 * O QUE ELA RELATOU (15/11/2026):
 *
 *   «Faz o ajuste porque não tem sentido ficar carimbando toda hora. […] Se já foi comitado, se já
 *   subiu, não tem por que fazer de novo se não teve modificação, exceto que seja uma regra da
 *   proveniência.»
 *
 * O SINTOMA, medido antes de mexer: depois de CADA commit que tocasse um pacote, os mesmos doze
 * ficheiros apareciam modificados com o texto igual e uma data nova. Os PDFs com o mesmo número de
 * bytes e o mesmo texto extraído; o `ciclos.json` com uma linha de diferença (`gerado_em`).
 *
 * A CAUSA NÃO ERA O CARIMBO — ERA UM CICLO SEM PONTO FIXO. O `SOURCE_DATE_EPOCH` (a data que o
 * pdfTeX grava no `/CreationDate` e que o `ciclos.json` escrevia como `gerado_em`) vinha de
 *
 *     git log -1 --format=%ct -- "professores/<professor>/ciclos"
 *
 * e esse caminho é a PASTA — que contém as saídas que o gerador escreve. Gravar o `ciclos.json`
 * movia o epoch; o epoch mudava o `ciclos.json`; a árvore sujava-se outra vez. Não é lentidão: é
 * um laço, e por isso não convergia nunca.
 *
 * O QUE SE MEDE AQUI, e por que não basta ler o fonte:
 *
 *   A. ESTABILIDADE. Duas gerações seguidas do mesmo ciclo, com as mesmas fontes, dão ficheiros
 *      BYTE A BYTE iguais — `ciclos.json`, os PDFs e os HTML. É a asserção que responde à pergunta
 *      dela («não tem por que fazer de novo se não teve modificação»).
 *   B. O ÍNDICE NÃO TEM RELÓGIO. `ciclos.json` não declara `gerado_em` nem `estado` — os dois eram
 *      juízos sobre o instante. O FATO (`lancada`) e a JANELA (`prazo`) continuam lá.
 *   C. O LAÇO NÃO VOLTA. Nenhuma via do gerador deriva a data de um caminho que contenha as
 *      próprias saídas. Medido em duas metades: o epoch é a data de início do ciclo (uma função das
 *      fontes) e a lista de caminhos que a produzem não inclui `ciclos.json` nem `.pdf`.
 *   D. A PROVENIÊNCIA NÃO SE MEXEU. O `.fipp` é o mesmo antes e depois — a âncora cobre FONTES, e
 *      `ciclos.json` não é fonte. É a verificação que ela pediu por palavras («exceto que seja uma
 *      regra da proveniência»): se a âncora dependesse do índice, esta prova reprovava.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `tools/` e o `motor/` de `HEAD` para uma
 * pasta temporária, gera com o gerador de ANTES e mostra o laço: o `gerado_em` do índice de antes
 * é uma função da data do último commit na PASTA do ciclo, e a pasta contém o índice.
 *
 *   node experimentos/provar-saidas-estaveis.js
 *   node experimentos/provar-saidas-estaveis.js --controle-negativo
 *
 * CUSTO: duas gerações (~8 s cada) e uma verificação de âncora. Nada aqui toca no ar.
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.includes('--controle-negativo');

/* O CICLO DA PROVA. É um pacote real, com PDF, índice, HTML e âncora — e não uma fixture: o que
 * se mede é o que o gerador escreve no repositório, ficheiro a ficheiro. */
const PROFESSOR = 'pe-torto';
const CICLO = '01';
const ESCOLA = 'calango-piano';
const PASTA = path.join('professores', PROFESSOR, 'ciclos', `ciclo-${CICLO}-${ESCOLA}`);

let total = 0;
let falhas = 0;
function checar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + descricao); return; }
  falhas += 1;
  console.log('  ✗ ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const md5 = (abs) => crypto.createHash('md5').update(fs.readFileSync(abs)).digest('hex');

/** O retrato de um pacote: caminho relativo → md5. Só ficheiros; a pasta não entra. */
function retrato(pasta) {
  const saida = {};
  const andar = (rel) => {
    for (const nome of fs.readdirSync(path.join(RAIZ, rel)).sort()) {
      const r = path.join(rel, nome);
      const st = fs.statSync(path.join(RAIZ, r));
      if (st.isDirectory()) andar(r);
      else saida[r.split(path.sep).join('/')] = md5(path.join(RAIZ, r));
    }
  };
  andar(pasta);
  return saida;
}

function gerar(raizDoGerador) {
  execSync(`bash ${JSON.stringify(path.join(raizDoGerador, 'tools/gerar-ciclo.sh'))} ${PROFESSOR} ${CICLO} ${ESCOLA}`,
    { cwd: RAIZ, stdio: 'pipe' });
}

const lerIndice = (pasta = PASTA) =>
  JSON.parse(fs.readFileSync(path.join(RAIZ, pasta, 'ciclos.json'), 'utf8'));

(async () => {
  if (NEGATIVO) return controleNegativo();

  console.log('\nA. DUAS GERAÇÕES, O MESMO TEXTO — o que ela pediu, medido');
  gerar(RAIZ);
  const primeira = retrato(PASTA);
  gerar(RAIZ);
  const segunda = retrato(PASTA);
  const mudaram = Object.keys(primeira).filter((k) => primeira[k] !== segunda[k]);
  const apareceram = Object.keys(segunda).filter((k) => !(k in primeira));
  const sumiram = Object.keys(primeira).filter((k) => !(k in segunda));
  checar('gerar duas vezes sem mudar nada não muda NENHUM ficheiro do pacote',
    mudaram.length === 0 && apareceram.length === 0 && sumiram.length === 0,
    { mudaram, apareceram, sumiram });
  /* A CONTRAPROVA, no lugar: o comparador tem de apanhar o que diz apanhar. Um comparador que
   * devolvesse sempre a lista vazia — um `Object.keys` trocado, um filtro que não filtra —
   * aprovaria a geração inteira por acidente, e é o defeito mais provável desta prova. */
  const chave = Object.keys(primeira)[0];
  const perturbado = Object.assign({}, primeira, { [chave]: primeira[chave] + 'x' });
  checar('contraprova: um byte diferente no mesmo retrato é detectado',
    Object.keys(perturbado).filter((k) => perturbado[k] !== primeira[k]).length === 1, chave);
  checar('o pacote tem PDF, índice e HTML — não é uma pasta vazia',
    Object.keys(primeira).some((k) => k.endsWith('.pdf'))
    && Object.keys(primeira).some((k) => k.endsWith('ciclos.json'))
    && Object.keys(primeira).some((k) => k.endsWith('.html')),
    Object.keys(primeira).length);

  console.log('\nB. O ÍNDICE NÃO TEM RELÓGIO');
  const indice = lerIndice();
  checar('o `ciclos.json` não declara `gerado_em`', !('gerado_em' in indice),
    Object.keys(indice));
  const aulas = (indice.ciclos[0] || {}).aulas || [];
  checar('…e nenhuma aula declara `estado`', !aulas.some((a) => 'estado' in a),
    aulas.map((a) => Object.keys(a)));
  checar('…mas o FATO (`lancada`) continua declarado', aulas.length > 0 && aulas.every((a) => 'lancada' in a));
  checar('…e a JANELA (`prazo`) também', aulas.length > 0 && aulas.every((a) => 'prazo' in a));
  checar('…e a nota do índice diz por que não há carimbo',
    /nao leva carimbo de tempo/.test(String(indice._nota)), String(indice._nota).slice(-90));

  console.log('\nC. O LAÇO NÃO VOLTA — a data sai das fontes, e não do sítio das saídas');
  const guia = fs.readFileSync(path.join(RAIZ, 'tools/gerar-ciclo.sh'), 'utf8');
  /* A ASSERÇÃO É SOBRE O CÓDIGO, e não sobre um comentário: procura-se a atribuição do epoch e
   * olha-se para o que está do lado direito. Foi exactamente aqui que o defeito viveu. */
  const linhaDoEpoch = (guia.split('\n').find((l) => /^SOURCE_DATE_EPOCH=/.test(l)) || '');
  checar('o epoch NÃO vem de `git log` (que na pasta do ciclo inclui as saídas)',
    !/git .*log/.test(linhaDoEpoch), linhaDoEpoch);
  checar('…e vem da DATA DE INÍCIO do ciclo, que o calendário derivou das fontes',
    /DATA_PRIMEIRA_AULA/.test(linhaDoEpoch), linhaDoEpoch);
  /* E a prova de que o caminho antigo continha as saídas: o índice está versionado DENTRO da
   * pasta que o `git log` percorria. Sem esta linha, «a pasta contém as saídas» seria uma
   * afirmação de quem escreveu o comentário. */
  const versionados = execSync(`git ls-files ${JSON.stringify(PROFESSOR ? `${PASTA}/` : '')}`,
    { cwd: RAIZ, encoding: 'utf8' }).split('\n').filter(Boolean);
  checar('o caminho antigo (`professores/<professor>/ciclos`) continha as SAÍDAS — é o laço',
    versionados.some((f) => f.endsWith('/ciclos.json')) && versionados.some((f) => f.endsWith('.pdf')),
    versionados.filter((f) => /ciclos\.json$|\.pdf$/.test(f)).slice(0, 3));

  console.log('\nD. A PROVENIÊNCIA NÃO SE MEXEU — a âncora cobre fontes, e o índice não é fonte');
  /* O `--check` RECALCULA o hash sobre as fontes vivas e compara-o com o que está no `.fipp`.
   * Se o índice entrasse na fórmula, esta chamada reprovava agora — porque o índice acabou de
   * ser reescrito sem `gerado_em` e sem `estado`. */
  const conferencia = execSync(
    `bash ${JSON.stringify(path.join(RAIZ, 'tools/hash-ciclo.sh'))} ${PROFESSOR} ${CICLO} ${ESCOLA} --check`,
    { cwd: RAIZ, encoding: 'utf8' });
  checar('o `.fipp` verifica-se depois de o índice perder os dois campos',
    /íntegro|cadeia intacta/.test(conferencia), conferencia.trim().split('\n').slice(-2));
  /* E A LISTA, LIDA NO PRÓPRIO `.fipp`: a cobertura é a declaração do que a âncora cobre, e o
   * índice não está nela. Sem esta linha, «o índice não é fonte» seria uma afirmação de quem
   * escreveu o comentário — e a asserção acima passaria mesmo que a cobertura o incluísse, porque
   * o `--check` compara com a mesma lista. */
  const ancora = fs.readFileSync(path.join(RAIZ, 'professores', PROFESSOR, 'ciclos', `ciclo-${CICLO}-${ESCOLA}.fipp`), 'utf8');
  const cobertura = (ancora.split('cobertura:')[1] || '').split('\n').filter((l) => /^\s+- /.test(l));
  checar('…e a cobertura declarada no `.fipp` não tem o índice nem os PDFs',
    cobertura.length > 0
    && !cobertura.some((l) => /ciclos\.json|\.pdf/.test(l)),
    cobertura.filter((l) => /ciclos\.json|\.pdf/.test(l)));

  console.log('\n' + (falhas ? '✗ ' + falhas + ' de ' + total + ' reprovaram' : '✓ ' + total + ' de ' + total));
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.error('provar-saidas-estaveis rebentou:', e && e.stack ? e.stack : e);
  process.exit(1);
});

/**
 * O CONTROLE NEGATIVO — o gerador de `HEAD`, e o laço à vista.
 *
 * Ele não gera nada (geraria com o código de antes e sujaria a árvore): mede o que se pode medir
 * sem escrever — que o epoch de antes era uma função da data do último commit na PASTA do ciclo, e
 * que essa pasta contém o índice e os PDFs. É a definição do laço, e é observável no texto do
 * gerador que saiu.
 */
function controleNegativo() {
  console.log('CONTROLE NEGATIVO — o gerador de HEAD, e o laço que ele tinha\n');
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'gerar-ciclo-head-'));
  try {
    execSync('git archive HEAD tools | tar -x -C ' + destino, { cwd: RAIZ, stdio: 'pipe' });
    const guia = fs.readFileSync(path.join(destino, 'tools/gerar-ciclo.sh'), 'utf8');
    const linha = (guia.split('\n').find((l) => /^SOURCE_DATE_EPOCH=/.test(l)) || '');
    checar('em HEAD o epoch vinha de `git log`', /git .*log/.test(linha), linha);
    checar('…e o caminho era a PASTA do ciclo (onde estão as saídas)',
      /professores\/\$PROFESSOR_SLUG\/ciclos/.test(linha), linha);
    /* O ÍNDICE DE ANTES, e não o do disco: o do disco já foi regerado por esta mudança, e lê-lo
     * aqui faria a bancada medir o presente com o nome do passado. `git show` devolve o ficheiro
     * tal como foi committed. */
    const indice = JSON.parse(execSync(
      `git show HEAD:${JSON.stringify(PASTA + '/ciclos.json')}`,
      { cwd: RAIZ, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
    checar('em HEAD o índice declarava `gerado_em`', 'gerado_em' in indice, Object.keys(indice));
    const aulas = (indice.ciclos[0] || {}).aulas || [];
    checar('…e cada aula declarava um `estado` — o juízo do instante',
      aulas.some((a) => 'estado' in a), aulas.slice(0, 2).map((a) => Object.keys(a)));
  } finally {
    fs.rmSync(destino, { recursive: true, force: true });
  }
  /* O SENTIDO INVERTIDO, E DITO. Aqui o controle não corre as provas contra o código de antes —
   * não poderia: gerar com ele voltaria a sujar a árvore. Ele AFIRMA O DEFEITO de antes, e por
   * isso «passar» quer dizer «o defeito estava lá». A linha final diz isso por palavras, para o
   * verde não se ler ao contrário. */
  if (falhas) {
    console.log('\n✗ o controle NÃO confirmou o defeito de HEAD (' + falhas + ' de ' + total + ')');
    process.exit(1);
  }
  console.log('\n✓ o controle CONFIRMA o defeito de HEAD — ' + total + ' de ' + total
    + ': o epoch vinha da pasta que contém as saídas, e o índice levava `gerado_em` e `estado`');
  process.exit(0);
}
