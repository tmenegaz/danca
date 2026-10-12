# Handoff — Projeto Ciclo

Gerado em: `2026-10-12T02:06:58-0300`
Commit atual: `836ffcb` — feat(estrutura): o contexto institucional elicitado no PO preenche o .conf
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
fokini2
tiago (3)
- **Ciclos com manifesto:** 3 variante(s)
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
836ffcb feat(estrutura): o contexto institucional elicitado no PO preenche o .conf
7dfd38c fix(porta): o seletor de aluna valida a senha sem exibir o nome, e a lista de gravados segue o servidor
326067d feat(estrutura): alinhar o título da raiz com o conteúdo e o botão no flex-end
d28e1ef feat(estrutura): isolar o KV da escola e restaurar o MOC dos Bastidores na anamnese
874f919 feat(estrutura): migrar o motor da escola maria para a ponte de produção
34bae17 feat(estrutura): o formulário «Criar nova escola» vira um modal
73a2a6e feat(estrutura): cabeçalho fixo da raiz com o botão «Criar nova escola» na linha do título
97a7377 feat(estrutura): a raiz serve o «Nós, Por Exemplo» real e o login passa a ser tmenegaz
6abcd10 feat(estrutura): o mock da Produção no Worker «zero» (cadastro de professor)
ec35321 feat(estrutura): o domínio raiz danca com «Criar nova escola» ponta a ponta
8a198dc chore(entrega): regerar pacotes e reancorar (títulos da harmonização + menu)
60cdc81 feat(estrutura): freio de habilitação da escola + barra recolhível + rótulo da harmonização
bb3311d docs(protocolo): proveniência condicional e limpeza por índice da escola
d6761a2 refactor(tools): ordem alfabética nos menus e rótulo da harmonização
1788abc chore(entrega): regerar os pacotes com as novas URLs da anamnese e do PO
146d030 fix(estrutura): a anamnese e o PO ganham URLs próprias (/anamnese/ e /plano-observacao/)
423c9e3 chore(entrega): gerar o pacote do ciclo 02-diaghilev2 (o ciclo «do zero» fechado)
7d81c68 docs(ideia): a camada de componentes de front-end e o resultado da avaliação
d2da8a6 feat(estrutura): o Guardar do PO deriva o ciclo inteiro e gera o pacote
355c5e7 chore(estrutura): reancorar a cadeia das fontes alteradas
```

## Por professor

### fokini — 1 ciclo(s)

**Ciclo 01** — variante(s): diaghilev

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Diaghilev | ciclo-01-diaghilev-po.md | Input_PO_Aguardando | 3 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| diaghilev | ciclo-01-diaghilev.fipp | `41338470edba` | (vazio) | Input_PO_Aguardando |

### fokini2 — 1 ciclo(s)

**Ciclo 02** — variante(s): diaghilev2

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| diaghilev2 | ciclo-02-diaghilev2-po.md | Input_PO_Validado | 1 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| diaghilev2 | ciclo-02-diaghilev2.fipp | `56c72a3e5b60` | (vazio) | Input_PO_Validado |

### tiago — 1 ciclo(s)

**Ciclo 01** — variante(s): maria

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| maria | (sem PO) | — | — |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| maria | ciclo-01-maria.fipp | `9d8fb3a6e877` | (vazio) | — |

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

## 12/10/2026 — O «Nós, Por Exemplo» passa a ter fonte única e a raiz fica sempre habilitada

**O que motivou.**
O texto «Nós, Por Exemplo» estava escrito em mais de um lugar: a fonte
`biblioteca/nos-por-exemplo.md` (que os ciclos já renderizavam via pandoc) e a página raiz
`raiz/index.html` (HTML à mão, sem os atalhos de link). Além disso, o Worker raiz (`danca`) foi
encontrado no ar servindo «Escola desabilitada» — porque o script implantado era o
`workers/principal.js` (a ponte das escolas, com o freio `ESCOLA_HABILITADA`), não o
`workers/raiz.js` (a ponte da raiz, que não tem freio).

**O que foi decidido.**
- O texto «Nós, Por Exemplo» passa a ter **fonte única** em `biblioteca/nos-por-exemplo.md`; a
  raiz e os `index.html` dos ciclos são **cópias** dela, replicadas por gerador. O texto não tem
  lastro nem vínculo com dados — é material de apresentação, **sem proveniência** (não entra em
  `.fipp`, não reancora).
- A única diferença entre a raiz e os ciclos é o link: a raiz **não tem links** (as linhas
  «Acessar …» saem), os ciclos têm (os marcadores `@ANAMNESE_URL@`/`@PO_URL@` viram link).
- A raiz (`danca`) **fica sempre habilitada**: não é escola, não tem `ESCOLA_HABILITADA`, e o
  freio de desabilitação nunca a toca. O código já funcionava assim; o incidente foi de deploy
  (script errado), não de lógica.

**Onde entrou.**
`tools/gerar-raiz.sh` — regera o corpo de `raiz/index.html` a partir da fonte, sem links.
`tools/check-nos-por-exemplo.js` — valida que toda página «Nós» (raiz + ciclos) é fiel à fonte.
`biblioteca/nos-por-exemplo.md` — fonte única; o link interno do «Onde pedir ajuda» saiu (a prosa
não tem mais links; só os atalhos «Acessar …» que os ciclos convertem).

**Motivo declarado — os congelados.**
`tools/` é congelado e exige motivo para novo gerador/validador. O motivo: a deriva do texto
«Nós, Por Exemplo» era silenciosa (o ciclo `maria` ficou com a redação antiga sem aviso), e o
padrão do projeto para divergência silenciosa é **fonte única + cópia replicada + validador**
(o precedente é `tools/check-identidade.js` para o CSS). **O que não muda:**

- **A fórmula do hash e a cobertura.** Nada muda; nenhuma fonte de ciclo é alterada por esta
  mudança (a fonte da entrada é `biblioteca/nos-por-exemplo.md`, que **não** é fonte de ciclo —
  o `fonte_md index` a lê como material do sistema, fora do `.fipp`).
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhuma mudou.
- **Os validadores existentes.** Nenhum mudou; o `check-pacote` continua passando.

**Com o quê.**
`tools/gerar-raiz.sh`, `tools/check-nos-por-exemplo.js`, `biblioteca/nos-por-exemplo.md`,
`raiz/index.html` (regenerado), e os pacotes de `fokini/01/diaghilev`, `fokini2/02/diaghilev2`
e `tiago/01/maria` (regenerados; o `maria` saiu da redação antiga).

**Referências.**
`CONGELAMENTO.md` (`tools/`) · `tools/check-identidade.js` (o precedente de fonte única + cópia
replicada + validador) · o pedido «texto do Nós, Por Exemplo num lugar só, replicado em todos».

**O que ainda não está feito.**
- O `tools/check-nos-por-exemplo.js` **não está ligado a nenhum hook** (não entrou no
  `pre-commit`, que é congelado). Ele roda manualmente; a deriva só é pega quando alguém o roda.
- A regeneração do `maria` (escola «zero», sem `DOCS`) continua manual — não há um caminho
  reproduzível equivalente ao `gerar-ciclo.sh` para o pacote zero; o `criar-escola.sh` só gera o
  índice no nascimento da escola, não numa atualização.
- O deploy da raiz continua manual (`npx wrangler deploy -c wrangler.danca.jsonc`); não há
  automação de deploy para o Worker `danca`.

## O que está pendente

## 11/10/2026 — Atalhos da porta na página de entrada e aprofundamento do «Como se usa»


- **O pacote `fokini2/02/diaghilev2` está com o `index.html` defasado** (ainda mostra o «cartão de
  visita» antigo, não a página «Nós, Por Exemplo»). É anterior a este marco — o `criar-escola.sh`
  já renderiza `nos-por-exemplo.md`, mas o pacote não foi regerado. Regerar exige rodar o
  `criar-escola.sh` (que cria uma escola nova), e não o `gerar-ciclo.sh` (que falha com `DOCS=""`).
- **Nada foi commitado** deste marco (aguardando validação da pesquisadora).

## 11/10/2026 — URLs próprias para a Anamnese e o Plano de Observação

- A marcação de «ativo» na barra de navegação da porta é estática (gerada com
  `atual=plano-observacao`): ao abrir `/anamnese/`, a barra ainda destaca «Plano de Observação».
  O título da página (H1) já distingue as duas — só a marcação do item de menu é que fica a dever.

## 11/10/2026 — As sete mudanças de comportamento e a proveniência condicional

- **Nada foi implementado** — as sete mudanças são plano; os dois andaimes, a norma da limpeza e o
  índice por escola são declaração, não arquivos/scripts criados.
- **Nada foi commitado** — este marco (e o descongelamento de `PROTOCOLO.md` + `tools/criar-escola.sh`)
  exige commit próprio com o motivo declarado, aguardando validação da pesquisadora.
- **A limpeza não tem script nem hook.** O ponto natural é o `post-merge` (não existe hoje) ou um
  script próprio rodado após a sincronização — nada foi criado; a norma só declara o dever e o
  critério (slug + verificação «não está a pagar»).
- **O índice não é gerado.** O `tools/criar-escola.sh` ainda não escreve `escola/<escola>/indice.json`
  — a geração é declaração; o formato (slug, `criado_em`, professor, senha como chave, estado
  inicial, `arquivos[]`) está proposto no `IDEIA-PAINEL-ESCOLA.md` §17.5, mas o script é congelado
  e não foi tocado.
- **Quais congelados descongelam na implementação** — `tools/lib-senhas.sh` (senha por professor +
  administrador) e `tools/criar-escola.sh` (senha do administrador no nascimento) estão sob
  `tools/` (congelado). `workers/` **não está congelado** — o Cron Trigger e a senha do domínio
  raiz entram sem o rito dos congelados. Cada um entra com o seu próprio motivo/commit.

## 11/10/2026 — Ordem alfabética nos menus e rótulo da harmonização

- O `criar-escola.sh` continua sendo o único lugar com o nav «zero» duplicado; a ordenação foi
  alinhada, mas o nav mínimo ainda não é gerado pelo `gerar_nav` (sem DOCS ele não roda).

## 12/10/2026 — O «Nós, Por Exemplo» passa a ter fonte única e a raiz fica sempre habilitada

- O `tools/check-nos-por-exemplo.js` **não está ligado a nenhum hook** (não entrou no
  `pre-commit`, que é congelado). Ele roda manualmente; a deriva só é pega quando alguém o roda.
- A regeneração do `maria` (escola «zero», sem `DOCS`) continua manual — não há um caminho
  reproduzível equivalente ao `gerar-ciclo.sh` para o pacote zero; o `criar-escola.sh` só gera o
  índice no nascimento da escola, não numa atualização.
- O deploy da raiz continua manual (`npx wrangler deploy -c wrangler.danca.jsonc`); não há
  automação de deploy para o Worker `danca`.

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
- **09/10/2026** — A criação de escola vira um comando: o CLI de… → `REGISTRO.md` L9282
- **09/10/2026** — A porta passa a elicitar o PLANO, e o ciclo do zero passa a… → `REGISTRO.md` L9334
- **10/10/2026** — O menu separa a Anamnese do Plano de Observação, e a… → `REGISTRO.md` L9387
- **11/10/2026** — «Nós, Por Exemplo» vira a página de entrada; o… → `REGISTRO.md` L9440
- PO de **fokini · diaghilev** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **fokini · ciclo 01:** aulas escritas em detalhe: 5 de 5 (as demais entram depois da aula anterior).
- **fokini2 · ciclo 02:** aulas escritas em detalhe: 1 de 5 (as demais entram depois da aula anterior).
- **tiago · ciclo 01:** aulas escritas em detalhe: 0 de 5 (as demais entram depois da aula anterior).
- Material de campo de **tiago**: 0 evento(s) versionado(s).

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
