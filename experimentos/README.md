# experimentos/ — área de teste

O que fica aqui **não entra no hash da âncora**, **não entra no pacote** e **não é
publicado**. É área de teste: se funcionar, sai daqui e entra nos diretórios
oficiais; se não, some.

## Por que isso é seguro por construção

Não depende de disciplina — depende de como o projeto é montado:

| O que | Por que o `experimentos/` não afeta |
|:--|:--|
| **Hash da âncora** | cobre as fontes do ciclo, resolvidas por `tools/lib-fontes.sh` (`index` + `DOCS` + PO + manifestos + relatórios). Nada daqui é fonte |
| **Pacote** | é montado de `DOCS` + acompanhamentos. Nada daqui está nessas listas |
| **Site publicado** | o Cloudflare serve os pacotes versionados. Nada daqui é publicado |
| **`check-pacote`** | valida o pacote, não a raiz do repositório |

Ou seja: **experimentar aqui não pode quebrar produção.**

## Como testar localmente

```bash
python3 -m http.server 8000 --bind 127.0.0.1     # da RAIZ do repositório
# abra http://127.0.0.1:8000/experimentos/<experimento>/
```

Use `127.0.0.1` (e não `file://`): páginas que usam WebCrypto — como o
PageCrypt dos acompanhamentos — só funcionam em contexto seguro, e `file://`
pode falhar sem dizer por quê.

**E sirva da RAIZ, não com `--directory experimentos`** (medido, 20/09/2026): as páginas dos
experimentos consomem libs que vivem **fora** de `experimentos/` — a `tools/lib-vistas.js`, por
exemplo, entra por `<script src="../../tools/lib-vistas.js">`. Servindo só a pasta `experimentos/`,
a página abre (200) e a **lib dá 404** ✗: o experimento fica sem os builders.

**O sintoma, quando acontece (medido, 20/09/2026):** a página abre e o painel diz *"Detalhe:
Vistas is not defined"*. É a lib que deu 404 — mas o erro vem com a cara de outra coisa, porque o
`ciclos.json` da mesma pasta carrega normalmente. A conferência é abrir
`../../tools/lib-vistas.js` direto no navegador: **404 = o servidor não está na raiz.** Vale para
servidor **antigo** também: um `http.server` no ar desde antes de a lib existir (a 8001 deste
repositório ficou assim) serve a página e não serve a lib — derrube e suba de novo:

```
pkill -f 'http.server 8001'
python3 -m http.server 8001 --bind 127.0.0.1        # da RAIZ do repositório
```

O formulário passou a dizer isso por si (o painel nomeia a lib que faltou, em vez de culpar o
`ciclos.json`), mas o conserto é o servidor, não a página: a mensagem existe para o sintoma
apontar para a causa sem passar por três tentativas.

> **Atenção:** o deploy é do **Worker ligado ao repositório**, disparado pelo push — e ele
> publica em produção (uma escola por Worker; a escola que está no ar muda, e quem a nomeia é
> `wrangler.<escola>.jsonc`, não esta página). Não use para experimentos.
> Para ver um experimento no ar, `git push` não serve: nada de `experimentos/` é
> publicado. Se um experimento precisar de site, ele deixa de ser experimento.

## O que é versionado

**Só este README.** O resto de `experimentos/` é ignorado pelo Git (`.gitignore`).

O motiva: experimento é rascunho. Versionar rascunho enche o histórico de
tentativas que ninguém vai ler — e o que vale vira produção, com commit próprio.
Se um experimento precisar ser guardado como está, ele vira um documento
(`IDEIA-*.md`, `ARQUITETURA-*.md`) na raiz, que é onde as ideias são registradas.

## O que existe hoje

Um diretório por experimento — sem nome reservado e sem a obrigação de nascer
preenchido. Os que estão em curso, medidos em 01/10/2026:

```
experimentos/
├── README.md                 este arquivo (o único versionado)
├── captura-json/             o gerador de vistas sob demanda
├── simulacao-marau/          a Elicitação inventada até a página de produção
├── pe/                       o piloto do PE — ver o README de cada um
└── *.js · preview-*.html     provas e rascunhos soltos na raiz da área
```

Os diretórios de experimento são **ignorados pelo Git**; o `README.md` de cada um
existe para quem lê o diretório no disco, não para o histórico. O que vale vira
produção, com commit próprio — e é aí que entra no Git.

## Provas que moram aqui e valem como prova

Nem tudo nesta pasta é rascunho. Estes arquivos são **provas** — rodam, medem e reprovam:

