---
marp: true
theme: default
size: 16:9
paginate: true
header: '**O Repertório Vivo** — O Corpo, o Arquivo e o Rizoma'
footer: 'Formação em Balé Clássico (7 a 12 anos)'
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

## As Origens e a Grande Reforma (Séculos XVII–XVIII)

**Do Balé de Corte ao Balé Profissional:** o balé nasceu nas cortes italianas e francesas como entretenimento da nobreza. A profissionalização veio com a criação da **Academia Real de Dança** na França, por Luís XIV.

**John Weaver e a Primeira Faísca da Reforma:** em 1717, em Londres, **John Weaver** criou *The Loves of Mars and Venus*, um balé que contava uma história apenas através do gesto, sem palavras. Ele foi um dos primeiros a defender um **"balé de ação"**.

**Jean-Georges Noverre e o "Ballet d'Action":** **Noverre** (1727–1810) sistematizou essas ideias em suas *Lettres sur la danse* (1760). Ele defendeu que o balé deveria ser uma forma de arte dramática independente, com enredo e expressão, lutando contra o uso de máscaras e figurinos pesados e pedindo **naturalidade e expressividade**.

<!-- _notes: O ponto central aqui é a passagem do divertimento de corte para a arte cênica autônoma: gesto que narra, corpo que diz sem palavras. -->

---

## O Romantismo e o Nascimento da Bailarina Etérea (Século XIX)

**Marie Taglioni e a Sapatilha de Ponta:** no contexto do Romantismo, **Marie Taglioni** (1804–1884) se tornou um ícone. Em 1832, em *La Sylphide*, seu pai, Filippo Taglioni, a colocou em sapatilhas de ponta para criar a ilusão de uma criatura etérea. Isso marcou o início da **"dança nas pontas"**.

**Giselle e a Consolidação do "Balé Romântico":** *Giselle* (1841) é a obra-prima do balé romântico, incorporando temas como **o amor que transcende a morte, a loucura e o sobrenatural (as Wilis)**. A partir daqui, a bailarina se torna a figura central, muitas vezes retratada como um ser frágil e etéreo.

<!-- _notes: Observar como um ideal estético de época (o etéreo, o frágil) se transforma, mais tarde, em expectativa sobre corpos reais de crianças e adolescentes. -->

---

## A Decadência na Europa e o Renascimento na Rússia (1/2)

**O Êxodo do Balé:** após seu auge na França com o Romantismo, o balé entrou em **declínio na Europa Ocidental a partir de 1830**.

**A Preservação na Dinamarca (August Bournonville):** na Dinamarca, **August Bournonville** (1805–1879) dirigiu o **Balé Real da Dinamarca** por quase 50 anos, criando um estilo próprio e preservando a técnica clássica que estava se perdendo em outros lugares.

**A Excelência Técnica na Itália (Enrico Cecchetti):** na Itália, a **Escola Italiana** produziu grandes mestres, como **Enrico Cecchetti** (1850–1928). Seu método de ensino ficou famoso pela **técnica difícil e vigorosa**, focando em equilíbrio, postura e força.

<!-- _notes: O êxodo do balé. A preservação na Dinamarca e na Itália. -->

---

## A Era de Ouro na Rússia (2/2)

**Marius Petipa (1818–1910):** o coreógrafo francês se torna a figura dominante por mais de 50 anos, considerado o **"pai do balé clássico"**.

- Ele criou a estrutura do **Grand Ballet** — espetáculos em vários atos, com o **pas de deux** como peça central.
- Codificou a técnica que é a base do balé até hoje.
- Suas obras-primas incluem **O Lago dos Cisnes**, **A Bela Adormecida** e **O Quebra-Nozes**, todas em colaboração com **Tchaikovsky**.

<!-- _notes: Petipa como codificador do balé clássico. A estrutura do Grand Ballet. -->

---

<!-- _class: mid -->

## Curiosidades: Tchaikovsky e Petipa

**A parceria mais produtiva (e mais tensa) da história do balé.**

- **O primeiro encontro:** Petipa e Tchaikovsky se conheceram em **1886**, em São Petersburgo, para um projeto que nunca foi realizado (*Undina*).
- **A tensão criativa:** Tchaikovsky e Petipa **discordavam frequentemente** sobre o libreto e a estrutura coreográfica. Ambos consideravam o libreto de *O Quebra-Nozes* **"inferior"** ao de *A Bela Adormecida*.
- **A celesta secreta:** Tchaikovsky mandou trazer a **celesta da França em segredo**, com medo de que seus rivais a usassem antes dele.
- **A doença de Petipa:** durante os ensaios de *O Quebra-Nozes*, Petipa **adoeceu gravemente** e confiou a coreografia ao seu assistente, **Lev Ivanov**.
- **O fracasso inicial:** *O Quebra-Nozes* foi um **fracasso de crítica** na estreia. Tchaikovsky escreveu que a produção era **"insuportável"** e que a música era **"subpar"**.

*"A fofoca é histórica: a parceria que mudou o balé quase não aconteceu — e ninguém acreditou no Quebra-Nozes."*

<!-- _notes: Alívio cômico. A parceria tensa que produziu as obras-primas. -->

---

## A Ruptura Moderna e o Século XX

**Michel Fokine e os Ballets Russes:** no início do século XX, **Michel Fokine** (1880–1942) protestou contra as rígidas convenções de Petipa, propondo uma reforma baseada na **unidade do espetáculo**. A plataforma para essas ideias foi a companhia **Ballets Russes**, de **Sergei Diaghilev** (1872–1929), que revolucionou a arte da dança integrando os maiores artistas da época.

**George Balanchine e o New York City Ballet:** **George Balanchine** (1904–1983) fundou a **School of American Ballet** e, em 1948, o **New York City Ballet (NYCB)**. Balanchine criou um **novo estilo de balé**, conhecido como **balé neoclássico**, focado na música e no movimento puro.

<!-- _notes: Do espetáculo total de Diaghilev ao movimento puro de Balanchine: a dança passa a se pensar também como investigação formal. -->

---

## O Balé do Marquês de Cuevas

**O Marquês George de Cuevas (1886–1961)** foi um importante empresário e diretor de balé.

Sua companhia, o **Grand Ballet du Marquis de Cuevas**, com sede em Paris, foi uma das mais importantes do mundo entre as décadas de **1940 e 1960**, revelando grandes artistas.

Ela foi um **elo crucial** entre o balé europeu e o continente americano.

Foi nela que **Rudolf Nureyev** encontrou seu primeiro refúgio profissional após desertar da URSS.

<!-- _notes: Contexto histórico. A companhia como ponte entre Europa e América. -->

---

## Hugo Delavalle — A Trajetória

- O bailarino e coreógrafo argentino **Hugo Delavalle** fez parte do elenco do **Grand Ballet du Marquis de Cuevas**.
- Mais tarde, fez carreira em **Stuttgart, na Alemanha**, onde teve a oportunidade de **dançar ao lado de Rudolf Nureyev**.
- Sua trajetória é citada no **livro comemorativo aos 50 anos do Stuttgart Ballet**.
- **Documentário:** *A Trajetória Profissional do Bailarino e Coreógrafo Hugo Delavalle* (2014), dirigido por **Karen Prestes**, sua aluna em Passo Fundo (RS), com depoimentos de Ana Botafogo e de ex-integrantes do grupo de dança que ele criou na cidade.
- **Artigo acadêmico:** *Somente e Para Sempre Bailarino: o Papel de Hugo Delavalle em Curitiba* (Jonathan Diogo Ramos et al.) detalha sua passagem pelo Grand Ballet Marques de Cuevas e as montagens que dirigiu.

<!-- _notes: A trajetória internacional de Delavalle. O elo direto com Nureyev e com os grandes centros. -->

---

## Hugo Delavalle — O Legado no Brasil

- Delavalle veio para o Brasil e, como diretor do **Balé Teatro Guaíra (BTG)**, foi uma figura fundamental para a nossa região.
- **Registros do Teatro Guaíra:** o site oficial confirma que *"Delavalle propôs Giselle, que trouxe reconhecimento nacional para o grupo"*, com temporada de sucesso em São Paulo e no Rio de Janeiro, tendo **Ana Botafogo no papel título**.
- **Filme:** ele aparece creditado no elenco da versão para a TV do balé *O Quebra-Nozes*, de 1964, com Edward Villella e Melissa Hayden.
- **Tese da USP:** uma tese de doutorado descreve Delavalle como um *"bailarino argentino que fez carreira em Stuttgart, na Alemanha"* e que estava dirigindo uma versão de *Giselle* no Balé Teatro Guaíra.

