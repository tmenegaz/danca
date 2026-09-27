# Bloco de identidade canônico

Redações aprovadas. Copie daqui — **não** parafraseie: cada locução foi escolhida para fechar uma
porta de leitura errada.

## A versão longa (documento de entrada: `AGENTS.md`, `README.md`)

> **Projeto Ciclo** — a **memória da aula dada**. Cada aula é **planejada** antes de ser dada: o
> plano (`aula-NN.md`, que entra na âncora de proveniência) fixa objetivo, marcos e volume, e é ele
> que dá a **linha de base**. O que a memória registra é o processo de ensino-aprendizagem que de
> fato se aplicou — **o que mudou em relação ao plano** — e encadeia tudo o que muda.
>
> - **Planejar e registrar são coisas distintas — e as duas acontecem.** A aula é planejada
>   (`aula-NN.md`), dada, e então lançada. O plano é **intenção**: editável enquanto a aula está
>   `planejada`. Depois que a aula acontece, o registro passa a **fato** — só se acrescenta ajuste,
>   nunca se reescreve a intenção (`ARQUITETURA-AULA.md`). O estado é **derivado** do cronograma, do
>   prazo e do registro: **não existe campo "aula dada"**.
> - **NÃO é o projeto de mestrado.** O mestrado está em **outro diretório**, e é de lá que vêm o PO
>   (Protocolo de Observação) e o FIPP. Este repositório **aplica** um PO; não o define, e **não
>   implementa o FIPP**.
> - **Aqui o FIPP não está implementado**, nem perto do que a arquitetura dele desenha. O que existe
>   é uma **âncora de proveniência encadeada** (`tools/hash-ciclo.sh` → `.fipp`), que compartilha o
>   princípio do FIPP — o passado se incorpora, não se reescreve — mas é uma **aproximação**, não o
>   framework.
> - **Este projeto é PROTÓTIPO — ele não é agnóstico.** Está sendo **testado no universo da dança**.
>   A partir dele será criado o projeto que **deve ser agnóstico** (o projeto-alvo, ainda não
>   existente), que deverá transitar em todos os universos: oficina de balé, oficina de matemática,
>   improvisação em dança contemporânea, disciplina de mestrado. Não descreva este repositório como
>   "agnóstico" — ele é o protótipo que provará o modelo.
> - **Nenhum ciclo é igual a outro, nenhuma aula é igual a outra** — nem com o mesmo professor.
> - **O projeto não avalia.** Ele registra o **cotidiano do professor em sala de aula**. A avaliação
>   é fronteira de outro módulo, ainda não desenhado.
> - **A integração ainda não existe.** Com o projeto das secretarias (Projeto Cultura), nem a
>   fronteira de entrada nem a de saída foram desenhadas.

## A versão curta (nota de escopo, perfil `METODO.md`)

> **Nota de escopo.** Os exemplos deste documento são de **balé clássico** porque é o universo em que
> este **protótipo** está sendo testado. **Este projeto é protótipo — ele não é agnóstico.** A partir
> dele será criado o projeto que **deve ser agnóstico**.
>
> **Sobre o FIPP.** O Framework de Infraestrutura de Proveniência Peirceana pertence ao projeto de
> mestrado, em **outro diretório**. Aqui **não há FIPP implementado**: o que existe é uma âncora de
> proveniência encadeada (`tools/hash-ciclo.sh` → `.fipp`) que compartilha o seu princípio — o
> passado se incorpora, não se reescreve — mas está longe do que a arquitetura do FIPP desenha.

## A seção para agentes (`.github/agents/*.agent.md`)

> ## Escopo do projeto
>
> Este é o **Projeto Ciclo** — a memória da aula dada. Ele é **protótipo**, testado no **universo da
> dança**; **não é agnóstico** — o projeto agnóstico será criado a partir dele. Ele **não avalia** e
> **não implementa o FIPP**: a âncora verificada por `hash-ciclo.sh --check` é uma âncora de
> proveniência encadeada, **aproximação** do Framework de Infraestrutura de Proveniência Peirceana —
> que pertence ao projeto de mestrado, em outro diretório. No laudo, não chame o projeto de "projeto
> de mestrado", não o descreva como agnóstico, nem a âncora de "FIPP".

## Formulações que **não** devem ser usadas

| Errado | Certo |
|:--|:--|
| "o projeto é agnóstico e adaptativo" | "o projeto é protótipo, testado em dança, e servirá de base ao projeto agnóstico" |
| "cadeia de proveniência FIPP" | "âncora de proveniência encadeada (aproximação do FIPP)" |
| "o projeto de mestrado" / "pesquisa de mestrado" | "o Projeto Ciclo" |
| "…de fato se aplicou, **não o que foi planejado**" | "…cada aula é **planejada**, e o plano é a **linha de base**; o que se registra é **o que mudou** em relação a ele" |
| "a IA gera o relatório" | "a IA conduz a eliciação; o relatório registra o que o professor respondeu" |

## A armadilha de leitura, declarada

Três trechos são **verdadeiros** e mesmo assim induzem ao erro:

- `README.md` (~L16, histórico): "pesquisa em andamento (mestrado)"
- `PROTOCOLO.md` (~L57): "o paper do mestrado chama de formulário dinâmico"
- `REGRAS.md` (~L74): "o mesmo desenho de encadeamento por hash usado no projeto de mestrado"

Referem-se ao **outro** diretório e ao **nome** do framework. Não os leia como prova de que este
repo é o projeto de mestrado ou que o FIPP roda aqui. **Não é o caso, nas duas hipóteses.**

`PROTOCOLO.md` e `REGRAS.md` são **congelados** (`CONGELAMENTO.md`): corrigir exige motivo
declarado + entrada no `REGISTRO.md` + commit próprio. `README.md` não está congelado.
