#!/usr/bin/env node
'use strict';

/*
 * provar-schemas.js — a prova de `tools/check-schemas.js`.
 *
 *   node experimentos/provar-schemas.js
 *
 * O QUE SE PROVA. A checagem existe por um defeito de 01/11/2026: o molde dos schemas ficou
 * atrás dos professores, os professores criados depois nasceram com um `required` que a
 * derivação não escreve, e a geração de um ciclo morreu em «campo ausente» — depois do PO já ter
 * passado. Uma checagem que nunca se viu a FALHAR é uma checagem que pode estar a aprovar por
 * omissão, e o modo de falha deste ficheiro é precisamente o silêncio.
 *
 * Por isso cada invariante é provada nos dois sentidos: passa quando o repositório está são, e
 * falha — com o nome certo no erro — quando lhe metemos o defeito. Os defeitos são construídos
 * numa árvore SINTÉTICA em `os.tmpdir()`, e não no repositório: uma prova não pode depender de
 * estragar as fontes.
 *
 * A bancada é mínima de propósito: o `check-schemas.js` só lê `modelo/ciclos/` e
 * `professores/<slug>/ciclos/`, e uma árvore de dois professores mede a mesma coisa que a de
 * dezoito — depressa.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const CHECADOR = path.join(RAIZ, 'tools', 'check-schemas.js');

const SUFIXOS = ['schema', 'po-schema', 'plano-schema', 'aula-schema', 'captura-schema'];

// O CONTRATO EM VIGOR, escrito uma vez: é o que `modelo/ciclos/ciclo-01-plano-schema.json`
// declara hoje, e o que qualquer defeito abaixo tem de contradizer.
const REQUIRED = {
  'schema': ['CICLO', 'ESCOLA'],
  'po-schema': ['question', 'phenomenon'],
  'plano-schema': ['objetivoGeral', 'marcosPorAula', 'proveniencia'],
  'aula-schema': ['identificacao'],
  'captura-schema': ['escola', 'ciclo', 'aula', 'folha', 'blocos'],
};

let falhas = 0;
function provar(nome, condicao, extra) {
  if (!condicao) falhas += 1;
  console.log((condicao ? 'ok     ' : 'FALHA  ') + nome +
    (extra !== undefined ? ' → ' + JSON.stringify(extra) : ''));
}

/** Um schema de mentira, com o `required` que lhe mandarem e um `description` próprio. */
function schema(required, descricao) {
  return JSON.stringify({
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    description: descricao || 'fixture',
    properties: Object.fromEntries(required.map((c) => [c, { type: 'string' }])),
    required: required.slice(),
    additionalProperties: true,
  }, null, 2) + '\n';
}

/**
 * A árvore sintética.
 *
 * `defeitos` é um mapa `caminho-relativo → {required?, descricao?}`, e é por ele que cada caso
 * se constrói. A `captura-schema` nasce DIFERENTE em cada professor de propósito: é a excepção
 * declarada, e a prova tem de mostrar que ela continua a passar.
 */
function montar(defeitos) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'schemas-'));
  const escrever = (relativo, conteudo) => {
    const alvo = path.join(raiz, relativo);
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.writeFileSync(alvo, conteudo);
  };
  const profs = ['ana', 'bruno'];
  for (const s of SUFIXOS) {
    // NOS QUATRO GENÉRICOS, A CÓPIA É BYTE A BYTE — é isso que o molde entrega a um professor
    // novo, e é isso que a checagem exige. Só a captura se distingue, e de propósito.
    escrever('modelo/ciclos/ciclo-01-' + s + '.json', schema(REQUIRED[s], 'contrato'));
    for (const p of profs) {
      const descricao = s === 'captura-schema' ? 'variantes da escola de ' + p : 'contrato';
      escrever('professores/' + p + '/ciclos/ciclo-01-' + s + '.json', schema(REQUIRED[s], descricao));
    }
  }
  for (const [relativo, mudanca] of Object.entries(defeitos || {})) {
    const alvo = path.join(raiz, relativo);
    const atual = JSON.parse(fs.readFileSync(alvo, 'utf8'));
    if (mudanca.required) atual.required = mudanca.required;
    if (mudanca.descricao !== undefined) atual.description = mudanca.descricao;
    fs.writeFileSync(alvo, JSON.stringify(atual, null, 2) + '\n');
  }
  // O `check-schemas.js` resolve a raiz a partir do próprio ficheiro (`__dirname/..`) e o MÓDULO
  // dos schemas a partir do seu — por isso os dois vão junto com a árvore: é a mesma função, a
  // medir outra árvore. Sem o módulo, a checagem não carregava; e é ele que faz a árvore
  // sintética valer como árvore (os `require` são relativos a `motor/nucleo/`).
  fs.mkdirSync(path.join(raiz, 'tools'), { recursive: true });
  fs.mkdirSync(path.join(raiz, 'motor', 'nucleo'), { recursive: true });
  fs.copyFileSync(CHECADOR, path.join(raiz, 'tools', 'check-schemas.js'));
  fs.copyFileSync(path.join(RAIZ, 'motor', 'nucleo', 'schemas.js'),
    path.join(raiz, 'motor', 'nucleo', 'schemas.js'));
  return raiz;
}