<!-- _notes: O legado de Delavalle no Brasil. A montagem de Giselle que revelou Ana Botafogo. -->

---

## Vaslav Veltchek: A Ponte Europeia na Formação Brasileira

- **Vaslav Veltchek** (1897-1968), bailarino, coreógrafo e diretor nascido em **Praga**, chegou ao Brasil em **1939**.
- Veio após uma temporada no Theatro Municipal do Rio de Janeiro ao lado de **Maria Olenewa**, e aqui permaneceu devido à Segunda Guerra Mundial.
- Foi o **diretor artístico e pedagógico** da Academia Brasileira de Dança, onde formou uma geração de artistas.
- Em **1944**, fundou o **Conjunto Coreográfico Brasileiro**, companhia que atuou até 1951 e fez turnês pelo Brasil, Uruguai e Argentina.
- Sua pedagogia unia o **rigor da escola europeia** ao **calor da cultura brasileira**, formando a base de uma linhagem de bailarinos e professores.

<!-- _notes: Veltchek como a ponte entre a tradição europeia e a formação da dança brasileira. -->

---

## Yellê Bittencourt: Do Palco Internacional à Pedagogia

- **Yellê Bittencourt** (1932-2013), bailarino, professor e coreógrafo carioca, iniciou seus estudos com **Vaslav Veltchek**.
- Em **1947**, foi premiado como **"melhor bailarino"** pela Associação Brasileira de Críticos Teatrais.
- Fez carreira internacional, dançando no **Ballet Russe de Monte Carlo, Joffrey Ballet, New York City Ballet e Radio City Music Hall**.
- De volta ao Brasil em **1970**, tornou-se **professor do Balé da Cidade de São Paulo**.
- Lecionou como convidado na Suíça (Grand Théâtre de Genève), na companhia de **Maurice Béjart** e na **Ópera de Berlim**.
- Sua pedagogia era reconhecida pelo **rigor técnico e progressivo**, sendo um crítico da noção de dança apenas como "expressão corporal".

<!-- _notes: Yellê como o elo entre a prática internacional e a formação técnica no Brasil. -->

---

## Ady Addor: A Primeira Brasileira no American Ballet Theatre

- **Ady Addor** (1935-2018), carioca, foi primeira bailarina em companhias de renome como **Theatro Municipal do Rio de Janeiro, Ballet do IV Centenário (SP), Ballet Nacional da Venezuela e Ballet Nacional de Cuba**.
- Foi **primeira bailarina do American Ballet Theatre**, em Nova York, na década de 1950.
- Encerrou a carreira de bailarina em **1961**, aos 26 anos, e tornou-se uma das mais respeitadas **professoras de balé** do país.
- Lecionou no **Balé da Cidade de São Paulo**, formando gerações de bailarinos.

<!-- _notes: Ady Addor como a ponte entre o Brasil e o American Ballet Theatre. -->

---

## Ana Botafogo e a Tradição da Primeira Bailarina

- A estreia de **Ana Botafogo** no BTG, em **1977**, na montagem de *Giselle* dirigida por Delavalle, a consolidou como **primeira-bailarina** e a projetou nacionalmente.
- Essa tradição — de uma bailarina se tornar "primeira bailarina" ao assumir um papel de protagonista — é uma prática antiga no balé.
- No **Royal Ballet**, por exemplo, a tradição de **presentear com flores no palco** é reservada para a primeira bailarina; se ela não recebe flores, **nenhuma outra bailarina as recebe naquele momento**, reforçando sua posição de destaque.

<!-- _notes: A tradição da primeira bailarina. O gesto das flores como marca de hierarquia e reconhecimento. -->

---

## Yanka Rudzka e a Semente na Bahia

- **Yanka Rudzka** (1916–2008), bailarina e coreógrafa polonesa, chegou ao Brasil em **1952** a convite do reitor **Edgar Santos** para dirigir a recém-criada **Escola de Dança da UFBA** — a primeira faculdade de dança do Brasil.
- Trouxe na bagagem a experiência com o **expressionismo alemão** e a dança moderna europeia.
- Suas primeiras montagens na UFBA foram **"Candomblé"** e **"Águas de Oxalá"**, fundindo a técnica moderna com a cultura afro-brasileira.
- Permaneceu em Salvador por pouco mais de três anos, mas sua influência foi decisiva: **formou a primeira geração de professoras e coreógrafas** que dariam continuidade ao trabalho na Bahia.

<!-- _notes: Yanka Rudzka como o primeiro grande ramo da dança moderna no Brasil. A UFBA como polo de irradiação. -->

---

## Rolf Gelewski e a Consolidação na Bahia

- **Rolf Gelewski** (1930–1988), dançarino e coreógrafo alemão, chegou à Bahia em **1960** e deu continuidade ao trabalho de Yanka Rudzka.
- Foi o **introdutor e organizador das bases curriculares** do primeiro curso superior de dança do país na **UFBA**.
- Em **1962**, fundou o **Grupo de Dança Contemporânea (GDC) da UFBA**, que dirigiu até 1970, realizando apresentações em Salvador, no interior da Bahia e em outras capitais.
- Sua pedagogia, baseada na **"dança espontânea"**, influenciou gerações de artistas e educadores.

<!-- _notes: Gelewski como o consolidador do ensino superior em dança no Brasil. A UFBA como centro de formação e irradiação. -->

---

## Maria Olenewa e a Primeira Escola de Dança Clássica

- **Maria Olenewa** (1896–1965), bailarina russa formada em Moscou, mudou-se para o Brasil em **1926**.
- Em **1927**, fundou a **Escola de Danças Clássicas do Theatro Municipal do Rio de Janeiro** — a **mais antiga instituição brasileira** dedicada ao ensino da dança clássica e à formação de bailarinos.
- A escola, hoje **Escola Estadual de Dança Maria Olenewa (EEDMO)**, formou gerações de bailarinos que constituíram o **Corpo de Baile do Theatro Municipal**.
- Sua abordagem unia o rigor da escola russa com a realidade brasileira, criando as bases do balé clássico profissional no país.

<!-- _notes: Maria Olenewa como a fundadora do ensino do balé clássico no Brasil. O Theatro Municipal como berço da formação profissional. -->

---

## Maria Pia Finócchio e a Difusão em São Paulo

- **Maria Pia Finócchio** foi **primeira bailarina do Theatro Municipal de São Paulo** por duas décadas (1963–1983), atuando em cerca de cinquenta espetáculos.
- Foi também **coreógrafa e primeira bailarina da TV Tupi**, sendo pioneira na **educação artística pela televisão** (TV Cultura e TV Educativa).
- Como dirigente do **SINDDANÇA** (Sindicato dos Profissionais da Dança do Estado de São Paulo), criou o **ENDA (Encontro Nacional de Dança)**, que reúne companhias de todo o país.
- Sua atuação conectou o palco à formação, à produção e à política cultural, ampliando o alcance do balé clássico para além do teatro.

<!-- _notes: Maria Pia como ponte entre o palco, a TV e a política cultural — e agora também como elo de linhagem. Ela se formou na **Escola Municipal de Bailados de São Paulo (1940)**, o berço da formação clássica paulista e a base do futuro Balé da Cidade: é por ali que a tradição russa chega a São Paulo (a linha tracejada do mapa). A difusão do balé para além do teatro. -->

---

## O Balé da Cidade de São Paulo e a Ditadura

- O **Balé da Cidade de São Paulo** (inicialmente **Corpo de Baile Municipal**) foi criado em **7 de fevereiro de 1968**, no auge da **ditadura militar (1964–1985)**, durante a gestão do prefeito Faria Lima.
- A companhia nasceu vinculada à **Escola Municipal de Bailados** (fundada em 1940), que formava os bailarinos que a alimentavam.
- Em um período de censura e repressão, a companhia se consolidou como um espaço de **resistência e experimentação**, dialogando com o **balé moderno** que surgia no país.
- Ao lado do **Balé Stagium**, o Balé da Cidade se tornou um dos **eixos balizadores** do que viria a se firmar como a dança moderna brasileira nos anos 1970.

<!-- _notes: O Balé da Cidade como resistência criativa durante a ditadura. A escola como base de formação. O balé moderno como linguagem de época. -->

---

## Alphonse Poulin: Um Ramo que Atravessou Fronteiras

