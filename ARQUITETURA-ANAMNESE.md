# Arquitetura — a anamnese de balé clássico

> **Resumo (para o HANDOFF):** Desenho da malha de anamnese de balé clássico como **conteúdo do
> PO** (domínios de alinhamento ósseo, flexibilidade passiva, força ativa e potência, sistema
> vestibular, orientação espacial e lateralidade), com **ramificação condicional** pelo nível
> declarado (Básico, Intermediário, Avançado) e **soberania de CRUD autoral** do professor — o
> **recipiente** é do PE, o **conteúdo** é do PO.

> **Estado:** Especificação de arquitetura (sem alteração de código ou arquivos congelados).

> **Escopo:** Onde a anamnese se apoia no que já existe (P-08, P-10, P-16, P-20, P-22); a
> separação estrita PE × PO para a anamnese; os domínios declarados; a ramificação condicional;
> o CRUD autoral e o seu limite; onde o dado vive e sob qual política; o que precisará descongelar.

> **Leia antes de citar.** Este documento é do **Projeto Ciclo** — a memória da aula dada,
> **protótipo testado no universo da dança** (não é agnóstico: o projeto agnóstico será criado a
> partir dele). O **FIPP não é implementado aqui**: a proveniência deste repositório é a **âncora
> encadeada** (`tools/hash-ciclo.sh` → `.fipp`), uma **aproximação** do framework. O PE descrito
> abaixo **não roda neste repositório**. **Nada aqui está implementado**: não existe, hoje, nenhum
> artefato de anamnese neste repositório — o que existe é o **lugar normativo** onde ela cabe, e é
> ele que este documento mede. Nada aqui altera código: é desenho, e o que ele toca está
> declarado na §8.

## 1. Por que este documento existe separado do `ARQUITETURA-PE.md`

O [`ARQUITETURA-PE.md`](ARQUITETURA-PE.md) desenha **a integração**: o recipiente, a descoberta, o
espelhamento de diretórios e a classificação prosa × chave-valor. Ele é **agnóstico de conteúdo** —
e é por isso que ele não pode conter a anamnese.

A anamnese é o caso em que a distinção PE × PO deixa de ser uma frase de arquitetura e passa a ser
uma **decisão sobre o que se pergunta a uma aluna de balé clássico**. Ela não cabe no documento da
integração porque a integração não sabe o que é um *grand plié* — e não deve saber (§2 do
[`ARQUITETURA-PE.md`](ARQUITETURA-PE.md)).

O corte entre os dois documentos é, então:

| Documento | Responde | Não responde |
|:--|:--|:--|
| [`ARQUITETURA-PE.md`](ARQUITETURA-PE.md) | **Como** o PO e o PE se encontram, se descobrem e trocam dados | O que se pergunta, a quem, em que ramo |
| **este documento** | **O que** se pergunta na anamnese, como ramifica e quem pode editá-lo | Onde o PE mora no disco, como é descoberto |

### 1.1 A continuidade: a anamnese não é invenção

Isto é o achado que organiza todo o resto. A malha de anamnese **não introduz norma nova**: ela
**aprofunda pontos que as pétreas já alcançam**. Medido em [`PROTOCOLO.md`](PROTOCOLO.md):

| Pétrea | O que ela já diz | O que a anamnese acrescenta |
|:--|:--|:--|
| **P-16** | "**Metodologia e notação são declaradas na eliciação.**" A eliciação pergunta *que metodologia*, *que notação* e *quem define* | É a pétrea que **autoriza o ramo RAD/Vaganova**: o método de origem é **perguntado**, nunca deduzido (§5.3) |
| **P-10** | "O PO declara a linha de base dos sujeitos… o que trazem, o que falta, o que já dominam. Sem linha de base, 'evolução' não [se mede]" | A anamnese é a **fonte declarada** dessa linha de base, por sujeito |
| **P-22(a)** | Restrições físicas (lesões, dores, limitações médicas) são **"declaradas no PO antes do ciclo (na linha de base por sujeito)"** | É o **precedente exato** de um campo clínico-adjacente já obrigatório na linha de base (§7) |
| **P-20** | "**Problemas semelhantes recebem soluções semelhantes.**" Vale para "posterior, adutor, rotadores, coordenação braço-perna, **hiperlordose**" | O vocabulário da anamnese **já está em norma**, e a biblioteca de critérios autorais é o lugar natural da solução que viaja (§6.2) |
| **P-08** | "Os campos do ciclo são declarados em schema… **Isso formaliza o que o paper do mestrado chama de 'formulário dinâmico'**" | A malha é **campo declarado**, não campo livre (§4.3) |

E há o precedente de **forma**, medido em [`prompts/eliciar-ciclo.md`](prompts/eliciar-ciclo.md)
**Bloco 3 — Alunas**, que já pergunta faixa etária, nível, apelidos estáveis e **restrições
físicas** — este último com a nota explícita de que a informação "é declarada por **P-22**. Ela não
será avaliada; será registrada".

**Leitura deste documento:** o Bloco 3 é uma **proto-anamnese de cinco linhas**. A anamnese de balé
clássico é o que acontece quando esse bloco é levado a sério para uma técnica que **tem** domínios
mensuráveis. Nada do que segue contradiz o Bloco 3; tudo o que segue o aprofunda.

## 2. A separação estrita para a anamnese

### 2.1 A linha, em uma frase

**O PE fornece o recipiente; o PO fornece o conteúdo — e a anamnese é conteúdo integralmente do
PO.**

O PE não sabe o que é um *tendu*, um joelho valgo ou um *demi-plié*; ele não tem opinião sobre se a
pergunta de flexibilidade passiva deve vir antes da de potência. O que ele oferece é a
**engenharia**: como construir, persistir e versionar uma elicitação em JSON, como ramificar, e
como registrar a proveniência da elicitação.

### 2.2 Fronteira — o que fica de cada lado

