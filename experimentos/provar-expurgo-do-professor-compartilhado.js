#!/usr/bin/env node
'use strict';

/**
 * provar-expurgo-do-professor-compartilhado.js — o MESMO professor em DUAS escolas (25/11/2026).
 *
 * O QUE ELA RELATOU, e é a razão de esta prova existir:
 *
 *   «Eu usei o mesmo nome de professor para a escola Batata e para a escola Breu. Eu fiz o expurgo
 *    da escola Batata, sucesso. Tentei fazer o expurgo da escola Breu e deu erro. Acho que isso é
 *    um problema. […] Deve ter talvez mais problemas relacionados a isso.»
 *
 * O «erro» da `breu` era verdadeiro, e não estava nela:
 *
 *   [cobertura-quebrada] `professores/dedao-aberto/ciclos/ciclo-01-breu.fipp` cita
 *   `professores/dedao-aberto/ciclos/ciclo-01.conf`, que já não existe na árvore — a cadeia está
 *   partida
 *
 * O manifesto BASE (`ciclo-01.conf`) é do CICLO, não da escola: as duas escolas do mesmo professor
 * no mesmo ciclo partilham-no, e o `.fipp` de cada uma cita-o. O expurgo da `batata` levou-o, e a
 * `breu` — viva — ficou sem a base da própria cadeia. Nada a avisou: a auditoria só corre quando se
 * tenta expurgar a `breu`.
 *
 * A CAUSA, e é o que se mede aqui. A pergunta «o professor ainda tem outra escola neste ciclo?» era
 * respondida por `escolasDosCaminhos`, que reconhece uma escola pelo `wrangler.<slug>.jsonc`. Uma
 * escola que nasce DENTRO DE UM SHARD não tem config — é exactamente o que a impede de ganhar um —,
 * e portanto não era vista. As duas escolas eram de shard: a resposta foi «não tem outra», com a
 * outra viva ao lado.
 *
 * E a MESMA cegueira tinha um segundo lado, na mesma árvore: o `lastro-teste` (o shard) tem config e
 * não é escola, e aparecia na lista pronto a apagar enquanto as escolas que vivem dentro dele não
 * apareciam. As duas metades se medem juntas porque a correção é uma só: perguntar ao CAMINHO, e
 * não a quem tem Worker.
 *
 * SEM REDE E SEM TOKEN: só árvores fabricadas e as funções do módulo. Uma prova que precisa de um
 * token para correr não corre no clone de quem quer conferir o que ela afirma.
 *
 *   node experimentos/provar-expurgo-do-professor-compartilhado.js
 *   node experimentos/provar-expurgo-do-professor-compartilhado.js --controle-negativo
 *
 * O CONTROLE NEGATIVO corre as mesmas asserções contra o código do commit que AINDA TINHA O DEFEITO.
 * A âncora é o commit do expurgo da `batata` (o que apagou o manifesto), e não `HEAD`: um controle
 * ancorado em `HEAD` envelhece no dia em que o trabalho é cometido, e passa a comparar a prova com
 * ela mesma. É a terceira vez neste repositório; a disciplina está escrita no REGISTRO.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.includes('--controle-negativo');

/**
 * CONTRA QUE CÓDIGO SE CORRE O CONTROLE — o commit do expurgo da `batata` (`9831a13c`), que é o
 * minuto em que o defeito produziu o estrago. Se o commit não existir (um clone raso), a prova
 * DIZ que não pode fazer o controle em vez de fingir que o fez.
 */
const REFERENCIA_DO_CONTROLE = '9831a13c';

function raizDoCodigo() {
  if (!NEGATIVO) return { raiz: RAIZ, referencia: null };
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'expurgo-antes-'));
  try {
    execSync('git archive ' + REFERENCIA_DO_CONTROLE + ' motor modelo tools modelo | tar -x -C ' + destino,
      { cwd: RAIZ, stdio: 'pipe' });
  } catch (erro) {
    console.error('não consegui extrair ' + REFERENCIA_DO_CONTROLE + ' — sem o controle negativo.');
    process.exit(3);
  }
  return { raiz: destino, referencia: REFERENCIA_DO_CONTROLE };
}

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

