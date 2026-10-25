---
description: "Convenções de edição do ESTADO-ATUAL.md: as etiquetas factuais (CONFIRMADO/DECLARADO/DECIDIDO/HIPÓTESE/PENDENTE), a fronteira com o HANDOFF.md gerado, atualização pontual por secção, e as duas rotinas — atualizar a fotografia e gerar a transferência."
applyTo: "ESTADO-ATUAL.md"
---
# ESTADO-ATUAL.md — a fotografia curada

Documento escrito **à mão**. Não é gerado: o gerado é o `HANDOFF.md`, e a fronteira entre os dois
está escrita na §«Quem é dono de quê» deste mesmo documento. Se mexer num, leia a tabela.

## A regra que sustenta tudo: etiqueta ou prosa

Toda afirmação sobre o estado leva **uma** etiqueta. Sem etiqueta, é interpretação — e
interpretação num documento de estado lê-se como facto.

| Etiqueta | Só se usa quando |
|:--|:--|
| **CONFIRMADO** | verificou agora: código, ficheiro, comando, produção |
| **DECLARADO** | uma pessoa afirmou; não há verificação técnica |
| **DECIDIDO** | decisão vigente, com data e motivo no `REGISTRO.md` |
| **HIPÓTESE** | interpretação sua, ainda não confirmada |
| **PENDENTE** | questão em aberto |

**Três travas que já custaram caro neste repositório:**

- **Não promova um ficheiro a funcionalidade.** `avaliacao.js` não é uma avaliação a funcionar.
  Se não correu, não está CONFIRMADO.
- **Não herde a etiqueta de uma sessão anterior.** «Passou ontem» não é CONFIRMADO hoje. A §9
  tem de dizer a data da última execução, e «não executado» é uma resposta válida.
- **Não invente caminho, versão, data, contagem nem resultado de teste.** Uma contagem errada num
  documento de estado propaga-se a todas as sessões seguintes.

## Atualizar: pontual, nunca reescrever

1. **Verifique o remoto primeiro** — `git fetch`, `git status -sb`, `git log --oneline -3
   origin/main`. O worktree não sabe que o remoto mudou, e cinco caminhos de escrita passam por
   fora dele (`AGENTS.md`, «O remoto primeiro»).
2. Recolha **só** o que mudou materialmente desde a data da última fotografia.
3. Altere **apenas as secções afetadas**. Atualize a linha «Última fotografia» com a data e o
   commit.
4. **A decisão vai para o `REGISTRO.md`**, com motivo. Aqui fica só o resumo da §6, em uma linha.
5. **A §11 (Histórico recente) acrescenta; não reescreve.** É o que permite a uma sessão nova
   saber o que mudou entre duas fotografias.
6. Rode as validações da §9 e **escreva o resultado**, incluindo quando é negativo.

## O que é mudança material

Conclusão ou alteração de funcionalidade · ficheiro criado, removido ou mudado de propósito ·
decisão de arquitetura ou de escopo · contrato de dados ou de interface alterado · descoberta que
mude o plano · validação importante ou teste que falhou · decisão tomada depois de uma pergunta.

**Explorar não é decidir.** Uma possibilidade discutida vai para a §8 como alternativa, nunca
para a §6 como decisão.

## O que este documento não faz

- Não substitui o código, as provas nem a documentação técnica detalhada.
- Não copia o `REGISTRO.md`, o `HANDOFF.md` nem o repositório.
- Não é promocional. Adjetivo sem verificação sai.
- Não se atualiza a cada interação: só quando há mudança material.

## Transferência para outro assistente

A rotina está em [.github/skills/fotografia-do-estado/SKILL.md](../skills/fotografia-do-estado/SKILL.md).
O produto é `TRANSFERENCIA-IA.md` na raiz, **não versionado** — contexto efémero de sessão.
**A transferência é manual:** nenhum agente anexa nem envia o documento a outro serviço, e não se
pode alegar que o fez.
