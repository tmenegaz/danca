# Identidade visual — a paleta, a tipografia e o critério

> **Nota de escopo.** Este documento descreve a identidade do **Projeto Ciclo** — a
> memória da aula dada, **protótipo testado no universo da dança**. Ele **não** é
> agnóstico: o projeto agnóstico será criado a partir dele. As cores são de uma
> escola de balé clássico porque é o universo em que o protótipo está sendo testado;
> o que se declara aqui é o **método** de fixar a identidade, não o gosto de um
> universo.

> **Atualização de 18/10/2026 — o catálogo FECHOU em três, e as três estão no ar.** O que esta
> nota dizia em 16/10 («nada foi implementado») está **superado**: hoje há **três famílias com hex
> medidos** na folha — **Bordô de Cena** (a vigente, e o `:root`), **Cortina Turquesa** e **Verde
> de Ensaio** —, um **seletor de dois eixos** em Produção → Aparência, e a escolha é **da escola**,
> servida no `<html>` de todas as superfícies. As outras quatro direções que chegaram a ser medidas
> foram **abandonadas** por decisão de produto. A identidade vigente continua a ser a de bordô e
> ouro, com os valores que os tokens abaixo declaram — as famílias são camadas por cima do
> `:root`, e **186 pares** são medidos a cada verificação. Ver «O catálogo das PALETAS», depois do
> validador.
>
> **A nota de 16/10 não é apagada** — fica como o elo que registra o que se pensava antes, e a
> frase «nada foi implementado» é verdadeira **na data dela**.

## Por que este documento existe

A identidade visual do projeto **não estava declarada em lugar nenhum**. A paleta
existia de fato — e estava copiada em **quatro** arquivos, cada um com o seu valor,
sem que nada avisasse quando divergiam. A divergência era **silenciosa**: o site
saía com um ouro, o PDF com outro, e nenhum validador olhava.

> **Não confundir com harmonização.** A **harmonização** deste projeto é a **P-21** —
> operação **linguística**, "o fato permanece, o juízo sai". Identidade visual é
> outra coisa: é a **forma** compartilhada por todos os artefatos. As duas palavras
> convivem no repositório e não se referem ao mesmo trabalho.

Este documento é o **contrato**; o validador é a **prova**.

## A fonte de verdade é uma só

**`tools/templates/ciclo.css`.** É o único arquivo do repositório onde um hex da
paleta pode ser escrito. Todo o resto **referencia** os tokens.

Isso é a **Regra 16** levada à última consequência: "folha de estilo única" significa
que `professores/<professor>/ciclos/ciclo-XX/assets/style.css` é uma **cópia
gerada** de `tools/templates/ciclo.css`. Mudar a identidade é editar a **fonte** e
**regenerar** — nunca editar a cópia.

| Consumidor | Como consome |
| --- | --- |
| `tools/templates/ciclo.html` | `assets/style.css` no pacote (cópia gerada) |
| `tools/templates/lancamento.html` | `assets/style.css` no pacote (cópia gerada) |
| `tools/gerar-ciclo.sh` | copia a fonte para o pacote; injeta as cores no LaTeX |
| `tools/gerar-animacao.js` | lê a fonte por `tools/lib-tokens.js` |
| `tools/sincronizar-slide.js` | lê a fonte por `tools/lib-tokens.js` |
| o PDF do ciclo | recebe `\definecolor` **injetado** da fonte (o LaTeX não lê CSS) |
| o deck Marp | **declara** os valores e o validador confere se batem (ver abaixo) |

> **A identidade não está sob a âncora.** `tools/hash-ciclo.sh` cobre as **fontes de
> ciclo** — manifestos, PO, documentos e relatórios **daquele professor**. O
> `ciclo.css` não entra. Mudar a paleta, portanto, **não** exige reancorar os
> `.fipp`: é forma, não conteúdo do ciclo. O que exige **regenerar os pacotes** é
> outra coisa — a cópia em `assets/` ficaria velha, e é isso que a checagem de
> circuito pega.

**`tools/lib-tokens.js`** é a ponte: lê o `:root` da fonte e entrega os tokens a
quem não é CSS. Os geradores JS o usam para não escrever hex. O modo `--latex` — que
levava a paleta ao PDF — ficou **sem consumidor** quando o PDF saiu do fluxo
(20/11/2026); está lá como caminho de volta, e não como parte do gerador.

### A mesma folha carrega os componentes *(16/10/2026)*

A fonte não guarda só a paleta: guarda também **a forma dos componentes** — botão
(principal, secundário, perigo, pequeno), campo, rótulo (`campo-rotulo`), foco,
selo (com os estados que o dado já nomeia: `solta`, `vinculada`, `legado`…),
cartão, modal, mensagem de resultado e aviso — e a **escala** (`--esp-1`…`--esp-6`,
`--raio-1`…`--raio-3`, `--raio-pilula`).

O piso desses componentes usa `:where()`, de **especificidade zero**: a página
vence sem `!important`, e o componente vale onde a página não diz nada. É o que
impede o retorno do defeito antigo — quatro botões diferentes no mesmo sistema,
porque cada página reescrevia o seu.

**Isto não muda o contrato.** Este documento continua a fixar **token e papel**;
a camada de componentes é implementação, e o lugar de discuti-la é o
`ciclo.css` e o `IMPLEMENTACAO-IDENTIDADE.md`. O que a seção declara é só isto:
**forma compartilhada também se escreve uma vez**.

## Os tokens

Três famílias, e a **ordem alfabética não importa** — o que importa é o **papel**.

### Neutros e papel

| Token | Valor | Papel |
| --- | --- | --- |
| `--cream` | `#fbf8f3` | o **papel**. Fundo padrão de tudo |
| `--branco` | `#ffffff` | superfície elevada (campo de formulário, cartão) |
| `--creme-1` … `--creme-6` | vários | faixas de fundo (tabela, cabeçalho, aviso) |
| `--tinta` | `#1f1c1a` | o **texto**. Corpo |
| `--soft` | `#5a5348` | texto secundário, legenda, nota |

### A marca

| Token | Valor | Papel |
| --- | --- | --- |
| `--burgundy` | `#6b1f2e` | a **cor da marca**. Título de seção, barra, menu |
| `--burgundy-claro` | `#8a2a3d` | a marca **sob interação** (hover, ponteiro) |

### Ouro — quatro tokens, quatro papéis

Esta é a parte que se confunde, e por isso está separada. **O ouro não é uma cor; é
um conjunto de tons com funções distintas.** Usar o token errado é o defeito mais
provável.

| Token | Valor | Onde pode ser usado |
| --- | --- | --- |
| `--gold` | `#b08d57` | **ornamento sobre burgundy**: filete, fileira, faixa. **Não é texto** |
| `--gold-claro` | `#c9a878` | **texto sobre burgundy** (marca da barra). Contraste 5,03:1 |
| `--gold-escuro` | `#8a6a3b` | **traço, filete, borda** sobre fundo claro. Nunca texto |
| `--gold-texto` | `#7a5c31` | **texto** dourado sobre fundo claro (h4, cabeçalho de tabela) |
| `--sobre-ouro` | `#2b1b10` | **texto sobre** o ouro (item ativo) |
| `--gold-borda` | `#a08a58` | **borda de campo** sobre papel claro |

> **A regra do ouro.** Ouro é **ornamento**, não texto. `--gold` sobre `--burgundy`
> dá **3,65:1** — reprova AA como texto e está certo assim: ele existe para o filete
> e para o ornamento, onde o piso é 3,0:1. Quem precisa de **texto** dourado usa
> `--gold-claro` (sobre burgundy) ou `--gold-texto` (sobre claro).

> **Atenção ao `--gold-borda`.** Ele **reprova** em dois fundos: `--creme-2`
> (**2,85:1**) e `--creme-6` (**2,98:1**). Ele não substitui `--gold-escuro` em
> filetes sobre esses fundos.

### Semânticos

| Token | Valor | Papel |
| --- | --- | --- |
| `--ok` | `#1d6b2f` | o que **aconteceu** |
| `--alerta` | `#8f5a12` | o que ficou **parcial** |
| `--falha` | `#9b1c1c` | o que **não aconteceu** |

Estes três **não são decoração**: carregam o resultado do registro. Também passam
AA sobre o papel e sobre o creme de tabela.

### Papéis — os nomes que os componentes usam *(17/10/2026)*

Os tokens acima são **primitivos**: descrevem valores (`--cream`, `--burgundy`). Sobre eles há uma
camada de **papéis**, que descreve funções. É ela que os componentes usam — e é ela que um tema
troca.

| Papel | Claro | Noturno | Para quê |
| --- | --- | --- | --- |
| `--fundo` | `#fbf8f3` | `#17130f` | o papel da página |
| `--superficie` | `#ffffff` | `#211b15` | cartão, cabeçalho de tabela |
| `--texto` | `#1f1c1a` | `#f1eae0` | a prosa |
| `--texto-suave` | `#5a5348` | `#bfb2a0` | legenda, nota |
| `--borda` | `#8a6a3b` | `#7a6a55` | filete |
| `--borda-campo` | `#a08a58` | `#8a7860` | borda de campo |
| `--marca` | `#6b1f2e` | `#d9b98a` | título e link |
| `--marca-texto` | `#7a5c31` | `#e0c9a6` | texto de marca sobre o fundo |
| `--marca-fundo` | `#6b1f2e` | `#6b1f2e` | fundo da ação e da barra |
| `--sobre-marca` | `#fbf8f3` | `#fbf8f3` | texto sobre a marca |
| `--campo-fundo` | `#ffffff` | `#241d17` | campo sobre o papel |
| `--campo-fundo-cartao` | `#fbf8f3` | `#1c1712` | campo dentro de cartão |
| `--foco` | `#8a6a3b` | `#d9b98a` | anel de foco |
| `--veu` / `--sombra` | preto translúcido | preto mais denso | modal |

As faixas de creme (`--fundo-suave`, `--fundo-faixa`, `--fundo-hover`, `--fundo-citacao`,
`--fundo-codigo`, `--fundo-pre`) e os estados (`--ok`, `--alerta`, `--falha` e os três fundos)
também têm valor por tema.

> **A regra.** Um componente **não** usa primitivo. `color: var(--burgundy)` funciona no claro e
> reprova no escuro (1,64:1); `color: var(--marca)` vale nos dois. O validador confere isto: se um
> consumidor voltar a falar por primitivo, ele reprova.

### O tema noturno — a mesma família, não a clara invertida

A variante noturna **não** é `filter: invert()`. Sobre o fundo escuro o bordô não é texto: a voz
passa a ser o **ouro**, que é a segunda cor da identidade. A barra continua bordô, com texto creme.
O `color-scheme` acompanha, para os controles nativos (`select`, `checkbox`, barra de rolagem) não
ficarem claros no meio da página.

O tema é um **atributo** no `<html>`: `data-modo="noturna"`. Sem o atributo, é a variante clara.

**De quem é a escolha — decidido em 18/10/2026 (C15): é da ESCOLA, e é o servidor que a aplica.**
Este parágrafo dizia o contrário: que a escolha ficava no **navegador** (`localStorage`, chave
`ciclo-modo`) e que esse era o caminho declaradamente provisório. Deixou de ser. Uma preferência
que vale para todos não pode viver no navegador de cada um, e o sintoma de a ter ali é o pior
possível: cada pessoa veria uma pele diferente da que a escola escolheu, e nenhuma saberia por quê.

O que passa a valer, e é o que está implementado:

| Peça | Onde está |
| --- | --- |
| **o valor** | no dado da escola — `bastidores/<escola>/aparencia`, guardando os **nomes** do modo e da família (nunca um hex) |
| **a aplicação** | no **servidor**: o `<html>` de toda página servida sai com `data-modo`, `data-paleta` **e** `data-modo-fonte="escola"` |
| **o controlo** | a secção **Aparência**, na Produção — **dois** grupos de pílulas: família e variante |
| **o portão** | `senhaDaDirecaoOk` (as duas senhas acima, e mais nenhuma) |

**Os dois eixos são independentes** — família × variante é um produto cartesiano, e guardá-los
num só campo obrigaria a enumerar quatro nomes à mão hoje — e mais dois por cada família que
entrasse. E o
pedido que o cliente envia leva **o par inteiro**: o KV é eventualmente consistente, e um
«ler-modificar-gravar» com pedidos parciais perde uma mudança quando duas chegam próximas — o que
foi observado no ar, em 18/10/2026.

**O `data-modo-fonte` é a fronteira, e não um enfeite.** É ele que faz o `assets/nav.js` **não**
aplicar por cima a memória de um navegador usado antes: uma página que declara a fonte já tem o
modo posto, e o `nav.js` não age. Sem esse atributo, a escolha da escola perderia — em silêncio —
para um `localStorage` velho.

**E é por isso que o botão `◐` saiu da barra.** Ele existia para cada visitante escolher; a escolha
é da escola. Um botão que a desfizesse por visitante seria a contradição escrita ao lado da regra.
O `◐` sobrevive **apenas na raiz** — que não é escola, não tem Produção onde pendurar a escolha, e
é a plataforma. Nas páginas de escola, a ausência do botão é provada (`provar-tema.js`).

**O que ainda é provisório** é só a **largura** da escolha, não o mecanismo: existem dois modos
(`clara`, `noturna`) e nenhuma das doze paletas. Quando o catálogo existir, é o mesmo campo que
ganha a família — e o que se guarda continua a ser um **nome**, que é o que impede o dado de
envelhecer junto com os hex.

**A impressão é sempre clara.** O `@media print` repõe os papéis da variante clara com
`!important`: o papel não tem tema, e o texto não pode sair claro sobre folha branca.

### O layout também é um atributo

`data-layout="documento"` é a leitura com o índice à direita (o padrão); `data-layout="painel"` é a
tela de trabalho, com a largura toda e sem índice lateral. É um atributo no `<body>`, não uma rota —
o mesmo HTML serve aos dois, e quem decide é o CSS.

### A escala — três medidas, e o estado real de cada uma *(17/10/2026)*

Um sistema de identidade tem **três** escalas, e só a primeira está declarada em token:

| Escala | Tokens | Estado |
|---|---|---|
| **espaço** | `--esp-1: 4px` … `--esp-6: 32px` | ✅ declarada e **em uso**: os valores de `padding`/`margin`/`gap` do `ciclo.css` foram encaixados na grade de 4px (56 usos de token); as superfícies fora dele ainda escrevem `rem` à mão |
| **raio** | `--raio-1: 8px` (selo, chip), `--raio-2: 12px` (campo e botão), `--raio-3: 20px` (cartão e modal), `--raio-pilula: 999px` | ✅ os raios são os da pele adotada (E, HarmonyOS — 18/10/2026); nenhum `<style>` de página escreve raio cru |
| **tela** (breakpoints) | não há token — CSS não permite `var()` em media query | ✅ **declarada e agora com um valor por conceito** |

**A escala de tela.** Quatro cortes, cada um por um motivo — e nenhum deles é «tamanho de
aparelho»:

| Corte | O que muda | Por quê |
|---:|---|---|
| **1200px** | o documento ganha a coluna do índice à direita | é onde o texto de 900px **mais** o índice de 17rem cabem sem apertar a medida de leitura |
| **1140px** | a vista de trabalho (`data-layout="painel"`) passa a uma coluna | é onde o formulário e a lista de 24rem deixam de caber lado a lado — e o formulário **cede primeiro** (ver abaixo) |
| **1024px** | a barra do topo encolhe a fonte e o espaçamento | é o tablet: a barra inteira ainda cabe numa linha |
| **768px** | a barra colapsa no hamburger **e** o painel vira uma coluna | é o celular — **um** número, usado por todas as folhas |

> **A regra do 768.** `768` significa «celular» em **todas** as folhas. Antes de 17/10/2026 o
> painel cortava em **760**: entre 761 e 768 o menu do topo já estava no hamburger e o painel
> ainda tinha duas colunas — navegação em dobro, e 535px para o conteúdo. Dois números para o
> mesmo conceito é a mesma classe de defeito que o `--gold-borda` em dois fundos.

**A faixa que ninguém media — 1141 a 1919px** *(10/11/2026)*

Entre o corte do painel e a tela grande não há **nenhum** ponto de quebra, e por isso nunca
houve ali uma prova. A 10/11/2026 a pesquisadora mudou a resolução do monitor de 1920×1080 para
1366×768 e viu «as margens das etiquetas e o espaçamento» desaparecerem e as coisas
«acavaladas». Não eram as margens da folha: era a **grade da secção**.

A `.secao` (formulário à esquerda, listagem à direita) declarava
`minmax(0, 34rem) minmax(24rem, 1fr)`. O tecto do formulário funcionava também como **piso** —
ele tomava os 544px inteiros e o `1fr` da listagem ficava com o resto. Medido na bancada local,
com a listagem de alunos de dados realistas:

| janela | coluna da listagem | largura do nome na linha |
|---:|---:|---:|
| 1920px | 1115px | 717px |
| 1600px | 795px | 397px |
| 1366px | 561px | **163px** |
| 1280px | 475px | **114px** |
| 1141px | 384px | **81px** |
| 1024px (uma coluna) | 792px | 394px |
| 768px (celular) | 736px | 338px |

A leitura desta tabela é o defeito: **entre 1141 e ~1500 a listagem estava pior do que no
telemóvel**. No celular funciona porque o corte dos 1140 dá a largura toda à lista; na faixa
intermédia, a linha tem três partes (o nome, a etiqueta «turmas · …» e os botões) e quem cedia
era o **nome** — a única sem segunda fonte para o que diz.

Duas peças, e nenhuma delas é uma unidade nova:

1. **O formulário cede primeiro.** O tecto passa a `min(34rem, 38%)` com piso de `20rem`. A 1920
   manda o `34rem` (544px, exactamente como antes); abaixo de ~1430 o formulário encolhe para a
   listagem não ser a única a pagar. A 1366 ele fica com 431px — folgado para campos de largura
   toda — e a listagem sobe de 561 para 674px.
2. **O nome tem piso de 11rem.** Quem encolhe com reticências é a etiqueta das turmas, que já tem
   `text-overflow` e um `title` com os nomes todos. A 1141 o nome fica com 176px e a etiqueta
   desce a 201px.

> **`rem` não é a resposta, e é a armadilha da conversa.** Trocar `px` por `rem`/`em` não torna
> nada fluido: `1rem` são 16px fixos, e só muda se mudar o corpo da raiz. Quem cede é a **grade**
> (`%`, `min()`, `1fr`) e a **prioridade** de quem encolhe — a unidade não decide nada. E `gap`
> não resolve item espremido: `gap` é o vão *entre*, não o espaço *de dentro*.

A prova é `node experimentos/provar-largura-da-lista.js`: doze larguras de 320 a 1920, num
navegador de verdade, com **controle negativo** — reposta a regra antiga, as asserções têm de
falhar.

**A navegação da PÁGINA também é escala de tela.** O sistema tem duas navegações, e elas não
são a mesma coisa:

| | O que é | No celular |
|---|---|---|
| **do sistema** | Sistema Lastro · Área do Professor · Bastidores | hambúrguer (decidido em 16/10/2026) |
| **da página** | os grupos e as secções de uma vista (Produção: 3 grupos, 7 destinos) | **folha inferior** (18/10/2026) |

A segunda era uma fita de 80px que quebrava sozinha, com o título do grupo e o link no mesmo
peso — não se lia onde um começava e o outro acabava. Passou a ser **uma linha com o grupo e a
página em que se está**, e um botão «Seções» que sobe a lista; a escolha fecha a folha, porque
deixá-la aberta taparia justamente a secção que se acabou de pedir.

> **O vocabulário, para não se repetir:** folha inferior (bottom sheet) para escolher **entre
> destinos do mesmo nível**; hambúrguer para a navegação **global**. As duas convivem — a
> primeira é local e temporária, a segunda é permanente e raramente usada.

**Abaixo do corte de celular**, cada vista decide o que fazer com a largura que tem:

- o **menu de secções** do painel deixa de ser uma coluna (248px de altura) e vira uma **faixa**
  que quebra sozinha (~80px);
- a **linha de uma turma** não divide espaço entre o nome e os botões: se não couber
  `14rem + botões`, os botões **descem** e o nome fica com a linha inteira. Quem decide é o
  espaço que existe (`flex-wrap` + `flex-basis`), **não um breakpoint novo**;
- o **seletor e o botão que o lê** andam juntos (`par-associar`), para o botão não ficar sozinho
  numa linha, longe do controle que ele usa.

A prova disto é medida, não lida: `node experimentos/provar-celular.js` abre a vista em 320, 360,
390, 414, 768 e 1024px, num navegador de verdade, e reprova se algo transbordar, se o nome for
espremido ou se o menu voltar a ocupar a primeira tela. Ela também mede as outras seis superfícies
servidas, em 320/390/768, contra transbordo horizontal. **A faixa de 1141 a 1919 fica com a
`provar-largura-da-lista.js`** (doze larguras, e um controle negativo) — até 10/11/2026 não havia
prova nenhuma entre o tablet e a tela grande, e foi por isso que o defeito durou.

## Tipografia — duas pilhas, e a exceção é restrita

| Token | Valor | Papel |
| --- | --- | --- |
| `--serif` | `'Open Sans', system-ui, …` | **a prosa institucional**. Corpo a 17px/1.65 |
| `--ui` | `system-ui, -apple-system, …` | **o maquinário de formulário** |
| `--header-height` | `120px` | altura da barra fixa — o `padding-top` do corpo |

> **A fonte do projeto é a Open Sans, e ela é ENTREGUE (21/11/2026).** Os dois `.woff2`
> (redondo e itálico, variáveis — um ficheiro desenha do 300 ao 800) vivem em
> `tools/templates/fontes/`, viajam com a folha para `assets/fontes/` de cada superfície, e são
> pedidos por `@font-face` com um `url()` relativo a ela. A licença (SIL OFL 1.1) vai ao lado,
> em `fontes/OFL.txt`, porque a redistribuição a exige.
>
> **Porque não é uma CDN.** O que não é entregue não é identidade, é loteria: com `'Open Sans'`
> declarada e nenhum ficheiro, o navegador usa-a **só se ela estiver instalada na máquina de
> quem abre** — e quem abre num telemóvel não a tem. Medido a 21/11/2026: numa máquina com a
> fonte instalada (`fc-list`: 13 cortes) a mudança parecia feita; fora dela caía no fallback, e
> o mesmo documento saía em duas fontes sem nada avisar. As páginas também se abrem do disco,
> sem rede, e imprimem-se de lá — e um pedido a um terceiro por cada visita levaria o endereço
> de quem lê para fora.
>
> **O nome `--serif` é histórico.** Ele nasceu quando a prosa era serifada (Georgia) e já não
> descreve o desenho; o que ele nomeia é o **papel** — a voz do documento, por oposição ao
> maquinário. Mudar-lhe o nome obrigaria a tocar as três folhas, a ficha da anamnese e este
> documento para dizer a mesma coisa; o que não podia ficar por dizer é o que ele significa.
>
> **O fallback não é Georgia.** Se o ficheiro faltar, a pilha cai numa **sans do sistema**.
> Cair para uma serifa seria trocar a fonte por outra sem avisar; assim erra a favor de não
> parecer a fonte que não é. Há prova das duas metades — a fonte chega, e o que acontece quando
> não chega — em `experimentos/provar-a-fonte-do-site.js`.
>
> **A Georgia nunca chegou a ser desenhada nesta máquina.** `fc-match Georgia` responde
> `Noto Serif`: a pilha antiga já era uma promessa que o sistema não cumpria. Não é o motivo da
> mudança — o motivo é a identidade ser Open Sans —, mas é a razão de a mudança ter de ser
> entregue para ser verdadeira.