const { raiz, referencia } = raizDoCodigo();
if (referencia) {
  console.log('CONTROLE NEGATIVO — o código de ' + referencia + ', antes da correção\n');
}
const repo = require(path.join(raiz, 'motor/servidor/repo-escola.js'));

/** A função pode não existir no código de antes: ausente é FALHA, e não um `TypeError`. */
const tem = (nome) => typeof repo[nome] === 'function';

/**
 * A ÁRVORE REAL DAQUELE MINUTO, reduzida. Duas escolas do MESMO professor, no MESMO ciclo, as duas
 * dentro do shard: `wrangler.lastro-teste.jsonc` é o único config, e não é de nenhuma delas.
 */
const ARVORE = [
  'wrangler.lastro-teste.jsonc',
  'escola/batata/indice.json',
  'escola/breu/indice.json',
  'professores/dedao-aberto/ciclos/ciclo-01.conf',
  'professores/dedao-aberto/ciclos/ciclo-01-schema.json',
  'professores/dedao-aberto/ciclos/ciclo-01-batata.conf',
  'professores/dedao-aberto/ciclos/ciclo-01-batata.fipp',
  'professores/dedao-aberto/ciclos/ciclo-01-batata/index.html',
  'professores/dedao-aberto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2-aula-01.md',
  'professores/dedao-aberto/ciclos/ciclo-01-breu.conf',
  'professores/dedao-aberto/ciclos/ciclo-01-breu.fipp',
  'professores/dedao-aberto/ciclos/ciclo-01-breu/index.html',
  'professores/dedao-aberto/cadernos/ciclo-01/nota.md',
  'professores/dedao-aberto/perfil.json',
];
const SHARDS = ['lastro-teste'];

// ---------------------------------------------------------------- A. o manifesto base

console.log('\nA. O manifesto BASE é do ciclo, e sai só quando o ciclo fica sem escola');

if (!tem('restosDoCiclo') || !tem('manifestoQueSeApaga')) {
  conferir('existe a regra `manifestoQueSeApaga` — a decisão sobre a base partilhada', false,
    'não existe neste código');
} else {
  const restos = repo.restosDoCiclo(ARVORE, 'dedao-aberto', '01');
  conferir('os restos do ciclo trazem as DUAS escolas, e não os schemas nem a base',
    restos.includes('professores/dedao-aberto/ciclos/ciclo-01-breu.conf') &&
    restos.includes('professores/dedao-aberto/ciclos/ciclo-01-batata.conf') &&
    !restos.includes('professores/dedao-aberto/ciclos/ciclo-01.conf') &&
    !restos.includes('professores/dedao-aberto/ciclos/ciclo-01-schema.json'),
    restos);

  const expurgandoBatata = repo.manifestoQueSeApaga(ARVORE,
    { slug: 'batata', professor: 'dedao-aberto', ciclo: '01' });
  conferir('expurgar a BATATA não leva o `ciclo-01.conf`: a BREU está viva no mesmo ciclo',
    expurgandoBatata.manifesto.length === 0, expurgandoBatata);
  conferir('…e o relatório diz POR QUE ele não sai, com o caminho que o segurou',
    expurgandoBatata.deOutraEscola.some((c) => c.includes('ciclo-01-breu.conf')),
    expurgandoBatata.deOutraEscola);

  /* O CONTROLE POSITIVO, no mesmo código: sem outra escola no ciclo, a base VAI. Sem esta metade,
   * a correção teria fechado a limpeza — e uma escola nova seria recusada para sempre com «a
   * escola/ciclo já existe», que é a razão de o manifesto sair junto. */
  const sozinha = repo.manifestoQueSeApaga(
    ARVORE.filter((c) => !c.includes('-breu')),
    { slug: 'batata', professor: 'dedao-aberto', ciclo: '01' });
  conferir('CONTROLE: sem outra escola no ciclo, a base SAI com ela',
    sozinha.manifesto.join(',') === 'professores/dedao-aberto/ciclos/ciclo-01.conf', sozinha);

  /* O CICLO 02 NÃO SEGURA O MANIFESTO DO 01. Sem esta asserção, «sobrou alguma coisa na pasta»
   * degeneraria em «sobra sempre», e o manifesto nunca mais sairia. */
  const doisCiclos = ARVORE.filter((c) => !c.includes('-breu'))
    .concat(['professores/dedao-aberto/ciclos/ciclo-02-batata.conf']);
  const porCiclo = repo.manifestoQueSeApaga(doisCiclos,
    { slug: 'batata', professor: 'dedao-aberto', ciclo: '01' });
  conferir('uma escola do mesmo professor no ciclo 02 não segura a base do ciclo 01',
    porCiclo.manifesto.join(',') === 'professores/dedao-aberto/ciclos/ciclo-01.conf', porCiclo);
}