| | **PE** — o recipiente | **PO** — o conteúdo |
|:--|:--|:--|
| **O que é** | O motor estrutural genérico e **agnóstico** | A implementação **aplicada**, deste repositório |
| **Anamnese: o que é dele** | O **envelope** que hospeda a malha; a mecânica de **ramificação** (o como saltar de um nó para outro); a **persistência** em JSON; a **proveniência da elicitação** | Os **domínios** (§4); as **perguntas**; os **ramos** e os seus **gatilhos** (§5); os **critérios**; a **biblioteca autoral** (§6) |
| **Não é dele** | A semântica dos campos; o que é "valgo"; o vocabulário do balé; a decisão de o que perguntar | Onde o dado mora; como é ancorado; como é descoberto |
| **Teste** | Se a anamnese fosse de matemática, este lado **não mudaria** | Se a anamnese fosse de matemática, **todo** este lado mudaria |

### 2.3 Provas medidas de que a fronteira já existe

**Prova 1 — "Quem manda nos campos é o PO, não o schema".** É a declaração literal do cabeçalho de
[`tools/validar-dados-ciclo.js`](tools/validar-dados-ciclo.js). Ela **já resolve** a tentação de o
PE ditar campos: o schema declara, mas quem manda é o PO. Um PE que impusesse um campo de anamnese
estaria violando a fronteira por cima de uma regra já escrita.

**Prova 2 — os schemas são `additionalProperties`.** Medido nos cinco schemas de ciclo
(`po`, `plano`, `captura`, `aula`, `dados`). Um campo autoral **não quebra** o schema. A questão,
portanto, não é de validade — é de **declaração** (P-08) e de **cobertura da âncora** (§8).

**Prova 3 — `po-schema.json` já declara o lugar.** O schema do PO declara, como **obrigatórios**,
`subjects`, `linhaDeBase`, `norma` e `condicoesDeContorno`. As descrições dos próprios campos o
dizem:

- `linhaDeBase` — "P-10 — linha de base dos sujeitos… É uma TABELA DE DIMENSÕES no documento: a
  regra de tabela do contrato (2026-09-20) faz cada linha de dados virar um OBJETO, com o cabeçalho
  como chaves. **Sem ela, 'evolução' não tem referencial.**"
- `norma` — "**Quem escreve este campo é a entrevista, nunca a dedução**: enquanto a norma não for
  elicitada, o campo fica `[Preencher: norma — …]`".

**Consequência direta:** a anamnese **não precisa de schema novo**. Ela **aninha-se dentro da forma
do PO que já existe**, e por isso **satisfaz a P-08 em vez de arranhá-la**. Quem tentar criar um
`anamnese-schema.json` paralelo está criando um segundo dono para o mesmo dado.

### 2.4 O que o PE herda, uma vez que o conteúdo é do PO

A herança é a mesma que o [`ARQUITETURA-PE.md`](ARQUITETURA-PE.md) §2.4 já fixou. Aplicada à
anamnese:

1. **A forma do envelope**, não os seus campos.
2. **A árvore do professor** (§5 do [`ARQUITETURA-PE.md`](ARQUITETURA-PE.md)): a anamnese é do
   professor (P-13), não do projeto.
3. **A regra da P-12**: o sujeito entra por **apelido estável**, e o apelido "substitui nomes
   completos; **não os acompanha em nenhum arquivo do repositório**". A anamnese é o documento
   onde essa regra mais custa — e é onde ela mais importa (§7).
4. **A proveniência que acrescenta, não edita** (P-03/P-04).
5. **A degradação graciosa** (§3 do [`ARQUITETURA-PE.md`](ARQUITETURA-PE.md)): sem PE, a anamnese
   continua existindo — só deixa de ter o envelope.

## 3. A observação inicial: os elementos basilares do balé clássico

### 3.1 A norma do domínio

A linha de base zero do balé clássico exige uma **observação inicial obrigatória**, que passa
pelos **elementos basilares** do domínio. Esta exigência é **norma do domínio** — não é pétrea do
PE, e não vale para outras áreas. O PE exige que a linha de base seja declarada (P-10); o domínio
do balé clássico **define o que ela observa**. Em outra área, a linha de base zero terá outros
elementos basilares, e a obrigação de declará-los será daquela norma de domínio.

A observação **não é ensino**. A anamnese não ensina as posições, o `tendu` ou o `passé`; ela
**verifica o que já existe** no corpo do sujeito. O professor observa; não instrui.

### 3.2 A lista mínima

Os elementos basilares do balé clássico são **seis**, e têm três naturezas distintas:

| Natureza | Elemento | O que é |
|:--|:--|:--|
| **Fundamento** | **`en dehors` (rotação externa)** | A rotação externa da perna — o *turnout*. É a base de todos os outros elementos |
| **Vocabulário** | **As cinco posições** | 1ª, 2ª, 3ª, 4ª e 5ª — dos pés e dos braços |
| **Vocabulário** | **O `tendu`** | À frente, ao lado e atrás |
| **Vocabulário** | **O `passé`** | O pé que sobe pela perna de apoio até a altura do joelho |
| **Vocabulário** | **A meia ponta** | A subida sobre os metatarsos |
| **Qualidade** | **A musicalidade** | A relação do corpo com o tempo, o compasso e a frase musical |

O `en dehors` é o primeiro porque é **fundamento**: sem rotação externa, não há quinta posição,
não há `tendu` nem `passé` na acepção clássica. Os elementos de vocabulário **pressupõem** o
fundamento. A musicalidade é de outra natureza — ela **atravessa** todos os outros.

### 3.3 A lista é aberta

Os seis elementos são o **mínimo obrigatório** — não o teto. O professor **acrescenta** os
elementos que o método declarado exigir (P-16: metodologia e notação são declaradas na eliciação).
A lista é **aberta**: o que é obrigatório é que os seis estejam presentes; o que é discricionário
é o que se acrescenta a eles.

### 3.4 A dupla presença da musicalidade

A musicalidade aparece **duas vezes** na anamnese — como elemento basilar (§3.2) e como domínio
(§4, a malha de domínios). Não é duplicação; são **momentos distintos** do mesmo trabalho:

