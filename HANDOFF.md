# Handoff — Projeto Ciclo

Gerado em: `2026-10-11T20:18:45-0300`
Commit atual: `11697f3` — feat(entrega): a página de entrada «Nós, Por Exemplo» e a correção socrática (F5) entram no pacote
Para: sessão nova (retomar o diálogo)

## O que é este projeto

**A memória da aula dada** — cada aula é **planejada** antes de ser dada: o plano
(`aula-NN.md`, fonte da âncora) fixa objetivo, marcos e volume, e é ele que dá a
**linha de base**. O que se registra é o processo de ensino-aprendizagem que de fato
se aplicou — **o que mudou em relação ao plano** — e encadeia tudo o que muda.

- **Planejar e registrar são coisas distintas — e as duas acontecem.** O plano é
  **intenção** (editável enquanto a aula está `planejada`); depois que a aula acontece,
  o registro passa a **fato** e só se acrescenta ajuste (`ARQUITETURA-AULA.md`). O
  estado é **derivado** do cronograma, do prazo e do registro — não existe campo
  "aula dada". O formulário de lançamento **consome o plano** como
  entrada: sem ele não há marco da aula nem "o que mudou em relação ao plano".

- **Não é o projeto de mestrado** (outro diretório, de onde vêm o PO e o FIPP).
- **Não implementa o FIPP**: o `.fipp` daqui é uma **âncora de proveniência
  encadeada** (`tools/hash-ciclo.sh`), aproximação do framework — não ele.
- **PROTÓTIPO, testado no universo da dança** — este projeto **não é agnóstico**; o
  projeto agnóstico será criado a partir dele. Nenhum ciclo é igual a outro, nenhuma
  aula é igual a outra — nem com o mesmo professor.
- **Não avalia** — registra o cotidiano do professor; a avaliação é fronteira de
  outro módulo, ainda não desenhado.
- **Proveniência acrescenta, não edita**: um ajuste é um elo novo, nunca sobrescrita.
- **A integração ainda não existe** — com o projeto das secretarias não foram
  desenhadas nem a fronteira de entrada nem a de saída.

## Estado do projeto

- **Regras:** 17 em `REGRAS.md`
  + **22 pétreas** em `PROTOCOLO.md`