/** Corre o checador numa árvore e devolve `{codigo, saida}` — nunca lança: o 1 é resposta. */
function correr(raiz, argumentos) {
  try {
    const saida = execFileSync(process.execPath, [path.join(raiz, 'tools', 'check-schemas.js')]
      .concat(argumentos || []), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { codigo: 0, saida };
  } catch (e) {
    return { codigo: e.status == null ? 1 : e.status, saida: String(e.stdout || '') + String(e.stderr || '') };
  }
}

const árvores = [];
function comArvore(defeitos, fazer) {
  const raiz = montar(defeitos);
  árvores.push(raiz);
  return fazer(raiz);
}

// ---------------------------------------------------------------------------------------
console.log('1. O REPOSITÓRIO, COMO ESTÁ');
// ---------------------------------------------------------------------------------------
{
  // A árvore real, não a sintética: o que se prova primeiro é que o repositório de hoje passa —
  // se este caso falhar, o defeito está nas fontes e não na checagem.
  const r = correr(RAIZ);
  provar('o repositório de hoje passa (molde e professores concordam)', r.codigo === 0, r.saida.split('\n').slice(-2));
  provar('…e diz que conferiu os cinco schemas',
    (r.saida.match(/^ok {5}/gm) || []).length >= 5, (r.saida.match(/^ok {5}/gm) || []).length);
}

// ---------------------------------------------------------------------------------------
console.log('\n2. O DEFEITO DE HOJE: O MOLDE ATRASADO');
// ---------------------------------------------------------------------------------------
comArvore({ 'modelo/ciclos/ciclo-01-plano-schema.json': { required: ['objetivoGeral', 'ciclo', 'marcosPorAula', 'rubrica', 'proveniencia'] } }, (raiz) => {
  const r = correr(raiz);
  provar('o molde atrasado é RECUSADO', r.codigo === 1, r.codigo);
  provar('…e o erro nomeia o molde como a fonte, e não os professores',
    /Alinhe modelo\/ciclos\/ciclo-01-plano-schema\.json com ana\/ciclo-01/.test(r.saida),
    (r.saida.match(/^FALHA.*plano-schema.*$/m) || [''])[0].slice(0, 240));
  provar('…e cita os dois campos que partiram a geração («ciclo» e «rubrica»)',
    /ciclo/.test(r.saida) && /rubrica/.test(r.saida), null);
  // E A GERAÇÃO DE UM PROFESSOR CERTO NÃO É BLOQUEADA POR ISSO: o filtro é a pergunta do
  // gerador, e a resposta para a `ana` é «o contrato dela está em vigor».
  const filtrado = correr(raiz, ['--professor', 'ana']);
  provar('…mas o professor cujo contrato está em vigor passa, com o filtro',
    filtrado.codigo === 0, filtrado.saida.split('\n').slice(-2));
});

// ---------------------------------------------------------------------------------------
console.log('\n3. O DEFEITO DO OUTRO LADO: UM PROFESSOR ATRASADO');
// ---------------------------------------------------------------------------------------
comArvore({ 'professores/bruno/ciclos/ciclo-01-plano-schema.json': { required: ['objetivoGeral', 'ciclo', 'marcosPorAula', 'rubrica', 'proveniencia'] } }, (raiz) => {
  const r = correr(raiz);
  provar('o professor atrasado é recusado', r.codigo === 1, r.codigo);
  provar('…e o erro diz QUAL professor', /bruno\/ciclo-01/.test(r.saida) && !/ana\/ciclo-01/.test(r.saida),
    r.saida.split('\n')[0].slice(0, 200));
  const doBruno = correr(raiz, ['--professor', 'bruno']);
  provar('com o filtro, ele é recusado — é ele que não gera', doBruno.codigo === 1, doBruno.codigo);
  const daAna = correr(raiz, ['--professor', 'ana']);
  provar('e a outra professora passa: o defeito de um não bloqueia a geração de outro',
    daAna.codigo === 0, daAna.saida.split('\n').slice(-2));
});

// ---------------------------------------------------------------------------------------
console.log('\n4. A DERIVA QUE O `required` NÃO APANHA');
// ---------------------------------------------------------------------------------------
comArvore({ 'professores/ana/ciclos/ciclo-01-aula-schema.json': { descricao: 'edição à mão' } }, (raiz) => {
  const r = correr(raiz);
  provar('um schema genérico editado num professor é recusado mesmo com o `required` igual',
    r.codigo === 1, r.codigo);
  provar('…e o erro diz que é deriva, e não declaração',
    /deriva, não declaração/.test(r.saida), null);
});

// ---------------------------------------------------------------------------------------
console.log('\n5. A EXCEPÇÃO DECLARADA: A CAPTURA');
// ---------------------------------------------------------------------------------------
comArvore({}, (raiz) => {
  const r = correr(raiz);
  // A `captura-schema` da fixture DIFERE entre os professores (cada um declara a sua escola) e
  // o `required` é o mesmo: tem de passar. Se um dia alguém «arrumar» a excepção, é aqui que se
  // vê — e o erro diria para alinhar com o molde, o que apagaria a declaração de cada escola.
  provar('a captura difere por escola e passa (a excepção é declarada)',
    r.codigo === 0 && /captura-schema: não se compara byte a byte/.test(r.saida), r.saida.split('\n').slice(-2));
});
comArvore({ 'professores/bruno/ciclos/ciclo-01-captura-schema.json': { required: ['escola'] } }, (raiz) => {
  const r = correr(raiz);
  provar('…mas o `required` dela TAMBÉM é conferido', r.codigo === 1 && /captura-schema/.test(r.saida),
    r.saida.split('\n')[0].slice(0, 160));
});

// ---------------------------------------------------------------------------------------
console.log('\n6. UM PROFESSOR SEM SCHEMAS É DITO, E NÃO IGNORADO');
// ---------------------------------------------------------------------------------------
comArvore({}, (raiz) => {
  fs.mkdirSync(path.join(raiz, 'professores', 'carla', 'ciclos'), { recursive: true });
  const r = correr(raiz, ['--professor', 'carla']);
  provar('pedir um professor sem schemas é recusado com o nome dele',
    r.codigo === 1 && /carla/.test(r.saida), r.saida.split('\n')[0].slice(0, 160));
});

// ---------------------------------------------------------------------------------------
// A SECÇÃO 7 É ASSÍNCRONA porque chama o provisionador do Worker, que devolve uma promessa. O
// ficheiro é CommonJS (os `require` do topo), e um `await` solto no topo faz o Node recusar o
// módulo — «both require() and top-level await are present». Por isso ela é uma função, chamada
// no fim, e é ela que fecha a prova.
async function secaoSete() {
console.log('\n7. UMA LEITURA SÓ: O MÓDULO, O CLI E O WORKER');
// ---------------------------------------------------------------------------------------
//
// É a razão de ser de tudo isto (01/11/2026). Havia DUAS maneiras de ler o molde — o `cp` do
// `criar-escola.sh` e um `GET` por schema no provisionador do Worker —, e duas maneiras de ler a
// mesma coisa são duas coisas. O que se prova aqui não é «escreve bem»: é que **as três portas
// escrevem o mesmo conteúdo**, e que nenhuma delas lê o molde da rede.
{
  const schemas = require(path.join(RAIZ, 'motor', 'nucleo', 'schemas.js'));

  // (a) o módulo e o molde em DISCO dizem o mesmo — o `require` aponta para onde se pensa.
  const doDisco = {};
  for (const s of SUFIXOS) {
    doDisco[s] = JSON.parse(fs.readFileSync(path.join(RAIZ, 'modelo', 'ciclos', 'ciclo-01-' + s + '.json'), 'utf8'));
  }
  provar('o módulo serve o conteúdo que está em modelo/ciclos/ (o `require` não aponta para outro sítio)',
    SUFIXOS.every((s) => JSON.stringify(schemas.dados(s)) === JSON.stringify(doDisco[s])), null);
  provar('…e serve-o como texto canónico, que volta a ler-se no mesmo objeto',
    SUFIXOS.every((s) => JSON.stringify(JSON.parse(schemas.texto(s))) === JSON.stringify(doDisco[s])), null);

  // (b) o CLI escreve esses cinco, com o número do ciclo no NOME e não no conteúdo.
  const raiz = montar({});
  árvores.push(raiz);
  // O CLI é o do repositório, a apontar para a árvore — a mesma função que o `criar-escola.sh`
  // chama, e não uma cópia dela.
  const correCli = (args) => {
    try {
      return { codigo: 0, saida: execFileSync(process.execPath,
        [path.join(RAIZ, 'tools', 'gerar-schemas.js')].concat(args), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
    } catch (e) {
      return { codigo: e.status == null ? 1 : e.status, saida: String(e.stdout || '') + String(e.stderr || '') };
    }
  };
  const criou = correCli(['--professor', 'ana', '--ciclo', '02', '--raiz', raiz]);
  provar('o CLI escreve os cinco na pasta do professor', criou.codigo === 0, criou.saida.split('\n').slice(-1));
  const escritos = SUFIXOS.map((s) => path.join(raiz, 'professores', 'ana', 'ciclos', 'ciclo-02-' + s + '.json'));
  // O NÚMERO DO CICLO ENTRA NO NOME, E NUNCA NO CONTEÚDO — nem no molde. Se o gerador escrevesse
  // `modelo/ciclos/ciclo-02-*`, estaria a inventar um molde por ciclo para dizer o mesmo.
  provar('…no destino com o ciclo de verdade, e nenhum molde novo criado',
    escritos.every((p) => fs.existsSync(p)) &&
    !SUFIXOS.some((s) => fs.existsSync(path.join(raiz, 'modelo', 'ciclos', 'ciclo-02-' + s + '.json'))), null);
  provar('…e o conteúdo é o do módulo (as duas portas não podem divergir)',
    SUFIXOS.every((s) => JSON.stringify(JSON.parse(
      fs.readFileSync(path.join(raiz, 'professores', 'ana', 'ciclos', 'ciclo-02-' + s + '.json'), 'utf8')))
      === JSON.stringify(schemas.dados(s))), null);

  // (c) o CLI NÃO sobrescreve: um schema que existe é do professor (a regra da proveniência).
  const antes = fs.readFileSync(escritos[0], 'utf8');
  fs.writeFileSync(escritos[0], '{"doProfessor":true}\n');
  const segunda = correCli(['--professor', 'ana', '--ciclo', '02', '--raiz', raiz]);
  provar('a segunda passagem não toca no que já existe (é do professor)',
    segunda.codigo === 0 && fs.readFileSync(escritos[0], 'utf8') === '{"doProfessor":true}\n', segunda.saida.split('\n').slice(-1));
  provar('…e `--forcar` reescreve, dizendo que reescreveu',
    correCli(['--professor', 'ana', '--ciclo', '02', '--raiz', raiz, '--forcar']).codigo === 0 &&
    fs.readFileSync(escritos[0], 'utf8') === schemas.texto('schema'), antes.length);
  fs.writeFileSync(escritos[0], antes);

  // (d) o Worker: sem rede para o molde, e com o mesmo conteúdo. É a porta que mais importa —
  //     é ela que provisiona quem NÃO criou a escola, e era ela que fazia cinco `GET`s.
  const { garantirSchemasDoCiclo } = require(path.join(RAIZ, 'motor', 'servidor', 'schemas-do-ciclo.js'));
  const leituras = [];
  const escritas = new Map();
  const fetchFalso = async (url, opcoes) => {
    const caminho = decodeURIComponent(String(url).split('/contents/')[1] || '');
    if (!opcoes || opcoes.method === 'GET' || !opcoes.method) {
      leituras.push(caminho);
      return { status: 404, json: async () => ({}) };
    }
    escritas.set(caminho, Buffer.from(JSON.parse(opcoes.body).content, 'base64').toString('utf8'));
    return { status: 201, json: async () => ({}) };
  };
  const doWorker = await garantirSchemasDoCiclo({
    token: 'x', dono: 'd', repo: 'r', professor: 'bruno', ciclo: '03', fetchImpl: fetchFalso,
  });
  provar('o provisionador do Worker escreve os cinco', doWorker.ok && doWorker.criados.length === 5, JSON.stringify(doWorker.erros));
  provar('…sem UM único pedido ao molde (o conteúdo vem do módulo, não da rede)',
    !leituras.some((c) => c.indexOf('modelo/') === 0), leituras);
  provar('…e com o MESMO conteúdo que o CLI escreveu — uma leitura, duas portas',
    SUFIXOS.every((s) => {
      const daRede = escritas.get('professores/bruno/ciclos/ciclo-03-' + s + '.json');
      return daRede !== undefined &&
        JSON.stringify(JSON.parse(daRede)) === JSON.stringify(doDisco[s]);
    }), null);

// ---------------------------------------------------------------------------------------
// 8. O SCAFFOLDER INTEIRO: `criar-escola.sh` de ponta a ponta
// ---------------------------------------------------------------------------------------
//
// A porta do bash não pode ficar provada só pelo CLI: o que mudou foi o SCRIPT — o `cp` saiu e no
// seu lugar entrou a chamada. Uma árvore temporária com o que o scaffolder lê (`tools`, `modelo`,
// `motor`, `biblioteca`, `porta`), uma escola inventada, e o que se mede é o que ele escreveu.
console.log('\n8. O SCAFFOLDER: criar-escola.sh escreve os schemas do molde');
{
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-'));
  árvores.push(raiz);
  for (const pasta of ['tools', 'modelo', 'motor', 'biblioteca', 'porta']) {
    fs.cpSync(path.join(RAIZ, pasta), path.join(raiz, pasta), { recursive: true });
  }
  const r = spawnSync('bash', ['tools/criar-escola.sh',
    '--professor', 'prova-scaffold', '--professor-nome', 'Prova Scaffold',
    '--escola', 'escolaprova', '--escola-nome', 'Escola Prova',
    '--responsavel', 'Prova', '--ciclo', '01', '--frequencia', '2x/semana',
    '--dias', '2@19:00,4@19:00', '--data-inicio', '01/03/2027', '--nao-interativo',
  ], { cwd: raiz, encoding: 'utf8' });
  provar('o scaffolder termina sem erro', r.status === 0,
    { status: r.status, fim: String(r.stderr || r.stdout).split('\n').slice(-3) });

  const pasta = path.join(raiz, 'professores', 'prova-scaffold', 'ciclos');
  const escritos = SUFIXOS.map((s) => path.join(pasta, 'ciclo-01-' + s + '.json'));
  provar('…e escreve os cinco schemas na pasta do professor novo',
    escritos.every((p) => fs.existsSync(p)), escritos.map((p) => path.basename(p)));
  provar('…com o conteúdo do molde — a porta do bash e a do Worker não divergem',
    SUFIXOS.every((s) => {
      const a = JSON.parse(fs.readFileSync(path.join(pasta, 'ciclo-01-' + s + '.json'), 'utf8'));
      const b = JSON.parse(fs.readFileSync(path.join(RAIZ, 'modelo', 'ciclos', 'ciclo-01-' + s + '.json'), 'utf8'));
      return JSON.stringify(a) === JSON.stringify(b);
    }), null);

  // A REGRA DA PROVENIÊNCIA, no script: uma segunda passagem não reescreve o que já existe.
  const alvo = path.join(pasta, 'ciclo-01-plano-schema.json');
  fs.writeFileSync(alvo, '{"doProfessor":true}\n');
  const r2 = spawnSync('bash', ['tools/criar-escola.sh',
    '--professor', 'prova-scaffold', '--professor-nome', 'Prova Scaffold',
    '--escola', 'escolaprova2', '--escola-nome', 'Escola Prova 2',
    '--responsavel', 'Prova', '--ciclo', '01', '--frequencia', '2x/semana',
    '--dias', '2@19:00,4@19:00', '--data-inicio', '01/03/2027', '--nao-interativo',
  ], { cwd: raiz, encoding: 'utf8' });
  provar('a segunda escola do mesmo professor não reescreve o schema que já existe',
    r2.status === 0 && fs.readFileSync(alvo, 'utf8') === '{"doProfessor":true}\n',
    { status: r2.status, ficou: fs.readFileSync(alvo, 'utf8').slice(0, 40) });
}
}

}

// ---------------------------------------------------------------------------------------
secaoSete().then(() => {
  for (const raiz of árvores) fs.rmSync(raiz, { recursive: true, force: true });
  console.log('\nprovar-schemas: ' + (falhas === 0
    ? 'TUDO CERTO — o molde atrasado, o professor atrasado e a deriva de conteúdo reprovam; ' +
      'a excepção da captura passa; o módulo, o CLI e o molde dizem a mesma coisa.'
    : falhas + ' FALHA(S)'));
  process.exit(falhas ? 1 : 0);
}).catch((e) => {
  for (const raiz of árvores) fs.rmSync(raiz, { recursive: true, force: true });
  console.error('provar-schemas: a prova rebentou em vez de reprovar — ' + (e && e.message ? e.message : e));
  process.exit(1);
});
