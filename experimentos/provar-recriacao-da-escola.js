#!/usr/bin/env node
'use strict';

/**
 * provar-recriacao-da-escola.js — a escola expurgada e RECRIADA não se apaga (17/10/2026).
 *
 * O que aconteceu. A `valse` foi expurgada, e o expurgo deixou o elo no índice
 * (`escola/valse/indice.json` → `expurgo[]`), de propósito: é a memória de que a escola
 * existiu. Depois a escola foi RECRIADA com o mesmo nome. O índice é o mesmo arquivo, e não é
 * reescrito — então passou a dizer, ao mesmo tempo, «expurgada» e «viva».
 *
 * O `post-merge` (a rede de segurança que limpa o expurgo na sincronização) só sabia ler a
 * primeira metade: `expurgo[]` não vazio + artefatos presentes = restos por limpar. É
 * exactamente o estado de uma escola recém-criada. O `git pull` seguinte apagou-a do disco.
 *
 * A distinção é TEMPORAL, e é a única honesta: se a recriação mais recente é posterior ao
 * expurgo mais recente, a escola está VIVA. O elo do expurgo fica (passado), o da recriação
 * diz o presente.
 *
 * O que esta prova trava:
 *
 *   1. `foiRecriada` distingue os quatro casos, e os casos de fronteira (só expurgo, só
 *      recriação, expurgo posterior, índice nulo);
 *   2. o `expurgar.js` RECUSA apagar uma escola recriada — e continua a apagar uma que não foi;
 *   3. o `post-merge` não a apanha (a guarda mora numa só definição, `foiRecriada`, e o hook a
 *      usa — uma cópia divergiria dela, e a que apaga é a que importa);
 *   4. o `criar-escola.sh` REGISTA o elo de recriação quando o índice já existe com expurgo.
 *
 *   uso: node experimentos/provar-recriacao-da-escola.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const { foiRecriada } = require(path.join(RAIZ, 'escola/expurgar.js'));

let falhas = 0;
const conferir = (nome, ok, detalhe) => {
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

// --- 1. a regra, caso a caso ------------------------------------------------
const T = (s) => s; // legibilidade
conferir('sem expurgo: não é recriação', foiRecriada({ recriacao: [{ em: T('2026-01-02T00:00:00Z') }] }) === false, 'devolveu true');
conferir('sem recriação: não é recriação', foiRecriada({ expurgo: [{ em: T('2026-01-01T00:00:00Z') }] }) === false, 'devolveu true');
conferir('expurgo DEPOIS da recriação: continua expurgada',
  foiRecriada({ expurgo: [{ em: T('2026-01-02T00:00:00Z') }], recriacao: [{ em: T('2026-01-01T00:00:00Z') }] }) === false,
  'devolveu true');
conferir('recriação DEPOIS do expurgo: está viva',
  foiRecriada({ expurgo: [{ em: T('2026-01-01T00:00:00Z') }], recriacao: [{ em: T('2026-01-02T00:00:00Z') }] }), true);
conferir('a ÚLTIMA recriação é a que conta',
  foiRecriada({
    expurgo: [{ em: T('2026-01-01T00:00:00Z') }],
    recriacao: [{ em: T('2026-01-02T00:00:00Z') }, { em: T('2026-01-03T00:00:00Z') }],
  }), true);
conferir('índice nulo não é recriação', foiRecriada(null) === false, 'devolveu true');
conferir('entradas sem data não contam',
  foiRecriada({ expurgo: [{ em: 'lixo' }], recriacao: [{ em: 'lixo' }] }) === false, 'devolveu true');
// O caso REAL: o expurgo gravou em UTC (`Z`) e a recriação em -03:00. Comparar as strings
// daria a resposta errada — é preciso comparar os INSTANTES.
conferir('fusos diferentes: compara o instante, não a string',
  foiRecriada({
    expurgo: [{ em: '2026-10-17T21:48:12.085Z' }],        // 21:48 UTC
    recriacao: [{ em: '2026-10-17T19:45:14.655-03:00' }], // 22:45 UTC — DEPOIS
  }), true);

// --- 2. o expurgar.js recusa (via CLI, num sandbox) ------------------------
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'expurgo-'));
const repoSandbox = path.join(sandbox, 'repo');
fs.mkdirSync(path.join(repoSandbox, 'escola', 'zz'), { recursive: true });
fs.mkdirSync(path.join(repoSandbox, 'professores', 'p', 'ciclos', 'ciclo-01-zz'), { recursive: true });
const escrever = (rel, txt) => {
  const p = path.join(repoSandbox, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, txt);
};
const lerIndice = () => JSON.parse(fs.readFileSync(path.join(repoSandbox, 'escola/zz/indice.json'), 'utf8'));

function rodarExpurgar() {
  try {
    const saida = execFileSync('node', ['escola/expurgar.js', 'zz'], {
      cwd: repoSandbox, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { codigo: 0, saida };
  } catch (e) {
    return { codigo: e.status || 1, saida: String(e.stdout || '') + String(e.stderr || '') };
  }
}
/**
 * `comRecriacao` significa RECRIADA DEPOIS DO EXPURGO — não «tem criação declarada».
 *
 * A DIFERENÇA CUSTOU TRÊS ASSERÇÕES (24/11/2026). O elo semeado aqui não tinha `recriacao[]`
 * nenhuma, e a auditoria da proveniência — que passou a correr antes de o expurgo apagar
 * (07/11/2026) — recusa um elo sem criação: sem ela «não se sabe quando nem por quem esta
 * encarnação nasceu». O `expurgar.js` obedecia, e a prova lia isso como «a regra da recriação
 * falhou». Toda escola de verdade tem `recriacao[]` (é a criação que a escreve); o que distingue
 * o caso que esta secção mede é a ORDEM: a criação vem antes do expurgo, e a recriação depois.
 */
