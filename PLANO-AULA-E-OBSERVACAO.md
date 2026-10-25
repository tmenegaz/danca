# A aula, o plano e a observação — o mapeamento

> **Data:** 25/10/2026 · **Natureza:** análise e plano. **Nenhum ficheiro de produto foi alterado.**
> **Origem:** o pedido — «o que eu lanço hoje não é claro o suficiente… os documentos que eu já estou
> a gerar, o plano de observação e o plano de ensino, têm assuntos misturados e eu preciso de separar
> isso semanticamente», «não tenho um ambiente onde não seja obrigado a preencher de novo todo o PO
> para fazer a aula 2», «não tenho onde é o local da aula».
>
> **O que este documento é.** O mapa do que existe hoje (com a evidência medida), a regra que separa
> os quatro documentos, e o plano por peças. **Não** é a implementação — as decisões que dependem de
> si estão na §9, numeradas.

> ### Nota de correção — 25/10/2026, mesmo dia
>
> A pesquisadora leu este documento e respondeu. **A §2.1 estava errada como diagnóstico:** a
> duplicação do «Contexto» na saída do PO **é proposital** — o professor elabora o plano de ensino
> num momento e o plano de observação noutro, e precisa dos valores à mão no documento. Os campos
> são **só de leitura** porque foram definidos na Produção. Não é sobreposição a corrigir; é desenho,
> e está certo. A primeira redação desta secção dizia «a segunda cópia é a que vai envelhecer» —
> está errado. O que envelhece é a leitura, não a cópia: a cópia é a garantia de que o professor não
> tem de abrir três documentos para saber de que turma se trata.
>
> **Cinco sobreposições continuam de pé** (§2.2 a §2.6). **Três perguntas da §9 foram respondidas**
> e passam a decididas; duas não se entenderam (a redação era minha, e era obscura) e continuam
> abertas, com os termos agora definidos. As emendas estão marcadas no corpo, com «EMENDA».

---

## 1. Os quatro documentos, e a pergunta que cada um responde

O sistema tem hoje quatro objectos que falam da mesma aula, e três deles foram nascendo por razões
diferentes, sem que ninguém dissesse qual é o dono de cada assunto.

| Documento | Fonte | O que é hoje | A pergunta que devia responder |
|:--|:--|:--|:--|
| **Plano de ensino** | `ciclo-XX-<escola>-plano.md` → `plano-XX.json` | 16 campos | **O que vou ensinar a esta turma, em que ordem, e como meço?** |
| **Plano de observação** | `ciclo-XX-<escola>-po.md` → `po-XX.json` | 22 campos | **O que vou olhar, em quem, contra que norma?** |
| **Aula** | `…-aula-NN.md` → `plano-aula-NN.json` | 13 campos, **só a 01 existe** | **O que acontece nesta aula, e o que quero ver acontecer?** |
| **Lançamento** | formulário → `…-dados.json` | 6 chaves por aula | **O que aconteceu, de facto?** |

**O que já funciona, e não está em causa.** O ciclo de vida da aula (planejada · dada · lançada · não
dada) está implementado e derivado do cronograma com o prazo — `ARQUITETURA-AULA.md` §1, com nota de
implementação de 27/09/2026. A aula que já aconteceu só se ajusta; o anterior fica como elo. Nada
disto se propõe mudar.

---

## 2. O que está misturado — cinco sobreposições medidas, e uma que é desenho

Não é uma impressão. Cada linha tem o ficheiro e o número.

**EMENDA — as cinco, em linguagem simples, porque a primeira redação não se entendeu.** A pergunta
que cada uma responde é sempre a mesma: *este pedaço de informação está no documento certo?* Quando
está em dois, um dos dois envelhece ou fica vazio.

| § | O que se repete | O que isso custa, em uma frase |
|:--|:--|:--|
| 2.2 | o nome «condições de contorno» | São **duas coisas** com o mesmo nome: o que o PO **declara** (o professor diz como a turma está) e o que a aula **mede** (1–5, naquele dia). Quem procura o termo encontra os dois e não sabe qual é qual |
| 2.3 | a sequência de exercícios do plano | O plano tem **14 linhas** — é o **acervo** do ciclo. A aula 01 imprime as 14. A aula 02, criada pelo mesmo caminho, imprime **as mesmas 14** — porque nada diz quais são as de hoje. O acervo é impresso como se fosse a escolha |
| 2.4 | a distribuição do volume | O plano diz 30/30/30/10. A aula **repete a secção e imprime uma tabela de uma linha** — só o total, 90 tempos — porque o dado já foi escrito doze linhas acima. Repete o título e perde o conteúdo |
| 2.5 | as condições preliminares | A mesma frase («sala com barra, espelho, som; piso adequado») aparece no plano e na aula. Duas cópias da mesma frase: quando a sala mudar, uma das duas fica errada |
| 2.6 | o guia de observação | A aula pede **`[Preencher]`** nas quatro dimensões. Os itens **já existem**, escritos, no PO. A aula pede outra vez o que já foi respondido — e ninguém responde |

