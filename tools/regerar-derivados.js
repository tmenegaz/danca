#!/usr/bin/env node
'use strict';

/*
 * regerar-derivados.js — reescreve as FONTES DERIVADAS de um ciclo a partir dos envelopes.
 *
 *   node tools/regerar-derivados.js <professor> <ciclo> <variante>            (mostra o que muda)
 *   node tools/regerar-derivados.js <professor> <ciclo> <variante> --escrever (grava)
 *
 * PORQUE EXISTE (02/11/2026). As fontes de um ciclo têm duas metades: as que alguém ESCREVE (o
 * `-po.md` e o `-plano.md`, e o `.conf`) e as que saem delas — a aula, a notação, o glossário, a
 * captura, a harmonização, as referências. As segundas nascem no «Guardar» do PO, dentro do
 * Worker, e depois disso ficam no repositório sem que nada as releia. Quando o DERIVADOR muda —
 * e mudou três vezes esta semana —, o `-aula-01.md` do ciclo já gerado continua a dizer o que o
 * gerador antigo dizia, e não há comando nenhum que o ponha em dia: a única forma era repetir à
 * mão o que o Worker faz, numa linha de `node -e` que ninguém revê.
 *
 * O QUE ELE NÃO TOCA, e é a metade que interessa:
 *   · `-po.md` e o `.conf` — são as fontes escritas; reescrevê-las seria apagar o que o professor
 *     respondeu. O `-plano.md` PARECE uma delas e não é: ele é derivado do envelope do plano, tal
 *     como a aula; o que se escreve é o envelope, e ele é que manda;
 *   · `-dados.json` — NÃO é derivável do envelope: ele é o ESTADO do ciclo, e um ciclo lançado
 *     tem `aulas` dentro. Regerá-lo a partir de `derivarDados` escreveria `aulas: {}` por cima
 *     dos lançamentos, que é a única perda irreversível que este comando poderia causar.
 *
 * E ele NÃO GRAVA por omissão. Sem `--escrever` mostra o que mudaria, ficheiro a ficheiro, com
 * as linhas que entram e as que saem — porque a pergunta «o derivador novo muda o meu ciclo?» se
 * responde lendo, e a gravação responde-se depois de ler.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const { derivarPlano } = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));
const {
  derivarAula01,
  derivarReferencias,
  derivarNotacao,
  derivarGlossario,
  derivarCaptura,
  derivarHarmonizacao,
  notacaoEscolhida,
  slugDe,
} = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));
const { varianteDoContexto } = require(path.join(RAIZ, 'motor/servidor/escrever-po.js'));
const { linhaDeBaseDaTurma } = require(path.join(RAIZ, 'motor/nucleo/linha-de-base.js'));
const { calibracaoDoConf } = require(path.join(RAIZ, 'motor/servidor/escrever-ciclo.js'));

const argv = process.argv.slice(2);
const ESCREVER = argv.includes('--escrever');
const [professor, cicloBruto, variante] = argv.filter((a) => !a.startsWith('--'));

function morrer(mensagem) {
  console.error('regerar-derivados: ' + mensagem);
  process.exit(1);
}

if (!professor || !cicloBruto || !variante) {
  morrer('uso: node tools/regerar-derivados.js <professor> <ciclo> <variante> [--escrever]');
}

const ciclo = String(cicloBruto).padStart(2, '0');
const pastaDoCiclo = path.join(RAIZ, 'professores', professor, 'ciclos');
const caminhoConf = path.join(pastaDoCiclo, 'ciclo-' + ciclo + '-' + variante + '.conf');
if (!fs.existsSync(caminhoConf)) morrer('não achei o manifesto ' + path.relative(RAIZ, caminhoConf));

const confTexto = fs.readFileSync(caminhoConf, 'utf8');
const cal = calibracaoDoConf(confTexto);
const pegarDoConf = (chave) => {
  const m = new RegExp('^' + chave + '="([^"]*)"', 'm').exec(confTexto);
  return m ? m[1] : '';
};
/* O SLUG da escola vem da VARIANTE, e não do `ESCOLA` do manifesto: aquele é o nome de
 * exibição («Batata»), e a pasta e os envelopes moram no slug minúsculo («batata»). A variante
 * é `<escola>-<turma>`, e é a única linha do `.conf` que carrega as duas coisas. */