function semear(comRecriacao) {
  escrever('professores/p/ciclos/ciclo-01-zz/x.html', 'x');
  escrever('professores/p/ciclos/ciclo-01-zz.conf', 'CICLO="01"\n');
  escrever('wrangler.zz.jsonc', '{}');
  const ind = {
    escola: 'zz', worker: 'zz', professor: { slug: 'p' }, ciclo: '01',
    senha: { chave: 'SENHA_ZZ' }, arquivos: [],
    // A CRIAÇÃO desta encarnação, ANTES do expurgo de 01/01/2026: a escola nasceu, e foi apagada.
    recriacao: [{ em: '2025-11-01T00:00:00Z', motivo: 'criação', professor: { slug: 'p' }, ciclo: '01' }],
    expurgo: [{ em: '2026-01-01T00:00:00Z', motivo: 'teste', apagado: [] }],
  };
  // A RECRIAÇÃO, DEPOIS do expurgo: agora há uma encarnação viva, e apagá-la destruiria o novo.
  if (comRecriacao) {
    ind.recriacao.push({ em: new Date().toISOString(), motivo: 'recriada', professor: { slug: 'p' }, ciclo: '01' });
  }
  /* A ÂNCORA, PELO DONO DA FÓRMULA (24/11/2026). A auditoria não recalcula o hash — ela CHAMA o
   * `hash-ciclo.sh --check`, que é quem o sabe fazer. Escrever aqui um `.fipp` com hashes
   * inventados dava `ancora-nao-confere`, e o motivo era a bancada, não a regra. Produz-se com a
   * mesma ferramenta que produz as âncoras a sério. */
  try {
    execFileSync('bash', ['tools/hash-ciclo.sh', 'p', '01', 'zz'], { cwd: repoSandbox, encoding: 'utf8', stdio: 'pipe' });
  } catch (erro) {
    console.log('  aviso  o `hash-ciclo` da bancada falhou: '
      + String((erro && erro.stdout) || (erro && erro.message)).slice(0, 200));
  }
  escrever('escola/zz/indice.json', JSON.stringify(ind, null, 2));
  /* O DERIVADO TAMBÉM (24/11/2026). A auditoria recusa quando `indices/` não corresponde ao elo
   * (`indexacao-pendente`) — e é isso que a regra manda: o derivado é regerado a cada mudança de
   * fonte. A bancada regera-o com a mesma ferramenta que o operador corre, em vez de escrever à
   * mão um ficheiro que só se parecesse com o derivado. */
  try {
    execFileSync('node', ['tools/gerar-indices.js'], { cwd: repoSandbox, encoding: 'utf8', stdio: 'pipe' });
    execFileSync('node', ['tools/gerar-relacoes.js'], { cwd: repoSandbox, encoding: 'utf8', stdio: 'pipe' });
  } catch (erro) {
    console.log('  aviso  o `gerar-indices` da bancada falhou: ' + String((erro && erro.stdout) || (erro && erro.message)).slice(0, 160));
  }
}
// O `expurgar.js` lê os ficheiros por caminhos absolutos da RAIZ do módulo — por isso a
// prova copia os módulos para o sandbox, em vez de os executar de fora. Desde 22/10/2026 ele
// exige a leitura do responsável do núcleo (`motor/nucleo/indices.js`), que vai junto.
fs.mkdirSync(path.join(repoSandbox, 'escola'), { recursive: true });
fs.copyFileSync(path.join(RAIZ, 'escola/expurgar.js'), path.join(repoSandbox, 'escola/expurgar.js'));
/* MOTOR E FERRAMENTAS INTEIROS, E NÃO FICHEIRO A FICHEIRO (24/11/2026).
 *
 * Aqui copiava-se `indices.js` — e só ele. Quando o `expurgar.js` passou a exigir a auditoria da
 * proveniência, esta secção começou a medir `Cannot find module`: primeiro `auditar-proveniencia`,
 * depois `indice-acervo`. Cada módulo novo custava uma linha nova aqui, e o defeito aparecia como
 * «a regra da recriação falhou» — que é o pior sintoma possível, porque manda procurar no sítio
 * errado. Agora vai a árvore de código inteira: o que esta bancada isola é o CONTEÚDO da escola,
 * não o código que o lê. */
