# Estado atual — Projeto Ciclo / Sistema Lastro

> **Este documento é a fotografia curada do estado do projeto.** É escrito à mão, atualizado
> pontualmente, e classifica o que afirma. Não é promocional, não é cópia da documentação e
> **não é gerado** — o gerado é o `HANDOFF.md`.
>
> **Última fotografia:** 25/10/2026 (5.ª do dia, após a bancada do acervo com a porta), sobre o commit `3f696c5`.
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

- **`main` em `7182307`**, sem divergência com `origin/main`. **CONFIRMADO**.
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
| Listas no padrão novo (8 listas) | **CONFIRMADO** | `motor/nucleo/lista-html.js` |
| As três listas da Área do Professor **com porta para o formulário** | **CONFIRMADO** 25/10/2026 — botão do topo + destino por linha; 41 provas | `motor/servidor/listas-do-acervo.js` |
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
| `porta/`, `tools/templates/` | a folha e o desenho (peças do catálogo) |
| `experimentos/provar-*.js` | 68 provas executáveis |
| `tools/` | infraestrutura — **congelado** |

## 6. Decisões vigentes

Só o que **não se pode ignorar**. O motivo completo de cada uma está no `REGISTRO.md`.

1. **O módulo de listagem é um só, com ordem fixa: de quem · quem fez · quando.** Muda o rótulo,
   nunca o lugar. Caixinha só onde há painel; onde não há, linha de factos. **DECIDIDO**
   24/10/2026.
2. **Os nomes: «Consulta» (glossário) e Notação dentro da «Área do Professor».** «Planejamento»
   deixou de existir como grupo. **DECIDIDO** 24/10/2026.
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

## 7. Trabalho em andamento

**Objetivo:** gerar a `TRANSFERENCIA-IA.md` sobre a **aula 2..N** — como ela nasce como objeto, com
lugar, marco, herança do plano e alinhamento confirmado com o PO. A fotografia, as etiquetas e a
rotina já estão feitas (commits `607b96a` e `7728389`).

**Ficheiros envolvidos:**

| Ficheiro | O que é |
|:--|:--|
| `ESTADO-ATUAL.md` | este documento — a fotografia curada, **novo** |
| `.github/instructions/estado-atual.instructions.md` | as regras de manutenção, **novo** |
| `.github/skills/fotografia-do-estado/SKILL.md` | a rotina de atualização e de transferência, **novo** |
| `tools/gerar-handoff.sh` | passa a apontar para a fotografia — **congelado**, motivo declarado |
| `.gitignore` | passa a ignorar o `TRANSFERENCIA-IA.md` |

**Último ponto confirmado:** o remoto está em `7182307` e o `HANDOFF.md` estava desatualizado.

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

- **A opção do «acervo com a porta»** (`/propostas/proposta-acervo.html`). **PENDENTE.** A 390px,
  com o painel fechado: A custa 358px e esconde o gesto de criar; B custa 411px e mostra-o; C custa
  466px, mostra-o, e não precisa de peça nova na folha. Medido, não estimado.
- **Duas peças novas na folha**, se a escolha for A ou B: o painel do ato e o conjunto de acções da
  linha. **PENDENTE** — exigem entrada no catálogo de `IDENTIDADE-VISUAL.md` e prova do
  `check-identidade`.

### Dúvidas sobre este próprio protocolo

- **Quem atualiza a fotografia?** Hoje, o agente, quando a mudança é material. Não há automação e
  não foi pedida. **PENDENTE**.

## 9. Validação

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

- **As 68 provas não foram corridas nesta fotografia.** Os resultados da última bateria estão
  registados na sessão de 25/10/2026 (todas verdes), mas **não foram reexecutadas agora**.
  **PENDENTE** de reexecução antes de qualquer alteração ao motor.
- **`node tools/check-identidade.js`** não foi corrido nesta fotografia.
- **A produção não foi percorrida página a página** — só os 10 caminhos da §2.

## 10. Próximos passos

Ações imediatas, sem transformar hipótese em compromisso:

1. **Correr a bateria de provas** antes de tocar no motor — a última execução é de ontem, não de
   agora.
2. **Obter as seis respostas da §8** para destravar a frente da aula 2..N.
3. **Separar semanticamente plano × PO × aula** — a análise está feita; a implementação, não.
4. **Automatizar a regeneração do `HANDOFF.md`** no push, se se confirmar que é útil.

## 11. Histórico recente

Alterações materiais desde a fotografia anterior (não existia; a referência é o `REGISTRO.md`):

- **25/10/2026** — **a proposta do «acervo com a porta»**: três opções medidas na bancada para levar o
  contexto do ato e as acções de começar para dentro da listagem, e reduzir duas páginas a uma.
  Nada de produto alterado. **PENDENTE**: a escolha da opção.
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
