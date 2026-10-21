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

## O validador, e as suas nove checagens

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
| **Um ESTADO ou atributo do dado** | `.selo` | «livre», «vinculada», «vigente» | `<span class="selo livre">` |
| **Um bloco de leitura** | `.caixa` | texto que se lê, com título | `<div class="caixa">` (+ `nota`, `falta`) |
| **O resultado de uma ação** | `.res` | «ok», «erro», «gravando…» | barra acima da lista |
| **Um alerta no meio do conteúdo** | `.aviso` | o que o leitor **não pode deixar passar** — o que impede o avanço | `<p class="aviso">` |
| **Uma explicação que se procura** | `.ajuda` + `.explica` | o que o leitor procura **quando quer** — o que é o campo, o que preencher, a nota do conteúdo | `<button class="ajuda" aria-expanded>` + painel `hidden`; no telefone o painel sobe como folha |
| **Uma janela por cima** | `.modal` | confirmar uma exclusão | `modal-fundo` + `modal-caixa` |
| **A barra do sistema** | `.topnav` | — | gerada por `nav-html.js`; **não** se escreve à mão |
| **O índice da página** | `.toc-local` (+ `.toc-dobra`) | — | gerado; no celular recolhe |

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
| `.aviso` / `.res` / `.modal` | `ciclo.css` | `.res.ok`, `.res.erro` |
| `.ajuda` («?») | `porta/index.html` | base, `:hover`, `[aria-expanded="true"]`, e 30px de alvo no telefone |
| `.explica` | `porta/index.html` | `hidden` (fechada), `aberto` (à vista; folha fixa ≤768px), e o «Fechar» que só existe dentro da folha |
| `[hidden]` | `ciclo.css`, na base | esconde **sempre** — é a única linha da folha com `!important`, e a razão está na proibição 4 |
| `.topnav` / `.toc-local` / `.toc-dobra` | `ciclo.css` | aberto, recolhido, impressão |
| `.escolhedor` | `ciclo.css` + a página que o emite | `.escolhidos`, `.escolhido`, `.entrada` |
| `.ficha` / `.cartao` / `.acoes` (raiz) | **a própria página**, que não carrega a folha | ver a checagem 4 |

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

## O iPhone — o menu que não cabia e a rolagem que tremia *(21/10/2026)*

Dois defeitos que só aparecem no Safari do iOS: o Android e o Chrome do computador nunca os
mostraram. Medidos antes de corrigidos, e as duas causas são do **ambiente**, não do gosto.

| O que se viu | O que era, medido |
| --- | --- |
| «o menu de hambúrguer aparece pela metade» | o painel crescia com o conteúdo — **812px** com os seis grupos abertos — sem `max-height` nem `overflow`, e num iPhone as barras do sistema comem 150 a 270px. Em 390×664 (o que um iPhone mostra com as barras): **148px cortados**; em 320×568, **266px**. O painel está dentro de uma barra `position: fixed`, e a página por baixo rola sem o levar: o fim era inalcançável |
| «a rolagem fica a tremer» | o `resize` do iOS dispara **a cada quadro** enquanto as barras se recolhem ao rolar. Os dois `resize` faziam trabalho de layout, e 60 eventos com a **mesma largura** davam **60 leituras de layout e 120 escritas em `:root`** — e `--header-height` é o `padding-top` do `body`: o conteúdo andava por baixo do dedo |

**O que ficou.**

| Regra | Como |
| --- | --- |
| **O painel cabe** | `max-height: calc(100svh − var(--barra-linha) − 8px)` com `overflow-y: auto`. `svh` — o viewport *pequeno*, com as barras — e não `dvh`, que **muda durante a rolagem**: um painel que cresce sozinho enquanto se rola é a tremedeira que se está a corrigir |
| **A altura da linha é medida** | `--barra-linha` é a altura da barra **fechada**, publicada pelo `nav.js`. Aberta, `offsetHeight` é a barra inteira, e o limite do painel passaria a incluir-se a si mesmo |
| **Uma coluna só** | `flex-wrap: nowrap` no painel. A `.nav-links` nasce com `wrap` (no desktop os links quebram em duas linhas, e é isso que se quer lá); com `column` + `max-height`, a coluna transbordava para uma **segunda coluna ao lado** e o painel deixava de rolar. Foi a primeira versão da correção — e a medição apanhou-a |
| **O que está dentro não encolhe** | `> * { flex: 0 0 auto }`. Sem isto os itens comprimem-se para caber: os links ficam espremidos em vez de o painel rolar |
| **`resize` só por LARGURA** | a altura que muda sozinha é a barra do sistema, e não muda o título nem a barra: só se reage quando `innerWidth` muda |
| **Não se escreve o que já lá está** | `--header-height`, `--barra-linha`, `--titulo-preso`, `--barra-altura` e `data-titulo-encolhido` só se escrevem quando o valor muda. Escrever em `:root` invalida o estilo do documento inteiro |
| **O alvo de toque** | o hamburger media **38×42**; passou a **44×50** (WCAG 2.5.5 / Apple HIG), com `touch-action: manipulation` para dispensar a espera do duplo-toque. É o único controle da barra num telefone |

**Medido depois.** 390×664: painel de 587px, rola 877, sobra 4px abaixo. 320×568: painel 491, rola 769, sobra 4. O último link — «Produção» — fica alcançável ao rolar o painel, e o hamburger continua à vista (é por ele que se fecha). 60 `resize` com a mesma largura: **0 leituras e 0 escritas**; uma mudança de largura: 1 escrita. 100 quadros de rolagem: 1 leitura de layout.

**Prova.** `node experimentos/provar-iphone.js` — **21 verificações**. CONTROLES NEGATIVOS contra o `HEAD` anterior: com o CSS de antes o painel corta **148px**; com o `nav.js` de antes, 60 `resize` produzem **60 leituras e 120 escritas**. E uma asserção que nasceu de um erro meu: a folha do controlo negativo tem de estar **aplicada** (>100 regras). A primeira versão servia-a com MIME de script, o Chrome recusava, a página saía sem estilo — e o controlo media uma página nua, isto é, aprovava pelo motivo errado.

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