- **Alphonse Poulin** (1948), bailarino e professor estadunidense, formado pelo **Boston Ballet**.
- Antes de vir ao Brasil, dançou no **Theatro Municipal de São Paulo** e no **Ballet Nacional de Lisboa**.
- Viveu no Brasil entre **1974 e 1977**, atuando como **bailarino e professor** do **Balé da Cidade de São Paulo** e da **Escola Municipal de Bailados**.
- Sua pedagogia, baseada no **rigor técnico e no desafio constante**, influenciou gerações de bailarinos paulistas.
- Após o Brasil, tornou-se **Maître de Ballet do Grand Théâtre de Genève** (1981) e lecionou na **Juilliard School** em Nova York.
- Sua trajetória é a prova de que o **rizoma da dança** não respeita fronteiras: um ramo que nasceu nos EUA, floresceu no Brasil e frutificou na Europa.

<!-- _notes: Poulin como elo entre o Brasil e o circuito internacional. A pedagogia do desafio. -->

---

## O Tempo da Dança e a Duração de Bergson

- O filósofo **Henri Bergson** (1859-1941) distinguiu o **tempo cronológico** (medido pelo relógio) da **duração** (o tempo vivido, contínuo e indivisível).
- A **duração** é um fluxo onde um estado se funde no seguinte **sem fronteiras claras**, carregando memórias do passado para o presente e o futuro.
- **A dança opera nessa duração.** Cada movimento carrega a memória do anterior e projeta o próximo. Não há cortes, apenas **transições**.
- O **nosso tempo** individual (nossa carreira, nossa vida) tem uma velocidade e uma duração **menores** que o **tempo da dança**.
- A dança **nos transcende**. Ela continua depois de nós — assim como continuou antes.

**A pergunta:** *"O que eu estou deixando para o tempo da dança?"*

<!-- _notes: Bergson e a duração. A dança como fluxo que transcende o indivíduo. -->

---

## O Rizoma Continua: De Aluno a Professor

- A dança **não tem um único centro**. Ela se ramifica a partir de múltiplos pontos: Salvador, Rio de Janeiro, São Paulo, Curitiba, Boston, Genebra.
- Cada bailarino, cada professor, cada aluno é um **nó** nesse rizoma.
- O que **eu recebi** de Hugo Delavalle, Yellê Bittencourt, Ady Addor e Alphonse Poulin, **eu transmito**.
- O que **eu transmito** não para em mim. Atinge cada aluna, que atingirá outras, que atingirão outras.
- **A dança vai numa velocidade que não podemos acompanhar.** Ela é maior que qualquer um de nós.
- **O rizoma continua. E continuará depois de nós.**

**A pergunta:** *"Que ramo do rizoma eu escolho cultivar?"*

<!-- _notes: Fechamento pessoal do bloco brasileiro. O apresentador como parte da linhagem. A dança como força que transcende o indivíduo. -->

---

## O Rizoma da Dança no Brasil

- A dança no Brasil **não tem um único centro** — ela se ramificou a partir de múltiplos pontos:
    - **Salvador:** Yanka Rudzka e Rolf Gelewski, com a UFBA.
    - **Rio de Janeiro:** Maria Olenewa e o Theatro Municipal.
    - **São Paulo:** Maria Pia, a Escola de Bailados e o Balé da Cidade.
    - **Curitiba:** Hugo Delavalle e o Balé Teatro Guaíra.
- Cada ramo **continuou se transformando** ao entrar em contato com o outro, com a cultura local e com os contextos políticos.
- A dança que ensinamos hoje **não é mais aquela do século XX** — ela sofreu influência da educação, da fisioterapia, da filosofia, da tecnologia.
- **O rizoma continua crescendo.** Cabe a nós escolher que ramos vamos cultivar.

<!-- _notes: Síntese do rizoma brasileiro. Cada cidade, um ramo. Cada ramo, uma transformação. A responsabilidade de continuar cultivando. -->

---

## A Dança é um Rizoma: Ela se Transforma

- **A metáfora do rizoma:** a dança não é um objeto estático. É um **rizoma** — um sistema vivo que se ramifica e se transforma continuamente. Não tem centro, não tem fim. Cresce para todos os lados.
- **Hugo Delavalle como ramo:** ele trouxe o ramo de sua época para o Brasil. A dança se desenvolveu aqui **a partir dele**, não **apesar dele**. Ele foi um ponto de ramificação que permitiu que uma linhagem de bailarinos e professores florescesse na nossa região.
- **Mas a dança continuou em outros lugares:** enquanto Delavalle ensinava aqui, a dança **continuava se transformando** em Paris, em Stuttgart, em Nova York. Novas técnicas, novas pedagogias, novas compreensões do corpo surgiam.
- **A tecnologia mudou tudo:** hoje, temos acesso a artistas e processos que antes eram **completamente invisíveis**. Na época do Marquês de Cuevas, quantos bailarinos, coreógrafos, cenógrafos, iluminadores não foram incríveis em seus trabalhos e **nós nem sabemos que existiram**? A tecnologia — e as redes sociais — mudou isso. Agora, a informação chega até nós.

<!-- _notes: Explicar que a dança é um sistema vivo. Delavalle foi um ramo, mas a árvore inteira continuou crescendo. -->

---

## O Duplo Perigo do "Balé-Playlist"
### Parte 1 — A Lista Desconexa

- **O primeiro perigo:** a aula como uma **lista de exercícios desconexos** (do YouTube, do Spotify, do livro), sem progressão pedagógica.
- **Por que isso é um problema?** Porque a aula de balé **não é um produto**. É um **processo contínuo de corporificação**. A estrutura da aula deve ser construída sobre uma **escada de desafios** que respeita o tempo e as condições de cada corpo.
- **O que é sobrecarga cognitiva?** É quando o aluno é exposto a mais informações do que consegue processar.
- **O que fazer em vez disso?** Construir a aula como um **processo de corporificação**:
  - Cada etapa é um **desafio possível**.
  - Um conhecimento adquirido é **necessário** para o próximo.
  - O corpo **consolida** o que aprendeu antes de avançar.

<!-- _notes: Criticar a prática de "coreografar playlists" sem considerar a progressão pedagógica. -->

---

## O Duplo Perigo do "Balé-Playlist"
### PARTE 2 — A TENTAÇÃO DAS REDES SOCIAIS (A)

- **O segundo perigo:** a tentação de **pular etapas** porque admiramos o que vemos nas redes sociais.
- Queremos o arabesque perfeito, a pirueta múltipla, o equilíbrio na ponta — mas **não entendemos o processo de construção do corpo** que chegou até ali.
- **O que as redes sociais mostram:** o resultado final. A beleza, a técnica, a harmonia, a suavidade, a potência.
- **O que elas escondem:** o processo. Os anos de treinamento. As etapas superadas. As limitações enfrentadas. O conhecimento tácito acumulado.

<!-- _notes: A tela mostra o resultado; esconde o processo. -->

---

## O Duplo Perigo do "Balé-Playlist"
### PARTE 2 — A TENTAÇÃO DAS REDES SOCIAIS (B)

- **A pergunta central:** *"O que eu estou mostrando? O meu negócio são os **corpos das minhas alunas** ou é o **balé**?"*
- **A armadilha:** copiar e colar o que se vê nas redes sociais, sem entender como se chegou àquela gramática, àquela quantidade de piruetas, àquela altura do arabesque.
- **A solução:** começar pelo mais básico. A capacidade de **ficar em pé** utilizando os códigos mínimos do balé clássico: primeira posição de pés, primeira posição de braços, segundas posições.
- **O básico é a base de tudo.**

<!-- _notes: A pergunta ética que atravessa a apresentação. -->

---

## O Básico é a Base de Tudo

**Os códigos mínimos do balé clássico:**

- Primeira posição de pés.
- Primeira posição de braços.
- Segunda posição de pés.
- Segunda posição de braços.
- Capacidade de ficar em pé com equilíbrio.

**Por que começar por aqui?** Porque sem esses códigos mínimos, o corpo não tem **potência** para avançar. A potência não se força. Ela se **constrói**.

**A metáfora da árvore:** você não pode colher os frutos antes de a árvore crescer. Você não pode ensinar uma pirueta antes de a aluna saber ficar em pé com equilíbrio. **O básico é a base de tudo.**

**O papel do professor:** o professor é um **arquiteto de agenciamentos**. Ele constrói as condições para que o movimento emerja. Ele não impõe a forma. Ele **confia** no processo.

<!-- _notes: Reforçar que o básico não é "chato" — é a condição de possibilidade para a beleza. -->

---

## A Dança Evoluiu. E Nós?