- **Como elemento basilar:** é verificada na **linha de base zero**. Observa-se o que a aluna
  **traz** — a relação dela com o tempo, o compasso e a frase musical, antes de qualquer trabalho.
- **Como domínio:** é **aprofundada** ao longo do ciclo. O domínio *Musicalidade* trabalha o que a
  linha de base registrou como estado inicial.

A primeira é **estado**; a segunda é **trabalho**. A linha de base **declara o ponto de partida**;
o domínio **conduz o percurso**.

### 3.5 Os desdobramentos

Cada elemento basilar admite **formas distintas de verificação**. São exemplos — não uma lista
fechada:

- **Com toque:** o professor posiciona a aluna (por exemplo, sustentando o `arabesque` para
  observar o arco das costas e a flexibilidade do quadril).
- **Com a barra como apoio:** a aluna usa a barra como instrumento, sem contato do professor (por
  exemplo, para verificar até onde a perna sobe por consciência própria).
- **Por consciência própria:** a aluna executa o movimento e declara a própria percepção, sem apoio
  e sem toque.

O professor **escolhe a forma** conforme o que observa e conforme a relação que estabelece com a
aluna. O que importa não é a forma escolhida, mas a **declaração** do que se observou.

### 3.6 A função: os quatro perfis de entrada

A observação inicial serve para **posicionar** a aluna e **orientar** o trabalho. O que ela
verifica depende do que a aluna traz:

| Perfil de entrada | O que a observação verifica |
|:--|:--|
| **Iniciante total** (nunca fez balé) | O **entendimento** dos elementos — o que a aluna compreende, mesmo sem prática |
| **Com experiência prévia** | O **quanto os elementos se tornaram corpo** — a técnica incorporada |
| **Com experiência declarada alta** | **Para que turma** a aluna vai — observando os elementos e os seus desdobramentos |
| **Experiente, mas afastada** | **Que turma a recebe** e **como ajudá-la na retomada** — os grupos musculares profundos, a postura, a percepção espacial |

A anamnese **não avalia**. Ela **declara o estado inicial**; a decisão sobre a turma e sobre o
trabalho é do **professor**. É o mesmo corte que separa o registro da avaliação no
`ARQUITETURA-AULA.md` e no `AGENTS.md`.

### 3.7 Onde o dado vive

Os elementos basilares **caem dentro da `linhaDeBase`** que já existe. **Nenhum campo novo é
criado** — a P-08 permanece satisfeita sem tocar no `po-schema.json`. A forma canônica da linha de
base (`{aluno, traz, precisaDesenvolver}`, `campo/README.md`, 26/09/2026) continua valendo; os
elementos basilares são **dimensões** dentro dela.

### 3.8 O que fica fora

A observação inicial **não decide** para que turma a aluna vai, nem o que se trabalha com ela. Ela
**registra** o que se observou. A decisão é do professor, e a anamnese é o **insumo** dessa
decisão — não o seu substituto.

## 4. A malha de domínios declarados

### 4.1 Os domínios

A malha é **exaustiva por declaração**, não por padrão: cada domínio abaixo é um campo declarado, e
a ausência de resposta é uma **lacuna explícita** (`[Preencher: …]`), nunca um vazio silencioso.

| # | Domínio | O que se declara | Onde ancora |
|:--|:--|:--|:--|
| 1 | **Identificação** | Apelido estável; faixa etária; tempo de prática; escola | `subjects` (P-12); Bloco 3 |
| 2 | **Alinhamento ósseo** | Joelhos (valgo / varo), quadril | `linhaDeBase` — dimensão `Técnica` |
| 3 | **Flexibilidade passiva** | Isquiotibiais; adutores; adutores e costas | `linhaDeBase` — dimensão `Funcional` |
| 4 | **Força ativa e potência** | *Demi/grand plié*; saltos; flexões; tração na barra | `linhaDeBase` — dimensão `Funcional` |
| 5 | **Sistema vestibular** | Tolerância a giro, equilíbrio, referência visual | `linhaDeBase` — dimensão `Funcional` |
| 6 | **Orientação espacial e lateralidade** | Domínio de lado, espaço, diagonal, espelhamento | `linhaDeBase` — dimensão `Musicalidade` / `Funcional` |

A dimensão **Musicalidade** aparece **duas vezes** na anamnese — aqui, na malha de domínios, e como
elemento basilar da observação inicial (§3.2). Não é duplicação: a §3.4 explica por que são
**momentos distintos** do mesmo trabalho.

Duas observações sobre a tabela, e as duas são medidas:

**(a) As dimensões do lado direito não são escolha deste documento.** São as três que o
`po-01.json` do ciclo real já usa nos seus objetos de `linhaDeBase`: **Técnica, Funcional e
Musicalidade**. O mapeamento acima é uma **leitura** da malha sobre o que o dado já comporta — e é
justamente por isso que ele precisa de confirmação (§9).

**(b) A malha é pergunta de eliciação, não inferência.** P-16 é explícita: *"quem define a
metodologia — o professor ou a escola?"*. Nenhum domínio abaixo se **deduz** de idade, de tempo de
prática ou de nível declarado. Ele é **declarado** — ou fica `[Preencher]`.

### 4.2 O que a anamnese não faz

- **Não avalia.** É o mesmo corte do [`ARQUITETURA-AULA.md`](ARQUITETURA-AULA.md) e do
  [`AGENTS.md`](AGENTS.md): *o projeto não avalia; ele registra o cotidiano do professor em sala de
  aula*. A anamnese **declara um estado inicial**; ela não emite juízo sobre ele.
- **Não decide o que a aluna pode executar.** A última frase da P-22 é taxativa: *"O professor
  **não avalia** o que o sujeito não pode executar por restrição física — apenas registra. A
  decisão sobre o que fazer não é dele."* A anamnese registra; a decisão é da coordenação.
- **Não transforma dificuldade em diagnóstico.** "Adutores e posterior de coxa — nenhuma tem
  desenvolvido" é uma **observação pedagógica** medida no `po-01.json` real; ela não é, e não pode
  ser lida como, um laudo.

