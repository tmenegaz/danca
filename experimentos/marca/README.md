# A marca em vetor — o que foi traçado, e o que não se inventou

`18/10/2026`. Esta pasta guarda o **traçado** da logomarca do Sistema Lastro e o script que o
produz. Ela existe porque os dois arquivos que a direção enviou, apesar do nome, **não eram
vetores**.

## O que chegou, e o que se fez com isso

| o que foi enviado | o que é de verdade |
|:--|:--|
| `img/logo_vermelho.svg` (106KB) | um `<svg>` com um **PNG de 79KB em base64** dentro de um `<image>` |
| `img/logo_prata.svg` (134KB) | idem, PNG de 100KB |
| `img/logo_*.png` (9 arquivos) | os originais raster, 96–137KB cada |

Consequências medidas: a cor não se troca por `fill`; a forma não se limpa ao ampliar; e o peso
contraria a regra do projeto («imagem não entra no servidor porque pesa»). `img/` está no
`.gitignore` — imagem de referência não entra no repositório.

## O que está aqui

| arquivo | o que é |
|:--|:--|
| `lastro.svg` | **a geometria**, `fill="currentColor"` — a cor vem do CSS. É o arquivo de origem |
| `logo-vermelho.svg` | a mesma geometria, `fill="#6f0913"` (a cor amostrada da arte) |
| `logo-prata.svg` | a mesma geometria, `fill="#b3b4b5"` |
| `vetorizar.js` | o gerador: alfa → contorno subpixel → Béziers → SVG → **medida** |

Os três SVGs têm **os mesmos quatro `<path>`** (`petala-1` … `petala-4`), com os mesmos `d`.
Não são três desenhos: são três cores do mesmo desenho. Corrigir um nó corrige os três.

```bash
node experimentos/marca/vetorizar.js                # grava lastro.svg e mede
node experimentos/marca/vetorizar.js --variantes    # grava também as duas cores fixas
node experimentos/marca/vetorizar.js --inline       # imprime o <svg> para embutir
```

## O resultado, medido

```
contornos 4 · béziers 80 · 3,6KB · viewBox 0 0 249.21 291.95
fidelidade (IoU contra a alfa da referência): 0.9796
 · petala-1  38 curvas  19522px²   a pétala maior, que desce na cauda
 · petala-2  18 curvas   7552px²   a pétala da esquerda
 · petala-3  12 curvas   5122px²   a de cima, à esquerda
 · petala-4  12 curvas   5057px²   a de baixo, à esquerda
```

**0,980 de IoU** quer dizer, na prática, uma diferença média de borda de ~0,4px na largura de
251px da arte — invisível em qualquer tamanho de uso. O número não é declaração: o script
rasteriza o **próprio SVG** (varredura com supersampling vertical) e compara com a alfa da
referência.

Não há `<image>`, não há base64, não há `<filter>`: quatro `<path>` com curvas cúbicas.

## A decisão que não foi tomada por conta própria

**A marca entregue não tem cinco pétalas separadas.** Tem **quatro silhuetas fechadas** — três
à esquerda e a maior à direita, que desce numa cauda. As separações entre elas são **canaletas
transparentes**, e é por isso que saem como contornos independentes.

Cinco `<path>` com `id="petala-5"` exigiriam **cortar nas canaletas** e fechar cada pétala no
centro — um ato de desenho, não uma leitura da arte. Foi perguntado, e a resposta foi a
**opção 1: fiel à silhueta, sem cortes inventados**. Este é portanto um traçado que não
inventa: o que não está na arte não está no arquivo.

O que **não** se recupera do raster, e continua a ser trabalho de desenho:

- o **favicon** — a 24px a marca é textura, e um ícone precisa de um desenho próprio, mais
  simples;
- a **quinta pétala**, se ela existir por trás da maior;
- o **traço de separação** entre pétalas que se sobrepõem: no raster a sobreposição é
  *sombreado*; num vetor monocromático ela só aparece com vão ou com traço.

## Como editar no Inkscape

1. **Abrir** `experimentos/marca/lastro.svg`. O desenho entra como quatro caminhos, agrupados
   ou soltos conforme a versão — selecione com `Ctrl+A` e veja o painel **Objeto → Caminho**.
2. **Editar nós:** `F2` (Editar nós). Cada canto preservado pelo traçado tem um nó com
   alças curtas de propósito: são **cantos**, não curvas — não suavize sem querer, ou a
   silhueta arredonda na junção das pétalas. Os trechos longos são Béziers de duas alças.
3. **Cor:** `Ctrl+A` e no painel **Preenchimento e contorno** (`Shift+Ctrl+F`) escolha a cor.
   Em `lastro.svg` o preenchimento é `currentColor` — o Inkscape mostra-o como preto e
   **substitui-o** ao pintar. Se quiser manter o arquivo a herdar a cor do contexto, use
   `logo-vermelho.svg` / `logo-prata.svg` como base e **não** toque no `lastro.svg`.
4. **Os três arquivos ao mesmo tempo:** há um nó por pétala (`petala-1`…`petala-4`). Editar em
   `lastro.svg` e repetir o `d` nos outros dois é o caminho manual; o caminho certo é
   re-executar o `vetorizar.js` depois de ajustar as referências.
5. **Exportar plano, sem fundo**, para uso na barra: `Arquivo → Exportar` com
   *área de desenho* e sem o `background`.

## Onde a marca aparece

A aplicação nas três famílias e nos dois modos está em
`experimentos/opcoes-visuais/index.html`, secção **Q** — gerada por
`node experimentos/medir-marca.js --secao <arquivo>`, com os tokens lidos de
`tools/templates/ciclo.css` e os contrastes medidos.

A conclusão dela, em uma linha: **nenhuma cor fixa atravessa as três famílias.** O vinho sobre
a barra do Bordô dá 1,08:1; a prata sobre o papel claro dá 1,96:1; 24 de 48 pares ficam abaixo
do piso gráfico. Por isso a marca entra como **forma pintada por `currentColor`**, vestindo
`--sobre-marca` na barra e `--marca-texto` no papel — dois tokens que cada família já declara e
já mede.

## O que ainda não está feito

- **Nada foi escrito em `tools/templates/`** — que é congelado. A marca ainda não está na barra
  do site: o `lastro.svg` precisa de entrar como peça do sistema, com motivo declarado e
  entrada no `REGISTRO.md`, e isso depende da aprovação da prévia.
- **A validação no Inkscape é sua**: o Inkscape não está instalado na máquina onde o traçado
  foi feito. O que se confirmou aqui foi o desenho a abrir num motor de render (Chrome), com
  os quatro caminhos editáveis e nenhuma imagem embutida.