| Prova | O que mede | Precisa de navegador |
|:--|:--|:--|
| `provar-producao.js` | o comportamento da vista de Produção (135 casos) | não |
| `provar-derivacao-da-turma.js` | a cadeia de derivação da turma (123 casos) | não |
| `provar-tema.js` | a aparência clara/noturna: aplicação, persistência, botão alcançável | não (DOM de mentira) |
| `provar-celular.js` | a **geometria** em 320–1024px: nada transborda, o nome da turma não é espremido, o menu de secções vira faixa | **sim** (Chrome) |
| `medir-marca.js` | os números da marca contra as três famílias (o instrumento do estudo **Q**) | não |
| `marca/vetorizar.js` | o traçado da logomarca em SVG e a **fidelidade medida** (IoU 0,980) | **não** (PNG via `zlib`) |
| `provar-acordeoes.js` | as **cinco** secções da Produção recolhem, e recolhidas a listagem mede a largura inteira; a seta de uma não mexe nas outras; o estado é lembrado por secção; o «Carregar catálogo inicial» cabe na coluna | **sim** (Chrome) |
| `provar-teste.js` | as **escolas de teste**: as três palavras (`Calango`/`Batata`/`Breu`), o fixture certo, o preenchimento da Produção, da anamnese e do plano, e a ausência de qualquer escrita | não (jsdom) |
| `provar-geracao.js` | o que a tela sabe **enquanto o GitHub gera**: o gatilho condicionado às fontes, o registro no KV, as fases do estado e o cartão da porta (38 casos) | não (jsdom) |
| `provar-indice-de-envelopes.js` | a estante deixa de pagar a enumeração do KV: o índice como arquivo, a escrita, o apagamento, a falha da cota e a migração do índice antigo (41 asserções) | não |
| `provar-acervo-envelopes.js` | os envelopes no **repositório**: o caminho, a anamnese cifrada, a listagem numa chamada, o 409 do índice, o KV antigo como reserva e a composição `envelope/` × resto (41 asserções) | não |
| `provar-indice-de-proveniencia.js` | o **índice do acervo**: determinismo, reconstrução, «substitui a varredura» (zero árvores), o que não guarda, a forma da resposta e a invalidação por gravação (60 asserções) | não |
| `provar-declaracoes-do-indice.js` | as **declarações** do índice (Etapa 1): todo arquivo de `professores/**` tem decisão, o vocabulário declarado é o do motor e nenhuma relação aponta para o que o dicionário não tem (23 asserções) | não |
| `provar-indices.js` | o **gerador e o validador** (Etapa 2): determinismo de ponta a ponta, reconstrução sem o disco de `indices/`, o que o índice não guarda, o expurgo que permanece, o recorte por ciclo contra a escola e as quatro superfícies do gerador — inclusive os códigos de saída (28 asserções) | não |
| `provar-listas-sem-repeticao.js` | a **carga de cada página**: nenhum endereço pedido duas vezes, o orçamento de leituras, e a lista que não cresce com o acervo (16 asserções) | não (jsdom) |
| `provar-anamnese-sem-cofre.js` | a anamnese **sai do KV**: o registo vai para o acervo, o KV em memória fica com **zero escritas**, as três rotas do cofre respondem 404 e o cliente não pede a segunda cópia (13 asserções — **negativa**: mede uma ausência) | não |
| `provar-expurgo-sem-listagem.js` | o expurgo com a enumeração do KV recusada: o registo de chaves, a pendência no elo e o `POST /api/expurgar-kv` (40 asserções) | não |
| `provar-aula-e-plano-legiveis.js` | o **contrato entre a derivação e a leitura**: o `.md` que o gerador escreve é lido de volta pelos três validadores, e as duas metades concordam nos nomes das secções, no parâmetro que não parte a tabela e na tabela que **é** o campo (12 asserções) | não |
| `provar-sujeitos-da-turma.js` | o **recorte dos sujeitos pela turma**: a curadoria como fonte do vínculo, os dois formatos do registo, `null` ≠ lista vazia, a rota com `?turma=` e `?plano=`, e a declaração `recortePeloPlano` no conteúdo (25 asserções — **negativa**: mede que ninguém de fora aparece) | não |
| `provar-publicacao-da-escola.js` | o **site da escola montado**: o índice das turmas em `/`, a apresentação em `sistema.html`, um subdirectório por pacote, nenhum link morto, a montagem idempotente e a turma que sai não deixando fantasma (26 asserções) | não |
| `provar-vigente-na-listagem.js` | **uma linha por documento, e não por envelope**: a cadeia (`ajuste_de`) e as tentativas irmãs colapsam; outro plano observado, outra turma, outro ciclo e outra aluna continuam a ser documentos distintos; o que se esconde continua legível e no índice; e a linha diz quantas versões guardou (21 asserções — **negativa** em parte: mede que nada se perde) | não |
| `provar-menu-do-formulario.js` | **o menu e o cabeçalho, nas telas de formulário**: a barra e a coluna com o menu aplicado pelo MESMO módulo da ponte (`motor/nucleo/nav.js`), servindo a página a sério por `producao.fetch` — opacidade inteira, contraste AA, o clique a acertar no link, e o conteúdo a passar por baixo (36 asserções, Chrome). A rolagem é asserção: `scrollY > 0`, senão as asserções seguintes medem nada | não |
| `provar-eixos-e-tempo-da-aula.js` | **a fatia de tempo de cada bloco e as três frentes do guia**: a proporção é lida pela COLUNA e não pela posição (uma célula vazia não desloca as colunas), `minutos` e `percentual` dão os mesmos tempos, a lacuna nomeia o bloco, a prosa não se converte; e o guia lê Corpo (o aspecto físico do plano), Técnica (Barra, Centro) e Poiesis (Musicalidade, Expressão) sem perder um item (50 asserções), as TRÊS TABELAS por eixo com o corpo a ter linhas próprias, os links da proveniência a abrirem a LEITURA (a folha do documento) e não o formulário, e **o corpo com uma fonte só** — o detalhe na Aula 1, o ponteiro no plano, e nenhuma linha por aluna (com três alunas o documento não cresce) | não |
| `provar-colunas-da-aula.js` | **as colunas da aula e a notação fora do bloco de musicalidade**: a linha de separação passa dos 72 caracteres (sem isso o pandoc desiste e volta a distribuir por igual), a proporção dá compasso/contagem ≤ 15% e descrição > 45% (eram 28/28/21/21), o pandoc concorda no `colgroup` que escreve, e a §4 da aula deixou de trazer `[Perna: …]` — a notação vive no documento dela (23 asserções) | não |
| `provar-verbos-do-armazenamento.js` | **nenhum verbo do contrato fica pelo caminho**: lê os 7 verbos do PRÓPRIO ficheiro do contrato (não de uma lista à mão), confere os dois adaptadores de base, o acervo e o COMPOSTO; prova que o `criar` **funciona** nos três (o segundo pedido não sobrescreve, e o `guardar` continua a gravar por cima); e prova que o composto deixou de ENUMERAR — um verbo inventado na hora atravessa-o, um que ninguém implementa é recusado, e o `Proxy` não o torna uma *thenable* (era a armadilha: `await` pendurado) (29 asserções) | não |
| `provar-eixos-do-po.js` | **o Plano de Observação nos três eixos, e o corpo vindo da anamnese**: o sujeito escolhe-se ANTES das dimensões (a cascata), o eixo decide-se pelo BLOCO e não pelo prefixo gravado («Técnica — Musicalidade» lê-se Poiesis), o documento mostra `Eixo | Dimensão | Itens` com Musicalidade e Expressão fora do técnico e o Corpo a apontar para a Linha de base, e a linha do título é o **Fenómeno**; na tela (JSDOM), o painel do corpo carrega da anamnese de cada sujeito, com o NOME do campo e sem inventar o que ela não respondeu (34 asserções) | não |
| `provar-faixa-do-ato-no-celular.js` | **o «Contexto do ato» aberto cabe num telefone**: mede GEOMETRIA no Chrome (o jsdom não calcula layout) a 320/360/390/414px, com o envelope verdadeiro da `breu` — nenhum par de campos se sobrepõe, todo campo cabe na faixa, o controle cabe no campo, **todo rótulo tem largura para ser lido (≥ 40px)**, rótulo e valor não se sobrepõem, e a página não transborda. O defeito era o rótulo das LEITURAS a encolher até 0px e o valor a tomar a coluna (40 asserções) | não |
| `provar-ciclos-e-anamnese.js` | **a sequência dos ciclos, a guarda da exclusão e a anamnese datada**: o próximo ciclo é `01`/o seguinte, e um **buraco** (01, 03) não tem próximo honesto; os ciclos vêm do índice de envelopes (e a anamnese sem ciclo não inventa um); apagar um ciclo **intermédio é recusado com o nome do que impede** e nada é escrito no GitHub; o **último** apaga, leva só o gerado e não toca no vizinho; um **422** refaz o caminho; o padrão da variante não come `breu-bale-nivel-1-teste-3`; a chave da anamnese não tem ciclo; e o gesto é **«Novo registo»**, não «Ajustar» (34 asserções) | não |
| `provar-cartao-da-aula.js` | **o cartão da listagem de aulas**: a Turma sem «Ciclo» e com o operacional (aula N de M, dia, horas, duração, sala «não declarada»); o Professor com nome, modalidade (rótulo do catálogo) e tradição de referência (do plano) — e nunca o slug; o Guia em **três frentes**, com o Corpo a contar os aspectos do plano; e a frase de arquitetura a não voltar. Roda a montagem de verdade e lê o HTML que ela escreve (25 asserções) | não |
| `provar-fusao-da-edicao.js` | **duas edições do mesmo documento não se apagam** (decisão 84): campos diferentes unificam, o mesmo campo decide pela recência ao milissegundo, o empate vai para quem grava, sem base não se adivinha — e a prova passa pelo `combinar` (o armazenamento que o Worker monta), que tem de encaminhar `criar`, `anexar` e `gravarComFusao` (era por não os encaminhar que a blindagem morava no adaptador e não chegava ao motor) (29 asserções) | não |
| `provar-corrida-da-escrita.js` | **duas gravações no mesmo minuto não perdem um documento**: o mesmo carimbo pedido por dois pedidos, a escrita condicional a ceder o nome (`plano-…-2`), o índice a descrever o ARQUIVO e não a tentativa que perdeu, a edição em sítio a reescrever o MESMO nome, o `422 "sha" wasn't supplied` do GitHub como o «já existe» (e um 422 por outro motivo como erro), e o expurgo a refazer a corrida que perdeu — com a gravação cega ao lado, a perder um, para o defeito medido não voltar (27 asserções) | não |
| `provar-cadeia-do-ajuste.js` | **ajustar o plano de ensino arrasta o PO**: a cadeia do `ajuste_de` e o vigente (o topo), o PO achado por qualquer elo, a referência que segue o topo (e o `planoRetargetado` declarado), o elo do PO criado pelo «Guardar» do plano vinculado — com a fonte, o ciclo e o disparo —, a repetição que não multiplica elos, o plano sem PO que não inventa observação, e a **ponta**: a Aula 01 a ler os 30% do Expressão (34 asserções) | não |
| `provar-apagar-o-ciclo.js` | **apagar o PO leva o ciclo gerado, e só o dele**: a cascata é a mesma rotina da Produção (`apagarCicloDoRepo`), agora ligada ao gesto da listagem — o pacote, o plano, a referência, a notação, o PDF do ciclo, a aula, o lançamento, a captura para impressão, o PDF da aula, o `.conf` da variante e as âncoras `.fipp` saem; **nenhum caminho do ciclo vizinho** aparece na lista de apagados; com o 02 vivo, apagar o 01 é **recusado** com o caminho escrito e **nada** é apagado; sem repositório o envelope sai e a resposta **diz** que o ciclo ficou; e a cadeia inteira do ciclo sai (apagar só o vigente devolvia o elo anterior à lista). O repositório é falso mas inteiro — Contents e Git —, porque em produção o acervo mora nele (33 asserções; 17 falham sem a cascata) | não |
| `provar-linha-de-base.js` | **a linha de base do corpo é uma escolha, e não uma constante**: a anamnese oferece os **30** aspectos e não os quinze fixos, **musicalidade incluída** (o corte anterior era erro meu: o verbete ensina, a anamnese mede), e o bloco 9 — que mistura duas dimensões — prova-o no sentido positivo; os campos que o recorte deixava de fora (joelhos, arco plantar, allegro, escápula, cervical) passam a ser escolhíveis; um id que a anamnese não tem é **recusado** com o nome dele; a agregação conta pela **ordem das opções** (atenção = não estar na primeira), e os pontos de atenção vêm primeiro; as rotas correm com KV falso (criar, atualizar sem duplicar, descartar a leitura quando os campos mudam, apagar); a leitura cruza os trinta em **quatro eixos** (trabalhar / já é bom / musicalidade / comum); o **melhor nível é declarado** e não deduzido da posição (há um campo com a lista invertida); a etiqueta **novo** tem os três estados por proveniência; o envio para a turma grava o vínculo na linha de base e a turma **não** ganha `alunas`; e a **trava dos cinco passos corre em jsdom** — a página é carregada e `mostrarPassoLb` é chamado de fora, o que apanhou dois defeitos que a prova de marcação deixava passar; e a cascata passa a **três passos** — Produção → PE → PO — com o **A/B** que desliga o passo 1 e reprova; a linha de base é sobre **ALUNAS** e não sobre turmas (o painel da anamnese **renderizado** não tem o campo ciclo e o do plano tem; a anamnese guarda `alunas` e não `turma`; o «Gravar» nasce `disabled`; a seta do título declara `data-acordeao`) (63 asserções) | não |
| `provar-indice-do-recorte.js` | **o índice do passo 4 (o recorte), e o do passo 3 que o informa**: o universo é a **anamnese inteira (45)**, e não as linhas que existem — sem ele «nunca escolhido» não existiria; o **ranque** conta recortes e a **cobertura** distingue `todos` de `alguns` (é o «usado parcialmente» da pergunta); o **rascunho** do passo 1 não entra no denominador e o **aplicado** só conta quem foi para uma turma; o **ponto cego** é o cruzamento com a leitura — aspecto em atenção que recorte nenhum olhou —, com o **A/B** que o faz desaparecer quando é escolhido; a **escolha órfã** (id que a anamnese já não declara) vai para `desconhecidos` e não se apaga; **nenhum apelido de aluna** entra no índice, com o controle positivo de que as linhas os têm; duas construções dão o mesmo JSON e o relógio não entra; as **três rotas** (a lista que já existe a trazer o índice sem leitura extra, a rota própria, e `?professor=`/`?turma=` como **escopo** e nunca eixo); e o bloco é **desenhado a correr em jsdom**, não só presente na marcação (24 asserções) | não |
| `provar-relacoes-do-ciclo.js` | **a relação PE → PO imposta no SERVIDOR**: um PO a observar um plano inventado é recusado (409) e **nada é gravado**; o ciclo do PO tem de ser o ciclo do plano (a recusa diz os dois); sem plano declarado, o ciclo tem de ter plano; e um plano novo só abre o **próximo** ciclo da sequência — com a edição e o elo novo isentos, e um `id` inventado **sem** isenção (a porta de serviço). Controlo negativo em cada secção, a degradação (sem leitor do acervo a rota segue, e a recusa não vem da regra) e a simulação (não escreve, não é documento) — 22 asserções; o A/B contra o commit anterior reprova em 12 | não |
| `provar-proposta-da-linha-de-base.js` | **a proposta da listagem é a listagem**, e não um desenho à parte: o construtor monta a página da Produção pelo servidor, carrega-a em jsdom e lê o `innerHTML` de `#lb-lista` depois de `pintarLinhas()` correr — o que se mostra é o que saiu. Mede-se a geometria, não o gosto: a 1240px as três caixas em **três colunas** de mais de 200px e 48px de altura (alvo de toque), a linha do nome numa linha só; a 390px sem transbordo; a 360px e 320px as caixas passam a **uma coluna**; e as caixas **abrem** — o handler é o da página, extraído por marcador, e não uma cópia (16 asserções; requer Chrome) | não |
| `provar-a-moldura-em-todas-as-telas.js` | **a barra e a coluna em 100% das telas**: monta uma publicação de verdade (`montar-publicacao.js --raiz <temp>`) sobre uma árvore que reproduz o defeito — a porta do pacote-zero **com o marcador `<!-- NAV -->`** — e serve 16 telas pela ponte, exigindo barra, coluna e os três formulários em cada uma; o controlo da causa (`aplicar` devolve `null` com o marcador, `enquadrar` enquadra, e a segunda passagem é idêntica); o fragmento sem `<body>` que não ganha moldura inventada; e o menu da escola **sem turma**, com os três formulários e sem «Aulas» (95 asserções; o A/B contra o commit anterior reprova nas duas causas) | não |
| `provar-novo-registo-e-ciclo.js` | **o «Novo registo» da anamnese, o ciclo de cada fonte e a linha a apagar**: o `?novo=` abre o formulário e NÃO volta à lista (a travava de entrada não conhecia o `DUPLICANDO`), o retrato anterior chega preenchido ao campo do nó que o guarda, a anamnese não pede ciclo (nem no texto do cabeçalho, nem na marcação), o ciclo do PO é uma LISTA com os ciclos que têm plano de ensino (o 02 sem plano não aparece) e o do plano continua travado no próximo; e o véu/spinner da linha apagada, medidos no Chrome (24 asserções). O acervo é o verdadeiro: `producao.fetch` com os envelopes no KV falso — um stub incompleto faz o arranque rebentar a meio e dá um verde falso à primeira asserção | **sim** (Chrome) |
| `provar-logo-volta-ao-inicio.js` | a **marca da barra** é um link para a raiz do domínio: o `href` absoluto (e não `index.html`, que é três destinos), o nome acessível, os três consumidores — abertura do pacote, barra do sistema e a ponte —, o slot vazio **e** o preenchido dos pacotes já gerados, e a idempotência (22 asserções) | não |