for (const pasta of ['motor', 'tools']) {
  fs.cpSync(path.join(RAIZ, pasta), path.join(repoSandbox, pasta), { recursive: true });
}
semear(false);
const r1 = rodarExpurgar();
conferir('escola expurgada SEM recriação continua a ser apagada', r1.codigo === 0, r1.saida.slice(0, 120));
conferir('…e o pacote desapareceu',
  !fs.existsSync(path.join(repoSandbox, 'professores/p/ciclos/ciclo-01-zz')), true);

semear(true);
const r2 = rodarExpurgar();
conferir('escola RECRIADA é recusada', r2.codigo === 1, r2.codigo);
conferir('…e a recusa diz por quê', /RECRIADA/.test(r2.saida), r2.saida.slice(0, 120));
conferir('…e o pacote fica onde está',
  fs.existsSync(path.join(repoSandbox, 'professores/p/ciclos/ciclo-01-zz')), true);

// --- 3. o post-merge usa a MESMA definição ---------------------------------
const hook = fs.readFileSync(path.join(RAIZ, 'tools/hooks/post-merge'), 'utf8');
conferir('o post-merge consulta a definição única (não uma cópia da regra)',
  /require\(.*expurgar\.js.*\)\.foiRecriada/.test(hook), hook.includes('foiRecriada'));
conferir('…e salta a escola recriada', /if \(recriada\) continue;/.test(hook), false);

// --- 4. o criar-escola.sh regista o elo -----------------------------------
const criar = fs.readFileSync(path.join(RAIZ, 'tools/criar-escola.sh'), 'utf8');
conferir('o criar-escola.sh regista a recriação quando o índice já existe',
  /registrar-recriacao\.py/.test(criar), false);
conferir('…e o registrador existe e sabe recusar um índice sem expurgo',
  fs.existsSync(path.join(RAIZ, 'tools/registrar-recriacao.py')), true);
