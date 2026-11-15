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
 *   E. O CARIMBO NÃO DEPENDE DO FUSO. Duas gerações do mesmo pacote em fusos opostos dão PDFs byte
 *      a byte iguais, e o `/CreationDate` é a meia-noite UTC da data de início do ciclo. Sem esta
 *      secção a estabilidade era verdadeira numa máquina só: medido a 15/11/2026, o `main` tinha
 *      cinco pacotes com `…030000Z` (aqui, -03) e um com `…000000Z` (a Action, UTC) — o mesmo
 *      carimbo, dois valores, e era isto que voltava a cada commit.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `tools/` e o `motor/` de `HEAD` para uma
 * pasta temporária, gera com o gerador de ANTES e mostra o laço: o `gerado_em` do índice de antes
 * é uma função da data do último commit na PASTA do ciclo, e a pasta contém o índice; e o epoch de
 * antes lê a data na hora local, sem pino de fuso.
 *
 *   node experimentos/provar-saidas-estaveis.js
 *   node experimentos/provar-saidas-estaveis.js --controle-negativo
 *
 * CUSTO: quatro gerações (~8 s cada) e uma verificação de âncora. Nada aqui toca no ar.
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

/** A MESMA geração, com um fuso imposto à máquina — é assim que se mede o carimbo de ontem. */
function gerarNoFuso(raizDoGerador, fuso) {
  execSync(`bash ${JSON.stringify(path.join(raizDoGerador, 'tools/gerar-ciclo.sh'))} ${PROFESSOR} ${CICLO} ${ESCOLA}`,
    { cwd: RAIZ, stdio: 'pipe', env: Object.assign({}, process.env, { TZ: fuso }) });
}

