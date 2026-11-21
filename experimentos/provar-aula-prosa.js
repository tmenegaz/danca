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
const ciclos = path.join(raiz, 'professores/demi-plie/ciclos');
const aula = fs.readFileSync(path.join(ciclos,
  'ciclo-01-breu-rosa-aula-01.md'), 'utf8');
const notacao = fs.readFileSync(path.join(ciclos,
  'ciclo-01-breu-rosa-notacao.md'), 'utf8');
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
/* O QUE SE EXIGE DA DESCRIÇÃO, e é mais forte do que a frase de lacuna: cada descrição que a
 * notação declara tem de chegar à prosa, célula a célula. A asserção anterior procurava a frase
 * «os tempos e o compasso ainda não estão declarados no plano» — que é a lacuna de um ciclo em
 * que o plano não os declarava, e o da `breu` declara-os. Uma prova que exigisse a frase de
 * lacuna sobre um ciclo que não tem lacuna media a fixture, não a transformação. */
const descricoes = notacao.split('\n')
  .filter((l) => /^\|/.test(l) && l.split('|').length >= 6)
  .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
  .filter((c) => c.length === 4 && c[3] && !/^-+$/.test(c[3]) && !/Descrição/.test(c[3]))
  .map((c) => c[3]);
assert(descricoes.length > 0, 'a notação deve declarar descrições');
for (const d of descricoes) {
  assert(secao.includes(d), 'a descrição da notação tem de chegar à prosa: ' + d.slice(0, 60));
}
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
  /* O CRITÉRIO OCUPA UMA CÉLULA SÓ, e não precisa de ser a primeira: o guia da `breu` tem duas
   * colunas (`| Bloco | O que se observa |`), e o critério é o que se observa. Exigir a forma
   * `| critério |` media a largura da tabela, não a regra do `;` — que é o que esta secção
   * guarda desde 01/11/2026. */
  assert(gerada.split('\n').some((l) => /^\|/.test(l)
    && l.split('|').slice(1, -1).map((c) => c.trim()).includes(criterio)),
    'o guia deve listar o critério sozinho na sua célula: ' + criterio);
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
  const envelopes = path.join(raiz, 'escola/breu/envelopes');
  const plano = JSON.parse(fs.readFileSync(path.join(envelopes, 'plano-20261120-2052.json'), 'utf8'));
  const po = JSON.parse(fs.readFileSync(path.join(envelopes, 'po-20261120-2052.json'), 'utf8'));
  const cal = calibracaoDoConf(fs.readFileSync(path.join(ciclos,
    'ciclo-01-breu-rosa.conf'), 'utf8'));
  /* A DERIVAÇÃO LEVA AS MESMAS ENTRADAS QUE A GERAÇÃO LEVA (20/11/2026): do `linhaDeBase` e das
   * `anamneses` sai o guia de observação, e sem eles o texto derivado não reproduz o do disco —
   * a comparação reprovava por falta de entrada, não por texto escrito à mão. */
  const linhaDeBase = JSON.parse(fs.readFileSync(path.join(raiz,
    'escola/breu/linhas-de-base/tami--20261120-2146.json'), 'utf8'));
  const anamneses = fs.readdirSync(envelopes).filter((f) => /^anamnese-/.test(f))
    .map((f) => JSON.parse(fs.readFileSync(path.join(envelopes, f), 'utf8')));
  const doCodigo = derivarAula01({
    plano: { respostas: plano.respostas }, po: { respostas: po.respostas },
    contexto: { ciclo: '01', escola: 'breu', professor: 'demi-plie', turma: 'Rosa', aulas: ['01'] },
    calibracao: cal, linhaDeBase, anamneses,
  });
  /* BYTE A BYTE NÃO SE REPETE, E A RAZÃO É DE FACTO (20/11/2026). A comparação exigia que o
   * ficheiro em disco fosse, ao byte, o que o código gera hoje. Ela valia no dia da geração, e só
   * nele: o guia de observação lê a LINHA DE BASE, a linha de base tem versões (a `tami` da `breu`
   * já vai na décima), e a aula em disco é o documento de uma leitura que entretanto mudou. Testadas
   * todas as versões guardadas, nenhuma reproduz o ficheiro — porque a que o gerou foi substituída.
   * O que se exige agora é o que não apodrece: a ESTRUTURA (as secções, na ordem) e a proveniência
   * explícita. Se alguém escrever à mão uma secção a mais, isto acusa. */
  const secoes = (t) => t.split('\n').filter((l) => /^## /.test(l)).map((l) => l.trim());
  assert.deepStrictEqual(secoes(doCodigo), secoes(aula),
    'a fonte da aula em disco tem as mesmas secções que o código gera — uma secção a mais é '
    + 'texto escrito à mão, que a próxima geração apaga');
  console.log('  ok    a fonte da aula tem a estrutura que o código gera (as secções, na ordem)');
}

const notacaoCompleta = gerarAulaNotacao(aula, notacao);
assert(notacaoCompleta.includes('## 1. Validação dos objetivos, métricas e duração')
  && notacaoCompleta.includes('## 5. Guia de observação do professor'),
  'a leitura de Notação deve incluir a estrutura comum da Aula');
// A CATEGORIA MUDOU DE `Plié` PARA `Perna` (01/11/2026): plié não é parte do corpo — é o
// exercício —, e a categoria do trecho diz que parte se move. O bloco compõe-se da categoria e
// dos sinais, e por isso a string esperada mudou com ela.
/* O SINAL CONCRETO É O DESTE CICLO (20/11/2026). A asserção procurava `[Perna: 1ª ↓]`, que é o
 * bloco de um exercício da `batata`; o que ela guarda é «a leitura da Notação acrescenta a coluna
 * e os sinais», e os sinais são os que a fonte declara. Lê-se o primeiro bloco da própria fonte —
 * se a coluna existir e nenhum bloco a preencher, a leitura estaria a acrescentar uma coluna vazia. */
const sinalDaFonte = (notacao.match(/\[Perna: [^\]]+\]/) || [])[0];
assert(notacaoCompleta.includes('| Compasso | Contagem | Notação | Descrição |')
  && Boolean(sinalDaFonte) && notacaoCompleta.includes(sinalDaFonte),
  'a leitura de Notação deve acrescentar a coluna e os sinais Benesh');
/* O DESTINO DO GLOSSÁRIO SAI DA FONTE (20/11/2026). Era o literal `glossario-benesh.html`; o
 * glossário do projeto passou a chamar-se «código de dança» — o código é nosso, e o nome dele não
 * é de ninguém —, e o ficheiro publicado é `glossario-codigo_de_danca.html`. O que se guarda é
 * que a leitura PRESERVA o destino que a fonte declara, seja ele qual for. */
const destinoDoGlossario = (notacao.match(/^glossario-href: "([^"]+)"/m) || [])[1];
assert(Boolean(destinoDoGlossario) && notacaoCompleta.includes('glossario-href: "' + destinoDoGlossario + '"'),
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
