#!/usr/bin/env node
'use strict';

/*
 * regerar-derivados.js — reescreve as FONTES DERIVADAS de um ciclo a partir dos envelopes.
 *
 *   node tools/regerar-derivados.js <professor> <ciclo> <variante>            (mostra o que muda)
 *   node tools/regerar-derivados.js <professor> <ciclo> <variante> --escrever (grava)
 *   …e `--elenco=<id>` quando a turma declara o elenco só no KV do Worker (ver
 *   `linhaDeBaseDaTurmaDoCiclo`): é o id que `GET /api/bastidores/alunas-da-turma?turma=<nome>`
 *   devolve em `linhaDeBase.id`.
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
 * E ELE NÃO REESCREVE A AULA QUE JÁ FOI DADA (21/11/2026). A regra é a mesma do Worker — «regenerar
 * o ciclo afecta só a aula que ainda não foi dada», em `motor/nucleo/aulas-do-ciclo.js` —, e ela
 * lê-se do `-dados.json`, que é só LIDO aqui: tem `aulas[NN]` quem já foi lançada, e o
 * `-aula-NN.md`/`-captura-aula-NN.md` dessa aula sai da lista antes de qualquer comparação. Sem
 * isto, este comando — que existe justamente para pôr os derivados em dia quando o derivador muda —
 * passaria por cima do plano de uma aula que já aconteceu, e a mudança apareceria no diff de
 * proveniência como se fosse do professor.
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
  derivarAula,
  derivarReferencias,
  derivarNotacao,
  derivarGlossario,
  derivarCaptura,
  derivarHarmonizacao,
  notacaoEscolhida,
  slugDe,
} = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));
const { varianteDoContexto } = require(path.join(RAIZ, 'motor/servidor/escrever-po.js'));
const { linhaDeBaseDaTurma, linhaDeBaseDoElenco } = require(path.join(RAIZ, 'motor/nucleo/linha-de-base.js'));
const { calibracaoDoConf } = require(path.join(RAIZ, 'motor/servidor/escrever-ciclo.js'));
const { aulasLancadas, podeRegenerar, numeroDaAula } = require(path.join(RAIZ, 'motor/nucleo/aulas-do-ciclo.js'));

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
/* TODAS AS AULAS DO CICLO, COM A 01 SEMPRE (21/11/2026) — ver a lista `fontes`, mais abaixo. */
const aulasParaDerivar = (() => {
  const vistos = new Set(['01']);
  for (const a of aulas) {
    const n = numeroDaAula(a);
    if (n) vistos.add(n);
  }
  return [...vistos].sort((a, b) => Number(a) - Number(b));
})();

/*
 * QUAIS AULAS JÁ ACONTECERAM (21/11/2026) — lido do `-dados.json`, e só LIDO.
 *
 * O ficheiro não é derivado por este comando (ver o cabeçalho), mas é a única fonte do facto: tem
 * `aulas[NN]` quem já foi lançada, e a aula lançada não se reescreve. Sem `-dados.json` — um ciclo
 * que nunca foi lançado — o conjunto sai vazio, e todas as aulas continuam a poder ser regeradas.
 *
 * A PRECEDÊNCIA É A DA `fonte_dados()` (`tools/lib-fontes.sh:52`): a fonte da variante quando
 * existe, senão a compartilhada. Não é zelo: um ciclo cujo `-dados.json` é o `ciclo-01-dados.json`
 * partilhado tem os lançamentos LÁ, e ler só o caminho da variante daria «nenhuma aula lançada» —
 * o silêncio que faz a regra não fazer nada.
 */
function fonteDosDados() {
  const daVariante = path.join(pastaDoCiclo, 'ciclo-' + ciclo + '-' + variante + '-dados.json');
  if (fs.existsSync(daVariante)) return daVariante;
  const compartilhado = path.join(pastaDoCiclo, 'ciclo-' + ciclo + '-dados.json');
  return fs.existsSync(compartilhado) ? compartilhado : null;
}
let dadosDoCiclo = null;
const caminhoDosDados = fonteDosDados();
if (caminhoDosDados) {
  try { dadosDoCiclo = JSON.parse(fs.readFileSync(caminhoDosDados, 'utf8')); } catch { dadosDoCiclo = null; }
}
const lancadas = aulasLancadas(dadosDoCiclo);
if (lancadas.size) {
  console.log('aulas lançadas: ' + [...lancadas].sort().join(', ')
    + ' — a fonte destas não é reescrita (o plano de uma aula dada é facto)');
}

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
  /* O ELENCO QUE A TURMA ESCOLHEU PODE SER DITO À MÃO (22/11/2026) — motivo declarado.
   *
   * Desde 07/11/2026 quem declara o elenco de uma turma é a TURMA (`curadorias`, com `linhaDeBase`),
   * e o elenco deixou de guardar `turma`. As curadorias vivem no KV do Worker, e não há no
   * repositório nada que esta ferramenta possa ler para refazer a ligação — por isso ela pede o id
   * a quem sabe: `--elenco=tami`. Não é invenção: é o mesmo valor que a Turma declara, lido de
   * `GET /api/bastidores/alunas-da-turma?turma=<nome>` no Worker. Sem a opção, o vínculo antigo
   * continua a ser procurado, e a guarda abaixo impede que a falta de elenco apague o que existe. */
  const aMao = (argv.find((a) => a.indexOf('--elenco=') === 0) || '').split('=').slice(1).join('=').trim();
  if (aMao) return linhaDeBaseDoElenco(linhas, aMao);
  return linhaDeBaseDaTurma(linhas, nome);
}
/*
 * O CARIMBO VIGENTE DE CADA ALUNA — a mesma regra do Worker, lida do disco (06/11/2026).
 *
 * A §6 «Proveniência consolidada» da Aula 01 lista a anamnese de cada aluna, com dois links: um
 * que abre o formulário (`?editar=<carimbo>`) e outro que abre a folha
 * (`/anamnese/api/ficha-preenchida.<carimbo>`). Sem este mapa, o `--escrever` APAGARIA os links
 * ao regerar um ciclo — a regressão só apareceria no documento impresso, que é o pior sítio.
 *
 * A regra é a de `porta.anamneses`: o VIGENTE de cada apelido é o carimbo mais recente. Aqui ela
 * é relida do disco (o nome do ficheiro e o `contexto.aluna` de cada envelope), porque este
 * comando corre fora do Worker e não tem KV nem índice.
 */
