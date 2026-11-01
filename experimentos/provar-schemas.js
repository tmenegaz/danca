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
const { execFileSync } = require('child_process');

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
  // O `check-schemas.js` resolve a raiz a partir do próprio ficheiro (`__dirname/..`), e por
  // isso a cópia do script vai junto com a árvore: é a mesma função, a medir outra árvore.
  const destino = path.join(raiz, 'tools');
  fs.mkdirSync(destino, { recursive: true });
  fs.copyFileSync(CHECADOR, path.join(destino, 'check-schemas.js'));
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
for (const raiz of árvores) fs.rmSync(raiz, { recursive: true, force: true });

console.log('\nprovar-schemas: ' + (falhas === 0
  ? 'TUDO CERTO — o molde atrasado, o professor atrasado e a deriva de bytes reprovam; a excepção da captura passa.'
  : falhas + ' FALHA(S)'));
process.exit(falhas ? 1 : 0);
