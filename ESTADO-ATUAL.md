# Estado atual — Projeto Ciclo / Sistema Lastro

> **Este documento é a fotografia curada do estado do projeto.** É escrito à mão, atualizado
> pontualmente, e classifica o que afirma. Não é promocional, não é cópia da documentação e
> **não é gerado** — o gerado é o `HANDOFF.md`.
>
> **Última fotografia:** 31/10/2026 (base local `612c49b`). Nesta entrega: o **verbete** ganhou posição, direção e lado (`8df6c0c`), passou a ser **administrável na Produção** (`3dcc344`) e os três defeitos do primeiro dia foram corrigidos (`6318ded`); o **vocabulário passou a viver no repositório** (`4e09bc9`); o formulário ganhou **dois modos**, **direção derivada** e **editor de célula** (`4f4795a`); a **célula foi explicada** (`4342f16`); a célula passou a ter **dois eixos** — direção (3) e orientação (5), alfabeto **versão 5** — com o trecho **em pílulas** (`4994b34`, `9b318fe`); as pílulas foram corrigidas ao primeiro uso a sério (**escolha única**, **«en face» marcada**, **contagem corrida**, `5af8aff`); e «**o que acontece**» passou a receber a **definição do exercício** do vocabulário, com o «**lê-se**» abaixo do campo (`7be42cb`) — depois de a pesquisadora ter gravado o primeiro verbete real e o campo, vazio, ter recebido o nome do exercício (`73f5330`, alfabeto **versão 6**). Da Fase 1 falta só as **seleções no plano** (§1.6).
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
- **12 professores** em `professores/`, **4 ciclos com manifesto**. **CONFIRMADO** (contagem do
  `gerar-handoff.sh`).
- **17 regras** em `REGRAS.md` e **22 pétreas** em `PROTOCOLO.md`. **CONFIRMADO** (contagem).
- **O motor tem 52 ficheiros versionados, 26.311 linhas** entre `motor/nucleo/` e
  `motor/servidor/`. **CONFIRMADO**.
- **31 rotas** registadas em `motor/servidor/rotas.js`. **CONFIRMADO**.
- **68 provas versionadas** em `experimentos/provar-*.js`. **CONFIRMADO**.
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
| Aulas: leitura em prosa e Notação Benesh | **CONFIRMADO em produção** em 27/10/2026 — o nome abre a prosa, «Abrir notação» fica ao lado da Aula 01, e o Glossário está no cabeçalho persistente da Notação, em nova aba. A rota `/aulas/` respondeu 200 e continha os dois destinos; as provas locais confirmaram a montagem e a remoção das listas independentes. | `tools/gerar-aula-prosa.js`, `tools/montar-publicacao.js`, `motor/nucleo/nav.js` |
| Aula 01: Guia preenchido com os itens do PO, Notação com a estrutura da Aula e PDF individual | **CONFIRMADO no pacote e implantado**: commit `8b939d0` em `origin/main`; run #287 e job Batata com sucesso. A conferência ao vivo limitou-se à raiz (HTTP 200, com link para `/aulas/`); a rota específica não foi carregada após este deploy. | `professores/perna-boa/ciclos/ciclo-01-batata-bale-nivel-1-teste-2-aula-01.md`, `tools/gerar-aula-prosa.js`, `tools/gerar-ciclo.sh`, `tools/montar-publicacao.js` |
| As três listas da Área do Professor **com o contexto do ato dentro da listagem** | **CONFIRMADO** 25/10/2026 — painel com a caixinha do «Turma» e a seta, a regra dos três botões executada, o contexto guardado, o aviso da senha errada; 43 verificações no browser | `motor/servidor/listas-do-acervo.js` |
| As três listas do acervo pela ponte | **CONFIRMADO** | `motor/servidor/listas-do-acervo.js` |
| Anamnese: formulário, vínculo, ajuste | **CONFIRMADO** | `rotas.js` (11 rotas `/api/anamnese*`) |
| Plano de ensino: formulário e vínculo | **CONFIRMADO** | `rotas.js` (`/api/planos`, `/api/plano-*`) |
| PO: derivação e documento | **CONFIRMADO** | `motor/nucleo/derivar-po.js` |
| Lançamento da aula | **CONFIRMADO** | `motor/nucleo/lancamento.js` |
| Bastidores (Produção) com menu próprio | **CONFIRMADO** | `motor/servidor/{producao,bastidores}.js` |
| Criar escola / expurgar escola | **CONFIRMADO** | `provisionar-escola.js`, `expurgar-escola.js` |
| Índice de envelopes com resumo invalidável | **CONFIRMADO** | `motor/nucleo/porta.js` (`VERSAO_DO_RESUMO = 4`) |
| Âncora e cadeia de proveniência | **CONFIRMADO** | `tools/hash-ciclo.sh` |

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
| `motor/servidor/rotas.js` | as 31 rotas do Worker |
| `motor/servidor/verbete.js` | o alfabeto da notação no **repositório** (CRUD, com proveniência) |
| `motor/servidor/termo-repo.js` | o vocabulário técnico no **repositório** — a única lista de termos |
| `porta/`, `tools/templates/` | a folha e o desenho (peças do catálogo) |
| `experimentos/provar-*.js` | 68 provas executáveis |
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