// Um índice SEM expurgo não ganha elo nenhum (escola que nunca foi expurgada).
const arqSemExpurgo = path.join(sandbox, 'sem-expurgo.json');
fs.writeFileSync(arqSemExpurgo, JSON.stringify({ escola: 'x', arquivos: [] }, null, 2));
execFileSync('python3', [path.join(RAIZ, 'tools/registrar-recriacao.py'), arqSemExpurgo], { encoding: 'utf8' });
const depois = JSON.parse(fs.readFileSync(arqSemExpurgo, 'utf8'));
conferir('um índice sem expurgo NÃO ganha elo de recriação', depois.recriacao === undefined, depois.recriacao);
// E um COM expurgo ganha.
const arqComExpurgo = path.join(sandbox, 'com-expurgo.json');
fs.writeFileSync(arqComExpurgo, JSON.stringify({
  escola: 'x', arquivos: [], expurgo: [{ em: '2026-01-01T00:00:00Z' }],
}, null, 2));
execFileSync('python3', [path.join(RAIZ, 'tools/registrar-recriacao.py'), arqComExpurgo], { encoding: 'utf8' });
const comElo = JSON.parse(fs.readFileSync(arqComExpurgo, 'utf8'));
conferir('um índice com expurgo GANHA o elo', Array.isArray(comElo.recriacao) && comElo.recriacao.length === 1,
  comElo.recriacao);
conferir('…e o expurgo do passado é PRESERVADO', comElo.expurgo.length, 1);
conferir('…e a escola volta a estar habilitada', comElo.estado && comElo.estado.habilitada, true);

// --- 5. o elo diz QUEM recriou (22/10/2026) --------------------------------
//
// O caso real: a `calango` foi expurgada e recriada com o `oculos-redondo`, e o painel dizia
// «Sapo Bailarino» — o professor da primeira criação. O elo só dizia «recriada», sem autor.
const { responsavelDoInventario, nomeDoProfessorNoInventario, construir } = require(path.join(RAIZ, 'motor/nucleo/indices.js'));

const arqComAutor = path.join(sandbox, 'com-autor.json');
fs.writeFileSync(arqComAutor, JSON.stringify({
  escola: 'calango', arquivos: [], ciclo: '01',
  professor: { slug: 'sapo-bailarino', nome: 'Sapo Bailarino' },
  expurgo: [{ em: '2026-10-22T19:54:14Z', motivo: 'x', apagado: [] }],
}, null, 2));
execFileSync('python3', [
  path.join(RAIZ, 'tools/registrar-recriacao.py'), arqComAutor,
  '--professor', 'oculos-redondo', '--professor-nome', 'Oculos Redondo',
  '--responsavel', 'Oculos Redondo', '--ciclo', '01',
], { encoding: 'utf8' });
const comAutor = JSON.parse(fs.readFileSync(arqComAutor, 'utf8'));
const eloNovo = comAutor.recriacao[comAutor.recriacao.length - 1];
conferir('o elo de recriação declara o professor que recriou',
  eloNovo.professor && eloNovo.professor.slug === 'oculos-redondo', eloNovo.professor);
conferir('…com o NOME de exibição (o diretório só tem o slug)',
  eloNovo.professor && eloNovo.professor.nome === 'Oculos Redondo', eloNovo.professor);
conferir('…e o ciclo', eloNovo.ciclo === '01', eloNovo.ciclo);
/* A REGRA MUDOU EM 27/10/2026, POR DECISÃO DA PESQUISADORA — e esta asserção dizia o contrário.
 *
 * Até aqui, o `professor` do topo era intocável («a memória de quem criou») e o elo carregava o
 * presente. Foi o suficiente para a COLUNA do painel, que lê o elo. Não foi suficiente para a
 * LISTA `professores[]`, que continuava append-only: medido no portal, a `calango` recriada em
 * 27/10 com o `murisoca-baiana` mostrou «Perna Boa → calango», um professor que só tinha os
 * schemas compartilhados na pasta.
 *
 * A decisão: a identidade do PRESENTE (o responsável e a lista) passa a ser corrigida na origem,
 * e o passado vai para o elo — `professor_anterior` e `professores_anteriores`. Assim o topo lê
 * como «quem é hoje» e nada se perde: a memória mudou de sítio, não desapareceu.
 *
 * `criado_em` continua intocável — a criação original é história, e a data que o painel mostra é
 * derivada (`quandoDaEncarnacao`, em `motor/nucleo/indices.js`). */
