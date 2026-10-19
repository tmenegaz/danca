# teste/ — os dados das escolas de teste (temporário)

Uma escola cujo **slug** termina em `teste-1`, `teste-2` ou `teste-3` recebe, nos
formulários, os valores de `escola-teste-N.json`. O que vem antes do «teste» é livre:
`Plie teste 1` vira `plie-teste-1` e usa o conjunto 1.

Os três arquivos são **sintéticos**. Não há nome completo, contato ou senha: as alunas
são `Aluna A`, `Aluna B` e `Aluna C`, e as observações são valores de teste escolhidos
das opções do próprio formulário, não o registro de uma pessoa. Eles existem para
exercitar o motor, não para representar uma turma de verdade.

## O que cada bloco preenche

| Bloco | Onde aparece | O que preenche |
|:--|:--|:--|
| `producao` | Bastidores → Produção | turmas, rubricas, vocabulário, alunas e curadorias |
| `anamnese` | `/anamnese/` | as respostas da aluna escolhida no contexto |
| `plano` | `/plano-ensino/` | os campos de escrita do plano da turma escolhida |

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
