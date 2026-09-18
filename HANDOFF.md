# Handoff — Projeto Ciclo

Gerado em: `2026-09-18T17:07:46-0300`
Commit atual: `abd6c58` — feat(protocolo): acrescenta P-20 (problemas semelhantes) e P-21 (linguagem harmonizada)
Para: sessão nova (retomar o diálogo)

## Estado do projeto

- **Regras:** 17 em `REGRAS.md`
  + **21 pétreas** em `PROTOCOLO.md`
- **Professores:** tiago (1)
- **Ciclos com manifesto:** 2 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Últimos commits

```
abd6c58 feat(protocolo): acrescenta P-20 (problemas semelhantes) e P-21 (linguagem harmonizada)
fa63fc5 feat(biblioteca): guia do professor explica o harmonizador
7f2a29b feat(prompts): harmonizador de linguagem no instalar-ciclo (P-21 visivel ao professor)
d734fff fix(tools): calendario emite uma aula por ocorrencia do dia (Ritmos: sabado com 2)
074b74b docs(registro): registra completacao do Ritmos e P-15 a P-19
87f41c8 chore(tools): regenera ancoras, pacote do Ritmos e HANDOFF
d7d13e2 feat(prompts): atualiza prompt de eliciacao com P-16 e P-18
e18cc66 feat(prompts): instala prompt de instalacao de ciclo no repositorio (P-19)
c23ab15 feat(ciclo-01): gera artefatos auxiliares do Ritmos (replica estrutura do Duo)
1481c1a fix(ciclo-01): manifesto do Ritmos com 21 aulas e 3 aulas/semana
d24e911 fix(ciclo-01): corrige PO do Ritmos (apelidos P-12, 21 aulas, PDD como objetivo)
990c784 feat(protocolo): acrescenta P-15 a P-19 (notacao, eliciacao, artefatos, escola, prompts)
6c63ccf docs(campo): registra as respostas do professor da Ritmos e a correcao no REGISTRO
ad86acd feat(ciclo-01): instala o ciclo da Ritmos e Movimento a partir da entrega do professor
e409322 docs(estrutura): documenta que cada escola tem o seu proprio ciclo
b60830b chore(estrutura): remove as copias do ciclo da Debora
7ed5623 fix(tools): resolve as fontes por escola, no gerador e no hasher
74e2ab4 fix(tools): separa o slug do professor do nome de exibicao e datacao do PDF
53f41f4 chore(ciclo-01): versiona os pacotes entregues das tres escolas
d155cd7 chore(estrutura): versiona os pacotes de ciclo (deploy automatico pelo GitHub)
```

## Por professor

### tiago — 1 ciclo(s)

**Ciclo 01** — variante(s): duo, ritmos

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Duo | ciclo-01-duo-po.md | Input_PO_Validado | 0 |
| Ritmos e Movimento | ciclo-01-ritmos-po.md | Input_PO_Aguardando | 10 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| duo | ciclo-01-duo.fipp | `f99c8ef2879a` | (vazio) | Input_PO_Validado |
| ritmos | ciclo-01-ritmos.fipp | `0303b51c64b5` | (vazio) | Input_PO_Aguardando |

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

## 18/09/2026 — Ciclo do Ritmos completado (4 de 8 artefatos) + P-15 a P-19

**O que aconteceu.**
O ciclo do Ritmos e Movimento recebeu **quatro** dos oito artefatos auxiliares que
faltavam: **relatório-preview** (guia do que observar, com a dimensão do **par**),
**captura em aula** (folha de marcação com os cinco apelidos), **pré-requisitos**
(o piso que o professor declarou) e **apanhado histórico** (o repertório declarado,
com o pas de deux a identificar). O **PO foi corrigido**: apelidos estáveis fixados
(**Carol, Dada, Tony, Pássaro Azul, Mari**), **21 aulas** (era 20) e a duração
descrita como **3 aulas de 60 min por semana** (a terça é pas de deux; o sábado tem
balé como preparação + pas de deux). O manifesto acompanhou (21 aulas,
`DURACOES="60,60,60"`). **Cinco novas pétreas** foram declaradas (P-15 a P-19), e os
**dois prompts do projeto** passaram a viver versionados em `prompts/`.

**O que foi decidido.**
- A notação segue a metodologia declarada (P-15).
- Metodologia e notação são perguntadas na eliciação (P-16).
- Todo ciclo replica os artefatos do ciclo piloto (P-17).
- A metodologia pode ser imposta pela escola, não só escolhida (P-18).
- Prompts do projeto vivem no repositório (P-19).
- **Quatro artefatos não foram gerados**, e isso foi decisão, não esquecimento:
  `notacao`, `glossario-benesh`, `musicalidade` e `musicalidade-aluna` carregam, no
  ciclo piloto, o **conteúdo daquele ciclo** — o registro dos exercícios dele, as
  contagens das aulas dele, os exemplos dos passos dele. Replicá-los exigiria
  inventar o que o professor não deu, e a resposta dele sobre notação foi
  literalmente "[a decidir]". Proposta registrada: extrair a parte **conceitual**
  para a `biblioteca/` (como já se fez com o guia do professor, que é resolvido por
  caminho em todo pacote) e escrever, por ciclo, documentos curtos que só amarrem os
  conceitos à aula e à música daquela escola — que é a pergunta que a P-16 manda
  fazer na eliciação.

**Com o quê.**
`PROTOCOLO.md` (P-15 a P-19), `prompts/eliciar-ciclo.md`, `prompts/instalar-ciclo.md`,
`tools/hooks/commit-msg` (escopo `prompts`),
`professores/tiago/ciclos/ciclo-01-ritmos{,.conf,-po.md,-relatorio-aula-01.md,-captura-aula-01.md,-pre-requisitos.md,-apanhado-historico.md,.fipp}`
e o pacote gerado (9 páginas HTML, PDF de 22 páginas).

**Referências.**
RAD (2015); Taylor (2013); Polanyi (1966). *(A entrada prevista citava "Taylor
(2003)"; a biblioteca do projeto registra a edição de **2013** — conferido antes de
escrever.)*

**O que ainda não está feito.**
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
- PO de **tiago · ritmos** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
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
