# Handoff — Projeto Ciclo (o produto é o Sistema Lastro)

Gerado em: `2026-10-20T08:43:11-0300`
Commit atual: `caf2e25` — fix(po): a ponte de produção repassa a curadoria ao roteador
Para: sessão nova (retomar o diálogo)

## O que é este projeto

**Nome comercial:** o produto é o **Sistema Lastro** — e este repositório é o **Projeto
Ciclo**, o protótipo a partir do qual ele se constrói. Os dois nomes convivem, e a
convivência é declarada (não é renomeação): **Lastro** é a marca curta; **Sistema Lastro**
é o sistema como um todo; **Plataforma Lastro** destaca a solução tecnológica; e
`Lastro — Sistema de Memória e Observabilidade Pedagógica em Dança` é a **proposta** de
denominação descritiva (proposta, não subtítulo confirmado). O conceito central não muda:
o Lastro **registra e organiza evidências para apoiar a reflexão pedagógica; não substitui
o professor nem toma decisões sobre o aluno.** O mapa de evolução do produto está em
`PLANEJAMENTO-LASTRO.md`.

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
- **Professores:** sapo-bailarino
tiago-menegaz (2)
- **Ciclos com manifesto:** 4 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-ANAMNESE.md`** — Desenho da malha de anamnese de balé clássico como **conteúdo do PO** — a **observação inicial** dos seis elementos basilares, os **nove blocos fixos** da ficha, os **dois módulos condicionais** (validação de nível prévio e contexto de origem) e as **três dimensões** da linha de base (Técnica, Funcional, Musicalidade) —, seguida da **malha de domínios declarados** (alinhamento ósseo, flexibilidade passiva, força ativa e potência, sistema vestibular, orientação espacial e lateralidade), com **ramificação condicional** pelo nível declarado (Básico, Intermediário, Avançado) e **soberania de CRUD autoral** do professor, fechando na **conclusão** — o campo **«Resultado da avaliação»** (apta/não apta + nível, sem turma/horário/frequência) — o **recipiente** é do PE, o **conteúdo** é do PO.
- **`ARQUITETURA-AULA.md`** — o ciclo de vida da aula (planejada → dada → lançada, mais a **não dada**), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por aula. O **estado derivado** (`B6`) e o **ajuste no plano** (`B8`) estão implementados; o resto, não.
- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto.
- **`ARQUITETURA-GERAL.md`** — Arquitetura geral — por que sistema de arquivos, e não um backend com banco
- **`ARQUITETURA-PE.md`** — Especificação da arquitetura de integração entre o repositório atual (implementação do PO) e o repositório separado **"dança e elicitação"** (módulo PE), utilizando descoberta por variável de ambiente (`.env`) e degradação graciosa.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — o Bastidores é o ambiente da direção da escola: um grupo de menu com duas vistas — o Estúdio de Dança (que a direção partilha com o professor) e a Produção (só da direção) —, regido pelo princípio cena × bastidores, pela regra da reverberação (o que a escola declara desce para os documentos da cena) e pela proveniência própria da escola. Não implementado.
- **`PLANEJAMENTO-LASTRO.md`** — o mapa de evolução do **Sistema Lastro** (o nome comercial do produto; `Projeto Ciclo` segue como o nome do protótipo e deste repositório). Diagnóstico do que existe hoje — as três fontes, o envelope, as famílias de chave, os identificadores, os relacionamentos, os índices, o versionamento e o comercial — e **treze frentes** com objetivo, lacunas, dependências, entregas, critérios verificáveis, riscos e prioridade. Nada foi implementado: este documento é o mapa, não a obra.

## Últimos commits

```
caf2e25 fix(po): a ponte de produção repassa a curadoria ao roteador
9628405 chore(estrutura): regerar o índice do acervo e o HANDOFF depois do expurgo da batata
ad93892 fix(estrutura): a escola publica um índice de turmas, e o menu deixa de nascer vazio
25f4751 fix(po): o Plano de Observação de uma turma deixa de oferecer as alunas das outras
b04f240 fix(tools): o hook nao recusa a variante que ainda nao tem aula
9a27d11 chore(entrega): gerar o pacote de sapo-bailarino/01/calango-bale-nivel-1-teste-1
cba28ae chore(estrutura): reancorar a cadeia das fontes alteradas
83e43c9 feat(captura): actualiza a variante calango-bale-nivel-1-teste-1 no schema de captura
81979f8 feat(ciclo): o contexto elicitado preenche o manifesto e liga o DOCS
c01324f feat(ciclo): o «Guardar» do PO cifra ciclo-01-calango-bale-nivel-1-teste-1-dados.cifrado.json
d1ee4c5 feat(ciclo): o «Guardar» do PO deriva ciclo-01-calango-bale-nivel-1-teste-1-glossario-benesh.md
2e6bec8 feat(ciclo): o «Guardar» do PO deriva ciclo-01-calango-bale-nivel-1-teste-1-notacao.md
483eadd feat(ciclo): o «Guardar» do PO deriva ciclo-01-calango-bale-nivel-1-teste-1-dados.json
0390ad3 feat(ciclo): o «Guardar» do PO deriva ciclo-01-calango-bale-nivel-1-teste-1-harmonizacao.md
936236d feat(ciclo): o «Guardar» do PO deriva ciclo-01-calango-bale-nivel-1-teste-1-captura-aula-01.md
ca622fc feat(ciclo): o «Guardar» do PO deriva ciclo-01-calango-bale-nivel-1-teste-1-referencias.md
8c29c11 feat(ciclo): o «Guardar» do PO deriva ciclo-01-calango-bale-nivel-1-teste-1-aula-01.md
9212232 feat(po): o PO elicitado vira a fonte do ciclo
ae2d80f feat(acervo): envelope/po-20261020-0758.json
161961f feat(acervo): envelope/.indice.json
```

## Por professor

### sapo-bailarino — 1 ciclo(s)

**Ciclo 01** — variante(s): calango, calango-bale-nivel-1-teste-1, calango-bale-nivel-2-teste-1, calango-bale-nivel-3-teste-1

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| calango | (sem PO) | — | — |
| calango | ciclo-01-calango-bale-nivel-1-teste-1-po.md | Input_PO_Aguardando | 1 |
| calango-bale-nivel-2-teste-1 | (sem PO) | — | — |
| calango-bale-nivel-3-teste-1 | (sem PO) | — | — |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| calango | ciclo-01-calango.fipp | `f167c9c85478` | (vazio) | — |
| calango-bale-nivel-1-teste-1 | ciclo-01-calango-bale-nivel-1-teste-1.fipp | `ecc946c1a5d6` | (vazio) | Input_PO_Aguardando |
| calango-bale-nivel-2-teste-1 | ciclo-01-calango-bale-nivel-2-teste-1.fipp | `fb64bf9965c2` | (vazio) | — |
| calango-bale-nivel-3-teste-1 | ciclo-01-calango-bale-nivel-3-teste-1.fipp | `c572e800094a` | (vazio) | — |

### tiago-menegaz — 0 ciclo(s)

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

## 20/10/2026 — o hook recusava todo commit enquanto uma turma não tivesse PO

**O que motivou.** Um commit que tocasse `professores/sapo-bailarino/ciclos/ciclo-01-*` era
impossível. O hook do pré-commit gera **todas** as variantes daquele ciclo, e o `calango` estava com
três turmas planejadas e o PO de uma só: a geração da segunda morria em

```
erro: nenhuma 'aula-*' de DOCS tem fonte em disco — não há volume para a Regra 9.
```

O gerador está CERTO — ele recusa com a frase que diz o que falta, e a recusa já estava documentada
no próprio `gerar-ciclo.sh` («medido em 18/10/2026, com `DOCS="plano"` e sem `aula-01` em disco»).
Quem estava errado era o hook: tomava uma **recusa de estado** por **falha de conteúdo**. O caminho
que sobrava era `--no-verify`, que salta também a validação da âncora — o pior remédio possível.

**O que foi decidido.** O hook passa a saltar a variante que declara `DOCS` **sem nenhum `aula-*`**,
com a mesma forma do salto que já existia para o ciclo-zero (`DOCS` vazio). O critério é o do
gerador, e não um segundo: `DOCS` sem `aula-*` **é** «não há aula com fonte». Um `DOCS` **com** aula e
sem volume continua a falhar — isso é defeito de conteúdo e tem de aparecer.

**Motivo declarado — os congelados.** `tools/` está em `CONGELAMENTO.md`.

- `tools/hooks/pre-commit` — um `case` de sete linhas, ao lado do salto do ciclo-zero, com o porquê
  em comentário.

**O que NÃO muda:** quais variantes são geradas (as que têm aula), a validação da âncora, a da
identidade visual, a do volume (Regra 9) e a do passado lançado. Nada é saltado que antes fosse
verificado — o que sai é um passo que **falhava sempre**, e por um motivo que não é defeito.

**Onde entrou.** `tools/hooks/pre-commit` — o teste `case " $docs_do_ciclo " in *" aula-"*)`.

**Com o quê.** Medido no commit seguinte: com o `calango` no estado real (plano das três, PO de uma),
o hook passa a dizer «declara DOCS="plano" e ainda não tem aula — nada a gerar (plano sem PO)» para
as duas, e gera e valida a primeira (`OK, 24 verificações`). `bash -n tools/hooks/pre-commit` sem
erro.

**O que ainda não está feito.** O hook continua a gerar **todas** as variantes quando o commit cita o
manifesto base ou o pacote-zero — e não só a que o commit toca. É conservador, e é o que faz esta
classe de defeito aparecer; mas é também o que torna o commit lento numa escola com muitas turmas.
Ficou como está: preferi o custo à possibilidade de um pacote publicado não ser o que o commit diz.

**Correção de 20/10/2026 (mesmo dia) — a ponte deitava fora a curadoria.** A entrada acima diz que
o recorte «resolve-se no servidor». Resolvia no ROTEADOR, não na ponte: o `montarPorta` recebia
`lerCuradorias` e não o punha no objecto do `criarRotas`. Medido no Worker depois do deploy —
`?plano=plano-20261020-0739` respondia `turma: Balé Nível 1 — Teste 1` e `sujeitos: []`. O sintoma
era mudo e plausível (com curadoria ausente a regra conclui, correctamente, que ninguém está
atribuído), e por isso passou: a prova chamava `criarRotas` **de fora**, com a função já nas mãos, e
media as pontas em vez da ligação. A prova ganhou a secção **E**, que monta a **ponte verdadeira**
(`montarPorta`) com uma `lerCuradorias` que conta as chamadas: **25 → 27 asserções**, e o controlo
negativo — sem o repasse — dá **2 falhas**.

## O que está pendente

## 20/10/2026 — a aula derivada volta a ser legível: o mapa de secções e a tabela que é o campo

O pacote gerado no `pre-commit` foi **removido** do disco: quem o
versiona é o workflow `gerar-ciclo.yml`, com a mensagem e o rodapé dele. Falta **redisparar a
geração** no Cloudflare para o pacote existir no repositório, e falta reintroduzir a declaração
quando o PO muda — isso é o commit anterior, e o redisparo é o que o torna visível.

## 20/10/2026 — o primeiro pacote no repositório expôs o vocabulário do acervo: catorze arquivos sem decisão

Nenhuma ferramenta de `tools/` foi tocada — e essa foi a decisão: a
primeira tentativa foi implementar no validador a precedência que o `tipos.json` declara no campo
`ordem` («o primeiro padrão que casar vence»), e o resultado seria **duas** declarações a dizer o
mesmo. Ficou a regra única, «um arquivo, uma decisão», que já era a do validador e a da prova das
declarações. Duas coisas continuam abertas: o `ordem` do vocabulário é um campo que **ninguém lê**
(ou se implementa, ou se apaga); e o `criar-escola.sh` (congelado) continua a gravar o pacote-zero no
`assets.directory` de toda escola nova — o `batata` foi corrigido à mão, como o `breu` antes dele.

## 20/10/2026 — o Plano de Observação de uma turma oferecia as alunas das outras

O `campo aberto` de «Sujeitos observados» continua a aceitar
qualquer apelido escrito à mão — e é de propósito (a aluna pode ainda não estar na curadoria), mas
não há na gravação nenhuma conferência de que o apelido pertence à turma: o recorte é da **lista**,
não do **documento**. Fechá-lo exige decidir o que fazer com a aluna que muda de turma a meio do
ciclo, e essa decisão não é de hoje. E o `flutuantes` (apelidos em texto livre) continua aberto pelo
mesmo motivo.

## 20/10/2026 — a escola publica um ÍNDICE DE TURMAS, e o menu deixa de nascer vazio


- **O `wrangler deploy` do `calango` não foi corrido daqui.** A correcção só chega ao ar no próximo
  deploy — e o caminho é o de sempre (redisparar a geração), não um `wrangler` à mão. Até lá, o site
  continua a servir o esqueleto.
- **A montagem depende do deploy correr depois dela.** Uma pasta que não existe faz o `wrangler`
  recusar — falha alta, e é a que se quer —, mas quem correr `npx wrangler deploy -c
  wrangler.<escola>.jsonc` num clone novo tem de montar primeiro. Os dois sítios que publicam já o
  fazem; o comando à mão, não.
- **O índice das turmas não conhece o estado do ciclo.** Mostra o ritmo e o número de aulas lançadas,
  não «a próxima aula é a 03». Esse dado existe (o `ciclos.json`), e não foi trazido para não abrir
  uma segunda derivação do estado.
- Continua verdadeiro o de antes: **nada regenera o `indices/`** automaticamente. Nesta sessão ele
  foi regerado à mão depois do expurgo da `batata`, e voltou a 14 de 14.

## 20/10/2026 — o hook recusava todo commit enquanto uma turma não tivesse PO

O hook continua a gerar **todas** as variantes quando o commit cita o
manifesto base ou o pacote-zero — e não só a que o commit toca. É conservador, e é o que faz esta
classe de defeito aparecer; mas é também o que torna o commit lento numa escola com muitas turmas.
Ficou como está: preferi o custo à possibilidade de um pacote publicado não ser o que o commit diz.

## Pendências anteriores (índice)

- **18/09/2026** — PO do Ciclo 01 — Duo validado → `REGISTRO.md` L9
- **18/09/2026** — Estrutura por professor (P-13, P-14) e migração do material → `REGISTRO.md` L35
- **18/09/2026** — Publicação do repositório no GitHub (decisão da… → `REGISTRO.md` L72
- **18/09/2026** — Pacotes de ciclo passam a ser versionados (deploy… → `REGISTRO.md` L101
- **18/09/2026** — Ciclo próprio por escola: a Ritmos deixa de ser cópia da Duo → `REGISTRO.md` L134
- **18/09/2026** — Ciclo do Ritmos completado (4 de 8 artefatos) + P-15 a P-19 → `REGISTRO.md` L190
- **18/09/2026** — PO do Ritmos validado + P-22 → `REGISTRO.md` L253
- **18/09/2026** — Publicação, primeira reancoragem da Duo e o caderno da Aula… → `REGISTRO.md` L302
- **19/09/2026** — Congelamento da infraestrutura → `REGISTRO.md` L347
- **19/09/2026** — Criptografia dos acompanhamentos (exceção pós-congelamento) → `REGISTRO.md` L396
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
- **20/09/2026** — O laço de validação vira lib (a segunda definição única) → `REGISTRO.md` L1028
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
- **20/09/2026** — O guia do Ritmos passa a ser gerado (peça 5) — e o render… → `REGISTRO.md` L1503
- **20/09/2026** — O `pre-push` passa a existir — e a conferência do… → `REGISTRO.md` L1564
- **20/09/2026** — O gerador grava os JSONs do formulário no pacote (Fase 2.1) → `REGISTRO.md` L1605
- **20/09/2026** — O JSON de dados vai para o pacote cifrado (Fase 2.2) → `REGISTRO.md` L1686
- **20/09/2026** — O formulário de lançamento vai para produção (Área do… → `REGISTRO.md` L1743
- **20/09/2026** — A folha de captura vira config legível por máquina… → `REGISTRO.md` L1979
- **22/09/2026** — Agentes de workspace: geração, auditoria e apresentação → `REGISTRO.md` L2292
- **23/09/2026** — A identidade do projeto entra na documentação (e a ressalva… → `REGISTRO.md` L2344
- **23/09/2026** — A varredura da deriva de identidade: o que ficou fora da… → `REGISTRO.md` L2425
- **23/09/2026** — A seção que só tinha citação, e o ciclo simulado da… → `REGISTRO.md` L2506
- **23/09/2026** — O gerador não herda mais o locale de quem o chama → `REGISTRO.md` L2597
- **25/09/2026** — O HANDOFF truncado: o glob que abortava a geração em… → `REGISTRO.md` L2665
- **25/09/2026** — "Não o que foi planejado": a memória da aula dada e o plano… → `REGISTRO.md` L2740
- **25/09/2026** — O campo `norma`: o PO ganha o padrão de referência que era… → `REGISTRO.md` L2851
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
- **26/09/2026** — A âncora deixa de existir só por ciclo: um `.fipp` por aula… → `REGISTRO.md` L5156
- **26/09/2026** — O config da captura por aula passa a ser conferido pelo… → `REGISTRO.md` L5316
- **26/09/2026** — Os apelidos saem em claro: um ciclo sem lançamento passa a… → `REGISTRO.md` L5470
- **26/09/2026** — O formulário lê o config pela AULA: as quatro aulas deixam… → `REGISTRO.md` L5659
- **27/09/2026** — A nav sai uma vez: o formulário deixa de ser a única página… → `REGISTRO.md` L5861
- **27/09/2026** — O estado da aula deixa de ser declarado: quatro estados… → `REGISTRO.md` L5974 *(superado)*
- **27/09/2026** — A §5.1 para de dizer 48 h: o ajuste com prazo passa a… → `REGISTRO.md` L6166
- **27/09/2026** — O ajuste no plano deixa de ser promessa: o elo do plano da… → `REGISTRO.md` L6324
- **27/09/2026** — A Aula 05 declara o método RAD e o ciclo ganha notação… → `REGISTRO.md` L6488
- **28/09/2026** — O índice do formulário saía sem a vírgula: a gravação passa… → `REGISTRO.md` L6623
- **28/09/2026** — O formulário baixa **dois** arquivos, e o texto passa a… → `REGISTRO.md` L6743
- **28/09/2026** — O botão passa a ser `Salvar`, e o arquivo vai para a pasta… → `REGISTRO.md` L6859
- **28/09/2026** — A legenda ao lado do botão `Salvar` sai; o botão fica… → `REGISTRO.md` L7197
- **28/09/2026** — O cabeçalho do formulário passa à voz de professor: só o… → `REGISTRO.md` L7298
- **28/09/2026** — O botão `Exportar ajuste do plano` sai do formulário: era… → `REGISTRO.md` L7424 *(superado)*
- **29/09/2026** — O botão `Salvar` deixa de abrir a pasta do computador: a… → `REGISTRO.md` L7545 *(superado)*
- **29/09/2026** — O fecho do Passo 1: o "Nível 2 do `tiago`" já estava… → `REGISTRO.md` L7670 *(superado)*
- **29/09/2026** — O Passo 0 entra: o `POST` ganha destino e a cadeia reancora… → `REGISTRO.md` L7818
- **29/09/2026** — Os dois congelados entram: o índice ganha o slug e a… → `REGISTRO.md` L7945
- **29/09/2026** — O `B8` medido: `podeAjustarPlano()` não existe, e o elo do… → `REGISTRO.md` L8015 *(superado)*
- **30/09/2026** — Os pontos 2, 3 e 4 fechados: a grafia, o campo `professor`… → `REGISTRO.md` L8093
- **30/09/2026** — O segundo papel do agente: o servidor local **não existe**;… → `REGISTRO.md` L8182
- **01/10/2026** — A grafia de "Elicitação" se propaga, e a pendência do… → `REGISTRO.md` L8269
- **01/10/2026** — A view gerada e a regra de leitura cresciam com o arquivo:… → `REGISTRO.md` L8410
- **02/10/2026** — Os ciclos-prototipo saem do caminho ativo, e o Diaghilev… → `REGISTRO.md` L8531
- **02/10/2026** — A escola passa a poder ser desabilitada, com motivo e data → `REGISTRO.md` L8645
- **07/10/2026** — O cofre dos lançamentos sai do Netlify e entra no… → `REGISTRO.md` L8762
- **07/10/2026** — O Netlify antigo é destruído, o mapa anda para o slide 83 e… → `REGISTRO.md` L8914
- **07/10/2026** — O prompt de elicitação herda oito decisões do formulário do… → `REGISTRO.md` L9042
- **09/10/2026** — A criação de escola vira um comando: o CLI de scaffolding,… → `REGISTRO.md` L9282
- **09/10/2026** — A porta passa a elicitar o PLANO, e o ciclo do zero passa a… → `REGISTRO.md` L9334
- **10/10/2026** — O menu separa a Anamnese do Plano de Observação, e a… → `REGISTRO.md` L9387
- **11/10/2026** — «Nós, Por Exemplo» vira a página de entrada; o «Início» e a… → `REGISTRO.md` L9440
- **11/10/2026** — Atalhos da porta na página de entrada e aprofundamento do… → `REGISTRO.md` L9509
- **11/10/2026** — URLs próprias para a Anamnese e o Plano de Observação → `REGISTRO.md` L9563
- **11/10/2026** — As sete mudanças de comportamento e a proveniência… → `REGISTRO.md` L9605
- **11/10/2026** — Ordem alfabética nos menus e rótulo da harmonização → `REGISTRO.md` L9681
- **12/10/2026** — O «Nós, Por Exemplo» passa a ter fonte única e a raiz fica… → `REGISTRO.md` L9730
- **12/10/2026** — O plano de ensino vira rota própria e o PO passa a puxar os… → `REGISTRO.md` L9787
- **12/10/2026** — O plano de ensino ganha estante, edição em sítio e… → `REGISTRO.md` L9846
- **12/10/2026** — A arquitetura geral ganha documento próprio (arquivo, não… → `REGISTRO.md` L9889
- **12/10/2026** — O botão «Criar nova escola» alinha o menu da Área do… → `REGISTRO.md` L9923
- **12/10/2026** — O CLI «criar-escola» alinha o menu zero ao plano de ensino → `REGISTRO.md` L9955
- **12/10/2026** — A página de entrada ganha o «Plano de ensino» → `REGISTRO.md` L9993
- **12/10/2026** — A raiz nunca é desabilitada pelo freio de escola → `REGISTRO.md` L10047
- **12/10/2026** — O rodapé do ciclo zero lista os três itens da Área do… → `REGISTRO.md` L10085
- **12/10/2026** — A folha de captura ganha rótulo curto e transposição → `REGISTRO.md` L10122
- **12/10/2026** — A senha de criptografia da Maria nasce mockada e chega ao CI → `REGISTRO.md` L10168
- **12/10/2026** — O PO referencia o plano por id e para de duplicar o… → `REGISTRO.md` L10202
- **12/10/2026** — O Diaghilev sai por expurgo DIRETO, e a trava de identidade… → `REGISTRO.md` L10251
- **12/10/2026** — O hook de expurgo nasce e passa o teste no Diaghilev II → `REGISTRO.md` L10339
- **12/10/2026** — O criar-escola.sh passa a gerar o índice da escola (fecha a… → `REGISTRO.md` L10404
- **12/10/2026** — O expurgo ganha a reconciliação worker×slug e o hook… → `REGISTRO.md` L10453
- **12/10/2026** — A senha de criptografia deixa de ser manual: nasce REAL no… → `REGISTRO.md` L10508
- **12/10/2026** — A senha de criptografia nasce no Cloudflare (caminho a): o… → `REGISTRO.md` L10561
- **12/10/2026** — A página «Criar nova escola» passa a subir o motor completo… → `REGISTRO.md` L10629
- **12/10/2026** — O formulário vira mínimo e o Bastidores vira grupo (Estúdio… → `REGISTRO.md` L10692
- **13/10/2026** — A contaminação entre escolas (o envelope sem escola) é… → `REGISTRO.md` L10756
- **13/10/2026** — O hook deixa o ciclo-zero (scaffold de escola) passar → `REGISTRO.md` L10839
- **13/10/2026** — A Produção exclui aluna e professor (o gabinete se mantém… → `REGISTRO.md` L10870
- **13/10/2026** — O professor é o dono, a Produção pede senha e o professor… → `REGISTRO.md` L10894
- **13/10/2026** — Bloco 2: o nó 50 não semeia, e «não foi medido» entra… → `REGISTRO.md` L10934
- **13/10/2026** — «Não foi medido» chega aos basilares e às cinco posições;… → `REGISTRO.md` L10964
- **13/10/2026** — A categoria etária é re-derivada da idade; a memória é por… → `REGISTRO.md` L10999
- **13/10/2026** — A senha é por professor, e a categoria etária re-deriva ao… → `REGISTRO.md` L11027
- **13/10/2026** — Cadastro de turmas e vocabulário técnico do balé (com… → `REGISTRO.md` L11066
- **13/10/2026** — Norma revisada: o Bastidores cria e declara (caso a caso);… → `REGISTRO.md` L11114
- **13/10/2026** — A base canónica do catálogo migra para… → `REGISTRO.md` L11152
- **13/10/2026** — A curadoria nasce: a escola atribui a cada professor o que… → `REGISTRO.md` L11185
- **13/10/2026** — Metodologia e notação chegam ao PO (ligar L5 — Bloco 8.2) → `REGISTRO.md` L11218
- **13/10/2026** — A tela consome a curadoria: plano/PO travam sem curadoria e… → `REGISTRO.md` L11245
- **13/10/2026** — Bastidores quebrou: a página da Produção referia `env` fora… → `REGISTRO.md` L11283
- **13/10/2026** — A grelha das tabelas: a rubrica, as turmas em plural, o… → `REGISTRO.md` L11306
- **13/10/2026** — A rubrica: o conteúdo alinha-se à decisão (Bloco 10,… → `REGISTRO.md` L11410
- **13/10/2026** — A grelha não chegava à porta: duas listas brancas engoliam… → `REGISTRO.md` L11449
- **14/10/2026** — A régua da turma mede o critério no LANÇAMENTO (frente B9) → `REGISTRO.md` L11489
- **14/10/2026** — O PO completo chega inteiro aos derivados (frente B10) → `REGISTRO.md` L11578
- **14/10/2026** — O plano completo chega inteiro aos derivados (frente B11) → `REGISTRO.md` L11679
- **15/10/2026** — O Sistema Lastro: o nome comercial, e o mapa de evolução do… → `REGISTRO.md` L11818
- **15/10/2026** — A dimensão observada deriva do PLANO (e o vocabulário do PO… → `REGISTRO.md` L12149
- **15/10/2026** — A cifra do Worker respeita o teto do runtime, e a falha… → `REGISTRO.md` L12267
- **15/10/2026** — A geração publica: o deploy entra na cadeia → `REGISTRO.md` L12367
- **15/10/2026** — O guarda do pre-push passa a conferir a última linha do… → `REGISTRO.md` L12431
- **15/10/2026** — A criação da escola diz onde guardar a senha de criptografia → `REGISTRO.md` L12491
- **15/10/2026** — O prefixo do nome separa a chave da cifra da senha de acesso → `REGISTRO.md` L12560
- **15/10/2026** — O arquivo de senhas vira um espelho por escola → `REGISTRO.md` L12633
- **15/10/2026** — A chave de cifra vira interna do Worker: ninguém a vê,… → `REGISTRO.md` L12713
- **15/10/2026** — O lançamento da aula confere a senha e grava cifrado no… → `REGISTRO.md` L12826
- **15/10/2026** — O expurgo da escola sai do comando e vira botão, na raiz → `REGISTRO.md` L12908
- **15/10/2026** — O expurgo apagava a escola e deixava o cadastro das alunas… → `REGISTRO.md` L13015
- **15/10/2026** — `Buffer` não existe no runtime dos Workers: o expurgo não… → `REGISTRO.md` L13124
- **15/10/2026** — O gerador do HANDOFF quebrava com o repositório sem escola → `REGISTRO.md` L13231
- **15/10/2026** — O expurgo apagou o MODELO: a escola `ponta` não pôde nascer → `REGISTRO.md` L13267
- **15/10/2026** — Criar escola para o professor do MODELO: o `cp` recusava o… → `REGISTRO.md` L13328
- **15/10/2026** — Um conserto commitado e não publicado não conserta nada → `REGISTRO.md` L13381
- **15/10/2026** — O professor homônimo: o identificador é o slug, e o… → `REGISTRO.md` L13424
- **15/10/2026** — O molde sai de `professores/`: molde não é professor → `REGISTRO.md` L13506
- **16/10/2026** — «Nós, Por Exemplo» sai: a página é a apresentação, e o nome… → `REGISTRO.md` L13584
- **16/10/2026** — A identidade visual tem seis famílias em estudo, e o… → `REGISTRO.md` L13654
- **16/10/2026** — A tela diz de quem é a ficha, e o obrigatório se anuncia → `REGISTRO.md` L13757
- **16/10/2026** — A senha autoriza o ATO, não a SESSÃO → `REGISTRO.md` L13862
- **16/10/2026** — A data da ficha é a da última mudança — e a edição do plano… → `REGISTRO.md` L13985
- **16/10/2026** — O carimbo é a hora da escola, não a do servidor → `REGISTRO.md` L14104
- **16/10/2026** — A estante pagina de seis em seis, o roteiro é só da… → `REGISTRO.md` L14194
- **16/10/2026** — A sequência de exercícios chega ao `plano-XX.json` (e o… → `REGISTRO.md` L14310
- **16/10/2026** — O ciclo passa a ser DA TURMA (fase 1: a identidade da fonte) → `REGISTRO.md` L14434
- **16/10/2026** — A hora de início é do DIA da semana (e a turma passa a… → `REGISTRO.md` L14496
- **16/10/2026** — A turma deriva: o «editar» passa a ser um elo novo, com… → `REGISTRO.md` L14553
- **16/10/2026** — A curadoria é de UMA turma (e edita-se ou deriva-se como a… → `REGISTRO.md` L14690
- **16/10/2026** — A identidade visual fecha o circuito: raiz, porta,… → `REGISTRO.md` L14759
- **16/10/2026** — A curadoria é de UMA turma — e o id passa a dizê-lo → `REGISTRO.md` L14852
- **16/10/2026** — A camada de componentes: o desenho deixa de ser reescrito… → `REGISTRO.md` L14918
- **17/10/2026** — Os papéis e a variante noturna: a identidade passa a ter… → `REGISTRO.md` L14988
- **17/10/2026** — A aparência ganha prova própria — e o botão que sumiria no… → `REGISTRO.md` L15063
- **17/10/2026** — A escola nasceu sem o botão da aparência: a barra tinha uma… → `REGISTRO.md` L15316
- **17/10/2026** — A lista de turmas deixa de ficar acavalada no celular → `REGISTRO.md` L15384
- **17/10/2026** — Os commits estavam certos e a produção estava velha: as… → `REGISTRO.md` L15689
- **17/10/2026** — O botão que parecia quebrado, o campo colado no botão e o… → `REGISTRO.md` L15743
- **17/10/2026** — As sete listas da Produção passam a folhear (o botão que… → `REGISTRO.md` L15839
- **18/10/2026** — A escola não é campo: o cabeçalho do ato separa o que se… → `REGISTRO.md` L15925
- **18/10/2026** — O nome da escola estava no JSON e vinha do cliente: o… → `REGISTRO.md` L15987
- **18/10/2026** — a S5 entra em produção, e os três passos ganham os botões… → `REGISTRO.md` L16393
- **18/10/2026** — o «Seções» vira botão, e a página começa na secção → `REGISTRO.md` L16454
- **18/10/2026** — a proveniência sai da curadoria e vale para tudo; o menu… → `REGISTRO.md` L16494
- **18/10/2026** — os três passos fecham as travas, e o «Editar» da turma abre… → `REGISTRO.md` L16545
- **18/10/2026** — o vocabulário escolhe em lista, e cada nome diz as suas… → `REGISTRO.md` L16606
- **18/10/2026** — o cancelar chega à curadoria, a turma perde dois campos, e… → `REGISTRO.md` L16661
- **18/10/2026** — o formulário recolhe para uma faixa, e a listagem ocupa a… → `REGISTRO.md` L16716
- **18/10/2026** — o nome do professor na curadoria abre o plano de ensino dele → `REGISTRO.md` L16763
- **18/10/2026** — a faixa dos passos numa linha só, com a seta no fim → `REGISTRO.md` L16801
- **18/10/2026** — a etiqueta é uma só, e o que está no ar é o motor → `REGISTRO.md` L16844
- **18/10/2026** — a dobra do índice da página, no celular → `REGISTRO.md` L16921
- **18/10/2026** — a C15 foi decidida: a preferência de aparência é da escola → `REGISTRO.md` L17074
- **18/10/2026** — A aparência passou a ser da escola, e o servidor aplica-a → `REGISTRO.md` L17140
- **18/10/2026** — O catálogo das peças: um nome antes do desenho → `REGISTRO.md` L17229
- **18/10/2026** — A segunda família: a Cortina Turquesa, medida antes de… → `REGISTRO.md` L17319
- **18/10/2026** — O cabeçalho do ato cresce, e o «Fechar» deixa de descontar → `REGISTRO.md` L17408
- **18/10/2026** — O cabeçalho do ato cabe em 360px, e a barra de botões vira… → `REGISTRO.md` L17481
- **18/10/2026** — Correção: o resumo da faixa desce, e a lista não mente… → `REGISTRO.md` L17576
- **18/10/2026** — Regra: medir na bancada, e o ar só na conferência final → `REGISTRO.md` L17642
- **18/10/2026** — O catálogo de paletas fecha em três: a Verde de Ensaio… → `REGISTRO.md` L17699
- **18/10/2026** — A família da escola chega a tudo o que ela serve, e a lista… → `REGISTRO.md` L17782
- **18/10/2026** — As outras quatro secções recolhem, e a listagem fica com a… → `REGISTRO.md` L17857
- **18/10/2026** — A marca entra na barra e o favicon existe: a cor vem do… → `REGISTRO.md` L17937
- **18/10/2026** — O gerador diz o que falta: a guarda do DOCS, o… → `REGISTRO.md` L18089
- **18/10/2026** — Por que o CI não ficava verde: o plano nunca preenchia o… → `REGISTRO.md` L18158
- **18/10/2026** — O token vive em quatro lugares, e só um foi trocado → `REGISTRO.md` L18228
- **19/10/2026** — A turma manda no ritmo: o `.conf` da variante passa a ser… → `REGISTRO.md` L18274
- **19/10/2026** — O expurgo não mente: «sobraram 1» era a listagem a chegar… → `REGISTRO.md` L18383
- **19/10/2026** — A geração deixa de ser muda: a tela passa a dizer o que… → `REGISTRO.md` L18438
- **19/10/2026** — As escolas de teste passam a ter nome de palavra: Calango,… → `REGISTRO.md` L18516
- **19/10/2026** — O repertório é da turma: sai do formulário da curadoria → `REGISTRO.md` L18557
- **19/10/2026** — O expurgo errou para os dois lados: a leitura passa a ser a… → `REGISTRO.md` L18611
- **19/10/2026** — O disparo manda dois slugs: o conteúdo é da variante, o… → `REGISTRO.md` L18679
- **19/10/2026** — O `.fipp` não se escolhe: em conflito, regera-se → `REGISTRO.md` L18747
- **19/10/2026** — Sem escola no repositório, o `Reancorar` não falha → `REGISTRO.md` L18796
- **19/10/2026** — O `criar-escola` também perde a corrida do `push` → `REGISTRO.md` L18833
- **19/10/2026** — A correcção da âncora ficou num workflow só — e o commit… → `REGISTRO.md` L18884
- **19/10/2026** — A lista que falhava sem dizer porquê: `kv.list` tem cota, e… → `REGISTRO.md` L18942
- **19/10/2026** — Todo pacote gerado nascia divergente da porta: a barra e a… → `REGISTRO.md` L18994
- **20/10/2026** — O PO abre sem plano e com o checklist em branco: a lista… → `REGISTRO.md` L19037
- **20/10/2026** — O expurgo apagou a escola e deixou o dado: a limpeza do KV… → `REGISTRO.md` L19120
- **20/10/2026** — A cota do KV: o que ia para lá sem precisar, medido → `REGISTRO.md` L19203
- **20/10/2026** — A anamnese nunca ia para o Git: ela vivia só no KV → `REGISTRO.md` L19267
- **20/10/2026** — a lista não paga o que não mostra (fase 2 da dependência do… → `REGISTRO.md` L19350
- **20/10/2026** — o envelope sai do KV: o acervo passa a ser o armazenamento… → `REGISTRO.md` L19424
- **20/10/2026** — o índice do acervo: cada pergunta deixa de ser uma… → `REGISTRO.md` L19512
- **20/10/2026** — dois `list` a menos: o cartão da geração e o cadastro no… → `REGISTRO.md` L19594
- **20/10/2026** — o índice diz o mesmo nos dois níveis, e a âncora tem três… → `REGISTRO.md` L19656
- **20/10/2026** — a tela mostra o endereço que existe, e diz que o cofre é… → `REGISTRO.md` L19693
- **20/10/2026** — as declarações do índice: o vocabulário deixa de estar… → `REGISTRO.md` L19732
- **20/10/2026** — a anamnese sai do KV, e o cofre deixa de existir → `REGISTRO.md` L19792
- **20/10/2026** — o plano de ensino de teste chega preenchido inteiro, não… → `REGISTRO.md` L19833
- **20/10/2026** — o índice passa a ser gerado, e o «passou» passa a ser medido → `REGISTRO.md` L19885
- **20/10/2026** — a âncora da aula deixa de ficar solta, e o rebase diz a… → `REGISTRO.md` L20016
- **20/10/2026** — o Worker da escola passa a servir o pacote da TURMA, não o… → `REGISTRO.md` L20067
- **20/10/2026** — o expurgo da `breu` foi completo, e o índice ficou a… → `REGISTRO.md` L20102
- **20/10/2026** — o PO da `batata` não gerava o ciclo: a declaração da… → `REGISTRO.md` L20193
- PO de **sapo-bailarino · calango-bale-nivel-1-teste-1** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **sapo-bailarino · ciclo 01:** aulas escritas em detalhe: 1 de 5 (as demais entram depois da aula anterior).

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
