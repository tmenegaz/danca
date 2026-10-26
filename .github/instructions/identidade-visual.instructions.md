---
description: "Regras para quem cria, move ou altera qualquer coisa que apareça na tela: a peça vem do catálogo, nunca é inventada; a peça nova nasce na folha, no catálogo e na prova; e o que se mede é a geometria, não o gosto."
applyTo: "motor/servidor/**,motor/nucleo/**,tools/templates/**,porta/**,raiz/**,apresentacoes/**"
---
# Identidade visual — o que ler antes de escrever marcação

`IDENTIDADE-VISUAL.md` (raiz) é o **contrato**; `tools/templates/ciclo.css` é a **fonte de
verdade**. Este arquivo é o lembrete curto para quem vai pôr algo na tela: leia-o **antes** de
escrever o primeiro `<div>`.

## A pergunta, antes da marcação

**O que isto É?** A resposta escolhe a peça, e a peça já tem desenho:

| O que é | Peça |
| --- | --- |
| o que a pessoa preenche | `campo` (`.campo-rotulo` + `input`/`select`/`textarea`) |
| o que o sistema **declara** | inscrição — texto, **nunca** um `input` desabilitado |
| escolha entre poucas, todas à vista | **pílula** (`.escolhas` / `.escolha`), `radio` se é uma, `checkbox` se são várias |
| escolha entre muitas, ou variável | **`escolhedor`** |
| valor único de lista fechada, com rótulo próprio | `select` + `.campo-rotulo` |
| uma **ordem** (acontece ao clicar) | `.acao` (`secundario`, `perigo`, `grande`, `pequena`) |
| um **estado** ou atributo do dado | `.selo` |
| bloco de leitura | `.caixa` (+ `nota`, `falta`) |
| resultado de uma ação | `.res` (`ok`/`erro`) |
| alerta no meio do conteúdo | `.aviso` |
| janela por cima | `.modal` |
| barra do sistema, índice da página | gerados (`nav.js`) — **não** se escreve à mão |

O quadro completo, com marcação e estados, é a secção **«O catálogo das peças»** de
`IDENTIDADE-VISUAL.md`. Consulte-o antes de decidir; ele é curto.

## As quatro regras que não se negociam

1. **Nenhuma classe nasce no uso.** Se a marcação precisa de um contentor, ou ele é uma peça do
   catálogo, ou é um **gancho** declarado com razão em `tools/check-identidade.js` (lista
   `GANCHOS`). A checagem **8 (Peça)** reprova o resto.
   *Foi assim que `<div class="fileira">` passou e os dois botões saíram encostados: classe
   inexistente, desenho nenhum.*
2. **Uma peça não se usa fora do contexto em que está declarada.** `form .nota` só existe dentro
   de um `<form>`; fora dele o parágrafo sai com o corpo do texto.
   *Foi assim que a nota da Aparência saiu a 17px ao lado de controles de 14.*
3. **Uma peça não faz o trabalho de outra.** Ação é ordem; estado é pílula ou selo; atributo do
   dado é selo. `.acao[aria-pressed]` foi removido por isso.
4. **Nada de `style=""` na marcação, e nenhum hex fora de `ciclo.css`.** Cor se usa por **papel**
   (`--fundo`, `--marca-texto`…), nunca por primitivo (`--cream`, `--burgundy`).

## Onde estou — aprofundar não é sair (norma, 26/10/2026)

Duas marcas, e as duas dizem a mesma coisa: o **caminho na barra** (`Grupo · Lista · Documento`,
ao lado da logomarca) e o **item do menu** de onde o documento saiu (`aria-current` no item,
`data-atual="sim"` no grupo). No telemóvel é o mesmo HTML e a mesma marca — muda a largura; e o
caminho, no corte dos 768px, fica **só com o último degrau** (o nome do documento), porque o grupo
e a lista são o caminho de volta e a folha do ☰ já é esse caminho.

A conta é **uma só**: `TRILHA_DO_DOCUMENTO`, em `motor/nucleo/nav.js`. Um ecrã novo que nasça de
uma lista declara-se lá (uma linha: expressão do caminho, grupo, rótulo, `href`); um que nasça de
uma porta/formulário traduz-se em `FAMILIAS`/`listaDaPorta`; um que não nasça de lista nenhuma
**não se marca**. Não se escreve uma segunda tabela, e não se acende «para não ficar vazio».

A norma completa, com a tabela das famílias e o motivo de cada degrau, é a secção **«Onde estou —
o caminho na barra e a marca no menu»** de `IDENTIDADE-VISUAL.md`. As provas que a guardam:
`provar-barra-unica.js` (secção D1) e `provar-painel-do-ato.js` (secção 17, em navegador).

## O menu de trabalho não rola com a página (norma, 26/10/2026)

Os dois menus que servem para navegar **ficam** enquanto a página rola: a coluna do sistema
(`.coluna`, `position: fixed`) e a lateral da Produção (`.lateral`, `position: sticky` com
`align-self: start` e `height: calc(100vh - var(--header-height))`). Se o menu for mais alto do que
a janela, ele rola **dentro de si** (`overflow-y: auto`) — nunca a página a empurrá-lo para fora, e
nunca com a caixa a crescer até à altura do conteúdo (era isso que anulava o `sticky`).

No celular nada disto vale: abaixo de 768px a `.lateral` é uma barra com o botão «Seções».
A secção **«O menu de trabalho não rola com a página»** de `IDENTIDADE-VISUAL.md` tem o porquê e a
medida; a prova é a `provar-menu-da-producao.js` (e ela tem controle negativo).

## Peça nova: nasce inteira, no mesmo commit

1. o desenho em `tools/templates/ciclo.css`, com **todos** os estados (base, `:hover`,
   `:focus-visible`, `:disabled` e os modificadores), e só tokens de papel;
2. uma linha no **Quadro 1** e outra no **Quadro 2** do catálogo;
3. a prova num navegador de verdade (`experimentos/provar-*.js`) — a **geometria** medida:
   altura, vão, quebra de linha, alvo de toque;
4. a cópia em `assets/style.css` das superfícies que a usam.

Enquanto faltar qualquer um dos quatro, a peça **não existe**.

## O que rodar antes de dizer «pronto»

```bash
node tools/check-identidade.js      # 8 checagens: contraste, cópia, papel, forma, peça…
node experimentos/provar-celular.js # geometria em 320/360/390/414/768/1024
node experimentos/provar-producao.js
```

E, se a mudança tocar a barra ou o tema: `provar-tema.js`, `provar-aparencia.js`,
`provar-selo.js`.

## O que não se mede com prova, e por isso tem regra

Gosto não se prova. É por isso que a decisão está no **catálogo** e não no olho: quando a peça
está certa, a discussão sobre a aparência acaba — e quando ela não existe, o defeito aparece na
checagem, e não na tela do usuário.
