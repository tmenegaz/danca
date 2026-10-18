# Identidade visual — a paleta, a tipografia e o critério

> **Nota de escopo.** Este documento descreve a identidade do **Projeto Ciclo** — a
> memória da aula dada, **protótipo testado no universo da dança**. Ele **não** é
> agnóstico: o projeto agnóstico será criado a partir dele. As cores são de uma
> escola de balé clássico porque é o universo em que o protótipo está sendo testado;
> o que se declara aqui é o **método** de fixar a identidade, não o gosto de um
> universo.

> **Atualização de 16/10/2026 — a identidade vigente não muda; o catálogo abre.** O dono do
> produto explorou **visualmente** seis direções de paleta, cada uma com uma variante **clara** e
> uma **noturna**, e pediu que o estudo fosse **registado** — sem eleger identidade nova, sem
> implementar seletor e sem tocar na interface. A identidade vigente continua a ser **esta**, a de
> bordô e ouro, com os valores que os tokens abaixo declaram; as seis famílias são **estudo**, e
> estão em «O catálogo planejado», depois do validador. **Nada foi implementado** — nem paleta,
> nem seletor, nem item de menu —, e nenhum hex das famílias foi inventado.

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
quem não é CSS. O modo `--latex` é o que leva a paleta ao PDF; os geradores JS o
usam para não escrever hex.

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
A escolha é explícita e fica no **navegador** (`localStorage`, chave `ciclo-modo`), entre sessões —
um caminho **provisório**. **Nota de 18/10/2026:** a decisão **C15** foi tomada — **a preferência é
da escola** —, e por isso este caminho (no navegador) está declarado como **o que será
substituído**: uma escolha da escola vale para todos e aplica-se no **servidor**. Enquanto a
implementação não existir, o botão `◐` continua na barra e, na raiz, ao lado das ações.

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
| **1140px** | a vista de trabalho (`data-layout="painel"`) passa a uma coluna | é onde o formulário de 34rem e a lista de 24rem deixam de caber lado a lado |
| **1024px** | a barra do topo encolhe a fonte e o espaçamento | é o tablet: a barra inteira ainda cabe numa linha |
| **768px** | a barra colapsa no hamburger **e** o painel vira uma coluna | é o celular — **um** número, usado por todas as folhas |

> **A regra do 768.** `768` significa «celular» em **todas** as folhas. Antes de 17/10/2026 o
> painel cortava em **760**: entre 761 e 768 o menu do topo já estava no hamburger e o painel
> ainda tinha duas colunas — navegação em dobro, e 535px para o conteúdo. Dois números para o
> mesmo conceito é a mesma classe de defeito que o `--gold-borda` em dois fundos.

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
servidas, em 320/390/768, contra transbordo horizontal.

## Tipografia — duas pilhas, e a exceção é restrita

| Token | Valor | Papel |
| --- | --- | --- |
| `--serif` | `Georgia, 'Times New Roman', serif` | **a prosa institucional**. Corpo a 17px/1.65 |
| `--ui` | `system-ui, -apple-system, …` | **o maquinário de formulário** |
| `--header-height` | `120px` | altura da barra fixa — o `padding-top` do corpo |

> **A exceção da `--ui`.** A pilha sem serifa é **deliberada e restrita ao
> maquinário do formulário** — os controles onde se digita e se clica (`input`,
> `select`, `button`). É ali que a fonte do sistema ajuda. O texto **em volta**
> desses controles continua serifado. Usar `--ui` em prosa é o defeito.

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

## O validador, e as suas sete checagens

`tools/check-identidade.js` não tem dependências externas e sai com código 1 se algo
falhar. Ele confere:

1. **Contraste** — mede cada par de `PARES` (de **papéis**, não de valores) contra o
   seu piso, em **cada tema**: hoje, 31 pares na clara e 31 na noturna. Inclui os
   fundos de estado (`--ok-fundo`, `--alerta-fundo`, `--falha-fundo`,
   `--derivada-fundo`), onde o texto semântico é lido.
2. **Cópia única** — nenhum dos hex da paleta pode aparecer fora de
   `tools/templates/ciclo.css`. Comentários que **citam** um valor para explicar por
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
   comparar. E a barra tem de trazer o botão da aparência. Foi a falta desta checagem
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