- **A dança não é mais a mesma:** o balé que se ensina hoje **não é o mesmo** da época do Marquês de Cuevas ou de Hugo Delavalle. A técnica, a pedagogia e a compreensão do corpo evoluíram.
- **A tecnologia mudou a forma de aprender:** hoje, temos acesso a vídeos, tutoriais, masterclasses online. Mas isso **não substitui** o processo de corporificação. A tela mostra o resultado; o corpo precisa do processo.
- **O perigo da aceleração:** a tecnologia nos dá a ilusão de que podemos **pular etapas**. Mas o corpo não funciona assim. O corpo tem **tempo**. O corpo tem **limites**. O corpo tem **condições**.
- **A responsabilidade de hoje:** estamos em um novo ponto de ramificação. Cabe a nós **escolher** como continuar essa evolução. Não podemos cair nas armadilhas de tratar o balé como uma **"playlist"** de exercícios ou de copiar o que vemos nas redes sociais sem entender o processo.
- **A pergunta final:** *"O que eu estou mostrando? O meu negócio são os **corpos das minhas alunas** ou é o **balé**?"*

<!-- _notes: Fechar a Parte A com a pergunta ética que atravessa toda a apresentação. -->

---

## O Corpo Como Agenciamento
### LIMITAÇÃO E POTÊNCIA (A)

- **O corpo não é uma máquina de posições:** o corpo que dança não é um conjunto de posições estáticas. É um **agenciamento em movimento** — uma configuração viva de forças que se cruzam.
- O cotovelo só dobra para um lado. Os pés têm uma base estreita. Os músculos têm limites de força e alongamento.
- Isso **não é uma falha** — é a **condição de possibilidade**.
- **A limitação como potência:** é justamente a limitação que torna a potência infinita.
- O braço pode passar por primeira, segunda, terceira, quinta, *allongé*, *en haut*. Sobre uma base estreita, o corpo pode girar, saltar, cair, levantar, sustentar outro corpo.
- **As possibilidades finitas do corpo, em movimento, se tornam infinitas.**

<!-- _notes: A limitação como condição de possibilidade. As possibilidades finitas que se tornam infinitas. Transição: a partir daqui começa a PARTE B — Os Desafios da Prática Pedagógica Contemporânea. -->

---

## O Corpo Como Agenciamento
### LIMITAÇÃO E POTÊNCIA (B)

- **O professor como arquiteto de agenciamentos:** o professor não impõe a forma. Ele **constrói as condições** para que o movimento emerja.
    - Ele organiza a progressão (barra → centro → uma perna → ponta → giro).
    - Ele ajusta a carga cognitiva (não pede tudo de uma vez).
    - Ele respeita o tempo de cada corpo.
    - Ele oferece ferramentas, não imposições.
    - Ele confia no processo.
- **O agenciamento é vivo, não mecânico:** ele **não robotiza**. Ele **potencializa**. Ele **não padroniza**. Ele **singulariza**. Ele **não aprisiona**. Ele **liberta**.
- A bailarina não é um autômato executando comandos — ela é um **corpo vivo** que se configura dinamicamente com tudo ao seu redor.

<!-- _notes: O agenciamento como arquitetura de condições. A bailarina como corpo vivo. -->

---

## A Crítica à "Aula-Playlist"
### PARTE 1 — O DIAGNÓSTICO

- **O que é a "aula-playlist"?** É a prática de seguir uma sequência de exercícios pronta (do YouTube, do Spotify, de um livro) **sem considerar a progressão pedagógica** e a **sobrecarga cognitiva** do aluno.
- **Por que isso é um problema?** Porque a aula de balé **não é um produto**. É um **processo contínuo de corporificação**.
- A estrutura da aula deve ser construída sobre uma **escada de desafios** que respeita o tempo e as condições de cada corpo.
- **O que é sobrecarga cognitiva?** É quando o aluno é exposto a mais informações do que consegue processar. Na aula de balé, isso acontece quando se pede uma coordenação complexa (braços + pernas + música + deslocamento) antes que ele domine os elementos separados.

<!-- _notes: O diagnóstico. A sobrecarga cognitiva. -->

---

## A Crítica à "Aula-Playlist"
### PARTE 2 — O QUE FAZER EM VEZ DISSO

Construir a aula como um **processo de corporificação**:

- Cada etapa é um **desafio possível** — nem fácil demais, nem difícil demais.
- Um conhecimento adquirido é **necessário** para o próximo.
- O corpo **consolida** o que aprendeu antes de avançar.

**O professor não ensina o passo. Ele constrói as condições para que o passo emerja.**

<!-- _notes: A solução. O professor como arquiteto de condições. -->

---

<!-- _class: table-xl -->

## Progressão Pedagógica — A Escada de Desafios
### EXEMPLO: TENDU À LA SECONDE COM PORT DE BRAS (1/2)

| Etapa | Desafio | O que se constrói |
|:---:|---|---|
| **1** | Tendu ao lado na barra, braço em 1ª | Coordenação básica |
| **2** | Tendu ao lado na barra, braço passa por 3ª para 2ª | Coordenação braço-perna |
| **3** | Tendu ao lado no centro, sem barra | Equilíbrio + coordenação |
| **4** | Tendu ao lado em uma perna só | Força + controle postural |

<!-- _notes: Tabela expandida. Ocupa toda a área útil do slide. -->

---

<!-- _class: table-xl -->

## Progressão Pedagógica — A Escada de Desafios
### EXEMPLO: TENDU À LA SECONDE COM PORT DE BRAS (2/2)

| Etapa | Desafio | O que se constrói |
|:---:|---|---|
| **5** | Tendu ao lado em meia-ponta | Força de tornozelo |
| **6** | Tendu ao lado em ponta (meninas) | Força + alinhamento |
| **7** | Tendu ao lado em giro | Equilíbrio dinâmico + coordenação |

**Cada etapa é um desafio possível:** nem fácil demais (não constrói nada), nem difícil demais (gera frustração e lesão).

<!-- _notes: Tabela expandida. A tese final sobre os desafios. -->

---

<!-- _class: mid -->

## Exemplos de Exercícios e Desdobramentos (1/2)

**Exercício:** Plié na 1ª e 2ª posição.

- **Desdobramento 1:** Executar o plié com os braços em 1ª posição, coordenando o movimento descendente com a respiração.
- **Desdobramento 2:** Executar plié com port de bras completo (1ª → 3ª → 2ª), mantendo o tronco ereto.
- **Desdobramento 3:** Combinar plié com battement tendu para o lado, criando uma frase de movimento.

**Exercício:** Battement tendu frontal.

- **Desdobramento 1:** Executar o tendu com o braço correspondente em 1ª posição, depois abrindo para 2ª.
- **Desdobramento 2:** Combinar tendu frontal com tendu lateral, usando o braço como contrapeso.
- **Desdobramento 3:** Realizar o tendu em demi-plié, trabalhando a coordenação entre as pernas e o controle do centro de gravidade.

<!-- _notes: Exercícios com desdobramentos progressivos. -->

---

<!-- _class: mid -->

## Exemplos de Exercícios e Desdobramentos (2/2)

**Exercício:** Balancé de um lado para o outro.

- **Desdobramento 1:** Executar balancé com os braços em 2ª posição, mantendo-os estáveis.
- **Desdobramento 2:** Adicionar um port de bras de 2ª para 3ª durante o balancé.
- **Desdobramento 3:** Combinar balancé com um pas de bourrée para mudar de direção.

**Exercício:** Piqué simples (sem sair do lugar).

- **Desdobramento 1:** Executar piqué com a perna de base em demi-plié, transferindo o peso com controle.
- **Desdobramento 2:** Combinar piqué com um port de bras de 1ª para 2ª.
- **Desdobramento 3:** Executar piqué em diagonal, adicionando um pequeno salto no final (sauté).

<!-- _notes: Os desdobramentos do balancé e do piqué. -->

---

## Conciliar Desejos, Possibilidades e Sonhos

- **A criança não é um projeto de bailarina:** a criança tem desejos, sonhos, possibilidades. Ela quer girar, quer saltar, quer usar a sapatilha de ponta. Ela vê vídeos de bailarinas profissionais e sonha em ser como elas. Isso é **legítimo**.
- **O papel do professor:** o professor não é um realizador de sonhos a qualquer custo. Ele é um **mediador** entre o desejo da criança e as **condições reais** do corpo. Ele diz:
  - "Você vai girar, sim — mas primeiro vamos construir o equilíbrio."
  - "Você vai usar a ponta, sim — mas primeiro vamos fortalecer o tornozelo."
  - "Você vai fazer um *pas de deux*, sim — mas primeiro vamos aprender a coordenar os braços."
