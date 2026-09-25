# Biblioteca de referências compartilhadas

Referências usadas pelas **duas frentes** do projeto (aulas e apresentação) e por
**todos os professores**: a biblioteca é compartilhada, não pertence a um professor. A lista
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

## Duas listas de referência — e por que existem

O projeto tem **duas listas de referência com papéis diferentes**. Não são duplicatas
nem alternativas: são coisas distintas, e confundi-las já custou uma rodada inteira de
correção — um link `../biblioteca/referencias.md` saído de um documento do ciclo, que
não resolve dentro do pacote.

| Arquivo | Papel | Entra no hash da âncora? |
|:--|:--|:--|
| `biblioteca/referencias.md` | lista de trabalho compartilhada, reutilizável por qualquer ciclo | **não** |
| `ciclos/ciclo-XX-referencias.md` | página publicada do pacote — seleção curada, com seções editoriais | **sim** |

### `biblioteca/referencias.md` — a lista de trabalho

A lista compartilhada do projeto. Contém o que é citado em qualquer frente (aulas,
apresentação, ciclos futuros), com o status epistêmico declarado quando for o caso
(ex.: "fonte de repertório, não acadêmica").

- **Reutilizável:** qualquer ciclo pode consultar.
- **Não entra no hash da âncora de ciclo nenhum** — é fonte de trabalho, não artefato
  publicado.
- **Cresce por acúmulo:** cada nova referência entra aqui, no commit que a introduziu.

### `ciclos/ciclo-XX-referencias.md` — a página publicada

A bibliografia que aparece **dentro do pacote** do ciclo (HTML + PDF).

- **Seleção curada:** nem tudo da biblioteca entra — só o que é relevante para aquele
  ciclo.
- **Entra no hash da âncora do ciclo** — é artefato publicado (P-04).
- **Tem seções editoriais próprias** ("Pedagogia do balé", "Notação em Benesh",
  "História e política"…), que a biblioteca não tem.

### Como se relacionam

A biblioteca é a **fonte**; a página do ciclo é a **seleção publicada**. A página
**não** é derivada automaticamente da biblioteca: é escrita à mão, seção por seção.
Isso é deliberado — a professora que abre o pacote quer a bibliografia daquele ciclo,
não a lista completa do projeto.

> **Aviso para quem editar:** o pacote entregue é uma **pasta plana** (HTML + PDF +
> assets). Um link `../biblioteca/referencias.md` a partir de um arquivo do ciclo
> **não resolve** — nem no HTML, nem no PDF — e o `check-pacote` reprova a geração
> (ele valida todo link). Se precisar citar algo que está só na biblioteca, escreva
> "ver a biblioteca do projeto" em prosa (sem link), ou promova a referência à página
> do ciclo.

## Convenções de citação

| Situação | O que fazer |
|:--|:--|
| Obra conferida | entrada normal, com edição e ano completos |
| Edição/ano a confirmar | marcar `[conferir: o que falta]` na própria entrada |
| Sem fonte declarada | **não afirmar** — deixar `[Preencher]` no documento e registrar a pendência aqui |
| Referência brasileira rara | incluir a instituição ou o acervo onde foi consultada |

> Ver `REGRAS.md`, Regra 8 (proveniência objetiva) e Regra 17 (versionamento).