## Escolas de teste (19/10/2026) — o fixture não mora aqui

Uma escola cujo **nome** traz `Calango`, `Batata` ou `Breu` recebe, nos formulários, os
valores de `teste/<palavra>.json`. O preenchimento é
automático ao abrir a página e **só preenche**: não envia, não grava no KV, não dispara
workflow. O painel do canto permite escolher os outros registros (aluna, turma, rubrica).

O JSON fica em `teste/`, e **não** em `experimentos/`, por uma razão de construção:
o Worker de verdade precisa empacotá-lo (`require` no bundle, como o `catalogo-seed.js`),
e o `experimentos/` não entra em pacotes, hashes ou publicação. Aqui fica só a prova —
`provar-teste.js`.

## Os envelopes no repositório (20/10/2026, fase 3)

Até aqui metade dos registros vivia num sítio e metade noutro: a **anamnese** no repositório
(desde a fase 1) e o **plano** e o **PO** no KV. A fase 3 fecha isso trocando a peça, não o
discurso: `motor/servidor/acervo-envelopes.js` é um **armazenamento** — o mesmo contrato do
adaptador do KV — sobre a família `envelope/`, e a ponte compõe «acervo para os envelopes, KV
para o resto» (`cloudflare.js`, `criarArmazenamento`). O `motor/nucleo/porta.js` não mudou uma
linha para atravessar a mudança, e é esse o teste de que a fronteira está no lugar certo.

