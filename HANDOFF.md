# Handoff — Projeto Ciclo

Gerado em: `2026-09-23T00:18:32-0300`
Commit atual: `3b7aa7c` — docs(estrutura): a identidade do projeto entra na documentacao (e a ressalva do FIPP)
Para: sessão nova (retomar o diálogo)

## O que é este projeto

**A memória da aula dada** — registra o processo de ensino-aprendizagem que de fato
se aplicou, não o que foi planejado, e encadeia tudo o que muda.

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
- **Professores:** tiago (1)
- **Ciclos com manifesto:** 2 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto. Não implementado.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.

## Últimos commits

```
3b7aa7c docs(estrutura): a identidade do projeto entra na documentacao (e a ressalva do FIPP)
53bc9c1 chore(estrutura): agentes de workspace em .github/ e AGENTS.md versionado
8b59555 fix(entrega): a leitura do formulario usa as colunas do ciclo
dd81789 feat(tools): o formulario e as vistas leem as chaves do ciclo (rename)
7670128 feat(tools): o config da captura sai com chave e tipo por coluna
3acf301 feat(ciclo-01): o schema da captura declara a chave e o tipo de cada coluna
5a86b83 feat(prompts): a eliciacao pede os marcos por aula -- o plano ja os le
b122559 feat(tools): a folha de captura vira fonte legivel por maquina (captura-XX.json)
ab2ff84 feat(prompts): a eliciacao pergunta a forma de que a folha de captura precisa
72bde8d fix(entrega): o formulario abre com lancamento gravado, e pede a senha na tela
d54754a feat(ciclo-01): os lancamentos da Aula 01 entram no JSON (e o indice do formulario sai)
61f2c7b docs(registro): a Musicalidade e o Guia de observacao estao marcados (remover)
548660a feat(entrega): marca Musicalidade e Guia de observacao como (remover) no menu
e5c45ae feat(entrega): o formulario de lancamento vai para producao (Area do Professor)
42eb311 feat(tools): o JSON de dados vai para o pacote cifrado (e o check confere)
34cb132 feat(ciclo-01): o JSON de dados do Ritmos entra como fonte (peca 1)
334812c feat(tools): o gerador grava os JSONs de entrada no pacote (po, plano, ciclos)
d57d9a2 feat(tools): o pre-push existe em arquivo -- e confere o alvo certo no acompanhamento
242522e docs(ideia): a peca 5 da migracao esta feita
8ec57ed feat(tools): o guia do Ritmos passa a ser gerado (peca 5 da migracao)
```

## Por professor

### tiago — 1 ciclo(s)

**Ciclo 01** — variante(s): duo, ritmos

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Duo | ciclo-01-duo-po.md | Input_PO_Validado | 0 |
| Ritmos e Movimento | ciclo-01-ritmos-po.md | Input_PO_Validado | 5 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| duo | ciclo-01-duo.fipp | `4b49f2dd912e` | (vazio) | Input_PO_Validado |
| ritmos | ciclo-01-ritmos.fipp | `184213f5b603` | (vazio) | Input_PO_Validado |

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

## 23/09/2026 — A identidade do projeto entra na documentação (e a ressalva do FIPP)

**O que motivou.**
A documentação não dizia o que este projeto é. Dizia o que ele *tem* (regras, pétreas,
ferramentas) e descrevia o balé como se fosse a identidade — quando o balé é o **protótipo**.
Pior: três documentos citavam "mestrado" e um anunciava "cadeia de proveniência FIPP", o que
leva qualquer leitor novo — pessoa ou IA — a concluir que (a) este repo é o projeto de
mestrado e (b) o FIPP está implementado aqui. Nenhuma das duas é verdade. O erro foi
cometido de fato por uma sessão de IA nesta data, e o sintoma é o que esta entrada corrige:
**quem entrava sem contexto, saía com o contexto errado.**

**O que foi decidido.**
- O projeto passa a se declarar, no topo dos documentos de entrada, como **a memória da aula
  dada** — o processo de ensino-aprendizagem que **de fato se aplicou**, não o planejado.
- **Não é o projeto de mestrado**: o mestrado está em outro diretório, e é de lá que vêm o PO
  e o FIPP. Este repositório **aplica** um PO (como experimentação) e **não implementa o
  FIPP**, nem perto do que a arquitetura dele desenha. O `.fipp` daqui é uma **âncora de
  proveniência encadeada** que compartilha o princípio — o passado se incorpora, não se
  reescreve — mas é uma **aproximação**.
- **Protótipo testado no universo da dança.** Este projeto **não é agnóstico**: ele é o
  protótipo, e o projeto que **deve ser agnóstico** será criado a partir dele, para transitar
  em todos os universos (oficina de matemática, improvisação em dança contemporânea,
  disciplina de mestrado).
- **Nenhum ciclo é igual a outro, nenhuma aula é igual a outra** — nem com o mesmo professor.
  O protótipo existe para provar que o modelo se sustenta nessa variação.
- **Não avalia**: registra o cotidiano do professor em sala de aula. A avaliação é fronteira
  de outro módulo, ainda não desenhado.
- **A integração ainda não existe** — com o projeto das secretarias (Projeto Cultura), nem a
  fronteira de entrada nem a de saída foram desenhadas.

