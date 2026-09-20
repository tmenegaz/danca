# Handoff — Projeto Ciclo

Gerado em: `2026-09-19T23:25:53-0300`
Commit atual: `45b7d88` — chore(estrutura): cria a area de experimentos (fora do hash, do pacote e do site)
Para: sessão nova (retomar o diálogo)

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
45b7d88 chore(estrutura): cria a area de experimentos (fora do hash, do pacote e do site)
496b0a1 docs(entrega): sincroniza a lista de escopos com o hook
d034746 docs(ideia): complementa a arquitetura da captura (estimativa de escala, foco em navegacao)
f7d7a9d chore(tools): regenera HANDOFF com as ideias documentadas
13d266e feat(tools): gerar-handoff lista IDEIA-* e ARQUITETURA-*
aa6b478 docs(protocolo): aponta o README para a arquitetura da captura em JSON
b6c2120 docs(ideia): desenha a arquitetura da captura em JSON
b1ffe43 chore(tools): regenera HANDOFF com a secao de ideias
d99c72e feat(tools): gerar-handoff lista as ideias documentadas
32af3e9 docs(ideia): documenta o formulario de captura em JSON (intencao futura)
8879bfe fix(tools): hook aceita o escopo ideia
922bc3d docs(registro): registra a varredura de marcas de indecisao
a789300 chore(tools): regenera pacotes e ancoras apos a varredura
13d5778 fix(ciclo-01): declara a pendencia da notacao nos dois documentos do Duo (P-15)
b937815 fix(ciclo-01): proporcao por blocos vira nota (Regra 9 em minutos)
cce10fa fix(ciclo-01): corrige a notacao do Ritmos (Benesh) e a divisao do sabado
c40dece docs(registro): registra as correcoes cosmeticas
0ba14f8 chore(tools): regenera pacotes e ancoras apos as correcoes cosmeticas
8565a95 fix(tools): hook aceita o escopo metodo
13fe587 fix(ciclo-01): preview do relatorio aponta o arquivo e harmoniza residuo no plano
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
| duo | ciclo-01-duo.fipp | `e9dbdd33bb39` | (vazio) | Input_PO_Validado |
| ritmos | ciclo-01-ritmos.fipp | `72922e303930` | (vazio) | Input_PO_Validado |

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

## 19/09/2026 — Varredura de marcas de indecisão

**O que aconteceu.**
Os documentos dos dois ciclos foram varridos em busca de marcas de indecisão
(`[a decidir]`, `em aberto`, `[Preencher]`, `[conferir]`). A varredura achou 78
linhas com marca, em 14 arquivos, e **15 arquivos limpos** — e classificou cada
uma em três tipos, não dois:

- **inconsistência** — a marca tinha resposta deliberada em outro lugar;
- **pendência legítima** — depende do professor ou de dado futuro;
- **decisão da pesquisadora** — nem uma coisa nem outra: o texto endereçava a
  pergunta a ela (a proporção por blocos), e era dela a resposta.

**O que foi decidido.**
- **Notação do Ritmos:** corrigida. A referência dizia *"nenhum sistema de
  notação foi adotado para este ciclo"* — falso, porque o ciclo publica o
  documento de notação e o glossário. A decisão estava na **P-15** (a notação
  segue a metodologia declarada: RAD usa Benesh) e na **P-16**. A resposta do
  professor (*"Notação: [a decidir]"*) continua citada como proveniência; o
  material bruto não foi tocado (P-05).
- **Divisão do sábado:** o `aula-01.md` declarava a divisão e, três linhas
  depois, pedia de novo o que estava dito. A marca saiu; o `.conf` já a definia.
  E a decisão fechou o modelo que estava aberto desde a investigação do volume:
  **a aula de 19/09/2026 cobre as aulas 01 e 02** (bloco contínuo de 120 min).
- **Proporção por blocos:** virou **nota da Regra 9** — a proporção se aplica em
  **minutos** (distribuição do tempo de aula), e o volume planejado permanece em
  tempos. É a mesma unidade da decisão dos campos de duração.
- **Duo (notação e glossário):** verificados. A Regra 8 **já estava satisfeita** —
  os dois declaram em prosa a natureza do registro ("código didático do ciclo"),
  as fontes e os limites ("Limites do registro"). O que faltava era dizer **de
  quem é a notação em forma completa**; a pedido da pesquisadora, cada documento
  ganhou uma **Nota (P-15)**, sem renomear nada.
- As **pendências legítimas foram mantidas** — as 12 da musicalidade do Duo, as
  13 da notação do Ritmos, as gravações de referência, os marcos 02–21, os
  `[conferir]` de edição/ano. Nenhuma foi apagada.

**Com o quê.**
`ciclos/ciclo-01-ritmos-referencias.md`, `ciclos/ciclo-01-ritmos-aula-01.md`,
`ciclos/ciclo-01-ritmos-plano.md`, `ciclos/ciclo-01-notacao.md`,
`ciclos/ciclo-01-glossario-benesh.md`, os dois pacotes regerados.

**O que ainda não está feito.**
O push.

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