O caminho é a chave: `envelope/plano-….json` ↔ `escola/<escola>/envelopes/plano-….json`. A
anamnese vai **cifrada** (metadado em claro, respostas num `_cifrado` com a `SENHA_CRIPTO`); o
plano e o PO vão em claro, porque a fonte que a geração escreve (`ciclo-XX-<escola>-po.md`) já
os leva abertos para o mesmo repositório. O KV antigo fica como **reserva de leitura** — uma
escola anterior a esta fase não perde os registos que ainda não foram regravados —, e a escrita
vai toda para o repositório.

## O índice do acervo (20/10/2026, fase 4)

Cada pergunta sobre o acervo era uma varredura — a árvore do repositório, uma vez por pergunta.
O índice responde uma vez, e é **derivado, determinístico e reconstruível**: nasce dos arquivos e
das âncoras, e apagá-lo e refazê-lo dá o mesmo JSON. A derivação é pura
(`motor/nucleo/indices.js`); quem lê é `motor/servidor/indice-acervo.js`, e o resultado fica em
`indice/*.json` no **KV** — o uso legítimo: derivado, descartável, e cuja perda não perde dado.

A resposta a uma pergunta de proveniência tem sempre a mesma forma — **medida + caminho + elo**
—, e uma pergunta que o índice não responde volta com `recusa` e o motivo: um zero sem essa
declaração lê-se como facto. O que fica de fora (o corpo dos documentos, as marcas, a presença, o
apelido no índice transversal) vem declarado em `nao_indexado`, com o motivo.

