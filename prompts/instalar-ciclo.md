# Instalação de Ciclo e PO de outro professor

> **Nota de instalação (18/09/2026).** Este prompt foi instalado no repositório em
> 18/09/2026 (P-19). Houve **uma única adaptação** ao texto original: os nomes dos
> documentos na árvore abaixo levam o **sufixo da escola**
> (`ciclo-01-<escola>-plano.md`), que é a convenção real do repositório — cada
> escola tem o seu ciclo, com conteúdo próprio, e a versão sem sufixo é lida por
> todas (`tools/lib-fontes.sh`). Sem esse sufixo, este prompt reinstalaria o erro
> que fez o pacote da Ritmos sair com o plano da Duo. Nada mais foi alterado.

Quando um professor responde à eliciação (via `prompts/eliciar-ciclo.md`),
o resultado é colado aqui. Este prompt transforma o Markdown entregue em
estrutura instalada no projeto.

## O que o professor entrega

Um único arquivo Markdown com: contexto institucional, objetivo geral,
alunas, primeira aula, e o PO (pergunta, fenômeno, campo, contexto,
sujeitos, linha de base, critérios de inclusão/exclusão, justificativa,
limitações).

## O que instalar

Criar:

```
professores/<nome>/ciclos/
├── ciclo-01.conf
├── ciclo-01-<escola>.conf
├── ciclo-01-<escola>-po.md
├── ciclo-01-<escola>-plano.md
├── ciclo-01-<escola>-aula-01.md
├── ciclo-01-<escola>-referencias.md
├── ciclo-01-<escola>-relatorio-aula-01.md
├── ciclo-01-<escola>-captura-aula-01.md
├── ciclo-01-<escola>-pre-requisitos.md          (se aplicável — ver P-15/P-16)
├── ciclo-01-<escola>-musicalidade.md            (se aplicável)
├── ciclo-01-<escola>-musicalidade-aluna.md      (se aplicável)
├── ciclo-01-<escola>-notacao.md                 (só se o professor declarar notação)
├── ciclo-01-<escola>-glossario-<notacao>.md     (só se o professor declarar notação)
└── ciclo-01-<escola>-apanhado-historico.md
```

## Regras

- **P-15/P-16:** só gerar notação se o professor declarou metodologia com
  notação (ex.: RAD → Benesh). Caso contrário, **não gerar** documentos de
  notação.
- **P-17:** os artefatos replicam os do ciclo piloto (Duo).
- **P-12:** sujeitos entram por apelido estável — se o professor só deu
  nomes próprios, marcar `[Preencher: apelidos estáveis]` e NÃO publicar
  até a decisão.
- **Nada de inferir** — o que não foi declarado vai como `[Preencher]`.
- **Não copiar** o conteúdo de outro ciclo: replica-se a **estrutura**, não o
  texto. Um documento auxiliar que carregue o conteúdo do ciclo de outra escola
  (as contagens das aulas dele, o registro dos exercícios dele) não é replicável:
  ou é derivado do que **este** professor declarou, ou fica `[Preencher]`.

## Procedimento

1. Criar `professores/<nome>/` com a estrutura
2. Preencher `.conf` com objetivo, total de aulas, faixas de volume
   (calibradas pela duração)
3. Preencher `-po.md` com os campos respondidos
4. Preencher `ciclo-01-<escola>-plano.md`, `-aula-01.md`, `-referencias.md`
5. Descobrir os artefatos do Duo (ciclo piloto) e replicar a estrutura
6. Gerar âncora FIPP: `tools/hash-ciclo.sh <nome> 01 <escola>`
7. Gerar pacote: `tools/gerar-ciclo.sh <nome> 01 <escola>`
8. Validar: `tools/check-pacote.js`
9. Registrar em `REGISTRO.md`
10. Registrar material bruto em `campo/`
11. Commitar