// ---------------------------------------------------------------- B. o que é de quem

console.log('\nB. Os arquivos da outra escola são relatados como DELA, e não como «do professor»');

if (!tem('classificarPreservados')) {
  conferir('existe `classificarPreservados` — o relato do que sobrou', false, 'não existe');
} else {
  const relato = repo.classificarPreservados(ARVORE, 'dedao-aberto', 'batata');
  conferir('o `ciclo-01-breu.conf` é «de outra escola»',
    relato.deOutrasEscolas.some((c) => c.includes('ciclo-01-breu.conf')), relato.deOutrasEscolas);
  conferir('…e não entra na lista do professor (caderno, relatório, perfil)',
    !relato.doProfessor.some((c) => c.includes('ciclo-01-breu')), relato.doProfessor);
  conferir('o que é mesmo do professor continua classificado como dele',
    relato.doProfessor.includes('professores/dedao-aberto/cadernos/ciclo-01/nota.md') &&
    relato.doProfessor.includes('professores/dedao-aberto/perfil.json'), relato.doProfessor);
}

// ---------------------------------------------------------------- C. o shard não é escola

console.log('\nC. A varredura: o shard sai da lista, e as escolas que vivem nele entram');

const slugs = (lista) => lista.map((e) => e.slug).join(',');

const sabendo = repo.escolasDosCaminhos(ARVORE, { shards: SHARDS });
conferir('as duas escolas do shard entram na lista, e o shard NÃO',
  slugs(sabendo) === 'batata,breu', slugs(sabendo));
const semSaber = repo.escolasDosCaminhos(ARVORE);
conferir('sem a lista de shards, o shard aparece como se fosse mais uma escola',
  slugs(semSaber).split(',').includes('lastro-teste'), slugs(semSaber));

/* O ELO SOZINHO NÃO FAZ UMA ESCOLA VIVA. O expurgo preserva `escola/<slug>/indice.json` como
 * memória; uma lista que olhasse só para ele ofereceria para apagar tudo o que já foi apagado. */
const soElo = ['wrangler.lastro-teste.jsonc', 'escola/zumbi/indice.json'];
conferir('o elo de uma escola expurgada, sem arquivo nenhum, NÃO vira escola na lista',
  repo.escolasDosCaminhos(soElo, { shards: SHARDS }).length === 0,
  slugs(repo.escolasDosCaminhos(soElo, { shards: SHARDS })));

// A RAIZ CONTINUA FORA, e é a regra mais antiga desta varredura.
conferir('a raiz `danca` não é escola',
  repo.NAO_ESCOLAS.has('danca'), [...repo.NAO_ESCOLAS]);

// ---------------------------------------------------------------- D. o expurgo local diz o mesmo

console.log('\nD. A metade LOCAL já estava certa — a regra é a dela');

const local = fs.readFileSync(path.join(RAIZ, 'escola/expurgar.js'), 'utf8');
conferir('o `escola/expurgar.js` decide a base pelo que RESTOU NA PASTA, e não por quem tem Worker',
  /const restam = fs\.readdirSync\(base\)/.test(local) && /outraEscola/.test(local), null);

console.log('');
if (referencia) {
  console.log('CONTROLE NEGATIVO: ' + ok + ' passaram, ' + ko + ' falharam — o defeito de '
    + referencia + ' tem de aparecer como FALHA acima.');
  // No controle, o que se espera é que as asserções da regra nova FALHEM. Passar tudo seria a
  // prova a medir-se a si mesma — o mesmo aviso que o `provar-cofre-e-shard` imprime.
  const reprovou = ko > 0;
  console.log(reprovou ? 'CONTROLE CERTO — o código de antes reprova.' : 'A PROVA NÃO PROVA NADA.');
  process.exit(reprovou ? 0 : 1);
}
console.log(ko === 0 ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
  : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
process.exit(ko === 0 ? 0 : 1);