## O estado da geração (19/10/2026)

O «Guardar» do PO dispara o `gerar-ciclo.yml`, e a geração leva minutos. Até 19/10/2026 a
tela ficava muda nesse intervalo — «não diz se deu certo, se não deu, se está processando».
Agora o disparo é registado no KV da escola (`bastidores/<escola>/geracao/<variante>`) e a
porta pergunta a `GET /api/geracao`: fase, passo actual, tempo e o link da execução. O
cartão que mostra isso é **injetado pela ponte** (`motor/servidor/geracao-cliente.js`, em
`/assets/geracao.js`), e não escrito em `porta/index.html`, porque a porta é copiada para o
pacote de cada escola e só se refaz numa geração — o aviso chegaria sempre depois do
acontecimento que ele acompanha.

Os `fetch` são falsos e o KV é um mapa: `provar-geracao.js` corre em qualquer máquina, sem
rede, e é ela que o `Auditoria:` dos commits cita.

A `provar-celular.js` é de 17/10/2026 e nasceu de um defeito medido: a lista de turmas do
Produção ficava acavalada no celular — o nome com 116px e os dois botões com 126px fixos. É
geometria, e geometria não aparece num teste de DOM: só o navegador a vê. Ela extrai o `<style>`
do próprio `bastidores.js` (sem cópia) e monta a página de prova com as formas de linha reais.