function anamnesesVigentesDoCiclo() {
  const pasta = path.join(RAIZ, 'escola', escolaSlug, 'envelopes');
  const mapa = {};
  if (!fs.existsSync(pasta)) return mapa;
  /* `vinculada` é a MESMA regra de `porta.vinculos`: a aluna aparece no elenco de algum PO da
   * escola. Lida aqui dos envelopes, para o documento regerado no disco dizer o mesmo que o
   * documento gerado no Worker — «novo registo» em vez de «editar». */
  const vinculadas = new Set();
  for (const nome of fs.readdirSync(pasta)) {
    if (!/^po-.*\.json$/.test(nome)) continue;
    let env = null;
    try { env = JSON.parse(fs.readFileSync(path.join(pasta, nome), 'utf8')); } catch { continue; }
    const sujeitos = (env && env.respostas && env.respostas.sujeitos);
    const lista = sujeitos && (Array.isArray(sujeitos.valor) ? sujeitos.valor : [sujeitos.valor]);
    for (const a of (Array.isArray(lista) ? lista : [])) {
      const nome2 = String(a == null ? '' : a).trim();
      if (nome2) vinculadas.add(nome2);
    }
  }
  for (const nome of fs.readdirSync(pasta)) {
    if (!/^anamnese-.*\.json$/.test(nome)) continue;
    let env = null;
    try { env = JSON.parse(fs.readFileSync(path.join(pasta, nome), 'utf8')); } catch { continue; }
    const aluna = String((env && env.contexto && env.contexto.aluna) || '').trim();
    const carimbo = String((env && env.id) || nome.replace(/\.json$/, ''));
    if (!aluna || !carimbo) continue;
    /* QUEM FEZ A ANAMNESE (22/11/2026) — a MESMA escolha de `porta.anamneses`: o nome de exibição
     * quando o envelope o declara, e o slug quando só há slug (é o caso de todas as anamneses já
     * gravadas). Sem autor, o documento diz só a data — não se inventa um nome. */
    const autor = String((env && env.contexto
      && (env.contexto.professorNome || env.contexto.professor)) || '').trim();
    const atual = mapa[aluna];
    if (!atual || atual.carimbo < carimbo) {
      mapa[aluna] = { carimbo, vinculada: vinculadas.has(aluna), autor: autor || null };
    }
  }
  return mapa;
}
const anamneses = anamnesesVigentesDoCiclo();
const linhaDeBase = linhaDeBaseDaTurmaDoCiclo();
console.log('anamneses: ' + (Object.keys(anamneses).length
  ? Object.keys(anamneses).length + ' aluna(s) com carimbo vigente'
  : 'nenhuma lida do disco (a §6 lista só o gesto de fazer)'));
console.log('linha de base: ' + (linhaDeBase
  ? linhaDeBase.nome + ' — ' + linhaDeBase.recorte.length + ' aspecto(s) do corpo'
  : 'nenhuma enviada para esta turma (o corpo declara a lacuna)'));

