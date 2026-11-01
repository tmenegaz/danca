'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  gerarAulaNotacao,
  gerarAulaProsa,
  transformarExercicios,
} = require('../tools/gerar-aula-prosa.js');

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
/* O GUIA DE OBSERVAÇÃO — UM CRITÉRIO POR LINHA (01/11/2026).
 *
 * Aqui exigia-se o texto COLADO («alinhamento do pé de apoio; eixo do corpo na preparação»), e
 * ele passava porque alguém o tinha escrito À MÃO no `.md` da aula: o código punha
 * `[Preencher]` em todas as dimensões. A prova media o documento, não a geração — e por isso
 * dava verde sobre um trecho que a próxima geração apagaria. Agora mede o que importa: cada
 * critério aparece SEPARADO, que é o que a folha de captura vai pedir (a célula que juntava
 * dois critérios é o defeito que a regra do `;` veio desfazer). */
for (const criterio of [
  'alinhamento do pé de apoio',
  'eixo do corpo na preparação',
  'saída do calcanhar no tendu',
  'quadril sem subir no en dehors',
  'transferência de peso sem perder a verticalidade',
  'braço junto do movimento',
  'resposta ao pulso na marcação',
  'frase até o fim da música',
]) {
  assert(gerada.includes('| ' + criterio + ' |'),
    'o guia deve listar o critério sozinho na sua linha: ' + criterio);
}
assert(!/alinhamento do pé de apoio; eixo do corpo/.test(gerada),
  'os critérios não podem voltar a partilhar uma célula');
assert(gerada.replace(/\s+/g, ' ')
  .includes('✓ aconteceu · ~ parcial · X não aconteceu · ? não vi · vazio = não observei'),
  'a forma de registro deve corresponder à legenda da Captura para impressão');

/* A AULA É REPRODUZÍVEL — a prova que faltava (01/11/2026).
 *
 * O `.md` da aula tinha 16 linhas que o código não sabia gerar (a §5, escrita à mão). Nada o
 * dizia: o documento publicado estava certo, e a próxima geração apagava-o em silêncio. O que
 * se mede aqui é a propriedade, e não o texto: **o ficheiro em disco é exactamente o que o
 * código produz** — mesma entrada, mesma saída, byte a byte.
 *
 * A entrada são os dois envelopes em uso e a calibração do `.conf` da variante — as três coisas
 * de que a aula depende, e nenhuma delas é o próprio `.md`. */
{
  const { derivarAula01 } = require('../motor/nucleo/derivar-ciclo.js');
  const { calibracaoDoConf } = require('../motor/servidor/escrever-ciclo.js');
  const envelopes = path.join(raiz, 'escola/batata/envelopes');
  const plano = JSON.parse(fs.readFileSync(path.join(envelopes, 'plano-20261027-1025.json'), 'utf8'));
  const po = JSON.parse(fs.readFileSync(path.join(envelopes, 'po-20261027-1353.json'), 'utf8'));
  const cal = calibracaoDoConf(fs.readFileSync(path.join(ciclos,
    'ciclo-01-batata-bale-nivel-1-teste-2.conf'), 'utf8'));
  const doCodigo = derivarAula01({
    plano: { respostas: plano.respostas }, po: { respostas: po.respostas },
    contexto: { ciclo: '01', escola: 'Batata' }, calibracao: cal,
  });
  assert.strictEqual(doCodigo, aula,
    'a fonte da aula em disco tem de ser o que o código gera — se divergir, há texto à mão '
    + 'que a próxima geração apaga (foi o caso da §5 até 01/11/2026)');
  console.log('  ok    a fonte da aula é reproduzível pelo código, byte a byte');
}

const notacaoCompleta = gerarAulaNotacao(aula, notacao);
assert(notacaoCompleta.includes('## 1. Validação dos objetivos, métricas e duração')
  && notacaoCompleta.includes('## 5. Guia de observação do professor'),
  'a leitura de Notação deve incluir a estrutura comum da Aula');
// A CATEGORIA MUDOU DE `Plié` PARA `Perna` (01/11/2026): plié não é parte do corpo — é o
// exercício —, e a categoria do trecho diz que parte se move. O bloco compõe-se da categoria e
// dos sinais, e por isso a string esperada mudou com ela.
assert(notacaoCompleta.includes('| Compasso | Contagem | Notação | Descrição |')
  && notacaoCompleta.includes('[Perna: 1ª ↓]'),
  'a leitura de Notação deve acrescentar a coluna e os sinais Benesh');
assert(notacaoCompleta.includes('glossario-href: "glossario-benesh.html"'),
  'a leitura de Notação deve preservar o destino do Glossário');
assert(notacaoCompleta.indexOf('## 9. Próximo passo') < notacaoCompleta.indexOf('## Aviso de proveniência'),
  'o conteúdo completo da Aula deve anteceder o material específico de Notação');

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

console.log('provar-aula-prosa: 19 verificações');
