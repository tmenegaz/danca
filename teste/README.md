# teste/ — os dados das escolas de teste (temporário)

Uma escola cujo **nome** traz uma destas palavras recebe, nos formulários, os valores do
JSON correspondente:

| Palavra | Arquivo | Conjunto |
|:--|:--|:--|
| `Calango` | `calango.json` | 1 |
| `Batata` | `batata.json` | 2 |
| `Breu` | `breu.json` | 3 |

A palavra pode estar em qualquer posição do nome — `Batata`, `escola-batata`,
`Batata da Tarde` —, e a primeira que aparece é a que vale. O resto do nome é livre.
Escola sem nenhuma das três é escola normal.

Os três arquivos são **sintéticos**. Não há nome completo, contato ou senha: as alunas
são `Aluna A`, `Aluna B` e `Aluna C`, e as observações são valores de teste escolhidos
das opções do próprio formulário, não o registro de uma pessoa. Eles existem para
exercitar o motor, não para representar uma turma de verdade.

## O que cada bloco preenche

| Bloco | Onde aparece | O que preenche |
|:--|:--|:--|
| `producao` | Bastidores → Produção | turmas, rubricas, vocabulário, alunas e curadorias |
| `verbete` | Bastidores → Produção | a música (tempos e compasso) e a decomposição de cada exercício da lista |
| `anamnese` | `/anamnese/` | as respostas da aluna escolhida no contexto |
| `plano` | `/plano-ensino/` | os campos de escrita do plano da turma escolhida |
| `po` | `/plano-observacao/` | o Plano de Observação da turma do plano escolhido |

O bloco `verbete` (02/11/2026) é o mais novo e o que muda mais a experiência: cada entrada traz
`termo`, `musica` (`"8|4/4"`), `cobre` e `celulas` — a mesma forma que o alfabeto grava. O
preenchimento **escolhe o exercício no passo 2** (o termo já existe no vocabulário, e escrevê-lo no
passo 1 criaria um segundo termo com o mesmo nome), põe a música no passo 3 e as células no passo 6.
É o que permite testar o motor métrico sem escrever a decomposição à mão.

O que ele **não** faz continua a ser a regra da casa: não chama rota que escreva. As células são
postas no estado da página — o mesmo sítio onde o professor as escreveria —, e gravar é decisão de
quem clica.

O bloco `po` (20/10/2026) tem uma diferença em relação aos outros dois: o
`plano-de-ensino` não é um campo de escrita, e sim o **carimbo** de um plano já gravado
(`plano-AAAAMMDD-HHMM`). O JSON não pode trazê-lo — ele só existe depois do lançamento.
Por isso o preenchedor lê a estante (`/api/planos`), casa pelo campo `turma` do bloco e
escreve o carimbo. Se não houver plano daquela turma na estante, avisa e deixa o nó por
escolher, em vez de inventar um.

O que o bloco `po` **não** traz, porque não é dado de fixture: a lista de dimensões
observadas (nasce dos blocos da aula que o plano marca) e os seis itens do checklist de
validação (cada um vale o que os campos que ele monitora dizem). Os dois se preenchem
sozinhos quando o resto entra.

## A regra que não se quebra

O preenchimento é **só de campo**. O carregador não chama `POST`, `PUT` nem `DELETE`,
não grava no KV, não submete formulário e não dispara workflow. Quem envia é você,
com a senha da direção ou do professor. A prova é `node experimentos/provar-teste.js`.

## Onde o arquivo é lido

`motor/servidor/teste-fixtures.js` faz `require` dos três JSON; o esbuild do Worker os
empacota no bundle. Por isso eles ficam **aqui**, e não em `experimentos/` — aquela
área é demonstrativa e não entra em pacotes, hashes ou publicação.

## Quando remover

O recurso é temporário e está declarado na nota do modal «Criar nova escola» e no
`README.md`. Para desligá-lo: remova os três JSON e este README,
`motor/servidor/teste-fixtures.js`, `motor/servidor/teste-cliente.js`, as duas rotas de
teste em `motor/servidor/producao.js` e em `motor/servidor/rotas.js`, a injeção do
atributo/script em `motor/servidor/bastidores.js` e em `producao.js`, e a nota/JS de
`raiz/index.html`. O resto do motor não depende de nada disso.