A §2.1 é a sexta, e **não é defeito**: está emendada abaixo como desenho aprovado.

### 2.1 O «Contexto» do plano é repetido no PO — **e é de propósito** (EMENDA)

> **DECIDIDO pela pesquisadora, 25/10/2026.** «É proposital porque o professor pode elaborar o plano
> de ensino num momento e o plano de observação em outro. Mas aí ele precisa dentro do documento ter
> os campos ali que já estão preenchidos, o que é redundante de saída, né, pra ele saber qual é a
> turma, qual é a escola, esses valores que já estão ali redundantes, duplicados de saída, é de
> propósito.» E: «Esses campos não podem ser editáveis, porque a gente definiu eles lá na produção.
> Então eles são somente leitura, isso está certo.»
>
> **Esta secção deixa de ser um defeito e passa a ser a especificação de uma garantia:** a saída do
> PO **repete** o contexto, e a repetição é **só de leitura**. O que a torna correta é (a) o valor
> vir da Produção, não ser perguntado outra vez, e (b) não ser editável no PO. As duas coisas já
> valem. Não há trabalho a fazer aqui.

Segue-se a medição, que fica como registo do que se viu — não como lista de correções.

O plano tem uma tabela `## Contexto` com **12 itens**. O PO pergunta dois deles no Bloco 1
(**Professor responsável**, **Escola / espaço**) e recebe outros cinco por derivação (`field` e
`context` do `po-XX.json`):

```
Plano · Contexto (12)                    PO (formulário + derivado)
  Escola / espaço          ───────────►  Bloco 1 + field
  Professor responsável    ───────────►  Bloco 1
  Turmas observadas        ───────────►  field
  Frequência semanal       ───────────►  field
  Duração por aula         ───────────►  field
  Calendário               ───────────►  context
  Volume de trabalho       ───────────►  context
  Condição de registro     ───────────►  context
  Número total de aulas        (do ciclo)
  Metodologia de referência    (só do plano)
  Quem escolhe a metodologia   (só do plano)
  Notação dominada             (só do plano)
```

**8 dos 12 (66%) estão nos dois** — e é assim que deve ser. O schema do PO diz «O PO não duplica o
contexto dele — lê-o na geração», e essa frase continua válida para o **dado**: o PO não guarda uma
segunda cópia. A saída é que escreve as secções `## Campo empírico`, `## Contexto` e
`## Metodologia e notação`, e escreve-as com os valores da Produção, para leitura. **A distinção que
importa:** duplicação de *dado* seria um segundo lugar onde o valor pode divergir; duplicação de
*saída* é uma conveniência de leitura que se regenera. Só a primeira é defeito, e não existe aqui.

### 2.2 O quadro «Condições de contorno» existe com dois sentidos

| Onde | O que é | Estado medido |
|:--|:--|:--|
| PO, campo `condicoesDeContorno` (P-11) | as variáveis relacionais **declaradas** — interesse, ânimo, harmonia | `schema` descreve; é o que a aula vai medir |
| Lançamento, bloco `condicoes_contorno` | as mesmas variáveis **medidas**, 1–5, naquela aula | implementado |

São duas coisas legítimas com o mesmo nome. **Não se fundem** — uma declara-se no PO, a outra mede-se
na aula —, mas o nome tem de distinguir: `condicoesDeclaradas` no PO e `condicoesDaAula` no
lançamento. Hoje, quem procura «condições de contorno» encontra as duas e não sabe qual é qual.

### 2.3 A sequência da aula é a sequência do ciclo

`sequenciaDeExercicios` vive no **plano** (14 linhas: bloco × objetivo × conteúdo × tempos × compasso)
e a aula 01 manda imprimir a lista inteira. Se a aula 02 for criada pelo mesmo caminho, ela imprime
**a mesma lista** — porque não há nada que diga *quais destas 14 linhas são de hoje*.

O plano é **o acervo**; a aula é **a escolha**. Hoje o acervo é impresso como se fosse a escolha.

### 2.4 A distribuição de volume também

`distribuicaoDeVolume` (30/30/30/10) está no plano **e** na aula. E na aula está **vazia**: a secção
`## 6. Distribuição do volume físico` imprime só `| **Total** | **90** | **100%** |` — uma tabela com
uma linha. O dado existe, doze linhas acima, na secção 3.

### 2.5 As condições preliminares, idem