- **O tempo de cada corpo:** cada corpo tem seu tempo. Cada corpo tem suas condições. O professor **respeita** isso. Ele não compara. Ele não acelera. Ele **confia** no processo.

<!-- _notes: O desejo da criança é ponto de partida, não obstáculo. A mediação entre desejo e condição real do corpo é o trabalho pedagógico. -->

---

## Ética e o Corpo Exposto
### A DANÇA NÃO É CONTEÚDO (A)

- **O que está em jogo:** a exposição de crianças nas redes sociais é um problema grave.
- Imagens de aulas de balé, postadas sem critério, podem ser consumidas por públicos que **não estão ali pela arte**.
- A **UNICEF** alerta: imagens de crianças em aulas de dança ou ginástica podem ser facilmente alteradas e sexualizadas.
- **O que fazer:** não se trata de atribuir responsabilidade moral a ninguém — essa tradição de pensamento não é a nossa.
- Trata-se de **tomar as decisões certas**. Decisões que protejam a criança, que preservem sua dignidade, que não a exponham.

<!-- _notes: O problema. A UNICEF. A responsabilidade sem moralismo. -->

---

## Ética e o Corpo Exposto
### A DANÇA NÃO É CONTEÚDO (B)

**Um Pacto de Imagem para a escola:**

- **Consentimento:** obter permissão informada dos pais/responsáveis.
- **Enquadramento:** priorizar planos que mostrem a **dança em ação**, e não o corpo isolado.
- **Identificação:** evitar a divulgação de informações que identifiquem os alunos (nome completo, idade, localização).
- **Segurança:** garantir que as imagens não possam ser facilmente maliciosamente utilizadas.

**O que não pode ser desfeito:** uma vez que a imagem de uma criança é exposta, ela **não pode ser desexposta**. A **prevenção** é a única estratégia eficaz. Não se trata de medo, mas de **responsabilidade**.

<!-- _notes: O pacto de imagem. A prevenção como única estratégia. -->

---

## O Que as Professoras Podem Fazer

- Adquirir mais conhecimento sobre a história e o contexto do balé.
- Estar atentas ao seu papel de professor — não apenas de transmissoras de técnica, mas de **formadoras de pessoas**.
- Tomar as decisões certas sobre a exposição das crianças nas redes sociais.
- Conciliar os desejos das crianças com as possibilidades reais de seus corpos.
- Ser **arquitetas de agenciamentos** — construir as condições para que cada criança descubra a potência infinita de seu corpo em movimento.
- Lembrar sempre: o agenciamento é **vivo**, não mecânico. Ele **potencializa**, não robotiza. Ele **singulariza**, não padroniza.

<!-- _notes: Fechar a Parte B com um compromisso prático: cinco decisões pedagógicas que podem ser levadas para a próxima aula. -->

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

---

## Romeu e Julieta (1940) — O Contexto dos Criadores
### O COMPOSITOR E O CONTEXTO POLÍTICO (1/2)

- **Sergei Prokofiev** compôs a música em **1935-36**, mas o balé só estreou em **1940**, no Kirov Ballet (Leningrado), com coreografia de **Leonid Lavrovsky**.
- **O contexto político:** a União Soviética estava sob o **Realismo Socialista** stalinista. A arte deveria ser **edificante, acessível e politicamente alinhada**.
- **A intenção original de Prokofiev** era criar um balé **dramático e realista**, fiel ao espírito de Shakespeare. Mas o regime **interferiu no libreto**.
- **A intervenção do regime:** o governo soviético via **Romeu como o equivalente a Stalin** — um líder forte, virtuoso, que luta contra a opressão feudal.

<!-- _notes: O contexto dos criadores. A intervenção do regime. -->

---

## Romeu e Julieta (1940) — O Contexto dos Criadores
### A TRANSFORMAÇÃO DE ROMEU (2/2)

- No texto de Shakespeare, Romeu é um **adolescente impulsivo e instável**, que se apaixona por Rosalina antes de Julieta.
- No balé soviético, ele foi transformado em **herói forte e virtuoso** — um símbolo do **Novo Homem Soviético**.
- **A montagem de Lavrovsky** enfatizou o **virtuosismo técnico** e o **heroísmo** de Romeu.
- O foco era o **coletivo** (a luta contra as famílias feudais), não o **indivíduo**.
- **A intenção** era celebrar o **Novo Homem Soviético** — não uma história de amor adolescente.

**A pergunta:** *"O Romeu que eu estou coreografando é o de Shakespeare — um adolescente instável — ou o de Lavrovsky, que é um herói soviético?"*

<!-- _notes: A transformação de Romeu. A pergunta que fecha o bloco de contexto. -->

---

## Romeu e Julieta — A Semiótica dos Gestos

**O mesmo gesto, significados diferentes:**

- **Na versão de MacMillan:** o foco é **Julieta**. Romeu é um parceiro idealizado — a mão de Julieta no coração dele diz: *"O amor dela é a causa da reação dele."*
- **Na versão soviética:** o foco é **Romeu**. Ele é o herói, o provedor. O manège virtuoso diz: *"Eu posso te dar tudo — desde que você me ame."*

**A diferença fundamental:** um gesto de **reciprocidade** versus um gesto de **transação**.

**O que o balé não verbaliza:** o balé **não explora a psicologia interna** da mesma maneira que o texto teatral. Ele precisa **coreografar** o que a peça **verbaliza**. O Romeu do balé é um **estereótipo do homem moderno**: aquele que não elabora a perda, que substitui o afeto, que é preenchido pela mulher.

**A pergunta:** *"O que esse gesto está dizendo na versão que eu estou copiando?"*

<!-- _notes: A semiótica dos gestos. Reciprocidade vs. transação. O que o balé não verbaliza. -->

---

## Romeu e Julieta — A Crítica da Época

**O que os críticos disseram em cada versão:**

- **1940 (Lavrovsky, Kirov):** a crítica soviética elogiou como *"uma obra-prima do Realismo Socialista"*. Críticos ocidentais notaram a **"heroificação"** de Romeu — *"o adolescente instável de Shakespeare desapareceu"*.
- **1965 (MacMillan, Royal Ballet):** a crítica destacou **Julieta** como uma figura *"revolucionária"*, que desafiava as convenções baléticas de feminilidade. Romeu, interpretado por Christopher Gable, era *"glamorosamente perigoso"*.
- **1977 (Nureyev, London Festival Ballet):** a crítica notou que a coreografia era *"árida, ocupada"* e que **substituía a paixão por bravura física**. Nureyev cortou a cena em que Julieta colocava a mão no coração de Romeu para inserir um *manège* virtuoso.

**A pergunta:** *"O que a crítica da época disse sobre a versão que eu estou copiando?"*

<!-- _notes: A recepção crítica de cada versão. A substituição da intimidade pela bravura. -->

---

## A Destilação do Conhecimento
### O CONCEITO (1/2)

**O que é destilação?**
Em inteligência artificial, a **destilação** é o processo pelo qual um modelo maior (o "professor") transfere seu conhecimento para um modelo menor (o "aluno"). O aluno aprende a **reproduzir o resultado** do professor — mas não necessariamente **o processo** que o gerou.

**O que isso tem a ver com a aula de balé?**
Quando uma aluna copia a professora por **demonstração**, ela está destilando o conhecimento. Ela captura o movimento, a sequência, a forma — mas ainda não entende **por que** aquele movimento é feito assim, **qual é a música**, **qual é a intenção**.

<!-- _notes: O conceito de destilação. A relação com a aula de balé. -->

---

## A Destilação do Conhecimento
### QUANDO É ÚTIL, QUANDO É LIMITANTE (2/2)

**Quando a destilação é útil:**

- Quando a aluna ainda está construindo **segurança** — ela precisa de um modelo para seguir.
- Quando o corpo ainda não tem **memória motora** suficiente para improvisar.
- Quando a professora quer que a aluna **sinta** o movimento antes de compreendê-lo.

**Quando a destilação se torna limitante:**

- Quando ela é o **único modo** de aprendizagem.
- Quando a aluna **nunca** é convidada a entender o processo.
- Quando o resultado é uma **casca** — bonita por fora, vazia por dentro.

**A pergunta:** *"Eu estou ensinando a aluna a destilar ou a compreender?"*

<!-- _notes: A destilação como ponto de partida, não como ponto de chegada. O risco de ficar só na casca. -->

---

## O Perigo de Copiar a "Casca"

**O que acontece quando copiamos fragmentos de diferentes versões:**

