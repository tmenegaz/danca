---
name: identidade-do-projeto
description: 'Use when: propagar, corrigir ou auditar a identidade do Projeto Ciclo nos pontos de entrada da documentação (AGENTS.md, README.md, README-ciclos.md, METODO.md, CONGELAMENTO.md, PROTOCOLO.md, REGRAS.md, IDEIA-*/ARQUITETURA-*.md, .github/ e HANDOFF.md). Cobre a varredura de deriva ("agnóstico", "projeto de mestrado", "FIPP implementado", "cadeia de proveniência FIPP", "pesquisa de mestrado"); a decisão entre arquivo congelado e livre; o motivo declarado e a entrada no REGISTRO.md; a regeneração do HANDOFF.md; e a checagem de que a âncora .fipp não precisa ser reancorada.'
argument-hint: 'o que corrigir — ex.: varredura completa, ou "o README ainda diz mestrado"'
---

# Identidade do Projeto Ciclo — propagar e auditar

Mantém a **identidade do projeto** correta e consistente em **todos os pontos de entrada** — os
arquivos que uma pessoa ou uma sessão nova de IA lê **primeiro**, e de onde sai a leitura errada
quando a identidade está ausente ou viciada.

## Quando usar

- A identidade precisa entrar em documento novo ou já existente.
- Um documento trata o projeto como "de mestrado", "agnóstico" ou como se o FIPP rodasse aqui.
- Suspeita de deriva depois de uma sessão de IA que descreveu o projeto errado.
- Antes de abrir sessão nova: conferir se quem entra sai com o contexto certo.

**Não use** para auditar conformidade de ciclo (apelidos, lacunas, sufixo de escola) — isso é do
agente `ciclo-auditor`. Aqui o objeto é **a identidade do projeto**, não o conteúdo pedagógico.

## A identidade canônica

Cinco afirmações e cinco negações. A redação aprovada, pronta para colar, está em
[`./references/bloco-identidade.md`](./references/bloco-identidade.md) — **use aquela**, não
improvise paráfrase.

| É | Não é |
|:--|:--|
| A **memória da aula dada** — cada aula é **planejada** (`aula-NN.md`, fonte da âncora), e o plano é a **linha de base**; o que se registra é **o que mudou** em relação a ele | — |
| **Protótipo**, testado no **universo da dança** | **Não é agnóstico** — o projeto agnóstico será criado **a partir** dele |
| Aplica um PO, como **experimentação** | **Não é o projeto de mestrado** — o mestrado está em outro diretório |
| Tem **âncora de proveniência encadeada** (`hash-ciclo.sh` → `.fipp`), **aproximação** do FIPP | **Não implementa o FIPP** — o FIPP pertence ao outro projeto |
| **Registra** o cotidiano do professor | **Não avalia** — a avaliação é fronteira de outro módulo |

A leitura errada tem sintoma único: **quem entrava sem contexto saía com o contexto errado.**
Toda edição deste fluxo existe para fechar essa porta.

## Frases de deriva

Procure por estas — são os marcadores de identidade errada:

| Frase de deriva | O que ela induz a concluir |
|:--|:--|
| "pesquisa em andamento (mestrado)", "o projeto de mestrado", "pesquisa de mestrado" | que **este** repo é o projeto de mestrado |
| "o projeto é agnóstico", "agnóstico e adaptativo", "agnóstico e completamente adaptativo" | que o agnosticismo é propriedade **deste** projeto, e não meta do sucessor |
| "cadeia de proveniência FIPP", "hash FIPP", "o FIPP" (como coisa daqui) | que o **FIPP está implementado** aqui |
| "nós implementamos o FIPP", "na arquitetura do FIPP" (sem ressalva) | idem |

Atenção: `FIPP` **aparece legitimamente** em `h2` de cadeia e em nomes de campo (`parentHash`),
e aparece **com ressalva** em documentos já corrigidos. A deriva não é a palavra — é o uso
**sem a ressalva de escopo**. Não faça substituição cega.

## Procedimento

### 1. Levantar a deriva

Varra os pontos de entrada. Use [`./references/pontos-de-entrada.md`](./references/pontos-de-entrada.md)
como lista de verificação — ele traz, por arquivo, se é congelado, gerado ou livre.

```bash
grep -rn "mestrado\|agnóstic\|agnostico\|FIPP" --include='*.md' \
  AGENTS.md README.md README-ciclos.md METODO.md CONGELAMENTO.md PROTOCOLO.md \
  REGRAS.md IDEIA-*.md ARQUITETURA-*.md .github/ HANDOFF.md
```

Ou rode o script empacotado, que faz a mesma varredura já restrita aos pontos de entrada:
[`./scripts/varrer-deriva.sh`](./scripts/varrer-deriva.sh) `[raiz-do-repositorio]`
(sem argumento, usa a raiz do Git do diretório atual; sai com código 2 fora de um repositório).

Classifique cada achado: **deriva** (identidade errada) · **legítimo** (com ressalva de escopo ou
nome de campo) · **suspeita** (precisa de decisão humana).

