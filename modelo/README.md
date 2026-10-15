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

## Quem usa

- **`tools/criar-escola.sh`** — copia `modelo/ciclos/ciclo-01-*.json` para
  `professores/<slug>/ciclos/ciclo-01-*.json` do professor novo. O default está na variável
  `MODELO` (`modelo/01`), e o `--modelo <base>/<ciclo>` aponta para outro molde;
- os **validadores** (`tools/validar-schema-ciclo.js`, `tools/validar-po-ciclo.js`,
  `tools/validar-plano-ciclo.js`, …) validam as fontes de um professor contra o schema **do
  próprio professor** — a cópia, não este molde. O molde é a semente, não o contrato em vigor
  de ninguém.

## O molde não se apaga

Sem `modelo/ciclos/ciclo-01-schema.json` o scaffolder **recusa** criar escola:

```
erro: ciclo-modelo sem schema: modelo/ciclos/ciclo-01-schema.json
```

É o molde, e é o único do repositório. Nada aqui é saída gerada — os arquivos são fonte, e
mudam por decisão declarada (é o contrato de todo ciclo que nasce).