> **A exceção da `--ui`.** A pilha sem serifa é **deliberada e restrita ao
> maquinário do formulário** — os controles onde se digita e se clica (`input`,
> `select`, `button`). É ali que a fonte do sistema ajuda. O texto **em volta**
> desses controles está na voz do projeto. Usar `--ui` em prosa é o defeito.

> **O PDF do ciclo não lê estes ficheiros.** Um `.woff2` não serve ao `pdflatex`, que compõe com
> as fontes clássicas do LaTeX (ver `tools/templates/ciclo-cabecalho.tex`). O papel e a tela
> estão, hoje, em fontes diferentes — está declarado, e é a próxima peça desta frente, não um
> efeito desta mudança.

O deck Marp usa Georgia para a prosa e `'Helvetica Neue', Arial, sans-serif` a 14px
para os **rótulos** — mesma lógica, outro veículo.

## O critério é medido, não estimado

A norma é **WCAG 2.1 AA**, e ela é **aritmética**: razão de contraste entre
luminâncias relativas. Não é gosto e não se estima no olho.

| O que | Piso | Por quê |
| --- | --- | --- |
| **texto** | **4,5:1** | o que se lê |
| **traço com função** | **3,0:1** | borda e filete **têm função** — não são decoração |

Os pares que a identidade usa — com o piso de cada um — estão declarados em
`tools/check-identidade.js`, na tabela `PARES`. **Os valores medidos não são
repetidos neste documento de propósito**: uma tabela copiada envelhece no dia
seguinte, e cópia que diverge é exatamente o defeito que originou esta regra. Quem
quer o número medido roda o validador.

```bash
node tools/check-identidade.js
```

## O validador, e as suas onze checagens

`tools/check-identidade.js` não tem dependências externas e sai com código 1 se algo
falhar. Ele confere:

1. **Contraste** — mede cada par de `PARES` (de **papéis**, não de valores) contra o
   seu piso, em **cada tema**: hoje são **seis** temas, porque família × modo é um produto
   cartesiano — 31 pares × 6 = **186 medições**. Um tema não medido é um tema que ninguém sabe
   se passa, e cada família foi acrescentada **já medida** (foi por isso que nenhuma caiu).
   Inclui os fundos de estado (`--ok-fundo`, `--alerta-fundo`, `--falha-fundo`,
   `--derivada-fundo`), onde o texto semântico é lido.
2. **Cópia única** — nenhum dos hex da paleta pode aparecer fora de
   `tools/templates/ciclo.css` (são **139** hoje: a folha declara as três famílias). Comentários que **citam** um valor para explicar por
   que ele saiu não contam como redeclaração. A varredura cobre a raiz, a porta, os
   bastidores, a ficha e as páginas de estado — e normaliza `#abc` para `#aabbcc`.
3. **Papel** — nenhuma superfície de interface usa um **primitivo** (`--cream`,
   `--burgundy`…): todos falam por papel (`--fundo`, `--marca`…). Sem isto, um
   componente ficaria preso à variante clara e o tema ficaria pela metade.
4. **Declarantes** — quem é servido **sem** `<link>` para a folha (a ficha e as
   páginas de estado) declara os tokens; o validador confere cada valor contra a
   fonte. É o mesmo regime do deck Marp, e impede que a «segunda identidade» volte
   disfarçada de declaração.
5. **Circuito** — a fonte chegou **mesmo** ao pacote: `assets/style.css` idêntico ao
   `ciclo.css`, `assets/nav.js` presente, e a cópia da **raiz**
   (`raiz/assets/style.css`) igual à fonte. Sem isso a página fica sem barra e sem
   menu — ou serve uma identidade velha — e nada mais avisava.
6. **A porta de cada pacote** — `plano-observacao/index.html` é cópia de `porta/`, e o
   corpo dela tem de ser **o mesmo** arquivo, byte a byte: a única diferença legítima
   é a barra, injetada no marcador `<!-- NAV -->`, que o validador neutraliza antes de
   comparar. E a barra tem de ser a **de hoje** — isto é, **sem** o botão da aparência, que saiu
   dela em 18/10/2026 com a C15 (o modo passou a ser servido no `<html>`). A asserção era a
   contrária e foi **invertida**, não apagada: o que se mede continua a ser «esta cópia é a de
   hoje», e uma cópia velha falha em vez de passar. Foi a falta desta checagem
   que deixou a porta da Fita presa na identidade **anterior** — 44 usos de primitivo,
   nenhum de papel — sem escurecer com o tema, e ainda com o nome retirado da página
   de entrada («Nós, Por Exemplo») na barra. As duas coisas passavam em verde.
7. **Forma** — quem **carrega** a folha não **redeclara componente**, e todo estado de
   `.selo` usado existe na fonte. É a checagem que faltava à Fase 1: ela declarou
   «nenhum `<style>` de página define selo» e conferiu por `grep` do seletor **nu**
   (`.selo {`), que não vê `.selo.vinculada`. A porta tinha quatro dessas — e o
   resultado está na secção seguinte. A lista de componentes é **derivada** da própria
   fonte (é «raiz» a classe que aparece sozinha como alvo de uma regra), e não escrita à
   mão: um componente novo entra coberto, sem ninguém lembrar de o acrescentar.
8. **Peça** — toda classe usada na **marcação** é **desenhada** em algum lugar: na folha, ou
   no `<style>` da própria página quando ela declara o que usa. Quem não desenha nada ou é
   **gancho** (um nome que existe para o JavaScript achar o elemento, declarado com a razão
   escrita) ou é **erro**. É a checagem que faltava à «Forma»: ela mede a **cópia**, não o
   **nome**. A mesma passagem confere que a folha não tem **comentário aberto** — um `/*` sem
   `*/` engole as regras seguintes e as peças de lá ficam sem desenho, sem nada falhar.
9. **Famílias** — a folha e o validador dizem o **mesmo**. Conta as famílias que o
   `ciclo.css` declara (`[data-paleta="…"]`, fora de comentários) e compara-as com as que
   `TEMAS` mede: uma família a mais na folha é uma família **sem medição**, e reprova. Nasceu
   em 18/10/2026, com a terceira família — até então `TEMAS` era uma lista escrita à mão que
   ninguém conferia contra a fonte, e as duas podiam divergir em silêncio: a folha a dizer uma
   coisa, o validador a medir outra, e os dois a passar. É o mesmo princípio do «Declarante»,
   aplicado às famílias em vez dos tokens.
10. **Respiro** — o **ar** de três lugares, declarado na folha e resolvido em px. (a) o do
   cabeçalho: `padding-top`/`padding-bottom` ≥ **12px**, e nunca posto em `margin-top`, porque
   `position: sticky` descarta a margem exactamente no estado em que o professor está a ler;
   (b) o do **rodapé**: ≥12px do filete ao texto e ≥24px do conteúdo ao filete — e a regra da
   faixa (`header.doc, main, .rodape`) **não pode** voltar a nomear `footer.rodape`, que pesa mais
   do que a peça; (c) o da **coluna de leitura**: `header.doc + main > .conteudo { padding-top }`
   ≥ 24px, com o par `> :first-child { margin-top: 0 }`. Nasceu em 06/11/2026, do relato «os
   botões estão colados na margem superior»: medido, o `h1` começava a 0,3px da barra e o botão
   acabava a 0px da linha, com as **nove** checagens anteriores em verde e **27** asserções de
   navegador a dizer `ok`. Todas mediam **presença**; o defeito era de **distância**. A auditoria
   das outras páginas, no mesmo dia, acrescentou o rodapé (texto a 5px do filete, filete a 0,4px
   do último parágrafo) e o vão depois da faixa, que tinha três valores.
11. **Base** — nenhuma folha tira o filete da **última** linha de um bloco que o tem nas outras.
   Uma regra que remove `border-bottom` de um `:last-child`/`:last-of-type` cujo alvo já recebia
   filete fica reprovada, e a mensagem diz o que fazer: para separar o bloco do que vem a seguir
   usa-se o **ar do contentor**, não a ausência de aresta. Nasceu em 12/11/2026, e do mesmo
   sintoma pela terceira vez: «a última linha, a borda da última linha, está sendo engolida […] e
   esse problema tem sido recorrente». Medido, era literal — as duas primeiras linhas da tabela
   com `border-bottom: 1px` e a última com `0px`, por causa de um `tbody tr:last-child td` escrito
   de boa-fé.

   **Porque é que a checagem 9 («Aresta») não o apanhava.** Ela mede a **folha** e procura uma
   **moldura completa** a ser amputada. Esta regra vivia no `<style>` de uma página, e
   `border-bottom` de um lado só não é moldura — é **filete**. São duas perguntas diferentes, e
   por isso duas checagens: esta mede também **as folhas locais das páginas**, que é onde o
   defeito viveu sem ninguém o ver. No dia em que passou a medir, encontrou **outro** caso, na
   porta (`table.tabela-parametros`), que ninguém tinha notado.

### A regra da composição — o que a «Forma» impede *(18/10/2026)*

**Um componente redeclarado não fica «um pouco diferente»: fica metade de cada lugar.**
O caso concreto: `porta/index.html` trazia

```css
.selo.vinculada { border-color: var(--marca); color: var(--marca); }
```

O `<style>` da página vem **depois** de `/assets/style.css`, então vencia — mas só nas duas
propriedades que escrevia. O **fundo** continuava o da fonte (`--derivada-fundo`, roxo) e a
**borda e o texto** passavam a bordô. O selo «vinculada» saía roxo inteiro nos Bastidores e
roxo-com-bordô na anamnese, e ninguém via a divergência porque cada metade vinha de um
lugar. A prova de que isto não é teoria está no controle negativo de
`experimentos/provar-selo.js`: servida a porta de HEAD, ele reproduz exactamente as duas
etiquetas que o dono do produto viu.

Daí saem três regras, e as três valem para o que vier:

| Regra | Por quê |
| --- | --- |
| **A página não redeclara componente** | o que ela escreve vence só o que ela escreve; o resto continua a vir da fonte, e o objeto fica partido |
| **Alias não toma o nome de um papel** | a porta declarava `--borda: var(--borda-campo)`; `--borda` **já é** o filete da folha, e por isso todo componente que a folha veste com ele (o selo, o `pre`, o `hr`) saía com outro filete só naquela tela |
| **Nome de estado é do dado; desenho é da fonte** | `.livre` e `.solta` são a **mesma** coisa (a entidade não entrou num plano / o envelope não foi ligado a um PO). Dois nomes, um desenho. Quem precisar de um estado novo declara-o na fonte |

E a consequência para quem é servido **sem** a folha (a ficha e as páginas de estado): lá a
declaração é obrigatória, mas os **números** também são da fonte — `--raio-3` no cartão,
`--raio-2` no botão. Foi o que faltava: a ficha desenhava o cartão com `4px` e a página de
estado o botão com `6px`, dois raios que não existiam em nenhum outro lugar do sistema.

### As duas exceções declaradas

**O deck Marp.** Sendo Markdown, o deck não consegue referenciar `var(--x)`. Ele
**declara** os tokens no bloco `style:` do frontmatter, e o validador confere se cada
valor declarado **bate** com a fonte — e reprova o token que não existe na fonte. O
**desenho do mapa**, porém, fica de fora: o gerador e o sincronizador casam o SVG
**como texto literal** (`stroke="#b08d57"`), então um `var(--gold)` ali não
resolveria. Por isso a checagem de cópia única do deck olha **só** o bloco `style:`.

**Os SVGs.** Pela mesma razão — casados como texto literal — os arquivos
`apresentacoes/apresentacao-01-rizoma/rizoma-*.svg` e o mapa embutido no corpo do
deck carregam cores próprias. Elas **não** são a paleta da interface e não podem
virar token sem quebrar o casamento.

## O catálogo das peças — o inventário, e como escolher *(18/10/2026)*

**Por que existe.** Em um só dia, três coisas novas nasceram fora do combinado, e todas pelo
mesmo motivo: eu inventei em vez de procurar.

| O que nasceu | O que devia ser | O que o dono do produto viu |
| --- | --- | --- |
| `<div class="fileira">` com dois `.acao` dentro | a **pílula**, que serve a lista curta e fechada | dois botões **encostados um no outro**, sem desenho nenhum |
| `<p class="nota">` numa secção que não é `<form>` | a linha de apoio (`.sub`), que é do sistema | um parágrafo de **17px** ao lado de controles de 14 |
| `.acao[aria-pressed="true"]` | a **pílula** com `:checked` | uma ação a fazer o trabalho de um estado |

Nenhuma das três foi um erro de gosto: as três foram erro de **vocabulário**. Uma peça é
uma palavra, e quem não sabe que a palavra existe inventa outra — que ninguém desenhou.

**A primeira pergunta é sempre a mesma: o que isto É?** Não «como fica bonito», mas
**que natureza tem** o que vou pôr na tela. A resposta escolhe a peça, e a peça já tem
desenho.

### Quadro 1 — como escolher

| O que é | Peça | Quando | Marcação |
| --- | --- | --- | --- |
| **O que a pessoa preenche** | `.campo` | um valor digitado ou escolhido num menu | `<label class="campo-rotulo">` + `input`/`select`/`textarea` |
| **O que o sistema DECLARA** | inscrição | o dado que não se digita porque não é escolha de ninguém (a escola do ato) | texto com voz de título — **nunca** um `input` desabilitado |
| **Uma escolha entre POUCAS, todas à vista** | `.escolhas` / `.escolha` (pílula) | dias da semana, aparência da escola — lista curta, fechada e fixa | `<label class="escolha"><input …><span>…</span></label>`, `radio` para uma, `checkbox` para várias |
| **Uma escolha entre MUITAS, ou variável** | `.escolhedor` | turmas, alunas, repertório, os 84 termos | menu + «Adicionar» + ficha com o «×» |
| **Um valor único de uma lista fechada, com rótulo próprio** | `select` + `.campo-rotulo` | a turma da curadoria, a tradição | `<select>` (nunca `multiple`) |
| **Uma ORDEM** — algo que acontece ao clicar | `.acao` | gravar, excluir, voltar, avançar | `<button class="acao">`; `secundario` para o que não é a ação principal, `perigo` para o que apaga |
| **A ação de um formulário, na fileira** | `.par-botoes` + `.acao` | o botão que grava, e o «Cancelar» ao lado quando há edição | `<span class="par-botoes"><button class="acao grande">…</button></span>`. **A fileira é declarada na página da Produção** (`motor/servidor/bastidores.js`), e não na folha — mas é uma só para os cinco formulários de lá, e é ela que dá o vão |
| **As acções de uma ESCOLHA, na linha de baixo** | `.acoes-da-aluna` | o menu das alunas da §6 da aula, e os dois gestos da anamnese de quem se escolheu | `<div class="acoes-da-aluna" data-prov-par="…">` + `a.acao secundario pequena`. O vão é dela (12px do menu) e o `gap` é dela (8px entre os dois botões) — sem ela os botões encostam no campo, e é o defeito de 06/11/2026 |
| **As acções de uma LINHA de tabela, empilhadas** | `.acoes-da-linha` | a coluna «Acesso» da lista das escolas: «Habilitar» e «Desabilitar», um abaixo do outro | `<td><div class="acoes-da-linha"><button class="acao pequena">…</button><button class="acao pequena secundario">…</button></div></td>`. O `gap` é dela (8px, o mesmo da `.acoes-da-aluna`), os botões **esticam** para a mesma largura, e a coluna tem 8rem de mínimo — sem isto os dois encostavam (vão medido: 0px) e o rótulo mais largo ficava sem folga. Medido em `provar-acoes-da-linha.js` |
| **Um ESTADO ou atributo do dado** | `.selo` | «livre», «em turma», «vigente» | `<span class="selo livre">`. **Um selo responde a UMA pergunta** (12/11/2026): quando há dois factos sobre a mesma linha, o que se compara é selo e o que só se sabe é **nota** (`.nota-falta`, a nota do cartão). A sala em turma **e** citada por planos diz `em turma` no selo e `citada por N planos de ensino` na nota — não dois selos |
| **Um bloco de leitura** | `.caixa` | texto que se lê, com título | `<div class="caixa">` (+ `nota`, `falta`) |
| **O resultado de uma ação** | `.res` | «ok», «erro», «gravando…» | barra acima da lista |
| **Um alerta no meio do conteúdo** | `.aviso` | o que o leitor **não pode deixar passar** — o que impede o avanço | `<p class="aviso">` |
| **Uma explicação que se procura** | `.ajuda` + `.explica` | o que o leitor procura **quando quer** — o que é o campo, o que preencher, a nota do conteúdo | `<button class="ajuda" aria-expanded>` + painel `hidden`; no telefone o painel sobe como folha |
| **Uma janela por cima** | `.modal` (+ `.modal-fundo`, `.modal-caixa`, `.modal-cab`, `.modal-x`, `.modal-acoes`, e `.modal-largo` para o que não cabe em 440px) | decidir algo cuja consequência não se vê — a duração em minutos, o objetivo a que serve um exercício novo, uma exclusão. **É o último recurso**: abre só quando há decisão, e não para explicar, listar ou confirmar o que o sistema resolve sozinho | `modal-fundo` + `modal-caixa`; os botões são `.acao` dentro de `.modal-acoes`, **secundário primeiro** |
| **A barra do sistema** | `.topnav` | — | gerada por `nav-html.js`; **não** se escreve à mão |
| **O índice da página** | `.toc-local` (+ `.toc-dobra`) | — | gerado; no celular recolhe |
| **Abrir e fechar uma secção do documento** | `.secao-dobra` (a **seta redonda**) | os títulos de secção do plano, das aulas, da notação e do glossário. **Não** no índice (`.toc-dobra`), nem no menu (`.coluna-seta`), que estão certos pequenos | `<button class="secao-dobra">` dentro do `<h2>`, criado pelo `nav.js`; o glifo vive num `.secao-dobra-sinal` (`aria-hidden`). A geometria é a **mesma** `.alternar-form` dos Bastidores: 2rem, redonda, filete de 1px — a checagem **20 (Seta)** compara as duas a cada commit |
| **O menu de trabalho (a coluna)** | `.coluna` + `.folha-do-menu` (+ `.coluna-grupo`, `.coluna-titulo`, `.coluna-itens`, `.coluna-seta`, `.coluna-direto`, `.folha-puxador`) | o menu da escola: quatro destinos, e cada um leva a uma lista | gerado por `nav.js`; **não** se escreve à mão. Compacto: os grupos abrem no ponteiro; no celular é folha inferior. O menu dos Bastidores (`.lateral`) usa **as mesmas classes** — os dois são a mesma peça, e é por isso que se comportam e se vestem igual |
| **Uma folha que sobe** | `.folha-do-menu` + `.folha-puxador` | um menu que aparece por cima da página, no telemóvel: a navegação do ☰, o «Seções» da Produção e o «Ações» da Área do Professor | a **identidade** (fundo bordô, canto de 20px, sombra para cima, medida, e o pegador de 36×4) mora aqui, uma vez. Quem a usa diz só o lugar e a transição. Medido: as três devolvem os mesmos valores computados, e é isso que a prova 16 compara |
| **A pílula secundária** | `.pilula-do-menu` | o controle que ABRE uma folha, ao lado do conteúdo | o par do ☰, e não o principal: **vazada** (fundo de superfície, filete de campo, raio de 999px), nunca cheia. Usada pelo «Seções» e pelo «Ações» |
| **Três números e um painel** | `.trio` (+ `.trio-item`, `.trio-painel`, `.trio-escala`, `.trio-chips`) | três dados de um cartão, cada um a abrir o seu detalhe | `<div class="trio"><button class="trio-item" aria-expanded>` + `.trio-painel hidden`; **a caixa inteira é o alvo**, e o «?» é desenho (`aria-hidden`) |
| **O menu de acções de uma lista** | `.acoes-da-lista` (+ `.acoes-do-menu`, `.pilula-do-menu`, `.menu-de-acoes`, `.menu-de-acoes-lista`, `.menu-de-acoes-item`, `.veu-do-menu`) | as acções que se tomam SOBRE a lista, sem sair dela | `<button class="acoes-do-menu pilula-do-menu" aria-expanded>` + `<div class="menu-de-acoes folha-do-menu">` com o pegador e a `<ul>`. **É a pílula e a folha do «Seções» da Produção** — não uma terceira identidade. **Só existe no telemóvel**: no computador o botão não aparece e os blocos ficam à vista |
| **Um bloco que se abre e fecha, na lista** | `.bloco-lista` (+ `.bloco-cabeca`, `.bloco-titulo`, `.bloco-resumo`, `.bloco-corpo`) | o contexto do ato, o filtro — um de cada vez | `<details class="bloco-lista" open>` + `<summary class="bloco-cabeca">`. É a `.caixa` que dá a moldura ao conjunto de campos, e **o `summary` é o botão de colapsar**. Os dois blocos da mesma lista **nunca estão abertos ao mesmo tempo** — quem o garante é o script, nos dois modos |
| **O contexto de um ato, dentro da lista** | `.bloco-lista` (a moldura) + `.campos-do-ato`, `.acoes-do-ato`, `.estado-do-ato`, e `.seta-do-ato` como ícone | o professor, o ciclo, a aluna e a senha, sem sair da listagem | `<details class="bloco-lista" id="bloco-ato"><summary class="bloco-cabeca"><span class="bloco-titulo">Contexto do ato</span><span class="bloco-resumo"></span><span class="seta-do-ato" aria-hidden="true">▾</span></summary>` + o corpo. **A caixinha `trio-item` saiu**: o cabeçalho do bloco é que abre e fecha, e dois botões para a mesma coisa dentro do mesmo container seriam um clique a mais |
| **Conteúdo que se divide em secções, e uma de cada vez à vista** | `.abas` (+ `.aba`, `.aba-painel`) | «A escola» (cadastro · contrato e pagamento · pagar), o financeiro (a chave · as mensalidades · os descontos), os Professores e a Audição. **É a forma adotada para todo o conteúdo listado que tem mais de um assunto** (16/11/2026) — «não cria assim desse jeito listado, que é muito feio» | `<nav class="abas" role="tablist"><button class="aba" role="tab" aria-selected="true" aria-controls="p-1">…</button></nav>` + `<div class="aba-painel" id="p-1" role="tabpanel">`. A tira leva `role="tablist"` e o painel `hidden` — o motor é de cada página, as **marcas** são o contrato. No telemóvel a tira sai e fica a `.acoes-do-menu` que sobe a folha com as mesmas abas |
| **As etapas de um formulário, e uma de cada vez à vista** | `.passos` (+ `.passo`, `.passo-n`, `.passo-t`, `.passo-alerta`) dentro de `.turmas-faixa` | a sequência de um trabalho que tem passos: a Sala (Sala · Associar), a Audição, o Estilo e o cadastro do Professor (Cadastro · Rubrica). **Não é aba**: a aba é um assunto que fica aberto; o passo é a ordem de um mesmo trabalho — o segundo não existe antes do primeiro | `<div class="turmas-faixa"><ol class="passos" aria-label="Etapas da sala"><li><button type="button" class="passo ativo" aria-current="step"><span class="passo-n">1</span> <span class="passo-t">Sala</span> <span class="passo-alerta" aria-hidden="true">!</span></button></li>…</ol></div>` + um `<div class="passo-painel">` por passo, com `hidden` nos que não estão à vista. **O `.turmas-faixa` não é decoração** (ver «Os passos dentro de uma aba», abaixo) |
| **A distância até um teto** | `.cota` (um `<progress>` nativo) | quanto do limite já foi usado: no Monitoramento, o GitHub, o Resend e o armazenamento do KV | `<progress class="cota" data-nivel="folga" value="420" max="1000">42%</progress>`. O `value` é a fracção em **milésimos** (`max="1000"`), para a barra não perder resolução nos primeiros por cento — que é onde ela está na maior parte do tempo. `data-nivel` pinta: `folga` · `atencao` (80%) · `agora` (95%). **É `<progress>` e não `<div>`**: a largura de uma barra é cálculo (não vai em `style=""`, regra 5), e o elemento nativo já anuncia o valor ao leitor de ecrã sem um `aria-label` inventado. O nome é `.cota` porque `.barra` já é a barra fixa da porta |
| **A linha que está a ser apagada** | `.trio-plano[data-apagando="sim"]` | o registo já condenado, enquanto a rota de exclusão responde — a Action do GitHub corre em segundo plano, e entre o clique e a resposta há segundos | nada na marcação: é um **atributo de estado** no `<li class="trio-plano">`, posto e tirado pelo cliente (`listas-do-acervo.js`). O véu, o fio «apagando…» e o spinner são da folha |
| **A operação em curso, que tranca a página** | `.veu` (+ `.veu-cartao`, `.veu-etiqueta`, `.veu-texto`, `.veu-nota`) | enquanto uma escrita corre e o passo seguinte depende dela: gravar o plano ou o PO, a geração do ciclo que vem depois — **e as OUTRAS ABAS** que mostrem o que aquele gesto muda | o `nav.js` garante a peça em todas as páginas e escreve o estado: `<div class="veu" id="veu"><div class="veu-cartao"><span class="selo veu-etiqueta">Derivação</span><p class="veu-texto">…</p><p class="veu-nota">…</p></div></div>`, com `data-ocupado="sim"` e, quando a operação é de outra aba, `data-remota="sim"`. **Não é decorativo**: é o `inert` do script que fecha teclado e leitor de ecrã, e sem ele o passo seguinte é clicável enquanto o anterior escreve — foi assim que duas gerações disputaram o mesmo `main`. O véu é **translúcido** de propósito: a página continua a ver-se por baixo. E o que se lê **não está numa caixa** (11/11/2026): a palavra em versalete bordô (`.veu-etiqueta`) e a frase na serifa (`.veu-texto`) ficam soltas sobre o véu, protegidas por um **halo** — três sombras do papel por baixo das letras, que abrem o fundo onde a letra precisa sem desenhar uma segunda superfície. O `.veu-cartao` continua a existir porque é ele que agrupa e centra o conteúdo, mas **não tem fundo, filete, sombra nem ar próprio**: um cartão opaco voltaria a tapar a página que se quis deixar ver  **É O MESMO VÉU EM TODOS OS GESTOS** (12/11/2026): a Turma, o Elenco (criar, regravar, guardar rascunho e ler as anamneses), o Verbete e a Sala (cadastro, gravação e ajuste). A frase de cada um vem do mapa dos passos do `bastidores.js` — nunca do rótulo do botão, que é curto por ter a largura de um botão. |
| **O rodapé de páginas** | `.paginas` (+ `.paginas-ant`, `.paginas-info`, `.paginas-prox`) | uma lista que não cabe numa tela | `<div data-paginar data-por-pagina="25">` a embrulhar a `<ul>`; nasce `hidden` — sem JavaScript a lista mostra tudo. **TODA listagem nasce com ele** (21/11/2026): `/ciclos/planos/`, `/aulas/`, as aulas dadas e as três da Área do Professor. A regra do aparecimento é a que já estava escrita — **à vista a partir de duas páginas** —, e é por isso que uma escola com 15 aulas e 25 por página **não vê rodapé nenhum**, e está certo. **Não se pagina tabela de DOCUMENTO** (o calendário do plano): o documento imprime-se inteiro |