Sem Chrome, ela **declara a conferência NÃO FEITA** e sai com código 1 — nunca um «passou»
silencioso. Por isso **não** está no `pre-commit`: um commit não pode depender de haver navegador
na máquina de quem commita.

## Medir sem gastar a cota do ar (18/10/2026)

Esta pasta é onde nascem os scripts de medição, e por isso é onde o erro se comete. **Medir no ar
tem custo, e o custo é diário:** o Cloudflare KV limita as operações por conta e por dia, e o
`list()` está entre elas. Em 18/10/2026 a cota acabou — e o sintoma apareceu longe da causa: a
lista de fichas da anamnese ficou **sem o nome das alunas e sem os botões «editar»/«apagar»**,
porque `/api/anamnese-estados` respondia 500. Lia-se como «perdi as fichas». Não se perdeu nada.

**O padrão certo**, e é o que as provas desta pasta já fazem:

```js
// bancada local: servidor stub em porta efêmera, sem tocar no ar
const srv = http.createServer((req, res) => { /* serve porta/, ciclo.css, nav.js, /api/* stub */ });
srv.listen(0, '127.0.0.1', async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;   // ← o navegador vai AQUI
  ...
});
```

- **Ao ar, uma carga por escola, no fim** — a conferência final. Duas escolas, duas cargas.
- **Um 500 diagnostica-se pelo endpoint**, não recarregando a página:
  `curl -s -o /dev/null -w '%{http_code}\n' https://<escola>…/api/anamnese-estados`, e o motivo
  real em `npx wrangler tail --config wrangler.<escola>.jsonc`.
- **O domínio no código não significa requisição.** `provar-producao.js` e
  `provar-contexto-do-ato.js` citam `https://…workers.dev` no `Request`, mas rodam o motor **em
  processo** — sem rede. A única prova que vai ao ar é `provar-ambiente.js`, e é de propósito.

O sintoma que se reconhece em cinco segundos: **«sem apelido» em todas as fichas + nenhum botão de
edição** = 500 nos endpoints de estado, quase sempre cota. Não se «volta o dado» — leitura não
escreve no store.

## Quando um experimento vira produção

1. **Documento de ciclo** (aula, caderno, relatório…): entra nos diretórios do
   professor, é declarado no `DOCS` do manifesto e passa a ser fonte do hash;
2. **Ferramenta**: entra em `tools/`, com commit próprio e motivo declarado
   (`tools/` está congelado — ver `CONGELAMENTO.md`);
3. **Mudança de infraestrutura**: motivo declarado no commit + entrada no
   `REGISTRO.md`;
4. **Ideia que ainda não é para implementar**: vira `IDEIA-*.md` (o porquê) e,
   se tiver desenho, `ARQUITETURA-*.md` (o como) — e o `HANDOFF.md` passa a
   listá-los sozinho.

## Experimentos em curso

**`captura-json`** — o gerador de vistas sob demanda: lê o JSON do ciclo e deriva o caderno, o
relatório e o acompanhamento; e, desde 20/09/2026, também o **guia de observação** e a
**musicalidade**, que derivam das DUAS entradas — o PO e o plano.

Os JSONs de entrada desse experimento **não são escritos à mão**: eles saem dos extratores
(`tools/validar-po-ciclo.js --json`, `tools/validar-plano-ciclo.js --json`), pelo contrato
compartilhado (`tools/lib-extracao-md.js`, `tools/lib-validacao-md.js`). A leitura à mão que
existia antes ficou guardada como REFERÊNCIA, e é com ela que o `diff-classificado.js` (local)
prova que a estrutura extraída **é o que o documento oferece** — sem diferença sem classe.

