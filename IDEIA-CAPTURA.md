# Ideia — Formulário de captura em JSON

> **Escopo.** Documento do **Projeto Ciclo** — a memória da aula dada. Este projeto é
> **protótipo**, testado no **universo da dança** (não é agnóstico: o projeto agnóstico será
> criado a partir dele). Ele **não avalia** (a avaliação é fronteira de outro módulo) e **não
> implementa o FIPP** — o Framework de Infraestrutura de Proveniência Peirceana pertence ao
> projeto de mestrado, em outro diretório. O que existe aqui é uma **âncora de proveniência
> encadeada** (`tools/hash-ciclo.sh` → `.fipp`), aproximação daquele framework.

> **Resumo (para o HANDOFF):** formulário dinâmico com JSON por ciclo —
> substitui as capturas, relatórios e acompanhamentos `.md` individuais.
> Não implementado.

> **Documento de intenção.** Este documento descreve uma ideia para uma
> versão futura do Projeto Ciclo — não uma implementação atual. Hoje, o
> projeto usa arquivos `.md`. A ideia abaixo substitui esse modelo por um
> formulário dinâmico com JSON.

## O problema que a ideia resolve

Hoje, cada aula gera arquivos separados: uma captura (`captura-aula-XX.md`),
um **guia de observação** (um por aula; desde 20/09/2026 o pacote o gera) e um relatório
(`relatorio-aula-XX.md`), mais os acompanhamentos por aluna
(`acompanhamento-<apelido>.md`). Em um ciclo de 12 aulas (Duo) ou 21 (Ritmos),
são ~30 arquivos por ciclo.

> **Nota (2026-09-20).** O guia de observação se chamava `relatorio-aula-XX` e o
> `title:` dele dizia "Relatório pós-aula … (preview)" — a chave **mentia**, e o
> rótulo do menu era corrigido no gerador para disfarçar. A chave passou a se
> chamar o que o documento **é** (`guia-de-observacao-XX`), e o remendo saiu.
> Com isso, `relatorio-aula-XX` volta a significar **só o relatório** — que é o
> que este documento propõe gerar sob demanda.

Consequências:

- O menu cresce indefinidamente
- A visualização por aluna exige juntar arquivos manualmente
- A visualização por aula exige abrir arquivos separados
- Cada arquivo novo exige geração, hash, segurança

## A arquitetura proposta

```
PO (o que observar no ciclo) + Aula (o que trabalhar hoje)
    ↓
Formulário dinâmico (um só, por ciclo)
    ↓
JSON (um por ciclo) — armazena os valores lançados e os textos
    ↓
Exibição: por aula · por aluna (filtros em memória; o período é informação, não filtro)
```

**O que o PO fornece ao formulário:**

- Apelidos das alunas
- O que observar (fenômeno)
- Linha de base (dificuldades de cada uma)

**O que a aula fornece ao formulário:**

- Tipo de trabalho (balé tradicional, pas de deux, barra, solo, etc.)
- Exercícios e objetivo específico
- Parâmetros de medição

**O que o JSON armazena:**

- Os valores lançados (✓, ~, X, nomes, durações)
- Os textos do relatório
- A data e o número da aula

## O fluxo de uso

**Antes da aula:**

- O professor abre o formulário
- Seleciona a aula no `select`
- O formulário mostra os campos em branco (se ainda não lançada) ou os dados já lançados

**Durante a aula:**

- O professor marca os valores no formulário

**Depois da aula:**

- O professor lança os dados → o formulário grava no JSON
- Escreve o texto do relatório → também vai para o mesmo JSON
- Baixa o JSON atualizado e commita

**Visualizar:**

- O mesmo formulário, ao escolher a aula, carrega os dados do JSON
- O filtro por aluna mostra tudo o que é dela, aula a aula
- O período do ciclo aparece como **informação**, não como filtro: filtrar por data
  esconderia aulas, e o período é um fato declarado do ciclo

**Gerar um entregável (sob demanda):**

- O caderno, o relatório pós-aula e o acompanhamento por aluna saem pelo botão **Gerar**,
  no filtro que o professor quiser — quando precisa de um arquivo para entregar

## Um JSON só (não dois)

Há uma tentação de separar em dois arquivos: `payload.json` (fonte) e
`consulta.json` (vistas pré-calculadas). **Não vamos fazer isso.**