### 2. Decidir: congelado, gerado ou livre

Antes de escrever **um caractere**, classifique o arquivo. A decisão muda o trabalho:

| Classe | Arquivos | Como tratar |
|:--|:--|:--|
| **Congelado** | `PROTOCOLO.md`, `REGRAS.md`, `METODO.md`, `tools/`, `tools/templates/`, `prompts/`, `biblioteca/guia-do-professor.md` | **Pare.** Exige motivo declarado + entrada no `REGISTRO.md` + **commit próprio** |
| **Gerado** | `HANDOFF.md` (sai de `tools/gerar-handoff.sh`) | **Nunca edite à mão.** Corrija o **gerador** e regenere |
| **Livre** | `AGENTS.md`, `README.md`, `README-ciclos.md`, `IDEIA-*.md`, `ARQUITETURA-*.md`, `CONGELAMENTO.md`, `.github/agents/`, `.github/instructions/`, `.github/prompts/` | Edite direto |

Duas confusões que já custaram caro:

- **`prompts/` ≠ `.github/prompts/`.** A pasta `prompts/` da raiz (`elicitar-ciclo.md`,
  `instalar-ciclo.md`) é **congelada**. `.github/prompts/` é onde vivem os prompts de agente e
  **não** está no congelamento.
- **`CONGELAMENTO.md` é livre** (declara o congelamento), mas os documentos que ele **lista** não são.

Se a mudança tocar um congelado, siga [`./references/congelamento-e-registro.md`](./references/congelamento-e-registro.md).

### 3. Escrever a identidade

- **Documento de entrada** (topo do arquivo): bloco de identidade **antes** de qualquer outra coisa.
  Em `AGENTS.md` e `README.md`, a identidade vem **primeiro** — é o que se lê antes de tudo.
- **Documento temático** (`METODO.md`, `README-ciclos.md`, `IDEIA-*`, `ARQUITETURA-*`): **nota de escopo**
  no topo, curta, que declara o que o projeto é e onde está o FIPP.
- **Agentes e instructions** (`.github/`): uma seção **"Escopo do projeto"**, com a ordem explícita de
  **não** chamar o repo de projeto de mestrado nem a âncora de FIPP. O agente que não recebe isso
  repete a deriva na sessão seguinte.
- **Prompt de agente** (`.github/prompts/`): a trava vai como item de "Travas", no imperativo.

Lacuna de identidade é deriva: se você **não sabe** se uma afirmação vale, escreva
`[Preencher: identidade — …]`, nunca complete por conta própria.

### 4. Preservar o elo anterior

A proveniência **acrescenta, não edita** (P-03/P-04). Ao corrigir uma redação errada **já publicada**:

- **não** reescreva silenciosamente — acrescente uma **nota de correção datada** (foi o que se fez:
  *"Correção de 23/09/2026 (mesmo dia). A primeira redação desta entrada dizia… Está errado."*);
- registre no `REGISTRO.md` o que se **pensou antes**, como elo, não como texto apagado.

Corrigir o passado apagando-o quebra exatamente o princípio que o projeto defende.

### 5. Registrar, se houve congelado

Entrada no `REGISTRO.md` — **a mais recente no fim** (ordem cronológica; o `gerar-handoff.sh` extrai
a última). Estrutura e exemplo preenchido em
[`./references/congelamento-e-registro.md`](./references/congelamento-e-registro.md).

### 6. Regenerar o HANDOFF

`HANDOFF.md` é o **primeiro artefato que uma sessão nova lê**. Ele precisa **emitir** a identidade:

1. corrija a emissão em `tools/gerar-handoff.sh` (congelado: motivo declarado);
2. regenere: `tools/gerar-handoff.sh`;
3. confirme que o `HANDOFF.md` novo traz a identidade no topo.

### 7. Verificar

- **Deriva residual:** repita a varredura do passo 1. `grep` tem de voltar só com usos legítimos.
- **Cobertura da âncora:** `tools/hash-ciclo.sh <professor> <ciclo> <escola> --check`.
  O `.fipp` cobre **só** `professores/<professor>/ciclos/ciclo-XX.conf`, `ciclo-XX-<escola>.conf` e os
  `ciclo-XX-*.md`. Editar `AGENTS.md`, `README.md` ou `.github/` **não** exige reancorar — e **não
  reancore** se nenhuma fonte de ciclo mudou.
- **Rodapés do commit:** `Refs:`, `Regras:`, `Auditoria:` — o hook `commit-msg` recusa sem eles.

## Critério de conclusão

Só está pronto quando **as quatro** valem:

1. Todo ponto de entrada de
   [`./references/pontos-de-entrada.md`](./references/pontos-de-entrada.md) declara a identidade —
   ou está justificadamente fora dela.
2. A varredura de deriva volta limpa.
3. Se houve congelado: motivo declarado + entrada no `REGISTRO.md` + commit próprio.
4. `HANDOFF.md` regenerado, com a identidade no topo.

Não infle o trabalho: achado sem frase de deriva que o sustente é ruído. Diga o que **não** foi
possível verificar.