- "Eu gostei da versão do **Nureyev**, então vou fazer uma cena **obscena**."
- "Eu gostei da versão do **Balanchine**, então vou fazer uma cena **sombria**."
- "Eu gostei da versão do **Baryshnikov**, então vou fazer uma cena **engraçada**."

**O resultado:** uma **colcha de retalhos** sem coerência. Uma casca sem conteúdo.

**O que falta:** o **conhecimento de destilação**. Saber **por que** cada versão fez as escolhas que fez. Saber qual é o **contexto histórico**, qual é a **intenção do coreógrafo**, qual é o **significado dos gestos**.

**A pergunta final:** *"Eu estou copiando a casca ou eu entendo o processo?"*

<!-- _notes: O alerta contra a colcha de retalhos. A importância da destilação. -->

---

## Giselle (1841) — O Contexto dos Criadores
### O LIBRETO E A INSPIRAÇÃO ROMÂNTICA (1/2)

- **Théophile Gautier** (poeta e crítico) foi o idealizador do libreto. Ele era fascinado pelo **Romantismo alemão** e pelas **histórias de fantasmas**.
- A inspiração veio de um poema de **Heinrich Heine** sobre as **Wilis** — espíritos de noivas mortas antes do casamento.
- **Jules-Henri Vernoy de Saint-Georges** escreveu o libreto em colaboração com Gautier.
- A história combinava **amor trágico, loucura e sobrenatural**.

<!-- _notes: O contexto dos criadores originais. A inspiração romântica. -->

---

## Giselle (1841) — O Contexto dos Criadores
### A CRIAÇÃO E A INTENÇÃO ORIGINAL (2/2)

- **Adolphe Adam** compôs a música em apenas **três semanas**. Ele era um compositor prolífico de óperas cômicas, mas *Giselle* se tornou sua obra mais duradoura.
- **Jean Coralli** e **Jules Perrot** coreografaram juntos. Perrot, que havia dançado com **Marie Taglioni**, criou o papel de Albrecht.
- **Carlotta Grisi**, amante de Gautier, foi a primeira Giselle. A obra foi criada **para ela** — um veículo para sua estreia em Paris.
- **A intenção original** era criar um **balé romântico** que unisse **emoção, sobrenatural e virtuosismo técnico**. A "loucura" de Giselle era o clímax dramático — não uma metáfora política.

**A pergunta:** *"A Giselle que eu estou coreografando é a de 1841 — um drama romântico sobre amor e loucura — ou a de Akram Khan, que é uma crítica social sobre migração?"*

<!-- _notes: A intenção romântica. A loucura como clímax dramático. -->

---

## *Giselle* (1841) — O Ícone Romântico

- **Um ícone romântico:** é a obra que melhor representa o "balé romântico", com sua heroína frágil, o amor trágico e o mundo sobrenatural das **Wilis**.
- **Releituras:** a obra permite leituras sobre **repressão sexual** e a **posição da mulher**. A versão de **Akram Khan** (2016) a atualiza para a luta de uma **trabalhadora migrante**, mostrando como um clássico pode ser um poderoso veículo para **críticas sociais contemporâneas**.
- Na versão de Khan, Giselle não morre de amor, mas de **loucura e pesar**. As Wilis são **"vampirosas ávidas por vingança por causa da frustração sexual derivada de sua morte prematura"**.

> O clássico não é o que permanece igual. É o que continua **produzindo diferença**.

<!-- _notes: Giselle é o exemplo perfeito do encontro entre arquivo (a coreografia codificada) e repertório (as leituras que cada época faz dela). Nota local: foi justamente Giselle que Delavalle montou no Balé Teatro Guaíra, com Ana Botafogo. -->

---

## Giselle — A Crítica da Época

**O que os críticos disseram em cada versão:**

- **1841 (Coralli / Perrot, Ópera de Paris):** **Théophile Gautier** escreveu que a obra era *"a mais bela do gênero"*. **Jules Janin** descreveu como *"a obra-prima do balé romântico"*. A estreia consagrou **Carlotta Grisi** como uma das maiores bailarinas da época.
- **2016 (Akram Khan, English National Ballet):** a crítica descreveu como *"poderosa e política"*. O *The Guardian* escreveu que Khan *"transformou Giselle numa crítica social sobre migração"*, sem perder *"a alma trágica do original"*.

**A pergunta:** *"O que a crítica da época disse sobre a versão que eu estou copiando?"*

<!-- _notes: A recepção crítica de Giselle. Da obra-prima romântica à crítica social contemporânea. -->

---

## Fechamento — O Corpo Que Dança Não é Isca. É Arte.

- **O que importa no final:** o **conhecimento de arquivo** (o passo codificado) é finito. O **conhecimento tácito** (o movimento vivo) é infinito.
- **O papel das professoras:** não é formar **reprodutoras de passos**, mas **artistas conscientes** de seu corpo, de sua história e de seu poder.
- **O lugar do pensamento:** o pensamento é a construção de possibilidades. Na dança, o pensamento acontece **no corpo**. E o corpo tem limites, requisitos e condições que devem ser respeitados.
- **A pergunta final:** *"O que eu estou mostrando? O meu negócio são os **corpos das minhas alunas** ou é o **balé**?"*

<!-- _notes: Retomar os três fios da apresentação: arquivo/repertório, agenciamento/potência e ética. Terminar devolvendo a pergunta ao público, sem resposta pronta. -->

---

## Referências Bibliográficas (1/2)

- **TAYLOR, Diana.** *O Arquivo e o Repertório: Performance e Memória Cultural nas Américas*. Editora UFMG, 2013.
- **POLANYI, Michael.** *The Tacit Dimension*. University of Chicago Press, 1966.
- **DELEUZE, Gilles & GUATTARI, Félix.** *Mil Platôs: Capitalismo e Esquizofrenia*, Vol. 1–5. Editora 34, 1995–1997.
- **ESPINOSA, Baruch.** *Ética*. Autêntica, 2009.
- **FOSTER, Rory.** *Ballet Pedagogy: The Art of Teaching*. University Press of Florida, 2010.
- **VAGANOVA, Agrippina.** *Basic Principles of Classical Ballet*. Dover Publications, 1969.

<!-- _notes: Primeira parte das referências. -->

---

## Referências Bibliográficas (2/2)

- **WHITTIER, Cadence.** *Creative Ballet Teaching: Technique and Artistry for the 21st Century Ballet Dancer*. Routledge, 2017.
- **WULFF, Helena.** *Ballet Body Narratives: Pain, Pleasure and Perfection in Embodied Identity*. Berg, 1998.
- **KARTHAS, Ilyana.** *When Ballet Became French: Modern Ballet and the Cultural Politics of France, 1909–1939*. McGill-Queen's University Press, 2016.
- **PRESTES, Karen.** *A Trajetória Profissional do Bailarino e Coreógrafo Hugo Delavalle* (documentário). 2014.
- **RAMOS, Jonathan Diogo et al.** *Somente e Para Sempre Bailarino: o Papel de Hugo Delavalle em Curitiba*. Centro Esportivo Virtual (CEV).

<!-- _notes: Segunda parte das referências. -->

---

<!-- _class: map -->

## O Rizoma da Dança: três linhagens, um mapa

