# Handoff — Projeto Ciclo

Gerado em: `2026-09-18T21:29:59-0300`
Commit atual: `cdf14b6` — docs(protocolo): governanca do caderno inclui ocorrencias fisicas (P-22)
Para: sessão nova (retomar o diálogo)

## Estado do projeto

- **Regras:** 17 em `REGRAS.md`
  + **22 pétreas** em `PROTOCOLO.md`
- **Professores:** tiago (1)
- **Ciclos com manifesto:** 2 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Últimos commits

```
cdf14b6 docs(protocolo): governanca do caderno inclui ocorrencias fisicas (P-22)
5c7abe8 feat(prompts): instalacao aplica P-22 (restricoes fisicas no PO)
d312645 feat(prompts): eliciacao pergunta restricoes fisicas (P-22) e repertorio
a5a56d2 fix(ciclo-01): completa apanhado historico do Ritmos (Quebra-Nozes, dois PDDs)
5ff12ac fix(ciclo-01): corrige PO do Ritmos (21 encontros, Homans, P-11, P-22, checklist)
0386cf9 feat(protocolo): acrescenta P-22 (condicoes materiais de execucao)
012c6dc fix(ciclo-01): corrige plano e aula-01 do Ritmos (21 encontros, Tony, sem volume-120)
34645ef feat(ciclo-01): completa artefatos do Ritmos (notacao, glossario, musicalidade x2)
4585d9a chore(tools): regenera ancoras, pacote e HANDOFF
f70b738 feat(ciclo-01): tabela bruto x harmonizado do Ritmos
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
| duo | ciclo-01-duo.fipp | `f99c8ef2879a` | (vazio) | Input_PO_Validado |
| ritmos | ciclo-01-ritmos.fipp | `9497eea53a4d` | (vazio) | Input_PO_Validado |

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

## 18/09/2026 — PO do Ritmos validado + P-22

**O que aconteceu.**
O PO do Ritmos passou para **`Input_PO_Validado`** (os cinco itens do checklist
marcados), depois de quatro correções: o total de encontros (20 → **21**, com nota de
correção no próprio campo), o `theoreticalBasis` (incorpora **Homans**, que o professor
declarou em "Documentos auxiliares"), as **condições de contorno (P-11)** preenchidas e a
linha de base com a subseção de **restrições físicas (P-22)**. O apanhado histórico foi
completado: os dois pas de deux de *O Quebra-Nozes* identificados, com produção de
referência, estrutura e elenco — e a exclusão da versão de Nureyev registrada como
decisão do professor. A **P-22** entrou no `PROTOCOLO.md` (**22 pétreas**) e foi aplicada
nos dois prompts e na governança do caderno.

**O que foi decidido.**
- **P-22:** as condições materiais de execução são **declaradas** (PO), **registradas**
  (caderno e relatório) e **comunicadas** (coordenação); o professor **não avalia** o que
  o sujeito não pode executar por restrição física.
- Restrições conhecidas neste ciclo: **Carol** (tornozelos, joelhos) e **Pássaro Azul**
  (ombro — provavelmente direito, a confirmar) — ambas declaradas pela **pesquisadora**,
  porque a entrega do professor é anterior à pétrea.
- Os dois pas de deux do ciclo: **PDD 1** (após a batalha com o Rei dos Ratos, Ato I) com
  **Mari**; **PDD 2** (Grand Pas, Ato II) com **Carol e Dada**, que revezam.
- A identificação dos números, da produção (Peter Wright, Royal Ballet) e do elenco é
  declaração da **pesquisadora**; o professor declarou as músicas e a obra.
- Exclusão da versão Nureyev: decisão pedagógica do professor, registrada no apanhado.

**Com o quê.**
`PROTOCOLO.md`, `prompts/eliciar-ciclo.md`, `prompts/instalar-ciclo.md`,
`protocolo/governanca-caderno.md`,
`professores/tiago/ciclos/ciclo-01-ritmos{,-po.md,-apanhado-historico.md,.fipp}` e o
pacote gerado.

**Referências.**
RAD (2015); Homans (2010); Taylor (2013); Polanyi (1966); Clippinger (2024).

**O que ainda não está feito.**
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