### Os passos dentro de uma aba — o padrão, e como se usa *(19/11/2026)*

Ela comparou os dois desenhos e disse qual era o padrão:

> «Aqui em professores você colocou o step fora do padrão. Observa como é que é o step, por
> exemplo, na audição. Tem que ser igual, é o mesmo padrão. […] Você não documentou a identidade
> visual dos steps com abas. Como é que a gente usa? Precisa documentar e aí seguir o que a gente
> já tem.»

A peça existia em quatro sítios e não estava no catálogo; o do Professor nasceu fora do embrulho
e por isso não recolhia com o corpo nem encurtava o rótulo. As regras, tiradas do que já estava
feito:

1. **A tira vive dentro de um `.turmas-faixa`.** É o embrulho que dá `grid-column: 1/-1` (a tira
   atravessa o corpo em vez de ficar numa coluna), o `display: flex` com `min-width: 0` — que é o
   que faz o rótulo encurtar com reticências em vez de empurrar o passo para a linha de baixo no
   telemóvel — e é ele que a seta do título recolhe
   (`.secao[data-recolhido="sim"] .turmas-faixa { display: none }`). Um `<ol class="passos">` nu
   não tem nada disso.
2. **A tira é a primeira linha do corpo da secção — e fica FORA das abas.** Ela é irmã do
   `.col-form` (o que tem as abas), e não filha de um `.aba-painel`. Um passo dentro de uma aba é um
   passo que pertence à aba, quando o que ele descreve é a sequência de um trabalho que a aba
   contém. *(19/11/2026: «Em professores, você colocou os steps dentro de cadastro. Ele é acima do
   cadastro, ele é fora do cadastro.» O do Professor estava dentro do `aba-painel` do Cadastro e
   passou a ser o primeiro filho do `.turmas-corpo`, como na Audição.)* Quando o trabalho de passos
   mora num trabalho que TAMBÉM tem abas, a tira fica acima delas e **só se vê na aba a que
   pertence** — quem a esconde nas outras é o `aoTrocar` do motor das abas, e não um `hidden`
   escrito à mão que a primeira troca esqueceria.
3. **Um passo, um painel.** Um `<div class="passo-painel">` por passo; os que não estão à vista
   levam `hidden`, e é o motor da página que troca. Dois painéis abertos não são dois passos: são
   uma página com uma tira decorativa em cima.
4. **A marca do passo atual é `aria-current="step"`**, além da classe `.ativo` — a classe pinta, o
   atributo é o que o leitor de ecrã anuncia.
5. **O rótulo vai dentro de um `<span class="passo-t">`.** Um texto solto dentro do botão não
   encolhe, e era ele que quebrava a tira no telefone. O número vai em `.passo-n`, e o
   `.passo-alerta` («!») marca o passo que tem trabalho pendente — é uma marca de sítio para onde
   se pode ir, não a legenda de um painel já aberto.
6. **Duas tiras na mesma página precisam de duas chaves.** O atributo que diz qual é o passo
   (`data-passo`, `data-passo-prof`) não pode ser o mesmo nas duas: os motores varrem a página por
   `button.passo`, e uma chave partilhada faria a tira de um formulário mexer nos passos do outro.
   É a mesma armadilha que obrigou a dar âmbito próprio à tira do Estilo.
7. **Passo não é aba.** A aba (`.abas`) é um assunto que fica aberto — «A escola», o financeiro.
   O passo é a ordem de um mesmo trabalho, e o segundo não existe antes do primeiro: a régua do
   professor é o passo 2 do cadastro dele porque não se avalia com uma régua que ainda não foi
   escrita. Quando um trabalho de vários passos vive dentro de uma aba, a aba é o guarda-chuva e a
   tira fica **em cima** dele.
8. **Um nome só para o gesto de avançar: «Avançar».** *(19/11/2026: «o que for de step, a gente vai
   usar avançar. Então, onde tiver seguir, vai se tornar avançar.»)* O botão que leva ao passo
   seguinte diz **Avançar** nas cinco secções com passos (Sala, Professor, Aluna, Audição, Estilo) —
   não «Seguir», não «Próximo». O de gravar diz o que grava («Gravar sala», «Gravar cadastrar
   professor», «Gravar verbete», «Concluir elenco»), e o de recuar diz «Voltar». Três verbos, um
   por gesto.
9. **O «Cancelar» existe sempre que o formulário está aberto** — inclusive a criar. *(19/11/2026:
   «toda vez que expandir o formulário para começar um registro novo, tem que ter o botão cancelar
   também, porque pode ser que a pessoa desista do processo. […] quando clicar em cancelar […] vai
   colapsar o acordeon que guarda o formulário.»)* Antes de hoje cada secção tinha a sua regra (só
   em edição, só com um registo aberto, só com o primeiro campo escrito) e no caminho de CRIAR o
   botão não existia. A regra passou a ser uma e é a que ela descreveu: **aberto o formulário, há
   «Cancelar»; recolhido, não há** — e clicá-lo fecha o formulário e descarta o que se escreveu. É
   uma função só (`pintarCancelares`, no script da Produção) porque são seis secções, e a cópia que
   ficasse de fora seria a que ninguém notaria até alguém desistir a meio.
10. **Um formulário não traz prosa.** *(19/11/2026, no Desligamento: «é simplesmente colocar o nome
    do professor, o motivo e desligar o professor. Só isso […] Não precisa ter nada de texto.»)*
    Dentro de um formulário há **rótulo, campo e placeholder** — e mais nada. O que se quer dizer
    **antes** de a pessoa agir não se escreve em parágrafo: ou cabe num rótulo, ou não é preciso. O
    que se quer dizer **depois** é a resposta da rota (o recado, o `proximo`), que aparece quando há
    um facto a contar. O parágrafo que aqui vivia explicava o que aconteceria à escola, às turmas e
    ao registo — coisas verdadeiras, ditas no sítio errado: a explicação é do **resultado**, e quem
    a lê é quem acabou de desligar.

    **Como se distingue prosa de estado**, e é o critério que as bancadas medem: **prosa é o
    parágrafo sem `id`**. O que não tem `id` não é reescrito por ninguém — está na página a explicar
    o acto. O que diz **estado** («não há ninguém para desligar») tem `id`, é reescrito a cada
    carga, e é a única prosa que um painel pode ter. Um painel que fica em branco quando não há
    nada a fazer não é um painel limpo: é uma página que parece avariada.

11. **Enquanto há um registo a meio, as abas que não são dele fecham.** *(19/11/2026: «Enquanto eu
    faço o cadastro e navego pelos steps, cadastro e rubrica, até que eu conclua isso, o habilitação
    e o desligamento devem ficar desligados, tá? Não podem ser acessados. Eles só vão ser acessados
    essas duas abas quando eu não estiver num processo de criar um novo professor ou de editar um
    novo professor.»)* A regra não é sobre o Professor em particular: é sobre o que uma **aba
    irmã** pode fazer enquanto a pessoa está a compor um registo. Sair a meio deixa metade do
    trabalho numa aba e metade na outra.

    **O que conta como «a meio»** são estados que a tela já tem — e não um sinal novo inventado para
    isto: o modo de edição aberto, um rascunho composto, o passo 2 à vista, ou o primeiro campo
    escrito. O formulário aberto e **vazio não conta**: ninguém está a cadastrar ninguém no instante
    em que a página abre, e travar aí seria travar a consulta.

    **Três obrigações da peça**, e cada uma já existe no motor das abas:

    - o `disabled` (com `aria-disabled`) **e** o `title` com a razão — uma aba apagada e muda manda
      procurar um defeito que não existe;
    - a **guarda no motor**, e não só no atributo: o clique, a folha do telemóvel e o teclado passam
      todos pelo mesmo `pode(n)`, e é lá que a recusa vive;
    - a aba que **perde o direito fecha-se** e volta à primeira, em vez de ficar aberta a mostrar um
      painel que já não se pode alcançar.

    E o «Cancelar» devolve tudo — inclusive o passo 1, que é o estado de quem acabou de chegar. Um
    cancelar que deixe o passo 2 à vista mantém a tela a dizer «há um registo a meio» sobre um
    registo que já não existe.

12. **Com uma ficha aberta em edição, ninguém exclui.** *(19/11/2026: «em qualquer um desses, e eu
    estou no modo edição de qualquer um dos formulários ou derivação […] o botão excluir, daquilo que
    é permitido excluir, deve ficar desabilitado.»)* Excluir é o único gesto que **destrói**, e com um
    registo aberto para correcção ele pode ser o próprio registo em edição: a lista recarrega, o
    formulário fica a apontar para o que já não existe, e o gesto seguinte responde «não encontrado»
    a quem estava a trabalhar.

    **A regra é por secção, e não global** — e são os sinais que a secção já tem que a respondem (o
    `#prof-modo`, o `#aluna-em-derivacao`, o `#tmodo`, o `#lb-modo`, o `#vbacao`, o `#cuderivar`): uma
    tabela de sinais, um `pintarExcluires()` para todos os `button.apagar` da página. Editar um
    professor não trava a aluna; e um botão desenhado por um caminho novo fica coberto, porque a
    pergunta é feita ao estado e não ao gesto que o desenhou.

    **Três obrigações**: o `disabled` **com** `aria-disabled`; o `title` a dizer porquê — guardando o
    que já lá estava (`data-title-livre`) e devolvendo-o quando o modo fecha; e a **guarda do gesto**
    no ouvinte do clique, porque o `disabled` impede o rato mas não um `click()` programático. As duas
    camadas perguntam à **mesma função** — é isso que as impede de discordar.

**Onde está declarada.** No `<style>` da própria página da Produção (`motor/servidor/bastidores.js`),
e não em `tools/templates/ciclo.css`: a peça nasceu na Produção e é lá que ela vive. O `<style>` da
página é a segunda fonte de desenho que este documento reconhece (como o `.par-botoes`), e a
checagem 8 (Peça) reprova um nome de peça que não esteja neste catálogo — é por isso que esta
secção existe.

### Quadro 2 — o inventário

Onde cada peça é **declarada**, e o que ela tem de estados. Nenhuma destas linhas se escreve
numa página: quem carrega a folha já as recebe desenhadas.

| Peça | Declarada em | Estados que ela tem de ter |
| --- | --- | --- |
| `.acao` | `ciclo.css` | base, `:hover`, `:focus-visible`, `:disabled`, `secundario`, `perigo`, `grande`, `pequena` |
| `.escolhas`/`.escolha` | `ciclo.css` | base, `:checked`, `:focus-visible`, `:disabled` |
| `.campo` (`input`/`select`/`textarea`) | `ciclo.css` | base, `:focus-visible`, `:disabled`, e a seta do `select` nos dois temas |
| `.campo-rotulo` | `ciclo.css` | base, `em-linha` |
| `.selo` | `ciclo.css` | base + um estado por significado (`ok`, `vigente`, `livre`…) |
| `.caixa` / `.caixa.nota` / `.caixa.falta` | `ciclo.css` | — |
| `.modal` (`.modal-fundo`, `.modal-caixa`, `.modal-cab`, `.modal-x`, `.modal-acoes`) | `ciclo.css` | `hidden` (fechado — é o mecanismo nativo, e a proibição 4 vale aqui), aberto, `.modal-largo` (880px, para o formulário com `.etapas`). O `×`, o fundo e o `Escape` fecham a janela; o `.acao.secundario` da fileira desiste do gesto inteiro. O foco entra no principal, e o ouvinte do `Escape` sai do documento ao fechar |
| `.aviso` / `.res` | `ciclo.css` | `.res.ok`, `.res.erro` |
| `.avisos` / `.aviso-do-gesto` | `ciclo.css` | `:empty` (a pilha vazia não ocupa lugar), `data-tipo="ok"/"erro"/"atencao"` (os três pares semânticos), a entrada animada e o `prefers-reduced-motion` que a desliga, e a folha do telemóvel (a pilha atravessa o ecrã, em baixo) |
| `.acoes-da-aluna` | `ciclo.css` | base, e a quebra da fileira no telemóvel (`flex-wrap`) |
| `.acoes-da-linha` | `ciclo.css` | base (coluna, `gap` de `--esp-2`, `min-width` de 8rem, botões esticados). Não tem estados próprios: os dos botões são os do `.acao` (`:hover`, `:focus-visible`, `:disabled`) |
| `.ajuda` («?») | `porta/index.html` | base, `:hover`, `[aria-expanded="true"]`, e 30px de alvo no telefone |
| `.explica` | `porta/index.html` | `hidden` (fechada), `aberto` (à vista; folha fixa ≤768px), e o «Fechar» que só existe dentro da folha |
| `[hidden]` | `ciclo.css`, na base | esconde **sempre** — é a única linha da folha com `!important`, e a razão está na proibição 4 |
| `.topnav` / `.toc-local` / `.toc-dobra` | `ciclo.css` | aberto, recolhido, impressão |
| `.secao-dobra` / `.secao-dobra-sinal` / `.secao-corpo` | `ciclo.css` (o desenho) + `assets/nav.js` (a criação e o estado) | base; `:hover`; `:focus-visible`; `[aria-expanded="true"]`/`"false"` com o glifo `▾`/`▸` e o rótulo («Recolher …»/«Mostrar …»); `.secao-corpo[data-recolhido="sim"]` fechado; impressão (a peça não se imprime e o corpo sai inteiro). **A peça é a mesma dos Bastidores** (`.alternar-form`), e a checagem 20 mede as duas |
| `.veu` | `ciclo.css` | `display: none` por omissão; `[data-ocupado="sim"]` mostra (fixo, `inset: 0`, **translúcido** — `color-mix` do papel a 45%, com `var(--veu)` como rede —, `pointer-events: auto`). O que se lê está **sem caixa**: `.veu-cartao` sem fundo/filete/sombra/ar, a `.veu-etiqueta` é palavra em versalete bordô (`--marca`, sem a pílula do `.selo`) e a `.veu-texto` é serifa com `clamp` (23,2 px no ecrã largo, 18,4 px no telemóvel), ambas com `text-shadow` em três/quatro camadas de `--fundo` — é o halo que faz o trabalho da caixa. O giro é do `.veu-cartao::before` (anel de 2 px com halo de papel), e `prefers-reduced-motion` desliga-o. `[data-remota="sim"]` mostra a `.veu-nota`. `z-index: 120` — acima do `.modal` (100) |
| `.coluna` | `ciclo.css` | coluna fixa ≥1141px (`data-aberta` irrelevante), folha ≤1140 (`data-aberta="sim"/"nao"`), impressão |
| `.coluna-grupo` | `ciclo.css` | fechado (`data-aberto="nao"`), aberto (`"sim"`), e o grupo do documento actual (`data-atual="sim"` — o filete de ouro) |
| `.coluna-titulo` | `ciclo.css` | base, `:hover`, `:focus-visible`; é um `<button>`, porque no telemóvel e no teclado não há ponteiro |
| `.trio` / `.trio-item` / `.trio-painel` | `ciclo.css` | base, `:hover`, `:focus-visible`, `[aria-expanded="true"]`; uma coluna abaixo de 360px |
| `.trio-plano[data-apagando="sim"]` | `ciclo.css` | o estado `sim` (véu com o papel do fundo a 82%, o fio «apagando…», o spinner de 900ms, `pointer-events: none`) e a ausência dele; com `prefers-reduced-motion` o spinner **não** gira |
| `.trio-escala` | `ciclo.css` | um degrau por nível, na cor do papel semântico (`trio-ok`, `trio-razoavel`, `trio-alerta`, `trio-neutro`) |
| `.bloco-lista` / `.bloco-cabeca` | `ciclo.css` | fechado, `[open]` (a `.seta-do-ato` roda 180°), e o `summary` sem o marcador nativo do navegador |
| `.folha-do-menu` / `.folha-puxador` | `ciclo.css` | é a **identidade** das três folhas: fundo bordô, canto de 20px, sombra para cima, medida, e o pegador. O ponteiro esconde o pegador na coluna do computador (`.coluna .folha-puxador`) — lá não há nada a deslizar |
| `.pilula-do-menu` | `ciclo.css` | base, `:hover`, `:focus-visible`, e `[aria-expanded="true"]` a rodar a seta. Vazada **sempre**: é o controle secundário, e quem carrega o peso da navegação é o ☰ |
| `.acoes-da-lista` / `.acoes-do-menu` / `.menu-de-acoes` / `.menu-de-acoes-lista` / `.veu-do-menu` | `ciclo.css` | botão escondido acima de 560px e à vista abaixo; `[aria-expanded="true"]` roda a seta; a folha é `position:fixed` e o véu cobre o resto. O botão deixa **folga** ao bloco que abre (`margin-bottom`), e não encosta nele |
| `.seta-do-ato` | `ciclo.css` | `▾` fechada, `▸` rodada 180° aberta. **Não se chama `.seta`**: esse nome já é a seta do bloco de sessão que o `bastidores.js` emite, e a checagem «Forma» reprova dois desenhos com o mesmo nome |
| `.campos-do-ato` / `.acoes-do-ato` / `.estado-do-ato` | `ciclo.css` | os campos quebram em fileira; o estado tem `data-falta="sim"` para o que impede o avanço |
| `.cota` | `ciclo.css` | base (o `<progress>` despido: `appearance:none`, altura de 0,55rem, pílula, fundo de faixa); `::-webkit-progress-bar` e `::-webkit-progress-value` (e o `::-moz-progress-bar`, porque o Firefox não usa os do WebKit); `[data-nivel="atencao"]` (âmbar, 80%) e `[data-nivel="agora"]` (falha, 95%); `[value="0"]` fica sem tinta — um zero com a cor da falha leria como problema. `prefers-reduced-motion` desliga a transição. Medido em `provar-monitoramento.js` |
| `.abas` / `.aba` / `.aba-painel` | `ciclo.css` (as marcas e os estados) + **o `<style>` da Produção** (o ar debaixo da tira: `.aba-painel>:first-child{margin-top:1rem}`, ver «O ar debaixo das abas») | base; `:hover`; `:focus-visible`; `[aria-selected="true"]` (a aba que POUSA: fundo de superfície e o filete de baixo na cor dele); `[disabled]` (a que ainda não pode abrir — com `title` a dizer porquê, e sem desaparecer). Abaixo de 560px **a tira passa a rolar** (a peça nunca desaparece sozinha — uma página sem pílula ficaria sem forma de mudar de aba); onde há pílula das abas, é a página que esconde a tira na folha dela. Medido em `provar-abas.js` |
| `.apagar` (o botão da exclusão) | `ciclo.css` (a cor do perigo e o `.acao:disabled`) + **o `<style>` da Produção** (a trava por modo de edição) | base; `:disabled` / `[aria-disabled="true"]` (a opacidade `.4` da folha) **com `title` a dizer porquê** (ver «Os passos dentro de uma aba», regra 12). O `title` que já lá estava é guardado em `data-title-livre` e devolvido |
| `.paginas` | `ciclo.css` | `hidden` (uma página só, e o estado sem JavaScript), à vista a partir de duas |
| `.escolhedor` | `ciclo.css` + a página que o emite | `.escolhidos`, `.escolhido`, `.entrada` |
| `.rolagem` / `.rolagem-caixa` / `.rolagem-setas` | `ciclo.css` | `[data-rolagem="sim"]` (há para onde ir: a fileira das setas aparece) e `"nao"`/ausente (não há: nada ocupa lugar). A caixa é `role="region"` + `tabindex="0"`; a tabela de dentro **não** tem scroller próprio |
| `.par-botoes` | **a página da Produção** (`motor/servidor/bastidores.js`), no `<style>` dela — não na folha | fileira que quebra (`flex-wrap`), com o vão de `.55rem` acima. Carrega **sempre** uma `.acao` (e o `secundario` do cancelar, quando há). Medido: 9px entre o campo e o botão, o mesmo nos cinco formulários |
| `.passos` / `.passo` / `.passo-n` / `.passo-t` / `.passo-alerta` / `.turmas-faixa` | **a página da Produção** (`motor/servidor/bastidores.js`), no `<style>` dela | base; `:hover`; `:focus-visible`; `[aria-current="step"]` (o `.ativo`: fundo de superfície e filete na cor dele); `[disabled]` (o passo que ainda não pode abrir); `.passo-alerta` (o «!» do que falta); e, no embrulho, `.turmas-faixa[hidden]` e `.secao[data-recolhido="sim"] .turmas-faixa` (recolhe com o corpo). Abaixo de 560px o rótulo encurta com reticências (`text-overflow`) e os conectores entre passos desaparecem |
| `.ficha` / `.cartao` / `.acoes` (raiz) | **a própria página**, que não carrega a folha | ver a checagem 4 |