conferir('o `professor` do topo passa a ser quem recriou (o presente)',
  comAutor.professor.slug === 'oculos-redondo', comAutor.professor);
conferir('…e quem criou a escola fica no elo, em `professor_anterior`',
  eloNovo.professor_anterior && eloNovo.professor_anterior.slug === 'sapo-bailarino',
  eloNovo.professor_anterior);

conferir('o responsável de hoje é o do elo mais recente',
  responsavelDoInventario(comAutor).slug === 'oculos-redondo', responsavelDoInventario(comAutor));
conferir('…e o nome sai do elo, para a coluna do painel',
  nomeDoProfessorNoInventario(comAutor, 'oculos-redondo') === 'Oculos Redondo',
  nomeDoProfessorNoInventario(comAutor, 'oculos-redondo'));
conferir('um elo ANTERIOR à correção (sem professor) cai no `professor` do topo',
  responsavelDoInventario({ professor: { slug: 'p', nome: 'P' }, recriacao: [{ em: 'x' }] }).slug === 'p',
  responsavelDoInventario({ professor: { slug: 'p' }, recriacao: [{ em: 'x' }] }));

// O ÍNDICE que o painel lê: a escola VIVA é de quem a recriou, e o criador da encarnação
// anterior não aparece a «trabalhar» nela.
const indiceVivo = construir({
  arvores: [
    'wrangler.calango.jsonc',
    'escola/calango/indice.json',
    'professores/oculos-redondo/ciclos/ciclo-01-calango.conf',
    'professores/oculos-redondo/ciclos/ciclo-01-calango/index.html',
  ],
  inventarios: { calango: comAutor },
});
const escolaViva = indiceVivo.acervo.escolas.find((e) => e.slug === 'calango') || {};
conferir('a escola viva aponta para quem recriou', escolaViva.professor === 'oculos-redondo', escolaViva.professor);
conferir('…e só quem tem ciclo ali figura como professor dela',
  JSON.stringify(escolaViva.professores) === '["oculos-redondo"]', escolaViva.professores);

// A ESCOLA APAGADA continua a valer-se do ELO do expurgo — é a memória dela.
const indiceApagado = construir({
  arvores: ['escola/calango/indice.json'],
  inventarios: {
    calango: Object.assign({}, comAutor, {
      expurgo: [{
        em: '2026-10-22T19:54:14Z', motivo: 'x',
        apagado: ['professores/sapo-bailarino/ciclos/ciclo-01-calango/aula-01.html'],
      }],
    }),
  },
});
const escolaApagada = indiceApagado.acervo.escolas.find((e) => e.slug === 'calango') || {};
conferir('a escola apagada continua marcada como tal', escolaApagada.expurgada === true, escolaApagada.expurgada);
conferir('…e o elo do expurgo ainda prova quem passou por ela',
  JSON.stringify(escolaApagada.professores) === '["oculos-redondo","sapo-bailarino"]', escolaApagada.professores);

conferir('o criar-escola.sh passa o responsável ao escritor do elo',
  /registrar-recriacao\.py" "\$INDICE_ARQ"[\s\S]{0,240}--professor "\$PROFESSOR"/.test(criar), false);
conferir('o expurgar.js lê o responsável pela função do núcleo (uma definição só)',
  /require\('\.\.\/motor\/nucleo\/indices\.js'\)/.test(fs.readFileSync(path.join(RAIZ, 'escola/expurgar.js'), 'utf8')), false);

fs.rmSync(sandbox, { recursive: true, force: true });

console.log('');
console.log(falhas ? 'FALHOU: ' + falhas + ' caso(s)' : 'TODAS AS PROVAS PASSARAM');
process.exitCode = falhas ? 1 : 0;