## 7. Trabalho em andamento

Há **dois** trabalhos em andamento. O primeiro é de código e é a **Fase 1** do plano
(`PLANO-VERBETE-E-MUSICALIDADE.md`): o alfabeto mudou de casa e a âncora sela com que código
escreveu; o verbete ganhou posição, direção e lado; o CRUD está na Produção; o exercício é escolhido
de uma lista e o «+» cria-o no vocabulário do repositório; o formulário tem **dois modos** e a
**direção é derivada** da célula; e o **editor de célula** já cria a decomposição que faltava — sem
ele, «Gravar verbete» recusava criar o que não existisse (eram 55 exercícios para 4 verbetes). Falta
as **seleções no plano** (§1.6). O **bloco por pílulas** deixou de faltar: desde `9b318fe` não há
nenhuma lista suspensa no trecho, e a notação compõe-se de cliques. O segundo trabalho **não é de
código**: **o plano da Batata vai ser refeito no formulário pela
pesquisadora**, porque o envelope mais recente (`plano-20261027-1131.json`) perdeu os exercícios de
**Arabesque** e **Jeté** — 14 linhas contra as 30 do envelope em uso. Os documentos publicados ficam
sobre o `plano-20261027-1025.json` até essa reposição; regerar a partir do 1131 apagaria exercícios
de uma página publicada e deixaria o «Parâmetro de medição» a citá-los. Ela anunciou também que vai
**expurgar a escola Batata e criar uma escola nova** — o que torna definitivamente obsoleto o
vocabulário que ainda esteja no KV daquela escola (já ninguém o lê).

**Último ponto confirmado:** 28/10/2026 — `4342f16` (a célula explicada: contagem calculada, sinais
compostos, dicionário do que acontece) e `6c6ce28` (o registo) no `main` local. A base anterior:
`9fb09dc` (a folha, com motivo declarado), `4f4795a`
(os dois modos, a direção derivada e o editor de célula) e `7a931da` (o registo) no `main` local. A
base em `origin/main` é `52a05d6`, com os workflows concluídos; o `GET /api/bastidores/termos` ao ar
responde **200** com **87 termos**, 12 deles com `membro` — campos que só existem no bundle atual, e
que provam que o vocabulário servido é o do repositório.

## 8. Pendências e dúvidas

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

### A métrica da aula — o que falta declarar

A grade de exercícios mostra compasso e contagem, mas **só 1 dos 30 exercícios** os tem (o Plié do
solo), porque o plano os declarou em apenas **3 linhas**. As outras 27 saem em lacuna declarada. Não
é defeito do gerador: o plano só contribui com `Tempos` e `Compasso`, e o resto vem do verbete.

| Nome | Estado |
|:--|:--|
| **port de bras** | **DECIDIDO** — são **18 tempos, 3/4**. O verbete cobre **12** (4 compassos); os **2 últimos** saem em `conferir`. **PENDENTE** de verbete |
| **braço do port de bras** | **HIPÓTESE** — nos compassos 1 a 3 são **os dois braços juntos** («os braços abrem», plural); o compasso 4 é que separa a condução (D → E). O vocabulário de lados `D`/`E` **existe** em `ballet-classico.json` e não é usado. Acrescentar a coluna de lado resolve a pergunta «qual braço?». **PENDENTE de decisão** |
| **tendu ao lado** | **CONFIRMADO** — o Battement tendu vai à frente e depois atrás porque **o verbete é assim**: `1ª → +` e `1ª → ×`. Não há `→ lado` no verbete. Pedir o tendu ao lado é pedir verbete novo, não mudar o plano |
| **tempos e compasso dos 27** | **PENDENTE** — é preenchimento, do lado do plano. É a maior lacuna da aula |
| **bloco de musicalidade** | **PENDENTE** — ver abaixo |