### 4.3 Onde os campos caem — e a lacuna medida

Medido em `professores/tiago/ciclos/ciclo-01-duo/po-01.json` (10.124 B):

- A `linhaDeBase` é uma lista de **18 itens**: **3 objetos** (`{dimensao, trazem, falta, dominam}`)
  e **15 strings**.
- **Não há linhas por aluna.** Os 3 objetos são por **dimensão de grupo**; as strings carregam
  conteúdo coletivo ("**Postura e alinhamento — nenhuma das quatro controla:**", "Hiperlordose",
  "Braços na 2ª posição com cotovelos a alinhar").
- **E a lacuna está no próprio JSON, não só no relato sobre ele.** O último item da lista é a string
  literal `"### Linha de base por aluna"` — o cabeçalho da seção por aluna, **presente como dado, e
  sem nenhuma linha por aluna depois dele**. A lista termina ali. O artefato publicado declara a
  intenção de ter a seção e não a preenche: é a prova, no arquivo, de que a forma por aluna é uma
  promessa em aberto, não um dado ausente por descuido de leitura.

Mas a **forma canônica** da linha de base é outra, e é documentada: uma lista **com um objeto por
aluna**, com as chaves exatamente `{ "aluno", "traz", "precisaDesenvolver" }`
([`professores/tiago/campo/README.md`](professores/tiago/campo/README.md), 26/09/2026). E o próprio
`campo/README.md` registra que **"a outra forma é a apresentação, não o dado"**.

**Duas lacunas medidas que a anamnese obrigatoriamente encosta:**

1. **A extração perde a tabela por aluna quando o bloco tem duas.** Está medido e escrito como
   lacuna em `campo/README.md` §"Lacuna medida".
2. **A forma canônica não está nos `-dados.json`.** Também medido, no mesmo arquivo.

Consequência que precisa ficar dita: **a malha de anamnese é, pela sua natureza, por aluna** (o
joelho de uma aluna é dela). O artefato atual **não carrega** linhas por aluna na sua forma
publicada. Portanto a anamnese **não pode ser especificada contra o estado atual do dado** sem
antes resolver as duas lacunas acima — ou declará-las como parte do desenho. Este documento escolhe
**declará-las** (§9, pergunta 2).

## 5. A ramificação condicional

### 5.1 O gatilho: o nível declarado

O gatilho é **o nível prévio declarado** — Básico, Intermediário, Avançado — respondido no Bloco 3
da entrevista. Ele é **declaração**, nunca dedução: a P-16 já obriga a perguntar quem define a
metodologia antes de gerar qualquer artefato.

O que a ramificação faz é **abrir um ramo de triagem motora** a partir dessa declaração.

### 5.2 O ramo: auditar técnica × incorporação real

O ramo existe para responder a uma pergunta específica: **a técnica e a incorporação real condizem
com o histórico declarado?**

O desenho do ramo, em termos de conteúdo do PO:

| Nível declarado | Ramo aberto | O que o ramo pergunta |
|:--|:--|:--|
| **Básico** | Triagem de pré-requisitos | O que é declarado como "já sabido" se sustenta em execução? Onde falta base que o nível pressupõe? |
| **Intermediário** | Triagem de consistência | A técnica declarada aparece em combinação, ou só isolada? O que regrediu? |
| **Avançado** | Triagem de refinamento | O que se sustenta sob carga, velocidade e repertório? Onde a técnica cede? |

