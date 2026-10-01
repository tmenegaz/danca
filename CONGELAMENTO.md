# Congelamento da infraestrutura — 19/09/2026

> **Escopo.** O congelamento é do **Projeto Ciclo** — a memória da aula dada, **protótipo
> testado no universo da dança** (não é agnóstico: o projeto agnóstico será criado a partir
> dele). Cada aula é **planejada** antes de ser dada: o plano (`aula-NN.md`) fixa objetivo,
> marcos e volume, e é ele que dá a **linha de base** — o que se registra é **o que mudou em
> relação ao plano**. A "proveniência" citada aqui é a **âncora encadeada deste repositório**
> (`tools/hash-ciclo.sh` → `.fipp`), que é uma **aproximação** do FIPP; o Framework de
> Infraestrutura de Proveniência Peirceana pertence ao projeto de mestrado, em outro
> diretório, e **não está implementado aqui**.

A partir desta data, a **infraestrutura** do Projeto Ciclo está **congelada**.
Isso significa que os componentes abaixo **não mudam por padrão** — só por
motivo declarado, com commit próprio e entrada no `REGISTRO.md`.

## O que está congelado

- `PROTOCOLO.md` — as 22 pétreas
- `REGRAS.md` — as 17 regras + 5 pré-requisitos
- `tools/` — geradores, validadores, hooks, criptografia dos acompanhamentos
- `tools/templates/` — CSS, HTML, JS da navbar
- `prompts/` — Elicitação e instalação de ciclos
- `biblioteca/guia-do-professor.md`
- `METODO.md` — declaração de princípio (mudar exige motivo declarado)

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
- Alterar a senha de criptografia dos acompanhamentos (exige regenerar os
  pacotes e registrar o motivo)
- Adicionar nova pétrea ou alterar alguma existente

Motivo declarado significa: o commit tem um corpo explicando o **porquê**, o
`REGISTRO.md` ganha uma entrada, e a mudança tem o seu próprio commit (não vai
junto com conteúdo).

## Política de segurança dos dados sensíveis

Os acompanhamentos por aluna contêm dados de menores. Proteção em camadas:

1. **Repositório privado** (GitHub) — protege PO, relatórios, cadernos, `.md`
2. **PDF do ciclo sem acompanhamentos** — o PDF publicado não expõe os dados
3. **Acompanhamentos HTML criptografados** (PageCrypt) — no site, pedem senha
4. **Acompanhamentos `.md` fora do Git** — regeneráveis, não versionados

Alterar qualquer camada exige motivo declarado + commit próprio + entrada no
REGISTRO.

> **A camada 1 é ação manual da pesquisadora**, no GitHub
> (`settings` → *Change repository visibility* → **Private**). Enquanto ela não
> estiver feita, as camadas 2 a 4 são o que protege — e as três juntas já não
> deixam os acompanhamentos em claro em nenhum lugar publicado.

## Por que congelar

A infraestrutura está funcional há mais de duas semanas, com:
- 2 ciclos publicados (Duo, Ritmos)
- 2 POs validados
- 1 relatório pós-aula
- 1 primeiro ciclo completo (PO → aula → caderno → relatório → acompanhamento)
- Âncora de proveniência encadeada (`hash-ciclo.sh`), deploy automático via Netlify
- Harmonização estrutural em ambos os ciclos (P-17)

Continuar mexendo na infraestrutura sem motivo é trabalho que não gera valor
— e arrisca quebrar o que já funciona. O que gera valor agora é **conteúdo**.
