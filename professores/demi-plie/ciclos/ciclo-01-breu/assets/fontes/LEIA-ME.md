# As fontes do sistema

**Open Sans**, e é a única. Ela é o corpo do texto em todas as páginas — o site do ciclo, a
raiz, os documentos derivados e a ficha da anamnese.

## Os ficheiros, e a origem de cada um

| ficheiro | o que é | sha256 |
|:--|:--|:--|
| `open-sans-variavel.woff2` | Open Sans **variável** (peso 300–800), redondo, subconjunto `latin` | `d8e4fe0452aa2076429a9bb5d8757d00a994dd95986cf950e9a1a371b9a072a0` |
| `open-sans-variavel-italico.woff2` | o mesmo, itálico | `186836b74ceac07b2764c07c0379420e3014efb30fe918461c235e0ef6cbc4a2` |
| `OFL.txt` | a licença (SIL Open Font License 1.1), que a redistribuição exige | — |

**De onde vieram, e como se refazem.** São os ficheiros que o Google Fonts serve para
`family=Open Sans:ital,wght@0,300..800;1,300..800` — versão `v44` do repositório
`googlefonts/opensans`. Para os refazer:

```bash
curl -s -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' \
  'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap'
# e descarregar as duas linhas `/* latin */` — a normal e a itálica
```

**Porque o subconjunto é `latin` e só.** O `latin` cobre U+0000–00FF, e o português inteiro
cabe lá — inclusive `ã`, `õ`, `ç`, `é`, `ê`, `à`, `ó`. O `latin-ext` traz `Ā`, `Œ`, `Ș`, que
este sistema não escreve. Um glifo que não esteja no ficheiro cai para a família seguinte da
pilha, glifo a glifo — não fica em branco.

**Um ficheiro, três pesos.** O Open Sans é uma fonte **variável**: o mesmo `.woff2` desenha do
300 ao 800, e o `@font-face` declara `font-weight: 300 800`. Sustentar três ficheiros estáticos
(400, 600, 700) seria o triplo do peso para desenhar o mesmo.

## Porque estão no repositório, e não numa CDN

A fonte é **entregue pelo próprio pacote** — `assets/fontes/` —, e não pedida a um servidor de
terceiros. Três razões, e a primeira é a que decide:

1. **O que não é entregue não é identidade, é loteria.** Com `'Open Sans'` declarada e nenhum
   ficheiro, o navegador usa a fonte **só se ela estiver instalada na máquina de quem abre** —
   e quem abre num telemóvel não a tem. O mesmo documento sairia em duas fontes, e nada
   avisaria. Foi medido a 21/11/2026: numa máquina com o Open Sans instalado (`fc-list`: 13
   cortes) a mudança parecia feita; fora dela, caía no fallback.
2. **As páginas abrem-se sem rede.** O pacote é copiado para uma pen, aberto do disco, impresso.
   Uma fonte remota falha exatamente aí.
3. **Nenhum pedido a terceiros por cada visita.** O CSS de uma CDN traria o endereço de quem lê
   para o Google.

## O que fica fora, e é decisão

- **O PDF do ciclo** (`pdflatex`) não lê estes ficheiros: um `.woff2` não serve ao pdfTeX. A
  fonte do papel é outra coisa, e vai junto do cabeçalho LaTeX (`ciclo-cabecalho.tex`) quando
  for tratada.
- **O deck de apresentação** (Marp) mantém a pilha dele, declarada em
  `apresentacoes/apresentacao-01-rizoma/`.