`## 2. Condições preliminares de preparação` na aula repete a `condicoesPreliminares` do plano
(«Sala com barra, espelho e aparelho de som; piso adequado.»). É a mesma frase nos dois documentos.

### 2.6 O guia de observação diz `[Preencher]` onde o PO tem os itens

A aula tem a secção `## 5. Guia de observação do professor` com quatro linhas —
`Técnica — Solo · Barra · Centro · Musicalidade` — e **as quatro dizem `[Preencher]`**. Os itens
existem, medidos, no `itensPorDimensao` do PO:

| Dimensão | Item (do PO) |
|:--|:--|
| Técnica — Solo | alinhamento do pé de apoio; eixo do corpo na preparação |
| Técnica — Barra | saída do calcanhar no tendu; quadril sem subir no en dehors |
| Técnica — Centro | transferência de peso sem perder a verticalidade; braço junto do movimento |
| Técnica — Musicalidade | resposta ao pulso na marcação; frase até o fim da música |

**O que a aula vai observar já está escrito** — no PO. A aula pede que se escreva outra vez, e ninguém
escreve. Há uma vista que sabe compor isto (`Vistas.guia`, `tools/lib-vistas.js`) e que **não é
gerada**: `DOCS="plano harmonizacao aula-01 captura-aula-01 notacao glossario-benesh referencias"` —
o `guia-de-observacao-01` não está lá.

---

## 3. O que falta na aula — e que não é pouco

O que existe numa aula, pelo desenho do plano, são **seis camadas**. O lançamento cobre uma e meia.

| # | Camada | Onde está declarada | Onde é registada |
|:--|:--|:--|:--|
| 1 | **O marco do dia** — o objetivo daquela aula | plano `marcosPorAula` | — |
| 2 | **A sequência** — exercícios × tempos × compasso | plano `sequenciaDeExercicios` | ✗ |
| 3 | **A música e o repertório** | plano `musicasVideos`, `repertorio` | ✗ |
| 4 | **O que se observa** — dimensões × itens | **PO** `itensPorDimensao` | ✓ (as marcas) |
| 5 | **As condições** — sala, materiais, duração | plano `condicoesPreliminares` | parcial |
| 6 | **O que fica** — o próximo passo | aula `proximoPasso` (`[Preencher]`) | ✗ |

### 3.1 Os três lugares vazios que se vêem na aula de hoje

- **`## 4. Bloco de musicalidade`** — `| Pulso | [Preencher: trabalho de pulso da Aula 01] |`. O bloco
  existe porque o plano tem «Musicalidade · 10%»; o conteúdo não vem de lado nenhum.
- **`## 5. Guia de observação`** — quatro `[Preencher]` (§2.6).
- **`## 9. Próximo passo`** — `[Preencher: o próximo passo da progressão do ciclo]`.

Os três são **deriváveis** (do plano, do PO, do marco seguinte). Nenhum é uma pergunta ao professor.

### 3.2 O registo da aula guarda seis coisas

```json
{ "data", "presentes", "ausentes", "duracao_min",
  "condicoes_contorno": { plano_seguido, animo, interesse, harmonia, mudou },
  "tecnica_solo", "tecnica_barra", "tecnica_centro", "tecnica_musicalidade", "linha_de_base",
  "relatorio": { texto, surpresas, ajustes }, "ultimo_lancamento" }
```

Nada disto é registado, e devia:

| Falta | Porque faz falta |
|:--|:--|
| **Sala** | o pedido, e a tabela de actividades (§7) |
| **Início e fim reais** | a folha impressa pede-os; o formulário só grava `duracao_min` |
| **A sequência executada** | o que foi dado, na ordem em que foi dado — hoje só cabe em «o que mudou», em prosa |
| **O que foi abandonado** | idem, e é a informação que a escola procura |
| **A música que tocou** | o plano declara o acervo; a aula não regista a faixa |
| **Os materiais** | a folha impressa tem as caixas (fotos · vídeo · áudio); o formulário não tem o campo |
| **O próximo passo** | existe como campo da aula, `[Preencher]`, e não é perguntado no lançamento |

**A divergência mais concreta:** a folha para impressão e o formulário electrónico pedem coisas
diferentes. A folha pergunta **Início**, **Fim**, **Estrutura executada**, **Abandonado** e
**Materiais**; o formulário não tem nenhum dos cinco. Quem lança no papel regista mais do que quem
lança no ecrã — e é o ecrã que guarda.

### 3.3 A linha de base não desliza — **EMENDA: a regra está confirmada; o que falha é o código**

> **DECIDIDO pela pesquisadora, 25/10/2026.** «O que eu entendi e que eu acho que está certo é que a
> linha de corte da aula N é o registo da última aula dada. Isso está correto, tá? Isso tá bem
> certo.»

