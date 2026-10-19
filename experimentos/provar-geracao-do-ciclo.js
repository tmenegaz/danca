#!/usr/bin/env node
'use strict';

/**
 * provar-geracao-do-ciclo.js — o disparo e o workflow apontam para o lugar certo.
 *
 * Irmã de `provar-geracao.js`, e separada por uma razão de histórico: as duas nasceram do
 * mesmo pedido (19/10/2026), mas esta metade mexe em `disparar.js`, no
 * `.github/workflows/gerar-ciclo.yml`, em `escrever-ciclo.js` e em `tools/check-pacote.js`
 * — infraestrutura que a outra metade (o aviso na tela) não toca.
 *
 * O que ela trava, e que o Actions mediu por nós:
 *
 *   1. O disparo manda DOIS slugs: `escola` (o Worker, `wrangler.<escola>.jsonc`) e `variante`
 *      (o `.conf` e o pacote). Mandar um só quebra um dos lados — a escola no lugar da variante
 *      faz o gerador ler o esqueleto (`DOCS=""`) e morrer com «DOCS está vazio»; a variante no
 *      lugar da escola faz o deploy procurar um `wrangler.<variante>.jsonc` que não existe.
 *   2. O `run-name` do workflow é, literalmente, o rótulo que a tela procura
 *      (`rotuloDaGeracao`). Sem esse acordo, a execução não é encontrada.
 *   3. O gerador recebe a variante; o deploy recebe a escola (são dois slugs).
 *   4. A declaração de captura é gravada debaixo da VARIANTE — era debaixo da escola, e a
 *      folha saía com todos os blocos e colunas sem chave («bloco da folha não declarado
 *      no schema»).
 *   5. `check-pacote.js` exige da ferramenta a `barra-de-controle`, não o `.rodape` de prosa
 *      — o template renomeou-o em `f9b416b` (18/10) e o validador continuou a cobrar o nome
 *      antigo, reprovando todo pacote gerado.
 *   6. O `git push` dos dois workflows rebaseia antes de insistir — três workflows escrevem
 *      no `main` e o «Guardar» do PO dispara mais de um em segundos.
 *
 *   node experimentos/provar-geracao-do-ciclo.js
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const ler = (p) => fs.readFileSync(path.join(RAIZ, p), 'utf8');

const { criarDisparador } = require('../motor/servidor/disparar.js');
const { varianteDoContexto } = require('../motor/servidor/escrever-po.js');
const { rotuloDaGeracao } = require('../motor/servidor/geracao.js');

let n = 0;
let falhas = 0;
const ok = (titulo) => { n += 1; console.log(`  ${String(n).padStart(2)}. ${titulo}`); };
const prova = (titulo, fn) => {
  try { fn(); ok(titulo); } catch (e) {
    n += 1; falhas += 1;
    console.log(`  ${String(n).padStart(2)}. ✗ ${titulo}\n     ${(e && e.message) || e}`);
  }
};
const provaAsync = async (titulo, fn) => {
  try { await fn(); ok(titulo); } catch (e) {
    n += 1; falhas += 1;
    console.log(`  ${String(n).padStart(2)}. ✗ ${titulo}\n     ${(e && e.message) || e}`);
  }
};

const CONTEXTO = {
  escola: 'calando-teste-1',
  professor: 'sapo-bailarino',
  ciclo: '01',
  turma: 'balé nível 1 teste 1',
};
const VARIANTE = varianteDoContexto(CONTEXTO);

// ===========================================================================
// 1. O DISPARO MANDA A VARIANTE, NÃO A ESCOLA
// ===========================================================================

console.log('\no disparo leva a variante — é ela que nomeia o .conf com as fontes');

async function oDisparo() {
  assert.equal(criarDisparador({ token: null }), null);
  ok('sem token não há disparador (o desenvolvimento não dispara nada)');

  const capturado = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, opcoes) => {
    capturado.push({ url, corpo: JSON.parse(opcoes.body) });
    return { status: 204, ok: true };
  };
  try {
    const disparar = criarDisparador({
      token: 'token-de-prova', dono: 'tmenegaz', repo: 'danca', workflow: 'gerar-ciclo.yml',
    });
    assert.equal((await disparar(CONTEXTO)).ok, true);
  } finally {
    globalThis.fetch = original;
  }

  assert.equal(capturado.length, 1);
  const envio = capturado[0];
  assert.match(envio.url, /\/actions\/workflows\/gerar-ciclo\.yml\/dispatches$/);
  ok('o alvo é o workflow que gera o ciclo');

  // DOIS SLUGS. O conteúdo é da VARIANTE; o site é da ESCOLA. Trocá-los quebra os dois lados:
  // com a escola no lugar da variante, o gerador lê o `.conf` vazio; com a variante no lugar
  // da escola, o deploy procura um `wrangler.<variante>.jsonc` que não existe.
  assert.equal(envio.corpo.inputs.escola, 'calando-teste-1');
  assert.equal(envio.corpo.inputs.variante, 'calando-teste-1-bale-nivel-1-teste-1');
  assert.equal(envio.corpo.inputs.variante, VARIANTE);
  ok('`escola` leva o slug do Worker e `variante` leva a variante do conteúdo');

  assert.equal(envio.corpo.inputs.professor, 'sapo-bailarino');
  assert.equal(envio.corpo.inputs.ciclo, '01');
  ok('o professor e o ciclo seguem intactos');

  // A PROVA NÃO DEPENDE DE ESCOLA VIVA. Antes ela abria o `.conf` de uma escola real — e o
  // expurgo dessa escola fazia a prova falhar com ENOENT, o que não é um defeito do código
  // mas do instrumento. O contrato é entre o CONTEXTO e o slug; é isso que se mede.
  assert.equal(VARIANTE, 'calando-teste-1-bale-nivel-1-teste-1');
  assert.equal(VARIANTE, [CONTEXTO.escola, 'bale-nivel-1-teste-1'].join('-'));
  ok('a variante é `<escola>-<turma>` — o nome do `.conf` e do pacote');

  // É ESTA a correção de 19/10/2026: o `.conf` que o plano compõe tem os DOCS da TURMA, e o
  // gerador procura pelo nome da variante. Mandar a escola levava-o ao esqueleto vazio.
  assert.notEqual(VARIANTE, CONTEXTO.escola);
  ok('a variante NÃO é o slug da escola — são duas identidades, e trocá-las quebra os dois lados');

  assert.equal(varianteDoContexto({ escola: 'maria', professor: 'tiago', ciclo: '01' }), 'maria');
  ok('contexto sem turma cai na escola — nada regride para as escolas de uma turma só');
}

// ===========================================================================
// 2. O ACORDO COM O WORKFLOW
// ===========================================================================

function oAcordo() {
  const yml = ler('.github/workflows/gerar-ciclo.yml');
  const linha = yml.split('\n').find((l) => l.startsWith('run-name:'));
  assert.ok(linha, 'o workflow não declara run-name');
  let nome = linha.slice('run-name:'.length).trim();
  const substituicoes = [
    [/\$\{\{\s*inputs\.professor\s*\}\}/g, CONTEXTO.professor],
    [/\$\{\{\s*inputs\.ciclo\s*\}\}/g, CONTEXTO.ciclo],
    [/\$\{\{\s*inputs\.variante\s*\|\|\s*inputs\.escola\s*\}\}/g, VARIANTE],
  ];
  for (const [padrao, valor] of substituicoes) nome = nome.replace(padrao, valor);
  assert.equal(nome, rotuloDaGeracao(CONTEXTO));
  ok('o `run-name` do workflow é, literalmente, o rótulo que a tela procura');

  assert.match(yml, /tools\/gerar-ciclo\.sh "\$\{\{ inputs\.professor \}\}" "\$\{\{ inputs\.ciclo \}\}" "\$\{\{ inputs\.variante \|\| inputs\.escola \}\}"/);
  ok('o gerador recebe a VARIANTE — o `.conf` com as fontes, não o esqueleto da escola');

  assert.match(yml, /wrangler deploy -c "wrangler\.\$\{\{ inputs\.escola \}\}\.jsonc"/);
  ok('o deploy continua a usar o Worker da ESCOLA (o `assets.directory` dela)');

  // O PUSH REBASEIA, E O `.fipp` CONFLITANTE É REGERADO — não escolhido (19/10/2026).
  //
  // O `.fipp` tem dois donos nas mesmas fontes: o `reancorar.yml` (disparado por cada
  // commit de fonte do «Guardar» do PO) e este workflow. Medido às 17:47:41: `push`
  // recusado, e o rebase morria em «CONFLICT (content): …-bale-nivel-1-teste-2.fipp».
  // Resolver o texto seria ESCOLHER entre duas âncoras; a âncora é derivada, e o certo é
  // regerá-la. Um conflito que não seja na âncora continua a falhar: dois donos do mesmo
  // CONTEÚDO é um problema de desenho, e escondê-lo aqui seria pior.
  assert.match(yml, /git fetch origin main/);
  assert.match(yml, /git rebase origin\/main/);
  assert.match(yml, /git diff --name-only --diff-filter=U/);
  assert.match(yml, /grep -qv '\\\.fipp\$'/);
  assert.match(yml, /git rebase --abort \|\| true/);
  assert.match(yml, /git checkout --theirs -- '\*\.fipp'/);
  assert.match(yml, /tools\/hash-ciclo\.sh "\$\{\{ inputs\.professor \}\}"/);
  assert.match(yml, /git commit --amend --no-edit/);
  ok('o push rebaseia, e o conflito na âncora é REGERADO (os outros continuam a falhar)');

  const reancorar = ler('.github/workflows/reancorar.yml');
  assert.match(reancorar, /git pull --rebase --autostash origin main/);
  assert.match(reancorar, /git push/);
  ok('o reancorar também rebaseia — foi ele que falhou com «fetch first» em 19/10/2026');

  // ZERO ESCOLAS NÃO É ERRO (19/10/2026). Depois de expurgar a última escola o glob não
  // acha manifesto nenhum, e o repositório sem escola é um estado LEGÍTIMO — o que existe
  // entre o expurgo e a criação da próxima. O `exit 1` pintava de vermelho um workflow sem
  // nada para fazer; foi assim que o push do expurgo da `batata` derrubou o `Reancorar`.
  assert.match(reancorar, /nenhuma escola no repositório — nada a reancorar/);
  assert.equal(/nenhum manifesto de variante encontrado[\s\S]{0,40}exit 1/.test(reancorar), false,
    'o glob vazio voltou a ser tratado como erro');
  ok('sem escola no repositório, o reancorar diz «nada a reancorar» — e não falha');

  // O CONTRATO ENTRE DOIS CONGELADOS: `lancamento.html` não tem rodapé de prosa — o
  // formulário é controle, e em `f9b416b` (18/10) o `footer.rodape` virou
  // `footer.barra-de-controle`. O validador continuou a exigir `class="rodape"` e passou a
  // reprovar todo pacote gerado, com o gerador a ter feito o trabalho.
  const checkPacote = ler('tools/check-pacote.js');
  assert.match(checkPacote, /FERRAMENTAS\.includes\(f\)[\s\S]{0,80}\['barra de controles', 'class="barra-de-controle"'\]/);
  assert.equal(/^\s*\['rodapé', 'class="rodape"'\],$/m.test(checkPacote), false,
    'o rodapé de prosa voltou a ser exigido de TODAS as páginas');
  ok('o validador exige a barra de controles da ferramenta — não o rodapé de prosa');

  const escreverCiclo = ler('motor/servidor/escrever-ciclo.js');
  assert.match(escreverCiclo, /const slug = varianteDoContexto\(ctx\)/);
  ok('a declaração de captura é gravada debaixo da VARIANTE — é lá que o gerador a procura');
}

(async () => {
  await provaAsync('o disparo leva a variante', oDisparo);
  prova('o acordo com o workflow', oAcordo);

  console.log('');
  if (falhas) {
    console.log(`${falhas} de ${n} verificações FALHARAM`);
    process.exit(1);
  }
  console.log(`TUDO CERTO — ${n} verificações`);
})();