### A seta de abrir e fechar — a peça, e o primeiro aberto *(22/11/2026)*

Ela viu a seta das Salas, dos Professores, das Alunas e da Audição e nomeou-a padrão:

> «Ele é maior, ele é grande, ele é redondo, tem uma borda redonda e tal. Vamos adotar isso como
> padrão […] onde é que vai ser padrão esse botão? Nesses títulos que a gente tem no contexto […]
> E aí começa com todos eles colapsados, exceto o primeiro […] Faz esse ajuste que ele é
> importante para nossa identidade visual e registra isso, documenta isso, porque a gente vai
> seguir fazendo mudanças e isso é algo que tem que ser preservado.»

**A peça existia e não estava no catálogo** — outra vez o mesmo defeito: dois desenhos para a mesma
coisa, um deles fora do contrato. Agora está declarada, e a regra tem quatro partes:

| O quê | A regra |
|:--|:--|
| **A geometria** | `2rem × 2rem`, `border-radius: 999px` (redonda), `1px solid var(--borda-campo)`, fundo `--superficie`, glifo `700 .9rem/1 var(--ui)`. No ponteiro, `--fundo-hover` e `--marca-texto` |
| **Onde vale** | os **títulos de secção do documento**: o plano do ciclo (o contexto, o objetivo geral, o objetivo específico), as aulas (todos os títulos), a notação e o glossário |
| **Onde NÃO vale** | o índice da página (`.toc-dobra`) e o menu da coluna (`.coluna-seta`) — estão certos pequenos, e ela disse-o |
| **O estado inicial** | **todos recolhidos, excepto o primeiro** título do documento. Depois do primeiro gesto, a memória da sessão manda — e um `[]` guardado é uma escolha (fechou tudo), não a ausência dela |

**A peça é desenhada em duas folhas, e é isso que a checagem 20 guarda.** A `.alternar-form` vive
no `<style>` da Produção; a `.secao-dobra`, em `tools/templates/ciclo.css`. As duas superfícies não
partilham ficheiro de estilo, portanto a mesma peça aparece duas vezes — e é exactamente assim que
duas cópias divergem à primeira correcção. A checagem **20 (Seta)** lê as duas declarações (a
segunda, do HTML que o motor **serve**) e reprova se `width`, `height`, `border-radius`, `border` ou
`font` se afastarem. Não compara nomes nem classes: compara o que a pessoa vê.

**O título não cresce, e foi medido.** O `h2` tem 23px de tipo e a sua linha já dava **38px**; a
redonda de 32px cabe dentro desses 38, e o título fica com os **mesmos 38px** com e sem a peça — o
mesmo número do pacote anterior, onde a seta era um glifo de 13px. A seta ficou maior sem custar
uma linha de altura ao documento.

**O gesto que a memória não pode perder.** A lista guardada passou a ser a das **abertas**
(`ciclo:secoes-abertas`), e não a das recolhidas: a chave mudou de nome porque o **sentido** mudou,
e ler a chave velha com o sentido novo abriria o documento inteiro para quem tem a sessão de antes.
E o clique tem de gravar a secção **certa** — o nome antigo da variável dizia «aberto» quando
queria dizer «estava fechada», e com a lista invertida isso gravava a primeira secção ao clicar na
segunda (medido, e corrigido; ver `provar-a-seta-redonda`, secção C).

**Prova.** `node experimentos/provar-a-seta-redonda.js` — 18 asserções num navegador: a peça mede
32×32 com raio de 16 e filete de 1px; os quatro documentos abrem com o primeiro título aberto e o
resto fechado; o gesto abre, fecha e sobrevive ao recarregamento; um link do índice abre a secção
que estava fechada; no papel a peça não se imprime e as secções saem inteiras. Controle
`--contra=22354d71`: **14 de 18 reprovam** (a peça de lá tinha 23px de altura, «0px none» de
moldura e fundo transparente, e tudo abria aberto).

### A matriz que não cabe rola dentro de si — e as setas dizem-no *(06/11/2026)*

O formulário do lançamento ganhou uma matriz com as alunas nas linhas e os aspectos nas colunas. E
as colunas **crescem com o dado**: o recorte do corpo tem quatro aspectos neste ciclo e pode ter
oito no seguinte. O pedido dela foi em dois tempos:

> «tem que prever que quando ultrapassar a largura da página precisa de um scroll horizontal […] E
> como é que fica o layout dimensionado para celular de uma forma fácil de usar, que o usuário não
> se confunda e ele perceba que tem que andar para o lado? Eu pensei em colocar aqueles botãozinhos
> que tem geralmente para os carrosséis […] também não tá na nossa identidade visual, né? Se ficar
> bom tem que incorporar.»

**Porque a folha já não bastava.** Abaixo de 900px a casa manda a `table` rolar dentro de si — e
isso **não se vê**: quem olha um telemóvel vê colunas cortadas ao meio e não sabe se o corte é do
desenho ou do fim do conteúdo. A seta responde a essa pergunta e a mais nenhuma; por isso ela é
**peça**, e não adorno: aparece **só quando há para onde ir**, e desliga-se no fim do caminho.

```css
.rolagem { min-width: 0; }
.rolagem-caixa { overflow-x: auto; overscroll-behavior-x: contain; }
.rolagem-caixa > table { display: table; overflow: visible; }
.rolagem-setas { display: none; justify-content: flex-end; align-items: center;
                 gap: var(--esp-2); margin: 0 0 var(--esp-2); }
.rolagem[data-rolagem="sim"] .rolagem-setas { display: flex; }
.rolagem-setas .acao { margin: 0; }
.rolagem-setas .conta { margin-right: auto; }
```

| O que | Por quê |
| --- | --- |
| `data-rolagem` no bloco | é o **dado** que decide, não o tamanho do ecrã: com colunas dinâmicas, a mesma tela tem e não tem sobra em duas aulas do mesmo ciclo |
| `scrollWidth > clientWidth` | a única medida honesta de «não cabe». Pergunta-se à caixa, não ao `window` |
| a caixa é `tabindex="0"` e `role="region"` | quem não usa dedo chega-lhe pelo teclado, e o leitor de ecrã anuncia que ali há uma região que rola |
| a tabela de dentro **não** tem scroller | senão ficavam **dois** abaixo de 900px (o da regra da casa e o da caixa), e o gesto ficava preso no de dentro |
| `--colunas` no `<table>` | a largura mínima é `10rem × colunas`, e o número é escrito **pelo dado** quando a tabela é montada. Sem isso, `table { width: 100% }` **espremia** as colunas até caberem — o contrário do que o professor precisa para marcar |
| sem JavaScript | **não há seta nenhuma** (a fileira nasce escondida) e a caixa rola pelo gesto, como antes. A seta é conforto, não função |

**A largura também deixou de ser a de um documento.** O formulário declarava `data-layout="documento"`
e não tem índice lateral — a coluna do índice ficava **vazia**, a roubar-lhe 304px. Medido: **828px**
onde cabiam **1132**. Passou a `data-largura="matriz"`, e a coluna é uma só, com a largura toda do
contentor. A conta é literalmente a que ela fez: *«a mesma dimensão que os outros formulários ocupam
somando a essa dimensão a parte do roteiro»* — 828 de texto + 32 de vão + 272 de índice = **1132**.

**A presença não é uma linha de cinquenta nomes.** Passou a ser a mesma caixa que abre (`.eixo`),
com a contagem no título («— 3 de 12») e «marcar todos» / «desmarcar todos». **Acordeão, e não
modal**, e o motivo é o de sempre: um modal custa prender o foco, fechar no `Esc`, travar a rolagem
de trás e devolver o foco — nada disso se vê numa captura, e por isso se parte em silêncio; e não é
peça desta folha. Abre sozinha até doze alunas (marcar presença é o primeiro gesto da aula, e uma
caixa fechada obrigaria a um clique para fazer o que hoje se faz sem nenhum) e fechada acima disso.

**E a matriz segue a marcação.** Desmarcar quem faltou reconstrói as linhas com quem veio — e o que
já estava escrito **não se perde**, porque os `id` dos campos são estáveis por (bloco, aluna,
coluna) e o painel os repõe pelo `id`, não pela posição.

**Prova.** `experimentos/provar-formulario-da-aula.js`, secções **E**, **F** e **G** (48
asserções): a coluna mede **1132px** a 1280; a 390 a matriz não cabe, o bloco diz `sim`, a fileira
aparece, a seta da esquerda está desligada no princípio, a da direita anda a caixa e desliga-se no
fim; a 1280 não há setas nem fileira; a largura mínima é `10rem × colunas`; desmarcar a aluna B tira
a linha dela e a marca da A sobrevive.

### As três proibições, com o caso que as criou

1. **Nenhuma classe nasce no uso.** Se a marcação precisa de um contentor, ou ele é uma peça
   deste catálogo, ou é um **gancho** declarado com a razão. A checagem **8 (Peça)** reprova o
   resto — foi ela que teria parado o `.fileira`.
2. **Uma peça declarada num contexto não se usa fora dele.** `form .nota` só existe **dentro
   de um `<form>`**; fora dele o parágrafo sai no corpo do texto. Quem precisa da linha de
   apoio usa `.sub`, que é do sistema e não tem contexto.
3. **Uma peça não faz o trabalho de outra.** Ação é ordem; pílula é estado; selo é atributo do
   dado. Um botão que guarda estado é a pílula disfarçada — e o desenho dele só aparece no
   instante em que o ponteiro sai.
4. **Um estado não se deixa à mercê da página.** `[hidden]` é o atributo do estado escondido,
   e o `display: none` que o navegador lhe dá vive na folha **dele** — logo, perde para
   qualquer regra de autor. O «Fechar a elicitação» do ato ficou com `hidden` posto e **45px
   de altura**, porque a página tem um `button { display: … }`: a barra de ações media 114px
   com um botão que não devia existir. O estado mora na base da folha, com `!important`.

### A regra de nascimento de uma peça

Uma peça nova **nasce inteira**, no mesmo commit, e nesta ordem:

1. o desenho em `tools/templates/ciclo.css`, com **todos** os estados do Quadro 2 e só tokens
   de papel (a checagem 3 reprova primitivo);
2. uma linha no **Quadro 1** e uma no **Quadro 2** deste documento;
3. a prova — a geometria dela medida num navegador de verdade (`experimentos/provar-*.js`);
4. a cópia nas superfícies que a usam (`assets/style.css`), e as checagens 5 e 7 verdes.

Enquanto isso não acontecer, a peça **não existe** — e usá-la é o defeito que este catálogo
existe para impedir.

### O ar debaixo das abas é 16px — e não depende de quem está em primeiro *(19/11/2026)*

> «Na aba cadastros, logo que ela abre o formulário, a margem superior do formulário está colada na
> margem das abas. O correto é igual a habilitações, existe um espaço entre a aba e a margem
> superior do formulário. Cadastros já havia sido corrigido anteriormente e agora voltou a acontecer
> esse mesmo problema.»

**A regra, e ela é uma só:** o primeiro conteúdo de um `.aba-painel` fica **`1rem` (16px) abaixo do
fundo da tira de abas** — a distância que ela declarou certa nas Habilitações. Vale para as duas
secções que têm abas (Professores e Audição), nas seis abas, e é medida em geometria de verdade por
`experimentos/provar-a-margem-da-aba.js`.

**Porque é que isto já voltou três vezes.** A regra nasceu a nomear o FILHO —
`.aba-painel > form:first-child` — e três vezes o painel ganhou um embrulho que a fez deixar de
casar **em silêncio**: o `#pf-cadastro-paineis` que separa os dois passos do Cadastro, o `.caixa` da
aba 2 da Audição, o `.aviso` que abre o Desligamento. Nada falha, nada avisa — o formulário só fica
encostado ao filete. Medido a 1280 px, com a regra antiga: **0 px no Cadastro**, 12 px no
Desligamento, 2 px na terceira aba da Audição; o 16 só aparecia onde o primeiro filho era mesmo um
`<form>`.

**A forma que não volta a partir**, e é a que está no código:

```css
.aba-painel > :first-child,
.aba-painel > [hidden] + * { margin-top: 1rem; }
```

Três decisões, e cada uma fecha um regresso:

1. **`:first-child`, e nunca `form:first-child`.** A pergunta não é «o primeiro filho é um
   formulário?» — é «o que está em primeiro lugar tem o ar certo?». Um embrulho novo (`<div>` de
   passos, uma `.caixa`, um aviso) recebe a margem como o formulário a recebia.
2. **A margem é DEFINIDA, não somada — e por isso a regra não tem excepções.** Um `.aviso` traz
   `12px` de margem própria, e deixá-lo de fora dava duas distâncias para a mesma fronteira (12 no
   Desligamento, 16 nas Habilitações). O primeiro filho recebe `1rem`, venha ele com a margem que
   vier; as suas margens de meio de texto não são tocadas.
3. **`[hidden] + *` para o primeiro que se vê.** Na Audição o primeiro filho é um aviso que nasce
   escondido: escondido não ocupa lugar, e sem esta linha o formulário subia até às abas exactamente
   quando o aviso desaparecia.

**Onde se mede.** `experimentos/provar-a-margem-da-aba.js` — geometria no navegador (jsdom não tem
layout) e uma asserção sobre o CSS emitido que reprova a volta do `form:first-child`. É a segunda
asserção que impede o quarto regresso: a primeira mede o sintoma, a segunda mede a forma.

### O vão do botão não se dá por acidente *(26/10/2026)*

A folha separa o campo da ação com uma conta de **vizinhança**:

```css
:where(form) > :where(input, select, textarea) + button.acao { margin-top: var(--esp-4); }
```

`+` quer dizer «o elemento imediatamente a seguir». Um `<div class="res">` no meio — e é onde
ele nasce, entre o último campo e o botão — **parte a vizinhança**, mesmo sendo
`display: none` até haver resposta. O botão fica com `margin: 0` (o `.acao` declara-o) e
encosta no campo.

Foi o que aconteceu aos dois formulários da Produção que **não** tinham fileira: o «Cadastrar
aluna» e o «Cadastrar termo» saíram com **0px** entre o campo e o botão, e a tela mostrou o
defeito antes de qualquer prova. O «Atribuir curadoria» tinha fileira e não tinha `.acao`: caía
no botão **padrão** da folha — fundo de papel, filete na marca — e ao lado das ações cheias de
bordô da mesma página parecia de outra família, quatro pixels mais baixo.

**A regra, para não se repetir:** a ação que grava põe-se na fileira `.par-botoes`, com
`.acao` (e `grande` quando é a principal do formulário). Quem confere é a
`experimentos/provar-vao-do-botao.js`: ela mede a fileira, a classe, a cor computada, a altura
e o vão de cada ação contra o «Cadastrar professor», que é o modelo. Com o código de antes,
os três formulários reprovam.

#### A ORDEM na fileira: a que grava primeiro, o recuo à direita *(20/11/2026)*

«O botão de cancelar […] você colocou no lugar errado. Ele é à direita do gravar e não à esquerda
do gravar. **Tem que seguir o padrão.** Não está documentado isso, se não tiver tem que documentar.»

**A ordem é sempre esta: a ação principal primeiro, o recuo depois.** Na fileira, da esquerda para
a direita: `Avançar` ou `Gravar` → `Cancelar`.

| formulário | a fileira, na ordem |
|:--|:--|
| Cadastro do professor | `prof-enviar` (Avançar) · `prof-cancelar` |
| Régua do professor | `rubr-voltar` · `rubr-gravar` · `rubr-cancelar` |
| Habilitações | `hab-enviar` · `hab-cancelar` |
| Turmas atribuídas | `cu-enviar` · `cu-cancelar` |

**Porque esta ordem, e não a outra.** A pessoa chega ao fim de um formulário e a mão procura o
gesto que conclui — é ele que fica debaixo do polegar, e é ele que leva a classe `grande`. O recuo
fica ao lado, e não à frente: um «Cancelar» à esquerda do «Gravar» é a primeira coisa que se lê
onde devia estar a última decisão, e faz duvidar do que o botão ao lado faz.

**Como o defeito nasceu, e é a lição.** O «Cancelar» das habilitações foi acrescentado depois dos
outros — e foi posto **antes** do «Gravar», ao lado do que já lá estava, sem se conferir a fileira
dos vizinhos. Um formulário fora do padrão não é um detalhe de gosto: é o único sítio onde a mão
não encontra o que já aprendeu nos outros quatro. Quem acrescentar um botão a uma `.par-botoes`
confere primeiro **a ordem dos que lá estão**.

Quem mede isto é a secção C da `experimentos/provar-o-que-mudou.js`, que compara as posições de
`hab-enviar` e `hab-cancelar` na marcação — a ordem no HTML é a ordem na fileira.

### A fileira das acções de uma ESCOLHA — e o `<div>` nu *(06/11/2026)*

A §6 «Proveniência consolidada» da aula passou a ter um menu de alunas e, por aluna, os dois
gestos da anamnese. A primeira versão pôs cada par num `<div data-prov-par="…">` **sem classe**.
Medido no documento publicado: o `<select>` acabava em **3139,6px** e o `<div>` começava em
**3139,6px** — o botão **1px** abaixo do menu, em 1280 e em 390. O relato dela: *«quando eu
escolho a aluna, o botão novo registro e imprimir estão colados no dropdown … tem que ter um
espaço»*.

**É o mesmo erro de antes, com outra roupa.** O `.acao` declara `margin: 0` — porque é isso que
o põe na linha dos outros controles —, e um `<div>` nu não tem ar nenhum. Quem dava vão ao botão
era a **vizinhança do formulário** (`:where(form) > campo + button.acao`, 16px); aqui não há
formulário, os gestos são **ligações** (`a.acao`, para a Área do Professor) e há um bloco por
aluna. Uma peça, e não um caso daquela:

```css
.acoes-da-aluna {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: var(--esp-2); margin: var(--esp-3) 0 0;
}
```

| O que | Por quê |
| --- | --- |
| `margin-top: --esp-3` (12px) | o vão que separa um controle da fileira que o segue. `--esp-4` fica para o botão que **grava**, que é o que a regra da vizinhança protege |
| `gap: --esp-2` (8px) | dois botões separados só por um espaço de texto ficam a **4,3px** um do outro, medido — e é no telemóvel que o dedo os tem de distinguir |
| `flex-wrap` | no telemóvel os dois descem um para baixo do outro em vez de sair da caixa |
| o nome | `acoes-do-ato` e `acoes-da-lista` já dizem «as acções que pertencem a uma coisa»; estas pertencem a **uma aluna** |

**Onde passa a estar guardado.** A peça nasce na folha, entra no catálogo (Quadro 1 e Quadro 2)
e é provada em **navegador** pela `experimentos/provar-proveniencia-e-turma.js`, secção **H**:
mede o vão do menu ao primeiro botão e o vão entre os dois botões, em 1280 e em 390, e exige
≥12px e ≥8px. Contra a folha de antes, **8 das 53** asserções reprovam.

### A lista de cartões: o contentor, a ordem e a paginação *(19/11/2026)*

Ela viu o Dicionário e disse o que estava errado, e a frase aponta para o sítio certo:

> «A listagem do dicionário não está seguindo o padrão, porque categoria, tradição e complexidade
> não ficam na mesma linha, ficam abaixo. […] Veja que em audição, quando a gente lista os elencos,
> os nichos, alunas e recorte estão abaixo da descrição […] e no dicionário elas estão ao lado do
> botão editar e excluir.»

**A causa era o contentor, e não o cartão.** O cartão (`.trio-plano`) é `display:block` — uma
coluna: nome, descrição, nichos. Mas ele estava dentro de um `<ul class="lista">`, e `.lista li` é
`display:flex`: a ficha de UMA linha. O `display` do pai vence, o cartão sai deitado, e as caixas
ficam espremidas ao lado dos botões. É a mesma armadilha que a Audição já tinha corrigido a
05/11/2026 — «as três caixas ficavam com 110px numa coluna de 1200px, porque eram itens de uma
fita».

**As três regras, e valem para qualquer lista de cartões:**

1. **O `<ul>` é `.trio-lista`** (ou o `.lb-cartoes` da página que o declara). **Nunca `.lista`** —
   essa é a fita de linhas simples do gabinete.
2. **A ordem é: nome e gestos, a descrição, e os nichos no fim.** `li.trio-plano` >
   `div.trio-linha` (`.trio-nome` + `.trio-acoes`) > a linha de descrição (`.trio-frase`, ou
   `.fatos`/`.trio-dono` para o que não é prosa) > `div.trio` (as caixas) > um `.trio-painel` por
   caixa. Os gestos vão em `.trio-acoes`, nunca num `.acoes` inventado.
3. **A lista pagina, e o cliente chama `paginar()` depois de a encher.** O rodapé `.paginas` nasce
   `hidden` e é o `paginar()` que o acende — e ele corre **no arranque**, quando uma lista montada
   pelo cliente ainda tem o «carregando…». Sem a chamada, a lista mostra tudo e o rodapé nunca
   aparece. O selector «por página» vive na barra (`data-tamanho-de`), e não no rodapé.

### O retorno de um gesto sai do formulário — a pilha do canto *(19/11/2026)*

> «Ao invés de colocar aqui dentro do formulário, vamos exibir na tela, no canto superior direito,
> essas mensagens, de êxito ou de erro ou de atenção, qualquer que seja ela. E elas são temporárias.
> Coloca que elas vão durar 8 segundos. Mesmo que elas fiquem uma sobre a outra, vão criando uma
> lista, mas cada uma dura 8 segundos. E também coloca um botão de fechar.»

**A peça são duas**, e a divisão é a mesma do `.veu-de-operacao`: o **contentor** `.avisos` é a pilha
(fixa, no canto, uma coluna) e cada **`.aviso-do-gesto`** é um aviso. Nenhuma classe nasce fora desta
declaração, e a cópia está no Quadro 2.