**Em linguagem simples, porque a primeira redação não se entendeu.** Na aula 1, o professor mede as
alunas e obtém uma fotografia — é a **linha de base**. Na aula 2, ele quer comparar com o que a
**aula 1** registou, porque é isso que mostra progresso. Se o sistema comparar a aula 2 com a
fotografia **original**, do início do ciclo, o professor vê sempre «igual a Fevereiro» e não vê o que
a aula 1 mudou.

O `ARQUITETURA-AULA.md` §2 **escreve a regra certa**: a linha de corte da aula N é o registo da
última aula que teve dado. E o próprio documento admite que a regra «morre no documento».

**O que o código faz, medido:** o bloco `linha_de_base` do formulário de lançamento lê a
`linhaDeBase` do **PO** — a fotografia inicial, fixa. Ou seja, a aula 26 compara as alunas com o
estado do início do ciclo. **A regra está certa; a implementação é que não a segue.** Isto é a
peça 5 da §7.

---

## 4. A regra que separa — três perguntas, quatro documentos

A confusão não se resolve escolhendo melhor as palavras: resolve-se dando **um dono a cada facto**.
A regra que proponho tem três perguntas, por esta ordem:

> **1. Isto muda de aula para aula?**
> Não → é do **plano** (o acervo do ciclo). Sim → é da **aula** (a escolha do dia).
>
> **2. Isto é sobre a aluna, e não sobre o que se ensina?**
> Sim → é do **PO** (o que se olha, em quem, contra que norma).
>
> **3. Isto é o que se pretendia, ou o que aconteceu?**
> Pretendia → plano ou aula. Aconteceu → **lançamento**.

Aplicada, a regra resolve todas as sobreposições da §2 sem inventar um campo novo:

| Campo | Fica em | Porque |
|:--|:--|:--|
| Contexto institucional (escola, turma, professor, frequência, calendário, volume) | **plano** | não muda de aula para aula |
| Metodologia e notação | **plano** | idem — e o PO já diz que as lê de lá |
| Blocos da aula, distribuição de volume, condições preliminares | **plano** | idem |
| Marcos por aula | **plano** | é a progressão do ciclo |
| Fenómeno, pergunta, norma, dimensões e itens, sujeitos, linha de base | **PO** | é sobre a aluna e sobre o olhar |
| O marco de hoje, a seleção de exercícios, a música de hoje, o que quero ver hoje | **aula** | muda de aula para aula |
| As marcas por aluna, a sequência executada, a música que tocou, o que foi abandonado, os materiais | **lançamento** | aconteceu |

**O que isto muda nos documentos gerados** (a «consulta rápida» que pediu):

- o **documento do PO** deixa de escrever `## Campo empírico`, `## Contexto` e `## Metodologia e
  notação` como secções próprias; passa a ter uma linha **«Vem do plano de ensino `plano-…`»**, com o
  link — que é o mesmo lastro que a barra já mostra;
- o **documento do plano** deixa de se chamar «Contexto» a uma tabela que é a **ficha do ciclo**;
- a **aula** deixa de reimprimir as condições preliminares, a distribuição de volume e a sequência do
  ciclo: mostra **o que é de hoje** e remete o resto;
- e a aula **ganha** o guia de observação preenchido — do PO, não de uma pergunta.

---

## 5. A aula 2..N — o problema, medido

### 5.1 O que existe hoje

O calendário produz **26 lugares** de aula, com data, hora, duração e prazo (`ciclos.json`). Desses 26:

- **3 têm marco** (o `marcosPorAula` do plano tem três linhas, para um ciclo de 26 aulas);
- **1 tem plano** (`aula-01.md`, a única fonte da família);
- **1 tem folha de captura** (`captura-aula-01.md`);
- **23 não têm marco, nem plano, nem folha.**

Na lista de aulas, as 26 linhas aparecem, e **só a primeira tem «Abrir a aula»**. As outras 25 têm
apenas **«Lançar»**, e todas levam ao **mesmo** `lancamento.html`.

### 5.2 O que acontece quando se lança a aula 02

O formulário procura o config da aula (`captura-aula-02.json`); não existe, e cai no do ciclo
(`captura-01.json`). E o `captura-01.json` **é a folha da aula 01** — o campo `folha` dele diz
`…-captura-aula-01.md`, e os blocos são os da aula 01, com as colunas da aula 01.

**Medido:** lançar a aula 02 apresenta as colunas da aula 01. É o «Defeito 1» do
`ARQUITETURA-AULA.md` §4.1, que foi corrigido **para as aulas que têm folha** — e nunca houve uma
segunda.