<!-- MAPA:INICIO — gerado de rizoma-slide.svg por tools/sincronizar-slide.js; não editar à mão -->
<svg viewBox="0 0 1100 560" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;width:100%;height:auto;max-height:540px;background:#fbf8f3;font-family:Georgia,serif;">
  <defs>
    <marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#b08d57"/>
    </marker>
  </defs>
  <!-- Conexões (linhagens) -->
  <g stroke="#b08d57" stroke-width="2" fill="none" opacity="0.55" marker-end="url(#seta)">
    <!-- origens -->
    <path d="M 101 90 L 101 148"/>
    <path d="M 186 175 C 212 175, 208 65, 234 65"/>
    <!-- Petipa → Fokine / Maria Olenewa -->
    <path d="M 321 90 L 321 148"/>
    <path d="M 406 65 L 454 65"/>
    <!-- Fokine → Balanchine / Cuevas -->
    <path d="M 321 200 L 321 258"/>
    <path d="M 406 175 L 454 175"/>
    <!-- Cuevas → Delavalle -->
    <path d="M 626 175 L 674 175"/>
    <!-- Maria Olenewa → Veltchek / Ady -->
    <path d="M 626 65 L 674 65"/>
    <path d="M 620 88 C 760 200, 840 330, 892 383"/>
    <!-- Mary Wigman → Yanka → Gelewski -->
    <path d="M 406 405 L 454 405"/>
    <path d="M 626 405 L 674 405"/>
    <!-- Maria Pia → Balé da Cidade (passa por baixo da Escola Mun. de Bailados) -->
    <path d="M 560 312 C 660 352, 800 350, 886 205"/>
    <!-- Escola Municipal de Bailados: tradição russa → Maria Pia -->
    <path d="M 628 92 C 650 150, 660 220, 674 272" stroke-dasharray="7 5"/>
    <path d="M 674 288 L 630 285"/>
    <!-- Veltchek → Yellê -->
    <path d="M 846 65 L 888 65"/>
    <!-- Balé da Cidade → Yellê / Poulin / Ady -->
    <path d="M 975 150 L 975 92"/>
    <path d="M 975 200 L 975 258"/>
    <path d="M 950 202 C 916 270, 902 320, 908 366"/>
    <!-- linhagens → Tiago -->
    <path d="M 840 202 C 950 320, 1000 420, 1024 477"/>
    <path d="M 1050 92 C 1086 200, 1062 380, 1044 474"/>
    <path d="M 1020 312 C 1036 370, 1040 420, 1038 473"/>
    <path d="M 1028 420 C 1042 442, 1046 460, 1040 475"/>
  </g>
  <!-- Geração 1 — Origens -->
  <g>
    <rect x="16" y="40" width="170" height="50" rx="7" fill="#6b1f2e"/>
    <text x="101" y="64" fill="#ffffff" font-size="21" font-weight="bold" text-anchor="middle">John Weaver</text>
    <text x="101" y="82" fill="#d9c7a3" font-size="13" text-anchor="middle">1717 · Londres</text>
  </g>
  <g>
    <rect x="16" y="150" width="170" height="50" rx="7" fill="#6b1f2e"/>
    <text x="101" y="174" fill="#ffffff" font-size="21" font-weight="bold" text-anchor="middle">Noverre</text>
    <text x="101" y="192" fill="#d9c7a3" font-size="13" text-anchor="middle">1760 · França</text>
  </g>
  <!-- Geração 2 — duas escolas europeias -->
  <g>
    <rect x="236" y="40" width="170" height="50" rx="7" fill="#b08d57"/>
    <text x="321" y="64" fill="#ffffff" font-size="21" font-weight="bold" text-anchor="middle">Petipa</text>
    <text x="321" y="82" fill="#fdf6ea" font-size="13" text-anchor="middle">escola russa · Rússia</text>
  </g>
  <g>
    <rect x="236" y="380" width="170" height="50" rx="7" fill="#e8dcc8" stroke="#b08d57" stroke-width="1.5" stroke-dasharray="5 3"/>
    <text x="321" y="404" fill="#5a5348" font-size="21" font-weight="bold" text-anchor="middle">Mary Wigman</text>
    <text x="321" y="422" fill="#8a6a3b" font-size="13" text-anchor="middle">moderna · Alemanha</text>
  </g>
  <!-- Geração 3 — chegada ao Brasil -->
  <g>
    <rect x="456" y="40" width="170" height="50" rx="7" fill="#fbf8f3" stroke="#b08d57" stroke-width="2.5"/>
    <text x="541" y="64" fill="#6b1f2e" font-size="21" font-weight="bold" text-anchor="middle">Maria Olenewa</text>
    <text x="541" y="82" fill="#8a6a3b" font-size="13" text-anchor="middle">Rio · 1927</text>
  </g>
  <g>
    <rect x="456" y="150" width="170" height="50" rx="7" fill="#fbf8f3" stroke="#b08d57" stroke-width="2.5"/>
    <text x="541" y="174" fill="#6b1f2e" font-size="19" font-weight="bold" text-anchor="middle">M. de Cuevas</text>
    <text x="541" y="192" fill="#8a6a3b" font-size="13" text-anchor="middle">Paris · 1940-60</text>
  </g>
  <g>
    <rect x="456" y="380" width="170" height="50" rx="7" fill="#e8dcc8" stroke="#b08d57" stroke-width="1.5" stroke-dasharray="5 3"/>
    <text x="541" y="404" fill="#5a5348" font-size="21" font-weight="bold" text-anchor="middle">Yanka Rudzka</text>
    <text x="541" y="422" fill="#8a6a3b" font-size="13" text-anchor="middle">Bahia · 1952</text>
  </g>
  <!-- Geração 4 — desdobramentos -->
  <g>
    <rect x="676" y="40" width="170" height="50" rx="7" fill="#fbf8f3" stroke="#b08d57" stroke-width="2.5"/>
    <text x="761" y="64" fill="#6b1f2e" font-size="21" font-weight="bold" text-anchor="middle">V. Veltchek</text>
    <text x="761" y="82" fill="#8a6a3b" font-size="13" text-anchor="middle">1939 · Rio/SP</text>
  </g>
  <g>
    <rect x="676" y="150" width="170" height="50" rx="7" fill="#fbf8f3" stroke="#b08d57" stroke-width="2.5"/>
    <text x="761" y="174" fill="#6b1f2e" font-size="21" font-weight="bold" text-anchor="middle">H. Delavalle</text>
    <text x="761" y="192" fill="#8a6a3b" font-size="13" text-anchor="middle">BTG · Passo Fundo</text>
  </g>
  <g>
    <rect x="676" y="380" width="170" height="50" rx="7" fill="#e8dcc8" stroke="#b08d57" stroke-width="1.5" stroke-dasharray="5 3"/>
    <text x="761" y="404" fill="#5a5348" font-size="21" font-weight="bold" text-anchor="middle">Rolf Gelewski</text>
    <text x="761" y="422" fill="#8a6a3b" font-size="13" text-anchor="middle">Bahia · 1960</text>
  </g>
  <!-- Geração 5 — São Paulo e a transmissão -->
  <g>
    <rect x="890" y="40" width="170" height="50" rx="7" fill="#fbf8f3" stroke="#b08d57" stroke-width="2"/>
    <text x="975" y="64" fill="#6b1f2e" font-size="20" font-weight="bold" text-anchor="middle">Yellê Bittencourt</text>
    <text x="975" y="82" fill="#8a6a3b" font-size="13" text-anchor="middle">pedagogia</text>
  </g>
  <g>
    <rect x="890" y="150" width="170" height="50" rx="7" fill="#fbf8f3" stroke="#b08d57" stroke-width="2.5"/>
    <text x="975" y="174" fill="#6b1f2e" font-size="19" font-weight="bold" text-anchor="middle">Balé da Cidade SP</text>
    <text x="975" y="192" fill="#8a6a3b" font-size="13" text-anchor="middle">1968 · Escola Mun. de Bailados</text>
  </g>
  <g>
    <rect x="890" y="260" width="170" height="50" rx="7" fill="#fbf8f3" stroke="#b08d57" stroke-width="2"/>
    <text x="975" y="284" fill="#6b1f2e" font-size="21" font-weight="bold" text-anchor="middle">A. Poulin</text>
    <text x="975" y="302" fill="#8a6a3b" font-size="13" text-anchor="middle">1974-77 · Boston Ballet</text>
  </g>
  <g>
    <rect x="890" y="370" width="170" height="50" rx="7" fill="#fbf8f3" stroke="#b08d57" stroke-width="2"/>
    <text x="975" y="394" fill="#6b1f2e" font-size="21" font-weight="bold" text-anchor="middle">Ady Addor</text>
    <text x="975" y="412" fill="#8a6a3b" font-size="13" text-anchor="middle">Theatro Municipal RJ · ABT</text>
  </g>
  <!-- Você: um ponto pequeno, onde as linhagens se encontram -->
  <g>
    <circle cx="1035" cy="490" r="15" fill="#6b1f2e" stroke="#b08d57" stroke-width="3"/>
    <text x="1035" y="528" fill="#6b1f2e" font-size="17" font-weight="bold" text-anchor="middle">TIAGO MENEGAZ</text>
    <text x="1035" y="545" fill="#8a6a3b" font-size="13" text-anchor="middle">2026</text>
  </g>
  <!-- Escola europeia: Fokine e Balanchine (entre Petipa e o Brasil) -->
  <g>
    <rect x="236" y="150" width="170" height="50" rx="7" fill="#b08d57"/>
    <text x="321" y="174" fill="#ffffff" font-size="19" font-weight="bold" text-anchor="middle">Fokine</text>
    <text x="321" y="192" fill="#fdf6ea" font-size="13" text-anchor="middle">Ballets Russes · 1909</text>
  </g>
  <g>
    <rect x="236" y="260" width="170" height="50" rx="7" fill="#b08d57"/>
    <text x="321" y="284" fill="#ffffff" font-size="19" font-weight="bold" text-anchor="middle">Balanchine</text>
    <text x="321" y="302" fill="#fdf6ea" font-size="13" text-anchor="middle">NYCB · 1948</text>
  </g>
  <!-- Maria Pia (São Paulo) -->
  <g>
    <rect x="456" y="260" width="170" height="50" rx="7" fill="#fbf8f3" stroke="#b08d57" stroke-width="2"/>
    <text x="541" y="284" fill="#6b1f2e" font-size="21" font-weight="bold" text-anchor="middle">Maria Pia</text>
    <text x="541" y="302" fill="#8a6a3b" font-size="13" text-anchor="middle">Theatro Municipal SP</text>
  </g>
  <!-- Escola Municipal de Bailados (SP, 1940) — origem de Maria Pia -->
  <g>
    <rect x="676" y="260" width="200" height="50" rx="7" fill="#fbf8f3" stroke="#b08d57" stroke-width="1.5" stroke-dasharray="5 3"/>
    <text x="776" y="284" fill="#6b1f2e" font-size="17" font-weight="bold" text-anchor="middle">Escola Mun. de Bailados</text>
    <text x="776" y="302" fill="#8a6a3b" font-size="13" text-anchor="middle">SP · 1940</text>
  </g>
  <!-- Legenda -->
  <g font-size="13" fill="#5a5348">
    <rect x="16" y="466" width="14" height="14" rx="3" fill="#6b1f2e"/>
    <text x="36" y="478">Origens</text>
    <rect x="116" y="466" width="14" height="14" rx="3" fill="#b08d57"/>
    <text x="136" y="478">Europa (clássico)</text>
    <rect x="266" y="466" width="14" height="14" rx="3" fill="#fbf8f3" stroke="#b08d57" stroke-width="2"/>
    <text x="286" y="478">Brasil (clássico)</text>
    <rect x="416" y="466" width="14" height="14" rx="3" fill="#e8dcc8" stroke="#b08d57" stroke-width="1.5" stroke-dasharray="3 2"/>
    <text x="436" y="478">Brasil (moderna)</text>
    <circle cx="570" cy="473" r="7" fill="#6b1f2e" stroke="#b08d57" stroke-width="2"/>
    <text x="586" y="478">Você</text>
  </g>