**Porque o `.res` não serviu.** Ele é um parágrafo **no fluxo**: nasce dentro do formulário, empurra o
que está abaixo, e desaparece quando o formulário recolhe — que é exactamente o que passa a acontecer
depois de gravar. Um recado escrito no sítio que acabou de se fechar não se lê.

| regra | valor | porquê |
|:--|:--|:--|
| posição | `top: calc(var(--header-height) + var(--esp-2))`, `right: var(--esp-4)` | o canto superior direito que ela pediu, abaixo da faixa — nunca por baixo dela |
| `z-index` | `130` | acima do véu da operação (120): o aviso é a resposta que levanta o véu, e um aviso por baixo dele não se vê |
| a pilha | `pointer-events: none`, e cada aviso `auto` | a zona não tapa a página; quem recebe o ponteiro é o aviso |
| a cor | `data-tipo` = `ok` / `erro` / `atencao` | os três pares semânticos que o `.res` já usa; um quarto tipo não existe, e o JavaScript não o inventa |
| a vida | **8 s**, e o `×` fecha antes | ela deu o número; o botão é para quem tem pressa |
| a ordem | a mais recente **em cima** | um aviso novo não pode empurrar o anterior para fora do alcance |
| o telemóvel | a pilha atravessa o ecrã e desce para o fundo | 25 rem não cabe em 360 px, e um aviso cortado esconde o fim da frase |

**A peça é do sistema, e a página só a usa.** O contentor é um `<div class="avisos" id="avisos">`
vazio no casco; quem põe e tira avisos é o cliente. **A mensagem sobrevive à recarga** pelo mesmo
mecanismo que a cadeia da geração já usa (`sessionStorage`, com prazo) — sem isso, o aviso de uma
gravação morria no `location.reload()` que a própria gravação dispara.

### O botão que grava diz «Gravar» — e só isso *(19/11/2026)*

> «quando eu for gravar é só gravar, não precisa inventar tentando justificar o que é que eu estou
> gravando ou explicar para o usuário o que é que está gravando. Gravar é gravar. […] é sempre
> gravar. […] a gente mexe só em um lugar, porque afinal de contas gravar é gravar.»

**A peça é a mesma de sempre** — `.acao grande` dentro de `.par-botoes` —, e o que esta linha fixa é
o **texto**: `Gravar`, uma palavra, em todas as secções e nos três modos.

| o que o botão diz | o que ele não diz mais | onde isso passou a viver |
|:--|:--|:--|
| `Gravar` | «Criar dicionário», «Gravar verbete», «Gravar cadastrar professor», «Gravar as habilitações» | — o acto é o mesmo em todas |
| `Gravar` | «Cadastrar aluna», «Gravar a correção», «Gravar a anamnese nova» | o **efeito** vai no `title` («criar o elenco…» / «regravar este elenco…») |
| `Gravar` | «Gravar turma», «Gravar ajuste», «Atribuir turma» | idem |
| `Gravar` | «Criar elenco», «Gravar elenco», «Criar dicionário», «Gravar alterações» | idem |

**A regra vale para os botões que gravam um formulário, e só para eles.** «Desligar o professor»,
«Mover a aluna» e «Ler as anamneses» dizem o acto que fazem, e é isso que se quer: um «Gravar» num
deles seria a tela a mentir sobre a consequência. A distinção é entre **gravar um formulário** (um
rótulo) e **fazer outra coisa** (o nome dela).

**E o rótulo escreve-se uma vez, no servidor** (`ROTULO_DO_GRAVAR`). Uma página que reescreva o texto
do botão conforme o modo reabre a divergência na secção seguinte — e é por isso que a prova
`provar-gravar-e-gravar` mede a **ausência** das frases antigas no script servido, e não a presença
de «Gravar».

### A janela por cima — quando se justifica, e o que os botões dela fazem *(20/11/2026)*

> «o modal só se justifica quando no plano de ensino o tipo for em minutos. Se for em percentual não
> precisa do modal, porque resolve automaticamente.»

**Um modal é o último recurso, e esta secção existe para o dizer antes de alguém abrir o segundo.**
Ele custa prender o foco, fechar no `Esc`, travar a rolagem de trás e devolver o foco ao sítio de
onde veio — nada disso se vê numa captura, e por isso é o que se parte em silêncio. O `.explica`, o
`.bloco-lista` e o `.trio-painel` existem exactamente para não precisar dele.

**A regra, e o caso que a fixou.** Abre-se uma janela quando **a pessoa está a decidir algo cuja
consequência ela não pode ver** — e só então. O caso canónico é a duração da aula:

| o que a mudança faz | há modal? | porquê |
|:--|:--|:--|
| os blocos estão em **percentual** | **não** | a conta resolve-se sozinha: 30 % de 90 tempos são 27, de 165 são 49,5. Não há decisão nenhuma a tomar |
| os blocos estão em **minutos** | **sim** | a soma tem de fechar com a duração, e os números foram escritos para a outra. Alguém tem de dizer quais são |
| a duração mudou mas o volume é o mesmo | **não** | nada a decidir; e um modal com uma pergunta que não existe é um clique a mais |
| um exercício novo entra no **conteúdo de uma Turma com plano** | **sim** | sem dizer a que objetivo ele serve, o exercício entra no repertório e não entra em aula nenhuma |
| um exercício novo numa **Turma sem plano** | **não** | não há objetivos a que ligá-lo; a Turma fica em suspensão e o plano, quando nascer, leva o conteúdo |
| mexer no **Estilo** | **não** | um exercício no Estilo nasce livre: não pertence a aula nenhuma, e nada a jusante depende dele |

#### A ação que leva o que ficou para trás — «Atualizar o ciclo» *(20/11/2026)*

**O problema, nas palavras dela:** «há derivações que são feitas, elas têm efeito diretamente na
turma, mas elas param ali». A régua da sala, o vocabulário e o verbete mudam-se e chegam à Turma —
e param: a régua viaja no plano como fotografia, e os documentos só a leem quando um plano novo
nasce. O professor tem de poder dizer «leva isto agora».

**O nome.** «Regeneração» diz o mecanismo; **«Atualizar o ciclo»** diz o que a pessoa leva — o ciclo
que ela lê passa a ter o que a Turma declara hoje. E é vocabulário que o sistema já tem: o fluxo do
CI chama-se «Gerar o ciclo», e a etapa 4 é «os documentos gerados».

**A peça é a que já existe.** O botão é um `.acao secundario pequena`, ao lado do «Derivar», e a
nota é um `.nota` — a mesma peça que o cartão do Elenco usa. Nada de novo foi desenhado; o que se
acrescentou foi uma **gancho** (`data-ciclo-atualizar`) e uma frase.

**A frase diz o facto e não conta nada.** Não há número de «ajustes pendentes»: o sistema não sabe
distingui-los — uma régua mudada não deixa marca no plano —, e um número inventado seria a mesma
família de erro que este repositório persegue. A nota diz o que acontece e aponta o botão.

**A pergunta não começa por «Gravar».** A regra da casa — «não tem nada de gravar de um jeito,
gravar de outro jeito, é só gravar» — é uma varredura de **texto**, e uma legenda «Gravar a
distribuição com estes minutos?» reprovava-a com razão: no ecrã, ao lado de um botão «Gravar», a
palavra aparece duas vezes a dizer coisas diferentes. A pergunta fala do que muda («Ficar com estes
minutos?»), não do gesto.

**O que é automático não se mostra.** O total que se recalcula sozinho, o volume que decorre da
faixa — nada disso entra na janela: «o que é automático ele não quer nem saber. Ele só quer saber o
que tiver impacto». O **total**, quando aparece, aparece como **resultado** (`<strong>`), nunca como
campo: uma soma editável seria uma segunda verdade sobre a mesma conta.

#### Os botões, e a diferença que os justifica

| peça | o que faz | o que **não** faz |
|:--|:--|:--|
| `×` (`.modal-x`) | fecha a janela e devolve o pedido — quem clicou pode voltar a tentar | não desfaz nada no formulário de trás |
| o fundo (`.modal-fundo`) | o mesmo que o `×` | idem |
| `Escape` | o mesmo que o `×`, para quem está no teclado | idem |
| **`Cancelar`** (`.acao secundario`) | **desiste do gesto inteiro**: fecha, limpa o formulário e recolhe-o | não deixa resíduo para um segundo «Gravar» |
| **`Gravar`** (`.acao`) | manda a decisão e segue | não é o único caminho de saída |

**A ordem é o principal primeiro, o «Cancelar» à direita** — e é a MESMA regra em todo o produto:
nos formulários dos Bastidores, nos modais e nas janelas de confirmação. A fileira é `.modal-acoes`
(o `flex-end` e o `gap` são dela), e os dois botões são `.acao` — a peça de sempre, não uma variante
de modal.

> **Correção de 21/11/2026 — a regra anterior estava ao contrário, e foi ela que a desmentiu.**
> Este documento dizia «a ordem é o secundário primeiro, o principal depois», com uma justificação
> que parecia boa («um «Cancelar» à direita do «Gravar» é o que o dedo encontra quando procura o
> gesto que conclui»). **A decisão é dela, e é a oposta**, dita duas vezes em dois gestos
> diferentes: no formulário das habilitações — «ele é à direita do gravar e não à esquerda do
> gravar» — e na janela de criar a aula — «o botão cancelar ele fica do lado direito. A gente já
> conversou sobre isso também». O padrão passa a ser um só: **a acção que conclui vem primeiro, o
> recuo ao lado dela, à direita**.
>
> O que a correção custou, e o que ela ensina: as três janelas que já existiam (a duração, o
> objetivo do exercício novo e o convite da escola) nasceram com a ordem antiga, e o formulário das
> habilitações com a nova — **duas ordens no mesmo produto, as duas «documentadas»**. O texto de
> antes fica aqui como o elo do que se acreditou; o que manda é a linha de cima. A prova que
> afirmava a ordem antiga (`provar-salas-e-elencos`, secção do modal da duração) passou a afirmar
> esta, e é por isso que ela é a rede: uma prova que fixa uma ordem errada congela o erro.

**Porque é que o «Cancelar» do modal existe, tendo o `×`.** Porque sem ele o professor tem de clicar
duas vezes para desistir: «para o professor não ter que clicar duas vezes lá no canto superior
direito o x para sair e depois ele tem que clicar em cancelar». E porque **o `×` e o `Cancelar`
fazem coisas diferentes**: o `×` fecha a janela; o `Cancelar` desiste do gesto — e é o mesmo gesto
que o «Cancelar» do formulário de trás faz, chamado pela mesma função, para não haver duas limpezas
a divergir.

**O foco entra no principal** (`#dur-gravar`), e o `Escape` sai do documento quando a janela fecha.
Sem essa limpeza, cada modal fechado deixava um `keydown` colado ao `document`, e a segunda abertura
fechava-se com a primeira tecla.

**O que um modal NÃO é.** Não é sítio para um formulário longo (é o `.modal-largo` com `.etapas`,
que existe para o cadastro da escola), nem para uma lista de presença (é o `.eixo`, um acordeão), nem
para uma explicação (é o `.explica`). Uma janela que abre para mostrar três linhas é o `.aviso`.

#### O segundo caso — a janela do exercício novo *(20/11/2026)*

**Onde ela abre, e é o que a distingue de todas as outras:** ao **acrescentar a ficha no conteúdo da
Turma**, e nunca no Estilo. «Quando eu acrescento um exercício com verbete novo no estilo, ele nasce
como livre. […] Em que momento então é formado o elemento do exercício que vai para o caderno? É na
turma, a antiga curadoria. […] quando eu mando adicionar o Batman GT é que o modal tem que aparecer.»
E só com a Turma **vinculada**: sem plano de ensino não há objetivos a que ligar o exercício, e
disparar aí «é só custo».

**A pergunta também não começa por «Gravar»:** *«A que objetivo «Battement jeté» serve?»* — com os
objetivos do plano, um por um, **sem pré-seleção**. Nenhum vem marcado porque escolher o objetivo é
a declaração pedagógica: um pré-marcado seria o sistema a decidir pedagogia com um clique a menos.

**A ficha só nasce depois do «Gravar».** É a diferença que faz a janela valer: incluir sem declarar
é incluir um exercício que nunca entra em aula, e o sistema não pergunta sobre um facto consumado.

**E aqui o `×`, o fundo, o `Escape` e o `Cancelar` fazem a mesma coisa — fechar sem escrever nada.**
Não é uma quebra da tabela de cima: é a mesma regra lida ao contrário. A diferença entre fechar e
desistir nasce na janela da duração porque ela **interrompe um pedido já feito**, e o «Cancelar» tem
um formulário de trás para limpar. Esta não interrompe nada e não tem formulário nenhum atrás — o
que havia para abandonar ainda não foi escrito. Um «Cancelar» que fizesse outra coisa seria a
diferença a inventar um efeito que não existe.

**O resumo anda com as caixas.** Antes de gravar, a linha diz o que vai sair («o parâmetro de
medição passa a observar «X» no(s) objetivo(s) 2»); sem nada marcado, diz a consequência («o
exercício não entra em aula nenhuma»). Um botão que não faz nada sem explicar porquê é pior do que
um botão desactivado.

**E quando não há pergunta, o motivo diz-se.** O servidor é quem decide se há algo a perguntar, e
quando a resposta é «nada» ela traz a razão — «esta Turma ainda não tem plano de ensino», «não
consegui ler a lista de planos agora». A janela não abre, a ficha entra, e a razão aparece no canto
como qualquer `.aviso`. Um gesto que não pergunta e não diz porquê é indistinguível de um gesto que
falhou — e foi assim que uma janela construída ficou três horas a parecer que não existia.

**E o que a resposta implica é dito em números, não em adjectivos.** Além dos objetivos, a janela
mostra em que blocos aqueles objetivos se trabalham, quantas linhas do item 10 já citam o exercício,
e **quanto muda a soma dos tempos por bloco** — com as duas frases possíveis: os blocos que mudam e
o antes → depois, ou «a soma não muda: os tempos vêm das linhas do item 10, e quem as escreve é
você». A segunda frase não é uma desculpa — é a informação de que o sistema não fará a linha por ela.

**Prova.** `experimentos/provar-salas-e-elencos.js`, secção L — **193 asserções**: o modal só abre
em minutos; os botões são dois, o secundário primeiro, o «Cancelar» com `type="button"`; o `Escape`
fecha sem reenviar o pedido e sem deixar ouvinte; o «Cancelar» recolhe o formulário, apaga a memória
e limpa o modo de edição. Sem o `keydown`, **3 de 193** reprovam.

### As acções de uma lista — a barra da secção, e a coluna do painel da raiz *(19/11/2026)*

> «E aqui você inventou uma regra própria também de listagem que ficou no topo da página, no topo
> das tabelas. E a gente tem uma regra própria que já existe e você não está seguindo ela.»

**E eu li a frase dela ao contrário, no mesmo dia.** Concluí que o `.rail rail-esq` do painel da raiz
era «uma regra inventada» e troquei-o por uma `.acoes-da-lista` no topo. Ela viu e devolveu:

> «Por que é que você tirou os botões do lado esquerdo fixo onde estavam. Eu não pedi para fazer isso.
> Você precisa fazer apenas o que eu te peço. Tem que rever isso e botar de volta no mesmo lugar:
> fixos empilhados do lado esquerdo.»

**São duas peças, e cada uma tem o seu sítio.** A `.acoes-da-lista` é para as acções **de uma lista
dentro de uma secção** (o «Ações» da Área do Professor, o «Seções» da Produção, o «Abas» da Audição).
O **painel da raiz** (`danca.padd.com.br`) é outra coisa: ali as acções são a **coluna presa e
empilhada à esquerda** — o `.rail rail-esq` com `position: sticky` e `flex-direction: column`, na
grade de três colunas (13rem de acções, a prosa, 15rem de índice). Não se troca uma pela outra: o que
mudou de sítio não foi uma regra, foi a vontade dela.

**A regra da `.acoes-da-lista`** (o «Ações» da Área do Professor, o «Seções» da Produção, o «Abas»
da Audição): a **pílula** no telemóvel, que sobe a folha com os mesmos destinos, e os **blocos à
vista** no computador — a pílula não aparece lá, por desenho. A marcação, uma vez:

```
<div class="acoes-da-lista" id="acoes">
  <button class="acoes-do-menu pilula-do-menu" data-folha="acoes" aria-expanded="false"
    aria-controls="acoes-menu">Ações<span class="seta-do-ato" aria-hidden="true">▾</span></button>
  <div class="veu-do-menu" id="acoes-veu" hidden></div>
  <div class="menu-de-acoes folha-do-menu" id="acoes-menu" hidden>
    <span class="folha-puxador" aria-hidden="true"></span>
    <ul class="menu-de-acoes-lista">… os mesmos destinos …</ul>
  </div>
  <p class="acoes-do-ato">… os destinos à vista, no computador …</p>
</div>
```

**E as tabelas do painel também paginam** — a mesma `.paginas`, com o «por página» na barra. As
escolas, os professores e os contatos crescem com a operação (os contatos guardam os últimos 200
pedidos), e uma tabela que cresce sem rodapé é a lista que deixa de se ler. O script da paginação
passou a vir **no casco** do painel, uma vez por documento: carregá-lo também no corpo registaria os
ouvintes duas vezes, e um clique no «›» adiantaria duas páginas.

## O catálogo das PALETAS — três famílias, três implementadas *(fechado em 18/10/2026)*

> **Não confundir com o «catálogo das peças»**, acima: aquele é o dos **componentes** (o que
> desenha um botão, um selo, uma pílula) e existe; este é o das **paletas** de cor, e está
> **planejado**. Um é o vocabulário da tela, o outro é o tom dela.

**O que foi feito, e o que não foi.** Foram exploradas **visualmente** seis direções de paleta,
cada uma em versão **clara** e **noturna**, a partir de imagens de referência. O estudo é de
**forma**, e chegou até aqui: nomes, carácter e a lista de opções. **Não chegou** a valores —
nenhum hex destas famílias está especificado, nem neste documento nem no `ciclo.css`, e não se
inventa: a tabela `PARES` do validador mede contraste par a par, e um tom escolhido no olho é
exatamente o que ela existe para reprovar. Cada família terá os seus hex **especificados e
medidos individualmente** antes de qualquer implementação.

> **As imagens são estudos, não especificação.** As referências visuais que originaram as seis
> direções **não estão no repositório** e **não são fonte de verdade**. Onde elas mostrarem texto
> ou código pequeno, o que se lê ali é legenda da imagem, não valor a copiar. O que se aproveita
> delas é a **direção** — a temperatura, o contraste, o clima —, e é isso que a tabela regista.

**As famílias.** Três estão na folha; as quatro de baixo foram abandonadas, e ficam nomeadas para
que a decisão seja legível.

| # | Família | Carácter | Estado |
|:--|:--|:--|:--|
| 1 | **Bordô de Cena** | **a identidade vigente.** Teatro clássico: bordô e ouro | **implementada** |
| 2 | **Cortina Turquesa** | turquesa de cortina de palco sobre navy profundo, neutros frios | **implementada** |
| 3 | **Verde de Ensaio** | verde sálvia, neutros quentes, referências naturais | **implementada** |
| — | Azul de Gala | azul profundo e ouro, de carácter teatral | **abandonada** |
| — | Prata de Palco | bege, prata e grafite — clássico e discreto | **abandonada** |
| — | Azul de Bastidores | azul administrativo, claro e funcional | **abandonada** |
| — | Luz de Camarim | minimalista, neutra e luminosa, com acentos azuis discretos | **abandonada** |

> **O catálogo FECHOU em três (18/10/2026), por decisão de produto.** As quatro de baixo chegaram
> a ser **medidas** — 31 pares cada, nas duas variantes, todas a passar — e foram abandonadas: um
> catálogo de sete não se escolhe, e três cobrem o que o produto precisa de dizer (a casa, uma
> alternativa fria, uma alternativa quente). Os valores delas ficam no histórico do Git; voltar
> com uma é **refazer a medição**, não descomentar um bloco. A tabela fica com as quatro para que
> a decisão seja legível — uma família que desaparece sem deixar rastro é uma família que alguém
> vai propor outra vez.

> **Estado em 18/10/2026: as três famílias têm hex medidos e estão na folha** — a **Bordô de
> Cena** (a vigente), a **Cortina Turquesa** e a **Verde de Ensaio**. O seletor da escola
> oferece **exatamente estas três**, e essa lista vem do servidor (`PALETAS`, em
> `motor/servidor/bastidores.js`), não deste documento — oferecer uma família sem desenho daria
> uma escola pintada de nada.
>
> **E a folha e o validador não podem divergir.** A checagem **«Famílias»** conta as famílias
> que o `ciclo.css` declara (`[data-paleta="…"]`) e compara-as com os temas que `TEMAS` mede;
> uma família a mais na folha — isto é, **sem medição** — reprova. Era a guarda que faltava:
> até 18/10/2026 a lista era escrita à mão dos dois lados e as duas podiam divergir em silêncio.

**Cada família tem duas variantes — clara e noturna.** E a noturna **não é** a clara invertida:
ela é concebida **para aquela família**, porque inverter não preserva o que a família tem de
próprio.

**A lista que o seletor oferece — três famílias, dois modos.** O seletor tem **dois eixos**
(«Família de cores» e «Variante»), e não seis opções numa lista só: quem escolhe escolhe uma
família e depois um modo, e o produto cartesiano é do servidor.

- **Bordô de Cena** — clara · noturna
- **Cortina Turquesa** — clara · noturna
- **Verde de Ensaio** — clara · noturna

**Seis temas medidos — 31 pares cada, 186 no total.** É o número que o validador imprime, e é
ele que tem de bater com a folha (a checagem «Famílias»).

**A identidade vigente é a de Bordô de Cena, e ela continua a valer.** Bordô de Cena **não é** a
primeira de três candidatas: é a paleta que está no ar, e é o **padrão** de quem nunca escolheu
nada. O `:root` da folha é ela.

> **E o PDF fica declaradamente na vigente** *(decisão de produto, 18/10/2026)*. `tools/lib-tokens.js`
> lê só o `:root`, e é isso que o gerador injeta no LaTeX: uma escola em Cortina Turquesa ou Verde
> de Ensaio tem o **site** na família dela e o **PDF** na Bordô. Não é esquecimento — é decisão: o
> documento impresso é **da casa, não do tema**, e um PDF que muda de cor conforme a preferência de
> quem o gerou torna dois cadernos da mesma escola incomparáveis no papel. Quem quiser o PDF na
> família da escola tem de mudar o gerador (receber a paleta por parâmetro) **e** esta decisão.

> **O que a vigente NÃO muda.** Os tokens, os pares medidos, o piso de contraste e
> `tools/templates/ciclo.css` como fonte única. As famílias novas são **acréscimo**, não
> substituição: a Bordô continua a ser o `:root`, e uma família é uma camada por cima dele.

### O que uma paleta tem de declarar para existir *(18/10/2026)*

**Quatro cores não fazem uma paleta.** Uma paleta de identidade não pinta com os quatro tons
que se vê numa imagem: ela preenche **papéis**, e são trinta e poucos. O sistema não pergunta
«qual é a cor do botão?» — pergunta «qual é o `--marca-fundo`?», «e o texto que fica **sobre**
ele?», «e o filete do campo, que tem de alcançar 3:1 sobre três fundos diferentes?». Uma
imagem com quatro amostras responde à primeira pergunta e deixa as outras vinte e nove em
branco.

