---
description: "Instalar um ciclo novo a partir do Markdown elicitado: cria .conf, PO, plano, aulas, captura e demais artefatos em professores/<professor>/ciclos/, sem inferir nada."
name: "Instalar ciclo"
argument-hint: "Cole o Markdown da Elicitação e diga professor, ciclo e escola"
tools: [read, edit, search]
---
Transforme o Markdown da Elicitação em estrutura instalada em `professores/<professor>/ciclos/`.

O contrato completo está versionado em [instalar-ciclo.md](../../prompts/instalar-ciclo.md) (P-19) — leia-o antes de escrever e siga-o. Este prompt só fixa as travas que costumam ser furadas.

## Antes de escrever

1. Leia [prompts/instalar-ciclo.md](../../prompts/instalar-ciclo.md) e [REGRAS.md](../../REGRAS.md) (pré-requisitos 4 e 5).
2. Confirme as entradas com o usuário: **professor**, **ciclo**, **escola**. Sem escola não há variante, e sem variante não há calendário.
3. Trate a **escola** como sufixo de tudo: `ciclo-01-<escola>-plano.md`, `ciclo-01-<escola>-po.md`, `ciclo-01-<escola>-aula-01.md`, `ciclo-01-<escola>.conf`. A versão sem sufixo é lida por todas as escolas (`tools/lib-fontes.sh`).

## Travas

- **Não inferir.** O que a Elicitação não declarou vira `[Preencher: …]`; o que depende de conferência de edição/ano vira `[conferir]`. Nunca complete com conhecimento próprio.
- **Não copiar** o conteúdo de outro ciclo. Replica-se a **estrutura** do piloto (P-17), nunca o texto: contagens, exercícios e marcos de outra escola não transportam.
- **P-12.** Sujeitos entram por **apelido estável**, um por linha. Se a Elicitação só trouxe nomes próprios, marque `[Preencher: apelidos estáveis]` e não publique.
- **P-15/P-16.** Só gere `notacao.md` e `glossario-<notacao>.md` se o professor tiver declarado metodologia com notação. Caso contrário, **declare a ausência com justificativa** — não crie o arquivo vazio.
- **P-22.** Restrição física declarada entra na linha de base do PO com uma linha por aluna e a **fonte** (quem declarou, quando). Se o professor declarou não haver restrições, registre isso explicitamente — a ausência é informação.
- **Pré-requisitos 4 e 5.** Declare `DURACAO` no manifesto e `duracao:` no cabeçalho de cada aula. `volume-total:` precisa caber na faixa (60 min → 80–100 tempos; 120 min → 150–200).
- **Não gere a entrega.** Instalar é escrever fontes; gerar HTML/PDF é `tools/gerar-ciclo.sh <professor> <ciclo> <escola>`, e a âncora vem depois com `tools/hash-ciclo.sh`. Não rode nenhum dos dois sem o usuário pedir.
- Não edite nada em `tools/`, `prompts/`, `PROTOCOLO.md`, `REGRAS.md`, `METODO.md` nem `biblioteca/guia-do-professor.md` — estão congelados (`CONGELAMENTO.md`).
- Não commite, nem crie branch, sem solicitação explícita.

## Ao terminar

Liste os arquivos criados, o que ficou `[Preencher]`/`[conferir]` e o próximo comando do fluxo — sem executá-lo.
