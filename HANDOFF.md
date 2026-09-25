# Handoff — Projeto Ciclo

Gerado em: `2026-09-25T15:32:09-0300`
Commit atual: `f5980c4` — fix(po): o PO ganha o campo `norma` -- o padrão de referência era o seu próprio produto
Para: sessão nova (retomar o diálogo)

## O que é este projeto

**A memória da aula dada** — cada aula é **planejada** antes de ser dada: o plano
(`aula-NN.md`, fonte da âncora) fixa objetivo, marcos e volume, e é ele que dá a
**linha de base**. O que se registra é o processo de ensino-aprendizagem que de fato
se aplicou — **o que mudou em relação ao plano** — e encadeia tudo o que muda.

- **Planejar e registrar são coisas distintas — e as duas acontecem.** O plano é
  **intenção** (editável enquanto a aula não foi dada); a partir da declaração
  "aula dada", o registro passa a **fato** e só se acrescenta ajuste
  (`ARQUITETURA-AULA.md`). O formulário de lançamento **consome o plano** como
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
- **Professores:** fochini
tiago (2)
- **Ciclos com manifesto:** 3 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-AULA.md`** — o ciclo de vida da aula (planejada → dada → lançada → ajustada), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por aula. Não implementado.
- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto. Não implementado.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — painel de gestão para a direção da escola (aulas dadas, horas trabalhadas, valor-hora, cadeia de custódia, retenção) e a página pública da cadeia para pais e alunos. Não implementado.

## Últimos commits

```
f5980c4 fix(po): o PO ganha o campo `norma` -- o padrão de referência era o seu próprio produto
a8c9472 docs(estrutura): o HANDOFF regerado com os quatro elos da correção
28f340a docs(estrutura): as notas de escopo dos temáticos e os agentes declaram o plano
5de3d3d docs(estrutura): o HANDOFF regerado com a identidade corrigida
8a70634 fix(tools): o HANDOFF emite a identidade corrigida, e o plano entra nela
ca560c4 docs(estrutura): a memória da aula dada deixa de negar o planejamento da aula
bee3cb5 fix(ciclo-01): a harmonização deixa de citar "FIPP", e as âncoras do tiago acompanham
0b92a01 docs(estrutura): os congelados perdem a sigla, e o hash-ciclo declara o que é aproximação
2f0bcea docs(estrutura): a deriva de identidade que ficou fora da primeira correção
01b12d2 feat(caderno): o caderno do Ciclo 01 da Diaghilev entra no repositório
a5e6e7b docs(ideia): a aula como unidade, e o painel da escola como a outra face dela
826d008 chore(estrutura): a varredura de deriva de identidade vira skill, e o REGISTRO ganha instrução
8820adb fix(tools): a seção que só tinha citação é reportada, e o HANDOFF deixa de sair truncado
ea80ad4 fix(tools): o check-pacote passa a reprovar U+FFFD nas saídas
0dbd0af feat(ciclo-01): Ciclo 01 da Diaghilev — fontes e âncora
4462d6a feat(ciclo-01): Ciclo 01 da Diaghilev — quatro aulas desiguais
7accb29 fix(tools): o gerador não herda o locale de quem o chama
12e1a9c docs(estrutura): este projeto e PROTOTIPO, nao e agnostico
3b7aa7c docs(estrutura): a identidade do projeto entra na documentacao (e a ressalva do FIPP)
53bc9c1 chore(estrutura): agentes de workspace em .github/ e AGENTS.md versionado
```

## Por professor

### fochini — 1 ciclo(s)

**Ciclo 01** — variante(s): diaghilev

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Diaghilev | ciclo-01-diaghilev-po.md | Input_PO_Aguardando | 3 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| diaghilev | ciclo-01-diaghilev.fipp | `da0193c1ec0a` | (vazio) | Input_PO_Aguardando |

### tiago — 1 ciclo(s)

**Ciclo 01** — variante(s): duo, ritmos

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Duo | ciclo-01-duo-po.md | Input_PO_Aguardando | 2 |
| Ritmos e Movimento | ciclo-01-ritmos-po.md | Input_PO_Aguardando | 7 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| duo | ciclo-01-duo.fipp | `d359e400f1f5` | (vazio) | Input_PO_Aguardando |
| ritmos | ciclo-01-ritmos.fipp | `938641a34549` | (vazio) | Input_PO_Aguardando |

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
- **P-16 — Metodologia e notação são declaradas na eliciação.
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

## 25/09/2026 — `PROTOCOLO.md`: a tabela do PO passa a nomear o que o schema já exigia

**O que motivou.**
O commit `f5980c4` acrescentou o campo `norma` ao PO e levou o checklist de cinco para seis itens.
`PROTOCOLO.md` descreve, na seção `## Como o PO se materializa no ciclo`, **quais** campos o PO tem e
**quantos** itens o checklist exige. As duas frases ficaram desatualizadas no mesmo instante — e uma
delas já estava errada **antes**: o `:224` omitia `norma`, `linhaDeBase` e `condicoesDeContorno`
desde que esses campos entraram, muito antes deste dia.