**E os builders das vistas saíram do formulário** (peça 2 da migração, 20/09/2026): o caderno, o
relatório, o acompanhamento, o guia e a musicalidade agora vivem em **`tools/lib-vistas.js`** —
uma definição só, consumida por este experimento (`<script src="../../tools/lib-vistas.js">`) **e
pelo gerador** (Node). Aqui não há cópia: o formulário chama `Vistas.guia({…})`, `Vistas.caderno({…})`
e `Vistas.helpers.*`. E a igualdade está provada: com o mesmo `prov`, **o guia do Node é idêntico
ao do formulário**; sem `prov` (o caso do gerador), a única diferença é o carimbo — declarado.

A área foi criada em 19/09/2026, junto com a documentação da
ideia de captura em JSON (`IDEIA-CAPTURA.md` e `ARQUITETURA-CAPTURA.md`), para
que a experimentação tenha onde acontecer sem tocar no que está publicado.

**`simulacao-marau`** — o diagnóstico de 23/09/2026: *o JSON está construindo o formulário
corretamente?* A pergunta é do formulário de lançamento, e para respondê-la o experimento faz a
cadeia inteira **sem atalho**: dez blocos elicitados → documentos `.md` → extratores
(`tools/validar-*-ciclo.js`) → `po-01.json` e `plano-01.json` → `tools/templates/lancamento.html`,
rodada em Node. A Elicitação é **inventada** — o "Estúdio Marau" e a professora não existem
(`README-ciclos.md`: a escola "ainda não existe") — e está preservada como matéria-prima em
`00-eliciacao-simulada.md`: é dela que os documentos saem, e refazê-la apagando-a não reproduz o
mesmo resultado. Um experimento inventado responde por um caminho real; o que ele **não** prova é
fidelidade a um ciclo de verdade.

**`pe`** — o piloto do **PE** (Processo de Elicitação), que é a frente mais recente. O ponto de
partida é uma separação: `prompts/elicitar-ciclo.md` carrega **duas camadas juntas** — o **conteúdo**
(blocos, perguntas, forma de saída) e o **mecanismo** (uma pergunta por vez, como persistir, como
ramificar). Pelo `ARQUITETURA-PE.md` §2.2, só a segunda é PE; pelo §2.5, a entrevista de dez blocos
**não é o PE** — é conteúdo de PO que passa a ser **hospedado** pelo recipiente dele. Separar as
camadas é o trabalho, e nada em `prompts/` (congelado) foi tocado: o experimento vive só aqui.

O piloto é a **anamnese** — não o ciclo — por quatro razões: é nova (não tem legado a migrar), já
tem ramificação declarada (os dois módulos condicionais), já tem forma canônica de saída
(`{aluno, traz, precisaDesenvolver}`), e a ficha é o primeiro entregável real. A cadeia roda
inteira, em três motores puros que não saem com `process.exit`:

```
conteudo/anamnese.json          o conteúdo (DADO, não norma; a norma é ARQUITETURA-ANAMNESE.md §3)
   ↓ derivar-plano.js           deriva o plano de ramificação
ramificacao/plano.json          nunca escrito à mão
   ↓ validar.js --contrato plano    mede a instância contra o contrato registrado
   ↓ elicitar.js --respostas r.json  conduz a Elicitação, com validar.js como porteiro
envelope/anamnese-*.json       o envelope, validado contra envelope/elicitacao-schema.json

conteudo/anamnese.json          o mesmo conteúdo, noutra saída
   ↓ ficha/renderizar.js        RENDERIZA — não elicita, não decide
ficha/ficha-anamnese.md         a ficha imprimível que o professor leva ao campo
```

Medido em 01/10/2026: `derivar-plano` dá **1 gatilho · 2 destinos · 3 paradas · 2 divergências ·
1 não-ramifica · 3 lacunas**; `validar --autoteste` passa **22 de 22**; `elicitar --autoteste`
passa **34 de 34**; `renderizar --autoteste` passa **50 de 50** e imprime os **43 nós** com
cobertura integral, deixando as **3 lacunas** como lacuna — uma por ramo do Módulo A. Uma
Elicitação real sai com `estado: em_curso`, a ramificação executada e uma **parada declarada** — o
motor se recusa a inferir o gatilho do Módulo B e diz por quê, em vez de supor. As três lacunas do
plano são exatamente essas paradas declaradas.

**Isto não está integrado, e o experimento não afirma que está.** O contrato de degradação graciosa
(`ARQUITETURA-PE.md` §7.1) tem três casos, e só o **primeiro** está medido: sem `PE_RAIZ`, o fluxo
produz o mesmo de antes e as três âncoras continuam íntegras. O caso do `PE_RAIZ` apontando para
caminho inexistente e o do `PE_RAIZ` válido continuam **declarados, não medidos** — e o segundo e o
terceiro dependem de um arreio no lado de `tools/`, que é congelado e exigiria motivo declarado.
Hoje **nada em `tools/` consulta este diretório**, e `PE_RAIZ` ainda não nasceu no projeto.

As três regras de fronteira do piloto, que valem para o `experimentos/` inteiro: **nada aqui é fonte
de ciclo** (esta área está fora do hash por construção); **nada aqui escreve fora daqui** (o motor
grava em `experimentos/pe/`, e a promoção é decisão, não efeito colateral); e **nada aqui toca
congelado**.
## Nota de 16/10/2026 — as cópias de folha aqui são HISTÓRICAS