### 5.3 Porque é que não há uma segunda

O escritor do ciclo (`motor/servidor/escrever-ciclo.js`, `docsGerados`) conhece **exactamente**
`['plano', 'harmonizacao', 'aula-01', 'captura-aula-01', 'notacao', 'glossario-…', 'referencias']`.
Não há caminho que produza a aula 02. A máquina está pronta — o `DOCS` expande `aula-*` para todo NN
que existir no disco, e o `gerar-ciclo.sh` gera o pacote de qualquer uma — mas **ninguém escreve a
fonte**, e não há sítio onde o professor a escreva.

### 5.4 O desenho

> **EMENDA — 25/10/2026, o que a pesquisadora decidiu.** Três coisas mudam o desenho abaixo.
>
> **(a) A aula 2..N nasce por um botão, e os documentos nascem vazios.** «A gente tem que ter um botão
> pra criar a aula 2 e aí tem que gerar esses documentos, mesmo que vazios num primeiro momento, né?
> Pra gente ter o objeto.» Ou seja: não se espera que o professor preencha tudo para a aula existir —
> o **objeto** nasce primeiro, com identidade, e o conteúdo entra depois. É a inversão do que o
> código faz hoje, onde a aula só existe quando a fonte está escrita à mão.
>
> **(b) A aula nasce COM marco — o plano passa a exigi-lo.** «Nasce com o marco, tá? Não dá pra ter sem
> sala.» **Atenção a uma confusão de vocabulário que é minha, não sua:** «marco» aqui **não é a sala**.
> Marco é o **objetivo específico daquela aula** — o que o plano declara em `marcos-por-aula`, como
> «transferir o peso entre os pés sem perder o alinhamento». A **sala** é outro campo, e o senhor tem
> razão nos dois: a aula precisa dos dois. Mas a resposta resolve a pergunta 1: **o plano passa a
> exigir um marco por aula** (opção *b* da §9), e a regra 3 abaixo **cai**.
>
> **(c) A aula N tem de confirmar o alinhamento com o PO.** «Eu não posso fazer um PO de uma natureza e
> elaborar uma aula que é completamente divergente daquele PO… o professor é lembrado de qual é o PO, e
> ele marca que concorda, que entendeu, que está alinhado com o PO, e aí sim ele elabora a aula N. Eu
> acho que para cada aula ter isso como um protocolo.» **Requisito novo**, sem equivalente no código de
> hoje: um passo de confirmação, antes de a aula ser editável.
>
> E a **herança da sequência** fica mista (pergunta 3): a aula herda as 14 linhas, **editáveis**, e o
> professor pode acrescentar outras — não é um selector que obriga a escolher, nem uma herança cega.

> **A aula é filha do PLANO DO CICLO, e não do PO.** Ela não pode existir solta, porque o plano é
> quem tem o marco, a turma, o professor, a metodologia e os itens. E cada campo da aula é **o delta**
> em relação ao que herda.

```
PO ──(1:1)──► Plano do ciclo ──(1:N)──► Aula NN ──(1:1)──► Lançamento
                    │                      │
                    │  marco NN            │  o que é de HOJE:
                    │  turma, professor    │   · a seleção de exercícios
                    │  blocos, volume      │   · a música
                    │  rubrica             │   · o que quero ver hoje
                    │  itens (via PO)      │   · o próximo passo
                    │  sala (do evento)    │   · o alinhamento com o PO ✋
```

**A herança, campo a campo:**

| Campo da aula | De onde vem | Editável? |
|:--|:--|:--|
| turma, professor, ciclo, duração | plano (`contexto`) | não — é o mesmo em todas |
| blocos, volume, condições preliminares | plano | não |
| **marco do dia** | plano (`marcosPorAula[n]`) — **agora obrigatório** | sim, enquanto `planejada` |
| **sala** | o evento do calendário | sim, **até ao prazo** da aula |
| **sequência de hoje** | plano (`sequenciaDeExercicios`) — herda as 14, **editáveis**, e pode acrescentar | sim |
| **música de hoje** | plano (`musicasVideos`) — escolhe-se | sim |
| **o que quero ver hoje** | PO (`itensPorDimensao`) — escolhe-se as dimensões | sim |
| **próximo passo** | a aula anterior + o marco seguinte | sim |
| **linha de base** | PO (aula 1) · **o registo da última aula dada** (aula N) | não — é derivada |
| **alinhamento com o PO** | confirmação explícita do professor | sim, uma vez, antes de editar ✋ |

**As três regras que fecham o «não pode ser órfão»:**

1. uma aula **existe dentro de um ciclo** e é numerada por ele — não há aula sem ciclo, nem ciclo sem
   plano;
