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
| as ordens de **uma linha de tabela**, empilhadas | `.acoes-da-linha` (coluna com `gap`, botões da mesma largura) |
| a ação que grava um formulário | `.acao` (e `grande` se é a principal) **dentro** de `.par-botoes` |
| **conteúdo com mais de um assunto**, uma secção de cada vez à vista | `.abas` (+ `.aba`, `.aba-painel`) — **é a forma adotada** (16/11/2026); não se empilha em listas longas |
| um **estado** ou atributo do dado | `.selo` |
| bloco de leitura | `.caixa` (+ `nota`, `falta`) |
| resultado de uma ação | `.res` (`ok`/`erro`) |
| alerta no meio do conteúdo | `.aviso` |
| janela por cima | `.modal` |
| barra do sistema, índice da página | gerados (`nav.js`) — **não** se escreve à mão |

O quadro completo, com marcação e estados, é a secção **«O catálogo das peças»** de
`IDENTIDADE-VISUAL.md`. Consulte-o antes de decidir; ele é curto.

**A ação que grava não se põe solta no fim do formulário.** O vão que a folha dá ao botão
(`input + button.acao` → 16px) é uma conta de **vizinhança**, e um `<div class="res">` no meio
parte-a — mesmo sendo `display: none`. Foi assim que «Cadastrar aluna» e «Cadastrar termo»
saíram **encostados** no campo, e que «Atribuir curadoria», sem `.acao`, saiu com outra cor na
mesma página. O modelo é o «Cadastrar professor»: `.acao grande` dentro da fileira
`.par-botoes`. Quem guarda isso é a `experimentos/provar-vao-do-botao.js`.

## As seis regras que não se negociam

1. **Nenhuma classe nasce no uso.** Se a marcação precisa de um contentor, ou ele é uma peça do
   catálogo, ou é um **gancho** declarado com razão em `tools/check-identidade.js` (lista
   `GANCHOS`). A checagem **8 (Peça)** reprova o resto.
   *Foi assim que `<div class="fileira">` passou e os dois botões saíram encostados: classe
   inexistente, desenho nenhum.*
2. **Uma peça não se usa fora do contexto em que está declarada.** `form .nota` só existe dentro
   de um `<form>`; fora dele o parágrafo sai com o corpo do texto.
   *Foi assim que a nota da Aparência saiu a 17px ao lado de controles de 14.*
3. **O conteúdo com mais de um assunto vai em ABAS** (16/11/2026). «A escola», o financeiro, os
Professores e a Audição já vivem assim, e a decisão é de identidade, não de um ecrã: *«Anote aí
também na nossa identidade visual que a gente vai adotar abas […] não cria assim desse jeito
listado, que é muito feio.»* A tira é `.abas`/`.aba` (na folha), o painel é `.aba-painel`, e **a
listagem de uma secção fica fora dos painéis** quando ela serve a todas as abas — é a regra que a
Audição fixou.
4. **Uma peça não faz o trabalho de outra.** Ação é ordem; estado é pílula ou selo; atributo do
   dado é selo. `.acao[aria-pressed]` foi removido por isso.
5. **Nada de `style=""` na marcação, e nenhum hex fora de `ciclo.css`.** Cor se usa por **papel**
   (`--fundo`, `--marca-texto`…), nunca por primitivo (`--cream`, `--burgundy`).
6. **O mesmo número não se diz em três sítios** (17/11/2026). O contrato de uma escola — o **piso**
   que ela contratou e o **teto** do plano — diz-se **uma vez**, no cartão de «A escola». O piso é
   uma garantia *mínima*: a distância até ele **não é um limite**, e escrevê-la num formulário
   sugere um máximo que não existe. A contagem chegou a existir nos formulários de Professores e de
   Alunas e foi retirada no mesmo dia — *«essa informação não pode estar aqui em alunas e nem em
   professores. Só lá na escola, fica sujo, fica poluído.»* O motor continua a travar no piso, e a
   recusa (409) nomeia as saídas; o ecrã não repete o número.

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

Os dois menus que servem para navegar **ficam congelados** enquanto a página rola, e pelo mesmo
mecanismo: `position: fixed`. A coluna do sistema (`.coluna`) e a lateral da Produção (`.lateral`,
`fixed` com `top: 0` e `bottom: 0`, e a faixa de 248px reservada no `padding` do `.corpo`).

**`sticky` não serve nestas telas**, e é uma armadilha que já custou uma tentativa: ele só se desloca
dentro da caixa do contentor, e numa tela de trabalho o contentor é tão alto como o elemento (o
`.corpo` da Produção mede o mesmo que a `lateral`). Se o menu for mais alto do que a janela, rola
**dentro de si** (`overflow-y: auto`).

No celular nada disto vale: abaixo de 768px a `.lateral` é uma barra com o botão «Seções»
(`position: static; width: auto; z-index: auto`).
A secção **«O menu de trabalho não rola com a página»** de `IDENTIDADE-VISUAL.md` tem o porquê e a
medida; a prova é a `provar-menu-da-producao.js` (e ela tem controle negativo).

## A logomarca mora no alto da coluna (norma, 13/11/2026)

A marca **não** fica na barra: é a primeira coisa da coluna, encostada ao topo, nas duas telas —
Sistema Lastro (`1141px`) e Bastidores (`769px`). A identificação («Sistema Lastro» / «Bastidores»)
fica **logo abaixo** dela. A barra começa **depois** da coluna, e nela o título/localização continua
a ser a primeira coisa, à esquerda, com o dropdown «Bastidores» na ponta. No celular a coluna é a
folha e a marca volta a ser a da barra — a regra que a esconde no computador é a que a mantém no
telefone. O desenho mora em `tools/templates/ciclo.css` (componente: a checagem **7a** reprova
quem carrega a folha e o redeclara). A secção **«A logomarca mora no alto da coluna»** de
`IDENTIDADE-VISUAL.md` tem a geometria medida.

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
node experimentos/provar-vao-do-botao.js   # o vão e a cor de cada ação de formulário
```

E, se a mudança tocar a barra ou o tema: `provar-tema.js`, `provar-aparencia.js`,
`provar-selo.js`.

## O que não se mede com prova, e por isso tem regra

Gosto não se prova. É por isso que a decisão está no **catálogo** e não no olho: quando a peça
está certa, a discussão sobre a aparência acaba — e quando ela não existe, o defeito aparece na
checagem, e não na tela do usuário.