</svg>
<!-- MAPA:FIM -->

<p style="text-align:center;font-size:14px;color:#5a5348;font-style:italic;margin:8px 0 0;">Mapa completo em <code>rizoma-corrigido.svg</code> · versão animada (opcional) em <a href="rizoma-animado.html" target="_blank" style="color:#6b1f2e;">rizoma-animado.html</a></p>

**A pergunta:** *"Que ramo do rizoma eu escolho cultivar?"*

<!-- _notes: Slide de acesso ao mapa — o único mapa visível dentro do deck. São TRÊS linhagens que convergem em você: (1) clássica — Weaver 1717 → Noverre 1760 → Petipa (escola russa) → Maria Olenewa (Rio 1927) → Vaslav Veltchek (1939) → Yellê Bittencourt, e também Ady Addor (formada na escola de Olenewa, solista do ABT em 1957); (2) europeia do séc. XX — Fokine/Ballets Russes 1909 → Balanchine (NYCB 1948) e Marquês de Cuevas (Paris 1940-60) → Hugo Delavalle (BTG/Passo Fundo); (3) moderna alemã — Mary Wigman → Yanka Rudzka (Bahia 1952) → Rolf Gelewski (Bahia 1960). E o ramo de São Paulo: **Escola Municipal de Bailados (1940, herdeira da tradição russa)** → Maria Pia → Balé da Cidade SP (1968) → Alphonse Poulin (1974-77), Yellê e Ady Addor — a Maria Pia já não fica órfã no mapa. Os TRÊS TIPOS DE TRAÇO dizem o tipo de transmissão: **sólido = formação** (corpo a corpo), **tracejado = influência institucional** (a Escola Mun. de Bailados recebendo a tradição russa), **pontilhado = interpretação** (Nureyev interpretando Fokine, já morto). Você recebeu de Delavalle, Yellê, Ady Addor e Poulin. No dia, abra rizoma-animado.html numa aba antes de começar: a animação desenha as três linhagens em ~8 segundos (**P** pausa · **R** reinicia). O mapa completo, com todos os nós, está em rizoma-corrigido.svg — ele traz ainda cinco nomes que não couberam no slide: **Didelot** (a ponte entre Noverre e a escola russa), **Ivanov** (O Quebra-Nozes, 1892, ao lado de Petipa), **Baryshnikov** e **Osipova** (a escola russa continuada) e **Marcia Haydée** (formada por Veltchek no Rio, estrela e diretora do Stuttgart Ballet).  O mapa está EMBUTIDO no slide (SVG inline), portanto aparece no PDF e no PPTX sem depender de arquivo externo; o que depende dos arquivos são apenas os extras (mapa completo e animação). -->


---

<!-- _class: mid -->

## Os Tipos de Conhecimento no Rizoma

**O rizoma da dança não transmite um único tipo de conhecimento. Ele transmite três:**

- **Conhecimento de Arquivo** (Taylor): transmissão **indireta, histórica**, sem coexistência temporal. *Exemplo:* Noverre influenciou Petipa — mas nunca o conheceu.
- **Conhecimento de Repertório** (Taylor): transmissão **direta, corpo a corpo**, com coexistência temporal. *Exemplo:* Veltchek ensinou Yellê. Delavalle ensinou Tiago.
- **Conhecimento de Repertório por Interpretação**: híbrido — coexistência com a **obra**, não com o **criador**. *Exemplo:* Nureyev interpretou Fokine. Fokine já havia morrido.

**A pergunta:** *"O que eu estou transmitindo — arquivo, repertório ou interpretação?"*

<!-- _notes: Diferenciar os três tipos de transmissão. Cada um exige uma pedagogia diferente. No mapa do slide 83, os três tipos de linha representam exatamente esses três tipos: sólida = formação (corpo a corpo), tracejada = influência (indireta), pontilhada = interpretação (a obra). -->

---

<!-- _class: mid -->

## Por Que o Repertório é Mais Rico que o Arquivo

**O que eu poderia ter feito:**

- Pegar o **arquivo** de Noverre, de Petipa — textos, partituras, vídeos — e aplicar na minha aula. Seria **correto**, mas **morto**: um código sem corpo, uma norma sem contexto.

**O que eu de fato recebi:**

- **Yellê Bittencourt** me ensinou com o corpo, não com o texto.
- **Ady Addor** me corrigiu com o olhar, não com a régua.
- **Alphonse Poulin** me desafiou com a presença, não com o método.
- **Hugo Delavalle** me ensinou com a doçura de quem já atravessou o século.

**O que isso muda:**

- O conhecimento de repertório é **situado, corporificado, contextual**.
- Ele carrega **o que não pode ser dito** — o tácito (Polanyi).
- Ele é **irrepetível**: cada transmissão é única, porque cada corpo é único.

**A pergunta:** *"O que eu transmito — o arquivo que eu li ou o repertório que eu vivi?"*

<!-- _notes: A diferença entre o arquivo (morto, correto, sem contexto) e o repertório (vivo, situado, corporificado). A irrepetibilidade de cada transmissão. -->

---

<!-- _class: mid -->

## O Repertório é o Que Torna o Processo Rico

**O arquivo é necessário. Mas ele não é suficiente.**

- O arquivo **preserva o código**. O repertório **dá vida ao código**.
- O arquivo **pode ser copiado**. O repertório **precisa ser vivido**.
- O arquivo **não muda**. O repertório **se transforma** a cada corpo que o recebe.

**O que isso significa para a formação:**

- Uma aluna que aprende só pelo arquivo (vídeo, manual, tutorial) **reproduz**.
- Uma aluna que aprende pelo repertório (professor, convivência, correção) **incorpora**.
- Só o repertório forma **artistas**. O arquivo, sozinho, forma **reprodutores**.

**A pergunta:** *"O que eu quero formar — reprodutores ou artistas?"*

<!-- _notes: O arquivo preserva, o repertório vivifica. Só o repertório forma artistas. A pergunta final conecta com a ética da formação. -->

---

<!-- _class: lead -->
<!-- _paginate: false -->

# Agradecimento

**Obrigado!**

**Perguntas?**

**Tiago Menegaz**

**Studio Ritmo e Movimentos — Passo Fundo, RS**

<!-- _notes: Abrir para perguntas. Agradecer a presença de todas. -->