- **Professores:** fokini
fokini2 (2)
- **Ciclos com manifesto:** 2 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-ANAMNESE.md`** — Desenho da malha de anamnese de balé clássico como **conteúdo do PO** — a **observação inicial** dos seis elementos basilares, os **nove blocos fixos** da ficha, os **dois módulos condicionais** (validação de nível prévio e contexto de origem) e as **três dimensões** da linha de base (Técnica, Funcional, Musicalidade) —, seguida da **malha de domínios declarados** (alinhamento ósseo, flexibilidade passiva, força ativa e potência, sistema vestibular, orientação espacial e lateralidade), com **ramificação condicional** pelo nível declarado (Básico, Intermediário, Avançado) e **soberania de CRUD autoral** do professor, fechando na **conclusão** — o campo **«Resultado da avaliação»** (apta/não apta + nível, sem turma/horário/frequência) — o **recipiente** é do PE, o **conteúdo** é do PO.
- **`ARQUITETURA-AULA.md`** — o ciclo de vida da aula (planejada → dada → lançada, mais a **não dada**), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por aula. O **estado derivado** (`B6`) e o **ajuste no plano** (`B8`) estão implementados; o resto, não.
- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto.
- **`ARQUITETURA-PE.md`** — Especificação da arquitetura de integração entre o repositório atual (implementação do PO) e o repositório separado **"dança e elicitação"** (módulo PE), utilizando descoberta por variável de ambiente (`.env`) e degradação graciosa.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — o Bastidores é o ambiente da direção da escola: um grupo de menu com duas vistas — o Estúdio de Dança (que a direção partilha com o professor) e a Produção (só da direção) —, regido pelo princípio cena × bastidores, pela regra da reverberação (o que a escola declara desce para os documentos da cena) e pela proveniência própria da escola. Não implementado.

## Últimos commits

```
11697f3 feat(entrega): a página de entrada «Nós, Por Exemplo» e a correção socrática (F5) entram no pacote
7eca71a feat(tools): a página de entrada vira «Nós, Por Exemplo», e o menu perde a marca e o «Início»
7f074ec feat(tools): o menu separa a Anamnese do Plano de Observação
9057c1a feat(po): a porta fala a língua do professor e a navegação vira PO → plano
95db237 feat(estrutura): a escola diaghilev2 nasce do zero (teste de elicitação)
f36358c feat(po): a porta passa a elicitar o plano — o ciclo do zero nasce com plano + PO
73ce703 feat(tools): criar-escola.sh — a criação de uma escola nova vira um comando
3bfc203 refactor(estrutura): a porta passa a usar os assets compartilhados da raiz do pacote
bb6bf31 feat(tools): a porta do Plano de Observação ganha a navegação do site e o comportamento de saída
0f91c6a chore(tools): as escolas de teste ficam fora da conferência de senha do pre-push
4161963 feat(estrutura): o motor agnóstico e a porta saem do experimento para produção
c714b48 feat(tools): o menu da Área do Professor ganha o acesso ao Plano de Observação
ede14d7 chore(estrutura): o .env e o .dev.vars ficam fora do Git
8d3da1e refactor(estrutura): o prompt instalar-ciclo vira skill em .github/skills/
ba7379b docs(registro): regenera o HANDOFF sobre 9f8a96e
9f8a96e feat(prompts): a elicitação herda oito decisões do formulário do experimento
d94b991 feat(experimentos): o Worker ganha o cofre da anamnese — com leitura por GET
0b81ab1 docs(registro): regenera o HANDOFF sobre c64fe95
c64fe95 feat(tools): a espiral dos criadores ganha injetor próprio, e o registro conta a rodada
55d332d docs(apresentacao-01-rizoma): o deck passa de 72 para 87 slides e o mapa anda para o slide 83
```

## Por professor

### fokini — 1 ciclo(s)

**Ciclo 01** — variante(s): diaghilev

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Diaghilev | ciclo-01-diaghilev-po.md | Input_PO_Aguardando | 3 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| diaghilev | ciclo-01-diaghilev.fipp | `37193a381dc5` | (vazio) | Input_PO_Aguardando |

### fokini2 — 1 ciclo(s)

**Ciclo 02** — variante(s): diaghilev2

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| diaghilev2 | (sem PO) | — | — |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| diaghilev2 | ciclo-02-diaghilev2.fipp | `af1ec11e18a2` | (vazio) | — |

## Pétreas (`PROTOCOLO.md`)

- **P-01 — O ciclo é PO latente.
- **P-02 — O PO declarado de um ciclo vem do ciclo anterior.
- **P-03 — FIPP alinha; Git ramifica.
- **P-04 — Hash SHA-256 sobre fontes, versionado.
- **P-05 — O ciclo produz material, não evidência.
- **P-06 — O caderno de ciclo é descritivo, não analítico.
- **P-07 — Nenhuma classificação tácito/arquivo sem as quatro condições.
- **P-08 — Os campos do ciclo são declarados em schema.
- **P-09 — Um caderno por ciclo, por escola.
- **P-10 — O PO declara a linha de base dos sujeitos.
- **P-11 — O PO declara as condições de contorno da execução.
- **P-12 — Os sujeitos são referidos por apelidos estáveis.
- **P-13 — Cada professor tem o seu próprio PO.
- **P-14 — O PO pode derivar de um PO de departamento.
- **P-15 — A notação segue a metodologia declarada.
- **P-16 — Metodologia e notação são declaradas na Elicitação.
- **P-17 — Todo ciclo produz os mesmos tipos de artefato do ciclo piloto.
- **P-18 — A metodologia pode ser imposta pela escola.
- **P-19 — Os prompts do projeto vivem no repositório.
- **P-20 — Problemas semelhantes recebem soluções semelhantes.
- **P-21 — Documentos publicados usam linguagem harmonizada.
- **P-22 — As condições materiais de execução são declaradas, registradas e comunicadas.

## Regras (`REGRAS.md`)

- **1. Terminologia RAD**
- **2. Fio condutor**
- **3. Estrutura espacial**
- **4. Condições preliminares**
- **5. Carga e volume**
- **6. Métrica musical**
- **7. Causa e consequência**
- **8. Proveniência objetiva**
- **9. Distribuição de volume**
- **10. Estrutura de ciclos (com calendário)**
- **11. Pensamento sistêmico**
- **12. Observação pedagógica**
- **13. Apanhado histórico**
- **14. Viés de agenciamento**
- **15. Musicalidade**
- **16. Formato de entrega**
- **17. Versionamento com Git**

## Última entrada do REGISTRO

## 11/10/2026 — Atalhos da porta na página de entrada e aprofundamento do «Como se usa»

**O que motivou.** A página de entrada «Nós, Por Exemplo» tinha dois problemas de leitura: o
bloco «Como se usa, passo a passo» era abstrato (o professor não sabia **onde clicar** nem o que
ia encontrar), e os blocos de abertura traziam redação ainda não finalizada («coisa», a régua
das alunas, menção a protocolos ainda por construir).

**O que foi decidido.**

- **«O que é este sistema» reescrito** em três parágrafos (o que faz → o que permite → o que faz
  com o conhecimento), com a distinção repertório × arquivo, sem «coisa», sem jargão.
- **A passagem da «régua alta» corrigida:** a régua é do **serviço prestado** (dedicação, cuidado,
  o que a escola oferece), não das alunas. «A dança é para todas» ficou explícito. Saíram
  «régua», «qualidade» e «métrica».
- **«Como se usa, passo a passo» aprofundado:** passos numerados (Passo 1 a 4), contexto do que é
  um **ciclo** (nasce do Plano de Observação; dentro dele há aulas; cada aula tem seu registro), a
  lista do que mais existe na Área do Professor (caderno, captura, critérios, método, guia) e a
  nota de que a página é o mapa e o detalhe está dentro de cada formulário.
- **Dois atalhos com link** para a porta — «Anamnese do aluno» e «Plano de Observação» — com as
  URLs carregando os slugs do ciclo. Como o pandoc **não interpola variáveis no corpo** do
  documento, a página usa os marcadores `@ANAMNESE_URL@` e `@PO_URL@`, trocados pelo gerador
  **só no `index`**.

**Onde entrou.** `biblioteca/nos-por-exemplo.md` — os três blocos reescritos/aprofundados e os
dois marcadores de link. `tools/gerar-ciclo.sh` — a substituição `@ANAMNESE_URL@`/`@PO_URL@`
após o pandoc do `index`. `tools/criar-escola.sh` — a mesma substituição no índice do pacote
"zero" (que também renderiza `nos-por-exemplo.md`), com URL relativa à pasta do pacote.

**Motivo declarado — os congelados.** `CONGELAMENTO.md` congela `tools/`. O motivo: os dois
atalhos da página de entrada precisam levar o contexto do ciclo (`professor`, `escola`, `ciclo`)
na URL da porta, e esse contexto só existe no gerador — não dá para gravar slugs fixos na página
compartilhada (cada pacote tem o seu). **O que não muda:**

- **A fórmula do hash e a cobertura.** Não mudou; a página de entrada vive em `biblioteca/`, que
  o hasher já exclui, e nenhuma fonte de ciclo foi alterada. A âncora **não** foi regerada (o
  `--check` confirma a cadeia íntegra com o mesmo hash de antes).
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhuma mudou.
- **Os validadores.** Nenhum mudou; o `check-pacote` continua passando com 0 erros.

**Com o quê.** `biblioteca/nos-por-exemplo.md`, `tools/gerar-ciclo.sh`,
`tools/criar-escola.sh`, e o pacote `professores/fokini/ciclos/ciclo-01-diaghilev/` regenerado.

**Referências.** `CONGELAMENTO.md` (`tools/`) · a entrada de 11/10/2026 (o `index` →
«Nós, Por Exemplo») · o pedido «Ajustes finais na página» e o pedido «Aprofundar o bloco
«Como se usa, passo a passo»».

**O que ainda não está feito.**

- **O pacote `fokini2/02/diaghilev2` está com o `index.html` defasado** (ainda mostra o «cartão de
  visita» antigo, não a página «Nós, Por Exemplo»). É anterior a este marco — o `criar-escola.sh`
  já renderiza `nos-por-exemplo.md`, mas o pacote não foi regerado. Regerar exige rodar o
  `criar-escola.sh` (que cria uma escola nova), e não o `gerar-ciclo.sh` (que falha com `DOCS=""`).
- **Nada foi commitado** deste marco (aguardando validação da pesquisadora).

## O que está pendente

## 09/10/2026 — A criação de escola vira um comando: o CLI de scaffolding, e a porta deixa de nascer com escola fixa

A lacuna do ciclo vazio: `tools/gerar-ciclo.sh` exige `DOCS`
não-vazio (`: "${DOCS:?}"`), então a geração disparada pela conclusão do PO vai parar pedindo um
documento. Decidir, na etapa seguinte: (a) o PO elicitado gera um esboço de plano como primeiro
`DOCS`, ou (b) o gerador passa a aceitar `DOCS=""`. A escola `diaghilev2` ainda não foi **ancorada**
(`tools/hash-ciclo.sh fokini2 02 diaghilev2`) — é o primeiro ciclo do professor, sem `parentHash`.

## 09/10/2026 — A porta passa a elicitar o PLANO, e o ciclo do zero passa a nascer com plano + PO

O commit da escola `diaghilev2` **vazia** (antes de qualquer
elicitação) segue bloqueado pelo `pre-commit`, que tenta gerar o pacote de um ciclo sem `DOCS` — o
estado "zero" que o gerador ainda não reconhece. Decidir, na próxima etapa: (a) o `pre-commit` pula
ciclos com `DOCS` vazio (o estado legítimo de uma escola recém-criada), ou (b) a geração aceita
`DOCS=""`. O teste de ponta a ponta (elicitar plano → `-plano.md` + `DOCS="plano"` → elicitar PO →
geração) ainda não foi exercido contra o GitHub real.

## 10/10/2026 — O menu separa a Anamnese do Plano de Observação, e a navegação da porta muda de modelo

O **pacote ainda não foi regerado** — a mudança do menu só aparece
nos HTML após `tools/gerar-ciclo.sh <professor> <ciclo> <escola>`. O estado ativo do item
(«Plano de Observação» ativo vs «Anamnese do aluno» ativo) continua **único** na porta: a nav é
gerada uma vez (`atual=plano-observacao`) e não distingue `?fonte=` — a marcação de «ativo» por
fonte fica em aberto.

## 11/10/2026 — «Nós, Por Exemplo» vira a página de entrada; o «Início» e a marca saem do menu


- **`tools/criar-escola.sh` ainda não foi alinhado.** O nav do pacote "do zero" (`gerar_nav_zero`)
  continua com a marca «Ciclo NN · escola» e o item «Início», e o `index.html` zero ainda é o
  «cartão de visita» (e não a página «Nós, Por Exemplo»). Falta decidir: o pacote zero abre em
  «Nós, Por Exemplo» (como o pacote cheio) ou mantém o cartão de visita de ciclo em construção?
- **Frentes do pedido ainda em aberto:** vídeos embutidos (F2), documento de fundamentação (F4),
  correção socrática (F5 — infraestrutura, prudência), item de menu «Bastidores» (F10).
- **Nada foi commitado** deste marco (aguardando validação da pesquisadora).

## 11/10/2026 — Atalhos da porta na página de entrada e aprofundamento do «Como se usa»


- **O pacote `fokini2/02/diaghilev2` está com o `index.html` defasado** (ainda mostra o «cartão de
  visita» antigo, não a página «Nós, Por Exemplo»). É anterior a este marco — o `criar-escola.sh`
  já renderiza `nos-por-exemplo.md`, mas o pacote não foi regerado. Regerar exige rodar o
  `criar-escola.sh` (que cria uma escola nova), e não o `gerar-ciclo.sh` (que falha com `DOCS=""`).
- **Nada foi commitado** deste marco (aguardando validação da pesquisadora).

## Pendências anteriores (índice)

- **18/09/2026** — PO do Ciclo 01 — Duo validado → `REGISTRO.md` L9
- **18/09/2026** — Estrutura por professor (P-13, P-14) e migração do… → `REGISTRO.md` L35
- **18/09/2026** — Publicação do repositório no GitHub (decisão da… → `REGISTRO.md` L72
- **18/09/2026** — Pacotes de ciclo passam a ser versionados (deploy… → `REGISTRO.md` L101
- **18/09/2026** — Ciclo próprio por escola: a Ritmos deixa de ser cópia da… → `REGISTRO.md` L134
- **18/09/2026** — Ciclo do Ritmos completado (4 de 8 artefatos) + P-15 a P-19 → `REGISTRO.md` L190
- **18/09/2026** — PO do Ritmos validado + P-22 → `REGISTRO.md` L253
- **18/09/2026** — Publicação, primeira reancoragem da Duo e o caderno da… → `REGISTRO.md` L302
- **19/09/2026** — Congelamento da infraestrutura → `REGISTRO.md` L347
- **19/09/2026** — Criptografia dos acompanhamentos (exceção… → `REGISTRO.md` L396
- **19/09/2026** — Política de segurança dos dados sensíveis → `REGISTRO.md` L470
- **19/09/2026** — Caderno publicado e incluído no hash → `REGISTRO.md` L504
- **19/09/2026** — Método, README-ciclos e campos de duração → `REGISTRO.md` L541
- **19/09/2026** — README-ciclos: escopos e criação de ciclo → `REGISTRO.md` L583
- **19/09/2026** — Correções cosméticas → `REGISTRO.md` L604
- **19/09/2026** — Varredura de marcas de indecisão → `REGISTRO.md` L636
- **19/09/2026** — METODO no pacote e reorganização do menu → `REGISTRO.md` L680
- **20/09/2026** — O guia de observação passa a se chamar o que ele é → `REGISTRO.md` L737
- **20/09/2026** — O contrato de extração passa a ler tabela → `REGISTRO.md` L779
- **20/09/2026** — O índice da página sai do topo e vai para a direita, preso → `REGISTRO.md` L836
- **20/09/2026** — O contrato de extração vira lib (definição única) → `REGISTRO.md` L879
- **20/09/2026** — O contrato ganha as duas declarações (mapa de colunas e… → `REGISTRO.md` L921
- **20/09/2026** — O extrator do plano (o irmão), e o diff classificado → `REGISTRO.md` L965
- **20/09/2026** — O laço de validação vira lib (a segunda definição… → `REGISTRO.md` L1028
- **20/09/2026** — O pre-commit passa a validar o PLANO (schema + tipos) → `REGISTRO.md` L1070
- **20/09/2026** — O experimento passa a consumir o extrator (o ciclo fecha) → `REGISTRO.md` L1116
- **20/09/2026** — O fenômeno do PO é uma LISTA (o schema declarava string) → `REGISTRO.md` L1156
- **20/09/2026** — O escopo `experimentos` entra na lista do commit-msg → `REGISTRO.md` L1197
- **20/09/2026** — A tabela de escopos do REGRAS.md passa a listar os 27 do… → `REGISTRO.md` L1233
- **20/09/2026** — Peça 1: o JSON de dados do Duo entra como fonte → `REGISTRO.md` L1264
- **20/09/2026** — Peça 2: os builders das vistas saem para uma lib → `REGISTRO.md` L1309
- **20/09/2026** — O gerador passa a GERAR a vista (peça 3 da migração) → `REGISTRO.md` L1359
- **20/09/2026** — O guia gerado passa a emitir a data da aula → `REGISTRO.md` L1413
- **20/09/2026** — A linha de base renderiza o texto como veio (nada de… → `REGISTRO.md` L1460
- **20/09/2026** — O guia do Ritmos passa a ser gerado (peça 5) — e o… → `REGISTRO.md` L1503
- **20/09/2026** — O `pre-push` passa a existir — e a conferência do… → `REGISTRO.md` L1564
- **20/09/2026** — O gerador grava os JSONs do formulário no pacote (Fase 2.1) → `REGISTRO.md` L1605
- **20/09/2026** — O JSON de dados vai para o pacote cifrado (Fase 2.2) → `REGISTRO.md` L1686
- **20/09/2026** — O formulário de lançamento vai para produção (Área do… → `REGISTRO.md` L1743
- **20/09/2026** — A folha de captura vira config legível por máquina… → `REGISTRO.md` L1979
- **22/09/2026** — Agentes de workspace: geração, auditoria e apresentação → `REGISTRO.md` L2292
- **23/09/2026** — A identidade do projeto entra na documentação (e a… → `REGISTRO.md` L2344
- **23/09/2026** — A varredura da deriva de identidade: o que ficou fora da… → `REGISTRO.md` L2425
- **23/09/2026** — A seção que só tinha citação, e o ciclo simulado da… → `REGISTRO.md` L2506
- **23/09/2026** — O gerador não herda mais o locale de quem o chama → `REGISTRO.md` L2597
- **25/09/2026** — O HANDOFF truncado: o glob que abortava a geração em… → `REGISTRO.md` L2665
- **25/09/2026** — "Não o que foi planejado": a memória da aula dada e o… → `REGISTRO.md` L2740
- **25/09/2026** — O campo `norma`: o PO ganha o padrão de referência que… → `REGISTRO.md` L2851
- **25/09/2026** — A identidade visual passa a existir como contrato, e a… → `REGISTRO.md` L3051
- **25/09/2026** — A hora da aula entra no `DIAS`, e o calendário passa a ter… → `REGISTRO.md` L3182
- **26/09/2026** — O `DOCS` deixa de ser lista à mão: as famílias por aula… → `REGISTRO.md` L3356
- **26/09/2026** — A P-13 deixa de sugerir que o dado é privado do professor:… → `REGISTRO.md` L3477
- **26/09/2026** — O prazo do §3 dizia "menor entre" — e dois números do… → `REGISTRO.md` L3630
- **26/09/2026** — O config da captura deixa de ser um por ciclo: um… → `REGISTRO.md` L3779
- **26/09/2026** — O `check-identidade.js` entra no `pre-commit`: a identidade… → `REGISTRO.md` L3979
- **26/09/2026** — O campo ganha a forma canônica da linha de base, a… → `REGISTRO.md` L4213
- **26/09/2026** — A data da aula deixa de ser adivinhada: o `ciclos.json`… → `REGISTRO.md` L4406
- **26/09/2026** — O JSON de dados ganha validador: o `-dados.json` deixa de… → `REGISTRO.md` L4673
- **26/09/2026** — O prazo por aula deixa de ser 48 h fixas: `aulas[].prazo`… → `REGISTRO.md` L4875
- **26/09/2026** — A âncora deixa de existir só por ciclo: um `.fipp` por… → `REGISTRO.md` L5156
- **26/09/2026** — O config da captura por aula passa a ser conferido pelo… → `REGISTRO.md` L5316
- **26/09/2026** — Os apelidos saem em claro: um ciclo sem lançamento passa a… → `REGISTRO.md` L5470
- **26/09/2026** — O formulário lê o config pela AULA: as quatro aulas… → `REGISTRO.md` L5659
- **27/09/2026** — A nav sai uma vez: o formulário deixa de ser a única… → `REGISTRO.md` L5861
- **27/09/2026** — O estado da aula deixa de ser declarado: quatro estados… → `REGISTRO.md` L5974 *(superado)*
- **27/09/2026** — A §5.1 para de dizer 48 h: o ajuste com prazo passa a… → `REGISTRO.md` L6166
- **27/09/2026** — O ajuste no plano deixa de ser promessa: o elo do plano da… → `REGISTRO.md` L6324
- **27/09/2026** — A Aula 05 declara o método RAD e o ciclo ganha notação… → `REGISTRO.md` L6488
- **28/09/2026** — O índice do formulário saía sem a vírgula: a gravação… → `REGISTRO.md` L6623
- **28/09/2026** — O formulário baixa **dois** arquivos, e o texto passa a… → `REGISTRO.md` L6743
- **28/09/2026** — O botão passa a ser `Salvar`, e o arquivo vai para a pasta… → `REGISTRO.md` L6859
- **28/09/2026** — A legenda ao lado do botão `Salvar` sai; o botão fica… → `REGISTRO.md` L7197
- **28/09/2026** — O cabeçalho do formulário passa à voz de professor: só… → `REGISTRO.md` L7298
- **28/09/2026** — O botão `Exportar ajuste do plano` sai do formulário: era… → `REGISTRO.md` L7424 *(superado)*
- **29/09/2026** — O botão `Salvar` deixa de abrir a pasta do computador: a… → `REGISTRO.md` L7545 *(superado)*
- **29/09/2026** — O fecho do Passo 1: o "Nível 2 do `tiago`" já estava… → `REGISTRO.md` L7670 *(superado)*
- **29/09/2026** — O Passo 0 entra: o `POST` ganha destino e a cadeia reancora… → `REGISTRO.md` L7818
- **29/09/2026** — Os dois congelados entram: o índice ganha o slug e a… → `REGISTRO.md` L7945
- **29/09/2026** — O `B8` medido: `podeAjustarPlano()` não existe, e o elo do… → `REGISTRO.md` L8015 *(superado)*
- **30/09/2026** — Os pontos 2, 3 e 4 fechados: a grafia, o campo `professor`… → `REGISTRO.md` L8093
- **30/09/2026** — O segundo papel do agente: o servidor local **não… → `REGISTRO.md` L8182
- **01/10/2026** — A grafia de "Elicitação" se propaga, e a pendência do… → `REGISTRO.md` L8269
- **01/10/2026** — A view gerada e a regra de leitura cresciam com o arquivo:… → `REGISTRO.md` L8410
- **02/10/2026** — Os ciclos-prototipo saem do caminho ativo, e o Diaghilev… → `REGISTRO.md` L8531
- **02/10/2026** — A escola passa a poder ser desabilitada, com motivo e data → `REGISTRO.md` L8645
- **07/10/2026** — O cofre dos lançamentos sai do Netlify e entra no… → `REGISTRO.md` L8762
- **07/10/2026** — O Netlify antigo é destruído, o mapa anda para o slide 83… → `REGISTRO.md` L8914
- **07/10/2026** — O prompt de elicitação herda oito decisões do… → `REGISTRO.md` L9042
- PO de **fokini · diaghilev** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **fokini · ciclo 01:** aulas escritas em detalhe: 5 de 5 (as demais entram depois da aula anterior).
- Material de campo de **fokini**: 0 evento(s) versionado(s).
- **fokini2 · ciclo 02:** aulas escritas em detalhe: 0 de 5 (as demais entram depois da aula anterior).
- Material de campo de **fokini2**: 0 evento(s) versionado(s).

## Documentos-chave (para leitura)

- `PROTOCOLO.md` — pétreas
- `REGRAS.md` — regras
- `REGISTRO.md` — marcos metodológicos
- `professores/<nome>/` — um professor por pasta (P-13): ciclos, cadernos, relatórios, campo
- `professores/<nome>/ciclos/ciclo-XX-<escola>-po.md` — POs por escola
- `professores/<nome>/ciclos/ciclo-XX-<escola>.fipp` — âncoras de proveniência
- `departamentos/` — PO de departamento, quando a escola tiver metodologia comum (P-14)
- `biblioteca/guia-do-professor.md` — o guia de posição (departamento ou PO próprio)

## Como retomar

A próxima sessão deve ler, nesta ordem:
1. este arquivo;
2. `PROTOCOLO.md`;
3. as últimas 5 entradas de `REGISTRO.md` — não o arquivo inteiro;
4. o PO do ciclo ativo.

Isso é suficiente para retomar o diálogo sem reconstruir contexto.

Acima: a última entrada do `REGISTRO.md` por inteiro, as pendências recentes e o
índice das anteriores. Consultar o índice antes de abrir o `REGISTRO.md` para
pendência antiga.
