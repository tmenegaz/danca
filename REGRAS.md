# As 17 regras do projeto — Formação em Balé Clássico

Documento de referência versionado com o código. Cada aula, ciclo ou apresentação
gerado pelo projeto deve poder ser auditado contra estas regras, e cada commit
declara quais delas aplicou (rodapé `Regras:`).

## Pré-requisitos obrigatórios (o que o professor informa antes de qualquer geração)

| # | Pré-requisito | Observação |
|:--|:--|:--|
| 1 | **Objetivo geral** do ciclo | verificável ao final, com parâmetro |
| 2 | **Objetivo específico** da aula | o marco parcial daquela aula |
| 3 | **Parâmetro de medição** | o que o professor observa para dizer "alcançado" |
| 4 | **Duração da aula**, em minutos | calibra o volume total. **Sem ela, não se gera aula** |

## As 17 regras

| # | Regra | O que garante |
|:--|:--|:--|
| 1 | **Terminologia RAD** | Vocabulário e progressão padronizados (Grade 1 como base) |
| 2 | **Fio condutor** | Exercícios encadeados por causalidade, não por estética |
| 3 | **Estrutura espacial** | Solo → barra → centro, nesta ordem |
| 4 | **Condições preliminares** | Pré-requisitos de força e flexibilidade declarados e contados **à parte** do volume da aula |
| 5 | **Carga e volume** | Volume quantificado e progressivo, com unidade explícita |
| 6 | **Métrica musical** | Compasso, contagem e fases em cada exercício |
| 7 | **Causa e consequência** | Mecanismo, causa anatômica e consequência funcional |
| 8 | **Proveniência objetiva** | Toda afirmação tem origem declarada; o que não tem fonte fica marcado `[conferir]` |
| 9 | **Distribuição de volume** | Duas etapas: teto pela duração, depois distribuição por bloco (solo 30–40%, barra 20–30%, centro 30–40%, musicalidade 5–10%) |
| 10 | **Estrutura de ciclos** | Objetivo geral macro + marcos parciais por aula + rubrica + critério de extensão |
| 11 | **Pensamento sistêmico** | Nenhum movimento isolado: cada exercício nomeia o que habilita adiante |
| 12 | **Observação pedagógica** | Arte ≠ ginástica; uma correção por execução; nada de dor como mérito |
| 13 | **Apanhado histórico** | Conexão ao repertório do balé clássico, com o passo do dia |
| 14 | **Viés de agenciamento** | Potência de agir, não fenomenologia: o corpo percebe, decide e responde |
| 15 | **Musicalidade** | Bloco próprio em cada aula + arquivo paralelo do ciclo |
| 16 | **Formato de entrega** | PDF único consolidado + pacote HTML interligado, com índice, links, bookmarks e rodapé (ver `README-ciclos.md`) |
| 17 | **Versionamento com Git** | Todo conteúdo versionado, com commit auditável (ver abaixo) |

## Regra 17 em prática

| Item | Convenção |
|:--|:--|
| **Tipos de commit** | `feat` · `fix` · `docs` · `refactor` · `style` · `chore` · `audit` |
| **Escopos** | `ciclo-XX` · `aula-XX` · `notacao` · `pre-requisitos` · `musicalidade` · `apanhado` · `apresentacao-XX` · `biblioteca` · `tools` · `regras` |
| **Formato** | `tipo(escopo): descrição curta` + corpo + rodapé |
| **Rodapé obrigatório** | `Refs:` (o que foi tocado) · `Regras:` (quais regras aplicou) · `Auditoria:` (sim/não) |
| **Branches** | `main` = conteúdo auditado · `ciclo-XX` / `apresentacao-XX` = trabalho · `hotfix/...` = urgência |
| **Hooks** | `tools/hooks/pre-commit` (valida o pacote) e `tools/hooks/commit-msg` (valida a mensagem); instalar com `tools/instalar-hooks.sh` |
| **Saídas** | **não** versionadas (`.gitignore`): são reconstruíveis das fontes |

### Comandos úteis de rastreabilidade

```bash
git log --follow ciclos/ciclo-01-aula-01.md     # histórico de um arquivo
git blame  ciclos/ciclo-01-aula-01.md           # quem escreveu cada linha
git log --grep="audit"                          # commits de auditoria
git log --grep="Clippinger"                     # commits que citam uma referência
git log --oneline -- ciclos/ciclo-01/           # histórico de um ciclo
```

> **Premissa 7 — o commit é proveniência.** Cada commit é um nó que registra quem,
> o quê, quando, por quê e com base em qual referência — o mesmo desenho de encadeamento
> por hash usado no projeto de mestrado.
