# Modelo

O **molde** de que nasce toda escola nova: os schemas do ciclo, de onde o
`tools/criar-escola.sh` os copia ao criar um professor.

```
modelo/ciclos/ciclo-01-schema.json           os contratos que as fontes do ciclo satisfazem
modelo/ciclos/ciclo-01-po-schema.json
modelo/ciclos/ciclo-01-plano-schema.json
modelo/ciclos/ciclo-01-aula-schema.json
modelo/ciclos/ciclo-01-captura-schema.json
```

## Por que ele NÃO fica em `professores/`

Ele ficava — em `professores/tiago/ciclos/`, como se fosse a pasta de um professor. E não é:
é um molde, não uma pessoa. A confusão tinha custo, medido em 15/10/2026:

- **`professores/tiago` aparecia como professor em todo lugar que lista professores** — em
  `/api/professores` (a lista que o formulário de criar escola oferece) e no `HANDOFF.md`
  («Professores: tiago (1)»). Um molde não pode ser escolhido como responsável por uma escola;
- **alguém que apagasse «a pasta de um professor que não existe mais» apagaria o molde** — e
  nenhuma escola nova poderia nascer. Aconteceu duas vezes neste repositório: a escola `ponta`
  não pôde ser criada (o run #3 do `criar-escola.yml` morreu no scaffold com
  `erro: ciclo-modelo sem schema`), e foi por isso que o expurgo de uma escola ganhou a
  proibição de tocar em schemas.

A regra que resolve isso não é uma exceção — é a **ausência da ambiguidade**: `professores/`
contém pessoas, e nada mais. Não há lista que precise excluir o molde, porque ele não está
lá para ser excluído.

## Quem usa — e há UM leitor só (01/11/2026)

O molde era lido por duas portas, cada uma à sua maneira: o `tools/criar-escola.sh` copiava cinco
ficheiros com `cp`, e o `motor/servidor/schemas-do-ciclo.js` ia buscá-los por HTTP ao GitHub, um
`GET` por schema, com o caminho montado à mão. **Duas maneiras de ler a mesma coisa são duas
coisas** — e quando o molde ficou atrás dos professores, nada avisou: a geração de um ciclo morreu
em «campo ausente», com o PO já validado.

Hoje há **um leitor** — `motor/nucleo/schemas.js`, que faz `require` literal destes cinco
ficheiros — e duas portas que o chamam:

- **`tools/criar-escola.sh`** → `tools/gerar-schemas.js`, que escreve
  `professores/<slug>/ciclos/ciclo-<NN>-*.json` a partir do módulo. O default está na variável
  `MODELO` (`modelo/01`); o `--modelo <base>/<ciclo>` continua a valer e é a **única** cópia que
  resta, declarada — quem semeia a partir do ciclo de um professor quer aqueles ficheiros, e não
  estes;
- **`motor/servidor/schemas-do-ciclo.js`** (o Worker, quando um professor que não criou a escola
  recebe uma turma em curadoria) — escreve o mesmo conteúdo, **sem pedir o molde à rede**: ele vem
  empacotado. Um `GET` a menos, e um molde que não existe passou a ser falha de build em vez de um
  ciclo que nasce sem validação.

Os **validadores** (`tools/validar-schema-ciclo.js`, `tools/validar-po-ciclo.js`,
`tools/validar-plano-ciclo.js`, …) validam as fontes de um professor contra o schema **do próprio
professor** — a cópia, não este molde. O molde é a semente, não o contrato em vigor de ninguém;
quem diz se as cópias dizem o mesmo que ele é `node tools/check-schemas.js`.

## A regra do conteúdo, e não dos bytes

Um schema indentado de outra maneira diz o mesmo schema. `tools/check-schemas.js` compara o
**conteúdo** (o objeto), e não o ficheiro — e o módulo serve a forma canónica a quem **escreve** um
ficheiro novo, para que dois professores provisionados em momentos diferentes nasçam iguais. Quem
já tem a sua cópia continua com ela: a proveniência acrescenta, não reformata.

## O molde não se apaga

Sem `modelo/ciclos/ciclo-01-schema.json` o scaffolder **recusa** criar escola — e, desde a
unificação, o `require` de `motor/nucleo/schemas.js` também não resolve, o que é uma falha de
build do Worker (mais cedo, e mais alto, do que uma escola que nasce sem validação):

```
erro: ciclo-modelo sem schema: modelo/ciclos/ciclo-01-schema.json
```

É o molde, e é o único do repositório. Nada aqui é saída gerada — os arquivos são fonte, e
mudam por decisão declarada (é o contrato de todo ciclo que nasce).