As vistas (por aula, por aluna) são **transformações** do payload —
não armazenamento. O formulário calcula em memória. Se em algum momento o filtro
ficar lento, aí sim otimiza — mas para 12 ou 21 aulas, um JSON só é instantâneo.

**Um arquivo, um estado, um commit.**

## O que NÃO muda

- **A proveniência:** cada estado do JSON é um commit. O Git continua sendo o banco.
- **O hash:** o JSON entra no hash como fonte.
- **As vistas saem da cobertura.** Quando uma vista passa a ser **gerada** (o caderno, o
  relatório, o acompanhamento, o guia de observação), ela **deixa de ser fonte** e sai da
  cobertura do hash — o **JSON entra no lugar dela**. A âncora de cada ciclo é regerada uma
  vez, com motivo declarado (P-03: a âncora alinha; o passado não se reescreve, se incorpora).

  > **Nota (2026-09-20).** Na implementação, quem **saiu da cobertura até agora é o guia de
  > observação** — o único derivável por inteiro das duas entradas (`8ec57ec`). O **caderno** e o
  > **relatório** continuam fontes de registro: são escritos por quem viveu a aula, e o JSON deles
  > ainda está vazio (peça 1). A decisão fixa o destino — quando o dado existir, eles saem pelo
  > mesmo caminho.
- **O que é AUTORADO continua `.md`:** o PO, o plano, a aula, a notação e o documento de apoio
  da musicalidade. O que é **VISTA** passa a ser gerado: o caderno, o relatório, o
  acompanhamento por aluna e o guia de observação. A **musicalidade é caso à parte** — o
  documento é autorado (os cinco conceitos), e a vista gerada (a dimensão do PO, o bloco do
  plano e os marcos que a citam) **alimenta** o documento, não o substitui.
- **As pétreas e regras:** intactas.
- **O PO e a aula:** continuam `.md`.
- **O caderno:** continua no formato `.md` — mas **gerado sob demanda** pelo formulário,
  como o acompanhamento por aluna (não é escrito à mão nem mantido atualizado
  automaticamente).
- **Nenhum backend:** o formulário é HTML + JavaScript. Salvar = baixar o arquivo.

## O que muda (quando for implementado)

- O **gerador** passa a ler JSON
- O **`check-pacote`** valida JSON
- A **segurança** do JSON: **não publicado** — fora do pacote e do site, versionado no Git do
  repositório privado, como o PO e o relatório. (Não confundir com os `.md` de acompanhamento,
  que são derivados e por isso ficam fora do Git.)
- O **menu**: "Acompanhamento" fica só com conteúdo (os acompanhamentos por aluna + o
  caderno); o formulário — como o preview do relatório e a folha de captura — é
  **ferramenta**, e vai para a "Área do Professor"
- Os arquivos `captura-aula-XX.md`, `relatorio-aula-XX.md` e `acompanhamento-<apelido>.md` deixam de existir

**Os artefatos de saída são gerados sob demanda.** O caderno, o relatório pós-aula e o
acompanhamento por aluna são **vistas dos dados já lançados**: o professor clica em
"Gerar" quando precisa de um arquivo para entregar (enviar, imprimir, arquivar), com o
filtro que quiser. **Nada é mantido atualizado automaticamente.** O JSON é o
armazenamento; os `.md` são os entregáveis.

## O que precisa ser implementado (quando for hora)

1. Formulário HTML com `select` de aulas e filtro por aluna
2. Carregamento do JSON no navegador
3. Gravação (download do JSON atualizado)
4. Visualização por aula e por aluna (o período é **informação**, não filtro)
5. Integração com o gerador

## Quando faz sentido implementar

**Não agora.** O projeto está funcionando com `.md` — 2 ciclos, aulas em
andamento. Migrar agora significa reescrever o gerador, o `check-pacote`, a
segurança e o menu.

**Quando o produto comercial nascer** (se nascer), a migração faz sentido. Até
lá, a ideia fica documentada.

## Referências

- `PROTOCOLO.md` — as 22 pétreas
- `REGRAS.md` — as 17 regras
- `METODO.md` — a visão de mundo do projeto
- `CONGELAMENTO.md` — o que está congelado