/** O `/CreationDate` de um PDF, lido dos bytes — o metadado que o pdfTeX escreve. */
function carimboDoPdf(abs) {
  const m = /\/CreationDate \(D:([0-9]{14})Z\)/.exec(fs.readFileSync(abs, 'latin1'));
  return m ? m[1] : null;
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

  console.log('\nE. O CARIMBO NÃO DEPENDE DO FUSO DA MÁQUINA');
  /* O `TZ` é imposto ao PROCESSO DO GERADOR, e não herdado: a pergunta é «a saída muda com o fuso
   * de quem gera?», e a única forma de a responder é gerar em dois fusos diferentes. Os dois são
   * opostos e nenhum é o desta máquina (-03), para o caso não passar por coincidência. */
  const FUSO_A = 'America/Sao_Paulo';
  const FUSO_B = 'Asia/Tokyo';
  gerarNoFuso(RAIZ, FUSO_A);
  const pdfsEmA = Object.fromEntries(Object.keys(retrato(PASTA))
    .filter((k) => k.endsWith('.pdf')).map((k) => [k, md5(path.join(RAIZ, k))]));
  const carimboEmA = carimboDoPdf(path.join(RAIZ, PASTA, `ciclo-${CICLO}-${ESCOLA}.pdf`));
  gerarNoFuso(RAIZ, FUSO_B);
  const pdfsEmB = Object.fromEntries(Object.keys(retrato(PASTA))
    .filter((k) => k.endsWith('.pdf')).map((k) => [k, md5(path.join(RAIZ, k))]));
  checar('gerar em ' + FUSO_A + ' e em ' + FUSO_B + ' dá os MESMOS PDFs, byte a byte',
    Object.keys(pdfsEmA).length > 0
    && Object.keys(pdfsEmA).every((k) => pdfsEmA[k] === pdfsEmB[k]),
    { fusos: [FUSO_A, FUSO_B], pdfs: Object.keys(pdfsEmA), a: pdfsEmA, b: pdfsEmB });

  /* E O VALOR, não só a igualdade: um carimbo fixo em «sempre a mesma string» também seria igual
   * nos dois fusos, e estaria errado. O que se afirma é que ele é a meia-noite UTC da DATA DE
   * INÍCIO do ciclo — o mesmo `inicio` que o índice declara, que vem do calendário e das fontes. */
  const inicio = String((lerIndice().ciclos[0] || {}).inicio || '').replace(/-/g, '');
  checar('…e o `/CreationDate` é a meia-noite UTC da data de início do ciclo',
    carimboEmA === inicio + '000000', { carimbo: carimboEmA, inicio });
  /* O `Z` do PDF é uma AFIRMAÇÃO DE FUSO, e antes era falsa: com `-03` na máquina, o campo dizia
   * `Z` carregando 03:00 de deslocamento. Com o pino, a hora do carimbo é a mesma nos dois fusos e
   * é meia-noite — se o pino caísse, o sufixo deixava de ser `000000` em pelo menos um deles. */
  checar('…e nenhum dos dois fusos deixa um resto de hora no carimbo',
    /000000$/.test(String(carimboEmA))
    && carimboDoPdf(path.join(RAIZ, PASTA, `ciclo-${CICLO}-${ESCOLA}.pdf`)) === carimboEmA,
    carimboEmA);

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
  console.log('CONTROLE NEGATIVO — o que o gerador de HEAD ainda fazia\n');
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'gerar-ciclo-head-'));
  try {
    execSync('git archive HEAD tools | tar -x -C ' + destino, { cwd: RAIZ, stdio: 'pipe' });
    const guia = fs.readFileSync(path.join(destino, 'tools/gerar-ciclo.sh'), 'utf8');

    /* O QUE O CONTROLE AINDA PODE MEDIR, E PORQUÊ SÓ ISTO. Ele nasceu a 15/11/2026 afirmando o
     * LAÇO (o epoch vinha de `git log` na pasta das saídas, e o índice levava `gerado_em`). Esse
     * defeito foi corrigido e está no `HEAD` — logo, um controle ancorado em `HEAD` deixou de o
     * poder afirmar, e as quatro asserções antigas passaram a reprovar por medirem o presente com
     * o nome do passado. O registo do laço fica onde ele é imutável: a entrada de 15/11/2026 no
     * `REGISTRO.md` e o commit que o fechou. O que se mede aqui é o que **continua** em `HEAD`. */
    const linha = (guia.split('\n').find((l) => /^SOURCE_DATE_EPOCH=/.test(l)) || '');
    checar('o laço já não está em HEAD: o epoch vem do calendário, e não de `git log`',
      !/git .*log/.test(linha) && /DATA_PRIMEIRA_AULA/.test(linha), linha);

    /* ------------------------------------------------ o fuso, que ficou por trás do laço
     *
     * A PRIMEIRA METADE, MEDIDA NAS SAÍDAS QUE O `HEAD` JÁ TINHA. Sem gerar nada: os PDFs
     * versionados trazem o carimbo de antes, e se ele dependia do fuso da máquina então a MESMA
     * data de início tem de aparecer com valores diferentes em pacotes diferentes. Aparece. */
    const pdfs = execSync('git ls-files "professores/*.pdf"', { cwd: RAIZ, encoding: 'utf8' })
      .split('\n').filter((f) => f && /ciclo-01/.test(f));
    const carimbos = new Map();
    for (const f of pdfs) {
      const bytes = execSync(`git show HEAD:${JSON.stringify(f)}`,
        { cwd: RAIZ, maxBuffer: 64 * 1024 * 1024 }).toString('latin1');
      const m = /\/CreationDate \(D:([0-9]{14})Z\)/.exec(bytes);
      if (!m) continue;
      if (!carimbos.has(m[1])) carimbos.set(m[1], []);
      carimbos.get(m[1]).push(f.split('/').slice(-2, -1)[0]);
    }
    checar('em HEAD a MESMA data de início dava carimbos DIFERENTES, conforme a máquina',
      carimbos.size >= 2, [...carimbos.entries()].map(([c, p]) => c + ' · ' + p.join(', ')));
    checar('…e o de cá (o desta máquina, -03) trazia hora 03:00 dentro de um campo marcado `Z`',
      [...carimbos.keys()].some((c) => /030000$/.test(c)), [...carimbos.keys()]);

    /* A SEGUNDA METADE, MEDIDA NA CONTA. O gerador de HEAD não fixava fuso: a mesma data lida em
     * dois fusos dava dois instantes. A conta é a do próprio HEAD, executada — não lida. */
    const conta = (fuso) => execSync(
      `TZ=${fuso} date -d 2026-11-11 +%s`, { cwd: RAIZ, encoding: 'utf8' }).trim();
    checar('…porque o epoch de HEAD lia a data na hora LOCAL, sem pino de fuso',
      Number(conta('America/Sao_Paulo')) - Number(conta('Asia/Tokyo')) === 12 * 3600,
      { sao_paulo: conta('America/Sao_Paulo'), tokyo: conta('Asia/Tokyo') });
    checar('…e o gerador de HEAD não tinha a linha que fixa o fuso',
      !/^TZ=UTC$/m.test(guia), (guia.split('\n').find((l) => /^TZ=/.test(l)) || '(nenhuma)'));
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
    + ': o carimbo do PDF mudava com o fuso da máquina, e a mesma data saía com dois valores');
  process.exit(0);
}