2. a **relação entre duas aulas** só existe dentro do mesmo ciclo (a mesma escola, o mesmo professor,
   o mesmo plano) — é a chave que impede a aula 3 de um ciclo herdar a linha de base de outro;
3. ~~a aula que não tem marco não é uma aula: é um lugar do calendário~~ — **EMENDADA.** A aula nasce
   com marco, e o plano tem de declarar um por aula. **Não há aula sem marco:** o que há é lugar de
   calendário à espera de que o plano declare o marco. A distinção sobrevive, mas muda de lado: a
   lista mostra os 26 lugares, e um lugar **sem marco** diz «falta o marco» em vez de oferecer
   «Abrir» — porque abrir produziria uma aula vazia de sentido pedagógico.

**O estado na lista** (derivado, sem campo novo — `ARQUITETURA-AULA.md` §1):

| Estado | O que a linha diz | O que a linha oferece |
|:--|:--|:--|
| `sem marco` | «Lugar do calendário — sem marco» | *Definir o marco* |
| `planejada` | marco + data + «planejada» | **Abrir a aula** |
| `dada` | «a aula já aconteceu» | **Lançar** |
| `lançada` | «lançada em …» + o registo | Abrir o registo · Ajustar |
| `não dada` | «passou o prazo sem registo» | — |

**O que o professor faz para a aula 2:** abre a lista, vê o lugar 02 com o marco que o plano já
declarou, e toca em **Abrir a aula**. A aula 02 nasce com a turma, o professor, os blocos, o volume, a
rubrica e os itens do PO **já preenchidos**, com a sequência do plano à escolha e o marco do dia. Ele
decide **o delta** — e não preenche o PO outra vez.

---

## 6. A sala

**A sala não é da aula: é do evento.** O `PLANO-TABELA-DE-ATIVIDADES.md` §3.1 cria os espaços
(`bastidores/<escola>/espacos`) e §3.3 a relação turma ↔ espaço
(`bastidores/<escola>/turma-programacao`); §1.7 já declara a lacuna — «a turma não tem sala; sem uma
relação nova, nenhuma aula apareceria com «Sala»». Uma aula é um evento de `categoria: "aula"` com
`espacoId`.

Portanto a aula **não ganha um campo `sala`**. Ganha uma **resolução**, nesta ordem:

```
1. o evento daquela aula (turma + data + início) → espacoId
2. a programação da turma (turma-programacao)    → espacoId
3. nada                                          → «não declarada»
```

É a mesma forma que a turma do PO na listagem (24/10/2026): o dado não se copia, resolve-se na
leitura. E enquanto a frente da tabela não existir, a resolução devolve o passo 3 — «não declarada»,
que é o que a listagem das aulas já diz hoje e o que a aula passa a dizer.

**O que a aula precisa de acrescentar agora:** uma linha `Sala: <nome>` no cabeçalho, alimentada pela
resolução. **Zero campos novos** enquanto a frente da tabela não entrar.

---

## 7. O plano, por peças

Ordenadas por dependência — cada uma destrava a seguinte. As que têm ✋ dependem de uma decisão da §9.

### Peça 1 — A separação semântica dos documentos (sem código de produto novo)

- `## Contexto` do plano → **«Ficha do ciclo»** (é o que ela é), e é a única cópia.
- O documento do PO **não** escreve `## Campo empírico`, `## Contexto`, `## Metodologia e notação`:
  escreve uma linha de lastro — «Vem do plano de ensino `plano-…`» com link.
- O PO deixa de **perguntar** no Bloco 1 o professor e a escola (vêm do plano referenciado); o Bloco 1
  fica com **Horizonte** e **Plano de ensino**.
- `condicoesDeContorno` (PO) → `condicoesDeclaradas`; `condicoes_contorno` (lançamento) →
  `condicoesDaAula`. Aditivo e retrocompatível na leitura.

**Destrava:** os dois documentos ficam com um assunto cada, e a «consulta rápida» passa a funcionar.

### Peça 2 — A aula herda, e só o delta é dela ✋

- A aula nasce do plano: turma, professor, ciclo, duração, blocos, volume, condições preliminares,
  rubrica e itens do PO **preenchidos**.
- `## 2. Condições preliminares` e `## 6. Distribuição do volume` **saem** da aula (são do plano, e
  uma delas imprime hoje uma tabela de uma linha).
- `## 5. Guia de observação` passa a ser **composto** do `itensPorDimensao` — não `[Preencher]`.
- `## 3. A sequência conectada` passa a imprimir **as linhas escolhidas** para aquele dia, e não as 14.

**Destrava:** a aula fica legível, e o professor vê nela o que vai observar.

### Peça 3 — O ambiente da aula N ✋

