# Handoff — Projeto Ciclo

Gerado em: `2026-10-13T21:20:40-0300`
Commit atual: `388e73c` — chore(entrega): absorver o volteio do gerador (cifra e instante), sem re-rodar o hook
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
- **Professores:** leticia
tiago (2)
- **Ciclos com manifesto:** 2 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-ANAMNESE.md`** — Desenho da malha de anamnese de balé clássico como **conteúdo do PO** — a **observação inicial** dos seis elementos basilares, os **nove blocos fixos** da ficha, os **dois módulos condicionais** (validação de nível prévio e contexto de origem) e as **três dimensões** da linha de base (Técnica, Funcional, Musicalidade) —, seguida da **malha de domínios declarados** (alinhamento ósseo, flexibilidade passiva, força ativa e potência, sistema vestibular, orientação espacial e lateralidade), com **ramificação condicional** pelo nível declarado (Básico, Intermediário, Avançado) e **soberania de CRUD autoral** do professor, fechando na **conclusão** — o campo **«Resultado da avaliação»** (apta/não apta + nível, sem turma/horário/frequência) — o **recipiente** é do PE, o **conteúdo** é do PO.
- **`ARQUITETURA-AULA.md`** — o ciclo de vida da aula (planejada → dada → lançada, mais a **não dada**), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por aula. O **estado derivado** (`B6`) e o **ajuste no plano** (`B8`) estão implementados; o resto, não.
- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto.
- **`ARQUITETURA-GERAL.md`** — Arquitetura geral — por que sistema de arquivos, e não um backend com banco
- **`ARQUITETURA-PE.md`** — Especificação da arquitetura de integração entre o repositório atual (implementação do PO) e o repositório separado **"dança e elicitação"** (módulo PE), utilizando descoberta por variável de ambiente (`.env`) e degradação graciosa.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — o Bastidores é o ambiente da direção da escola: um grupo de menu com duas vistas — o Estúdio de Dança (que a direção partilha com o professor) e a Produção (só da direção) —, regido pelo princípio cena × bastidores, pela regra da reverberação (o que a escola declara desce para os documentos da cena) e pela proveniência própria da escola. Não implementado.

## Últimos commits

```
388e73c chore(entrega): absorver o volteio do gerador (cifra e instante), sem re-rodar o hook
60662dd docs(estrutura): FRENTES.md — B7 fechado e B5 resolvido (o bloqueio era fantasma); HANDOFF em dia
f732000 docs(registro): a grelha das tabelas fecha o B7 e remede o B5 — o bloqueio era fantasma
ed21f97 chore(entrega): regenerar o pacote maria — o pre-commit rodou o gerador
b1076d5 feat(campo): a grelha das tabelas — a rubrica em clicável, turmas plural e checklist pré-preenchido (B7), e a derivação do volume (B5)
643edc4 docs(registro): a Produção quebrou pelo `env` fora de escopo — correção do Error 1101
1a2b9c7 fix(estrutura): a Produção não quebra mais — o slug do dono entra como parâmetro, não via env
b25fda9 docs(estrutura): FRENTES.md — B2 fechado (consumo da curadoria) e panorama das frentes em dia
2b29e9f docs(registro): o consumo da curadoria trava plano/PO e filtra as alunas (B2b)
4b01050 feat(estrutura): a tela consome a curadoria — plano/PO travam sem curadoria e a anamnese filtra as alunas
87308c8 docs(estrutura): FRENTES.md — L5 ligado (metodologia/notação → PO)
520bc20 docs(registro): metodologia e notação chegam ao PO (ligar L5 — Bloco 8.2)
3410db9 feat(po): ligar metodologia e notação do plano ao PO
474c884 docs(estrutura): FRENTES.md — B1 pronto, B3 base migrada, B2 em andamento
9fb1dfb docs(registro): a curadoria nasce (B1) — atribuição por professor que pré-carrega os formulários
f8d367e feat(estrutura): a curadoria nasce — a escola atribui a cada professor o que pré-carrega os formulários
b2dccb3 docs(registro): a base canónica do catálogo migra para biblioteca/modalidades (B3)
14bfb2e feat(biblioteca): a base canónica do catálogo migra para biblioteca/modalidades
f275bca docs(estrutura): versiona o panorama das frentes e o laudo do Bloco 1 em FRENTES.md
41df2a2 docs(estrutura): corrige a norma §12 do painel e regenera o HANDOFF
```

## Por professor

### leticia — 1 ciclo(s)

**Ciclo 01** — variante(s): barra

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| barra | (sem PO) | — | — |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| barra | ciclo-01-barra.fipp | `70f3f0635164` | (vazio) | — |

### tiago — 1 ciclo(s)

**Ciclo 01** — variante(s): maria

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| maria | ciclo-01-maria-po.md | Input_PO_Aguardando | 1 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| maria | ciclo-01-maria.fipp | `c6f3ebdd0134` | (vazio) | Input_PO_Aguardando |

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

## 13/10/2026 — A grelha das tabelas: a rubrica, as turmas em plural, o checklist pré-preenchido (B7) e o `[Preencher]` do volume (B5)

**O que motivou.** Duas frentes do `FRENTES.md` estavam presas na mesma peça — a porta do plano:

1. **B7** (Bloco 4 do pedido, aberto desde que B2 o desbloqueou): três defeitos do PO/plano medidos
   no uso — (a) o plano só aceitava **uma** turma observada, embora um professor possa observar
   mais de uma no mesmo ciclo; (b) o **checklist** de validação obrigava o professor a marcar à mão
   os **seis** critérios, mesmo quando cinco já estavam respondidos pelo que ele declarara antes;
   (c) a **rubrica** (critério × quatro níveis) era digitada com barras, e saía **partida**: a
   Maria escreveu «Tandu - bom, razoável, precisa melhorar» e a tabela de cinco colunas publicou
   **uma célula só** por linha.
2. **B5**: o mesmo defeito de forma na «Distribuição do volume» do plano — e, na Aula 01, a tabela
   `| Bloco | Tempos | Fatia |` saía com `[Preencher]` em **todas** as linhas.

**O que foi decidido.** Uma peça nova — a **grelha** — resolve os dois, e uma medição desfaz o
bloqueio do B5:

- **A GRELHA.** O conteúdo de um nó declara `tabela: {colunas, minimo}`; a porta desenha a tabela
  com um campo por célula, «Adicionar linha» e «✕» para remover — e o que se grava é um **array de
  objetos**, um por linha, com a chave de cada coluna. É a forma que o **schema já exigia**
  (`{type:'array', items:{type:'object'}}`) e que a porta nunca produzia: ela produzia texto com
  barras. Sem barras, uma linha **não se pode partir**.
- **A rubrica** e a **distribuição do volume** passam a declarar as suas colunas. O caminho legado
  (a linha única com `|`) continua a valer na derivação — não se quebra o que já está gravado.
- **A derivação ligada (B5).** A Aula 01 deixa de escrever `[Preencher]` à mão: a **Fatia** é a
  proporção **declarada** no plano (verbatim) e os **Tempos** são a sua aritmética com o
  volume-alvo (proporção × total ÷ 100), casando o bloco pelo **nome curto** (antes do separador).
  O produto é **exacto** para as partes fecharem no total: 15 %·90 + 35 %·90 + 50 %·90 = 13,5 + 31,5
  + 45 = **90**.
- **Nada se inventa (P-16).** Sem percentagem numérica («um terço»), a Fatia sai como declarada e os
  Tempos ficam **lacuna**; sem bloco correspondente, ambas as células ficam lacuna. Ler prosa não é
  derivar — a mesma regra que o schema já declara para esta tabela.
- **O bloqueio do B5 era fantasma.** A frente esperava «o JSON do envelope vivo (Maria/KV)». Os
  envelopes **não existem**: `/api/envelopes`, `/api/planos`, `/api/anamnese-estados` e
  `/api/plano-estados` devolvem vazio nas duas escolas — a KV não tem um único envelope. E não
  fariam falta: o `[Preencher]` era **literal** em `derivar-ciclo.js`, não um defeito de
  mapeamento. A derivação é que nunca tinha sido ligada.
- **B7 fecha.** Os três itens estão feitos: turmas em plural, checklist pré-preenchido e a rubrica
  em grelha clicável. A «rubrica clicável» do pedido é a rubrica **do plano** — o checklist do PO
  já era clicável (rádios `sim`/`não`), e não havia nada a fazer aí.

**Onde entrou.** `motor/nucleo/derivar-po.js` — a inferência do checklist (`inferirFolha` /
`folhaDoChecklist`), a composição plural (`comporTurmas`) e a remoção do `booleanoDoChecklist`,
que ficou sem uso · `motor/nucleo/derivar-plano-ciclo.js` — a tabela de contexto escreve «Turmas»
(o plano aceita mais de uma), e `tabelaDeLista` passa a ler o **array de objetos** da grelha, com
as colunas vindas do próprio dado · `motor/nucleo/derivar-ciclo.js` — `nomeDoBloco`,
`percentagemDaProporcao`, `numeroEmPortugues` e `distribuicaoDoTempo` (a Fatia e os Tempos da
Aula 01) · `porta/index.html` — `grelhaDaTabela`, `lerGrelha`, `mudarLinhasDaGrelha`, o ramo de
render e o de leitura, o CSS da grelha e a delegação dos botões · `porta/po/conteudo/po.json` e
`porta/plano/conteudo/plano.json` — o conteúdo (as folhas derivadas do checklist; a rubrica e o
volume com as suas colunas). No `po.json` a alteração substantiva são **12 linhas**; o arquivo
vinha com **1 espaço por nível** de indentação e voltou aos **2 espaços por nível** da convenção
(o `json.dumps(…, indent=2)` reproduz o `HEAD` byte a byte). Sem isso, o commit carregaria ~1 750
linhas de ruído por arquivo, em três arquivos.

**Com o quê.** `motor/nucleo/derivar-po.js`, `motor/nucleo/derivar-plano-ciclo.js`,
`motor/nucleo/derivar-ciclo.js`, `porta/index.html`, `porta/po/conteudo/po.json`,
`porta/plano/conteudo/plano.json` e os **espelhos** de cada escola (porta → pacote, a convenção do
repositório, que preserva a navegação própria de cada variante):
`professores/leticia/ciclos/ciclo-01-barra/plano-observacao/` e
`professores/tiago/ciclos/ciclo-01-maria/plano-observacao/`.

**Referências.** B5 e B7 de `FRENTES.md` · `IDEIA-PAINEL-ESCOLA.md` (Bloco 8 · checklist —
«derivado do próprio preenchimento, não vem de fora») · Regra 9 (volume) e Regra 10 (rubrica) ·
P-16 (declarado, nunca deduzido) · o elo textual congelado `prompts/elicitar-ciclo.md` · o schema
do plano, que já declarava estas duas tabelas como array de objetos.

**O que ainda não está feito.** Os artefatos **derivados** só se reescrevem no próximo «Guardar»
(é o Worker que os escreve): o `ciclo-01-maria-po.md` ainda diz «Turma:», singular, e o
`ciclo-01-maria-aula-01.md` ainda mostra `[Preencher]` na tabela do tempo. Não se editam à mão —
são saídas. As proporções **legadas** (gravadas como texto com barras) continuam sem derivar: o
caminho legado não se converte, para não ler prosa. A âncora de proveniência **não** mudou — o
`.fipp` cobre os `.conf` e os `.md`, não a porta: `barra 70f3f063…` e `maria c6f3ebdd…`,
reconferidas com `--check`. Fica por decidir, com a pesquisadora, a lista dos **níveis da rubrica**:
o conteúdo declara `Insatisfatório · Em desenvolvimento · Satisfatório · Excelente`, e a prática
escreveu «bom, razoável, precisa melhorar» — a mesma ambiguidade que o Bloco 10 já tinha levantado.

**Correção de 13/10/2026 (mesmo dia).** O parágrafo acima diz que «os artefatos derivados só se
reescrevem no próximo «Guardar»». **Está pela metade**, e a metade que falta é a que importa: nem
todos se reescrevem.

- O **`-po.md`** (e o `-plano.md`) **reescrevem-se**: `escreverPO` lê o `sha` e faz `PUT`
  (`motor/servidor/escrever-po.js`), de modo que o próximo «Guardar» publica a versão nova.
- As **fontes derivadas do ciclo** (`-aula-01.md`, `-referencias.md`, `-captura-aula-01.md`,
  `-harmonizacao.md`, `-dados.json`) **NÃO se reescrevem**: o passo 3 de
  `motor/servidor/escrever-ciclo.js` escreve **só o que ainda não existe** — se o arquivo está lá,
  entra em `puladas` e o `continue` salta-o. É o «a proveniência acrescenta, não edita» (P-03/P-04)
  aplicado à letra.

**Consequência, para quem retomar.** O `[Preencher]` do `ciclo-01-maria-aula-01.md` **não se
corrige sozinho**: a aula já existe, logo nunca será regenerada. A derivação da Fatia/Tempos
(`distribuicaoDoTempo`) vale para as aulas **novas** — e, para rever a da Maria, seria preciso
apagar a fonte primeiro, o que é reescrever o passado. O `-po.md` da Maria, esse, corrige-se no
próximo «Guardar».

**E o que falta para tudo isto chegar à produção.** O Worker empacota o `motor/` inteiro
(`workers/principal.js` → esbuild sobre os `require`) e lê o conteúdo (`po.json`, `plano.json`) do
`env.ASSETS` — **ambos fotografados no deploy**. Não há workflow que faça deploy das escolas
existentes (os três de `.github/workflows/` são `workflow_dispatch` para criar escola, gerar ciclo
e reancorar), pelo que o caminho é o manual: `npx wrangler deploy -c wrangler.<escola>.jsonc`, uma
vez por escola. Os segredos persistem no Worker — o deploy troca só o código. **Enquanto não houver
redeploy, a produção continua a escrever o PO à moda antiga**: sem inferência, com
`obrigatorio:true` nas seis folhas e «Turma:», singular.

## O que está pendente

## 13/10/2026 — A curadoria nasce: a escola atribui a cada professor o que pré-carrega os formulários (B1)

O **consumo** (B2): fazer a anamnese, o plano e o PO **lerem** a
curadoria do professor e pré-carregarem turma/repertório/alunas. É a frente seguinte. A
modalidade/tradição ainda não **filtram** os blocos da anamnese (isso é B6, reescrita de conteúdo).

## 13/10/2026 — Metodologia e notação chegam ao PO (ligar L5 — Bloco 8.2)

O resto da integração (B2): fazer a anamnese, o plano e o PO

## 13/10/2026 — A tela consome a curadoria: plano/PO travam sem curadoria e a anamnese filtra as alunas (B2b)

A curadoria ainda não **filtra os blocos** da anamnese (isso é
B6, reescrita de conteúdo por modalidade). O `ESCOLA.conf` (que aposenta o «Carregar catálogo
inicial» e declara modalidades/tradições/turmas da escola) segue como peça própria. B7 (Bloco 4
do PO) é a frente seguinte, agora desbloqueada.

## 13/10/2026 — Bastidores quebrou: a página da Produção referia `env` fora do escopo (correção)

B7 (Bloco 4 do PO) — a frente seguinte, já desbloqueada por B2.

## 13/10/2026 — A grelha das tabelas: a rubrica, as turmas em plural, o checklist pré-preenchido (B7) e o `[Preencher]` do volume (B5)

Os artefatos **derivados** só se reescrevem no próximo «Guardar»
(é o Worker que os escreve): o `ciclo-01-maria-po.md` ainda diz «Turma:», singular, e o
`ciclo-01-maria-aula-01.md` ainda mostra `[Preencher]` na tabela do tempo. Não se editam à mão —
são saídas. As proporções **legadas** (gravadas como texto com barras) continuam sem derivar: o
caminho legado não se converte, para não ler prosa. A âncora de proveniência **não** mudou — o
`.fipp` cobre os `.conf` e os `.md`, não a porta: `barra 70f3f063…` e `maria c6f3ebdd…`,
reconferidas com `--check`. Fica por decidir, com a pesquisadora, a lista dos **níveis da rubrica**:
o conteúdo declara `Insatisfatório · Em desenvolvimento · Satisfatório · Excelente`, e a prática
escreveu «bom, razoável, precisa melhorar» — a mesma ambiguidade que o Bloco 10 já tinha levantado.

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
- **11/10/2026** — Atalhos da porta na página de entrada e aprofundamento do… → `REGISTRO.md` L9509
- **11/10/2026** — URLs próprias para a Anamnese e o Plano de Observação → `REGISTRO.md` L9563
- **11/10/2026** — As sete mudanças de comportamento e a proveniência… → `REGISTRO.md` L9605
- **11/10/2026** — Ordem alfabética nos menus e rótulo da harmonização → `REGISTRO.md` L9681
- **12/10/2026** — O «Nós, Por Exemplo» passa a ter fonte única e a raiz… → `REGISTRO.md` L9730
- **12/10/2026** — O plano de ensino vira rota própria e o PO passa a puxar… → `REGISTRO.md` L9787
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
- **12/10/2026** — O criar-escola.sh passa a gerar o índice da escola (fecha… → `REGISTRO.md` L10404
- **12/10/2026** — O expurgo ganha a reconciliação worker×slug e o hook… → `REGISTRO.md` L10453
- **12/10/2026** — A senha de criptografia deixa de ser manual: nasce REAL no… → `REGISTRO.md` L10508
- **12/10/2026** — A senha de criptografia nasce no Cloudflare (caminho a): o… → `REGISTRO.md` L10561
- **12/10/2026** — A página «Criar nova escola» passa a subir o motor… → `REGISTRO.md` L10629
- **12/10/2026** — O formulário vira mínimo e o Bastidores vira grupo… → `REGISTRO.md` L10692
- **13/10/2026** — A contaminação entre escolas (o envelope sem escola) é… → `REGISTRO.md` L10756
- **13/10/2026** — O hook deixa o ciclo-zero (scaffold de escola) passar → `REGISTRO.md` L10839
- **13/10/2026** — A Produção exclui aluna e professor (o gabinete se… → `REGISTRO.md` L10870
- **13/10/2026** — O professor é o dono, a Produção pede senha e o… → `REGISTRO.md` L10894
- **13/10/2026** — Bloco 2: o nó 50 não semeia, e «não foi medido» entra… → `REGISTRO.md` L10934
- **13/10/2026** — «Não foi medido» chega aos basilares e às cinco… → `REGISTRO.md` L10964
- **13/10/2026** — A categoria etária é re-derivada da idade; a memória é… → `REGISTRO.md` L10999
- **13/10/2026** — A senha é por professor, e a categoria etária re-deriva… → `REGISTRO.md` L11027
- **13/10/2026** — Cadastro de turmas e vocabulário técnico do balé (com… → `REGISTRO.md` L11066
- **13/10/2026** — Norma revisada: o Bastidores cria e declara (caso a caso);… → `REGISTRO.md` L11114
- **13/10/2026** — A base canónica do catálogo migra para… → `REGISTRO.md` L11152
- **leticia · ciclo 01:** aulas escritas em detalhe: 0 de 5 (as demais entram depois da aula anterior).
- PO de **tiago · maria** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **tiago · ciclo 01:** aulas escritas em detalhe: 1 de 5 (as demais entram depois da aula anterior).
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