O que uma família precisa de trazer, e é o **formulário** que eu preciso receber:

| # | O papel | O que ele governa | Observação |
| :-- | :-- | :-- | :-- |
| 1 | **marca** | a cor de assinatura (a barra, o botão principal) | a âncora da família |
| 2 | **marca-texto** | o tom da marca que **serve de texto** sobre o papel | raramente é a marca: a marca pura costuma não passar 4,5:1 |
| 3 | **marca-fundo** / **sobre-marca** | o fundo de marca e o texto que fica **sobre** ele | **o par que mais falha** (ver a medição abaixo) |
| 4 | **texto** / **texto-suave** | o texto corrido e o secundário | sobre **dois** fundos: papel e superfície |
| 5 | **fundo** / **fundo-suave** / **superfície** | o papel, a faixa e o cartão | três degraus, não um |
| 6 | **borda** / **borda-campo** / **borda-forte** | o filete do cartão, o do campo, o forte | o do campo tem piso **3:1** sobre papel **e** cartão |
| 7 | **ornamento** (1 a 3) | o traço decorativo e o de destaque | o ouro é ornamento; num catálogo novo, é o que fizer esse papel |
| 8 | **ok / alerta / falha** (+ os fundos) | o estado do registro | os quatro tons semânticos **não mudam** com a paleta: eles informam |

**O melhor formato é o texto que me foi enviado**, e não a imagem — por um motivo prático: a
imagem não se mede. Com o texto eu calculo o contraste de cada par **antes** de escrever uma
linha de CSS, e devolvo o que falha com o número.

> **Medido nas duas âncoras que recebi (Cortina Turquesa), antes de escrever uma linha de CSS.**
> O turquesa `#00B8C7` dá **7,33:1** com o texto escuro `#111827` — passa com folga — e apenas
> **2,42:1** com **branco**. Ou seja: a barra desta família **não pode** ter texto branco, ao
> contrário da barra bordô atual, que usa creme. O `--sobre-marca` dela é o `#111827`.
>
> E na variante escura o par que falha é outro: o «apoio escuro» `#486273` sobre o fundo
> `#06121A` dá **2,95:1** — fica **abaixo** do piso de 3,0:1 para um traço com função, e como
> `--borda-campo` ele não serviria. Subir um degrau (ou usar o «prata» da clara) resolve, e a
> decisão é essa — medida, não olhada.
>
> Isto não é rigor a mais: é o que impede a família de chegar ao `ciclo.css` e **cair** no
> validador horas depois. E é a razão pela qual **quatro amostras não bastam** — os dois pares
> que falharam aqui não estão na imagem de referência, porque uma imagem mostra as cores lado a
> lado e não mostra a **relação** entre elas.

### A Cortina Turquesa, especificada e medida *(18/10/2026)*

**A primeira família depois da vigente, e o formulário acima preenchido.** As âncoras vieram de
uma imagem de referência e foram **amostradas pixel a pixel**: o turquesa medido dá `#00afc3`, e o
texto de referência dizia `#00b8c7` — dois caminhos independentes, o mesmo tom. O papel é
`#f5fafa` e a tinta `#0d1b24`.

**O que a medição decidiu, e que a imagem não dizia:**

| Decisão | Por quê |
| :-- | :-- |
| `--marca-fundo` = o turquesa cheio, com `--sobre-marca` **escuro** `#06202b` | branco sobre turquesa dá **2,42:1**; não há tom claro que passe |
| `--marca` (título) = `#00708c` | o turquesa cheio como texto dá **2,52:1**; este dá **5,39:1** |
| `--borda-campo` = `#78929d`, um **neutro** | o filete não é o acento: um campo com filete turquesa pareceria em foco permanente |
| os neutros ficam **frios** (`#f5fafa`, `#e3eff1`) | a família troca o clima, não só a cor — sete primitivos e os papéis que derivam deles |
| `--ornamento-forte` = `#04414d`, **escuro** | a barra é clara: o filete tem de ser escuro para dar 3:1 (4,24:1) |

**As duas variantes, papéis principais:**

| Papel | Clara | Noturna |
| :-- | :-- | :-- |
| `--fundo` | `#f5fafa` | `#0a1923` |
| `--superficie` | `#ffffff` | `#0f2332` |
| `--texto` | `#0d1b24` | `#e4eff2` |
| `--texto-suave` | `#4c5f6a` | `#a3bcc4` |
| `--marca` | `#00708c` | `#00afc3` |
| `--marca-texto` | `#00677f` | `#63dbe8` |
| `--marca-fundo` | `#00afc3` | `#00afc3` |
| `--sobre-marca` | `#06202b` | `#06202b` |
| `--borda` | `#78929d` | `#547382` |
| `--borda-campo` | `#78929d` | `#5a7a87` |
| `--foco` | `#00708c` | `#63dbe8` |

**`--sobre-marca` é o mesmo nos dois modos, e isso é o achado.** Nas duas variantes a barra é
turquesa e o texto sobre ela é escuro. Na Bordô, a barra é escura e o texto claro — a diferença
não é de gosto, é de **luminância do acento**. Uma família cujo acento é claro **não pode**
herdar o par de outra; e é por isso que a segunda família não se fez mudando um token.

**Provado.** `node tools/check-identidade.js` mede os pares de cada tema, e o `provar-aparencia.js`
mede o comportamento: a família e o modo são **eixos independentes**, gravam-se separados, e a
página declara de que família é.

### A Verde de Ensaio, especificada e medida *(18/10/2026)*

**A terceira e última família.** As âncoras vieram em texto — fundo `#f4f0e7`, texto `#303631`,
sálvia `#879783`, madeira `#9a856c`, e o fundo noturno `#2b2b27` com texto `#e8e5d9`.

**Quatro das cinco âncoras entraram intactas**, no papel que lhes cabe: o fundo, o texto, a sálvia
(no **preenchimento** — a barra e a ação) e a madeira (no **filete**, onde dá 3,11:1 contra o piso
de 3,0). Todo o resto é derivado e medido.

**O que a medição decidiu:**

| Decisão | Por quê |
| :-- | :-- |
| a sálvia **não** é `--marca`/`--marca-texto` | como texto dá **2,72:1** sobre o papel e **2,92:1** sobre a superfície (piso 4,5:1) |
| `--marca-fundo` = a sálvia, com texto **escuro** `#171c18` | o par da barra é o que mais falha: escuro sobre sálvia dá **5,19:1** |
| `--marca` = `#4f6650` | 5,51:1; e coincide quase exatamente com o `#507048` **amostrado da logo da mesma cor** — dois caminhos, o mesmo tom |
| `--acao-fundo` = a sálvia, com texto escuro | um botão cheio de sálvia com branco dá **3,10:1**; com escuro, 5,19:1 |
| os neutros ficam **quentes** (`#f4f0e7`, `#e6e0d2`) | é o que distingue a família da Cortina, que é fria |
| noturno com `--borda` mais claro que o do claro | sobre `#2b2b27` o filete do claro dá 2,87:1 e o campo desaparece |

**As duas variantes, papéis principais:**

| Papel | Clara | Noturna |
| :-- | :-- | :-- |
| `--fundo` | `#f4f0e7` | `#2b2b27` |
| `--superficie` | `#fbf8f2` | `#31312d` |
| `--texto` | `#303631` | `#e8e5d9` |
| `--texto-suave` | `#4d544e` | `#b9b6a9` |
| `--marca` | `#4f6650` | `#a9bb9f` |
| `--marca-fundo` | `#879783` | `#879783` |
| `--sobre-marca` | `#171c18` | `#1c231d` |
| `--borda` | `#9a856c` | `#797a71` |
| `--foco` | `#4f6650` | `#bfcdb5` |

**A terceira família fecha o catálogo, e é ela que obrigou a guarda.** Com três famílias, `TEMAS`
passou a ser uma lista de seis temas — e uma lista escrita à mão que ninguém confere contra a
folha é uma lista que diverge em silêncio. A checagem **«Famílias»** nasceu aqui: ela conta as
famílias que o `ciclo.css` declara e compara-as com as que `TEMAS` mede. Reprova nos dois sentidos.

## A aparência — o que existe hoje *(revisto em 18/10/2026)*

**O que existe.** A **variante noturna** da identidade vigente, com os papéis medidos nos dois
temas, **escolhida pela escola e aplicada pelo servidor**: o `<html>` de toda página que a escola
serve sai com `data-modo` e `data-modo-fonte="escola"`, e o controlo vive na secção **Aparência**
da Produção. O botão `◐` existe **só na raiz**. Isto é **forma implementada**, não o catálogo:
**não** há as doze paletas e **não** há painel de identidade.

**Como a escolha chega a todas as páginas.** Não chega por um script que corre depois de a página
pintar — isso mostraria a pele errada e a troca à frente dos olhos. Chega **antes**, no HTML:

| Superfície | Quem põe o atributo |
| --- | --- |
| as vistas dos Bastidores (Estúdio, Produção) | `cabecalhoDaVista`, ao gerar o HTML |
| o pacote do ciclo (índice, aulas, guia) e a porta (anamnese, plano de ensino, PO) | a ponte de produção (`comAparencia`), sobre a resposta do `ASSETS` |

**O anti-flash continua a existir, e mudou de razão.** Ele era o mecanismo (`localStorage` lido
antes de pintar); passou a ser a **rede** de quem abre um `.html` direto do disco, sem servidor —
aí não há Worker a pôr o atributo, e a memória do navegador é a única informação que existe. A
guarda `!hasAttribute('data-modo-fonte')` é o que impede que essa rede desfaça, nas páginas
**servidas**, a decisão da escola.

**O que fica declaradamente fora.** O catálogo **fechou em três** (18/10/2026): as quatro
famílias restantes foram abandonadas por decisão de produto, depois de medidas. **O PDF fica na
paleta vigente** — `tools/lib-tokens.js` lê só o `:root`, e é decisão, não pendência: o documento
impresso é da casa, não do tema. E o item de menu **Identidade visual** não existe: o controlo
vive na secção **Aparência** da Produção, e é lá que fica enquanto for configuração da escola e
não frente própria.

> **A C15, e a resposta (18/10/2026).** Ela perguntava **de quem é a preferência de aparência** —
> da **escola**, do **usuário** ou do **navegador** —, e estava aberta porque a medição mostrou
> que **não havia usuário** onde pendurá-la: a senha da Produção é uma por escola, e depois do
> portão a página guarda **a senha, não quem entrou**. O sistema autentica **um segredo**, não
> **uma pessoa** — a mesma lacuna que a C11 (não há lado público na porta) e a C13 (não há escola
> na raiz).
>
> **Decidido pelo dono do produto: a preferência é DA ESCOLA.** Três consequências, e valem para
> quem implementar:
>
> | Consequência | O que muda |
> | --- | --- |
> | **mecanismo** | **servidor** — uma escolha que vale para todos não pode viver no navegador de cada um |
> | **onde o valor mora** | no **dado da escola**, sob o `ESCOLA_SLUG` que a instalação já tem |
> | **quem muda** | **a escola e o professor principal** — o portão da Produção é `senhaDaDirecaoOk`, que aceita `SENHA_ADMIN` *ou* `SENHA_PROFESSOR` e **mais nenhuma**; os demais professores não entram na Produção (abrem o Estúdio, a Área do Professor e o lançamento) |
>
> **Correção de 18/10/2026, e ela importa.** A linha «quem muda» dizia `senhaDaEscolaOk` — *a de
> qualquer professor*. Estava errada para este portão: `senhaDaEscolaOk` é a política **larga**, e
> serve a outra coisa (abrir o **dado cifrado do ciclo**, onde qualquer professor da casa entra
> porque o dado é da escola). O portão da Produção é o **estreito**. Confundi-las dava a entender
> que o seletor de cores estava aberto a toda a gente — e é o contrário que o torna seguro.
>
> **O que a decisão não resolve.** Os **hex das doze combinações continuam não especificados** —
> foi uma decisão sobre *quem escolhe*, não sobre *quais são* —, e o ***quando*** (na contratação
> ou no primeiro uso) decide **onde o valor mora**: continua aberto, e é de produto.

## O que é campo e o que é inscrição *(18/10/2026)*

Um sistema de identidade não decide só **como** as coisas parecem: decide **o que cada peça é**.
A distinção que faltava é esta, e ela veio de um campo que mentia.

**Campo** é o que a pessoa preenche — e o que ela preenche é o que o sistema grava. Tem altura de
controle, fundo de controle, filete de controle, cursor de texto, e é o que o botão ao lado lê.

**Inscrição** é o que o sistema **declara**: o dado que não se digita porque não é escolha de
ninguém. Não tem caixa, não tem cursor, não tem altura de campo — tem voz de título. Não é um
`input` desabilitado (que anuncia um controle desligado); é **texto**.

**O caso concreto: a escola.** O cabeçalho do ato (anamnese, plano de ensino, plano de
observação) abria a escola num `<input type=text>`. Isso era um campo que mentia duas vezes:

1. **não governava nada** — o Worker de cada escola resolve o slug por `ESCOLA_SLUG` e **ignora**
   o `?escola=` da URL quando a var existe (`escolaDe`, no motor);
2. **podia divergir do dado gravado** — o envelope levava o que estava no campo. Escrever
   `outra-escola` produzia uma tela que concordava e um dado que ia para a chave da escola de
   verdade.

A regra, agora medida em `experimentos/provar-escola-fixa.js` nas três fontes:

| Peça | Natureza | Por quê |
|---|---|---|
| **escola** | inscrição | é a do Worker que serve a página; não há outra para escolher |
| professor · ciclo | campo | o professor corrige o que veio da URL |
| aluna (anamnese) · turma (plano) | campo | é a decisão do ato |
| senha do professor | campo | autoriza a escrita |

O valor da inscrição **vem do servidor** (a mesma resposta que traz a lista de professores) e é
**reafirmado** em qualquer caminho que escreva no campo oculto — a URL, um envelope antigo. Quem
lê a escola no código continua lendo o `<input type="hidden">`: a chave do depósito local, o
envelope e os atalhos não mudaram. Mudou **quem o preenche**, e é isso que impede a tela de
mentir.

**O nome tem de estar NO DOCUMENTO — e ser o verdadeiro.** A inscrição não é enfeite de tela: o
`contexto.escola` gravado no envelope é o campo que a proveniência vai ler para cruzar resultados
entre escolas, e o diretório não serve de prova — o mesmo professor dá aula em mais de uma escola,
e `professores/<slug>/…` é do SISTEMA, não da escola. Por isso o nome **fica** no JSON, e o que a
tela mostra é o que está lá dentro.

E aí a investigação de 18/10/2026 achou o outro lado do problema: o nome estava no JSON, mas vinha
do **cliente**. Três consequências, todas medidas em `experimentos/provar-escola-do-documento.js`:

| O que dependia do `contexto.escola` do cliente | O que acontecia com `escola=outra` |
|---|---|
| o `contexto.escola` **gravado** no envelope | o documento declarava `outra` sob a chave da escola de verdade |
| a **chave do cofre** (`<escola>/<prof>/<ciclo>/anamnese/<carimbo>`) | gravava dentro do prefixo de outra escola, no KV compartilhado |
| o **caminho da fonte** no repositório (`ciclo-01-<escola>-po.md`) | o arquivo caía no pacote de outra escola |

A correção não remove o campo: ela o **subordina ao Worker**. `ESCOLA_SLUG` é a autoridade (a mesma
que `escolaDe` já usava) e é aplicada ao contexto em todas as rotas de escrita, e nas leituras do
cofre e do lançamento. Sem a var — o servidor Node de desenvolvimento, que não é escola — nada
muda, e o `?escola=` continua valendo: o mesmo critério, na ordem inversa.

> **A regra geral, para o que vier.** Antes de desenhar um controle, perguntar: *isto é escolha de
> alguém?* Se não for, é inscrição. Um `input` para um dado que o sistema decide é sempre a mesma
> armadilha — o usuário acha que decide, o sistema decide outra coisa, e ninguém fica sabendo.
> E a segunda pergunta, para o que é gravado: *quem é a autoridade sobre este valor?* Se for o
> servidor, o cliente não o envia — ou envia, e o servidor o sobrescreve.

**Prova.** `node experimentos/provar-escola-fixa.js` — 30 verificações em navegador, nas três
fontes: o servidor vence a URL, não há controle editável, a inscrição não tem filete nem cursor de
texto, digitar sobre ela não muda nada, o valor da tela é o do envelope, e no modo local (sem
`ESCOLA_SLUG`) o `?escola=` da URL volta a valer. O controle negativo roda contra
`git show HEAD:porta/index.html` e **reprova as 30**.

## O arranjo do cabeçalho é o MESMO nos três documentos *(18/10/2026)*

O cartão de identidade (H2) é a mesma peça na anamnese, no plano de ensino e no plano de
observação: a escola numa coluna à esquerda, o resto do contexto à direita, os controles
empilhados sob o rótulo. **O que muda de um documento para o outro é o CONTEÚDO das colunas,
nunca o arranjo.**

| Documento | Colunas | A turma |
|---|---|---|
| anamnese | professor · ciclo · aluna · senha | não existe |
| plano de ensino | professor · ciclo · turma · senha | **campo** (select) — é escolha do professor |
| plano de observação | professor · ciclo · turma | **inscrição** — vem do plano referenciado |

**O defeito que isto corrige, e a sua lição.** Os três usam o mesmo HTML e o mesmo CSS, e
mesmo assim apareciam diferentes: uma única declaração — `.ctx-turma { flex: 1 1 100% }` —
forçava a turma a ocupar a linha inteira, e só os dois documentos que TÊM turma quebravam a
linha. O CSS fazia o que lhe mandaram; ninguém tinha dito que os três deviam ficar iguais.

É a mesma classe de erro do `--gold-borda` em dois fundos e do corte 760 × 768 — **um valor,
dois lugares, e a diferença só aparece quando alguém olha os dois lado a lado**. Por isso a
regra ganhou prova: `experimentos/provar-cabecalho-do-ato.js` mede o *arranjo* nos três
documentos, em 1280 e em 390px, e reprova se um deles divergir.

**A largura também é a da página.** O cartão não tem medida própria: ele vive na mesma caixa
que `header.doc` e `main` (900px abaixo de 1200, 1180px a partir daí, menos 24px de padding
de cada lado). Antes ele era mais largo que todo o texto abaixo — 48px, o suficiente para o
dono do produto ler como «soa muito estranho».

**E o texto que não é do ofício saiu.** O cabeçalho tinha frases que explicavam a ferramenta a
quem já a estava a usar — «escolha o plano de ensino no corpo do formulário», «vem do plano de
ensino referenciado — aqui é leitura». São instruções sobre a interface, não sobre o trabalho;
o valor vazio já se anuncia com «—». A prova carrega a lista dessas frases e falha se alguma
voltar.

## O que recolhe no celular — a dobra do índice *(18/10/2026)*

O bloco «Nesta página» é uma **coluna congelada à direita** a partir de 1200px, e abaixo disso
é um bloco no **topo** do texto. Num telefone, o índice de um documento tem 15, 20, 30 linhas
— e isso é rolagem antes de se chegar ao conteúdo, que é o que a pessoa veio ler.

A **dobra** resolve: o bloco encolhe até o título e devolve a lista a quem a quiser.

| O que | Como |
| --- | --- |
| **Onde existe** | só abaixo de 1200px — o **mesmo corte do layout**, e não o tamanho do aparelho: um portátil de 1000px tem o bloco no topo e o mesmo problema |
| **O que faz** | recolhe a lista; o título fica. O bloco recolhido tem **66px** e o aberto **562px** num documento real (medido) |
| **Onde mora o controle** | **abaixo** do título, uma fileira de largura inteira com um glifo — não ao lado, nem à direita |
| **O estado** | `data-recolhido` no bloco, `aria-expanded` e `aria-label` no botão, e a escolha lembrada **na sessão** (`sessionStorage`) |
| **Em tela larga** | **não há botão** e o índice **nunca** se fecha: ali a coluna **é** a navegação. A memória da sessão é ignorada de propósito |
| **Sem JavaScript** | **não há botão nenhum** — nada morto na tela — e o índice fica inteiro, como sempre esteve |
| **No papel** | o índice sai **inteiro** e o botão não se imprime: papel não tem estado |

**O botão nasce no `assets/nav.js`, e não no HTML.** O documento do pacote é **gerado**
(pandoc + `ciclo.html`), e um documento já gerado — ou um pacote que não se pode regerar
porque o plano ainda não foi elicitado — ficaria sem o controle até a geração seguinte.
Criado no script, ele vale para **todo** documento que carregue `assets/nav.js`, inclusive os
que já estão no ar. É a única exceção declarada à regra «o markup é do template», e o motivo
é operacional, não estético.

**O rótulo não é uma palavra escrita à mão.** Sai da `aria-label` do próprio bloco: «Mostrar
o índice desta página» no documento, «Mostrar o roteiro da elicitação» na porta. Um bloco novo
com outra `aria-label` ganha o rótulo certo sem ninguém tocar no script.

**E o controle não tem caixa.** Ele é o **pegador** do bloco, não um botão de formulário: sem
moldura, sem fundo. É a terceira exceção declarada de `provar-celular` (com o `.hamburger` e o
`.modal-x`) — a regra «todo botão tem os quatro lados» existe para o controle que **deve** ter
caixa e perde um lado; ela não obriga a desenhar caixa em quem nunca teve.

**Prova.** `node experimentos/provar-dobra-do-indice.js` — 16 verificações em navegador:
nasce recolhido, o ganho é medido, o toque expande e recolhe, o estado é lembrado ao recarregar
e na página seguinte, o corte é 1199 × 1200, a memória é ignorada em tela larga, sem JS não há
botão, no papel o índice sai inteiro, e nenhuma largura estoura.

## Em telemóvel, a página não passa da tela *(21/10/2026)*

**Um `position: fixed` num telemóvel é medido pela largura do LAYOUT, não pela do ecrã.** Quando o
conteúdo é mais largo do que a tela, a barra de navegação fica mais larga do que a tela também: o ☰
sai do ecrã à direita, e deixa de ser clicável — o `elementFromPoint` no centro dele devolve outra
coisa. O mesmo acontece ao `position: sticky` do título, que passa a ter uma caixa mais larga do que
o que se vê. **Um defeito de conteúdo, três sintomas.**

Foi o que se viu no `plano.html` (a tabela da rubrica, cinco colunas) e na folha de captura (dois
trechos de `code` compridos):

| Página | O que estourava | Excesso |
| --- | --- | --- |
| `plano.html` | tabela de 5 colunas com uma célula «[Preencher: o critério de cada aula — …]» | **97px** |
| `captura-aula-01.html` | dois `<code>` de 496px e 488px, que não quebram linha | **130px** |

| Regra | Como |
| --- | --- |
| **A tabela rola dentro de si** | abaixo de 899px — o mesmo corte do layout — `table { display: block; overflow-x: auto }`. O algoritmo de tabela continua a valer para linhas e células, que formam uma tabela anónima lá dentro; no desktop nada muda (`display: table`, medido) |
| **O código comprido quebra** | `code, kbd, samp { overflow-wrap: anywhere }`. Código parte-se; tabela não — partir uma célula ao meio esconderia a coluna |
| **O que se mede** | não o CSS: as **8 páginas** do pacote em 320, 360 e 390px, com zero de excesso horizontal, e o ☰ inteiro no ecrã **e a receber o clique**. Contra o commit anterior ao conserto, o plano estoura 97px |

