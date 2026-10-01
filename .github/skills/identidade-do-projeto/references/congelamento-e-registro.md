# Congelamento e o formato do REGISTRO.md

## A regra

`CONGELAMENTO.md` (19/09/2026) congela a infraestrutura: os itens abaixo **não mudam por padrão**.

```
PROTOCOLO.md          as 22 pétreas
REGRAS.md             as 17 regras + 5 pré-requisitos
tools/                geradores, validadores, hooks, criptografia
tools/templates/      CSS, HTML, JS da navbar
prompts/              Elicitação e instalação de ciclos
biblioteca/guia-do-professor.md
METODO.md             declaração de princípio
```

**Livre:** conteúdo (aulas, cadernos, relatórios, acompanhamentos), POs novos, harmonizações,
correções factuais, documentos novos que sigam a estrutura definida — e os documentos de identidade
(`AGENTS.md`, `README.md`, `README-ciclos.md`, `CONGELAMENTO.md`, `IDEIA-*`, `ARQUITETURA-*`, `.github/`).

## Alterar um congelado exige três coisas

1. **Motivo declarado** — o commit tem corpo explicando o **porquê**.
2. **Entrada no `REGISTRO.md`**.
3. **Commit próprio** — a mudança **não vai junto** com conteúdo.

> **Caminho preferido: mudança cirúrgica e só de escopo.** No precedente de 23/09, `PROTOCOLO.md` e
> `REGRAS.md` foram tocados **sem alterar nenhuma das 22 pétreas nem das 17 regras**: só a redação de
> escopo. Nenhum comando, validador ou hash mudou, e a **âncora não foi regerada** —
> `hash-ciclo.sh … --check` seguiu passando. Se a sua alteração muda comportamento (não só redação),
> **pare e confirme com o usuário**: o congelamento não é obstáculo a contornar.

## Formato da entrada no REGISTRO.md

**Ordem cronológica: a mais recente no FIM.** O `tools/gerar-handoff.sh` extrai a **última** entrada
como "última entrada do REGISTRO" — inserir no topo publica o marco errado.

```markdown
## DD/MM/AAAA — Título curto do marco

**O que motivou.**
Por que isto entrou na pauta. Qual leitura errada, erro ou lacuna provocou a mudança.

**O que foi decidido.**
- As decisões, em bullets. Cada afirmação de identidade, na redação canônica.

**Onde entrou.**
- `arquivo` — o que mudou nele, em uma linha por arquivo.

**Motivo declarado — os congelados.**        ← só quando houver congelado
`ARQUIVO.md` está na lista de `CONGELAMENTO.md`; a alteração é **cirúrgica e só de escopo**,
sem tocar em nenhuma das N regras/pétreas: <o que exatamente mudou>. O que **não** muda:
comandos, validadores, hash. A **âncora não foi regerada** e `--check` segue passando.
O porquê: <motivo>.

**Com o quê.**
`arquivo1`, `arquivo2`, … (lista exaustiva dos arquivos tocados)

**Referências.**
Documentos e autores que sustentam a decisão.

**O que ainda não está feito.**
O que fica em aberto — sem isso, a próxima sessão acha que está pronto.
```

### Nota de correção (quando a redação errada saiu antes)

Se uma formulação errada já foi publicada, **não** a apague: acrescente, dentro da própria entrada,
uma nota datada do tipo:

> **Correção de DD/MM/AAAA (mesmo dia).** A primeira redação desta entrada dizia que o projeto era
> "**agnóstico e completamente adaptativo**". **Está errado**: o agnosticismo é a meta do **projeto
> sucessor**. A redação foi corrigida em <lista>. A versão anterior não é apagada: fica como o elo que
> registra o que se pensou antes da correção (P-03/P-04 — a proveniência acrescenta, não edita).

## O commit

O hook `tools/hooks/commit-msg` (instalado por `tools/instalar-hooks.sh`) exige:

```
tipo(escopo): descrição curta

<corpo explicando o porquê>

Refs: <arquivo ou seção referenciada>
Regras: <regras aplicadas>
Auditoria: sim|não
```

- **tipos:** `feat|fix|docs|refactor|style|chore|audit`
- **escopos válidos incluem:** `estrutura`, `registro`, `protocolo`, `metodo`, `ideia`, `tools`,
  `regras`, `prompts`, `ciclo-NN`, `aula-NN`, `biblioteca`, `entrega`, `po`, `campo`, `schema`
- Precedente: `3b7aa7c` — `docs(estrutura): a identidade do projeto entra na documentacao (e a ressalva do FIPP)`

**Não commite nem faça push sem solicitação explícita do usuário.**
