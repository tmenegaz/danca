#!/usr/bin/env node
'use strict';

/*
 * provar-declaracao-da-captura.js — a declaração da captura mora com a VARIANTE, não com o molde.
 *
 * O DEFEITO DE CASA, e ele estava escrito no próprio código: `_declaracao.porVariante` (o par
 * rótulo ↔ chave e o tipo de cada coluna da folha) vivia dentro do
 * `professores/<prof>/ciclos/ciclo-NN-captura-schema.json` — que é uma CÓPIA do molde e que o
 * expurgo PRESERVA de propósito («os schemas não se apagam, são o modelo de que nasce escola
 * nova»). Dado de ESCOLA num ficheiro que sobrevive à escola. Custou uma geração: a `batata`
 * parou a 20/10/2026, quando a entrada de uma ronda antiga sobreviveu ao expurgo e contradisse o
 * PO novo («coluna da folha não declarada no schema»). O remédio de então foi um merge; o
 * remédio certo é a casa.
 *
 * Reproduzido no repositório limpo de 07/11/2026: todos os vinte professores carregavam as
 * variantes `diaghilev` e `maria`, de escolas que já não existiam — e o PRÓPRIO MOLDE carregava
 * `diaghilev` e `maria`, que passavam a toda escola nova.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. O CAMINHO — a declaração de uma variante é um arquivo ao lado das fontes dela, e é um
 *      caminho que o EXPURGO reconhece (`escolaDosCaminhos`), logo sai com a escola;
 *   B. O MOLDE É MOLDE — nem o `modelo/` nem o schema de nenhum professor declara variante, e os
 *      schemas dos professores dizem o mesmo que o molde (é o que o `check-schemas.js` confere);
 *   C. O VALIDADOR LÊ O ARQUIVO — com `--declaracao` as colunas saem com chave e tipo; sem ela,
 *      saem `null` e o processo reprova. O controle negativo é o schema do molde, sozinho.
 *
 *   node experimentos/provar-declaracao-da-captura.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const repo = require('../motor/servidor/repo-escola.js');
const { caminhoDaDeclaracaoDeCaptura } = require('../motor/servidor/escrever-ciclo.js');

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const lerJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const professores = () => fs.readdirSync(path.join(RAIZ, 'professores'))
  .filter((d) => fs.existsSync(path.join(RAIZ, 'professores', d, 'ciclos')))
  .sort();

// ----------------------------------------------------------------------------------- A. o caminho
function oCaminho() {
  const caminho = caminhoDaDeclaracaoDeCaptura({
    professor: 'pe-torto', ciclo: '01', escola: 'batata', turma: 'Balé Nível 1',
  });
  checar('a declaração de uma variante mora ao lado das fontes dela',
    caminho === 'professores/pe-torto/ciclos/ciclo-01-batata-bale-nivel-1-captura-declaracao.json',
    caminho);
  checar('…e o ciclo é normalizado para dois dígitos',
    caminhoDaDeclaracaoDeCaptura({ professor: 'x', ciclo: '1', escola: 'maria' })
      === 'professores/x/ciclos/ciclo-01-maria-captura-declaracao.json',
    caminhoDaDeclaracaoDeCaptura({ professor: 'x', ciclo: '1', escola: 'maria' }));

  /* O EXPURGO TEM DE A VER. É o ponto inteiro da mudança: o caminho cai na regra
   * `ehArquivoDaEscola` (`ciclo-NN-<slug>` seguido de `-`, `.`, `/` ou fim), e por isso a
   * declaração sai com a escola — ao contrário do schema, que fica. */
  const daEscola = repo.escolaDosCaminhos('batata', [
    caminho,
    'professores/pe-torto/ciclos/ciclo-01-batata-bale-nivel-1-captura-declaracao.json',
  ]);
  checar('…e o expurgo reconhece-a como arquivo da escola (sai com ela)',
    daEscola.arquivos.includes(caminho), daEscola.arquivos);
  checar('…e o SCHEMA de captura NÃO é arquivo da escola (fica, é o molde)',
    !repo.escolaDosCaminhos('batata', ['professores/pe-torto/ciclos/ciclo-01-captura-schema.json'])
      .arquivos.length, 'o schema foi apanhado pela regra do expurgo');
}

