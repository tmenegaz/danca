# Biblioteca de referências compartilhadas

Referências usadas pelas **duas frentes** do projeto (aulas e apresentação). A lista
completa está em [`referencias.md`](referencias.md).

## Por que existe separada

- **Fonte única de citação:** quando a mesma obra aparece na apresentação e em um
  ciclo, a entrada é escrita uma vez, aqui, e conferida uma vez.
- **Auditoria (Regra 8):** é nesta pasta que se resolve um `[conferir]` — edição,
  ano ou página — e a correção aparece no histórico do Git com o commit que a fez.
- **Rastreabilidade:** `git log --grep="Clippinger" biblioteca/` mostra quando e por
  que uma referência foi acrescentada ou corrigida.

## O que **não** fica aqui

O pacote de cada ciclo (`ciclos/ciclo-XX/`) é **autossuficiente**: ele carrega a sua
própria página de referências, gerada do Markdown `ciclos/ciclo-XX-referencias.md`,
para funcionar offline e impresso. Esta biblioteca é a referência de trabalho do
projeto — a fonte de onde as páginas do ciclo são preenchidas.

## Convenções de citação

| Situação | O que fazer |
|:--|:--|
| Obra conferida | entrada normal, com edição e ano completos |
| Edição/ano a confirmar | marcar `[conferir: o que falta]` na própria entrada |
| Sem fonte declarada | **não afirmar** — deixar `[Preencher]` no documento e registrar a pendência aqui |
| Referência brasileira rara | incluir a instituição ou o acervo onde foi consultada |

> Ver `REGRAS.md`, Regra 8 (proveniência objetiva) e Regra 17 (versionamento).
