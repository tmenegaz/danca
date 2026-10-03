# Handoff — Projeto Ciclo

Gerado em: `2026-10-02T23:05:28-0300`
Commit atual: `99ae163` — feat(tools): o validador passa a entender if/then/else do schema
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
- **Professores:** fokini (1)
- **Ciclos com manifesto:** 1 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-ANAMNESE.md`** — Desenho da malha de anamnese de balé clássico como **conteúdo do PO** — a **observação inicial** dos seis elementos basilares, os **nove blocos fixos** da ficha, os **dois módulos condicionais** (validação de nível prévio e contexto de origem) e as **três dimensões** da linha de base (Técnica, Funcional, Musicalidade) —, seguida da **malha de domínios declarados** (alinhamento ósseo, flexibilidade passiva, força ativa e potência, sistema vestibular, orientação espacial e lateralidade), com **ramificação condicional** pelo nível declarado (Básico, Intermediário, Avançado) e **soberania de CRUD autoral** do professor — o **recipiente** é do PE, o **conteúdo** é do PO.
- **`ARQUITETURA-AULA.md`** — o ciclo de vida da aula (planejada → dada → lançada, mais a **não dada**), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por aula. O **estado derivado** (`B6`) e o **ajuste no plano** (`B8`) estão implementados; o resto, não.
- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto.
- **`ARQUITETURA-PE.md`** — Especificação da arquitetura de integração entre o repositório atual (implementação do PO) e o repositório separado **"dança e elicitação"** (módulo PE), utilizando descoberta por variável de ambiente (`.env`) e degradação graciosa.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — painel de gestão para a direção da escola (aulas dadas, horas trabalhadas, valor-hora, cadeia de custódia, retenção) e a página pública da cadeia para pais e alunos. Não implementado.

## Últimos commits

```
99ae163 feat(tools): o validador passa a entender if/then/else do schema
1a65840 fix(tools): o `pattern` do schema deixa de valer so para o campo obrigatorio
2a368a2 docs(registro): regenera o HANDOFF sobre f04551b
f04551b docs(registro): os ciclos-prototipo saem, e o tools/ acha o ciclo ativo
3736757 docs(tools): os exemplos e ponteiros passam a citar o ciclo ativo
08c0be9 chore(estrutura): saem os ciclos-prototipo, e o Diaghilev fica sozinho
be806f4 docs(estrutura): a regra de desmembramento da ficha entra na norma
bbe8867 docs(tools): a colheita do HANDOFF passa a ter limite, e a leitura do REGISTRO deixa de ser inteira
ac071db docs(registro): regenera o HANDOFF sobre 7b46e5c
7b46e5c docs(ciclo-01): a grafia nova alcanca as fontes da Ritmos, e a ancora reancora
f000b10 docs(prompts): "Elicitação" se propaga pela prosa, e a pendência do prompt congelado ganha dono
bf0e700 docs(experimentos): o README descreve o que existe hoje, e não o que foi previsto
528c824 docs(registro): regenera o HANDOFF sobre c000dcd
c000dcd docs(registro): a medição do GET /dados e o segundo papel do agente
5910dfc docs(estrutura): a observação inicial e a §9 Q10 no ARQUITETURA-ANAMNESE
5309cc3 docs(registro): regenera o HANDOFF sobre bf98e68
bf98e68 chore(ciclo-01): regera os três ciclos para propagar o campo professor
b2e8a6f docs(registro): a baixa do ponto 3 e o rito dos congelados
1484527 fix(tools): o comentário do pre-commit deixa de nomear função que não existe
52b44f3 docs(tools): as quatro linhas de prosa passam a dizer fokini
```

## Por professor

### fokini — 1 ciclo(s)

**Ciclo 01** — variante(s): diaghilev

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Diaghilev | ciclo-01-diaghilev-po.md | Input_PO_Aguardando | 3 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| diaghilev | ciclo-01-diaghilev.fipp | `899d17e4343d` | (vazio) | Input_PO_Aguardando |

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

## 02/10/2026 — A escola passa a poder ser desabilitada, com motivo e data

**O que motivou.** A segunda frente declarada no fim da entrada anterior — *"a flag de escola
habilitada/desabilitada"* — e o que o `IDEIA-PAINEL-ESCOLA.md` já supõe: o painel da escola precisa
mostrar *«desabilitada»* e, ao lado, **por que** e **desde quando**. Não é um booleano: quando a
direção lê *«desabilitada»*, ela precisa saber **a causa** (inadimplência, *churn*, queda do
sistema) e **a data**, ou a tela não responde a pergunta que a fez olhar.

No caminho, um defeito do validador apareceu — e teve de ser consertado **antes** da flag, porque a
flag depende dele. O `validar-schema-ciclo.js` conferia o `pattern` **só** nos campos `required`: um
campo **opcional** com padrão declarado — exatamente o que uma flag precisa ser — passava com
qualquer valor. A causa: o laço iterava `obrigatorios` em vez das propriedades declaradas.

E, para exigir motivo e data **por máquina**, o validador precisava de uma capacidade que não tinha:
o `if`/`then` do JSON Schema. O schema de ciclo é achatado por desenho; nada nele usava condicional.

**O que foi decidido.**

- **`ESCOLA_HABILITADA="sim|nao"`, no `.conf` da variante** — a flag é **por escola**, não por
  professor: desabilitar `ciclo-01-diaghilev` não toca nas outras escolas do mesmo professor. O
  arquivo da escola já é o manifesto dela; a flag não mora em arquivo separado.
- **A desabilitação exige motivo e data.** `ESCOLA_HABILITADA="nao"` dispara, por `allOf`+`if/then`
  do schema, a obrigatoriedade de `ESCOLA_HABILITADA_MOTIVO` e `ESCOLA_HABILITADA_DESDE`
  (dd/mm/aaaa). Não é booleano solto, e o validador é quem recusa.
- **O campo é opcional de propósito.** A **ausência** vale como habilitada: nenhum ciclo já ancorado
  precisou ser tocado, e o rito não reescreve o passado para acomodar capacidade nova (P-04).
  Declarar `"sim"` é escolha de quem quer o estado **conferido** no arquivo em vez de herdado da
  ausência — foi o que o Diaghilev fez.
- **A ordem foi: consertar o validador, dar-lhe o `if/then`, e só então declarar a flag** — três
  commits, com a flag no último. Declarar a flag sobre um validador que não confere padrão em campo
  opcional seria declarar uma garantia que não existia.
- **O `if/then` é lido onde o draft-07 o declara:** no nível do **objeto**, numa entrada de `allOf`
  ou na raiz do schema — **não** dentro de `properties.X`, onde o `if` operaria sobre a string. Não
  é dialeto próprio: `experimentos/pe/ramificacao/ramificacao-schema.json` (§222) já usa essa forma.
- **Discriminante ausente não dispara ramo.** É o que sustenta a opcionalidade: quem não declara a
  flag não entra no contrato condicional.
- **O bloqueio da geração NÃO entrou** (decisão da pesquisadora, via pergunta direta): a flag é
  **declarada e validada**, não **imposta**. Hoje um ciclo com `ESCOLA_HABILITADA="nao"` ainda é
  gerado por `tools/gerar-ciclo.sh`. Impor é capacidade própria, e virá depois.

**Onde entrou.**

- `tools/validar-schema-ciclo.js` — laço de forma passou a iterar as **propriedades declaradas**, e
  não os `required` (commit `1a65840`); `if/then/else` de `allOf` e da raiz (commit `99ae163`).
- `professores/fokini/ciclos/ciclo-01-schema.json` — as três propriedades novas e o `allOf` que
  torna motivo e data obrigatórios quando `ESCOLA_HABILITADA="nao"`.
- `professores/fokini/ciclos/ciclo-01-diaghilev.conf` — `ESCOLA_HABILITADA="sim"` declarado.
- `README-ciclos.md` — a seção «Habilitar e desabilitar uma escola», com a recusa real transcrita.
- `professores/README.md` — o estado da escola na tabela, e a distinção escola × professor.

**Motivo declarado — os congelados.** `tools/validar-schema-ciclo.js` é de `tools/`, congelado, e
foi tocado em **dois commits próprios**, cada um com motivo no corpo.

- **`1a65840` — o defeito.** O `pattern` passa a valer em qualquer campo declarado com ele,
  obrigatório ou opcional: `required` governa presença, `pattern` governa forma.
- **`99ae163` — a capacidade.** O validador aprende o `if/then/else` do draft-07.

**O que NÃO muda:** a fórmula de hash, a cobertura da âncora (`.fipp` continua cobrindo só
`ciclo-XX.conf`, `ciclo-XX-<escola>.conf` e os `ciclo-XX-*.md`), os demais validadores, as regras e
as pétreas. Medido antes de mexer: o **único** campo opcional com `pattern` em todo o repositório é
`gerado_em`, de `experimentos/pe/envelope/elicitacao-schema.json`, e ele **não passa por este
validador** — por isso o conserto não altera a validação de nenhum artefato existente. Os 4 schemas
do ciclo ativo seguem achatados, e o único `if/then` preexistente é aninhado (dentro de itens de
array) e tem validador próprio (`experimentos/pe/motor/validar.js`).

**Com o quê.**

- `tools/validar-schema-ciclo.js` — **um arquivo, dois commits** (o defeito e a capacidade).
- `professores/fokini/ciclos/ciclo-01-schema.json` · `ciclo-01-diaghilev.conf` ·
  `ciclo-01-diaghilev.fipp` e os **5 `.fipp` por aula** (reancoragem) · `README-ciclos.md` ·
  `professores/README.md` · `REGISTRO.md` (esta entrada).

**Provas.**

- **16 casos isolados** contra 5 schemas de prova: habilitado sem motivo/data passa; desabilitado
  sem motivo/data **falha listando os dois** e a causa (`ramo "then": exige …`); desabilitado com
  motivo e data passa; flag ausente passa; valor fora de `^(sim|nao)$` falha; `then` e `else`
  disparam cada um sozinho; `else` satisfeito passa; campo do `if` ausente não dispara; `pattern`
  dentro do `then` é conferido; `if` vazio casa vacuamente.
- **5 casos contra o schema REAL do ciclo** (`$d/a..e`): sem a flag ok; `nao` sem motivo/data
  recusado; `nao` com motivo e data ok; data em ISO recusada pelo padrão dd/mm/aaaa; `"talvez"`
  recusado.
- **Não-regressão:** `node --check` ok; baseline dos **11 campos obrigatórios** intacto;
  `tools/hash-ciclo.sh fokini 01 diaghilev --check` → **ok, cadeia intacta**, hash reancorado
  `899d17e4343d33fc8d3ecbcf8838e7fe23ad6fe8bb14dc57f6efac5e5bd4d2af`;
  `node tools/check-pacote.js professores/fokini/ciclos/ciclo-01-diaghilev` → **0 erro(s),
  0 aviso(s)**, 21 páginas, 52 páginas de PDF.

**O churn de regeneração foi medido e revertido, de novo.** A reancoragem tocou o `.conf`, e o
`pre-commit` §3 regenerou o pacote: `ciclos.json` (**só** o `gerado_em`), `-dados.json` (**só** o
nonce do cifrado) e o PDF (**só** o `/ID` do `XRef`) sujaram com carimbo puro — nenhuma fonte
pedagógica mudou, e **nenhum dos 21 HTML divergiu**. Os três foram **restaurados** com `git restore`,
como no precedente desta mesma rodada. O pacote do HEAD corresponde às fontes, e carimbo de relógio
não é elo (P-04).

**Referências.**
`IDEIA-PAINEL-ESCOLA.md` (o painel que lê a flag); `CONGELAMENTO.md` (o rito do motivo declarado);
`experimentos/pe/ramificacao/ramificacao-schema.json:222` (a forma canônica de `allOf`+`if/then` já
usada no repositório); `tools/hash-ciclo.sh:128` (o chamador que herda a capacidade — reancorar já
valida a flag); `1a65840` e `99ae163` (os dois commits próprios sobre o congelado);
`REGISTRO.md` (a entrada anterior, que declarou esta frente como pendente).

**O que ainda não está feito.**
- **O bloqueio da geração não existe.** `tools/gerar-ciclo.sh` **não** consulta a flag: hoje ele
  gera um ciclo desabilitado do mesmo jeito. É capacidade própria, decidida para depois — não foi
  tocado nesta rodada, por decisão explícita.
- **A flag não tem consumidor.** O painel (`IDEIA-PAINEL-ESCOLA.md`) continua **não implementado**;
  a flag é o campo que ele vai ler, e hoje quem a lê é só o validador.
- **`ESCOLA_HABILITADA` não entrou em nenhum `enum` nem no `DOCS`.** Ela é campo de schema, não
  documento, e por isso não aparece no pacote gerado — verificar, quando o painel existir, se ele
  precisa lê-la do `.conf` ou de um JSON derivado.
- **`experimentos/README.md` mudou no worktree** (frente anterior) e **fica fora** destes commits,
  de propósito.
- **O push é da pesquisadora** — os commits ficam locais até ela empurrar.

## O que está pendente

## 30/09/2026 — O segundo papel do agente: o servidor local **não existe**; e o Ponto 1 fecha como diagnóstico

O **agente local** continua **não implementado** — e agora se sabe
que ele era **hipótese**, não pendência de código: a medição desta rodada **derrubou** a premissa do
prompt. Segue **sem existir** a consolidação dos lançamentos do Blob de volta ao repositório (§7.3).
Seguem **"Não decidido"** a §7.6 (onde o formulário roda), a §7.2, a §7.4 e a §7.5 — e é a §7.6 que
governaria o agente local. A **publicação do `ciclo-ritmos`** está bloqueada por **crédito da
conta**; reabre por **faturamento**, não por código. Permanecem sem resposta a pergunta pela

## 01/10/2026 — A grafia de "Elicitação" se propaga, e a pendência do prompt congelado ganha dono

A **publicação** do pacote da Ritmos segue **bloqueada por crédito
da conta**, não por código — herdado e sem mudança nesta peça. A âncora da Ritmos foi regerada, mas
o **pacote não foi regerado** para acompanhar: o `referencias.html` publicado traz a prosa nova, e
as demais saídas (PDF, `dados.json`, `ciclos.json`) **não** foram refeitas nesta peça — a regeração
é a próxima do fluxo, se o pacote for publicado. Os **18** `eliciação` minúsculos de `REGISTRO.md`
ficam **como estão**, de propósito: a proveniência **acrescenta, não edita** (P-03/P-04), e reescrevê-los
apagaria o elo do que se pensou antes. Pelo mesmo motivo, a documentação que o **`HANDOFF.md`**
espelha continua dizendo `eliciar-ciclo.md` — é **citação** do registro, não texto do handoff. Como
medido acima, são **quatro** as linhas espelhadas, e elas **permanecem** na regeneração: só sairiam
reescrevendo-se as entradas de 28/09 e 29/09/2026 que as contêm, o que a proveniência proíbe.
Permanecem **abertas** e sem relação com esta peça: a decisão de **onde vivem as Functions**
(§7.6), a consolidação dos
lançamentos do Blob de volta ao repositório (§7.3), e a pergunta pela **revisão dos demais botões**
do formulário (`REGISTRO.md:7536`). Não foi feito **push**. Por fim, o `HANDOFF.md` precisa ser

## 01/10/2026 — A view gerada e a regra de leitura cresciam com o arquivo: a colheita passa a ter limite e o `REGISTRO.md` deixa de ser lido inteiro

- **A Frente 3** — declarar onde acaba o *desenho* e começa o *estado* nos `ARQUITETURA-*.md`. Medido:
  `ARQUITETURA-AULA.md` tem **31 %** de cauda de estado, `ARQUITETURA-ANAMNESE.md` **21 %** e
  `ARQUITETURA-PE.md` **19 %**. É a única frente **livre** com ganho real — mas o ganho é de **quem
  implementa**, não da sessão nova: nenhum `ARQUITETURA-*` está na ordem prescrita de leitura.
- **A Frente 4** — índice no `prompts/elicitar-ciclo.md` (congelado), adiada acima.
- **A auditoria de quais dos 76 blocos estão de fato abertos hoje.** A varredura sabe quais existem e
  onde estão; **não** sabe quantos estão abertos. O índice mitiga, mas não substitui essa auditoria.
- **A verificação de qualidade.** A varredura prova que o custo **caiu** (754 723 → **101 788 B**,
  −86,5 %); não prova que a resposta **não piora**. Isso só se verifica rodando uma sessão nova.
- **Bytes não são tokens.** Toda a medição é em bytes. A proporção (~96 % em dois arquivos) é o
  achado robusto; a conversão para token **não foi medida**.

## 02/10/2026 — Os ciclos-prototipo saem do caminho ativo, e o Diaghilev fica sozinho

- **⚠️ Um achado que a remoção expôs, e que a política de dados sensíveis precisa enfrentar.** O
  dado de saúde individual de uma aluna **estava em claro em 7 arquivos versionados** da árvore que
  saiu: `ciclo-01-ritmos-po.md:107`, `ciclo-01-ritmos-dados.json:40`,
  `ciclo-01-ritmos/caderno-01.html:235`, `ciclo-01-ritmos/guia-de-observacao-01.html:188`,
  `ciclo-01-ritmos/po-01.json:58`, `relatorios/ciclo-01/aula-01-ritmos.md:145` e
  `cadernos/ciclo-01/caderno-01-ritmos.md:100` (*"lesão no tornozelo esquerdo"*). **A leitura que
  dizia que o dado nunca esteve no Git estava errada**, e a correção fica aqui, como elo. O commit
  `08c0be9` tira os 7 do caminho ativo, mas **o histórico do Git os preserva**: a camada 4 cobre os
  acompanhamentos `.md`, e **não** cobre o dado que vazou para as fontes. O que fazer com isso — o
  histórico é imutável por P-04, e a decisão é da pesquisadora — **não foi decidido aqui**.
- **O ciclo vivo não repete o caso:** a §"Restrições físicas declaradas (P-22)" do PO do Diaghilev
  diz *"Nenhuma restrição declarada até o início do ciclo"*, e nenhuma fonte de `professores/fokini/`
  traz dado de saúde individual.
- **A segunda frente não foi implementada** — a flag de escola habilitada/desabilitada. Ela vive no
  `.conf` da variante, com **motivo e data**; entra em `properties` do `ciclo-01-schema.json`, nunca
  em `required`; e exige **reancoragem**, porque toca o `.conf` (o `hash-ciclo.sh:129` valida os
  `.conf` contra o schema antes de ancorar).
- **O push fecha a rodada:** estes commits vão para o `origin/main` como a última ação. O
  `experimentos/README.md` mudou no worktree e **fica fora** deles, de propósito.

---

## 02/10/2026 — A escola passa a poder ser desabilitada, com motivo e data

- **O bloqueio da geração não existe.** `tools/gerar-ciclo.sh` **não** consulta a flag: hoje ele
  gera um ciclo desabilitado do mesmo jeito. É capacidade própria, decidida para depois — não foi
  tocado nesta rodada, por decisão explícita.
- **A flag não tem consumidor.** O painel (`IDEIA-PAINEL-ESCOLA.md`) continua **não implementado**;
  a flag é o campo que ele vai ler, e hoje quem a lê é só o validador.
- **`ESCOLA_HABILITADA` não entrou em nenhum `enum` nem no `DOCS`.** Ela é campo de schema, não
  documento, e por isso não aparece no pacote gerado — verificar, quando o painel existir, se ele
  precisa lê-la do `.conf` ou de um JSON derivado.
- **`experimentos/README.md` mudou no worktree** (frente anterior) e **fica fora** destes commits,
  de propósito.
- **O push é da pesquisadora** — os commits ficam locais até ela empurrar.

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
- **23/09/2026** — A identidade do projeto entra na documentação (e a… → `REGISTRO.md` L2339
- **23/09/2026** — A varredura da deriva de identidade: o que ficou fora da… → `REGISTRO.md` L2420
- **23/09/2026** — A seção que só tinha citação, e o ciclo simulado da… → `REGISTRO.md` L2501
- **23/09/2026** — O gerador não herda mais o locale de quem o chama → `REGISTRO.md` L2592
- **25/09/2026** — O HANDOFF truncado: o glob que abortava a geração em… → `REGISTRO.md` L2660
- **25/09/2026** — "Não o que foi planejado": a memória da aula dada e o… → `REGISTRO.md` L2735
- **25/09/2026** — O campo `norma`: o PO ganha o padrão de referência que… → `REGISTRO.md` L2846
- **25/09/2026** — A identidade visual passa a existir como contrato, e a… → `REGISTRO.md` L3046
- **25/09/2026** — A hora da aula entra no `DIAS`, e o calendário passa a ter… → `REGISTRO.md` L3177
- **26/09/2026** — O `DOCS` deixa de ser lista à mão: as famílias por aula… → `REGISTRO.md` L3351
- **26/09/2026** — A P-13 deixa de sugerir que o dado é privado do professor:… → `REGISTRO.md` L3472
- **26/09/2026** — O prazo do §3 dizia "menor entre" — e dois números do… → `REGISTRO.md` L3625
- **26/09/2026** — O config da captura deixa de ser um por ciclo: um… → `REGISTRO.md` L3774
- **26/09/2026** — O `check-identidade.js` entra no `pre-commit`: a identidade… → `REGISTRO.md` L3974
- **26/09/2026** — O campo ganha a forma canônica da linha de base, a… → `REGISTRO.md` L4208
- **26/09/2026** — A data da aula deixa de ser adivinhada: o `ciclos.json`… → `REGISTRO.md` L4401
- **26/09/2026** — O JSON de dados ganha validador: o `-dados.json` deixa de… → `REGISTRO.md` L4668
- **26/09/2026** — O prazo por aula deixa de ser 48 h fixas: `aulas[].prazo`… → `REGISTRO.md` L4870
- **26/09/2026** — A âncora deixa de existir só por ciclo: um `.fipp` por… → `REGISTRO.md` L5151
- **26/09/2026** — O config da captura por aula passa a ser conferido pelo… → `REGISTRO.md` L5311
- **26/09/2026** — Os apelidos saem em claro: um ciclo sem lançamento passa a… → `REGISTRO.md` L5465
- **26/09/2026** — O formulário lê o config pela AULA: as quatro aulas… → `REGISTRO.md` L5654
- **27/09/2026** — A nav sai uma vez: o formulário deixa de ser a única… → `REGISTRO.md` L5856
- **27/09/2026** — O estado da aula deixa de ser declarado: quatro estados… → `REGISTRO.md` L5969 *(superado)*
- **27/09/2026** — A §5.1 para de dizer 48 h: o ajuste com prazo passa a… → `REGISTRO.md` L6161
- **27/09/2026** — O ajuste no plano deixa de ser promessa: o elo do plano da… → `REGISTRO.md` L6319
- **27/09/2026** — A Aula 05 declara o método RAD e o ciclo ganha notação… → `REGISTRO.md` L6483
- **28/09/2026** — O índice do formulário saía sem a vírgula: a gravação… → `REGISTRO.md` L6618
- **28/09/2026** — O formulário baixa **dois** arquivos, e o texto passa a… → `REGISTRO.md` L6738
- **28/09/2026** — O botão passa a ser `Salvar`, e o arquivo vai para a pasta… → `REGISTRO.md` L6854
- **28/09/2026** — A legenda ao lado do botão `Salvar` sai; o botão fica… → `REGISTRO.md` L7192
- **28/09/2026** — O cabeçalho do formulário passa à voz de professor: só… → `REGISTRO.md` L7293
- **28/09/2026** — O botão `Exportar ajuste do plano` sai do formulário: era… → `REGISTRO.md` L7419 *(superado)*
- **29/09/2026** — O botão `Salvar` deixa de abrir a pasta do computador: a… → `REGISTRO.md` L7540 *(superado)*
- **29/09/2026** — O fecho do Passo 1: o "Nível 2 do `tiago`" já estava… → `REGISTRO.md` L7665 *(superado)*
- **29/09/2026** — O Passo 0 entra: o `POST` ganha destino e a cadeia reancora… → `REGISTRO.md` L7813
- **29/09/2026** — Os dois congelados entram: o índice ganha o slug e a… → `REGISTRO.md` L7940
- **29/09/2026** — O `B8` medido: `podeAjustarPlano()` não existe, e o elo do… → `REGISTRO.md` L8010 *(superado)*
- **30/09/2026** — Os pontos 2, 3 e 4 fechados: a grafia, o campo `professor`… → `REGISTRO.md` L8088
- PO de **fokini · diaghilev** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **fokini · ciclo 01:** aulas escritas em detalhe: 5 de 5 (as demais entram depois da aula anterior).
- Material de campo de **fokini**: 0 evento(s) versionado(s).

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
