# Professores

Cada professor do projeto tem a sua pasta aqui, com os **seus** ciclos, cadernos,
relatórios e material de campo. Nada de um professor fica na pasta de outro.

## O que é um "professor" no projeto

Um professor é quem dá aula e **observa a própria prática**. O material de observação é
dele: o PO, o caderno, os relatórios. O projeto dá o método (protocolo, regras,
ferramentas); o professor dá o recorte.

Pela **P-13**, cada professor tem o seu próprio PO — dois professores com a mesma escola
e as mesmas alunas têm POs distintos, porque o recorte observacional é decisão de cada
um. Pela **P-14**, quando a escola tem metodologia comum, o PO do professor pode derivar
de um **PO de departamento** (ver [`../departamentos/README.md`](../departamentos/README.md)).

## O que cada professor tem

| Pasta | O que é |
|:--|:--|
| `ciclos/` | manifestos, planos, aulas, POs e âncoras de proveniência (`.fipp`) dos ciclos daquele professor |
| `cadernos/` | o caderno descritivo por aula (P-06) |
| `relatorios/` | os relatórios pós-aula, um por aula |
| `campo/` | o material bruto de campo (formulários, respostas, registros) |

## O que é compartilhado (fica na raiz)

`biblioteca/` · `apresentacoes/` · `protocolo/` · `tools/` · `PROTOCOLO.md` ·
`REGRAS.md` · `REGISTRO.md` · `README.md` · `README-ciclos.md` · `HANDOFF.md` ·
`departamentos/`

## Como adicionar um professor

```bash
mkdir -p professores/<nome>/{ciclos,cadernos,relatorios,campo}
```

Depois:

1. crie o ciclo inicial (`ciclo-01.conf` + `ciclo-01-<escola>.conf`) — ver
   [`../README-ciclos.md`](../README-ciclos.md) e, como exemplo,
   [`tiago/ciclos/`](tiago/ciclos);
2. declare o PO do professor (`ciclo-01-<escola>-po.md`): o recorte é dele (P-13) — o dado,
   porém, pertence à escola;
3. gere a âncora e o pacote:
   ```bash
   tools/hash-ciclo.sh <nome> 01 <escola>
   tools/gerar-ciclo.sh <nome> 01 <escola>
   ```
   Sem `<nome>`, as ferramentas assumem `tiago` (compatibilidade com os comandos
   antigos: `tools/gerar-ciclo.sh 01 duo` continua funcionando).

## Professores hoje

| Professor | Ciclos | POs | Estado |
|:--|:--|:--|:--|
| **tiago** | Ciclo 01 — **uma por escola**: `duo` (Duo, Fernando) e `ritmos` (Ritmos e Movimento, Gabi) | `ciclo-01-duo-po.md` validado; `ciclo-01-ritmos-po.md` com os campos do professor, checklist aguardando a primeira aula | em execução |

> **Cada escola tem o seu ciclo.** O conteúdo (objetivo, plano, aulas) é da escola,
> não do número do ciclo: `ciclo-01-duo-*` e `ciclo-01-ritmos-*` são ciclos
> distintos, com planos e aulas distintos. As fontes de uma variante têm
> precedência sobre as sem sufixo — a regra está em `tools/lib-fontes.sh`. O ciclo
> da **Débora (Marau)** ainda não existe: as cópias que havia foram removidas.
