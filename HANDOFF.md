# Handoff — Projeto Ciclo

Gerado em: `2026-09-19T14:38:55-0300`
Commit atual: `e2c8c28` — chore(tools): regenera ancoras e HANDOFF apos incluir os relatorios no hash
Para: sessão nova (retomar o diálogo)

## Estado do projeto

- **Regras:** 17 em `REGRAS.md`
  + **22 pétreas** em `PROTOCOLO.md`
- **Professores:** tiago (1)
- **Ciclos com manifesto:** 2 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Últimos commits

```
e2c8c28 chore(tools): regenera ancoras e HANDOFF apos incluir os relatorios no hash
eeed7cd feat(tools): relatorios entram na cobertura do hash; acompanhamentos ficam fora
3d01db0 feat(tools): integra o acompanhamento ao gerador do pacote
4ce9fa8 chore(ciclo-01): gera os acompanhamentos por aluna (Duo e Ritmos)
d46031c feat(tools): cria gerar-acompanhamento.sh (vista por aluna do ciclo)
418a6f1 docs(registro): registra a publicacao, a reancoragem da Duo e o caderno da aula 01
093bb67 chore(tools): regenera HANDOFF apos a reancoragem da Duo
70c9d8d fix(ciclo-01): preview e nota da Ana do Duo (caminhos e formulacao)
c0de989 fix(ciclo-01): corrige os caminhos no preview do relatorio do Ritmos
39be66a chore(tools): regenera HANDOFF apos caderno e relatorio da aula 01
790f242 chore(tools): aceita os escopos caderno-NN e relatorio-NN no hook
8f4490b docs(relatorio-01): registra a aula 01 do Duo
8ef22b9 docs(caderno-01): registra a aula 01 do Duo
76ce650 chore(tools): regenera ancoras, pacote do Ritmos e HANDOFF apos harmonizacao
39c2c6f chore(ciclo-01): regenera o pacote do Duo com rodape derivado
c188985 fix(ciclo-01): regenera a pagina de musicalidade do pacote (P-21)
22792d0 fix(ciclo-01): tira o ultimo termo cru do documento de musicalidade (P-21)
3a7e4df fix(ciclo-01): harmoniza citacoes em documentos publicados do Ritmos (P-21)
fafa07c docs(registro): registra validacao do PO do Ritmos e P-22
0111a71 chore(tools): regenera ancoras, pacote do Ritmos e HANDOFF apos P-22
```

## Por professor

### tiago — 1 ciclo(s)

**Ciclo 01** — variante(s): duo, ritmos

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Duo | ciclo-01-duo-po.md | Input_PO_Validado | 0 |
| Ritmos e Movimento | ciclo-01-ritmos-po.md | Input_PO_Validado | 6 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| duo | ciclo-01-duo.fipp | `ef0a60b08c97` | (vazio) | Input_PO_Validado |
| ritmos | ciclo-01-ritmos.fipp | `28df49bea510` | (vazio) | Input_PO_Validado |

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

## 18/09/2026 — Publicação, primeira reancoragem da Duo e o caderno da Aula 01

**O que aconteceu.**
- **Publicado:** os commits acumulados foram enviados ao `origin/main` (o bloqueio
  anterior — o nome próprio num documento publicado — tinha caído na harmonização). O
  Netlify reconstrói os dois sites a partir do push.
- **Caderno e relatório da Aula 01 do Duo** escritos a partir da aula de 18/09: o
  primeiro **ciclo completo** do projeto — PO declarado → aula dada → caderno escrito →
  relatório gerado.
- **Preview e PO da Duo corrigidos:** os dois caminhos pré-migração no preview do
  relatório, a formulação da nota da Ana e a nota de proveniência, que dizia que o
  primeiro relatório pós-aula ainda não existia — ele existe, e a nota passou a apontar
  o caminho.
- **Preview do Ritmos corrigido** (os mesmos dois caminhos), no commit imediatamente
  anterior a este.

**O que foi decidido.**
- **A âncora do ciclo da Duo muda pela primeira vez:** `f99c8ef2879a` → **`ae7e63fb7964`**.
  É o inverso do que está registrado mais acima, no mesmo dia: lá a âncora dela
  permaneceu intacta justamente porque o ciclo **não** tinha sido tocado; aqui foi, com
  autorização da pesquisadora.
- A formulação nova descreve o **processo** (escutar mais tempo, começar depois e
  responder certo), não o **efeito** (demorar). O que se observa não mudou; mudou o nome
  do que se observa.
- **O registro guarda os dois lados.** A nota de correção no próprio PO nomeia o termo
  antigo, como a tabela de harmonização faz com os termos do professor. Uma correção que
  apaga o que corrigiu não é proveniência — é edição.
- A âncora do **Ritmos** foi regerada duas vezes nesta rodada (na harmonização e no
  preview), e nenhuma delas mudou o conteúdo do ciclo.

**Com o quê.**
`professores/tiago/ciclos/ciclo-01-duo-po.md`, `…ciclo-01-relatorio-aula-01.md`,
`…ciclo-01-duo.fipp`, `…ciclo-01-ritmos-relatorio-aula-01.md`, `…ciclo-01-ritmos.fipp`,
`professores/tiago/cadernos/ciclo-01/caderno-01-duo.md`,
`professores/tiago/relatorios/ciclo-01/aula-01-duo.md`, `tools/hooks/commit-msg`.

**Referências.**
P-05 (proveniência), P-06 (registro descritivo), P-10 (linha de base), P-12 (apelidos),
P-21 (linguagem harmonizada).

**O que ainda não está feito.**
Ciclo da Débora; notação do Ritmos (depende do professor); gravações de referência e o
cruzamento fino entre passos e números (Ritmos); primeiro relatório pós-aula do Ritmos
(após 19/09); conferir os dois sites no Netlify.

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