const escolaSlug = variante.split('-')[0];

/** Os envelopes da escola, do mais antigo para o mais recente. O nome carrega o carimbo. */
function envelopes(prefixo) {
  const pasta = path.join(RAIZ, 'escola', escolaSlug, 'envelopes');
  if (!fs.existsSync(pasta)) return [];
  return fs.readdirSync(pasta)
    .filter((n) => n.startsWith(prefixo + '-') && n.endsWith('.json'))
    .sort()
    .map((n) => path.join(pasta, n));
}

/** O envelope MAIS RECENTE daquele tipo cujo contexto é este ciclo e esta variante. */
function envelopeDoCiclo(prefixo) {
  const candidatos = envelopes(prefixo).reverse();
  for (const caminho of candidatos) {
    let env = null;
    try { env = JSON.parse(fs.readFileSync(caminho, 'utf8')); } catch { continue; }
    const ctx = (env && env.contexto) || {};
    if (String(ctx.professor || '') !== professor) continue;
    if (String(ctx.ciclo || '') !== ciclo) continue;
    if (varianteDoContexto(ctx) !== variante) continue;
    return { caminho, envelope: env };
  }
  return null;
}

const doPlano = envelopeDoCiclo('plano');
const doPo = envelopeDoCiclo('po');
if (!doPlano) morrer('nenhum envelope de PLANO para ' + professor + '/' + ciclo + '/' + variante
  + ' em escola/' + escolaSlug + '/envelopes (a escola foi expurgada?)');
if (!doPo) morrer('nenhum envelope de PO para ' + professor + '/' + ciclo + '/' + variante);

/*
 * O CONTEXTO — e o `turma` NÃO vai: ele é o que monta o nome da variante, e voltar a passar pelo
 * `varianteDoContexto` com o mesmo `turma` dá o mesmo resultado. Vale a pena dizê-lo porque um
 * `turma` ausente aqui produziria uma variante diferente e os ficheiros iriam para o lado errado.
 */
const contexto = {
  professor,
  ciclo,
  escola: escolaSlug,
  escolaNome: cal.escolaNome || escolaSlug,
};

const plano = doPlano.envelope;
const po = doPo.envelope;
const aulas = (pegarDoConf('DOCS').match(/aula-\d+/g) || []).map((d) => d.slice(5));

/*
 * A LINHA DE BASE DA TURMA — a mesma escolha que o Worker faz (06/11/2026).
 *
 * O eixo do Corpo da Aula 01 e a secção «Aspecto físico» do plano passaram a ler o recorte do
 * passo 4 e a leitura do passo 3. Se esta ferramenta não a lesse, regerar um ciclo APAGARIA a
 * derivação — o `--escrever` trocaria as linhas do corpo por uma lacuna, e o dano só apareceria no
 * documento impresso. Os actos moram em `escola/<slug>/linhas-de-base/`, uma versão por ficheiro
 * (`<id>--<carimbo>.json`), e `linhaDeBaseDaTurma` escolhe a enviada mais recentemente para a
 * turma. Sem pasta (escola expurgada, ciclo antigo), degrada para `null` e a lacuna diz-se.
 */
