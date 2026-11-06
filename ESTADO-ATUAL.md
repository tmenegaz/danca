# Estado atual — Projeto Ciclo / Sistema Lastro

> **Este documento é a fotografia curada do estado do projeto.** É escrito à mão, atualizado
> pontualmente, e classifica o que afirma. Não é promocional, não é cópia da documentação e
> **não é gerado** — o gerado é o `HANDOFF.md`.
>
> **Última fotografia:** 05/11/2026 (árvore limpa). Nesta entrega, **nasceu o índice do recorte** —
> o ranque do que os professores olham no corpo, os aspectos que ninguém escolhe, e os **pontos
> cegos** do olhar. (Ver as passagens de 05/11/2026 mais abaixo, na ordem em que foram escritas.)
>
> **Fotografia anterior (04/11/2026).** Nesta entrega, **o Plano de Observação passa a
> poder apagar-se**, e **o menu dos formulários ganha bancada**. (1) A linha do PO oferecia só
> «Ajustar»: não havia estado, nem botão, nem rota. Agora há o trio — `estadoDoPo` no núcleo (o PO é
> `solta` ou `legado` conforme tenha sucessor), `DELETE /api/po-vinculo/:id` com **409** quando
> derivado, e o botão «Apagar» na listagem. **A assimetria com o plano é do domínio**: nada
> referencia um PO — o ciclo gerado guarda a sua cópia —, por isso não existe aqui a trava «está
> vinculado». (2) Bancada nova `provar-menu-do-formulario` (**36**, Chrome): a primeira a medir a
> barra e a coluna **com o menu aplicado** — as outras servem a porta crua, sem `<nav>`, e é por isso
> que nunca viram o defeito. (3) **A causa dos dois sintomas de menu: `:has()`.** O layout da coluna
> dependia de `body:has(> .coluna)`, e o Firefox só a teve na 121 — o ESR 115 não a tem. Sem ela, a
> barra fica em `left: 0`, a coluna (`z-index: 21`) cobre-lhe os primeiros 248px e **o primeiro item
> do menu deixa de receber o clique** (medido: o `elementToPoint` devolve a marca da coluna). O
> `nav.js` passa a escrever `data-tem-coluna="sim"` no `<html>`, e a folha ganha as mesmas regras em
> **regras separadas** — pô-las na mesma lista de seletores faria o navegador sem `:has()` descartar
> a lista inteira, remendo incluído. Prova: `provar-menu-do-formulario` **40** (secção E, com
> controlo negativo: removido o atributo, o defeito volta) e `provar-apagar-da-listagem` **43**.
>
> **Entrega anterior** (árvore limpa). Nesta entrega, **os dois planos passam a ter
> dois nomes**: o do ciclo é «Plano do Ciclo NN» e o de cada aula é **«Plano para a Aula NN —
> objetivo»**, nas três superfícies que o mostram (o `<h1>` do documento, o cartão da listagem e o
> registo da geração). O documento mestre **já existia** — «Ciclos · Planos» abre-o direto, sem
> listagem encadeada —, e a redundância que parecia haver entre plano e aula é, medidamente,
> **derivação**: uma só linha era cópia literal (o *bullet* das condições preliminares). Objetivos,
> marcos, volume e repertório **ficam no plano** (Regras 9 e 10 e os validadores). O nome do
> ARQUIVO não mudou: é endereço, e entra na âncora. Prova: `provar-cartao-da-aula`, **31
> asserções**, com a secção 4b a exigir que o cartão seja prefixo do título da página.
>
> **Entrega anterior** (árvore limpa). Nesta entrega, **o corpo tem uma fonte só — e a
> origem está provada no envelope real**. (1) **O sentido do vínculo não mudou**: a aula deriva do
> plano, e o PE/PO são a origem; o que se arrumou foi onde cada **vista** mora — o plano declara a
> visão macro (N aspectos + link), a aula o detalhe (os N, um por linha), o PO o ponto de partida de
> cada sujeito. (2) A tabela dos aspectos fica na **aula** (secção «Corpo»); o plano publica a
> contagem e um **link** para `aula-01.html#corpo`. (3) **A linha por aluna saiu da aula**: com
> trinta alunas eram sessenta e uma linhas antes da primeira marca. (4) **A restrição física
> voltou** — numa citação, fora da tabela: é lesão/dor/limitação, e o próprio PO diz que «a
> ausência também é informação». (5) O título da secção do plano perdeu «força e flexibilidade».
> Prova: `provar-eixos-e-tempo-da-aula`, **61 asserções**, com a secção J a medir o **envelope real**
> do ciclo e o controlo negativo do aspecto inventado (reprova em quatro).
>
> **Entrega anterior** (base `b972267`, árvore limpa). Nesta entrega, **o ciclo
> apaga-se de trás para a frente, a sequência é estrita, e a anamnese é datada**. (1) **Apagar o
> ciclo gerado** leva o pacote, as fontes derivadas, o `.conf` e as âncoras — e os **POs** do ciclo
> —, e deixa a **anamnese** (é do sujeito) e o **plano de ensino**, que fica **livre sem se lhe
> tocar** (o vínculo PO ↔ PE é derivado, modelo da curadoria). A guarda: **só o último**, porque o
> `parentHash` do seguinte aponta para a âncora deste — a recusa diz o que impede e o que fazer.
> (2) A **sequência é estrita**: o campo do ciclo passa a `readOnly`, com o **próximo número
> válido** vindo de `GET /api/ciclos` (um ciclo existe porque tem documento), e **`null` quando há
> um buraco** — não se inventa o número que taparia a lacuna. (3) O **ciclo sai da anamnese**: ela é
> do sujeito, e uma aluna que entra no ciclo 50 não fez os 49 anteriores. (4) **«Ajustar» deu lugar
> a «Novo registo»**: o formulário abre preenchido com o retrato anterior e grava um documento
> **novo, com data nova e sem `ajuste_de`** — porque um retrato novo não substitui o anterior.
> (5) O **sinal de revalidação é derivado**, e a ordem é **PE e depois PO**. Prova nova:
> `provar-ciclos-e-anamnese`, **34 asserções**.
>
> **Entrega anterior** (base `a90058f`, árvore limpa). Nesta entrega, **o cabeçalho
> do ato cabe num telefone, as 156 asserções de produção passam, e a capacidade tem número**.
> (1) As cinco **leituras** do cabeçalho (frequência, duração, calendário, volume, condição de
> registo) **não são `<label>`** — são `.ctx-rotulo` + `.ctx-inscricao` —, e a regra que punha o
> rótulo na linha inteira cobria só o `label`. A grelha dava a coluna elástica ao rótulo e o `auto`
> ao valor; como o valor é uma **frase**, o rótulo encolhia até **0px** e o texto empilhava-se por
> cima — «totalmente acavalados», que é o que ela viu. Medido a 360px: rótulo 0px, valor 129px.
> (2) O `provar-producao` passou de **153/156** para **158/158**: duas falhas eram **lacunas da
> bancada** (o DOM falso não conhecia o selector `[data-secao]` nem `classList`; a lista das
> tradições e a contagem das pílulas estavam escritas à mão) e nenhuma era «pré-existente» no
> sentido de «não é nossa». (3) O **§2.2** da arquitetura deixou de dizer que o composto tem lista
> de verbos à mão — contra o §5.7 escrito no mesmo dia. (4) Nova **§7.2**: **26 criações ou 80
> edições por minuto**, e **5 a 62 escolas** conforme o cenário — projecções declaradas como tais.
> Prova nova: `provar-faixa-do-ato-no-celular`, **40 asserções**, a medir geometria no Chrome.
>
> **Entrega anterior** (base `a749ace`, árvore limpa). Nesta entrega, **o Plano de
> Observação passa a ter os três eixos, o corpo vem da anamnese de quem se observa, e o «Port de
> bras» sai do §1 da aula**. (1) As dimensões chamavam-se «Técnica — Musicalidade» e «Técnica —
> Expressão» porque o eixo estava **escrito no conteúdo** e concatenado a todos os blocos; são
> **poiésis**, e o mapa dos eixos passou a ser **um só** (`motor/nucleo/eixos.js` — havia duas
> cópias, e uma punha o corpo no eixo técnico). O eixo decide-se pelo **bloco**, e **nada é
> renomeado no dado** (P-03). (2) O **Corpo** é eixo próprio e carrega da **anamnese de cada
> sujeito**, pelos campos que o «Ponto de partida» já declarava; o seletor do sujeito passou a ser o
> **primeiro bloco**, antes das dimensões, para a cascata chegar a tempo. (3) O **«Port de bras»**
> que ela viu no §1 vinha da **matriz do parâmetro** e não da curadoria: a régua do repertório
> (`linhasDoRepertorio`) tinha blindado a sequência a 03/11 e **não** o parâmetro. Agora é uma régua
> só, e vale nos dois documentos. (4) A linha do cartão deixou de repetir a síntese por eixo (que já
> está no guia) e passou a dizer `Plano de Observação — <objetivo geral>`. Prova nova:
> `provar-eixos-do-po`, **34 asserções**.
>
> **Entrega anterior** (base `7cf8122`, árvore limpa). Nesta entrega, **o composto
> deixou de enumerar verbos, a modalidade deixou de ser constante, e o custo da API passou a ter
> número**. (1) O armazenamento que o Worker monta (`combinar`) **listava os verbos um por um**, e o
> que ficava fora da lista sumia sem aviso: o `criar` nunca chegou ao motor — a blindagem da decisão
> 85 era **inerte em produção** — e o `anexar` faltava, o que fazia a rota do registro de custo da IA
> chamar uma função inexistente. Uma camada abaixo havia um terceiro furo: os dois adaptadores de
> **base** não implementavam `criar`, que o contrato declara. A correção não foi acrescentar os que
> faltavam (deixaria a armadilha armada para o próximo): o composto passou a ser um **`Proxy`** que
> encaminha **qualquer** verbo, e só `criar` e `gravarComFusao` mantêm regra própria. (2) A
> **modalidade** estava em **29 ocorrências e 8 ficheiros** (os «10 sítios» de 03/11 contavam blocos,
> e um bloco continha dois literais); agora há **um único ponto de derivação** —
> `modalidadePrincipal()` — e `MODALIDADE_PADRAO` é derivada dela. (3) O **custo da escrita** ganhou
> número: **18 pontos** para criar um envelope, **7** para o editar, contra limites de 1 000 req/h
> (Actions) e 500/h · 80/min de criação de conteúdo — o que morde é a **rajada**, e é por isso que o
> expurgo é um commit só. Prova nova: `provar-verbos-do-armazenamento`, **29 asserções**, a ler os
> verbos **do ficheiro do contrato** e a passar pelo `criarArmazenamento`.
>
> **Publicado e confirmado no ar (05/11/2026).** O commit `aac98600` esteve no `main` sem deploy: o
> evento de `push` **não chegou ao Actions** (zero runs para o SHA, fila vazia, e os dois workflows
> cujos `paths` casavam — `deploy-escolas` por `motor/**` e `deploy-raiz` por `motor/servidor/**` — sem
> execução). O Worker da `calango` servia `d60baced`. Publicado por `workflow_dispatch` (run
> 42063204458, `success`) e **verificado ao vivo**: os cinco passos estão na página de Produção, e o
> `<script>` servido difere do motor local em **uma linha** — o `ALUNAS_TODAS`, que é dado da escola.
> Regra que fica: depois de um push que mexa em `motor/`, `tools/templates/` ou `porta/`, confirmar
> **no ar** o marcador que a mudança introduziu; se a run não existir, disparar o `workflow_dispatch`.
>
> **A linha de base é a fonte do elenco, e a cadeia mostra-se no PO (05/11/2026, quinta passagem).**
> A listagem da anamnese dizia **«nova»** e **«aluna nova — sem turma»** a duas alunas com linha de
> base feita e enviada. Não era mentira sobre o dado: era leitura da fonte errada — `turmaDaAluna()`
> perguntava a turma à **curadoria**, que deixou de declarar o elenco quando o passo 5 passou a ser o
> acto que o declara. Em `calango`, **medido por API**: `curadorias` vazio, e a linha de base `teste`
> enviada a 05/11/2026 para «Balé Nível 1 — Teste 1» com a Aluna A e a Aluna B. E o mesmo defeito
> doía mais fundo: `/anamnese/api/anamneses?turma=…` devolvia `{"opcoes": [], "recorte": []}` — o
> nó `sujeitos` do PO oferecia **zero** alunas. Decidido: **a linha de base é a fonte do elenco** e a
> curadoria é o **recurso declarado** (escola que nunca usou o fluxo novo continua a ver a lista de
> antes, em vez de uma lista vazia sem explicação); a direcção da cadeia é **turma → linha de base →
> alunas → corpo**, porque a turma **já** está no PO pelo `plano-de-ensino` obrigatório, e pedir a
> linha de base num campo próprio seria um segundo lugar a declarar o mesmo facto; «nova» passa a
> exigir **não ter linha de base**; e a etiqueta diz as duas coisas — «turma X · linha de base
> «…»» —, com o painel da caixa «Turma» a ganhar a linha `Linha de base`. O cabeçalho do PO passou a
> mostrar a **inscrição «linha de base»** ao lado da turma (nome e nº de alunas), porque a vinculação
> que existe no código e não existe para quem preenche é uma vinculação que ninguém sabe que tem.
> Prova: `provar-etiqueta-da-aluna`, **20 asserções**, e `provar-sujeitos-da-turma`, **41** (a
> secção G é o caso de produção).
>
> **A linha de base passou a ser um fluxo de cinco passos (05/11/2026, quarta passagem).** A
> secção era um formulário só; ela organizou-a como o verbete da notação: **1 Identificação · 2
> Alunas · 3 Leitura · 4 Recorte · 5 Turma**, com a mesma trava (não se chega a um passo com falta
> nos anteriores, e sem anamnese nenhuma nada se abre). A **leitura cruza os trinta campos em quatro
> eixos** — o que precisa de ser trabalhado, o que já é bom, a musicalidade, e o que o grupo tem em
> comum —, e vem **antes** da escolha do recorte, que é o que lhe dá sentido. **(Correcção de
> 05/11/2026: passaram a ser 45 — os 30 dos blocos e os 15 da observação inicial; ver a entrada de
> hoje na §11 e no `REGISTRO.md`. A redação anterior não se apaga: é o elo que registra o que se
> pensou antes.)** A lista de alunas é de
> **10 em 10** com rolagem, e cada aluna leva a etiqueta **«novo»** quando a anamnese dela é mais
> recente do que a última leitura — derivada, não guardada. O passo 5 **não escreve na turma** (a
> turma é o ritmo, decisão de 03/11): grava na linha de base que aquelas alunas foram para aquela
> turma, e a curadoria herda o elenco ao escolher a turma. **Achado nos dados:** o «melhor nível» era
> deduzido da primeira opção, e há um campo cuja lista começa pela limitação — passou a ser
> declarado. Prova: `provar-linha-de-base`, **63 asserções**, com a trava a correr em jsdom e dois A/B
> por reversão.
>
> **A linha de base oferece os TRINTA campos, musicalidade incluída (05/11/2026, terceira passagem).**
> Segundo erro de desenho meu no mesmo dia: eu tinha cortado os **seis campos de musicalidade** com o
> argumento de que «já são tratados nos verbetes da notação». Ela desmontou-o — «a musicalidade não
> nasce por geração espontânea, ela é trabalhada, nem tampouco acontece por osmose». O verbete é onde
> ela se **ensina**; a anamnese é onde ela se **mede**. São complementares, e cortar a segunda é tirar
> do professor o que ele precisa para decidir o que ensinar. O recorte passa a **30 campos** (9 de
> técnica, 15 de funcional, 6 de musicalidade); a dimensão viaja com cada um — com o rótulo do eixo —
> mas **não filtra**. Continua a ser um recorte: o professor escolhe entre os trinta. A asserção da
> bancada foi **invertida**, e não apagada; o A/B repõe o filtro e reprova em 5 de 49.
>
> **A linha de base é sobre ALUNAS, e a anamnese perdeu o ciclo (05/11/2026, segunda passagem).**
> Quatro correcções da mesma sessão de uso. (1) O campo **ciclo** continuava na barra e no painel da
> anamnese — e era ele que fechava o formulário: entrava na lista de obrigatórios e no bilhete do
> ato, e a porta, que não pede ciclo na anamnese, não o fazia casar; cada ato confere o contexto que
> **tem**. (2) O desenho da linha de base estava **errado**: pedia **turma**, e a turma não nasce com
> alunas — a turma só as tem depois da curadoria, e uma aluna nova chega na quinta aula de um ciclo
> em curso. Passa a guardar a lista de **alunas**. (3) Sem anamnese não há o que escolher: os campos
> não se desenham, o «Gravar» nasce `disabled` **no markup**, e a agregação responde
> `semAnamneses` com o motivo em vez de uma tabela vazia. (4) A seta do título não fazia nada —
> `tituloComAcordeao` com um **id** em vez do `data-acordeao` cai no recolhedor das turmas. Prova:
> `provar-linha-de-base`, **47 asserções**, com dois A/B por reversão controlada.
>
> **A linha de base do corpo é uma escolha do professor (05/11/2026).** A anamnese recolhe **24**
> aspectos do corpo; o plano lia **quinze**, escritos à mão no conteúdo desde 02/11/2026 e iguais
> para toda a escola e todo o ciclo — e sem caminho na tela para os mudar. Ficavam de fora o
> formato anatómico dos joelhos, a arquitetura do arco plantar e a impulsão do allegro. Agora há
> uma entidade **Linha de Base** (`bastidores/<escola>/linhas-de-base`), gerida em Bastidores →
> Pedagogia → Corpo, e o plano importa-a como importa a turma. O recorte é sobre **alunas** — a turma entra na curadoria,
e é a curadoria que diz qual linha de base a turma curada trata. Ela é **do professor** (é ele quem
> avalia, e a anamnese é uma fotografia), mas a leitura atravessa os professores — quem assume lê o
> que estava e cria a sua; **nada é herdado**. A cascata de revalidação passou a **três passos**,
> Produção → PE → PO, e o primeiro é derivado como os outros. Prova:
> `provar-linha-de-base`, **37 asserções**, com o A/B que desliga o passo 1. Pendente por decisão
> dela: as anotações textuais das anamneses — nenhum dos 24 campos é texto livre.
>
> **Correcção de 05/11/2026 — o validador cobrava um ficheiro chamado `.html`.** `DOCS=""`
> (o que `tools/criar-escola.sh` escreve em **toda** variante nova) virava `['']` — um array
> *truthy* com uma entrada vazia — e `tools/check-pacote.js` exigia o ficheiro `.html`. Medido na
> `calango`: **11 → 10 erros**, e o que sai é o único que não existia. `filter(Boolean)` faz `""`
> virar `[]`, e o ciclo-zero passa a ser exigido só do `index.html`, como já era no shell. A
> verificação 15 da `provar-geracao-do-ciclo` prova-o por comportamento (pacote sintético em
> diretório temporário, lista exacta dos ficheiros cobrados) **e** pelo negativo: com `DOCS="plano"`
> o validador continua a reprovar. `tools/` é congelado → motivo declarado no `REGISTRO.md`.
>
> **A secção do corpo nasceu fora do `</section>`, e as bancadas não o notaram (05/11/2026, quinta
> passagem).** Ela relatou três sintomas — «não tem nenhum step», «a seta de expandir não mostra
> nada», «o título está no lugar errado» — e era **uma** causa: a tira dos cinco passos, o formulário
> e a lista foram montados **depois** do `</section>` das Curadorias, e a `<section id="sec-corpo">`
> ficou com o título e três `</div>` órfãos. As asserções passavam porque perguntavam «está aqui?»
> por `getElementById`, que atravessa a árvore — **nunca perguntaram «de quem é este elemento?»**. O
> bloco 13 da `provar-linha-de-base` passou a medir a **pertença** (`contains`), e recolhida a secção
> a grade passa a uma coluna (o `.col-form` não é filho directo da `.secao`). **A regressão não era
> só a que ela viu:** a `provar-producao` tinha caído de 158/158 (em `c748e461`) para 154/158 quando
> a oitava secção entrou — três contagens (secções, `.col-form`, listas de sete) e a regra «nenhum
> formulário traz explicação», que passou a ter **duas secções isentas nomeadas e com motivo**, e uma
> asserção nova a exigir que as isentas **existam e sejam só aquelas**. Duas bancadas antigas
> apanharam ainda dois defeitos reais: a nota do elenco herdado partia o par rótulo ↔ escolhedor
> («Alunas» deixava de vestir o que os outros seis vestem), e `provar-cartao-da-turma` lia
> `button.passo` **sem dono** (passou a devolver catorze botões e a chamar-lhes «três»). Provas:
> `provar-linha-de-base` **68/68**, `provar-producao` **159/159**, `provar-curadoria-e-limpeza`
> **23/23**, `provar-ajustes-anamnese` **126/126** (a asserção do ciclo foi **invertida**, não
> apagada), `check-identidade` e `check-indices` **0 erros**. **PENDENTE:** `provar-cartao-da-turma`
> fica com 1 reprovação **pré-existente** (a lista de Termos saiu da página a 01/11 e a asserção
> ainda a procura), alheia a esta entrega.
>
> **Entrega anterior** (base `d3b623c`, árvore limpa). Nesta entrega, **as colunas da
> aula têm a largura do que levam dentro, e a notação sai do bloco de musicalidade**. (1) As doze
> tabelas de exercício saíam a **28/28/21/21** — o «1» do compasso com a mesma largura que o
> parágrafo da descrição. A causa **não era CSS**: o pandoc calcula a largura relativa de cada
> coluna pela **proporção dos traços** da linha de separação, e só quando ela **passa dos 72
> caracteres** (o `--columns` por omissão). Com traços iguais, colunas iguais; e uma linha
> proporcional mas curta é desfeita em silêncio — as duas coisas foram medidas. A proporção passou a
> `12/12/23/52`, e o espaço foi repartido **a favor de quem tem texto** (não em metade exacta: a
> repartição igual daria 14/14/35/35, e a descrição — 150 a 300 caracteres — ficaria com um terço).
> (2) A §4 da aula deixou de trazer a notação Benesh na célula da contagem: ela é o **código** em que
> a música se escreve, tem documento próprio (`-notacao.md`) e é lá que o botão «notação» a vai
> buscar. Prova nova: `provar-colunas-da-aula`, **23 asserções**.
>
> **Entrega anterior** (base `6ede613`, árvore limpa). Nesta entrega, **o cartão da
> aula diz os três dados do professor, e o guia são três eixos de verdade**. (1) Saiu o «Ciclo 01»
> da caixa da **Turma** — «o ciclo não é um atributo estrutural da turma» —, e ficou o operacional:
> turma, «aula N de M», dia, início, fim, duração e a Sala dita «não declarada». (2) O bloco do
> **Professor** deixou de mostrar o identificador e passou a mostrar os três dados que já existiam:
> **nome** e **modalidade** do perfil da pessoa, **tradição de referência** do plano («RAD») — e o
> rótulo da modalidade vem do catálogo, não de uma capitalização. (3) O **guia de observação** da
> aula deixou de ser uma tabela com uma coluna «Eixo» a repetir o rótulo: são **três tabelas, uma
> por eixo**, e o eixo é o **bloco** do documento (`### Corpo`, `### Técnica`, `### Poiesis`) — o
> contrato de extração lê uma tabela por bloco, e é por isso que o campo do schema passa de array a
> objecto com os três. E o **Corpo**, que existia só como frase de contagem, passa a ter linhas: os
> **15 aspectos físicos** do plano, o ponto de partida de cada aluna e as restrições declaradas.
> (4) Os links da **proveniência consolidada** deixaram de abrir a **porta** (o formulário) e passam
> a abrir a **folha** do documento — a mesma que o título abre na Área do Professor. Provas:
> `provar-cartao-da-aula` (**nova**, 25) e `provar-eixos-e-tempo-da-aula` (27 → **38**).
>
> **Entrega anterior** (base `edcd8a0`, árvore limpa). Nesta entrega, **duas edições
> do mesmo documento não se apagam** — a decisão 84, que estava aberta, foi decidida e
> implementada: quando duas pessoas (ou duas abas) gravam o mesmo plano/PO, os **campos
> diferentes unificam** (nada se perde), e o **mesmo campo decide pela recência ao milissegundo**
> (`escrito_em`), com o empate a ir para quem está a gravar. A regra é pura e mora no núcleo
> (`motor/nucleo/fusao.js`); a repetição do 409 mora no adaptador (`gravarComFusao`); e a resposta
> da gravação **declara** a fusão (`fundido`, `fusao: {unidos, conflitos}`), porque uma fusão
> silenciosa é indistinguível de uma sobrescrita. **Sem base não se adivinha** — grava-se como
> sempre. O `ARQUITETURA-GERAL.md` foi **reescrito de ponta a ponta**: dava o acervo como vivendo
> no KV e sob `professores/<professor>/escolas/`, e **nenhuma das duas é verdade**. Ao documentar
> a lista de verbos do `combinar` apareceu **um defeito vivo**: o `anexar` também faltava, e o
> registro de custo da IA é acrescentado por ele. Prova nova: `provar-fusao-da-edicao`,
> **29 asserções**, a passar pelo armazenamento composto.
>
> **Entrega anterior** (base `7091587`, árvore limpa). Nesta entrega, **dois
> «Guardar» no mesmo minuto não perdem mais um documento**. A auditoria da concorrência que a
> pesquisadora pediu respondeu «não» a quase tudo — as gerações do mesmo ciclo são **enfileiradas**
> (`concurrency` do `gerar-ciclo.yml`, `cancel-in-progress: false`), o `.fipp` é recomputado depois
> do rebase, e a escrita em lote é **um commit só** com a referência como último passo —, com **uma
> excepção medida**: o id de um envelope é um **carimbo de minuto**, e `identificar` perguntava
> «existe?» antes de gravar. Dois pedidos que perguntassem antes de qualquer escrita recebiam o
> **mesmo nome**, o segundo gravava por cima, **os dois respondiam «gravado»** e um documento
> evaporava sem erro. Agora o armazenamento tem `criar` (grava só se a chave não existir — no
> repositório, a escrita vai **sem `sha`** e o **422 «"sha" wasn't supplied»** do GitHub é o «já
> existe», **medido contra a API real**), o nome cedido passa ao sufixo seguinte, o índice passa a
> descrever o **arquivo** e não a tentativa perdida, a intenção é **declarada** (`substituir`) — a
> edição em sítio continua a reescrever o mesmo nome —, e o **expurgo**, que era o único escrito em
> lote sem repetição, passa a refazer a corrida que perdeu (chegava lá com o Cloudflare já
> apagado). Prova nova: `provar-corrida-da-escrita`, **27 asserções**.
>
> **Entrega anterior** (base `bff42d8`, árvore limpa). Nesta entrega, **o ajuste do
> plano de ensino arrasta o PO, e o cartão da aula mostra o que se observa**. (1) A pesquisadora
> corrigiu a proporção do Expressão no plano, e o «Guardar» fez o que a proveniência manda — um elo
> novo —, mas o **PO continuou a observar o plano substituído**: `po-20261104-1733` declara
> `plano-de-ensino: plano-20261103-2200`, medido no envelope real. Duas cadeias paralelas, e a aula
> a ler a proporção antiga. Agora a rota deriva **um elo do PO** quando o plano é ajustado (com
> `ajuste_de` do PO anterior e a referência do plano vigente), corre o caminho normal — `-po.md`,
> ciclo e disparo —, e **a referência de um PO segue o topo** da cadeia, com a correção declarada
> (`planoRetargetado`). A Aula 01 do envelope real passa a sair com **Expressão 27 · 30%**. (2) O
> **cartão da listagem de aulas** perde a frase de arquitetura («a aula não tem professor próprio»),
> concentra o horário na caixa **Turma** (com a Sala dita «não declarada»), e ganha a caixa **Guia
> de observação** — a conta, os itens por dimensão e uma linha de síntese por eixo, à mão, sem abrir
> a aula. Prova nova: `provar-cadeia-do-ajuste`, **34 asserções**.
>
> **Entrega anterior** (base `72436a9`, árvore limpa). Nesta entrega, **a fatia de tempo
> de cada bloco vem do plano pela coluna certa, e o guia lê as três frentes**. Duas coisas que a
> pesquisadora viu no ciclo da `breu`. (1) A fatia do bloco **Expressão** saía `[Preencher]` — e o
> motor tinha dois defeitos medidos: a proporção era lida pela **posição** da coluna, e a gravação
> não escreve célula vazia, de modo que a **justificativa** escorregava para o lugar da fatia quando
> «Proporção alvo» faltava; e a unidade **`minutos`** não se sabia ler (saía lacuna em todos os
> tempos, com a fatia certa ao lado). Agora a coluna é procurada pelo **nome**, as duas unidades
> convertem, e a lacuna **nomeia o bloco e o sítio** («proporção do bloco Expressão no plano») — e o
> próprio plano diz o mesmo ao pé da tabela. Sobre o valor: **ele não está no envelope** — a linha foi
> gravada sem proporção, e o sistema não a inventa. (2) O **guia de observação** imprimia tudo com o
> prefixo «Técnica —», inclusive Musicalidade e Expressão, que são poiésis. Passa a ter um **resumo
> por eixo** — **Corpo** (aspectos físicos do plano, ponto de partida e restrições), **Técnica**
> (Barra, Centro) e **Poiesis** (Musicalidade, Expressão) — e, abaixo, a tabela **item a item**, o
> detalhe que a folha de captura pede. **Nada foi renomeado no dado** (P-03), e o mapa dos eixos é
> **candidato**, declarado como tal. Prova nova: `provar-eixos-e-tempo-da-aula`, **27 asserções**.
>
> **Entrega anterior** (base `2d01773`, árvore limpa). Nesta entrega, **a estante mostra
> um documento por linha**. O professor ajustou o Plano de Observação três vezes até a geração
> passar, e a Área do Professor passou a mostrar **três linhas com o mesmo nome** — uma por envelope,
> que é o mecanismo de proveniência a aparecer no ecrã. A regra passou a ser **uma, do núcleo**
> (`porta.vigentesDaFamilia`): um envelope que outro aponta em `ajuste_de` está **substituído**, e as
> tentativas **irmãs** do mesmo documento (o plano observado, para o PO; a aluna, para a anamnese)
> colapsam na mais recente. **O plano de ensino não se agrupa por contexto** — dois planos da mesma
> turma e ciclo com objetivos diferentes são dois documentos, e foi a bancada
> `provar-apagar-da-listagem` que o mostrou, ao ficar vermelha. **Nada se perde**: os envelopes
> escondidos continuam no acervo, legíveis pelo id e no índice; os estados continuam a derivar de
> todos; e a linha diz «2 versões anteriores guardadas». Prova nova: `provar-vigente-na-listagem`,
> **21 asserções**.
>
> **Entrega anterior** (base `5ae2ea5`, árvore limpa). Nesta entrega, **a medida não é
> o repertório**. Ela relatou que a sequência mostrava «*Port de Bras*, vinculado ao Objetivo 2» com
> a curadoria em dois verbetes, e uma menção residual a um «Objetivo 3» que nunca preencheu — e
> suspeitou de *mock*, com razão para suspeitar. **Não havia mock**: havia duas portas abertas na
> mesma derivação. A coluna «Conteúdo do nível» lia os termos marcados na matriz do «Parâmetro de
> medição» **sem os conferir contra o repertório curado** — e medir não é curar; e a matriz dos
> **blocos**, que produz as sementes, não era filtrada pelos objetivos vivos, pelo que um `marco: 3`
> guardado gerava uma linha com o rótulo «3» e **sem texto de objetivo**. A regra passou a ser uma e
> está escrita em `motor/nucleo/sequencia.js`: **o conteúdo do exercício é o repertório curado da
> turma**, e sem sujeito não é linha. O que fica de fora é **dito** no rodapé, e a lacuna não se
> pune. `provar-sequencia-que-acompanha` **49 asserções** (eram 33), com **dois controlos negativos**;
> as outras sete bancadas e o `check-identidade` (20/20) verdes.
>
> **Entrega anterior** (base `1e29007`, árvore limpa). Nesta entrega, **a correção de
> uma explicação minha**: eu disse que três campos «não chegavam ao documento» e que a decisão era
> dela — e **estava errado**. Nenhum dos três é perda: a linha da **escola** saiu do corpo a
> 28/10/2026 (está no `title` e no `escola:` do cabeçalho); a **rubrica** deixou de ser a tabela
> Critério × níveis a 26/10 (o plano declara a **régua**, e o critério nasce no lançamento da
> aula); e a **relação objetivo ↔ aula** chega, na direção contrária — na tabela «Marcos parciais
> por aula», que é o trabalho dela. O que estava velho eram as **bancadas**, que descreviam o
> documento de antes dessas decisões. E a da sequência media-se a si mesma: dizia que o «Battement
> fondu» declara `2|4/4`, e o alfabeto só tem **Plié** (`4|2/4`) e **Battement tendu**
> (`8|2/4@breu`) — o fondu existe no vocabulário e **não tem verbete**, e criá-lo é acto de
> **conteúdo**. `provar-plano-completo` **18 verificações**, `provar-derivados-da-sequencia` **26
> asserções** — as duas verdes. **Nada se apaga**: nem no sistema, nem no acervo.
>
> **Entrega anterior** (base `38b13c1`, árvore limpa). Nesta entrega, **duas bancadas
> voltaram a medir** — e a resposta à pergunta que as destravou é um **não**. O `provar-plano-matriz`
> estava vermelho em «/api/mapa responde», e a mensagem aponta para a rota; a rota está boa. A prova
> servia `professores/leticia/ciclos/…`, e **a escola `barra` foi expurgada em 15/10/2026** — a pasta
> do professor com ela. Nenhum plano novo povoaria aquela pasta. Sob o vermelho havia **cinco
> asserções que mediam o dia em que foram escritas** (o número de nós, a secção «Estrutura de cada
> aula», a tabela da rubrica, o endereço da sequência, o bloco «(P-10)») — as bancadas morriam na
> primeira linha, portanto **nunca tinham corrido** desde 26/10. O fixture passa a ser `porta/` e o
> molde `modelo/ciclos/`, que não envelhecem com um expurgo. **E um defeito de verdade**: o rótulo
> «Turmas observadas» no documento × «Turma observada» no formulário — o plano é de UMA turma; o
> vermelho de cima escondia a asserção que o travava. As duas bancadas estavam **fora do Git** e
> entram agora. `provar-plano-matriz` **52/52**, `provar-po-completo` **17**.
>
> **Entrega anterior** (base `93a1dc1`, árvore limpa). Nesta entrega, **o registo
> solto voltou a poder ser apagado** — e o gesto passou a ser **botão**, não link. O «Apagar» sumiu
> da listagem do plano quando ela passou a ser a página da Área do Professor (a estante antiga da
> porta tinha-o); e na anamnese ele era um `<a>` para o **mesmo endereço** do «Editar» — dois
> botões, um destino, o segundo a prometer o que não fazia. A regra é a mesma das duas famílias:
> **solto** → Editar e Apagar; **vinculado a um PO** ou **derivado** → só Ajustar (e o servidor
> recusa o `DELETE` com 409); **PO** → nunca. O clique exige a senha já conferida no painel, nomeia
> o que vai apagar, e recarrega (a lista é do servidor). Três defeitos no caminho: a **rota
> relativa** não chegava (404 — faltava o prefixo da porta), o **`apagar` do acervo** exigia token e
> respondia 500 enquanto o `guardar` caía no KV (assimetria que o botão tornou alcançável), e o
> `\n` da confirmação **quebrava o script da página** (escape a atravessar duas linguagens). Prova
> nova: `provar-apagar-da-listagem`, **31 asserções em 6 secções**, com publicação mínima própria.
>
> **Entrega anterior** (base `9547aae`, árvore limpa). Nesta entrega, **a sequência
> deixou de inventar linha** — e é a correção de uma decisão da mesma sessão, horas antes. O repertório
> nasce nos **bastidores** (o verbete, com a música), é **acordado na curadoria** para aquela turma, e
> esta tabela é onde ele se **encontra** com o objetivo e o bloco. Acrescentar uma linha aqui — ou
> apagá-la — é um acordo que ninguém fez, publicado como se fosse a aula: **saiu o «Adicionar linha»,
> saiu o ✕, saiu o campo livre do conteúdo** (a mesma fraude por outra porta) e saiu o `extras` da
> derivação. O caminho legítimo fica inteiro: marcar mais um exercício em «Parâmetro de medição»
> acrescenta as linhas dele em cada bloco onde o objetivo é trabalhado, e a curadoria manda no
> repertório da turma. O rodapé passou a dizer **de onde a linha vem**, e por **forma** — a
> distribuição do volume, onde a proporção se escreve, mantém a frase dela. Duas asserções do
> `provar-plano-matriz` guardavam a regra de ontem e passaram a afirmar o contrário, com a razão ao
> lado. Prova: `provar-sequencia-que-acompanha`, **33 asserções em 6 secções**, agora com controlo
> positivo (mais um parâmetro → três linhas).
>
> **Entrega anterior** (base `53e8235`, árvore limpa). Nesta entrega, **a sequência
> de exercícios passou a acompanhar os objetivos**. Ela mostrava «Barra com objetivo específico 2» e
> «Centro com objetivo específico 3» depois de os objetivos terem sido reduzidos a um — e a pergunta
> era a certa: é dinâmica ou está presa a mock? **É dinâmica, e não há mock nenhum** (a pasta
> `teste/` só é lida pelos bancos). O que ficou preso foi o **objetivo**: medido no envelope dela,
> um objetivo e **oito** linhas, duas a nomear os 2 e 3. **(1) A linha de um objetivo que não existe
> sai** — ela não é memória (a coluna é só de leitura; quem a escreve é o sistema, e a autoria da
> semente vivia num `Map` que morre com a página), e a regra vive em `motor/nucleo/sequencia.js`, a
> mesma para a tela, o `.md` do plano e a `aula-01.md`. **(2) A chave da linha passou a ser o NÚMERO
> do objetivo** — pelo texto, corrigir a redacção de um objetivo duplicava a linha, com o texto
> velho e o conteúdo outra vez por escolher: era esse o «campo aberto/vazio» relatado. **(3) O ✕
> passou a existir** (`removivel: true`) — havia como acrescentar uma linha e não como removê-la.
> E o defeito que apareceu por baixo: a **trava da senha** reescrevia `disabled` em todos os
> controles, e acendia o ✕ das linhas derivadas no instante em que a senha era validada. Prova nova:
> `provar-sequencia-que-acompanha`, **27 asserções em 6 secções**, com dois controlos negativos.
>
> **Entrega anterior** (base `cbd9b18`, árvore limpa). Nesta entrega, **a metodologia
> deixou de se perguntar duas vezes**. O Bloco 1 do plano pedia-a em dois itens — «Metodologia de
> referência» e «Quem escolhe a metodologia» («Eu escolho · A escola impõe») — e os dois já estavam
> respondidos na **curadoria**. **(1) O item 5 deixou de existir**: a premissa passou a ser do
> domínio e é permanente — **o professor escolhe, a metodologia pertence ao professor**, como a
> modalidade. Um facto que não varia com o ciclo não se pergunta ciclo a ciclo. **(2) O item 4
> passou a leitura do cabeçalho** (`noCabecalho` + `daCuradoria: 'tradicao'`), com o **rótulo** do
> catálogo («Francesa», e não a chave `francesa`). **(3) O envelope continua a levar o valor
> semeado** — é dele que o `.md` do plano e o PO o extraem; sem isso o documento passaria a dizer
> «[a decidir]» sobre um dado que a curadoria declara. Dois defeitos apanhados pelo caminho:
> `daCuradoria()` lia uma string **caractere a caractere** (a tradição chegava como `f`), e os
> rótulos das tradições não chegavam à porta — passaram a vir na mesma resposta da curadoria. Prova
> nova: `provar-metodologia-no-cabecalho`, **20 asserções em 5 secções**, com controlo negativo.
>
> **Entrega anterior** (base `49fb3e6`, árvore limpa). Nesta entrega, **o dono da
> música deixou de aparecer no compasso**. A coluna «Compasso» da sequência do plano mostrava
> `2/4 @breu`: o sufixo é o **dono do registo do alfabeto** (`8|2/4@breu`), que existe para o
> catálogo e a escola poderem declarar a mesma música sem colidir — armazenamento, e não fórmula.
> Corrigido nos dois lados: **a fonte** (`musicasDosExercicios` limpa com `musicaDaChave` do núcleo
> e **deduplica** — quando o catálogo e a escola declaram a mesma música o alfabeto tem as duas
> chaves, e sem deduplicar o menu a oferecia duas vezes) e **a tela** (`musicasDoExercicio` corta o
> mesmo sufixo, para um adaptador que sirva o alfabeto em cru). **O dado NÃO se limpa**: a chave do
> alfabeto continua `8|2/4@breu`, e é isso que mantém as duas versões — P-03/P-04. Prova nova:
> `provar-compasso-limpo`, **16 asserções em 4 secções**, com o controlo da §C a provar primeiro
> que a bancada serve mesmo o sufixo.
>
> **Entrega anterior a essa** (base `85ff724`, árvore limpa). Nesta entrega, **o formulário
> da curadoria passou a prometer só o que existe**. **(1) A lista de conteúdos** oferecia o
> vocabulário inteiro — 93 palavras — e duas tinham decomposição; passa a oferecer os exercícios
> que **têm notação** (um verbete com música e, dentro dela, ao menos um trecho), por
> `exerciciosComNotacao()`. Cresce sozinha quando um verbete ganha trechos, e o que já está gravado
> continua a ler-se (as fichas vêm do registo, não do menu). **(2) Os oito rótulos do formulário**
> passaram a vestir a mesma peça: «Alunas» e «Conteúdos desta curadoria» eram `<label>` nu e o
> navegador desenhava-os em linha, com outra cor — e com eles três sítios que ninguém tinha visto.
> **(3) O formulário deixou de explicar**: saíram o «(nada escolhido ainda)», as legendas
> «— opcional; sem escolha…», a instrução de clique dos sinais, a frase da posição, os quatro
> avisos de estado vazio do passo 6 e do rodapé, e as opções que rotulavam a ausência de escolha
> («— sem grau —»…). **Ficou o feedback que informa** — nove blocos, contados um a um na §E da
> prova nova, `provar-curadoria-e-limpeza` (**22 asserções**). Efeito medido: a asserção
> «nenhum formulário traz explicação» do `provar-producao` estava vermelha desde antes e **passou**
> (153 de 156, era 151 de 155).
>
> **Entrega anterior a essa** (base `bb8d122`, árvore limpa). Esta entrega é uma
> **verificação a pedido** («o processo da curadoria até à geração dos documentos»), e achou um elo
> partido: `porta/index.html` tinha **duas funções com o mesmo nome** — `turmaDoPlano` —, e a
> segunda (a que devolve uma lista de nomes, nascida a 02/11 com o «Carregar das anamneses da
> turma») ganhava para todos os chamadores, por hoisting. Um array não dá erro: dava `undefined` no
> calendário, `NaN` na frequência e `termosDaTurma(undefined)` na coluna «Conteúdo do nível» — **o
> plano deixou de ler a turma e de mostrar o que a direção curou**, sem uma palavra na tela. As
> três funções homónimas (a da porta e duas na Produção: `cancelarEdicao` e `temposDaContagem`)
> foram renomeadas, e a prova nova — `provar-plano-e-curadoria`, **12 asserções** — mede a cadeia
> **e a classe** do defeito. Efeito medido: `provar-teste` passou de vermelho a **45 verificações
> verdes**, e `provar-cartao-da-turma` de 6 falhas a **4**. Do lado do estado: **a curadoria está
> registada e o `repertorio` dela já chega ao formulário** (medido no ar), mas **não há plano nem PO
> guardados** — e sem PO não há documentos.
>
> **Entrega anterior a essa** (base `9d636fe`, árvore limpa). **O conteúdo
> saiu do cadastro da turma**, e a turma passou a ter **três estados**. **(1) A auditoria que ela
> pediu mudou o diagnóstico:** a rota `turma-editar` já recusava (409) a turma presa a um plano, mas
> a turma que apenas **compunha uma curadoria** continuava editável — e a curadoria guarda o **nome**
> dela, portanto renomear partia a ligação **sem erro nenhum**. O defeito não era o botão: era a
> assimetria (o professor tinha três estados, a turma tinha dois). `motor/nucleo/estado-da-turma.js`
> nomeia-os — `livre` · `curada` · `vinculada` —, `motivoDaRecusa` diz por que não se edita, e a
> rota, o `DELETE` e o cartão perguntam ao mesmo sítio. **(2) A nota da turma saiu** do formulário e
> da lista de campos copiados; o que já está gravado fica (P-03/P-04). **(3) Os conteúdos passaram
> para a curadoria** — eram o último resto do enquadramento no cadastro —, e
> `motor/nucleo/conteudos.js` **compõe** o mapa antigo (`turma-conteudos`, que continua a ser lido)
> com o `repertorio` de cada curadoria: nada se perde, e o cartão continua a mostrar a lista.
> **(4) O formulário da curadoria ficou inteligente**: as modalidades filtram-se pelas habilitações
> do `perfil.json` do professor, e as tradições seguem a modalidade
> (`motor/nucleo/tradicoes.js`: a lista própria vence a compartilhada — e uma modalidade **sem**
> lista própria cai na compartilhada, em vez de ficar sem nenhuma). Nenhuma modalidade tem ainda o
> seu `tradicoes.json`, e a tela **diz** isso em vez de fingir. Prova nova:
> `provar-conteudos-e-estado-da-turma`, **74 asserções em 7 secções**. Também entrou
> `indices/esquema/tipos.json` (o tipo `perfil`): o `perfil.json` que ela criou pela tela em 03/11
> era o primeiro ficheiro do acervo **sem tipo declarado**, e o `check-indices` reprovava-o.
>
> **Entrega anterior** (base citada: `ddcd92a` — **corrigida** para `622071b`, ver §9; árvore
> limpa). **A turma
> deixou de ser o enquadramento** — e a decisão é dela, revendo a do mesmo dia. O nível, a
> modalidade, a tradição e o professor tinham sido postos na **turma** de manhã; à tarde ela reviu:
> «a turma deixa de ser carregada com definições rígidas de nível pedagógico», o cadastro fica
> «estritamente no que lhe é inerente (dias, horários e rotina)», e o enquadramento passa para a
> **curadoria** — para a escola poder «transitar turmas entre modalidades e níveis» sem destruir a
> estrutura operacional. **(1)** A curadoria ganhou `grau`, `nivel` e o `nivelReferencia`
> **composto** pela tradição («Grade 3» na RAD, «Intermediário 2» nas outras), e a derivação herda-o
> e **recompõe** o rótulo se a tradição mudar. **(2)** **A memória não se apaga** (P-03/P-04): uma
> turma cadastrada de manhã conserva o `nivelReferencia` que guardou — o campo deixou de ser tocado,
> não foi apagado —, e `nivelEfetivo` lê-o quando a curadoria não declara nível, dizendo de onde
> veio. **(3)** O enquadramento passou a ser um **módulo** (`motor/nucleo/enquadramento.js`), porque
> três leituras ficariam ambíguas — e a terceira doía: a marca de `descontinuada` lia
> `t.professor`/`t.modalidade`, campos que o cadastro novo já não tem, e um `undefined` numa
> comparação **não dá erro**: dá `false`, e a marca deixava de acender em silêncio. O módulo
> `niveis-da-turma.js` passou a `niveis.js` — o nome dizia «da turma» e deixou de ser verdade. Prova
> nova: `provar-enquadramento-da-turma`, **46 asserções**.
>
> **Entrega anterior a essa** (base `21089cb`, árvore **limpa**). A **habilitação passou a existir como
> dado** e a **turma passou a poder ficar descontinuada**. **(1)** As
> três decisões dela: a **habilitação vive no perfil do professor** (`professores/<slug>/perfil.json`
> → `modalidades`), **independente do tenant** — e o argumento é o expurgo: o KV de uma escola tem o
> prefixo dela, e guardar ali a competência faria dela um dado do contrato, que sai com ele. O
> perfil **nasce com a escola** (`tools/criar-escola.sh`, commit próprio por estar em
> `CONGELAMENTO.md`) e **não se sobrescreve** na segunda escola. **(2)** A **turma cuja modalidade o
> professor deixou de ter não se apaga**: fica `descontinuada`, com data e motivo, e o histórico
> intacto — e a marca é **revogável**, porque uma marca que só se acendesse seria uma pena perpétua
> por uma decisão que se corrige. **(3)** O **nível tem a forma da tradição**: a RAD numera em fila
> («Grade 3»), as outras agrupam em graus («Intermediário 2»); `grau` e `nivel` são campos da turma e
> `nivelReferencia` é **composto** deles. Nenhum «N» foi inventado. E o expurgo ganhou **regra com
> nome** (`ehPerfilDoProfessor`), **nome no relatório** do commit e uma **guarda** que recusa antes
> de apagar (`semPerfisNaLista`), com controlo negativo. Prova nova:
> `provar-habilitacao-do-professor`, **62 asserções**. **PENDENTE**: a modalidade continua escrita à
> mão em **10 sítios** de `motor/` — o dado existe, mas ainda não é ele que escolhe o alfabeto.
>
> **Entrega anterior** (base `cc150e6`, árvore **por commitar**). O **coupé e o sur le cou-de-pied
> passaram a poder escrever-se**, e a **modalidade passou a ter dono declarado**. **(1)** O que ela pediu como «adicionar os termos» encontrou-os **já no vocabulário** —
> `coupe` e `sur-le-cou-de-pied` existiam desde o dicionário dela. O que faltava era o **SIGNO**: o
> grupo «Posições dos pés e braços» tinha `prep` e os cinco números, e o `lerBloco` **recusa o bloco
> inteiro** quando um token não existe — escrever o battement frappé, que parte do cou-de-pied, era
> impossível. Entram `cp` e `cdp`, e o alfabeto vai à **versão 38**. **(2)** O **nome** de dois
> empréstimos contrariava a decisão D-67 (02/11/2026): `sur-le-cou-de-pied` dizia «sobre o colo do
> pé» — e cou-de-pied é o **peito** do pé — e `attitude` dizia «atitude». Os dois voltam ao nome
> internacional, e a prova passa a prendê-los. **(3)** **A modalidade pertence ao PROFESSOR**
> (**DECIDIDO** por ela): a escola herda por **derivação**, não por campo copiado. O acoplamento está
> medido — **10 sítios** de `motor/` escrevem a modalidade à mão —, e é essa a linha de base do
> trabalho de médio prazo. Prova nova: `provar-sinais-da-modalidade`, **29 asserções**.
>
> **Entrega anterior** (base `1b305e3` + `cc150e6`, árvore **limpa**). A **notação da listagem passou
> a três colunas** e o **passo 6 deixou de crescer com os trechos**.
> **(1)** A tabela tinha duas colunas, e uma delas era **a definição do exercício repetida em cada
> linha** — com dois trechos, duas vezes a mesma frase. Passa a `compasso` · `contagem` · `notação`,
> e a definição sobe para o topo do bloco **escrita uma vez**: ela é do **exercício**, não do trecho.
> Quando duas linhas têm frases **diferentes** — um trecho guardado com a frase com que foi escrito
> (P-03/P-04) — aparecem as duas, cada uma uma vez; escolher uma e calar a outra seria perder a
> diferença em nome da limpeza. **(2)** A coluna da contagem passou a dizer a **frequência por
> extenso** — «1–2 (duas vezes)» —, que existia na célula desde 02/11 (`repeticoes`) e **não chegava
> à listagem**. **(3)** O bloco «o que fica escrito em cada trecho», que despejava **dois parágrafos
> abertos por trecho**, passa a **uma dobra fechada por trecho**, com o resumo a dizer onde ele cai;
> a dobra **sobrevive ao repintar**, e por isso não se fecha no gesto seguinte. Prova nova:
> `provar-tabela-da-notacao`, **41 asserções**. **NÃO medido**: **pixéis** — não há navegador nesta
> bancada; mediu-se a **prosa** à vista (251 de 385 letras, 65%), que é a causa da altura.
>
> **Entrega anterior** (base `89d1f83` + `1b305e3`, árvore **limpa**). A **listagem deixou de
> mentir sobre a decomposição**. Ela gravou o «Battement tendu» com dois
> trechos — compasso 1 e compasso 3 — e a lista respondeu «A decomposição deste exercício não pode
> ser lida». **O dado estava lá, inteiro; a leitura é que estava errada**, e por **três** elos
> encadeados: **(1)** a composição usava o alfabeto **embutido no build** (`require`) e não o que a
> rota acaba de ler, pelo que uma escrita da tela só era legível no processo seguinte; **(2)** ia
> **sem `escola`**, e desde 03/11 o registo dela vive em `8|2/4@breu` — pedir `8|2/4` ao catálogo
> não o encontra, e o silêncio disso chama-se `musica-nao-coberta`; **(3)** quando a composição
> falhava, os trechos **gravados eram atirados fora** — o erro substituía o dado. **A hipótese do
> relatório não se confirma**: o salto de 1 para 3 **não** é lacuna nem numeração descontínua, são
> **dois compassos de 2/4** — o relógio corre por pista e `coberturaDe` toma a pista maior, não a
> soma linear. A leitura passa a ser `lerLinhas(…, alfabeto, escola)`, cada música traz o seu
> `motivo`, e a composição **parcial** deixou de ser erro para ser um estado declarado: as linhas que
> compõem aparecem, o trecho que não compõe diz porquê, a música sem trechos diz que ainda não tem.
> A frase «A decomposição deste exercício não pôde ser lida» **deixou de existir no código**. Prova
> nova: `provar-leitura-da-decomposicao`, **25 asserções** em 4 secções. **PENDENTE**: a conferência
> ao ar é a dela, no próximo `F5` — nesta sessão **nenhuma carga foi ao ar**.
>
> **Entrega anterior** (base `89d1f83`, árvore **por commitar**). Os **três defeitos** que ela
> relatou ao usar a Produção a sério estão corrigidos, e a **fase 1 fechou-se no alfabeto**. **(1)** Duplicar um trecho **não** mexe na música: era `declarado + bloco`
> escrito no campo, e uma música de 8 ia a 12 e crescia a cada cópia; agora a música é a base rítmica
> e o que a cópia muda é o que a decomposição **ocupa**. **(2)** O campo da música **deixou de estar
> bloqueado** — a trava de 02/11 existia porque mudar os tempos recomeçava o rascunho a partir da
> chave e apagava as células; a correcção certa era **não recomeçar** (`musicaMudou`), e não travar o
> campo. **(3)** O **desacordo entre a música e a decomposição passou de recusa a aviso**:
> `validarVerbete` devolve-o em `avisos`, a gravação passa, a tela mostra o selo «Os tempos da música
> estão em desacordo com a decomposição» no passo 3, e a listagem marca o verbete. **(4)** E a
> decisão dela — **«o dono do alfabeto é a escola»** — está implementada **como no vocabulário**: o
> registo do catálogo fica com a chave da música (`8|4/4`), o de uma escola leva o dono ao lado
> (`8|4/4@breu`) e o campo `escola` dentro; a precedência é uma só (`registosDaEscola`), lida pela
> composição do documento, pela listagem e pelos produtos; e o apagar é **por dono** — uma escola não
> apaga o catálogo. A prova nova (`provar-musica-do-verbete`) tem **33 asserções** e corre a página
> em jsdom.
>
> **Entrega anterior** (base `508d22f`, árvore **limpa**). Nesta entrega, a **Produção
> usou a tela pela primeira vez** — criou «Battement tendu» na escola `breu` —, e o exercício de
> medir o que isso fez encontrou três coisas. **(1)** A separação **funciona**: `batata` e `maria`
> viram o termo do **catálogo** (com `fonte`), a `breu` viu o dela. **(2)** Mas o termo era uma
> **sombra** de um que o catálogo já tinha, e na `breu` vencia **perdendo a origem** (a edição paga
> dela excluía **26**, contra **25** do catálogo); e o **verbete** foi para o alfabeto da
> **modalidade**, que **não tem campo `escola`** — o texto da escola passou a ser a decomposição do
> termo do catálogo, visível a todas. **DECIDIDO** por ela: retirar os dois. O catálogo voltou a
> **93 termos**, nenhum com `escola`, alfabeto **v32** e **1** verbete. **(3)** O defeito que isso
> revelou: `biblioteca/modalidades/**` não estava no filtro de `paths` do `deploy-escolas.yml`, e
> os dois commits da tela ficaram **sem run nenhum** — o termo entrava no repositório e
> **desaparecia no `F5`**, porque o Worker servia o bundle anterior. Corrigido e provado: `508d22f`
> publicou, e a página da `breu` em produção já não traz o texto da escola. **(4)** A `breu`
> **não** foi expurgada: ela decidiu não o fazer agora, e o cálculo dos 17 ficheiros ficou
> registado. **PENDENTE**: o **alfabeto continua sem dono** — é o buraco que resta da fase 1.
>
> **Entrega anterior** (base `885a2ad` + o `4e1593a` local, com a árvore de trabalho
> **por commitar**). Nesta entrega, as duas peças que faltavam **deixaram de faltar por inteiro**.
> A **fotografia datada** da licença passou a ser **calculada**: `catalogo@AAAA-MM-DD` sai do último
> commit que tocou o catálogo — a técnica do `SOURCE_DATE_EPOCH` —, medido em `catalogo@2026-11-02`
> (`23d4c0e`) e igual em duas execuções. E é **derivada**, com a **pendência declarada**: não é a
> data do contrato (C8), que a vence no dia em que existir; deixa de ser impeditivo e passa a ser
> dívida nomeada. E a **fase 1** passou a separar catálogo × escola por **campo**: `escola` ausente
> é do catálogo, `escola: '<slug>'` é daquela escola; o escritor grava o dono no termo, o leitor
> filtra-o pela mesma `compor`, e o `--escola` do CLI entrega a edição. O **ficheiro continua a ser
> um** — um caminho variável não se embute no bundle do Worker —, e é por isso que o critério 5
> passa **na substância** e não ao pé da letra. A **C11** decidiu, na parte que faltava, **onde** o
> `plano` vive: num **ficheiro declarativo do repositório** (o «`.conf`» no sentido genérico — um
> ficheiro com esse nome não existe), e **nunca no KV**. A prova dos produtos passou de 73 para **89
> asserções**.
>
> **Entrega anterior** (base `026c281`, com a árvore de trabalho **por commitar**).
> Nesta entrega, **a licença passou de decisão a texto**, e o motor passou a **executá-la**. Existem
> dois `LICENSE.md` — o da raiz para **a máquina** (que continua a não se licenciar) e o de
> `biblioteca/` para **o catálogo**, com as seis cláusulas da §10, a concessão da escola (§10.3) e a
> condição de conteúdo (§10.4). O gerador **lê-os**: o manifesto deixou de dizer «pendente» e cita o
> caminho, e a lacuna `sem-licenca` desapareceu (o dicionário caiu de **148 para 147** lacunas).
> E a condição de conteúdo ficou **executável** — há duas edições, `--edicao interna` (por omissão,
> mostra tudo) e `--edicao paga`, em que **a definição sem `fonte` não entra**, o documento diz no
> sítio dela porque está fora, e o manifesto conta: medido no catálogo a 02/11/2026, **25** — o
> mesmo número que a §10.4 tinha medido à mão. A **camada pedagógica** ganhou a regra que faltava:
> `exige` · `ensina` · `expressa` são **herdados do termo** (`vocabulario.json`) e **sobrepostos
> pela relação** (`progressao.json`), e o documento **escreve de onde veio** — porque apresentar
> como «do nível» o que veio do termo é uma afirmação falsa sobre quem declarou o quê.
> **Herdar não é faltar**: só a ausência nos dois lugares é lacuna. A prova do módulo passou de 52
> para **73 asserções**.
>
> **Entrega anterior** (base `2a59d98`).
> **O motor dos produtos começou, e são dois dos três**: o **dicionário** e o
> **syllabus** geram-se do catálogo por `node motor/produtos.js`, em módulos puros
> (`motor/nucleo/produtos/`) que não tocam no runtime. O que eles NÃO fazem é inventar: um termo
> sem definição ou sem origem sai em `[Preencher]`, um exercício sem verbete declara a lacuna, um
> verbete cujo `cobre` não fecha sai em `[conferir]` em vez da contagem errada, e um nível sem
> unidades diz que é a lacuna. Pela primeira vez o **fase 1** tem código — a **composição**
> catálogo × escola (`compor`), com a escola a ganhar e a marcar `origem` —, mas **os ficheiros
> continuam um só**: a separação que o plano exige não foi feita, e `termo-repo.js` continua a
> escrever no vocabulário do catálogo. Medido no catálogo de hoje: **93 termos** (59 com
> definição, 34 com origem declarada), **1 verbete** no alfabeto — o `Plié` em 4 tempos de 2/4,
> declarado **por ela pela Produção enquanto esta sessão escrevia** (versão **32**) —, **9
> associações** em **2 dos 13 níveis**. A **aula pronta** não foi começada.
>
> **Entrega anterior** (base `0e2ac45`). **A segunda correcção do dia sobre a mesma
> tela**, e ela reverteu três decisões da manhã: o **rótulo da tradição** passou de CAIXA ALTA
> a **Title Case** (`RAD` fica como sigla) e a `Compartilhada` duplicada saiu da lista do método; o
> **«Apagar o verbete» saiu do passo 6** e vive só na listagem; e a **navegação bloqueia para a
> frente** — o passo seguinte e o «Seguir» ficam desactivados até os obrigatórios da etapa estarem
> preenchidos, e o «Voltar» continua livre. O passo 1 passou a **ler o passo 2**: escolhido um
> exercício existente, categoria, tradição e «o que acontece» vêm do dicionário e ficam
> **congelados** (`disabled`). Duas correcções de dados: o `ED`/`EI` do alfabeto deixaram de se
> chamar «en dehors»/«en dedans» e passaram a **«varredura para fora/dentro»**, e as fixtures do
> `breu` passaram a **Plié · Battement tendu · Battement fondu**, com a música e a decomposição
> pré-escritas. Também se corrigiu uma **regressão medida**: o preenchedor de fixtures chamava
> `modoExercicio (true)`, removida no passo 1 — nenhum termo chegava ao formulário.
>
> **Entrega anterior** (base `cc54844`). **O verbete ganhou proveniência.** O `DELETE` deixou de
> ser incondicional — se o exercício compõe um **plano de ensino** ou o repertório de uma
> **curadoria**, o `409` diz porquê e aponta o caminho («Descontinuar»). E o `UPDATE` deixou de
> reescrever o passado: ela escolheu **versões datadas**
> (opção B de três), e um verbete em uso passa a ser **ajustado** — o estado anterior fica no
> histórico com a data em que deixou de valer, e o documento compõe o estado que valia **na data do
> seu envelope**. Medido de ponta a ponta: o mesmo envelope, com a data de antes do ajuste, sai com
> a notação antiga. **E duas regras de tela:** o «Gravar verbete» fica desactivado sem decomposição,
> e o bloco do passo 1 (categoria, tradição, «o que acontece») só entra em vigor com um nome.
> *(A terceira parte desta entrega — a tradição em caixa alta — foi **corrigida na mesma data**:
> ver a nota da fotografia de cima.)*
>
> **Entrega anterior** (base `dbc3797`). Nesta entrega: **a música deixou de se poder mudar por
> baixo dos trechos.** Ela escreveu os tempos à mão, de 8 para 16, e os trechos
> desapareceram no mesmo instante, sem aviso. A saída escolhida foi **bloquear**: com trechos
> escritos, `#vbtempos` fica só de leitura e o compasso desactivado, e a nota manda ao «Duplicar o
> exercício» para a mesma decomposição noutra duração. **E o verbo apagar passou a existir** — a
> rota respondia 409 com um sermão sobre a P-03/P-04 e passou a apagar, com a consequência escrita
> na pergunta. **E os passos re-arrumaram-se:** a frase subiu ao passo 1, o passo 1 ficou
> condicional (sem nome, ninguém é obrigado a nada; com nome, os três seguintes são obrigatórios),
> e o campo «posição em que o exercício acontece» **saiu** — a posição escreve-se nos sinais do
> trecho. A decomposição ganhou o «lê-se» atrás de um clique e deixou de repetir a frase do
> exercício em cada linha.
>
> **Duas entregas antes** (base `b7acca6`). Nesta entrega: **a listagem do verbete
> passou a ser o cartão das turmas** — a opção 1 da bancada, escolhida por ela. O nome e o selo em
> cima, o complemento por baixo, e **três caixinhas** com o «?»: `Música`, `Direção`, `Notação`. A
> da notação abre a decomposição **trecho a trecho**, lida do motor. Nenhuma classe nova: as peças
> são as da folha, e a marcação é a da turma. Medido: **285 px por cartão a 320**, 192 a 390, 142 a
> 768, **sem transbordo** em nenhuma.
>
> **E o vocabulário cresceu**, a pedido dela: a categoria **Cabeça**; `↻` rotação para dentro e `○`
> abre (os pares que faltavam); os **lados nos três eixos** (`F`/`T` sagital, `C`/`B` vertical, além
> do `D`/`E`); as direções **para dentro** e **para fora**; e a orientação **de lado · perfil** — com
> o rótulo do `épaulement` corrigido, porque «ombros rodados» dizia que é o ombro que roda.
>
> **Entrega anterior** (base `544acf4`). Nesta entrega: **gravar uma edição
> passou a SUBSTITUIR.** Ela esticou o `Plié` de 8 para 16 tempos e o registo antigo ficou ao lado;
> a hipótese dela era `INSERT` onde devia ser `UPDATE`, mas a mecânica é outra: a **chave do registo
> é `<tempos>|<compasso>`**, e mudar os tempos muda a chave. Não havia verbo errado — faltava dizer
> **qual é a chave que sai**. A tela passa a mandar `musicaAnterior` e o servidor apaga-a, com nota
> a dizer o que vai acontecer **antes**; e há uma caixa explícita para «guardar como música nova»,
> que é a outra intenção. Medido antes de escrever: **nenhum plano de ensino usa o `Plié`**, e
> portanto nada fica em lacuna.
>
> **E a bancada que faltava.** O pedido de uma **página para ver e validar** a listagem dos verbetes
> — no computador e no telemóvel — não tinha sido entregue: eu implementei a listagem na Produção em
> vez de construir a bancada. Passa a existir
> `experimentos/propostas/proposta-verbetes.html`, com três opções medidas a **320, 390, 768 e 1280
> px**: 66 px por linha hoje, 198 px o cartão das turmas, 561 px com a notação à vista. E o
> `construir.js` deixou de ser tudo-ou-nada: uma bancada que lê o alfabeto não precisa de ciclo.
>
> **Duas entregas antes** (base `04e2597`). Nesta entrega: **a música duplicada
> passou a ter porta.** Ela duplicou o `Plié` de 8 para 16 tempos, gravou, e o registo «não apareceu»
> — mas **estava gravado**: o alfabeto, versão 17, tem as duas músicas. O que faltava era o caminho
> de volta: a listagem dizia «2 músicas» e o «editar» abria sempre `Object.keys(musicas)[0]`, isto é,
> **sempre a primeira**. Passa a haver **uma linha por música**, no modelo do cartão das turmas, com
> os tempos, o compasso, os trechos, as direções e as categorias — e a música vai no botão. De
> caminho: a **correcção volta a andar por passos** (um painel, não três), o **sinal troca-se no
> lugar** (clica-se a ficha, clica-se o sinal novo), e as etiquetas passaram a **português** — o
> `nome` é um campo do vocabulário, não uma tabela na tela.
>
> **Duas entregas antes** (base `1b99e51`). Nesta entrega: **a barra passou a
> duplicar-se.** Um botão «Duplicar o exercício» clona a decomposição inteira — todos os compassos,
> as pernas e os braços — e sobe os tempos sozinho, para o `Plié` em 1ª se repetir em 2ª, 4ª e 5ª
> sem se escrever tudo outra vez. Ele **não reescreve sinal nenhum**: no `Plié` o `1ª` está nas duas
> pistas (perna `ED 1ª ↓ ↑`, braço `⌒ 2ª → 1ª → 2ª`), e uma troca automática escreveria
> `⌒ 2ª → 2ª → 2ª`. A posição muda-se depois, no «Editar», onde se vê o que se está a mudar. De
> caminho ficou medido o que **não** se resolveu: mudar os tempos **apaga a decomposição em
> silêncio** — a duplicação não passa por lá, mas quem escreve à mão passa.
>
> **Duas entregas antes** (base `a3f99d5`). Nesta entrega: **um balde vazio deixou de
> bloquear a gravação.** O editor deixava ficar `celulas: { devant: [] }` quando o último trecho de
> uma direção saía — e um balde vazio é **invisível**, porque a tabela percorre células e zero
> células não desenham linha. Ela recebeu um `400` com «a direção «devant» não tem célula» e a frase
> que resolve o caso é a dela: «em nenhum momento eu escolhi «devant»». `semBaldesVazios` vive no
> **núcleo**, é usada pelos dois lados, e **não apaga o erro** — só a lista vazia sai; uma chave que
> não é lista continua a ser acusada. De caminho saiu uma **quarta** soma em linha, que não decidia
> nada e respondia `soma: 12` a um verbete aceite com 8.
>
> **Duas entregas antes** (base `b2d6816`). Nesta entrega: **a tela deixou de somar
> em fila** — a régua das pistas tinha sido aplicada em três sítios e ficou um quarto por corrigir: a
> conta que a página faz **antes de enviar**. Um `Plié` correcto (pernas 8, braços 4, em paralelo)
> era **recusado na tela** com «as células somam 12», antes de chegar ao servidor que já o aceitava.
> Passa a chamar `cobertura()` — a mesma função da tabela —, e a mensagem mostra as pistas. E a
> **recusa deixou de navegar**: era `irParaPasso(...)`, e atirava o professor para o passo da música
> sem o deixar ler o que estava errado.
>
> **Entrega anterior** (base `65326a2`). Nesta entrega: **«Acrescentar trecho»
> desaparece durante a correcção.** Os dois botões eram **um só**, com o rótulo a alternar entre
> «Acrescentar trecho» e «Guardar a alteração» — e um rótulo que muda não esconde nada. Passaram a
> ser **dois**: em correcção, o «Acrescentar» **sai de cena** e o «Guardar» entra. Uma função, dois
> botões, para não divergirem.
>
> **Entrega anterior** (base `9e04787`). Nesta entrega: **corrigir um trecho
> deixou de lhe reescrever o compasso.** A causa era uma linha — `splice` + `push`, que mandava a
> célula corrigida para o fim —, e como o compasso sai da **ordem** (um relógio por pista), corrigir
> uma descrição mudava a posição temporal. Passa a **substituir no lugar**. E os **três
> redirecionamentos** que ela relatou — «Acrescentar Trecho» a sair da decomposição, «Editar» a
> saltar para o passo 4, «Guardar» a mudar de passo — desapareceram: a correcção **abre a área do
> trecho onde se está** (os dois painéis e a decomposição, com o botão de guardar à vista) e nada
> muda de passo sem o utilizador. O «Cancelar» continua a fazer o que ela marcou como CORRECTO.
>
> **Entrega anterior** (base `de43a1b`). Nesta entrega: **as pistas na notação** —
> as células passam a ser contadas por **categoria** (Pé · Peso · Perna · Braço), e não em fila
> única, e é isso que **fecha o `Plié`**: ele somava 12 tempos numa música de 8 porque as pernas (8)
> e os braços (4) correm **em paralelo**. Com isso, **9 das 13 músicas fecham** (eram 8), e a Aula 01
> deixa de lhe pôr `conferir`. Também: a **contagem é por pista** (reverte, com razão, uma decisão de
> 29/10), a **métrica composta** oferece os fins que fecham pulso (6/8 são dois pulsos de três), a
> **repetição** passou a ser da célula (`1–2 ×2`, e entra na conta), e o bloco de posições passou a
> ser **«Posições dos pés e braços»** com a preparatória e a **3ª de rótulo duplo** («terceira ·
> quinta»). O **método** entrou no verbete como **herança com sobreposição**, porque o plano já o
> declara e é obrigatório.
>
> **Entrega anterior** (base `e323e60`). Nesta entrega: **a licença está decidida** —
> três camadas (a máquina é proprietária e **não** se licencia com os produtos; o catálogo licencia-se
> por escola, **vinculado à fotografia datada**; o que a escola acrescenta **é dela**, com uma
> concessão estreita para a via inversa), escrita na `ARQUITETURA-GERAL.md` §10 —, e **o produto é
> pacote próprio**, com âncora, versão e licença independentes do ciclo. A licença obrigou a medir uma
> coisa que faltava: **25 das 59 descrições não têm `fonte`**, e sem origem declarada não podem entrar
> na edição paga. E foi corrigida uma **citação minha, falsa em cinco sítios** — «a
> `ARQUITETURA-GERAL.md:109` diz a definir»; a frase verdadeira é do `REGISTRO.md:109`, na entrada de
> 18/09/2026. Nenhuma linha de código; o `LICENSE.md` **não** foi criado (ela vai testar a `breu`).
>
> **Entrega anterior** (base `377544c`). Nesta entrega: **a decisão dos três produtos**
> — dicionário, syllabus e aula pronta, gerados **antes do ciclo** e entregues **conforme o plano
> contratado** (o Avançado recebe; os outros fazem tudo) —, e o plano que a constrói:
> [PLANO-PRODUTOS-DO-MOTOR.md](./PLANO-PRODUTOS-DO-MOTOR.md), em seis fases. A resposta à pergunta
> dela sobre **quantos motores**: **um motor, três saídas, três manifestos** — a granularidade que a
> negociação pede está nos manifestos, não no código. O plano declara ainda as **nove colisões** com
> os planos existentes e o ajuste de cada uma, e a **C22** ganhou a correção de leitura (o gerador
> não é o quarto produto: é o **meio**). Nenhuma linha de código mudou.
>
> **Entrega anterior** (base `273b62d`). Nesta entrega: **o modelo tem três eixos,
> não um** — a palavra «eixo» aparece uma vez porque o rótulo da dimensão é **prefixo por
> concatenação**, e é ele que rotula «Musicalidade» e «Expressão» como «Técnica — …»; **o ritmo
> nunca esteve em aberto** — é obrigatório no cadastro da turma, conferido em quatro portas do
> `bastidores.js`, e é **do contrato**, não do catálogo (a C19 fechou-se pela negativa); o **corpo já
> está no ciclo** (anamnese → PO → bloco 10 do plano), e o que falta é só a ligação **ao exercício**;
> e nasceu a **C22** no `PLANEJAMENTO-LASTRO.md` — o verbete como átomo do syllabus, os quatro
> degraus e o **veredicto de viabilidade do motor**: é viável, faltam quatro arrumações e cinco
> músicas por corrigir. **Nenhuma linha de código mudou nesta entrega** — é fotografia e registo.
>
> **Entrega anterior** (base `804000a`). Nesta entrega: o verbete passou a ter
> **seis passos**, e o **exercício novo é o passo 1** — o «+», o «Gravar exercício» e o «Cancelar»
> deixaram de existir, e quem grava o termo é o **«Seguir →»** que já existia; a **gravação do
> verbete confere a música** (as células têm de fechar os tempos declarados) e diz onde se corrige —
> passo 3 (a música) ou passo 4 (para onde); e a **Regra 15 foi substituída**, com nota no
> `REGRAS.md` e motivo declarado.
>
> **Entrega anterior** (base `2a7f13f`). Nesta entrega: a **§4 deixou de dizer
> uma coisa falsa** — afirmava «exercícios neste bloco: nenhum» sobre o bloco de musicalidade, e as
> três linhas de exercício tinham tempos e compasso; passou a ser uma **vista consolidada por
> compasso**, um exercício uma vez só, com a contagem *e* o que cai nela, e a «fatia do plano»
> (30% — 27 tempos) saiu porque repetia a §3 sem a tabela; o título da §3 passou a ser **«Distribuição
> do tempo pelos blocos»**; o **plano de ensino ganhou o bloco 10, «Aspecto físico — força e
> flexibilidade»**, lido das anamneses da turma e marcando o ponto de atenção pela ordem das opções
> da própria anamnese; e um **resíduo de expurgo** (`pe-torto/ciclos/ciclo-01-batata`, um ciclo criado
> e nunca preenchido) deixou de travar o commit de quem mexe em `porta/`.
>
> **Entrega anterior** (base `d74fda1`). Nesta entrega: o **molde dos
> schemas** ficou atrás dos professores e matou a geração do ciclo da `breu` («campo ausente»),
> e foi corrigido e **unificado** num leitor só (`570d900`, `e27e462`); a página do **Vocabulário
> saiu** e o botão de semear passou para o «+» do verbete (`ea6cd0d`); a **seta subiu ao título**,
> os **passos desceram para a linha inteira** e o vocabulário deixou de ser só do ballet — `Perna`
> em vez de `Plié`, e orientações com nome português (`a5275c3`); a **Aula 01 deixou de afirmar o
> que ninguém escreveu** — a §2 dizia «força e flexibilidade» sobre o campo da sala, a §4 tinha um
> «Pulso» fixo, a §6 chamava «simulado» a um ciclo publicado e a §8 era um `[Preencher]` mudo —, a
> **proveniência passou a ser dois links** com o objetivo de cada documento, o **próximo passo**
> passou a ter os três estados, e o **PDF ficou reproduzível** (`03be290`, `469c9d5`); a **força e
> a flexibilidade vêm da anamnese**, com os 15 campos que ela escolheu, pelo nome e com o registo
> completo a abrir noutra aba (`cf1ef52`); e a **musicalidade deixou de ser uma lacuna** — consolida
> o que o verbete e a sequência já dizem, por música (`d74fda1`).
> **Como pedir uma atualização:** ver [§13 — Rotina](#13-rotina-de-atualização-e-transferência).

## Quem é dono de quê

Cinco documentos falam do estado. Sem isto escrito, um deles morre por duplicação.

| Documento | Dono do quê | Como nasce |
|:--|:--|:--|
| **`ESTADO-ATUAL.md`** (este) | **Juízo**: o que funciona, o que não, o que está decidido, o que é hipótese | curado, à mão |
| **`HANDOFF.md`** | **Extração**: commit, professores, ciclos, âncoras, última entrada do REGISTRO | gerado por `tools/gerar-handoff.sh`, nunca à mão |
| **`REGISTRO.md`** | **Crónica**: a decisão datada, com motivo e o que a tornou necessária | à mão, ordem cronológica |
| **`FRENTES.md`** | **Panorama**: os três trilhos de trabalho em aberto | à mão |
| **`PLANEJAMENTO-LASTRO.md`** | **Mapa de produto**: para onde o Sistema Lastro evolui | à mão |

**A regra de leitura:** uma sessão nova lê o `HANDOFF.md` para saber onde está o repositório e
**este documento** para saber o que se pode afirmar sobre ele. O `HANDOFF.md` aponta para cá.

## Como se lê este documento

Toda afirmação leva uma etiqueta. Sem etiqueta, é prosa.

| Etiqueta | Significa |
|:--|:--|
| **CONFIRMADO** | verificado agora no código, num ficheiro, num comando ou em produção |
| **DECLARADO** | foi dito por uma pessoa; não verifiquei tecnicamente |
| **DECIDIDO** | decisão de projeto vigente, com data e motivo no `REGISTRO.md` |
| **HIPÓTESE** | interpretação minha, ainda não confirmada |
| **PENDENTE** | questão em aberto, à espera de decisão |

Não se afirmar que uma funcionalidade existe porque há um ficheiro com o nome dela. Um ficheiro
chamado `avaliacao.js` não é uma avaliação a funcionar.

---

## 1. Identificação

**Nome comercial:** o produto é o **Sistema Lastro**; este repositório é o **Projeto Ciclo**, o
protótipo a partir do qual ele se constrói. A convivência dos dois nomes é declarada, não é
renomeação. **DECIDIDO**.

**Finalidade:** a memória da aula dada. Cada aula é planeada antes de ser dada; o plano
(`aula-NN.md`) fixa objetivo, marcos e volume e dá a linha de base. O que se registra é o que
**mudou em relação ao plano**. **DECIDIDO**.

**Escopo atual — o que este projeto é e não é:**

- **É um protótipo, testado no universo da dança.** **Não é agnóstico.** O projeto agnóstico será
  criado a partir dele. **DECIDIDO**.
- **Não é o projeto de mestrado** — o mestrado está noutro diretório, e é de lá que vêm o PO e o
  FIPP. **DECIDIDO**.
- **Não implementa o FIPP.** A âncora `.fipp` (`tools/hash-ciclo.sh`) partilha o princípio —
  o passado incorpora-se, não se reescreve — mas é aproximação, não o framework. **CONFIRMADO**
  por leitura do script e do `PROTOCOLO.md`.
- **Não avalia.** Registra o cotidiano do professor em sala. A avaliação é fronteira de outro
  módulo, ainda não desenhado. **DECIDIDO**.
- **A integração com o projeto das secretarias não existe** — nem a fronteira de entrada nem a de
  saída foram desenhadas. **CONFIRMADO**: não há código de integração no `motor/`.

## 2. Estado confirmado

Verificado nesta fotografia, com os comandos da §9.

- **A entrega foi publicada em `d349ed0`;** após o push, `git fetch origin` confirmou `origin/main` alinhado, sem divergência. **CONFIRMADO** naquele momento.
- **O alfabeto do `bale-classico` tem CINCO categorias** — `Pé · Peso · Perna · Braço · Cabeça` —,
  **três eixos de lado** (`D`/`E` horizontal, `F`/`T` sagital, `C`/`B` vertical), **cinco direções**
  (`devant`, `a-la-seconde`, `derriere`, `para-dentro`, `para-fora`), **seis orientações** e
  **treze sinais de movimento**. Lido do ficheiro, versão 17 do alfabeto. **CONFIRMADO** 02/11/2026.
  A **Cabeça é uma pista** — um movimento de cabeça conta os seus tempos em paralelo com as pernas —
  e **não** um membro com posições: o vocabulário ainda não tem nenhuma posição de cabeça, e isso é
  conteúdo a escrever com fonte, não código.
- **19 professores** em `professores/`, e **uma variante**: a `breu`, criada por ela a 02/11/2026
  (`2fd6c07`) — `coqui-de-redinha/ciclos/ciclo-01-breu.conf`, com `DOCS=""` (é o **ciclo-zero**, sem
  documentos; existe o **pacote-zero** `ciclo-01-breu/`, com `assets`, `index.html` e
  `plano-observacao`). O `indices/acervo.json` diz **1 ciclo, 0 variantes**, com `estado: ancorado`.
  **CONFIRMADO** por contagem e por leitura do índice, depois do rebase, em 02/11/2026.
- **O mesmo número mudou DUAS vezes no mesmo dia, e isso é a lição.** Minutos antes desta linha, o
  expurgo da `batata` (`aeb2b2c`, **81 ficheiros**) tinha levado as **duas** variantes — o ciclo-zero
  (`pe-torto/01/batata`) e o pacote de teste (`pe-junto/01/batata-bale-nivel-1-teste-2`) — e o acervo
  ficou a **0 ciclos**. Contar sem `git fetch` antes teria dado um terceiro número errado. É a mesma
  família de erro do «o worktree não sabe que o remoto mudou»: **um `git status` limpo diz que nada
  aconteceu aqui, não que nada aconteceu.**
- **A licença existe em dois ficheiros, e são dois por uma razão.** `LICENSE.md` na raiz (a
  **máquina**: todos os direitos reservados, não licenciada com os produtos) e `biblioteca/LICENSE.md`
  (o **catálogo**: seis cláusulas, a concessão estreita da escola e a condição do `fonte`). São dois
  porque as duas camadas dizem o contrário uma da outra — «não se licencia» e «licencia-se com
  limites» — e um ficheiro só não consegue dizê-lo. **CONFIRMADO** 02/11/2026 por leitura.
  A **fotografia datada** (`catalogo@AAAA-MM-DD`) passou a ser **calculada** do último commit que
  tocou o catálogo — medido `catalogo@2026-11-02` (`23d4c0e`) — e é **derivada**: diz «a versão nesta
  data», não «a versão que esta escola contratou». Essa é do **contrato** (C8), e a data dele vence
  quando existir. **PENDENTE** declarada, e já não impeditiva. **CONFIRMADO** 02/11/2026 por
  `provar-produtos` §L.
- **17 regras** em `REGRAS.md` e **22 pétreas** em `PROTOCOLO.md`. **CONFIRMADO** (contagem).
- **O motor tem 52 ficheiros versionados, 31.850 linhas** entre `motor/nucleo/` e
  `motor/servidor/`. **CONFIRMADO** em 02/11/2026.
- **33 rotas** registadas em `motor/servidor/rotas.js`. **CONFIRMADO** em 02/11/2026.
- **91 provas versionadas** em `experimentos/provar-*.js` (104 no disco; as outras são bancadas
  locais que o `.gitignore` fecha). **CONFIRMADO** em 02/11/2026.
- **O molde dos schemas tem um leitor só.** `motor/nucleo/schemas.js` é o único sítio que lê
  `modelo/ciclos/`; o `tools/gerar-schemas.js` é a porta para o shell e o provisionador do Worker
  deixou de pedir o molde por HTTP (os cinco `GET` saíram). `gerar-schemas --conferir` corre no
  `pre-commit`. **CONFIRMADO** (`provar-schemas` 29/29, `check-schemas` TUDO CERTO).
- **A geração de um ciclo é REPETÍVEL byte a byte.** Duas gerações seguidas do mesmo ciclo dão o
  mesmo md5 nos dois PDFs e deixam o `git status` limpo — o `gerado_em` passou a vir do
  `SOURCE_DATE_EPOCH` (a data do último commit nas fontes) e o `/ID` do trailer do PDF está fixo
  (`\pdftrailerid{}`). **CONFIRMADO** em 02/11/2026, medido com duas execuções.
- **A força e a flexibilidade chegam ao PO pela anamnese.** O nó `linha-de-base` declara 15 campos
  em dois grupos, e o mapa servido ao vivo em `batata.tmenegaz77.workers.dev` devolve-os com o nome
  do formulário («Flexibilidade dos isquiotibiais»). **CONFIRMADO** em 02/11/2026 por
  `provar-forca-e-flexibilidade` (17 asserções, com controle negativo) e por uma leitura ao ar.
- **A §4 da aula não pede nada a ninguém.** Consolida, por música, a grade de contagens do verbete e
  os exercícios que a usam; a música vem da sequência do plano. **CONFIRMADO** em 02/11/2026 por
  `provar-o-que-vem-do-dado` (mutação: trocar a música muda o documento).
- **6 workflows** em `.github/workflows/`: `criar-escola`, `deploy-escolas`, `deploy-raiz`,
  `gerar-ciclo`, `reancorar`, `regerar-indices`. **CONFIRMADO**.
- **Produção da escola `batata` responde** (`batata.tmenegaz77.workers.dev`). **CONFIRMADO**
  em 25/10/2026:

  | Caminho | Código |
  |:--|:--|
  | `/` | 200 |
  | `/ciclos/planos/` | 200 |
  | `/ciclos/referencias/` | 200 |
  | `/aulas/` | 200 |
  | `/consulta/` | 200 |
  | `/area-do-professor/anamnese/` | 200 |
  | `/area-do-professor/plano-de-ensino/` | 200 |
  | `/area-do-professor/plano-de-observacao/` | 200 |
  | `/area-do-professor/notacao/` | 200 |
  | `/bastidores` | 302 (login) |

  Os caminhos antigos `/ciclos/`, `/glossario/`, `/notacao/`, `/producao/` dão **404** — foram
  removidos pelo reagrupamento de 24/10/2026. **CONFIRMADO**.

- **Publicação de 27/10/2026:** `Publicar as escolas` concluiu com sucesso no commit `d349ed0`,
  incluindo o job de Batata; a única conferência final em `/aulas/` respondeu HTTP 200 e confirmou
  os links da prosa e da ação «Abrir notação». **CONFIRMADO**.

- **Publicação da Aula 01 em 27/10/2026:** o commit `8b939d0` foi enviado a `origin/main`; o run
  #287 de `Publicar as escolas` e o job `publicar (batata)` concluíram com sucesso. Uma única
  requisição final à raiz respondeu HTTP 200 e o HTML contém o link para `/aulas/`. A rota não foi
  recarregada após este deploy. **CONFIRMADO**.

- **Publicação de 28/10/2026 (cabeçalho e cartão):** `a2bbdfa`, `29a95e5` e `3c3a29d` enviados a
  `origin/main`; `Publicar as escolas` #289, `Reancorar a cadeia` #404, `Regerar os índices` #206 e
  `Publicar a raiz` #105 concluídos com sucesso. A conferência ao ar foi à aula e ao glossário da
  Batata. **CONFIRMADO**.

- **Publicação de 28/10/2026 (leitura dos documentos):** os três commits foram enviados a `origin/main`; `Regerar os
  índices` #205, `Publicar as escolas` #288 e `Reancorar a cadeia` #403 concluíram com sucesso no
  commit `d9f085f`. A conferência ao ar foi à escola `batata`, que é a única com pacote. O plano
  publicado não tem subtítulo nem ficha, mostra os dois grupos do contexto, o calendário em duas
  partes e o rodapé do próprio documento. **CONFIRMADO**.

- **O `HANDOFF.md` estava desatualizado** — dizia `6bdb06a` com o `HEAD` em `7182307`.
  **CONFIRMADO** e corrigido nesta sessão por regeneração.
- **A publicação de 01–02/11/2026 foi verde em todas as Actions.** `Publicar as escolas`,
  `Publicar a raiz`, `Reancorar a cadeia` e `Regerar os índices` concluíram com sucesso nos commits
  `cf1ef52` e `d74fda1`. **CONFIRMADO** pela API do GitHub.
- **O ar serve a Aula 01 e o plano desta entrega.** Uma carga por página, no fim: `aula-01` **200**
  com os oito títulos, «3. Distribuição do tempo pelos blocos» e «Os compassos desta aula» (e
  «Exercícios neste bloco» já não aparece); `plano` **200** com «Aspecto físico — força e
  flexibilidade» antes da música. **CONFIRMADO** em 02/11/2026, depois do push — a Action
  `Publicar as escolas` corre em cada push e **publica sem passo manual**: dizer «não publiquei»
  teria sido falso. É a mesma família do «o worktree não sabe que o remoto mudou» — supor o que o
  outro lado faz, sem lá olhar.
- **«O push publica» é verdade, mas não é «todo o push» — e a diferença é de custo.** O
  `deploy-escolas.yml` tem **`paths:`** (linha 43), e o que lá está é **o que a escola serve**:
  `professores/**/ciclos/ciclo-*/**`, `professores/**/ciclos/*.conf`, `motor/**`, `workers/**`,
  `wrangler.*.jsonc`, `tools/templates/**`, `tools/montar-publicacao.js`, `tools/check-identidade.js`
  e `experimentos/propostas/**`. **Um commit que só toca `*.md` na raiz não publica nada** — medido
  em 02/11/2026: os pushes `377544c`, `e323e60` e `08551a9` (documentação) **não** geraram run de
  `Publicar as escolas`, enquanto `aeb2b2c` (expurgo) gerou três. **CONFIRMADO** pela API das Actions
  e pelo `paths` do workflow. **Corrige a frase que esta secção repetia** («o push publica» como se
  fosse incondicional): é verdade para o que chega ao site, e é falso para documentação — o que é
  bom, porque é exactamente o que a regra de «medir sem gastar a cota do ar» precisa.
- **A expectativa de que a publicação ficaria por fazer estava errada**, e vale a pena registá-lo: o
  plano era não publicar, porque ela vai expurgar a `batata`. Mas o `Publicar as escolas` é um
  workflow de push e correu — as quatro Actions de `8175264` ficaram `success`. Publicar não estraga
  nada (o expurgo apaga), e **não publicar não era uma opção que este repositório oferecesse.**
  **CONFIRMADO** pela API do GitHub e pela leitura das duas páginas.
- **O verbete tem SEIS passos, e o exercício novo é o primeiro.** O «+» que abria um cadastro, o
  «Gravar exercício» e o «Cancelar» **deixaram de existir**: o passo 1 são os campos do exercício
  novo (nome, categoria, tradição, carregar as turmas iniciais), o **«Seguir →»** é que grava o
  termo, e avançar sem nome não grava nada. O seletor do exercício é o passo 2; a música é o 3, o
  «para onde» o 4, os sinais o 5, a decomposição o 6. **CONFIRMADO** por `provar-celula` e por
  `provar-verbete`.
- **O passo 1 ficou condicional, e a frase do exercício vive lá** (02/11/2026). A regra, ao pé da
  letra dela: «se não preencher o nome, os campos seguintes permanecem opcionais e ele pode navegar
  livremente; se escrever o nome, os seguintes tornam-se estritamente obrigatórios». `oQueFaltaNoPasso1()`
  devolve **`[]` sem nome** e, com nome, exige a frase, a categoria e a tradição — a recusa diz o
  que falta pelo nome. A **categoria e a tradição deixaram de nascer escolhidas**: os dois
  `<select>` tinham a primeira opção já marcada, e por isso os dois obrigatórios nunca podiam
  faltar. E o campo **«posição em que o exercício acontece» saiu do formulário** — pedi-la era
  pedi-la duas vezes, porque ela escreve-se nos sinais do trecho. **O dado fica**: uma posição já
  gravada continua no alfabeto e continua a ler-se na listagem. **CONFIRMADO** por `provar-celula`
  §23 (203 asserções) e por `provar-verbete`.
- **A música não se muda por baixo dos trechos** (02/11/2026). Com uma célula que seja, `#vbtempos`
  fica `readOnly` e `#vbcompasso` `disabled`, com `aria-readonly` e uma nota que diz porque e para
  onde ir (o «Duplicar o exercício», que escreve tempos e células na mesma acção). **CONFIRMADO** em
  §23-B, e a libertação medida depois do «Apagar», que limpa o formulário.
- **O verbo apagar o verbete existe, e o que ele NÃO apaga está dito** (02/11/2026). O `DELETE
  /api/bastidores/verbete` respondia 409 e passou a apagar: exige token e **nome** (um `DELETE` sem
  corpo apagaria «o que estivesse lá»), sobe a versão do alfabeto e grava com
  `chore(notacao): apagar o verbete «X»`. O **vocabulário não se toca** — a notação sai, a palavra
  fica. A consequência (uma aula publicada passa a sair em lacuna) vai escrita na pergunta que a
  tela faz antes do gesto. **CONFIRMADO** por `provar-verbete` §C-2 e `provar-celula` §23-D.
- **O `DELETE` TEM GUARDA DE PROVENIÊNCIA, e a do `UPDATE` é o ajuste** (02/11/2026). Um verbete que
  compõe um **plano de ensino** (o exercício está no repertório de um envelope, ou associado a uma
  turma com plano) ou o repertório de uma **curadoria** não se apaga: `409` com a consequência e o
  caminho («Descontinuar»). `usos === null` (leitura falhada) conta como vinculado. E um `UPDATE`
  num verbete em uso **não reescreve** — passa a ser um **ajuste**, escolhido por ela entre três
  caminhos: o estado anterior vai para `versoes[]` com `ate` e o motivo, e a composição escolhe o
  estado que valia **na data do envelope** (`gerado_em`). Um verbete sem vínculo continua a editar-se
  como sempre, e um verbete sem `versoes` lê-se exactamente como antes — não houve migração.
  **CONFIRMADO** por `provar-verbete` §G (as três portas, e uma leitura só do índice), §I (as peças)
  e §J (fim a fim: o mesmo envelope com duas datas dá dois textos).
- **Os índices que o pedido nomeia não têm onde existir, e isso está medido, não suposto.** O
  dicionário é um JSON de 93 termos no repositório, lido inteiro para memória; os envelopes vivem
  num **índice de resumos** (`envelope/.indice.json`) que já traz `professor`, `turma`, `ciclo` e
  `repertorio` numa leitura. Não há base de dados, nem `tenant_id` — o isolamento é o `escola/` no
  caminho da chave. O que se fez foi o que o pedido queria no fundo: a guarda consulta o índice
  **uma vez** em vez de ler envelope por envelope, e a prova conta as leituras.
- **A tradição de referência é uma lista só, e o rótulo está no dado** (02/11/2026; **corrigido na
  mesma data**). Entra **CUBANA**; a ordem é RAD · Francesa · Vaganova · Cubana · Compartilhada. A
  primeira redação desta linha dizia «o ecrã mostra em caixa alta» e «o rótulo é derivação
  (`rotuloDaTradicao`)» — **está desactualizado**: ela reviu a decisão à tarde e pediu *Title Case*
  com **apenas as siglas em caixa alta**. O mapa de rótulos passou para o **próprio ficheiro**
  (`tradicoes.json` → `rotulos`), e `rotuloDaTradicao` só o lê: uma regra automática de maiúsculas
  não saberia que `RAD` é sigla e `Vaganova` é nome próprio. O **dado dos termos não é migrado**
  (`vocabulario.json` grava `francesa`, e `diferencasDeNomenclatura` tem uma coluna por chave).
  **CONFIRMADO** por `provar-verbete` §H, incluindo «em todos os selectores, o texto é o rótulo do
  ficheiro».
- **O «Apagar o verbete» vive só na LISTAGEM** (02/11/2026, segunda correcção do dia). Ele esteve
  também no passo 6 por pedido da manhã, e saiu: é a tela onde se escreve a decomposição, e apagar o
  verbete inteiro ao lado do «Acrescentar trecho» é um alvo a um clique do gesto mais frequente. O
  verbo e a guarda de proveniência ficam os mesmos — o que mudou foi o sítio. **CONFIRMADO** por
  `provar-celula` §24-F (o botão não existe nem na marcação nem no script, e o da lista continua).
- **A navegação bloqueia para a frente, e só para a frente** (02/11/2026, segunda correcção do dia).
  O passo seguinte e o «Seguir» ficam `disabled` enquanto faltar um obrigatório da etapa; **voltar
  continua livre**, porque não perde nada (o estado vive no DOM e o rascunho não é tocado). O
  `title` do botão diz o que falta, por nome. O «Acrescentar trecho» também espera os passos 1–5.
  A regra anterior — «a tira não bloqueia» — está **revogada**, e o comentário no código di-lo.
  **CONFIRMADO** por `provar-celula` §24-G e §24-H.
- **Escolher um exercício no passo 2 preenche e CONGELA o passo 1** (02/11/2026, segunda correcção
  do dia). Categoria e tradição vêm do termo; a frase vem do que está **gravado** e, quando não há
  nada, da definição do dicionário (P-03/P-04). Os três ficam `disabled` e a nota diz que a
  definição é do dicionário — para a mudar, edita-se o **termo**, não o verbete. Sem nome de
  exercício novo, o passo 1 também não pede nada. **CONFIRMADO** por `provar-celula` §24-C.
- **O `ED`/`EI` do alfabeto deixaram de se chamar «en dehors»/«en dedans»** (02/11/2026). Os glifos
  `↺`/`↻` já diziam «rotação para fora/dentro»; os dois que descrevem a **varredura** da perna
  passam a dizer «varredura para fora/dentro», sem nomenclatura estrangeira duplicada. Os **sinais
  não saíram**: `ED`/`EI` continuam válidos no dado, com o mesmo glifo e o mesmo significado —
  mudou o rótulo, e é isso que tira a redundância que ela viu no passo 5. Alfabeto na **versão 31**.
  **CONFIRMADO** por `provar-notacao` (48 asserções, 0 falhas).
- **As fixtures do `breu` passaram a Plié · Battement tendu · Battement fondu** (02/11/2026), com
  `musica` e `celulas` pré-escritas — o `Plié` em 8 tempos de 4/4 e os outros dois com um en croix
  completo. As três passam o `validarVerbete`, e as curadorias acompanham. **CONFIRMADO** por
  validação directa com `validarVerbete` e por `provar-teste` (a §7 mede o termo a chegar ao
  formulário). O limite fica dito: a fixture **não é conteúdo pedagógico** — é massa sintética, e
  nota-se nos textos.
- **O preenchedor de fixtures chamava uma função que já não existe** (02/11/2026, defeito medido).
  `modoExercicio(true)` saiu quando o «+» virou o passo 1; o `typeof` dava `undefined`, a função
  saía pela porta de emergência e **nenhum termo chegava ao formulário** — `provar-teste` falhava
  com `'' !== 'Jeté'` desde então. Agora o preenchimento **escolhe** o exercício no passo 2 (o termo
  já existe no vocabulário) e, quando há bloco `verbete`, põe a música e as células no estado da
  página. **CONFIRMADO** por `provar-teste` §7.
- **Os índices do dicionário e do syllabus estão DECLARADOS, e não implementados** (02/11/2026). O
  `PLANO-INDICES.md` §4.1 manda declarar antes de emitir: entraram `termo` e `verbete` em
  `indices/esquema/campos.json` (`estado: prevista`) e a relação `verbete → termo`. A relação de
  **proveniência** (verbete empregado em turma/plano/curadoria) **não** se declara ali: ela já é
  respondida pelo acervo — `vinculo`, repertório da turma e `registro` —, e declará-la duas vezes
  daria duas respostas para a mesma pergunta. **CONFIRMADO** por `check-indices` (14/14, e as 10
  contraprovas a reprovarem como deviam).
- **O motor dos produtos existe para dois dos três, e não inventa** (02/11/2026). O **dicionário**
  (`motor/nucleo/produtos/dicionario.js`) e o **syllabus** (`.../syllabus.js`) são puros,
  determinísticos e geram markdown a partir do catálogo já lido; o CLI `node motor/produtos.js`
  escreve-os em `publicacao/produtos/<modalidade>/` (pasta gerada, no `.gitignore`). O que falta
  sai **nomeado**: `[Preencher]` para o termo sem definição ou sem origem, lacuna para o exercício
  sem verbete, `[conferir]` **com o motivo** para o verbete cujo `cobre` não fecha os tempos — e a
  contagem errada **não é publicada**. O nível que ainda não declarou unidades diz que é a lacuna.
  A **aula pronta não foi começada**. **CONFIRMADO** por `provar-produtos` (52 asserções), que
  mede o mecanismo sobre uma fixture declarada e, no catálogo real, só as **contagens** — a lição
  de 02/11/2026 é que uma prova que mede o conteúdo reprova quando o conteúdo muda.
- **A composição catálogo × escola tem código, a separação dos ficheiros NÃO** (02/11/2026). O
  `plano` (fase 1) pede dois ficheiros e um leitor que os componha; o que existe é a **função
  única** (`compor`, em `produtos/comum.js`, com a escola a ganhar e a marcar `origem`) e o
  dicionário a **excluir as adições por omissão** — o produto que se vende é o do catálogo. O que
  **não** foi feito: `termo-repo.js` continua a escrever no `vocabulario.json` do catálogo, e
  `lerModalidade` continua a lê-lo inteiro. Logo, o **critério 5 do plano** («criar um termo numa
  escola não altera o ficheiro do catálogo») **não está cumprido** — é lacuna declarada, não uma
  verificação que se possa alegar.
- **O exercício novo já está na lista ao avançar, e nada disto toca no KV.** O `POST
  /api/bastidores/termo` grava no **repositório** (`biblioteca/modalidades/bale-classico/
  vocabulario.json`, por `termo-repo.js`) e devolve o termo; a lista que `GET
  /api/bastidores/verbete` serve lê o **mesmo ficheiro no GitHub**. **Zero chamadas ao KV** nas
  duas rotas — **CONFIRMADO** por leitura das rotas e dos módulos. A tela acrescenta o termo à
  lista local sem esperar por outra leitura, e o mesmo nome não entra duas vezes.
- **A gravação do verbete recusa um verbete que não fecha a música.** Antes só se conferia `cobre`
  contra a soma das próprias células — uma conta do formulário consigo mesmo; a música, que é a
  chave do verbete, não era comparada com nada. Foi por isso que o `Battement fondu` ficou em
  «2|4/4» com 6 tempos e o `Plié` em «8|4/4» com 12. A recusa diz onde se corrige — **passo 3** (a
  música) ou **passo 4** (para onde) —, e o número sai de `passoPorRotulo()`, sobre
  `PASSOS_DO_VERBETE`, não escrito à mão: com seis passos, os dois subiram de 2/3 para 3/4.
  **CONFIRMADO** por `provar-celula` (a recusa, com o recado medido) e por `provar-verbete`
  (o servidor valida a música como quarto argumento).
- **Corrigir um trecho não lhe muda o compasso nem o lugar na lista.** O handler fazia `splice` +
  `push` — a célula corrigida ia para o **fim** da lista —, e como o compasso sai da **ordem** (um
  relógio por pista), corrigir uma descrição **reescrevia a posição temporal** do trecho. Medido, no
  cenário dela: três trechos de `Perna` em 2/4 dão compassos **1, 1 e 2**, e corrigir o primeiro
  deixava-o no 2. Agora **substitui-se no lugar** e a sequência mantém-se. **CONFIRMADO** por
  `provar-celula`, secção 20-A (143 asserções).
- **Um balde vazio é ruído, não uma declaração — e não bloqueia a gravação.** Com a direção a ser a
  **chave** da célula, uma chave com zero células diz o mesmo que a chave não existir. `semBaldesVazios`
  (no **núcleo**, usada pelo `verbete.js` e pelo `compor`) tira-a; o editor nunca a manda (o `×`
  leva a direção consigo, e há uma última defesa antes de enviar); e a gravação **normaliza**, para o
  ficheiro não ficar com o lixo do pedido. **A normalização não apaga o erro**: uma chave que **não é
  lista** fica e é acusada. **CONFIRMADO** pelo payload real, por `provar-celula` §20-B e por
  `provar-notacao` (78 asserções).
- **A conta dos tempos tem UM nome, e é chamada nos quatro sítios.** A régua das pistas foi aplicada
  no motor, no validador e na cobertura da tabela — e **faltou a conta do `submit`**, que somava em
  fila **e sem a repetição**. Resultado medido: um `Plié` correcto (pernas 8 + braços 4, em paralelo)
  era **recusado na tela** com «as células somam 12», antes de chegar ao servidor que já o aceitava.
  Passou a `var soma = cobertura();` — a mesma função da tabela. **CONFIRMADO** por `provar-celula`
  §15-A (148 asserções).
- **A recusa de gravação NÃO navega.** Era `irParaPasso(...)`, e o professor era atirado para o passo
  da música sem ler a mensagem no sítio onde estava. A mensagem diz **onde** se corrige; **ir é
  decisão de quem lê**. E ela fica numa faixa na própria página (`.res.erro`, com o fundo e o bordo da
  falha), não num `alert()` que se fecha e leva a mensagem consigo. **CONFIRMADO** por
  `provar-celula` §15.
- **«Acrescentar trecho» não existe durante a correcção — são dois botões, e não um que muda de
  nome.** Era um só (`vb-cel-acrescentar`), com o rótulo a alternar; um rótulo que muda não esconde
  nada, e quem corrige vê o mesmo botão no mesmo sítio. Agora `vb-cel-acrescentar` («Acrescentar
  trecho») fica **escondido** em correcção e `vb-cel-guardar` («Guardar a alteração») é que aparece.
  **Uma função, dois botões** (`acrescentarOuGuardar`), para os dois não divergirem. **CONFIRMADO**
  por `provar-celula` (145 asserções) e medido no browser.
- **A correcção de um trecho abre a área do trecho onde se está, e não muda de passo.** Os três
  redireccionamentos que ela relatou vinham todos de `irParaPasso(PASSOS_DO_TRECHO[0])`. A regra
  passa a ser: em edição, os painéis **4, 5 e o último** ficam à vista — o último também, porque é
  lá que está o botão que guarda, e sem ele quem corrige os sinais teria de o procurar;
  **acrescentar** e **guardar** não mudam de passo; **cancelar** também não, que é o comportamento
  que ela marcou como CORRECTO. **CONFIRMADO** por `provar-celula`.
- **As células contam-se por PISTA, e é isso que fecha o `Plié`.** A pista é a **categoria** (Pé ·
  Peso · Perna · Braço): `à frente` e `atrás` são o mesmo corpo e somam-se; `Perna` e `Braço` são
  corpos diferentes e correm **em paralelo**. O que o verbete ocupa da música é a **maior** pista. O
  `Plié` somava 12 numa música de 8 (pernas 8 + braços 4) porque era contado em fila; com pistas dá
  **8 = 8**, e passa a `estado: composto`. **CONFIRMADO** por `provar-notacao` (76 asserções) e pelo
  próprio motor. **9 das 13 músicas fecham** — eram 8.
- **A contagem é por pista, e isso reverte uma decisão de 29/10/2026.** Aquela decisão impedia dois
  trechos de começarem no mesmo tempo, porque a aula diria «duas coisas diferentes para o mesmo
  instante». Medido: em **duas categorias** o mesmo instante não é contradição, é **simultaneidade**.
  `opcoesDeContagem(cat)` soma só a pista da categoria, e o compasso da tabela sai de um **relógio
  por pista**. **DECIDIDO** e implementado em 02/11/2026.
- **A métrica composta deixou de ser lida como simples.** A contagem só via o numerador: em 6/8
  oferecia `1` a `1–6` como um compasso de seis. `passoDaGrade()` distingue os **compostos** (`/8`
  com numerador múltiplo de 3) — 6/8 são **dois pulsos de três**, 9/8 três, 12/8 quatro — e a lista
  traz **primeiro os fins que fecham pulso**, no fim os de meio (que **não** são proibidos: `1–2` num
  6/8 é síncope, e existe). **CONFIRMADO** por `provar-celula` (134 asserções). **Correção da
  proposta:** 3/4 é ternário **simples** e 6/8 é composto **duplo**; o que decide é a subdivisão do
  pulso, e por essa régua as duas caem em lados opostos.
- **A repetição é da célula.** `repeticoes` (inteiro ≥ 1) diz quantas vezes o trecho acontece; a
  `contagem` é a de **uma** execução e o que a célula ocupa é o **produto**. Entra em toda a
  aritmética (`temposDaCelula`), e um `0` é **recusado**. Na tabela lê-se «1–2 **×2**».
  **CONFIRMADO** por `provar-verbete`.
- **A TURMA É O RITMO; O ENSINO É DA CURADORIA (03/11/2026, revendo a decisão da manhã).** O
  professor, a modalidade, a tradição e o nível saíram do cadastro da turma e passaram para a
  **curadoria** — para a escola poder mover uma turma de nível sem destruir a estrutura
  operacional dela. O nível da curadoria é `grau` + `nivel`, na forma da tradição, e o rótulo
  (`nivelReferencia`) é **composto**. **A memória não se apaga**: uma turma que guardou o nível
  antigo conserva-o, e ele é lido quando a curadoria não declara — com a origem dita. A regra
  inteira está em `motor/nucleo/enquadramento.js` e na **§2.3 da `ARQUITETURA-GERAL.md`**.
  **DECIDIDO e implementado** 03/11/2026.
- **O bloco de posições é um só: «Posições dos pés e braços».** Tem a **preparatória**, os cinco
  números **e, desde 03/11/2026, `cp` (coupé) e `cdp` (sur le cou-de-pied)** — o termo existia no
  vocabulário e o **sinal** não existia, e sem o sinal o battement frappé não se escrevia. A **3ª
  leva o rótulo duplo** — «terceira · quinta (braços)» —, porque os dois braços
  acima da cabeça são a 3ª na francesa e a 5ª na RAD. A **categoria do trecho** separa pés de braços
  (`[Pé: 3ª …]` / `[Braço: 3ª …]`). As posições de braços existiam no alfabeto **e não chegavam a
  nenhum ecrã**: `posicoesDeBracosDoMetodo` estava exportada e ninguém a chamava. **CONFIRMADO**.
- **O método no verbete é HERANÇA COM SOBREPOSIÇÃO, não uma segunda declaração.** O plano já declara
  «Metodologia de referência», **obrigatório** (`contexto-metodologia`); o campo do verbete tem como
  primeira opção «herda a metodologia do plano». Duas declarações do mesmo facto divergiriam ao
  primeiro caso. **DECIDIDO** 02/11/2026.
- **A §4 consolidava por MÚSICA e afirmava «exercícios neste bloco: nenhum».** As duas coisas
  estavam erradas: as três linhas de exercício da aula trazem `Tempos` e `Compasso`, e o verbete traz
  a grade das contagens. Passou a **consolidar por compasso**, um exercício uma vez só, e a prova
  guarda cinco asserções que tornam a afirmação falsa impossível — entre elas «não afirma que o bloco
  não tem exercícios» e «cada exercício aparece uma vez» (`provar-o-que-vem-do-dado`).
  **CONFIRMADO** no `.md` gerado e na prova.
- **A grade que não fechava era a régua, não o dado — e o `Plié` já fecha.** O documento punha
  `conferir` no **Plié** («12 tempos onde a música tem 8») e no **Battement fondu** (6 numa de 2). O
  `Plié` era o **defeito de conta**: duas pistas somadas em fila. Com a régua por pista dá 8 = 8 e
  ele compõe-se (`estado: composto`). O **fondu** continua a não fechar (6 numa de 2), e é conteúdo:
  ou a música é outra, ou as células. **CONFIRMADO** em 02/11/2026 pelo motor e por `provar-notacao`.
- **O primeiro dos três eixos macro passou a ter campo no PLANO.** O plano de ensino tem o **bloco
  10, «Aspecto físico — força e flexibilidade»**, com `aspecto-fisico` e o descritor
  `lidoDasAnamneses` (quinze campos da anamnese, em dois grupos). A porta consolida por aspecto com
  `derivarDasAnamnesesDaTurma`, e a **régua é a ordem das opções da própria anamnese** — não há
  segunda lista escrita à mão. **CONFIRMADO** por leitura e pela propagação do schema nos 18
  professores (`check-schemas` TUDO CERTO).
- **O ritmo da turma é OBRIGATÓRIO, e nunca esteve em aberto.** O formulário da turma pede os **dias
  da semana** e a **hora de início de cada um**, a **duração de cada aula** e o **início e o fim do
  período**; a **frequência** não se digita — é a contagem dos dias (`frequenciaDaTurma`), e o campo
  saiu do formulário em 18/10/2026 para os dois números não poderem discordar. O sistema **recusa**
  gravar a turma, atribuí-la a um professor e **gerar o ciclo** sem o ritmo
  (`faltaNoRitmoDaTurma`, quatro portas: `bastidores.js:7402`, `:7463`/`:7554`, `:8203`, `:8343`), e
  o cartão da turma **diz o que falta** em vez de deixar o botão apagado. **CONFIRMADO** por leitura
  do código em 02/11/2026 — e é a correção de uma afirmação minha («o ritmo continua em aberto»),
  que procurava o ritmo no **catálogo** em vez do **cadastro**.
- **Os três produtos estão decididos, e a arquitetura é um motor só.** A pesquisadora decidiu
  (02/11/2026) criar **dicionário, syllabus e aula pronta**, gerados **antes do ciclo** e entregues
  **conforme o plano contratado** — o Básico e o Intermediário «fazem tudo», o Avançado «recebe as
  benesses». A pergunta «um motor ou dois?» ficou respondida com medição: **um motor, três saídas,
  três manifestos**. **DECIDIDO** o produto; o plano está em
  [PLANO-PRODUTOS-DO-MOTOR.md](./PLANO-PRODUTOS-DO-MOTOR.md) e **nada foi implementado**.
- **Sete das nove peças do motor já existem, e três estão na forma que os produtos exigem.** A
  **notação é derivada** (`notacao.js`, `categoria` + `sinais` → `[Pé: 5ª → +]`); o **glossário já é
  o dicionário aplicado a um ciclo** (`glossario-benesh`, com índice de símbolos e origem por
  verbete); e a **regra do volume já é norma** (Regra 9: teto pela duração, depois solo 30–40% · barra
  20–30% · centro 30–40% · musicalidade 5–10%, com as faixas no `.conf`). **CONFIRMADO** por leitura em
  02/11/2026.
- **O que falta para os produtos é CONTEÚDO, não código.** O mapa nível→termos tem **13 turmas e 9
  associações**, e só **2 dos 13 níveis** têm alguma (nível 1: quatro termos; nível 2: cinco); a
  camada pedagógica não existe em ficheiro nenhum do catálogo; as **4 músicas** continuam a não
  fechar; faltam a **licença** e a **separação** catálogo × escola. **CONFIRMADO** — e é o caminho
  crítico do plano.
- **A licença está decidida — três camadas, e nenhuma delas existia.** `ARQUITETURA-GERAL.md` §10:
  **a máquina** (`motor/` · `tools/` · `porta/` · `raiz/` · `.github/`) é **proprietária e não se
  licencia** com os produtos; **o catálogo** licencia-se **por escola**, em seis cláusulas, **vinculado
  à fotografia datada** (a lógica da C5a) e **perpétuo para a versão contratada** (a lógica da L9);
  **o que a escola acrescenta é dela**, com uma concessão **não exclusiva** para o projeto o servir de
  volta e **avaliar** a entrada no catálogo, que exige **aceitação explícita**. **DECIDIDO**
  02/11/2026. O texto **existe** nos dois ficheiros (`890937a`); o que faltava era **a data**, e ela
  passou a ser derivada do `git` (§2). **CONFIRMADO** 02/11/2026.
- **25 das 59 descrições do vocabulário não têm `fonte`.** Medido em `vocabulario.json` (93 termos):
  30 vêm do «Dicionário Técnico Completo de Ballet Clássico v1.0.0 — fornecido pela pesquisadora», 4
  são «redigida no projeto», e **59 têm `fonte` vazio** — e, destes, **25 têm descrição**. Sem origem
  declarada a descrição **não pode ser licenciada**, logo não entra na **edição paga** do dicionário.
  As duas saídas — declarar as 25 ou deixá-las fora — são dela. **CONFIRMADO** por contagem em
  02/11/2026.
- **Não há conteúdo de terceiros a acomodar** — o que a decisão da licença exigia saber. Os SVGs são
  da marca do projecto (`tools/templates/marca/`); a tipografia é `system-ui` + Georgia **sem ficheiro
  de fonte embutido** (`ciclo.css:76-77`); e a nomenclatura RAD/Vaganova são **nomes de posições**, que
  não são obra. O repositório é **privado**. **CONFIRMADO** em 02/11/2026.
- **O produto é um PACOTE PRÓPRIO**, com `.fipp` próprio, rota própria no Worker e a **licença do
  produto** — não a do ciclo. **DECIDIDO** 02/11/2026: é a única forma de o produto ter âncora, versão
  e licença independentes; a alternativa amarraria o dicionário ao ciclo daquela escola.
- **O plano contratado não existe em código, e já se sabe onde vai viver.** `raiz/escolas-habilitadas.json`
  tem `habilitada` e `pagante` (a trava do expurgo) e **não tem `plano`**. A **C11** decidiu a
  02/11/2026 a parte que faltava — **o sítio**: um **ficheiro declarativo do repositório, nunca o
  KV** («o conf faz o negócio acontecer e fica lá no repositório, e não há custo de KV»), e a norma
  do `PROTOCOLO.md` de 01/11/2026 confirma-o — o KV é do **cadastro dos Bastidores**, e estado
  comercial não é cadastro. **Nenhum ficheiro com o nome `ESCOLA.conf` existe**; o que existe, por
  escola e versionado, é `escola/<slug>/indice.json` → `estado` e os `vars` de
  `wrangler.<slug>.jsonc`, e é aí que a chave entra enquanto não houver ficheiro próprio. O resto
  da C11 — o lado público da porta, o pagamento, «desde/até quando» — continua aberto.
  **DECIDIDO** (o sítio) e **PENDENTE** (a chave e o resto).
- **A escada da C22 mudou de leitura: três produtos + um motor.** O gerador **não é o quarto
  produto** — é o **meio** pelo qual o Avançado recebe os três. Nota de correção datada na C22, sem
  reescrever a tabela (P-03/P-04). **DECIDIDO** 02/11/2026.
- **O ritmo é do CONTRATO, e por isso o catálogo não o transporta.** A mesma «Balé Nível 1» é
  2×/semana numa escola e 3× noutra: o ritmo não é do conteúdo, é da contratação. É o que fecha a
  **C19** pela negativa — a turma pronta vende-se **sem** ritmo, e o ritmo entra onde já entra hoje.
  **DECIDIDO** em 02/11/2026, e registado no `PLANEJAMENTO-LASTRO.md` (C19 e L14).
- **O corpo está no ciclo em cinco sítios, e só falta a ligação ao exercício.** Anamnese (15 campos,
  7 de flexibilidade e 8 de força) → PO `linha-de-base` (os mesmos 15, **pelo nome**, mais «o que
  traz / o que precisa desenvolver») → PO `restricoes` → PO `inclusao`/`exclusao` (critérios
  **sugeridos a partir da anamnese**) → plano **bloco 10** `aspecto-fisico` → «## Aspecto físico —
  força e flexibilidade». O que **não** existe é o verbete a declarar o que **o exercício** exige do
  corpo — e é **de conteúdo** (P-16), não de código. **CONFIRMADO** em 02/11/2026 por
  `provar-forca-e-flexibilidade` (17 asserções) e pela leitura dos cinco sítios.
- **O modelo tem TRÊS eixos, e a palavra «eixo» aparecer uma vez não diz o contrário.** É **prefixo
  por concatenação** (`doPlano.eixo` + `" — "` + bloco): o envelope real da `batata` traz
  `["Técnica — Barra", "Técnica — Centro", "Técnica — Musicalidade", "Técnica — Expressão"]`, e o
  eixo come os dois blocos que não são lugares na sala. **CONFIRMADO** no envelope, e é a correção de
  uma afirmação minha («o modelo tem um eixo») — datada no `REGISTRO.md`, não reescrita.
- **Um resíduo de expurgo travava o commit de quem mexe em `porta/`.** O ciclo
  `pe-torto/01/batata` foi criado pelo `criar-escola.sh` em 01/11/2026 e **nunca recebeu documentos**
  (`DOCS=""`); o `gerar-ciclo.sh` não o pode regenerar, e a cópia da porta ficava congelada. A cópia
  foi refrescada e a pendência de fundo está registada: **o remédio é o expurgo da escola.**
  **CONFIRMADO** por `check-identidade` 20/20 depois do refresco.
- **O `gerar-handoff.sh` tem de ser corrido com `bash`, não com `node`.** Com `node` ele morre num
  `SyntaxError` (é um script de shell); a `skill` e a documentação dizem `tools/gerar-handoff.sh`,
  que é o que funciona. **CONFIRMADO** em 02/11/2026 — e é a razão de a linha `variantes:` do
  resumo dele continuar a imprimir `0` (§8).

## 3. Arquitetura atual

- **Cloudflare Worker por escola.** Cada escola é uma variante independente, publicada no seu
  próprio Worker (`wrangler.<escola>.jsonc`). **CONFIRMADO** pela estrutura de deploys.
- **Armazenamento em KV, não em banco.** A decisão de usar o sistema de ficheiros em vez de um
  backend com banco está em `ARQUITETURA-GERAL.md`. **DECIDIDO**.
- **Três camadas:** `motor/nucleo/` (derivação e HTML, puro), `motor/servidor/` (rotas, KV,
  cifra, GitHub), `porta/` + `tools/templates/` (a folha e o desenho). **CONFIRMADO** pela
  árvore.
- **O conteúdo pedagógico é fonte versionada** em `professores/<professor>/ciclos/*.md` e
  `.conf`; o HTML, PDF e CSS do pacote são **saídas geradas** e não se editam à mão.
  **DECIDIDO** (`AGENTS.md`).
- **Âncora de proveniência encadeada:** `tools/hash-ciclo.sh` escreve
  `ciclo-XX-<escola>.fipp`, que é **versionado** — é a âncora, não saída. **CONFIRMADO**.
- **Segurança:** dados sensíveis cifrados no pacote publicado e fora do Git em Markdown
  (`motor/servidor/cifrar-envelope.js`); os Bastidores pedem senha. **CONFIRMADO** pelo 302 em
  `/bastidores`.
- **Cinco caminhos de escrita no `main`** que não passam por um worktree local — três Actions e
  dois a escrever pela API do GitHub a partir das páginas. **DECIDIDO** (regra do «remoto
  primeiro», 21/10/2026, `AGENTS.md`).

## 4. Inventário funcional

### Implementado e verificado

| Frente | Estado | Onde |
|:--|:--|:--|
| Navegação: coluna + barra + caminho | **CONFIRMADO** | `motor/nucleo/nav.js` |
| Listas no padrão novo | **CONFIRMADO** | `motor/nucleo/lista-html.js` |
| Aulas: leitura em prosa e Notação Benesh | **CONFIRMADO em produção** em 27/10/2026 — o nome abre a prosa, «Abrir notação» fica ao lado da Aula 01, e o Glossário está no cabeçalho persistente da Notação, em nova aba; as provas locais confirmaram a montagem e a remoção das listas independentes. **Correção de 02/11/2026:** a rota `/aulas/` citada aqui deixou de existir no reagrupamento de 24/10 — o que se publica hoje é `<variante>/aula-NN.html` dentro do pacote da turma. | `tools/gerar-aula-prosa.js`, `tools/montar-publicacao.js`, `motor/nucleo/nav.js` |
| Aula 01: Guia preenchido com os itens do PO, Notação com a estrutura da Aula e PDF individual | **CONFIRMADO no pacote e no ar** — a variante é hoje `pe-junto/01/batata-bale-nivel-1-teste-2` (`/bale-nivel-1-teste-2/aula-01`, HTTP 200). O caminho antigo (`perna-boa`) foi expurgado em 01–02/11/2026 | `professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2-aula-01.md`, `tools/gerar-aula-prosa.js`, `tools/gerar-ciclo.sh`, `tools/montar-publicacao.js` |
| **A aula regenera-se das fontes com um comando, e diz o que muda** | **CONFIRMADO** 02/11/2026 — `tools/regerar-derivados.js <professor> <ciclo> <variante>` reescreve a aula, o plano, a captura, a harmonização, as referências, a notação e o glossário a partir dos envelopes; **não grava sem `--escrever`** e **não toca no `-dados.json`** (que é estado, não derivação). Antes dele, pôr um ciclo em dia exigia repetir à mão o que o Worker faz | `tools/regerar-derivados.js` |
| **A geração é reprodutível** | **CONFIRMADO** 02/11/2026 — duas gerações seguidas do mesmo ciclo dão o mesmo md5 nos dois PDFs e o `git status` fica limpo | `tools/gerar-ciclo.sh`, `tools/templates/ciclo-cabecalho.tex` |
| **Música e vídeo de referência** e **Repertório da aula** são dois blocos no plano | **CONFIRMADO** 02/11/2026 — o bloco 10 chamava-se «música e repertório» e prometia os dois; o repertório passou a bloco próprio (11) e a Origem desceu para 12 | `porta/plano/conteudo/plano.json`, `motor/nucleo/derivar-plano-ciclo.js` |
| **O ponto de partida lê a anamnese** (força e flexibilidade, 15 campos) | **CONFIRMADO** 02/11/2026 — a caixa mostra os campos pelo **nome** e pelo **valor**, e o «abrir o registro completo» leva à anamnese da aluna noutra aba com o contexto do ato | `porta/po/conteudo/po.json`, `motor/nucleo/elicitar.js`, `porta/index.html` |
| As três listas da Área do Professor **com o contexto do ato dentro da listagem** | **CONFIRMADO** 25/10/2026 — painel com a caixinha do «Turma» e a seta, a regra dos três botões executada, o contexto guardado, o aviso da senha errada; 43 verificações no browser | `motor/servidor/listas-do-acervo.js` |
| As três listas do acervo pela ponte | **CONFIRMADO** | `motor/servidor/listas-do-acervo.js` |
| Anamnese: formulário, vínculo, ajuste | **CONFIRMADO** | `rotas.js` (11 rotas `/api/anamnese*`) |
| Plano de ensino: formulário e vínculo | **CONFIRMADO** | `rotas.js` (`/api/planos`, `/api/plano-*`) |
| PO: derivação e documento | **CONFIRMADO** | `motor/nucleo/derivar-po.js` |
| Lançamento da aula | **CONFIRMADO** | `motor/nucleo/lancamento.js` |
| Bastidores (Produção) com menu próprio | **CONFIRMADO** | `motor/servidor/{producao,bastidores}.js` |
| O alfabeto da notação na Produção — cinco passos, frase por exercício, trecho editável | **CONFIRMADO** 01/11/2026 na bancada local (115 asserções): o formulário percorre-se do passo 1 ao 5, um painel visível de cada vez, a tira fica fora do `<form>` e sai no modo do exercício, a frase escreve-se uma vez e entra em todos os trechos, e um trecho gravado abre em edição no passo 3 com os valores dele. **A conferência na página publicada fica para o deploy.** | `motor/servidor/bastidores.js`, `motor/servidor/verbete.js` |
| Criar escola / expurgar escola | **CONFIRMADO** | `provisionar-escola.js`, `expurgar-escola.js` |
| Índice de envelopes com resumo invalidável | **CONFIRMADO** | `motor/nucleo/porta.js` (`VERSAO_DO_RESUMO = 4`) |
| Âncora e cadeia de proveniência | **CONFIRMADO** | `tools/hash-ciclo.sh` |
| A §4 da aula como vista consolidada da musicalidade, por compasso | **CONFIRMADO** 02/11/2026 — uma linha por exercício (o mesmo em Barra, Centro e Expressão é uma só), com `Tempos` e a contagem *e* o que cai nela; `conferir` onde a grade do verbete não fecha. Medido no `.md` gerado e nas cinco asserções do `provar-o-que-vem-do-dado`. | `motor/nucleo/derivar-ciclo.js` (§4) |
| O exercício novo como passo 1 do verbete — seis passos, sem «+» nem botões próprios | **CONFIRMADO** 02/11/2026 — o passo 1 tem os quatro controlos e mais nada; «Seguir →» grava o termo no vocabulário do repositório e avança para o passo 2 com ele escolhido; avançar sem nome não grava nada; «Limpar» e «Editar» levam ao passo 2. **Zero KV.** | `motor/servidor/bastidores.js`, `motor/servidor/termo-repo.js` |
| A gravação do verbete confere a música | **CONFIRMADO** 02/11/2026 — as células têm de somar os tempos da música declarada; a recusa nomeia os passos 2 e 3, e o servidor recusa também (`validarVerbete` recebe a música). | `motor/servidor/verbete.js`, `motor/servidor/bastidores.js` |
| O aspecto físico — força e flexibilidade — no PLANO, lido das anamneses da turma | **CONFIRMADO** 02/11/2026 — bloco 10 do plano (`aspecto-fisico`, descritor `lidoDasAnamneses`, quinze campos em dois grupos); a porta consolida por aspecto e marca o ponto de atenção pela ordem das opções da anamnese. Sem leitura, a secção declara a lacuna. | `porta/plano/conteudo/plano.json`, `porta/index.html`, `motor/nucleo/derivar-plano-ciclo.js` |
| **O dicionário como produto** — o vocabulário do catálogo com a decomposição | **CONFIRMADO** 02/11/2026 na bancada (`provar-produtos`, 52 asserções): agrupado por categoria na ordem de aula, com definição, origem, tradição e alternativos; a decomposição em tabela com o **compasso por pista**; o verbete que não fecha em `[conferir]` **com o motivo**, sem publicar a contagem; as adições de escola **excluídas por omissão**. Gerado por `node motor/produtos.js dicionario`. | `motor/nucleo/produtos/dicionario.js`, `motor/servidor/produtos.js`, `motor/produtos.js` |
| **O syllabus como produto** — a sequência por nível, com a camada pedagógica | **CONFIRMADO** 02/11/2026 na bancada (73 asserções, com o dicionário): um documento por nível na **ordem declarada** em `progressao.json`, mais um índice com as contagens; `exige` · `ensina` · `expressa` **herdados do termo ou sobrepostos pela relação**, com a origem escrita ao lado (`(herdado do termo)` / `(declarado no nível)`); `[Preencher]` só quando **nenhum dos dois** declara; o nível sem unidades diz que é a lacuna; `--nivel` gera um só, e um nível inexistente é **recusado**. Gerado por `node motor/produtos.js syllabus`. | `motor/nucleo/produtos/syllabus.js`, `motor/servidor/produtos.js`, `motor/produtos.js` |
| **A licença é lida e a condição de conteúdo é executável** | **CONFIRMADO** 02/11/2026 na bancada: o nome da licença vem do **título** de `biblioteca/LICENSE.md` (o manifesto cita o caminho, e a lacuna `sem-licenca` desapareceu); e `--edicao paga` deixa de fora a definição **sem `fonte`**, di-lo no sítio dela, mantém o termo, e conta — **25** no catálogo de hoje, o mesmo número que a §10.4 mediu à mão. | `motor/produtos.js` (`licencaDoDisco`), `motor/nucleo/produtos/dicionario.js` |
| **A composição catálogo × escola** — uma função só | **CONFIRMADO** 02/11/2026: `compor` dá precedência à escola e marca `origem`, mantendo a posição do catálogo na ordem. É a peça de código da fase 1 — **mas os ficheiros continuam um só** (ver §2 e §7). | `motor/nucleo/produtos/comum.js` |
| **A turma tem três estados, e a edição pergunta antes** | **CONFIRMADO** 03/11/2026 (`provar-conteudos-e-estado-da-turma`, §B e §C): `livre` · `curada` · `vinculada`. A curada recusa a mudança de **nome** (a curadoria guarda o nome, e renomear partia a ligação em silêncio) e aceita o resto; a vinculada recusa tudo. A tela mostra o selo e desactiva o «Excluir»; a rota é quem decide. | `motor/nucleo/estado-da-turma.js`, `motor/servidor/bastidores.js` |
| **Os conteúdos são da curadoria — e o mapa antigo continua a ler-se** | **CONFIRMADO** 03/11/2026 (§A, §D, §F): `conteudosDaTurma` e `mapaDeConteudos` compõem `turma-conteudos` com o `repertorio` de cada curadoria, colapsados pelo mesmo `idDe`; a curadoria **substituída** não entra. O passo 3 da turma ficou sem o bloco, e o cartão continua a mostrar a lista. | `motor/nucleo/conteudos.js`, `motor/servidor/bastidores.js` |
| **O formulário da curadoria só oferece o que o professor pode ensinar** | **CONFIRMADO** 03/11/2026 (§G): as modalidades vêm do `perfil.json` do professor; a tradição segue a modalidade (lista própria a vencer a compartilhada, e queda para a compartilhada quando não há própria). **Nenhuma modalidade tem `tradicoes.json` próprio** — o conteúdo é dela (P-16). | `motor/nucleo/tradicoes.js`, `motor/servidor/bastidores.js` |

### Parcial

- **A aula 2..N.** Existem 26 lugares no calendário e 3 marcos; há 1 plano e 1 folha. Sem
  `captura-aula-02.json`, o formulário cai no `captura-01.json`. **CONFIRMADO** em
  `PLANO-AULA-E-OBSERVACAO.md` §5.
- **A sala da aula.** Não existe como campo. A decisão de arquitetura diz que a sala é do
  **evento**, não da aula (`PLANO-TABELA-DE-ATIVIDADES.md` §3.1/§3.3). **DECIDIDO**, não
  implementado. A pesquisadora acrescentou (25/10/2026): «não é opcional, mas é flexível» — a sala
  pode ser remarcada até ao prazo daquela aula. **DECIDIDO**.
- **Separação semântica plano × PO × aula.** Medida em `PLANO-AULA-E-OBSERVACAO.md` §2: **cinco**
  sobreposições reais (§2.2 a §2.6). **CONFIRMADO**, não corrigido. A sexta que a primeira redação
  listava — os 8 dos 12 itens do Contexto repetidos no PO — **não é defeito**: é repetição de
  **saída**, proposital e só de leitura. **DECIDIDO** em 25/10/2026.
- **A aula 2..N como objeto.** A pesquisadora decidiu que a aula nasce por um botão e que os
  documentos nascem **mesmo vazios**, «pra gente ter o objeto». **DECIDIDO**, não implementado.

### Planejado, não implementado

- **O motor dos produtos — a aula pronta (fase 2 do `PLANO-PRODUTOS-DO-MOTOR`).** O dicionário e o
  syllabus existem; a aula pronta — a sessão montada pelo teto da **Regra 9** e pelos tempos de
  cada unidade — **não foi começada**. Depende dos verbetes (hoje zero) e do conteúdo dos níveis.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo. **CONFIRMADO** como não
  implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — o Estúdio de Dança como ambiente da direção. **CONFIRMADO**
  como não implementado (a Produção existe; o Estúdio, não).
- **`ARQUITETURA-PE.md`** — integração com o repositório «dança e elicitação». **CONFIRMADO**
  sem código.
- **`ARQUITETURA-AULA.md`** — o estado derivado está feito; o ajuste no plano, não.

### Inexistente

- **Avaliação** de aluno. **DECIDIDO** que está fora.
- **Integração** com o projeto das secretarias. **CONFIRMADO**.
- **O FIPP.** **CONFIRMADO**.

## 5. Arquivos relevantes

### Fontes de verdade

| Caminho | Finalidade |
|:--|:--|
| `AGENTS.md` | identidade do projeto e regras operacionais (o «remoto primeiro») |
| `REGRAS.md` | as 17 regras pedagógicas e de versionamento |
| `PROTOCOLO.md` | as 22 pétreas |
| `CONGELAMENTO.md` | o que só muda com motivo declarado |
| `REGISTRO.md` | a crónica datada das decisões |
| `HANDOFF.md` | o estado extraído (gerado — nunca editar à mão) |
| `ESTADO-ATUAL.md` | **este documento** — o juízo sobre o estado, com etiquetas |
| `FRENTES.md` | o panorama dos três trilhos |
| `PLANEJAMENTO-LASTRO.md` | o mapa de evolução do produto |
| `IDENTIDADE-VISUAL.md` | o catálogo das peças que podem aparecer no ecrã |

### Documentos de análise e de plano

`PLANO-AULA-E-OBSERVACAO.md` · `PLANO-TABELA-DE-ATIVIDADES.md` · `PLANO-NAVEGACAO.md` ·
`PLANO-INDICES.md` · `PLANO-CICLO-DA-TURMA.md` · `PLANO-PERGUNTAS-DA-PROVENIENCIA.md` ·
`DIAGNOSTICO-IDENTIDADE.md` · `IMPLEMENTACAO-IDENTIDADE.md` · `ARQUITETURA-*.md` · `IDEIA-*.md`

### Código

| Caminho | Finalidade |
|:--|:--|
| `motor/nucleo/` | derivação e HTML, sem I/O de servidor |
| `motor/servidor/` | rotas, KV, cifra, GitHub, montagem |
| `motor/servidor/rotas.js` | as **33** rotas do Worker |
| `motor/servidor/verbete.js` | o alfabeto da notação no **repositório** (CRUD, com proveniência) |
| `motor/servidor/termo-repo.js` | o vocabulário técnico no **repositório** — a única lista de termos |
| `motor/nucleo/produtos/` | os **produtos** (dicionário, syllabus): puros, determinísticos, sem `fs`/`path`/`http` |
| `motor/servidor/produtos.js` | a ponte do produto: os rótulos do catálogo e a leitura do repositório |
| `motor/produtos.js` | o **CLI** dos produtos — escreve em `publicacao/produtos/<modalidade>/` (gerado); `--edicao paga` é a condição de conteúdo da licença |
| `LICENSE.md` (raiz) | **a máquina** — proprietária, e **não** licenciada com os produtos (§10.1) |
| `biblioteca/LICENSE.md` | **o catálogo** — as seis cláusulas, a concessão da escola (§10.3) e a condição do `fonte` (§10.4) |
| `motor/nucleo/schemas.js` | **o único leitor** de `modelo/ciclos/` (o shell chega lá pelo `tools/gerar-schemas.js`) |
| `motor/nucleo/derivar-ciclo.js` | a fonte da aula: as oito secções, e a origem de cada uma |
| `motor/nucleo/notacao.js` | o compositor: verbete + música → a grade de contagens |
| `porta/`, `tools/templates/` | a folha e o desenho (peças do catálogo) |
| `experimentos/provar-*.js` | **91** provas versionadas (104 no disco) |
| `tools/regerar-derivados.js` | põe as fontes derivadas de um ciclo em dia a partir dos envelopes |
| `tools/` | infraestrutura — **congelado** |

## 6. Decisões vigentes

Só o que **não se pode ignorar**. O motivo completo de cada uma está no `REGISTRO.md`.

1. **O módulo de listagem é um só, com ordem fixa: de quem · quem fez · quando.** Muda o rótulo,
   nunca o lugar. Caixinha só onde há painel; onde não há, linha de factos. **DECIDIDO**
   24/10/2026.
2. **A Aula é a entrada comum às duas leituras.** O nome abre a versão em prosa; havendo Notação
   correspondente, «Abrir notação» fica ao lado; o Glossário abre pela Notação em nova aba. As
   listas independentes de Notação e Consulta deixam de ser geradas. **DECIDIDO** 27/10/2026.
3. **«Aulas» vive só dentro da Área do Professor.** Não há destino direto no topo.
   **DECIDIDO**.
4. **A coluna do sistema desenha-se em todas as páginas**, e o duplo com as páginas que têm
   menu próprio resolve-se em CSS (`body:has(.lateral)`), acima dos 1141px. **DECIDIDO**.
5. **A curadoria é a autorização.** Uma aluna só entra na anamnese de um professor se a curadoria
   o vinculou àquela turma. Não é regra de visibilidade — é a fonte do vínculo. **DECIDIDO**
   23/10/2026.
6. **A turma de um PO vem do plano de ensino que ele referencia**, não do PO. **DECIDIDO**
   25/10/2026.
7. **O resumo do índice invalida-se pela FORMA, não pela versão** — `gravarIndice` carimba sempre
   a versão de hoje, portanto o que denuncia um resumo velho é o conjunto de campos.
   **DECIDIDO** 25/10/2026.
8. **A sala não é da aula, é do evento.** **DECIDIDO**, não implementado.
9. **Saídas geradas ficam fora do Git** (P-04); os pacotes de ciclo são a exceção, porque o
   deploy automático lê o repositório. **DECIDIDO**.
10. **Qualquer coisa que apareça no ecrã nasce do catálogo de peças** de `IDENTIDADE-VISUAL.md`;
    a checagem 8 (`node tools/check-identidade.js`) reprova o que escapar. **DECIDIDO**.
11. **A ação que grava um formulário vai dentro da fileira `.par-botoes`, e é `.acao`**
    (`grande` quando é a principal). Um `.acao` solto depois do `<div class="res">` encosta no
    campo, porque o vão da folha é uma conta de vizinhança. **DECIDIDO** 26/10/2026.
12. **A Notação reproduz a estrutura da Aula em prosa e acrescenta os sinais Benesh.** O Guia de
    observação usa os itens do PO e explica o registro na Captura; o título do ciclo abre o Plano e
    a lista de Aulas oferece o PDF individual. **DECIDIDO** 27/10/2026.
13. **A DIREÇÃO DE UM VERBETE NÃO SE PERGUNTA: É A CHAVE DA CÉLULA.** Nas seis entradas do
    alfabeto, o campo `direcoes` era exactamente a lista das chaves de `celulas`; ele saiu do dado
    (alfabeto **versão 3**) e a direção passa a ser derivada. Uma direção existe num verbete se — e
    só se — esse verbete tem células para ela. É o dado a dizer o que o exercício é, e não o sistema
    a proibir. **DECIDIDO** 28/10/2026.
14. **O formulário do verbete tem dois modos que não coexistem** — ou se escolhe um exercício que
    existe, ou se cria um. No modo do exercício, os campos do verbete **não estão** no documento e o
    `select` e o «+» ficam bloqueados. **DECIDIDO** 28/10/2026.
15. **A NOTAÇÃO DE UM TRECHO COMPÕE-SE, E A CONTAGEM ESCOLHE-SE.** A célula declara `categoria` e
    `sinais`; a notação (`[Pé: 1ª → +]`) é **derivada**. A palavra «bloco» volta a significar só
    Solo · Barra · Centro, que é o que ela quer dizer no plano. A contagem é uma lista das que cabem
    no compasso — ela vai de 1 até o numerador e recomeça no seguinte, e o número do compasso é
    calculado. **DECIDIDO** 28/10/2026.
16. **A frase «o que acontece» vem de um dicionário, e é sugestão — não fonte.** O dicionário
    (`biblioteca/modalidades/<m>/descricoes.json`) é indexado pela **notação**, e o que fica gravado é
    a frase da célula: o dicionário pode melhorar sem reescrever o passado (P-03/P-04). **DECIDIDO**
    28/10/2026.
17. **O vocabulário técnico vive no REPOSITÓRIO, numa lista só** — `biblioteca/modalidades/<m>/vocabulario.json`.
    A tela lê o bundle que o deploy traz; o cadastro grava no repositório, pela API do GitHub. **Não
    há cópia por escola no KV**, e o botão «Carregar as turmas iniciais» já não semeia termos. A razão
    é dupla: o gerador lê o ficheiro do **disco**, no GitHub Actions (uma escrita em KV nunca chegaria
    ao documento), e duas listas divergem ao primeiro termo novo, em silêncio. **DECIDIDO** 28/10/2026.
18. **O KV é o último recurso, porque tem custo.** Só guarda o que é da ESCOLA (turmas, professores,
    alunas, a relação turma↔conteúdo, envelopes). Catálogo, alfabeto e vocabulário vão para o
    repositório. **DECIDIDO** 28/10/2026.
19. **A CÉLULA TEM DOIS EIXOS: DIREÇÃO DO MEMBRO E ORIENTAÇÃO DO CORPO.** A direção diz para onde o
    membro vai (à frente, ao lado, atrás — três) e dá a chave do trecho; a orientação diz como o corpo
    está voltado (en face, croisé, effacé, écarté, épaulement — cinco) e é um **campo opcional** da
    célula. «À frente en croisé» é **um** trecho, não dois. Omitir a orientação quer dizer `en face`, e
    é omitindo que se grava: escrevê-la em todas as células seria ruído. Até a versão 4 os dois eixos
    estavam numa lista só, e era por isso que a tabela mostrava oito blocos onde há três mais cinco.
    **DECIDIDO** 28/10/2026 (alfabeto **versão 5**).
20. **TUDO O QUE O PROFESSOR ESCOLHE NO TRECHO ESCOLHE-SE POR CLIQUE, NUNCA POR LISTA SUSPENSA.** Uma
    escolha única não escreve uma sequência: com o `<select>` dos sinais, escolher o segundo apagava o
    primeiro. Cada clique **acrescenta ao fim**, porque um bloco pode repetir um sinal
    (`[Pé: 1ª → + ● 1ª]`), e a remoção é só pelos «×» das fichas — numeradas, porque a ordem é o que a
    notação diz. A direção e a orientação **ficam** depois de acrescentar um trecho: é o que permite
    emendar o en croix sem reescolher tudo. **DECIDIDO** 28/10/2026.
21. **ESCOLHA ÚNICA E ESCOLHA MÚLTIPLA TÊM CAIXAS DIFERENTES: `radio` e `checkbox`.** A direção, a
    orientação e a contagem são **uma** escolha; os sinais são **lista**. Com `checkbox` na direção, o
    navegador marcava a nova e deixava a anterior, e a tela passava a dizer «à frente» enquanto o
    estado dizia «atrás» — foi o que a pesquisadora viu como «fiz à frente e apareceu atrás».
    **DECIDIDO** 29/10/2026.
22. **«EN FACE» É A OMSIÃO, E A OMSIÃO MOSTRA-SE.** O campo `orientacao` só existe quando não é
    `en face`; mas a pílula de `en face` aparece **marcada** quando nenhuma outra está. Uma omissão
    que não se vê é indistinguível de um campo que não funciona — e foi assim que ela o leu.
    **DECIDIDO** 29/10/2026.
23. **A CONTAGEM CONTINUA ONDE O COMPASSO ESTÁ, E O COMPASSO É CORRIDO.** O início da contagem de um
    trecho soma, na ordem da gramática, tudo o que vem antes — as direções anteriores inteiras e as
    células que a sua própria direção já tem, porque a nova entra no fim dela. A coluna do compasso
    sai da **mesma** soma. Duas contas diferentes para a mesma coisa põem dois trechos no mesmo
    tempo, e a página da aula passa a dizer duas coisas para o mesmo instante. **DECIDIDO** 29/10/2026.
24. **O FORMULÁRIO DO VERBETE ESCREVE-SE EM PASSOS, E UM TRECHO GRAVADO PODE SER CORRIGIDO.** Ela
    comparou as duas arrumações e escolheu os passos («o Step, apesar de ter mais cliques, ele é mais
    fácil de entender»). **DECIDIDO** 31/10/2026 em sete; **DECIDIDO** 01/11/2026 em **cinco** — o
    exercício, a frase e a posição são um passo só, porque são as três coisas que se decidem antes de
    haver trecho. Os cinco: **1 O exercício · 2 A música · 3 Para onde · 4 Os sinais · 5 A
    decomposição**. A tira vive **fora do `<form>`**, na coluna do formulário, como a faixa da turma,
    e sai do ecrã no modo do exercício. A tira em cima diz o que já está decidido e é a navegação; o passo
    1 fica **fora** do bloco do verbo, porque o modo do exercício o bloqueia em vez de o esconder.
    Corrigir um trecho é um **estado** (`EM_EDICAO`), não um botão: acende o «!» nos dois passos do
    trecho (5 e 6), leva ao 5, muda o rótulo do 7 para «Guardar a alteração», e a linha em edição
    **perde o «×»**. A peça reusa-se da faixa da turma (`.passos`/`.passo`/`.passo-alerta`); nenhuma
    classe nova. **DECIDIDO** 31/10/2026.
25. **«O QUE ACONTECE» É DO EXERCÍCIO, NÃO DO TRECHO — E ESCREVE-SE UMA VEZ.** A frase descreve o
    exercício; o que muda de trecho para trecho é o **«lê-se»**, que é derivado da notação. Escrevê-la
    por trecho era a redundância que sobrou depois de a quarta coluna sair da tabela («toda vez que eu
    vou acrescentar um trecho, eu preciso digitar novamente o que acontece»). O campo é **um**, no
    passo 2; o que fica **gravado** em cada célula é a frase seguida do «lê-se». A ordem de preferência
    do campo é do projeto, não do momento: **o que está gravado vence o dicionário** (P-03/P-04), e
    trocar a música do mesmo exercício não reescreve a frase. **DECIDIDO** 31/10/2026.
26. **O QUE ESTÁ ESCRITO NÃO SE REESCREVE — E A TELA DI-LO.** Ao abrir um verbete antigo, a frase que
    volta é a que está nas células; se um trecho guarda uma frase diferente da que está no passo 2, a
    prévia marca-o («guardado com a frase com que foi escrito») em vez de o reescrever em silêncio.
    **DECIDIDO** 31/10/2026.
27. **A LISTAGEM DIZ O QUE O VERBETE É, E AS ETIQUETAS SÃO DERIVADAS.** A posição em selo, e por baixo
    as direções, o compasso, em quantas músicas está escrito e quantos trechos tem — tudo lido do
    alfabeto, sem um segundo dado a manter. A chave crua da música («4|4/4») deixa de se mostrar.
    **DECIDIDO** 31/10/2026.
28. **OS TEMPOS E O COMPASSO DO PLANO VÊM DO VERBETE.** Juntos são a **chave do verbete**
    (`<tempos>|<compasso>`); o plano contribui exactamente com esses dois campos para a notação, e
    perguntá-los outra vez é pedir ao professor o que o sistema já sabe. Com **uma** música declarada,
    os dois vêm preenchidos e **travados** (como o Bloco e o Objetivo), e é esse par que fica gravado;
    com **várias**, são escolha, e **só as músicas declaradas se oferecem** — «8 tempos» não convive
    com «6/8»; **sem verbete**, ficam à mão (Arabesque e Jeté hoje), porque não há o que derivar e
    derivar seria inventar. A fonte é o **alfabeto**, lido do `notacao.json` que já viaja no Worker —
    **zero KV** —, não uma lista paralela na tela; e a tela diz de onde vêm e que **é o verbete que se
    altera**. **DECIDIDO** 31/10/2026. **As outras três colunas** (`Posição`, `Direção`,
    `Orientação`/`Lado`) ficam **PENDENTES**: hoje o motor lê-as do verbete, não do plano, e mexer
    nelas muda o que o documento publica.

29. **O NÚMERO QUE SE LÊ É O DO ROTEIRO — UM SÓ, NOS TRÊS DOCUMENTOS.** O título, o roteiro e a barra
    contavam coisas diferentes: o roteiro contava os **degraus** (os nós que se perguntam), o título
    contava o **índice do mapa** — com os nós de cabeçalho dentro —, e a barra contava o **mapa
    inteiro**. No plano, 18 dos 19 degraus tinham dois números (Δ −7); no PO, os 30. A anamnese
    estava certa, e foi por isso que o defeito passou: é o documento onde ele não aparece. Uma
    função (`numerosDoMapa`) conta os degraus, e os três leem dela. **O que não tem degrau continua a
    barrar o fecho** — a turma é obrigatória e não se caminha até ela —, e passa a ser **nomeado**:
    «Do contexto, na barra». **DECIDIDO** 01/11/2026.
30. **A «SEQUÊNCIA DE EXERCÍCIOS POR BLOCO» É DEMONSTRATIVO, NÃO UM SEGUNDO LUGAR DE DECISÃO.** O
    bloco vem de «Blocos de cada objetivo», o objetivo dos marcos, o conteúdo do nível da matriz do
    «Parâmetro de medição», e os tempos e o compasso do **verbete**. As duas primeiras colunas entram
    em `somenteLeitura`; ficam livres o **conteúdo** de um exercício sem parâmetro marcado e o
    «Adicionar linha» — sem os dois, um plano cuja turma não tem conteúdo associado não podia ser
    composto. **Ela não sai do formulário**: é dela que a página da aula lê a sequência
    (`sequenciaComoObjetos`). **DECIDIDO** 01/11/2026.
31. **O QUE A SEQUÊNCIA JÁ RESPONDE NÃO SE ESCREVE OUTRA VEZ.** O bloco 10 do plano deixou de
    perguntar a música: ela **sobe da sequência**, exercício por exercício, do **verbete** de cada um,
    e é mostrada acima do campo. O campo do nó 24 passou a ser o **link do vídeo** («Vídeo de
    referência»), que é a única parte que não existia em lugar nenhum. O **«Repertório desta aula»**
    passou a **`somenteLeitura`**: o valor é a sequência, semeada pela tela, e a chave `repertorio` do
    envelope continua a mesma — o que muda é **quem a preenche**, e é isso que faz a conta do
    `usosDosPlanos` ler uma lista exacta em vez de prosa. A regra geral: **um facto decide-se num
    lugar só; onde ele aparece, é lido.** **DECIDIDO** 01/11/2026.
32. **A SEQUÊNCIA SEMEIA-SE SOZINHA, E A AUTORIA MANDA.** A `aula-1-sequencia` era gravada **só
    quando o nó era aberto**: quem preenchesse a matriz e gerasse o documento sem passar por lá
    perdia a sequência inteira, e a página da aula saía sem exercício nenhum. Agora, a cada pintura
    do roteiro, o que a **própria grelha desenha** (`grelhaDaTabela` + `lerGrelha` — a mesma conta,
    uma vez, para a tela e para o dado) é colhido. `SEMENTE_ANTERIOR` guarda o valor **exacto** que se
    semeou: enquanto for esse, a semente refaz-se (mudar a marcação muda a sequência); assim que for
    outro, é do **professor** (ou de um plano antigo) e **não se toca**. A semente **não herda de si
    mesma** — sem isso, um exercício desmarcado deixava as linhas dele para trás. A grelha **com
    unidade** (a distribuição de volume, que grava `{unidade, linhas}`) fica de fora. **DECIDIDO**
    01/11/2026.
33. **O `;` SEPARA OS ITENS DO PO, E SÓ LÁ.** `itensDaDimensao()` corta por `;`, `\n` ou o array já
    pronto. O `emLista` geral **não** se alarga: o `;` é pontuação legítima noutros campos (o
    repertório, a proveniência), e alargar o corte em todo o lado partiria frases que são uma só. A
    separação é **pergunta do campo**. **DECIDIDO** 01/11/2026.
34. **A AULA N NASCE QUANDO O PROFESSOR A ELABORA — O PLANO NÃO DECLARA AS 26.** O plano declara
    **objetivos específicos** (poucos) e **em que aula** cada um cai (`aula-de-cada-objetivo`); os
    lugares do calendário que ainda não têm objetivo aparecem na lista como «Lugar do calendário —
    sem marco». **Isso não é lacuna a preencher: é o método.** O professor cria a aula 1, dá-a,
    lança-a — e é com o **registo dela** (o caderno) à frente que ele elabora a aula 2, mesmo que
    decida que ela é uma cópia da 1. A razão é a do domínio, não a do software: *«a situação do
    aluno, a capacidade do aluno, o desempenho dele, no que é observado na aula 1, vai se
    transformar na aula 2, na aula 3»*. **Consequência para o P1:** a ligação bloco ↔ dimensão é **por aula, no
    momento em que aquela aula nasce** — nunca uma derivação para as 26. **DECIDIDO** 01/11/2026 —
    e isto **responde** à pergunta que estava aberta desde 25/10/2026 («o que fazer com as 23 aulas
    que não têm marco»): **nada. Elas nascem à medida.**
35. **O FORMULÁRIO DA COLETA É A EXPRESSÃO DA JANELA, POR TODAS AS BANDAS.** O PO declara 4
    dimensões e **8 critérios**; a aula e a folha desenhavam **4** — os dois critérios de cada
    dimensão colados num rótulo só. Quem olha pela janela tem de poder marcar **cada critério**: o
    par não é observável. A fonte é **uma só** (`dimensoesEItens`) para a aula, a folha impressa e o
    config que o formulário lê — **um conserto que fica no código e não chega aos artefatos gravados
    não conserta nada**. **DECIDIDO** 01/11/2026.
36. **A FONTE DE UM DOCUMENTO TEM DE SER O QUE O CÓDIGO GERA.** A §5 da aula era a única parte
    escrita à mão (16 de 18 linhas divergentes), e nada o dizia: a próxima geração apagava-a em
    silêncio. A prova deixou de medir o texto e passou a medir a **propriedade** — mesma entrada,
    mesma saída, byte a byte. **DECIDIDO** 01/11/2026.
37. **NENHUMA SECÇÃO DO DOCUMENTO AFIRMA O QUE NINGUÉM ESCREVEU.** A origem de cada secção da aula
    mede-se por **mutação** — troca-se uma resposta do envelope e vê-se se a secção muda. Se não
    mudar, o texto é do código, e o documento está a afirmar sobre a aula de alguém o que ninguém
    decidiu. Foi assim que se apanharam quatro: um título sobre a sala a anunciar «força e
    flexibilidade», um «Pulso» fixo, um «Ciclo simulado» num ciclo publicado e um `[Preencher]` sem
    dizer o que se esperava. **DECIDIDO** 02/11/2026.
38. **A MUSICALIDADE NÃO SE PERGUNTA: ELA JÁ FOI DECIDIDA, NO VERBETE E NA SEQUÊNCIA.** O professor
    declara a grade de contagens no **verbete** (por música) e os tempos e o compasso no **plano**. O
    pulso é a contagem, o acento é o tempo do compasso em que ela cai, a frase é o exercício inteiro
    sobre a música. O que o documento faz é **consolidar** — nunca pedir outra vez, nunca declarar em
    falta. **DECIDIDO** 02/11/2026, e é a terceira vez que ele foi dito.
39. **A PROVENIÊNCIA É UM LUGAR AONDE SE VAI.** Um `id` de envelope (`po-20261101-1959`) não leva a
    lado nenhum: o que serve é o **link** para o documento, com o **objetivo** dele ao lado. E o
    gerador não se explica a quem abriu a aula. **DECIDIDO** 02/11/2026.
40. **O «PRÓXIMO PASSO» DIZ O ESTADO, NÃO EXPLICA O CONCEITO.** Uma linha, «Marco da Aula 02», e três
    casos: sem marco seguinte, diz que o plano declarou um só e aguarda; com marco e sem Aula 02, diz
    isso mesmo; com marco e com Aula 02, o título e o marco viram link para ela. **DECIDIDO**
    02/11/2026.
41. **A FORÇA E A FLEXIBILIDADE VÊM DA ANAMNESE, E OS CAMPOS SÃO ESCOLHA DELA.** O nó
    `linha-de-base` do PO declara os campos de que se alimenta (15, em dois grupos), os **nomes**
    vêm do mapa da anamnese — nunca de uma segunda lista —, e o registo completo abre noutra aba
    com o contexto do ato. A anamnese **informa**; «o que traz» e «o que precisa desenvolver»
    continuam a escrever-se, porque a formulação é da professora. **DECIDIDO** 02/11/2026.
42. **GERAR NÃO PODE SUJAR A ÁRVORE.** Um ficheiro versionado que muda por ter sido gerado não é
    derivado: é carimbado. O `gerado_em` vem do `SOURCE_DATE_EPOCH` (a data do último commit nas
    fontes) e o `/ID` do trailer do PDF é fixo — duas gerações seguidas dão o mesmo md5. O relógio
    continua a servir para o `estado` do `aulas[]`, que é juízo do instante, e só para ele.
    **DECIDIDO** 02/11/2026.
43. **O MOLDE DOS SCHEMAS TEM UM LEITOR SÓ, E A COMPARAÇÃO É DE CONTEÚDO.** `motor/nucleo/schemas.js`
    é o único que lê `modelo/ciclos/`; o shell chega lá pelo `tools/gerar-schemas.js`. Uma cópia sem
    comparação é uma segunda verdade — foi assim que o molde ficou cinco professores atrás.
    **DECIDIDO** 02/11/2026.
44. **A VISTA DA MUSICALIDADE CONSOLIDA POR COMPASSO, E UM EXERCÍCIO APARECE UMA VEZ.** A vista do
    exercício mostra os nove; a da musicalidade mostra os três que existem, agrupados pelo compasso
    (a forma que ela descreveu: «4 por 4, 3 por 4, 2 por 2 (…) de 1 até 3, de 1 até 4»). Repetir o
    mesmo fondu em Barra, Centro e Expressão é redundância: ela é do exercício, não do bloco. A célula
    é a **contagem e o que cai nela** — cortar pela contagem só deitava fora o que a tabela anterior
    mostrava. **DECIDIDO** 02/11/2026.
45. **REPETIR UM NÚMERO SEM A TABELA DELE CONFUNDE.** «30% do volume — 27 tempos (Regra 9, etapa 2)»
    na §4 repetia, sem a grelha, o que a §3 publica inteira. Saiu. O título da §3 passou a ser o do
    conteúdo — **«Distribuição do tempo pelos blocos»** —, e o subtítulo que dizia o mesmo duas vezes
    saiu. **DECIDIDO** 02/11/2026.
46. **UMA GRADE DE VERBETE QUE NÃO FECHA NOS TEMPOS DIZ `conferir`, E NÃO SE CORRIGE SOZINHA.** O que
    se corrige é o verbete, e a decisão é da professora; o documento mostra e não escolhe. Medido
    nesta aula: fondu soma 6 tempos numa música de 2; plié soma 12 onde a música tem 8. **DECIDIDO**
    02/11/2026.
47. **O ASPECTO FÍSICO FICA NO PLANO, ANTES DA MÚSICA E DO REPERTÓRIO.** É o primeiro dos três eixos
    (o corpo, a técnica, a poiésis) e é da família das condições do espaço: o que a aula precisa para
    acontecer. É **da turma, nunca da aluna** — o que elas mostram juntas —, e a régua é a ordem das
    opções da própria anamnese (a primeira é o melhor estado), sem segunda lista à mão. Resolve a
    **C20** do `PLANEJAMENTO-LASTRO.md` pela alternativa **(b)**; sobra só a redação da Regra 4, que é
    texto congelado. **DECIDIDO** 02/11/2026.
48. **UM CICLO CRIADO E NUNCA PREENCHIDO ENVELHECE EM SILÊNCIO E TRAVA O COMMIT DOS OUTROS.** O
    `pe-torto/01/batata` nasceu do `criar-escola.sh` com `DOCS=""`, o `gerar-ciclo.sh` não o regenera,
    e a cópia da porta ficou congelada no dia em que nasceu — quem mexesse em `porta/` reprovava no
    Circuito. A cópia foi refrescada (não apagada: apagar um ciclo é decisão da pesquisadora), e o
    remédio de fundo é o **expurgo da escola**. **DECIDIDO** 02/11/2026.
49. **O EXERCÍCIO NOVO É O PASSO 1 — E NÃO UM «+» NEM UM MODO.** Duas correções no mesmo dia. A
    primeira tirou o «modo» que substituía a página inteira; a segunda tirou o «+» e os dois botões
    que restavam, porque a pesquisadora queria **um passo a mais**, e um passo não tem vida própria:
    avança-se com a navegação que todos têm. São **seis**: o exercício novo, o exercício, a música, o
    para onde, os sinais, a decomposição. Quem grava o termo é o **«Seguir →»**; avançar sem nome não
    grava nada. **DECIDIDO** 02/11/2026.
50. **O QUE JÁ VAI PARA O REPOSITÓRIO NÃO PRECISA DE KV — E NÃO GASTA NENHUM.** O termo novo é
    escrito no vocabulário da modalidade (Contents API) e a lista de exercícios é lida do **mesmo
    ficheiro**. A tela acrescenta-o localmente enquanto não há outra leitura: o pedido menor é
    nenhum. **DECIDIDO** 02/11/2026.
51. **A GRAVAÇÃO CONFERE A MÚSICA, E APONTA ONDE SE CORRIGE.** `cobre` contra a soma das células é
    uma conta do formulário consigo mesmo; a música é a chave do verbete e tem de fechar com as
    células. A recusa nomeia os dois sítios — a música (passo 3) e os trechos (passo 4) — e o
    número dos passos vem da lista que desenha a tira, por isso a renumeração de 02/11/2026 levou a
    mensagem consigo. A regra vive nos dois lados: a tela recusa
    antes de enviar e o servidor garante que uma página em cache não a contorna. **DECIDIDO**
    02/11/2026.
52. **A REGRA 15 FOI SUBSTITUÍDA PELO QUE O CÓDIGO FAZ, E O `REGRAS.md` DIZ ISSO.** «Bloco próprio +
    arquivo paralelo do ciclo» foi escrito antes de o verbete existir; **nenhum arquivo paralelo
    existe**, e a musicalidade não é um bloco. O que a substitui — verbete com a grade, sequência
    com tempos e compasso, §4 consolidada — é **dado**, num sítio só. A regra **não é apagada nem
    renumerada**: ganha uma nota de substituição, com motivo declarado, e o commit da nota é só
    dela (`CONGELAMENTO.md`). **DECIDIDO** 02/11/2026.
53. **O MODELO TEM TRÊS EIXOS, E A PALAVRA «eixo» APARECER UMA VEZ NÃO DIZ O CONTRÁRIO.** O rótulo da
    dimensão do PO é **prefixo por concatenação** — `doPlano.eixo` + `" — "` + o bloco —, e o
    envelope real da `batata` mostra `["Técnica — Barra", "Técnica — Centro", "Técnica —
    Musicalidade", "Técnica — Expressão"]`. O eixo **come** os dois blocos que não são lugares na
    sala, e o conteúdo deles é **poiésis** com o rótulo da técnica por cima. Os três existem — corpo
    (anamnese → PO → bloco 10), técnica (`notacao`/`vocabulario`/`progressao`), expressão (música,
    repertório, vídeo, 4 termos de `qualidade`) — e **nenhum está declarado como eixo**. **O objetivo
    não é um quarto eixo: é o cruzamento**, e já existe duas vezes (`estrutura-de-cada-aula` marca o
    objetivo por bloco, `aula-1-sequencia` amarra objetivo + bloco + tempos + compasso por linha).
    **CONFIRMADO** 02/11/2026 (correção de uma afirmação minha, datada no `REGISTRO.md`); o que fica
    por decidir — os três como eixos de primeira classe — é a **C20**.
54. **O RITMO É DO CONTRATO, E POR ISSO O CATÁLOGO NÃO O TRANSPORTA.** Ele é **obrigatório** e vive no
    **cadastro da turma** — dias e hora de cada um, duração, período; a frequência é **derivada**, não
    digitada. O sistema recusa gravar a turma, atribuí-la e **gerar o ciclo** sem ele
    (`faltaNoRitmoDaTurma`, quatro portas). A mesma «Balé Nível 1» é 2×/semana numa escola e 3×
    noutra: não é do conteúdo, é da contratação. **É o que fecha a C19 pela negativa** — a turma
    pronta vende-se **sem** ritmo, e o ritmo entra onde já entra hoje. **DECIDIDO** 02/11/2026.
55. **O VERBETE É O ÁTOMO DO SYLLABUS, E O MOTOR É VIÁVEL — FALTAM QUATRO ARRUMAÇÕES E CINCO
    MÚSICAS.** Os quatro degraus são **dicionário → syllabus → aula pronta → gerador**, e a ordem é de
    **dependência**, não de preferência. O motor não precisa de modelo novo: o átomo já é chave-valor
    por música, com a notação **derivada**. Precisa de (1) **identidade estável** por unidade (hoje o
    `id` deriva do nome, e o `PUT /termo` recusa renomear um termo em uso — é a **L2**), (2) a
    **separação catálogo × escola** (é o mesmo ficheiro: `termo-repo.js`), (3) a **camada pedagógica**
    (o que a unidade **exige**, **ensina** e **expressa** — **de conteúdo**, P-16), (4) **uma leitura
    só** do vocabulário (hoje `lerModalidade` lê do GitHub e `termos()` do bundle). E antes de tudo:
    **4 das 13 músicas** têm `cobre` diferente dos tempos (Rond de jambe en l'air 3 em 4, Battement
    dégagé 6 em 4, Battement fondu 6 em 2, Relevé 1 em 2) — o `Plié`, que era o quinto, saiu da lista
    quando a régua passou a ser a maior pista — e a gravação já as
    **recusa**, o que quer dizer que precisam de correção antes de qualquer regravação. A
    **licença** (não há `LICENSE`; estava a definir desde 18/09/2026, `REGISTRO.md:109` — **decidida a
    02/11/2026**, `ARQUITETURA-GERAL.md` §10) trava o degrau 1 tanto quanto a separação. **DECIDIDO** o diagnóstico e o veredicto; a **ordem comercial** é dela
    (**C22**).
56. **UM MOTOR, TRÊS SAÍDAS, TRÊS MANIFESTOS — E OS PRODUTOS VÊM ANTES DO CICLO.** Os três produtos
    (dicionário · syllabus · aula pronta) são **saídas de um motor só**, porque o trabalho é um: o
    núcleo já é único e a fronteira é provada por máquina (`provar-agnosticismo`), a leitura do
    catálogo já está duplicada uma vez e a C22 manda unificá-la, a notação é uma regra só, a âncora é
    uma convenção só, e a entrega vive em `tools/`, que é congelado. **O que parte é o MANIFESTO** —
    três objectos com `id`, `versao`, `licenca` e `ancora` —, e é ali que vive a granularidade da
    negociação. E são gerados **antes do ciclo**: são **matéria-prima** da anamnese, do plano e do PO,
    e tornam-se da escola **na curadoria**. Isso **não inverte** o pipeline — acrescenta-lhe uma etapa
    à frente. **DECIDIDO** 02/11/2026; o plano é o
    [PLANO-PRODUTOS-DO-MOTOR.md](./PLANO-PRODUTOS-DO-MOTOR.md).
57. **OS PRODUTOS SÃO A CARA COMERCIAL DA BASE, NÃO A CARA ANALÍTICA.** O `PLANEJAMENTO` §5 proíbe
    implementar L6 antes de L1/L2/L3 e L10 — e os produtos **não são L6**: não consultam, não cruzam
    dado da escola, não respondem pergunta nenhuma. Podem por isso vir **antes** das camadas
    analíticas, e o que os trava é **conteúdo** e **L1 · L2 · L14**, não o índice nem o catálogo de
    consultas. **DECIDIDO** 02/11/2026.

58. **A LICENÇA TEM TRÊS CAMADAS, E O QUE A ESCOLA ACRESCENTA É DELA.** A **máquina** é proprietária e
    **não** se licencia com os produtos — a escola compra o uso do produto, não o motor que o produz.
    O **catálogo** licencia-se **por escola**: **vinculado à fotografia datada** (C5a), **perpétuo para
    a versão contratada** (L9), **não exclusivo/transferível/sublicenciável**, uso interno livre,
    **revenda proibida**, **atribuição preservada** no `fonte` de cada descrição. E o que **a escola
    acrescenta é dela**: concede ao projecto uso não exclusivo para o servir de volta e **avaliar** a
    proposta de entrada no catálogo, que exige **aceitação explícita**. **A condição que a licença
    impõe:** uma descrição **sem `fonte`** não entra na edição paga — e **25 das 59** estão nessa
    situação. Escrita na `ARQUITETURA-GERAL.md` §10. **DECIDIDO** 02/11/2026.
59. **AS CÉLULAS CONTAM-SE POR PISTA, E A PISTA É A CATEGORIA.** `à frente` e `atrás` são o mesmo
    corpo e **somam-se**; `Pé`, `Peso`, `Perna` e `Braço` são corpos diferentes e correm **em
    paralelo**. O que o verbete ocupa da música é a **maior pista**, e não a soma em linha. O `Plié`
    somava 12 numa música de 8 (pernas 8 + braços 4) e era recusado; com esta régua dá 8 = 8 e
    compõe-se. Foi aplicada com a mesma conta em quatro sítios — motor, validador, e duas funções da
    página —, porque três réguas diferentes para a mesma conta é o defeito que esta casa trata pior.
    **DECIDIDO e implementado** 02/11/2026. **Reverte, com razão, a decisão de 29/10/2026**: o «mesmo
    instante» que ali era contradição é, em duas categorias, **simultaneidade**.
60. **A REPETIÇÃO É DO TRECHO, E A MÉTRICA COMPOSTA CONTA POR PULSO.** `repeticoes` (inteiro ≥ 1)
    multiplica o que a célula ocupa — a `contagem` é a de uma execução, e o produto entra em toda a
    aritmética. E o compasso deixa de ser lido só pelo numerador: nos **compostos** (`/8` com
    numerador múltiplo de 3) o pulso vale **três** tempos, e a lista de contagens traz **primeiro** os
    fins que fecham pulso e **no fim** os de meio — que **não** se proíbem, porque `1–2` num 6/8 é uma
    síncope e existe. **DECIDIDO e implementado** 02/11/2026.
61. **CORRIGIR UM TRECHO NÃO LHE MUDA O COMPASSO, NEM O PASSO MUDA SEM O UTILIZADOR.** A edição
    **substitui no lugar** — nunca `splice` + `push` —, porque o compasso sai da **ordem** e o
    `push` reescrevia a posição temporal do trecho corrigido. E a correcção **abre a área do trecho
    onde se está**: os painéis onde ele se compõe **e o último**, que é onde vive o botão de
    guardar. Acrescentar, guardar e cancelar **não mudam de passo**; o «Cancelar» já era o
    comportamento correcto e passa a ser a regra escrita, em vez de um acidente que dava o mesmo.
    **DECIDIDO e implementado** 02/11/2026.
62. **DUPLICAR O EXERCÍCIO DUPLICA O BLOCO INTEIRO, TAL E QUAL, E SOBE OS TEMPOS.** O botão clona
    as células de **cada direção** e acrescenta-as ao fim da sua lista — o compasso sai da ordem, e
    por isso as cópias caem nos compassos **seguintes** (3 e 4 numa música de 8), que é o que «logo
    abaixo na sequência» quer dizer. Os tempos sobem **sozinhos**: duplicar um bloco de 8 numa música
    de 8 deixaria a música a declarar 8 e as células a cobrir 16, e a gravação recusaria com «sobram
    8 tempos» o resultado de uma acção que a própria tela ofereceu. `MUSICA_EM_FOCO` acompanha, senão
    o envio recarregava o rascunho da música antiga. **E não se reescreve sinal nenhum** — a
    Alternativa B da proposta, que perguntava a posição nova, foi recusada com medição: no `Plié` o
    `1ª` está nas **duas** pistas, e a troca automática escreveria `⌒ 2ª → 2ª → 2ª`. A posição muda-se
    no «Editar», onde se vê o que se está a mudar. **DECIDIDO por ela** (bloco = exercício inteiro;
    posição depois, Alternativa A) e **implementado** 02/11/2026.
63. **MUDAR OS TEMPOS É DECLARAR OUTRA MÚSICA — E OUTRA MÚSICA É OUTRA DECOMPOSIÇÃO.** Tentei
    conservar as células quando a música em foco ainda não existe, com o argumento de que elas são o
    gesto; **a suite revertou a ideia com números** — 13 asserções passaram a medir o exercício
    anterior, porque construir um cenário passa por declarar uma música nova. O `carregarRascunho`
    ficou como estava, e o bloqueio dos tempos resolveu-se **localmente**, dentro da duplicação.
    **DECIDIDO** 02/11/2026, contra a minha primeira proposta.
64. **CADA MÚSICA DE UM VERBETE TEM DE TER PORTA.** A listagem agregava («2 músicas») e o «editar»
    fazia `Object.keys(musicas)[0]` — sempre a primeira. Consequência medida: ela duplicou o `Plié`
    de 8 para 16 tempos, gravou, o alfabeto ficou com as duas, e **a segunda não aparecia em sítio
    nenhum**. A listagem passa a ter **uma linha por música**, com a música no `data-musica` do botão,
    e o servidor manda `detalhePorMusica` (tempos, compasso, `cobre`, trechos, direções, orientações,
    categorias — tudo derivado). **A regra geral:** um dado que se grava e não se consegue voltar a
    abrir é um dado perdido, ainda que esteja no ficheiro e a etiqueta o conte.
    **DECIDIDO e implementado** 02/11/2026.
65. **A CORRECÇÃO ANDA POR PASSOS — UM PAINEL DE CADA VEZ.** A decisão da manhã abria os painéis 4, 5
    e 6 durante a correcção de um trecho; ela respondeu que isso «abre tudo em um formulário único
    (página única)» e transforma os passos em «meros indicadores visuais». As duas coisas que ela
    pediu — **não saltar de passo** e **andar por passos** — não competem: o «Editar» não muda de
    passo (decisão 61, que fica), e o formulário mostra um painel só. **Corrige, com data, a decisão
    61 na parte da área do trecho. DECIDIDO e implementado** 02/11/2026.
66. **O SINAL TROCA-SE NO LUGAR.** Clicar uma ficha marca-a; clicar um sinal na paleta
    **substitui naquele índice**. Sem marca, a paleta acrescenta ao fim, como sempre. O «×» continua a
    tirar e **desfaz a marca quando os índices andam para trás** — uma marca esquecida em cima do
    vizinho trocaria o sinal errado em silêncio. A ordem é a informação: ela é a sequência em que o
    gesto acontece. **DECIDIDO e implementado** 02/11/2026.
67. **A ETIQUETA LOCALIZADA É UM CAMPO DO DADO, NÃO UMA TABELA NA TELA.** Cada termo do vocabulário
    pode ter `nome` — a etiqueta em português; a tela mostra `nome || termo`, e o `termo` continua a
    ser o que se grava e o que o documento escreve. Treze posições receberam `nome`; os empréstimos
    que se dizem assim em português (`retiré`, `attitude`, `arabesque`, `sur le cou-de-pied`) **não**
    foram traduzidos, porque traduzi-los seria inventar. A alternativa — uma tabela de tradução na
    camada de exibição — foi recusada: duas listas do mesmo vocabulário divergem ao primeiro termo
    novo. **DECIDIDO e implementado** 02/11/2026.
68. **GRAVAR UMA EDIÇÃO SUBSTITUI O REGISTO DE ONDE SE VEIO — E O «SUBSTITUIR» DIZ-SE ANTES.**
    A chave de uma música é `<tempos>|<compasso>`; mudar os tempos cria outro registo. Numa edição,
    a tela manda `musicaAnterior` e o servidor apaga a chave antiga depois de escrever a nova, com
    quatro guardas: só em edição; só com chave válida e **diferente** da nova; só se existir; e a
    mensagem do commit diz o que substituiu. A nota da tela di-lo **antes**, porque isto apaga
    dados. A outra intenção — «ficar com as duas» — existe numa caixa explícita que só aparece
    quando a música mudou. **A regra geral:** quando a chave de um registo é derivada de um valor
    editável, «guardar» e «guardar como novo» deixam de ser o mesmo gesto. **DECIDIDO por ela e
    implementado** 02/11/2026.
69. **AS BANCADAS DE LAYOUT NÃO SÃO TUDO-OU-NADA.** O `construir.js` saía por inteiro quando
    nenhuma escola tinha ciclo gerado, e uma bancada que lê o **alfabeto** (a da listagem dos
    verbetes) não precisa de ciclo. Passa a construir o que pode, e a bancada que mede a Aula 01
    sai como **página que explica a ausência**, com o motivo do registro e o comando que a faz
    voltar. Numa escola nova — que é quando a listagem se quer decidir — antes não se construía
    nada. **DECIDIDO e implementado** 02/11/2026.
70. **A LISTAGEM DO VERBETE É O CARTÃO DAS TURMAS.** Escolhida a opção 1 da bancada: `li.turma`,
    `.linha-turma`, o nome como botão, o selo, o complemento, e as três caixinhas `.trio` com o «?»
    — `Música`, `Direção`, `Notação`. A da notação abre a tabela do passo 6 em leitura, com o
    compasso **derivado pelo motor** (`compor`), e não por uma segunda conta. **Nenhuma classe
    nova:** as peças são da folha, e a marcação é a da turma. Medido: 285 px por cartão a 320, 192 a
    390, 142 a 768, 0 de transbordo. **DECIDIDO por ela e implementado** 02/11/2026.
71. **UMA PEÇA, UM COMPORTAMENTO — TAMBÉM NO JAVASCRIPT.** Escrevi um handler de clique para o «?»
    do cartão, e o botão não abria nada: a página **já tem** um ouvinte de `.trio-item` no
    `document` (o da turma), que dispara depois e **fechava** o painel que o meu acabara de abrir. A
    correção foi **apagar o meu** e usar o que existe — o cartão ganha o «abrir um fecha os outros» e
    o `Escape` de borla. **DECIDIDO e implementado** 02/11/2026.
72. **O VOCABULÁRIO DA MODALIDADE CRESCEU, E O GLIFO PODE TER DOIS PAPÉIS.** Entram a categoria
    **Cabeça** (uma pista, e não um membro com posições), `↻` rotação para dentro, `○` abre, os
    **lados nos três eixos** (`D`/`E` horizontal, `F`/`T` sagital, `C`/`B` vertical), as direções
    **para dentro** e **para fora**, e a orientação **de lado · perfil**. O rótulo `épaulement`
    deixou de ser «ombros rodados» — não é o ombro que roda, é a coluna — e passou a **«ombro à
    frente»**. **O mesmo glifo `↻`/`↺` é movimento (passo 5) e direção (passo 4)**, de propósito:
    é o que já acontecia com `+`, `-` e `×`, e um membro que vai para fora roda para fora.
    **DECIDIDO por ela e implementado** 02/11/2026 — em **conteúdo** (`notacao.json`), sem tocar em
    `tools/` nem no motor.
73. **O QUE APAGA TRABALHO NÃO SE DEIXA AO ALCANCE DE UM CLIQUE ACIDENTAL — BLOQUEIA-SE.** Era a
    terceira vez que o assunto dos tempos apareceu, e a resposta dela foi a mais simples: «não pode
    editar esse campo». Com trechos escritos, a música fica só de leitura e o compasso desactivado;
    quem quer a mesma decomposição noutra duração usa o «Duplicar o exercício», que é o gesto
    **explícito** para isso. A alternativa era um `confirm` a perguntar «isto descarta os trechos?»,
    e ela já disse o que pensa de um formulário que pergunta o que devia saber. **DECIDIDO por ela e
    implementado** 02/11/2026.
74. **A POSIÇÃO É DO TRECHO, E NÃO SE PEDE DUAS VEZES.** O campo «posição em que o exercício
    acontece» **saiu** do passo 2: a posição já se escreve nos sinais do trecho, com a direção e a
    contagem ao lado. O **dado fica** (`posicao: {membro, termo}`) — tirar o pedido não é tirar a
    informação, e um verbete antigo continua a ler-se. A frase do exercício subiu ao passo 1, porque
    é a **definição** dele e nasce onde ele nasce. **DECIDIDO por ela e implementado** 02/11/2026.
75. **O VERBETE PODE SER APAGADO — E O QUE ISSO INVERTE FICA ESCRITO.** A rota respondia 409 com a
    P-03/P-04; passou a apagar. O argumento antigo não era um capricho e não se apaga com o código:
    uma aula já publicada que citava o exercício passa a sair com a notação em **lacuna**. A
    diferença é que isso passa a ser **dito antes** do gesto, na pergunta que a tela faz, e não
    usado como recusa. O que **não** se apaga é o exercício no vocabulário: sai a notação, fica a
    palavra. **DECIDIDO por ela** («faltou fazer o verbo deletar o verbete») **e implementado**
    02/11/2026.
76. **O VERBETE EM USO NÃO SE APAGA NEM SE REESCREVE: AJUSTA-SE.** Duas metades, uma decisão. O
    `DELETE` fica guardado pela proveniência (plano de ensino, turma com plano, curadoria) e a
    recusa diz o caminho — «Descontinuar». O `UPDATE` de um verbete em uso passa a ser um **ajuste**:
    o estado anterior fica no histórico (`versoes[]`, com `ate` e motivo) e a composição escolhe o
    estado que valia **na data do envelope**. A opção escolhida por ela foi a **B** (versões
    datadas); a **A** (histórico sem tocar no gerador) não impedia o documento antigo de mudar ao ser
    regerado, e a **C** (bloquear a edição) obrigaria a duplicar o exercício no dicionário para o
    corrigir. **DECIDIDO por ela e implementado** 02/11/2026.
77. **A LISTA DE TRADIÇÕES É UMA, E A CAIXA ALTA É DERIVAÇÃO.** `tradicoes.json` é a fonte; os
    quatro selectores e as duas listagens geram-se dela, e por isso acrescentar **CUBANA** lá pôs a
    tradição em todas as telas sem tocar em mais nada. O **dado** continua a guardar a chave
    (`francesa`, `Vaganova`): subir as maiúsculas seria migrar 4 termos do vocabulário e deixar as
    colunas de `diferencasDeNomenclatura` sem ninguém, em silêncio. A Cubana **não** ganhou linhas
    de nomenclatura — inventá-las seria conteúdo sem fonte. **DECIDIDO por ela e implementado**
    02/11/2026.
78. **O QUE NÃO VALE NÃO SE PEDE — E O QUE SE PEDE ACENDE COM O NOME.** O «Gravar verbete» fica
    `disabled` sem decomposição (a guarda do `submit` e a do servidor ficam, e servem quando o
    JavaScript falha), e a categoria, a tradição e «o que acontece» só entram em vigor quando há um
    exercício — nome novo **ou** escolhido no passo 2. A segunda metade da condição não estava no
    pedido e é obrigatória: sem ela, corrigir um verbete que já existe fecharia a frase a quem a veio
    corrigir. **DECIDIDO por ela e implementado** 02/11/2026.
79. **A ESTANTE MOSTRA UM POR DOCUMENTO; A PROVENIÊNCIA NÃO SE EMPILHA NO ECRÃ.** Três ajustes do
    PO viravam três linhas com o mesmo nome. A regra é do núcleo (`porta.vigentesDaFamilia`) e tem
    duas metades: a **cadeia** (`ajuste_de` — quem derivou declarou de quem) e o **contexto** — duas
    tentativas irmãs do mesmo documento (o plano observado, para o PO; a aluna, para a anamnese)
    colapsam na mais recente. **O plano de ensino fica só com a cadeia**: dois planos da mesma turma
    e ciclo com objetivos diferentes são dois documentos, e agrupá-los escondia o plano que um PO
    observa — medido, é a bancada `provar-apagar-da-listagem` a dizê-lo. Os envelopes escondidos não
    se apagam nem se movem: continuam legíveis, no índice, e os **estados** e a regra de proveniência
    dos Bastidores continuam a derivar de todos. A linha diz quantas versões guardou. **DECIDIDO por
    ela** («o professor não tem por que entender os bastidores») **e implementado** 03/11/2026.
80. **A FATIA DE TEMPO LÊ-SE PELA COLUNA, E O GUIA TEM AS TRÊS FRENTES.** Duas correções de leitura.
    (1) A proporção de cada bloco era lida por `Object.values(linha)[1]`, e a gravação não escreve
    célula vazia — quando «Proporção alvo» falta, a justificativa ocupa o lugar dela e a aula
    imprime «Braços» como fatia. A coluna passa a ser procurada pelo **nome** (tolerante a acentos),
    as unidades **percentual** e **minutos** convertem nos mesmos tempos, a fatia em minutos diz a
    unidade, e a lacuna **nomeia o bloco e o sítio** — e o plano diz o mesmo ao pé da tabela. (2) O
    guia de observação lia tudo como «Técnica —»; passa a ter o **resumo por eixo** — **Corpo**
    (aspectos físicos do plano, ponto de partida, restrições), **Técnica** (Barra, Centro) e
    **Poiesis** (Musicalidade, Expressão) — com a tabela **item a item** logo abaixo. Nenhum rótulo
    do dado foi renomeado (P-03), e **o mapa dos eixos é candidato**, não taxonomia decidida: ele é
    dela, e o mapa vive numa constante documentada até ela decidir o lugar definitivo. **DECIDIDO
    por ela** («o guia contempla as três dimensões»; «a fatia está no plano») **e implementado**
    04/11/2026.
81. **O AJUSTE DO PLANO ARRASTA O PO — E O PO OBSERVA O PLANO QUE VALE.** A pesquisadora ajustou a
    proporção do Expressão no plano de ensino; o «Guardar» criou o elo novo (a proveniência manda) e
    o **PO continuou a apontar o plano substituído** — medido: `po-20261104-1733` declara
    `plano-de-ensino: plano-20261103-2200`. Para o professor foi «um ajuste»; o que ele viu foi um
    plano «livre» e uma aula com a proporção antiga. A regra passa a ser uma e derivada do
    `ajuste_de` (nada é inferido): a **cadeia** do plano tem um **topo** (`planoVigenteDaCadeia`), o
    PO do plano é o que observa qualquer elo e não foi substituído (`poDoPlano`), e ao gravar um
    plano ajustado a rota **deriva um elo do PO** com a referência nova e corre o caminho normal
    (fonte, ciclo, disparo). Um PO gravado a declarar um plano substituído **passa a apontar o
    vigente**, e o ajuste é **dito** na resposta. **Sem PO nada se inventa** — um plano livre
    ajustado continua sem observação. **DECIDIDO por ela** («o usuário sente que está apenas
    editando o plano que já possui, e a alteração deve reverberar de forma natural e integrada»)
    **e implementado** 04/11/2026.
82. **O CARTÃO DA AULA DIZ O QUE SE OBSERVA, E NÃO COMO O SISTEMA É FEITO.** Três mudanças na
    listagem: a frase «a aula não tem professor próprio: quem o tem é a turma…» **saiu** (é
    arquitetura, e o painel fica com o dado); a caixa **Horário** foi **absorvida** pela **Turma**
    (identificação, ciclo, «aula N de M», dia, início, fim, duração — e a **Sala** dita «não
    declarada», porque ela só existe no modelo com o `PLANO-TABELA-DE-ATIVIDADES`); e o **Guia de
    observação** entra como caixa — a conta, os itens por dimensão e uma **linha de síntese por
    eixo** ao lado do nome, para se ter à mão sem abrir a aula. O link «Aula N — objetivo» e os três
    botões (Lançar · Captura · PDF) ficam. **DECIDIDO por ela e implementado** 04/11/2026.
83. **O NOME DE UM DOCUMENTO NÃO SE DECIDE ANTES DE GRAVAR — QUEM DECIDE É A GRAVAÇÃO.** O id de um
    envelope é um carimbo de minuto, e `identificar` perguntava «existe?» para o escolher. Entre a
    pergunta e a gravação há uma janela; dois pedidos que perguntassem antes de qualquer escrita
    recebiam o **mesmo nome**, o segundo gravava por cima do primeiro, **os dois respondiam
    «gravado»** — e um ajuste evaporava. **MEDIDO** (04/11/2026, núcleo sobre a memória): dois
    `identificar`, duas gravações, **um** documento no acervo, e o índice a descrever o documento do
    B sob o nome que o A devia ter. **DECIDIDO**: (a) o contrato de armazenamento ganha `criar`
    (grava só se a chave não existir) — no repositório a escrita vai **sem `sha`** e o **422
    «"sha" wasn't supplied»** do GitHub é o «já existe», **medido contra a API real** num ramo
    descartável; um 422 por outro motivo é **erro**, e não «já existe». (b) Perdida a corrida, o
    nome cede ao sufixo seguinte — o mesmo `-2` que o `identificar` daria se tivesse visto a outra
    escrita —, e o `documento.id` viaja com o nome do arquivo. (c) **A intenção é declarada, não
    adivinhada**: `substituir: true` quando o id foi **dado** (edição em sítio, correção — grava por
    cima, como sempre), `false` quando foi **inventado agora** (elo novo, registo solto) —, e o
    omisso é `true` para nenhum chamador mudar por esquecimento. (d) O índice é **projeção**: o
    resumo do nome cedido passa a descrever o **arquivo**. (e) O **expurgo** — o único escrito em
    lote sem repetição — passa a refazer a corrida que perdeu, porque chegava lá com a metade do
    Cloudflare **já apagada**. **DECIDIDO por ela** («as duas correções») **e implementado**
    04/11/2026.
84. **A EDIÇÃO SIMULTÂNEA DO MESMO DOCUMENTO UNIFICA POR DIFF — E O MESMO CAMPO DECIDE PELA
    RECÊNCIA.** Fechada a corrida do *nome* (83), faltava o caso de **duas pessoas** na mesma escola
    a gravar **o mesmo** plano/PO: a segunda vencia em silêncio. **DECIDIDO por ela** (04/11/2026):
    (a) se as edições mexeram em **campos diferentes**, as duas ficam — nada se perde; (b) se
    mexeram no **mesmo campo**, vence a edição **mais recente, ao milissegundo** (`escrito_em`);
    (c) no empate vence a gravação que está a correr, que é o único desempate que não depende de
    relógios externos; (d) o **local** é a chave de `respostas` — uma resposta é uma unidade; (e)
    **sem base não se adivinha**: a fusão a três vias precisa do que o professor leu, e faltando
    ele grava-se como sempre. A regra é **pura e do núcleo** (`motor/nucleo/fusao.js`); a repetição
    do 409 é do adaptador (`gravarComFusao`). A fusão **nunca é silenciosa**: a resposta traz
    `fundido` e `fusao: { unidos, conflitos }`. **Implementado** 04/11/2026.
85. **O ID NÃO GANHA ENTROPIA — A UNICIDADE É UMA CONDIÇÃO VERIFICADA PELO STORE.** A ordem de
    serviço de 04/11/2026 pedia «sufixo aleatório combinado ao timestamp». **Não foi o que se
    adotou, e o motivo está declarado**: a solução é a **criação condicional** (o GitHub responde
    pela existência, com o 422) mais o **sufixo sequencial** (`-2`, `-3`). A entropia custaria três
    coisas que o projeto não quer — o id deixaria de ser **legível** (a estante mostra o carimbo),
    de ser **derivável** (a reconstrução do índice e as provas que fixam `anamnese-20261016-1351`)
    e a unicidade passaria a depender de um **gerador** em vez de uma **condição verificada pelo
    store**. O `-2` é determinístico e auditável. **DECIDIDO** 04/11/2026 — **divergência
    declarada** da ordem de serviço, não cumprimento.
86. **O CARTÃO DA AULA MOSTRA O QUE O DADO TEM — E O GUIA É O EIXO, NÃO O RÓTULO.** Três decisões
    dela, de 04/11/2026, e as três são a mesma: *o documento diz o que o dado tem.* (a) **O ciclo
    sai da caixa da Turma** — «o ciclo não é um atributo estrutural da turma» — e o operacional
    fica (aula N de M, dia, início, fim, duração, e a Sala dita «não declarada», porque ela só
    existe com o `PLANO-TABELA-DE-ATIVIDADES`). (b) **O professor são três dados**: nome e
    modalidade do **perfil da pessoa** (a habilitação é dela, não do tenant), e a **tradição de
    referência** do **plano**, que é quem a declara — pô-la no perfil diria que a pessoa só
    trabalha numa tradição, mais do que o dado afirma. O identificador deixa de ser o nome de
    ninguém. (c) **O guia são três tabelas, uma por eixo**, e o eixo é o **bloco** do documento
    (`### Corpo`, `### Técnica`, `### Poiesis`) — não por gosto: o contrato de extração lê **uma
    tabela por bloco**, e três tabelas num bloco só perderiam a segunda e a terceira. O eixo do
    **Corpo** passa a ter **linhas** (os aspectos físicos do plano, o ponto de partida de cada
    aluna, as restrições do PO); até aqui era uma frase de contagem, e uma tabela que salta um eixo
    dos três ensina que ele não se observa. **DECIDIDO por ela e implementado** 04/11/2026.
87. **A PROVENIÊNCIA LEVA À LEITURA, NÃO AO FORMULÁRIO.** Os dois links da §6 da aula abriam a
    **porta** (`/plano-observacao/?…&fonte=po`) — o formulário de elicitação. Quem clicava para
    reler o que tinha decidido caía dentro do formulário que ia reescrever esse documento. Passam a
    abrir a **folha** do documento (`api/po-preenchido.<id>?formato=html`), que é **a mesma** que o
    título abre na Área do Professor (o mesmo `fichaDeLeitura`), com o `id` do envelope. O
    `formato=html` viaja porque sem ele a rota devolve MARKDOWN. **Sem `id`** — envelope ainda não
    gravado — cai-se na porta, e não num link quebrado. **DECIDIDO por ela e implementado**
    04/11/2026.
88. **A LARGURA DE UMA COLUNA É A DO CONTEÚDO — E ELA MORA NA LINHA DE SEPARAÇÃO.** «Todas as
    colunas estão com o mesmo tamanho, espremendo os textos descritivos» era literal: as doze
    tabelas de exercício saíam a **28/28/21/21**, com o «1» do compasso tão largo como o parágrafo
    da descrição. **A causa não era CSS** (o `table { width: 100% }` da folha está certo, e o
    browser distribui por conteúdo quando não há largura declarada): era o `<colgroup>` que o
    pandoc escreve, e ele calcula a largura relativa pela **proporção dos traços** da linha de
    separação — **e só quando essa linha passa dos 72 caracteres** (`--columns` por omissão, que o
    `gerar-ciclo.sh` não muda). Uma linha proporcional mas curta é desfeita em silêncio; as duas
    condições foram medidas (67 caracteres → sem `colgroup`; 104 → larguras). **DECIDIDO**: a
    correção mora na linha de separação, e não numa regra de CSS por tabela — uma segunda fonte de
    verdade para uma decisão que o gerador já toma, e o PDF (LaTeX) lê a mesma proporção, de modo
    que o que se corrige vale nos dois suportes. A proporção passou a **12/12/23/52**. **A divisão
    não é a metade exacta do pedido**, e o motivo é medido: repartir o ganho igualmente entre
    notação e descrição daria 14/14/35/35, e a descrição — 150 a 300 caracteres — ficaria com um
    terço da tabela; o ganho vai a favor de quem tem texto. **DECIDIDO por ela e implementado**
    04/11/2026.
89. **A NOTAÇÃO NÃO ESTÁ NA MÚSICA — ESTÁ NO DOCUMENTO DELA.** O bloco de musicalidade da aula
    trazia, na célula da contagem, o bloco Benesh (`1–2 `[Perna: ED 1ª ○ - ● 1ª]``). Saiu. O bloco
    de musicalidade é a **música** da aula (compasso, exercício, tempos, contagem), e a notação é o
    **código** em que a música se escreve: tem documento próprio (`-notacao.md`, «Exercícios da Aula
    01») e é lá que o botão «notação» do cabeçalho da aula a vai buscar. Repeti-la aqui punha 24
    caracteres numa coluna de «1–2», a espremer as outras três. A dedução da contagem passa a ser
    **só pela contagem** (era contagem + bloco). **DECIDIDO por ela e implementado** 04/11/2026.

93. **O PLANO DE OBSERVAÇÃO TEM OS TRÊS EIXOS — E O CORPO VEM DA ANAMNESE.** As dimensões nascem do
    plano como `<eixo> — <bloco>`, com o eixo **escrito no conteúdo** (`doPlano.eixo: "Técnica"`), e
    por isso o documento listava «Técnica — Musicalidade» e «Técnica — Expressão». Musicalidade e
    expressão são **poiésis**, e o rótulo era uma afirmação falsa sobre o que se mede. O mapa passou
    a ser **um só** (`motor/nucleo/eixos.js` — havia duas cópias), o eixo decide-se pelo **bloco** (o
    prefixo gravado não manda), e **nada é renomeado no dado** (P-03): o que muda é a leitura. O
    **Corpo** é eixo próprio — não uma técnica — e alimenta-se da **anamnese de cada sujeito**, pelos
    campos que o «Ponto de partida» já declara (`registroDaAnamnese.grupos[].campos`). O seletor do
    sujeito passou a ser o **primeiro bloco**, antes das dimensões: é o que faz a cascata chegar a
    tempo. **DECIDIDO e implementado** 04/11/2026.

94. **A RÉGUA DO REPERTÓRIO É UMA SÓ — E ELA VALE EM TODOS OS DOCUMENTOS.** O «Port de bras» saiu do
    exercício da aula a 03/11/2026 (`linhasDoRepertorio`) e continuou a aparecer no **§1 da mesma
    aula**, na matriz do «Parâmetro de medição» — porque a régua foi aplicada a uma porta e não à
    outra. Agora `termoForaDoRepertorio`/`termosDoRepertorio` servem as duas formas de dado (a linha
    de tabela e o termo solto), e valem no §1 da aula, na ficha do plano e na sequência. Sem
    repertório declarado não se julga nada. **DECIDIDO e implementado** 04/11/2026.

95. **A LINHA DO CARTÃO É O OBJETIVO GERAL, E A SÍNTESE POR EIXO FICA NO GUIA.** «A linha de resumo
    (que lista os eixos e contagens) já está perfeitamente posicionada dentro do Guia de Observação,
    tornando redundante a sua exibição na listagem.» Entra o **objetivo geral do Plano de
    Observação** — o `horizonte`, que o próprio conteúdo do PO chama «Horizonte (objetivo geral de
    conjunto)» —, com o prefixo `Plano de Observação — `. A hierarquia fica completa: o título do
    cartão é o objetivo **específico** da aula, a linha é o **geral** do ciclo. **DECIDIDO e
    implementado** 04/11/2026.

90. **O COMPOSTO NÃO ENUMERA VERBOS — ELE ENCAMINHA.** O armazenamento que o Worker monta
    (`combinar`) listava os verbos um por um, e o que ficava de fora da lista desaparecia **sem
    aviso**: o `criar` nasceu no acervo e nunca chegou ao motor, de modo que a escrita condicional —
    a blindagem da decisão 85 — era inerte em produção; o `anexar` faltava, e a rota do registro de
    custo da IA chamava uma função que não existia. E havia um terceiro furo, mais fundo: os dois
    adaptadores de **base** não implementavam `criar`, que o contrato declara. A correção não foi
    acrescentar os verbos que faltavam — isso deixaria a armadilha armada para o próximo. O composto
    passou a ser um `Proxy` que encaminha **qualquer** verbo para quem atende a família da chave; só
    `criar` (degradação declarada) e `gravarComFusao` (exige o `sha`) mantêm regra própria. A regra
    fica verificável — *verbo no contrato ⇒ verbo nos dois adaptadores de base + no acervo + no
    composto* — e a bancada lê os verbos **do ficheiro do contrato**, passando pelo
    `criarArmazenamento`, que é o que a produção monta. **DECIDIDO e implementado** 04/11/2026.

91. **A MODALIDADE TEM UM ÚNICO PONTO DE DERIVAÇÃO.** O motor tratava a modalidade como constante
    em 8 ficheiros, e o número medido (**29 ocorrências**, das quais **6 decidiam comportamento**) é
    maior do que os «10 sítios» contados a 03/11 — a diferença é de método: contar sítios subestima o
    acoplamento, contar literais não. Agora `modalidadePrincipal()` é **a única derivação** (a primeira
    modalidade do catálogo com `temConteudo`, e `''` se não houver catálogo), `MODALIDADE_PADRAO` é
    **derivada** dela em vez de escrita, e a página da Produção lê `modalidadeDoCatalogo()`. **Um
    literal de modalidade não se escreve em `motor/`**: quem precisa do padrão chama a constante;
    quem precisa de *outra* modalidade recebe-a do perfil, do plano ou da query. **DECIDIDO e
    implementado** 04/11/2026.

92. **O CUSTO DA ESCRITA É EM REQUISIÇÕES, E O LIMITE MORDE A RAJADA — NÃO A MÉDIA.** Não é um
    gosto: é a aritmética que sustenta a decisão de nunca adoptar banco relacional. Medido: um
    «Guardar» de envelope novo custa **3 `GET` + 3 `PUT` = 18 pontos**; uma edição, **7**. Limites
    reais (documentação do GitHub): 5 000 req/h autenticado, **1 000/h com o `GITHUB_TOKEN` de
    Actions**, **500/h e 80/min de criação de conteúdo**, 900 pontos/min. A 7 pontos por edição, 500
    `PUT`/h dão ~70 edições por hora — mais do que um professor faz num mês. O que morde é a
    **rajada**, e é por isso que o expurgo é **um** commit e não 76 escritas. **O critério de
    revisão é explícito, e não é conforto:** a escolha só se revê se a escrita passar a ser *volume*
    (milhares de gravações por hora por escola) ou se o `80/min` for tocado no uso normal.
    **DECIDIDO e documentado** em `ARQUITETURA-GERAL.md` §7.1, 04/11/2026.

96. **O CABEÇALHO DO ATO EMPILHA NO TELEFONE — OS RÓTULOS DAS LEITURAS INCLUÍDOS.** As cinco
    leituras do cabeçalho (frequência, duração, calendário, volume, condição de registo) **não são
    `<label>`**: são um `.ctx-rotulo` e um `.ctx-inscricao`, porque não se preenchem. A regra que
    punha o rótulo na linha inteira cobria só o `label`, e a grelha do campo dava a coluna elástica
    ao rótulo e o `auto` ao valor — como o valor é uma **frase**, o rótulo encolhia até **0px** e o
    texto empilhava-se por cima dele. Medido a 360px: rótulo 0px, valor 129px. Agora ambos ocupam a
    linha inteira, na ordem em que se lê. **DECIDIDO e implementado** 04/11/2026.

97. **A CAPACIDADE É CALCULADA, E O TECTO QUE MANDA É O `PUT`.** Não a requisição: um `PUT` é uma
    criação de conteúdo. **26 criações ou 80 edições por minuto**; **166 ou 500 por hora**. Em
    escolas, com metade das gravações a serem criações: **5** em hora de ponta, **17** em uso
    corrente, **62** pequenas. São **projecções** — do custo medido nas bancadas e dos limites
    documentados do GitHub —, e **não** um ensaio de carga. O critério de revisão do §7.1 fica com
    número: a escrita passar a lote, o `80/min` tocado no uso normal, ou uma ordem de grandeza a
    mais de escolas (e aí a resposta é **outro repositório**, não um banco). **DECIDIDO e
    documentado** em `ARQUITETURA-GERAL.md` §7.2, 04/11/2026.

98. **A ANAMNESE NÃO REGENERA O CICLO — E NÃO DEVE.** O encadeamento é de **instantâneos**: a
    anamnese alimenta o `aspecto-fisico` do plano por um botão («Carregar das anamneses da turma»,
    que a professora **corrige**) e informa o `linha-de-base` do PO, que ela escreve por palavras.
    Nenhuma derivação lê a anamnese — `derivar-plano-ciclo.js` lê a tabela já consolidada. Regenerar
    sozinho desfaria a correção dela. Ficam duas notas **abertas**: o `fonte === 'anamnese'` está na
    condição da cadeia em `rotas.js` **sem ramo que o atenda**, e o instantâneo **não guarda de que
    anamneses nasceu** — a divergência não se detecta. **DECIDIDO (o comportamento está certo) e
    documentado** 04/11/2026.

99. **UM CICLO APAGA-SE DE TRÁS PARA A FRENTE — E SÓ O ÚLTIMO.** O `parentHash` de um ciclo é o
    `hash` da âncora do anterior; apagar um intermédio deixa o `parentHash` do seguinte a apontar
    para um hash que já não existe, e a cadeia fica partida **sem remédio** (P-03). A rotina leva o
    pacote gerado, o `.conf` da variante, as âncoras e os **POs** do ciclo; **não** leva a anamnese
    (é do sujeito) nem o plano de ensino (é a declaração que deu origem ao ciclo). E o plano fica
    **livre sem se lhe tocar**, porque o vínculo PO ↔ PE é derivado: apagados os POs, não há quem o
    declare — é o modelo da curadoria. **DECIDIDO e implementado** 04/11/2026.

100. **A SEQUÊNCIA DOS CICLOS É ESTRITA, E O CAMPO NÃO SE ESCREVE.** Um ciclo existe porque tem
     documento, e a lista vem do índice dos envelopes — não de um cadastro. `proximoCiclo` devolve
     `01` numa escola nova, o seguinte ao maior quando a sequência está inteira, e **`null` quando
     há um buraco**: inventar o número que taparia a lacuna esconderia o problema. O campo
     `#ctx-ciclo` passa a `readOnly` com a nota do motivo, e **desaparece da anamnese**. Nada é
     renomeado no dado. **DECIDIDO e implementado** 04/11/2026.

101. **A ANAMNESE É DATADA E IMUTÁVEL — O GESTO É «NOVO REGISTO».** Se ela é o retrato físico do
     corpo num momento, é historicamente datada; uma aluna que evoluiu ou se lesionou não teve um
     «ajuste» do passado, tem um **novo estado no tempo**. O «Ajustar» gravava `ajuste_de` e
     marcava o anterior como substituído — e um retrato novo não substitui o anterior: os dois
     aconteceram. O formulário abre **preenchido** com o retrato anterior e grava um documento
     novo, com data nova e sem `ajuste_de`. O «Editar» fica só para a anamnese **solta** (rascunho).
     **DECIDIDO e implementado** 04/11/2026.

102. **O QUE PRECISA DE REVALIDAÇÃO É DERIVADO — E A ORDEM É PE, DEPOIS PO.** «A anamnese de algum
     sujeito é mais recente do que este documento?» marca o PO e, pela cadeia, o plano que ele
     observa; o motivo do plano diz a ordem («Revalide ESTE plano PRIMEIRO»). Não há campo no
     envelope: um `revalidar: true` seria uma segunda declaração do mesmo facto, e um sinal que se
     esquece de apagar é um sinal que mente. O julgamento é do professor — o sistema não altera
     nada sozinho. **DECIDIDO e implementado** 04/11/2026.

103. **NÃO HÁ VALIDADE NEM PERIODICIDADE DA ANAMNESE.** Não se julga se ela está «velha»: quando
     se refaz o retrato é **política da escola**, e um motor que a impusesse estaria a decidir
     pedagogia por conta própria. Os **marcos do ciclo** — formativa (aula N/2) e somativa (última
     aula) — já são calculados pelo calendário e são a referência natural, se a escola quiser usá-la.
     **DECIDIDO** 04/11/2026.

104. **O CORPO TEM UMA FONTE SÓ: O DETALHE NA AULA 1, O PONTEIRO NO PLANO — E O VÍNCULO NÃO SE
     INVERTE.** A aula continua a derivar do plano: o PE e o PO são a origem (onde o professor
     escreve), e a aula é a vista que desce ao detalhe. O que a regra fixa é a **escala de cada
     vista** — o plano declara O(1) (a contagem e o link), a aula O(aspectos), o PO O(alunas) —
     nunca O(alunas) num documento de leitura. A **restrição física** fica na aula, citada e fora
     da tabela: é lesão/dor/limitação, e o PO declara que «a ausência também é informação». O aspecto físico (o
     eixo do corpo) era impresso **duas vezes** — no plano do ciclo e na aula 01 — a partir da
     **mesma** chave do envelope. Duas cópias do mesmo dado são duas versões à espera de divergir. A
     tabela dos aspectos fica na **Aula 1** (secção «Corpo» do guia), o plano publica a contagem e
     um **link** para `aula-01.html#corpo`, e o ponto de partida de cada aluna fica no **PO** — que é
     do sujeito, e é onde a Captura o pede. **A linha por aluna saiu da aula**: com trinta alunas
     eram sessenta e uma linhas antes da primeira marca. O título da secção do plano perdeu «força e
     flexibilidade» — declara o **eixo**, não a lista de capacidades, que é a da aula. **DECIDIDO e
     implementado** 04/11/2026.

105. **OS DOIS PLANOS TÊM DOIS NOMES — E AS TRÊS SUPERFÍCIES DIZEM O MESMO.** O documento do ciclo é
     «Plano do Ciclo NN»; o de cada aula é «Plano para a Aula NN — objetivo». O nome muda no
     `title:` do front-matter (que alimenta `<h1>`, menu e PDF), no cartão da listagem e no registo
     da geração — e a bancada exige que o nome do cartão seja **prefixo** do título da página:
     medir uma superfície só deixaria viva a divergência entre a lista e o documento que ela abre.
     **O nome do arquivo não muda**: `aula-01.md` é endereço, e entra na âncora `.fipp`, no `DOCS`
     do `.conf` e nos links internos. **DECIDIDO e implementado** 04/11/2026.

106. **O PO APAGA-SE — E O QUE O TRAVA É O SUCESSOR, NÃO O VÍNCULO.** A linha do Plano de
     Observação oferecia só «Ajustar» porque nunca houve estado, botão nem rota que o apagasse. O
     trio entrou: `estadoDoPo` (o PO é `solta` ou `legado` conforme tenha sucessor), `DELETE
     /api/po-vinculo/:id` (409 quando derivado, nomeando o sucessor) e o botão na listagem. **Nada
     referencia um PO** — o ciclo gerado guarda a sua própria cópia (`po-01.json`, `-po.md`) —, e é
     por isso que a trava «está vinculado», que o plano de ensino tem, não existe aqui. **DECIDIDO e
     implementado** 04/11/2026.

107. **O LAYOUT DA COLUNA NÃO DEPENDE SÓ DE `:has()`.** As cinco regras que põem a barra ao lado da
     coluna, dão os 248px de margem ao `body` e trocam a lista pelo ☰ existem **duas vezes**: com
     `body:has(> .coluna)` e com `[data-tem-coluna="sim"]`, escrito pelo `assets/nav.js`. `:has()`
     não existe no Firefox ESR 115, e sem ela o menu deixa de receber cliques (a coluna cobre os
     primeiros 248px da barra) — medido. **As duas versões ficam em REGRAS SEPARADAS**: um seletor
     inválido numa lista descarta a lista inteira, e o remendo cairia com ela. `:has()` mantém-se
     onde existe, para a regra valer antes de o script correr. **DECIDIDO e implementado** 04/11/2026.
108. **A SENHA É PRÉ-REQUISITO DE GRAVAR, NÃO DE ENTRAR — E «NOVO REGISTO» FALTAVA NA LISTA.** O
     `podePreencher` isenta de senha a edição e a derivação (`emEdicao = EDITANDO || DERIVANDO`),
     porque entrar não escreve nada. O `?novo=` da anamnese (`DUPLICANDO`) é o terceiro gesto da
     mesma família e ficou de fora: o formulário era pintado e a mesma trava, um instante depois,
     devolvia a pessoa à lista — «pisca e trava e volta». A mesma omissão existia no servidor
     (`PARAMS_DO_ATO` tinha `editar` e `ajustar`, não tinha `novo`). **DECIDIDO e implementado**
     05/11/2026: `emEdicao` inclui `DUPLICANDO`, e `novo` entra na lista de permissão do `302`.
109. **O CICLO TEM A FORMA DO QUE A FONTE FAZ.** A anamnese **não tem** campo de ciclo (ele sai da
     página, não fica escondido: um campo com `display: none` continua no documento e no leitor de
     ecrã); o plano de ensino trava no **próximo** número (ele cria um ciclo); e o PO é uma **lista
     dos ciclos que já têm plano de ensino** (`GET /api/ciclos` → `comPlano`), porque não se observa
     um ciclo sem plano. O `<input>` do PO é trocado por um `<select>` na fonte, com o valor do
     documento transferido; um PO cujo plano foi apagado continua a abrir no ciclo dele.
     **DECIDIDO e implementado** 05/11/2026.
110. **O REGISTO CONDENADO NÃO SE LÊ ENQUANTO A ROTA RESPONDE.** Apagar dispara uma Action no
     GitHub, e entre o clique e a resposta a linha continuava visível e interactiva — dava para
     abrir, ler e tentar ajustar um documento que estava a ser destruído. A linha passa a ficar
     **trancada** (`data-apagando` + `inert` + `aria-busy`) até a resposta chegar, e um 409
     **destranca** com o motivo escrito: um registo que existe e não se pode abrir é pior do que o
     defeito. **DECIDIDO e implementado** 05/11/2026, com peça nova na folha
     (`[data-apagando="sim"]`: véu, fio «apagando…» e spinner) e motivo declarado em
     `CONGELAMENTO.md`.
111. **A MOLDURA NUNCA FALTA — E ELA É UM ENQUADRAMENTO, NÃO UM SUBSTITUTO.** A barra e a coluna
     existem em 100% das telas que o Worker serve. A causa do desaparecimento era de mecanismo:
     `nav.aplicar` SUBSTITUI uma `<nav class="topnav">` que já exista, e a porta traz o marcador
     `<!-- NAV -->` (que a GERAÇÃO substitui — mas a porta é copiada). Num pacote que ficou com o
     marcador, `aplicar` devolvia `null` e a ponte servia a página nua: medido ao vivo, a porta com
     0 barra e 0 coluna, a listagem ao lado com as duas. `nav.enquadrar` cobre as três formas
     (barra existente, marcador, documento sem moldura) e é **idempotente**; a ponte
     (`comAparencia`) usa-o em toda resposta HTML e a montagem (`montar-publicacao.js`) enquadra a
     porta ao publicar. **DECIDIDO e implementado** 05/11/2026.
112. **OS TRÊS FORMULÁRIOS SÃO MOLDURA, E NÃO CONTEÚDO.** «Anamnese do aluno», «Plano de ensino» e
     «Plano de Observação» entram no menu de TODA escola, inclusive na recém-criada, sem turma
     nenhuma (era `if (turmas.length)`): a anamnese é o instrumento de ENTRADA (vem antes de haver
     turma) e o plano de ensino é o que CRIA o ciclo. O que continua dinâmico é o resto — «Aulas» e
     os documentos do ciclo nascem com o ciclo. **DECIDIDO e implementado** 05/11/2026.
113. **UMA BANCADA QUE CONSTRÓI O QUE DEVIA ENCONTRAR NÃO MEDE NADA.** A `provar-menu-do-formulario`
     media as telas de formulário aplicando o menu à mão (o mesmo `aplicar` da ponte) e dava 40/40
     sobre uma página sem moldura em produção. Passou a servir a porta pela ponte
     (`producao.fetch`). A regra: **quem aplica a moldura é quem serve, e é isso que se mede**.
     **DECIDIDO e implementado** 05/11/2026.
114. **A RELAÇÃO PE → PO É DO SERVIDOR, E NÃO DO MENU.** O menu suspenso com os ciclos que têm plano
     (`GET /api/ciclos` → `comPlano`) é conveniência; a REGRA — «o PO só nasce sobre um plano
     existente e do mesmo ciclo» — passou a ser imposta em `POST /api/elicitar`
     (`recusaDaRelacaoDoCiclo`), antes de qualquer gravação: (1) o plano declarado existe;
     (2) o ciclo do PO é o ciclo do plano; (3) sem plano declarado, o ciclo tem de ter plano. E a
     sequência estrita do plano: um plano novo só é do PRÓXIMO ciclo ou de um ciclo que já existe
     — a edição e o elo novo continuam um ciclo, e o `id` só isenta se o documento existir.
     Medido antes: os dois casos davam **200**. Sem leitor do acervo a rota SEGUE (não acusa o
     professor por uma limitação de quem mede), e a simulação passa. **DECIDIDO e implementado**
     05/11/2026.
115. **APAGAR UM REGISTO LEVA O CICLO QUE ELE PRODUZIU — EM CASCATA, E SÓ O DELE.** O `DELETE` do PO
     apagava o **envelope** e mais nada: o pacote do ciclo (o `index.html` que o menu lista, o
     plano, a aula, o lançamento, a captura, os PDF, as referências), o `.conf` da variante e as
     âncoras ficavam inteiros, e a cadeia devolvia o elo anterior à lista — «não sumiu». A cascata
     é a rotina da Produção (`apagarCicloDoRepo`, guarda do último ciclo), agora ligada ao gesto da
     listagem, com a **ordem** como garantia: cascata primeiro (se recusa, nada é apagado), os
     envelopes dos POs do ciclo pelo acervo depois (modo `soOProduto`, porque o `.indice.json` tem
     um dono só), e o envelope pedido por último. A anamnese e o plano de ensino não vão atrás — o
     plano fica **livre**. Sem repositório, o envelope sai e a resposta **diz** que o ciclo ficou.
     A sequência é da TURMA (a variante): dois ciclos de variantes diferentes são sequências
     independentes. **DECIDIDO e implementado** 05/11/2026.
116. **O «PONTO DE EXCLAMAÇÃO» NO ACTIONS NÃO ERA FALHA.** Apagar um registo não é um workflow: é
     um commit que o Worker faz pela API. O que aparece com o título do commit é o `Regerar os
     índices`, e o estado é **cancelado** — o commit de índice que ele próprio produz dispara uma
     execução nova, e o `concurrency: cancel-in-progress: true` cancela a anterior. A derivação é
     idempotente e sem estado, e o estado final converge (verificado no remoto: os envelopes
     saíram e o índice ficou sem eles). **Não se muda** o workflow: mudar um mecanismo justificado
     para o ícone ficar verde é tratar o sintoma. **CONFIRMADO** 05/11/2026.

**A medida não é o repertório — e o objetivo 3 não tinha sujeito (03/11/2026).** Ela abriu um plano
novo, com **dois** objetivos, e a sequência mostrou «*Port de Bras*» em três blocos e uma linha a
nomear um **terceiro** objetivo. A hipótese dela era *mock data*, e a hipótese era razoável — mas
**não havia fixture**: o `wiring` da publicação não alcança a pasta de testes. O que havia eram duas
portas abertas na mesma derivação. (1) A coluna «Conteúdo do nível» lia `l.marcados` da matriz do
«Parâmetro de medição» **sem o conferir contra a curadoria** — e essa matriz aceita **qualquer**
termo, porque **medir não é curar**: o que se mede num exercício pode ser uma qualidade que a
curadoria não previu como exercício. (2) A matriz dos **blocos**, que produz as sementes, não era
filtrada pelos objetivos vivos: `marcos[n - 1] || ''` deixava passar um `marco` fora de `1..total` e
desenhava a linha com o rótulo «3» e **sem texto de objetivo**. **CONFIRMADO** por reprodução em
JSDOM, com a curadoria da turma reduzida a **Battement tendu** e **Plié**. **DECIDIDO**: *o conteúdo
de um exercício da aula é o repertório curado da turma, e só ele*; uma medida fora dele é a medida de
um exercício que já existe, e o sítio de a acordar é a **Curadoria**. A regra é uma e mora em
`motor/nucleo/sequencia.js` (`linhaForaDoRepertorio`, `linhasDoRepertorio`), consumida pelos **três**
sítios que publicam a aula: a tela, o `.md` do plano e a `aula-01.md`. A segunda metade — **sem
sujeito não é linha** — é a de `linhaOrfa`, agora aplicada também à matriz dos blocos.

**Três reservas, e as três são para não repetir o erro de sumir com o dado.** Sem repertório
carregado **não se julga** (apagar o que não se pode conferir seria a limpeza a destruir o dado); o
que fica de fora é **dito** — o rodapé nomeia o termo e aponta a Curadoria —; e a **lacuna não se
pune**: o objetivo sem exercício curado mostra `—`, a coluna continua travada, e o caminho legítimo
de ter mais é a marcação no parâmetro ou a curadoria. **CONFIRMADO** pela §7 da prova, que tem os
**dois controlos negativos**: curado o «Port de bras», os três exercícios dele aparecem; de volta o
terceiro objetivo, a linha do bloco dele volta.

**E o estado dela sobrevive em dois sítios que não são ficheiros** — vale escrevê-lo, porque é a
explicação provável de metade dos «fantasmas». O rascunho do plano vive no `localStorage` do
navegador (um plano novo, no mesmo navegador, herda as respostas do anterior) e a matriz do parâmetro
é uma grade de caixas: o que se marcou uma vez fica marcado até alguém desmarcar. **HIPÓTESE** — não
confirmada com ela. É a razão pela qual o remédio foi **filtrar na derivação**: é o único sítio por
onde todos os valores passam.

**O registo SOLTO edita-se e apaga-se; o VINCULADO só se ajusta (03/11/2026).** O «Apagar» tinha
sumido da listagem do plano — a estante antiga da porta tinha-o, e a migração para a página da Área
do Professor trouxe o «Editar» e deixou-o para trás. **CONFIRMADO** na página publicada da `breu`:
o plano solto mostrava um único `class="acao"`. E na anamnese ele era um `<a>` para o **mesmo
endereço** do «Editar», ou seja, um botão que prometia o que não fazia. **DECIDIDO**: o gesto é
**botão** (um `DELETE` não tem página de destino), exige a senha já conferida no painel, nomeia o
sujeito na confirmação, e **quem decide continua a ser o servidor** — o vinculado e o derivado não
têm o botão **e** o `DELETE` responde 409.

**Três defeitos no caminho, nenhum deles o pedido.** (1) A **rota relativa** não chegava: as rotas
de escrita vivem no roteador da porta, servido debaixo de `/anamnese` e `/plano-ensino`; relativa,
resolvia para `/area-do-professor/plano-ensino/api/…` — **404**, medido. (2) O **`apagar` do
acervo** exigia `GITHUB_TOKEN` e respondia **500** enquanto o `guardar` caía no armazenamento antigo:
assimetria invisível enquanto ninguém apagava, e que o botão tornou alcançável. (3) O `\n` da
confirmação, escrito no literal de template que gera o `<script>`, virava uma **quebra de linha
real** dentro de uma string — e o script da página inteira parava com `SyntaxError`. O escape
atravessa duas linguagens, e é preciso escrevê-lo duas vezes.

**A senha só é conferida no cliente, e isso é uma fronteira por nomear.** A rota `DELETE` não pede
senha (nunca pediu), e o Worker não tem sessão: a Área do Professor é protegida **pelo endereço**,
não por credencial. **PENDENTE**, e é decisão de segurança — não de tela.

**A sequência não inventa linha — o repertório nasce na curadoria (03/11/2026).** Ela corrigiu, horas
depois, o que eu tinha decidido na mesma sessão: **o «Adicionar linha» e o ✕ saem**, os dois. O
argumento é dela e é de negócio: «a curadoria ela é um plano também. Ela faz parte do que foi
acordado por um comitê de professores ou o diretor da escola e o professor. […] Isso quebra toda a
nossa regra de negócio, porque a gente tá gerando uma fraude. Não foi curado isso.» A origem é
descrita por ela com precisão — o exercício **nasce nos bastidores** (o verbete, com a música e o
compasso), é **acordado na curadoria** para aquela turma, e esta tabela é onde ele se **encontra**
com o objetivo e o bloco. **DECIDIDO**, e a justificativa que eu tinha dado para o ✕ («havia como
acrescentar e não como remover») estava certa na assimetria e errada na conclusão: o certo era não
haver nem um nem outro.

**O que saiu, e o que ficou no lugar.** Saíram os dois botões, o **campo livre** do «Conteúdo do
nível» (a mesma fraude por outra porta — escrever ali um exercício que não foi curado) e o `extras`
da derivação. Este último tinha um argumento que parecia bom — «não se perde o que o professor
escreveu» — e um pressuposto falso: **ele não pode escrever nenhuma célula desta tabela**. O que
sobrava era semente de uma sessão anterior. A célula derivada passou a ser **sempre** leitura, e a
lacuna mostra-se como lacuna (`—`). **CONFIRMADO** pela §5 da prova, que mede as três ausências e
tem **controlo positivo**: marcar um exercício a mais em «Parâmetro de medição» acrescenta as linhas
dele em cada bloco onde o objetivo é trabalhado — o caminho legítimo continua inteiro.

**O rodapé diz de onde a linha vem, e distingue as duas tabelas.** A sequência aponta a curadoria
como o sítio do repertório; a **distribuição do volume** — que também recebe as linhas dos blocos
marcados, mas onde a **proporção se escreve** — mantém a frase dela. A distinção é por **forma**
(`linhasDe.de`), não por id, e a prova mede as duas: uma mensagem só para as duas telas seria meia
verdade numa delas.

**A sequência acompanha os objetivos — e a pergunta «é mock?» teve resposta medida (03/11/2026).** A
tabela «Sequência de exercícios por bloco» mostrava linhas a nomear os objetivos 2 e 3 depois de a
lista ter ficado com **um**. **CONFIRMADO** no envelope dela (`plano-20261103-1644`): um objetivo e
**oito** linhas guardadas. E **não havia fixture**: a pasta `teste/` só é lida pelos bancos de
`experimentos/`, e o `wiring` da publicação (`tools/montar-publicacao.js` → `publicacao/breu` →
`wrangler.breu.jsonc`) não a alcança — o «lixo» era o que o próprio sistema tinha escrito. O bloco
estava certo (o solo saiu quando ela o desmarcou); o que ficou preso foi o **objetivo**. A linha de
um objetivo que não existe **não é memória** — a coluna é `somenteLeitura` e quem a escreve é o
sistema —, e a autoria da semente vivia num `Map` que morre com a página. **DECIDIDO**: a linha sai,
a regra é uma só (`motor/nucleo/sequencia.js`) e serve a tela, o `.md` do plano e a `aula-01.md`.

**A chave pelo NÚMERO, e é o segundo defeito do mesmo nó (03/11/2026).** A linha era reconhecida pelo
rótulo **inteiro** do objetivo; corrigir a sua redacção fazia a linha gravada não casar com a semente
e a tabela mostrava **duas** linhas do mesmo objetivo — a segunda com o texto velho e o «Conteúdo do
nível» outra vez por escolher. Era **esse** o «campo aberto/vazio» que ela relatou: o mesmo defeito
visto de outro ângulo, não um segundo. **CONFIRMADO** pela §4 da prova, e a correção é o número.

**O ✕ passou a existir, e a trava da senha deixou de o acender (03/11/2026).** Havia como
**acrescentar** uma linha e não como removê-la (`removivel: false` com `acrescentavel: true`) —
**DECIDIDO**: o ✕ existe, apagado nas linhas derivadas. E por baixo apareceu a razão de ele nunca ter
valido: `travarFormularioSemSenha` escrevia `disabled = trava` em *todos* os controles e, ao
destravar, `false` em *todos* — o ✕ acendia no instante em que a senha era validada. O mesmo com o
«−» do primeiro objetivo. Os controles travados por regra passam a ser marcados no desenho
(`data-travado-de-origem`). **CONFIRMADO** pela §5.

**A metodologia deixou de se perguntar dentro do plano (03/11/2026).** O Bloco 1 pedia duas coisas
que a curadoria já responde: «Metodologia de referência» (campo obrigatório) e «Quem escolhe a
metodologia» («Eu escolho · A escola impõe»). **O segundo deixou de existir**, e a razão não é
limpeza de tela: a resposta passou a ser **premissa do domínio** — **o professor escolhe, a
metodologia pertence ao professor**, como a modalidade —, e um facto que não varia com o ciclo não
se pergunta ciclo a ciclo. Perguntá-lo sugeria que podia variar. **O primeiro passou a leitura do
cabeçalho** (`noCabecalho: true` + `daCuradoria: 'tradicao'`), junto da escola, da turma e do
ritmo: **DECIDIDO**, e a maquinaria era a mesma que já existia — faltava a **origem**, porque havia
`daTurma` e não havia `daCuradoria`. O valor continua a ser **semeado no envelope**, e é a parte que
uma limpeza apressada teria perdido: é dele que o `.md` do plano e o PO o extraem. **CONFIRMADO** por
`provar-metodologia-no-cabecalho` (20 asserções, 5 secções, com controlo negativo: sem curadoria
não se inventa nada).

**Duas coisas que a tela mostrava e ninguém tinha visto.** `daCuradoria()` só sabia percorrer
listas — e o `for…of` de uma **string** percorre os **caracteres**: a tradição `francesa` chegava
como `f`, e o cabeçalho diria «Metodologia de referência: f». Estava latente desde que a curadoria
existe; nenhum leitor lia um campo escalar até esta volta. E os **rótulos** das tradições
(`francesa` → «Francesa») vivem em `tradicoes.json` e não chegavam à porta: passaram a vir na
**mesma resposta** de `/api/bastidores/curadoria-professor` (`rotulos`), e não numa rota nova — é o
mesmo ficheiro, é o mesmo pedido, e uma segunda leitura seria uma segunda cópia do mesmo mapa a
divergir.

**O formulário da curadoria promete só o que existe (03/11/2026).** A lista de conteúdos passou a
ser a dos **exercícios com notação** — um verbete com música e, dentro dela, ao menos um trecho —,
e não o vocabulário inteiro: eram **93** palavras para **duas** decomposições, e a lista cresce ou
encolhe sozinha com o alfabeto. **CONFIRMADO** por `provar-curadoria-e-limpeza` §A (a expectativa
derivada do alfabeto público) e pela §D (controlo negativo). Os **oito rótulos** do formulário
vestem a mesma peça, e o formulário perdeu as instruções e os estados vazios escritos por palavras
— **ficou o feedback que informa**, nove blocos contados na §E.

**O plano foi gravado, e a frase que dizia o contrário está corrigida (03/11/2026).** O primeiro
**plano de ensino** existe: `escola/breu/envelopes/plano-20261103-1644.json` (commit `b349c562`),
com o `-plano.md` derivado (`342c3ad6`) e o `.conf` da variante (`817229ff`) — a turma «Balé Nível 1
— Teste 3», o repertório da curadoria (`Battement tendu`, `Plié`, `Port de bras`) e as 27 respostas
validadas contra o contrato. **CONFIRMADO** no remoto. O que **não** existe é o **PO** — o segundo
acto, que pede esse plano —, e sem PO não há documentos. **PENDENTE**, e é o próximo passo dela.
O `GITHUB_TOKEN` do `.dev.vars` responde **401**, mas o Worker gravou: o caminho que a página usa
funciona, e o valor morto é o da bancada local.

**Um efeito da lista nova que é preciso dizer.** Um exercício entra no menu **no instante em que
ganha o primeiro trecho** — no alfabeto do repositório. Mas o Worker serve o alfabeto **embutido no
bundle**: o verbete criado pela Produção chega ao repositório e **só aparece no menu depois do
deploy** (o `deploy-escolas` dispara com `biblioteca/modalidades/**`, e é por isso que ele chega).
**CONFIRMADO** por leitura de `motor/nucleo/notacao.js` e do filtro de `paths` do workflow.

**A curadoria existe e o plano já a lê; o que falta é GRAVAR (03/11/2026).** A verificação a pedido
mediu o estado, elo por elo, e a resposta curta é: **a curadoria está registada**, o `repertorio`
dela (`Plié`, `Battement tendu`) já chega ao formulário do plano pela coluna «Conteúdo do nível», e
o ritmo da turma (qua/sex, 45 min, março a junho) já desce para o plano — **depois da correção
desta sessão**, que desfez um nome repetido em `porta/index.html`. O que **não** existe é o
**plano de ensino** e o **PO**: três medições independentes (o índice do acervo em git, o KV antigo,
e a lista ao vivo) dizem «nenhum». E o PO é o segundo ato — o formulário dele pede o plano de
ensino observado —, portanto a ordem é: **plano → PO → documentos**.

**Por que não foram gravados, e é o que trava agora.** O `GITHUB_TOKEN` do `.dev.vars` está **morto**
(401 em `/user` e na API do repositório). É o valor que `tools/criar-escola.sh --deploy` grava como
secret do Worker, e o que qualquer execução local usa. O token **do Worker** não se lê de fora — a
lista do acervo ao vivo responde com uma leitura limpa, o que é igualmente compatível com «token
válido e árvore vazia» —, mas **nenhuma gravação de envelope foi feita**, e a primeira que se tentar
dirá qual dos dois casos é (a mensagem é «o GitHub recusou a escrita: HTTP 401»). **PENDENTE**, e é
o próximo passo dela.

**A turma ficou só com o ritmo, e a auditoria que ela pediu mudou o diagnóstico (03/11/2026).** O
pedido era «auditar a edição da turma depois da curadoria»: se a turma já compõe uma curadoria, a
edição estrutural devia ser «bloqueada ou controlada». **CONFIRMADO** por leitura da rota e por
prova: o que existia era **meio bloqueio**, e o meio que faltava era o perigoso. A rota recusava
(409) a turma presa a um **plano de ensino** — a `vinculada` —, mas a turma apenas **curada**
continuava a gravar tudo, inclusive o **nome**; e a curadoria guarda o **nome**, não o id. Renomear
partia a ligação em silêncio: sem erro, sem vínculo, a curadoria a apontar para um nome que já não
existia. O defeito não era o botão que faltava — era a **assimetria** (o professor tinha três
estados, a turma tinha dois). Hoje há três nomes (`motor/nucleo/estado-da-turma.js`: `livre` ·
`curada` · `vinculada`), uma função que diz **por que** não se edita, e três leitores que a
consultam: a rota `turma-editar`, o `DELETE` e o cartão. **A turma curada não se apaga nem se
trava**: edita-se no lugar o que não parte a ligação, e renomear pede sair da curadoria primeiro.
A derivação continua a preservar a ligação, porque `turma-derivar` mantém o nome.

**O que saiu do cadastro nesta volta.** A **nota** da turma (não é usada na operação; o campo
deixou de ser copiado e o que está gravado fica) e os **conteúdos** — que eram o último resto do
enquadramento ali. A associação do conteúdo passou para o formulário da **curadoria**
(`#esc-conteudos`, o mesmo `escolhedor` das alunas, com o **nome** do termo como valor). Nada se
perde: `motor/nucleo/conteudos.js` **compõe** o mapa antigo (`turma-conteudos`, que continua a ser
lido) com o `repertorio` de cada curadoria, normalizando os dois lados pelo mesmo `idDe` — e o
cartão da turma continua a mostrar a lista. **O mapa antigo não se migra: lê-se.**

**O formulário da curadoria passou a ser inteligente.** As **modalidades** filtram-se pelas
habilitações do `perfil.json` do professor (e a nota diz quando o perfil não declara nenhuma: «o
professor não declarou modalidades»), e a **tradição** segue a modalidade. `motor/nucleo/tradicoes.js`
guarda a precedência — **a lista própria da modalidade vence a compartilhada** — e, quando a
modalidade **não tem** lista própria, cai na compartilhada: a regra nova não pode trancar o que já
funcionava (jazz, circo e contemporâneo continuam curados, e a tela diz que a lista é a
compartilhada). **NENHUMA modalidade tem ainda o seu `tradicoes.json`**: os nomes das tradições de
cada uma são **conteúdo dela** (P-16), não do agente. **PENDENTE.**

**O motor dos produtos está a meio, e o que falta é de conteúdo dela (02/11/2026).** O
`PLANO-PRODUTOS-DO-MOTOR` tem seis fases; a **2** está feita para **dois dos três** produtos
(dicionário e syllabus), com prova e CLI. O ponto exacto de continuidade:

- **A aula pronta** (o terceiro produto) não foi começada: ela é a **Regra 9** (norma congelada)
   aplicada ao nível, com o teto da faixa e os tempos de cada unidade. Depende dos verbetes e do
   conteúdo — e é a próxima peça de código.
- **A fase 1 passou a valer para os dois ficheiros, e o critério 5 fica na substância.** O **termo**
  declara o dono (`escola`), e o **verbete** passou a declarar o seu — por decisão dela a 03/11/2026,
  «o dono do alfabeto é a escola»: o registo do catálogo fica com a chave da música (`8|4/4`), o de
  uma escola leva o dono ao lado (`8|4/4@breu`) e o campo `escola` dentro, como no vocabulário. A
  precedência é uma só (`registosDaEscola`, no núcleo) e é lida pela **composição do documento**,
  pela **listagem** e pelos **produtos**: a `breu` compõe o seu texto, o catálogo e as outras escolas
  compõem o do catálogo — medido em `provar-musica-do-verbete` §C. **O ficheiro continua a ser um**:
  um caminho por escola não se embute no bundle do Worker, e é isso que mantém o critério 5 a passar
  **na substância** e não ao pé da letra.
- **A tela acompanhou a leitura.** A notação da listagem passou a três colunas — a definição do
  exercício uma vez, no topo, e a contagem com a frequência escrita —, e cada trecho do passo 6 é
  agora uma dobra fechada. Não é enfeite: com oito trechos, a versão de antes punha dezasseis
  parágrafos de prosa aberta entre o professor e o «Gravar».
- **A leitura acompanhou o dono, e esse era o último elo.** Com o alfabeto a ter dono, a listagem
  compunha com o alfabeto **embutido no build** e **sem `escola`** — e, quando a composição falhava,
  atirava fora os trechos gravados para mostrar o erro. A leitura passa a receber o alfabeto **lido**
  e a escola, cada música traz o seu `motivo`, e a composição parcial é um estado declarado em vez
  de uma frase única de falha. É o que torna visível, na tela, o que a fase 1 decidiu no núcleo.
- **A fase 3 (manifestos e pacote)** não começou. O produto tem manifesto em memória (`id`,
   `versao`, `edicao`, `licenca`, `fonte`) e **não tem âncora** — a `.fipp` própria é da fase 3. O
   campo `licenca` já **não** sai «pendente»: vem do título de `biblioteca/LICENSE.md`, com o caminho
   ao lado.
- **A fase 4 (distribuição por plano)** já sabe **o sítio** do `plano` — um ficheiro declarativo do
   repositório, nunca o KV (C11, 02/11/2026) —, e espera que a chave exista; a **5** (índice dos
   produtos) depende da 3.
- **A camada pedagógica tem lugar e não tem conteúdo.** O motor lê `exige` · `ensina` · `expressa`
   em **dois** sítios — o padrão no **termo** (`vocabulario.json`) e a sobreposição na **relação**
   (`progressao.json`), com a relação a vencer — e **escreve de onde veio** cada um. Os três nomes
   são dela (`PLANEJAMENTO-LASTRO.md` §C22) e o **lugar** foi decidido a 02/11/2026 (herança com
   sobreposição, ver §8). Hoje, **0 das 9 unidades** têm qualquer dos três — a lacuna é de conteúdo,
   e o documento diz `[Preencher]` em vez de a inventar.

**O segundo trabalho desta secção morreu, e é notícia boa:** o «plano da Batata vai ser refeito
porque o envelope perdeu Arabesque e Jeté» e o «expurgar a Batata» aconteceram — a Batata foi
expurgada e recriada, o `pe-junto` recebeu a turma `Balé Nível 1 — Teste 2`, e o ciclo existe e está
publicado (`e8a1700` e seguintes). O que resta é **um** trabalho em andamento, de código.

O que continua: a **Fase 1** do plano
(`PLANO-VERBETE-E-MUSICALIDADE.md`): o alfabeto mudou de casa e a âncora sela com que código
escreveu; o verbete ganhou posição, direção e lado; o CRUD está na Produção; o exercício é escolhido
de uma lista e o «+» cria-o no vocabulário do repositório; o formulário tem **dois modos** e a
**direção é derivada** da célula; e o **editor de célula** já cria a decomposição que faltava — sem
ele, «Gravar verbete» recusava criar o que não existisse (eram 55 exercícios para 4 verbetes). Das
**seleções no plano** (§1.6) ficou feita a primeira, e é a que se via: os **tempos e o compasso** do
«Sequência de exercícios por bloco» deixaram de ser perguntados — vêm do verbete, travados quando ele
declara uma música só e em escolha quando declara várias —, porque juntos são a **chave do verbete** e
pedi-los outra vez era a mesma redundância da quarta coluna. As outras três (`Posição`, `Direção`,
`Orientação`/`Lado`) continuam por fazer: hoje o motor lê-as do **verbete**, não do plano, e mexer
nelas muda o que o documento publica. Falta ainda a decisão dela sobre essa fronteira. O **bloco por pílulas** deixou de faltar: desde `9b318fe` não há
nenhuma lista suspensa no trecho, e a notação compõe-se de cliques. E a **arrumação do formulário**
deixou de estar em aberto: ela viu as duas bancadas e escolheu **os passos** — «o Step, apesar de ter
mais cliques, ele é mais fácil de entender» —, e o formulário passou a passos, um de cada vez, com o
trecho **editável** (`d7e71ff`). Desde 02/11/2026 são **seis**, e o primeiro é o **exercício novo**:
o «+» que abria o cadastro deixou de existir e criar o exercício é o passo. A **arrumação** também já não está em aberto: a 01/11/2026 ela pediu o contrário do
que se tinha feito a 31/10 — **o formulário volta ao padrão** (à esquerda, com a listagem presa à
direita) e a **tira dos passos sai para fora do `<form>`**, modelo da turma. Com a tira fora, os sete
passos ficaram **cinco**: o exercício, a frase e a posição são um só (`b0d781f`), e o alfabeto ganhou
**três verbetes de ensaio** (Grand battement, Arabesque, Rond de jambe à terre) para ela poder testar
sem escrever do zero — **versão 9**, selo renovado.


**O que ficou feito a 01/11/2026 (`ac6caa0`), e o que é o próximo passo.** O **P0** da revisão das
janelas deslizantes está fechado: o `;` separa os itens do PO, e os dois critérios que caíam numa
coluna são duas. O **bloco 10** do plano deixou de perguntar o que já estava respondido (a música e o
repertório), e a sequência passou a semear-se sozinha. O que falta é o **P1 — a ligação
bloco ↔ dimensão por id**: ela decidiu que `objetivosEspecificos[].blocos` (`Solo · Barra`) e as
dimensões do PO (`Técnica — Solo`) são **a mesma coisa com dois nomes**, e que a ligação é **por id**.
O recorte **já existe** no plano; o trabalho é **ligá-lo** e fazê-lo chegar ao formulário — e é
**ligação**, não invenção. O plano por fases está na resposta desta sessão e no `TRANSFERENCIA-IA.md`.

**O que ficou feito a 02/11/2026, na Aula 01 (§ secções 2, 4, 6 e 8).** A aula deixou de afirmar o
que ninguém escreveu: a §2 dizia «força e flexibilidade» sobre o campo da sala (o título vinha da
Regra 4, o corpo do formulário), a §4 tinha um «Pulso» fixo, a §6 chamava «simulado» a um ciclo
publicado e a §8 era um `[Preencher]` mudo. A **proveniência** passou a ser dois **links** com o
objetivo de cada documento ao lado (o `id` do envelope não leva a lado nenhum), o **próximo passo**
passou a dizer o **estado** em vez de explicar o conceito, com os três casos (sem marco seguinte, com
marco e sem Aula 02, com marco e com Aula 02 — aí com link), e a **musicalidade** passou a
**consolidar** o que o verbete e a sequência já dizem. De caminho: o bloco 10 do plano deixou de se
chamar «música e repertório» (são dois, com blocos próprios), a descrição fixa do verbete subiu para o
cabeçalho do exercício uma vez por igualdade medida, a **força e a flexibilidade** chegaram ao item 11
do PO vindas da anamnese, e a **geração ficou reproduzível** (o `gerado_em` vem das fontes; o `/ID` do
PDF está fixo). Novo `tools/regerar-derivados.js` põe as fontes derivadas em dia a partir dos
envelopes — mostra o que muda e só grava com `--escrever`.

**Último ponto confirmado:** 02/11/2026 — `d74fda1` (a musicalidade consolida-se, e a prova da porta
volta a correr), com `cf1ef52` (a força e a flexibilidade vêm da anamnese), `469c9d5` (a proveniência
leva a algum lado) e `03be290` (a aula deixa de afirmar o que ninguém escreveu) por trás. Antes deles,
`e27e462` (o molde dos schemas passa a ter um leitor só), `570d900` (o molde volta a dizer o que a
derivação escreve), `a5275c3` (a seta sobe ao título, os passos descem à linha inteira) e `ea6cd0d`
(o exercício passa a nascer só no «+» do verbete).
A série anterior: `ac6caa0` (o que a sequência já responde não se escreve outra
vez, e o `;`), com `22b42ce` (o conteúdo da porta no scaffold), `b64bac4` (o registo do número do
roteiro) e `10bf6b6` (a correcção) por trás. Antes dele, `b0d781f` (a tira dos
passos sai do formulário, e o verbete fica em cinco). Antes dele, `885ea96` (os tempos e o
compasso vêm do verbete), `d7e71ff` (o verbete em seis passos, com o modo de edição) e `c3f0fb1` (o
plano diz por que um termo da turma não aparece). A base anterior: `b641acc` (o «lê-se»
dentro do campo e a quarta coluna fora), `48f43e2` (as definições no vocabulário), `9fb09dc` (a folha,
com motivo declarado), `4f4795a` (os dois modos, a direção derivada e o editor de célula). O
`GET /api/bastidores/termos` ao ar respondeu **200** com **87 termos** em 28/10/2026, 12 deles com
`membro` — campos que só existem no bundle atual, e que provam que o vocabulário servido é o do
repositório; o vocabulário do repositório tem hoje **93 termos**, e o ar só se confirma no deploy.

## 8. Pendências e dúvidas

### A modalidade mora no professor — IMPLEMENTADO a 03/11/2026, e o que resta

**As três perguntas que estavam abertas foram respondidas por ela no mesmo dia, e estão
implementadas:** a habilitação vive em `professores/<slug>/perfil.json` (nasce com a escola, edita-se
em **Bastidores · Produção → Professores → Habilitações**, e o expurgo **não lhe toca**); a turma
cuja modalidade o professor deixou de ter **não se apaga** — fica `descontinuada`, com data e motivo,
e a marca é **revogável**; e os níveis são **da turma**, com a forma da **tradição** (`grau` +
`nivel`, RAD numerada, as outras por graus). A análise completa está na **§2.2 da
`ARQUITETURA-GERAL.md`**.

**O acoplamento do código está a ZERO (04/11/2026).** Os literais de modalidade saíram: há **um único
ponto de derivação** (`modalidadePrincipal()`, em `motor/nucleo/perfil-do-professor.js`), do qual
`MODALIDADE_PADRAO` é **derivada**; a página da Produção lê `modalidadeDoCatalogo()`; e o CLI, o
`termo-repo` e o `notacao` leem a mesma origem. O número medido foi **29 ocorrências em 8 ficheiros**
— e não os «10 sítios» de 03/11: contavam-se blocos de código, e um só bloco da Produção continha
dois literais. Dos 29, **6 decidiam comportamento**; os outros eram comentários e `require`s.

**O que ainda falta — e não é acoplamento, é CONTEÚDO:** o sistema tem **uma** modalidade com
repertório (`biblioteca/modalidades/bale-classico/`). Um professor habilitado em «jazz» **vê** a
habilitação, e a escola **oferece-a** por derivação, mas não há repertório de jazz para oferecer —
porque nenhum foi escrito. O que resta não é refactor: é escrever o alfabeto de cada modalidade. A
regra que impede a recaída está dita no `ARQUITETURA-GERAL.md` §2.3 — *um literal de modalidade não
se escreve em `motor/`*.

### Nada valida os pacotes que já estão no repositório (04/11/2026)

**O `check-pacote` corre no FIM do gerador — nunca sobre o que está versionado.** Um pacote entra no
`main` quando é gerado, e a partir daí nenhum workflow olha para ele. O resultado, medido hoje:
`professores/coqui-de-redinha/ciclos/ciclo-01-breu` (12 ficheiros, versionados) reprova com **11
erros** — sem PDF, sem aulas (`aula-NN.html`), sem `-dados.json`, e com cinco ligações do
`index.html` para ficheiros que não existem. É um pacote de um formato anterior ao schema atual, e
ninguém sabe porque nada o pergunta.

**O que falta decidir, e é dela:** regerar (perde o que o pacote antigo guarda), **arquivar**
(tirar do caminho e dizer porquê), ou **aceitar como legado declarado** (uma lista de excepções com
data). O que não serve é o estado actual — um validador que só valida o que acabou de nascer.

### A decisão original, como foi tomada (contexto)

**DECIDIDO por ela a 03/11/2026.** A modalidade **nasce da competência de quem ensina**: uma escola
só oferece balé clássico porque tem quem o saiba ensinar. Pô-la na escola faria o contrário — a
escola declararia uma competência que ninguém lá tem, e o clássico viraria atributo do **edifício**
em vez do **ofício**. A escola **herda por derivação** (a união das habilitações de quem lá dá aula),
não por campo copiado.

| O quê | De quem é | Onde vive hoje |
|:--|:--|:--|
| O **conhecimento** (alfabeto + vocabulário) | da **modalidade** | `biblioteca/modalidades/<slug>/`, partilhado e versionado |
| A **habilitação** (que modalidades este professor ensina) | do **professor** | **não existe** — nenhum registo tem o campo |
| A **oferta** (o que a escola tem à venda) | **reflexo** das habilitações | **não existe** |
| A **escolha na aula** (que metodologia aquele ciclo segue) | do **ciclo** | `contexto-metodologia`, no plano (P-16) |

**O que já está feito, e o que falta — medido.** O núcleo tem a porta declarada (`MODALIDADE_PADRAO`
e os dois mapas) e a rota da Produção **já devolve** `modalidade` na resposta. Mas a modalidade está
escrita **à mão em 10 sítios de `motor/`** (dois mapas e o padrão no núcleo, dois no CLI dos
produtos, e cinco na página da Produção). **Esse número é a linha de base** do trabalho de médio
prazo: desacoplar é levá-lo a zero, e `provar-sinais-da-modalidade` §D mede-o. A ausência também
está medida: **nenhum** registo de escola declara `modalidade`.

**O que continua aberto, e é dela** (sem isto o campo nasceria com a forma errada): **(a)** onde vive
a habilitação — `professores/<slug>/perfil.json`, um campo do `.conf` do ciclo, ou o registo da
escola; **(b)** se a habilitação tem **níveis** («ensina até que nível») ou é sim/não; **(c)** o que
acontece a uma turma cuja modalidade o professor **deixou** de ter. A análise completa — com a
tabela do que fica onde e as três consequências — está na **§2.2 da `ARQUITETURA-GERAL.md`**.

### O contrato da camada pedagógica — o nome é dela, o lugar foi decidido (02/11/2026)

O motor do syllabus lê **três chaves**: `exige`, `ensina` e `expressa`. **O nome não é meu:** está no
`PLANEJAMENTO-LASTRO.md` §C22, com as palavras dela («o que ela exige do corpo, o que ela ensina, o
que ela expressa»). O que era meu era o **lugar** — e essa era a dúvida, agora **DECIDIDA a
02/11/2026**: **herança com sobreposição**.

- **o padrão vive no termo** (`vocabulario.json`): vale em todos os níveis;
- **a sobreposição vive na relação** (`progressao.json`): vale só naquele nível, e **vence sempre**.

A razão é a mesma pela qual o «método» do verbete não se repete: o mesmo passo, em dois níveis,
quase sempre **exige** a mesma coisa do corpo e quase nunca **expressa** a mesma coisa. Repetir a
exigência em cada relação faria do dado uma cópia, e a primeira correcção deixaria as cópias a
divergir. Escolher só o termo perderia a variação por nível; escolher só a relação obrigaria a
repetir o que não muda.

**E o documento diz de onde veio** — `(herdado do termo)` ou `(declarado no nível)` —, com a
contagem no manifesto (`camada_herdada` · `camada_declarada` · `camada_ausente`). Apresentar como
«do nível» o que veio do termo seria uma afirmação falsa sobre quem declarou o quê. **Herdar não é
faltar**: só a ausência nos dois lugares vira `[Preencher]` e conta como lacuna.

**O que continua aberto é o conteúdo, não a forma.** 0 das 9 unidades declaradas têm os três — e
declará-los é conteúdo (P-16), não código.

**E uma nota de leitura, que o plano já fez:** os três **não são eixos de medição** (C20) — são
prefixo de rótulo e declaração de programa. Quem mede o aluno mede nas dimensões do PO.

### As decisões sobre a aula — por nome, não por número

De `PLANO-AULA-E-OBSERVACAO.md` §9. **A numeração mudou duas vezes e já atrapalhou a própria leitura**
(a pergunta «a aula herda a sequência ou escolhe?» era a #3, não a #6). Passam a ser identificadas por
**nome** — um nome não deriva.

| Nome | Estado |
|:--|:--|
| **marco** | **DECIDIDO** — a aula **não nasce sem marco**, e o marco tem de ser **explícito**. Pode **repetir** o da aula anterior: repetir é decisão, calar não é. O plano passa a declarar um marco por lugar de aula |
| **fonte** | **DECIDIDO** — «Abrir a aula» cria a fonte `.md` e a folha de captura; o sistema pode escrever fontes |
| **sequência** | **DECIDIDO** — herança mista: herda as 14 linhas, **editáveis**, e pode acrescentar |
| **preencher** | **DECIDIDO** — os três lugares da aula **não são derivados nem perguntados em branco: são PROPOSTOS**. O sistema mostra o valor que já existe e o professor **mantém, edita, cria outro ou acrescenta** |
| **linha de base** | **DECIDIDO** — a aula N compara com o **registo da aula anterior**, alinhada ao PO |
| **materiais** | **DECIDIDO** — **entram no formulário**; a folha impressa mantém as caixas, e as duas superfícies passam a pedir o mesmo |
| **aula-object** | **DECIDIDO** — a aula nasce por um **botão**, e os documentos nascem **vazios**, «pra gente ter o objeto» |
| **sala** | **DECIDIDO** — é do **evento**: não é opcional, mas é **flexível**, remarcável até ao prazo daquela aula |
| **alinhamento** | **PENDENTE** — o passo de confirmação com o PO (peça 7) tem três perguntas próprias: a frequência (por aula ou por ciclo), a consequência de não confirmar, e se o registo entra na âncora de proveniência |
| **referências por aula** | **PENDENTE** — levantada de passagem, **não é requisito**. As referências hoje são do ciclo, não da aula; não existe campo |

**A palavra que faltava no vocabulário do projeto: «proposto».** Havia duas formas de tratar um campo
que já tem valor noutro documento — *perguntar em branco* (perde a origem) e *derivar* (perde a
decisão). A aprovada é a terceira: mostrar o que existe, com a origem declarada, e deixar o professor
manter, editar, criar ou acrescentar. **É a única que torna o delta legível** — e o delta é o que a
memória da aula registra.

**E uma correção de diagnóstico:** a §2.1 do documento de análise — «8 dos 12 itens do contexto estão
também no PO» — **não é defeito**. **DECIDIDO** que a repetição é proposital: o professor elabora o
plano de ensino e o PO em momentos diferentes e precisa dos valores à mão, **só de leitura**. A
análise foi emendada. **CONFIRMADO** que os campos não são editáveis no PO.

### Mudar os tempos apagava a decomposição em silêncio — **RESOLVIDO**, e a solução é o bloqueio

**Era uma pergunta; já tem resposta.** A dúvida, medida 02/11/2026: com as quatro células do `Plié`,
mudar os tempos de 8 para 16 — uma música que ainda não existe no alfabeto — deixava `CELULAS` em
**0** e a cobertura em **0**. Sem aviso e sem «descartar alterações?»: o trabalho desaparecia. As
três saídas propostas eram avisar antes, duplicar em vez de substituir, ou deixar como estava.

**A escolha foi dela, na terceira vez que o assunto apareceu:** «solução bloqueia. Não pode editar
esse campo.» Com uma célula que seja, os tempos ficam **só de leitura** e o compasso **desactivado**
(`aria-readonly` incluído), e a nota diz porque e qual é a saída — o **«Duplicar o exercício»**, que
escreve os tempos e as células na mesma acção e passa por cima do bloqueio **de propósito**.

**Duas coisas que o bloqueio preserva, e que se declaram:** o «Limpar» e o «Apagar» **libertam** o
campo (sem trechos, não há o que perder); e quem quer **outra música** começa outra — a
decomposição de uma música é daquela música, e isso é a decisão **63**, aplicada. **CONFIRMADO** em
`provar-celula` §23-B e §23-D (o campo travado, a nota, e a libertação depois do «Apagar»).

### A métrica da aula — o que falta declarar

A grade de exercícios mostra compasso e contagem, mas **só 1 dos 30 exercícios** os tem (o Plié do
solo), porque o plano os declarou em apenas **3 linhas**. As outras 27 saem em lacuna declarada. Não
é defeito do gerador: o plano só contribui com `Tempos` e `Compasso`, e o resto vem do verbete.

| Nome | Estado |
|:--|:--|
| **port de bras** | **DECIDIDO** — são **18 tempos, 3/4**. O verbete cobre **12** (4 compassos); os **2 últimos** saem em `conferir`. **PENDENTE** de verbete |
| **braço do port de bras** | **HIPÓTESE** — nos compassos 1 a 3 são **os dois braços juntos** («os braços abrem», plural); o compasso 4 é que separa a condução (D → E). O vocabulário de lados `D`/`E` **existe** em `ballet-classico.json` e não é usado. Acrescentar a coluna de lado resolve a pergunta «qual braço?». **PENDENTE de decisão** |
| **tendu ao lado** | **CONFIRMADO** — o Battement tendu vai à frente e depois atrás porque **o verbete é assim**: `1ª → +` e `1ª → ×`. Não há `→ lado` no verbete. Pedir o tendu ao lado é pedir verbete novo, não mudar o plano |
| **tempos e compasso dos 27** | **RESOLVIDO na origem** (`885ea96`) — vêm do **verbete** de cada exercício e não se perguntam no plano. O que continua por fazer é **preencher os verbetes** dos exercícios que ainda não os declaram: a lacuna mudou de lugar, e agora está onde o dado se decide |
| **bloco de musicalidade** | **PENDENTE** — ver abaixo |

### O bloco de musicalidade — RESOLVIDO, e a premissa estava errada

**Já não é uma pendência, e o que estava escrito aqui era um erro meu**, repetido três vezes e
corrigido pela pesquisadora:

> «Você continua insistindo que tem que haver uma pergunta a respeito da musicalidade. **Não tem que
> existir uma pergunta.** Isso já está elaborado pelo professor lá na produção (…) automaticamente
> isso já é respondido, não em forma de pergunta.»

**CONFIRMADO** que não falta nada perguntar, e a prova está no repositório: o professor **declara a
grade de contagens no VERBETE** (por música — `8|4/4` → cada célula com a contagem, a categoria e os
sinais) e **os tempos e o compasso no PLANO**. Juntos são o trabalho musical inteiro: o **pulso é a
contagem**, o **acento** é o tempo do compasso em que ela cai, a **frase** é o exercício inteiro
sobre a música.

A §4 passou a **consolidar**, em duas correções no mesmo dia:

- **a primeira** (`d74fda1`) — uma linha por **música**, com os exercícios que a usam e a grade tal
  como o verbete a declara, mais a fatia que o plano dá ao bloco. Tinha ainda duas coisas erradas: a
  linha «Exercícios neste bloco: **nenhum**» — **falsa**, porque as três linhas de exercício trazem
  `Tempos` e `Compasso` — e a «fatia do plano» dita em número solto;
- **a segunda** (esta entrega) — consolida **por compasso**, um exercício **uma vez só**, a célula
  com a contagem *e* o que cai nela, a fatia fora, e `conferir` onde a grade do verbete não fecha.

Sem nenhum `[Preencher]`. **CONFIRMADO** por `provar-o-que-vem-do-dado` (mutação: trocar a música
muda o documento; e cinco asserções que guardam a forma consolidada, entre elas «não afirma que o
bloco não tem exercícios») e pelo `.md` gerado.

**A Regra 15 — RESOLVIDA em 02/11/2026.** Ela dizia «bloco próprio em cada aula + arquivo paralelo do
ciclo»: doze palavras escritas **antes** de o verbete existir. Medido: **nenhum arquivo paralelo de
musicalidade existe no repositório** — essa metade nunca se implementou. E o «bloco próprio» partia
de uma premissa que não se sustenta. A regra **foi substituída pelo que o código faz**, e o
`REGRAS.md` — que é congelado — ganhou uma **nota de substituição** com motivo declarado, no commit
que é só dela. **CONFIRMADO**: a nota está no `REGRAS.md`, e o número das regras continua a ser 17
(o `gerar-handoff` conta 17, e nenhuma foi apagada nem renumerada).

### Os três eixos — medidos, e por isso já não são uma dúvida

A primeira leitura dizia que o modelo tinha **um** eixo (o técnico), porque `"eixo"` aparece uma vez
(`porta/po/conteudo/po.json:196`). É verdade sobre a string e falso sobre o modelo: o rótulo da
dimensão é `doPlano.eixo` + `" — "` + o bloco, o que dá «Técnica — Musicalidade» e «Técnica —
Expressão» — poiésis medida com o rótulo da técnica por cima. **CONFIRMADO** no envelope real da
`batata`.

Os três existem, em sítios diferentes, e **nenhum está declarado como eixo**:

- **corpo** — anamnese (15 campos) → PO `linha-de-base` e `restricoes` → plano bloco 10
  `aspecto-fisico`. Falta a **ligação ao exercício**;
- **técnica** — `notacao.json`, `vocabulario.json`, `progressao.json`, plano e PO. Falta a **haste
  declarada**;
- **expressão** — música (verbete + sequência + §4), repertório, vídeo de referência, 4 termos de
  `qualidade`, e as dimensões «Musicalidade» e «Expressão» do PO. Faltam **oralidade, história da
  dança e carácter** — não têm campo nenhum.

**E o objetivo é o cruzamento, não um quarto eixo.** `estrutura-de-cada-aula` marca cada objetivo
**por bloco** (na `batata`: Barra, Centro, Musicalidade, Expressão), e cada linha da sequência traz
objetivo + bloco + exercício + tempos + compasso. Três dos quatro elementos da frase dela estão
ligados ao objetivo; **o corpo é o único que não está**. Medição inteira no `REGISTRO.md`
(02/11/2026, «CORREÇÃO: o modelo tem três eixos») e na **C20** do `PLANEJAMENTO-LASTRO.md`.

**O que fica por decidir:** transformar os três em eixos de primeira classe (nome, campo, lugar no
PO) muda a taxonomia das dimensões e a ligação bloco↔dimensão. **É da pesquisadora**, e nada foi
alterado no código.

### O motor dos verbetes — a proposta chegou, e o veredicto é VIÁVEL (C22)

A pesquisadora anunciou, a 02/11/2026: «essa parte toda aqui dos verbetes vai ter que gerar um motor,
e a gente vai criar arquivos JSON de chave e valor para o dicionário, para o syllabus e para outras
propostas que eu vou te apresentar.» E na mesma data trouxe a proposta: o **verbete é o átomo de um
syllabus**, e daí saem **quatro** degraus — **dicionário → syllabus → aula pronta → gerador**. A
verificação e o veredicto estão na **C22** do `PLANEJAMENTO-LASTRO.md`; o resumo:

- **É viável, e o átomo já tem a forma certa** — chave-valor por música, com a notação **derivada** e
  não escrita (`motor/nucleo/notacao.js` compõe `[Pé: 5ª → +]` a partir de `categoria` + `sinais`), e
  três consumidores que já o leem (a aula, o plano, o glossário). **Não precisa de modelo novo.**
- **Precisa de quatro arrumações**, e três não são invenção: (1) **identidade estável** por unidade —
  hoje o verbete é chaveado pelo **nome**, e o `PUT /api/bastidores/termo` recusa mudar o nome de um
  termo em uso porque o `id` deriva dele (é a **L2**); (2) a **separação catálogo × escola** (abaixo);
  (3) a **camada pedagógica** por unidade — o que a unidade **exige** do corpo, o que ela **ensina** e
  o que ela **expressa** (três campos, e são **de conteúdo**, P-16); (4) **uma leitura só** do
  vocabulário — hoje há duas (`lerModalidade` lê do **GitHub**, `termos()` lê do **bundle**), e é por
  isso que o termo criado não chega ao plano antes do deploy.
- **E há um pré-requisito de integridade, o mais barato de todos: 4 das 13 músicas do alfabeto têm
  `cobre` diferente dos tempos** (Rond de jambe en l'air 3 em 4, Battement dégagé 6 em 4, Battement
  fondu 6 em 2, Relevé 1 em 2). Um motor que gera produtos de átomos inconsistentes gera produtos
  inconsistentes — e a gravação **recusa** esses verbetes, o que quer dizer que os quatro precisam de
  correção **antes** de qualquer regravação. O `Plié` era o quinto: saiu da lista quando a régua
  passou a ser a **maior pista**. **É a primeira tarefa do degrau
  1, e é de conteúdo.**

**O que trava o degrau 1 não é técnico, e são duas coisas.** A **licença**: não há `LICENSE`, e a
a licença estava a definir desde 18/09/2026 (`REGISTRO.md:109`) — de quem é a descrição é pergunta
que o `fonte` distingue mas não resolve —, e foi **decidida a 02/11/2026** (`ARQUITETURA-GERAL.md`
§10, três camadas). E a **separação catálogo × escola**: `POST /api/bastidores/termo` grava em
`biblioteca/modalidades/bale-classico/vocabulario.json` (`termo-repo.js`), que é o **catálogo** — uma
escola que acrescente um termo altera o catálogo de todos. É a lacuna **(0)** da **L14**, e é
pré-requisito do degrau 1, não um detalhe dele.

**O que é dela decidir:** o que sobe para o planejamento e com que palavras; se os três eixos passam
a primeira classe (**C20**); e a ordem comercial entre os degraus. **Nada foi desenhado nem alterado
no código por causa da C22.**

**A 02/11/2026 ela decidiu avançar, e o plano está escrito.** São **três produtos** (dicionário ·
syllabus · aula pronta), gerados por **um motor** e entregues **conforme o plano contratado** — o
[PLANO-PRODUTOS-DO-MOTOR.md](./PLANO-PRODUTOS-DO-MOTOR.md), em seis fases. O plano responde às três
perguntas dela — **quantos motores** (§3: um, com os manifestos a dar a granularidade), **em que
ordem** (§4: antes do ciclo, porque são matéria-prima das três fontes e tornam-se da escola na
curadoria) e **por qual plano** (§5) — e declara **nove colisões** com os planos que já existem
(§6), com o ajuste de cada uma. Três dessas colisões **mudaram texto hoje**: na **C22** (o gerador
não é o quarto produto, é o meio) e na **L14** (a turma pronta referencia o syllabus, não o contém).

**O que continua a travar, e não é código:** o mapa nível→termos (**11 dos 13 níveis vazios**), a
camada pedagógica, as **4 músicas**, a **separação** catálogo × escola — e, agora com nome e número,
**as 25 descrições sem `fonte`**, que a licença impede de entrar na edição paga. A **licença** deixou
de estar nesta lista: foi **decidida** (`ARQUITETURA-GERAL.md` §10), e falta apenas o `LICENSE.md`,
que é o texto que o contrato cita. E a fase 4 depende de **C11**: o plano contratado **não existe em
código** — `raiz/escolas-habilitadas.json` só tem `habilitada` e `pagante`.

O que **continua** em aberto desta família é outro: a **bancada**
`experimentos/propostas/proposta-musicalidade.html` (local, não versionada) propunha uma legenda de
compasso e contagem, os tempos à vista, a coluna de lado no port de bras e três colunas — e a decisão
sobre essas peças nunca foi tomada. **PENDENTE**, e agora é só sobre a apresentação, não sobre o dado.

### Pendências de infraestrutura — de datas anteriores

- **A Regra 4 pede uma lista que nenhum formulário pergunta — e agora sabe-se porquê e onde está.**
  A Regra diz «pré-requisitos de força e flexibilidade declarados e contados à parte do volume», e o
  campo do plano que existe é «Condições do espaço». A força e a flexibilidade **estão na anamnese**
  e, desde `cf1ef52`, chegam ao item 11 do PO. O que fica por decidir é **a Regra**, não o código:
  ou ela passa a falar do espaço e do material, ou nasce o campo. **PENDENTE** de decisão dela.
- **O item 11 continua a pedir a formulação por palavras.** Os campos da anamnese são **lidos** ao
  lado; «o que traz» e «o que precisa desenvolver» escrevem-se. É o que o próprio `porQue` do nó diz
  desde antes — a anamnese informa, a formulação é da professora. **DECIDIDO**, não é pendência.
- **Os três aspectos macro do Lastro passaram a estar escritos — como MEDIÇÃO, não como modelo.**
  Ela declarou que toda a modalidade precisa de **força e flexibilidade**, do **elemento da
  técnica/código** e da **poiésis** (expressividade, olhar, condução, oralidade, história) — e é a
  razão de existirem o vídeo e a música. O mapa está na **C20** do `PLANEJAMENTO-LASTRO.md` e na §8
  acima. **O que continua PENDENTE** é o passo seguinte: transformá-los em **eixos de primeira
  classe** (nome, campo, lugar no PO), que mexe na taxonomia das dimensões.
- **A §3 da aula tem um título que promete mais do que o corpo.** «A sequência conectada (fio
  condutor)» encima a tabela da distribuição do tempo; a sequência está em «Exercícios da Aula 01».
  **PENDENTE** — a pesquisadora não viu o problema na descrição, e a mudança é de nome, não de dado.
- **A bancada da musicalidade** (`experimentos/propostas/proposta-musicalidade.html`, local e não
  versionada) propõe a legenda de compasso e contagem, os tempos à vista, a coluna de lado no port de
  bras e três colunas. Nunca foi aprovada nem recusada. **PENDENTE** — é apresentação, não dado.
- **Coluna única nos Bastidores:** fundir as secções `#hash` no `nav.json`. **PENDENTE**.
- **Comentário com `<h1>` literal** dentro de `tools/templates/lancamento.html`. **PENDENTE**.
- **11 provas não versionadas** que dependem de fixtures perdidas com a escola `calango`.
  **PENDENTE**.
- **O resumo do terminal do `gerar-handoff.sh` mente, e é a única coisa que mente nele.** A linha final imprime
  `variantes: $(… "$variantes" …)`, e `variantes` é a variável do **último ciclo do último
  professor** — não um total. Hoje imprime `variantes: 0` enquanto o documento diz, corretamente,
  «4 variante(s)». **CONFIRMADO** por leitura do script (linha 354) e contagem dos manifestos.
  **Não corrigido:** `tools/` é congelado e a correção não é do escopo desta fotografia.
- **A regeneração do `HANDOFF.md` não está em workflow nenhum** — depende de alguém se lembrar.
  Foi por isso que ele ficou em `6bdb06a` com o `HEAD` em `7182307`. **CONFIRMADO**.
  **HIPÓTESE** de que valha automatizar no push — não avaliado.

### Decisões à espera do utilizador — a proposta do acervo

- **A opção do «acervo com a porta» — DECIDIDA: A.** «Eu tô inclinado a usar a opção A… o botão que
  abre o acordeão pode ser do mesmo estilo do botão chamado Turma, só que ocupando a linha toda.»
  **DECIDIDO** em 25/10/2026. A bancada já mostra A com a caixinha do «Turma» na faixa inteira.
- **A regra dos botões — CONFIRMADA, não é preciso inventar.** Vive em `voltarAoPortal()`,
  `mostrarRetomada()` e no «recomeçar» de `porta/index.html`: sem memória → «Nova»; com memória →
  «Continuar de onde parei» + «Começar de novo», e «Nova» **escondido**; «Começar de novo» limpa e
  devolve «Nova». A bancada executa-a com `localStorage`.
- **A implementação no produto — FEITA em 25/10/2026.** Cinco regras novas na folha (congelada:
  motivo declarado + registo + commit próprio), a peça no catálogo, `paginaDeLista` com `painel` e
  `script`, e o painel a executar a regra da porta. **CONFIRMADO** por
  `provar-painel-do-ato` no browser (30 verificações) e `provar-listas-do-acervo` (65).
- **O ícone é a seta `▾`, não o «?»** — rodada 180° no `[open]`. **DECIDIDO** em 25/10/2026.
- **O contexto escolhido é guardado** (`ato-<escola>-<fonte>-1`), sem a senha. **DECIDIDO** — foi a
  correcção de um defeito que só a prova apanhou: sem ele o «continuar de onde parei» nunca aparecia.
- **A senha tem três estados**, e não dois: vazia, errada, certa. **DECIDIDO** — a verificação em
  produção mostrou que com a senha errada o botão ficava desabilitado sem uma palavra de explicação.

### Dúvidas sobre este próprio protocolo

- **Quem atualiza a fotografia?** Hoje, o agente, quando a mudança é material. Não há automação e
  não foi pedida. **PENDENTE**.

## 9. Validação

### Executado nesta fotografia (04/11/2026 — os ciclos apagam-se de trás para a frente, a sequência, e a anamnese datada)

| Verificação | Resultado |
|:--|:--|
| `provar-ciclos-e-anamnese` (**nova**) | **TUDO CERTO — 34 asserções**: o próximo ciclo é `01`/o seguinte, e **um buraco (01, 03) não tem próximo honesto**; a ordem é **numérica** (doze ciclos → 11); os ciclos vêm do índice (e a **anamnese sem ciclo não inventa um**); apagar um **intermédio é recusado** com o nome do que impede, e **nada é escrito no GitHub**; o **último** apaga, leva só o gerado e **não toca no ciclo 01**; um **422** refaz o caminho e entra à segunda; o padrão da variante **não come** `breu-bale-nivel-1-teste-3`; a chave da anamnese **não tem ciclo** (duas datas, um sujeito, uma linha vigente); e o gesto é **«Novo registo»**, não «Ajustar» |
| `provar-contexto-do-ato` | **39 asserções**, atualizadas à regra nova — a anamnese pede `escola · professor · aluna` e **não** ciclo; a explicação nomeia os campos DESTA fonte. **Controlo negativo**: com a regra antiga reintroduzida, a bancada volta a reprovar nos dez pontos que a medem |
| `provar-apagar-da-listagem` | **32** — a anamnese vinculada oferece «Novo registo» e **não** «Ajustar» |
| `ARQUITETURA-GERAL.md` | §5.4.1 (apagar um ciclo), §5.4.2 (a anamnese é do sujeito e é datada), §5.4.3 (revalidação e a ordem) — as **17 referências `§` resolvem**, as **14 cercas** emparelhadas |
| Regressão | `provar-faixa-do-ato-no-celular` · `provar-sequencia-que-acompanha` · `provar-eixos-do-po` · `provar-producao` · `provar-cartao-da-aula` · `provar-eixos-e-tempo-da-aula` · `provar-colunas-da-aula` · `provar-verbos-do-armazenamento` · `provar-fusao-da-edicao` · `provar-corrida-da-escrita` · `provar-cadeia-do-ajuste` · `provar-acervo-envelopes` · `provar-publicacao-da-escola` · `provar-habilitacao-do-professor` · `provar-po-completo` · `provar-plano-completo` · `provar-indice-de-envelopes` — **todos verdes** |
| `check-identidade` · `check-indices` | **20/20** · **14/14** |
| **o que NÃO mede** | a exclusão foi exercitada num **GitHub falso** (as três respostas que a rotina usa), não contra o ar · **a interface de exclusão não existe ainda** (a rota e a guarda estão prontas) · a listagem da anamnese **não** está em acordeão por aluna — mostra o vigente e diz quantas versões guardou |

### Executado na fotografia anterior (04/11/2026 — a faixa no telefone, as 3 asserções, e a capacidade)

| Verificação | Resultado |
|:--|:--|
| `provar-faixa-do-ato-no-celular` (**nova**) | **TUDO CERTO — 40 asserções** a 320, 360, 390 e 414px, no Chrome, com o **envelope verdadeiro** da `breu`: nenhum par de campos se sobrepõe, todo campo cabe na faixa, o controle cabe no campo, **todo rótulo tem ≥ 40px de largura**, rótulo e valor não se sobrepõem, e a página não transborda. **Reprovou antes da correção** (rótulo a 0px, valor a 129px a 360px) e passa depois |
| `provar-producao` | **158 de 158** (era 153/156). As três: o DOM falso passou a responder a `.lateral a[data-secao]` e a ter `classList`; a lista das tradições e a contagem das pílulas passaram a ser **lidas das fontes** (5 tradições, não 4; 23 pílulas, não 16) |
| `ARQUITETURA-GERAL.md` | §2.2 corrigida (o composto **encaminha**, não enumera) · **§7.2 nova** · conferido: as **17 referências `§` resolvem**, as **14 cercas** emparelhadas |
| Regressão | `provar-celular` · `provar-contexto-do-ato` · `provar-eixos-do-po` · `provar-eixos-e-tempo-da-aula` · `provar-cartao-da-aula` · `provar-sequencia-que-acompanha` · `provar-colunas-da-aula` · `provar-verbos-do-armazenamento` · `provar-fusao-da-edicao` · `provar-corrida-da-escrita` · `provar-cadeia-do-ajuste` · `provar-acervo-envelopes` · `provar-publicacao-da-escola` · `provar-habilitacao-do-professor` · `provar-po-completo` · `provar-plano-completo` · `provar-indice-de-envelopes` — **todos verdes** |
| `check-identidade` · `check-indices` | **20/20** · **14/14** |
| **o que NÃO mede** | a faixa foi medida num servidor local com respostas **stubadas** (não no ar) · a capacidade do §7.2 é **projecção aritmética**, não ensaio de carga · o instantâneo do `aspecto-fisico` não guarda proveniência, e a divergência com a anamnese não se detecta |

### Executado na fotografia anterior (04/11/2026 — os três eixos do PO, o corpo da anamnese, e o §1 sem «Port de bras»)

| Verificação | Resultado |
|:--|:--|
| `provar-eixos-do-po` (**nova**) | **TUDO CERTO — 34 asserções**: o sujeito vem **antes** das dimensões (e o bloco dos sujeitos é o primeiro do roteiro); o eixo decide-se pelo **bloco** («Técnica — Musicalidade» lê-se **Poiesis**, e o Corpo é eixo próprio); o documento traz a coluna **Eixo** com Musicalidade e Expressão na Poiesis e **nenhuma** na Técnica; o Corpo aponta a «Linha de base» e diz as restrições; a linha sob o título é o **Fenómeno** (e não o horizonte nem a pergunta); e na tela (JSDOM) o painel do corpo **carrega da anamnese**, com o **nome** do campo, o **valor**, e sem inventar o que ela não respondeu |
| O §1 da aula, no envelope real | a matriz do parâmetro tinha `Port de bras` no objetivo 2 e o `repertorio` do **mesmo** envelope é `["Battement tendu","Plié"]` → o §1 sai sem ele; **controlo negativo**: sem repertório ele volta (não se julga o que não se pode conferir), e com o repertório a declará-lo ele volta também |
| A mesma régua na ficha do plano | `ficha-do-plano.js` passa a filtrar pelo repertório — era a segunda porta aberta da mesma janela |
| `gerar-ciclo` + `check-pacote` do ciclo da `breu` | **0 erro(s), 0 aviso(s)** — e a `-aula-01.md` foi regerada da mesma função e do mesmo envelope: o **diff é exactamente** a linha do parâmetro |
| A `-po.md` regerada | o diff são **as três mudanças pedidas** e nada mais: a linha do Fenómeno, os blocos sem prefixo, e a tabela com a coluna do eixo — validada contra o `ciclo-01-po-schema.json` (13 campos) |
| O HTML e o PDF gerados | `aula-01.html` e `aula-01.pdf` com **zero** ocorrências de «Port de bras» |
| A âncora | `.fipp` regerada e `--check` verde; `indices/` regerados; `check-indices` **14/14** |
| `check-identidade` | **20/20** (a cópia da porta nos dois pacotes refrescada) |
| Regressão | `provar-cartao-da-aula` · `provar-eixos-e-tempo-da-aula` · `provar-sequencia-que-acompanha` · `provar-colunas-da-aula` · `provar-verbos-do-armazenamento` · `provar-fusao-da-edicao` · `provar-corrida-da-escrita` · `provar-cadeia-do-ajuste` · `provar-acervo-envelopes` · `provar-carimbo-da-edicao` · `provar-um-commit-por-guardar` · `provar-publicacao-da-escola` · `provar-habilitacao-do-professor` · `provar-sinais-da-modalidade` · `provar-professor-secundario` · `provar-plano-da-turma` · `provar-contexto-do-ato` · `provar-po-completo` · `provar-plano-completo` · `provar-indice-de-envelopes` — **todos verdes** |
| **o que NÃO mede** | a tela foi medida em JSDOM com a anamnese **stubada** (não no ar) · os POs já gravados noutras escolas continuam com «Técnica — …» **dentro do envelope** (P-03: a leitura corrige, o dado não se reescreve) · a captura **não** ganhou bloco de corpo |

### Executado na fotografia anterior (04/11/2026 — os verbos, a modalidade e o custo da API)

| Verificação | Resultado |
|:--|:--|
| `provar-verbos-do-armazenamento` (**nova**) | **TUDO CERTO — 29 asserções**: os **7 verbos lidos do ficheiro do contrato** chegam aos dois adaptadores de base, ao acervo e ao **composto**; o `criar` **funciona** nos três (a segunda criação sabe que o nome é de outro e **não** sobrescreve, e o `guardar` continua a gravar por cima); o motor vê o `criar` **pelo `criarArmazenamento`**, que é o que a produção monta; e o composto **deixou de enumerar** — um verbo inventado na hora atravessa-o, um que ninguém implementa é **recusado** (não devolvido vazio), e o `Proxy` **não** o torna uma *thenable* |
| O `criar` no adaptador `node` | 1.ª → `{criado:true}` · 2.ª → `{jaExiste:true}` · o conteúdo continua `um` · e o `guardar` ainda sobrescreve |
| A modalidade derivada | `MODALIDADE_PADRAO` = `bale-classico` **derivada do catálogo** · `modalidadePrincipal([])` → `''` · `modalidadePrincipal([{id:'jazz',temConteudo:false}])` → `'jazz'` · e **restam 7** ocorrências do literal, todas em caminhos de `require` ou comentário |
| `ARQUITETURA-GERAL.md` | conferido contra a árvore: **34 secções**, as **17 referências `§` resolvem**, as **14 cercas** emparelhadas, as **8 ligações internas** existem · novas **§5.7** (os verbos) e **§7.1** (o preço da escrita) |
| Regressão | `provar-acervo-envelopes` · `provar-carimbo-da-edicao` · `provar-fusao-da-edicao` · `provar-corrida-da-escrita` · `provar-cadeia-do-ajuste` · `provar-cartao-da-aula` · `provar-eixos-e-tempo-da-aula` · `provar-colunas-da-aula` · `provar-um-commit-por-guardar` · `provar-publicacao-da-escola` · `provar-habilitacao-do-professor` · `provar-sinais-da-modalidade` · `provar-professor-secundario` · `provar-plano-da-turma` · `provar-contexto-do-ato` — **todos verdes** |
| `check-indices` · `check-identidade` | **14/14** · **20/20** |
| `check-pacote` do ciclo da `breu` | **0 erro(s), 0 aviso(s)** |
| **o que NÃO mede** | os limites da API vêm da **documentação** do GitHub, não de uma rajada provocada (provocá-la custaria cota no ar) · o KV **não** tem escrita condicional (a ressalva está dita no código) · e **nada valida os pacotes que já estão no repositório** — o `check-pacote` só corre dentro do gerador, e o `ciclo-01-breu` está no `main` com **11 erros** |

### Executado na fotografia anterior (04/11/2026 — as colunas da aula e a notação fora da música)

| Verificação | Resultado |
|:--|:--|
| `provar-colunas-da-aula` (**nova**) | **TUDO CERTO — 23 asserções**: a §4 do bloco de musicalidade sem **uma única** célula com `[Perna` e sem crase, a contagem reduzida a `1–2`, e o compasso/exercício ainda lá; a notação **no documento dela** e **ausente** da aula; a linha de separação **acima de 72 caracteres** (o gatilho do pandoc); a proporção **12/12/23/52** (compasso e contagem ≤ 15%, descrição > 45%, notação ≥ 20%); e o **pandoc a concordar** no `colgroup` que escreve, com tolerância de um ponto de arredondamento. Mede ainda a aula em prosa: três colunas, descrição > 55%, numéricas ≤ 20% |
| `gerar-ciclo` + `check-pacote` | **0 erro(s), 0 aviso(s)** — a §4 saiu `2/4 · Battement tendu · 8 · 1–2`, e as doze tabelas de exercício do documento de notação com as larguras novas |
| O HTML gerado | `notacao.html`: as **12** tabelas de exercício a **12/12/23/52** (eram 28/28/21/21) · `aula-01.html`: as 12 tabelas de prosa a **15/15/68** (eram 36/36/27), e **nenhuma** ocorrência de `Perna:` na página da aula |
| `validar-aula-ciclo` + extracção | o `-aula-01.md` passa, com **zero avisos** |
| `check-indices` · `check-identidade` | **14/14** · **20/20** |
| `provar-cartao-da-aula` · `provar-eixos-e-tempo-da-aula` · `provar-cadeia-do-ajuste` · `provar-fusao-da-edicao` · `provar-publicacao-da-escola` · `provar-um-commit-por-guardar` | **25 · 38 · 34 · 29 · 63 · 21** — verdes |
| **o que NÃO mede** | as percentagens foram medidas no HTML que o pandoc escreve **localmente** — nada foi medido no ar · as outras tabelas de duas colunas (§1, eixo do Corpo, auditoria) continuam **50/50**: têm o mesmo defeito, e não foram tocadas porque foram aprovadas |

### Executado na fotografia anterior (04/11/2026 — o cartão da aula, os três eixos e os links)

| Verificação | Resultado |
|:--|:--|
| `provar-cartao-da-aula` (**nova**) | **TUDO CERTO — 25 asserções**: a Turma **sem «Ciclo»** e com o operacional (aula N de M, dia, início, fim, duração, Sala «não declarada»); o Professor com **nome**, **modalidade** («Balé clássico», rótulo do catálogo) e **tradição** («RAD», do plano) — e **nunca o slug**; a caixa do guia fechada a dizer «23 critérios · 3 eixos»; e o painel com Corpo 15 · Técnica 4 · Barra, Centro · Poiesis 4 · Musicalidade, Expressão. Mede também o que **não pode voltar**: a frase de arquitetura |
| `provar-eixos-e-tempo-da-aula` | **38** (eram 27): três blocos de eixo **nesta ordem**, uma linha por item em cada eixo, **a coluna «Eixo» ausente**, o **corpo com linhas próprias**, os **links da proveniência** a abrirem a folha com o `id` e o `formato=html` (e a caírem na porta quando não há `id`), e o **contrato de extração** a ler os três blocos **sem aviso de segunda tabela** |
| `gerar-ciclo` + `check-pacote` do ciclo da `breu` | **0 erro(s), 0 aviso(s)** — a §5 saiu com as três tabelas e o Corpo com 18 linhas (15 aspectos + 2 da linha de base + a restrição); a §6 com os dois links para as folhas |
| A extracção do `-aula-01.md`, com o contrato real | `guiaDeObservacao` com **Corpo 18 · Técnica 4 · Poiesis 4**, e **zero avisos** |
| `check-indices` · `check-identidade` | **14/14** · **20/20** (a cópia da porta no pacote-zero refrescada) |
| `provar-cadeia-do-ajuste` · `provar-fusao-da-edicao` · `provar-corrida-da-escrita` · `provar-publicacao-da-escola` · `provar-um-commit-por-guardar` | **34 · 29 · 30 · 63 · 21** — verdes |
| **o que NÃO mede** | a folha de leitura **não foi aberta no ar** (a prova mede o endereço que o documento escreve, não a resposta do Worker) · `provar-listas-do-acervo` segue **NÃO FEITO** |

### Executado na fotografia anterior (04/11/2026 — a fusão das edições, e a arquitetura como espelho)

| Verificação | Resultado |
|:--|:--|
| `provar-fusao-da-edicao` (**nova**) | **TUDO CERTO — 29 asserções**: o `combinar` a encaminhar `criar`, `anexar` e `gravarComFusao`; **campos diferentes a unificar** (o objetivo de um e o repertório do outro, ambos no arquivo); o **mesmo campo** a decidir pela recência nos dois sentidos (900 ms de diferença, cada lado a vencer uma vez); o empate a ir para quem grava, e a repetir igual; sem base a não adivinhar; o **409 dentro da fusão** a repetir e a sair fundido; e o carimbo a preferir `escrito_em` sobre `gerado_em` |
| `provar-corrida-da-escrita` | **30** (eram 27) — duas asserções novas: a corrida do nome provada **pelo `combinar`**, e não pelo acervo direto |
| `provar-acervo-envelopes` · `provar-carimbo-da-edicao` · `provar-indice-de-envelopes` | **48 · 55 · 44** — verdes |
| `provar-cadeia-do-ajuste` · `provar-vigente-na-listagem` · `provar-eixos-e-tempo-da-aula` | **34 · 21 · 27** — verdes |
| `provar-um-commit-por-guardar` · `provar-expurgo-sem-listagem` · `provar-apagar-professor-livre` · `provar-publicacao-da-escola` · `provar-porta-sem-contexto` · `provar-po-unico` · `provar-sujeitos-da-turma` | **21 · 49 · 56 · 63 · 44 · 18 · 30** — verdes |
| `ARQUITETURA-GERAL.md` | conferido contra a árvore: **14 caminhos citados, todos existem** · **as 14 referências `§` resolvem** para secções existentes · as **7 cercas de código** emparelhadas · **6 ligações internas**, nenhuma em falta |
| **o que NÃO mede** | a fusão **não foi medida com dois browsers reais contra o Worker publicado** (as bancadas correm sobre um GitHub falso) · `provar-listas-do-acervo` segue **NÃO FEITO** |

### Executado na fotografia anterior (04/11/2026 — a corrida da escrita e o expurgo)

| Verificação | Resultado |
|:--|:--|
| `provar-corrida-da-escrita` (**nova**) | **TUDO CERTO — 27 asserções**: o mesmo carimbo pedido por dois pedidos (a janela existe), as duas gravações a ficarem (nenhum documento evaporado), o índice a descrever o **arquivo** e não a tentativa perdida, a edição em sítio a reescrever o **mesmo** nome, o **422 «"sha" wasn't supplied»** como «já existe» (e um 422 por outro motivo como **erro**), o 409 de corrida a repetir, e o **expurgo** a publicar à segunda tentativa — com a **gravação cega ao lado, a perder um**, para o defeito medido ficar fixado |
| O **422 do GitHub** | **medido contra a API real**, num ramo descartável (`teste-corrida-do-carimbo`, criado e apagado no mesmo minuto): criar sem `sha` → `201`; criar sem `sha` sobre caminho existente → **`422 "Invalid request. \"sha\" wasn't supplied."`**. **Nada foi escrito no `main`** |
| `provar-acervo-envelopes` · `provar-carimbo-da-edicao` · `provar-indice-de-envelopes` | **48 · 55 · 44** — verdes. As duas primeiras foram as que **apanharam** a primeira versão da correção: a escrita condicional aplicada à edição em sítio inventava um `-2` a cada «Guardar» |
| `provar-cadeia-do-ajuste` · `provar-vigente-na-listagem` · `provar-eixos-e-tempo-da-aula` · `provar-publicacao-da-escola` · `check-identidade` · `check-indices` | **34 · 21 · 27 · 63 · 20/20 · 14/14** — verdes |
| **o que NÃO mede** | `provar-listas-do-acervo` segue **NÃO FEITO** (a única escola viva não tem ciclo publicado para servir) · o caso «duas pessoas no mesmo documento» **não tem prova**: é a decisão 84, em aberto |
| **regressões** | 13 bancadas comparadas com o `HEAD` limpo (`git stash`), **resultado idêntico asserção a asserção** — as falhas delas são pré-existentes (pacotes de escolas expurgadas, Puppeteer) |

### Executado na fotografia anterior (04/11/2026 — o ajuste arrasta o PO, e o cartão mostra o guia)

| Verificação | Resultado |
|:--|:--|
| `provar-cadeia-do-ajuste` (**nova**) | **TUDO CERTO — 34 asserções**: a cadeia do `ajuste_de` e o vigente, o PO achado por qualquer elo, a referência que segue o topo (com `planoRetargetado`), o elo do PO criado pelo «Guardar» do plano vinculado — fonte, ciclo e disparo —, a repetição que não multiplica elos, e o plano sem PO que não inventa observação |
| A ponta, com o **envelope real** `plano-20261104-1732` + o PO | a Aula 01 sai com **`Expressão \| 27 \| 30%`** — era `[Preencher]` |
| `montar-publicacao` numa árvore de prova (pacote-zero + uma turma) | o cartão passa a ter **Turma** (com o dia, as horas, a duração e a Sala «não declarada»), **Professor** sem a nota de arquitetura e **Guia de observação** («8 critérios · 4 dimensões», um par por dimensão), com a linha de síntese «Técnica — Solo, Barra, Centro · Poiesis — Musicalidade» |
| `provar-vigente-na-listagem` · `provar-acervo-envelopes` · `provar-indice-de-envelopes` · `provar-apagar-da-listagem` · `provar-publicacao-da-escola` | **21 · 48 · 44 · 31 · 63** — verdes |
| `check-identidade` · `check-indices` | **20/20** (a cópia da porta no pacote-zero foi refrescada) · **14/14** |
| **o que NÃO mede** | `provar-listas-do-acervo` — segue **NÃO FEITO**: a única escola viva (`breu`) não tem ciclo publicado para servir |

### Executado na fotografia anterior (04/11/2026 — a fatia de tempo e as três frentes do guia)

| Verificação | Resultado |
|:--|:--|
| `provar-eixos-e-tempo-da-aula` (**nova**) | **TUDO CERTO — 27 asserções**: a coluna da proporção lida pelo NOME (a linha com as colunas trocadas dá a mesma fatia), `minutos` e `percentual` com os mesmos tempos, a lacuna a nomear o bloco, a prosa não convertida, os três eixos (o prefixo «Técnica —» não decide), o corpo das três fontes e **nenhum item do PO perdido** |
| Aula da `breu`, regerada com o motor de hoje | `Expressão \| [Preencher] \| [Preencher: proporção do bloco Expressão no plano]` — a justificativa deixou de vazar para a fatia |
| Plano da `breu`, regerado | `> **Sem proporção alvo: Expressão.** … Preencha a coluna «Proporção alvo» acima` |
| Guia da `breu` | resumo de 3 frentes (Corpo 15 aspectos · Técnica 2 dimensões/4 itens · Poiesis 2 dimensões/4 itens) + tabela de 8 linhas com a coluna «Eixo» |
| `gerar-ciclo.sh coqui-de-redinha 01 breu-bale-nivel-1-teste-3` | **0 erro(s), 0 aviso(s)**; PDF de 29 páginas com as duas correções dentro (`pdftotext`) |
| `validar-aula-ciclo` na aula regerada | **ok** — 9 campos extraídos, 2 provisórios |
| `provar-plano-matriz` · `provar-plano-completo` · `provar-aula-e-plano-legiveis` · `provar-derivados-da-sequencia` | **52/52 · 18 · 12 · 26** — verdes |
| **o que NÃO mede** | `provar-aula-prosa` · `provar-escopo-da-aula` · `provar-cabecalho-do-documento` — a primeira e a segunda apontam fixturas de escolas expurgadas (`batata`); a terceira exige um pacote gerado, que o repositório não guarda. As três falham na árvore de `HEAD` sem estas alterações |

### Executado na fotografia anterior (03/11/2026 — a estante mostra um por documento)

| Verificação | Resultado |
|:--|:--|
| `provar-vigente-na-listagem` (**nova**) | **TUDO CERTO — 21 asserções**: as 4 gravações do PO do caso real (1 original + 2 irmãos + 1 derivado) dão **1 linha** com «2 versões anteriores guardadas»; outro plano observado dá a sua; as anamneses da mesma aluna colapsam (e as **sem sujeito** não); a derivação do plano substitui; e os envelopes escondidos **continuam legíveis e no índice** |
| O mesmo, sobre o **índice real da `breu`** | **2 envelopes de PO → 1 linha** (`po-20261103-2221`, histórico `po-20261103-2202`); anamnese 1 → 1; plano 1 → 1 |
| `provar-apagar-da-listagem` | **31 asserções, 0 falhas** — e foi ela que **reprovou** a primeira versão da regra: agrupar o plano por (turma, ciclo) escondia o plano que um PO observa |
| `provar-ficha-na-listagem` · `provar-lista-que-falha` · `provar-sujeitos-da-turma` · `provar-acervo-envelopes` · `provar-indice-de-envelopes` · `provar-indice-de-proveniencia` | **35 · 39 · 30 · 48 · 44 · 60** — verdes |
| `check-identidade` · `check-indices` | **20/20** · **14/14** |
| `provar-listas-sem-repeticao` | **1 falha pré-existente** — a asserção «`api/envelopes` é pedido uma vez» mede uma estante que saiu da porta a 26/10; reproduzida na árvore de `HEAD` **sem** estas alterações, e por isso não é regressão desta entrega |
| **o que NÃO mede** | `provar-listas-do-acervo` — segue **NÃO FEITO**: a única escola viva (`breu`) não tem ciclo publicado para servir |

### Executado na fotografia anterior (03/11/2026 — a medida não é o repertório)

| Verificação | Resultado |
|:--|:--|
| `provar-sequencia-que-acompanha` | **TUDO CERTO — 49 asserções** (eram 33). Secção 7 nova: a medida marcada fora do repertório curado não vira exercício, o `marco` fora da lista não gera linha, e **dois controlos negativos** (curado o termo, ele aparece; de volta o objetivo, a linha volta) |
| «Port de bras» na sequência, com a curadoria em dois verbetes | **3 linhas → 0**, e o rodapé nomeia o termo que ficou de fora |
| linha a nomear «objetivo 3», com um `marco: 3` na matriz dos blocos | **aparecia → não aparece** — e a coluna do objetivo não sai vazia |
| o mesmo exercício no `.md` do plano | não entra na música quando está fora do `repertorio` do envelope; entra quando está dentro; **sem repertório declarado não se julga** |
| `provar-plano-matriz` · `provar-plano-completo` · `provar-derivados-da-sequencia` · `provar-po-completo` · `provar-teste` · `provar-apagar-da-listagem` · `provar-metodologia-no-cabecalho` | **52/52** · **18** · **26** · **17** · **45** · **31** · **TUDO CERTO** |
| `check-identidade` | **20/20** (o `plano-observacao/` do `ciclo-01-breu` foi regerado a partir de `porta/`) |
| **o que NÃO mede** | `provar-listas-do-acervo` · `provar-dimensoes-plano` · `provar-janela-do-lancamento` · `provar-lancamento` · `provar-geracao` — apontam a pastas de escolas expurgadas (`batata`, `calando-teste-1`) ou a professores que já não existem (`tiago`) |
| **de antes** | `check-pacote` no `ciclo-01-breu`: 11 erros (o pacote-zero não tem PDF, nem aulas, nem dados) |

### Executado na fotografia anterior (03/11/2026 — as bancadas passam a medir o documento de hoje)

| Verificação | Resultado |
|:--|:--|
| `provar-plano-completo` | **OK — 18 verificações** (antes: exceção na §5). Mede o documento de HOJE: a identificação no `## Contexto` com a reserva do guia, a **régua** na chave `reguaDaRubrica`, a sequência no documento da **notação**, a música nas duas origens, a **omissão da escola declarada com motivo**, e a relação objetivo ↔ aula na tabela dos marcos (nas duas direções) |
| `provar-derivados-da-sequencia` | **TUDO CERTO — 26 asserções** (antes: 2 falhas). A fixture passou a usar o alfabeto que existe (Plié, Battement tendu, Jeté sem verbete) |
| `provar-plano-matriz` · `provar-po-completo` · `provar-teste` | **52** · **17** · **45** — verdes |
| `provar-sequencia-que-acompanha` · `provar-metodologia-no-cabecalho` · `provar-aula-e-plano-legiveis` · `provar-apagar-da-listagem` | **TUDO CERTO** nas quatro |
| `check-identidade` · `check-indices` | **20/20** · **14/14** |
| **o que NÃO mede** | `provar-listas-do-acervo` · `provar-dimensoes-plano` · `provar-janela-do-lancamento` · `provar-lancamento` · `provar-geracao` — apontam a pastas de escolas expurgadas (`batata`, `calando-teste-1`) ou a professores que já não existem (`tiago`). O remédio é o desta entrega, e não lhes foi aplicado |
| **de antes** | `check-pacote` no `ciclo-01-breu`: 11 erros (o pacote-zero não tem PDF, nem aulas, nem dados) |

### Executado na fotografia anterior (03/11/2026 — as bancadas do plano e do PO voltam a medir)

| Verificação | Resultado |
|:--|:--|
| `provar-plano-matriz` | **52 de 52** — era vermelho na PRIMEIRA asserção («/api/mapa responde»), e a causa era o fixture: servia a pasta de uma escola expurgada em 15/10/2026 |
| `provar-po-completo` | **OK — 17 verificações** |
| `provar-teste` · `provar-metodologia-no-cabecalho` · `provar-aula-e-plano-legiveis` · `provar-sequencia-que-acompanha` | **45** · TUDO CERTO · TUDO CERTO · TUDO CERTO |
| `check-identidade` · `check-schemas` · `check-indices` | **20/20** · TUDO CERTO · **14/14** |
| `provar-derivados-da-sequencia` | **as mesmas 2 de antes** — e agora sabe-se por quê: o alfabeto não tem «Battement fondu» nem «Jeté», que o fixture dela usa |
| **vermelhos, e de antes** | `provar-plano-completo` — **três campos respondidos não chegam ao documento** (`contexto-escola`, o critério da `rubrica`, `aula-de-cada-objetivo`). É achado, não remendo: são três decisões de produto. · `check-pacote` no `ciclo-01-breu` (o pacote-zero não tem PDF nem aulas) |
| `provar-listas-do-acervo` · `provar-dimensoes-plano` · `provar-janela-do-lancamento` · `provar-lancamento` · `provar-geracao` | **NÃO MEDEM** — apontam a pastas de escolas expurgadas (`batata`, `calando-teste-1`) ou a professores que já não existem (`tiago`). O remédio é o desta entrega, e não foi aplicado a elas |

### Executado na fotografia anterior (03/11/2026 — o «Apagar» do registo solto)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-apagar-da-listagem.js` (novo) | **TUDO CERTO — 31 asserções em 6 secções**. Monta uma **publicação mínima** num diretório temporário — a listagem não depende de existir ciclo gerado — e serve a página a sério por `producao.fetch`, com KV em memória. **§1** o plano solto: Editar + Apagar, com o carimbo e a rota certos, e «Apagar» **não** é link. **§2** o vinculado: nem Editar nem Apagar, «Ajustar», e o `DELETE` **recusado** (409, com o motivo); o derivado também não. **§3** a anamnese, solta e vinculada. **§4** o clique em JSDOM: **sem** a senha conferida não se chama a rota e o painel diz porquê; **com** ela, chama-se uma vez com o carimbo. **§5** o PO não ganha o botão. **§6** a rota apaga **mesmo** (200, o envelope desaparece, a listagem deixa de o mostrar; a anamnese vinculada é recusada) |
| `provar-acervo-envelopes` | **TUDO CERTO — 48 asserções**, incluindo «sem GITHUB_TOKEN a gravação vai para o KV» |
| `provar-teste` · `provar-ajustes-anamnese` · `provar-ficha-na-listagem` | **45 verificações** · **126 provas** · **35 asserções** — verdes |
| `provar-producao` | **153 de 156** — as mesmas três de antes (o item de menu marcado, a ordem das tradições, a contagem das pílulas) |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** · **14/14** · **TUDO CERTO** |
| `provar-listas-do-acervo` | **NÃO FEITO** — a única escola viva (`breu`) não tem `aula-NN.html` no pacote, e a bancada procura um ciclo gerado para servir. É por isso que a prova nova monta a **própria** publicação |
| **vermelhos, e de antes** | `check-pacote` no `ciclo-01-breu`: 11 erros (o pacote-zero não tem PDF, nem aulas, nem dados — nunca gerado aqui) |
| **o que NÃO foi medido** | a página **ao vivo** depois do deploy: o caminho mede-se em JSDOM e no derivador |

### Executado duas fotografias atrás (03/11/2026 — a sequência não inventa linha)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-sequencia-que-acompanha.js` | **TUDO CERTO — 33 asserções em 6 secções**. **§1** o núcleo, com controlo negativo. **§2** o documento. **§3** a tela com os números do envelope dela (seis linhas, nenhuma a nomear os objetivos 2 e 3). **§4** a chave pelo número. **§5** reescrita: **nenhum** `[data-grelha-add]`, **nenhum** `[data-grelha-del]`, **nenhum** campo livre nem seletor; **controlo positivo** — marcar um exercício a mais no parâmetro acrescenta **três** linhas (uma por bloco); sem parâmetro marcado a célula fica vazia, travada, com `—`; e a distribuição do volume **não** herda a frase da curadoria. **§6** a tela desenha exactamente as linhas que o núcleo deixa passar |
| `provar-teste` · `provar-ajustes-anamnese` | **45 verificações** · **126 provas** — verdes |
| `provar-plano-e-curadoria` · `provar-curadoria-e-limpeza` · `provar-aula-e-plano-legiveis` · `provar-metodologia-no-cabecalho` · `provar-compasso-limpo` | **TUDO CERTO** nas cinco |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** (a cópia da porta no pacote foi regerada) · **14/14** · **TUDO CERTO** |
| **vermelhos, e de antes** | `provar-plano-matriz` — a bancada não serve `/api/mapa` e a prova **não corre**; as duas asserções que ela guarda (reescritas hoje para a regra nova) ficam medidas pela §5 do `provar-sequencia-que-acompanha` · `provar-derivados-da-sequencia` (as mesmas 2) · `provar-plano-completo` · `provar-po-completo` · `provar-notacao` |
| **o que NÃO foi medido** | a página **ao vivo** depois do deploy: o caminho mede-se em JSDOM e no derivador |

### Executado três fotografias atrás (03/11/2026 — a sequência acompanha os objetivos)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-sequencia-que-acompanha.js` (novo) | **TUDO CERTO — 27 asserções em 6 secções**, com **dois controlos negativos**. **§1** o núcleo (`numeroDoObjetivo`, `linhaOrfa`, `linhasVivas`) — e, com os três objetivos de volta, as oito linhas ficam. **§2** o documento: a música deixa de publicar o exercício do objetivo apagado, e com os três objetivos o «Port de bras» **reaparece**. **§3** a tela, com os números do envelope dela: seis linhas, nenhuma a nomear os objetivos 2 e 3, o conteúdo preenchido e travado, e o envelope com seis ao gravar. **§4** a chave pelo número: corrigir a redacção de um objetivo **não** duplica a linha, e o rótulo acompanha o texto novo. **§5** o ✕: apagado nas derivadas **com a senha já validada**, activo na acrescentada, e remove só a ela; e o «−» do primeiro objetivo continua apagado. **§6** a tela e o núcleo concordam nas linhas que sobrevivem |
| `provar-teste` · `provar-ajustes-anamnese` | **45 verificações** · **126 provas** — as duas verdes, incluindo «com senha o controlo volta a habilitar» |
| `provar-plano-e-curadoria` · `provar-curadoria-e-limpeza` · `provar-compasso-limpo` · `provar-metodologia-no-cabecalho` · `provar-conteudos-e-estado-da-turma` · `provar-aula-e-plano-legiveis` | **TUDO CERTO** nas seis |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** (a cópia da porta no pacote foi regerada) · **14/14** · **TUDO CERTO** |
| `provar-derivados-da-sequencia` | **26 asserções, as mesmas 2 falhas de antes** (o *fondu* da fixture não declara música no alfabeto) — não tocada por esta mudança |
| **vermelhos, e de antes** | `provar-plano-completo` · `provar-po-completo` (o caminho do schema aponta para `professores/leticia/`) · `provar-notacao` (o alfabeto não tem os exercícios que a fixture do ciclo lista) · `provar-plano-matriz` (a rota `/api/mapa` da bancada) · `check-pacote` no `ciclo-01-breu` (o pacote-zero não tem PDF nem aulas — nunca gerado aqui) |
| **o que NÃO foi medido** | a página **ao vivo** depois do deploy: o caminho mede-se em JSDOM e no derivador |

### Executado três fotografias atrás (03/11/2026 — a metodologia é do professor)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-metodologia-no-cabecalho.js` (novo) | **TUDO CERTO — 20 asserções em 5 secções**. **§A** o conteúdo: o nó é do **cabeçalho**, declara `daCuradoria: 'tradicao'`, deixou de ser obrigatório e perdeu `forma`/`aberto`; o «Quem escolhe a metodologia» **não existe** em sítio nenhum, e a frase «A escola impõe» desapareceu. **§B** sem campo no corpo e sem degrau no roteiro. **§C** a barra mostra **«Francesa»** (o rótulo, não a chave), e a leitura do corpo diz de onde vem e que ali não se preenche. **§D** o `.md` publica a metodologia e deixou de publicar a autoria. **§E** o **controlo negativo**: sem curadoria não se semeia, não se mostra e o documento declara a lacuna |
| `provar-teste` | **45 verificações, TODAS verdes** — estava vermelho, e por uma razão que importa: afirmava «os nós do cabeçalho não são 7» em dois sítios e escrevia `- 7` num terceiro. A metodologia entrou no cabeçalho, a conta passou a **8**. O número passou a ser **derivado do mapa**: o que a asserção guarda é a igualdade entre os nós marcados e os que o roteiro salta |
| `provar-plano-e-curadoria` · `provar-compasso-limpo` · `provar-curadoria-e-limpeza` · `provar-aula-e-plano-legiveis` | **TUDO CERTO** nas quatro |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** (a cópia da porta no pacote foi regerada) · **14/14** · **TUDO CERTO** |
| **vermelhos, e de antes** | `provar-plano-completo` · `provar-po-completo` (o caminho do schema aponta para `professores/leticia/`, que já não existe) · `provar-derivados-da-sequencia` (2 falhas) — medidos com o motor de HEAD, não tocados |
| **o que NÃO foi medido** | a página **ao vivo** depois do deploy: o caminho mede-se em JSDOM e no derivador |

### Executado quatro fotografias atrás (03/11/2026 — o compasso sem o dono da música)

| Verificação | Resultado |
|:--|:--|
| `/api/bastidores/termos` | **antes**, ao vivo: `Battement tendu → ["8\|2/4@breu"]`. **depois**, em processo: `["8\|2/4"]`. É a medida que abriu o trabalho |
| `node experimentos/provar-compasso-limpo.js` (novo) | **TUDO CERTO — 16 asserções em 4 secções**. **§A** a fonte não serve nenhuma música com `@`. **§B** a tela com a fonte limpa: a linha grava `Compasso: '2/4'`, os tempos continuam 8 e 4, e a leitura diz «8 tempos em 2/4». **§C** a **defesa da tela** com o adaptador a servir as chaves **em cru** — e o **controlo vem primeiro**, a provar que o stub serve mesmo o sufixo. **§D** o **dado intacto**: o alfabeto guarda `8\|2/4@breu`, `musicaDaChave` devolve a música, `chaveDoVerbete` recompõe a de armazenamento, e a vista da escola resolve a música limpa para o registo dela |
| `provar-plano-e-curadoria` · `provar-curadoria-e-limpeza` · `provar-plano-da-turma` | **TUDO CERTO** nas três |
| `provar-derivados-da-sequencia` · `provar-musica-no-plano` | **2 e 9 falhas — as mesmas de antes**, medidas com o motor de HEAD no worktree. A primeira é a leitura que agora diz «8 tempos em 2/4»: a asserção espera outro texto, e está vermelha por uma razão que não é esta |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** (a cópia da porta no pacote foi regerada) · **14/14** · **TUDO CERTO** |
| **o que NÃO foi medido** | a página **ao vivo** depois do deploy: o caminho mede-se em bancada, com o adaptador a servir os dois formatos |

### Executado na fotografia anterior (03/11/2026 — a lista que só promete o que existe, e o formulário sem sermão)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-curadoria-e-limpeza.js` (novo) | **TUDO CERTO — 22 asserções em 5 secções**. **§A** o menu da curadoria = os exercícios **com notação**, derivado do alfabeto (não um número à mão); o «Jeté» da prova é termo e não entra; os dois escolhedores são a mesma peça. **§B** os **oito rótulos** com a mesma pele, medidos no **Chromium** (`display`, peso, tamanho, cor, margens). **§C** dez textos removidos, um a um. **§D** controlo negativo: vocabulário sem verbete → menu vazio, alunas intactas. **§E** os **nove** blocos de feedback que ficam |
| `provar-producao` | **153 de 156** (era **151 de 155**). A asserção «nenhum formulário traz explicação» estava vermelha desde antes (obtido 1, esperado 0) e **passou** — o único resto era a frase da posição, que saiu. As duas novas são as do menu. As três que restam são as de antes |
| `provar-conteudos-e-estado-da-turma` | **TUDO CERTO — 75 asserções** (era 74): a nova garante que o vocabulário não foi apagado do sistema |
| `provar-cartao-da-turma` | **4 falhas, antes e depois** — as mesmas do `--controle-negativo` sobre HEAD |
| `provar-teste` · `provar-plano-e-curadoria` · `provar-habilitacao-do-professor` · `provar-enquadramento-da-turma` · `provar-verbete` · `provar-tabela-da-notacao` | **45 verificações** · **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** · **14/14** · **TUDO CERTO** |
| `provar-celula` | **rebenta na secção 2**, com e sem esta mudança (`TypeError` sobre `cabecalho`, medido com o motor de HEAD). As duas asserções que afirmavam os textos removidos foram **invertidas** para não mentirem a quem reparar o banco — mas **não correram** |
| **o que NÃO foi medido** | a página **ao vivo** (o deploy corre depois do push): ao vivo, o menu da `breu` deve passar de **94** para **3** opções |

### Executado na fotografia anterior (03/11/2026 — a curadoria chega ao plano)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-plano-e-curadoria.js` (novo) | **TUDO CERTO — 12 asserções em 5 secções**. **§A** `turmaDoPlano()` devolve a **turma**, e não uma lista. **§B** o ritmo desce: frequência 2 (qua e sex), 45 min, calendário 2027-03-03 → 2027-06-30, total de aulas. **§C** a coluna «Conteúdo do nível» oferece **Plié e Battement tendu** (o `repertorio` da curadoria). **§D** o **controlo negativo**: sem o mapa composto a coluna fica vazia e o ritmo continua a descer. **§E** a **classe** do defeito: nenhum bloco de cliente declara a mesma função duas vezes |
| `provar-teste` | **45 verificações, TODAS verdes** — estava vermelho («a frequência não saiu dos dias da turma») e a correção do nome devolveu-lhe a leitura da turma |
| `provar-cartao-da-turma` | **4 falhas** (eram **6**): o «Cancelar» da turma voltou a ser o da turma. As quatro que sobram são as mesmas do `--controle-negativo` sobre HEAD |
| `provar-producao` · `provar-verbete` · `provar-plano-da-turma` · `provar-conteudos-e-estado-da-turma` · `provar-tabela-da-notacao` | **151 de 155** (as quatro de antes) · **TUDO CERTO** · **46 provas, 0 falhas** · **TUDO CERTO** · **TUDO CERTO** |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** (a cópia da porta no pacote foi regerada) · **14/14** · **TUDO CERTO** |
| **no ar, uma leitura por sítio** | `/api/bastidores/curadoria-professor` devolve a curadoria com `repertorio: ['Plié','Battement tendu']`; `/api/bastidores/turmas` devolve a turma com o ritmo; `/api/bastidores/turma-conteudos` devolve `{"bale-nivel-1-teste-3":["battement-tendu","plie"]}`; a lista do PO diz «Ainda não há Plano de Observação nesta escola» |
| **provas vermelhas desde antes desta sessão** | `provar-plano-completo` · `provar-po-completo` · `provar-manifesto-do-plano` · `provar-geracao-do-ciclo` — medidas com o motor de HEAD no worktree, **não tocadas**: cada uma pede uma decisão de contrato ou de conteúdo |
| **o que NÃO foi medido** | o caminho `plano → .md → pacote` **ao vivo**: não há plano guardado. E o `GITHUB_TOKEN` do `.dev.vars` está **morto** (401 em `/user` e na API do repositório) — o token do Worker não se lê de fora, mas é este o valor que `criar-escola.sh --deploy` grava |

### Executado na fotografia anterior (03/11/2026 — os conteúdos na curadoria e os três estados da turma)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-conteudos-e-estado-da-turma.js` (novo) | **TUDO CERTO — 74 asserções em 7 secções**. **§A** o núcleo composto: o mapa antigo somado ao `repertorio`, colapsado pelo `idDe`, e a curadoria **substituída** a não entrar. **§B** os três estados e o motivo de cada recusa, **com os três do professor ao lado** — a assimetria era o defeito. **§C** a rota é a linha do servidor (o que a tela mostra é comodidade): `turma-editar` recusa a curada que muda o nome, **aceita** a que muda a hora, e recusa a vinculada. **§D** a tela: o passo 3 sem `#vinc-conteudos`, e a curadoria com o `escolhedor`. **§E** a nota saiu do cadastro e o que estava escrito **fica**. **§F** o termo ensinado numa curadoria de turma com plano **não** se apaga. **§G** o formulário inteligente: modalidade pelo perfil, tradição pela modalidade, e a queda para a compartilhada |
| `provar-producao` | **151 de 155** (era **149 de 153**; as duas asserções acrescidas são as novas). Duas foram **reescritas em vez de contornadas**: a de «concluir exige conteúdo» (o formulário já não os oferece) e a do menu de conteúdos no passo 3 (mudou para a curadoria). As **quatro falhas restantes são as de antes** — medidas uma a uma, e a da lista de tradições do **verbete** vem do `tradicoes.json` (a `cubana` entrou e `compartilhada` vem no fim), não desta mudança |
| `provar-cartao-da-turma` | **6 falhas, antes e depois**. As oito que esta mudança introduziu foram reescritas para medir a decisão nova (o passo 3 **sem** bloco de conteúdos, a curadoria **com** o `escolhedor`, a régua sem transbordar em 390px com a ressalva do `flex-wrap`). As seis que sobram são as mesmas do `--controle-negativo` sobre o motor de HEAD: os seletores globais `button.passo` apanham também a **segunda** barra de passos (a do verbete) |
| `provar-teste` | **a mesma falha de antes** («a frequência não saiu dos dias da turma»), confirmada com e sem a mudança |
| as outras sete (enquadramento, habilitação, tabela, sinais, verbete, produtos, linhas, música, leitura) | **TUDO CERTO** em todas |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · **TUDO CERTO** · **20/20** |
| `hash-ciclo.sh … --check` · `gerar-indices.js --check` · `check-pacote.js` | **cadeia intacta** · **12 arquivos em dia** · **11 erros, antes e depois** (o pacote da `breu` nunca foi gerado por inteiro: falta o PDF e o `-dados.json`) |
| **a correção do cabeçalho** | a fotografia anterior citava a base `ddcd92a`, que **não é ancestral** de `main` (sobra de um rebase). A base correta é `622071b` |
| **o que NÃO foi medido** | a página **ao vivo** (o deploy corre depois do push) · **nenhuma curadoria real tem `repertorio`** hoje, e nenhuma modalidade tem lista própria de tradições — os dois caminhos medem-se com registos de ensaio |

### Executado nesta fotografia (03/11/2026 — a turma é o ritmo, a curadoria é o ensino)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-enquadramento-da-turma.js` (novo) | **TUDO CERTO — 46 asserções em 5 secções**. **§A** o núcleo: a curadoria que enquadra (pelo nome), a vigente a vencer a substituída, o nível efetivo com a origem dita, **a curadoria a vencer a memória** (controlo negativo da ordem), e a leitura pelo enquadramento a achar a turma **mesmo sem os campos nela** — com o controlo negativo da leitura antiga. **§B** a turma grava o ritmo e **ignora** o enquadramento que o corpo ainda manda (página antiga aberta). **§C** a **memória**: a turma deriva, muda a hora, e o `nivelReferencia` antigo **não é apagado**. **§D** a curadoria: o nível grava, o rótulo é **composto** pela tradição, e a listagem da turma mostra o da curadoria. **§E** a tela: os campos saíram de um formulário, entraram no outro, e **o script compila** |
| `provar-producao` | **149 de 153, MELHOR do que antes** (era 147/152). Duas asserções foram **reescritas em vez de contornadas** — elas afirmavam que a turma tem a tradição em lista, que é agora o contrário da decisão —, e a lista de tradições esperada passou a ser **derivada do catálogo**: estava vermelha desde que a «cubana» entrou. As quatro falhas restantes são as de antes |
| `provar-habilitacao-do-professor` | **TUDO CERTO** — as quatro asserções dos campos do nível mudaram de `#tgrau`/`#tnivel` para `#cugrau`/`#cunivel`, e ganharam uma que mede o **contrário**: que a turma já não os tem |
| `provar-cartao-da-turma` · `provar-teste` · `provar-notacao` | **6 antes e depois** · **a mesma falha antes e depois** · as mesmas 11 antes e depois |
| as outras sete (verbete, tabela, leitura, sinais, produtos, linhas, música) | **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** · **89 asserções** · **TUDO CERTO** · **TUDO CERTO** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · **TUDO CERTO** · **20/20** |
| **o que NÃO foi medido** | a página **ao vivo** (o deploy corre depois do push) · **nenhuma turma real tem curadoria com nível**: a `breu` ainda não tem turmas, e o caminho mede-se com registos de ensaio — o primeiro uso a sério é dela |

### Executado na fotografia anterior (03/11/2026 — o perfil do professor, a turma descontinuada, o nível)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-habilitacao-do-professor.js` (novo) | **TUDO CERTO — 62 asserções em 5 secções**. **§A** o núcleo: perfil que nasce habilitado, id desconhecido recusado, **zero modalidades aceite**, e as três turmas que **não** se descontinuam. **§B** o ficheiro pela rota de verdade: grava em `professores/<slug>/perfil.json` e **nada sob o prefixo da escola**, o `criado` não se reescreve, professor de outra escola → **403**, sem senha → **401**. **§C** a consequência: acende, **não apaga**, e **volta atrás**. **§D** o expurgo: preservado, e a guarda com **controlo negativo**. **§E** o nível: RAD numerada, graus nas outras, texto antigo preservado, e os quatro campos no formulário |
| `tools/criar-escola.sh` | **medido num clone de ensaio** (árvore do `HEAD` + o script): cria o perfil com a modalidade principal; na **2.ª** e **3.ª** escola do mesmo professor **reusa-o** e não sobrescreve o que ele já declara |
| `provar-producao` | **147 de 152, depois como antes** — contadas as falhas com e sem a mudança |
| `provar-cartao-da-turma` · `provar-teste` | **6 antes e depois** · **a mesma falha antes e depois** |
| `provar-verbete` · `provar-tabela-da-notacao` · `provar-leitura-da-decomposicao` · `provar-sinais-da-modalidade` · `provar-produtos` · `provar-linhas-da-lista` · `provar-musica-do-verbete` | **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** · **89 asserções** · **TUDO CERTO** · **TUDO CERTO** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · **TUDO CERTO** · **20/20** |
| **o que NÃO foi medido** | a página **ao vivo** (o deploy corre depois do push) · a **migração** das turmas existentes: nenhuma tem `modalidade`, o campo nasce vazio, e uma turma sem modalidade **não** é descontinuada — é a decisão, não um esquecimento |

### Executado na fotografia anterior (03/11/2026 — os dois sinais novos e o dono da modalidade)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-sinais-da-modalidade.js` (novo) | **TUDO CERTO — 29 asserções em 4 secções**. **§A** o signo: `cp` e `cdp` no grupo das posições com o nome em francês; são sinais conhecidos do validador; **o bloco do frappé (`[Perna: ED cdp ↓ ↑]`) lê-se** e o do coupé também; um verbete que usa os dois **compõe**; e a **contraprova** — tirados os dois sinais, o mesmo verbete cai em `sinal-desconhecido`; versão ≥ 38 e o acrescento declarado no comentário. **§B** o nome: os quatro empréstimos da D-67 com o nome internacional, nenhum a dizer «colo» ou «atitude», e as cinco posições **a continuar em português**. **§C** a rota: 200, `modalidade` na resposta, os dois sinais no grupo certo com nome e significado, e a posição com o nome internacional. **§D** o acoplamento: **10 sítios** de `motor/` escrevem a modalidade à mão (impressos um a um), a porta declarada existe, e **nenhum** registo de escola declara `modalidade` |
| `node experimentos/provar-notacao.js` | **as mesmas 11 falhas de antes, contadas uma a uma (stash × unstash)** — e o acrescento ao alfabeto **esteve a ponto de introduzir a décima segunda**: a palavra «meia-ponta» é o nome de uma escola, e a varredura de nomes de escola dentro de `biblioteca/modalidades/` apanhou-a. O texto passou a «pé alongado». Fica dito porque é a armadilha: **um sinal novo escreve-se sem os nomes das escolas** |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** |
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 89 asserções** |
| `node experimentos/provar-tabela-da-notacao.js` · `provar-leitura-da-decomposicao.js` | **TUDO CERTO** · **TUDO CERTO** |
| `node tools/check-indices.js` · `check-schemas.js` · `check-identidade.js` | **14/14** · **TUDO CERTO** · **20/20** |
| **o que NÃO foi medido** | a página **ao vivo** — a conferência é dela, e o deploy só corre depois do push. Nenhum verbete real usa ainda os dois sinais: não havia nenhum para converter |

### Executado na fotografia anterior (03/11/2026 — a notação em três colunas e o trecho dobrado)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-tabela-da-notacao.js` (novo) | **TUDO CERTO — 41 asserções em 3 secções**. **§A** o dado: `repeticoes` em cada linha, os compassos **1 e 3**, o recurso a conhecer a mesma frequência; **§B** a listagem em jsdom: **três** colunas, o «o que acontece» fora do cabeçalho, **uma** definição acima da tabela e **nenhuma** dentro das linhas, as células a dizer «1 · 1–2 (duas vezes) · [Perna: …]» e «3 · …», e o caso das **duas frases diferentes** com as duas à vista; **§C** o passo 6: uma dobra por trecho, **todas fechadas**, o resumo com «compasso 1 · contagem 1–2 ×2», **um** parágrafo de prosa fora das dobras, abrir mostra a leitura, e o estado **sobrevive ao duplicar** |
| `node experimentos/provar-leitura-da-decomposicao.js` | **TUDO CERTO — 25 asserções** |
| `node experimentos/provar-musica-do-verbete.js` | **TUDO CERTO — 33 asserções** |
| `node experimentos/provar-verbete.js` · `provar-produtos.js` · `provar-linhas-da-lista.js` | **TUDO CERTO** · **TUDO CERTO — 89 asserções** · **TUDO CERTO** |
| `node tools/check-identidade.js` | **20/20 `ok`** — e o `dito` passou a **gancho declarado** (14): a dobra é comportamental, quem desenha é o `details` nativo |
| **o alfabeto real, pela rota da listagem** | `Battement tendu` (`8|2/4@breu`): **2** linhas, compassos **1 e 3**, contagem **1–2**, `repeticoes` **2** — «1–2 (duas vezes)» nos dois, e **uma** frase distinta |
| `node experimentos/provar-producao.js` | **147 de 152, depois como antes** — as cinco falhas são as de antes e nenhuma toca o que esta entrega mudou |
| **o que NÃO foi medido** | **pixéis** — sem navegador nesta bancada, a altura não se mede; mede-se a prosa à vista (251 de 385 caracteres). A geometria em navegador é a das provas `provar-celular`/`provar-producao` |

### Executado na fotografia anterior (03/11/2026 — a listagem lê o que está gravado)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-leitura-da-decomposicao.js` (novo) | **TUDO CERTO — 25 asserções em 4 secções**. **§A** o caso relatado: a rota responde 200, o exercício aparece, a música sai **sem o dono na chave** e **com** o dono declarado, os **dois** trechos são contados **e lidos** — «era aqui que a lista dizia 'não pôde ser lida'» —, sem motivo nenhum porque a composição fechou, o primeiro no **compasso 1** e o segundo no **3** (dois compassos de 2/4), a contagem e a frase que ela escreveu ao lado, e a página **já sem a frase**; **§B** a vista: a `breu` lê a sua, a `maria` e uma terceira leem a do catálogo; **§C** a leitura **não deita fora o gravado**: a conta que não fecha mostra as linhas **e** o motivo, com os dois números, uma numeração 1–2 / 5–6 também se lê, e sem trechos o motivo di-lo; **§D** o alfabeto usado é o **lido do repositório**, e não o embutido no build |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — a planta passou a ser **música a música**: plantar «o exercício» dava por coberta a música do catálogo (`8|4/4`) só porque o exercício já existia com a música da escola (`8|2/4@breu`) |
| `node experimentos/provar-musica-do-verbete.js` | **TUDO CERTO — 33 asserções** |
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 89 asserções** |
| `node experimentos/provar-linhas-da-lista.js` | **TUDO CERTO** |
| `node tools/check-identidade.js` | **20/20 `ok`** |
| **o que NÃO foi medido** | a página **ao vivo** — **nenhuma carga ao ar** nesta sessão; a conferência é a dela, no próximo `F5` |

### Executado na fotografia anterior (03/11/2026 — a música sem trava, e o alfabeto com dono)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-musica-do-verbete.js` (novo) | **TUDO CERTO — 33 asserções**. **§A** a divergência sai em `avisos` e a gravação **passa**, com o verbete escrito; **§B** a página da Produção em **jsdom**: o campo da música está **aberto**, duplicar **não** reescreve os tempos (8 continua 8, e os trechos 8 → 16), o selo aparece e desaparece, e mudar tempos **e** compasso **não apaga** a decomposição; **§C** o dono do alfabeto: a chave com e sem dono, as três vistas (catálogo, breu, maria), a composição do documento a escolher a versão de cada uma, a escola a gravar sem tocar no catálogo, e o apagar a só levar os registos de quem apaga |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — com três asserções reescritas para a regra do dono (a escola **não** apaga o catálogo; apaga o que é dela; a lista da escola deixa de mostrar a versão dela) e a do `criar`, que passou a recusar por (dono, exercício, música) |
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 89 asserções** |
| `node experimentos/provar-linhas-da-lista.js` | **TUDO CERTO** |
| `node tools/check-identidade.js` | **20/20 `ok`** — os dois selos novos usam estados que já existem na folha (`alerta`, `discreto`, `dim`) |
| **os vermelhos de antes, comparados** | `provar-notacao` **11 antes e depois** · `provar-cartao-da-turma` **7 antes e depois** · `provar-derivados-da-sequencia` **2 antes e depois** · `provar-producao` **5 antes e depois**. Contados stashed/unstashed: **nenhuma regressão introduzida** |
| **o que NÃO foi medido** | a página **ao vivo** — nenhuma carga ao ar nesta sessão · o expurgo da `breu`, que é ela que faz pela tela |

### Executado na fotografia anterior (03/11/2026 — o termo da tela, o alfabeto sem dono e o deploy do catálogo)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 89 asserções**. Esteve **vermelho duas vezes** por causa do termo criado na tela, e a causa era a régua: §G comparava a contagem do produto do catálogo com o comprimento do ficheiro, que passou a poder guardar termos de escola e a contar duas vezes o mesmo `id`. Agora compara com o **subconjunto do catálogo** (`separarPorEscola`) |
| `node experimentos/provar-verbete.js` | **TUDO CERTO**. §I e §J liam `celulas.devant[…]` de um verbete real que passou a existir com a pista `a-la-seconde` (o teste morria num `TypeError`); passam a percorrer as pistas que houver. E a asserção do bundle compõe o que **aquela** escola vê, em vez de comparar com o seed cru |
| `node tools/check-identidade.js` | **20/20 `ok`** |
| **o vocabulário, depois de retirar o termo da breu** | **93 termos**, **0** com `escola`; alfabeto **v32** com **1** verbete (`Plié`) |
| **a edição paga** | **25** fora, no catálogo e na `breu` — era **26** na breu enquanto a sombra sem `fonte` vencia |
| **as lacunas** | **147** (eram 146 com o verbete da escola, que dava decomposição ao termo do catálogo) |
| **as três escolas, pelo mesmo código** | `batata` 93 · `maria` 93 · `breu` 93 — e antes da limpeza a `breu` via o **seu** «Battement tendu» sem `fonte`, as outras o do catálogo **com** `fonte` |
| **o expurgo da `breu` — calculado, NÃO executado** | sairiam **17 ficheiros** + KV + Worker; sobreviveria `escola/breu/indice.json` com mais um elo. **Ela decidiu não purgar agora** |
| **o deploy do catálogo** | `508d22f` → «Publicar as escolas» **success**; `https://breu.tmenegaz77.workers.dev/bastidores/producao` responde **200** e tem **0** ocorrências do texto da escola («direcoes, devant») |
| **o que NÃO foi medido** | o **alfabeto com dono** (é decisão dela) · o **expurgo** (não pedido agora) · o contrato (C8) · a chave `plano` · a fase 3 · a aula pronta · os três `exige/ensina/expressa` (**0** das 9 unidades) |

### Executado na fotografia anterior (02/11/2026 — a fotografia datada, o dono do termo e o lugar do plano)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 89 asserções** (eram 73). **§L** a fotografia: a forma `catalogo@AAAA-MM-DD` com o commit, **a mesma duas vezes seguidas** (prova de que não é o relógio), catálogo inexistente **não inventa data**, a lacuna `sem-fotografia` quando não há, e a licença citável a levá-la. **§M** o dono do termo: sem dono = catálogo; sem `--escola` as adições de todas ficam **declaradas** (`deOutras`), não perdidas; o dicionário do catálogo não tem o termo de A nem o de B; a edição de A tem o de A e **não** o de B; e o `--escola` do CLI chega ao manifesto |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — o CRUD do verbete continua a gravar no repositório sem tocar no vocabulário |
| `node tools/check-identidade.js` | **20/20 `ok`** — nada na tela mudou, e a checagem confirma-o |
| **a fotografia, no catálogo de hoje** | `catalogo@2026-11-02` (`23d4c0e`) — calculada do `git`, igual em duas execuções |
| **as lacunas do dicionário** | **147** — a `sem-fotografia` **não** aparece, porque a data existe; continuam `termo-sem-fonte` 59 · `exercicio-sem-verbete` 54 · `termo-sem-definicao` 34 |
| **a edição paga** | **25 definições fora** — o mesmo número da §10.4 |
| `git fetch origin` | **feito com o token de `.dev.vars`** (via `GIT_ASKPASS`, a variável que faltava): `origin/main` em **`885a2ad`**, **0** commits atrás e **1** à frente (`4e1593a`). A primeira tentativa falhara por `could not read Username` — não era o remoto, era o ambiente |
| **o que NÃO foi medido** | o **contrato** (C8) · a chave `plano` num ficheiro do repositório (`ESCOLA.conf` não existe) · a **fase 1** ao pé da letra (o ficheiro é um) · a **fase 3** (a âncora do produto) · a **aula pronta** (não existe) · os três `exige/ensina/expressa` continuam a **0 das 9 unidades** (P-16) |

### Executado na fotografia anterior (02/11/2026 — a licença em texto e a camada herdada)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 73 asserções** (eram 52). Três secções novas. **§I** a herança: o campo que só o termo declara é **herdado**, o que a relação declara **sobrepõe**, o que nenhum declara fica **ausente**, a camada só está completa sem ausentes, e o manifesto conta `3 · 3 · 6` numa fixture de quatro unidades — a soma que impede uma unidade de desaparecer da conta sem desaparecer do documento. **§J** a licença: é lida do **título** de `biblioteca/LICENSE.md`, cita o caminho, o ficheiro existe, e o documento gerado pelo CLI traz a licença real — sem `--licenca`, e **não** «pendente». **§K** a edição paga: com três termos (sem origem · com origem · sem definição), a `paga` retira só a primeira, di-lo no sítio dela, **mantém o termo**, mantém a segunda, conta `1` no manifesto, muda o **tipo** da lacuna (`descricao-fora-da-edicao-paga`) e deixa o termo sem definição como lacuna **nas duas**. E o `--edicao paga` do CLI chega ao manifesto — a regra existiria no núcleo e não chegaria a quem gera, que é a forma mais comum de uma regra nascer morta |
| **a condição de conteúdo, medida no catálogo** | `--edicao paga` deixa fora **25 definições** — o **mesmo número** que a `ARQUITETURA-GERAL.md` §10.4 tinha medido à mão a 02/11/2026. Duas medições independentes, o mesmo 25 |
| **as lacunas do dicionário** | **147** (eram 148): a `sem-licenca` desapareceu porque o gerador passou a **ler** o ficheiro. Ficam `termo-sem-fonte` 59 · `exercicio-sem-verbete` 54 · `termo-sem-definicao` 34 |
| **o que NÃO foi medido** | a **fotografia datada** da licença — é do **contrato** (C8), e sem contrato não há data para nomear · a **fase 1** (a separação dos ficheiros), a **fase 3** (a âncora do produto), a **fase 4** (C11) · os três `exige/ensina/expressa` continuam a **0 das 9 unidades**: a forma está pronta, o conteúdo é dela (P-16) |

### Executado na fotografia anterior (02/11/2026 — o motor dos produtos: dicionário e syllabus)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 52 asserções**, numa prova **nova**. **§A** a fronteira (os três módulos de produto, nenhum com `fs`/`path`/`http`/`process`, nenhum a olhar o relógio). **§B** o dicionário sobre uma fixture declarada: a ordem das categorias, a definição e a origem em falta em `[Preencher]`, a tabela com o **compasso por pista** (1, 1, 2, 2), a notação composta, o verbete que **não fecha** em `[conferir]` com o motivo e **sem publicar** a contagem, o exercício sem verbete, e o `_comentario` que não vira exercício. **§C** o syllabus: a **ordem declarada**, a camada pedagógica quando existe, a relação órfã, o nível sem unidades, o `--nivel` e a **recusa** de um nível inexistente. **§D** as adições excluídas por omissão e incluídas quando pedidas, com o selo `origem`. **§E** o determinismo (mesma entrada, mesmo byte). **§F** o ritmo fora dos manifestos e dos documentos (C19). **§G** o catálogo de verdade — só **contagens**, e nenhuma afirmação sobre o conteúdo. **§H** o CLI: escreve no destino, o `--json` dá um manifesto legível, o `--out -` e o `--nivel` funcionam |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — sem regressão: `lerProgressao` foi acrescentada a `verbete.js` e o `lerModalidade` não mudou |
| `check-identidade` · `check-indices` | **20/20** · **14/14** — o produto não emite marcação, e o índice do acervo não muda |
| **o que NÃO foi medido** | a **aula pronta** (não existe), a **fase 1** (a separação dos ficheiros não foi feita — o critério 5 do plano **não passa**), a **fase 3** (sem âncora e sem `LICENSE.md`), a **fase 4** (depende de C11) · `provar-producao` e `provar-cartao-da-turma` continuam com os vermelhos de antes (iguais aos do `0e2ac45` limpo) · `provar-teste` continua a parar na asserção de frequência, também de antes |

### Executado na fotografia anterior (02/11/2026 — a segunda passagem: rótulos, travões e o apagar fora do passo 6)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **TUDO CERTO — 226 asserções** (eram 219). A **§24-C** passou a medir o contrário do que media: escolhido um exercício no passo 2, os três campos do passo 1 ficam **`disabled`**, com a categoria preenchida (`passo`) e a nota a dizer que a definição é do dicionário. A **§24-F** também: o «Apagar o verbete» **não está no passo 6** (nem na marcação nem no script) e continua na listagem. Novas: **§24-G** (só o passo 1 e o 2 abertos sem exercício nem música, do 3 em diante fechados, o «Voltar» desactivado no 1 e activo no 2, e o «Seguir» do passo 3 a dizer «quantos tempos» quando falta a música) e **§24-H** (o «Acrescentar trecho» desactivado sem sinais, com o motivo no `title`). A tradição passou de `FRANCESA` a `Francesa` em três asserções |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — a §H foi **reescrita**: o rótulo é o do ficheiro (`Francesa`, `Vaganova`, `Cubana`, `Compartilhada`, `RAD`), o mapa `rotulos` tem uma entrada por tradição, os quatro selectores concordam, e **nenhum `value` se repete** — é a asserção que guarda a `Compartilhada` duplicada que ela viu. O dado continua a gravar as **chaves** |
| `node experimentos/provar-teste.js` | **falha mais adiante, e a falha de topo desapareceu.** A §7 («a Produção nasce com turma, rubrica, termo e aluna preenchidos») **passa** — era ela que estava vermelha com `'' !== 'Jeté'`. A prova pára agora na §«frequência, duração e calendário vêm do cadastro da turma», com `contexto-frequencia: null`; **medido em `0e2ac45` limpo com a asserção do termo relaxada, a mesma falha acontece** — não é regressão desta entrega, e não foi tocada |
| `provar-notacao` · `check-indices` · `check-identidade` | **48 asserções, 0 falhas** · **14/14, e as 10 contraprovas reprovam como deviam** · **20/20** (inclui a checagem 8 «Peça») |
| `provar-producao` · `provar-cartao-da-turma` | **147 de 152** · **6 falhas** — as duas listas são **iguais às do `0e2ac45` limpo**, verificadas por stash: o `className` do item do menu, as «explicações» dos formulários, e a contagem das pílulas. Anotadas como vermelho de antes no `TRANSFERENCIA-IA.md`, não como regressão |
| **as três fixtures do `breu`** | `validarVerbete` aceita as três: `Plié` (8\|4/4, duas repetições de `1–4` na pista `Perna`), `Battement tendu` e `Battement fondu` (en croix em `devant`/`derriere`, `cobre: 8`). O `Pirouette`/`Épaulement`/`Fondu` saíram do vocabulário **e** das curadorias |
| **não executado / vermelho de antes** | `provar-plano-completo` falha antes desta entrega (§14) · `provar-agnosticismo` (o ficheiro não existe neste worktree) · `provar-o-que-vem-do-dado` (sem fixture) · `check-glossario` (sem par registro × glossário) |

### Executado na fotografia anterior (02/11/2026 — proveniência do verbete, versões datadas e as tradições)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — três secções novas. **§G**: o `DELETE` recusado por plano (409, com «lacuna» e «descontinuar»), **o índice lido uma vez**, o mesmo `DELETE` aceite quando ninguém usa o verbete, e a **curadoria** como segunda porta (409, com o professor nomeado). **§I**: o `estadoDoVerbete` em seis casos (sem histórico, antes, no dia, depois, antes de tudo, e **duas versões fora de ordem**), a gravação sem vínculo a não criar histórico, com vínculo a criar (`ate` + motivo) e a manter o corrente, o segundo ajuste a acumular, e nenhuma versão com `versoes` dentro. **§J**: **fim a fim** — o mesmo envelope com data de antes do ajuste sai com a notação antiga, e com a de depois sai com a de hoje, com o alfabeto restaurado no fim. **§H**: a lista servida é a do ficheiro, a CUBANA, a ordem, o rótulo em caixa alta, os quatro selectores, e o `value="Francesa"` extinto |
| `node experimentos/provar-celula.js` | **219 de 219** (eram 203) — a **§24** é nova: o bloco do passo 1 desactivado sem nome (com `aria-disabled` e a nota), a acordar com o nome, a reabrir com o exercício escolhido; o método a herdar `FRANCESA` e depois `CUBANA`, a escolha à mão a sobreviver, e o valor gravado a ser a **chave**; o «Gravar» desactivado sem trechos, com título e nota; e o «Apagar» do passo 6 a existir só com exercício escolhido |
| `provar-notacao` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | **89/89** · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · TUDO CERTO · **20/20** — o «Apagar» do passo 6 usa a peça `.acao.perigo`: escrito na marcação servida, o gancho `.apagar` deixaria de ser gancho e passaria a classe sem desenho, e a checagem reprovou-o com razão |
| **o defeito que a §H apanhou** | o `<select>` do método tinha `value="Francesa"` e a tabela do alfabeto a coluna `francesa`: a nota dizia sempre «O alfabeto não declara esta posição em Francesa». O valor passou a ser a chave |
| **`provar-notacao`** | **48 asserções, 0 falhas, 7 NÃO MEDIDAS** — o alfabeto ficou sem verbetes (ela apagou os 11, versão 30), e as secções que compõem exercícios nomeados declararam-se não medidas em vez de se plantarem verbetes inventados. As provas deixaram de depender do conteúdo editorial: `provar-verbete` **planta** os exercícios de que precisa |
| **não executado / vermelho de antes** | `provar-plano-completo` falha **antes desta entrega** (medido no `cc54844` limpo: a §14 compara `['aula-de-cada-objetivo','aspecto-fisico']` com `[]`); não foi tocado, e a prova do versionamento fim a fim foi posta em `provar-verbete` §J, que é versionado e verde · `provar-agnosticismo` (o ficheiro não existe neste worktree) · `provar-o-que-vem-do-dado` (sem fixture) · `check-glossario` (sem par registro × glossário) |

### Executado na fotografia anterior (02/11/2026 — a música travada, o verbo apagar e os passos arrumados)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **203 de 203** (eram 178) — a **§23** é nova, com 25 asserções: o campo da posição ausente e a nota que diz para onde ele foi; os tempos `readOnly` e o compasso `disabled` com trechos, com `aria-readonly` e a nota que manda ao «Duplicar»; o `<details class="dito">` **fechado** e o «lê-se»; a frase **zero** vezes na tabela e **uma** na prévia; o passo 1 condicional (sem nome, nada falta; com nome, faltam três); os dois escolhedores **vazios**; o `DELETE` com `{nome, modalidade, token}`; a pergunta que diz «lacuna» e «dicionário»; o recado com a versão nova; o formulário a sair de cima do verbete apagado; a música a **libertar-se**; e **a página não recarregar** |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — a **§C-2** é nova: 401 sem token, 400 sem nome, 404 pelo nome, apaga e **sobe a versão**, o exercício sai com **todas** as músicas, os outros ficam, a mensagem do commit, a lista deixa de o mostrar, e **o vocabulário não é escrito nem apagado**. A §D passou a medir a guarda nova (400 sem nome) no lugar do 409 antigo |
| `provar-notacao` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | **89/89** · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · TUDO CERTO · **20/20** |
| **dois defeitos encontrados a medir** | o compasso da prévia dizia sempre «—» (`compassosDosTrechos()[d.termo + ":" + k]`, com `d` a ser uma chave e não a direção); e o «Apagar» do verbete **recarregava a página**, porque caía no ouvinte genérico do `button.apagar` e mandava o corpo para `/api/bastidores/null`. Os dois corrigidos, e o segundo com uma asserção que conta as navegações |
| **não executado** | `provar-agnosticismo` (o ficheiro não existe neste worktree) · `provar-o-que-vem-do-dado` (sem fixture) · `check-glossario` (sem par registro × glossário) |

### Executado na fotografia anterior (02/11/2026 — o cartão da listagem e o vocabulário expandido)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **177 de 177** (eram 172) — a §21-B ganhou cinco: as três caixinhas do cartão, os valores da **música daquela linha**, o painel a abrir **só ele**, a tabela com o compasso e os sinais do motor, e o segundo toque a fechar |
| `node experimentos/provar-notacao.js` | **89 de 89** (eram 79) — dez novas: `Cabeça` é categoria **e** pista; `↻`/`↺` e `○`/`●` são pares; os lados cobrem os três eixos; as direções novas existem e nenhum termo se repete; `profil` existe e o épaulement já não diz «ombros rodados» |
| **a geometria do cartão** | fechado: **285 px a 320 · 192 a 390 · 142 a 768 · 161 a 1280**; aberto (a tabela da notação): sem transbordo em nenhuma largura, e a página com **0** |
| **o editor, no browser** | as pílulas mostram `○ abre`, `↻ rotação para dentro`, `↻ para dentro`, `↺ para fora`, `ombro à frente`, `de lado · perfil`; as categorias são **cinco**, com `Cabeça` |
| **uma célula de Cabeça, de ponta a ponta** | `validarVerbete` aceita; `pistasDe` devolve `Cabeça: 4`; e um verbete com o balde `para-fora` também passa |
| `provar-verbete` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | TUDO CERTO · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · TUDO CERTO · **20/20** — a checagem «Peça» confirma que **não nasceu classe sem dono** |
| **não executado** | `provar-agnosticismo` (o ficheiro não existe neste worktree) · `provar-o-que-vem-do-dado` (sem fixture) · `check-glossario` (sem par registro × glossário) |

### Executado na fotografia anterior (02/11/2026 — a substituição e a bancada da listagem)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — quatro asserções novas: com `musicaAnterior` a música antiga **sai** e a mensagem diz «substitui a música 4\|4/4»; **sem** ela ficam as duas; `musicaAnterior` **igual** à nova não apaga o trabalho |
| `node experimentos/provar-celula.js` | **172 de 172** (eram 167) — a **§20-E** é nova: antes de mexer na música não há substituição a anunciar; com a música mudada a nota e a caixa aparecem e dizem qual sai; o corpo leva `musicaAnterior: "4\|4/4"` sem a caixa e **não leva** com ela |
| **o risco, medido antes de escrever** | nenhum plano de ensino usa o `Plié` (`professores/**/*.json`) — apagar a música antiga não deixa ciclo em lacuna |
| `node experimentos/propostas/construir.js` | **10 páginas** (antes, sem pacote: **zero**) — a do título sai como página de ausência, com o motivo e o comando |
| **a bancada, em quatro larguras** | altura por cartão (320 · 390 · 768 · 1280 px): **linha 66 · 66 · 66 · 66** · **cartão 198 · 142 · 123 · 123** · **à vista 561 · 478 · 406 · 406**; **nenhum transbordo** |
| **a bancada, no browser** | o «?» de *Notação* abre **o painel do cartão em que se carregou** (não o do primeiro), com os 4 trechos do `Plié` e o compasso derivado pelo motor; `Escape` fecha; nenhum erro de JavaScript |
| `provar-notacao` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | **79/79** · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · TUDO CERTO · **20/20** |
| **não executado** | `provar-agnosticismo` (o ficheiro não existe neste worktree) · `provar-o-que-vem-do-dado` (sem fixture) · `check-glossario` (sem par registro × glossário) |

### Executado na fotografia anterior (02/11/2026 — a porta da música, os passos, a troca do sinal)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **167 de 167** (eram 158) — a secção **20-D** é nova e mede a troca no lugar: marcar a ficha 2 de cinco, trocar por outro sinal, vizinhos intactos, a marca a desaparecer, o «×» a desfazer a marca quando os índices andam para trás, o clique repetido a desistir, e a paleta a voltar a acrescentar sem marca. A **§20** e a **§21-B** passaram a medir **um painel de cada vez**; a listagem mede-se **por música**, e o francês tem de estar **ausente** |
| **o fluxo dela, de ponta a ponta** | abrir o `Plié` (`8\|4/4`, 4 células) → duplicar (**8 células, 16 tempos, `16\|4/4`**) → editar um trecho (passo 6, um painel) → ir ao 5 (só o 5) → voltar ao 6 → gravar. **O corpo enviado: `{musica: "16\|4/4", cobre: 16, celulas: 8}`** |
| **a listagem com o dado real** | **duas linhas** para o `Plié` — «8 tempos · 4/4 · 4 trechos · Perna, Braço» e «16 tempos · 4/4 · 8 trechos · Perna, Braço»; a segunda abre `16\|4/4` com cobertura **16** |
| **a listagem em quatro larguras** | 320 · 390 · 768 · 1280 px: **14 linhas, nenhum transbordo** — medido com os contentores **abertos** (um painel fechado mede zero, e zero passa em qualquer comparação) |
| `provar-verbete` · `provar-notacao` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | TUDO CERTO · **79/79** · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · TUDO CERTO · **20/20** — a peça nova (`.chip.em-troca`) passou «Peça» e «Aresta» |
| **não executado** | `provar-agnosticismo` — **o ficheiro não existe neste worktree** (nunca foi versionado; a fotografia anterior citava-o) · `provar-o-que-vem-do-dado` (sem fixture desde o expurgo) · `check-glossario` (sem par registro × glossário) |

### Executado na fotografia anterior (02/11/2026 — a duplicação do exercício)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **156 de 156** (eram 150) — a secção **20-C** é nova: o «Duplicar» aparece quando há trechos, duplicar duplica a decomposição (4→8 células) e a cobertura (4→8), os tempos sobem para 8 sozinhos e `MUSICA_EM_FOCO` acompanha (`8\|4/4`), as cópias caem nos compassos **1,1,2,2** e o `1ª` do braço fica onde está; e uma guarda de que **trocar de exercício limpa** a decomposição |
| `node experimentos/provar-notacao.js` | **79 de 79** (eram 78, e o ficheiro **estourava a meio**) — quatro fixtures afirmavam a forma de um dado que melhorou: a direção `devant` que o `Plié` já não tem, os braços «no primeiro compasso» quando atravessam dois, o `'devant'` escrito à mão, e a linha composta `[Perna: 1ª ↓]` copiada do dia |
| `provar-verbete` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | TUDO CERTO · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · TUDO CERTO · **20/20** — a peça nova é o `acao secundario` que a folha já tem |
| o script emitido | `node --check` passa no `<script>` que `paginaProducao` serve, e o botão está no HTML |
| **o que se tentou e reverteu** | conservar as células quando a música ainda não existe → **13 asserções** do `provar-celula` passaram a medir o exercício anterior. Revertido; o `carregarRascunho` ficou como estava |
| **não executado** | `provar-o-que-vem-do-dado` (sem fixture desde o expurgo da `batata`) · `check-glossario` (não há par registro × glossário) · `provar-producao` e `provar-cartao-da-turma`, cujas falhas conhecidas são anteriores a esta entrega |

### Executado na fotografia anterior (02/11/2026 — a correcção de um trecho não muda o compasso)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **143 de 143** (eram 134) — a secção **20-A** é nova e mede o cenário dela de ponta a ponta: três trechos de `Perna` em 2/4 dão compassos **1, 1 e 2**, corrigir o primeiro **não** muda a sequência e a linha corrigida continua a ser a **primeira**; a área do trecho está toda à vista em edição (4, 5 e 6) e fecha-se ao guardar; «Acrescentar trecho», «Guardar» e «Cancelar» não mudam de passo |
| `provar-verbete` · `provar-notacao` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-forca-e-flexibilidade` · `provar-agnosticismo` | TUDO CERTO · **78/78** · TUDO CERTO · **50/50** · **17/17** · **44/44** — o agnosticismo confirma que a função nova não trouxe infraestrutura para o núcleo |
| `provar-celula` | **150 asserções** (eram 148) — a **20-B** é nova: `limparBaldesVazios` deixa o mapa sem chaves vazias e o `×` do último trecho leva a direção consigo. A 15-A é a e mede a conta no cenário dela (perna 8, braço 8, verbete **8**, não 12); a 15 ganhou duas: a recusa **não muda de passo** e a mensagem fica na página |
| `provar-producao` · `provar-cartao-da-turma` | **151/152** · **6 falhas** — as duas iguais a antes, **não são regressões** |
| `check-indices` · `check-identidade` | **14/14** · **20/20** |
| **não executado** | `provar-o-que-vem-do-dado` — continua sem fixture desde o expurgo da `batata` |

### Executado na fotografia anterior (02/11/2026 — as pistas, a repetição, a métrica e as posições)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **134 de 134** (eram 130) — as quatro novas medem o 6/8 ordenado por pulso, a legenda que nomeia a pista, o campo da repetição (1× a 4×) e o do método (com a herança na primeira opção) |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — sete asserções novas: duas pistas em paralelo fecham pela maior, o `cobre` que soma as pistas é recusado **com as duas contas na mensagem**, a repetição multiplica, a repetição inválida é recusada, o método-frase é recusado, o bloco de posições é um só com a preparatória e o rótulo duplo, e a rota serve as posições de braços |
| `node experimentos/provar-notacao.js` | **76 asserções, 0 falhas** (eram 74) — o `Plié` dá **quatro** segmentos em **duas** pistas, a das pernas atravessa os dois compassos e a dos braços vive no primeiro |
| `provar-producao` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | **151/152** (a falha conhecida do item do menu) · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `provar-cartao-da-turma` | **6 falhas — as mesmas de antes**, e a própria saída mostra porquê: a lista de passos conta «1 O exercício novo … 6 A decomposição», a tira do verbete, junto dos três passos da turma. **Não é regressão** |
| `provar-o-que-vem-do-dado` | **NÃO CORREU** — depende dos envelopes da `batata`, expurgada hoje. A prova declara «conferência NÃO FEITA» em vez de passar por vácuo. **Fica sem fixture** |
| `node tools/check-indices.js` · `check-schemas.js` · `check-identidade.js` | **14/14** · TUDO CERTO · **20/20** |
| **o motor, medido à mão** | `compor` do `Plié` em «8\|4/4» → **`composto`**, cobertura **8**, resto **0**; o `Battement fondu` continua `parcial` (6 numa música de 2) |
| **não executado** | `tools/check-glossario.js` — não há nenhum par registro × glossário no repositório, porque a única escola com documentos foi expurgada |

### Executado na fotografia anterior (02/11/2026 — a licença e o pacote próprio)

Esta entrega **não alterou código**: é decisão, mais a correção de uma citação. O que se mediu foi o
que a decisão exigia saber.

| Verificação | Resultado |
|:--|:--|
| **o repositório é privado** | `tmenegaz/danca`, `private: true`, `license: null` — pela API do GitHub, 02/11/2026. Não há distribuição pública, logo a licença é decisão de negócio e não de compatibilidade |
| **não há conteúdo de terceiros** | `tools/templates/marca/` — 4 SVG da marca do projecto; `tools/templates/ciclo.css:76-77` — `--serif: Georgia…` e `--ui: system-ui…`, **sem ficheiro de fonte embutido**; RAD/Vaganova são nomes de posições |
| **a proveniência das descrições** | `vocabulario.json`: 93 termos, **59 com descrição**; `fonte` = 30 do dicionário fornecido, 4 «redigida no projeto», **59 vazio** — e **25 das 59 com descrição estão sem `fonte`** |
| **a citação da licença** | `sed -n '109p' ARQUITETURA-GERAL.md` → o diagrama do deploy; `grep -n 'licen'` → **uma** ocorrência (§5, «nem licença»); `git log --all -S'Licença do repositório' -- ARQUITETURA-GERAL.md` → **vazio**. A frase está em `REGISTRO.md:109`, entrada de 18/09/2026 |
| `node tools/check-indices.js` | **14 verificações, 0 falha(s)** — TUDO CERTO |
| `node tools/check-schemas.js` | TUDO CERTO — o molde e os professores dizem o mesmo contrato |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| **não executado** | as provas de browser — nenhuma linha de código do motor mudou nesta entrega |

### Executado na fotografia anterior (02/11/2026 — os três produtos e o plano do motor)

Esta entrega **não alterou código**: é decisão e plano. O que se correu foi o que a documentação pode
partir, e o que se mediu foi o que o plano afirma.

| Verificação | Resultado |
|:--|:--|
| **o núcleo é um só e a fronteira é provada** | `motor/nucleo/` — **21 ficheiros**, sem `fs`/`path`/`http`; `provar-agnosticismo.js` verifica por máquina. É o primeiro argumento do §3 do plano |
| **o glossário já é o dicionário de um ciclo** | `professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2-glossario-benesh.md` — índice de símbolos, verbetes, origem declarada |
| **a Regra 9 é norma e tem faixas no `.conf`** | `solo 30–40% · barra 20–30% · centro 30–40% · musicalidade 5–10%`; `VOLUME_MIN` 80–100 (60 min) e 150–200 (120 min) |
| **o catálogo, medido para as fases** | `progressao.json`: **13 turmas, 9 associações**, e só **2 níveis** com termos (4 e 5); `vocabulario.json`: 93 termos; `notacao.json` v15: 11 verbetes, 13 músicas, 43 células, **4 músicas que não fecham** (o `Plié` fechou com as pistas) |
| **o plano contratado não existe em código** | `raiz/escolas-habilitadas.json` tem `habilitada` e `pagante`; **nenhum campo `plano`** |
| **`tools/` é congelado** | `CONGELAMENTO.md` lista `tools/`, `tools/templates/`, `prompts/` — a entrega do produto **chama** os geradores sem os alterar |
| `node tools/check-indices.js` | **14 verificações, 0 falha(s)** — TUDO CERTO |
| `node tools/check-schemas.js` · `gerar-schemas.js --conferir` | TUDO CERTO · ok (5 schemas) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `tools/hash-ciclo.sh pe-junto 01 batata-bale-nivel-1-teste-2 --check` | ciclo íntegro, cadeia intacta — `b1097a0d…` — **medido ANTES do expurgo**: a variante foi apagada por ela no mesmo dia (`aeb2b2c`), e o comando hoje responde «manifesto da variante não encontrado». O valor fica como **registo datado**, não como estado |
| `node tools/check-pacote.js professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** — **medido antes do mesmo expurgo**; hoje não há nenhum pacote no repositório para validar |
| `indices/acervo.json` depois do expurgo e da criação da `breu` | **1 ciclo, 0 variantes**, `estado: ancorado` — o índice é derivado e acompanhou as duas mudanças (`0e8d256`, `2fd6c07`) |
| **não executado** | as provas de browser — nenhuma linha de código do motor mudou nesta entrega |

### Executado na fotografia anterior (02/11/2026 — três eixos, o ritmo obrigatório e a C22)

Esta entrega **não alterou código**: é fotografia, decisão e registo. O que se mediu foi o código que
já estava lá, para as duas correções, e o que se correu foi o que o `.md` do planejamento pode
partir.

| Verificação | Resultado |
|:--|:--|
| **o modelo tem três eixos** — leitura do envelope real da `batata` | `"eixo"` aparece **uma vez** (`porta/po/conteudo/po.json:196`) e o rótulo é **prefixo por concatenação**: `["Técnica — Barra", "Técnica — Centro", "Técnica — Musicalidade", "Técnica — Expressão"]` |
| **o ritmo é obrigatório** — leitura das quatro portas de recusa | `faltaNoRitmoDaTurma` (`bastidores.js:829`) é chamada ao **gravar a turma** (`:7402`), ao **atribuir** (`:7463`, `:7554`) e ao **gerar o ciclo** (`:8203`, `:8343`); o formulário pede dias + hora, duração e período (`:3174`–`:3190`), e a frequência é derivada (`frequenciaDaTurma`, `:822`) |
| **o corpo está no ciclo** | os cinco sítios lidos um a um (anamnese → `linha-de-base` → `restricoes` → `inclusao`/`exclusao` → plano bloco 10); `provar-forca-e-flexibilidade` **17 asserções, 0 falhas** |
| **o átomo, medido para a C22** | `notacao.json` **v15**: 11 verbetes, 13 músicas, 43 células, 11 com `posicao`, 8 dos 13 pares `cobre == tempos`; `vocabulario.json`: 93 termos, 59 com descrição, 30 com `fonte`; `progressao.json`: 13 turmas, 9 associações |
| **as duas leituras do vocabulário** | `lerModalidade` (`verbete.js`) lê do **GitHub**; `termos()` (`bastidores.js:364`) lê do **bundle** — é a razão de o termo criado não chegar ao plano antes do deploy |
| **o catálogo é um ficheiro só** | `termo-repo.js`: `CAMINHO = 'biblioteca/modalidades/bale-classico/vocabulario.json'` — o que a escola acrescenta vai para o catálogo |
| `node tools/check-indices.js` | **14 verificações, 0 falha(s)** — TUDO CERTO |
| `node tools/check-schemas.js` · `gerar-schemas.js --conferir` | TUDO CERTO (o molde e os 18 professores dizem o mesmo contrato) · ok (5 schemas) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `tools/hash-ciclo.sh pe-junto 01 batata-bale-nivel-1-teste-2 --check` | ciclo íntegro, cadeia intacta — `b1097a0d…` |
| `node tools/check-pacote.js professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| **não executado** | as provas de browser (`provar-celula`, `provar-verbete`, `provar-producao`, `provar-cartao-da-turma`) — nenhuma linha de código do motor mudou nesta entrega, e as duas falhas conhecidas (`provar-producao` 151/152, `provar-cartao-da-turma` 6) continuam a ser as de antes |
| **ao ar** | **nada foi publicado por esta entrega antes do push**; o push publica, como sempre (`Publicar as escolas` corre em cada push) |

### Executado na fotografia anterior (02/11/2026 — seis passos, e o exercício novo é o primeiro)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **130 de 130** — o mapa dos passos, as secções 1 e 3–6 reescritas: seis passos na tira, «não tem «+»», «nem «Gravar exercício» nem «Cancelar»», «o «Seguir →» manda UM pedido de termo», «avançar sem nome não grava nada», «o mesmo exercício não entra duas vezes na lista» |
| `node experimentos/provar-verbete.js` · `provar-producao.js` | TUDO CERTO · **151/152** (o item do menu — falha igual em `HEAD`) |
| `node experimentos/provar-acordeoes.js` · `provar-vao-do-botao.js` · `provar-menu-da-producao.js` | TUDO CERTO · **50/50** · **55/55** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| **ao ar** | o push publica (Action `Publicar as escolas`); a conferência é a da página da Produção a servir seis passos |

### Executado na fotografia anterior (02/11/2026 — o cadastro é o passo 1, e a gravação confere a música)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **128 de 128** (eram 122) — as cinco asserções do «modo» foram substituídas por dez do cadastro dentro do passo 1, e há duas secções novas: a recusa por a música não fechar, e o exercício novo sem duplicar a linha |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — a fixture passou a ser coerente (oito tempos de células para a música de oito), e há duas asserções novas: a tela compara a soma com os tempos, e o servidor valida a música |
| `node experimentos/provar-acordeoes.js` · `provar-vao-do-botao.js` · `provar-menu-da-producao.js` | **TUDO CERTO** · **50/50** · **55/55** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| **não são regressões, e ficam medidas** | `provar-producao` **151/152** (o item do menu com `className`) e `provar-cartao-da-turma` **6 falhas** (a tira do verbete entra na contagem dos passos da turma) — as duas falham **igual** com as alterações guardadas, confirmado nesta sessão |
| **ao ar** | **o push publica** — a Action `Publicar as escolas` corre em cada push e não há passo manual (medido na entrega anterior, `8175264`). O que se confere depois do push: que a página da Produção serve o cadastro dentro do passo 1 e que a Aula 01 continua a sair como saía |

### Executado na fotografia anterior (02/11/2026 — a §4 consolidada por compasso e o aspecto físico no plano)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-o-que-vem-do-dado.js` | **TUDO CERTO** — as asserções da §4 passaram a guardar a **forma consolidada**: consolida por compasso, mostra a contagem de cada exercício, cada exercício aparece **uma vez**, **não** afirma «exercícios neste bloco: nenhum», e a «fatia do plano» saiu |
| `node experimentos/provar-ajustes-anamnese.js` | **126 de 126** |
| `node experimentos/provar-forca-e-flexibilidade.js` | **17 asserções, 0 falhas** |
| `node tools/check-schemas.js` · `gerar-schemas.js --conferir` | TUDO CERTO (o molde e os **18** professores dizem o mesmo contrato, com `aspectoFisico`) · ok (5 schemas) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram — depois de refrescada a cópia da porta do ciclo-zero |
| `node tools/check-indices.js` | **14 verificações, 0 falhas** (os índices que só tinham mudado de `fonte.commit`/`gerado_em` foram revertidos) |
| `node tools/validar-plano-ciclo.js` · `validar-aula-ciclo.js` · `validar-po-ciclo.js` · `validar-captura-ciclo.js` | ok, **13** campos no plano (o novo `aspectoFisico` entre eles) · ok, 9 · ok, 13 · ok |
| `node tools/check-pacote.js professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** — 9 páginas, 245 links, PDF de 25 páginas |
| `tools/hash-ciclo.sh pe-junto 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; **`b1097a0d…`** (ciclo) e **`73087073…`** (aula 01) |
| `node tools/regerar-derivados.js … --escrever` | **2 fontes reescritas** (`-plano.md` e `-aula-01.md`); as outras cinco iguais |
| **não executado** | `provar-plano-matriz.js` (falha na rota `/api/mapa` — **já falhava em `HEAD`**); `provar-aula-prosa.js` e `provar-escopo-da-aula.js` (fixtures de escolas expurgadas) |
| **ao ar** | uma carga por página, no fim: `/bale-nivel-1-teste-2/aula-01` **200** com «3. Distribuição do tempo pelos blocos» e «Os compassos desta aula»; `/bale-nivel-1-teste-2/plano` **200** com «Aspecto físico — força e flexibilidade». A Action `Publicar as escolas` publica em cada push — **não há passo manual**, e o registo anterior que dizia «fica para o deploy» estava a supor um controle que não existe |
| Actions de `8175264` | `Reancorar a cadeia`, `Publicar as escolas`, `Regerar os índices` e `Publicar a raiz` — as quatro `completed / success` |

### Executado na fotografia anterior (02/11/2026 — a aula deixa de afirmar o que ninguém escreveu)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-o-que-vem-do-dado.js` | **TUDO CERTO** — a origem de cada secção da aula, medida por mutação (troca-se uma resposta do envelope e vê-se se a secção muda). As asserções da §4 mudaram de pergunta: já não é «não tem de onde vir», é «a música vem da sequência, a grade vem do verbete, e não se pede nada a ninguém» |
| `node experimentos/provar-forca-e-flexibilidade.js` | **17 asserções, 0 falhas** (nova) — o conteúdo declara os 15 campos, todos existem na anamnese, o motor repassa a declaração, a caixa mostra o **nome** e o **valor**, e o **controle negativo** (sem a declaração, a caixa volta ao `id` cru) |
| `node experimentos/provar-ajustes-anamnese.js` | **126 de 126** — eram **56**, e a última asserção do ficheiro não corria. O mock do `location` não tinha `replace` e o `fetch` respondia `{ok:true}` a tudo; a página estava certa nas quatro coisas. **70 asserções nunca se tinham executado** |
| `node experimentos/provar-alunas-da-anamnese.js` | **14 de 14** |
| `node experimentos/provar-po-unico.js` | **18 asserções, 0 falhas** |
| `node experimentos/provar-aula-e-plano-legiveis.js` | **12 asserções, 0 falhas** |
| `node experimentos/provar-cabecalho-do-documento.js` · `provar-coerencia-do-po-no-pacote.js` | TUDO CERTO · **6 asserções** |
| `node experimentos/provar-schemas.js` · `provar-schemas-do-professor.js` | **29/29** · **24/24** |
| `node tools/check-schemas.js` · `gerar-schemas.js --conferir` | TUDO CERTO · o molde em disco e o módulo dizem o mesmo (5 schemas) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram — incluindo a **cópia da porta do ciclo-zero**, que estava divergente e foi refrescada |
| `node tools/check-indices.js` | **14 verificações, 0 falhas** |
| `node tools/check-pacote.js professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** — 9 páginas, 245 links, PDF de 27 páginas |
| `tools/hash-ciclo.sh pe-junto 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; **`54e37c70…`** |
| reprodutibilidade | **duas gerações seguidas** do mesmo ciclo: o **mesmo md5** nos dois PDFs e o `git status` **limpo** |
| `bash tools/gerar-handoff.sh` | o `HANDOFF.md` gerado no commit `d74fda1` |
| **não executado** | `provar-plano-matriz.js` (falha na rota `/api/mapa` — **já falhava em `HEAD`**, confirmado com a alteração guardada); `provar-aula-prosa.js` e `provar-escopo-da-aula.js` (apontam para fixtures de escolas expurgadas — `perna-boa` e um envelope de 27/10 da `batata`) |
| **ao ar** | uma carga por página, no fim: `/bale-nivel-1-teste-2/aula-01` **200** com as quatro correções; `api/mapa?fonte=anamnese` com os nomes dos campos; `api/mapa?fonte=po` com os 15 declarados |

### Executado na fotografia anterior (01/11/2026 — a janela por todas as bandas)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-janela-do-lancamento.js` | **11 asserções, 0 falhas** (nova) — jsdom, o pacote por HTTP |
| …o que ela mede | o config declara **8 colunas com chave**; a tela desenha **8 campos**, dois por banda; cada cabeçalho nomeia **um** critério; e o **controle negativo** — com o config antigo (os dois critérios numa coluna), os campos caem para **4** |
| `node experimentos/provar-aula-prosa.js` | **19 verificações** — passou a exigir **cada critério sozinho na sua linha**, e ganhou a prova de que **a fonte da aula é reproduzível pelo código, byte a byte** |
| `node experimentos/provar-aula-e-plano-legiveis.js` | **12 asserções, 0 falhas** — **falhava antes desta entrega** («coluna da folha não declarada: 'Linha de base revisitada'»); caiu ao corrigir o título da declaração e o `mesclarDeclaracao` por chave |
| `node experimentos/provar-notacao.js` | **74 asserções, 0 falhas** |
| `node experimentos/provar-celula.js` | **115 asserções, 0 falhas** |
| `node experimentos/provar-teste.js` | **44 verificações** |
| `provar-derivados-da-sequencia` · `provar-numeros-do-roteiro` · `provar-dimensoes-plano` · `provar-musica-no-plano` · `provar-plano-da-turma` · `provar-porta-sem-contexto` | **26** · **29** · **11** · **18** · **46** · **44**, todas sem falha |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js professores/perna-boa/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh … --check` | cadeia íntegra; **`59e3063…`** — renovada (esta entrega reescreve fontes cobertas: a aula e a folha) |
| medido na tela | `captura-aula-01.json` com **8 colunas**; `plano-aula-01.json` com **8 entradas** em `guiaDeObservacao`; a folha impressa com **8 linhas** de critério |
| **não executado** | `provar-plano-matriz.js` e `provar-plano-completo.js` — falham **antes desta entrega** (a rota `/api/mapa`, e o nó `aula-de-cada-objetivo` sem destino declarado na prova); `provar-lancamento.js` **está morto** (aponta para `professores/tiago/ciclos/ciclo-01-maria`, que não existe); `provar-objetivos-por-aula.js` **não mede** (fixture expurgado) |
| **ao ar** | não recarregado na exploração (a cota do KV). Uma carga no fim, depois do push |

### Executado na fotografia anterior (01/11/2026 — o que a sequência já responde, e o `;`)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-derivados-da-sequencia.js` | **26 asserções, 0 falhas** (nova) — jsdom, com o conteúdo, o alfabeto e a turma de verdade |
| …o que ela mede | a sequência **semeia-se sozinha** sem o nó ser aberto (7 linhas com os tempos do verbete); o **repertório** sem campo nenhum e com o valor igual à sequência; a **música acima** do campo único (o do vídeo); o exercício **sem verbete** dito por palavras; o **valor de fora** que passa como veio; a semente que **acompanha a decisão** (desmarcar o tendu tira-lhe as linhas); e o **documento** (a música derivada, o vídeo depois dela, o plano antigo intacto) |
| **controle negativo** (`porta/index.html` de `HEAD`) | **14 falhas** no código de antes |
| `node experimentos/provar-dimensoes-plano.js` | **11/11** — secção 11 nova: `;` e `\n` misturados dão **três colunas** (davam uma). A bancada estava **morta** (apontava para `professores/tiago/`, que não existe: o `markdown.js` nunca carregava); passou a servir o pacote-zero |
| `node experimentos/provar-teste.js` | **44 verificações** — foi ela que apanhou o `distribuicao-de-volume` apagado na primeira tentativa (a grelha com unidade grava `{unidade, linhas}`, não uma lista) |
| `node experimentos/provar-musica-no-plano.js` | **18 asserções, 0 falhas** |
| `node experimentos/provar-numeros-do-roteiro.js` | **29 asserções, 0 falhas** |
| `node experimentos/provar-plano-da-turma.js` | **46 provas, 0 falhas** |
| `node experimentos/provar-porta-sem-contexto.js` | **44 asserções, 0 falhas** |
| `provar-po-unico` · `provar-recorte-do-po` · `provar-leituras-do-po` · `provar-coerencia-do-po-no-pacote` | **18** · **26** · **27** · **6**, todas sem falha |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js professores/perna-boa/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh … --check` | cadeia íntegra; **`3601081…`** — **sem renovação**: esta entrega não escreve o alfabeto, e o `plano.json` do formulário não está na cobertura do selo. O `ancorado_em` do scaffold mudou de data |
| medido na tela | o nó do repertório abre **sem campo nenhum** (nem a nota), com o selo «lido da sequência»; o nó do vídeo abre com a música acima e **um** campo |
| **não executado** | `provar-plano-matriz.js`, `provar-po-completo.js` e `provar-aula-e-plano-legiveis.js` — falham **antes desta entrega**, confirmado por `git stash`; `provar-objetivos-por-aula.js` **não mede** (o fixture foi expurgado) |
| **ao ar** | não recarregado na exploração (a cota do KV). Uma carga no fim, depois do push |

### Executado na fotografia anterior (01/11/2026 — o número do roteiro, igual nos três documentos)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-numeros-do-roteiro.js` | **29 asserções, 0 falhas** (nova) — jsdom, com o mapa de verdade de cada documento |
| …o que ela mede | nos **três** documentos: o número do título é o do item activo do roteiro em **todos** os degraus; a caminhada cobre 1..N sem salto; a barra conta os degraus (e os obrigatórios são os degraus obrigatórios); o «avançar» percorre os mesmos degraus; e o **fecho continua a barrar** o obrigatório que não tem degrau, nomeando-o |
| **controle negativo** (`--controle-negativo`, `porta/index.html` de `HEAD`) | **12 falhas** no código de antes — plano e PO reprovam, a anamnese passa (era o único documento já alinhado) |
| `node experimentos/provar-celula.js` | **115 asserções, 0 falhas** |
| `node experimentos/provar-musica-no-plano.js` | **18 asserções, 0 falhas** |
| `node experimentos/provar-parametros-por-parametro.js` | **21 asserções, 0 falhas** |
| `node experimentos/provar-plano-da-turma.js` | **46 provas, 0 falhas** |
| `node experimentos/provar-porta-sem-contexto.js` | **44 asserções, 0 falhas** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh … --check` | cadeia íntegra; **`3601081…`**; selo na **versão 9** — sem renovação (esta entrega não escreve o alfabeto) |
| medido na tela | a `aula-1-sequencia` desenha **Bloco** e **Objetivo específico** como `travada`, e o **Conteúdo do nível** travado quando vem da matriz; os **Tempos/Compasso** seguem o verbete |
| **não executado** | `provar-plano-completo.js` e `provar-plano-matriz.js` — falham **antes desta entrega**, confirmado por `git stash` em 31/10/2026 |
| **ao ar** | não recarregado na exploração (a cota do KV). Uma carga no fim, depois do push |

### Executado na fotografia anterior (01/11/2026 — a tira fora do formulário, e cinco passos)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **115 asserções, 0 falhas** (eram 106) — no navegador, sobre bancada local |
| …o que ela mede de novo | a tira **fora do `<form>`** (e antes dele); a tira **fora do ecrã no modo do exercício** — atributo `hidden` **e altura medida**, porque o atributo sozinho mentiria (`.passos{display:flex}` vence `[hidden]`); os **cinco** passos, numerados de 1 a 5; cada número com o seu painel; o valor do passo 1 com o nome e a posição; a **geometria de duas colunas** com a listagem à direita e **presa**; o `ULTIMO_PASSO` **lido da página** |
| `node experimentos/provar-verbete.js` | verde — o CRUD valida, grava no repositório e recusa apagar |
| `node experimentos/provar-musica-no-plano.js` | **18 asserções, 0 falhas** — versionada nesta entrega (faltava o `!` no `.gitignore` desde 31/10); o caso «sem verbete» passou a ser medido no **Jeté** |
| `node experimentos/provar-parametros-por-parametro.js` | **21 asserções, 0 falhas** |
| `node experimentos/provar-plano-da-turma.js` | **46 provas, 0 falhas** |
| `node experimentos/provar-porta-sem-contexto.js` | **44 asserções, 0 falhas** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js professores/perna-boa/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh … --check` | cadeia íntegra; **`3601081…`**; **selo renovado para a versão 9** do alfabeto |
| geometria da tira | **2 a 3 linhas** na coluna de 34rem (7,5rem por rótulo, valor com reticências); **nenhum transbordo** em 320, 390, 768 e 1280px |
| **não executado** | `provar-plano-completo.js` e `provar-plano-matriz.js` — falham **antes desta entrega** (o nó `aula-de-cada-objetivo` sem destino na prova, e `/api/mapa`), confirmado por `git stash` |
| **ao ar** | não recarregado na exploração, de propósito (a cota do KV). Uma carga no fim, depois do push |

### Executado na fotografia anterior (31/10/2026 — os tempos e o compasso vêm do verbete)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-musica-no-plano.js` | **18 asserções, 0 falhas** (nova) — jsdom, com o conteúdo e o alfabeto **de verdade**; a secção 6 é o **controle negativo** |
| …o que ela mede | uma música → `2` e `4/4` **travados** e já na resposta gravada; três músicas → dois `select` com só `4`/`8`/`12` e `4/4`, e `data-musicas` na linha; sem verbete → texto livre e os oito compassos; a nota diz a origem e onde se corrige; **sem o campo na rota, nada é derivado** |
| `node experimentos/provar-celula.js` | **106 asserções, 0 falhas** |
| `node experimentos/provar-verbete.js` | verde — o CRUD valida, grava no repositório e recusa apagar (fixture própria desde hoje: criava o «Battement fondu» do zero e recebia 409 agora que ele existe) |
| `node experimentos/provar-parametros-por-parametro.js` | **21 asserções, 0 falhas** |
| `node experimentos/provar-plano-da-turma.js` | **46 provas, 0 falhas** |
| `node experimentos/provar-porta-sem-contexto.js` | **44 asserções, 0 falhas** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js professores/perna-boa/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; **`3601081…`**; **sem renovação** — esta entrega lê o alfabeto, não o escreve |
| **não executado** | `provar-plano-completo.js` e `provar-plano-matriz.js` falham **antes desta entrega** (o nó `aula-de-cada-objetivo` sem destino na prova, e `/api/mapa`) — confirmado por `git stash` |
| **ao ar** — uma carga por sítio, no fim, e não na exploração | `/plano-ensino/?professor=perna-boa&escola=batata&ciclo=01` → **200**, com `musicasDoExercicio`, `MUSICAS_DO_TERMO` e a nota «vêm do verbete» no HTML servido; `GET /api/bastidores/termos` → **93 termos, 6 com `musicas`** (Plié `8\|4/4`; Battement tendu `4`, `8` e `12 em 4/4`; Battement dégagé `4\|2/4`; Rond de jambe en l'air `4\|2/4`; Battement fondu `2\|4/4`; Port de bras `12\|3/4`). A rota lê o alfabeto empacotado, **sem KV** |

### Executado na fotografia anterior (31/10/2026 — o plano acusa o termo que não existe)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-parametros-por-parametro.js` | **21 asserções, 0 falhas** (eram 14) — a secção 7 é o conteúdo órfão, com **controle negativo** |
| …o que ela mede no órfão | o aviso aparece, nomeia o id («rond-de-jambe»), nomeia o candidato («Rond de jambe à terre»), diz onde se corrige (Produção, Turmas) e nomeia a turma; a origem conta os **3 associados** e a matriz desenha os **2** que resolvem |
| `node experimentos/provar-plano-da-turma.js` | **46 provas, 0 falhas** |
| `node experimentos/provar-porta-sem-contexto.js` | **44 asserções, 0 falhas** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; hash **`3601081…`**; selo renovado para a **versão 8** |
| reprodução com o **dado ao vivo** da `batata` | Nível 1 e Nível 2 → **Arabesque, Jeté** + aviso de «rond-de-jambe»; Nível 3 → **Arabesque, Jeté, Battement fondu** + o mesmo aviso |
| **não executado** | `provar-plano-completo.js` e `provar-plano-matriz.js` falham **antes desta entrega** (o nó `aula-de-cada-objetivo` sem destino na prova, e `/api/mapa`) — confirmado por `git stash` sobre `porta/index.html` |

### Executado na fotografia anterior (31/10/2026 — a frase no passo 2, e a listagem por baixo)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **106 asserções, 0 falhas** (eram 96) — no navegador, sobre bancada local |
| …o que ela mede na frase | a frase é escrita **uma vez** e entra nos **três** trechos (medido: três ocorrências no texto composto), acrescentar um trecho **não a limpa**, e a prévia mostra o texto **de cada célula** |
| …o que ela mede no sétimo passo | a tira tem os sete números e os sete rótulos, o segundo é «A frase», há um painel por passo, o último passo mostra a frase e o «lê-se» compostos |
| …o que ela mede na arrumação | a secção tem **uma coluna**, o formulário ocupa a largura dela (1048/1048 e 288/288), a listagem fica **abaixo** e já não é `sticky` |
| …o que ela mede na listagem | a posição vai em selo («Première position»), o complemento diz as direções, o compasso, as músicas e os trechos, e o nome continua a abrir o verbete |
| `node experimentos/provar-verbete.js` | tudo certo — e mede que o campo de frase **por trecho** não volta (`vb-cel-desc` ausente) |
| `node experimentos/provar-notacao.js` | **74 asserções, 0 falhas** |
| `node experimentos/provar-celular.js` | **15 de 15** (320, 360, 390, 414, 768, 1024px) |
| `node experimentos/provar-vao-do-botao.js` | **62 de 62** |
| `node experimentos/provar-producao.js` | **151 de 152** — a falha «o item do menu fica marcado» é **pré-existente** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram — incluindo a **8 (Peça)**: 16 superfícies, 13 ganchos |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; hash **`3601081…`** (o alfabeto não mudou) |
| geometria no navegador | a tira de **sete** passos: 2 linhas em 1280px (89px), 3 em 768px (136px), 7 em 390 e 320px (322px) — **sem transbordo** em nenhuma, e sem erro de JS |
| o dado real | Battement dégagé abre o passo 2 com a definição nova; Rond de jambe en l'air devolve a frase **gravada** («rondejambe en l'eir»), não a do dicionário |

### Executado na fotografia anterior (31/10/2026 — os seis passos e a edição do trecho)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **96 asserções, 0 falhas** (eram 85) — no navegador, sobre bancada local; a secção 18 é o modo de edição |
| …o que ela mede no modo de edição | «Editar» leva ao passo 4 com os valores do trecho, a contagem carregada é a dele (`1`, não `2`), o aviso diz o número, o «!» acende **só** nos passos 4 e 5, a linha perde o «×», «Cancelar» volta ao 6 e o trecho fica intacto |
| …e o que ela mede nos seis passos | um painel visível de cada vez, a tira diz o valor decidido, o passo 1 sobrevive ao modo do exercício (bloqueado, não escondido) |
| `node experimentos/provar-verbete.js` | tudo certo — o CRUD valida, grava no repositório e recusa apagar |
| `node experimentos/provar-notacao.js` | **74 asserções, 0 falhas** |
| `node experimentos/provar-producao.js` | **151 de 152** — a falha «o item do menu fica marcado» é **pré-existente**; as cinco que eu tinha aberto eram da bancada (o `#id`, o `closest` e a árvore da secção), não do motor |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram — incluindo a **8 (Peça)**: 16 superfícies, 13 ganchos, nenhuma classe inventada |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; hash **`3601081…`** |
| geometria no navegador | a tira de seis passos cabe em **320/390/768/1280** sem transbordo, e a página não tem erro de JS |

### Executado na fotografia anterior (28/10/2026 — a célula explicada)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **41 asserções, 0 falhas** — no navegador, sobre bancada local |
| `node experimentos/provar-verbete.js` | **66 asserções, 0 falhas** |
| `node experimentos/provar-notacao.js` | **74 asserções, 0 falhas** |
| `node experimentos/provar-producao.js` | **151 de 152** — a falha «o item do menu fica marcado» é **pré-existente** |
| `node experimentos/provar-teste.js` | **44 verificações** |
| `node experimentos/provar-leituras-do-po.js` | **27 asserções, 0 falhas** |
| `node experimentos/provar-menu-da-producao.js` | **55 de 55** |
| `node experimentos/provar-celular.js` | **15 de 15** (320, 360, 390, 414, 768 e 1024px) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-glossario.js` | consistente — 18 símbolos, 18 verbetes, **0 avisos** |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; hash **`3601081…`**; o alfabeto subiu a **versão 5** e o selo foi renovado |
| o texto dos PDFs gerados | **mesmo md5** que antes dos dois eixos — nenhuma célula declara orientação, e o documento não muda |
| `node experimentos/provar-celula.js` | **85 asserções**, 0 falhas — 3 direções e 5 orientações, caixas `radio`, três cliques em três direções deixam **uma** marcada, «en face» marca, nenhuma lista suspensa, três cliques = três sinais, sinal repetido, direção e orientação persistentes, `orientacao` no corpo gravado, e um en croix inteiro com o compasso corrido (`1\|1`, `1\|2`, `2\|1`) |
| geometria no navegador | contagem: `1`,`1–2` em 2/4 e até `1–4` em 4/4; frase sugerida pelo dicionário e preservada quando ajustada; sem transbordo em 320/390/768/1280; nenhum erro de JS |

### Executado na fotografia anterior (28/10/2026 — os dois modos e o editor de célula)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **38 asserções, 0 falhas** — novo; num navegador de verdade, sobre bancada local |
| `node experimentos/provar-verbete.js` | **60 asserções, 0 falhas** (eram 50) |
| `node experimentos/provar-notacao.js` | **74 asserções, 0 falhas** |
| `node experimentos/provar-producao.js` | **151 de 152** — a falha «o item do menu fica marcado» é **pré-existente** |
| `node experimentos/provar-teste.js` | **44 verificações** |
| `node experimentos/provar-leituras-do-po.js` | **27 asserções, 0 falhas** |
| `node experimentos/provar-menu-da-producao.js` | **55 de 55** |
| `node experimentos/provar-celular.js` | **15 de 15** (320, 360, 390, 414, 768 e 1024px) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-glossario.js` | consistente — 18 símbolos, 18 verbetes, **0 avisos** |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; hash **`3601081…`** (não mudou: o alfabeto está fora da fórmula; só o selo foi renovado) |
| geometria dos modos (bancada local) | modo B: select e «+» bloqueados com opacidade **0.4**, foco no nome, sem transbordo em 320/390/768/1280; a tabela das direções muda de «não vai» para a descrição no gesto de acrescentar a célula |

### Executado na fotografia anterior (28/10/2026 — o vocabulário no repositório)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-verbete.js` | **50 asserções, 0 falhas** (eram 36; a secção F, nova, tem 14) |
| `node experimentos/provar-producao.js` | **151 de 152** — a única falha, «o item do menu fica marcado», é **pré-existente** (medida por stash) |
| `node experimentos/provar-notacao.js` | **74 asserções, 0 falhas** |
| `node experimentos/provar-teste.js` | **44 verificações** |
| `node experimentos/provar-leituras-do-po.js` | **27 asserções, 0 falhas** |
| `node experimentos/provar-menu-da-producao.js` | **55 de 55** |
| `node experimentos/provar-celular.js` | **15 de 15** (320, 360, 390, 414, 768 e 1024px) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram (a checagem 8 aceita o par do «+») |
| `node tools/check-glossario.js` | consistente — 18 símbolos, 18 verbetes, **0 avisos** |
| `node tools/check-pacote.js professores/perna-boa/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; hash **`3601081…`** |
| geometria do «+» (bancada local, sem tocar no ar) | select e botão na mesma linha (topo 217 e 216; vão de 5px); caixa **0px** fechada e **296px** aberta; foco no primeiro campo; o termo criado entra no grupo certo; sem transbordo |

### Executado na fotografia anterior (28/10/2026 — a Sequência declarada e a métrica)

| Verificação | Resultado |
|:--|:--|
| `tools/gerar-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2` | pacote regerado; **0 erros e 0 avisos** |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)**; 26 verificações |
| validadores isolados | plano, PO, aula e captura satisfazem os schemas (o `pre-commit` reporta 10 lacunas declaradas no `-dados.json` e 1 provisório `[Preencher]` no plano — já existiam) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-indices.js` | **14 verificações, 0 falhas** |
| `tools/hash-ciclo.sh perna-boa 01 batata --check` | cadeia íntegra; hash **`1816e1eb…`** |
| `experimentos/provar-objetivos-por-aula.js` | **NÃO EXECUTADO** — o fixture `batata-bale-nivel-2-teste-2` foi expurgado; as asserções foram atualizadas por leitura, não por execução |
| conferência ao ar | Aula 01: **HTTP 200**, zero «Sequência declarada», «18 tempos, 3/4» presente; plano: link `aula-01.html#exercicios-da-aula-01` |
| workflows de `f4cc715` | Reancorar, Regerar os índices, Publicar as escolas, Publicar a raiz — **todos `success`** |
| bancada da musicalidade | sem transbordo em 420px, 760px e 1280px; a maior tabela mede 828px (a largura do conteúdo); 9 âncoras e 9 cabeçalhos, nenhum quebrado |

### Executado na fotografia anterior (28/10/2026 — cabeçalho e cartão da ficha)

| Verificação | Resultado |
|:--|:--|
| `tools/gerar-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2` | pacote regerado; **0 erros e 0 avisos** |
| `node tools/check-pacote.js …` | **0 erros, 0 avisos**; 9 páginas |
| validadores isolados | plano, PO, aula e captura satisfazem os schemas (captura com 2 avisos de mapeamento que já existiam) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-indices.js` | **14 verificações, 0 falhas** |
| `experimentos/provar-ficha-visual.js` | **21 provas**, sem falhas (o bloco cercado, o traço até à borda, a ordem dos campos) |
| `experimentos/provar-titulo-e-barra.js` | tudo ok; o cabeçalho preso da aula mede **63px** e carrega o botão do documento |
| `experimentos/provar-publicacao-da-escola.js` | **63 asserções**, sem falhas |
| `experimentos/provar-cabecalho-do-documento.js` · `provar-celular.js` | ok · **15/15** em 320–1024px |
| `tools/hash-ciclo.sh …` + `--check` | âncoras regeradas; cadeia íntegra. Ciclo `7a0befc4…`, Aula 01 `f7effac1…` |
| `git push origin main` | três commits enviados; `pre-push` passou |
| workflows #105, #206, #289, #404 | todos `completed / success` no commit `3c3a29d` |
| conferência ao ar (Batata) | `/bale-nivel-1-teste-2/aula-01.html` responde 200 e traz «Abrir notação» no cabeçalho e «Condição desta aula» no corpo; `/glossario-benesh.html` responde 200 **sem** subtítulo. Nas duas, a fileira de etiquetas desapareceu e o menu é o atual |

### Publicação anterior (28/10/2026 — leitura dos documentos)

| Verificação | Resultado |
|:--|:--|
| `git fetch origin` + `git status -sb` | `main` alinhada com `origin/main` antes de editar; depois do push, `d9f085f` enviado sem divergência |
| `tools/gerar-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2` | pacote regerado; **9 páginas**, **292 links internos**, PDF consolidado de **34 páginas**, **0 erros e 0 avisos** |
| `node tools/validar-plano-ciclo.js` | satisfaz o schema; o `contexto` extrai as **11 chaves** com as duas tabelas somadas |
| `node tools/validar-po-ciclo.js` | satisfaz o schema, **13 campos de topo**; o aviso de secção fora do mapa desapareceu com o par corrigido |
| `node tools/validar-captura-ciclo.js` | **0 erros**, 2 avisos de mapeamento que já existiam |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram; o `pre-commit` repetiu-as |
| `node tools/check-indices.js` | **14 verificações, 0 falhas** após regenerar os índices |
| `node experimentos/provar-ficha-visual.js` | **19 provas**, sem falhas |
| `tools/hash-ciclo.sh ... ` + `--check` | âncoras regeradas; cadeia íntegra. Ciclo `f934a3e8…`, Aula 01 `831ae856…` |
| `git push origin main` | três commits enviados; verificações do `pre-push` passaram |
| workflows `Regerar os índices` #205, `Publicar as escolas` #288, `Reancorar a cadeia` #403 | todos `completed / success` no commit `d9f085f` |
| conferência ao ar (Batata) | `/` → 200; `/aulas/` listou «Abrir notação · Lançar · Captura para impressão · PDF da aula»; o plano publicado **não** tem subtítulo nem ficha, traz os dois grupos do contexto e as âncoras `#aulas-01-13` e `#aulas-14-26`, e o rodapé «Referências Bibliográficas · PDF do ciclo» |

### Publicação anterior (27/10/2026 — entrega local da Aula)

| Verificação | Resultado |
|:--|:--|
| `git fetch origin` + `git status -sb` | após o push, o workflow de índices gerou `6029676`; fetch e rebase concluídos, `main` alinhada com `origin/main` |
| `provar-aula-prosa.js` | **19 verificações**, sem falhas |
| `provar-publicacao-da-escola.js` | **64 asserções**, sem falhas; prova de montagem em árvore temporária |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node --check` nos JavaScript alterados; `bash -n tools/gerar-ciclo.sh`; `git diff --check` | passaram |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2` + `--check` | âncoras do ciclo e da Aula 01 regeneradas; cadeia íntegra. Hashes: `297d7e77c8831c04d7d49c59544090e06a409f7148df2d69f6522e5fe54c07f7` e `9f72cebc97ee4157cf8c42b3f3b1d5a942e0550bfa7a1badb8a6f551269e3b21` |
| `tools/gerar-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2` + `node tools/check-pacote.js ...` | pacote gerado; **9 páginas HTML**, **325 links internos**, PDF consolidado de **34 páginas**, **0 erros e 0 avisos**; PDF individual `aula-01.pdf` com **10 páginas** |
| Validadores isolados do ciclo | schema, PO, plano, Aula e captura passaram; Captura com 2 avisos de mapeamento |
| `node experimentos/propostas/construir.js` + `node tools/montar-publicacao.js batata --com-propostas` | publicação local montada em `publicacao/batata`; lista de Planos e Aulas gerada |
| conferência de HTML e PDFs | Notação gerada com a estrutura da Aula e as tabelas Benesh; PDFs individuais e consolidado gerados; conferidos pelo agente de entrega |
| `git push origin main` | commit `8b939d0` enviado; verificações do pre-push passaram |
| workflow `Publicar as escolas`, run #287 | jobs `descobrir` e `publicar (batata)` concluídos com sucesso |
| conferência ao vivo, requisição única à raiz | `https://batata.tmenegaz77.workers.dev/` respondeu HTTP 200; HTML contém link para `/aulas/`. A rota específica não foi carregada após este deploy |

### Publicação anterior (27/10/2026 — entrega `d349ed0`)

| Verificação | Resultado |
|:--|:--|
| `git fetch origin` + `git status -sb` | após o push, `origin/main` estava alinhado com a entrega `d349ed0`, sem divergência |
| `node tools/check-indices.js` | **14 verificações, 0 falhas** após regenerar os índices derivados da âncora Batata |
| deploy automático (push → Actions) | `Publicar as escolas` **success** no commit `d349ed0`; job Batata **success** |
| conferência ao vivo | uma carga em `/aulas/`: **HTTP 200**, com o destino da prosa e a ação «Abrir notação» |
| `tools/gerar-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2` + `node tools/check-pacote.js ...` | **9 páginas HTML**, PDF de **26 páginas**, 314 links internos; 0 erros e 0 avisos |
| Validadores isolados do ciclo | schema, PO e plano passaram; captura passou com 2 avisos sobre cabeçalho como grão e cabeçalhos repetidos |
| `tools/hash-ciclo.sh ... --check` | cadeia íntegra; hash `09ad8beef7d71a251cfc2163d7da086efc4c16bcc0004b6abdee02face8b5b15` |
| `provar-aula-prosa.js` / `provar-publicacao-da-escola.js` | 10 verificações / 61 asserções, sem falhas |
| `provar-barra-e-caminho.js` / `provar-barra-unica.js` | 48/48 / 109 asserções, sem falhas |
| `provar-painel-do-ato.js` | **TUDO CERTO**; Glossário disponível e persistente após rolagem em 1280 px e 390 px |
| `node tools/check-identidade.js` | 20 verificações, 0 erros |
| `node experimentos/propostas/construir.js` + `node tools/montar-publicacao.js batata --com-propostas` | concluído; atualizada apenas a saída local ignorada `publicacao/batata` |

### Executado nesta fotografia (26/10/2026)

| Verificação | Resultado |
|:--|:--|
| `git fetch` + `git status -sb` | `main` estava **2 commits à frente** de `origin/main` (`acfab1f`) ao abrir a sessão; push feito, `origin/main` em `fe71508` |
| deploy automático (push → Actions) | «Publicar as escolas» e «Publicar a raiz» **success** sobre `fe71508` |
| conferência ao ar, **uma carga** por destino | `/bastidores/producao` da `batata`: **200**, `par-botoes` **8×** (eram 6), e as três marcações novas no HTML servido. A raiz: **401** sem senha, como sempre |
| geometria do botão, medida em navegador | `provar-vao-do-botao` **62/62** em 1280px e 390px. Antes da correção: vão de **0px** no «Cadastrar aluna» e no «Cadastrar termo»; «Atribuir curadoria» com fundo `rgb(255,255,255)` e **45px**, contra `rgb(107,31,46)` e **49px** do «Cadastrar professor» |
| **controle negativo** da mesma prova (`git archive` do código de antes) | **46/62** — reprova 16, com o vão a 0px nos dois formulários e a curadoria no botão padrão da folha |
| `node experimentos/provar-celular.js` | **15/15**. Antes desta sessão saía com «bloco de estilo da Produção não encontrado»: a âncora era `position:sticky` e o menu passou a `fixed` |
| `node tools/check-identidade.js` | **20 ok, 0 erros** (é a checagem que roda também no `pre-commit`) |
| `node experimentos/provar-producao.js` | **150/151** — reprova «o item do menu fica marcado», e **a falha não é do produto**: a prova lê `className === "ativo"` no DOM falso e o `mostrarSecao` passou a usar `classList.add`. Na página real, com `#professores`, o link tem `class="ativo"` e `aria-current="page"` (medido no navegador) |
| `bash tools/gerar-handoff.sh` | regenerado |
| vão medido nos cinco formulários da Produção | **9px** (professor, aluna, termo, turma) e **13px** na curadoria — o anterior dela é o `.escolhedor`, e não um campo |

### Executado nesta fotografia (25/10/2026)

| Verificação | Resultado |
|:--|:--|
| `git fetch` + `git status -sb` | `main...origin/main`, sem divergência, `7182307` |
| contagem de `.md` na raiz | 28 (27 antes desta fotografia; o 28.º é este ficheiro) |
| estrutura de `.github/` | `agents/` 4 · `instructions/` 4 · `skills/` 3 · **`prompts/` não existe** |
| prompts do projeto | `prompts/` na raiz, 2 ficheiros (`elicitar-ciclo.md`, `instalar-ciclo.md`) |
| contagem de rotas em `rotas.js` | 31 |
| contagem de provas versionadas | 68 |
| contagem de ficheiros/linhas do motor | 52 / 26.311 |
| `curl` a 10 caminhos em produção | todos com o código esperado (tabela na §2) |
| leitura do `PLANO-AULA-E-OBSERVACAO.md` §9 | 6 perguntas abertas, confirmadas |
| contagem de regras e pétreas | 17 e 22 |
| contagem de manifestos de variante | 4 |
| `bash tools/gerar-handoff.sh` | regenerado, com o apontamento novo no cabeçalho |
| `node tools/check-identidade.js` | 20 ok, 0 erros |
| links relativos `.md` dos três ficheiros novos | 5 verificados, 0 quebrados |
| `marcos-por-aula` em `derivar-plano-ciclo.js` | é «objetivo específico (marco parcial)» — **conteúdo pedagógico**, não lugar |
| marcos declarados no plano da `batata` | **3**, para um ciclo de **26** lugares de calendário |
| `materiais` em `motor/nucleo/lancamento.js` | **0 ocorrências** — a folha impressa tem, o formulário não |
| `[Preencher]` na `aula-01` da `batata` | 6 marcadores em 3 secções (musicalidade, guia ×4, próximo passo) |
| as 8 secções da `aula-01` | 1 validação · 2 condições preliminares · 3 sequência · 4 musicalidade · 5 guia · 6 volume · 7 proveniência · 8 auditoria · 9 próximo passo |
| `materiais` na `captura-aula-01.md` | linha 65 — «**Materiais** ☐ fotos ☐ vídeo ☐ áudio ☐ comentário» |

**Um erro corrigido durante esta fotografia, e que fica registado de propósito:** a primeira versão
desta tabela dizia `.github/prompts/` com 1 ficheiro. **Não existe `.github/prompts/`** — os prompts
vivem em `prompts/`, na raiz, e são 2. A afirmação vinha de uma listagem anterior, não de uma
verificação. É exatamente o que a §12 avisa: «está no documento» não é «está no código».

### Não executado

- **A bateria completa de 68 provas não foi corrida.** Foram executadas as provas focadas na
  mudança, listadas acima.
- **`provar-listas-do-acervo.js` não foi executada.** A prova da publicação confirma que as listas
  independentes de Notação e Consulta deixaram de ser geradas.
- **A produção não foi percorrida página a página.** A conferência final foi uma única carga de `/aulas/` após o deploy; a tabela da §2 mantém a conferência geral anterior de 25/10/2026.

## 10. Próximos passos

**O que a sessão de 02/11/2026 mudou nesta lista.** A **ordem que ela fixou** continua a ser a régua
— *ajustar muito bem a geração da aula → o formulário da coleta → o caderno → o botão de criar a
aula* —, e o primeiro item deixou de estar «feito» para estar **verificado secção a secção**: a aula
já não afirma o que ninguém escreveu, e é isso que estava a impedir o passo seguinte. O que ela pediu
a seguir, nas palavras dela, foi **esmiuçar os exercícios da aula** («depois que você fizer esses
ajustes, a gente vai esmiuçar isso daqui porque tem um bocado de erros») — e é esse o próximo passo
concreto: **a tabela dos exercícios, a coluna a coluna**, com o mesmo método (o que vem do dado e o
que vem do código).

**Os três produtos estão decididos, e o primeiro passo deles NÃO é código.** O
[PLANO-PRODUTOS-DO-MOTOR.md](./PLANO-PRODUTOS-DO-MOTOR.md) tem seis fases, e a **fase 0 é conteúdo**:
(1) o **mapa nível→termos** para os 13 níveis, começando pelo nível 1 (hoje: 13 turmas, **9
associações**, e só 2 níveis com alguma); (2) as **4 músicas** que não fecham os tempos (
Rond de jambe en l'air 3 em 4, Battement dégagé 6 em 4, Battement fondu 6 em 2, Relevé 1 em 2) — e a
gravação **já as recusa**, logo não se podem regravar sem corrigir; (3) ~~a licença~~ — **decidida**
(`ARQUITETURA-GERAL.md` §10), falta só o `LICENSE.md`; (4) a **proveniência das 25 descrições**, que a
licença exige para o dicionário poder ser vendido inteiro. Só depois a fase 1 (a separação
catálogo × escola) e a fase 2 (as três saídas em memória) entram em código.

**E há uma ordem que o plano recomenda e ela ainda não decidiu:** a **camada pedagógica**
(exige/ensina/expressa) pode ser o **mesmo trabalho** que o mapa nível→termos — quem declara «o nível
1 ensina `plié` e `tendu`» já está a dizer o que a unidade ensina, e fazer as duas na mesma passagem
poupa uma ida à curadoria.

**PENDENTE dela, e só ela pode decidir:** a **Regra 4** — «força e flexibilidade» no texto, ou o
campo do espaço —, agora que a força e a flexibilidade se sabe onde estão e já chegam ao PO.

**Da Fase 1 falta um item:** as **seleções no plano** (§1.6). Todo o resto do alfabeto está feito — o
verbete administrável, os dois eixos, o dicionário, o «lê-se», os cinco passos com o trecho editável, e
a frase escrita **uma vez** por exercício.

**Os três nós que ela questionou a 01/11/2026 estão fechados** (`ac6caa0`): a música **sobe da
sequência** e é leitura, o campo do nó 24 pede **só o link do vídeo**, e o **repertório** é
`somenteLeitura` — semeado com os exercícios da aula, o que torna exacta a conta do `usosDosPlanos`.
A **faixa** (o título da música) continua a não existir em lugar nenhum, e é a única coisa que este
bloco ainda pede por escrito, dentro da caixa do vídeo.

**O P1 — a ligação bloco ↔ dimensão por id — é o próximo passo, e é decisão dela** (01/11/2026:
«Sim, são a mesma coisa com dois nomes. Use ligação por id»). O recorte **já existe** em
`objetivosEspecificos[].blocos`; o trabalho é **ligá-lo** ao PO e fazê-lo chegar ao formulário — é
**ligação**, não invenção.

**E a ligação é POR AULA, não para as 26** (decisão 34): ela corrigiu a 01/11/2026 o enquadramento
que esta fotografia trazia — *«a aula é elaborada no momento que o professor acha oportuno (…). Não
dá pra fazer dessa maneira que você tá sugerindo. Não tem como. É completamente fora do mundo real.»*
O recorte lê-se **quando aquela aula nasce**, com o registo da anterior à frente.

**A ordem que ela fixou (01/11/2026), e o ponto em que estamos:** *ajustar muito bem a geração da
aula → o formulário da coleta ser a expressão da janela → o caderno → só então o botão de criar a
aula.* As duas primeiras estão feitas (`82d37ef`). **A terceira é a próxima, e é o caderno.**

**O que falta para o caderno ser a base da aula 2 — medido, não suposto.** O formulário já pergunta
pela janela inteira (os 8 critérios, as condições de contorno, o relatório), mas **a sequência
executada não é perguntada em lugar nenhum**: o próprio `tools/lib-vistas.js` declara a lacuna —
«Estrutura executada: [Preencher: a ordem dos blocos vem do plano da aula, que é uma das três
entradas — o JSON não a guarda]». Sem ela, o caderno diz o que se observou e **não diz o que se fez** —
e é o que se fez que a aula 2 herda.

**O caminho crítico medido, e não é o P1 — é a aula 2 existir.** Hoje:
- a **lista** mostra os 23 lugares sem marco como «Lugar do calendário — sem marco», e o
  `PLANO-AULA-E-OBSERVACAO.md` §5.1 prevê a ação **«Definir o marco»** — que **não existe no código**
  (busca em `motor/`, `porta/`, `tools/templates/`, `workers/`: zero ocorrências de «Definir o marco»);
- «**Abrir a aula**» também não existe no produto: só nos fixtures do `check-identidade` e nas
  propostas de desenho;
- o **caderno** (o *livro* de que ela fala) tem builder em `tools/lib-vistas.js`, mas o
  `gerar-vista.js` só gera `guia-de-observacao` — as outras vistas «entram quando a captura tiver o
  dado», e `aulas` está vazio.

**Custo do P1:** `porta/index.html`, `tools/templates/lancamento.html` e
`tools/validar-captura-ciclo.js` (**os dois congelados**: motivo declarado + entrada no `REGISTRO` +
commit próprio), a folha de **cada aula criada** (hoje **uma**) e a reancora.

**Pendente dela** (nada disto é código à espera de autorização, é olho dela):
- **Corrigir a associação** das turmas da `batata`: a relação guarda `rond-de-jambe`, que não existe no
  vocabulário. Em Produção → Turmas → Associar, remover e associar «Rond de jambe à terre».
- **Escolher a turma do plano**: os planos existentes são do Nível 1 e do Nível 2, e os termos que ela
  quer estão associados ao Nível 3 — ou se planeia o Nível 3, ou se associam os termos ao nível do
  plano em uso.
- **Usar o último passo a sério** — acrescentar vários trechos e ver que a frase não se pede outra vez.
- **As 4 linhas «a conferir»** das posições de braços no alfabeto — o dicionário dela só as responde em
  parte.
- **Revisão das quatro descrições que eu redigi agora** (dégagé, glissé, tendu jeté, jeté): a `fonte`
  diz que são minhas, a partir da distinção que ela própria registou, e que estão a conferir.
- **Revisão das frases que eu redigi** para os **32 exercícios sem definição** (23 de 55 têm).
- **A tira em cinco passos ocupa 2 a 3 linhas** na coluna de 34rem (e 5 no telefone): não transborda em
  320–1280px, mas come altura acima do formulário. Se incomodar, alarga-se a coluna do formulário só
  nesta secção — continua a ser «formulário à esquerda, listagem à direita» — ou esconde-se o valor dos
  passos abaixo de 700px.
- **Conferir os três modelos de ensaio** do alfabeto (versão 9): a decomposição é minha, e a música do
  Arabesque (`4|4/4`) e a do Grand battement (`8|4/4`) são escolha minha — e o plano passa a trazê-las
  **travadas**, porque o verbete passou a responder por elas.

**Publicação:** depois do push, uma única carga ao ar para confirmar os cinco passos e a listagem na
página publicada — é a conferência final, não a exploração (ver §12 e a regra da cota do ar).

## 11. Histórico recente

Alterações materiais desde a fotografia anterior (não existia; a referência é o `REGISTRO.md`):

- **05/11/2026** — **Nasceu o índice do recorte (o passo 4), e com ele os pontos cegos do olhar.** O
  recorte mora no KV, e por isso o índice é da família **VIVA** (`PLANO-INDICES.md` §4.5 e a nova
  §4.12), não de `indices/`: o gerador do acervo não alcança o KV, e pô-lo lá seria uma segunda fonte.
  Três perguntas, um dado: o **ranque** (aspecto → em quantos recortes, em quantos chegou à turma), os
  **nunca escolhidos** — contra o **universo de 45** da anamnese, sem o qual «nunca» não existiria —,
  e os **pontos cegos**: aspecto que a leitura do passo 3 marcou como atenção e que recorte nenhum
  olhou. `cobertura` diz `todos`/`alguns`/`nenhum` (o «usado parcialmente»), rascunho fica fora do
  denominador, a escolha órfã vai para `desconhecidos` sem se apagar. O índice vai na resposta da
  lista que a página já pede (zero leituras extra) e tem rota própria com escopo por professor/turma —
  **escopo, nunca eixo**. Medido: **24/24** (desenho a correr em jsdom) · **104/104** · **159/159** ·
  `check-identidade` **0 erros** · `check-indices` **14/14** e **10/10** contraprovas.
  **PENDENTE, e é decisão dela:** (a) o «Gravar» do passo 4 **sobrescreve** a linha, portanto **não
  há série temporal** — «olhar para o passado» exige que o recorte passe a append-only (elo novo por
  decisão, como o `ajuste_de`); (b) o ranque entre escolas exige que todos os KV sejam alcançáveis
  pela mesma leitura, e hoje só a `calango` tem Worker.

- **05/11/2026** — **A linha de base saiu do KV: o acto é um ficheiro, append-only.** O «Gravar» do
  passo 4 fazia `lista[idx] = linha` sobre um array no KV: o que existia antes desaparecia, e com
  ele a possibilidade de olhar para o passado. Decidido por ela: «é melhor mandar para um ficheiro,
  porque daí a gente consegue as soluções que precisamos e ter um índice robusto». Agora
  `escola/<escola>/linhas-de-base/<id>--<carimbo>.json`, um por acto — o ACTO é o «Concluir e
  enviar para a turma» (passo 5), e os passos 1–4, que são intenção, ficam no KV. O `id` não muda
  entre versões (é o ponteiro do plano), a vigente é a de carimbo maior, e apagar grava uma lápide
  em vez de esquecer. Duas listas: `linhasDeBase` (edição: acto + rascunho por cima) e
  `linhasConcluidas` (actos: o que a turma, o plano e o PO leem) — um rascunho que mexe no elenco
  sem ser concluído não muda o corpo que a turma observa. Sem `GITHUB_TOKEN` o acto fica no KV e a
  resposta DIZ isso; com o GitHub a recusar, 502 e o rascunho intacto. Medido:
  **28/28 · 104/104 · 22/22 · 41/41 · 20/20 · 24/24 · 159/159**, `check-identidade` **0 erros**,
  `check-indices` **14/14**. **PENDENTE:** (a) o índice gerado em `indices/` ainda não olha esta
  família — o ranque entre escolas e a série temporal estão desbloqueados, não feitos; (b) o
  `GITHUB_TOKEN` tem de existir no Worker da escola (existe em `calango`), senão a série não existe.

- **05/11/2026** — **A listagem da anamnese lia a turma da curadoria, e o elenco mudou de dono.**
  O selo dizia «nova» e o contexto «aluna nova — sem turma» à Aluna A e à Aluna B, que já tinham
  linha de base feita e enviada. `turmaDaAluna()` lia **curadorias**; em `calango` elas estão
  **vazias** (medido por API), e o elenco passou a ser declarado pelo passo 5 da linha de base.
  O mesmo erro, no PO, dava `{"opcoes": [], "recorte": []}` em `/api/anamneses?turma=…` — zero
  alunas para quem tinha tudo feito. Corrigido nas duas pontas: a linha de base é a fonte
  (`alunasDaTurma`, `alunasDoProfessor`), a curadoria fica como recurso declarado, «nova» passa a
  exigir **não ter linha de base**, a etiqueta diz o nome da linha («turma X · linha de base
  «…»»), e o cabeçalho do PO mostra a inscrição «linha de base» ao lado da turma. A cadeia é
  **turma → linha de base → alunas → corpo**, e a razão está escrita: a turma já vem do
  `plano-de-ensino` obrigatório, e um campo próprio para a linha de base seria o segundo lugar a
  declarar o mesmo facto. Medido: **20/20 · 41/41 · 104/104 · 159/159 · 24/24 · 34/34 · 17/17 ·
  34/34 · 18/18 · 44/44 · 26/26**, `check-identidade` **0 erros**, `hash-ciclo --check` íntegro.
  **PENDENTE:** (a) a decisão dela sobre tirar o nó `sujeitos` do PO (hoje é uma selecção dentro
  do elenco da turma, e não um campo aberto); (b) o `check-pacote` do `ciclo-01-calango` reprova
  **10 erros que já reprovava antes** (sem PDF, sem `dados.json`, e os links de topo) — a fonte
  daquele ciclo não está no repositório (`DOCS=""`), e corrigir exige eliciar o plano outra vez.

- **05/11/2026** — **«O que já é bom» passou a ser o que ALGUMA aluna tem de bom.** Depois da
  correcção do apoio, ela leu a tela e disse o que faltava: «a aluna B tem o tendu bom e faz por
  consciência própria — não achei em lugar nenhum o que ela já tem de bom». A definição era «todas
  no melhor nível», e numa turma em que as duas diferem em quase tudo o bloco ficava vazio. Passa a
  ser **alguma**: é o mérito individual, sem nomear quem (a linha diz o aspecto, o eixo e como está
  o grupo). A leitura «todas bem» não se perde — o item continua a declarar `noMelhorNivel`, e o
  `soExcelente` do recorte continua a usá-la. Nos dados dela: **36** aspectos em «o que já é bom»,
  entre eles o `tendu` e a `musicalidade`; **9** campos sem ninguém no melhor nível. Medido:
  **104/104 · 159/159 · 26/26**, `check-identidade` **0 erros**. **PENDENTE:** refazer a leitura no
  passo 3 (é um gesto, não acontece sozinho).

- **05/11/2026** — **«O que já é bom» ficava vazio porque o apoio da observação inicial era lido como
  nível.** A definição de excelência é de **grupo** («todas no melhor nível») e está documentada em
  `ARQUITETURA-GERAL.md` §5.13 e no `REGISTRO.md` — **CONFIRMADO** no código. O defeito era outro: a
  observação inicial grava `[escala, apoio]`, e a leitura juntava os dois com `join(' · ')`, tratando
  «Bom · com-barra» como nível — que nunca é igual a «Bom». Medido nos dados reais da `calango`:
  «2ª posição — pés» dava «2 de 2 em «Bom · consciencia-propria»» e ia para atenção; «o que já é bom»
  ficava em **zero**, com `atenção = 45/45`. Passa a ler a escala pela mesma regra da `ficha.js`, o
  apoio vai em português e entre parênteses quando é um só, «não foi medido» deixa de ser ponto de
  atenção, e cada aspecto passa a dizer `noMelhor` (quem está bem). Medido: **103/103 · 159/159 ·
  26/26**, `check-identidade` **0 erros**. **PENDENTE:** (a) a leitura guardada no KV é a antiga — é
  preciso **reler** no passo 3 depois do deploy; (b) a excelência de **cada aluna** como lista não
  tem onde se ler, e o que fazer com ela é decisão dela, em aberto.

- **05/11/2026** — **A linha de base lia 30 dos 49 nós, e a Curadoria prometia o verbete de outra
  escola.** Dois relatos da mesma sessão, e as duas causas eram de **leitura** — não havia cache.
  (1) `exerciciosComNotacao` lia o alfabeto **empacotado no Worker** e **não** aplicava a vista da
  escola; a listagem do verbete lê o **repositório** e aplica (`registosDaEscola`). O «Battement
  tendu» existe só na versão da `breu` (`8|2/4@breu`): a Curadoria da `calango` oferecia-o e a
  listagem não o mostrava — **CONFIRMADO** ao arranque. O menu da Curadoria passou a ser preenchido
  pelo **mesmo payload** que desenha a listagem (`/api/bastidores/verbete` → `d.exercicios`).
  (2) `camposDisponiveis` lia só `conteudo.blocos` (30 campos), e o campo que ela marcou —
  `cinco-posicoes-2a-pes`, «2ª posição — pés» — vive em `observacaoInicial`, que nunca era lida: o
  professor respondia, o sistema não via, e nada falhava. Passa a ler os **45** que se medem (15 da
  observação inicial + 30 dos blocos); os 4 da identificação ficam de fora, declarado. A/B contra o
  `HEAD`: a função anterior devolve 30 e não tem o campo. Medido: **100/100 · 159/159 · 26/26 ·
  50/50**, `check-identidade` **0 erros**. **PENDENTE:** a conferência no ar, e o menu de músicas do
  plano (mesma família, outro ecrã) — que fica declarado e **não** corrigido.

- **05/11/2026** — **A secção do corpo nasceu fora do `</section>`, e 63 asserções não o notaram.**
  A tira dos cinco passos, o formulário e a lista ficaram montados **depois** do `</section>` das
  Curadorias: `#sec-corpo` era uma casca com título e três `</div>` órfãos. A prova passava porque
  perguntava «está aqui?» por `getElementById`, que atravessa a árvore — a pergunta que faltava era
  **«de quem é este elemento?»**. O bloco 13 da `provar-linha-de-base` passou a medir a pertença.
  A regressão era maior do que o ecrã: `provar-producao` caíra de **158/158** (em `c748e461`) para
  **154/158** com a oitava secção — três contagens e a regra «nenhum formulário traz explicação», que
  agora tem **duas secções isentas nomeadas e com motivo**, mais uma asserção a exigir que as isentas
  existam e sejam só aquelas. E duas bancadas antigas apanharam defeitos reais: a nota do elenco
  herdado partia o par rótulo ↔ escolhedor, e `provar-cartao-da-turma` lia `button.passo` sem dono.
  Medido: **68/68 · 159/159 · 23/23 · 126/126**, `check-identidade` e `check-indices` **0 erros**.
  **PENDENTE:** uma reprovação **pré-existente** em `provar-cartao-da-turma` (a lista de Termos saiu
  da página a 01/11/2026 e a asserção ainda a procura).

- **04/11/2026** — **O ciclo apaga-se de trás para a frente, a sequência é estrita, e a anamnese é
  datada.** A exclusão guarda o **último** ciclo (o `parentHash` do seguinte aponta para a âncora
  deste) e leva só o **gerado** — o plano de ensino fica **livre sem se lhe tocar**, porque o
  vínculo PO ↔ PE é derivado. O campo do ciclo passa a `readOnly` com o próximo número válido, e
  **desaparece da anamnese**: ela é do sujeito, não do ciclo. «Ajustar» deu lugar a **«Novo
  registo»** — documento novo, data nova, sem `ajuste_de`. E o sinal de revalidação é derivado, com
  a ordem **PE e depois PO**. Prova nova: `provar-ciclos-e-anamnese`, 34 asserções.

- **04/11/2026** — **A faixa no telefone, as 3 asserções, e a capacidade.** As cinco leituras do
  cabeçalho são `.ctx-rotulo` + `.ctx-inscricao` (não `<label>`), e a regra do `grid-column` cobria
  só o `label`: o rótulo encolhia até 0px e o valor tomava a coluna — «totalmente acavalados». O
  `provar-producao` foi de 153/156 a **158/158**, e as três falhas eram duas lacunas da bancada e
  duas expectativas obsoletas (nada era «pré-existente» no sentido de alheio). A **§2.2** deixou de
  contradizer a §5.7, e há **§7.2** nova: **26 criações ou 80 edições por minuto**, 5 a 62 escolas,
  declarado como projecção. Prova nova: `provar-faixa-do-ato-no-celular`, 40 asserções.

- **04/11/2026** — **Os três eixos do PO, o corpo da anamnese, e o §1 sem «Port de bras».** O
  Plano de Observação listava «Técnica — Musicalidade» porque o eixo estava escrito no **conteúdo** e
  concatenado a todos os blocos; o mapa dos eixos passou a ser **um só** (`motor/nucleo/eixos.js`) e
  o eixo decide-se pelo **bloco**. O Corpo é eixo próprio e carrega da **anamnese de cada sujeito**;
  o seletor do sujeito passou a ser o primeiro bloco, antes das dimensões. E o «Port de bras» do §1
  vinha da **matriz do parâmetro**, não da curadoria: a régua do repertório tinha blindado a sequência
  e não o parâmetro — agora é uma régua só. A linha do cartão passou a ser o **objetivo geral** do
  PO. Prova nova: `provar-eixos-do-po`, 34 asserções.

- **04/11/2026** — **O composto não enumera verbos, a modalidade tem uma só origem, e o custo da API
  tem número.** O `combinar` — o armazenamento que o Worker monta — listava os verbos à mão, e o
  `criar` ficou de fora: a escrita condicional existia no acervo e **nunca chegava ao motor**. O
  `anexar` faltava pela mesma razão. Uma camada abaixo, os dois adaptadores de **base** também não
  tinham `criar`. A classe ficou fechada ao tirar a lista: o composto é um **`Proxy`** que encaminha
  qualquer verbo. A **modalidade** estava em **29 ocorrências e 8 ficheiros** (não 10 sítios: contar
  blocos subestima) e passou a ter **um único ponto de derivação**, com `MODALIDADE_PADRAO`
  derivada. O **custo da escrita** ganhou número medido — **18 pontos** para criar um envelope, **7**
  para o editar — e a decisão de não adoptar banco relacional passa a ter critério de revisão
  explícito. Prova nova: `provar-verbos-do-armazenamento`, 29 asserções.

- **04/11/2026** — **As colunas da aula e a notação fora da música.** As doze tabelas de exercício
  saíam a 28/28/21/21 — número com a largura de parágrafo. A causa não era CSS: o pandoc calcula a
  largura relativa pela **proporção dos traços** da linha de separação, e só quando ela passa dos 72
  caracteres; com traços iguais, colunas iguais. A proporção passou a **12/12/23/52**, com o ganho a
  favor de quem tem texto. E a §4 da aula deixou de trazer a notação Benesh na contagem — ela vive no
  documento dela (`-notacao.md`), que é onde o botão «notação» a vai buscar. Prova nova:
  `provar-colunas-da-aula`, 23 asserções.

- **04/11/2026** — **O cartão da aula, os três eixos e os links da proveniência.** Saíram o «Ciclo»
  da caixa da Turma e o identificador do bloco do Professor, que passou a mostrar **nome**,
  **modalidade** e **tradição de referência** — cada um do seu sítio, nenhum deduzido. O guia da
  aula deixou de ser uma tabela com coluna «Eixo» e passou a **três tabelas**, uma por eixo, com o
  eixo como **bloco** do documento (o contrato lê uma tabela por bloco — foi o que decidiu o
  desenho); o **Corpo**, que era uma frase, passou a ter as linhas dos 15 aspectos do plano, da
  linha de base e das restrições. E os links da proveniência deixaram de abrir a **porta** e passam
  a abrir a **folha** do documento. `guiaDeObservacao` passou de array a objecto com os três eixos
  (21 schemas: 20 professores e o `modelo/`). Provas: `provar-cartao-da-aula` (nova, 25) e
  `provar-eixos-e-tempo-da-aula` (27 → 38).

- **04/11/2026** — **A fusão das edições (decisão 84) e o `ARQUITETURA-GERAL.md` como espelho.** Duas
  pessoas no mesmo documento passam a unificar: campos diferentes ficam os dois, o mesmo campo
  decide pela recência ao milissegundo, o empate vai para quem grava, e sem base não se adivinha. A
  regra é pura (`motor/nucleo/fusao.js`), a repetição do 409 é do adaptador, e a resposta declara a
  fusão. O documento de arquitetura foi reescrito — dava o acervo no KV e sob
  `professores/<professor>/escolas/`, e nenhuma das duas é verdade —, com a **§5** nova
  («Concorrência, corrida e integridade»), medida e não desenhada. Ao documentar a lista de verbos
  do `combinar` apareceu **um defeito vivo**: o `anexar` faltava, e o registro de custo da IA é
  acrescentado por ele. Prova nova: `provar-fusao-da-edicao`, 29 asserções, pelo armazenamento
  composto.

- **04/11/2026** — **A corrida da escrita: dois «Guardar» no mesmo minuto não perdem um documento.**
  A auditoria da concorrência deu «não» a quase tudo (gerações enfileiradas, um commit por
  gravação, a referência como último passo, o `.fipp` reancorado depois do rebase) e **uma excepção
  medida**: o id do envelope é um carimbo de minuto escolhido por «existe?» antes da gravação, e
  dois pedidos no mesmo minuto ficavam com o mesmo nome — o segundo gravava por cima, os dois
  diziam «gravado», um documento evaporava. O contrato ganhou `criar` (condicional), o nome cede ao
  sufixo, o índice passa a descrever o arquivo, a intenção é declarada (`substituir`), e o
  **expurgo** — único escrito em lote sem repetição — passa a refazer a corrida que perdeu. O 422
  do GitHub foi medido contra a API real, num ramo descartável. Prova nova:
  `provar-corrida-da-escrita`, 27 asserções.

- **04/11/2026** — **O ajuste do plano arrasta o PO, e o cartão da aula mostra o guia.** O PO
  continuava a observar o plano substituído (`po-20261104-1733` → `plano-de-ensino:
  plano-20261103-2200`, medido), e o plano novo ficava «livre» na estante. Três funções derivadas do
  `ajuste_de` — `planosDaCadeia`, `planoVigenteDaCadeia`, `poDoPlano` — dizem qual é o topo; a rota
  deriva **um elo do PO** ao gravar o plano ajustado (e corre fonte, ciclo e disparo); e um PO a
  declarar um plano substituído passa a apontar o vigente, com a correção **dita**. A Aula 01 do
  envelope real passa a sair com **Expressão 27 · 30%**. Na listagem, a frase de arquitetura saiu, o
  horário foi para dentro da caixa **Turma**, e o **Guia de observação** entrou como caixa — com a
  conta, os itens por dimensão e uma linha de síntese por eixo. Prova nova:
  `provar-cadeia-do-ajuste`, 34 asserções.

- **04/11/2026** — **A fatia de tempo vem do plano pela coluna certa, e o guia lê as três frentes.**
  Dois defeitos medidos no motor: a proporção era lida pela **posição** da coluna — e a gravação não
  escreve célula vazia, de modo que a **justificativa** ocupava o lugar da fatia quando «Proporção
  alvo» faltava —, e a unidade **`minutos`** não se sabia ler (lacuna em todos os tempos, com a
  fatia certa ao lado). A coluna passa a ser procurada pelo **nome**, as duas unidades convertem, e
  a lacuna **nomeia o bloco e o sítio**; o plano diz o mesmo ao pé da tabela. O valor do Expressão
  **não está no envelope da `breu`** — a linha foi gravada sem proporção, e o sistema não a inventa.
  O **guia de observação** passa a ter o resumo por eixo (**Corpo** · **Técnica** · **Poiesis**) e a
  tabela item a item logo abaixo; nenhum rótulo do dado foi renomeado, e o mapa dos eixos é
  **candidato**. Prova nova: `provar-eixos-e-tempo-da-aula`, 27 asserções.

- **03/11/2026** — **A estante mostra um por documento.** Três ajustes do Plano de Observação viravam
  três linhas com o mesmo nome na Área do Professor — uma por envelope. A regra passou a ser uma, do
  núcleo (`porta.vigentesDaFamilia`): a **cadeia** (`ajuste_de`) substitui, e as tentativas **irmãs**
  do mesmo documento colapsam na mais recente. O **plano de ensino** fica só com a cadeia: dois
  planos da mesma turma e ciclo com objetivos diferentes são dois documentos, e a primeira versão da
  regra escondia o plano que um PO observa — foi `provar-apagar-da-listagem` que o apanhou, ao ficar
  vermelha. Nada se perde: os envelopes escondidos continuam no acervo e no índice, os **estados**
  derivam de todos, e a regra de proveniência dos Bastidores não passou por esta função. A linha diz
  quantas versões guardou. Prova nova: `provar-vigente-na-listagem`, 21 asserções.

- **03/11/2026** — **Uma correção minha: não eram «três decisões de produto».** Nenhum dos três
  campos é perda: a linha da escola saiu do corpo a 28/10 (está no `title` e no `escola:`); a
  rubrica deixou de ser tabela de critérios a 26/10 (o plano declara a régua); e a relação
  objetivo ↔ aula chega invertida, na tabela dos marcos. As **bancadas** é que descreviam o
  documento de antes. E a da sequência media-se a si mesma (pedia um verbete que o alfabeto não
  tem). `provar-plano-completo` 18 verificações; `provar-derivados-da-sequencia` 26 asserções.
  Nada se apaga.

- **03/11/2026** — **Duas bancadas voltam a medir, e o fixture é que tinha morrido.** O
  `provar-plano-matriz` servia a pasta de uma escola expurgada em 15/10/2026 e morria na primeira
  asserção; sob o vermelho havia cinco asserções que mediam o dia em que foram escritas (o número
  de nós, a secção «Estrutura de cada aula», a tabela da rubrica, o endereço da sequência, o bloco
  «(P-10)»). O fixture passa a ser `porta/` e o molde `modelo/ciclos/`. E um defeito de verdade:
  «Turmas observadas» no documento × «Turma observada» no formulário — o plano é de uma turma. As
  duas bancadas estavam fora do Git e entram agora. `provar-plano-matriz` 52/52,
  `provar-po-completo` 17.

- **03/11/2026** — **O «Apagar» do registo solto volta à listagem, e é botão.** Sumiu na migração
  para a página da Área do Professor, e na anamnese era um link para o formulário de edição. A regra
  é a mesma das duas famílias: solto → Editar e Apagar; vinculado a um PO ou derivado → só Ajustar
  (e o servidor recusa o `DELETE` com 409); PO → nunca. O clique exige a senha já conferida, nomeia
  o sujeito e recarrega. Três defeitos no caminho: a rota relativa sem o prefixo da porta (404), o
  `apagar` do acervo a exigir token enquanto o `guardar` caía no KV (500), e o `\n` da confirmação
  a quebrar o script gerado. Prova nova: `provar-apagar-da-listagem`, 31 asserções.

- **03/11/2026** — **A sequência não inventa linha.** Saiu o «Adicionar linha», saiu o ✕, saiu o
  campo livre do conteúdo e saiu o `extras` da derivação: o repertório nasce nos bastidores
  (verbete), é acordado na curadoria, e a tabela só o encontra com o objetivo e o bloco — uma linha
  acrescentada aqui seria um acordo que ninguém fez. O caminho legítimo fica (mais um parâmetro →
  mais linhas), e o rodapé passou a dizer de onde a linha vem, distinguindo a distribuição do
  volume, onde a proporção se escreve. Duas asserções do `provar-plano-matriz` guardavam a regra de
  ontem e passaram a afirmar o contrário, com a razão ao lado. Prova: `provar-sequencia-que-acompanha`,
  33 asserções.

- **03/11/2026** — **A sequência acompanha os objetivos.** A tabela mostrava linhas a nomear os
  objetivos 2 e 3 depois de a lista ter ficado com um. A pergunta «é dinâmica ou é mock?» teve
  resposta medida: **é dinâmica, e não há mock** (a pasta `teste/` só é lida pelos bancos). O que
  ficou preso foi o objetivo: a linha de um objetivo apagado **não é memória** — a coluna é
  `somenteLeitura` e quem a escreve é o sistema — e a autoria da semente morria com a página. A
  regra passou a viver em `motor/nucleo/sequencia.js` e serve a tela, o `.md` do plano e a
  `aula-01.md`. A **chave da linha passou a ser o NÚMERO** do objetivo (pelo texto, corrigir a
  redacção duplicava a linha — e era esse o «campo aberto/vazio»). O **✕ passou a existir**, e
  apareceu por baixo o defeito que o tornava inútil: a trava da senha acendia todos os controles
  travados por regra ao ser validada. Prova nova: `provar-sequencia-que-acompanha`, 27 asserções.

- **03/11/2026** — **A metodologia é do professor, e não se pergunta duas vezes.** O Bloco 1 do
  plano pedia «Metodologia de referência» e «Quem escolhe a metodologia» («Eu escolho · A escola
  impõe»), e os dois já estavam respondidos na curadoria. O **item 5 deixou de existir** (a
  premissa é do domínio e é permanente: o professor escolhe), e o **item 4 passou a leitura do
  cabeçalho** (`noCabecalho` + `daCuradoria: 'tradicao'`), com o rótulo do catálogo. O **envelope
  continua a levar o valor semeado** — é dele que o `.md` e o PO o extraem. Dois defeitos
  apanhados pelo caminho: `daCuradoria()` lia uma string caractere a caractere, e os rótulos das
  tradições não chegavam à porta. Prova nova: `provar-metodologia-no-cabecalho`, 20 asserções.
  `provar-teste` voltou a verde (45) ao deixar de escrever à mão o número de nós do cabeçalho.

- **03/11/2026** — **O dono da música não é compasso.** A coluna «Compasso» da sequência do plano
  mostrava `2/4@breu`; o sufixo é o dono do registo do alfabeto (armazenamento). Limpo na **fonte**
  (`musicasDosExercicios` usa `musicaDaChave` do núcleo e deduplica — catálogo e escola podem
  declarar a mesma música) e na **tela** (`musicasDoExercicio`), e o **dado fica como está**: a
  chave continua `8|2/4@breu` (P-03/P-04). Provado por `provar-compasso-limpo`, 16 asserções, com
  o controlo da §C a provar que a bancada serve mesmo o sufixo.

- **03/11/2026** — **A lista da curadoria só promete o que existe, os rótulos ficaram um só, e o
  formulário deixou de explicar.** O menu de conteúdos oferecia o vocabulário inteiro — 93
  palavras — e duas tinham decomposição; passa a oferecer os exercícios que **têm notação**
  (`exerciciosComNotacao()`: verbete com música e, dentro dela, ao menos um trecho), e o que já
  está gravado continua a ler-se (as fichas vêm do registo, não do menu). Os **oito rótulos** do
  formulário vestem a mesma peça — «Alunas» e «Conteúdos desta curadoria» eram `<label>` nu, e o
  navegador desenhava-os em linha, com outra cor e outro peso —, e com eles três sítios que
  ninguém tinha visto. Saíram dez textos: o «(nada escolhido ainda)» e o `mostrarVazio`, as
  legendas «— opcional; sem escolha…», a instrução de clique dos sinais, a frase da posição, os
  avisos de estado vazio do passo 6 e do rodapé, e as opções que rotulavam a ausência de escolha.
  **Ficou o feedback que informa** (nove blocos). Prova nova: `provar-curadoria-e-limpeza`, 22
  asserções. Efeito medido: `provar-producao` de 151/155 para **153/156** (a asserção «nenhum
  formulário traz explicação» estava vermelha e passou), e `provar-conteudos-e-estado-da-turma` de
  74 para **75**.

- **03/11/2026** — **A curadoria chegou ao plano, e o que a travava era um nome repetido.**
  `porta/index.html` tinha duas funções chamadas `turmaDoPlano` — a que devolve a turma e a que
  devolve uma lista de nomes (02/11) —, e a segunda ganhava para todos os chamadores, por hoisting.
  O plano deixou de ler a turma (calendário, frequência, duração, total de aulas) e a coluna
  «Conteúdo do nível» deixou de mostrar o que a direção curou — sem uma palavra na tela. Nas
  mesmas condições, e no mesmo dia, apareceram mais duas na Produção (`cancelarEdicao` e
  `temposDaContagem`): o «Cancelar» da turma corria o do verbete. As três foram renomeadas, e a
  prova nova (`provar-plano-e-curadoria`, 12 asserções) mede a **classe**: nenhum bloco de cliente
  declara a mesma função duas vezes. `provar-teste` passou de vermelho a **45 verdes**, e
  `provar-cartao-da-turma` de 6 falhas a 4. Do lado do estado: a curadoria está registada e o
  `repertorio` chega ao formulário, mas **não há plano nem PO guardados**, e o token do `.dev.vars`
  está morto (401).

- **03/11/2026** — **A auditoria da turma mudou o diagnóstico, e o conteúdo foi para a curadoria.**
  A pergunta era se editar uma turma já curada fere a proveniência. A resposta: a rota já recusava a
  turma **presa a um plano**, mas a turma apenas **curada** gravava tudo — inclusive o **nome**, que
  é o que a curadoria guarda. Renomear partia a ligação **em silêncio**. O defeito era a
  **assimetria** (três estados no professor, dois na turma), e a correção é
  `motor/nucleo/estado-da-turma.js` com três nomes (`livre` · `curada` · `vinculada`) lidos pela
  rota, pelo `DELETE` e pelo cartão. A **nota** da turma saiu do cadastro (o que está gravado fica),
  e os **conteúdos** passaram para o formulário da curadoria — `motor/nucleo/conteudos.js` compõe o
  mapa antigo com o `repertorio` das curadorias, e nada se perde. O formulário da curadoria passou a
  **filtrar modalidades pelas habilitações** do perfil do professor e a **seguir a modalidade** nas
  tradições (`motor/nucleo/tradicoes.js`, com a lista própria a vencer a compartilhada). Entrou
  `indices/esquema/tipos.json` com o tipo `perfil` — o `perfil.json` criado pela tela era o primeiro
  ficheiro do acervo sem tipo declarado.

- **02/11/2026** — **O motor dos produtos começou: dicionário e syllabus.** Dois módulos puros em
  `motor/nucleo/produtos/`, a ponte em `motor/servidor/produtos.js`, o CLI `motor/produtos.js`, e a
  prova `provar-produtos` (52 asserções). O produto **declara o que falta** — `[Preencher]` para a
  definição e a origem, lacuna para o exercício sem verbete, `[conferir]` para o verbete que não
  fecha (sem publicar a contagem), lacuna para o nível sem unidades. A **composição** catálogo ×
  escola passou a existir como função (`compor`) e as adições ficam **fora** do produto por omissão
  — mas os ficheiros continuam um só, e `termo-repo.js` não mudou. A **aula pronta** não foi
  começada.
- **02/11/2026** — **A segunda passagem sobre a mesma tela, e ela reverteu três decisões da manhã.**
  O rótulo da tradição passou de CAIXA ALTA a **Title Case** (`RAD` fica como sigla), com o mapa no
  próprio `tradicoes.json`; o **«Apagar o verbete» saiu do passo 6** e vive só na listagem; e a
  **navegação passou a bloquear para a frente** (o passo seguinte e o «Seguir» desactivados até os
  obrigatórios da etapa, o «Voltar» sempre livre). O passo 1 passou a **ler e congelar o passo 2**:
  escolhido um exercício, categoria, tradição e «o que acontece» vêm do dicionário e ficam
  `disabled`. E o `sugerirMetodo`, que punha uma `Compartilhada` a mais na lista, deixou de
  acrescentar a opção quando ela já existe.
- **02/11/2026** — **O `ED`/`EI` deixaram de se chamar «en dehors»/«en dedans».** Passam a
  **«varredura para fora/dentro»**: os glifos `↺`/`↻` já diziam «rotação», e as duas entradas com
  nome estrangeiro eram a redundância que ela viu no passo 5. Os sinais **não saíram**, e o dado
  antigo continua válido. Alfabeto na versão **31**.
- **02/11/2026** — **As fixtures do `breu` passaram a Plié · Battement tendu · Battement fondu**,
  com `musica` e `celulas` pré-escritas (`Plié` em 8 tempos de 4/4; os outros dois com um en croix
  completo). As curadorias acompanham. O preenchedor passou a **escolher** o exercício no passo 2 —
  e a regressão que o travava (chamava `modoExercicio`, removida no passo 1) está corrigida.
- **02/11/2026** — **O dicionário e o syllabus entraram no esquema dos índices como `prevista`**
  (`termo`, `verbete`, e a relação `verbete → termo`). É o §4.1 do `PLANO-INDICES.md` a funcionar:
  declarar antes de emitir. A proveniência não se declara ali — já é respondida pelo acervo.
- **02/11/2026** — **O alfabeto ficou sem verbetes, e as provas deixaram de depender do conteúdo.**
  Ela apagou os onze verbetes pela Produção (onze commits, versão **30**, só o `_comentario`). O
  `provar-verbete` passou a **plantar** os exercícios que precisa; o `provar-notacao` declara as
  secções de composição **NÃO MEDIDAS**, com o motivo — plantar verbetes meus para voltar a verde
  seria medir o meu conteúdo a fingir que é o dela.
- **02/11/2026** — **O verbete ganhou proveniência, e o `UPDATE` virou ajuste.** O `DELETE` recusa
  (409) quando o exercício compõe um plano de ensino ou o repertório de uma curadoria, e diz o
  caminho («Descontinuar»). Num verbete em uso, gravar é um **ajuste**: o estado anterior fica em
  `versoes[]` com a data em que deixou de valer, e a composição escolhe o estado que valia **na data
  do envelope**. Ela escolheu esta opção (B) entre três. Um verbete sem `versoes` lê-se como antes —
  não houve migração.
- **02/11/2026** — **A tradição de referência em caixa alta e com CUBANA.** *(Rótulo corrigido na
  mesma data — ver a entrada mais recente da lista: o ecrã passou a Title Case, com o mapa em
  `tradicoes.json`.)* A lista é uma só e alimenta os quatro selectores; o dado continua a guardar a
  chave. A Cubana não ganhou linhas de nomenclatura — não se inventam.
- **02/11/2026** — **O «Gravar verbete» desactivado sem decomposição, e o passo 1 a acender com o
  nome.** A categoria, a tradição e «o que acontece» só valem quando há exercício (nome novo **ou**
  escolhido no passo 2). E o método do exercício herda a tradição dele — sem atropelar uma escolha à
  mão.
- **02/11/2026** — **A música não se muda por baixo dos trechos: bloqueia-se.** Escrever os tempos à
  mão apagava a decomposição no mesmo instante, sem aviso — e ela foi categórica: «não pode editar
  esse campo». Com trechos, os tempos ficam só de leitura e o compasso desactivado, e a nota manda
  ao «Duplicar o exercício». O «Limpar» e o «Apagar» libertam o campo.
- **02/11/2026** — **O verbo apagar o verbete existe.** O `DELETE` respondia 409 com a P-03/P-04 e
  passa a apagar: exige o **nome** (um `DELETE` sem corpo apagaria «o que estivesse lá»), sobe a
  versão e grava com `chore(notacao): apagar o verbete «X»`. O **vocabulário não se toca**, e a
  consequência (aula publicada em lacuna) é dita na pergunta, antes do gesto.
- **02/11/2026** — **Os passos arrumaram-se, e o passo 1 ficou condicional.** A frase do exercício
  subiu para o passo 1 (é a definição, e nasce com o nome); sem nome nada é obrigatório, com nome
  são-no a frase, a categoria e a tradição — e os dois escolhedores deixaram de nascer respondidos.
  O campo «posição em que o exercício acontece» **saiu**. A decomposição ganhou o «lê-se» atrás de um
  clique e a frase deixou de se repetir em cada linha.
- **02/11/2026** — **A listagem do verbete passou a ser o cartão das turmas** (a opção 1, escolhida
  por ela): o nome e o selo em cima, o complemento por baixo, e as três caixinhas `Música` ·
  `Direção` · `Notação` com o «?». A da notação abre a decomposição trecho a trecho, com o compasso
  do motor. Um handler meu foi **apagado** no caminho: a página já tinha o ouvinte de `.trio-item` no
  `document`, e o meu desfazia o dele.
- **02/11/2026** — **O vocabulário cresceu:** a categoria **Cabeça**, `↻` rotação para dentro, `○`
  abre, os lados nos três eixos, as direções **para dentro** e **para fora**, e **de lado · perfil** —
  com o `épaulement` corrigido de «ombros rodados» para «ombro à frente». Tudo em **conteúdo**, sem
  tocar em `tools/` nem no motor.
- **02/11/2026** — **Editar e esticar a música SUBSTITUI — não havia INSERT, havia uma chave.** A
  chave de uma música é `<tempos>|<compasso>`; mudar os tempos cria outro registo, e o antigo ficava
  ao lado. A tela passa a mandar `musicaAnterior`, o servidor apaga a chave antiga com quatro
  guardas, e a nota di-lo **antes** de acontecer. A caixa «guardar como música nova» é a outra
  intenção, e só aparece quando a música mudou.
- **02/11/2026** — **A bancada da listagem dos verbetes, para ver e validar.** O pedido de uma
  proposta em `experimentos/propostas/` não tinha sido entregue — implementei a listagem na Produção
  em vez de a propor. Existe agora `proposta-verbetes.html`, com três opções medidas a 320, 390, 768
  e 1280 px (66 / 198 / 561 px por cartão a 320) e sem transbordo. E o `construir.js` deixou de ser
  tudo-ou-nada: sem ciclo gerado, constrói as bancadas que não dependem de pacote.
- **02/11/2026** — **«O item duplicado não aparece»: ele estava gravado, faltava a porta.** Ela
  duplicou o `Plié` de 8 para 16 tempos, gravou, e o registo não apareceu — mas o remoto dizia
  `04e2597 docs(notacao): editar «Plié» (16|4/4)`, e o alfabeto, versão 17, tinha as duas músicas. A
  falha era outra: a listagem dizia «2 músicas» e o «editar» abria sempre a primeira. Passa a haver
  **uma linha por música**, com a música no botão, e o servidor manda `detalhePorMusica`.
- **02/11/2026** — **A correcção volta a andar por passos, e o sinal troca-se no lugar.** Os três
  painéis abertos durante a correcção viravam «um formulário único (página única)» — volta a ser um
  painel de cada vez, sem o «Editar» voltar a saltar de passo. E a ficha do sinal passou a ser
  clicável: marca-se uma e clica-se o sinal novo, que entra **naquele índice**, com os vizinhos
  intactos.
- **02/11/2026** — **As etiquetas passaram a português.** «Première position» era lido em cru na
  listagem. O `nome` passou a ser um campo do vocabulário (13 posições), a tela mostra `nome ||
  termo`, e o `termo` continua a ser o que se grava. Os empréstimos que se dizem assim em português
  (`retiré`, `attitude`, `arabesque`) **não** foram traduzidos — traduzi-los seria inventar.
- **02/11/2026** — **«Duplicar o exercício»: a barra repete-se, e a posição não se toca.** O pedido
  dela: o `Plié` em 1ª, 2ª, 4ª e 5ª tem a mesma estrutura rítmica e os mesmos braços, e só a posição
  das pernas muda. O botão clona a decomposição de cada direção e acrescenta-a ao fim da sua lista,
  e **sobe os tempos sozinho** — senão a música declarava 8 com células a cobrir 16. **Não reescreve
  sinal nenhum**, e a razão é medida: o `1ª` está nas duas pistas, e a Alternativa B da proposta
  escreveria `⌒ 2ª → 2ª → 2ª`. A posição muda-se no «Editar». Uma tentativa pelo caminho — conservar
  as células ao declarar uma música nova — foi **revertida pela suite**: 13 asserções passaram a
  medir o exercício anterior. E o `provar-notacao` deixou de estourar: quatro fixtures afirmavam a
  forma de um dado que melhorou (a direção `devant` que o `Plié` já não tem).
- **02/11/2026** — **O 400 do «devant»: um balde vazio que ninguém escolheu.** A console dela deu
  `400` com «a direção «devant» não tem célula», e a chave do caso é a frase dela — «em nenhum
  momento eu escolhi «devant»». Não escolheu: o editor deixava ficar `celulas: { devant: [] }` quando
  o último trecho daquela direção saía, e um balde vazio é **invisível** — a tabela percorre células,
  e zero células não desenham linha. A validação estava certa; errado era o editor mandá-lo. `semBaldesVazios`
  passou ao **núcleo** e serve os dois lados, e **não apaga o erro**: só a lista vazia sai, e uma
  chave que não é lista continua a ser acusada — a primeira versão que escrevi engolia-a, e a prova
  apanhou. De caminho saiu uma **quarta** soma em linha (`somaTempos`), que não decidia nada e
  respondia `soma: 12` a um verbete aceite com 8: não bloqueava, só mentia.
- **02/11/2026** — **A tela ainda somava em fila — a régua das pistas tinha ficado a meio.** Ela
  relatou «as células somam 12 tempos e a música declara 8» e perguntou se o motor somava em linha. A
  resposta é sim, e não era o motor: a régua das pistas foi aplicada em **três** sítios e ficou um
  **quarto** — a conta que a página faz antes de enviar, que somava em fila **e sem a repetição**. Um
  `Plié` correcto era recusado na tela antes de chegar ao servidor que já o aceitava: o pior dos dois
  mundos. Passou a chamar `cobertura()`, a mesma função da tabela, e a mensagem mostra as pistas. E a
  **recusa deixou de navegar** — era `irParaPasso(...)`, e atirava o professor para o passo da música
  sem o deixar ler. **A lição:** um número calculado em quatro sítios é um número calculado em zero;
  a conta passou a ter um nome e a prova mede a conta, não a sua repetição.
- **02/11/2026** — **«Acrescentar trecho» desaparece durante a correcção — e eu tinha descrito mal o
  defeito.** Escrevi que, em edição, o «Acrescentar trecho» estava visível e **acrescentava** em vez
  de guardar. **Medido, é falso:** havia **um** botão cujo rótulo alternava, e em correcção ele dizia
  «Guardar a alteração» e guardava. Não havia acção errada. Mas o pedido resolve-se na mesma e o
  resultado é melhor: um rótulo que muda **não esconde**, e o que se pediu foi esconder. Passaram a
  ser **dois botões** — `vb-cel-acrescentar` sai de cena em correcção, `vb-cel-guardar` entra —, com
  **uma função** partilhada para não divergirem. 145 asserções em `provar-celula`.
- **02/11/2026** — **Corrigir um trecho reescrevia-lhe o compasso — a causa era uma linha.** O
  handler fazia `splice` + `push` e a célula corrigida ia para o fim; como o compasso sai da **ordem**
  (um relógio por pista, da entrega anterior), corrigir a descrição do braço do compasso 1 empurrava-o
  para o 2. Passa a **substituir no lugar** — e quando a direção muda, a célula entra na mesma
  posição ordinal, não no fim. No mesmo dia, os **três redireccionamentos** que ela relatou saíram:
  vinham todos de `irParaPasso(PASSOS_DO_TRECHO[0])`, e a regra nova é **a área do trecho abrir-se
  onde se está** — os painéis 4, 5 e o último, porque é no último que vive o botão de guardar.
  Acrescentar, guardar e cancelar não mudam de passo. O «Cancelar» já era o comportamento correcto;
  passa a ser regra escrita em vez de acidente.
- **02/11/2026** — **As pistas, e o `Plié` que estava certo.** As células passaram a ser contadas por
  **categoria** e não em fila única — e o defeito que isso resolve é o mais instrutivo do dia: o
  `Plié` somava **12** tempos numa música de **8**, e a gravação o recusava desde a manhã. Medido,
  ele tem **duas pistas**: as pernas fazem os dois compassos (8) e os braços fazem um (4), **em
  paralelo** — o port de bras acontece enquanto o plié acontece. O dado estava certo e a régua é que
  não estava. Com a maior pista, **9 das 13 músicas fecham** (eram 8). A mesma mudança pôs a
  **contagem por pista** (revertendo, com razão, a decisão de 29/10: em duas categorias o mesmo
  instante é simultaneidade, não contradição), a **métrica composta** a oferecer os fins que fecham
  pulso (6/8 são dois pulsos de três, e `1–2` continua possível porque é síncope), a **repetição** na
  célula (`1–2 ×2`, e a multiplicar na conta) e o bloco **«Posições dos pés e braços»** com a
  preparatória e a 3ª de **rótulo duplo** («terceira · quinta»). O **método** entrou no verbete como
  **herança com sobreposição** — o plano já o declara e é obrigatório, e duas declarações do mesmo
  facto divergem ao primeiro caso.
- **02/11/2026** — **A licença em três camadas, o pacote próprio, e uma citação minha que era falsa.** A
  licença estava aberta desde 18/09/2026 e ficou decidida: a **máquina** é proprietária e **não** se
  licencia com os produtos; o **catálogo** licencia-se **por escola**, vinculado à **fotografia
  datada**, perpétuo para a versão contratada, com uso interno livre e revenda proibida, atribuição
  preservada no `fonte`; e **o que a escola acrescenta é dela**, com uma concessão estreita para a via
  inversa. E o produto é **pacote próprio**, com âncora, versão e licença independentes do ciclo. A
  licença obrigou a medir o que faltava para a poder executar — **25 das 59 descrições não têm
  `fonte`**, e sem origem declarada não entram na edição paga. De caminho, **corrigi uma citação minha
  falsa em cinco sítios**: «a `ARQUITETURA-GERAL.md:109` diz a definir»; a frase existe, mas é do
  `REGISTRO.md:109` (entrada de 18/09/2026). O número estava certo; o ficheiro, não.
- **02/11/2026** — **Os três produtos, um motor só, e as nove colisões.** A pesquisadora decidiu
  criar **dicionário, syllabus e aula pronta** — gerados **antes do ciclo**, entregues conforme o
  plano contratado (Básico e Intermediário «fazem tudo»; o Avançado «recebe as benesses»). A
  pergunta dela — **um motor ou dois?** — ficou respondida com medição: **um motor, três saídas, três
  manifestos**. Um, porque o núcleo já é único e a fronteira é provada por máquina, porque a leitura
  do catálogo já está duplicada uma vez, porque a notação e a âncora são uma convenção só, e porque a
  entrega vive em `tools/`, que é congelado. Três, porque **o manifesto é que parte** — e é ali que
  vive a granularidade da negociação. O plano
  ([PLANO-PRODUTOS-DO-MOTOR.md](./PLANO-PRODUTOS-DO-MOTOR.md)) tem seis fases, declara **nove
  colisões** com os planos existentes e o ajuste de cada uma, e mostra que **o que falta é conteúdo**,
  não código: 11 dos 13 níveis estão vazios, a camada pedagógica não existe, 4 músicas não fecham,
  falta licença e falta a separação catálogo × escola. Mudaram de texto, hoje, a **C22** (o gerador
  não é o quarto produto: é o meio) e a **L14** (a turma pronta referencia o syllabus).
- **02/11/2026** — **Três eixos, o ritmo obrigatório, e a C22 com o veredicto do motor.** Três
  correções que a pesquisadora fez, e as três eram minhas: (1) **o modelo não tem um eixo, tem
  três** — `"eixo"` aparece uma vez porque o rótulo é **prefixo por concatenação**, e é ele que
  rotula «Musicalidade» e «Expressão» como «Técnica — …» enquanto o conteúdo delas é poiésis; (2)
  **o ritmo nunca esteve em aberto** — eu o procurei no **catálogo** e ele vive no **cadastro da
  turma**, obrigatório, conferido em quatro portas de recusa; e é **do contrato**, não do conteúdo,
  o que fechou a **C19 pela negativa** (a turma pronta vende-se sem ritmo); (3) **o corpo já está no
  ciclo**, em cinco sítios, e o que falta é só a ligação **ao exercício**. No mesmo dia nasceu a
  **C22** — o verbete como átomo do syllabus, os **quatro degraus** (dicionário → syllabus → aula
  pronta → gerador) com os bloqueios medidos, e o **veredicto: o motor é viável**, com quatro
  arrumações (identidade estável, separação catálogo × escola, camada pedagógica, uma leitura só do
  vocabulário) e **quatro músicas por corrigir** antes de qualquer regravação. A **L14** ganhou a
  lacuna **(0)** — a separação é pré-requisito do degrau 1 — e perdeu a entrega do ritmo no catálogo.
  **Nenhuma linha de código mudou**: é fotografia, decisão e registo.
- **02/11/2026** — **O exercício novo é o passo 1, e o «+» deixou de existir.** A primeira tentativa
  moveu os campos do cadastro para dentro do passo 1 e manteve o «+», o «Gravar exercício» e o
  «Cancelar» — «não é isso: eu vou ter um step a mais». A segunda tirou-os: são **seis passos**, o
  primeiro são os campos do exercício novo, e quem grava o termo é o **«Seguir →»** que já existia.
  Avançar sem nome não grava nada; «Limpar» e «Editar» levam ao passo 2, onde vive o seletor. O
  rótulo do passo 2 encurtou para «O exercício» porque a tira cortava o mais comprido. 130
  asserções em `provar-celula`.
- **02/11/2026** — **O cadastro do exercício é o passo 1, e a gravação confere a música.** O «+» do
  verbete abria um «modo» que escondia o formulário e a tira dos passos e bloqueava o `select`; a
  pesquisadora: «o professor não vai saber que quando ele clicar em cancelar, ele vai para onde de
  facto ele cria o verbete da aula». O cadastro passou a viver **dentro do passo 1** — a tira fica,
  nada é bloqueado, «Cancelar» fecha só o cadastro —, o exercício criado fica escolhido no campo que
  alimenta, e **nada disto toca no KV**: o termo vai para o vocabulário do repositório e a lista lê o
  mesmo ficheiro. No mesmo dia, a **gravação do verbete passou a conferir a música**: as células têm
  de somar os tempos declarados, e a recusa nomeia o passo 2 (a música) e o passo 3 (para onde) —
  era o buraco por onde passaram o `Battement fondu` (6 tempos numa música de 2) e o `Plié` (12 numa
  de 8). E a **Regra 15 foi substituída**, com nota no `REGRAS.md` e motivo declarado: nenhum
  arquivo paralelo de musicalidade existe, e a musicalidade não é um bloco. **CONFIRMADO** por
  `provar-celula` (128/128), `provar-verbete`, e um `alvoDoRecado` que passou a ignorar os recados de
  um widget aninhado — defeito que a prova apanhou e que a mudança tinha introduzido.
- **02/11/2026** — **A §4 dizia uma coisa falsa, e o aspecto físico chegou ao plano.** A §4 da Aula
  01 afirmava, em tabela, «Exercícios neste bloco | nenhum» sobre o bloco de musicalidade — e as três
  linhas de exercício da mesma aula traziam `Tempos` e `Compasso` preenchidos. O erro era de
  **modelo**: tratava a musicalidade como um bloco ao lado de Barra/Centro/Expressão, quando ela é uma
  **forma de olhar todos eles**. Passou a consolidar **por compasso**, um exercício **uma vez só** (o
  mesmo fondu em três blocos é a mesma música), com a contagem *e* o que cai nela, e `conferir` onde a
  grade do verbete não fecha nos tempos — medido: fondu 6 tempos numa música de 2, plié 12 onde a
  música tem 8. Saíram a «fatia do plano» (30% — 27 tempos, Regra 9) e o subtítulo repetido da §3, que
  passou a chamar-se **«Distribuição do tempo pelos blocos»**. No mesmo dia, o **plano de ensino**
  ganhou o **bloco 10, «Aspecto físico — força e flexibilidade»** — o primeiro dos três eixos macro,
  lido das anamneses da turma (quinze campos em dois grupos), consolidado por aspecto e **nunca por
  aluna**, com a régua na ordem das opções da própria anamnese. Resolve a **C20** do
  `PLANEJAMENTO-LASTRO.md` pela alternativa (b). Ficou também refrescada a cópia da porta de um ciclo
  criado e nunca preenchido (`pe-torto/01/batata`) que travava o commit de quem mexe em `porta/`.
  **CONFIRMADO** por `provar-o-que-vem-do-dado` (cinco asserções novas), `check-schemas` TUDO CERTO
  nos 18 professores, `check-pacote` 0/0 e `hash-ciclo --check` íntegro. **Não publicado**, de
  propósito: ela vai expurgar e recriar a escola.
- **02/11/2026** — **A aula deixa de afirmar o que ninguém escreveu; a musicalidade consolida-se; a
  prova da porta volta a correr.** Quatro secções da Aula 01 diziam coisas que ninguém escreveu (a §2
  anunciava «força e flexibilidade» sobre o campo da sala, a §4 tinha um «Pulso» fixo, a §6 chamava
  «simulado» a um ciclo publicado, a §8 era um `[Preencher]` mudo), e a pesquisadora foi secção a
  secção com a pergunta certa: «isso vem do lugar certo? é código duro?». O método de resposta foi
  **mutação** — trocar uma resposta do envelope e ver se a secção muda —, e é o que fica: uma secção
  que o gerador escreve à mão é uma afirmação do sistema sobre a aula de alguém. A §6 passou a dois
  **links** com objetivo, a §8 a dizer o **estado** com os três casos, a §4 a **consolidar** por música
  o que o verbete e a sequência já dizem, e a §2 a dizer o que o corpo é. A par disso: a **força e a
  flexibilidade** chegaram ao PO pela **anamnese** com os 15 campos que ela escolheu, e o registo
  completo abre noutra aba; o **bloco 10** do plano dividiu-se em dois (música/vídeo e repertório); a
  **geração ficou reproduzível** (o `gerado_em` vem das fontes, o `/ID` do PDF está fixo — duas
  gerações seguidas dão o mesmo md5 e a árvore fica limpa); e um **erro meu** de três sessões foi
  corrigido: a musicalidade **não** é uma lacuna. **CONFIRMADO** por `provar-o-que-vem-do-dado`,
  `provar-forca-e-flexibilidade` (17/0, com controle negativo), `check-pacote` 0/0, e a página ao ar.
  No mesmo dia, `provar-ajustes-anamnese` passou de **56** a **126** asserções: o mock do `location`
  não tinha `replace` e a prova morria a meio — **70 asserções nunca se tinham executado**, e doze
  mediam um aviso em vez da grade. A página estava certa nas quatro coisas.
- **02/11/2026** — **O molde dos schemas ficou atrás e matou a geração de um ciclo** (`570d900`), e
  depois passou a ter **um leitor só** (`e27e462`). Em 26/10 dois commits removeram `ciclo` e `rubrica`
  do `required` do plano nos doze professores e **não no molde**; cinco professores criados depois
  herdaram o contrato velho, e a `breu` falhou com «campo ausente». O molde é a fonte de todo professor
  novo, e uma cópia sem comparação é uma segunda verdade: agora `motor/nucleo/schemas.js` é o único que
  o lê, o `tools/gerar-schemas.js` é a porta para o shell, o provisionador do Worker deixou de o pedir
  por HTTP, e `check-schemas.js --professor` corre no `pre-commit` e no `gerar-ciclo.yml` — um contrato
  atrasado falha **antes** da geração, com o nome do comando que o corrige.
- **01–02/11/2026** — **A página do Vocabulário saiu; o exercício nasce no «+» do verbete**
  (`ea6cd0d`). O verbete já tem o termo, a categoria e a tradição, e o vocabulário técnico era a mesma
  coisa num segundo endereço. O botão «Carregar as turmas iniciais» foi para dentro do «+»; o futuro
  comercial dele (turmas prontas para o professor só curar) está registado como frente no
  `PLANEAMENTO-LASTRO.md` (L14), e a contradição com o «o professor cria a turma» também (C19).
- **02/11/2026** — **A seta sobe ao título, os passos descem para a linha inteira, o vocabulário deixa
  de ser só do ballet** (`a5275c3`). `tituloComAcordeao()` ganhou o `idDoBotao`; a faixa dos passos
  passou a atravessar a grelha em Turmas e no verbete; a categoria é `Pé · Peso · Perna · Braço` (o
  `Plié` estava errado) e as orientações do corpo têm **nome português** com a tradição ao lado.
- **01/11/2026** — **A janela vista por todas as bandas** (`82d37ef`). A §5 «Guia de observação» da
  aula era a **única** parte do documento que o código não reproduzia (16 de 18 linhas divergentes; a
  prosa não existia em código nenhum) — escrita à mão, e apagada em silêncio pela geração seguinte. E
  a regra do `;` estava no código desde `ac6caa0` sem ter chegado aos **três** artefatos gravados (a
  fonte da folha, a declaração do schema, o config do formulário). Agora a §5 deriva do PO pela mesma
  função da folha, e a tela desenha **8 campos de critério em vez de 4**. **CONFIRMADO** por
  `provar-janela-do-lancamento` (11/0, com controle negativo) e pela reprodutibilidade byte a byte da
  fonte da aula. De passagem caíram dois defeitos escondidos: `mesclarDeclaracao` casava blocos por
  título (a linha de base mudava de nome entre a derivação e a folha), e o título «(P-10)» fazia a
  **primeira** declaração de qualquer variante nova nunca validar — `provar-aula-e-plano-legiveis`,
  que falhava antes, passa a 12/12.
- **01/11/2026** — **O que a sequência já responde não se escreve outra vez** (`ac6caa0`), e o `;`
  que separa os itens do PO. O bloco 10 do plano pedia o compasso que o **verbete** já declara e os
  exercícios que a **sequência** já demonstra; agora a música **sobe** acima de um campo que pede só o
  link do vídeo, o repertório é **somente leitura** e semeado, e a **sequência semeia-se sozinha** (era
  gravada só se o nó fosse aberto — a página da aula podia sair sem exercício nenhum). A autoria é
  respeitada por comparação com a semente anterior, e a semente não herda de si mesma. De passagem:
  `itensDaDimensao()` corta por `;`, e dois critérios que caíam numa coluna da folha passaram a ser
  duas. **CONFIRMADO** por `provar-derivados-da-sequencia` (26/0, com 14 falhas no código de antes) e
  `provar-dimensoes-plano` (11/11 — a bancada estava morta e foi consertada de passagem).
  **NÃO CONFIRMADO ao ar**: só no deploy.
- **01/11/2026** — **O conteúdo da porta no scaffold, que é o que a escola publica.** A verificação ao
  ar mostrou a página da escola a servir a explicação **velha** do nó 19 e **sem** o `somenteLeitura`:
  a mudança estava no repositório, no pacote da turma e no ar da raiz, e não no ar da escola. A causa
  é o `montar-publicacao`, que copia a base do **pacote-zero**, e o `gerar-ciclo.sh` recusa correr
  sobre um ciclo-zero — a cópia do scaffold actualiza-se **à mão**. O «Circuito» do
  `check-identidade` compara páginas e assets, **não o conteúdo**. Medido antes de corrigir: contra
  `5bfb7ae` eram **25 nós e 0 divergentes** — não era dívida antiga, é uma armadilha do processo.
  **CONFIRMADO** ao ar em `22b42ce`. **A checagem que faltaria é em `tools/`, que é congelado** — fica
  registada, não feita.

- **01/11/2026** — **O número que se lê é o do roteiro, nos três documentos.** Três réguas para a
  mesma contagem: o roteiro contava os **degraus**, o título da página o **índice do mapa** (com os
  nós de cabeçalho dentro) e a barra o **mapa inteiro**. Medido: anamnese 53/53 (**0**
  desalinhados — e é por isso que o defeito passou, porque é o documento onde ele não aparece),
  plano de ensino 26 nós/19 degraus com **18 desalinhados** (Δ −7), plano de observação 33/30 com
  **os 30**. `numerosDoMapa()` passa a ser a régua única, e o que não tem degrau continua a barrar o
  fecho — **nomeado**, não somado. **CONFIRMADO**: `provar-numeros-do-roteiro` **29/0**, e **12
  falhas** com o código de `HEAD` (controle negativo). Publicado em `10bf6b6`.
- **01/11/2026** — **A «Sequência de exercícios por bloco» passa a demonstrativo.** `Bloco` e
  `Objetivo específico` entram em `somenteLeitura` — vêm de «Blocos de cada objetivo» e dos marcos, e
  o conteúdo do nível vem da matriz do «Parâmetro de medição», e os tempos e o compasso do verbete.
  O texto do nó passa a dizer que é «um DEMONSTRATIVO, e não um segundo lugar para decidir». Fica
  livre o conteúdo sem parâmetro marcado e o «Adicionar linha». **CONFIRMADO** na tela (as duas
  colunas saem `travada`). Publicado em `10bf6b6`.

- **01/11/2026** — **A tira dos passos sai do formulário, e o verbete fica em cinco.** Três pedidos
  numa frase: o formulário volta ao **padrão** (à esquerda, listagem **presa** à direita) — a regra que
  forçava a coluna única saiu, porque a causa dela (sete passos numa coluna de 34rem) desapareceu —; a
  tira passa a viver **fora do `<form>`**, modelo da turma; e o **exercício, a frase e a posição**
  fundem-se no passo 1. Ficam **cinco**: 1 O exercício · 2 A música · 3 Para onde · 4 Os sinais · 5 A
  decomposição, com `PASSOS_DO_TRECHO` em `[3, 4]`. **Uma armadilha paga:** com a tira fora, ela
  deixou de sair de borla no modo do exercício, e o `hidden` não chegava — a regra de autor vence a do
  navegador —, daí `.passos[hidden]{display:none;}`. O resumo do passo 1 passou a dizer o nome **e a
  posição**. **CONFIRMADO**: `provar-celula` **115/0** (eram 106), as restantes provas verdes,
  `check-identidade` 20/20, `check-pacote` 0 erro, âncora íntegra com o **selo na versão 9**.
  Publicado em `b0d781f`.
- **01/11/2026** — **Três verbetes de ensaio no alfabeto.** A pedido dela — «acrescenta também esses
  modelos de teste, pré-preenchidos… assim vai ficar mais fácil eu ficar fazendo os testes» —, entram
  **Grand battement** (`8|4/4`), **Arabesque** (`4|4/4`) e **Rond de jambe à terre** (`8|4/4`, com o
  nome que o **vocabulário** usa; até aqui o alfabeto tinha «Rond de jambe», que não é termo nenhum). O
  alfabeto vai à **versão 9**. Passam pela régua do motor e pela composição **antes** de serem
  escritos. **A decomposição é ensaio** e a música do Arabesque e do Grand battement é escolha minha —
  e o plano passa a trazê-las **travadas**, porque o verbete passou a responder por elas.
  **CONFIRMADO** localmente.
- **01/11/2026** — **Uma prova que o commit citava e o Git não tinha.** A `provar-musica-no-plano.js`
  de `885ea96` ficou fora do repositório (o `experimentos/*` fecha a pasta, faltava o `!`). Entra
  agora, com a razão escrita no `.gitignore`. O caso «sem verbete» passou a ser medido no **Jeté**,
  porque o Arabesque ganhou um.

- **31/10/2026** — **Os tempos e o compasso vêm do verbete.** Ela abriu o nó «Sequência de exercícios
  por bloco», no plano do Nível 3, e o **Battement fondu** — escrito no verbete, com a música `2|4/4` —
  estava com **Tempos** e **Compasso** vazios. O defeito não era o dado: o plano contribui com duas
  coisas para a notação, e juntas são a **chave do verbete** (`<tempos>|<compasso>`), que o verbete já
  declara. Agora, com **uma** música os dois campos vêm preenchidos e **travados** (o par viaja escondido
  e é o que fica gravado); com **várias** (o Battement tendu tem três) são escolha, e só as declaradas se
  oferecem; **sem verbete** (Arabesque, Jeté) fica como era. Uma nota diz de onde vêm e que é o **verbete
  que se altera**. A fonte é o **alfabeto**, lido do `notacao.json` que já vai no Worker — **zero KV** —,
  e o **controle negativo** da prova garante que a regra não está escrita na tela. **CONFIRMADO**:
  `provar-musica-no-plano.js` **18/0** (nova), `provar-celula` 106/0, `provar-parametros-por-parametro`
  21/0, `provar-plano-da-turma` 46/0, `provar-porta-sem-contexto` 44/0, `check-identidade` 20/20,
  `check-pacote` 0 erro, âncora **sem renovação** (esta entrega lê o alfabeto, não o escreve). A prova do
  CRUD do verbete ganhou **fixture própria**: criava o «Battement fondu» do zero e passou a receber 409
  no dia em que ele existe a sério. Publicado em `885ea96`.

- **31/10/2026** — **O plano diz por que um termo da turma não aparece.** Ela criou sete verbetes,
  associou quatro à turma **Balé Nível 3 — Teste 2** e no plano só viu **Jeté e Arabesque**. Duas
  causas, nenhuma visível: (1) os parâmetros de medição são o **conteúdo da turma do plano**, não o
  vocabulário — os planos existentes são do Nível 1 e do Nível 2, e o que ela associou foi ao 3; (2) a
  relação turma↔conteúdo guarda **`rond-de-jambe`**, um id que **nunca existiu** no ficheiro (o termo é
  «Rond de jambe à terre»), e um `filter(Boolean)` **escondia-o em silêncio** — os dois que sobravam
  pareciam a lista inteira. Agora a matriz diz de que turma vêm os parâmetros e quantos estão
  associados, e **acusa os órfãos** com os candidatos, a turma e onde se corrige; sem conteúdo nenhum,
  distingue «a turma não declarou» de «há conteúdo que já não existe». O id **não** se corrige sozinho:
  havia dois candidatos, e escolher seria decidir o que se mede. **CONFIRMADO** localmente: **21
  asserções** (eram 14) com controle negativo, `provar-plano-da-turma` 46/0, `provar-porta-sem-contexto`
  44/0, `check-identidade` 20/20, `check-pacote` 0 erro, âncora íntegra com o **selo na versão 8**, e a
  reprodução com o **dado ao vivo** a dar exactamente o que ela vê. Publicado em `c3f0fb1`.

- **31/10/2026** — **A frase é do exercício, e a listagem diz o que o verbete é.** Três coisas ditas na
  mesma sessão de uso. **Battement dégagé não tinha descrição** — a nota dizia o que os três termos
  *não* são («não tratar como sinônimos perfeitos») e não dizia o que ele é; agora a família do tendu
  tem quatro descrições com a tradição declarada (**59 termos com descrição**, e **23 de 55**
  exercícios com definição), com a `fonte` a dizer que são minhas e a conferir. **A redundância voltou
  pelo preenchimento**: a quarta coluna saíra da tabela, mas «o que acontece» continuava a ser pedido
  a **cada trecho**. A frase passou a ser do **exercício**, escrita uma vez no **passo 2** — nasce daí
  o **sétimo passo**, e o último deixou de ter campo de texto para mostrar o que **fica escrito** em
  cada trecho (frase + «lê-se»). A proveniência foi respeitada: o que está **gravado** vence o
  dicionário, e trocar a música não reescreve a frase. **A secção ficou numa coluna**, com o
  formulário na largura toda e a **listagem abaixo** (recolhido, fica só a listagem), e cada linha
  ganhou **etiquetas derivadas do alfabeto** — posição em selo, e por baixo direções, compasso,
  músicas e trechos. Ficou também corrigido um defeito de leitura: `descontinuado` era lido no topo do
  verbete, onde nunca está. **CONFIRMADO** localmente: **106 asserções** em navegador, `provar-verbete`
  e `provar-notacao` (74) verdes, `provar-celular` **15/15**, `provar-vao-do-botao` **62/62**,
  `check-identidade` **20/20**, `check-pacote` **0 erro**, âncora íntegra (`3601081…`). A conferência ao
  ar fica para depois do push.

- **31/10/2026** — **O verbete em seis passos, e o trecho que se pode corrigir.** Ela viu as duas
  bancadas e escolheu os **passos** («o Step, apesar de ter mais cliques, ele é mais fácil de
  entender»), e pediu o que faltava nelas: **editar um trecho já acrescentado**, com um sinal de que se
  está em edição. O formulário passa a **seis passos** — 1 O exercício · 2 A música · 3 A posição · 4
  Para onde · 5 Os sinais · 6 A decomposição —, um de cada vez, e a tira em cima mostra o que já está
  decidido e serve de navegação. Os três passos do trecho separam **o que o trecho é**, **como se
  escreve** e **o que a decomposição mostra**; a tabela deixou de estar ao lado das escolhas que a
  alimentam. **A peça não é nova**: `.passos`/`.passo`/`.passo-alerta` e o `!` já são a faixa da turma,
  nesta mesma página — só a largura da tira ganhou travas próprias. No **modo de edição**, a linha
  ganha «Editar» e «×»; ao editar, a página vai ao **passo 4** com os valores do trecho, o «!» acende
  nos passos **4 e 5**, o aviso diz **«Em edição — trecho N»**, o botão do 6 passa a **«Guardar a
  alteração»**, a linha perde o «×» e mostra «Cancelar». Defeito encontrado ao medir: a contagem
  recomeçava a contar a **célula em correcção** (um trecho em «1» de 2/4 abria a edição a oferecer
  «2»). **CONFIRMADO** localmente: **96 asserções** em navegador, `provar-producao` **151/152** (a
  falha pré-existente do menu), `check-identidade` **20/20** e a checagem **8 (Peça)** verde,
  `check-pacote` **0 erro**, âncora íntegra (`3601081…`). Publicado em `d7e71ff`; a conferência ao ar
  fica para depois do push.

- **31/10/2026** — **As definições do dicionário no vocabulário, o «lê-se» no campo, e a quarta coluna
  fora.** Ela achou o ajuste anterior incompleto: escolheu o **Grand battement** e a definição que
  apareceu era «Grande batimento da perna de trabalho.», não a que ela tem e leu em voz alta, com
  **detalhe técnico** incluído. O dicionário que forneceu (30 termos) foi fundido no **vocabulário** —
  a verdade única dos termos: **14 termos sem descrição passam a tê-la**, **10 são substituídos**, **6
  são criados** (Aplomb, Bras bas, Adagio, Allegro, Ballon, Legato); de **87 para 93** termos, de **35
  para 55** com descrição, e os exercícios de **12 para 19** com definição, em 55. A `fonte` está
  declarada em todos. O «**lê-se**» passou a ser a **segunda linha do campo** «o que acontece» — a
  definição em cima, «Lê-se: Pé, quinta posição, à frente, quinta posição» em baixo —, e a frase
  **gravada** é composta ao acrescentar, para não se perder quando ela reescreve o campo. A **quinta
  coluna** da tabela (a frase, editável por linha) **saiu**: com a frase a vir da definição, todas as
  linhas diziam o mesmo, e o que muda por trecho é função da notação. **CONFIRMADO** localmente (85
  asserções em navegador; PDF com o **mesmo md5**); a conferência ao ar fica para o deploy.
- **31/10/2026** — **Duas arrumações do formulário, para escolher.** `experimentos/propostas/
  proposta-verbete-acordeao.html` (Proposta 13: quatro painéis, as secções fechadas a dizer o que têm
  dentro) e `proposta-verbete-passos.html` (Proposta 14: quatro passos com uma tira de resumo que é
  também a navegação). Ambas funcionam sobre o dado real. A tira de passos passou a ser peça existente
  quando se viu que `.passos`/`.passo`/`.passo-alerta` já são a faixa da turma na mesma página.
  **DECIDIDO** no mesmo dia: ela escolheu os **passos** (ver a entrada acima, `d7e71ff`).

- **31/10/2026** — **«O que acontece» recebe a definição do exercício, e o «lê-se» desce.** A
  pesquisadora gravou o **primeiro verbete a sério** — *Rond de jambe en l'air* (`73f5330`, alfabeto
  **versão 6**) — e o dado mostrou o defeito: nos três trechos a `descricao` é «rondejambe en l'eir»,
  isto é, o **nome do exercício** escrito num campo que, vazio, não dizia o que queria. O campo passa a
  pré-encher com a **definição do exercício lida do vocabulário** (a rota leva `descricao` e `fonte` em
  cada termo), e a ordem de preferência é **três**: definição do exercício → dicionário **do trecho**
  (indexado pela notação) → vazio; sem o segundo, **43 dos 55** exercícios ficariam sem sugestão (o
  vocabulário tem definição em **12 de 55**). A definição aparece **assim que o exercício é escolhido**,
  a nota diz **de onde veio**, e o que se grava continua a ser a frase da célula (P-03/P-04). O
  «**como se lê**» passou para **abaixo** do campo: a ordem é a da leitura. As duas `.fipp` foram
  **regeradas** (selo desatualizado pela versão 6). Publicado em `7be42cb`. **CONFIRMADO** localmente
  (82 asserções em navegador); a conferência ao ar fica para o deploy.

- **29/10/2026** — **A direção é escolha única, «en face» marca, e a contagem continua o compasso.** A
  pesquisadora foi escrever o **Battement frappé** (16 tempos, 2/4, *sur le cou-de-pied*) e relatou
  três coisas: «en face» não marcava, não conseguia marcar duas direções sem perder a primeira, e o
  trecho escrito **à frente** apareceu como se fosse **atrás**. As três tinham a mesma raiz: as
  pílulas nasceram **todas `checkbox`**, e a direção não é uma lista — com `checkbox` e sem
  repintura, o navegador marcava a nova e **deixava a anterior**, e o estado ficava com a última.
  Reproduzido na bancada com o alfabeto real (as três liam `true` e `DIRECAO` dizia `derriere`).
  Passa a **`radio`** com `name` por grupo. «**En face**» era a única que nunca marcava; passa a
  aparecer marcada quando nenhuma outra está, e o estado continua vazio para ela — **o que se grava
  não muda**. E, **não relatado, encontrado ao medir**: a **contagem recomeçava por direção** e o
  compasso é corrido, o que punha «à frente» e «ao lado» no mesmo «compasso 1, contagem 1»; agora o
  início soma, na ordem da gramática, tudo o que vem antes, e sai da **mesma soma** que a coluna do
  compasso. Medido: `compasso 1 | 1`, `compasso 1 | 2`, `compasso 2 | 1`. As **22 células** do
  alfabeto continuam válidas e a âncora não mudou. Publicado em `5af8aff`. **CONFIRMADO** localmente
  (75 asserções em navegador); a conferência ao ar fica para o deploy.

- **29/10/2026** — **Os dois eixos da célula, e o trecho todo em pílulas.** A pesquisadora testou o
  formulário com **Battement fondu, 4 tempos, 2/4, quinta posição** e pediu «flexibilizar ainda mais»:
  não conseguia escolher mais de uma direção, e a mesma explicação repetia-se para oito coisas. Ao
  reproduzir o gesto num navegador, o defeito apareceu por baixo — **escolher o segundo sinal apagava o
  primeiro**, porque uma escolha única não escreve uma sequência. E o defeito de fundo era do **dado**:
  a tabela tinha **oito blocos** porque o alfabeto juntava a **direção do membro** (3) e a **orientação
  do corpo** (5) numa lista só. A célula ganhou o campo **opcional `orientacao`** — omitido vale
  `en-face`, e é omitido que se grava —, o motor leva-a ao segmento e à declaração e a prosa diz-a na
  legenda quando não é `en face`, e o servidor recusa uma orientação que não esteja na gramática
  (alfabeto **versão 5**). Na tela não há **nenhuma lista suspensa** no trecho: direção, orientação,
  contagem, categoria e sinais são pílulas; cada clique **acrescenta ao fim**, e a remoção é pelos «×»
  das fichas numeradas. A **direção e a orientação ficam** depois de acrescentar um trecho, e só os
  sinais, a contagem e a frase se limpam — é o que permite emendar o en croix. A tabela ganha a coluna
  da orientação, e a célula sem ela diz «en face» em palavras. Publicado em `4994b34` e `9b318fe`.
  **CONFIRMADO** localmente — 61 asserções em navegador, e o **texto dos PDFs com o mesmo md5** de
  antes; a conferência ao ar fica para o deploy (os 22 verbetes ainda não declaram orientação).

- **28/10/2026** — **A célula explicada: a contagem escolhe-se, os sinais compõem-se, a frase vem do
  dicionário.** A pesquisadora abriu o editor e não entendeu quatro campos — e no meio da pergunta
  estavam três defeitos meus: **«bloco» queria dizer duas coisas** (Solo · Barra no plano, e a
  notação na célula), a **legenda repetia as categorias** dentro da lista de sinais (22 sinais, 4
  deles eram as categorias), e as **duas tabelas diziam a mesma coisa**. A **contagem** deixou de ser
  campo de escrita: é uma lista das que cabem no compasso (vai de 1 até o numerador e recomeça no
  seguinte; o número do compasso é calculado). A notação passou a compor-se — categoria + sinais,
  cada um com o nome — e o dado acompanha (célula declara `categoria` e `sinais`, notação derivada,
  alfabeto **versão 4**), com os documentos publicados **idênticos** (mesmo md5 no texto dos PDFs). E
  a frase em português passou a vir de um **dicionário do balé** (`descricoes.json`, chave = a
  notação), que **sugere** — o que fica gravado é a frase da célula. Publicado em `4342f16`.
  **CONFIRMADO** localmente; a conferência ao ar fica para o deploy.

- **28/10/2026** — **Dois modos no verbete, a direção lida do dado, e o editor de célula.** O «+»
  abria uma caixa a meio do formulário, e o que vinha depois continuava a ser do verbete: dois botões
  primários à vista, os campos do verbete abaixo do botão que grava o exercício, e «informe o nome do
  exercício» com um exercício escolhido. O formulário passou a ter **dois modos que não coexistem**, e
  a **direção deixou de ser pergunta**: o campo `direcoes` era, seis de seis, a lista das chaves de
  `celulas` — saiu do dado (alfabeto versão 3) e a direção é derivada. A tela mostra uma tabela com
  três estados (coberta, sem célula nesta música, fora do exercício) e o «fouetté não vai às três»
  passa a ser um facto do alfabeto, não uma proibição do sistema. O **editor de célula** fecha o
  gargalo dos **55 exercícios para 4 verbetes**: «Gravar verbete» recusava criar o que não existisse
  porque as células vinham do que já estava gravado. Publicado em `4f4795a`, com a folha em `9fb09dc`
  (o campo bloqueado passa a ver-se — motivo declarado, commit próprio). **CONFIRMADO** localmente;
  a conferência ao ar fica para o deploy.

- **28/10/2026** — **O vocabulário passou a viver no repositório, numa verdade só, e o «+» cria o
  exercício.** Havia **duas** listas de termos — o ficheiro da modalidade e uma cópia por escola no
  KV, semeada pelo botão «Carregar catálogo inicial». A tela do verbete lia a do repositório; a do
  vocabulário escrevia na do KV; e o gerador lê o ficheiro do **disco**, no GitHub Actions, pelo que
  uma escrita em KV nunca chegaria ao documento. `termos()` passa a devolver o bundle;
  `motor/servidor/termo-repo.js` (novo) grava no repositório; o `PUT` do termo edita o nome (e o
  `id`, que deriva dele); e o semear passou a semear **só as turmas** — o botão diz «Carregar as
  turmas iniciais». O **«+»** ao lado do exercício (opção A) abre um cadastro breve que chama o
  mesmo cadastro de termos, e o exercício novo entra na lista local no grupo da categoria. Publicado
  em `4e09bc9`. **CONFIRMADO** localmente; a conferência ao ar fica para o deploy.

- **28/10/2026** — **O verbete ganhou posição, direção e lado — e passou a ser administrável na
  Produção.** O alfabeto mudou de casa (`biblioteca/modalidades/bale-classico/notacao.json`) e a
  âncora passou a **selar** o alfabeto no `.fipp` (opção B); o verbete passou a declarar `posicao`,
  `direcoes` e `lado`, o compasso deixou de ser escrito à mão e passou a ser calculado, a 4ª posição
  dos pés entrou, e as posições de braços passaram a ser declaradas **por método** (a 3ª francesa é
  a 5ª da RAD). A página em prosa passou a dizer a posição no cabeçalho do exercício. E uma secção
  nova em Produção › Pedagogia, **«Verbetes da notação»**, cria, edita e descontinua verbetes —
  gravando no **repositório**, porque é de lá que o gerador lê. Publicado em `5020b89` (alfabeto e
  selo), `8df6c0c` (forma nova, motor e fontes) e `3dcc344` (o CRUD); os quatro workflows de
  `3dcc344` **success**. **CONFIRMADO**.

- **28/10/2026** — **A «Sequência declarada» saiu, e a métrica ganhou a primeira explicação.** A
  secção era a grade em resumo, sem a notação e sem a descrição: saiu da aula e da notação (−69
  linhas em cada página gerada), e o link «Aula 01» do plano passou a apontar para a grade
  (`#exercicios-da-aula-01`). O Port de bras foi corrigido de 16 para **18 tempos** nas duas versões
  do envelope, o que expôs uma lacuna escondida: o verbete cobre 12 dos 18 tempos. O rastreio pedido
  apurou que compasso, contagem, notação e descrição vêm **do verbete**, não do plano — e que o bloco
  de musicalidade é uma linha **escrita à mão** no derivador, sem pergunta que a preencha. Publicado
  nos commits `6e248ac` (ferramentas, com motivo declarado), `ee99969` (fontes e pacote) e `f4cc715`
  (registo); os quatro workflows **success**. **CONFIRMADO** ao ar.

- **28/10/2026** — **O cabeçalho perdeu as etiquetas, e o cartão da ficha perdeu a moldura.** A
  fileira «Escola · 2x/semana · 50 min · Plano · Ciclo 01 · Volume semanal» saiu de todas as páginas
  do pacote; o subtítulo saiu de referências, aula, notação e glossário (na aula desceu ao corpo,
  como «Condição desta aula»); «Abrir notação» passou a botão do cabeçalho da Aula, preso com o
  título, e saiu da listagem; e o cartão da anamnese ficou sem a moldura `┌─┐`, com os campos
  reordenados e o traço até ao fim da linha. Publicado nos commits `a2bbdfa` (ferramentas, com
  motivo declarado), `29a95e5` (fontes e pacote) e `3c3a29d` (registo); workflows #105, #206, #289
  e #404 **success**. **CONFIRMADO**.

- **28/10/2026** — **O documento abre pela leitura, e o código interno saiu da tela.** O plano do
  ciclo deixa de ter resumo e etiquetas debaixo do título; o `## Contexto` passa a declarar dois
  grupos («Escola e espaço», «Professor, turma e método»); o calendário parte-se pelo marco; o
  rodapé passa a ser o de cada documento; e os códigos de pétrea (`P-06`, `P-10`, `P-11`, `P-15`,
  `P-16`, `P-21`, `P-22`) saem de tudo o que o professor lê. Publicado nos commits `973358b`
  (ferramentas, com motivo declarado), `dc8faec` (fontes e pacote da Batata) e `d9f085f`
  (registo); workflows #205, #288 e #403 **success**; o plano foi conferido ao ar. **CONFIRMADO**.

- **27/10/2026** — **A Aula 01 foi publicada na Batata.** O commit `8b939d0` foi enviado a
  `origin/main`; o run #287 de `Publicar as escolas` e o job Batata passaram. A única conferência
  ao vivo após o deploy foi à raiz: HTTP 200 e link de navegação para `/aulas/`. A rota específica
  não foi recarregada. **CONFIRMADO**.
- **27/10/2026** — **A Aula 01 e a Notação ficaram alinhadas.** O Guia usa os itens declarados no PO
  e esclarece o registro na Captura; a Notação compõe a estrutura completa da Aula com os sinais
  Benesh; o Plano abre pelo título e a lista de Aulas oferece PDF individual. Pacote real, publicação
  local, validadores, provas focadas e âncoras passaram. **PENDENTE** push, deploy e conferência ao
  vivo.
- **27/10/2026** — **Aulas passou a oferecer as duas leituras.** O título da Aula 01 abre a versão
  em prosa; «Abrir notação» fica ao lado; as listas independentes de Notação e Consulta deixam de
  ser geradas; a Notação oferece um atalho persistente para o Glossário em nova aba. Pacote,
  publicação local, provas focadas e âncora validados. A entrega em `d349ed0` foi publicada pelo
  workflow automático, job Batata **success**; `/aulas/` respondeu 200 com os dois links. **CONFIRMADO
  em produção**.
- **26/10/2026** — **a ação de cada formulário da Produção passou a ser uma só peça.** O
  «Cadastrar aluna» e o «Cadastrar termo» estavam a **0px** do campo: o `<div class="res">` entre o
  último controle e o botão parte a conta de vizinhança da folha (`input + button.acao` → 16px), e
  o `.acao` declara `margin: 0`. O «Atribuir curadoria» estava sem `.acao` e saía no botão **padrão**
  — fundo de papel, 45px — ao lado de ações cheias de bordô de 49px. Os três passaram à fileira
  `.par-botoes` com `.acao grande`, o modelo do «Cadastrar professor»; medido **9px** nos quatro
  (13 na curadoria). **Nada tocou a folha**, que está congelada — o defeito era a página a desfazer
  a conta dela. Prova nova: `experimentos/provar-vao-do-botao.js` (62/62; 46/62 no controle
  negativo). A `provar-celular.js`, que saía sem medir nada desde que o menu deixou de ser `sticky`,
  voltou a **15/15**. **CONFIRMADO** no navegador, **DECIDIDO** 26/10/2026 e **publicado**: o push
  levou também os dois commits do menu que estavam por enviar, os dois workflows de publicação
  terminaram em `success` sobre `fe71508`, e a página ao ar serve as três marcações novas.
- **25/10/2026** — **a opção A implementada no produto**: o contexto do ato passa a ser um painel
  dentro das três listas da Área do Professor, aberto pela caixinha do «Turma» na faixa inteira, com
  a seta `▾` a rodar para cima ao abrir. O botão solto do topo saiu (duas portas, e a segunda sem o
  contexto). A regra dos três botões da porta passa a ser executada, com a mesma chave de memória; o
  contexto escolhido é guardado sem a senha. Duas armadilhas da bancada ficaram escritas na prova.
- **25/10/2026** — **a opção A do «acervo com a porta», escolhida e corrigida**: a caixinha do
  «Turma» passa a abrir o painel, na faixa inteira (nove propriedades iguais às da caixa do cartão,
  provadas); «ver a ficha em branco» sai do painel e fica sempre à vista; com preenchimento
  interrompido o painel abre sozinho. A regra dos três botões foi confirmada em `porta/index.html` e
  a bancada passa a executá-la. Nada de produto alterado.
- **25/10/2026** — **a Área do Professor ficou sem porta e voltou a tê-la.** As três listas servidas
  pelo acervo nasceram com `acoes: []`, e a linha deixou de levar ao formulário quando deixou de ser
  uma turma e passou a ser um registo. Medido em produção: `/aulas/` com 27 acções, as três da Área do
  Professor com **zero**. Botão do topo (`a.acao` em `header.doc`) e destino por linha; 16 asserções
  novas na prova, geometria medida em 390/768/1280px.
- **25/10/2026** — segunda ronda de respostas: **o marco é obrigatório e explícito, mas pode repetir o
  da aula anterior**; os três lugares da aula passam a **propostos** (o professor mantém, edita, cria ou
  acrescenta); **os `materiais` entram no formulário**. As perguntas passam a ser identificadas por
  **nome** — a numeração mudou duas vezes e já atrapalhou a leitura.
- **25/10/2026** — a pesquisadora respondeu ao documento de análise: **uma correção de diagnóstico**
  (a repetição do contexto no PO é proposital, não é defeito), **três decisões** (marco por aula,
  herança mista da sequência, comparação com a aula anterior), **duas perguntas reabertas** por
  obscuridade da redação (`derivados`, `materiais`) e **uma pergunta nova** (o passo de alinhamento
  com o PO). Termos verificados no código e no repositório.
- **25/10/2026** — `7182307` a análise da aula, do plano e da observação.
- **25/10/2026** — o padrão de listagem aplicado: «Consulta», três caixas por registo, as três
  listas da Área do Professor servidas pelo acervo.
- **25/10/2026** — corrigidos três defeitos só visíveis em produção: a data «—», a versão do
  resumo e a turma do PO.
- **25/10/2026** — a bancada das propostas passou a ser construída antes de a escola ser montada.
- **24/10/2026** — o ☰ dentro da Produção passou a abrir o menu do sistema inteiro.
- **24/10/2026** — «Aulas» deixou de estar duplicado no menu.

## 12. Limitações de conhecimento

O que **não** consigo confirmar, e o senhor tem de decidir ou informar:

- **A produção não foi percorrida página a página.** Em 02/11/2026 carregou-se a **Aula 01** da
  `batata` (200, com as quatro correções) e leram-se duas respostas de `api/mapa`; **as outras
  páginas** do pacote (o plano, a notação, a captura) não foram conferidas ao vivo nesta fotografia.
  A rota `/aulas/` que aqui estava citada **deixou de existir** no reagrupamento de 24/10.
- **Não sei a distribuição real de uso em produção.** Não há telemetria; o que sei é o que os
  `curl` devolvem.
- **Não sei se o `TRANSFERENCIA-IA.md` serve o seu caso de uso.** Foi desenhado a partir de uma
  descrição, não de uma tentativa real de o anexar a outro assistente. A versão de 02/11/2026 é a
  primeira escrita **depois** de uma sessão inteira de correções, e não a partir de um resumo — é a
  melhor aproximação até agora, e continua por testar.
- **Não sei se as perguntas abertas da §8 foram decididas fora do repositório.** A §8 regista o que
  a pesquisadora respondeu em 25/10/2026, em duas rondas. Continua **sem resposta** apenas
  `alinhamento` (a frequência do passo de confirmação com o PO), e **sem decisão** a possibilidade de
  referências bibliográficas por aula — levantada de passagem, não pedida.
- **Não verifiquei as 11 provas não versionadas** — não sei se ainda são recuperáveis. Em
  02/11/2026 descobriu-se que uma delas, a `provar-ajustes-anamnese`, **estava versionada mas a
  correr pela metade**: 56 asserções em vez de 126. É a demonstração de que «está no `.gitignore`
  como exceção» não é o mesmo que «corre inteira».
- **Não sei o estado do KV em produção** — cota, ocupação e envelopes reais não foram medidos
  agora. Medir custa cota diária.
- **A fotografia envelhece no commit seguinte.** Se o `HEAD` avançou e este documento não, vale o
  código, não o documento.

## 13. Rotina de atualização e transferência

### Atualizar a fotografia

Peça **«atualiza a fotografia»**. O que acontece:

1. Verificar o remoto (`git fetch`, `git status -sb`) — regra do «remoto primeiro».
2. Recolher o que mudou materialmente desde a data da última fotografia.
3. Atualizar **só as secções afetadas** — nunca reescrever o documento inteiro.
4. Registar as decisões novas no `REGISTRO.md`, não aqui (aqui fica só o resumo da §6).
5. Correr as validações da §9 e escrever o resultado, mesmo quando é negativo.

### Gerar a transferência para outro assistente

Peça **«gera a transferência»** — ou **«gera a transferência sobre <assunto>»**, se a dúvida não
estiver clara. O procedimento está em
[.github/skills/fotografia-do-estado/SKILL.md](.github/skills/fotografia-do-estado/SKILL.md).

O resultado é `TRANSFERENCIA-IA.md` na raiz. **Não é versionado** (entra no `.gitignore`): é
contexto efémero de sessão, como as saídas geradas de P-04, e versioná-lo criaria conflito a cada
geração.

**A transferência é manual.** Nenhum agente anexa nem envia o documento a outro serviço; o senhor
anexa-o à conversa que quiser. Se algum dia houver integração configurada, isso será dito aqui.
