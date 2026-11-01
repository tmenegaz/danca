# Estado atual — Projeto Ciclo / Sistema Lastro

> **Este documento é a fotografia curada do estado do projeto.** É escrito à mão, atualizado
> pontualmente, e classifica o que afirma. Não é promocional, não é cópia da documentação e
> **não é gerado** — o gerado é o `HANDOFF.md`.
>
> **Última fotografia:** 01/11/2026 (base local `35aad32`). Nesta entrega: o **verbete** ganhou posição, direção e lado (`8df6c0c`), é **administrável na Produção** (`3dcc344`), e os três defeitos do primeiro dia foram corrigidos (`6318ded`); o **vocabulário vive no repositório** (`4e09bc9`); o formulário ganhou **dois modos**, **direção derivada** e **editor de célula** (`4f4795a`); a **célula foi explicada** (`4342f16`); a célula tem **dois eixos** — direção (3) e orientação (5), alfabeto **versão 6** — com o trecho **em pílulas** (`4994b34`, `9b318fe`), corrigidas ao primeiro uso a sério (`5af8aff`); «**o que acontece**» recebe a **definição do exercício** (`7be42cb`), que passou a ser a do **dicionário dela** em **93 termos com `fonte`** (`48f43e2`), com o «**lê-se**» na segunda linha do campo e a **quarta coluna fora** da tabela (`b641acc`); e o formulário passou a **seis passos, um de cada vez**, com o trecho **editável** (`d7e71ff`) — a arrumação está **decidida** (os passos), e a tira que os mostra reusa a peça da faixa da turma. Depois disso, a **frase passou a ser do exercício** — escrita uma vez no passo 2, com o sétimo passo a mostrar o que fica escrito em cada trecho —, a **secção dos verbetes ficou numa coluna** com a listagem abaixo e etiquetas por verbete, e o vocabulário ganhou a família do tendu (dégagé, glissé, tendu jeté, jeté) em **59 termos com descrição**. E o plano passou a dizer **de que turma vêm os parâmetros** e a **acusar o conteúdo associado que já não existe** no vocabulário, em vez de o esconder. Da Fase 1 falta só as **seleções no plano** (§1.6) — e a primeira delas já está feita: os **tempos e o compasso** deixaram de ser perguntados no plano e passaram a vir do verbete. E os **números do roteiro** passaram a ser **um só** nos três documentos — o título, o roteiro e a barra contavam coisas diferentes, e no plano 18 dos 19 degraus tinham dois números —, e a «Sequência de exercícios por bloco» passou a **demonstrativo** (bloco e objetivo específico travados). E o formulário do verbete voltou ao **padrão** da casa — à esquerda, com a listagem à direita —, com a **tira dos passos fora do `<form>`** e **cinco passos** em vez de sete (o exercício, a frase e a posição juntos no 1). E o bloco 10 do plano deixou de pedir o que já estava respondido: a **música sobe da sequência** (que a lê do verbete) acima de um campo que passou a pedir **só o link do vídeo**, o **repertório** passou a **somente leitura** (é a sequência, semeada), a **sequência semeia-se sozinha** a cada pintura do roteiro — antes perdia-se inteira se o nó não fosse aberto —, e o **`;` passou a separar os itens** do PO, que era o que fazia dois critérios numa coluna da folha. E a **janela passou a ser vista por todas as bandas**: a §5 da aula deixou de ser escrita à mão e passou a derivar do PO, a folha e o formulário desenham **8 critérios** em vez de 4, e a fonte da aula passou a ser **reproduzível pelo código, byte a byte**.
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
| O alfabeto da notação na Produção — cinco passos, frase por exercício, trecho editável | **CONFIRMADO** 01/11/2026 na bancada local (115 asserções): o formulário percorre-se do passo 1 ao 5, um painel visível de cada vez, a tira fica fora do `<form>` e sai no modo do exercício, a frase escreve-se uma vez e entra em todos os trechos, e um trecho gravado abre em edição no passo 3 com os valores dele. **A conferência na página publicada fica para o deploy.** | `motor/servidor/bastidores.js`, `motor/servidor/verbete.js` |
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

## 7. Trabalho em andamento

Há **dois** trabalhos em andamento. O primeiro é de código e é a **Fase 1** do plano
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
mais cliques, ele é mais fácil de entender» —, e o formulário passou a **seis passos, um de cada vez**,
com o trecho **editável** (`d7e71ff`). A **arrumação** também já não está em aberto: a 01/11/2026 ela pediu o contrário do
que se tinha feito a 31/10 — **o formulário volta ao padrão** (à esquerda, com a listagem presa à
direita) e a **tira dos passos sai para fora do `<form>`**, modelo da turma. Com a tira fora, os sete
passos ficaram **cinco**: o exercício, a frase e a posição são um só (`b0d781f`), e o alfabeto ganhou
**três verbetes de ensaio** (Grand battement, Arabesque, Rond de jambe à terre) para ela poder testar
sem escrever do zero — **versão 9**, selo renovado.

O segundo trabalho **não é de
código**: **o plano da Batata vai ser refeito no formulário pela
pesquisadora**, porque o envelope mais recente (`plano-20261027-1131.json`) perdeu os exercícios de
**Arabesque** e **Jeté** — 14 linhas contra as 30 do envelope em uso. Os documentos publicados ficam
sobre o `plano-20261027-1025.json` até essa reposição; regerar a partir do 1131 apagaria exercícios
de uma página publicada e deixaria o «Parâmetro de medição» a citá-los. Ela anunciou também que vai
**expurgar a escola Batata e criar uma escola nova** — o que torna definitivamente obsoleto o
vocabulário que ainda esteja no KV daquela escola (já ninguém o lê).

**O que ficou feito a 01/11/2026 (`ac6caa0`), e o que é o próximo passo.** O **P0** da revisão das
janelas deslizantes está fechado: o `;` separa os itens do PO, e os dois critérios que caíam numa
coluna são duas. O **bloco 10** do plano deixou de perguntar o que já estava respondido (a música e o
repertório), e a sequência passou a semear-se sozinha. O que falta é o **P1 — a ligação
bloco ↔ dimensão por id**: ela decidiu que `objetivosEspecificos[].blocos` (`Solo · Barra`) e as
dimensões do PO (`Técnica — Solo`) são **a mesma coisa com dois nomes**, e que a ligação é **por id**.
O recorte **já existe** no plano; o trabalho é **ligá-lo** e fazê-lo chegar ao formulário — e é
**ligação**, não invenção. O plano por fases está na resposta desta sessão e no `TRANSFERENCIA-IA.md`.

**Último ponto confirmado:** 01/11/2026 — `ac6caa0` (o que a sequência já responde não se escreve outra
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
| **tempos e compasso dos 27** | **RESOLVIDO na origem** (`885ea96`) — vêm do **verbete** de cada exercício e não se perguntam no plano. O que continua por fazer é **preencher os verbetes** dos exercícios que ainda não os declaram: a lacuna mudou de lugar, e agora está onde o dado se decide |
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

### Executado nesta fotografia (01/11/2026 — a janela por todas as bandas)

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