A omissão é do tipo que custa caro. Um PO declara a norma; a norma é o **produto** do PO pelo
`po_ref` §6. Se `PROTOCOLO.md` — o documento que define o ciclo — não nomeia o campo, quem lê o
protocolo não sabe que ele existe. É o mesmo defeito que o `REGISTRO.md` já tratou como **defeito,
não detalhe de redação**: quem entrava sem contexto saía com o contexto errado.

**O que foi decidido.**

- **`:224`** passa a nomear os três campos ausentes, na ordem do schema: *"pergunta, fenômeno, campo
  empírico, contexto, sujeitos, **norma**, **linha de base**, critérios de inclusão e exclusão,
  justificativa (4 subcampos), **condições de contorno da execução**, limitações e checklist de
  validação"*.
- **`:229`** deixa de afirmar um número fixo. Em vez de trocar "cinco" por "seis" — o que só adiaria
  o mesmo defeito para a próxima mudança —, a redação passa a apontar para a **fonte**: *"quando
  **todos** os itens de `validationChecklist.required` estiverem marcados — hoje **seis**"*, com os
  seis nomeados. A contagem passa a ser a do **schema**, não a de `PROTOCOLO.md`. Acrescenta também a
  regra que o validador já pratica: item **presente e desmarcado** mantém o estado no aguardo.
- **`justificativa (4 subcampos)` não muda.** Foi medido: `justification` tem exatamente 4 subcampos.
  O texto estava correto e a correção não é varredura cega.
- **Nenhuma reancoragem.** Este é prosa sobre o PO, não fonte de ciclo. Os `professores/**/ciclos/
  ciclo-XX-*.md` não foram tocados, então os três `.fipp` permanecem válidos (`--check` sem
  alteração).

**Por que um commit próprio.**
`PROTOCOLO.md` é **congelado**. O `CONGELAMENTO.md` é explícito: a mudança em congelado *"tem o seu
próprio commit (não vai junto com conteúdo)"*. Por isso ela **não** entrou em `f5980c4`, mesmo sendo
consequência direta dele, e não entra em nenhum commit de conteúdo. É o mesmo desenho de `0b92a01`
(*"os congelados perdem a sigla"*): um motivo declarado, só arquivos congelados, zero conteúdo.

**Onde entrou.**

- `PROTOCOLO.md` (congelado) — as linhas `:224` e `:229` da tabela de `## Como o PO se materializa no
  ciclo`. Nada mais foi tocado no arquivo.
- `REGISTRO.md` — esta entrada.
- `HANDOFF.md` (regerado, porque é gerado e precisa emitir o estado novo).

**O que NÃO foi tocado.**

- `REGRAS.md`, `METODO.md`, `tools/`, `tools/templates/`, `prompts/`,
  `biblioteca/guia-do-professor.md` — congelados, sem motivo para mudar aqui.
- Os três `*-po.md` e os dois `*-po-schema.json` — já corrigidos em `f5980c4`.
- Os três `.fipp` — nenhuma fonte de ciclo mudou.

**Referências.**