- A lista de aulas passa a ter o **estado** por linha (§5.4) e a acção certa em cada uma.
- «Abrir a aula» cria a fonte `…-aula-NN.md` a partir do que herda, e a folha `captura-aula-NN.md` a
  partir do PO (dimensões × itens × sujeitos), com o marco do dia.
- O escritor do ciclo passa a conhecer a família (`aula-*`, `captura-aula-*`) e não só a `01`.
- O fallback do formulário **deixa de usar a folha da aula 01** para outra aula: sem folha própria, a
  aula não abre para lançamento — diz porquê.

**Destrava:** a aula 2 existe, e não é um clone da 1.

### Peça 4 — O lançamento passa a registar o que aconteceu ✋

Campos novos, todos **aditivos** (o registo antigo continua legível):

| Campo | Tipo | Porque |
|:--|:--|:--|
| `inicio`, `fim` | `HH:MM` | a folha impressa já os pede |
| `sequenciaExecutada[]` | `{ bloco, conteudo, objetivo, tempos }` | o que foi dado, na ordem |
| `abandonado[]` | texto | a folha já pergunta; hoje só cabe em prosa |
| `musica` | texto | a faixa que tocou |
| `materiais[]` | `fotos · video · audio · comentario` | a folha tem as caixas; o formulário não |
| `proximoPasso` | texto | fecha a aula e abre a seguinte |
| `linhaDeBaseDe` | `aula-NN` | **qual** registo é a linha de corte (§3.3) |

**Destrava:** a folha impressa e o formulário passam a pedir o mesmo, e o papel deixa de guardar mais
do que o ecrã.

### Peça 5 — A linha de base desliza ✋

- O bloco `linha_de_base` do lançamento da aula N lê **o registo da última aula dada** (por ordem de
  lançamento), e não a fotografia do PO. A aula 1 continua a ler o PO.
- `linhaDeBaseDe` grava qual foi, para o documento poder dizer de onde veio.

**Destrava:** a regra que o `ARQUITETURA-AULA.md` §2 já declara, e que hoje morre no documento.

### Peça 6 — A sala (quando a tabela de actividades entrar)

- A resolução da §6, na aula e na listagem.
- Nenhum campo novo na aula.

### Peça 7 — O passo de alinhamento com o PO ✋ *(nova, 25/10/2026)*

Nasceu da resposta à pergunta 5, e não estava no plano original.

- Antes de a aula N ser editável, um passo que recorda **qual é o PO** daquele ciclo (a turma, o
  professor, as dimensões e os itens) e pede uma confirmação explícita: «esta aula está alinhada com
  este plano de observação».
- **Porque não é burocracia:** o PO é o compromisso pedagógico do ciclo. Uma aula que divirja dele não
  é uma aula do ciclo — é outra coisa, e ninguém saberia. O passo torna a divergência impossível por
  omissão.
- **O que ainda não está decidido** (pergunta 7, §9): a frequência da confirmação (por aula ou por
  ciclo), o que acontece se não houver confirmação, e se o registo entra na âncora de proveniência ou
  fica só como estado de interface.
- **Onde entra na ordem das peças:** depois da peça 3 (o ambiente da aula N) e antes da 4 (o
  lançamento), porque sem o ambiente não há onde confirmar.

---

## 8. O que a mudança custa

| Peça | Congelados tocados | Risco |
|:--|:--|:--|
| 1 | `tools/templates/` (se a remoção de secções for no gerador) + os schemas do PO | baixo — é texto e leitura aditiva |
| 2 | `ciclo-01-aula-schema.json` (por professor) | médio — a fonte da aula 01 muda de forma |
| 3 | `escrever-ciclo.js`, `geracao.js`, `lancamento.html` | médio — é o caminho de escrita |
| 4 | `ciclo-01-captura-schema.json`, `lancamento.html`, `lancamento.js` | **alto** — mexe no que se grava; o registo antigo tem de continuar a ler-se |
| 5 | `lancamento.html` | médio — muda o que a aula N compara |
| 6 | `bastidores.js` (a frente da tabela) | baixo |

**A âncora.** As peças 1–3 mudam **fontes** (o `.md` da aula 01, o do PO). Cada uma exige
`tools/hash-ciclo.sh` e a reancoragem — que é o `reancorar.yml` a fazer, como sempre. O que **não**
muda: a fórmula do hash, a cobertura, os validadores e as 17 regras.

---

## 9. O que ficou decidido, e o que continua aberto

> **Emenda de 25/10/2026, mesmo dia.** As seis perguntas foram lidas e respondidas. Três fecharam,
> uma fechou pela metade (por uma confusão de vocabulário que era minha), e duas não se entenderam.
> Fica registado o que cada uma virou — e, nas que não se entenderam, o termo agora definido.

