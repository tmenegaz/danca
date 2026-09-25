# Pontos de entrada — mapa de verificação

Arquivos por onde uma pessoa ou uma sessão nova de IA entra no repositório. É esta a lista que
o passo 7 ("verificar") confere. **Ordem = ordem de leitura real.**

| # | Arquivo | Classe | Identidade esperada | Onde |
|:--|:--|:--|:--|:--|
| 1 | `HANDOFF.md` | **gerado** | bloco de identidade no topo | seções "O que é este projeto" e "Estado do projeto" |
| 2 | `AGENTS.md` | livre | **primeiro**, antes de tudo | `## O que é este projeto (leia antes de qualquer coisa)` |
| 3 | `README.md` | livre | seção inteira de negações | `## O que este repositório não é` |
| 4 | `CONGELAMENTO.md` | livre | nota de escopo no topo | `> **Escopo.**` |
| 5 | `METODO.md` | **congelado** | nota de escopo + ressalva do FIPP | `> **Nota de escopo.**` e `> **Sobre o FIPP.**` |
| 6 | `README-ciclos.md` | livre | nota de escopo no topo | `> **Onde isto se encaixa.**` |
| 7 | `PROTOCOLO.md` | **congelado** | ressalva de escopo datada | logo após o glossário (~L19) |
| 8 | `REGRAS.md` | **congelado** | premissa com "o mesmo princípio de encadeamento" | Premissa 7 (~L74) |
| 9 | `IDEIA-CAPTURA.md` | livre | nota de escopo no topo | `> **Escopo.**` |
| 10 | `ARQUITETURA-CAPTURA.md` | livre | nota de escopo no topo | `> **Escopo.**` |
| 11 | `.github/agents/ciclo-entrega.agent.md` | livre | seção `## Escopo do projeto` | após a frase de papel |
| 12 | `.github/agents/ciclo-auditor.agent.md` | livre | seção `## Escopo do projeto` | após a frase de papel |
| 13 | `.github/instructions/ciclo-fontes.instructions.md` | livre | 1º parágrafo do corpo | após o `#` título |
| 14 | `.github/prompts/instalar-ciclo.prompt.md` | livre | item nas "Travas" | `## Travas` |

## Fora do escopo de identidade

- `apresentacoes/**` — documento do deck; tem regras próprias (pétreas A1–A5/B1–B6, no README da apresentação).
- `experimentos/**` — demonstrativo; não entra em pacote, hash nem publicação.
- `professores/**`, `biblioteca/**`, `protocolo/**`, `departamentos/**` — conteúdo e método operacional.
- Os `README.md` de pacote gerado (`professores/<prof>/ciclos/ciclo-XX/README.md`) — **saída gerada**.

## Arquivos de identidade que ainda podem exigir varredura

Documentos que **já carregam** a identidade — confirme que a redação é a canônica, não uma
variante antiga:

- `.github/agents/deck-rizoma.agent.md` (frente de apresentação)
- `.github/instructions/ciclo-fontes.instructions.md`
- `biblioteca/README.md`, `biblioteca/guia-do-professor.md` (este é **congelado**)
- `departamentos/README.md`, `professores/README.md`
- `prompts/instalar-ciclo.md` (congelado — cita o FIPP ao explicar a cadeia)

> **Regra de leitura.** Nesses arquivos, `FIPP` **pode** ser legítimo (nome de cadeia, campo
> `parentHash`, citação com ressalva). O que não pode é o uso **sem ressalva de escopo**.