function linhaDeBaseDaTurmaDoCiclo() {
  const pasta = path.join(RAIZ, 'escola', escolaSlug, 'linhas-de-base');
  if (!fs.existsSync(pasta)) return null;
  const linhas = [];
  for (const nome of fs.readdirSync(pasta)) {
    if (!nome.endsWith('.json') || nome.startsWith('.')) continue;
    try { linhas.push(JSON.parse(fs.readFileSync(path.join(pasta, nome), 'utf8'))); } catch { /* ficheiro ilegível não derruba a leitura */ }
  }
  const turma = (plano.respostas && plano.respostas['contexto-turma']);
  const nome = String((turma && (turma.valor !== undefined ? turma.valor : turma)) || '').trim();
  return linhaDeBaseDaTurma(linhas, nome);
}
const linhaDeBase = linhaDeBaseDaTurmaDoCiclo();
console.log('linha de base: ' + (linhaDeBase
  ? linhaDeBase.nome + ' — ' + linhaDeBase.recorte.length + ' aspecto(s) do corpo'
  : 'nenhuma enviada para esta turma (o corpo declara a lacuna)'));

const fontes = [
  /* O `-plano.md` TAMBÉM É DERIVADO DO ENVELOPE — não é fonte escrita, apesar de se chamar
   * «plano». Quem se escreve são o `-po.md` e o `.conf`. Ele entra aqui porque um título de
   * secção do plano muda no DERIVADOR, e sem esta linha o ciclo já gerado continuaria com o
   * título antigo enquanto o formulário mostrava o novo. */
  { sufixo: '-plano.md', texto: derivarPlano(plano, { linhaDeBase }).markdown },
  { sufixo: '-aula-01.md', texto: derivarAula01({ plano, po, contexto: Object.assign({}, contexto, { aulas }), calibracao: cal, linhaDeBase }) },
  { sufixo: '-referencias.md', texto: derivarReferencias({ plano, contexto }) },
  { sufixo: '-captura-aula-01.md', texto: derivarCaptura({ po, plano, contexto }) },
  { sufixo: '-harmonizacao.md', texto: derivarHarmonizacao({ plano, po, contexto }) },
];
const notacao = notacaoEscolhida(plano);
if (notacao) {
  fontes.push({ sufixo: '-notacao.md', texto: derivarNotacao({ plano, contexto }) });
  fontes.push({ sufixo: '-glossario-' + slugDe(notacao) + '.md', texto: derivarGlossario({ plano, contexto }) });
}

let mudaram = 0;
for (const fonte of fontes) {
  const destino = path.join(pastaDoCiclo, 'ciclo-' + ciclo + '-' + variante + fonte.sufixo);
  const antes = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : null;
  const relativo = path.relative(RAIZ, destino);
  if (antes === fonte.texto) {
    console.log('igual      ' + relativo);
    continue;
  }
  mudaram += 1;
  console.log((antes === null ? 'novo       ' : 'DIFERENTE  ') + relativo);
  if (antes !== null) {
    const de = antes.split('\n');
    const para = fonte.texto.split('\n');
    let i = 0;
    while (i < de.length && i < para.length && de[i] === para[i]) i += 1;
    let fimDe = de.length - 1;
    let fimPara = para.length - 1;
    while (fimDe >= i && fimPara >= i && de[fimDe] === para[fimPara]) { fimDe -= 1; fimPara -= 1; }
    for (const linha of de.slice(i, fimDe + 1)) console.log('  - ' + linha.slice(0, 140));
    for (const linha of para.slice(i, fimPara + 1)) console.log('  + ' + linha.slice(0, 140));
  }
  if (ESCREVER) fs.writeFileSync(destino, fonte.texto, 'utf8');
}

if (!mudaram) {
  console.log('\nnada a fazer: as fontes derivadas já são o que este derivador escreve.');
} else if (ESCREVER) {
  console.log('\n' + mudaram + ' fonte(s) reescrita(s). A âncora mudou: `tools/hash-ciclo.sh '
    + professor + ' ' + ciclo + ' ' + variante + '` e regenere o pacote.');
} else {
  console.log('\n' + mudaram + ' fonte(s) mudariam. Nada foi gravado — `--escrever` grava.');
}