### Fechadas

**1. O marco das 23 aulas — DECIDIDA: o plano passa a exigir um marco por aula.**
«Nasce com o marco, tá? Não dá pra ter sem sala.» É a opção *(b)*. **Com uma ressalva de leitura:** o
senhor aproximou «marco» de «sala», e não são a mesma coisa — o marco é o *objetivo específico da
aula* (`marcos-por-aula`, ex.: «transferir o peso entre os pés sem perder o alinhamento»); a sala é o
*lugar*, que vem do evento. A decisão fecha para os dois: **cada aula precisa de marco e de sala**, e
a diferença é que o marco vem do plano e a sala vem do calendário.

**3. A herança da sequência — DECIDIDA: mista.** «Herdar a sequência inteira e ser editável é bom,
torna prático o processo e a possibilidade de acrescentar outras.» Herda as 14 linhas, **editáveis**,
e pode acrescentar. Não é selector obrigatório nem herança cega.

**5. Com o que a aula N compara — DECIDIDA: com o registo da aula anterior, e alinhada ao PO.**
«A aula N ela vai comparar com o registro da aula anterior… e ela tem que estar alinhada com o PO,
porque ela pertence ao mesmo PO.» **E acrescentou um requisito que não existia:** «o professor é
lembrado de qual é o PO, e ele marca que concorda, que entendeu, que está alinhado com o PO, e aí sim
ele elabora a aula N. Eu acho que para cada aula ter isso como um protocolo.» É a **peça 7** (§7).

### Abertas, porque a pergunta era obscura

**4. Os três `[Preencher]` da aula — ABERTA, com o termo definido.**
A pergunta era: na aula de hoje há três lugares que pedem para escrever à mão —

- `## 4. Bloco de musicalidade` → `[Preencher: trabalho de pulso da Aula 01]`
- `## 5. Guia de observação` → **quatro** linhas `[Preencher]`, uma por dimensão
- `## 9. Próximo passo` → `[Preencher: o próximo passo da progressão do ciclo]`

— e os valores que os preencheriam **já estão escritos** no plano (a música) e no PO (os itens de
observação). «Derivados», na pergunta, queria dizer: *o sistema preenche estes três lugares sozinho, a
partir do plano e do PO, e o professor deixa de ser questionado sobre eles*. A pergunta é se concorda
com isso, ou se algum deles deve continuar a ser perguntado.

**6. `materiais` — ABERTA, com o termo definido.**
«Materiais» são as caixas da folha de captura impressa, no fecho da aula:

> **Materiais** ☐ fotos ☐ vídeo ☐ áudio ☐ comentário: `______`

É a marcação do que se recolheu como evidência naquela aula. **A folha tem; o formulário electrónico
não tem** (zero ocorrências em `motor/nucleo/lancamento.js`). A pergunta é se o campo entra no
formulário, ou se sai da folha.

### Uma pergunta nova, que a resposta 5 abriu

**7. O passo de alinhamento com o PO.** Antes de a aula N ser editável, o professor confirma que
lembra o PO e que a aula está alinhada com ele. **Perguntas que ficam:** é uma marcação por aula
(26 confirmações num ciclo) ou uma por ciclo, com renovação quando o plano muda? O que acontece se ele
não confirmar — a aula não abre, ou abre com um aviso? O registo da confirmação é dado de proveniência
(entra na âncora) ou só de interface?

---

## 10. O que fica fora

- **O painel da escola** (`ARQUITETURA-AULA.md` §7) e a retenção — frente própria.
- **A tabela de actividades pública** — `PLANO-TABELA-DE-ATIVIDADES.md`; esta análise só **consome** a
  sala dela.
- **A avaliação por rubrica no lançamento.** A rubrica existe no plano (critérios × níveis) e o
  `rubrica.aplicadaEm` é lacuna declarada («Aplicada na Aula 11 (formativa) e na Aula 12
  (somativa)»). Marcar a rubrica por aluna é uma frente em si — e a fronteira da avaliação está
  declarada fora do escopo do protótipo.
- **A harmonização** — saiu para a Produção em 23/10/2026.

## Referências

- `ARQUITETURA-AULA.md` — o ciclo de vida (§1), a linha de corte (§2), o índice por aula (§4), as
  peças na ordem (§10)
- `ARQUITETURA-CAPTURA.md` — o modelo de dados (§2), o fluxo (§3)
- `PLANO-TABELA-DE-ATIVIDADES.md` — os espaços (§3.1), os eventos (§3.2), a relação turma ↔ espaço
  (§3.3)
- `IDENTIDADE-VISUAL.md` — as peças, se a lista de aulas ganhar estado por linha
