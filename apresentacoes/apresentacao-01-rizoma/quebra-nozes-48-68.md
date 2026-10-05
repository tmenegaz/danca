---
marp: true
theme: default
size: 16:9
paginate: true
header: '**O Quebra-Nozes** — Hoffmann, Dumas, Tchaikovsky e Ivanov'
footer: 'Trecho da apresentação — slides 48 a 68 do original'
style: |
  /* Identidade visual do Projeto Ciclo (ver IDENTIDADE-VISUAL.md, na raiz).
     Esta paleta É a identidade — os mesmos valores de tools/templates/ciclo.css,
     a fonte de verdade, com os nomes canônicos. O deck é Marp (Markdown), então
     não pode consumir os tokens por referência: a correspondência é declarada
     aqui e conferida por tools/check-identidade.js. */
  :root {
    --burgundy: #6b1f2e;
    --gold: #b08d57;
    --gold-escuro: #8a6a3b;
    --tinta: #1f1c1a;
    --soft: #5a5348;
    --cream: #fbf8f3;
    --branco: #ffffff;
  }
  section {
    font-family: Georgia, 'Times New Roman', 'DejaVu Serif', serif;
    background: var(--cream);
    color: var(--tinta);
    font-size: 26px;
    line-height: 1.34;
    padding: 56px 68px 66px;
    letter-spacing: 0.1px;
  }
  header, footer {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    color: #9a9384;
  }
  h1, h2, h3, h4 {
    font-family: Georgia, 'Times New Roman', serif;
    color: var(--burgundy);
    margin: 0 0 0.45em;
  }
  h1 { font-size: 42px; line-height: 1.15; }
  h2 {
    font-size: 31px;
    line-height: 1.18;
    border-bottom: 3px solid var(--gold);
    padding-bottom: 10px;
    margin-bottom: 22px;
  }
  h3 {
    font-size: 22px;
    color: var(--gold-escuro);
    margin-top: 0.7em;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  strong { color: var(--burgundy); }
  em { color: var(--soft); }
  ul, ol { margin: 0.3em 0 0.3em 0.15em; }
  li { margin: 0.3em 0; }
  li::marker { color: var(--gold); }
  ul ul li, ol ol li, ul ol li, ol ul li { margin: 0.15em 0; }
  ul ul, ol ul, ul ol, ol ol { margin: 0.15em 0 0.15em 0.15em; }
  blockquote {
    border-left: 5px solid var(--gold);
    background: rgba(176, 141, 87, 0.12);
    padding: 10px 20px;
    margin: 0.6em 0;
    font-style: italic;
    color: var(--soft);
  }
  blockquote p { margin: 0.2em 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.62em;
    margin: 0.4em 0;
  }
  th, td {
    border: 1px solid #ddd5c7;
    padding: 6px 10px;
    text-align: left;
    vertical-align: top;
  }
  th { background: rgba(107, 31, 46, 0.09); color: var(--burgundy); }
  code { background: rgba(107, 31, 46, 0.07); padding: 0 4px; }
  section::after { color: #b3aa9b; font-size: 14px; }
  section.lead {
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    background: radial-gradient(circle at 50% 0%, var(--branco) 0%, var(--cream) 55%, #f2ebdf 100%);
  }
  section.lead h1 { font-size: 52px; margin-bottom: 0.25em; }
  section.lead h3 { font-size: 20px; letter-spacing: 2px; }
  section.lead header, section.lead footer { display: none; }
  section.lead p { font-size: 24px; color: var(--soft); }
  section.dense { font-size: 19.5px; line-height: 1.28; }
  section.dense h2 { font-size: 26px; margin-bottom: 14px; padding-bottom: 7px; }
  section.dense h3 { font-size: 18px; margin-top: 0.5em; }
  section.dense li { margin: 0.16em 0; }
  section.dense table { font-size: 0.66em; }
  section.table-lg table { font-size: 0.80em; }
  section.table-lg th, section.table-lg td { padding: 8px 12px; }
  section.table-xl table { font-size: 1.12em; }
  section.table-xl th, section.table-xl td { padding: 14px 18px; }
  section.mid { font-size: 23px; line-height: 1.32; }
  section.mid h2 { font-size: 29px; margin-bottom: 16px; }
  section.mid li { margin: 0.22em 0; }
  section.map { padding: 10px 14px 12px; }
  section.map h2 { font-size: 25px; margin-bottom: 6px; padding-bottom: 4px; }
  section.map p { font-size: 17px; margin: 8px 0 0; }
  section.map header, section.map footer { display: none; }
  section.map svg { display: block; }
  section.dense blockquote { padding: 8px 16px; margin: 0.4em 0; }
  section.refs { font-size: 16.5px; line-height: 1.3; }
  section.refs h2 { font-size: 24px; margin-bottom: 12px; padding-bottom: 6px; }
  section.refs li { margin: 0.14em 0; }
  section.denser { font-size: 16.8px; line-height: 1.27; }
  section.denser h2 { font-size: 23px; margin-bottom: 11px; padding-bottom: 6px; }
  section.denser h3 { font-size: 16px; margin-top: 0.45em; }
  section.denser li { margin: 0.13em 0; }
  section.denser blockquote { padding: 7px 14px; margin: 0.35em 0; }
---

<!-- _class: lead -->
<!-- _paginate: false -->

# O Repertório Vivo

### O CORPO, O ARQUIVO E O RIZOMA NA FORMAÇÃO EM BALÉ CLÁSSICO

*Uma reflexão para professoras de ballet*

**Tiago Menegaz**

**3 de outubro de 2026**

**Studio Ritmo e Movimentos — Passo Fundo, RS**

<!-- _notes: Abertura. Receber o público, agradecer a presença, contextualizar o objetivo da apresentação. -->


---


## Por Que Começar Pelo Pensamento?

- Em tempos de tecnologia, agentes inteligentes e conteúdos prontos, é comum que o pensamento seja **terceirizado** para ferramentas.
- Mas na dança, o pensamento **acontece no corpo**.
- É o corpo que pensa, que aprende, que corporifica.
- As ferramentas são **meios**, não fins.
- O pensamento é a **construção de possibilidades** — é o que dá condições para usar as ferramentas e, quem sabe, elaborar novas.

<!-- _notes: Introduzir a ideia de que a tecnologia é ferramenta, mas o pensamento é o que dá sentido ao uso dela. -->


---


## Glossário de Referência
### Conhecimento de Arquivo — Diana Taylor

- **O que é:** o conhecimento codificado, estático, documentado. É o syllabus, a partitura Benesh, o vídeo, o livro.
- **Na aula de balé:** o *tendu à la seconde* descrito no manual da RAD. A sequência de passos escrita no caderno.
- **O que a IA consegue fazer com ele:** processar, reproduzir, recombinar. É o reino do **arquivo**.

> O arquivo guarda o que já foi dito. Ele não guarda o que foi vivido.

<!-- _notes: Mostrar que o arquivo é finito e reproduzível — por isso é o território em que a tecnologia opera com facilidade. -->


---


## Glossário de Referência
### Conhecimento Tácito — Michael Polanyi

- **O que é:** o conhecimento vivido, incorporado, aquele que "sabemos mais do que podemos dizer".
- **Na aula de balé:** a sensação proprioceptiva do equilíbrio. A intenção expressiva que a aluna dá ao movimento. "Aqui você não caça, não."
- **Por que é importante:** é o que escapa à formalização. É o que torna cada execução **única**. É o que a tecnologia atual **não consegue capturar**.

> O arquivo é finito. O repertório vivido é infinito.

<!-- _notes: Contrapor arquivo e conhecimento tácito: o tácito é o que dá singularidade a cada corpo. -->


---


## Glossário de Referência
### O Que é Agenciamento? — Deleuze & Guattari

- **O que é:** um conjunto **heterogêneo** de elementos (corpos, objetos, signos, instituições) que se conectam e produzem uma **realidade viva**.
- **O que NÃO é:** não é um robô, não é uma linha de montagem, não é uma engrenagem, não é um trilho de trem. Não é algo que robotiza ou desumaniza.
- **O que É:** é uma **configuração real e viva**. É heterogêneo. É dinâmico. É o cruzamento entre forças que **produz movimento**.
- **Na aula de balé:** o corpo da aluna é um agenciamento de ossos, músculos, hábitos, técnicas, música, espaço, normas, afetos, intenções.

> Agenciar é compor com o que existe — e, nessa composição, **produzir mundos**.

<!-- _notes: ATENÇÃO: nunca associar "agenciamento" a máquina industrial, robô, linha de montagem, trilho, algoritmo. Aqui, máquina = produção de realidade viva. O agenciamento potencializa e singulariza; ele não mecaniza nem padroniza. -->


---


## Glossário de Referência
### O Que se Opõe ao Agenciamento? A Fenomenologia

- **O que é:** a fenomenologia estuda a **experiência subjetiva**, o corpo vivido, a consciência que percebe. É o que a bailarina **sente** quando dança.
- **Na aula de balé:** a aluna que diz "sinto meu braço pesado". A professora que percebe o cansaço no olhar da criança.
- **Por que não basta:** a aluna pode **sentir** que está equilibrada, mas o corpo **estar** desalinhado. A fenomenologia é o que se sente; o agenciamento é o que **é**.
- **Por que agenciamento e não fenomenologia?** Porque o agenciamento **inclui** a fenomenologia, mas a **ultrapassa**. Ele considera não apenas o que a aluna sente, mas **as condições reais** do corpo: força, mobilidade, tempo de aprendizagem, carga cognitiva, contexto social.

<!-- _notes: Distinguir o vivido (fenomenologia) das condições reais do corpo (agenciamento), para justificar a escolha conceitual da apresentação. -->


---


## Glossário de Referência
### O Que é Potência? — Espinosa

- **O que é:** a capacidade de um corpo de **afetar e ser afetado**. É a **potência de agir** — não a vontade, mas a capacidade real de produzir efeitos.
- **Na aula de balé:** a aluna que consegue fazer um *tendu* com coordenação de braços **tem potência** para fazer um *tendu* em giro. A potência não é infinita; ela é **finita em estrutura, mas infinita em variabilidade**.
- **Por que é importante:** a potência não se força. Ela se **constrói**. O professor é um **arquiteto de agenciamentos** que cria as condições para que a potência emerja.

<!-- _notes: A potência é finita em estrutura (o corpo tem limites reais) e infinita em variabilidade (as combinações são infinitas). É essa tensão que sustenta toda a pedagogia proposta. -->


---


<!-- _class: mid -->

## O Quebra-Nozes (1892) — O Contexto dos Criadores

**O que Petipa, Ivanov e Tchaikovsky estavam pensando em 1892:**

- **Marius Petipa** (coreógrafo-chefe do Teatro Mariinsky) encomendou a música a Tchaikovsky após o sucesso de *A Bela Adormecida* (1890). Ele queria repetir a fórmula: um conto de fadas, uma partitura sinfônica, um espetáculo em grande escala.
- **Pyotr Ilyich Tchaikovsky** aceitou a encomenda, mas **não gostou do libreto**. Ele considerava *O Quebra-Nozes* "inferior" a *A Bela Adormecida*. Compôs a música em 1891-92, durante um período de luto pela morte de sua irmã.
- **Petipa adoeceu durante os ensaios** e confiou a coreografia ao seu assistente, **Lev Ivanov**. Foi Ivanov quem criou a maior parte do que sobreviveu — especialmente o Ato II (o Reino dos Doces).
- **A intenção original** era criar um **espetáculo familiar** — não um drama psicológico. O foco era o **divertissement** de doces, não a jornada interior de Clara.

**A pergunta:** *"O Quebra-Nozes que eu estou coreografando é o de 1892 — um espetáculo familiar — ou o de Nureyev, que é um sonho psico-erótico?"*

<!-- _notes: O contexto dos criadores originais. A diferença entre a intenção de 1892 e as leituras posteriores. Transição: a partir daqui começa a PARTE C — Os Grandes Balés de Repertório e Suas Releituras. -->


---


<!-- _class: mid -->

## A Evolução do Quebra-Nozes
### DE HOFFMANN A PETIPA (1/3)

**1816 — E.T.A. Hoffmann** escreve *"O Quebra-Nozes e o Rei dos Ratos"* — um conto **sombrio e psicológico** do Romantismo alemão.

**1844 — Alexandre Dumas** publica *"Histoire d'un casse-noisette"* — uma adaptação **mais leve e menos sombria**, destinada ao entretenimento infantil.

**1892 — Marius Petipa e Lev Ivanov** coreografam o balé para o Teatro Mariinsky, com música de **Tchaikovsky**. O libreto foi baseado na versão de **Dumas**, não na de Hoffmann.

- Petipa **adoeceu** durante os ensaios e confiou a coreografia a **Lev Ivanov**.
- A estreia foi um **fracasso de crítica** — Tchaikovsky considerou a produção "insuportável".
- Apenas a música sobreviveu — e se tornou uma das partituras mais amadas do repertório.

<!-- _notes: A evolução do texto. De Hoffmann a Dumas a Petipa. O fracasso inicial. -->


---


<!-- _class: mid -->

## O Quebra-Nozes — As Camadas Históricas
### O SOLO HISTÓRICO — A EUROPA DEPOIS DE NAPOLEÃO (1/6)

**Viena, 1815 — o mapa redesenhado à força:**

- Vinte e dois anos de guerras napoleônicas terminaram.
- A Restauração: **censura política, espionagem estatal, desilusão, conservadorismo**.
- A Alemanha **não é um país** — é um mosaico de reinos, ducados e cidades-estado.

**E a Revolução Industrial não veio só da Inglaterra:**

- A Inglaterra fez a **fábrica pesada**; a Alemanha fez a **precisão**.
- Relojoaria, brinquedo de lata e madeira, metalurgia fina — **Nuremberg e Dresden**.
- Polos mundiais de **autômatos**: bonecos de corda que imitavam a vida.

**A pergunta:** *"O mecanismo de precisão: fascínio ou terror?"*

<!-- _notes: Quando E.T.A. Hoffmann escreve "O Quebra-Nozes e o Rei dos Ratos", em 1816, a Europa está saindo de mais de duas décadas de banho de sangue: as Guerras Revolucionárias Francesas e o expansionismo de Napoleão Bonaparte. O Congresso de Viena (1815) tentou redesenhar o mapa e restaurar as antigas monarquias absolutistas, mergulhando o continente numa atmosfera de forte censura política, espionagem estatal, desilusão e conservadorismo. || É comum associarmos a Revolução Industrial exclusivamente à Inglaterra do carvão, das vilas operárias e das chaminés de Manchester. Na Alemanha da época — que não era um país unificado, mas um mosaico fragmentado de dezenas de pequenos reinos, ducados e cidades-estado, como a Prússia e a Saxônia — a industrialização assumiu ritmo e face muito particulares: enquanto a Inglaterra produzia máquinas pesadas em escala industrial acelerada, a Alemanha destacava-se pelo artesanato mecânico de alta precisão, pela relojoaria complexa, pela fabricação de brinquedos de lata e madeira e pela metalurgia fina. Cidades como Nuremberg e Dresden eram polos mundiais de mecânica delicada e de engenharia de autômatos (bonecos de corda). || Portanto, na Alemanha a Revolução Industrial não se apresentou inicialmente apenas como a grande fábrica suja, mas como o fascínio e o terror do mecanismo de precisão, do relógio que substitui o orgânico e da engrenagem que simula a vida. É esse o solo em que nasce o padrinho-relojoeiro de Hoffmann. || Os cenários das etapas seguintes: a França de 1844 vive a Monarquia de Julho e o triunfo definitivo da alta burguesia financeira e industrial, com Paris como capital mundial do luxo, da moda, da confecção de doces sofisticados, das grandes lojas de departamentos e dos livros ilustrados infantis. A Rússia Imperial de 1892 é um gigante agrário e autocrático em rápida e violenta industrialização tardia, impulsionada por capitais estrangeiros e por ferrovias como a Transiberiana, onde o luxo suntuoso e quase barroco da Corte dos Czares em São Petersburgo coexiste com a extrema pobreza camponesa e com o fermento das revoluções que explodiriam no século XX. -->


---


<!-- _class: mid -->

## O Quebra-Nozes — As Camadas Históricas
### DOIS ROMANTISMOS, DOIS ABISMOS (2/6)

**Romantismo alemão — o *Sturm und Drang* e o sombrio:**

- Reação visceral ao racionalismo do Iluminismo francês e à máquina.
- O inconsciente, o delírio, o medo, o misticismo — **Novalis, os Irmãos Grimm**.
- A infância **não é doce inocência**: é território febril, com monstros e traumas.

**Romantismo francês — a elegância, a forma, o lúdico:**

- **Victor Hugo, Dumas e Gautier**: social, político, exuberante, de aventura.
- Dumas opera a **"limpa cultural"**: banidos o horror psicológico e a crueldade.
- Resultado: um **conto de fadas elegante e moral** para o paladar burguês.

**A pergunta:** *"O Quebra-Nozes que eu conto é o do abismo alemão ou o do salão francês?"*

<!-- _notes: Para entender por que o conto de Hoffmann e a adaptação de Dumas são tão diferentes, é preciso compreender que o Romantismo alemão e o Romantismo francês nasceram de matrizes psicológicas e filosóficas opostas. || O Romantismo Alemão (o Sturm und Drang e o sombrio): na Alemanha, o Romantismo foi uma reação visceral contra o racionalismo frio do Iluminismo francês e contra a industrialização mecânica. Os autores alemães — Hoffmann, Novalis, os Irmãos Grimm — voltavam-se para o inconsciente, para o delírio, para o medo, para o misticismo e para o lado oculto da psique humana. Para eles, a infância não era um período de "doce inocência burguesa", mas sim um território perigoso, febril, habitado por monstros, traumas e imaginação desmedida. O fantástico alemão é gótico, ambíguo e muitas vezes assustador. || O Romantismo Francês (a elegância, a forma e o lúdico): na França, o Romantismo — que ganha força nos anos 1820-1840 com Victor Hugo, Dumas e Gautier — era mais social, político, exuberante e voltado para a narrativa de aventura, para o pitoresco e para a aristocracia dos sentimentos. Quando Alexandre Dumas adaptou Hoffmann em 1844, operou uma "limpa cultural": os elementos de horror psicológico, as febres delirantes e a crueldade foram sumariamente banidos. Dumas transformou o material bruto e indigesto do Romantismo alemão em um conto de fadas elegante, moral, polido e perfeitamente adequado ao paladar da burguesia parisiense. || Para a apresentação: vale mostrar que a "suavização" não é um acidente — é uma escolha estética e de mercado, e é ela que chega ao palco russo. -->


---


<!-- _class: mid -->

## O Quebra-Nozes — As Camadas Históricas
### 1816 — E.T.A. HOFFMANN E O CONTO ORIGINAL (3/6)

**Quem era:** polímata — escritor, jurista, caricaturista e **compositor**.

**A obra:** *Nußknacker und Mausekönig* (1816) — sombria, gótica, psicológica.

- A família é **Stahlbaum** — literalmente "Árvore de Aço".
- **Marie**, não Clara: criança febril, insone, entre a febre e a visão.
- O padrinho **Drosselmeier** é relojoeiro, mestre de autômatos.
- O **Rei dos Ratos de Sete Cabeças** lidera uma horda aristocrática.
- O fantástico expõe a fratura entre o mundo adulto e a imaginação infantil.

**A pergunta:** *"O que Hoffmann estava dizendo que a versão doce já não diz?"*

<!-- _notes: E.T.A. Hoffmann era um polímata: escritor, jurista, caricaturista e compositor, profundamente inserido no Romantismo alemão. Publicado em 1816 (Nußknacker und Mausekönig), o conto original é muito mais sombrio, gótico e psicológico do que a versão que conhecemos hoje. Ele reflete a visão de um autor que utilizava o fantástico para expor as fraturas entre a frieza do mundo adulto — burguês e racional — e a riqueza interior da imaginação infantil. A história original inclui traumas familiares, contos internos complexos (como a Lenda da Noz Pirlimpimpim) e uma atmosfera que beira o terror gótico leve. || A família chama-se Stahlbaum ("Árvore de Aço", um trocadilho irônico sobre a rigidez burguesa). A árvore de Natal é descrita com realismo impressionante — luzes e presentes caros que encenam a ostentação e o materialismo da burguesia alemã pós-guerra. Os pais são distantes, racionais e entediantes. Marie é a heroína original, solitária e empática, capaz de ver alma viva nos objetos; Fritz, o irmão, é destruidor e inclinado ao militarismo prussiano. São os dois lados da infância. || A atmosfera do conto é a da Alemanha da Restauração: censura, desilusão, uma burguesia que se fecha em casa e uma imaginação que transborda. -->


---


<!-- _class: mid -->

## O Quebra-Nozes — As Camadas Históricas
### 1844 — ALEXANDRE DUMAS E A LIMPA CULTURAL (4/6)

**O contexto:** a França da **Monarquia de Julho** — alta burguesia em ascensão.

- Paris: capital mundial do **luxo**, da moda e da **confeitaria sofisticada**.
- Surgem as **grandes lojas de departamentos** e o **livro infantil ilustrado**.

**A obra:** *Histoire d'un casse-noisette* (1844) — quase trinta anos depois.

- Dumas **suaviza o macabro e o grotesco** e limpa a estrutura narrativa.
- A menina passa a ser **Clara**; o tom fica leve, gracioso, digerível.
- O "Reino das Bonecas" vira **fantasia culinária e cortesã** — café, chá, chocolate.
- **É esta versão — não a de Hoffmann — que gera o libreto de São Petersburgo.**

**A pergunta:** *"Se eu cortasse o macabro, o que sobraria da história?"*

<!-- _notes: Quase trinta anos depois, o célebre escritor Alexandre Dumas (pai) reescreveu a história de Hoffmann sob o título Histoire d'un casse-noisette (1844). O contexto é a França da Monarquia de Julho, com uma burguesia em ascensão e o fortalecimento da literatura infantil ilustrada e fantástica. Paris é a capital mundial do luxo, da moda, da confecção de doces sofisticados, e onde surgem as grandes lojas de departamentos e o livro ilustrado para crianças. || A transformação: Dumas suavizou consideravelmente os elementos macabros e grotescos de Hoffmann. Limpou a estrutura narrativa, focou na jornada de Clara — chamada de Marie na história original — e deu um tom mais leve, gracioso e digerível para o público infantil e burguês da época. A menina passa a ser a pureza personificada, a menina bondosa que protege o herói maltrapilho; os ratos são reduzidos a um exército invasor comum, uma oposição mecânica e feia que o herói precisa derrotar para provar seu valor. || A maior mudança de Dumas, e que a Rússia herdaria, é o Reino dos Doces: ele transforma o "Reino das Bonecas" em um verdadeiro mundo de fantasia culinária e cortesã, uma corte governada por figuras mágicas femininas — o embrião da Fada dos Doces. É a celebração do açúcar, da confeitaria e da abundância exótica: o café da Arábia, o chá da China, o chocolate da Espanha, refletindo a fascinação francesa do século XIX pelo exotismo colonial e pelo luxo das confeitarias parisienses. || E o ponto decisivo para a apresentação: foi exatamente esta versão de Dumas, e não o texto original de Hoffmann, que serviu de base direta para a criação do libreto do balé em São Petersburgo. -->


---


<!-- _class: mid -->

## O Quebra-Nozes — As Camadas Históricas
### 1891–92 — TCHAIKOVSKY E A PARTITURA (5/6)

**O contexto:** a Rússia Imperial de **Alexandre III**; o apogeu dos Teatros Imperiais.

- A corte de São Petersburgo: luxo suntuoso, quase barroco.
- Fora do palácio: pobreza camponesa e o fermento das revoluções futuras.

**O homem:** consagrado por *A Bela Adormecida* e *Eugen Onegin* — e profundamente só.

- Melancolia e o peso sufocante de uma sociedade altamente repressora.
- 1891: inaugura o **Carnegie Hall**; recebe a notícia da morte da irmã **Alexandra**.

**A música:** não lidava com Hoffmann, mas com o **libreto estruturado por Petipa**.

- A marcha do Ato I **se desintegra**; às doze badaladas, entra o inconsciente.
- A **celesta**, escondida de Paris, imita **passos de fadas**; Clara é o limiar da adolescência.

**A pergunta:** *"O que essa partitura sabe sobre a perda da infância?"*

<!-- _notes: O contexto histórico é a Rússia Imperial sob o reinado rígido e conservador do czar Alexandre III, em pleno apogeu do prestígio dos Teatros Imperiais em São Petersburgo. O luxo suntuoso e quase barroco da corte czarista contrasta com a extrema pobreza camponesa e com a industrialização tardia e violenta do país. || O momento pessoal: Tchaikovsky estava no topo absoluto de sua glória artística — consagrado por A Bela Adormecida e Eugen Onegin — mas sua vida íntima era marcada por uma profunda melancolia, solidão e pelo peso sufocante de sua homossexualidade em uma sociedade altamente repressora. Durante a composição de O Quebra-Nozes (1891-1892), viajou para os Estados Unidos para inaugurar o Carnegie Hall e recebeu a devastadora notícia da morte de sua irmã favorita, Alexandra. || Detalhe técnico importante: Tchaikovsky não estava lidando com Hoffmann, mas com um libreto rigidamente estruturado por Marius Petipa, baseado em Dumas. A música dá alma psicológica ao que antes era apenas ação de conto de fadas. || Na ótica musical: a festa de Natal (Ato I, Quadro 1) é uma marcha marcial e burguesa que gradualmente se desintegra; os coros infantis e os temas de caixinha de música evocam a perda inevitável da infância. A árvore começa grande e acolhedora, mas à meia-noite — tema dos contrabaixos e tímpanos nas doze badaladas — a música sinaliza a entrada no inconsciente. || Clara é, para ele, a tradução musical do limiar da adolescência: o momento frágil em que a menina deixa de brincar com bonecas e desperta para o amor, a saudade e o mistério — o que explica o lirismo avassalador do Grand Pas de Deux do Ato II. O Quebra-Nozes/Príncipe é a projeção dos desejos e da coragem da própria Clara. Os ratos são traduzidos por uma música caótica, dissonante, rápida e estridente — sopros agudos, metais abafados — o retrato sonoro do medo infantil, do pesadelo febril, do barulho que assusta no escuro. || A partitura carrega essa dualidade dilacerante: uma alegria estrondosa, infantil e inovadora — marcada pelo uso pioneiro da celesta, instrumento que ele trouxe escondido de Paris para imitar o som de passos de fadas — mesclada a uma profunda nostalgia, a um lirismo melancólico e à sensação de perda da inocência da infância. O Reino dos Doces não é lugar de alegria superficial: é uma paisagem sonora de extrema sofisticação rítmica e melódica, com a celesta criando um som celestial e irreal na Dança da Fada dos Açucares. As danças nacionais — Árabe, Chinesa, Russa (Trepak), Espanhola — refletem o olhar da Rússia Imperial sobre o mundo exterior, filtrado pela nostalgia e pelo sonho. É onde Tchaikovsky pôde habitar um mundo de pureza infantil que sua vida adulta real, marcada pela dor e pela solidão, negava-lhe categoricamente. -->


---


<!-- _class: mid -->

## O Quebra-Nozes — As Camadas Históricas
### 1892 — IVANOV, PETIPA E A ESTREIA (6/6)

**A encomenda:** Petipa pede a música a Tchaikovsky após o sucesso de *A Bela Adormecida*.

- Petipa **adoece** nos ensaios; a coreografia cai sobre **Lev Ivanov**.
- Ivanov: sensibilidade musical extrema, ofuscado pela burocracia imperial.
- **No palco, crianças de verdade:** Belinskaya (12 anos) e o aluno Sergei Legat.
- A "Fada dos Açucares" é **outro papel** — a solista adulta Dell'Era.

**A estreia: Mariinsky, 18 de dezembro de 1892.**

- O Ato I ancora o espectador no **realismo doméstico** (*Grossvater-Tanz*).
- O Ato II: o **corpo de baile como paisagem onírica** — simetria, pontas, leveza.
- A *Valsa das Flores*: o peso da terra se dissipa em sonho etéreo.

**A pergunta:** *"Quem dança: um corpo adulto ou uma criança de verdade?"*

<!-- _notes: O projeto foi originalmente encomendado a Marius Petipa, o grande patriarca do balé imperial, que quis repetir a fórmula de A Bela Adormecida: um conto de fadas, uma partitura sinfônica, um espetáculo em grande escala. Mas Petipa adoeceu gravemente antes da estreia, e a responsabilidade coreográfica caiu sobre o segundo bailarino e coreógrafo, Lev Ivanov. Ivanov era um artista de extrema sensibilidade musical e emocional, embora frequentemente ofuscado pela burocracia de Petipa. || O contexto é o Teatro Mariinsky, em São Petersburgo, onde o luxo suntuoso da corte imperial contrastava com as tensões sociais crescentes que antecediam as revoluções russas. || Ivanov coreografou o Ato I com verossimilhança teatral impressionante: pais, tios, convidados e crianças não faziam passos técnicos rigorosos o tempo todo — andavam, cumprimentavam-se, dançavam danças de salão da época (o Grossvater-Tanz), agiam como uma verdadeira família burguesa russa do século XIX. A festa ancorava o espectador na realidade cotidiana antes de explodir no fantástico. || Na estreia, a protagonista não era dançada por uma bailarina adulta, mas por uma estudante da Escola Imperial de Balé — uma menina de 12 anos, Stansislava Belinskaya. Isso mudava tudo: a inocência era física, real, infantil. O Quebra-Nozes/Príncipe também era um aluno adolescente, Sergei Legat. Não tinham o virtuosismo atlético de um adágio adulto; tinham a graça e a ingenuidade do primeiro deslumbramento. Nota histórica: a "Fada dos Açucares" e seu Cavaleiro eram papéis separados, dançados por solistas adultos virtuosos, como a célebre italiana Antonietta Dell'Era. || Os ratos, na dança de Ivanov, eram tratados como uma massa grotesca que rastejava e desorganizava as formas geométricas simétricas do balé clássico, simbolizando a desordem orgânica contra a ordem geométrica humana dos soldadinhos de chumbo. || Para o Ato II (o Reino dos Doces) e a icônica Valsa das Flores, Ivanov criou uma atmosfera puramente etérea e onírica: o triunfo do corpo de baile clássico como paisagem. Não havia preocupação com narrativas dramáticas complexas — ele queria a beleza pura da geometria espacial, a respiração coletiva do corpo de baile, as linhas simétricas, o uso das pontas para criar a ilusão de fadas flutuando sobre nuvens de glacê. É a materialização coreográfica do sublime: o peso da terra — a realidade russa, o inverno rigoroso, o rigor do Teatro Imperial — dissipa-se em um sonho etéreo de leveza, luz e açúcar. Ele traduziu coreograficamente o conceito de que o balé não precisava apenas exibir proezas técnicas atléticas, mas evocar a textura mágica de um sonho infantil e o movimento de caixinhas de música. || A recepção: a estreia foi um fracasso de crítica. A Peterburgskaya Gazeta reclamou que "tanta música fina fosse gasta em bobagens indignas de atenção" e chamou a batalha dos ratos de "fraca e entediante". Tchaikovsky considerou a produção "insuportável". Apenas a música sobreviveu — e se tornou uma das partituras mais amadas do repertório. -->


---


<!-- _class: dense -->

## O Quebra-Nozes — O Raio-X das Personagens
### A FAMÍLIA, OS FILHOS E A ÁRVORE (1/5)

**Hoffmann (1816) — a árvore como vitrine do mundo burguês:**

- *Stahlbaum* = "Árvore de Aço"; presentes caros, pais distantes e entediados.
- **Fritz** quebra os soldadinhos de chumbo: a infância violenta do militarismo prussiano.
- **Marie** é solitária, febril, e enxerga alma viva nos objetos.

**Dumas (1844) — a árvore como centro da harmonia familiar:**

- Some a carga cínica; a festa fica acolhedora, mágica e lúdica.
- Fritz continua travesso — mas sem a crueldade psicológica do original.

**Tchaikovsky (1891) — a árvore que cresce e a meia-noite que rompe:**

- A marcha burguesa se desintegra; o coro infantil evoca a infância que se perde.
- Contrabaixos e tímpanos nas **doze badaladas**: a entrada no inconsciente.

**Ivanov (1892) — a festa que ancora o real antes do sonho:**

- Convidados e crianças andam, cumprimentam-se, dançam o *Grossvater-Tanz*.
- No palco, uma aluna real de 12 anos: a ingenuidade é física, não fingida.

<!-- _notes: Este é o raio-X de um mesmo elemento em quatro fases. A família, os filhos e a árvore de Natal. || Em Hoffmann (Alemanha, 1816): a família chama-se Stahlbaum ("Árvore de Aço" — uma sátira à frieza burguesa). A árvore de Natal é descrita com realismo mercantil, exibindo presentes caros que refletem a ostentação pós-guerra. Os pais são distantes e entediantes. O irmão, Fritz, é violento com os brinquedos e inclinado ao militarismo prussiano; a menina, Marie, é solitária e propensa a deliberações febris. || Em Dumas (França, 1844): a família mantém-se burguesa, mas perde a carga cínica. A árvore de Natal é o centro acolhedor da harmonia familiar lúdica. Fritz ainda é travesso, mas sem a crueldade psicológica do original. || Na música de Tchaikovsky (Rússia, 1891): a festa de Natal (Ato I) começa com uma marcha marcial que gradualmente se desintegra. Tchaikovsky usa coros infantis e temas de caixinha de música para evocar a perda inevitável da inocência. A árvore cresce magicamente na música, mas a chegada da meia-noite — marcada pelos contrabaixos pesados e pelas doze badaladas dos tímpanos — assinala a ruptura com a realidade. || Na coreografia de Ivanov (Rússia, 1892): o balé ancorava o espectador no realismo doméstico. Convidados e crianças andavam, cumprimentavam-se e dançavam danças de salão da época, criando uma moldura realista antes da explosão onírica. Na estreia, a protagonista era interpretada por uma criança real, aluna da Escola Imperial de 12 anos, trazendo uma ingenuidade física genuína ao palco. -->


---


<!-- _class: dense -->

## O Quebra-Nozes — O Raio-X das Personagens
### QUEM É A PROTAGONISTA — MARIE / CLARA (2/5)

**Hoffmann — Marie, a criança febril:**

- Insônia, alucinações e uma infecção grave depois da batalha com os ratos.
- Quando o Quebra-Nozes quebra, chora de tanta pena.
- Ao fim, casa-se com o boneco e vai morar no Reino das Bonecas: fuga ou morte?

**Dumas — Clara, a pureza personificada:**

- A menina bondosa que protege o herói maltrapilho.
- O nome **Clara** fixa-se no balé por influência russa posterior.

**Tchaikovsky — Clara como limiar da adolescência:**

- O momento frágil em que se deixa a boneca e se desperta para o amor e o mistério.
- É daí que vem o lirismo avassalador do *Grand Pas de Deux*.

**Ivanov — Clara dançada por uma criança:**

- **Belinskaya**, 12 anos, aluna da Escola Imperial — não uma bailarina adulta.
- Sem o virtuosismo de um adágio adulto: a graça do primeiro deslumbramento.

<!-- _notes: A protagonista muda de nome e de natureza em cada fase. || Em Hoffmann: chama-se Marie. É uma criança febril, que sofre de insônia e alucinações. O autor deixa ambíguo se são visões ou loucura. Quando o Quebra-Nozes quebra o braço, ela chora de pena; sofre uma infecção febril grave depois da suposta batalha com os ratos, cruzando a fronteira entre a loucura de uma infecção infantil grave e a fuga definitiva da realidade adulta. No fim, apaixona-se pelo boneco e aceita casar e ir morar no Reino das Bonecas — metaforicamente, a morte de uma criança febril ou sua fuga completa do mundo adulto. || Em Dumas: passa a ser chamada Clara (ou Marie, dependendo da tradução). É a pureza personificada, a menina bondosa que protege o herói maltrapilho. O nome Clara fixou-se no balé por influência russa posterior. || Na visão de Tchaikovsky: Clara é a tradução musical do limiar da adolescência — o momento frágil em que a menina deixa de brincar com bonecas e desperta para o amor, a saudade e o mistério, explodindo no lirismo avassalador do Grand Pas de Deux. || Na dança de Ivanov: a menina de 12 anos no palco não tinha o virtuosismo técnico de uma solista adulta; tinha a graça e a ingenuidade do primeiro deslumbramento. É um dado pedagógico precioso para quem monta o balé com crianças: a versão original colocou uma criança de verdade no centro da cena. -->


---


<!-- _class: dense -->

## O Quebra-Nozes — O Raio-X das Personagens
### OS RATOS E O REI DOS RATOS (3/5)

**Hoffmann — uma horda militarizada e aristocrática:**

- Não são bichinhos incômodos: são um **exército** com hierarquia.
- O **Rei dos Ratos de Sete Cabeças**: caos materialista, feiúra, tirania do real.
- Há **vingança política**: a rainha **Mouserink** e o velho caso do toucinho na corte.

**Dumas — um exército invasor comum:**

- Oposição mecânica e feia, a ser derrotada para provar o valor do herói.
- Perde a complexidade política e familiar da vingança de Mouserink.

**Tchaikovsky — o pesadelo em som:**

- Música caótica, dissonante, rápida e estridente: sopros agudos, metais abafados.
- É o barulho que assusta no escuro — o medo infantil traduzido em orquestra.

**Ivanov — a desordem contra a geometria:**

- A massa grotesca rasteja e **desorganiza as formações simétricas** do clássico.
- Ordem geométrica humana × desordem orgânica e animal.

<!-- _notes: Em Hoffmann: não são bichos comuns. São uma horda militarizada e aristocrática, liderada pelo Rei dos Ratos de Sete Cabeças. Representam a feiúra, o caos materialista e a tirania do mundo real invadindo o santuário infantil, carregando até uma motivação de "vingança política" contra a família por causa de um velho incidente com toucinho na corte. A mãe de Marie tem uma rixa antiga com a Rainha Mouserink, mãe dos ratos. || Em Dumas: reduzidos a um exército invasor comum, uma oposição mecânica e feia que o herói precisa derrotar para provar seu valor. || Na música de Tchaikovsky: traduzidos por uma música caótica, dissonante, rápida e estridente (sopros agudos e metais abafados) — o retrato sonoro do pesadelo e do medo infantil no escuro. || Na dança de Ivanov: tratados como uma massa grotesca que rastejava e desorganizava as formas geométricas simétricas do balé clássico, simbolizando a desordem orgânica contra a ordem geométrica humana dos soldadinhos de chumbo. -->


---


<!-- _class: dense -->

## O Quebra-Nozes — O Raio-X das Personagens
### O QUEBRA-NOZES E O PADRINHO (4/5)

**Hoffmann — Drosselmeier, o relojoeiro sombrio:**

- Não é tio, é **padrinho**: conselheiro de tribunal e mestre de autômatos.
- Arquétipo direto do **Dr. Coppelius** (*O Homem de Areia*).
- Conta a **"Lenda da Noz Pirlimpimpim"** — o conto dentro do conto.

**O Quebra-Nozes — o herói amaldiçoado pela feiúra:**

- Era o **sobrinho de Drosselmeier**, transformado em boneco de mandíbula grande.
- Uma princesa má pisou nele; a feiúra é a marca do mundo real.
- Só **Marie** enxerga a nobreza de espírito por trás da casca.

**Dumas e a Rússia — a suavização:**

- Vira o "tio Drosselmeyer", o mágico benevolente que comanda o sonho.
- O herói ganha contornos de **príncipe encantado** dos contos de fadas franceses.

<!-- _notes: Em Hoffmann, o padrinho Drosselmeier não é tio: é padrinho. Um conselheiro de tribunal que é, na verdade, um relojoeiro genial e sombrio, criador de autômatos e bonecos mecânicos. Ele é o arquétipo direto do Dr. Coppelius (O Homem de Areia), carregando o fascínio e o pavor de uma época em que a tecnologia mecânica parecia capaz de imitar e engolir a vida humana. É ele quem conta a "Lenda da Noz Pirlimpimpim", o conto dentro do conto que explica a origem do Quebra-Nozes. || O Quebra-Nozes, no conto original, é o reflexo trágico do sobrinho de Drosselmeier, amaldiçoado pela feiúra e salvo apenas pela empatia incondicional da menina. Ele foi transformado em boneco feio de mandíbula grande porque uma princesa má pisou nele e quebrou sua mandíbula enquanto ele tentava salvá-la de um feitiço. É o herói trágico, marginalizado pelo mundo real, com uma nobreza de espírito que só Marie enxerga. || Em Dumas e no balé russo, ele foi suavizado para "tio Drosselmeyer", transformando-se no mágico benevolente que comanda a engrenagem do sonho. O Quebra-Nozes ganha contornos de príncipe encantado clássico dos contos de fadas franceses, e a maldição é limpa e simplificada. -->


---


<!-- _class: dense -->

## O Quebra-Nozes — O Raio-X das Personagens
### O REINO DOS DOCES (5/5)

**Hoffmann — a Cidade de Marzipã:**

- **Não existe "Fada Açucarada" em Hoffmann.** Existe o **Reino das Bonecas**.
- Rios de limonada, pessoas de açúcar e amêndoas — o ápice do delírio de Marie.
- É a **fuga definitiva** do mundo sufocante dos adultos.

**Dumas — a fantasia culinária e cortesã:**

- Corte governada por figuras mágicas femininas: o **embrião da Fada dos Doces**.
- Exotismo colonial no paladar: café da Arábia, chá da China, chocolate da Espanha.

**Tchaikovsky — a paisagem sonora:**

- A **celesta** na *Dança da Fada dos Açucares*: som celestial, irreal, de outro mundo.
- Danças nacionais (Árabe, Chinesa, *Trepak*, Espanhola): o olhar do império.
- Um mundo de pureza infantil que sua vida adulta lhe negava.

**Ivanov — o corpo de baile como paisagem:**

- Linhas simétricas, pontas e respiração coletiva: fadas sobre nuvens de glacê.
- O peso da terra se dissipa: **materialização coreográfica do sublime**.

<!-- _notes: Em Hoffmann, o reino final é a Cidade de Marzipã, ou Reino das Bonecas. Um lugar construído pelo delírio febril de Marie, onde rios são de limonada e as pessoas são de açúcar e amêndoas, representando a fuga definitiva do mundo sufocante dos adultos. Ponto que costuma surpreender: não existe "Fada Açucarada" em Hoffmann; ela é uma invenção posterior. Em Hoffmann, quem governa é o Quebra-Nozes restaurado a príncipe, num mundo de doces e ordem geométrica perfeita. || Em Dumas, é transformado em um mundo de fantasia culinária e cortesã, celebrando o açúcar, a confeitaria e o exotismo colonial do século XIX: o café da Arábia, o chá da China, o chocolate da Espanha. A corte passa a ser governada por figuras mágicas femininas — o embrião da Fada dos Doces. || Na música de Tchaikovsky, é uma paisagem sonora de sofisticação inigualável. O uso pioneiro da celesta, trazida escondida de Paris, criou o som etéreo da Dança da Fada dos Açucares. As danças nacionais refletem o olhar da Rússia Imperial sobre o mundo, filtradas pela nostalgia. É onde ele pôde habitar um mundo de pureza infantil que sua vida adulta real lhe negava. O Reino dos Doces não é lugar de alegria superficial: é sofisticação rítmica e melódica. || Na coreografia de Ivanov, é o triunfo do corpo de baile clássico como paisagem onírica. Ele utilizou as linhas simétricas, as pontas e a respiração coletiva do corpo de baile para criar a ilusão de fadas flutuando sobre nuvens de glacê, onde o peso da terra se dissipa e dá lugar à leveza pura. -->


---


<!-- _class: map -->

## A Espiral dos Criadores — quatro nomes, um olho

<!-- ESPIRAL:INICIO — gerado de quebra-nozes-espiral.svg por tools/sincronizar-espiral.js; não editar à mão -->
<svg viewBox="0 0 1100 560" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;width:100%;height:auto;max-height:540px;background:#fbf8f3;font-family:Georgia,serif;">
  <defs>
    <marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#b08d57"/>
    </marker>
  </defs>
  <!-- Braço da espiral: a cadeia que desce de 1816 até o olho de 1892 -->
  <g stroke="#b08d57" stroke-width="2" fill="none" opacity="0.55" marker-end="url(#seta)">
    <path d="M 589 85 C 780 150, 840 220, 800 291"/>
    <path d="M 705 341 C 715 400, 655 435, 555 430"/>
    <path d="M 355 425 C 265 410, 255 235, 310 210" stroke-dasharray="7 5"/>
    <path d="M 455 175 C 500 140, 580 140, 620 183"/>
    <path d="M 527 220 C 553 232, 583 265, 600 285"/>
  </g>
  <!-- A corda que fecha o triângulo: a formação, de Petipa a Ivanov, sem passar pela música -->
  <g stroke="#b08d57" stroke-width="2" fill="none" opacity="0.55" marker-end="url(#seta)">
    <path d="M 555 440 C 600 465, 616 400, 616 233"/>
  </g>
  <!-- O que permaneceu depois da estreia: a fonte de 1816 e a partitura de 1891 -->
  <g stroke="#b08d57" stroke-width="2" fill="none" opacity="0.55" marker-end="url(#seta)">
    <path d="M 520 103 L 520 256" stroke-dasharray="2 4"/>
    <path d="M 450 225 C 452 238, 462 248, 470 256" stroke-dasharray="2 4"/>
  </g>
  <!-- 1816 — o anel externo -->
  <g>
    <rect x="389" y="53" width="200" height="50" rx="7" fill="#6b1f2e"/>
    <text x="489" y="75" fill="#ffffff" font-size="17" font-weight="bold" text-anchor="middle">E.T.A. HOFFMANN</text>
    <text x="489" y="93" fill="#d9c7a3" font-size="12" text-anchor="middle">1816 · Alemanha</text>
  </g>
  <!-- 1844 -->
  <g>
    <rect x="632" y="291" width="200" height="50" rx="7" fill="#6b1f2e"/>
    <text x="732" y="313" fill="#ffffff" font-size="17" font-weight="bold" text-anchor="middle">ALEXANDRE DUMAS</text>
    <text x="732" y="331" fill="#d9c7a3" font-size="12" text-anchor="middle">1844 · França</text>
  </g>
  <!-- 1892 — a coreografia -->
  <g>
    <rect x="355" y="405" width="200" height="50" rx="7" fill="#6b1f2e"/>
    <text x="455" y="427" fill="#ffffff" font-size="17" font-weight="bold" text-anchor="middle">MARIUS PETIPA</text>
    <text x="455" y="445" fill="#d9c7a3" font-size="12" text-anchor="middle">1892 · o libreto e a encomenda</text>
  </g>
  <!-- 1891-92 — a partitura -->
  <g>
    <rect x="310" y="175" width="200" height="50" rx="7" fill="#6b1f2e"/>
    <text x="410" y="197" fill="#ffffff" font-size="17" font-weight="bold" text-anchor="middle">TCHAIKOVSKY</text>
    <text x="410" y="215" fill="#d9c7a3" font-size="12" text-anchor="middle">1891–92 · a partitura</text>
  </g>
  <!-- 1892 — a estreia -->
  <g>
    <rect x="527" y="183" width="200" height="50" rx="7" fill="#6b1f2e"/>
    <text x="627" y="205" fill="#ffffff" font-size="17" font-weight="bold" text-anchor="middle">LEV IVANOV</text>
    <text x="627" y="223" fill="#d9c7a3" font-size="12" text-anchor="middle">1892 · a estreia</text>
  </g>
  <!-- O olho da espiral -->
  <g>
    <rect x="400" y="256" width="200" height="50" rx="7" fill="#b08d57"/>
    <text x="500" y="278" fill="#ffffff" font-size="17" font-weight="bold" text-anchor="middle">O QUEBRA-NOZES</text>
    <text x="500" y="296" fill="#fdf6ea" font-size="12" text-anchor="middle">Mariinsky, 18 dez 1892</text>
  </g>
  <!-- Legenda -->
  <g font-size="13" fill="#5a5348">
    <line x1="20" y1="489" x2="56" y2="489" stroke="#b08d57" stroke-width="2"/>
    <text x="66" y="494">transmissão direta — o texto, o libreto, a encomenda, a formação</text>
  </g>
  <g font-size="13" fill="#5a5348">
    <line x1="20" y1="511" x2="56" y2="511" stroke="#b08d57" stroke-width="2" stroke-dasharray="7 5"/>
    <text x="66" y="516">influência institucional — o Teatro Imperial, o formato, o prazo</text>
  </g>
  <g font-size="13" fill="#5a5348">
    <line x1="20" y1="533" x2="56" y2="533" stroke="#b08d57" stroke-width="2" stroke-dasharray="2 4"/>
    <text x="66" y="538">o que permaneceu depois da estreia — a fonte, a música</text>
  </g>
</svg>
<!-- ESPIRAL:FIM -->

<p style="text-align:center;font-size:14px;color:#5a5348;font-style:italic;margin:8px 0 0;">Sólido = transmissão direta · tracejado = influência institucional · pontilhado = o que permaneceu depois da estreia</p>

**A pergunta:** *"Onde termina quem forma e onde começa a obra?"*

<!-- _notes: Esta espiral não é uma linha do tempo: é um mapa de forças. O braço externo é a cadeia que desce de 1816 até o olho de 1892 — Hoffmann escreve o conto, Dumas o reescreve para o salão francês. O olho, em dourado, é O Quebra-Nozes como obra: Mariinsky, 18 de dezembro de 1892. || Leia as três cores de traço: a linha sólida é transmissão direta — o texto, o libreto, a encomenda, a formação (é a corda que fecha o triângulo de Petipa a Ivanov, sem passar pela música: foi Petipa quem formou Ivanov, e foi Petipa quem encomendou o libreto). A linha tracejada é influência institucional — o Teatro Imperial, o formato, o prazo, o gosto da corte que condiciona a escolha do que entra no palco. A linha pontilhada é o que permaneceu depois da estreia — a fonte de 1816 e a partitura de 1891, que continuam vivas quando a coreografia já foi reescrita várias vezes. || A relação não era linear e não era harmônica: Petipa adoeceu, Ivanov assumiu, Tchaikovsky trabalhou sobre um libreto que não gostou, e o autor original morrera havia trinta anos. Quatro criadores, quatro pressões diferentes — e uma única obra resultante. || Sugestão de condução: percorrer a espiral de fora para dentro, mostrando que cada volta acrescenta uma camada sem apagar a anterior. -->


---


<!-- _class: mid -->

## A Política de O Quebra-Nozes
### A CORTE COMO ORDEM NATURAL (1/3)

**São Petersburgo, 1892 — o palco como espelho de uma estrutura de classes:**

- Autocracia dos czares; sociedade agrária, desigual, sob rigoroso controle policial.
- Industrialização tardia e forçada, com capital estrangeiro e a **Transiberiana**.

**O Ato I apresenta a ordem social como natural e inquestionável:**

- Adultos dançam com elegância polida; crianças ricas recebem brinquedos caros.
- A hierarquia é mantida com **perfeição geométrica**.

**O casamento como aliança e fechamento:**

- A apoteose, a coroação e a união dos jovens: um ciclo que **se fecha sobre si**.
- O "Reino dos Doces": o mundo exterior como **catálogo exótico a serviço da corte**.
- Uma **cortina de veludo e ouro** entre a aristocracia e as tensões já nas ruas.

**A pergunta:** *"O que o palco deixa de fora quando mostra só o salão?"*

<!-- _notes: O balé clássico, especialmente nos Teatros Imperiais da Rússia do final do século XIX, nunca foi um mero entretenimento inofensivo: ele era uma ferramenta de legitimação ideológica e um espelho da estrutura de classes. || A Rússia Imperial de 1892: na estreia no Teatro Mariinsky, o país vivia sob o regime autocrático dos czares (Alexandre III e depois Nicolau II), numa sociedade agrária profundamente desigual, mantida sob rigoroso controle policial e em plena industrialização tardia e forçada. || O espelho da corte: o Ato I, a festa burguesa/aristocrática da família Stahlbaum, apresentava a ordem social da época como algo natural, harmonioso e inquestionável. Os adultos dançam com elegância polida, as crianças ricas recebem brinquedos caros, e a hierarquia social é mantida com perfeição geométrica. || O casamento como aliança e fechamento: a resolução do enredo clássico — que culmina na apoteose do reino mágico, na coroação e na união dos jovens — reflete a lógica de preservação do poder daquela elite. É um ciclo que se fecha sobre si mesmo. O "Reino dos Doces", com suas danças exóticas que representavam os povos colonizados ou comercializados pelo império, exibia o mundo exterior como um pomposo catálogo exótico a serviço do prazer da corte de São Petersburgo. Não há espaço para a plebe, para a miséria das fábricas nascentes de São Petersburgo ou para a desigualdade agrário-industrial; o balé operava como uma cortina de veludo e ouro que isolava a aristocracia das tensões revolucionárias que já fervilhavam nas ruas. -->


---


<!-- _class: mid -->

## A Política de O Quebra-Nozes
### DO CZAR AO SOVIETE AO CONSUMIDOR (2/3)

**1917 — a apropriação soviética:**

- O Estado bolchevique **não destrói** o balé clássico: **absorve e reinterpreta**.
- O balé vira "patrimônio do povo"; as récitas são ajustadas para **purgar o "burguesismo"**.
- **Clara passa a Masha**; a vitória sobre os ratos ganha leitura de **vitória coletiva**.

**Meio do século XX — a tradução americana:**

- **Balanchine, 1954, New York City Ballet**: a obra vira o **mito fundador do Natal consumista**.
- Árvore gigantesca, presentes em família, abundância: o grande ritual da classe média.
- A dança clássica passa a significar **segurança, conforto material e magia familiar**.

**A mesma partitura, o mesmo libreto — três mundos:**

- Autocracia imperial russa → coletivismo soviético → capitalismo de consumo.

**A pergunta:** *"Que roupa o Quebra-Nozes veste na versão que eu monto?"*

<!-- _notes: Após a Revolução de 1917, o regime bolchevique precisou decidir o que fazer com a alta cultura imperial. Em vez de destruir o balé clássico, o Estado soviético o absorveu e o reinterpretou sob lentes ideológicas. O balé passou a ser visto como patrimônio do povo, mas as récitas sofreram adaptações em várias épocas para purgar o excesso de "burguesismo". A figura da menina Clara — passando a ser chamada de Masha em muitas leituras soviéticas — e a vitória sobre os ratos ganharam, por vezes, leituras alegóricas de vitória coletiva sobre forças caóticas ou reacionárias. || A tradução americana (o Natal comercial): quando O Quebra-Nozes foi abraçado pelos Estados Unidos a partir de meados do século XX, especialmente com a versão seminal de George Balanchine em 1954 pelo New York City Ballet, a política mudou de eixo: de apologia à aristocracia russa para o mito fundador do consumismo familiar capitalista pós-Segunda Guerra Mundial. A árvore de Natal gigantesca, os presentes em família e a abundância transformaram a obra no grande ritual da classe média ocidental, associando a dança clássica à segurança, ao conforto material e à magia familiar burguesa. || O fecho analítico: a política de O Quebra-Nozes é a história de como uma mesma partitura e um mesmo libreto conseguiram vestir as roupas de três mundos radicalmente opostos: a autocracia imperial russa, o coletivismo soviético e o capitalismo de consumo americano. -->


---


<!-- _class: mid -->

## A Política de O Quebra-Nozes
### A TÉCNICA COMO ESTÉTICA DE PODER (3/3)

**O que os estudos históricos e cinesiológicos apontam:**

- A busca implacável da **linha vertical** e o ***en dehors*** forçado.
- A **rigidez geométrica** do corpo de baile: uma **estética de poder**.
- O corpo da bailarina imperial: **dócil, controlado, geometricamente perfeito** — ecoando a disciplina do próprio Estado.

**E é exatamente aí que este projeto se posiciona:**

- O **rastro**, as **pré-condições corporais** e a **autonomia** do aprendizado, aula a aula.
- Devolver a quem aprende — a criança, o corpo real — o **controle do próprio processo de formação**.
- Romper a lógica de que o corpo serve a um padrão externo imposto.

**A pergunta:** *"Quem decide o que este corpo vai se tornar?"*

<!-- _notes: Teóricos da dança e historiadores culturais apontam que a técnica clássica em si — a busca implacável pela linha vertical, o en dehors forçado, a rigidez geométrica do corpo de baile — carrega uma estética de poder. O corpo da bailarina clássica na Rússia Imperial era treinado para ser dócil, extremamente controlado e geometricamente perfeito, ecoando a disciplina exigida pelo próprio Estado autocrático. || E aqui a apresentação vira para dentro do nosso trabalho: quando um sistema de proveniência resgata as pré-condições corporais, o rastro e a autonomia do aprendizado aula a aula, ele devolve ao indivíduo — à criança, ao corpo real — o controle sobre o próprio processo de formação. Rompe a lógica industrial ou aristocrática de que o corpo é apenas uma engrenagem dócil a serviço de um padrão externo imposto. || É a mesma tese que atravessa todo o deck: o corpo que dança não é isca, não é vitrine, não é peça de uma produção — é arte e é processo. O rigor técnico não é abandonado; ele deixa de ser um fim imposto de fora e passa a ser um meio construído de dentro. || Material complementar: o texto consolidado com as quatro fontes na íntegra, para leitura antes da apresentação, está em apresentacoes/apresentacao-01-rizoma/quebra-nozes-guia-de-narracao.md (PDF em out/quebra-nozes-guia-de-narracao.pdf). -->


---


<!-- _class: mid -->

## A Evolução do Quebra-Nozes
### AS VERSÕES DO SÉCULO XX (2/3)

**1954 — George Balanchine** (New York City Ballet)

- Primeira produção em tamanho integral. Mantém os elementos perturbadores de Hoffmann como **tema menor**.

**1967 — Rudolf Nureyev** (Royal Swedish Ballet / Paris Opera Ballet em 1985)

- Introduz uma leitura **psicanalítica e sexual explícita**. O pas de deux é uma representação do **despertar sexual** de Clara.

**1976 — Mikhail Baryshnikov** (American Ballet Theatre)

- Acentua o despertar sexual, mas com uma **sensualidade vibrante e brincalhona**. Equilibra virtuosismo e charme cênico.

**1984 — Peter Wright** (The Royal Ballet)

- Foco no **amadurecimento e na coragem**. Sexualidade **sutil ou inexistente**. É a versão natalina oficial da companhia até hoje.

<!-- _notes: As quatro versões principais do século XX. Cada uma com uma abordagem diferente. -->


---


<!-- _class: mid -->

## A Evolução do Quebra-Nozes
### SEMIÓTICA DOS GESTOS (3/3)

**O que cada gesto significa muda de versão para versão:**

- **Nureyev:** a promenade com a pelve encaixada é **obscena** — uma representação explícita do ato sexual. O gesto diz: *"Eles estão consumando o amor."*

- **Peter Wright:** a mesma cena é **sutil e recatada** — focada no amadurecimento e na coragem. O gesto diz: *"Clara está crescendo."*

- **Baryshnikov:** o mesmo gesto é **brincalhão e vibrante** — parte da comédia americana. O gesto diz: *"Eles estão se divertindo."*

**A pergunta central:** *"O que esse gesto está dizendo na versão que eu estou copiando?"*

<!-- _notes: A semiótica dos gestos. O mesmo movimento, significados completamente diferentes. -->


---


<!-- _class: table-lg -->

## O Quebra-Nozes — Linha do Tempo das Releituras

| Ano | Coreógrafo | Companhia | Contexto |
|:---:|---|---|---|
| **1816** | — | — | Hoffmann escreve o conto original |
| **1844** | — | — | Dumas publica a adaptação francesa |
| **1892** | Petipa / Ivanov | Teatro Mariinsky | Produção original, familiar e infantil |
| **1934** | Vasily Vainonen | Kirov Ballet | Versão soviética, realismo dramático |
| **1954** | George Balanchine | New York City Ballet | Elementos perturbadores como tema menor |
| **1967** | Rudolf Nureyev | Royal Swedish Ballet / Paris Opera Ballet | Leitura psicanalítica e sexual |
| **1976** | Mikhail Baryshnikov | American Ballet Theatre | Sensualidade vibrante e brincalhona |
| **1984** | Peter Wright | The Royal Ballet | Realismo mágico, foco na coragem |

<!-- _notes: A linha do tempo completa. Da literatura ao balé. A versão soviética de 1934 (Vainonen, Kirov Ballet) é a base das releituras de Nureyev e Baryshnikov no Ocidente — e mostra o Realismo Socialista aplicado ao Quebra-Nozes; sem ela, o salto de 1892 para 1954 fica grande demais. -->


---


## O Quebra-Nozes — A Crítica da Época

**O que os críticos disseram em cada versão:**

- **1892 (Ivanov, Mariinsky):** o jornal *Peterburgskaya Gazeta* lamentou que *"tanta música fina fosse gasta em bobagens indignas de atenção"*. A batalha dos ratos foi descrita como *"fraca e entediante"*.
- **1954 (Balanchine, NYCB):** John Martin, do *The New York Times*, aconselhou o público a chegar *"por volta das 10 horas, quando os adultos assumem"* e chamou a produção de *"não muito de um balé"*.
- **1967 (Nureyev):** Clement Crisp, do *The Spectator*, escreveu que a produção *"combina coreografia sem distinção com drama igualmente sem distinção"*. A obra ficou conhecida como **"sonho psico-erótico"**.
- **1976 (Baryshnikov, ABT):** o *The New York Times* descreveu como *"atraente, seu conceito recompensador e a coreografia consistentemente envolvente"*.
- **1984 (Peter Wright, Royal Ballet):** a crítica chamou de *"um Rolls-Royce reluzente de uma produção"*, que *"nunca sucumbe a uma doçura enjoativa"*.

**A pergunta:** *"O que a crítica da época disse sobre a versão que eu estou copiando?"*

<!-- _notes: A recepção crítica de cada versão. O que cada época valorizou ou rejeitou. -->