// ------------------------------------------------------------------------------- B. o molde limpo
function oMolde() {
  const molde = lerJson(path.join(RAIZ, 'modelo/ciclos/ciclo-01-captura-schema.json'));
  checar('o MOLDE não declara variante nenhuma',
    !(molde._declaracao && molde._declaracao.porVariante), molde._declaracao && Object.keys(molde._declaracao));
  checar('…e continua a declarar o vocabulário dos tipos (o que é do contrato)',
    Boolean(molde._declaracao && molde._declaracao.tipos && molde._declaracao.tipos.rubrica));

  const sujos = [];
  for (const p of professores()) {
    const f = path.join(RAIZ, 'professores', p, 'ciclos', 'ciclo-01-captura-schema.json');
    if (!fs.existsSync(f)) continue;
    const d = lerJson(f);
    if (d._declaracao && d._declaracao.porVariante) sujos.push(p);
  }
  checar('nenhum schema de professor carrega declarações de variante', sujos.length === 0, sujos);

  const assinatura = (o) => JSON.stringify(o);
  const diferentes = professores().filter((p) => {
    const f = path.join(RAIZ, 'professores', p, 'ciclos', 'ciclo-01-captura-schema.json');
    return fs.existsSync(f) && assinatura(lerJson(f)) !== assinatura(molde);
  });
  checar('…e o schema de captura de cada professor diz o MESMO que o molde', diferentes.length === 0, diferentes);
}

// ------------------------------------------------------------------------------ C. o validador lê
function oValidador() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'declaracao-'));
  try {
    const FOLHA = [
      '---', 'escola: Batata', 'ciclo: "01"', 'aula: "01"', '---', '',
      '## Bloco 1 — Técnica', '',
      '| Aluna | Eixo do corpo |',
      '|:--|:--|',
      '| Aluna A |  |',
      '',
    ].join('\n');
    const DECLARACAO = {
      escola: 'Batata',
      blocos: {
        'Bloco 1 — Técnica': {
          chave: 'tecnica', rotulo: 'Técnica', grao: 'aluna',
          colunas: { 'Eixo do corpo': { chave: 'eixo_do_corpo', tipo: 'rubrica' } },
        },
      },
    };
    const folha = path.join(dir, 'folha.md');
    const declaracao = path.join(dir, 'declaracao.json');
    fs.writeFileSync(folha, FOLHA);
    fs.writeFileSync(declaracao, JSON.stringify(DECLARACAO, null, 2) + '\n');
    const schema = path.join(RAIZ, 'modelo/ciclos/ciclo-01-captura-schema.json');
    const VALIDADOR = path.join(RAIZ, 'tools/validar-captura-ciclo.js');

    const correr = (extra) => {
      try {
        const saida = execFileSync(process.execPath, [VALIDADOR, schema, folha, '--variante', 'prova']
          .concat(extra, ['--json']), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
        return { codigo: 0, json: JSON.parse(saida) };
      } catch (e) {
        const texto = String((e.stdout || ''));
        let json = null;
        try { json = JSON.parse(texto); } catch { json = null; }
        return { codigo: e.status === undefined ? 1 : e.status, json };
      }
    };
    const chaves = (r) => (r.json && r.json.blocos ? r.json.blocos.flatMap((b) => (b.colunas || [])
      .map((c) => c.chave)) : []);

    const comArquivo = correr(['--declaracao', declaracao]);
    checar('com `--declaracao`, o validador aceita a folha', comArquivo.codigo === 0, comArquivo.codigo);
    checar('…e as colunas saem com a CHAVE declarada', chaves(comArquivo).join(',') === 'eixo_do_corpo',
      chaves(comArquivo));

    // O CONTROLE NEGATIVO: o schema do molde, sozinho, não sabe nada desta variante.
    const semArquivo = correr([]);
    checar('sem `--declaracao` e sem declaração no schema, as colunas saem SEM chave',
      chaves(semArquivo).every((c) => c === null), chaves(semArquivo));
    checar('…e o validador REPROVA (a chave é o que a marca grava)', semArquivo.codigo !== 0, semArquivo.codigo);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

oCaminho();
oMolde();
oValidador();

console.log('');
if (falhas) {
  console.log('FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).');
  process.exit(1);
}
console.log('TUDO CERTO — ' + n + ' asserções: a declaração da captura mora com a VARIANTE (e o'
  + ' expurgo leva-a com a escola), o molde e os schemas dos professores voltaram a ser o mesmo'
  + ' contrato, e o validador lê o arquivo — com o controle negativo do schema sozinho.');