> **Correção de 23/09/2026 (mesmo dia).** A primeira redação desta entrada dizia que o
> projeto era "**agnóstico e completamente adaptativo**". **Está errado**: o agnosticismo é
> a meta do **projeto sucessor**, não uma propriedade deste. O que existe aqui é o
> **protótipo**, sendo testado no universo da dança. A redação foi corrigida em todos os
> documentos onde a afirmação apareceu (`AGENTS.md`, `README.md`, `METODO.md`,
> `README-ciclos.md`, `IDEIA-CAPTURA.md`, `ARQUITETURA-CAPTURA.md`, `CONGELAMENTO.md`, os
> agentes de `.github/` e este registro), e o próprio `tools/gerar-handoff.sh` passou a
> emitir a formulação correta. A versão anterior não é apagada: fica como o elo que registra
> o que se pensou antes da correção (P-03/P-04 — a proveniência acrescenta, não edita).

**Onde entrou.**
- `AGENTS.md` — seção nova **"O que é este projeto (leia antes de qualquer coisa)"**, no topo,
  com a armadilha de leitura declarada;
- `tools/gerar-handoff.sh` — o HANDOFF passa a **emitir a identidade** (é o artefato que uma
  sessão nova lê primeiro); `HANDOFF.md` regenerado;
- `README.md` — título passa a **"Projeto Ciclo — visão geral"**, com nova seção **"O que este
  repositório não é"**; a frase "pesquisa em andamento (mestrado)" sai;
- `METODO.md`, `README-ciclos.md`, `IDEIA-CAPTURA.md`, `ARQUITETURA-CAPTURA.md`,
  `CONGELAMENTO.md` — nota de escopo no topo;
- `.github/` — os três agentes e as `ciclo-fontes.instructions.md` ganham a seção de escopo,
  para que agente algum volte a chamar isto de "projeto de mestrado" nem a âncora de "FIPP";
- `PROTOCOLO.md` e `REGRAS.md` — **congelados**, alterados com o motivo declarado abaixo.

**Motivo declarado — os dois congelados.**
`PROTOCOLO.md` e `REGRAS.md` estão na lista de `CONGELAMENTO.md`; a alteração é **cirúrgica e
só de escopo**, sem tocar em nenhuma das 22 pétreas nem das 17 regras: no `PROTOCOLO.md`,
"cadeia de proveniência **FIPP**" vira "cadeia de proveniência encadeada" e ganha a ressalva de
que o FIPP pertence ao outro projeto; no `REGRAS.md`, a Premissa 7 passa a dizer "o **mesmo
princípio** de encadeamento" e declara que a implementação do FIPP não está aqui. Nenhum
comando, validador ou hash muda: o `.fipp` continua com o mesmo nome e a mesma fórmula — a
**âncora não foi regerada**, e `hash-ciclo.sh … --check` segue passando. O porquê: a
documentação induzia ao erro sobre a natureza do projeto, e a correção exige tocar os dois
arquivos que enunciam o método.

**Com o quê.**
`AGENTS.md`, `README.md`, `README-ciclos.md`, `METODO.md`, `PROTOCOLO.md`, `REGRAS.md`,
`CONGELAMENTO.md`, `IDEIA-CAPTURA.md`, `ARQUITETURA-CAPTURA.md`, `tools/gerar-handoff.sh`,
`HANDOFF.md`, `.github/agents/*.agent.md`, `.github/instructions/ciclo-fontes.instructions.md`.

**Referências.**
`METODO.md` (declaração de princípio); `PROTOCOLO.md` (P-05/P-07 — material × evidência);
`CONGELAMENTO.md` (o procedimento de alteração com motivo declarado); `biblioteca/referencias.md`
(Taylor, *O Arquivo e o Repertório*; Polanyi, *The Tacit Dimension* — memória, repertório e
filosofia); `ARQUITETURA-CAPTURA.md` §7 (decisões em aberto — 7.2, 7.4, 7.5, 7.6).

**O que ainda não está feito.**
O desenho das duas fronteiras — a **entrada** (como o PO chega: hoje é um `.md` copiado à mão)
e a **saída** (o módulo de avaliação, que derivaria da cadeia de custódia em vez de aproximar
questões do plano). A porta de entrada na tela (modo IA × modo formulário) também segue por
fazer.

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
- **tiago · ciclo 01:** aulas escritas em detalhe: 1 de 12 (as demais entram depois da aula anterior).
- Material de campo de **tiago**: 2 evento(s) versionado(s) — sem respostas digitadas: 2026-10-03-ritmos.

## Documentos-chave (para leitura)

- `PROTOCOLO.md` — pétreas
- `REGRAS.md` — regras
- `REGISTRO.md` — marcos metodológicos
- `professores/<nome>/` — um professor por pasta (P-13): ciclos, cadernos, relatórios, campo
- `professores/<nome>/ciclos/ciclo-XX-<escola>-po.md` — POs por escola
- `professores/<nome>/ciclos/ciclo-XX-<escola>.fipp` — âncoras FIPP
- `departamentos/` — PO de departamento, quando a escola tiver metodologia comum (P-14)
- `biblioteca/guia-do-professor.md` — o guia de posição (departamento ou PO próprio)

## Como retomar

A próxima sessão deve ler, nesta ordem:
1. este arquivo;
2. `PROTOCOLO.md`;
3. `REGISTRO.md`;
4. o PO do ciclo ativo.

Isso é suficiente para retomar o diálogo sem reconstruir contexto.
