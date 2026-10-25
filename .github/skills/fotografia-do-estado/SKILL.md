---
name: fotografia-do-estado
description: 'Use when: atualizar a fotografia do estado do projeto em ESTADO-ATUAL.md, ou gerar o TRANSFERENCIA-IA.md para levar contexto a outro assistente. Cobre a verificação do remoto antes de escrever, a atualização pontual por secção, as etiquetas factuais (CONFIRMADO/DECLARADO/DECIDIDO/HIPÓTESE/PENDENTE), a separação entre fotografia curada e HANDOFF.md gerado, o registo da decisão no REGISTRO.md, e a geração de um documento portátil curto e seletivo. Não envia nada a serviço nenhum: a transferência é manual.'
argument-hint: 'atualizar a fotografia · ou "transferência sobre <assunto>"'
---

# A fotografia do estado e a transferência para outro assistente

Duas rotinas. A primeira mantém [ESTADO-ATUAL.md](../../../ESTADO-ATUAL.md) honesto. A segunda
produz `TRANSFERENCIA-IA.md` — o documento que o usuário anexa a outra conversa.

O contrato de edição está em
[.github/instructions/estado-atual.instructions.md](../../instructions/estado-atual.instructions.md).
Leia-o antes de escrever; aqui ficam só os passos e as travas.

---

## Rotina 1 — atualizar a fotografia

### 1. O remoto primeiro, sempre

```bash
git fetch origin
git status -sb
git --no-pager log --oneline -3 origin/main
```

Estar atrás ou à frente **e** atrás: `git rebase origin/main` (a história é linear; os hooks de
proveniência contam com isso). Nunca por cima de trabalho por commitar — stash ou commit primeiro.

Se o `fetch` falhar (credencial), **diga que falhou**. Não alegue validação do remoto.

### 2. Recolher só o que mudou materialmente

Parta da data e do commit da linha «Última fotografia». Não reanalise o repositório inteiro: um
`git log --oneline <commit>..HEAD` mais a leitura dos ficheiros que ele tocou chega.

### 3. Atualizar por secção

Altere **apenas** as secções afetadas. Nunca reescreva o documento inteiro — o custo é o motivo
de ele existir. Atualize a linha «Última fotografia» com data e commit.

### 4. A decisão vai para o REGISTRO.md

Aqui fica uma linha na §6. O motivo, as alternativas e as consequências vão para o
`REGISTRO.md`, no fim do ficheiro (ordem cronológica crescente), com o formato de
[registro-md.instructions.md](../../instructions/registro-md.instructions.md).

### 5. Validar e escrever o resultado

Rode o que a §9 lista — e **escreva o resultado mesmo quando é negativo**. «Não executado» é uma
resposta; silêncio não é. Se mexeu no motor, corra as provas do módulo tocado antes de afirmar
qualquer coisa sobre ele.

### 6. Regenerar o HANDOFF, se o estado mudou

`tools/gerar-handoff.sh` — nunca editar o `HANDOFF.md` à mão. Ele é gerado e aponta para a
fotografia.

---

## Rotina 2 — gerar a transferência

### 1. A fotografia está atualizada?

Se não estiver, atualize-a primeiro (rotina 1). Transferir uma fotografia velha propaga o erro
para o outro assistente, que não tem como o detetar.

### 2. Qual é a dúvida?

Se não estiver clara na mensagem do usuário, **pergunte** — não invente um assunto genérico. Uma
transferência sem pergunta é um resumo, e um resumo não serve para consultar.

### 3. Escrever `TRANSFERENCIA-IA.md` na raiz

Sete blocos, curtos. O documento é **seletivo**: cabe numa leitura, e o que não serve à pergunta
fica de fora.

1. **Projeto e objetivo atual** — três a cinco linhas, sem história.
2. **Estado confirmado** — só o que é relevante à pergunta, com as etiquetas.
3. **Arquitetura relevante** — só as camadas que a pergunta toca.
4. **Decisões vigentes e restrições** — o que o outro assistente não pode ignorar nem propor
   contrariar.
5. **Arquivos relevantes** — caminhos reais e o que cada um responde.
6. **A tarefa e o ponto de continuidade** — onde parei e qual é o próximo passo concreto.
7. **A dúvida específica** · **o que precisa de decisão do usuário** · **riscos e limitações
   conhecidos**.

### 4. Fechar

Diga o **caminho do ficheiro** e **o que ficou incluído e o que ficou de fora** — a segunda
metade é a que evita uma transferência gorda.

**Não versione.** `TRANSFERENCIA-IA.md` está no `.gitignore`: é contexto efémero de sessão, como
as saídas geradas de P-04. Versioná-lo criaria conflito a cada geração.

**Não anexe, não envie, não publique.** Nenhuma integração está configurada. A transferência é
manual; dizer o contrário é alegar um facto falso.

---

## As travas que este projeto já pagou

- **`.every` sobre uma leitura vazia passa.** Uma validação que não mede nada não falha — e um
  documento de estado cheio de afirmações não medidas é pior do que nenhum.
- **O worktree não sabe que o remoto mudou.** Um `git status` limpo quer dizer «nada aconteceu
  *aqui*», não «nada aconteceu».
- **«Está no documento» não é «está no código».** Antes de escrever CONFIRMADO, abra o ficheiro.
- **Não mexa em `tools/`, `PROTOCOLO.md`, `REGRAS.md`, `METODO.md` nem no guia do professor** —
  são congelados (`CONGELAMENTO.md`). O `gerar-handoff.sh` também é: mudá-lo exige motivo
  declarado no corpo, entrada no `REGISTRO.md` e commit próprio.
