# Departamentos

Um **PO de departamento** é a norma de observação de uma escola que adota metodologia
comum (RAD, Vaganova, Cecchetti, ou outra). Ele não substitui o PO do professor: é o
**pai** dele na cadeia de proveniência encadeada (a âncora `.fipp` deste repositório;
ver a ressalva de escopo em `README.md` — o FIPP, do projeto de mestrado, **não** está
implementado aqui).

## Quando existe

Só existe onde a escola o declara. Um PO de departamento pressupõe:

- metodologia comum adotada pela **escola** (não por um professor isolado);
- coordenação pedagógica que responda pela norma;
- decisão institucional de que o que se observa é o mesmo para todas as turmas.

## Como se relaciona com o PO do professor (P-14)

| Situação | O que acontece |
|:--|:--|
| A escola tem PO de departamento | cada PO de professor derivado tem `parentHash` = hash do PO de departamento |
| A escola não tem | o PO do professor é **raiz** (sem `parentHash`) |

Pela **P-13**, o PO continua sendo do professor: mesmo na escola com departamento, o
recorte observacional da turma dele é decisão dele. O departamento define **o que** se
observa (o padrão); o professor define **como** observa na turma dele.

## Estrutura prevista

```
departamentos/
└── <escola>/
    ├── po-departamento.md      a norma (campos do PO, sem linha de base de turma)
    └── po-departamento.fipp    âncora da cadeia de proveniência
```

## Hoje neste projeto

**Nenhuma** escola tem PO de departamento — nem a Duo, que vai adotar RAD sem estrutura
departamental. Isso não é uma falha: é o cenário mais comum em escolas pequenas e
médias, e o projeto foi feito para funcionar assim. Todos os POs atuais são **raiz**.

A estrutura está pronta, aguardando uma escola que a declare. Quando isso acontecer, o
PO do professor **não muda**: ganha um `parentHash` apontando para o PO de departamento.