**Nota de desenho — e é o ponto onde este documento mais precisa de confirmação.** "Auditar se a
técnica e a incorporação real condizem com o histórico" é a formulação do pedido
([§9](#9-perguntas-em-aberto), pergunta 1), e ela **encosta no limite** de "o projeto não avalia".
A leitura deste documento é que o ramo **não é um juízo sobre a aluna**: é a **diferença entre o
que foi declarado e o que se observa**, registrada como fato — exatamente o mecanismo que o
[`ARQUITETURA-AULA.md`](ARQUITETURA-AULA.md) já usa ("o que mudou em relação ao plano"). Se for
outra coisa, é avaliação, e a avaliação "é fronteira de outro módulo, ainda não desenhado"
([`AGENTS.md`](AGENTS.md)).

### 5.3 O método de origem: RAD, Vaganova

Aqui a P-16 faz todo o trabalho: **metodologia e notação são declaradas na eliciação**. O método de
origem (RAD, Vaganova, outro, ou "sem método formal declarado") é, portanto:

- **um campo elicitado**, não um campo inferido;
- **o que determina o vocabulário do ramo** — a mesma exigência de *tendu* não se formula igual nas
  duas tradições;
- **o que a P-15 obriga a respeitar**: "A notação segue a metodologia declarada… Se não usa notação
  formal, o ciclo **não gera** documento de notação — e declara a ausência com justificativa."

O PE **não sabe** o que é RAD nem Vaganova. Ele recebe um valor de campo e saltaria para o nó que
o PO declarou para aquele valor. É esse o teste da fronteira (§2.2).

### 5.4 O ruído de destreino

O destreino deve ser declarado, não concluído. E aqui a distinção importa, porque duas coisas
diferentes estão em jogo:

- **O campo existe e é obrigatório.** `condicoesDeContorno` está no `required` do `po-schema.json`
  (13 campos, todos exigidos) e é uma `string` — medido no schema real.
- **Mas a P-11 o define num escopo mais estreito que o destreino.** A descrição literal do campo é:
  "P-11 — condições de contorno da execução: variáveis **relacionais** (interesse, ânimo, harmonia)
  que o plano não controla, declaradas como parte do que se observa."

Ou seja: **a P-11 governa o campo, e o que ela põe nele são condições relacionais** — não o
destreino. Declarar um período de destreino **através** desse campo é uma **hipótese de
mapeamento**, não uma equivalência estabelecida: o destreino é uma condição de **histórico da
prática**, e as três variáveis que a P-11 nomeia são de **estado relacional da aula**. Coincidem no
espírito — "o plano não controla, e se observa em vez de se atribuir a falha" — e não coincidem na
letra.

**Este documento não fecha esse mapeamento.** Ele fica declarado como condição de contorno
*proposta* e vai para as perguntas em aberto ([§9](#9-perguntas-em-aberto), pergunta 9): declarar
destreino no campo da P-11 **alarga a P-11**, e alargar uma pétrea é alterar `PROTOCOLO.md` — que
está congelado (§8). A alternativa é tratar destreino como parte da própria linha de base.

O ponto de desenho, que se sustenta nos dois caminhos: **um período de destreino declarado explica
uma divergência entre histórico e execução sem que a anamnese precise julgá-la.** Sem essa
declaração, a divergência fica sem explicação registrada — e o registro passaria a *supor*, o que a
P-06 proíbe (descritivo, não analítico).

### 5.5 O que o ramo nunca faz

- Não gera campo novo fora do schema (P-08).
- Não cria critério que o PO não declarou.
- Não reordena, sozinho, a malha de domínios da §4.
- Não decide "o que fazer" com o resultado (§4.2).

## 6. A soberania do CRUD autoral

### 6.1 O precedente já existe — e é o [`ARQUITETURA-AULA.md`](ARQUITETURA-AULA.md)

Isto é o achado mais útil deste documento. O problema "quando o professor pode editar?" **já foi
resolvido** neste repositório, para a aula, e a solução é reusável **com as mesmas palavras**:

> **Aula `planejada`: CRUD comum. Aula que já aconteceu: só ajuste — de jeito nenhum CRUD.**
> … O corte é **o estado**, não a data solta… Depois que a aula acontece, a mesma fonte já é
> **fato**, e o que se acrescenta é um elo, nunca uma sobrescrita.

E o mecanismo do ajuste, verbatim:

> o anterior permanece, o novo é um elo, e o **diff é a justificativa** — sem campo de motivo
> obrigatório… o que ele não tem é o direito de apagar que houve um plano antes.

**Transporte direto para a anamnese:** enquanto a anamnese é **intenção** (declarada antes do
ciclo, conforme P-22(a) exige — "declaradas no PO **antes do ciclo**"), vale **CRUD comum**: o
professor cria, lê, atualiza e exclui perguntas, critérios e blocos. Depois que ela é **fato** — a
aluna respondeu, o ciclo começou — vale **só ajuste**: o anterior permanece, o novo é um elo, e o
diff é a justificativa. O professor **não tem o direito de apagar que houve uma pergunta antes**.

Esse transporte é o que dá conteúdo verificável à expressão "sem corromper o núcleo normativo do
PO": corromper o núcleo é **sobrescrever** onde só cabia **acrescentar**.

### 6.2 A fronteira: núcleo normativo × camada autoral

| | **Núcleo normativo** | **Camada autoral** |
|:--|:--|:--|
| **O que é** | As pétreas, os schemas, os campos declarados, a malha da §4 | As perguntas, critérios e blocos que **o professor** cria para a sua realidade |
| **Quem manda** | O projeto (congelado) | O professor (P-13: "O PO é do professor, não do projeto") |
| **Como muda** | Motivo declarado + `REGISTRO.md` + commit próprio | CRUD comum, enquanto é intenção |
| **Se entra em conflito** | Prevalece | Cede — ou vira pedido de descongelamento (§8) |

**A P-20 é o que faz a camada autoral valer a pena.** Ela diz que a solução é **do professor**, não
da escola, e que ela **transporta** entre os ciclos dele para problemas recorrentes — e nomeia o
vocabulário exato da malha: *"posterior, adutor, rotadores, coordenação braço-perna, hiperlordose,
etc."*. Logo, a biblioteca autoral **não é do ciclo**: é do **professor**, e vive acima do ciclo —
o que a torna, ela própria, um artefato a espelhar (§5 do
[`ARQUITETURA-PE.md`](ARQUITETURA-PE.md)).

### 6.3 A tensão com P-21 e P-08, resolvida por adição

**P-21** diz: "**Documentos publicados usam linguagem harmonizada.** … O material bruto (em
`campo/`) preserva a linguagem original… **A harmonização é proposta, não imposição.** … Cada
resposta do professor gera uma **nova versão** do ciclo, reancorada; a anterior permanece no
histórico. A proveniência acrescenta, não edita (P-03/P-04)."

Isso resolve a tensão **sem exceção**: o professor editar uma pergunta **não** é sobrescrever o
núcleo — é **gerar uma nova versão, reancorada**, deixando a anterior no histórico. O CRUD autoral
é, portanto, **compatível com a P-21 pela mesma mecânica que a P-21 já descreve**. Não é preciso
inventar nada.

**P-08** exige que os campos sejam **declarados em schema** — e é aí que a camada autoral precisa de
uma regra que este documento deixa explícita: **um campo autoral é declarado como autoral.** O
schema é `additionalProperties`, então o campo **cabe**; e a declaração diz **de quem ele é**. Sem
essa marca, a camada autoral contamina a malha normativa e o próximo ciclo não sabe qual das duas
está lendo.

### 6.4 A limitação medida — o `.fipp` não tem data

Medido em `professores/tiago/ciclos/ciclo-01-duo.fipp`, cujos campos são exatamente:

```
id  type  professor  ciclo  variante  hash_conteudo  parentHash  hash
algoritmo  po  po_state  ancorado_em  cobertura
```

**Não há campo de data da aula.** Há `ancorado_em` (a data da ancoragem) e `po_state`. O
[`ARQUITETURA-AULA.md`](ARQUITETURA-AULA.md) §5.1 já registra esse limite.

**Consequência para o CRUD autoral:** a âncora, sozinha, **não distingue** o CRUD legítimo
*antes* do fato do ajuste proibido *depois* dele. O corte é **derivado** — do cronograma, do prazo
e do registro —, como o [`ARQUITETURA-AULA.md`](ARQUITETURA-AULA.md) §1 estabelece. A anamnese
herda essa dependência e não pode resolvê-la sozinha (§8, e §9 pergunta 4).

## 7. Onde o dado vive, e sob qual política

### 7.1 A colisão, declarada

Este é o ponto que **precisa** ficar visível antes de qualquer implementação, porque uma malha de
anamnese de balé clássico — com alinhamento ósseo, flexibilidade, sistema vestibular — **é dado de
saúde**, ou está a um passo dele, e o projeto **publica**.

Medido, lado a lado:

| Regra medida | O que ela diz |
|:--|:--|
| `.github/instructions/ciclo-fontes.instructions.md` | "Nunca nome completo, contato ou **dado de saúde em claro**" |
| `P-12` | Apelidos "substituem nomes completos; **não os acompanham em nenhum arquivo do repositório**" |
| `P-21` | "O material bruto (em `campo/`) preserva a linguagem original" |
| `P-22` | Restrições físicas declaradas **na linha de base por sujeito** |
| `campo/README.md`, regra 2 | Nome e contato **não entram no repositório**: ficam fora do Git, em arquivo local |
| `tools/cifrar-dados.js:19` | "Não é vazamento novo — o **`po-XX.json` vai em claro no MESMO pacote**" |

**A última linha é o problema.** O `po-XX.json` é publicado **em claro**, e isso é uma decisão
**deliberada e documentada**, não um defeito. A anamnese seria, por natureza, o artefato mais
sensível do pacote — e o caminho onde ela naturalmente cairia é justamente o que hoje vai em claro.

### 7.2 As camadas de proteção, como estão medidas

| Camada | O que acontece | Onde está medido |
|:--|:--|:--|
| **Apelido** | Apelido estável; nunca nome completo, contato ou dado de saúde em claro | P-12; instruções de fontes |
| **Nome e contato** | Seção 9 (opcional) os pede; ficam **fora do Git**, em arquivo local; `respostas.md` traz a resposta sem identificação | `campo/README.md`; `formulario.md` §9 |
| **No repositório** | O repositório é **privado**; ação manual da pesquisadora | `CONGELAMENTO.md` |
| **No pacote** | PDF **sem** acompanhamentos; acompanhamento HTML **cifrado**; acompanhamento `.md` **fora do Git** | `CONGELAMENTO.md` |
| **JSON de lançamentos** | O `-dados.json` publicado leva o lançamento cifrado **por inteiro**; o envelope tem **4 campos** — `{_cifrado, lancamentos, apelidos, _nota}` — dos quais **2 saem em claro**, com a senha vinda de variável de ambiente | `tools/cifrar-dados.js`; `ciclo-01-duo-dados.json` (medido) |
| **Quem acessa** | Só o professor, com a senha | [`ARQUITETURA-CAPTURA.md`](ARQUITETURA-CAPTURA.md) §5 |

### 7.3 A decisão que este documento não toma sozinho

O padrão está **cifrar o que identifica** e **deixar em claro o que descreve**. A anamnese quebra
esse padrão, porque **ela identifica pelo corpo**: "a aluna com joelho valgo que não sustenta
*pliqué*" é, numa turma de quatro, um identificador.

Este documento **não decide** cifrar o `po-XX.json` — isso seria descongelar (§8), e a decisão
está registrada como **pendente** em outro lugar: [`ARQUITETURA-CAPTURA.md`](ARQUITETURA-CAPTURA.md)
§5 diz literalmente **"Fora do Git? Decisão pendente — ver seção 7"**, e essa decisão **continua
pendente**. A anamnese não a resolve; ela a **torna urgente** (§9 pergunta 5).

O que este documento afirma é o seguinte: **a anamnese deve reusar o modelo de quatro camadas, não
inventar um quinto.** Criar um mecanismo próprio de proteção para a anamnese fragmentaria a
política que já está medida e documentada.

### 7.4 Menores, e a lacuna que continua aberta

Medido: o instrumento de campo pergunta faixa etária, e a **primeira faixa é `☐ 3–6`**, indo até
`☐ 14–17` (`2026-10-03-ritmos/formulario.md`). E é o próprio `campo/README.md` que declara: "O
campo grava dados de **menores de idade**… A **P-12** resolve o **repositório**… e **não** resolve
o **consentimento de responsável**."

O artefato que existe para isso é
[`professores/tiago/campo/consentimento.md`](professores/tiago/campo/consentimento.md) — e o seu
estado é **"ESTRUTURADO COM LACUNAS — NÃO FECHADO"**. As lacunas estão abertas em **duas
granularidades medidas, e as duas contam**:

- **Quatro cabeçalhos estruturais** em `consentimento.md`: *Partes e assinatura*, *Base legal e
  finalidade*, *Guarda e ciclo de vida*, *Aplicação*. São a **estrutura** do termo — o índice do que
  ele teria de responder.
- **Onze decisões concretas** enumeradas em
  [`professores/tiago/campo/README.md`](professores/tiago/campo/README.md), sob a leitura "**Cada
  item abaixo é decisão jurídica.** Nenhum foi redigido no lugar dela": a quem o termo se dirige e
  quem assina; quem assina sozinho a partir de que idade; base legal; assentimento da própria aluna;
  finalidade declarada; por quanto tempo o dado fica; como se pede a exclusão; quem é o responsável
  pelo tratamento; o que acontece com o dado ao fim do prazo; se a recusa impede a participação;
  onde ficam as vias assinadas.

**Nenhuma das onze está fechada**, e o próprio README fecha o assunto sem ambiguidade: "**O
consentimento não está fechado.** Enquanto as lacunas acima estiverem em aberto, não há termo
aplicável ao campo — e isso é uma lacuna **declarada**, não um consentimento existente."

**Implicação direta, e é forte:** uma anamnese de alinhamento ósseo e flexibilidade aplicada a
menores de 3 a 6 anos **intensifica** uma lacuna de consentimento que já está reconhecida e não
resolvida. Qualquer implementação da malha da §4 que alcance essa faixa **depende** de a lacuna de
`consentimento.md` estar fechada — e fechá-la é "decisão da pesquisadora", nas palavras do próprio
arquivo. As quatro estruturas não reduzem as onze decisões: **um termo com índice e sem decisões
continua sendo um termo que não existe.**

## 8. O que precisará descongelar

Nada do que está acima exige código **para existir como desenho**. Exigiria, para ser
implementado — e o rito é o do [`CONGELAMENTO.md`](CONGELAMENTO.md): **motivo declarado + entrada
no `REGISTRO.md` + commit próprio**.

| # | Peça congelada | Por que a anamnese a toca | Descongelar? |
|:--|:--|:--|:--|
| 1 | `tools/` (o diretório inteiro, **inclusive arquivo novo**) | Um helper de anamnese, ou a resolução de onde o artefato mora, é arquivo novo em `tools/` | **Sim** — é descongelamento declarado |
| 2 | `tools/templates/` | Se a anamnese for renderizada, depende de template | **Sim** |
| 3 | `prompts/` | A entrevista de dez blocos é de lá; aprofundar o Bloco 3/6 é editá-la | **Sim** |
| 4 | `PROTOCOLO.md` | **Só** se uma pétrea nova for necessária — e este documento lê que **não é** (§1.1) | Provavelmente **não** |
| 5 | `tools/lib-fontes.sh` | Decide se a anamnese entra na cobertura da âncora | **Sim**, se entrar (§9 pergunta 3) |
| 6 | `.gitignore` | Um par `.env` / `.env.exemplo` precisa de entrada — e ele **não existe hoje** | **Não congelado**, mas mesmo rito |
| 7 | `tools/validar-dados-ciclo.js` | Valida os `-dados.json` contra o PO | **Sim**, se a forma por aluna for exigida (§4.3) |

**O que NÃO precisa descongelar, e é a maior parte:** o conteúdo. Um documento novo que **siga a
estrutura já definida** é **livre** pelo [`CONGELAMENTO.md`](CONGELAMENTO.md) — é a mesma licença
que autorizou o [`ARQUITETURA-PE.md`](ARQUITETURA-PE.md) e este arquivo. A malha de domínios da §4,
os ramos da §5 e a biblioteca autoral da §6 são **conteúdo**, e conteúdo é livre.

**Este documento não entra no `REGISTRO.md`.** Ele não altera arquivo congelado: ele **indexa** o
que já está congelado e declara o desenho. Motivo declarado é exigido de quem **altera** — não de
quem **desenha**.

## 9. Perguntas em aberto

Nada aqui está decidido, e nenhuma delas bloqueia este documento — que é desenho, não
implementação.

1. **"Auditar se a técnica condiz com o histórico" é registro ou avaliação?** A §5.2 lê como
   **registro da diferença** entre o declarado e o observado — o mesmo mecanismo do "o que mudou em
   relação ao plano". Se for juízo sobre a aluna, então a anamnese invade o módulo de avaliação,
   que "é fronteira de outro módulo, ainda não desenhado" ([`AGENTS.md`](AGENTS.md)). Hipóteses:
   **(A)** é registro, e o diff declarado × observado é o artefato; **(B)** é avaliação e fica fora
   do escopo deste desenho; **(C)** é registro, mas exige uma rubrica declarada em vez de leitura
   livre.
2. **A anamnese exige a forma por aluna — e ela ainda não está no dado.** Medido: a forma canônica
   é uma lista com um objeto por aluna (`campo/README.md`, 26/09/2026) e o `po-01.json` publicado
   **não tem linhas por aluna**; a extração "perde a tabela por aluna quando o bloco tem duas".
   Hipóteses: **(A)** a anamnese fica bloqueada até as duas lacunas fecharem; **(B)** a anamnese
   publica-se **na forma de apresentação**, aceitando perder o recorte por aluna; **(C)** a
   anamnese define um artefato próprio, e o `-dados.json` continua como está.
3. **A anamnese entra na cobertura da âncora `.fipp`?** Depende de `fontes_do_ciclo()` e do `DOCS`
   em [`tools/lib-fontes.sh`](tools/lib-fontes.sh) — que é congelado. Se entra, a anamnese passa a
   poder invalidar a âncora; se não entra, o dado mais sensível fica **fora da cadeia de custódia**,
   e isso precisa ser dito em voz alta.
4. **Onde mora o corte CRUD × ajuste da anamnese, se o `.fipp` não tem data?** A §6.4 mostra que a
   âncora não distingue CRUD-before de ajuste-after. O corte é **derivado** — do cronograma, do
   prazo e do registro. Hipóteses: **(A)** a anamnese herda o estado derivado da aula; **(B)** a
   anamnese tem o seu próprio estado derivado, declarado no PO; **(C)** a anamnese só é editável
   antes do primeiro evento de campo que a use.
5. **O `po-XX.json` continua indo em claro no pacote publicado?** Medido: ele vai, e é decisão
   deliberada (`tools/cifrar-dados.js:19`). A anamnese torna a decisão urgente porque identifica
   pelo corpo. E a decisão correlata — "Fora do Git?" — segue **pendente** em
   [`ARQUITETURA-CAPTURA.md`](ARQUITETURA-CAPTURA.md) §5.
6. **A malha da §4 é um bloco novo ou aprofunda o Bloco 3/6?** Ela nasce do Bloco 3. Hipóteses:
   **(A)** aprofunda o Bloco 3 e o Bloco 6, sem bloco novo (preserva os "dez blocos"); **(B)** é um
   instrumento próprio em `campo/`, como o formulário de campo; **(C)** é um bloco novo na
   entrevista, passando a onze.
7. **A biblioteca autoral da §6.2 é do ciclo ou do professor?** P-20 diz que a solução é **do
   professor** e transporta entre os ciclos dele — o que sugere que a biblioteca vive **acima** do
   ciclo. Mas o PO resolve-se **por escola** (`ciclo-XX-<escola>-po.md`), enquanto P-13 organiza o
   trabalho **por professor**. É a mesma tensão que o [`ARQUITETURA-PE.md`](ARQUITETURA-PE.md) §8
   registra como pergunta 1.
8. **Quem pode declarar que uma aluna é "flutuante" no meio do ciclo, e o que acontece com a
   anamnese dela?** Medido: o Bloco 3 já pergunta por "alunas flutuantes", mas a anamnese é, por
   natureza, de estado inicial. Hipóteses: **(A)** aluna flutuante entra com anamnese parcial
   declarada como parcial; **(B)** entra sem anamnese e a linha de base dela nasce no primeiro
   evento; **(C)** não entra na malha, e isso é declarado.
9. **O destreino cabe no campo da P-11, ou a P-11 é mais estreita que ele?** Medido: a P-11 governa
   `condicoesDeContorno`, e a descrição do campo nomeia **variáveis relacionais** (interesse, ânimo,
   harmonia); o destreino é condição de **histórico da prática**. Coincidem no espírito — o plano
   não controla, e se observa —, não na letra. Hipóteses: **(A)** o destreino entra como valor do
   campo, **alargando a P-11** (e alargar uma pétrea é editar `PROTOCOLO.md`, que é congelado);
   **(B)** o destreino é declarado como parte da **linha de base**, sem tocar na P-11; **(C)** o
   destreino entra no caderno como fato observado, e a divergência de execução fica registrada sem
   explicação atribuída. A §5.4 **não** fecha isso.

## Referências

- `ARQUITETURA-PE.md` — **o documento irmão**: a integração PO ⇄ PE, a descoberta via `.env`, o
  espelhamento de diretórios e a classificação prosa × chave-valor; §2 (a separação estrita) e §9
  (as perguntas em aberto) são o modelo deste documento
- `PROTOCOLO.md` — as 22 pétreas; **P-08** (campos declarados em schema; o "formulário
  dinâmico"), **P-10** (a linha de base dos sujeitos), **P-11** (condições de contorno), **P-12**
  (apelidos estáveis), **P-13** (o PO é do professor), **P-15**/**P-16** (metodologia e notação
  **declaradas** na eliciação), **P-20** (problemas semelhantes, soluções semelhantes),
  **P-21** (linguagem harmonizada; a proveniência acrescenta), **P-22** (as condições materiais de
  execução)
- `ARQUITETURA-AULA.md` — **§1 e §1.1** (os quatro estados e a regra "CRUD comum enquanto
  `planejada`; só ajuste depois"; o diff como justificativa) e **§5.1** (o `.fipp` não tem data):
  o precedente que a §6 deste documento transporta
- `ARQUITETURA-CAPTURA.md` — o formulário dinâmico e o JSON por ciclo; **§5** (a tabela de
  segurança; o *"Fora do Git?"* ainda pendente); §7 (decisões e perguntas abertas)
- `CONGELAMENTO.md` — o que está congelado, o que continua livre, o que exige motivo declarado; a
  política de segurança em camadas
- `REGRAS.md` — as 17 regras e os 5 pré-requisitos obrigatórios
- `AGENTS.md` — a identidade do projeto: **protótipo, não agnóstico**; o FIPP não é implementado
  aqui; **o projeto não avalia**; a avaliação é fronteira de outro módulo
- `prompts/eliciar-ciclo.md` — a entrevista de dez blocos; **Bloco 3** (alunas: faixa etária,
  nível, apelidos, restrições físicas por P-22) e **Bloco 6** (sujeitos e linha de base): a
  proto-anamnese e o lugar onde a malha da §4 se apoia
- `professores/tiago/campo/README.md` — a forma canônica da linha de base
  (`{aluno, traz, precisaDesenvolver}`, 26/09/2026); as quatro regras do campo (nome e contato fora
  do Git); as **lacunas medidas** da extração; a distinção dos três instrumentos
- `professores/tiago/campo/consentimento.md` — a estrutura do consentimento: **quatro cabeçalhos**
  (Partes e assinatura, Base legal e finalidade, Guarda e ciclo de vida, Aplicação) e as **onze
  decisões jurídicas** que `campo/README.md` enumera sob eles, **nenhuma fechada**; por que menores
  de idade são o caso que a P-12 não resolve
- `professores/tiago/campo/2026-10-03-ritmos/formulario.md` — o instrumento de campo **como
  aplicado**: faixa etária a partir de `☐ 3–6`, nível, e a seção 9 opcional de nome e contato
- `professores/tiago/ciclos/ciclo-01-po-schema.json` — o schema do PO: `subjects`, `linhaDeBase`,
  `norma` e `condicoesDeContorno` **já declarados e obrigatórios**; `additionalProperties`; a
  prova de que a anamnese é conteúdo aninhado, não schema novo
- `professores/tiago/ciclos/ciclo-01-duo/po-01.json` — o PO real: `linhaDeBase` de 18 itens, **sem
  linhas por aluna**; as três dimensões de grupo (Técnica, Funcional, Musicalidade)
- `professores/tiago/ciclos/ciclo-01-duo.fipp` — a âncora: os campos medidos e a **ausência de
  campo de data**
- `tools/cifrar-dados.js` — a cifra do `-dados.json` publicado e a nota de que o **`po-XX.json` vai
  em claro no mesmo pacote**
- `tools/validar-dados-ciclo.js` — "Quem manda nos campos é o PO, não o schema"
- `tools/lib-fontes.sh` — a resolução única de fontes; `fontes_do_ciclo()` e `DOCS` decidem se a
  anamnese entra na âncora (§8 pergunta 3)
- `tools/hash-ciclo.sh` — a âncora encadeada (`.fipp`) e a resolução do PO por variante
- `.github/instructions/ciclo-fontes.instructions.md` — a regra operativa: **"Nunca nome completo,
  contato ou dado de saúde em claro"**; as lacunas `[Preencher: …]`/`[conferir]`; a forma
  contratual de listas e tabelas
- `experimentos/` — **demonstrativo**, fora de pacotes, hashes e publicação: o único lugar onde o
  vocabulário da malha aparece hoje (`valgo`, `arco plantar`, cadeia posterior, adutor). **Não é
  fonte** — é indicação de que o terreno já foi pisado
