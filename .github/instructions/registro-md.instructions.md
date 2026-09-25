---
description: "Convenções de edição do REGISTRO.md: ordem cronológica (recente no fim), estrutura das cinco seções, motivo declarado para documento congelado, nota de correção datada, e o rodapé Refs/Regras/Auditoria do commit."
applyTo: "REGISTRO.md"
---
# REGISTRO.md — marcos metodológicos

Log **descritivo** do sistema (P-06), não caderno pedagógico. Registra o que foi decidido e por
quê, para que a decisão seja rastreável depois de o contexto da conversa se perder.

## Ordem: a mais recente no FIM

O arquivo é **cronológico crescente**. `tools/gerar-handoff.sh` extrai a **última** entrada como
"última entrada do REGISTRO" — inserir no topo publica o marco errado no `HANDOFF.md`.
**Acrescente no fim; nunca reordene nem apague entrada existente.**

## Estrutura da entrada

```markdown
## DD/MM/AAAA — Título curto do marco

**O que motivou.**      Por que entrou na pauta: o erro, a lacuna, a leitura errada.
**O que foi decidido.** A decisão, em bullets, cada uma na redação canônica.
**Onde entrou.**        `arquivo` — o que mudou, uma linha por arquivo.
**Motivo declarado — os congelados.**   ← só quando tocar arquivo de `CONGELAMENTO.md`
**Com o quê.**          Lista exaustiva dos arquivos tocados.
**Referências.**        Documentos e autores que sustentam a decisão.
**O que ainda não está feito.**  O que fica aberto — sem isto, a próxima sessão acha que acabou.
```

O **"O que ainda não está feito"** não é opcional: é o que impede a próxima sessão de assumir
conclusão. Diga também se o trabalho ficou **pela metade** — ex.: âncora regerada mas pacote
**não** regerado.

## Motivo declarado — os congelados

`CONGELAMENTO.md` congela `PROTOCOLO.md`, `REGRAS.md`, `tools/`, `tools/templates/`, `prompts/`,
`biblioteca/guia-do-professor.md` e `METODO.md`. Alterá-los exige **três coisas**:

1. **motivo declarado** — commit com corpo explicando o **porquê**;
2. **entrada neste arquivo** — com a seção `**Motivo declarado — os congelados.**`;
3. **commit próprio** — a mudança **não vai junto** com conteúdo.

Ao declarar o motivo, diga **o que não muda**: fórmula de hash, cobertura, validadores, regras e
pétreas. Se a alteração muda **comportamento** (não só redação), **pare e confirme com o usuário**
— o congelamento não é obstáculo a contornar.

> **`prompts/` (raiz) é congelado; `.github/prompts/` não é.** São pastas diferentes.

## Reancoragem

Alterar uma **fonte de ciclo** (os `.md`/`.conf` cobertos pelo `.fipp` — inclusive
`*-harmonizacao.md`) muda o hash. Nesse caso, **declare a reancoragem na entrada** e regenere com
`tools/hash-ciclo.sh <professor> <ciclo> <escola>`; confirme com `--check`. Editar `AGENTS.md`,
`README.md` ou `.github/` **não** exige reancorar.

## Correção de redação já publicada

A proveniência **acrescenta, não edita** (P-03/P-04). Não apague a redação errada: acrescente uma
nota datada **dentro da própria entrada**.

> **Correção de DD/MM/AAAA (mesmo dia).** A primeira redação desta entrada dizia "…". **Está
> errado**: … . A redação foi corrigida em … . A versão anterior não é apagada: fica como o elo
> que registra o que se pensou antes da correção.

## O commit

O hook `tools/hooks/commit-msg` recusa sem o formato e os rodapés:

```
docs(registro): <descrição>

<corpo: o porquê>

Refs: REGISTRO.md
Regras: <regras aplicadas>
Auditoria: sim|não
```

**Não commite nem faça push sem solicitação explícita do usuário.**

## Fluxo completo

Para a identidade do projeto (varredura de deriva, decisão congelado/gerado/livre, regeneração
do `HANDOFF.md`), siga a skill `.github/skills/identidade-do-projeto/SKILL.md` — este arquivo fixa
apenas as travas do `REGISTRO.md`.