## O catálogo planejado — seis famílias, doze variantes *(16/10/2026)*

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

**As seis famílias.** Os nomes são **proposta**, sujeitos a revisão na implementação.

| # | Família | Carácter |
|:--|:--|:--|
| 1 | **Bordô de Cena** | **a identidade vigente.** Teatro clássico: bordô e ouro |
| 2 | **Verde de Ensaio** | verde sálvia, neutros quentes, referências naturais |
| 3 | **Azul de Gala** | azul profundo e ouro, de carácter teatral |
| 4 | **Prata de Palco** | bege, prata e grafite — clássico e discreto |
| 5 | **Azul de Bastidores** | azul administrativo, claro e funcional, na linhagem das interfaces contemporâneas de produtividade — **sem reproduzir marca nenhuma** |
| 6 | **Luz de Camarim** | minimalista, neutra e luminosa, com acentos azuis discretos |

**Cada família tem duas variantes — clara e noturna.** E a noturna **não é** a clara invertida:
ela é concebida **para aquela família**, porque inverter não preserva o que a família tem de
próprio.

**A lista que o seletor oferecerá — doze opções, nesta ordem:**

- Bordô de Cena — Clara
- Bordô de Cena — Noturna
- Verde de Ensaio — Clara
- Verde de Ensaio — Noturna
- Azul de Gala — Clara
- Azul de Gala — Noturna
- Prata de Palco — Clara
- Prata de Palco — Noturna
- Azul de Bastidores — Clara
- Azul de Bastidores — Noturna
- Luz de Camarim — Clara
- Luz de Camarim — Noturna

**A ordem é a do catálogo, e as duas variantes de uma família ficam juntas** de propósito: quem
escolhe escolhe uma **família** e depois um **modo**, e uma lista em que as doze aparecessem
embaralhadas obrigaria a ler as doze para achar as duas da mesma família.

**A identidade vigente é a de Bordô de Cena, e ela continua a valer.** Bordô de Cena **não é** a
primeira de doze candidatas: é a paleta que está no ar, com os valores que este documento declara
— e é ela que o `ciclo.css`, o PDF e o deck continuam a usar enquanto o seletor não existir. As
outras cinco, e a variante noturna da própria Bordô de Cena, são **estudo**.

> **O que a vigente NÃO muda.** Os tokens, os pares medidos, o piso de contraste e
> `tools/templates/ciclo.css` como fonte única. A chegada do catálogo é **acréscimo**, não
> substituição — e enquanto não houver decisão, é o que está escrito acima desta secção que vale.

## A aparência — o que existe hoje *(17/10/2026)*

**O que existe.** A **variante noturna** da identidade vigente, com os papéis medidos nos dois
temas, e o **botão `◐`** na barra (e na raiz), com a escolha guardada no navegador. Isto é
**forma implementada**, não o catálogo: **não** há as doze paletas, **não** há painel
administrativo e **não** há escolha por escola ou por usuário.

**O que continua planejado — e não implementado.** O **catálogo** das seis famílias, o item de
menu **Identidade visual** e o campo **Paleta de cores** com as doze combinações. A decisão
**C15** — de quem é a preferência — **foi tomada em 18/10/2026: da escola**; a gravação no
navegador é o caminho provisório, declarado como tal, e será substituída pela aplicação no
servidor.

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
> | **quem muda** | **qualquer pessoa com a senha da escola** (`senhaDaEscolaOk` aceita a da direção *ou a de qualquer professor*); separar a direção é a **C17**, ainda aberta |
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
- **Não implementa o que planeja.** O catálogo das seis famílias e o seletor global
  de paleta estão **registados**, não construídos: não há paleta nova no
  `ciclo.css`, não há item de menu «Identidade visual», não há troca de tema — e
  nada disso foi tocado nesta rodada. **Documentado não é implementado**, e a
  distinção fica escrita para que a próxima leitura não a confunda.
- **Não substitui a identidade vigente.** Enquanto não houver decisão declarada, a
  identidade do sistema é a de **bordô e ouro**, com os valores dos tokens — e as
  seis famílias ficam como **estudo**: elegíveis, não eleitas.
