# Handoff — Projeto Ciclo

Gerado em: `2026-09-19T16:09:44-0300`
Commit atual: `5900725` — docs(registro): registra o nao determinismo da cifra como efeito colateral
Para: sessão nova (retomar o diálogo)

## Estado do projeto

- **Regras:** 17 em `REGRAS.md`
  + **22 pétreas** em `PROTOCOLO.md`
- **Professores:** tiago (1)
- **Ciclos com manifesto:** 2 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Últimos commits

```
5900725 docs(registro): registra o nao determinismo da cifra como efeito colateral
14d96ae docs(caderno): registra que o HTML cifrado nao e deterministico
26b39ff fix(tools): guarda de cifra ja aplicada usa as marcas reais da biblioteca
ca9e599 chore(tools): regenera pacotes e HANDOFF apos criptografia
3a6c9fa docs(registro): registra a criptografia como excecao justificada
15117a3 docs(protocolo): inclui criptografia na lista de infraestrutura congelada
919fc5e docs(caderno): documenta senha de protecao dos acompanhamentos
3528452 feat(tools): criptografa acompanhamentos com PageCrypt (senhas fora do repo)
8cb885f fix(ciclo-01): atualiza nota de harmonizacao do Ritmos (decisao 18/09)
438daf3 chore(tools): regenera pacotes e HANDOFF apos a harmonizacao do Duo
9ebe25b docs(registro): registra o congelamento e a verificacao da P-17 em codigo
4a4abbc docs(protocolo): declara congelamento da infraestrutura
2775748 feat(ciclo-01): harmonizacao de linguagem do Duo e termo harmonizado no PO
0303390 feat(tools): check-pacote reprova ciclo com aula sem harmonizacao (P-17 + P-21)
74fa832 fix(template): hamburger responde em todas as páginas (navegação mobile)
e2c8c28 chore(tools): regenera ancoras e HANDOFF apos incluir os relatorios no hash
eeed7cd feat(tools): relatorios entram na cobertura do hash; acompanhamentos ficam fora
3d01db0 feat(tools): integra o acompanhamento ao gerador do pacote
4ce9fa8 chore(ciclo-01): gera os acompanhamentos por aluna (Duo e Ritmos)
d46031c feat(tools): cria gerar-acompanhamento.sh (vista por aluna do ciclo)
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
| duo | ciclo-01-duo.fipp | `9dd97d81236c` | (vazio) | Input_PO_Validado |
| ritmos | ciclo-01-ritmos.fipp | `511c51d6870c` | (vazio) | Input_PO_Validado |

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

## 19/09/2026 — Criptografia dos acompanhamentos (exceção pós-congelamento)

**O que aconteceu.**
A criptografia dos acompanhamentos foi implementada após o congelamento da
infraestrutura. Exceção justificada: decisão tomada antes do congelamento,
executada depois. Não altera o que existe — acrescenta componente novo. Os HTML
de acompanhamento por aluna passaram a ser publicados cifrados (PageCrypt): o
site pede senha para abrir cada um.

**O que foi decidido.**
- PageCrypt para criptografar os HTML de acompanhamento por aluna.
- As senhas **não ficam no repositório** (ele é público). Ficam em
  `tools/.senhas-locais` (não versionado, `chmod 600`).
- Se o arquivo não existir, o script pede a senha interativamente; sem terminal e
  sem senha ele **falha**, e o `check-pacote.js` reprova o pacote — um
  acompanhamento não chega ao site em claro.
- O `.conf` só declara `ACOMPANHAMENTO_CRIPTOGRAFADO="sim"` — sem valor.
- A criptografia roda **dentro do `gerar-ciclo.sh`**, depois de o HTML nascer e
  antes da validação. O `gerar-acompanhamento.sh` ganhou o modo
  `--criptografar`; o prompt previa essa etapa no script dos acompanhamentos,
  mas lá só existem os `.md` — o HTML nasce no gerador.
- A nota de harmonização do Ritmos foi atualizada (decisão 18/09: harmonização
  sempre, inclusive citações).

**Efeito colateral declarado.**
O HTML cifrado **não é determinístico**: cada execução usa sal e IV novos, então os
9 acompanhamentos mudam de bytes a cada geração — com a mesma senha e o mesmo
conteúdo. Regenerar o pacote deixa essas páginas "modificadas" no Git, e é por isso
que a árvore não fica limpa depois de gerar. O que não muda é o que a senha abre. A
segunda execução da criptografia sem regerar o HTML é recusada de propósito: sem
decifrar antes, ela cifraria a própria cifra e o arquivo deixaria de abrir.

**O que não está resolvido, e é o ponto sensível.**
A criptografia protege **o site**, não o conteúdo. Os mesmos acompanhamentos
continuam em claro em dois lugares do repositório público: o **PDF consolidado**
de cada ciclo (`ciclo-01-duo.pdf`, `ciclo-01-ritmos.pdf` — o gerador inclui os
acompanhamentos no PDF) e os **`.md` de origem**
(`professores/tiago/ciclos/ciclo-XX-<escola>-acompanhamento-<aluna>.md`, 19
arquivos rastreados). O conteúdo é pseudonimizado pelos apelidos (P-12) — não há
nome próprio nem dado clínico —, mas é o mesmo conteúdo. As duas saídas:

- **tirar os acompanhamentos do PDF** é uma linha no gerador (o PDF é montado de
  `$DOCS $ACOMP_DOCS`); o PDF não entra no hash, então a âncora não muda;
- **tirar os `.md` do repositório** (`.gitignore` + `git rm --cached`) é possível
  **sem tocar na cadeia FIPP**: `tools/lib-fontes.sh` os exclui do hash de
  propósito — são vista derivada do PO e dos relatórios, que são as fontes reais.
  O que continua necessário é tê-los em disco para o gerador montar o pacote antes
  de cifrar; quem clonar o repositório não os terá, e o pacote publicado (cifrado)
  é reconstruível a partir do PO e dos relatórios, que permanecem versionados.

Nenhuma das duas foi feita: as duas mudam o que o site publica, e a decisão é da
pesquisadora.

Também pendente, do mesmo tipo: uma linha residual de termo cru na tabela de
progressão do plano do Ritmos ("Braços caídos, desconectados" / "1ª alta demais",
`ciclo-01-ritmos-plano.md`) — registrada na harmonização daquele ciclo, não
reescrita por ser conteúdo publicado.

**Com o quê.**
`tools/gerar-acompanhamento.sh`, `tools/gerar-ciclo.sh`, `tools/check-pacote.js`,
`package.json` (dependência `pagecrypt`), `ciclos/*.conf`, `.gitignore`,
`tools/.senhas-locais` (não versionado), `tools/.senhas-locais.exemplo`,
`CONGELAMENTO.md`, `cadernos/README.md`,
`ciclo-01-ritmos-harmonizacao.md`.

**Referências.**
P-04 (proveniência), P-12 (apelidos), P-17 (artefatos do ciclo), P-21 (linguagem
harmonizada).

**O que ainda não está feito.**
Verificação no navegador (a pesquisadora testa: senha certa abre, errada não);
decisão sobre o PDF e os `.md` de acompanhamento; a linha residual do plano do
Ritmos.

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