**Prova.** `node experimentos/provar-iphone.js` — 18 asserções.

## O `resize` do iOS não mexe no layout *(21/10/2026)*

Enquanto a página rola, o Safari do iPhone recolhe e volta a mostrar as barras do sistema — e emite
`resize` **a cada quadro** dessa animação. Os dois `resize` faziam trabalho de layout:
`ajustarAlturaNavbar` escrevia `--header-height`, que é o `padding-top` do `body`, e o bloco do
título media o cabeçalho. Medido: **60 eventos com a mesma largura davam 60 leituras de layout e 120
escritas em `:root`** — o conteúdo andava por baixo do dedo. No Android o `resize` não dispara a
rolar, e no desktop a janela não muda de tamanho sozinha: por isso só o iPhone o mostrava.

| Regra | Como |
| --- | --- |
| **Só por largura** | a altura que muda sozinha é a barra do sistema, e não muda nem o título nem a barra da página. O `resize` só age quando `innerWidth` muda |
| **Não se escreve o que já lá está** | `--header-height`, `--titulo-preso`, `--barra-altura` e `data-titulo-encolhido` só se escrevem quando o valor muda. Escrever em `:root` invalida o estilo do documento inteiro |

**Depois:** 60 `resize` com a mesma largura → **0 leituras, 0 escritas**; uma mudança de largura real
→ 1 escrita (o portão não é um «nunca»); 100 quadros de rolagem → 1 leitura de layout.

**O que NÃO se fez, e porquê.** A primeira versão desta correção tratou os dois sintomas como dois
problemas e pôs `max-height`/`overflow` no painel do menu e 44px no hamburger. Medido depois, **nada
disso consertava o defeito**: o painel não era o problema — a página é que era mais larga que o ecrã.
Foi tudo revertido. Fica registado porque a lição é essa: *um sintoma relatado não é um diagnóstico*,
e a medição que se faz primeiro é a que compara os estados, não a que decora a hipótese.

## Na Produção, o bloco da página na barra sobrevive ao desenho *(21/10/2026)*

A página da Produção não tem só a lista de links: entre a marca e o ☰ traz o `s5-sessao` (o caminho
«Pedagogia · Turmas») e o `s5-secoes` (o botão que abre a folha), que o `bastidores.js` entrega ao
construtor da barra como `extras`. Eles **não estão no `nav.json`** — são o estado da página, não a
lista.

Quando a barra passou a ser **desenhada ao servir**, o desenho passou a ser um só e apagou o que não
conhecia: a Produção deixou de ter as duas peças, e rolar deixou de levar o caminho para a barra —
porque as peças que o `data-descido` acende já não existiam no HTML.

O `aplicar` passou a **ler o bloco do próprio `<nav>`** — o que está entre a marca e o ☰ — antes de o
substituir, e a repô-lo no mesmo lugar. O lugar é uma propriedade da **forma**, e não uma lista de
nomes: a ponte serve quatro origens, e ensinar-lhe o caminho até cada construtor de barra repetiria
o problema que a barra desenhada ao servir veio resolver.

**Prova.** [`experimentos/provar-barra-unica.js`](experimentos/provar-barra-unica.js), secção D2 — 71 asserções desde 23/10/2026 (eram 58 na forma antiga do menu; o ficheiro só entrou no repositório nesse dia — ver `REGISTRO.md`).

## Todo documento tem um `<h1>`, e um só *(21/10/2026)*

A página de harmonização saiu no ar com o cabeçalho **vazio** e o título dentro do corpo. O
sintoma que se viu foi «o título está mais abaixo do que na anamnese»; a causa não era de CSS:
a fonte escrevia `title:` e `subtitle:` **sem os `---`** que abrem o front-matter.

| O que | Como |
| --- | --- |
| **O `<h1>` da página** | vem do `title:` do front-matter, pelo `$title$` do template. Um `title:`, dois destinos: o `<h1>` e o rótulo do menu |
| **O corpo não escreve `# `** | o primeiro nível do corpo é `##`. Um `# ` no corpo é um **segundo** título de topo, e é o que põe o de verdade abaixo da ficha |
| **O que se mede** | `115px` de cabeçalho e o `<h1>` a **72px** em todos os documentos do pacote (1280px). Antes da correção a harmonização tinha cabeçalho de **41px**, `<h1>` **vazio** e o título a **172px** |
| **A única dispensada** | a página **cifrada** (acompanhamento com dados sensíveis): o arquivo dela é ciphertext, e «não tem `<h1>`» seria verdade sem ser defeito |

**A checagem existia e não viu — por um `if` de guarda.** O `check-pacote.js` compara o `<h1>` de
cada página com o texto do PDF, e a comparação era `h1 && !texto.includes(h1)`: para um título
**ausente**, a primeira metade é falsa e a página simplesmente não entra na lista. Um título que não
existe era, para ela, um título que não falta. A secção 2c acrescentada é independente disso e não
depende de comparar com nada: toda página publicada tem de ter `<h1>` com texto, e a fonte crua do
front-matter não pode aparecer no corpo.

**Prova.** `node experimentos/provar-cabecalho-do-documento.js` — 21 verificações: os **seis**
derivados, as **seis** fontes publicadas do ciclo, as **nove** páginas do pacote, e três controlos
negativos (a fonte antiga reprovada, o `# ` no corpo reprovado, a forma corrigida aprovada). Contra
o pacote anterior, o `check-pacote.js` acusa **2 erros**, ambos nomeando `harmonizacao.html`.

## O título que fica *(21/10/2026)*

A página da aula tem 15 ecrãs, e o título — que diz de que documento se trata — saía da tela na
primeira rolagem. A **opção B** das quatro medidas em
`experimentos/propostas/proposta-titulo.html` foi a escolhida: o cabeçalho **prende-se** ao topo e
**encolhe**. Ele continua a dizer o que é, e devolve a altura à leitura.

| O que | Como |
| --- | --- |
| **Onde mora** | `header.doc` no documento; `.titulo-fixo` no `lancamento.html`, que não é documento pandoc. Um mecanismo, uma marca |
| **O que faz** | o subtítulo e a ficha saem; o `h1` desce de 31px para 17px. **146px → 25px** no desktop; **46px** no celular (5,4% da tela de 844), onde o título quebra em duas linhas |
| **A altura é MEDIDA** | `--titulo-preso`, publicada pelo `assets/nav.js`, com a medição feita **sem transição**: medir com a animação a correr dava 43px onde o estado final mede 25px |
| **Onde ela é usada** | `scroll-padding-top` e o `top` da coluna do índice — o alvo de «Nesta página» e o bloco «Nesta página» param **abaixo** do título, e não debaixo dele |
| **Sem JavaScript** | **nada fica preso.** O estado é de rolagem, e sem script ninguém o sabe: a página é a de antes, em vez de ficar presa e nunca encolher |
| **Na folha de captura** | **não entra.** É folha de marcação, de usar em aula e imprimir; a exclusão é pela rota (`/captura-aula-NN.html`), não por uma lista de nomes de documento |
| **No papel** | o cabeçalho sai **inteiro**, no lugar: papel não tem estado de rolagem. As duas declarações repõem o que a fonte já dizia, porque `display` não tem como «voltar ao que era» (o `.ficha` é flex) |
| **A página pode recusar** | `data-titulo-fixo="nao"` no `<html>`. Quem usa: as bancadas de `experimentos/propostas/`, que comparam cinco desfechos do mesmo mecanismo e trazem o seu |

**A marca é uma classe, e não o `header.doc`.** O `lancamento.html` é a tela mais longa do site
depois da aula e pede o mesmo comportamento, mas não tem `header.doc` — tem um `<h1>` solto e uma
folha própria. `nav.js` põe a classe onde ela falta; o template a declara onde ela existe.

**Prova.** `node experimentos/provar-titulo-e-barra.js` — 27 verificações em navegador, em 1280 e
390: nasce destravado, prende-se ao rolar, encolhe, a altura reservada é a medida, a âncora chega
inteira, sem JS nada fica preso, a folha de captura fica de fora, no papel sai inteiro, e não há
estouro horizontal. Contra o `HEAD` anterior, **13 falham** — as seis do título e as da barra.

## O cabeçalho respira — e o respiro é padding *(06/11/2026)*

A dona do produto abriu o **plano para a Aula 01** e disse duas frases: «os botões estão colados
na margem superior» e «o botão Abrir notação está completamente colado na linha». Não era
impressão. Medido no documento real, com a folha daquele dia:

| Onde | Antes | Depois |
| --- | --- | --- |
| do fundo da barra ao topo do `h1`, preso, 1280px | **0,3px** | **12px** |
| do fundo da barra ao topo do `h1`, preso, 390px | **0px** | **12px** |
| do fundo do botão à linha da sombra, preso | **0px** | **12px** |
| do fundo do botão a `<main>` | 8px | 12px |
| altura do cabeçalho preso, 1280px | 63px | 87px |
| altura do cabeçalho preso, 390px | 84px | 108px |
| o mesmo, no plano de ensino e no lançamento, preso | 0,3px e 0,5px | 12px |

**A causa não é visual — é de caixa.** O ar que existia era um `margin-top: 8px` no `header.doc`.
Uma margem fica **fora** da caixa, e o `position: sticky` com `top: var(--header-height)` põe a
**caixa** encostada à barra e **descarta a margem**. Ou seja: o ar valia com a página no topo e
desaparecia exactamente no estado em que o professor passa a maior parte do tempo — a rolar. O
mesmo raciocínio do outro lado: sem `padding-bottom`, o último controle acabava na aresta
inferior da caixa, e é essa aresta que desenha a sombra.

**A regra.** O respiro é `--esp-3` (12px) acima e abaixo, e é **padding**, porque o padding mora
dentro da caixa — que é quem se prende e quem desenha a linha. Vale para os dois lugares que o
mesmo mecanismo prende, numa declaração só:

```css
header.doc, .titulo-fixo { padding-top: var(--esp-3); padding-bottom: var(--esp-3); }
/* …e, DEPOIS das peças do cabeçalho (ver a nota de correção abaixo): */
header.doc > :last-child, .titulo-fixo > :last-child { margin-bottom: 0; }
```

O `> :last-child { margin-bottom: 0 }` existe para o vão de baixo ter **um** responsável: com a
margem do último `<p>` (8px) ainda lá dentro, o ar seriam 20px em uns documentos e 12px noutros,
conforme o último filho fosse um `<p>` ou uma `.ficha`.

> **Nota de correção (06/11/2026, 13h).** Esta regra foi escrita **colada ao `padding`**, e ali não
> funcionava: `header.doc .subtitulo` pesa (0,2,1) e `header.doc > :last-child` pesa o mesmo, de
> modo que ganha a que vem **depois** no arquivo — e a do subtítulo vinha depois. Medido no
> pacote: o vão de baixo saía **20px** nos três documentos que acabam no subtítulo (plano,
> harmonização, folha de captura) e **12px** nos que acabam num botão (aula, notação). A regra
> passou para **depois** de todas as peças do cabeçalho, e o empate resolve-se a favor do vão
> único. É o mesmo género de erro que este documento cataloga: **um valor, dois lugares** — e a
> diferença só apareceu quando as nove páginas foram medidas lado a lado.

**A lição, e é a mesma de sempre.** As nove checagens passavam, e as **27 asserções** da
`experimentos/provar-titulo-e-barra.js` davam todas `ok` com o título a 0,3px da barra. O que a
bancada media era **presença** — «está preso?», «está à vista?», «o alvo chega inteiro?» — e o
defeito era de **distância**. Um título colado à barra está preso, está à vista e o alvo chega
inteiro. Nenhuma das perguntas que se faziam podia vê-lo.

**Onde passa a estar guardado, em dois sítios que se completam:**

| O que | Quem | O que garante |
| --- | --- | --- |
| a **declaração** | checagem **10 «Respiro»** do `tools/check-identidade.js` | roda no `pre-commit` e antes de cada deploy: lê a folha, resolve o token em px e reprova abaixo de 12px — e reprova também o ar posto em `margin-top`, que é o erro que aqui se cometeu |
| a **geometria** | `experimentos/provar-titulo-e-barra.js` (31 asserções) | mede num navegador, em 1280 e em 390, preso e no topo: as duas distâncias têm de ser ≥ 12px. Contra a folha de antes, **4 falham** — as quatro novas |

A escala é a da casa e não se inventa um número: o valor é `--esp-3`, o mesmo `padding` do `.res`
e do `.aviso`. O que muda é o que ele protege — aqui, a distância entre um controle e a linha que
o corta.

## O ar das páginas é o mesmo — e mede-se comparando *(06/11/2026)*

Depois de o respiro do cabeçalho ser corrigido no plano da Aula 01, a pesquisadora pediu a
auditoria:

> «Uma vez que o padrão de espaçamento, margens, respiros e alinhamentos foi corrigido e validado
> no Plano de Aula 1, o mesmo rigor de identidade visual deve se estender e estar perfeitamente
> aplicado aos demais motores de geração e páginas correlatas.»

Medi as **oito páginas de documento** do pacote — plano, aula 01, notação, referências, glossário,
harmonização, índice e folha de captura —, a **1280** e a **390**, com o `assets/style.css`
servido da fonte. Três lugares, três achados.

### 1. O vão depois da faixa tinha TRÊS valores

| Documento | Antes | Depois |
| --- | --- | --- |
| abre por `##` (plano, índice, glossário, referências) | 32px | **32px** |
| abre por citação (harmonização, captura) | 16px | **32px** |
| abre por prosa (aula 01, notação) | 8px | **32px** |

E não eram três decisões: eram **nenhuma**. O vão não estava declarado — era o `margin-top` do
que calhasse ser o primeiro filho (`32px` do `h2`, `16px` do `blockquote`, `8px` do `p`). Uma
página abria a 8px da linha do cabeçalho e a seguinte a 32px, e a diferença só se vê com as duas
lado a lado.

O vão passou a ser do **contentor**, e não do primeiro bloco:

```css
body:not([data-layout="painel"]) header.doc + main > .conteudo { padding-top: var(--esp-6); }
body:not([data-layout="painel"]) header.doc + main > .conteudo > :first-child { margin-top: 0; }
```

`--esp-6` (32px) é o valor que os documentos já tinham quando abrem por uma secção: o vão não
muda de valor, muda de **dono**. O primeiro filho perde a margem para não haver dois responsáveis.

**Por que `.conteudo` e não `main`.** No telemóvel o primeiro bloco do `main` é o índice dobrado
(«Nesta página»), que é navegação e não conteúdo; empurrá-lo mudaria a dobra sem servir à leitura.
**Por que o painel fica de fora.** A tela de trabalho (`data-layout="painel"`) tem o mesmo
`header.doc` colado ao `main`, mas não é documento: é uma pilha densa de formulários.

### 2. O rodapé tinha perdido o box model inteiro

| O que | Antes | Depois |
| --- | --- | --- |
| do último parágrafo ao filete | **0,4px** | **40px** |
| do filete ao texto | **5px** | **21px** (16 de `padding` + 4 do `p`) |

**A causa é a armadilha desta folha, outra vez:** a faixa declarava

```css
header.doc, main, footer.rodape, .rodape { max-width: 900px; margin: 0 auto; padding: 0 24px; }
```

e `footer.rodape` pesa **(0,1,1)** — mais do que o `.rodape` da peça **(0,1,0)**, que vem depois
no arquivo. O rodapé saía com `margin-top: 0` e `padding-top: 0` **enquanto a peça declarava 40px
e 16px**. O `.rodape` é que manda no ar; a faixa manda na largura e na centragem. A linha deixou de
nomear `footer.rodape`.

Isto é «colado na linha» na sua forma mais literal — o texto encostado ao próprio filete —, e não
se vê numa captura de perto: vê-se a comparar o computado com o que a peça diz.

### 3. O vão de baixo do cabeçalho ainda não era um só

A regra `header.doc > :last-child { margin-bottom: 0 }` de 06/11 **estava escrita e não
funcionava** (ver a nota de correção na secção «O cabeçalho respira»): pesava o mesmo que
`header.doc .subtitulo` e vinha antes, e por isso perdia. Medi 20px nos três documentos que
acabam no subtítulo e 12px nos que acabam num botão. Passou para depois das peças.

### O que passa a garantir isto

| O que | Quem | O que mede |
| --- | --- | --- |
| a **declaração** | checagem **10 «Respiro»** do `tools/check-identidade.js` | o ar do cabeçalho (≥12px, em `padding`), o do rodapé (≥12px do filete ao texto, ≥24px do conteúdo ao filete) e o vão da coluna de leitura (≥24px). Reprova também a regra da faixa que voltar a nomear `footer.rodape` |
| a **geometria** | `experimentos/provar-ar-das-paginas.js` | as oito páginas, em 1280 e em 390: o ar nos três lugares, **o mesmo vão em todas as páginas**, nenhum par de irmãos com 0px, e nenhum estouro horizontal |

**Contraprova.** Contra a folha de `HEAD`, a `provar-ar-das-paginas` **reprova 6 de 14**: o vão
depois da faixa saía `[8, 16, 16, 16, 32, 8, 32, 16]` — três valores distintos —, o filete do
rodapé encostava no último parágrafo em todas as páginas (0px) e o texto ficava a 5px dele.

## A barra do lançamento no celular *(21/10/2026)*

O rodapé de paginação do lançamento é `position: sticky; bottom: 0` — nunca sai de vista. Num
telefone ele ocupava **21% da tela** com três linhas, mesmo quando não havia o que folhear. A
escolha foi um **mix** das opções 2 e 3 da proposta:

| O que | Como |
| --- | --- |
| **Compacta em repouso** | ficam os dois botões e a contagem; «Blocos por página» e o total vão para o **«⋯»**, que os devolve e anuncia o estado em `aria-expanded`. **87px → 47px** (no formulário mais denso da proposta, 182px → 47px) |
| **Sai ao descer, volta ao subir** | ao ler a barra não serve, ao procurar serve. Ela desaparece na direção da leitura e reaparece — compacta — na contrária. O limiar de 6px ignora o tremor do dedo, e abaixo de 120px ela não esconde: seria esconder o controle antes de ele ter sido visto |
| **O corte** | 900px. **No desktop nada muda**: lá ela tem uma linha só e não come altura de ninguém |
| **Sem JavaScript** | a barra fica **inteira** e o «⋯» não aparece. A versão compacta esconde um controle, e quem o abre é o script: sem ele haveria um botão que não faz nada e um seletor inalcançável. O atributo é posto no `<head>`, antes de a página pintar, para a barra não encolher sozinha ao carregar |
| **Menos movimento** | `prefers-reduced-motion` tira a animação, e não o esconder |

**O defeito que a medição encontrou, e que não era de CSS.** O «voltar ao topo» é um círculo fixo
no canto inferior direito (46px, a 18px da borda) e ficava **por cima** da barra — na versão
compacta, exactamente em cima do «⋯», que é o único controle que ela tem: um dedo caía no botão
errado. Um controle coberto existe na marcação, mede 0 de distância e não recebe toque nenhum —
nenhuma medida de caixa o denuncia. A prova passou a perguntar `elementFromPoint` no centro do «⋯».

A primeira correção foi **medida e reprovada**: reservar 70px à direita dentro da barra mantinha a
barra livre do círculo, mas a paginação quebrava em duas linhas e a barra ia de 47 para 76px. Os
dois controles passaram a ficar **empilhados**: o círculo sobe para cima da barra pela altura
**medida** dela (`--barra-altura`), que o script republica sempre que a barra abre ou fecha.

**Prova.** A mesma `provar-titulo-e-barra.js`: 27 verificações, das quais as da barra medem a
altura, o que está debaixo do «⋯», o empilhamento com a barra aberta, o esconder e o voltar, o
desktop intacto e o sem-JavaScript.

## A moldura nunca falta — em nenhuma tela *(05/11/2026)*

**A regra, e é inegociável:** a barra do topo e a coluna da esquerda existem em **100% das telas**
— lista, formulário, documento, Bastidores. Não há rota em que a página apareça «nua».

O sintoma que a criou: ao entrar num formulário (criar, editar ou ajustar uma anamnese, um plano de
ensino, um plano de observação) a moldura **desaparecia**, e a página virava «só um formulário com
um roteiro ao lado e um cabeçalho em cima que pede a senha». A pesquisadora: «parece que ele foi
levado para um outro lugar… não pode ser assim».

**A causa foi de mecanismo, não de desenho.** Havia um único desenho (`motor/nucleo/nav.js`), mas
duas formas de o aplicar: a **geração** substituía o marcador `<!-- NAV -->` do `porta/index.html`
(uma vez, no dia em que o pacote nasceu) e a **ponte** substituía uma `<nav class="topnav">` que já
existisse. Uma página cujo pacote ficou com o marcador — e a porta fica, porque é copiada — não era
substituída por ninguém: a ponte via um marcador, não uma barra, e seguia com a página intacta.

**A correção é o que esta norma passa a exigir:** a moldura não é um *substituto*, é um
**enquadramento** (`nav.enquadrar`). Ele cobre as três formas — barra existente (substitui), o
marcador (injeta ali o desenho inteiro, coluna + barra) e documento sem moldura nenhuma (injeta no
início do `<body>`). É idempotente, e é por isso que pode correr em **toda** resposta HTML da ponte
sem risco de duplicar.

| Quem | Quando | O que garante |
| --- | --- | --- |
| `motor/servidor/producao.js` (`comAparencia`) | ao **servir**, toda resposta HTML | a moldura certa mesmo num pacote velho, ou num que nunca será regerado |
| `tools/montar-publicacao.js` | ao **montar** | o artefacto está completo por si (aberto do disco, ou servido por um CDN sem Worker) |

**E o menu de uma escola recém-criada já leva os três formulários.** «Anamnese do aluno», «Plano de
ensino» e «Plano de Observação» são **moldura**, não conteúdo: a anamnese é o instrumento de
*entrada* (vem antes de existir turma) e o plano de ensino é o que *cria* o ciclo. O que continua
dinâmico é o resto — «Aulas» e os documentos do ciclo nascem com o ciclo, e o menu cresce com ele.

**A prova** (`experimentos/provar-a-moldura-em-todas-as-telas.js`): monta uma publicação de verdade
sobre uma árvore que reproduz o defeito (a porta com o marcador) e percorre as 16 telas pela ponte,
exigindo barra, coluna e os três formulários em cada uma — mais o controlo que mostra `aplicar` a
devolver `null` onde `enquadrar` devolve a página enquadrada.

*Uma exceção declarada:* a **raiz do sistema** (`danca`, a página de criar escola) não tem coluna —
ela não é de escola nenhuma e não há para onde navegar; o que ela tem é o cabeçalho do documento.

## Onde estou — o caminho na barra e a marca no menu *(26/10/2026)*

**Aprofundar não é sair.** Quem está a meio de um plano, a preencher uma anamnese ou a ler uma
aula **não deixou** «Ciclos» nem «Área do Professor»: desceu um degrau dentro deles. O sistema diz
onde a pessoa está em **dois lugares ao mesmo tempo**, e os dois têm de dizer a **mesma coisa** —
senão a barra diz «Ciclos · Planos do ciclo» e o menu diz «não estás em lado nenhum», que é o
defeito que esta norma fechou.