### O bloco de musicalidade não tem pergunta

A linha que a Aula 01 mostra — `| Pulso | [Preencher: trabalho de pulso da Aula 01] |` — está
**escrita à mão** em `motor/nucleo/derivar-ciclo.js`. «Pulso» não é escolha do professor e «Trabalho»
nunca foi perguntado. **CONFIRMADO** por leitura: não há nó no formulário do plano que peça a
musicalidade, embora a ajuda do formulário prometa o contrário («A musicalidade não entra aqui: ela
tem o bloco dela»); e `Vistas.musicalidade` (em `tools/lib-vistas.js`), que a derivaria do PO e do
volume do plano, **nunca foi ligada a esta variante** — não existe `-musicalidade.md` para a Batata.

**DECIDIDO** que a solução se decide numa bancada antes de tocar em fonte. A bancada existe —
`experimentos/propostas/proposta-musicalidade.html`, **local e não versionada** (`experimentos/propostas/*`
está no `.gitignore`) — e propõe: a legenda de **compasso e contagem** dita uma vez no topo da grade;
os tempos por exercício à vista, para a aritmética ficar legível (8 tempos em 4/4 = 2 compassos);
a coluna de **lado** no port de bras; e o bloco de musicalidade em **três colunas** (Item · Trabalho ·
onde se ouve na métrica declarada), com uma pergunta por item no plano. **PENDENTE de aprovação** — e
metade dela (a coluna «Trabalho») **só se resolve com um nó novo no formulário do plano** (`porta/`).

### Pendências de infraestrutura — de datas anteriores

- **Coluna única nos Bastidores:** fundir as secções `#hash` no `nav.json`. **PENDENTE**.
- **Comentário com `<h1>` literal** dentro de `tools/templates/lancamento.html`. **PENDENTE**.
- **11 provas não versionadas** que dependem de fixtures perdidas com a escola `calango`.
  **PENDENTE**.
- **O resumo do terminal do `gerar-handoff.sh` mente.** A linha final imprime
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

### Executado nesta fotografia (28/10/2026 — a célula explicada)

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
| `node experimentos/provar-celula.js` | **82 asserções**, 0 falhas — 3 direções e 5 orientações, caixas `radio`, três cliques em três direções deixam **uma** marcada, «en face» marca, nenhuma lista suspensa, três cliques = três sinais, sinal repetido, direção e orientação persistentes, `orientacao` no corpo gravado, e um en croix inteiro com o compasso corrido (`1\|1`, `1\|2`, `2\|1`) |
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

Nenhuma ação de publicação desta entrega está pendente. A rota `/aulas/` não foi carregada após o
deploy; não foi feita outra requisição à produção para respeitar o limite de uma conferência.

## 11. Histórico recente

Alterações materiais desde a fotografia anterior (não existia; a referência é o `REGISTRO.md`):

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

- **A produção não foi percorrida página a página após a reorganização de Aula/Notação.** O deploy
  da Aula 01 foi confirmado no workflow e a raiz respondeu HTTP 200, mas a rota `/aulas/` não foi
  carregada após este deploy; as demais páginas também não foram verificadas ao vivo.
- **Não sei a distribuição real de uso em produção.** Não há telemetria; o que sei é o que os
  `curl` devolvem.
- **Não sei se o `TRANSFERENCIA-IA.md` serve o seu caso de uso.** Foi desenhado a partir de uma
  descrição, não de uma tentativa real de o anexar a outro assistente.
- **Não sei se as perguntas abertas da §8 foram decididas fora do repositório.** A §8 regista o que
  a pesquisadora respondeu em 25/10/2026, em duas rondas. Continua **sem resposta** apenas
  `alinhamento` (a frequência do passo de confirmação com o PO), e **sem decisão** a possibilidade de
  referências bibliográficas por aula — levantada de passagem, não pedida.
- **Não verifiquei as 11 provas não versionadas** — não sei se ainda são recuperáveis.
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
