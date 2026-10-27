'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { gerarAulaProsa, transformarExercicios } = require('../tools/gerar-aula-prosa.js');

const raiz = path.join(__dirname, '..');
const ciclos = path.join(raiz, 'professores/perna-boa/ciclos');
const aula = fs.readFileSync(path.join(ciclos,
  'ciclo-01-batata-bale-nivel-1-teste-2-aula-01.md'), 'utf8');
const notacao = fs.readFileSync(path.join(ciclos,
  'ciclo-01-batata-bale-nivel-1-teste-2-notacao.md'), 'utf8');
const gerada = gerarAulaProsa(aula, notacao);
const secao = gerada.slice(gerada.indexOf('## Exercícios da Aula 01'));

assert(gerada.startsWith(aula.trimEnd()), 'a fonte da aula deve permanecer no início');
assert(secao.startsWith('## Exercícios da Aula 01'));
const tabelasDaFonte = (notacao.match(/^\| Compasso \| Contagem \| Notação \| Descrição \|$/gm) || []).length;
assert(tabelasDaFonte > 0, 'a fonte deve declarar ao menos uma tabela detalhada');
assert.strictEqual((secao.match(/^\| Compasso \| Contagem \| Descrição \|$/gm) || []).length,
  tabelasDaFonte, 'todas as tabelas devem conservar compasso, contagem e descrição');
assert(!/^\| Compasso \| Contagem \| Notação \|/m.test(secao),
  'a coluna de Notação não deve aparecer na leitura em prosa');
assert(secao.includes('os tempos e o compasso ainda não estão declarados no plano'),
  'a lacuna explícita da descrição deve ser preservada');
assert(!secao.includes('[Preencher: descrição em prosa]'),
  'a descrição existente não deve ser substituída por uma lacuna');

const fallback = transformarExercicios([
  '## Exercícios da Aula 02',
  '',
  '| Exercício | Registro |',
  '|:--|:--|',
  '| Plié | [Preencher: notação do exercício] |',
].join('\n'));
assert(fallback.includes('| Exercício | Descrição |'));
assert(fallback.includes('| Plié | [Preencher: descrição em prosa] |'),
  'quando a fonte só oferece o registro, a descrição ausente deve continuar explícita');

assert.throws(() => transformarExercicios([
  '## Exercícios da Aula 03',
  '',
  '| Compasso | Contagem | Notação | Descrição | Extra |',
  '|:--|:--|:--|:--|:--|',
  '| 1 | 1 | [sinal] | descrição | x |',
].join('\n')), /Tabela de Notação não reconhecida/,
'uma tabela de Notação fora do contrato deve interromper a geração');

console.log('provar-aula-prosa: 10 verificações');
