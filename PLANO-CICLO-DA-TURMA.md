# Plano — O ciclo é da turma (fases 2 a 5)

> **Status.** Plano de implementação. A **fase 1** está entregue (16/10/2026); as fases **2 a 5**
> são o escopo deste documento. **Nada das fases 2–5 foi implementado.**
>
> **Precedência.** Este plano é o que destrava a geração. A Tabela de atividades
> ([PLANO-TABELA-DE-ATIVIDADES.md](./PLANO-TABELA-DE-ATIVIDADES.md)), os índices
> ([PLANO-INDICES.md](./PLANO-INDICES.md)) e o catálogo de perguntas
> ([PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md)) **dependem** de o
> ciclo existir por turma — todos indexam e filtram por turma. Nenhum deles começa antes deste.
>
> **Regra central.** O `.conf` deixa de ser **escrito à mão** e passa a ser **derivado** do
> cadastro da turma e do plano elicitado. É a inversão que a fase 1 pediu e não fez.

---

## 0. O que motivou este plano

O run [`39192752959`](https://github.com/tmenegaz/danca/actions/runs/39192752959) (19/10, 00:02)
falhou com:

```
erro: Pré-requisito 5 incompleto — 'DATA_INICIO' não está declarado em ciclo-01-fita.conf.
```

O PO **foi** elicitado com sucesso — o commit `d9cd572` gravou 211 linhas em
`professores/tiago-menegaz/ciclos/ciclo-01-fita-teste-po.md`. Nada de errado com o PO, com o token
ou com o plano. O que falha é o **encontro** entre o que o Worker grava e o que o gerador lê.

Duas simulações, no estado atual do repositório:

| Chamada | Resultado |
|:--|:--|
| `gerar-ciclo.sh tiago-menegaz 01 fita` — o que o workflow faz | `DATA_INICIO não está declarado em ciclo-01-fita.conf` |
| `gerar-ciclo.sh tiago-menegaz 01 fita-teste` — a variante real das fontes | `manifesto da variante não encontrado: ciclo-01-fita-teste.conf` |

**As duas falham, e por razões opostas.** A primeira lê um manifesto que existe e está incompleto; a
segunda lê as fontes certas e não tem manifesto. Não há, hoje, nenhuma chamada que funcione — e é
isso que a fase 1 deixou em aberto, **de propósito e registrado** ([REGISTRO.md](./REGISTRO.md:14488)):

> **O `.conf` da variante da turma não existe** (`ciclo-01-fita-teste.conf`). `atualizarDocsDoConf`
> devolve 404 (best-effort: a fonte é escrita, o `DOCS` não é ligado), e a geração de `fita-teste`
> recusa com «manifesto da variante não encontrado». Compor esse `.conf` a partir do plano é a fase
> seguinte.

---

## 1. O que a fase 1 entregou (e o que ela mudou sem avisar)

| Mudança | Onde | Estado |
|:--|:--|:--|
| A variante da fonte passa a ser `<escola>-<turma>` | `varianteDoContexto` (`escrever-po.js`) | ✅ entregue |
| Os três escritores usam a **mesma** definição | `escrever-po`, `escrever-plano`, `escrever-ciclo` | ✅ entregue |
| O `contexto` do envelope ganha `turma` (contrato 1.3.0) | `porta/envelope/elicitacao-schema.json`, `motor/nucleo/elicitar.js` | ✅ entregue |
| O cliente envia a turma (`turmaDoAto`) | `porta/index.html` | ✅ entregue |
| O `.conf` da variante da turma | `compor-conf.js` + `escrever-plano.js` | ✅ entregue |
| O disparo manda a variante (e a escola, para o deploy) | `disparar.js`, `gerar-ciclo.yml` | ✅ entregue (19/10) |
| O calendário sair do plano | — | ❌ fase 3 |
| O `.conf` encolher | — | ❌ fase 3 |
| O Worker servir N pacotes | — | ❌ fase 4 |
| A migração dos ficheiros vivos | — | ❌ fase 5 |

**A consequência medida.** O repositório hoje tem três fontes de plano/PO com nomes que o gerador
não lê:

```
ciclo-01-fita-plano.md            ← 16/10, anterior à mudança (sem turma)
ciclo-01-fita-teste-2-plano.md    ← novo, variante fita-teste-2
ciclo-01-fita-teste-po.md         ← novo, variante fita-teste
```

E o gerador procura `ciclo-01-fita-po.md` (`lib-fontes.sh:41`, com `VARIANTE="fita"`). **O PO é
invisível para ele.**

---

## 2. Medição — quem manda em cada dado, hoje

### 2.1 O mesmo fato declarado em quatro lugares, com quatro valores

| Dado | `.conf` (15/10) | plano de 16/10 | plano novo | PO (19/10) |
|:--|:--|:--|:--|:--|
| **Duração da aula** | `DURACOES="60"` | 55 min | **1 h 15 min** | **1 h 15 min** |
| **Aulas por semana** | 2 (`DIAS="2@19:00,4@19:00"`) | 3 (ter, qui, sex) | **4** (ter, qua, qui, sex) | **4** |
| **Total de aulas** | 5 | 7 | **9** | — |
| **Início** | `[Preencher: …]` | 2026-10-16 | **2026-10-16** | 2026-10-16 |
| **Fim** | — | 2026-10-30 | 2026-10-30 | 2026-10-30 |

Quatro fontes, quatro respostas. **Nenhuma delas é mentira**: cada arquivo foi correto no dia em que
foi escrito. O defeito é não haver **uma** que mande.

### 2.2 O inventário do `.conf` — quem realmente usa cada chave

| Chave | Quem lê | Vem do plano? | Vem da turma? |
|:--|:--|:--|:--|
| `VARIANTE` | `lib-fontes.sh` (resolução de todas as fontes) | ❌ identidade | ❌ |
| `ESCOLA` | `calendario.py`, template, rodapé | ✅ `contexto-escola` | ✅ nome |
| `RESPONSAVEL` | `calendario.py`, cabeçalho | ✅ `contexto-professor` | — |
| `ESCOLA_HABILITADA` | `wrangler.*.jsonc` (freio do Worker) | ❌ configuração | ❌ |
| `FREQUENCIA` | `calendario.py` (`--frequencia`) | ✅ `contexto-frequencia` | ✅ dias |
| `DIAS` | `calendario.py` (`--dias`, **hora obrigatória**) | ⚠️ dias sim, **hora não** | ✅ `horarios` |
| `DURACOES` | faixa de volume por duração (Regra 9) | ✅ `contexto-duracao` | ✅ `duracaoMin` |
| `DURACAO_POR_DIA` | rodapé, cabeçalho, ficha | ✅ `contexto-duracao` | ✅ `duracaoMin` |
| `DATA_INICIO` | `calendario.py` (`--inicio`) | ✅ `contexto-calendario.inicio` | ✅ `periodoInicio` |
| `TOTAL_AULAS` | `calendario.py` (`--total`) | ✅ `contexto-total-aulas` | — |
| `NOME` | título do pacote, `ciclose` | ⚠️ prosa | ✅ nome da turma |
| `OBJETIVO_GERAL` | capa, `README`, PDF | ✅ `objetivo-geral` | — |
| `PROFESSOR` | rodapé, `README` | ✅ `contexto-professor` | — |
| `VOLUME_MIN` / `VOLUME_MAX` | Regra 9 (faixa por duração) | ⚠️ **unidade diferente** | ❌ |
| `VOLUME_MIN_120` / `VOLUME_MAX_120` | idem, dia longo | ⚠️ idem | ❌ |
| `DOCS` | ordem do pacote, menu, PDF | ⚠️ derivável do disco | — |

**Sete chaves já vêm do plano; quatro vêm da turma; quatro são identidade e não devem ser
derivadas** (`VARIANTE`, `ESCOLA_HABILITADA`, `CICLO` e — discutivelmente — `RESPONSAVEL`).

### 2.3 As duas lacunas de dado que impedem a derivação

**(a) A hora da aula.** `calendario.py` **recusa** `DIAS` sem hora (`parse_dias`, desde 25/09/2026)
porque o prazo de lançamento conta do fim da aula. O plano declara **dias**, não horas. O cadastro
da turma ganhou `horarios: {ter: "09:00"}` em 16/10 — **opcional**, e `faltaNoRitmoDaTurma`
**não** o exige. Uma turma sem horas, hoje, não produz `.conf` sem inventar.

**(b) A unidade do volume.** O plano declara `3–6 séries`. O `.conf` valida o `volume-total` da
**aula** contra uma faixa em **tempos** (`VOLUME_MIN=80`, `VOLUME_MAX=100`). São unidades
diferentes, e a conversão entre elas não está declarada em lugar nenhum. Medido no plano novo
(`ciclo-01-fita-teste-2-plano.md`, 16 linhas de exercício): a coluna **Tempos** soma **370**, e a
distribuição por bloco soma **75 minutos** — que é exatamente a duração declarada. Cada número está
certo na sua unidade; **nenhum dos dois serve à faixa 80–100**, que é a da aula de 60 min.

> **A faixa do `.conf` está obsoleta por construção.** `80–100 tempos` é a calibração de uma aula de
> 60 minutos de outra escola; o plano de hoje pede 370 tempos em 75 minutos. Não é um erro de
> digitação: é a prova de que a faixa não pode ser constante no `.conf`.

> **O que não se faz.** Inventar o fator de conversão séries→tempos, ou assumir que «a faixa de 60
> min» vale para uma aula de 75. As duas coisas produziriam um número plausível e falso — e a Regra
> 9 passaria a aprovar o que devia recusar.

---

## 3. O modelo-alvo

### 3.1 Uma fonte por dado

| Dado | Fonte única | Quem materializa no repositório |
|:--|:--|:--|
| Duração, frequência, dias, início, total de aulas, objetivo geral | **plano elicitado** (o envelope) | o Worker, no ato do plano |
| Hora de início de cada dia | **cadastro da turma** (`horarios`) | o Worker, no ato do plano |
| Volume por bloco (minutos) | **plano elicitado** | o Worker |
| Nome da turma, escola | **cadastro da turma** | o Worker |
| `VARIANTE`, `CICLO`, `ESCOLA_HABILITADA` | **identidade** — não se deriva | `criar-escola.sh` |
| `DOCS` | **o disco** (as fontes que existem) | o Worker, e o gerador confere |
| Faixa de volume por duração (Regra 9) | **decisão de escola, declarada uma vez** | ver D-T3 |

**Por que o Worker materializa.** O gerador corre no GitHub Actions, que **não tem acesso ao KV**.
Tudo o que vem do cadastro (horas, nome da turma) tem de existir em arquivo antes do workflow.
O Worker é o único que vê os dois lados — o KV e o repositório.

### 3.2 O `.conf` derivado — forma proposta

```conf
# ============================================================================
# ciclo-01-fita-teste.conf — DERIVADO. Não edite: a próxima elicitação do plano
# reescreve este arquivo. A fonte é o plano (ciclo-01-fita-teste-plano.md) e o
# cadastro da turma (Produção → Turmas). Identidade fica em ciclo-01.conf.
# ============================================================================
VARIANTE="fita-teste"
ESCOLA="Fita"
RESPONSAVEL="Tiago Menegaz"
ESCOLA_HABILITADA="sim"

FREQUENCIA="4x/semana"
DIAS="2@19:00,3@19:00,4@19:00,5@19:00"
DURACAO_POR_DIA="1 h 15 min por encontro"
DURACOES="75"
DATA_INICIO="16/10/2026"
TOTAL_AULAS="9"

NOME="Ciclo 01 — Fita · Teste"
OBJETIVO_GERAL="Objetivo geral do ciclo de teste"

DOCS="plano"
```

O que **sai**: `VOLUME_MIN`, `VOLUME_MAX`, `VOLUME_MIN_120`, `VOLUME_MAX_120` — vão para a decisão
D-T3. O que **fica**: tudo o que o gerador lê hoje, com a diferença de que nove das dezessete
chaves passam a ter uma origem declarada.

---

## 4. As fases

| Fase | Estado (19/10/2026) |
|:--|:--|
| 2 — o `.conf` da turma é derivado | **executada** — `motor/servidor/compor-conf.js`, as duas pontes, e a prova `provar-manifesto-da-turma` (60 asserções) |
| 3 — o calendário sai do plano; Pré-requisito 5 encolhe | pendente — depende de **D-T2** |
| 4 — o Worker serve N pacotes | pendente — decidir **D-T4** |
| 5 — a migração dos ficheiros vivos | pendente — só depois da 4 |

### Fase 2 — O `.conf` da turma é derivado *(destrava a geração)* — EXECUTADA

O que foi feito, e onde:

| Peça | Arquivo | O que faz |
|:--|:--|:--|
| a composição pura | [motor/servidor/compor-conf.js](./motor/servidor/compor-conf.js) | `comporConf({turma, plano, identidade, escola, ciclo, docs})` → `{texto, derivados, conflitos, pendencias}`. Sem I/O. `faltasDaTurma` diz o que falta; `aulasNoPeriodo` conta no calendário; `acharTurma` resolve por nome **ou** id, só entre as vigentes |
| a escrita | [motor/servidor/escrever-plano.js](./motor/servidor/escrever-plano.js) | `atualizarManifesto` ganhou as duas metades: com turma no contexto **compõe e cria** o `.conf` da variante; sem turma, **atualiza** as linhas do `.conf` que existe (o comportamento de 18/10, intacto) |
| a leitura do cadastro | [motor/servidor/cloudflare.js](./motor/servidor/cloudflare.js) e [motor/servidor/node.js](./motor/servidor/node.js) | `lerTurmas(escola)` — a chave é a do `bastidores.js` (`bastidores/<escola>/turmas`), no KV do Worker e no armazenamento local |
| a prova | [experimentos/provar-manifesto-da-turma.js](./experimentos/provar-manifesto-da-turma.js) | 60 asserções, com as turmas reais; inclui o Pré-requisito 5 correndo em `bash` sobre o texto composto |

Três decisões que a execução obrigou, e que o plano não previa:

- **O `DOCS` é preservado.** Re-eliciar o plano depois de o ciclo ter aulas não pode apagar as
  fontes que o gerador já escreveu. O plano entra no começo quando ainda não está.
- **A faixa de volume é conferida ANTES do CI.** O `.conf` derivado de uma turma de 75 min exige
  `VOLUME_MIN_75`/`VOLUME_MAX_75`, e a escola declara hoje só 60 e 120. Em vez de o gerador
  recusar depois de um ciclo de CI, `comporConf` devolve a **pendência** com a chave que falta.
- **O `>60` do gerador lia a régua errada.** `gerar-ciclo.sh` aplicava `VOLUME_MIN_120` a
  *qualquer* duração acima de 60 — uma aula de 75 min era medida com a faixa da de 120. Agora
  cada duração procura o seu par (`VOLUME_MIN_<dur>`), com a recusa nomeando a chave.

### Fase 2 (texto original do plano)

- `motor/servidor/compor-conf.js` — função pura `comporConf({ turma, plano, escola, ciclo })` →
  texto. Sem I/O: é o que a torna provável.
- `escrever-plano.js` passa a gravá-lo **junto** com a fonte do plano, na mesma passagem
  (`atualizarManifesto`, já corrigido nesta sessão, deixa de escrever num `.conf` que não existe e
  passa a **criá-lo** quando ele não existe).
- O disparo passa a mandar a **variante** no seu próprio input: `disparar.js` envia
  `escola: <slug do Worker>` **e** `variante: varianteDoContexto(contexto)`. **Entregue em 19/10/2026** — e, medido no Actions, o
  «uma linha» era optimista: o workflow tem dois consumidores do slug e eles querem coisas
  diferentes. O **gerador** (`gerar-ciclo.sh`, `hash-ciclo.sh`) quer a variante, porque é ela que
  nomeia `ciclo-01-<escola>-<turma>.conf` e o pacote; o **deploy** quer a escola, porque é ela que
  nomeia `wrangler.<escola>.jsonc`. Ficaram dois inputs — `escola` e `variante` (vazio = a escola,
  para as escolas de uma turma só) —, e o `run-name` do workflow é o rótulo que a tela procura
  (`rotuloDaGeracao`). Sem esse acordo, a consulta de estado não acha a execução.
  O par está provado por `provar-geracao-do-ciclo.js`, não por inspeção.
- **Validação:** prova de unidade de `comporConf` com as turmas reais (com e sem `horarios`); prova de
  integração com `fetch` falso (o `.conf` nasce, o `DATA_INICIO` sai da lacuna); e a prova que já
  existe, `provar-manifesto-do-plano`, passa a exigir o **arquivo novo** em vez do existente.
- **Paragem:** uma turma sem `horarios` **não** gera `.conf`. A recusa é da interface, com o motivo
  («declare a hora de início na turma»), e não um palpite do gerador.

### Fase 3 — O calendário sai do plano, e o Pré-requisito 5 encolhe

- `gerar-ciclo.sh` passa a aceitar o contexto do `.conf` derivado **e** a validar contra o plano:
  se o `.conf` e o plano divergirem na duração, no total de aulas ou no início, **recusa** com a
  diferença nomeada. É o que impede a repetição do que aconteceu: quatro valores para o mesmo fato.
- `Pré-requisito 5` deixa de exigir o que a turma fornece (passa a exigir só o que **não** tem
  outra origem): `ESCOLA`, `VARIANTE` e `ESCOLA_HABILITADA`.
- **Motivo declarado** obrigatório em `tools/` (congelado): o Pré-requisito 5 é Regra 18.
- **Validação:** as duas provas do gerador com um `.conf` derivado real; e uma prova nova que
  injeta divergência plano×`.conf` e exige a recusa.
- **Paragem:** se a checagem cruzada exigir mudar o formato do `.conf` além do previsto, parar.

### Fase 4 — O Worker serve N pacotes

Hoje um Worker = um `assets.directory` = um pacote (`wrangler.fita.jsonc`). Com N turmas, há duas
formas — **é decisão D-T4**:

| Opção | Como | Custo |
|:--|:--|:--|
| **(a) Um Worker por escola, N ciclos sob subpasta** | `assets.directory` passa a `professores/<p>/ciclos/`; a raiz da escola ganha um índice que lista os ciclos | o gerador passa a escrever em `<pasta>/<id>/`; a porta precisa de um caminho por ciclo |
| **(b) Um Worker por escola × turma** | `wrangler.fita-teste.jsonc`, `wrangler.fita-teste-2.jsonc` | proliferação de Workers; o domínio muda; `ESCOLA_SLUG` deixa de ser a escola |

**(a) é a recomendada**: preserva um domínio por escola (que é o que a escola contrata) e mantém
`ESCOLA_SLUG` com o sentido atual. A porta passa a receber `?ciclo=<id>` — que já existe como
convenção na barra.

### Fase 5 — A migração dos ficheiros vivos

- `ciclo-01-fita-plano.md` → `ciclo-01-fita-teste-plano.md`? **Não automaticamente**: o plano de
  16/10 é de uma turma que não está declarada no próprio arquivo (`Turmas observadas | Teste`, mas a
  variante é `fita`). Renomear seria **afirmar** que ele é daquela turma.
- O que se faz: o plano antigo fica **onde está**, como o elo que registra o modelo anterior, e a
  migração é **por elicitação** — o professor elicia outra vez, e a variante nasce certa. É a mesma
  regra de P-03/P-04: a proveniência acrescenta, não edita.
- `.fipp`: as fontes antigas saem da cobertura quando o `.conf` da escola deixa de apontar para
  elas. **Reancoragem obrigatória**, com `hash-ciclo.sh --check` antes e depois.
- **Validação:** `check-pacote.js` verde no pacote novo; `hash-ciclo.sh --check` verde.

---

## 5. Validação — o que tem de estar verde para a fase fechar

| Prova | Estado hoje | Depois |
|:--|:--|:--|
| `provar-manifesto-do-plano` | 29/29 (`.conf` existente) | passa a exigir a **criação** do `.conf` |
| `provar-derivacao-da-turma` | 35/35 | inalterada |
| `provar-producao` | 135/135 | + o caminho do `.conf` derivado |
| `check-pacote.js` | **falha** (pacote de 16/10, sem PDF/JSON) | verde no pacote gerado |
| `hash-ciclo.sh --check` | verde | verde **depois** da reancoragem |
| `check-identidade` | 19/19 | 19/19 |

---

## 6. Decisões que bloqueiam

1. **D-T1 — A hora da aula.** ~~Bloqueava.~~ **RESOLVIDA (19/10/2026).** Ela **está** no cadastro
   da turma (`horarios: {dia: "HH:MM"}`) — medido no KV, não suposto: a turma `Teste` tem
   `09:00` em ter/qua/qui e `11:00` em sex. A decisão: a hora é **lida do JSON**, nunca inventada
   nem *defaultada*; a geração de uma turma sem hora é **recusada com o motivo** (opção *b*), e o
   cadastro **não** é travado. `faltasDaTurma` implementa isso, e nomeia os dias que faltam.
2. **D-T2 — A unidade do volume.** O plano fala em séries, a Regra 9 em tempos. Três saídas: (a) o
   plano passa a declarar volume em **tempos** (muda o conteúdo do formulário e o `plano.json`);
   (b) a Regra 9 passa a validar contra a **distribuição em minutos** do plano (muda a norma);
   (c) a escola declara o fator séries→tempos. **Recomendação: (a)** — é a unidade que a aula já
   usa, e não muda a norma. **É o que bloqueia a fase 3**: medido no plano de 18/10, 16 exercícios
   somam **370 tempos** e a faixa da escola valida **80–100** — a faixa é de uma aula de 60 min e
   o plano não declara volume em tempos.
   **A duração — RESOLVIDA (19/10/2026).** O dono do produto decidiu: *é o mesmo fato, e a verdade
   é a da turma*. Os 75 min do cadastro prevalecem sobre os 55 do plano, e **o plano de 18/10 será
   re-elicitado** com 75 (e com as 9 aulas do período, que é o que o calendário da turma produz). O
   conflito não é corrigido em silêncio: `comporConf` o devolve em `conflitos`, com os dois números.
   **A faixa de 75 min — RESOLVIDA (19/10/2026).** Os dois pares que a escola já declara dão
   1,25–1,67 tempos/min (80–100 @60; 150–200 @120). Para 75 min, a leitura proporcional dá
   100–125 e a interpolação entre os dois pares dá 98–125 — o mesmo lugar. Adotado **100–125**, e
   declarado em `ciclo-01-fita.conf` como `VOLUME_MIN_75`/`VOLUME_MAX_75`. O `comporConf` **copia**
   o par resolvido para dentro do manifesto da variante, porque o gerador lê o manifesto BASE mais
   a variante da TURMA — e não o `.conf` da escola: sem a cópia, o número existiria do outro lado do
   repositório e a turma seria recusada por uma chave que a escola declara.
3. **D-T3 — Onde vivem `VOLUME_MIN`/`MAX`.** Hoje são constantes da escola no `.conf`. Se o plano
   declara o volume, elas viram **validação cruzada** e não fonte. Confirmar que a faixa é da escola
   (e continua no `.conf` de identidade) e não da turma.
4. **D-T4 — N pacotes.** Opção (a) ou (b) do §4, fase 4. **Recomendação: (a).**
5. **D-T5 — O `.conf` derivado pode ser editado à mão?** A recomendação é **não**: um cabeçalho diz
   que ele é derivado, e o `check-pacote`/gerador avisa quando diverge do plano. Sem isso, voltamos
   a ter duas fontes — só que uma delas mente sobre a origem.

---

## 7. Riscos

| Risco | Mitigação |
|:--|:--|
| O `.conf` derivado sobrescrever um ajuste manual | ele nasce com cabeçalho «derivado» e o gerador recusa divergência com o plano (fase 3) |
| A migração renomear fontes e **reancorar errado** | a migração é por elicitação; nada se renomeia; `--check` antes e depois |
| A fase 4 quebrar as URLs publicadas | a opção (a) preserva o domínio; o caminho do ciclo entra como prefixo e a raiz da escola ganha índice |
| Duas fontes outra vez | o `.conf` derivado **não** se edita; a identidade fica no `.conf` da escola |
| Turma sem hora travar a escola inteira | a recusa é por turma (D-T1 b), não por escola |
| O volume virar conversão inventada | D-T2 decide antes de qualquer código |

---

## 8. Fora de escopo

- O `VOLUME_*_120` (dia longo) — continua como está até D-T2.
- A harmonização e as `aula-NN`: continuam a ser derivadas pelo `escreverCiclo`, no caminho do PO.
- A indexação das turmas: é do [PLANO-INDICES.md](./PLANO-INDICES.md).
- A Tabela de atividades: depende da fase 4 (o Worker a servir N pacotes).
