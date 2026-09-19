# Congelamento da infraestrutura — 19/09/2026

A partir desta data, a **infraestrutura** do Projeto Ciclo está **congelada**.
Isso significa que os componentes abaixo **não mudam por padrão** — só por
motivo declarado, com commit próprio e entrada no `REGISTRO.md`.

## O que está congelado

- `PROTOCOLO.md` — as 22 pétreas
- `REGRAS.md` — as 17 regras + 5 pré-requisitos
- `tools/` — geradores, validadores, hooks
- `tools/templates/` — CSS, HTML, JS da navbar
- `prompts/` — eliciação e instalação de ciclos
- `biblioteca/guia-do-professor.md`

## O que continua livre

- **Conteúdo**: aulas, cadernos, relatórios, acompanhamentos
- **POs**: novos POs (quando o professor responde); PO do próximo ciclo (P-02)
- **Harmonizações**: cada ciclo novo gera a sua
- **Correções de conteúdo**: quando um material publicado tem erro factual
- **Novos documentos**: que sigam a estrutura já definida

## O que exige motivo declarado

- Alterar qualquer arquivo listado em "O que está congelado"
- Alterar a lógica de hash, validação ou geração
- Alterar a estrutura de menu ou navegação
- Adicionar nova pétrea ou alterar alguma existente

Motivo declarado significa: o commit tem um corpo explicando o **porquê**, o
`REGISTRO.md` ganha uma entrada, e a mudança tem o seu próprio commit (não vai
junto com conteúdo).

## Por que congelar

A infraestrutura está funcional há mais de duas semanas, com:
- 2 ciclos publicados (Duo, Ritmos)
- 2 POs validados
- 1 relatório pós-aula
- 1 primeiro ciclo completo (PO → aula → caderno → relatório → acompanhamento)
- Hash FIPP encadeado, deploy automático via Netlify
- Harmonização estrutural em ambos os ciclos (P-17)

Continuar mexendo na infraestrutura sem motivo é trabalho que não gera valor
— e arrisca quebrar o que já funciona. O que gera valor agora é **conteúdo**.