- `f5980c4` — o commit que tornou as duas frases falsas.
- `po_ref/po.md` §6 — a norma como produto do PO; é a razão pela qual omitir o campo é grave.
- `CONGELAMENTO.md` — o motivo declarado e o commit próprio.
- `REGISTRO.md` — a entrada `## 25/09/2026 — O campo \`norma\`: …`, do mesmo dia.

## O que está pendente

POs de Ritmos e Débora; primeiro relatório pós-aula; Ciclo 02.

## 18/09/2026 — Estrutura por professor (P-13, P-14) e migração do material

Primeiro relatório pós-aula do Duo; POs de Ritmos e Débora; Ciclo 02; um segundo
professor (a estrutura está pronta, aguardando o primeiro).

## 18/09/2026 — Publicação do repositório no GitHub (decisão da pesquisadora)

Licença do repositório (a definir); o envio para o GitHub, que acontece fora do
repositório, na máquina da pesquisadora.

## 18/09/2026 — Pacotes de ciclo passam a ser versionados (deploy automático)

Configurar o *publish directory* de cada site no Netlify; primeiro deploy de cada escola;
licença do repositório.

## 18/09/2026 — Ciclo próprio por escola: a Ritmos deixa de ser cópia da Duo

- **Publicação (decisão da pesquisadora):** o PO da Ritmos cita os rótulos que o
  professor usou ("Carol, Dafne, Anthony, Airton"), e ele mesmo observa que só "Carol"
  é apelido. Pela **P-12**, os sujeitos entram por apelido estável — os apelidos do
  ciclo estão `[Preencher]` no PO, e **o material não foi enviado ao GitHub** enquanto
  essa decisão não for tomada.
- Preparação de força e flexibilidade da Aula 01, gravação de referência da música,
  marcos das aulas 02–20 e aplicabilidade da Regra 9, etapa 2, a este ciclo — todos
  `[Preencher]` nas fontes, aguardando o professor.
- O manifesto base `ciclo-01.conf` ainda se descreve como "conteúdo compartilhado pelas
  escolas". Não foi corrigido porque alterá-lo invalidaria a âncora da Duo: a limpeza
  fica para quando o ciclo dela for reancorado por outro motivo.

## 18/09/2026 — Ciclo do Ritmos completado (4 de 8 artefatos) + P-15 a P-19

- **Calendário do projeto:** `tools/calendario.py` modela "uma aula por dia de
  aula" (`por_semana = len(DIAS)`). Com 2 dias e 3 aulas, o pacote publica **21
  aulas em 11 semanas** (o correto são 7) e um **volume semanal de 180 tempos** (o
  correto são 270). É mudança de código, fora do escopo das sete etapas — aguarda
  decisão da pesquisadora. **Enquanto isso, o pacote do Ritmos está pronto para
  publicar, mas com o calendário errado.**
- **Pacote do ciclo da Duo:** regenerado pelo template corrigido, ele ganha o rodapé
  derivado de `DOCS` (11 documentos, com os títulos reais). Não foi commitado — o
  ciclo da Duo não se altera sem autorização. A âncora dela não muda em nenhum caso.
- **Plano e Aula 01 do Ritmos:** ainda dizem "20 encontros", "60 e 120 min" e
  "Marcos 02–20"; a Aula 01 tem `volume-total-120` e um trecho sobre "o dia de 120
  minutos" (que deixou de existir). Não entraram no escopo das etapas.
- **P-12 na Aula 01 do Ritmos:** o documento publica o nome "Anthony"; os apelidos
  fixados e os quatro documentos novos usam "Tony".
- **Publicação:** 11 commits locais à frente do `origin/main`. Não houve push: a
  decisão dos apelidos (que era o bloqueio) está tomada, mas o push publicaria o
  nome citado acima. O deploy automático do Netlify continua esperando.
- Ciclo da Débora; primeiro relatório pós-aula do Duo; primeiro relatório pós-aula
  do Ritmos.

## 18/09/2026 — PO do Ritmos validado + P-22