| Onde | A pergunta que responde | Como |
| --- | --- | --- |
| **na barra**, ao lado da logomarca | «em que **documento** estou?» | `Grupo · Lista · Documento`, em `span.doc-atual` |
| **no menu** | «de que **lista** eu vim?» | `aria-current="page"` no item, `data-atual="sim"` no grupo |

### O caminho tem três degraus, e só o último é o documento

| Degrau | Peça | Porquê |
| --- | --- | --- |
| o **grupo** | `<small>` — **não** é ligação | um grupo não tem página própria: escolher um item por quem lê seria adivinhar |
| a **lista** | `<a>` — é o **lastro** | é o caminho de volta. Quem entrou no documento por ela não precisa do «atrás» do navegador |
| o **documento** | `<b>` | é o `<h1>` da página, cortado no primeiro travessão («nome — explicação» fica «nome») e a 90 caracteres |

- **Na própria lista** o degrau do meio não existe (seria uma ligação para si mesma): fica
  `Ciclos · Planos do ciclo`.
- **Só existe quando há coluna.** Na barra antiga, com os grupos todos à vista, um título ao lado
  deles competia por largura sem responder a nada.
- **No telemóvel (≤768px) fica só o último degrau.** Medido com os três: a 390 o caminho era
  cortado em «Notação em Benesh» e no glossário, e a 320 em quatro dos seis documentos — e o
  corte come o **fim**, que é justamente o nome do documento. O grupo e a lista são o caminho de
  volta, e no telemóvel a folha do ☰ **já é** esse caminho; o documento não tem substituto. É a
  mesma medida que o formulário já tomava por script — agora é a folha que a decide, para todos
  os documentos, inclusive os já publicados.
- **A página que já diz onde está não ganha um segundo dizer.** A Produção traz a sua S5 na barra
  (`Produção · Painel inicial`, que sobe e se acende ao rolar); com o caminho ao lado, o telemóvel
  dizia a mesma coisa duas vezes.

### No menu, a marca é do ITEM e do GRUPO

Na coluna **compacta** (≥1141px) os grupos nascem fechados, e um item aceso lá dentro não se vê:
quem responde «onde estou» é o **título do grupo** — cor e filete de ouro (`data-atual="sim"`) —,
e o item guarda o `aria-current` para quem lá chegar. Na **folha** do telemóvel os itens estão à
vista, e o aceso é o que tem o fundo da marca. É o mesmo HTML nas duas: o que muda é a largura.

**Um destino directo não é acordeão.** «Consulta» é `tipo: 'link'` e não tem grupo para acender —
a marca é a do próprio link (`coluna-direto ativo`). Não se inventa um grupo só para ter onde
pintar.

### A conta é UMA, e é uma tabela

`TRILHA_DO_DOCUMENTO` ([`motor/nucleo/nav.js`](motor/nucleo/nav.js)) declara, para cada documento
do pacote, **de que lista ele sai**. A mesma tabela serve as duas marcas: o `caminhoDaPagina` lê-a
para o caminho da barra, e o `ehAtivo`/`listaDoDocumento` lê-a para acender o menu. Duas contas
para a mesma pergunta divergem no dia em que uma muda — e a divergência aparece como «a barra diz
uma coisa e o menu diz outra».

A **porta** (o formulário em `/anamnese/`, `/plano-ensino/`, `/plano-observacao/`) tem a sua
tradução no módulo que já conhece a relação — `listaDaPorta`, sobre `FAMILIAS`
([`motor/servidor/listas-do-acervo.js`](motor/servidor/listas-do-acervo.js)) —, e não numa segunda
tabela. O caminho servido continua a ser o que se serve; o que muda é o que o menu lê.

| Família | Documento (ou porta) | Acende |
| --- | --- | --- |
| Ciclos | `/…/plano` | «Planos» |
| Ciclos | `/…/referencias` | «Planos» — **a lista de referências deixou de existir** (26/10/2026), e o caminho até ao documento é o plano |
| Área do Professor | `/…/aula-NN`, `/…/captura-aula-NN`, `/…/lancamento` | «Aulas» |
| Área do Professor | `/…/notacao`, `/…/glossario-*` | «Aulas» — as duas vistas e o glossário pertencem ao percurso da aula |
| Área do Professor | as três **portas** | a lista da sua família |

**Um grupo com um item só não é, por si, um defeito.** «Ciclos» tem hoje **um** item — «Planos» —
e o grupo fica: ele é o nome da **área**, e o item é o nome da **lista** que tem de ficar aceso.
«Área do Professor» conserva as suas listas; a Notação abre-se pela ação ao lado da Aula 01, e o
Glossário pelo cabeçalho persistente da Notação. As listagens independentes `/consulta/` e
`/area-do-professor/notacao/` deixam de existir. O que se recusa é uma **listagem** que só existe
para repetir uma linha por turma: foi o caso de «Ciclos · Referências», removido com a sua página
em 26/10/2026. Foi uma **remoção deliberada de URL** — quem tiver `/ciclos/referencias/` guardado
perde-o, e é o objectivo. As referências continuam a abrir-se pelo cartão do plano e pelo próprio
plano.

### O que NÃO se marca

**Um documento que não sai de lista nenhuma não inventa marca.** A harmonização, que saiu do menu
em 24/10/2026, e a apresentação (`sistema.html`) continuam sem nenhuma. Acender «para não ficar
vazio» seria mentir sobre a proveniência — e é a contraprova que impede a regra de virar «acende
sempre».

### A regra para o que vier *(a tabela de atividade, e o resto)*

Qualquer ecrã novo nasce já com as duas marcas, e o trabalho é declarativo:

1. **É um destino do menu?** Nada a fazer: o item já é dele.
2. **É um documento que nasce de uma lista?** Uma linha em `TRILHA_DO_DOCUMENTO` (a expressão do
   caminho, o grupo, o rótulo da lista, o `href`). As duas marcas passam a existir, sem mais
   código.
3. **Nasce de um formulário/porta?** A tradução vai em `FAMILIAS`/`listaDaPorta`, e não numa
   tabela nova.
4. **Não nasce de lista nenhuma?** Não se marca nada.

**Prova.** [`experimentos/provar-barra-unica.js`](experimentos/provar-barra-unica.js), secção **D1**
(21 asserções: as seis famílias e a contraprova) e
[`experimentos/provar-painel-do-ato.js`](experimentos/provar-painel-do-ato.js), secção **17**
(38 asserções em navegador, a 1280 e a 390 — o item aceso **e pintado**, o grupo marcado, a folha
aberta com ele à vista, o caminho reduzido ao nome do documento e **sem reticências** no telemóvel,
e nada a estourar na horizontal). A secção 17 mede o que se **vê**: a cor e o filete, não a
existência da classe — uma marca que ninguém pinta não é uma marca.

## A logomarca mora no alto da coluna *(13/11/2026)*

**A marca não pertence à barra: pertence ao menu.** A barra é o que fica sempre à mão — o caminho
do documento e o dropdown do Bastidores. A identidade da página — a logo e o nome de onde se está —
é a primeira coisa da coluna, e é por aí que a leitura começa.

O pedido foi literal: «a logomarca deve ficar fixada sempre no topo da coluna à esquerda, indo até
ao topo em ambas as situações, os títulos e identificações ficam logo abaixo dela, e o dropdown de
alternância entre estúdio de dança e produção fica onde está».

| Regra | Como |
| --- | --- |
| **A marca é a mesma, e não uma segunda** | o `<a class="marca">` de `marca-lastro.js`, com `fill="currentColor"`. Na coluna ela veste `--sobre-marca`, o papel do que fica em cima do fundo da barra — nenhuma família precisa de exportação própria |
| **Ela é a primeira coisa da coluna** | 44px de altura (o dobro dos 30px da barra), encostada ao topo: a base da logo fica à altura da base da barra (`16 + 44 = 60px`) |
| **A identificação fica logo abaixo** | «Sistema Lastro» na escola, «Bastidores» na Produção. Na Produção, o «← Sistema Lastro» continua abaixo dela |
| **A marca sai da barra onde há coluna** | `body:has(> .coluna) .topnav .marca { display: none }`, e o mesmo para `:has(.lateral)`. No celular ela **fica** na barra: ali a coluna é a folha, e a barra é a única marca à vista |
| **O título não muda de lugar** | o `doc-atual` (escola) e a `s5-sessao` (Produção) continuam a ser a **primeira coisa da barra**, à esquerda. Tirar a logo não os move: eles ocupam o vão que ela deixou |
| **Uma coluna, dois donos** | o desenho da marca mora em `tools/templates/ciclo.css` (é um componente — a checagem 7a reprova quem carrega a folha e o redeclara); o resto da `.lateral` mora no `<style>` da vista |

**O que a medição guarda** (1440×900, nas duas telas): coluna em `y=0` com 248px; logo em `y=16` com
44px de altura; identificação em `y=66`; barra a começar a `x=248`; título em `x=264`; dropdown na
ponta. No celular, as duas capturas ficam **pixel a pixel iguais** às de antes — a regra que esconde
a marca no computador é a que a mantém no telefone. Prova:
[`experimentos/provar-menu-da-producao.js`](experimentos/provar-menu-da-producao.js) (55 asserções)
e [`experimentos/provar-barra-e-caminho.js`](experimentos/provar-barra-e-caminho.js).

## O menu de trabalho não rola com a página *(26/10/2026 — refeito no mesmo dia)*

**O menu é o que fica.** Quem rola uma lista de trinta alunas, ou a página de uma aula de quinze
ecrãs, continua a precisar de navegar — e um menu que sobe com o documento obriga a voltar ao topo
para o alcançar. Os dois menus de trabalho do produto **ficam congelados**: a coluna do sistema
(`.coluna`) e a lateral da Produção (`.lateral`). Os dois pelo **mesmo mecanismo**: `position:
fixed`.

| Menu | Como fica | Porquê assim |
| --- | --- | --- |
| `.coluna` (sistema) | `fixed`, de topo a fundo, acima dos 1141px | não depende de nada da página: é navegação global, e a página cede-lhe 248px de margem |
| `.lateral` (Produção) | `fixed; left: 0; top: 0; bottom: 0; width: 248px` | não depende da altura de nada, e vai **de cima a baixo** como a do sistema. A faixa que ela ocupa é reservada no `padding` do `.corpo` (248px + os dois espaçamentos) |

### `sticky` não serve aqui — e a primeira tentativa provou-o

A `.lateral` declarava `position: sticky`, e rolava com a página na mesma. A explicação que se
seguiu à primeira medida (`align-self: stretch` dava ao item a altura da linha, e um `sticky` tão
alto como o contentor não tem percurso) era **verdadeira e insuficiente**: mesmo com
`align-self: start`, o `sticky` continua a não ter para onde deslizar **quando o contentor é tão
alto como o elemento**.

E é exactamente esse o caso do produto. Medido na página real do «Painel inicial» — paginada, 6
itens, 13 páginas: `.corpo` = **700px** e `.lateral` = **700px**. Zero de percurso. Na página de
Turmas acontece o mesmo por outra via: a listagem rola **dentro de si** (`.col-lista .rolagem`), a
página quase não cresce, e a área da grade também não. `sticky` só funciona em páginas de documento
— e estas não são: são telas de trabalho.

**A lição, que é sobre provas e não sobre CSS.** A primeira prova desta secção enchia a página com
2400px de conteúdo para «haver rolagem», e com isso dava ao `sticky` o percurso que ele precisa. Ela
passou, e o produto continuou quebrado. **A prova media uma situação que ela própria criava.** A
medida que vale é a da página **curta** — que é a real — e é ela que a prova passou a fazer
primeiro.

| Regra | Como |
| --- | --- |
| **`fixed`, e não `sticky`** | a posição não depende da altura do contentor. É o mesmo mecanismo da coluna do sistema |
| **A faixa é reservada no `.corpo`** | `padding-left: calc(248px + var(--esp-4) + var(--esp-5))` — a mesma geometria da coluna do sistema, com a `lateral` fora do fluxo |
| **A página que cabe na tela não rola** | `body:has(.corpo){padding-bottom:0}`: os 40px que a folha reserva para o texto de um documento viravam barra de rolagem numa tela que cabe inteira — «não sei o que está gerando o scroll vertical» |
| **Se o menu for mais alto do que a tela, ele rola DENTRO de si** | `bottom: 0` + `overflow-y: auto` — nunca a página a empurrá-lo para fora |
| **A coluna vai de cima a baixo; a barra começa depois dela** | `top: 0`: a coluna ocupa a faixa dos 248px e a barra começa onde ela acaba (`left: 248px`), como no Sistema Lastro. `z-index: 15`, abaixo da barra (20) e do submenu dela (21) |
| **No celular nada disto vale** | abaixo de 768px a `.lateral` é uma **barra** com o botão «Seções»: `position: static; width: auto; z-index: auto`, e o `.corpo` não reserva faixa |

**Prova.** [`experimentos/provar-menu-da-producao.js`](experimentos/provar-menu-da-producao.js) —
a página **curta** primeiro: ela quase não rola (`documento − janela ≤ 2`) e o menu **não se move um
pixel**; encosta na janela (topo = 0 desde 13/11/2026, base = fundo da tela). Depois a **longa**: rola
600px e o menu fica, com o ponteiro a alcançar um destino. Depois a janela a **300px** com um grupo
aberto: o menu cabe e rola dentro de si até ao último destino. E a **390px**: a barra do celular não
herdou os 11rem nem o `z-index` do menu lateral, e não há transbordo horizontal.
O controle negativo (`--controle-negativo`, contra o commit anterior) **reprova as quatro
asserções da página curta** — menu de 60 para 20 com 40px de rolagem, exactamente o defeito
descrito.

## A funcionalidade planejada — configuração de aparência *(o catálogo, **não** implementado)*

**O que é.** Uma entrada no **painel administrativo privado**, na área de configuração do sistema,
chamada **Identidade visual**, com um campo de seleção chamado **Paleta de cores** e as **doze**
combinações. A escolha passa a valer para **todas** as telas.

**O fluxo planejado.**

1. O usuário abre o painel administrativo.
2. Abre o item de menu **Identidade visual**.
3. Encontra o campo **Paleta de cores**.
4. Escolhe uma das doze combinações.
5. A escolha passa a valer para todas as telas do sistema.

**O escopo é global — não é por página nem por componente.** Cabeçalho, navegação, formulários,
tabelas, cartões, modais, mensagens e os demais componentes acompanham a paleta escolhida. E isso é
**possível** porque a folha já é toda feita de tokens: o corpo do `ciclo.css` **não escreve um
único hex** e usa `var(--…)` **66 vezes** — trocar o valor dos tokens no `:root` re-veste todos os
componentes sem reescrever uma regra.

**O que a troca NÃO pode tocar.** Dados pedagógicos, registros, versões de plano, permissões e
regras de negócio. A paleta é **forma**: troca valor de token, e nada mais. E — como este documento
já declara — ela **não entra na âncora de proveniência**: o `.fipp` cobre **fontes de ciclo**, não
forma.

### As duas metades do problema — medidas

**(1) O caminho está aberto.** `tools/templates/ciclo.css` é a fonte única e o corpo dela é 100%
`var(--…)`. Quem consome herda: o pacote recebe `assets/style.css` (cópia gerada), e os Bastidores
carregam **a mesma** folha (`motor/servidor/bastidores.js:550`) — de modo que há **uma folha só**
para a interface inteira. **A indireção existe.**

**(2) Mas a paleta é resolvida em tempo de geração, não de uso.** A cópia `assets/style.css` do
pacote é **gerada**, e o validador exige que ela seja **idêntica** à fonte (a checagem «circuito»).
Um arquivo estático não muda de cor porque alguém escolheu uma opção — e a escolha é de **pessoa**,
não de pacote. Duas saídas são concebíveis, e **nenhuma está escolhida**:

- **no navegador** — um script pequeno reescreve os tokens no `:root` a partir da preferência
  guardada. Funciona em página estática e não exige regerar nada;
- **no servidor** — o Worker injeta a paleta na página que serve. O caminho existe: os
  `wrangler.<escola>.jsonc` usam `"run_worker_first": true`, e o motor já serve estáticos por
  `env.ASSETS` (`motor/servidor/cloudflare.js:188`).

**O que a decisão arrasta — e é por isso que ela não se toma agora:** os **leitores** da fonte
assumem **um só** `:root`. `tools/lib-tokens.js` corta o bloco no **primeiro** `}` depois do
primeiro `:root`; `check-identidade.js` faz o mesmo (`lerTokens`). Doze paletas num arquivo exigem
que os dois saibam **qual** ler — e é isso que separa uma mudança de forma de uma mudança de
arquitetura.

### A pergunta sem resposta: a preferência é de quem?

A tarefa manda **não presumir** que a preferência vale para todos os usuários de uma escola, e
confirmá-la contra o modelo de acesso. **Medido, e a resposta não está dada:**

- A senha da Produção é **uma por escola**. `senhaDaEscolaOk` (`motor/servidor/bastidores.js:468`)
  aceita a senha da **direção** *ou a de qualquer professor cadastrado* — e é decisão declarada no
  próprio código, porque o dado da escola «não pertence a um professor».
- Depois do portão, o que a página guarda é **a senha** (em `sessionStorage`), não **quem entrou**.
  O sistema autentica **um segredo**, não **uma pessoa**.

Ou seja: **hoje não há a quem pendurar uma preferência por usuário** — o modelo de acesso não
identifica o usuário. Há três desfechos, e **nenhum está escolhido**:

| Caminho | O que exige |
|:--|:--|
| **por escola** | nada de novo: é a chave que a instalação já tem |
| **por usuário** | dar **identidade** a quem entra — o que o portão não faz hoje |
| **por navegador** | nenhuma identidade, mas a preferência não viaja entre dispositivos — e não é do usuário nem da escola |

> **Nota honesta, e é uma porta que não se abre por acidente.** `senhaDaEscolaOk` **percorre** a
> lista de professores e sabe **qual** senha bateu: a identidade **existe no dado** e **não é
> usada**. Transformar isso em «quem entrou» é decisão de **acesso**, com consequência de
> segurança — e não um detalhe de aparência.

### Onde a preferência é guardada

Não há mecanismo escolhido, e a inspeção mostra por quê: o que existe hoje para estado **por
escola** é o **KV** (chaves `bastidores/<escola>/…`, medido), e para estado **por aba** é o
`sessionStorage` do portão — que **esquece** ao fechar a aba e, por isso, **não** serve a uma
preferência. Guardar no KV obriga a decidir *de quem* é a chave; guardar no navegador não obriga a
nada, e é a opção que **não** cria um campo novo no dado da escola. **Nada disto está decidido.**

### Requisitos registados, para quando se implementar

Nada disto está feito. É a lista do que a implementação **terá** de cumprir.

- **CSS nativo, sem biblioteca adicional** — zero dependência nova, como hoje.
- **Uma única fonte de verdade para os tokens.** As doze paletas vivem **todas** em
  `tools/templates/ciclo.css`: nenhuma em lista paralela, nenhuma no JS, nenhuma no HTML.
- **Separação entre token de identidade e componente de interface.** O corpo continua a falar só
  por tokens; nenhum componente passa a conhecer o nome de uma paleta.
- **Aplicação global** por tokens ou mecanismo equivalente, compatível com o que já existe.
- **Persistência da preferência**, entre sessões.
- **Estados consistentes** em toda paleta: foco, seleção, `hover`, desabilitado, sucesso, alerta e
  erro.
- **Contraste verificado em cada combinação** — e não só na vigente.
- **A noturna concebida para a família**, nunca uma inversão automática de cores.
- **Componentes e formulários nativos** compatíveis com o tema escolhido: o `select`, o `input`, o
  `button` e o `checkbox` do sistema, com as cores do sistema — inclusive na noturna.
- **Nenhuma biblioteca visual adicional.**
- **Compatibilidade com os arquivos gerados e com os validadores atuais** — o pacote continua a ser
  reconstruível, e o `check-identidade.js` continua a ser a prova.
- **A escolha é explícita, e não depende de `prefers-color-scheme`.** Quem usa o sistema escolhe
  clara ou noturna **dentro dele**; a preferência do sistema operativo não é a decisão. Ela pode,
  no máximo, ser o **valor inicial sugerido** — e isso é decisão também, não regra.

### Acessibilidade — o critério não muda, a superfície cresce

O piso continua a ser o **WCAG 2.1 AA**, e continua a ser **medido**: **4,5:1** para texto e
**3,0:1** para traço com função. O que muda é a **extensão** da conferência: hoje ela mede a paleta
vigente; com o catálogo, ela tem de medir **cada** combinação de paleta e variante **contra os
fundos reais** que os componentes usam — e não contra um fundo idealizado. A tabela `PARES` do
validador é o lugar dessa conferência, e é por isso que ela **não** se copia para outro arquivo:
cópia que diverge é exatamente o defeito que originou este documento. A ordem de grandeza do que
se mede sai daí — os pares declarados **vezes** as doze combinações —, e o número não se escreve
aqui: quem quer o número roda o validador.

Os **semânticos** — `--ok`, `--alerta`, `--falha` — são o caso mais sensível, e por isso ficam
declarados: em toda paleta eles continuam a **comunicar o resultado do registro**. Vermelho de
falha não vira ornamento de uma família mais quente; se a família não comporta o tom, muda-se o
**tom**, nunca o **significado**.

Os **fundos reais** que a conferência tem de cobrir, hoje, são os que o `ciclo.css` declara:
`--cream`, `--branco` e as seis faixas de creme (`--creme-1` … `--creme-6`).

## O que este documento não faz

- **Não avalia.** O projeto registra o cotidiano do professor em sala de aula; a
  identidade visual é **forma**, não juízo sobre a aula.
- **Não fixa o layout.** Ele fixa **token e papel**. Onde cada token é usado é o
  CSS.
- **Não entra na âncora de proveniência.** Mudar a paleta não reancora `.fipp` —
  mas **exige regenerar os pacotes**, porque a cópia em `assets/` é gerada.
- **Não vale para os documentos do mestrado** nem para o FIPP: eles estão em **outro
  diretório** e têm o seu próprio regime.
- **Não é congelado.** É documento novo (livre em `CONGELAMENTO.md`) — mas
  `tools/templates/ciclo.css`, `tools/lib-tokens.js` e `tools/check-identidade.js`
  **são** infraestrutura: mudá-los exige motivo declarado, commit próprio e entrada
  no `REGISTRO.md`. **A implementação do seletor mexe nos três** — e é por isso que
  ela será commit próprio, com o motivo escrito, e não um ajuste de forma no meio de
  outro trabalho.
- **Chegou a implementar o que planejou, e depois fechou o catálogo.** O seletor de
  aparência **existe** (Produção → Aparência, dois eixos), e as três famílias têm
  hex medidos no `ciclo.css`. As outras quatro foram **abandonadas** em 18/10/2026,
  depois de medidas — e é por isso que a tabela deste documento as nomeia em vez
  de as apagar: uma família que desaparece sem rastro é proposta outra vez.
- **Não substitui a identidade vigente.** A Bordô de Cena é o `:root`, é o padrão de
  quem nunca escolheu nada, e é a paleta do PDF e do deck. Uma família é uma
  **camada por cima** dela, não uma troca.