`experimentos/receptor-local/bancada/assets/style.css` e
`experimentos/pe/_assets-test/tools/templates/ciclo.css` são **cópias de uma versão anterior** da
fonte de verdade (`tools/templates/ciclo.css`). Elas continuam servindo ao que os experimentos
precisam — abrir a bancada e ver o desenho daquele momento —, mas **não são a identidade vigente**
e não são conferidas pelo `tools/check-identidade.js`, cujo circuito cobre os pacotes de escola e a
raiz.

Quem for revisar a identidade **não deve olhar para estas cópias**: elas divergem de propósito
(registram um estado passado). Se um experimento passar a ser demonstração viva, a folha dele deve
ser **copiada da fonte** no momento em que ele for montado — como o `gerar-ciclo.sh` e o
`gerar-raiz.sh` fazem —, e não versionada à mão.

## 20/10/2026 — `provar-notacao.js`: o registro de notação compõe-se, ou declara

O registro em Benesh saía com `[Preencher: notação do exercício]` em todas as linhas e um glossário
com três convenções. O que faltava era o **alfabeto**, e ele passou a ser dado
(`biblioteca/notacao/`). A prova mede o motor em cinco secções — o alfabeto, a composição, **a
recusa**, o par registro × glossário pelo validador do projeto (`tools/check-glossario.js`), e a
degradação para uma notação sem alfabeto. 55 asserções.

O centro dela é a secção **C**: quatro alfabetos deliberadamente estragados (um exercício sem
verbetes, uma música que o verbete não cobre, um sinal fora do alfabeto, uma cobertura que os
segmentos não somam) têm de cair em **lacuna declarada**, com o motivo escrito. É o que separa um
motor de um gerador plausível.

## 21/10/2026 — `propostas/`: as bancadas de layout, agora operáveis e servidas

Pedidas pela pesquisadora para decidir dois ajustes de identidade visual. A primeira versão foi
**reprovada com razão** — *«não estão operáveis e por isso não dá para entender as propostas»* —, e
as duas causas eram reais:

- **o painel tapava o que demonstrava.** No celular ocupava 230 dos 390 px (59% da tela) e ficava por
  cima do rodapé de paginação que existia para mostrar. Não se avalia um comportamento de tela com
  outra coisa em cima dele;
- **não se chegava a elas do telefone.** Viviam em `file://`, e o que está a ser decidido é o
  comportamento **no celular**. Uma proposta que só abre no computador de quem a escreveu não é uma
  proposta: é um ficheiro.

| Proposta | O que compara |
|:--|:--|
| [`propostas/proposta-titulo.html`](propostas/proposta-titulo.html) | o título que não se perde: hoje, preso no topo, encolhe ao rolar, vai para a coluna «Nesta página», vai para o menu |
| [`propostas/proposta-paginacao.html`](propostas/proposta-paginacao.html) | o rodapé de paginação do lançamento: hoje, vira bloco no fim, compacta com «⋯», esconde ao descer |

**Como se usam.** O painel abre no carregamento e explica as opções com o custo medido ao lado;
**Ver a página** fecha-o; a **aba na margem esquerda** diz qual é a opção activa e chama o painel de
volta. Teclas `0`–`4` trocam de opção; `Esc` fecha o painel.

**No telemóvel:** <https://batata.tmenegaz77.workers.dev/propostas/> — é lá que a decisão se toma,
porque as duas propostas mudam de comportamento com a largura. A publicação é pedida com
`node tools/montar-publicacao.js <escola> --com-propostas`, e a montagem seguinte **sem** a opção
apaga-a: as propostas não entram no `nav.json` e não são um documento da escola.

**Sem dependências.** As páginas são autossuficientes: o `tools/templates/ciclo.css` e o
`tools/templates/nav.js` entram embutidos, e o resultado abre de `file://` e do Worker. O conteúdo é
o real — o cabeçalho e o corpo da Aula 01 publicada, o `<footer>` extraído do `lancamento.html`.
Nada disto é copiado à mão: `construir.js` extrai.

`node experimentos/propostas/construir.js` gera as três páginas; `node experimentos/propostas/medir.js`
abre-as no Chrome, nas duas larguras, e mede **77 coisas** — incluindo a própria moldura (o painel
cabe na tela, tem saída, e a aba não cobre a coluna de leitura).

**A ESCOLHA ESTÁ FEITA (21/10/2026).** O título ficou com a **opção B** (encolhe ao rolar) e a
barra com o **mix da 2 com a 3** (compacta, e esconde ao descer). As duas estão no produto —
`tools/templates/ciclo.css`, `nav.js` e `lancamento.html` —, com prova própria em
`experimentos/provar-titulo-e-barra.js`. Estas páginas ficam como o REGISTO do que foi comparado:
elas reconstroem-se com `construir.js` e declaram `data-titulo-fixo="nao"` para não sofrerem o
mecanismo que agora é do produto.

As propostas **não são prova de nada**: nenhuma afirma o que o produto faz hoje. Quando a escolha
estiver feita, o desenho escolhido vai para `tools/templates/`, com motivo declarado — e aí sim, com
prova.