- **A notação não existe ainda.** O documento está publicado como **moldura**, com
  `[Preencher: notação do passo]` em cada célula — quem escreve é o professor (P-15). Sem
  ela, o glossário Benesh fica à frente do registro: o validador avisa, e é esperado.
- **Gravações de referência** de cada pas de deux e o **cruzamento fino** entre os passos
  da Aula 01 e cada número do repertório: `[Preencher]` — ninguém declarou ainda.
- **Os termos entre aspas** no plano e na aula-01 ("execução ruim", "meninos travados")
  continuam crus: citar é diferente de descrever, e a decisão é da pesquisadora.
- **O pacote do ciclo da Duo** (rodapé derivado de `DOCS`) segue gerado e não commitado:
  o ciclo dela não se altera sem autorização.
- Ciclo da Débora; relatórios pós-aula do Duo e do Ritmos.
- **Push:** os commits desta rodada estão prontos e **não foram enviados** — aguardam
  decisão da pesquisadora.

## 18/09/2026 — Publicação, primeira reancoragem da Duo e o caderno da Aula 01

Ciclo da Débora; notação do Ritmos (depende do professor); gravações de referência e o
cruzamento fino entre passos e números (Ritmos); primeiro relatório pós-aula do Ritmos
(após 19/09); conferir os dois sites no Netlify.

## 19/09/2026 — Congelamento da infraestrutura

Frente de conteúdo: revisão da Aula 01 do Duo (defeito do exercício no chão);
Aula 01 do Ritmos (19/09); caderno + relatório do Ritmos; Aula 02 do Duo.
E uma inconsistência declarada, para decisão da pesquisadora: a harmonização do
Verificação no navegador (a pesquisadora testa: senha certa abre, errada não);
decisão sobre o PDF e os `.md` de acompanhamento; a linha residual do plano do
Ritmos.

## 19/09/2026 — Política de segurança dos dados sensíveis

A camada 1 (repositório privado) é ação manual da pesquisadora, no GitHub. O
push aguarda: só depois de a segurança estar fechada. A publicação do caderno no
pacote é a etapa seguinte.

## 19/09/2026 — Caderno publicado e incluído no hash

Repositório privado (ação manual da pesquisadora — pendente). O caderno **não** é
listado no índice: o índice cobre os documentos pedagógicos, e o caderno e os
acompanhamentos por aluna aparecem no menu, no grupo "Acompanhamento".

## 19/09/2026 — Método, README-ciclos e campos de duração

O push (aguardando confirmação da pesquisadora). E dois pontos de defasagem no
`README-ciclos.md` que **não** são números e ficaram fora do escopo desta rodada,
declarados para decisão: a tabela "Escopos" lista 10 dos ~24 escopos que o hook
`commit-msg` aceita (é a tabela que faz alguém errar o escopo do commit), e o
bloco "Criar um ciclo novo" traz caminhos e comandos que não existem mais.

## 19/09/2026 — README-ciclos: escopos e criação de ciclo

O push (aguardando confirmação da pesquisadora).

## 19/09/2026 — Correções cosméticas

O push — agora é o único item aberto da infraestrutura.

## 19/09/2026 — Varredura de marcas de indecisão

O push.

## 19/09/2026 — METODO no pacote e reorganização do menu

O experimento `captura-json` (em andamento).

* **O deploy** — o pacote regenerado **não** foi publicado; o deploy é do dono.
* O **relatório** continua escrito à mão; a geração sob demanda é a ideia do `captura-json` (não implementada).
* O **guia** também continua escrito à mão: ele **já é** derivado de PO + Aula no conteúdo, mas quem o
  escreve é a pesquisadora — a geração sob demanda não está implementada.

- Os dois POs **não** foram reescritos: os avisos apontam o que falta em cada um, e nenhum aviso
  reprova commit nem validação.
- O **extrator do plano** (o irmão) — próximo passo. Ele depende deste contrato, e o
  `plano-01.json` escrito à mão **não é uma extração: é uma leitura** (chaves renomeadas, coluna
  descartada, valores convertidos, e o calendário que não está no `.md`).