const fontes = [
  /* O `-plano.md` TAMBÉM É DERIVADO DO ENVELOPE — não é fonte escrita, apesar de se chamar
   * «plano». Quem se escreve são o `-po.md` e o `.conf`. Ele entra aqui porque um título de
   * secção do plano muda no DERIVADOR, e sem esta linha o ciclo já gerado continuaria com o
   * título antigo enquanto o formulário mostrava o novo. */
  { sufixo: '-plano.md', texto: derivarPlano(plano, { linhaDeBase }).markdown },
  /* UMA FONTE POR AULA QUE O MANIFESTO DECLARA (21/11/2026) — era o par da Aula 01 escrito à
   * mão, e um ciclo com a Aula 02 não a punha em dia por aqui. `aulas` sai do `DOCS`; a Aula 01
   * entra sempre, porque todo o ciclo a tem. */
  ...aulasParaDerivar.map((nn) => ({
    sufixo: '-aula-' + nn + '.md', deAula: nn,
    texto: derivarAula({ nn, plano, po, contexto: Object.assign({}, contexto, { aulas }),
      calibracao: cal, linhaDeBase, anamneses }),
  })),
  { sufixo: '-referencias.md', texto: derivarReferencias({ plano, contexto }) },
  /* A LINHA DE BASE VAI À FOLHA (06/11/2026) — é dela que saem as LINHAS das tabelas, e sem
   * ela a folha regerada voltaria a listar o elenco do PO (com a aluna a mais). Ver
   * `elencoDoCiclo` em `derivar-ciclo.js`. */
  ...aulasParaDerivar.map((nn) => ({
    sufixo: '-captura-aula-' + nn + '.md', deAula: nn,
    texto: derivarCaptura({ nn, po, plano, contexto, linhaDeBase, anamneses }),
  })),
  { sufixo: '-harmonizacao.md', texto: derivarHarmonizacao({ plano, po, contexto }) },
];
const notacao = notacaoEscolhida(plano);
if (notacao) {
  fontes.push({ sufixo: '-notacao.md', texto: derivarNotacao({ plano, contexto }) });
  fontes.push({ sufixo: '-glossario-' + slugDe(notacao) + '.md', texto: derivarGlossario({ plano, contexto }) });
}

let mudaram = 0;
let travadas = 0;
for (const fonte of fontes) {
  const destino = path.join(pastaDoCiclo, 'ciclo-' + ciclo + '-' + variante + fonte.sufixo);
  const antes = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : null;
  const relativo = path.relative(RAIZ, destino);
  /* A AULA JÁ DADA NÃO SE REGERA (21/11/2026) — a regra está em `aulas-do-ciclo.js`. Ausente, a
   * fonte reconstrói-se: não há facto a preservar, e um buraco no pacote não é prova de nada. */
  if (fonte.deAula && !podeRegenerar(fonte.deAula, lancadas)) {
    if (antes !== null) {
      travadas += 1;
      console.log('travada    ' + relativo + '  (aula ' + fonte.deAula + ' já lançada)');
      continue;
    }
    console.log('reparada   ' + relativo + '  (a fonte da aula lançada faltava)');
  }
  if (antes === fonte.texto) {
    console.log('igual      ' + relativo);
    continue;
  }
  /* O QUE ELE NÃO CONSEGUE REPRODUZIR, ELE NÃO APAGA (22/11/2026) — motivo declarado.
   *
   * O SINTOMA, medido a 22/11/2026 neste repositório: `node tools/regerar-derivados.js demi-plie 01
   * breu-rosa` anunciou «linha de base: nenhuma enviada para esta turma» e, na diferença, a remoção
   * das **onze linhas do Corpo** e de todo o eixo Técnica da Aula 01. Com `--escrever`, teria
   * trocado os valores lidos das anamneses — que ela tinha acabado de obter — por uma lacuna.
   *
   * A CAUSA não é desta ferramenta nem do derivador: desde 07/11/2026 quem declara que uma turma lê
   * um elenco é a TURMA (`curadorias`, com `linhaDeBase`), e o elenco deixou de ter o campo `turma`.
   * `linhaDeBaseDaTurmaDoCiclo()` continua a procurar o vínculo antigo, e as curadorias vivem no KV
   * do Worker — não há no repositório um ficheiro que esta ferramenta possa ler para refazer a
   * ligação. Sem a ligação, ela não sabe qual é o elenco, e o que não se sabe não se reescreve.
   *
   * A GUARDA é pela MARCA do dado, e não pelo nome do ficheiro: uma linha de tabela da forma
   * `| <aspecto> | N de M em «<nível>» …` só a leitura do passo 3 a produz. Se o ficheiro que está
   * no disco a tem e o derivador novo não a pode produzir, ele está a APAGAR um dado que não
   * reconstruiu — e é isso que se trava, com a frase que diz onde está a causa. */
  const MARCA_DA_LEITURA = /^\| .+ \| \d+ de \d+ em «/m;
  if (linhaDeBase === null && antes !== null && MARCA_DA_LEITURA.test(antes)
    && !MARCA_DA_LEITURA.test(fonte.texto)) {
    travadas += 1;
    console.log('travada    ' + relativo + '  (o ficheiro tem valores lidos das anamneses e este '
      + 'comando não os consegue reproduzir: a turma declara o elenco na Turma, e o vínculo vivo '
      + 'está no KV do Worker — ver o motivo no topo deste ficheiro)');
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
if (travadas) {
  console.log(travadas + ' fonte(s) da aula já lançada ficaram como estavam: o plano de uma aula '
    + 'dada é facto, e este comando não o reescreve.');
}