- O contrato vive **dentro** de `validar-po-ciclo.js`: para o irmão compartilhar o mesmo contrato —
  e não divergir, como os dois resolvedores de fonte que geraram o `lib-fontes.sh` — ele terá de
  sair para uma lib.

- **Não houve conferência visual** — não há navegador nesta máquina. A regra foi escrita
  para não depender de nada além da largura, e o comportamento em tela estreita é
  exatamente o de antes; a conferência visual é do dono.
- O **deploy** do pacote regerado é do dono.

- O **extrator do plano** (o irmão) — próximo passo.
- O **mapa de colunas** (cabeçalho da tabela → chave do alvo) e a regra de **tabela item/valor →
  objeto**: são as duas DECLARAÇÕES que ainda não existem.
- O contrato da lib ainda não é exercitado por um teste próprio: hoje quem o prova são os dois POs
  (e, de agora em diante, também o plano).

- O **irmão** (o extrator do plano) e o **schema do plano** — próximo passo.
- As **conversões de valor** (`"60 minutos (Pré-requisito 4)"` → `60`; `"01"` → `1`) e as
  diferenças de **tipografia** (`17/09/2026` × `2026-09-17`; travessão `–` × `-`): declará-las
  exigiria regras de leitura, e a decisão foi **não ler prosa**.

- Nada no fluxo de produção consome o extrator do plano: quem gera o guia e a musicalidade hoje é
  o experimento `captura-json`. Ligar isso é o passo seguinte.
- As conversões (número, data ISO) e a limpeza da prosa que fica nos arrays ficam **fora, por
  decisão**: converter é ler.
- O schema do plano **não** está no pre-commit: o plano ainda não é validado automaticamente.

- A lib **não tem teste próprio**: quem a prova são os documentos e a captura.
- O que os documentos **não** exercitam (a frase do array vazio, `lacunas`, `extras`) foi
  conferido por chamada direta à lib, e não por um caso da captura.

- O plano do **Ciclo 02** (e o da Débora) não existe ainda: o hook simplesmente não valida.
- O aviso das lacunas só aparece no `git commit` de verdade (dentro do hook): não há um `--check`
  avulso que o mostre.

- As **conversões** (número, data ISO) e a limpeza da prosa que fica dentro dos arrays: fora, por
  decisão.
- O `phenomenon` como prosa dá **um** item no guia, onde a leitura à mão dava quatro: para voltar a
  quatro, a FONTE precisa listar os observáveis (e o schema declará-los como array).
- Nada disso está no fluxo de produção: quem gera ainda é o experimento.

- A extração é por LINHA e não preserva a indentação: a pontuação é a pista que resta. Guardá-la no
  contrato é a alternativa estrutural — e mexeria em todo o texto extraído (é uma decisão maior).
- As conversões (número, data ISO) continuam fora, por decisão.

- A tabela "Escopos" do **`REGRAS.md`** (Regra 17 em prática) **continua listando 10** escopos,
  enquanto o hook aceita 27. É a defasagem que o `HANDOFF.md` declarou (e que uma entrada anterior
  deste REGISTRO deu por corrigida — o que foi corrigido foi o `README-ciclos.md`, não o
  `REGRAS.md`). `REGRAS.md` é congelado: corrigir exige commit próprio, com motivo declarado. Fica
  proposto, não feito.

- Nada impede a defasagem de voltar: os dois espelhos são **texto**, e ninguém os compara. Um teste
  que confrontasse o regex com a documentação seria a garantia — o `pre-commit` não olha para isso.

- O JSON da **Ritmos** (Duo primeiro, por decisão) e o primeiro lançamento real.
- As **vistas ainda não saíram da cobertura** — convivem com o JSON até a peça 4, e é o que o
  comentário no `fontes_do_ciclo()` declara.
- O **gerador ainda não lê o JSON** (peça 3) e os **builders ainda vivem no experimento** (peça 2).

- O formulário **ainda tem as suas cópias** (a Fase 2 as remove e passa a consumir a lib): até lá há
  duplicação **temporária e declarada**.
- O `gerar-ciclo.sh` **não lê o JSON** ainda — é a peça 3.
- O `comoLista` do formulário ficou **sem uso** (código morto de uma rodada anterior): sai na Fase 2.

- O guia gerado **não traz** três coisas que só existiam no escrito à mão: a nota "este documento não é o
  relatório / onde ele está", a **data da aula** e o checklist "o que preencher depois" — este último,
  por desenho (quem preenche é o formulário). Os dois primeiros são bloco fixo + dado do calendário;
  **não foram inventados** — é decisão de quem escreve o guia.
- As outras vistas (caderno, relatório, acompanhamento) **não** são geradas pelo pacote: elas derivam do
  JSON de dados, que ainda está vazio (peça 1) e é alimentado pelo formulário.
- §7.2, §7.4, §7.5 e §7.6 seguem em aberto — nenhuma bloqueia.

- A nota *"este documento não é o relatório"* **não volta** no guia gerado (decisão da
  pesquisadora, 20/09).
- A peça 5 — migrar o guia do Ritmos (Fase 2).

- O **extrator não leva blockquotes** (`> **Nota …**`): o PO do Ritmos tem 3 e o do Duo 2, e nenhuma
  chega ao JSON — a nota P-22 está no documento e não na extração. É pré-existente e **não** foi
  mexido aqui (mudaria o que todos os balanços veem); fica declarado.
- A peça 5 — o guia do Ritmos gerado — segue na Fase 2, com a tabela do PO e a estrutura do plano.

Hook `PreToolUse` para o auditor. Fica declarado que o `REGISTRO.md` apareceu no worktree em
variante divergente (15 entradas duplicadas e arquivo truncado) e foi restaurado do commit
anterior antes desta entrada — nenhuma daquelas reescritas foi aproveitada.

## 23/09/2026 — A identidade do projeto entra na documentação (e a ressalva do FIPP)

O desenho das duas fronteiras — a **entrada** (como o PO chega: hoje é um `.md` copiado à mão)
e a **saída** (o módulo de avaliação, que derivaria da cadeia de custódia em vez de aproximar
questões do plano). A porta de entrada na tela (modo IA × modo formulário) também segue por
fazer.

## 23/09/2026 — A varredura da deriva de identidade: o que ficou fora da primeira correção

Os pacotes (HTML + PDF) dos dois ciclos **não** foram regerados, e portanto as páginas publicadas
ainda trazem "hash FIPP". Regerar exige `tools/gerar-ciclo.sh` e novo deploy — deixado para
quando o professor pedir. Fica também por fazer o desenho das fronteiras de entrada e saída, acima.

## 23/09/2026 — A seção que só tinha citação, e o ciclo simulado da Diaghilev

Os **dois achados acima não foram corrigidos** — mudam comportamento em `tools/` (congelado) e a
decisão é da pesquisadora: (a) o config da captura passar a ser **por aula**; (b) o mapa de
apelidos sair da parte cifrada (ou a página decifrar quando a aula ainda não tem dado). Os
pacotes dos ciclos anteriores **não** foram regerados. A porta de entrada na tela (modo IA × modo
formulário) segue por fazer, como acima.

## 23/09/2026 — O gerador não herda mais o locale de quem o chama

- Os demais pontos de entrada que escrevem texto (`gerar-acompanhamento.sh`, `gerar-handoff.sh`,
  `gerar-vista.js`, `calendario.py`, `cifrar-dados.js`) **não** foram tocados: quando chamados
  pelo `gerar-ciclo.sh` herdam o locale corrigido, mas **invocados isoladamente** continuam
  dependendo do ambiente. Declarado, não resolvido.
- O ciclo da Diaghilev **ainda não foi commitado** — e é o commit seguinte a este.

- O `check-pacote.js` passa a **procurar U+FFFD** nas saídas (HTML, CSS, JSON, Markdown) e
  **reprova**. Foi a lacuna que deixou o defeito chegar ao `pdflatex`: o pacote corrompido
  passava com **0 erro(s)**, 528 links internos e 31 páginas.

> **Correção de 23/09/2026 (mesmo dia).** A primeira redação desta entrada dizia que "o pacote
> corrompido passava com 0 erro(s), 528 links internos e 31 páginas". **Está errado**: aquela
> medição — 0 erro(s), 528 links, 31 páginas — foi feita sobre um pacote **saudável**, gerado sob
> o locale do terminal; não mediu o pacote corrompido. O que se mediu no estado corrompido foi o
> contrário: o `check-pacote` **reprovou**, com 1 erro — `PDF: documentos ausentes no texto do
> PDF`, nomeando Caderno, Guia de observação e Método. A lacuna continua a existir (o check não
> procura U+FFFD, e se o PDF fosse regerado — impossível, o `pdflatex` morre antes — os dois lados
> estariam corrompidos e **coincidiriam**); mas o guarda existente **não** passou em silêncio. A
> versão anterior não é apagada: fica como o elo que registra o que se pensou antes da correção.

## 25/09/2026 — O HANDOFF truncado: o glob que abortava a geração em silêncio

O `HANDOFF.md` regerado passa a listar o **fochini** (que a versão anterior não via) e a trazer as
âncoras atuais — mas continua sendo saída gerada: nunca se edita à mão, corrige-se o gerador. As
O **planejamento da aula ainda não tem todos os campos de que precisa** — o próprio
`experimentos/captura-json/RELATORIO.md` §4.6 declara a lacuna: **falta a estrutura executada** (que
viria do plano da aula e o JSON não carrega), o volume em tempos, o que foi abandonado, a linha de
base. E `ciclo-01-plano-schema.json` declara a sua própria: *"o calendário **NÃO** está no `.md`"*, e
os tipos do schema são os que **o documento oferece**, não os que o dado ideal teria. Corrigir a
redação **não** fecha essa lacuna — apenas deixa de negar a etapa que a tem. A ordem que o
repositório já registrou (`RELATORIO.md` §4.5) permanece: decidir onde o JSON vive, medir o custo do
hash-como-fonte, **escrever o validador do `dados.json`**, e só então um ciclo-piloto.

---

## 25/09/2026 — O campo `norma`: o PO ganha o padrão de referência que era o seu próprio produto


- **`PROTOCOLO.md:224` e `:229` estão desatualizados e não foram tocados aqui.** O `:224` lista os
  campos do PO e omite `norma`, `linhaDeBase` e `condicoesDeContorno` — a omissão é **anterior** a
  este campo; o `:229` diz *"os cinco itens do checklist"*, e agora são **seis**. Vão para um
  **commit próprio**, congelado, com o seu próprio motivo declarado. No mesmo `:224`,
  *"justificativa (4 subcampos)"* está **correto** (medido) e **não** muda.
- **A norma continua em `[Preencher]` nos três ciclos.** O campo existe; o conteúdo não. Quem o
  preenche é a **entrevista**, e ela ainda não foi reescrita — a próxima etapa é a versão amigável em
  `prompts/eliciar-ciclo.md`.
- O item `normClearlyEstablished` fica **desmarcado** até a norma ser elicitada; só então o `state`
  volta a `Input_PO_Validado`.
- **Pendência de forma em `ciclo-01-duo-po.md`:** o bloco `linha de base` tem **duas** tabelas; o
  extrator descarta a segunda e ainda assim sai com `exit=0` (2 avisos). Fica como dívida declarada,
  **não** corrigida neste commit.
---

## 25/09/2026 — `PROTOCOLO.md`: a tabela do PO passa a nomear o que o schema já exigia

- PO de **fochini · diaghilev** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **fochini · ciclo 01:** aulas escritas em detalhe: 4 de 4 (as demais entram depois da aula anterior).
- Material de campo de **fochini**: 0 evento(s) versionado(s).
- PO de **tiago · duo** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- PO de **tiago · ritmos** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **tiago · ciclo 01:** aulas escritas em detalhe: 2 de 12 (as demais entram depois da aula anterior).
- Material de campo de **tiago**: 2 evento(s) versionado(s) — sem respostas digitadas: 2026-10-03-ritmos.

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
3. `REGISTRO.md`;
4. o PO do ciclo ativo.

Isso é suficiente para retomar o diálogo sem reconstruir contexto.
